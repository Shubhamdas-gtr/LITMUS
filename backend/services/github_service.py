"""GitHub Intelligence client for LITMUS.

Handles authenticated calls to the GitHub REST API on behalf of a LITMUS user
using the ephemeral OAuth provider token obtained from Supabase Auth.

SECURITY:
- The provider token is accepted per-request and is NEVER persisted.
- The token is NEVER returned, logged, or sent to the AI service.
- Only normalized evidence is returned to callers.
"""

from datetime import datetime, timedelta, timezone

import httpx

GITHUB_API_URL = "https://api.github.com"


def _parse_github_timestamp(value: str | None) -> datetime | None:
    if not value:
        return None
    try:
        return datetime.fromisoformat(str(value).replace("Z", "+00:00"))
    except ValueError:
        return None


def detect_repo_pushed(
    github_profile_id: str,
    enriched_repos: list[dict],
    previous_repo_freshness: dict[str, str] | None,
) -> list[dict]:
    """Detect repo_pushed events from pre-upsert repository freshness data."""
    events: list[dict] = []
    if not github_profile_id:
        return events

    previous_repo_freshness = previous_repo_freshness or {}

    for repo in enriched_repos:
        github_repo_id = repo.get("github_repo_id")
        repo_updated_at = repo.get("repo_updated_at")

        if github_repo_id is None or not repo_updated_at:
            continue

        previous_updated_at = previous_repo_freshness.get(str(github_repo_id))
        if not previous_updated_at:
            continue

        current_dt = _parse_github_timestamp(str(repo_updated_at))
        previous_dt = _parse_github_timestamp(str(previous_updated_at))
        if not current_dt or not previous_dt or current_dt <= previous_dt:
            continue

        event_identity = f"repo_pushed:{github_repo_id}:{repo_updated_at}"
        payload = {"repo_name": repo.get("name")}
        if repo.get("html_url"):
            payload["url"] = repo.get("html_url")
        title = repo.get("full_name") or repo.get("name")
        if title:
            payload["title"] = title

        events.append(
            {
                "github_repo_id": github_repo_id,
                "event_type": "repo_pushed",
                "event_id": event_identity,
                "event_timestamp": repo_updated_at,
                "dedup_key": f"{github_profile_id}:{event_identity}",
                "payload": payload,
            }
        )

    return events


class GitHubAPIError(Exception):
    """Raised when a GitHub API request fails in a non-data-fetching way.

    Attributes mirror the underlying status code so endpoints can map to
    meaningful HTTP responses (401, 403, 429, 5xx).
    """

    def __init__(self, message: str, status_code: int | None = None):
        super().__init__(message)
        self.status_code = status_code


def _auth_headers(provider_token: str) -> dict[str, str]:
    return {
        "Authorization": f"Bearer {provider_token}",
        "Accept": "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
    }


def _handle_error(response: httpx.Response) -> None:
    if response.status_code == 401:
        raise GitHubAPIError("GitHub authorization invalid or revoked", 401)
    if response.status_code == 403:
        raise GitHubAPIError("Insufficient GitHub permissions", 403)
    if response.status_code == 429:
        raise GitHubAPIError("GitHub API rate limit exceeded", 429)
    if response.status_code >= 500:
        raise GitHubAPIError("GitHub is temporarily unavailable", response.status_code)


def _get_json(
    client: httpx.Client,
    url: str,
    headers: dict[str, str],
    params: dict | None = None,
):
    try:
        response = client.get(url, headers=headers, params=params)
    except httpx.HTTPError:
        raise GitHubAPIError("GitHub is temporarily unavailable", 503)

    if response.status_code == 404:
        return None
    if response.status_code == 200:
        return response.json()

    _handle_error(response)
    return None


def _paginate(
    client: httpx.Client,
    url: str,
    headers: dict[str, str],
    params: dict | None = None,
) -> list[dict]:
    """Follow GitHub Link-based pagination until exhausted or a safe cap."""
    items: list[dict] = []
    current_url: str | None = url
    page_limit = 10

    while current_url and page_limit > 0:
        try:
            response = client.get(current_url, headers=headers, params=params)
        except httpx.HTTPError:
            raise GitHubAPIError("GitHub is temporarily unavailable", 503)

        if response.status_code == 200:
            body = response.json()
            if isinstance(body, list):
                items.extend(body)
        else:
            _handle_error(response)
            break

        # GitHub paginates via the rel=next Link header.
        next_url = None
        link_header = response.headers.get("link", "")
        for part in link_header.split(","):
            if 'rel="next"' in part:
                m = part.find("<")
                e = part.find(">")
                if m != -1 and e != -1 and e > m:
                    next_url = part[m + 1 : e]
                break
        current_url = next_url
        page_limit -= 1

    return items


def _search_count(
    client: httpx.Client,
    headers: dict[str, str],
    query: str,
) -> int:
    result = _get_json(
        client,
        f"{GITHUB_API_URL}/search/issues",
        headers,
        params={"q": query, "per_page": 1},
    )
    if isinstance(result, dict):
        return int(result.get("total_count") or 0)
    return 0


def _commit_matches_authenticated_user(
    commit: dict,
    username: str,
    display_name: str | None,
    email: str | None,
) -> bool:
    author = commit.get("author") or {}
    committer = commit.get("committer") or {}
    commit_meta = commit.get("commit") or {}
    commit_author = commit_meta.get("author") or {}
    commit_committer = commit_meta.get("committer") or {}

    if author.get("login") == username or committer.get("login") == username:
        return True

    normalized_display_name = (display_name or "").strip().lower()
    if normalized_display_name:
        author_name = str(commit_author.get("name") or "").strip().lower()
        committer_name = str(commit_committer.get("name") or "").strip().lower()
        if author_name == normalized_display_name or committer_name == normalized_display_name:
            return True

    normalized_email = (email or "").strip().lower()
    if normalized_email:
        author_email = str(commit_author.get("email") or "").strip().lower()
        committer_email = str(commit_committer.get("email") or "").strip().lower()
        if author_email == normalized_email or committer_email == normalized_email:
            return True

    return False


def collect_github_evidence(provider_token: str) -> dict:
    """Fetch and normalize a user's public GitHub evidence in a single pass.

    Returns a dictionary with:
      - ``user``: the authenticated GitHub user record
      - ``repos``: list of enriched repo dicts (include ``languages`` as a dict)
      - ``activity``: recent PR/issue/commit activity over a 30-day window
      - ``evidence``: the normalized evidence structure ready for the AI and UI
    The provider token is used here and never returned or stored.
    """
    headers = _auth_headers(provider_token)

    with httpx.Client(timeout=30.0) as client:
        user_result = _get_json(client, f"{GITHUB_API_URL}/user", headers)
        user = user_result if isinstance(user_result, dict) else {}

        username = user.get("login") or ""
        if not username:
            return {
                "user": user,
                "repos": [],
                "activity": _empty_activity(),
                "evidence": None,
            }

        raw_repos = _paginate(
            client,
            f"{GITHUB_API_URL}/user/repos",
            headers,
            params={
                "type": "public",
                "sort": "pushed",
                "per_page": 100,
            },
        )
        public_repos = [r for r in raw_repos if not r.get("private")]

        enriched_repos = []
        normalized_repos = []
        language_distribution: dict[str, int] = {}

        for repo in public_repos:
            name = repo.get("name") or ""
            if not name:
                continue

            languages_result = _get_json(
                client,
                f"{GITHUB_API_URL}/repos/{username}/{name}/languages",
                headers,
            )
            languages = (
                languages_result if isinstance(languages_result, dict) else {}
            )

            enriched_repos.append(
                {
                    "github_repo_id": repo.get("id"),
                    "name": name,
                    "full_name": repo.get("full_name"),
                    "html_url": repo.get("html_url"),
                    "description": repo.get("description") or None,
                    "languages": languages,
                    "topics": repo.get("topics") or [],
                    "stars": int(repo.get("stargazers_count") or 0),
                    "forks": int(repo.get("forks_count") or 0),
                    "is_fork": bool(repo.get("fork") or False),
                    "is_private": bool(repo.get("private") or False),
                    "repo_created_at": repo.get("created_at"),
                    "repo_updated_at": repo.get("pushed_at") or repo.get("updated_at"),
                }
            )

            for lang, size in languages.items():
                language_distribution[lang] = (
                    language_distribution.get(lang, 0) + int(size or 0)
                )

            normalized_repos.append(
                {
                    "name": name,
                    "description": repo.get("description") or None,
                    "languages": sorted(languages.keys()),
                    "topics": repo.get("topics") or [],
                    "stars": int(repo.get("stargazers_count") or 0),
                    "forks": int(repo.get("forks_count") or 0),
                    "created_at": repo.get("created_at"),
                    "updated_at": repo.get("pushed_at") or repo.get("updated_at"),
                    "is_fork": bool(repo.get("fork") or False),
                }
            )

            for lang, size in languages.items():
                language_distribution[lang] = (
                    language_distribution.get(lang, 0) + int(size or 0)
                )

        since = (datetime.now(timezone.utc) - timedelta(days=30)).strftime(
            "%Y-%m-%dT%H:%M:%SZ"
        )

        try:
            prs = _search_count(
                client, headers, f"author:{username} is:pr created:>={since}"
            )
        except GitHubAPIError:
            prs = 0

        try:
            issues = _search_count(
                client, headers, f"author:{username} is:issue created:>={since}"
            )
        except GitHubAPIError:
            issues = 0

        commits_30d = 0
        commits_cutoff = datetime.now(timezone.utc) - timedelta(days=30)
        display_name = user.get("name")
        email = user.get("email")
        for repo in public_repos:
            pushed_at = repo.get("pushed_at")
            if not pushed_at:
                continue
            try:
                pushed_dt = datetime.fromisoformat(
                    str(pushed_at).replace("Z", "+00:00")
                )
            except ValueError:
                continue
            if pushed_dt < commits_cutoff:
                continue
            commit_result = _paginate(
                client,
                f"{GITHUB_API_URL}/repos/{username}/{repo.get('name')}/commits",
                headers,
                params={"since": since, "per_page": 100},
            )
            if isinstance(commit_result, list):
                commits_30d += sum(
                    1
                    for commit in commit_result
                    if _commit_matches_authenticated_user(
                        commit,
                        username,
                        display_name,
                        email,
                    )
                )

        activity = {
            "commits_30d": commits_30d,
            "prs_30d": prs,
            "issues_30d": issues,
            "active_days_30d": 0,
        }

        evidence = {
            "username": username,
            "profile_bio": user.get("bio") or None,
            "repos": normalized_repos,
            "recent_activity": activity,
            "language_distribution": language_distribution,
        }

        return {
            "user": user,
            "repos": enriched_repos,
            "activity": activity,
            "evidence": evidence,
        }


def _empty_activity() -> dict:
    return {
        "commits_30d": 0,
        "prs_30d": 0,
        "issues_30d": 0,
        "active_days_30d": 0,
    }
