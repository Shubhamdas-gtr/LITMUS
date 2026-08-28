import os
from typing import Literal
from datetime import datetime, timedelta, timezone
from types import SimpleNamespace
from pydantic import BaseModel

import httpx
from dotenv import load_dotenv
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from supabase import create_client, Client
from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from pathlib import Path
from fastapi import UploadFile, File
from services.ai_service import (
    analyze_resume,
    analyze_skill_gap,
    generate_career_roadmap,
)
from services.resume_parser import extract_resume_text
from services.lead_service import (
    DRAFT_PROMPT_VERSION,
    generate_lead_candidate,
    generate_linkedin_draft,
)
from services.github_service import (
    GitHubAPIError,
    collect_github_evidence,
    detect_repo_pushed,
)

BASE_DIR = Path(__file__).resolve().parent
load_dotenv(BASE_DIR / ".env")

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SECRET_KEY = os.getenv("SUPABASE_SECRET_KEY")

if not SUPABASE_URL or not SUPABASE_SECRET_KEY:
    raise RuntimeError("Missing Supabase environment variables")

supabase: Client = create_client(
    SUPABASE_URL,
    SUPABASE_SECRET_KEY,
)


def get_user_from_token(access_token: str):
    """Verify JWT via Supabase Auth API using httpx.

    This avoids calling ``supabase.auth.get_user()`` which mutates the shared
    client's auth state, causing subsequent PostgREST queries to use the user's
    JWT instead of the service-role key.
    """
    try:
        with httpx.Client(timeout=5.0) as client:
            response = client.get(
                f"{SUPABASE_URL}/auth/v1/user",
                headers={
                    "Authorization": f"Bearer {access_token}",
                    "apikey": SUPABASE_SECRET_KEY,
                },
            )
    except httpx.HTTPError:
        raise HTTPException(
            status_code=503,
            detail="Authentication service temporarily unavailable",
        )
    if response.status_code != 200:
        raise HTTPException(
            status_code=401,
            detail="Invalid or expired token",
        )
    try:
        data = response.json()
    except ValueError:
        raise HTTPException(
            status_code=401,
            detail="Invalid or expired token",
        )
    if not isinstance(data, dict):
        raise HTTPException(
            status_code=401,
            detail="Invalid or expired token",
        )
    return SimpleNamespace(**data)

class AssessmentPayload(BaseModel):
    career_goal: str
    target_role: str
    interests: list[str]
    skills: list[str]
    skill_confidence: dict[str, str]
    assessment_answers: dict[str, int]

class RoadmapProgressPayload(BaseModel):
    skill: str

class GithubSyncPayload(BaseModel):
    provider_token: str


class LeadReviewPayload(BaseModel):
    action: Literal["approve", "dismiss", "converted", "edit", "delete"]
    draft_body: str | None = None

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
    "http://localhost:3000",
    "http://127.0.0.1:3000",
],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    if isinstance(exc, HTTPException):
        return JSONResponse(
            status_code=exc.status_code,
            content={"detail": exc.detail},
            headers=exc.headers,
        )
    import traceback

    traceback.print_exc()
    return JSONResponse(
        status_code=500,
        content={"detail": str(exc) if str(exc) else "Internal server error"},
    )

def download_resume(resume_path: str) -> bytes:
    try:
        response = (
            supabase.storage
            .from_("resumes")
            .download(resume_path)
        )

        return response

    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=f"Could not download resume: {str(error)}",
        )


@app.get("/")
def root():
    return {"message": "LITMUS API is running"}

security = HTTPBearer()


@app.post("/api/profile")
def create_or_update_profile(
    credentials: HTTPAuthorizationCredentials = Depends(security),
):
    access_token = credentials.credentials

    user = get_user_from_token(access_token)

    if not user:
        raise HTTPException(status_code=401, detail="User not authenticated")

    profile_data = {
        "auth_user_id": user.id,
    }

    response = (
        supabase
        .table("profiles")
        .upsert(profile_data, on_conflict="auth_user_id")
        .execute()
    )

    return {
        "message": "Profile created or updated",
        "profile": response.data,
    }

@app.post("/api/profile/assessment")
def save_assessment(
    payload: AssessmentPayload,
    credentials: HTTPAuthorizationCredentials = Depends(security),
):
    access_token = credentials.credentials

    user = get_user_from_token(access_token)

    if not user:
        raise HTTPException(
            status_code=401,
            detail="User not authenticated",
        )

    try:
        profile_response = (
            supabase
            .table("profiles")
            .select("id")
            .eq("auth_user_id", user.id)
            .single()
            .execute()
        )
    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=f"Could not load profile: {str(error)}",
        )

    if not profile_response.data:
        raise HTTPException(
            status_code=404,
            detail="Profile not found",
        )

    profile_id = profile_response.data["id"]

    try:
        supabase.table("profiles").update({
            "career_goal": payload.career_goal,
            "target_role": payload.target_role,
        }).eq("id", profile_id).execute()
    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=f"Could not update profile: {str(error)}",
        )

    try:
        for interest in payload.interests:
            supabase.table("profile_interests").upsert(
                {
                    "profile_id": profile_id,
                    "interest": interest,
                },
                on_conflict="profile_id,interest",
            ).execute()
    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=f"Could not save interests: {str(error)}",
        )

    try:
        for skill in payload.skills:
            supabase.table("profile_skills").upsert(
                {
                    "profile_id": profile_id,
                    "skill": skill,
                    "confidence": payload.skill_confidence.get(skill, ""),
                },
                on_conflict="profile_id,skill",
            ).execute()
    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=f"Could not save skills: {str(error)}",
        )

    try:
        for question_id, selected_answer in payload.assessment_answers.items():
            supabase.table("assessment_answers").upsert(
                {
                    "profile_id": profile_id,
                    "question_id": question_id,
                    "selected_answer": selected_answer,
                },
                on_conflict="profile_id,question_id",
            ).execute()
    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=f"Could not save assessment answers: {str(error)}",
        )

    return {
        "message": "Assessment saved successfully",
        "profile_id": profile_id,
    }


@app.post("/api/profile/resume")
def upload_resume(
    file: UploadFile = File(...),
    credentials: HTTPAuthorizationCredentials = Depends(security),
):
    access_token = credentials.credentials

    user = get_user_from_token(access_token)

    if not user:
        raise HTTPException(
            status_code=401,
            detail="User not authenticated",
        )

    if file.content_type not in [
        "application/pdf",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ]:
        raise HTTPException(
            status_code=400,
            detail="Only PDF and DOCX files are allowed.",
        )

    try:
        profile_response = (
            supabase
            .table("profiles")
            .select("id")
            .eq("auth_user_id", user.id)
            .single()
            .execute()
        )
    except Exception:
        raise HTTPException(
            status_code=404,
            detail="Profile not found",
        )

    if not profile_response.data:
        raise HTTPException(
            status_code=404,
            detail="Profile not found",
        )

    profile_id = profile_response.data["id"]

    file_extension = (
        "pdf"
        if file.content_type == "application/pdf"
        else "docx"
    )

    file_path = f"{user.id}/{profile_id}.{file_extension}"

    file_bytes = file.file.read()

    try:
        supabase.storage.from_("resumes").upload(
            file_path,
            file_bytes,
            {
                "content-type": file.content_type,
                "upsert": "true",
            },
        )
    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=f"Resume upload failed: {str(error)}",
        )

    supabase.table("profiles").update({
        "resume_path": file_path,
    }).eq("id", profile_id).execute()

    return {
        "message": "Resume uploaded successfully",
        "resume_path": file_path,
    }

@app.get("/api/profile/resume")
def get_resume_url(
    credentials: HTTPAuthorizationCredentials = Depends(security),
):
    access_token = credentials.credentials

    user = get_user_from_token(access_token)

    if not user:
        raise HTTPException(
            status_code=401,
            detail="User not authenticated",
        )

    try:
        profile_response = (
            supabase
            .table("profiles")
            .select("id, resume_path")
            .eq("auth_user_id", user.id)
            .single()
            .execute()
        )
    except Exception:
        raise HTTPException(
            status_code=404,
            detail="Profile not found",
        )

    if not profile_response.data:
        raise HTTPException(
            status_code=404,
            detail="Profile not found",
        )

    resume_path = profile_response.data.get("resume_path")

    if not resume_path:
        raise HTTPException(
            status_code=404,
            detail="No resume uploaded",
        )

    try:
        response = (
            supabase.storage
            .from_("resumes")
            .create_signed_url(resume_path, 300)
        )
    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=f"Could not create resume URL: {str(error)}",
        )

    return {
        "signed_url": response["signedURL"],
    }


@app.post("/api/profile/resume/analyze")
async def analyze_user_resume(
    credentials: HTTPAuthorizationCredentials = Depends(security),
):
    access_token = credentials.credentials

    user = get_user_from_token(access_token)

    if not user:
        raise HTTPException(
            status_code=401,
            detail="User not authenticated",
        )

    try:
        profile_response = (
            supabase
            .table("profiles")
            .select("id, resume_path, career_goal, target_role")
            .eq("auth_user_id", user.id)
            .single()
            .execute()
        )
    except Exception:
        raise HTTPException(
            status_code=404,
            detail="Profile not found",
        )

    if not profile_response.data:
        raise HTTPException(
            status_code=404,
            detail="Profile not found",
        )

    profile = profile_response.data
    resume_path = profile.get("resume_path")

    if not resume_path:
        raise HTTPException(
            status_code=404,
            detail="No resume uploaded",
        )

    resume_bytes = download_resume(resume_path)

    filename = resume_path.split("/")[-1]

    try:
        resume_text = extract_resume_text(
            resume_bytes,
            filename,
        )
    except ValueError as error:
        raise HTTPException(
            status_code=400,
            detail=str(error),
        )

    analysis = await analyze_resume(resume_text)

    analysis_data = {
        "profile_id": profile["id"],
        "summary": analysis.get("summary", ""),
        "skills": analysis.get("skills", []),
        "experience": analysis.get("experience", []),
        "projects": analysis.get("projects", []),
        "education": analysis.get("education", []),
        "certifications": analysis.get("certifications", []),
    }

    save_response = (
        supabase
        .table("resume_analyses")
        .upsert(
            analysis_data,
            on_conflict="profile_id",
        )
        .execute()
    )

    if not save_response.data:
        raise HTTPException(
            status_code=500,
            detail="Could not save resume analysis.",
        )

    return {
    "message": "Resume analyzed and saved successfully",
    "analysis": analysis,
}

@app.post("/api/profile/skill-gap/analyze")
async def analyze_skill_gap_endpoint(
    credentials: HTTPAuthorizationCredentials = Depends(security),
):
    access_token = credentials.credentials

    user = get_user_from_token(access_token)

    if not user:
        raise HTTPException(
            status_code=401,
            detail="User not authenticated",
        )

    # Get profile
    try:
        profile_response = (
            supabase
            .table("profiles")
            .select("id, target_role")
            .eq("auth_user_id", user.id)
            .single()
            .execute()
        )
    except Exception:
        raise HTTPException(
            status_code=404,
            detail="Profile not found",
        )

    if not profile_response.data:
        raise HTTPException(
            status_code=404,
            detail="Profile not found",
        )

    profile = profile_response.data
    profile_id = profile["id"]
    target_role = profile.get("target_role")

    if not target_role:
        raise HTTPException(
            status_code=400,
            detail="Target role has not been set",
        )

    # Get resume analysis
    try:
        resume_response = (
            supabase
            .table("resume_analyses")
            .select("*")
            .eq("profile_id", profile_id)
            .single()
            .execute()
        )
    except Exception:
        raise HTTPException(
            status_code=404,
            detail="Resume analysis not found",
        )

    if not resume_response.data:
        raise HTTPException(
            status_code=404,
            detail="Resume analysis not found",
        )

    resume_analysis = resume_response.data

    # Get assessment skills
    skills_response = (
        supabase
        .table("profile_skills")
        .select("skill, confidence")
        .eq("profile_id", profile_id)
        .execute()
    )

    assessment_skills = skills_response.data or []

    # Run Skill Gap Agent
    analysis = await analyze_skill_gap(
        target_role=target_role,
        resume_analysis=resume_analysis,
        assessment_skills=assessment_skills,
    )

    # Save analysis
    analysis_data = {
        "profile_id": profile_id,
        "target_role": target_role,
        "required_skills": analysis.get("required_skills", []),
        "strengths": analysis.get("strengths", []),
        "weak_skills": analysis.get("weak_skills", []),
        "missing_skills": analysis.get("missing_skills", []),
    }

    save_response = (
        supabase
        .table("skill_gap_analyses")
        .upsert(
            analysis_data,
            on_conflict="profile_id",
        )
        .execute()
    )

    if not save_response.data:
        raise HTTPException(
            status_code=500,
            detail="Could not save skill gap analysis",
        )

    return {
        "message": "Skill gap analysis completed successfully",
        "analysis": analysis,
    }

@app.post("/api/profile/roadmap")
async def generate_roadmap(
    credentials: HTTPAuthorizationCredentials = Depends(security),
):
    access_token = credentials.credentials

    user = get_user_from_token(access_token)

    if not user:
        raise HTTPException(
            status_code=401,
            detail="User not authenticated",
        )

    # Get profile
    try:
        profile_response = (
            supabase
            .table("profiles")
            .select("id, target_role")
            .eq("auth_user_id", user.id)
            .single()
            .execute()
        )
    except Exception:
        raise HTTPException(
            status_code=404,
            detail="Profile not found",
        )

    if not profile_response.data:
        raise HTTPException(
            status_code=404,
            detail="Profile not found",
        )

    profile = profile_response.data
    profile_id = profile["id"]
    target_role = profile.get("target_role")

    if not target_role:
        raise HTTPException(
            status_code=400,
            detail="Target role is not set",
        )

    # Get latest skill-gap analysis
    skill_gap_response = (
        supabase
        .table("skill_gap_analyses")
        .select(
            "target_role, required_skills, strengths, weak_skills, missing_skills"
        )
        .eq("profile_id", profile_id)
        .order("created_at", desc=True)
        .limit(1)
        .execute()
    )

    if not skill_gap_response.data:
        raise HTTPException(
            status_code=404,
            detail="Skill gap analysis not found",
        )

    skill_gap = skill_gap_response.data[0]

    skill_gap_analysis = {
        "role": skill_gap["target_role"],
        "required_skills": skill_gap["required_skills"],
        "strengths": skill_gap["strengths"],
        "weak_skills": skill_gap["weak_skills"],
        "missing_skills": skill_gap["missing_skills"],
    }

    # Get current skills
    skills_response = (
        supabase
        .table("profile_skills")
        .select("skill, confidence")
        .eq("profile_id", profile_id)
        .execute()
    )

    current_skills = skills_response.data or []

    # Generate roadmap
    try:
        roadmap_analysis = await generate_career_roadmap(
            target_role=target_role,
            skill_gap_analysis=skill_gap_analysis,
            current_skills=current_skills,
        )
    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=f"Career roadmap generation failed: {str(error)}",
        )

    # Save roadmap
    roadmap_response = (
        supabase
        .table("career_roadmaps")
        .upsert(
            {
                "profile_id": profile_id,
                "target_role": target_role,
                "roadmap": roadmap_analysis["roadmap"],
            },
            on_conflict="profile_id",
        )
        .execute()
    )

    return {
        "message": "Career roadmap generated successfully",
        "roadmap": roadmap_response.data,
    }

@app.post("/api/profile/generate-all")
async def generate_all(
    credentials: HTTPAuthorizationCredentials = Depends(security),
):
    access_token = credentials.credentials

    user = get_user_from_token(access_token)

    if not user:
        raise HTTPException(
            status_code=401,
            detail="User not authenticated",
        )

    try:
        profile_response = (
            supabase
            .table("profiles")
            .select("id, target_role, resume_path")
            .eq("auth_user_id", user.id)
            .single()
            .execute()
        )
    except Exception:
        raise HTTPException(
            status_code=404,
            detail="Profile not found",
        )

    if not profile_response.data:
        raise HTTPException(
            status_code=404,
            detail="Profile not found",
        )

    profile = profile_response.data
    profile_id = profile["id"]
    target_role = profile.get("target_role")

    if not target_role:
        raise HTTPException(
            status_code=400,
            detail="Target role has not been set",
        )

    resume_path = profile.get("resume_path")
    resume_analysis = None

    if resume_path:
        try:
            resume_bytes = download_resume(resume_path)
            filename = resume_path.split("/")[-1]
            resume_text = extract_resume_text(resume_bytes, filename)
            resume_analysis = await analyze_resume(resume_text)

            analysis_data = {
                "profile_id": profile_id,
                "summary": resume_analysis.get("summary", ""),
                "skills": resume_analysis.get("skills", []),
                "experience": resume_analysis.get("experience", []),
                "projects": resume_analysis.get("projects", []),
                "education": resume_analysis.get("education", []),
                "certifications": resume_analysis.get("certifications", []),
            }

            resume_analysis_response = (
    supabase
    .table("resume_analyses")
    .upsert(
        analysis_data,
        on_conflict="profile_id",
    )
    .execute()
)
        except HTTPException:
            raise
        except Exception:
            resume_analysis = None

    try:
        skills_response = (
            supabase
            .table("profile_skills")
            .select("skill, confidence")
            .eq("profile_id", profile_id)
            .execute()
        )
    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=f"Could not load profile skills: {str(error)}",
        )

    assessment_skills = skills_response.data or []

    skill_gap_input = resume_analysis if resume_analysis else {}

    try:
        skill_gap_result = await analyze_skill_gap(
            target_role=target_role,
            resume_analysis=skill_gap_input,
            assessment_skills=assessment_skills,
        )
    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=f"Skill gap analysis failed: {str(error)}",
        )

    skill_gap_data = {
        "profile_id": profile_id,
        "target_role": target_role,
        "required_skills": skill_gap_result.get("required_skills", []),
        "strengths": skill_gap_result.get("strengths", []),
        "weak_skills": skill_gap_result.get("weak_skills", []),
        "missing_skills": skill_gap_result.get("missing_skills", []),
    }

    try:
        skill_gap_save = (
            supabase
            .table("skill_gap_analyses")
            .upsert(
                skill_gap_data,
                on_conflict="profile_id",
            )
            .execute()
        )
    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=f"Could not save skill gap analysis: {str(error)}",
        )

    if not skill_gap_save.data:
        raise HTTPException(
            status_code=500,
            detail="Could not save skill gap analysis",
        )

    skill_gap_analysis = {
        "role": target_role,
        "required_skills": skill_gap_result.get("required_skills", []),
        "strengths": skill_gap_result.get("strengths", []),
        "weak_skills": skill_gap_result.get("weak_skills", []),
        "missing_skills": skill_gap_result.get("missing_skills", []),
    }

    try:
        roadmap_result = await generate_career_roadmap(
            target_role=target_role,
            skill_gap_analysis=skill_gap_analysis,
            current_skills=assessment_skills,
        )
    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=f"Career roadmap generation failed: {str(error)}",
        )

    try:
        roadmap_save = (
            supabase
            .table("career_roadmaps")
            .upsert(
                {
                    "profile_id": profile_id,
                    "target_role": target_role,
                    "roadmap": roadmap_result["roadmap"],
                },
                on_conflict="profile_id",
            )
            .execute()
        )
    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=f"Could not save career roadmap: {str(error)}",
        )

    if not roadmap_save.data:
        raise HTTPException(
            status_code=500,
            detail="Could not save career roadmap",
        )

    return {
        "message": "Profile analysis generated successfully",
        "resume_analyzed": resume_analysis is not None,
        "skill_gap": skill_gap_result,
        "roadmap": roadmap_result,
    }

@app.get("/api/profile/roadmap")
def get_roadmap(
    credentials: HTTPAuthorizationCredentials = Depends(security),
):
    access_token = credentials.credentials

    user = get_user_from_token(access_token)

    if not user:
        raise HTTPException(
            status_code=401,
            detail="User not authenticated",
        )

    try:
        profile_response = (
            supabase
            .table("profiles")
            .select("id")
            .eq("auth_user_id", user.id)
            .single()
            .execute()
        )
    except Exception:
        profile_response = None

    if not profile_response or not profile_response.data:
        raise HTTPException(
            status_code=404,
            detail="Profile not found",
        )

    profile_id = profile_response.data["id"]

    try:
        roadmap_response = (
            supabase
            .table("career_roadmaps")
            .select("*")
            .eq("profile_id", profile_id)
            .single()
            .execute()
        )
    except Exception:
        roadmap_response = None

    if not roadmap_response or not roadmap_response.data:
        raise HTTPException(
            status_code=404,
            detail="Career roadmap not found",
        )

    return {
        "message": "Career roadmap retrieved successfully",
        "roadmap": roadmap_response.data,
    }

@app.get("/api/profile/skill-gap")
def get_skill_gap(
    credentials: HTTPAuthorizationCredentials = Depends(security),
):
    access_token = credentials.credentials

    user = get_user_from_token(access_token)

    if not user:
        raise HTTPException(
            status_code=401,
            detail="User not authenticated",
        )

    try:
        profile_response = (
            supabase
            .table("profiles")
            .select("id")
            .eq("auth_user_id", user.id)
            .single()
            .execute()
        )
    except Exception:
        profile_response = None

    if not profile_response or not profile_response.data:
        raise HTTPException(
            status_code=404,
            detail="Profile not found",
        )

    profile_id = profile_response.data["id"]

    skill_gap_response = (
        supabase
        .table("skill_gap_analyses")
        .select(
            "id, target_role, required_skills, strengths, weak_skills, missing_skills, created_at, updated_at"
        )
        .eq("profile_id", profile_id)
        .order("created_at", desc=True)
        .limit(1)
        .execute()
    )

    if not skill_gap_response.data:
        raise HTTPException(
            status_code=404,
            detail="Skill gap analysis not found",
        )

    return {
        "message": "Skill gap analysis retrieved successfully",
        "analysis": skill_gap_response.data[0],
    }
@app.get("/api/profile")
def get_profile(
    credentials: HTTPAuthorizationCredentials = Depends(security),
):
    access_token = credentials.credentials

    user = get_user_from_token(access_token)

    if not user:
        raise HTTPException(
            status_code=401,
            detail="User not authenticated",
        )

    try:
        profile_response = (
            supabase
            .table("profiles")
            .select("*")
            .eq("auth_user_id", user.id)
            .single()
            .execute()
        )
    except Exception:
        profile_response = None

    if not profile_response or not profile_response.data:
        raise HTTPException(
            status_code=404,
            detail="Profile not found",
        )

    profile = profile_response.data
    profile_id = profile["id"]

    interests_response = (
        supabase
        .table("profile_interests")
        .select("interest")
        .eq("profile_id", profile_id)
        .execute()
    )

    skills_response = (
        supabase
        .table("profile_skills")
        .select("skill, confidence")
        .eq("profile_id", profile_id)
        .execute()
    )

    answers_response = (
        supabase
        .table("assessment_answers")
        .select("question_id, selected_answer")
        .eq("profile_id", profile_id)
        .execute()
    )

    return {
    "profile": profile,
    "resume_path": profile.get("resume_path"),
    "interests": interests_response.data,
    "skills": skills_response.data,
    "assessment_answers": answers_response.data,
    }


def _resolve_profile_for_user(user) -> dict:
    """Return the profiles row for the authenticated user or raise 404."""
    try:
        response = (
            supabase
            .table("profiles")
            .select("id")
            .eq("auth_user_id", user.id)
            .single()
            .execute()
        )
    except Exception:
        raise HTTPException(
            status_code=404,
            detail="Profile not found",
        )
    if not response.data:
        raise HTTPException(
            status_code=404,
            detail="Profile not found",
        )
    return response.data


def _load_repo_freshness_snapshot(github_profile_id: str | None) -> dict[str, str]:
    """Capture repo_updated_at values before github_repositories gets overwritten."""
    if not github_profile_id:
        return {}

    try:
        response = (
            supabase
            .table("github_repositories")
            .select("github_repo_id, repo_updated_at")
            .eq("github_profile_id", github_profile_id)
            .execute()
        )
    except Exception:
        return {}

    snapshot: dict[str, str] = {}
    for repo in response.data or []:
        github_repo_id = repo.get("github_repo_id")
        repo_updated_at = repo.get("repo_updated_at")
        if github_repo_id is None or not repo_updated_at:
            continue
        snapshot[str(github_repo_id)] = str(repo_updated_at)

    return snapshot


def _load_profile_context(profile_id: str) -> dict:
    try:
        response = (
            supabase
            .table("profiles")
            .select("id, career_goal, target_role")
            .eq("id", profile_id)
            .single()
            .execute()
        )
    except Exception:
        raise HTTPException(
            status_code=404,
            detail="Profile not found",
        )

    if not response.data:
        raise HTTPException(
            status_code=404,
            detail="Profile not found",
        )

    return response.data


def _load_latest_skill_gap(profile_id: str) -> dict | None:
    try:
        response = (
            supabase
            .table("skill_gap_analyses")
            .select("*")
            .eq("profile_id", profile_id)
            .order("created_at", desc=True)
            .limit(1)
            .execute()
        )
    except Exception:
        return None

    return response.data[0] if response.data else None


def _load_latest_roadmap(profile_id: str) -> dict | None:
    try:
        response = (
            supabase
            .table("career_roadmaps")
            .select("*")
            .eq("profile_id", profile_id)
            .order("created_at", desc=True)
            .limit(1)
            .execute()
        )
    except Exception:
        return None

    return response.data[0] if response.data else None


def _load_github_profile_context(github_profile_id: str) -> dict | None:
    try:
        response = (
            supabase
            .table("github_profiles")
            .select(
                "id, profile_id, github_user_id, username, profile_bio, avatar_url, last_synced_at"
            )
            .eq("id", github_profile_id)
            .single()
            .execute()
        )
    except Exception:
        return None

    return response.data if response.data else None


def _load_github_repositories(github_profile_id: str) -> list[dict]:
    try:
        response = (
            supabase
            .table("github_repositories")
            .select("*")
            .eq("github_profile_id", github_profile_id)
            .execute()
        )
    except Exception:
        return []

    return response.data or []


def _load_github_activity(github_profile_id: str) -> dict | None:
    try:
        response = (
            supabase
            .table("github_activity")
            .select("*")
            .eq("github_profile_id", github_profile_id)
            .order("period_start", desc=True)
            .limit(1)
            .execute()
        )
    except Exception:
        return None

    return response.data[0] if response.data else None


def _load_generation_receipts(profile_id: str) -> dict[str, str]:
    try:
        response = (
            supabase
            .table("lead_generation_receipts")
            .select("detected_event_id, dedup_key")
            .eq("profile_id", profile_id)
            .execute()
        )
    except Exception:
        return {}

    receipts: dict[str, str] = {}
    for row in response.data or []:
        detected_event_id = row.get("detected_event_id")
        dedup_key = row.get("dedup_key")
        if detected_event_id and dedup_key:
            receipts[str(detected_event_id)] = str(dedup_key)
    return receipts


def _load_repo_push_events(github_profile_id: str) -> list[dict]:
    try:
        response = (
            supabase
            .table("github_detected_events")
            .select("*")
            .eq("github_profile_id", github_profile_id)
            .eq("event_type", "repo_pushed")
            .order("event_timestamp", desc=True)
            .limit(25)
            .execute()
        )
    except Exception:
        return []

    return response.data or []


def _build_lead_context(
    profile: dict,
    github_profile: dict | None,
    github_repositories: list[dict],
    github_activity: dict | None,
    skill_gap: dict | None,
    roadmap: dict | None,
) -> dict:
    repository_by_id: dict[str, dict] = {}
    for repo in github_repositories:
        github_repo_id = repo.get("github_repo_id")
        if github_repo_id is None:
            continue
        repository_by_id[str(github_repo_id)] = repo

    allowed_skills: list[str] = []
    if skill_gap:
        for item in skill_gap.get("missing_skills") or []:
            skill = item.get("skill")
            if skill:
                allowed_skills.append(skill)
        for item in skill_gap.get("weak_skills") or []:
            skill = item.get("skill")
            if skill:
                allowed_skills.append(skill)
        for item in skill_gap.get("strengths") or []:
            skill = item.get("skill")
            if skill:
                allowed_skills.append(skill)
        for item in skill_gap.get("required_skills") or []:
            skill = item.get("skill")
            if skill:
                allowed_skills.append(skill)

    if roadmap:
        for item in roadmap.get("roadmap") or []:
            skill = item.get("skill")
            if skill:
                allowed_skills.append(skill)

    for repo in github_repositories:
        for lang in (repo.get("languages") or {}).keys():
            allowed_skills.append(lang)

    normalized_allowed_skills = sorted(
        {
            skill.strip()
            for skill in allowed_skills
            if isinstance(skill, str) and skill.strip()
        }
    )

    return {
        "profile": profile,
        "github_profile": github_profile or {},
        "github_repositories": github_repositories,
        "repository_by_id": repository_by_id,
        "github_activity": github_activity or {},
        "skill_gap": skill_gap or {},
        "roadmap": roadmap or {},
        "allowed_skills": normalized_allowed_skills,
    }


async def _generate_and_store_leads_for_events(
    profile: dict,
    github_profile: dict,
    github_repositories: list[dict],
    github_activity: dict | None,
    skill_gap: dict | None,
    roadmap: dict | None,
    detected_events: list[dict],
) -> list[dict]:
    """Generate and persist leads for the supplied repo_pushed events."""
    if not github_profile:
        return []

    context = _build_lead_context(
        profile,
        github_profile,
        github_repositories,
        github_activity,
        skill_gap,
        roadmap,
    )
    receipts = _load_generation_receipts(profile["id"])
    generated: list[dict] = []

    for event in detected_events:
        if event.get("event_type") != "repo_pushed":
            continue

        detected_event_id = event.get("id")
        if detected_event_id and str(detected_event_id) in receipts:
            continue

        github_repo_id = event.get("github_repo_id")
        if github_repo_id is None:
            continue

        repository = context["repository_by_id"].get(str(github_repo_id))
        if not repository:
            continue

        event_context = {
            "target_role": profile.get("target_role"),
            "profile_context": {
                "career_goal": profile.get("career_goal"),
                "target_role": profile.get("target_role"),
                "github_username": github_profile.get("username"),
                "github_profile_bio": github_profile.get("profile_bio"),
            },
            "detected_event": {
                "id": str(event.get("id")) if event.get("id") else None,
                "event_type": event.get("event_type"),
                "event_id": event.get("event_id"),
                "event_timestamp": event.get("event_timestamp"),
                "observed_at": event.get("observed_at"),
                "dedup_key": event.get("dedup_key"),
                "repo_name": event.get("payload", {}).get("repo_name") or repository.get("name"),
                "url": event.get("payload", {}).get("url") or repository.get("html_url"),
                "title": event.get("payload", {}).get("title") or repository.get("name"),
            },
            "repository": {
                "github_repo_id": repository.get("github_repo_id"),
                "name": repository.get("name"),
                "full_name": repository.get("full_name"),
                "html_url": repository.get("html_url"),
                "description": repository.get("description"),
                "languages": sorted((repository.get("languages") or {}).keys()),
                "topics": repository.get("topics") or [],
                "stars": repository.get("stars", 0),
                "forks": repository.get("forks", 0),
                "is_fork": repository.get("is_fork", False),
                "is_private": repository.get("is_private", False),
                "repo_created_at": repository.get("repo_created_at"),
                "repo_updated_at": repository.get("repo_updated_at"),
            },
            "github_profile_url": (
                f"https://github.com/{github_profile.get('username')}"
                if github_profile.get("username")
                else None
            ),
            "github_activity": github_activity or {},
            "skill_gap": skill_gap or {},
            "roadmap": roadmap or {},
            "allowed_skills": context["allowed_skills"],
        }

        lead_candidate = await generate_lead_candidate(event_context)
        if not lead_candidate:
            continue

        draft_candidate = await generate_linkedin_draft(event_context, lead_candidate)
        if not draft_candidate:
            continue

        dedup_key = str(event.get("dedup_key") or "").strip()
        if not dedup_key:
            continue

        lead_data = {
            "profile_id": profile["id"],
            "github_profile_id": github_profile["id"],
            "detected_event_id": event.get("id"),
            "title": lead_candidate["title"],
            "angle": lead_candidate["angle"],
            "relevant_skills": lead_candidate["relevant_skills"],
            "confidence": lead_candidate["confidence"],
            "status": "pending",
            "dedup_key": dedup_key,
        }

        try:
            lead_response = (
                supabase.table("leads")
                .upsert(
                    lead_data,
                    on_conflict="profile_id,dedup_key",
                )
                .execute()
            )
        except Exception as error:
            raise HTTPException(
                status_code=500,
                detail=f"Could not save lead: {str(error)}",
            )

        if not lead_response.data:
            continue

        lead_row = lead_response.data[0]
        lead_id = lead_row["id"]

        try:
            draft_response = (
                supabase.table("lead_drafts")
                .upsert(
                    {
                        "lead_id": lead_id,
                        "channel": "linkedin_post",
                        "subject": draft_candidate.get("subject"),
                        "body": draft_candidate["body"],
                        "citations": draft_candidate.get("citations", []),
                        "prompt_version": DRAFT_PROMPT_VERSION,
                        "model": "openrouter/free",
                        "status": "draft",
                    },
                    on_conflict="lead_id",
                )
                .execute()
            )
        except Exception as error:
            supabase.table("leads").delete().eq("id", lead_id).execute()
            raise HTTPException(
                status_code=500,
                detail=f"Could not save lead draft: {str(error)}",
            )

        if not draft_response.data:
            supabase.table("leads").delete().eq("id", lead_id).execute()
            continue

        try:
            supabase.table("lead_generation_receipts").insert(
                {
                    "profile_id": profile["id"],
                    "github_profile_id": github_profile["id"],
                    "detected_event_id": event.get("id"),
                    "lead_id": lead_id,
                    "dedup_key": dedup_key,
                }
            ).execute()
        except Exception:
            # The lead and draft remain valid; the receipt table is only a
            # deduplication guard and should not block the user-visible flow.
            pass

        generated.append(
            {
                "lead": lead_row,
                "draft": draft_response.data[0],
                "event": event,
                "repository": repository,
            }
        )

    return generated


def _serialize_lead_record(
    lead: dict,
    draft: dict | None = None,
    event: dict | None = None,
    repository: dict | None = None,
) -> dict:
    event_payload = (event or {}).get("payload") or {}
    repo_name = (repository or {}).get("name") or event_payload.get("repo_name")
    repo_url = (repository or {}).get("html_url") or event_payload.get("url")

    return {
        "id": lead.get("id"),
        "profile_id": lead.get("profile_id"),
        "github_profile_id": lead.get("github_profile_id"),
        "detected_event_id": lead.get("detected_event_id"),
        "dedup_key": lead.get("dedup_key"),
        "title": lead.get("title"),
        "angle": lead.get("angle"),
        "relevant_skills": lead.get("relevant_skills") or [],
        "confidence": lead.get("confidence"),
        "status": lead.get("status"),
        "generated_at": lead.get("generated_at"),
        "expires_at": lead.get("expires_at"),
        "source_event": {
            "id": event.get("id") if event else None,
            "event_type": event.get("event_type") if event else None,
            "event_id": event.get("event_id") if event else None,
            "event_timestamp": event.get("event_timestamp") if event else None,
            "observed_at": event.get("observed_at") if event else None,
            "dedup_key": event.get("dedup_key") if event else None,
        }
        if event
        else None,
        "source_repository": {
            "github_repo_id": repository.get("github_repo_id") if repository else None,
            "name": repo_name,
            "url": repo_url,
        }
        if repo_name or repo_url or repository
        else None,
        "draft": {
            "id": draft.get("id"),
            "lead_id": draft.get("lead_id"),
            "channel": draft.get("channel"),
            "subject": draft.get("subject"),
            "body": draft.get("body"),
            "preview": (draft.get("body") or "")[:280],
            "citations": draft.get("citations") or [],
            "prompt_version": draft.get("prompt_version"),
            "model": draft.get("model"),
            "status": draft.get("status"),
            "created_at": draft.get("created_at"),
        }
        if draft
        else None,
    }


@app.get("/api/profile/github")
def get_github_evidence(
    credentials: HTTPAuthorizationCredentials = Depends(security),
):
    """Return cached GitHub evidence without calling the GitHub API.

    GitHub data may be absent (not connected / never synced); in that case a
    valid empty envelope is returned so the dashboard always works.
    """
    user = get_user_from_token(credentials.credentials)

    if not user:
        raise HTTPException(
            status_code=401,
            detail="User not authenticated",
        )

    profile = _resolve_profile_for_user(user)
    profile_id = profile["id"]

    try:
        github_response = (
            supabase
            .table("github_profiles")
            .select("*")
            .eq("profile_id", profile_id)
            .single()
            .execute()
        )
    except Exception:
        github_response = None

    if not github_response or not github_response.data:
        return {
            "connected": False,
            "synced": False,
            "evidence": {
                "username": None,
                "profile_bio": None,
                "repos": [],
                "recent_activity": {
                    "commits_30d": 0,
                    "prs_30d": 0,
                    "issues_30d": 0,
                    "active_days_30d": 0,
                },
                "language_distribution": {},
            },
            "last_synced_at": None,
        }

    github_profile = github_response.data
    github_profile_id = github_profile["id"]

    repos_response = (
        supabase
        .table("github_repositories")
        .select("*")
        .eq("github_profile_id", github_profile_id)
        .order("stars", desc=True)
        .execute()
    )

    activity_response = (
        supabase
        .table("github_activity")
        .select("*")
        .eq("github_profile_id", github_profile_id)
        .order("period_start", desc=True)
        .limit(1)
        .execute()
    )

    repos = repos_response.data or []
    activity = activity_response.data[0] if activity_response.data else None

    language_distribution: dict = {}
    for repo in repos:
        for lang, size in (repo.get("languages") or {}).items():
            language_distribution[lang] = (
                language_distribution.get(lang, 0) + int(size or 0)
            )

    evidence = {
        "username": github_profile.get("username"),
        "profile_bio": github_profile.get("profile_bio"),
        "repos": [
            {
                "name": repo.get("name"),
                "description": repo.get("description"),
                "languages": list((repo.get("languages") or {}).keys()),
                "topics": repo.get("topics") or [],
                "stars": repo.get("stars", 0),
                "forks": repo.get("forks", 0),
                "created_at": repo.get("repo_created_at"),
                "updated_at": repo.get("repo_updated_at"),
                "is_fork": repo.get("is_fork", False),
            }
            for repo in repos
        ],
        "recent_activity": {
            "commits_30d": activity.get("commits_count", 0) if activity else 0,
            "prs_30d": activity.get("prs_count", 0) if activity else 0,
            "issues_30d": activity.get("issues_count", 0) if activity else 0,
            "active_days_30d": activity.get("active_days", 0) if activity else 0,
        },
        "language_distribution": language_distribution,
    }

    return {
        "connected": True,
        "synced": github_profile.get("last_synced_at") is not None,
        "evidence": evidence,
        "last_synced_at": github_profile.get("last_synced_at"),
    }


@app.get("/api/profile/github/events")
def get_github_events(
    credentials: HTTPAuthorizationCredentials = Depends(security),
):
    """Return detected GitHub change events for the authenticated user."""
    user = get_user_from_token(credentials.credentials)

    if not user:
        raise HTTPException(
            status_code=401,
            detail="User not authenticated",
        )

    profile = _resolve_profile_for_user(user)
    profile_id = profile["id"]

    try:
        github_profile_response = (
            supabase
            .table("github_profiles")
            .select("id")
            .eq("profile_id", profile_id)
            .single()
            .execute()
        )
    except Exception:
        github_profile_response = None

    if not github_profile_response or not github_profile_response.data:
        return {"events": []}

    github_profile = github_profile_response.data
    github_profile_id = github_profile["id"]

    events_response = (
        supabase
        .table("github_detected_events")
        .select("*")
        .eq("github_profile_id", github_profile_id)
        .order("event_timestamp", desc=True)
        .limit(100)
        .execute()
    )

    events = events_response.data or []

    return {"events": events}


SYNC_COOLDOWN_SECONDS = 300


@app.post("/api/profile/github/sync")
async def sync_github_evidence(
    payload: GithubSyncPayload,
    credentials: HTTPAuthorizationCredentials = Depends(security),
):
    """Synchronize a user's public GitHub evidence.

    The provider token is supplied by the authenticated frontend for a single
    sync operation. It is used against the GitHub API and then discarded; it is
    never persisted, logged, or returned.
    """
    user = get_user_from_token(credentials.credentials)

    if not user:
        raise HTTPException(
            status_code=401,
            detail="User not authenticated",
        )

    provider_token = payload.provider_token
    if not provider_token:
        raise HTTPException(
            status_code=400,
            detail="Missing GitHub provider token",
        )

    profile = _resolve_profile_for_user(user)
    profile_id = profile["id"]

    # Resolve the existing github_profiles link for this LITMUS profile.
    try:
        github_profile_response = (
            supabase
            .table("github_profiles")
            .select("*")
            .eq("profile_id", profile_id)
            .single()
            .execute()
        )
    except Exception:
        github_profile_response = None

    github_profile = (
        github_profile_response.data if github_profile_response else None
    )

    # Enforce a minimum cooldown between syncs.
    if github_profile and github_profile.get("last_synced_at"):
        last_synced = github_profile["last_synced_at"]
        try:
            last_synced_dt = datetime.fromisoformat(
                str(last_synced).replace("Z", "+00:00")
            )
        except ValueError:
            last_synced_dt = None
        if last_synced_dt:
            elapsed = datetime.now(timezone.utc) - last_synced_dt.astimezone(timezone.utc)
            if elapsed < timedelta(seconds=SYNC_COOLDOWN_SECONDS):
                remaining = max(0, int(SYNC_COOLDOWN_SECONDS - elapsed.total_seconds()))
                raise HTTPException(
                    status_code=429,
                    detail=f"GitHub data was just synced. Try again in {remaining} seconds.",
                )

    previous_repo_freshness = _load_repo_freshness_snapshot(
        github_profile["id"] if github_profile else None
    )

    # Fetch and normalize GitHub evidence in a single pass.
    try:
        result = collect_github_evidence(provider_token)
    except GitHubAPIError as error:
        raise HTTPException(
            status_code=error.status_code or 500,
            detail=str(error),
        )

    if not result.get("evidence"):
        raise HTTPException(
            status_code=401,
            detail="GitHub authorization invalid or revoked",
        )

    user_data = result["user"]
    repos = result["repos"]
    activity = result["activity"]
    evidence = result["evidence"]

    now = datetime.now(timezone.utc).isoformat()

    # Upsert the github_profiles row.
    github_profile_id = github_profile["id"] if github_profile else None
    if github_profile_id:
        try:
            supabase.table("github_profiles").update(
                {
                    "github_user_id": user_data.get("id"),
                    "username": user_data.get("login") or "",
                    "profile_bio": evidence.get("profile_bio"),
                    "avatar_url": user_data.get("avatar_url"),
                    "last_synced_at": now,
                    "updated_at": now,
                }
            ).eq("id", github_profile_id).execute()
        except Exception as error:
            raise HTTPException(
                status_code=500,
                detail=f"Could not save GitHub profile: {str(error)}",
            )
    else:
        try:
            created = (
                supabase.table("github_profiles")
                .upsert(
                    {
                        "profile_id": profile_id,
                        "github_user_id": user_data.get("id"),
                        "username": user_data.get("login") or "",
                        "profile_bio": evidence.get("profile_bio"),
                        "avatar_url": user_data.get("avatar_url"),
                        "last_synced_at": now,
                    },
                    on_conflict="profile_id",
                )
                .execute()
            )
            github_profile_id = created.data[0]["id"] if created.data else None
        except Exception as error:
            raise HTTPException(
                status_code=500,
                detail=f"Could not save GitHub profile: {str(error)}",
            )

    if not github_profile_id:
        raise HTTPException(
            status_code=500,
            detail="Could not save GitHub profile",
        )

    detected_events = detect_repo_pushed(
        github_profile_id,
        repos,
        previous_repo_freshness,
    )

    # Upsert repositories (no duplicates via (github_profile_id, github_repo_id)).
    # Languages are already fetched once by collect_github_evidence.
    for repo in repos:
        try:
            supabase.table("github_repositories").upsert(
                {
                    "github_profile_id": github_profile_id,
                    "github_repo_id": repo.get("github_repo_id"),
                    "name": repo.get("name") or "",
                    "description": repo.get("description") or None,
                    "languages": repo.get("languages") or {},
                    "topics": repo.get("topics") or [],
                    "stars": int(repo.get("stars") or 0),
                    "forks": int(repo.get("forks") or 0),
                    "is_fork": bool(repo.get("is_fork") or False),
                    "is_private": bool(repo.get("is_private") or False),
                    "repo_created_at": repo.get("repo_created_at"),
                    "repo_updated_at": repo.get("repo_updated_at"),
                    "updated_at": now,
                },
                on_conflict="github_profile_id,github_repo_id",
            ).execute()
        except Exception as error:
            raise HTTPException(
                status_code=500,
                detail=f"Could not save GitHub repositories: {str(error)}",
            )

    # Remove stale repos belonging to this profile that are no longer present.
    try:
        existing_repos_response = (
            supabase
            .table("github_repositories")
            .select("github_repo_id")
            .eq("github_profile_id", github_profile_id)
            .execute()
        )
        existing_ids = [
            int(r["github_repo_id"])
            for r in (existing_repos_response.data or [])
        ]
        fetched_ids = set(int(r.get("github_repo_id")) for r in repos if r.get("github_repo_id") is not None)
        for stale_id in existing_ids:
            if stale_id not in fetched_ids:
                supabase.table("github_repositories").delete().eq(
                    "github_profile_id", github_profile_id
                ).eq("github_repo_id", stale_id).execute()
    except Exception:
        pass

    # Upsert the rolling 30-day activity bucket.
    try:
        activity_period_start = (
            datetime.now(timezone.utc) - timedelta(days=30)
        ).date().isoformat()
        activity_period_end = datetime.now(timezone.utc).date().isoformat()
        supabase.table("github_activity").upsert(
            {
                "github_profile_id": github_profile_id,
                "period_start": activity_period_start,
                "period_end": activity_period_end,
                "commits_count": activity.get("commits_30d", 0),
                "prs_count": activity.get("prs_30d", 0),
                "issues_count": activity.get("issues_30d", 0),
                "active_days": activity.get("active_days_30d", 0),
            },
            on_conflict="github_profile_id,period_start",
        ).execute()
    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=f"Could not save GitHub activity: {str(error)}",
        )

    # Persist detected events to github_detected_events.
    events_persisted = False
    if detected_events:
        try:
            events_to_insert = []
            now_iso = datetime.now(timezone.utc).isoformat()
            for event in detected_events:
                events_to_insert.append({
                    "github_profile_id": github_profile_id,
                    "github_repo_id": event.get("github_repo_id"),
                    "event_type": event.get("event_type"),
                    "event_id": event.get("event_id"),
                    "event_timestamp": event.get("event_timestamp"),
                    "observed_at": now_iso,
                    "dedup_key": event.get("dedup_key"),
                    "payload": event.get("payload", {}),
                })
            if events_to_insert:
                supabase.table("github_detected_events").upsert(
                    events_to_insert,
                    on_conflict="github_profile_id,dedup_key",
                ).execute()
                events_persisted = True
        except Exception:
            # Log but don't fail the sync if event persistence fails
            pass

    if detected_events and events_persisted:
        latest_event = max(
            detected_events,
            key=lambda event: event.get("event_timestamp") or "",
        )
        try:
            supabase.table("sync_checkpoints").upsert(
                {
                    "github_profile_id": github_profile_id,
                    "checkpoint_type": "github_sync",
                    "last_event_id": latest_event.get("event_id"),
                    "last_event_at": latest_event.get("event_timestamp"),
                    "updated_at": datetime.now(timezone.utc).isoformat(),
                },
                on_conflict="github_profile_id,checkpoint_type",
            ).execute()
        except Exception:
            # Log but don't fail the sync if checkpoint update fails
            pass

    if detected_events:
        try:
            profile_context = _load_profile_context(profile_id)
            github_profile_context = _load_github_profile_context(github_profile_id)
            if github_profile_context:
                await _generate_and_store_leads_for_events(
                    profile_context,
                    github_profile_context,
                    repos,
                    activity,
                    _load_latest_skill_gap(profile_id),
                    _load_latest_roadmap(profile_id),
                    detected_events,
                )
        except Exception:
            # Lead generation must never make sync fail.
            pass

    return {
        "message": "GitHub data synchronized",
        "connected": True,
        "synced": True,
        "evidence": evidence,
        "last_synced_at": now,
        "detected_events": detected_events,
    }


@app.post("/api/profile/leads/generate")
async def generate_profile_leads(
    credentials: HTTPAuthorizationCredentials = Depends(security),
):
    user = get_user_from_token(credentials.credentials)

    if not user:
        raise HTTPException(
            status_code=401,
            detail="User not authenticated",
        )

    profile = _resolve_profile_for_user(user)
    profile_id = profile["id"]

    try:
        github_profile_response = (
            supabase
            .table("github_profiles")
            .select("id")
            .eq("profile_id", profile_id)
            .single()
            .execute()
        )
    except Exception:
        github_profile_response = None

    if not github_profile_response or not github_profile_response.data:
        return {
            "generated": [],
            "message": "No GitHub profile connected.",
        }

    github_profile = _load_github_profile_context(github_profile_response.data["id"])

    if not github_profile:
        return {
            "generated": [],
            "message": "No GitHub profile connected.",
        }

    github_profile_id = github_profile["id"]
    detected_events = _load_repo_push_events(github_profile_id)
    if not detected_events:
        return {
            "generated": [],
            "message": "No repo_pushed events available for lead generation.",
        }

    generated = await _generate_and_store_leads_for_events(
        _load_profile_context(profile_id),
        github_profile,
        _load_github_repositories(github_profile_id),
        _load_github_activity(github_profile_id),
        _load_latest_skill_gap(profile_id),
        _load_latest_roadmap(profile_id),
        detected_events,
    )

    return {
        "generated": [
            _serialize_lead_record(item["lead"], item["draft"], item["event"], item["repository"])
            for item in generated
        ],
        "count": len(generated),
    }


@app.get("/api/profile/leads")
def get_profile_leads(
    credentials: HTTPAuthorizationCredentials = Depends(security),
):
    user = get_user_from_token(credentials.credentials)

    if not user:
        raise HTTPException(
            status_code=401,
            detail="User not authenticated",
        )

    profile = _resolve_profile_for_user(user)
    profile_id = profile["id"]

    leads_response = (
        supabase
        .table("leads")
        .select("*")
        .eq("profile_id", profile_id)
        .order("generated_at", desc=True)
        .limit(50)
        .execute()
    )
    lead_rows = leads_response.data or []
    if not lead_rows:
        return {"leads": []}

    lead_ids = [row["id"] for row in lead_rows if row.get("id")]
    detected_event_ids = [
        row["detected_event_id"] for row in lead_rows if row.get("detected_event_id")
    ]

    draft_rows = []
    event_rows = []
    repository_rows = []

    if lead_ids:
        draft_rows = (
            supabase
            .table("lead_drafts")
            .select("*")
            .in_("lead_id", lead_ids)
            .execute()
            .data
            or []
        )

    if detected_event_ids:
        event_rows = (
            supabase
            .table("github_detected_events")
            .select("*")
            .in_("id", detected_event_ids)
            .execute()
            .data
            or []
        )

        repo_ids = [
            row["github_repo_id"]
            for row in event_rows
            if row.get("github_repo_id") is not None
        ]
        if repo_ids:
            repository_rows = (
                supabase
                .table("github_repositories")
                .select("*")
                .eq("github_profile_id", lead_rows[0]["github_profile_id"])
                .in_("github_repo_id", repo_ids)
                .execute()
                .data
                or []
            )

    draft_by_lead_id = {
        row["lead_id"]: row for row in draft_rows if row.get("lead_id")
    }
    event_by_id = {row["id"]: row for row in event_rows if row.get("id")}
    repo_by_id = {
        str(row["github_repo_id"]): row
        for row in repository_rows
        if row.get("github_repo_id") is not None
    }

    return {
        "leads": [
            _serialize_lead_record(
                lead,
                draft_by_lead_id.get(lead["id"]),
                event_by_id.get(lead.get("detected_event_id")),
                repo_by_id.get(str(event_by_id.get(lead.get("detected_event_id"), {}).get("github_repo_id")))
                if lead.get("detected_event_id")
                else None,
            )
            for lead in lead_rows
        ]
    }


@app.get("/api/profile/leads/{lead_id}")
def get_profile_lead(
    lead_id: str,
    credentials: HTTPAuthorizationCredentials = Depends(security),
):
    user = get_user_from_token(credentials.credentials)

    if not user:
        raise HTTPException(
            status_code=401,
            detail="User not authenticated",
        )

    profile = _resolve_profile_for_user(user)
    profile_id = profile["id"]

    lead_response = (
        supabase
        .table("leads")
        .select("*")
        .eq("id", lead_id)
        .eq("profile_id", profile_id)
        .maybe_single()
        .execute()
    )

    lead = lead_response.data if lead_response and lead_response.data else None
    if not lead:
        raise HTTPException(
            status_code=404,
            detail="Lead not found",
        )

    draft_response = (
        supabase
        .table("lead_drafts")
        .select("*")
        .eq("lead_id", lead_id)
        .maybe_single()
        .execute()
    )
    event = None
    repository = None

    if lead.get("detected_event_id"):
        event_response = (
            supabase
            .table("github_detected_events")
            .select("*")
            .eq("id", lead["detected_event_id"])
            .maybe_single()
            .execute()
        )
        event = event_response.data if event_response and event_response.data else None

        if event and event.get("github_repo_id") is not None:
            repo_response = (
                supabase
                .table("github_repositories")
                .select("*")
                .eq("github_profile_id", lead["github_profile_id"])
                .eq("github_repo_id", event["github_repo_id"])
                .maybe_single()
                .execute()
            )
            repository = (
                repo_response.data if repo_response and repo_response.data else None
            )

    return {
        "lead": _serialize_lead_record(
            lead,
            draft_response.data if draft_response and draft_response.data else None,
            event,
            repository,
        )
    }


@app.post("/api/profile/leads/{lead_id}/review")
def review_profile_lead(
    lead_id: str,
    payload: LeadReviewPayload,
    credentials: HTTPAuthorizationCredentials = Depends(security),
):
    user = get_user_from_token(credentials.credentials)

    if not user:
        raise HTTPException(
            status_code=401,
            detail="User not authenticated",
        )

    profile = _resolve_profile_for_user(user)
    profile_id = profile["id"]

    lead_response = (
        supabase
        .table("leads")
        .select("*")
        .eq("id", lead_id)
        .eq("profile_id", profile_id)
        .maybe_single()
        .execute()
    )
    lead = lead_response.data if lead_response and lead_response.data else None
    if not lead:
        raise HTTPException(
            status_code=404,
            detail="Lead not found",
        )

    if payload.action == "delete":
        supabase.table("leads").delete().eq("id", lead_id).eq("profile_id", profile_id).execute()
        return {"message": "Lead deleted"}

    draft_response = (
        supabase
        .table("lead_drafts")
        .select("*")
        .eq("lead_id", lead_id)
        .maybe_single()
        .execute()
    )
    draft = draft_response.data if draft_response and draft_response.data else None

    if payload.action == "edit":
        if not payload.draft_body:
            raise HTTPException(
                status_code=400,
                detail="draft_body is required for edit actions",
            )
        if not draft:
            raise HTTPException(
                status_code=404,
                detail="Lead draft not found",
            )
        draft_update = (
            supabase
            .table("lead_drafts")
            .update(
                {
                    "body": payload.draft_body,
                    "status": "edited",
                    "updated_at": datetime.now(timezone.utc).isoformat(),
                }
            )
            .eq("lead_id", lead_id)
            .execute()
        )
        updated_draft = draft_update.data[0] if draft_update.data else draft
        return {
            "lead": _serialize_lead_record(lead, updated_draft, None, None),
        }

    status_map = {
        "approve": ("qualified", "approved"),
        "dismiss": ("dismissed", "rejected"),
        "converted": ("converted", "approved"),
    }
    lead_status, draft_status = status_map[payload.action]

    lead_update = (
        supabase
        .table("leads")
        .update(
            {
                "status": lead_status,
                "updated_at": datetime.now(timezone.utc).isoformat(),
            }
        )
        .eq("id", lead_id)
        .eq("profile_id", profile_id)
        .execute()
    )
    updated_lead = lead_update.data[0] if lead_update.data else lead

    updated_draft = draft
    if draft:
        draft_update = (
            supabase
            .table("lead_drafts")
            .update(
                {
                    "status": draft_status,
                    "updated_at": datetime.now(timezone.utc).isoformat(),
                }
            )
            .eq("lead_id", lead_id)
            .execute()
        )
        if draft_update.data:
            updated_draft = draft_update.data[0]

    return {
        "lead": _serialize_lead_record(updated_lead, updated_draft, None, None),
    }


@app.delete("/api/profile/leads/{lead_id}")
def delete_profile_lead(
    lead_id: str,
    credentials: HTTPAuthorizationCredentials = Depends(security),
):
    user = get_user_from_token(credentials.credentials)

    if not user:
        raise HTTPException(
            status_code=401,
            detail="User not authenticated",
        )

    profile = _resolve_profile_for_user(user)
    profile_id = profile["id"]

    lead_response = (
        supabase
        .table("leads")
        .select("id")
        .eq("id", lead_id)
        .eq("profile_id", profile_id)
        .maybe_single()
        .execute()
    )
    if not lead_response.data:
        raise HTTPException(
            status_code=404,
            detail="Lead not found",
        )

    supabase.table("leads").delete().eq("id", lead_id).eq("profile_id", profile_id).execute()

    return {"message": "Lead deleted"}


@app.get("/api/profile/roadmap/progress")
def get_roadmap_progress(
    credentials: HTTPAuthorizationCredentials = Depends(security),
):
    access_token = credentials.credentials

    user = get_user_from_token(access_token)

    if not user:
        raise HTTPException(
            status_code=401,
            detail="User not authenticated",
        )

    try:
        profile_response = (
            supabase
            .table("profiles")
            .select("id")
            .eq("auth_user_id", user.id)
            .single()
            .execute()
        )
    except Exception:
        raise HTTPException(
            status_code=404,
            detail="Profile not found",
        )

    if not profile_response.data:
        raise HTTPException(
            status_code=404,
            detail="Profile not found",
        )

    profile_id = profile_response.data["id"]

    progress_response = (
        supabase
        .table("roadmap_progress")
        .select("skill, completed, completed_at")
        .eq("profile_id", profile_id)
        .execute()
    )

    return {
        "skills": progress_response.data or [],
    }


@app.post("/api/profile/roadmap/progress")
def toggle_roadmap_progress(
    payload: RoadmapProgressPayload,
    credentials: HTTPAuthorizationCredentials = Depends(security),
):
    access_token = credentials.credentials

    user = get_user_from_token(access_token)

    if not user:
        raise HTTPException(
            status_code=401,
            detail="User not authenticated",
        )

    try:
        profile_response = (
            supabase
            .table("profiles")
            .select("id")
            .eq("auth_user_id", user.id)
            .single()
            .execute()
        )
    except Exception:
        raise HTTPException(
            status_code=404,
            detail="Profile not found",
        )

    if not profile_response.data:
        raise HTTPException(
            status_code=404,
            detail="Profile not found",
        )

    profile_id = profile_response.data["id"]

    existing_response = (
    supabase
    .table("roadmap_progress")
    .select("id, skill, completed, completed_at")
    .eq("profile_id", profile_id)
    .eq("skill", payload.skill)
    .maybe_single()
    .execute()
    )

    existing = existing_response.data if existing_response else None

    if existing:
        new_completed = not existing["completed"]

        update_data = {"completed": new_completed}
        if new_completed:
            update_data["completed_at"] = datetime.now(timezone.utc).isoformat()
        else:
            update_data["completed_at"] = None

        response = (
            supabase
            .table("roadmap_progress")
            .update(update_data)
            .eq("id", existing["id"])
            .execute()
        )
    else:
        response = (
            supabase
            .table("roadmap_progress")
            .insert({
                "profile_id": profile_id,
                "skill": payload.skill,
                "completed": True,
                "completed_at": datetime.now(timezone.utc).isoformat(),
            })
            .execute()
        )

    if not response.data:
        raise HTTPException(
            status_code=500,
            detail="Could not update roadmap progress",
        )

    updated = response.data[0]

    return {
        "skill": updated["skill"],
        "completed": updated["completed"],
        "completed_at": updated.get("completed_at"),
    }

