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
        return json.loads(result)
    except json.JSONDecodeError as exc:
        raise RuntimeError(
            "Resume Agent returned invalid JSON."
        ) from exc