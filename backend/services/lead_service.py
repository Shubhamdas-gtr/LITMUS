"""Lead and draft generation for LITMUS.

The lead agent turns grounded GitHub change events into conservative, reviewable
opportunities. The draft agent turns a generated lead into a manual LinkedIn
post draft without any publishing integration.

Phase D3 adds GitHub-independent sources (resume projects, roadmap milestones,
manual entries) so users without a connected GitHub account still get
reviewable leads. These reuse the same draft agent and persistence shape with
detected_event_id/github_profile_id left null.
"""

from __future__ import annotations

import hashlib
import json
from typing import Any

from services.ai_service import ask_ai

LEAD_PROMPT_VERSION = "d2-v2"
DRAFT_PROMPT_VERSION = "d2-v2"
NONGITHUB_PROMPT_VERSION = "d3-v1"
MIN_LEAD_CONFIDENCE = 0.45
FALLBACK_LEAD_CONFIDENCE = 0.45
MIN_RESUME_LEAD_CONFIDENCE = 0.50
MILESTONE_LEAD_CONFIDENCE = 0.55


def _strip_json_fences(raw: str) -> str:
    cleaned = raw.strip()
    if cleaned.startswith("```"):
        cleaned = cleaned.removeprefix("```json")
        cleaned = cleaned.removeprefix("```")
        cleaned = cleaned.removesuffix("```")
        cleaned = cleaned.strip()
    return cleaned


def _parse_json_object(raw: str, error_message: str) -> dict[str, Any]:
    cleaned = _strip_json_fences(raw)
    parsed = json.loads(cleaned)
    if not isinstance(parsed, dict):
        raise RuntimeError(error_message)
    return parsed


def _string_list(values: Any) -> list[str]:
    if not isinstance(values, list):
        return []
    result: list[str] = []
    for value in values:
        if isinstance(value, str) and value.strip():
            result.append(value.strip())
    return result


def _as_bool(value: Any) -> bool:
    if isinstance(value, bool):
        return value
    if isinstance(value, str):
        return value.strip().lower() in {"true", "1", "yes"}
    return False


async def _ask_ai_with_retry(system_prompt: str, user_prompt: str) -> str:
    """Call the AI once, retrying a single time on transport/parse failure."""
    try:
        return await ask_ai(system_prompt=system_prompt, user_prompt=user_prompt)
    except Exception:
        return await ask_ai(system_prompt=system_prompt, user_prompt=user_prompt)


def _repo_grounded_skills(
    repository: dict[str, Any],
    allowed_skill_set: set[str],
) -> list[str]:
    grounded: list[str] = []
    for lang in (repository.get("languages") or []) if isinstance(
        repository.get("languages"), list
    ) else []:
        if isinstance(lang, str) and lang.strip() and lang.strip() in allowed_skill_set:
            grounded.append(lang.strip())
    for topic in repository.get("topics") or []:
        if isinstance(topic, str) and topic.strip() and topic.strip() in allowed_skill_set:
            grounded.append(topic.strip())
    seen: set[str] = set()
    ordered: list[str] = []
    for skill in grounded:
        if skill not in seen:
            seen.add(skill)
            ordered.append(skill)
    return ordered[:5]


def fallback_lead_candidate(context: dict[str, Any]) -> dict[str, Any] | None:
    """Deterministic conservative lead so a push always yields a reviewable card."""
    event = context.get("detected_event") or {}
    repo = context.get("repository") or {}
    repo_name = str(repo.get("full_name") or repo.get("name") or "").strip()
    if not repo_name:
        return None
    allowed_skill_set: set[str] = set()
    for skill in context.get("allowed_skills", []) or []:
        if isinstance(skill, str) and skill.strip():
            allowed_skill_set.add(skill.strip())
    latest_commit = event.get("latest_commit") or {}
    commit_message = (
        str(latest_commit.get("message") or "").strip().splitlines()[0:1]
    )
    commit_first_line = commit_message[0][:140] if commit_message else ""
    description = str(repo.get("description") or "").strip()
    if commit_first_line:
        angle = f"Recent push to {repo_name}: {commit_first_line}."
    elif description:
        angle = f"Recent push to {repo_name}: {description[:140]}."
    else:
        angle = f"Recent push to {repo_name} is ready to review."
    return {
        "title": f"{repo_name} update",
        "angle": angle,
        "relevant_skills": _repo_grounded_skills(repo, allowed_skill_set),
        "confidence": FALLBACK_LEAD_CONFIDENCE,
    }


def fallback_linkedin_draft(
    context: dict[str, Any],
    lead: dict[str, Any],
) -> dict[str, Any]:
    """Template draft used only when the Draft Agent fails to return a body."""
    repo = context.get("repository") or {}
    repo_url = str(repo.get("html_url") or "").strip()
    body_lines = [
        str(lead.get("title") or "Recent work update").strip(),
        "",
        str(lead.get("angle") or "").strip(),
        "",
        "Posting this as a manual note to track the work and invite feedback.",
    ]
    body = "\n".join(line for line in body_lines if line is not None).strip()
    citations: list[dict[str, str]] = []
    allowed_urls = sorted(_allowed_citation_urls(context))
    if repo_url and repo_url in allowed_urls:
        citations.append({"label": repo.get("name") or "Repository", "url": repo_url})
    elif allowed_urls:
        citations.append({"label": "GitHub profile", "url": allowed_urls[0]})
    return {
        "subject": str(lead.get("title") or "").strip() or None,
        "body": body,
        "citations": citations,
    }


def _allowed_citation_urls(context: dict[str, Any]) -> set[str]:
    urls: set[str] = set()
    event = context.get("detected_event") or {}
    repo = context.get("repository") or {}

    for candidate in [
        event.get("url"),
        repo.get("html_url"),
        repo.get("url"),
        context.get("github_profile_url"),
    ]:
        if isinstance(candidate, str) and candidate.startswith("https://github.com/"):
            urls.add(candidate)
    return urls


async def generate_lead_candidate(context: dict[str, Any]) -> dict[str, Any] | None:
    """Return a conservative lead candidate or None if the event is not useful."""
    allowed_skill_set: set[str] = set()
    for skill in context.get("allowed_skills", []) or []:
        if isinstance(skill, str) and skill.strip():
            allowed_skill_set.add(skill.strip())
    allowed_skills = sorted(allowed_skill_set)

    system_prompt = """
You are the Lead Agent for LITMUS.

Your job is to decide whether a GitHub repo_pushed event is meaningful enough
to become a user-reviewable lead.

Return ONLY valid JSON with this exact shape:

{
  "generate": true,
  "title": "",
  "angle": "",
  "relevant_skills": [],
  "confidence": 0.0
}

Rules:
- Use only the provided data.
- Do not invent facts, impact, metrics, customers, or commit details.
- Only use the repo_pushed event and repository/profile context you are given.
- Prefer generate=true when the push has any concrete signal (a commit
  message, description, languages, or topics). Routine pushes (docs-only,
  config tweaks) should still generate with a modest confidence around
  0.45-0.55 and an honest angle rather than being dropped.
- Set "generate" to false only when there is genuinely nothing to say
  (no repo name and no commit, description, language, or topic signal).
- relevant_skills must only include skills present in the provided allowed
  skills list or directly grounded repository languages.
- confidence must be a number between 0 and 1.
- Keep the title concise and review-friendly.
- Keep the angle short, concrete, and grounded. When a latest_commit message
  is provided, ground the angle in it without quoting more than one line.
- Do not mention LinkedIn publishing, automation, or credentials.
- Do not mention any unavailable event types.
""".strip()

    user_prompt = json.dumps(
        {
            "prompt_version": LEAD_PROMPT_VERSION,
            "target_role": context.get("target_role"),
            "profile_context": context.get("profile_context") or {},
            "detected_event": context.get("detected_event") or {},
            "repository": context.get("repository") or {},
            "skill_gap": context.get("skill_gap") or {},
            "roadmap": context.get("roadmap") or {},
            "allowed_skills": allowed_skills,
        },
        indent=2,
        ensure_ascii=True,
    )

    result = await _ask_ai_with_retry(system_prompt=system_prompt, user_prompt=user_prompt)
    parsed = _parse_json_object(result, "Lead Agent returned invalid JSON.")

    if not _as_bool(parsed.get("generate")):
        return None

    title = str(parsed.get("title") or "").strip()
    angle = str(parsed.get("angle") or "").strip()
    relevant_skills = _string_list(parsed.get("relevant_skills"))

    try:
        confidence = float(parsed.get("confidence") or 0.0)
    except (TypeError, ValueError):
        confidence = 0.0

    if not title or not angle or confidence < MIN_LEAD_CONFIDENCE:
        return None

    return {
        "title": title,
        "angle": angle,
        "relevant_skills": relevant_skills,
        "confidence": confidence,
    }


async def generate_linkedin_draft(
    context: dict[str, Any],
    lead: dict[str, Any],
) -> dict[str, Any] | None:
    """Return a grounded manual LinkedIn post draft for the generated lead."""
    allowed_urls = sorted(_allowed_citation_urls(context))

    system_prompt = """
You are the Draft Agent for LITMUS.

Write a professional LinkedIn post draft for a user to manually copy and post.
Return ONLY valid JSON with this exact shape:

{
  "subject": "",
  "body": "",
  "citations": [
    {
      "label": "",
      "url": ""
    }
  ]
}

Rules:
- Use only the provided profile, repository, event, and lead context.
- Do not invent commits, releases, milestones, metrics, or impact.
- Do not mention LinkedIn automation or publishing.
- Keep the body concise, professional, and grounded.
- If you cite anything, use only the allowed URLs provided in the context.
- Subject is optional but should be a short one-line hook if provided.
""".strip()

    user_prompt = json.dumps(
        {
            "prompt_version": DRAFT_PROMPT_VERSION,
            "target_role": context.get("target_role"),
            "profile_context": context.get("profile_context") or {},
            "detected_event": context.get("detected_event") or {},
            "repository": context.get("repository") or {},
            "skill_gap": context.get("skill_gap") or {},
            "roadmap": context.get("roadmap") or {},
            "lead": lead,
            "allowed_citation_urls": allowed_urls,
        },
        indent=2,
        ensure_ascii=True,
    )

    result = await _ask_ai_with_retry(system_prompt=system_prompt, user_prompt=user_prompt)
    parsed = _parse_json_object(result, "Draft Agent returned invalid JSON.")

    body = str(parsed.get("body") or "").strip()
    if not body:
        return None

    subject = str(parsed.get("subject") or "").strip() or None
    citations_input = parsed.get("citations") or []
    citations: list[dict[str, str]] = []

    for citation in citations_input if isinstance(citations_input, list) else []:
        if not isinstance(citation, dict):
            continue
        label = str(citation.get("label") or "").strip()
        url = str(citation.get("url") or "").strip()
        if not label or not url or url not in allowed_urls:
            continue
        citations.append({"label": label, "url": url})

    return {
        "subject": subject,
        "body": body,
        "citations": citations,
    }


# ---------------------------------------------------------------------------
# Phase D3 — GitHub-independent lead sources.
#
# Each generator returns lead dicts shaped like the GitHub path plus:
#   source: "resume" | "milestone" | "manual"
#   dedup_key: namespaced ("resume:{hash}" / "milestone:{skill}" / ...)
# Callers persist with detected_event_id=None and github_profile_id=None.
# ---------------------------------------------------------------------------


def _slug_hash(text: str) -> str:
    return hashlib.sha1(text.strip().lower().encode("utf-8")).hexdigest()[:12]


def _ground_skills(candidates: Any, allowed_skill_set: set[str]) -> list[str]:
    grounded: list[str] = []
    if isinstance(candidates, list):
        for value in candidates:
            if isinstance(value, str) and value.strip() and value.strip() in allowed_skill_set:
                grounded.append(value.strip())
    seen: set[str] = set()
    ordered: list[str] = []
    for skill in grounded:
        if skill not in seen:
            seen.add(skill)
            ordered.append(skill)
    return ordered[:5]


async def generate_resume_project_leads(
    context: dict[str, Any],
) -> list[dict[str, Any]]:
    """Turn resume projects/experience into reviewable post drafts (max 3)."""
    resume = context.get("resume_analysis") or {}
    projects = resume.get("projects") or []
    experience = resume.get("experience") or []
    items: list[dict[str, Any]] = []
    for entry in (projects if isinstance(projects, list) else []):
        name = entry.get("name") if isinstance(entry, dict) else None
        description = entry.get("description") if isinstance(entry, dict) else None
        if name or description:
            items.append({"kind": "project", "name": str(name or "").strip(), "description": str(description or "").strip()})
    for entry in (experience if isinstance(experience, list) else []):
        title = entry.get("title") if isinstance(entry, dict) else None
        company = entry.get("company") if isinstance(entry, dict) else None
        description = entry.get("description") if isinstance(entry, dict) else None
        label = " ".join(part for part in (title, f"at {company}" if company else None) if part).strip()
        if label or description:
            items.append({"kind": "experience", "name": label, "description": str(description or "").strip()})
    if not items:
        return []

    allowed_skill_set: set[str] = set()
    for skill in context.get("allowed_skills", []) or []:
        if isinstance(skill, str) and skill.strip():
            allowed_skill_set.add(skill.strip())

    system_prompt = """
You are the Resume Lead Agent for LITMUS.

Pick up to 3 resume items most worth turning into a professional LinkedIn post
draft for the user to manually review and post themselves.
Return ONLY valid JSON with this exact shape:

{
  "leads": [
    {"key": "", "title": "", "angle": "", "relevant_skills": [], "confidence": 0.0}
  ]
}

Rules:
- Use only the provided resume items and profile context.
- Do not invent facts, metrics, employers, or outcomes.
- "key" must be the item name/label restated briefly (used for dedup).
- relevant_skills must only include skills from the allowed skills list.
- confidence must be a number between 0 and 1.
- Keep titles concise and angles short, concrete, grounded.
- If nothing is post-worthy, return {"leads": []}.
- Do not mention LinkedIn automation or publishing.
""".strip()

    user_prompt = json.dumps(
        {
            "prompt_version": NONGITHUB_PROMPT_VERSION,
            "target_role": context.get("target_role"),
            "profile_context": context.get("profile_context") or {},
            "resume_items": items[:12],
            "allowed_skills": sorted(allowed_skill_set),
        },
        indent=2,
        ensure_ascii=True,
    )

    try:
        result = await _ask_ai_with_retry(system_prompt=system_prompt, user_prompt=user_prompt)
        parsed = _parse_json_object(result, "Resume Lead Agent returned invalid JSON.")
        raw_leads = parsed.get("leads") if isinstance(parsed.get("leads"), list) else []
    except Exception:
        raw_leads = []

    leads: list[dict[str, Any]] = []
    for raw in raw_leads:
        if not isinstance(raw, dict):
            continue
        title = str(raw.get("title") or "").strip()
        angle = str(raw.get("angle") or "").strip()
        key = str(raw.get("key") or title).strip()
        try:
            confidence = float(raw.get("confidence") or 0.0)
        except (TypeError, ValueError):
            confidence = 0.0
        if not title or not angle or not key or confidence < MIN_RESUME_LEAD_CONFIDENCE:
            continue
        leads.append(
            {
                "source": "resume",
                "dedup_key": f"resume:{_slug_hash(key)}",
                "title": title,
                "angle": angle,
                "relevant_skills": _ground_skills(raw.get("relevant_skills"), allowed_skill_set),
                "confidence": confidence,
            }
        )
        if len(leads) >= 3:
            break

    if leads:
        return leads

    # Deterministic fallback: first three items, honestly framed.
    for item in items[:3]:
        label = item["name"] or item["description"][:60]
        if not label:
            continue
        description = item["description"]
        leads.append(
            {
                "source": "resume",
                "dedup_key": f"resume:{_slug_hash(label)}",
                "title": f"From my work: {label[:80]}",
                "angle": (
                    f"Turn this resume {item['kind']} into a post: {description[:160]}."
                    if description
                    else f"Turn this resume {item['kind']} ({label[:80]}) into a post."
                ),
                "relevant_skills": [],
                "confidence": MIN_RESUME_LEAD_CONFIDENCE,
            }
        )
    return leads


def build_milestone_lead(
    skill: str,
    roadmap_item: dict[str, Any] | None,
    profile_context: dict[str, Any],
    allowed_skill_set: set[str],
) -> dict[str, Any] | None:
    """Deterministic announcement-style lead for a completed roadmap skill."""
    skill = (skill or "").strip()
    if not skill:
        return None
    project = ""
    if isinstance(roadmap_item, dict):
        project = str(roadmap_item.get("project") or "").strip()
    angle = (
        f"You completed {skill} — announce it with the project as proof"
        + (f": {project[:140]}." if project else ".")
    )
    skills = [skill] if skill in allowed_skill_set else []
    return {
        "source": "milestone",
        "dedup_key": f"milestone:{_slug_hash(skill)}",
        "title": f"{skill} complete — share the proof",
        "angle": angle,
        "relevant_skills": skills,
        "confidence": MILESTONE_LEAD_CONFIDENCE,
    }


async def generate_manual_lead(
    text: str,
    context: dict[str, Any],
) -> dict[str, Any] | None:
    """Turn a user-typed work note into a reviewable lead."""
    text = (text or "").strip()
    if len(text) < 10 or len(text) > 2000:
        return None

    allowed_skill_set: set[str] = set()
    for skill in context.get("allowed_skills", []) or []:
        if isinstance(skill, str) and skill.strip():
            allowed_skill_set.add(skill.strip())

    system_prompt = """
You are the Manual Lead Agent for LITMUS.

Turn the user's work note into one conservative, reviewable LinkedIn post lead.
Return ONLY valid JSON with this exact shape:

{"title": "", "angle": "", "relevant_skills": [], "confidence": 0.0}

Rules:
- Use only the provided note and profile context.
- Do not invent facts, metrics, employers, or outcomes beyond the note.
- relevant_skills must only include skills from the allowed skills list.
- confidence must be a number between 0 and 1.
- Keep the title concise and the angle short, concrete, grounded.
- Do not mention LinkedIn automation or publishing.
""".strip()

    user_prompt = json.dumps(
        {
            "prompt_version": NONGITHUB_PROMPT_VERSION,
            "target_role": context.get("target_role"),
            "profile_context": context.get("profile_context") or {},
            "note": text[:2000],
            "allowed_skills": sorted(allowed_skill_set),
        },
        indent=2,
        ensure_ascii=True,
    )

    try:
        result = await _ask_ai_with_retry(system_prompt=system_prompt, user_prompt=user_prompt)
        parsed = _parse_json_object(result, "Manual Lead Agent returned invalid JSON.")
        title = str(parsed.get("title") or "").strip()
        angle = str(parsed.get("angle") or "").strip()
        try:
            confidence = float(parsed.get("confidence") or 0.0)
        except (TypeError, ValueError):
            confidence = 0.0
        if title and angle and confidence >= MIN_LEAD_CONFIDENCE:
            return {
                "source": "manual",
                "dedup_key": f"manual:{_slug_hash(text)}",
                "title": title,
                "angle": angle,
                "relevant_skills": _ground_skills(parsed.get("relevant_skills"), allowed_skill_set),
                "confidence": confidence,
            }
    except Exception:
        pass

    first_line = text.splitlines()[0][:140] if text.splitlines() else text[:140]
    return {
        "source": "manual",
        "dedup_key": f"manual:{_slug_hash(text)}",
        "title": "Work note worth sharing",
        "angle": f"Turn this note into a post: {first_line}.",
        "relevant_skills": [],
        "confidence": FALLBACK_LEAD_CONFIDENCE,
    }
