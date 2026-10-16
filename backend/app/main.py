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

# Mirrors mart.degree_rules from Supabase
EDU_KEYWORD_MAP = [
    (r'ca\)?\s*-\s*intermediate|chartered accountancy\s*\(?ca\)?\s*-?\s*intermediate', None),
    (r'phd|ph\.d\.?|doctorate|d\.phil|doctor of philosophy', 21),
    (r'ms|m\.s\.?|mphil|m\.phil\.?|master of philosophy|masters? in philosophy|llm|ll\.m\.?|master of laws', 18),
    (r'hons\.?|honou?rs', 16),
    (r'b\.?\s?sc\.?.{0,20}engineering|b\.?\s?sc\.?\s+engg\.?', 16),
    (r'bs|b\.s\.?|bscs|bsit|bba|be|b\.e\.?|b\.?\s?tech|b\.?\s?eng|b\.?\s?arch|b\.?\s?pharm|mbbs|bds|pharm-?d|dvm|llb|ll\.b\.?', 16),
    (r'masters?|msc|m\.sc\.?|ma|m\.a\.?|mcom|m\.com\.?|mcs|mit|mba|m\.b\.a\.?|med|m\.ed\.?|mpa|acca|acma|ca|chartered accountan(cy|t)|cost and management accountan(cy|t)', 16),
    (r'bachelors?|b\.?\s?sc\.?|b\.?\s?a\.?|b\.?\s?com\.?|adp|ade|associate degree', 14),
    (r'dae|d\.a\.e\.?|diploma of associate engineer(ing)?', 12),
    (r'fsc|f\.sc\.?|fa|f\.a\.?|ics|icom|i\.com\.?|hssc|intermediate|higher secondary|a[- ]?levels?', 12),
    (r'matric|matriculation|ssc|secondary school|o[- ]?levels?', 10),
    (r'middle', 8),
    (r'primary', 5),
]

def _extract_education(text: str) -> Optional[int]:
    if not text:
        return None
    t = text.lower()
    found = []
    
    for pattern, years in EDU_KEYWORD_MAP:
        if re.search(r'\b(?:' + pattern.lower() + r')\b', t):
            if years is not None:
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

    # --- 1. STRICT LOCATION FILTER ---
    job_district = (job.get("district") or "").lower()
    job_source = (job.get("source") or "").lower()

    # Check if the job is open province-wide or nation-wide
    is_general_location = (
        "all pakistan" in job_district or
        "all punjab" in job_district or
        "anywhere in punjab" in job_district or
        job_district == "punjab" or
        (not job_district and job_source == "njp")
    )

    if user_loc == "all" or is_general_location:
        score += 30
        breakdown.append("Available across Punjab / Pakistan")
    elif user_loc in job_district or job_district in user_loc:
        score += 30
        breakdown.append(f"Located in {profile.get('preferred_location')}")
    else:
        # STRICT KNOCKOUT: Job is in another specific district (e.g. Lahore)
        return 0, [f"Location ({job.get('district', 'N/A')}) does not match your preference ({profile.get('preferred_location')})"]

    # --- 2. Education (35% Max) ---
    job_edu = job.get("education_level_years")
    
    # If the database didn't provide a strict number, extract it from text fields
    if job_edu is None:
        qual_list = job.get("qualifications")
        if isinstance(qual_list, list):
            qual_list = " ".join(str(q) for q in qual_list)
            
        # Combine all possible fields where degree text might be hiding across PJP, PPSC, and NJP
        combined_text = " ".join(filter(None, [
            job.get("qualification_text"),  # Used by PPSC
            qual_list,                      # Used by NJP
            job.get("description")          # Used by PJP
        ]))
        job_edu = _extract_education(combined_text)

    if job_edu is None:
        score += 35
        breakdown.append("No specific education requirement")
    elif user_edu >= job_edu:
        score += 35
        breakdown.append("Matches your education level")
    else:
        breakdown.append(f"Requires {job_edu} yrs education (you have {user_edu})")

    # --- 3. Experience (35% Max) ---
    job_exp = job.get("experience_years")
    if job_exp is None:
        job_exp = _extract_experience(job.get("description") or "")

    if job_exp is None or job_exp == 0:
        score += 35
        breakdown.append("No specific experience requirement")
    elif user_exp >= job_exp:
        score += 35
        breakdown.append("Matches your experience level")
    else:
        breakdown.append(f"Requires {job_exp} yrs experience (you have {user_exp})")

    # --- 4. Degree Keyword Bonus (+10% Max) ---
    degree_keyword = (profile.get("degree_keyword") or "").strip().lower()
    if degree_keyword:
        qualifications = job.get("qualifications") or ""
        if isinstance(qualifications, list):
            qualifications = " ".join(str(q) for q in qualifications)
        searchable = " ".join(filter(None, [
            qualifications,
            job.get("qualification_text") or "",
            job.get("description") or "",
        ])).lower()
        if re.search(r'\b' + re.escape(degree_keyword) + r'\b', searchable):
            score += 10
            breakdown.append(f"Matches field: {profile.get('degree_keyword')}")

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
    query = supabase.schema("mart").table("jobs").select("*")

    if is_open_only:
        query = query.eq("is_open", True)

    if education_years is not None:
        query = query.lte("education_level_years", education_years)

    if experience_years is not None:
        query = query.lte("experience_years", experience_years)

    if source in ["punjab", "njp"]:
        query = query.eq("source", source)

    response = query.order("scraped_at", desc=True).limit(50).execute()
    return response.data

@app.get("/api/profiles/me", response_model=schemas.UserProfileResponse)
def get_my_profile(current_user: dict = Depends(get_current_user)):
    res = supabase.table("user_profiles").select("*").eq("id", current_user["id"]).execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="Profile not found")
    return res.data[0]

@app.post("/api/profiles", response_model=schemas.UserProfileResponse)
def upsert_user_profile(
    profile: schemas.UserProfileCreate,
    current_user: dict = Depends(get_current_user)
):
    profile_data = profile.model_dump()
    profile_data["id"] = current_user["id"]
    
    response = supabase.table("user_profiles").upsert(profile_data).execute()
    
    if response.data:
        return response.data[0]
    raise HTTPException(status_code=400, detail="Failed to save profile")

class LoginRequest(BaseModel):
    email: str
    password: str

@app.post("/api/login")
def login_for_token(credentials: LoginRequest):
    try:
        response = supabase.auth.sign_in_with_password({
            "email": credentials.email,
            "password": credentials.password
        })
        return {"access_token": response.session.access_token}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))