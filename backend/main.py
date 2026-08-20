import os
from pydantic import BaseModel

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from supabase import create_client, Client
from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from pathlib import Path

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