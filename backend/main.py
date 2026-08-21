import os
from pydantic import BaseModel

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from supabase import create_client, Client
from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from pathlib import Path
from fastapi import UploadFile, File

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

class AssessmentPayload(BaseModel):
    career_goal: str
    target_role: str
    interests: list[str]
    skills: list[str]
    skill_confidence: dict[str, str]
    assessment_answers: dict[str, int]

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
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

    try:
        user_response = supabase.auth.get_user(access_token)
        user = user_response.user
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

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

    try:
        user_response = supabase.auth.get_user(access_token)
        user = user_response.user
    except Exception:
        raise HTTPException(
            status_code=401,
            detail="Invalid or expired token",
        )

    if not user:
        raise HTTPException(
            status_code=401,
            detail="User not authenticated",
        )

    profile_response = (
        supabase
        .table("profiles")
        .select("id")
        .eq("auth_user_id", user.id)
        .single()
        .execute()
    )

    if not profile_response.data:
        raise HTTPException(
            status_code=404,
            detail="Profile not found",
        )

    profile_id = profile_response.data["id"]

    supabase.table("profiles").update({
        "career_goal": payload.career_goal,
        "target_role": payload.target_role,
    }).eq("id", profile_id).execute()

    for interest in payload.interests:
        supabase.table("profile_interests").upsert(
        {
            "profile_id": profile_id,
            "interest": interest,
        },
        on_conflict="profile_id,interest",
    ).execute()

    for skill in payload.skills:
        supabase.table("profile_skills").upsert(
            {
                "profile_id": profile_id,
                "skill": skill,
                "confidence": payload.skill_confidence.get(skill, ""),
            },
            on_conflict="profile_id,skill",
        ).execute()

    for question_id, selected_answer in payload.assessment_answers.items():
        supabase.table("assessment_answers").upsert(
            {
                "profile_id": profile_id,
                "question_id": question_id,
                "selected_answer": selected_answer,
            },
            on_conflict="profile_id,question_id",
        ).execute()

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

    try:
        user_response = supabase.auth.get_user(access_token)
        user = user_response.user
    except Exception:
        raise HTTPException(
            status_code=401,
            detail="Invalid or expired token",
        )

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

    profile_response = (
        supabase
        .table("profiles")
        .select("id")
        .eq("auth_user_id", user.id)
        .single()
        .execute()
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


@app.get("/api/profile")
def get_profile(
    credentials: HTTPAuthorizationCredentials = Depends(security),
):
    access_token = credentials.credentials

    try:
        user_response = supabase.auth.get_user(access_token)
        user = user_response.user
    except Exception:
        raise HTTPException(
            status_code=401,
            detail="Invalid or expired token",
        )

    if not user:
        raise HTTPException(
            status_code=401,
            detail="User not authenticated",
        )

    profile_response = (
        supabase
        .table("profiles")
        .select("*")
        .eq("auth_user_id", user.id)
        .single()
        .execute()
    )

    if not profile_response.data:
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