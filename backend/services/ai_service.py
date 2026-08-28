import os
import httpx

OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions"


async def ask_ai(
    system_prompt: str,
    user_prompt: str,
) -> str:
    api_key = os.getenv("OPENROUTER_API_KEY")

    if not api_key:
        raise RuntimeError("OPENROUTER_API_KEY is not configured.")

    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
    }

    payload = {
        "model": "openrouter/free",
        "messages": [
            {
                "role": "system",
                "content": system_prompt,
            },
            {
                "role": "user",
                "content": user_prompt,
            },
        ],
    }

    async with httpx.AsyncClient(timeout=60.0) as client:
        response = await client.post(
            OPENROUTER_API_URL,
            headers=headers,
            json=payload,
        )

    response.raise_for_status()

    data = response.json()

    return data["choices"][0]["message"]["content"]

import json


async def analyze_resume(resume_text: str) -> dict:
    system_prompt = """
You are the Resume Agent for LITMUS, an AI-powered career intelligence platform.

Analyze the provided resume and return ONLY valid JSON.

Do not invent information.
Only include information that is explicitly supported by the resume.
If a category has no evidence, return an empty array or empty string.

Use this exact JSON structure:

{
  "summary": "",
  "skills": [],
  "experience": [],
  "projects": [],
  "education": [],
  "certifications": []
}

Rules:
- summary: concise factual summary of the candidate.
- skills: list of skills explicitly demonstrated or listed.
- experience: list of objects with "title", "company", "duration", and "description".
- projects: list of objects with "name" and "description".
- education: list of objects with "degree", "institution", and "duration".
- certifications: list of certification names.
- Do not infer skills that are not supported by the resume.
- Do not invent dates, companies, projects, qualifications, or achievements.
"""

    user_prompt = f"""
Analyze this resume:

--- RESUME START ---
{resume_text}
--- RESUME END ---
"""

    result = await ask_ai(
        system_prompt=system_prompt,
        user_prompt=user_prompt,
    )

    try:
        cleaned = result.strip()

        if cleaned.startswith("```"):
            cleaned = cleaned.removeprefix("```json")
            cleaned = cleaned.removeprefix("```")
            cleaned = cleaned.removesuffix("```")
            cleaned = cleaned.strip()

        return json.loads(cleaned)
    except json.JSONDecodeError as exc:
        raise RuntimeError(
            "Resume Agent returned invalid JSON."
        ) from exc


async def analyze_skill_gap(
    target_role: str,
    resume_analysis: dict,
    assessment_skills: list[dict],
    ) -> dict:
        system_prompt = """
    You are the Skill Gap Agent for LITMUS, an AI-powered career intelligence platform.

    Your job is to analyze a candidate's current skills against their target role.

    Return ONLY valid JSON.

    Use exactly this structure:

    {
    "role": "",
    "required_skills": [],
    "strengths": [],
    "weak_skills": [],
    "missing_skills": []
    }

    Rules:

    1. Identify the most relevant skills for the target role.
    2. Classify required skills as:
    - "core": essential for the role
    - "common": commonly expected
    - "optional": useful but not essential
    3. Compare the required skills against BOTH:
    - skills demonstrated in the resume
    - skills reported in the assessment
    4. Do not assume that a skill is missing merely because it is absent from the resume.
    5. If the assessment indicates a skill but the resume does not demonstrate it, treat it as a weak or unverified skill rather than automatically missing.
    6. Prioritize genuine skill gaps.
    7. Do not invent candidate experience.
    8. Keep skill names normalized and concise.
    9. Return only information supported by the provided candidate data and reasonable requirements for the target role.
    10. Only treat a skill as supported when the resume or assessment provides direct evidence for that specific skill.
    11. Do not infer a skill solely because the candidate has a related technology.
    12. For example, Tailwind CSS does not automatically prove explicit CSS experience unless CSS is separately supported.
    13. Use concise canonical skill names only.
    14. Do not include framework examples, alternatives, or parenthetical qualifiers in skill names.
    15. For example, use "Testing" rather than "Testing (Jest/Mocha)".
    16. missing_skills must be a subset of required_skills.
    17. Do not classify a skill as missing unless it appears in required_skills.
    18. Do not include optional ecosystem technologies merely because they are absent
        from the resume or assessment.
    19. Do not treat frameworks, libraries, preprocessors, build tools, or alternative
        technologies as missing unless they are explicitly required for the target role.
    20. The absence of a technology from the resume is not sufficient evidence that
        it is a meaningful skill gap.
    21. Prioritize foundational and role-critical skills over niche technologies.
    22. Keep missing_skills focused on genuine gaps that would materially improve
        the candidate's readiness for the target role.
    23. Normally return no more than 3-5 missing skills.

    For strengths, include skills that are clearly demonstrated.

    For weak_skills, include skills where the candidate has some evidence but limited confidence or limited evidence.

    For missing_skills, include skills that are important for the target role but have no meaningful evidence in either the resume or assessment.

    Each strength should contain:
    {
    "skill": "",
    "evidence": ""
    }

    Each weak skill should contain:
    {
    "skill": "",
    "priority": "high|medium|low",
    "reason": ""
    }

    Each missing skill should contain:
    {
    "skill": "",
    "priority": "high|medium|low",
    "reason": ""
    }

    Each required skill should contain:
    {
    "skill": "",
    "importance": "core|common|optional"
    }
    """

        user_prompt = f"""
    Target role:
    {target_role}

    Resume analysis:
    {json.dumps(resume_analysis, indent=2)}

    Assessment skills:
    {json.dumps(assessment_skills, indent=2)}
    """

        result = await ask_ai(
            system_prompt=system_prompt,
            user_prompt=user_prompt,
        )

        try:
            cleaned = result.strip()

            if cleaned.startswith("```"):
                cleaned = cleaned.removeprefix("```json")
                cleaned = cleaned.removeprefix("```")
                cleaned = cleaned.removesuffix("```")
                cleaned = cleaned.strip()

            return json.loads(cleaned)
        except json.JSONDecodeError as exc:
            raise RuntimeError(
                "Skill Gap Agent returned invalid JSON."
            ) from exc

async def generate_career_roadmap(
    target_role: str,
    skill_gap_analysis: dict,
    current_skills: list[dict],
) -> dict:
    system_prompt = """
You are the Learning and Career Roadmap Agent for LITMUS,
an AI-powered career intelligence platform.

Your job is to turn a candidate's skill-gap analysis into
a practical, prioritized learning roadmap.

Return ONLY valid JSON.

Use exactly this structure:

{
  "role": "",
  "roadmap": []
}

Each roadmap item must contain:

{
  "skill": "",
  "priority": "high|medium|low",
  "reason": "",
  "learning_topics": [],
  "project": "",
  "evidence_of_mastery": ""
}

Rules:

1. Prioritize genuine skill gaps identified by the Skill Gap Agent.
2. High-priority gaps should generally come before medium and low-priority gaps.
3. Do not create learning plans for skills the candidate already demonstrates strongly.
4. Weak skills may receive a learning plan when improving them would meaningfully help the candidate reach the target role.
5. Keep the roadmap practical and achievable.
6. Break each skill into concrete learning topics.
7. Every roadmap item should include a practical project that allows the candidate to apply the skill.
8. Evidence of mastery should describe something observable the candidate could produce or demonstrate.
9. Do not recommend technologies that are unrelated to the target role.
10. Do not invent candidate experience.
11. Use concise canonical skill names.
12. Do not include courses, websites, YouTube videos, or specific external resources.
13. Do not create roadmap items for skills that are not present in the provided skill-gap analysis.
14. Avoid duplicate roadmap items.
15. Keep the roadmap focused on the most important skills rather than listing every possible technology.
16. Do not introduce additional technologies or frameworks as required
  learning topics unless they are necessary fundamentals of the target skill.
17. Keep learning topics focused on the canonical skill being addressed.

"""

    user_prompt = f"""
Target role:
{target_role}

Skill gap analysis:
{json.dumps(skill_gap_analysis, indent=2)}

Current skills:
{json.dumps(current_skills, indent=2)}
"""

    result = await ask_ai(
        system_prompt=system_prompt,
        user_prompt=user_prompt,
    )

    try:
        cleaned_result = result.strip()

        if cleaned_result.startswith("```"):
            cleaned_result = cleaned_result.removeprefix("```json")
            cleaned_result = cleaned_result.removeprefix("```")
            cleaned_result = cleaned_result.removesuffix("```")
            cleaned_result = cleaned_result.strip()

        roadmap_result = json.loads(cleaned_result)

        allowed_skills = {
            item["skill"].strip().lower()
            for item in skill_gap_analysis.get("missing_skills", [])
        }

        allowed_skills.update(
            item["skill"].strip().lower()
            for item in skill_gap_analysis.get("weak_skills", [])
        )

        roadmap_result["roadmap"] = [
            item
            for item in roadmap_result.get("roadmap", [])
            if item.get("skill", "").strip().lower() in allowed_skills
        ]

        return roadmap_result

    except json.JSONDecodeError as exc:
        print("RAW ROADMAP RESPONSE:")
        print(result)
        raise RuntimeError(
            "Career Roadmap Agent returned invalid JSON."
        ) from exc
