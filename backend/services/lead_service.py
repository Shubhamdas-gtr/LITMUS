"""Lead and draft generation for LITMUS.

The lead agent turns grounded GitHub change events into conservative, reviewable
opportunities. The draft agent turns a generated lead into a manual LinkedIn
post draft without any publishing integration.
"""

from __future__ import annotations

import json
from typing import Any

from services.ai_service import ask_ai

LEAD_PROMPT_VERSION = "d2-v1"
DRAFT_PROMPT_VERSION = "d2-v1"
MIN_LEAD_CONFIDENCE = 0.65


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
- If the signal is too weak or generic, set "generate" to false and keep the
  other fields empty.
- relevant_skills must only include skills present in the provided allowed
  skills list or directly grounded repository languages.
- confidence must be a number between 0 and 1.
- Keep the title concise and review-friendly.
- Keep the angle short, concrete, and grounded.
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

    result = await ask_ai(system_prompt=system_prompt, user_prompt=user_prompt)
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

    result = await ask_ai(system_prompt=system_prompt, user_prompt=user_prompt)
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
