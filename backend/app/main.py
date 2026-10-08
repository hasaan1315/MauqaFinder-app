from fastapi import FastAPI, Depends, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from typing import Optional, List

from app.database import supabase
from app import schemas
from app.auth import get_current_user

app = FastAPI(title="Mauka-Finder API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"status": "Backend connected to Supabase Data Mart"}

@app.get("/api/jobs", response_model=List[schemas.JobResponse])
def get_jobs(
    education_years: Optional[int] = Query(default=16, description="Max required education in years"),
    experience_years: Optional[int] = Query(default=None, description="Max required experience in years"),
    source: Optional[str] = Query(default=None, description="Filter by source: 'punjab' or 'njp'"),
    is_open_only: bool = Query(default=True, description="Only show non-expired jobs")
):
    # Query the 'jobs' view located inside the 'mart' schema
    query = supabase.schema("mart").table("jobs").select("*")

    # Apply filters based on the mart.jobs columns
    if is_open_only:
        query = query.eq("is_open", True)

    if education_years is not None:
        query = query.lte("education_level_years", education_years)

    if experience_years is not None:
        query = query.lte("experience_years", experience_years)

    if source in ["punjab", "njp"]:
        query = query.eq("source", source)

    # Order by the scraped_at timestamp, descending
    response = query.order("scraped_at", desc=True).limit(50).execute()
    
    return response.data

@app.post("/api/profiles", response_model=schemas.UserProfileResponse)
def upsert_user_profile(
    profile: schemas.UserProfileCreate,
    current_user: dict = Depends(get_current_user)  # <--- Injected dependency
):
    # Prepare the payload using the securely extracted UUID
    profile_data = profile.model_dump()
    profile_data["id"] = current_user["id"]
    
    # Upsert: Insert if it doesn't exist, update if it does
    response = supabase.table("user_profiles").upsert(profile_data).execute()
    
    if response.data:
        return response.data[0]
    raise HTTPException(status_code=400, detail="Failed to save profile")