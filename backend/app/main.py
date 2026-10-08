from fastapi import FastAPI, Depends, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from typing import Optional, List

from app.database import supabase
from app import schemas
from app.auth import get_current_user
from pydantic import BaseModel

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

# Temporary schema for Swagger login
class LoginRequest(BaseModel):
    email: str
    password: str

@app.post("/api/login")
def login_for_token(credentials: LoginRequest):
    try:
        # Ask Supabase to log this user in
        response = supabase.auth.sign_in_with_password({
            "email": credentials.email,
            "password": credentials.password
        })
        # Return the JWT access token
        return {"access_token": response.session.access_token}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.get("/api/jobs/matches", response_model=List[schemas.JobResponse])
def get_personalized_matches(
    current_user: dict = Depends(get_current_user)
):
    # 1. Fetch the authenticated user's profile from Supabase
    profile_res = supabase.table("user_profiles").select("*").eq("id", current_user["id"]).execute()
    
    if not profile_res.data:
        raise HTTPException(status_code=404, detail="Profile not found. Please create a profile first.")
    
    profile = profile_res.data[0]
    
    # 2. Query the data mart using the user's specific constraints
    query = supabase.schema("mart").table("jobs").select("*").eq("is_open", True)
    
    if profile.get("education_level_years"):
        query = query.lte("education_level_years", profile["education_level_years"])
        
    if profile.get("experience_years") is not None:
        query = query.lte("experience_years", profile["experience_years"])
        
    # (Optional) Uncomment and change "location" to your actual column name if it exists:
    # if profile.get("preferred_location"):
    #     query = query.ilike("city", f"%{profile['preferred_location']}%")
        
    response = query.order("scraped_at", desc=True).limit(50).execute()
    return response.data