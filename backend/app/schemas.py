from pydantic import BaseModel, Field
from typing import Optional, Any
from datetime import datetime

class JobResponse(BaseModel):
    job_id: str
    source: str
    source_job_id: Any
    title: str
    employer: Optional[str] = None
    description: Optional[str] = None
    employment_type: Optional[str] = None
    grade: Optional[str] = None
    vacancies: Optional[int] = None
    experience_years: Optional[int] = None
    education_level_years: Optional[int] = None
    age_min: Optional[int] = None
    age_max: Optional[int] = None
    salary_min: Optional[int] = None
    salary_max: Optional[int] = None
    qualifications: Optional[Any] = None
    job_posted: Optional[str] = None
    last_date_to_apply: Optional[str] = None
    district: Optional[str] = None
    job_url: str
    is_active: bool
    is_open: Optional[bool] = None

    class Config:
        from_attributes = True

# Schema for when a user creates or updates their profile
class UserProfileCreate(BaseModel):
    full_name: Optional[str] = None
    education_level_years: int = Field(default=16, description="10=Matric, 12=Inter, 14=Bachelors, 16=Master/BS")
    experience_years: int = Field(default=0)
    preferred_location: Optional[str] = None

# Schema for returning the profile data back to the frontend
class UserProfileResponse(UserProfileCreate):
    id: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True