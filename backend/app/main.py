from fastapi import FastAPI, Depends, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from typing import Optional, List
import re

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

PUNJAB_DISTRICTS = [
    "Attock", "Bahawalnagar", "Bahawalpur", "Bhakkar", "Chakwal", "Chiniot",
    "Dera Ghazi Khan", "Faisalabad", "Gujranwala", "Gujrat", "Hafizabad",
    "Jhang", "Jhelum", "Kasur", "Khanewal", "Khushab", "Kot Addu", "Lahore",
    "Layyah", "Lodhran", "Mandi Bahauddin", "Mianwali", "Murree", "Muzaffargarh",
    "Nankana Sahib", "Narowal", "Okara", "Pakpattan", "Rahim Yar Khan", "Rajanpur",
    "Rawalpindi", "Sahiwal", "Sargodha", "Sheikhupura", "Sialkot", "Talagang",
    "Taunsa", "Toba Tek Singh", "Vehari", "Wazirabad"
]

@app.get("/api/locations", response_model=List[str])
def get_locations():
    return PUNJAB_DISTRICTS

@app.get("/")
def read_root():
    return {"status": "Backend connected to Supabase Data Mart"}

# Maps degree keywords to education years
EDU_KEYWORD_MAP = [
    (r'ph\.?d', 18),
    (r'm\.?phil|mphil', 18),
    (r'ms\b|m\.?s\.\b', 18),
    (r"master'?s?|m\.?a\b|m\.?sc\b|mba\b|m\.?com\b|med\b|llm\b", 16),
    (r"bachelor'?s?|b\.?s\.?\b|b\.?e\.?\b|b\.?sc\b|b\.?a\b|b\.?com\b|llb\b|bba\b", 14),
    (r'intermediate|f\.?a\b|f\.?sc\b|hssc|12th', 12),
    (r'matric|ssc|10th', 10),
]

def _extract_education(text: str) -> Optional[int]:
    if not text:
        return None
    t = text.lower()
    found = []
    for pattern, years in EDU_KEYWORD_MAP:
        if re.search(pattern, t):
            found.append(years)
    return min(found) if found else None


def _extract_experience(text: str) -> Optional[int]:
    if not text:
        return None
    text = text.lower()
    patterns = [
        r'(\d+)\s*-?year[s]?\s*(?:of\s*)?(?:relevant\s*)?(?:professional\s*)?experience',
        r'experience\s*of\s*(\d+)\s*-?year',
        r'with\s*(\d+)\s*-?year[s]?',
    ]
    matches = []
    for pattern in patterns:
        for m in re.finditer(pattern, text):
            matches.append(int(m.group(1)))
    return min(matches) if matches else None


def _score_job(job: dict, profile: dict) -> tuple[int, list[str]]:
    score = 0
    breakdown = []
    user_edu = profile.get("education_level_years") or 0
    user_exp = profile.get("experience_years") or 0
    user_loc = (profile.get("preferred_location") or "all").lower()

    # Education (40%)
    job_edu = job.get("education_level_years")
    if job_edu is None:
        job_edu = _extract_education(job.get("description") or "")
        if job_edu is not None:
            try:
                supabase.schema("mart").table("jobs").update({"education_level_years": job_edu}).eq("job_id", job["job_id"]).execute()
                job["education_level_years"] = job_edu
            except Exception:
                pass

    if job_edu is None:
        score += 40
        breakdown.append("No specific education requirement")
    elif user_edu >= job_edu:
        score += 40
        breakdown.append("Matches your education level")
    else:
        return 0, [f"Requires {job_edu} years of education"]

    # Experience (40%)
    job_exp = job.get("experience_years")
    if job_exp is None:
        job_exp = _extract_experience(job.get("description") or "")
        if job_exp is not None:
            # Persist extracted value back to Supabase
            try:
                supabase.schema("mart").table("jobs").update({"experience_years": job_exp}).eq("job_id", job["job_id"]).execute()
                job["experience_years"] = job_exp
            except Exception:
                pass

    if job_exp is None or job_exp == 0:
        score += 40
        breakdown.append("No specific experience requirement")
    elif user_exp >= job_exp:
        score += 40
        breakdown.append("Matches your experience level")
    else:
        return 0, [f"Requires {job_exp} year(s) of experience"]

    # Location (20%)
    job_district = (job.get("district") or "").lower()
    if user_loc == "all" or not job_district:
        score += 20
        breakdown.append("Available across Pakistan")
    elif "all pakistan" in job_district:
        score += 20
        breakdown.append("Available across Pakistan")
    elif user_loc in job_district or job_district in user_loc:
        score += 20
        breakdown.append("Location aligns with your preference")
    else:
        breakdown.append(f"Located in {job.get('district', 'another district')}, not your preferred area")

    # Degree keyword filter + bonus (+30)
    degree_keyword = (profile.get("degree_keyword") or "").strip().lower()
    if degree_keyword:
        qualifications = job.get("qualifications") or ""
        if isinstance(qualifications, list):
            qualifications = " ".join(str(q) for q in qualifications)
        searchable = " ".join(filter(None, [
            qualifications,
            job.get("description") or "",
        ])).lower()
        if re.search(r'\b' + re.escape(degree_keyword) + r'\b', searchable):
            score += 30
            breakdown.append(f"Matches your specific field: {profile.get('degree_keyword')}")
        else:
            return 0, [f"Does not match your field: {profile.get('degree_keyword')}"]

    return min(score, 100), breakdown


@app.get("/api/jobs/matches", response_model=List[schemas.JobResponse])
def get_personalized_matches(
    current_user: dict = Depends(get_current_user)
):
    profile_res = supabase.table("user_profiles").select("*").eq("id", current_user["id"]).execute()

    if not profile_res.data:
        raise HTTPException(status_code=404, detail="Profile not found. Please create a profile first.")

    profile = profile_res.data[0]

    response = supabase.schema("mart").table("jobs").select("*").eq("is_open", True).order("scraped_at", desc=True).limit(200).execute()

    scored = []
    for job in response.data:
        match_score, match_breakdown = _score_job(job, profile)
        if match_score >= 50:
            job["match_score"] = match_score
            job["match_breakdown"] = match_breakdown
            scored.append(job)

    scored.sort(key=lambda j: j["match_score"], reverse=True)
    return scored

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

