from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime, time

class UserBase(BaseModel):
    email: EmailStr
    name: str

class UserCreate(UserBase):
    password: str
    role: str = "student" # admin, teacher, student
    
    # Optional detailed fields
    employee_id: Optional[str] = None
    department: Optional[str] = None
    roll_number: Optional[str] = None
    course: Optional[str] = None
    year_semester: Optional[str] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(UserBase):
    id: int
    role: str
    account_status: str = "active"
    image_url: str | None = None
    # detailed fields
    employee_id: str | None = None
    department: str | None = None
    roll_number: str | None = None
    course: str | None = None
    year_semester: str | None = None

    class Config:
        orm_mode = True

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None

class AttendanceCreate(BaseModel):
    user_id: int
    status: str
    subject_id: int | None = None

class AttendanceResponse(AttendanceCreate):
    id: int
    date: datetime

    class Config:
        orm_mode = True

class SubjectResponse(BaseModel):
    id: int
    name: str
    code: str
    department: str | None
    start_time: time | None = None
    end_time: time | None = None

    class Config:
        orm_mode = True

class DashboardStats(BaseModel):
    student_name: str
    roll_number: str | None
    department: str | None
    overall_attendance_percentage: float
    total_classes: int
    attended_classes: int
    eligibility_status: str # Eligible, Warning, Shortage
    subject_wise_attendance: List[dict] # {subject: str, total: int, attended: int, percentage: float}
    attendance_history: List[AttendanceResponse]

class BulkAttendanceRequest(BaseModel):
    subject_id: int
    student_ids: List[int]
    status: str # present, absent

class UserUpdateProfile(BaseModel):
    password: Optional[str] = None # Optional password reset
    employee_id: Optional[str] = None
    department: Optional[str] = None

