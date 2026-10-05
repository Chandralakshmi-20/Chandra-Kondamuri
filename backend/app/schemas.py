
from datetime import date, datetime, time
from typing import List, Optional

from pydantic import BaseModel, ConfigDict, EmailStr


# ============================================================
# AUTH
# ============================================================

class RequestOTP(BaseModel):
    email: EmailStr


class VerifyOTP(BaseModel):
    email: EmailStr
    otp: str


# Backward-compatible aliases
OTPRequest = RequestOTP
OTPVerify = VerifyOTP


# ============================================================
# USER / EMPLOYEE
# ============================================================

class UserBase(BaseModel):
    full_name: str
    email: EmailStr
    phone: Optional[str] = None
    department: Optional[str] = None
    designation: Optional[str] = None
    joining_date: Optional[date] = None
    date_of_birth: Optional[date] = None


class UserCreate(UserBase):
    role: str = "employee"


class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    department: Optional[str] = None
    designation: Optional[str] = None
    joining_date: Optional[date] = None
    date_of_birth: Optional[date] = None


class UserOut(BaseModel):
    id: int
    full_name: str
    email: EmailStr
    role: str
    phone: Optional[str] = None
    department: Optional[str] = None
    designation: Optional[str] = None
    joining_date: Optional[date] = None
    date_of_birth: Optional[date] = None
    profile_image_url: Optional[str] = None
    is_active: bool = True
    created_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


# ============================================================
# TOKEN RESPONSE
# ============================================================

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut


# ============================================================
# EMPLOYEE MANAGEMENT
# ============================================================

class EmployeeCreate(BaseModel):
    full_name: str
    email: EmailStr
    phone: Optional[str] = None
    department: Optional[str] = None
    designation: Optional[str] = None
    joining_date: Optional[date] = None
    date_of_birth: Optional[date] = None
    role: str = "employee"


class EmployeeUpdate(BaseModel):
    full_name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    department: Optional[str] = None
    designation: Optional[str] = None
    joining_date: Optional[date] = None
    date_of_birth: Optional[date] = None


class EmployeeStatusUpdate(BaseModel):
    is_active: bool


# ============================================================
# PROFILE
# ============================================================

class ProfileUpdate(BaseModel):
    """
    Employee/HR can update only these fields.

    Department, designation and joining_date are intentionally
    excluded because they must be read-only in the profile.
    """

    full_name: Optional[str] = None
    phone: Optional[str] = None
    date_of_birth: Optional[date] = None
    profile_image_url: Optional[str] = None


# ============================================================
# LEAVE MANAGEMENT
# ============================================================

class LeaveCreate(BaseModel):
    start_date: date
    end_date: date
    reason: str


class LeaveUpdate(BaseModel):
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    reason: Optional[str] = None


class LeaveStatusUpdate(BaseModel):
    status: str
    hr_comment: Optional[str] = None


class LeaveOut(BaseModel):
    id: int
    employee_id: int
    employee_name: str
    employee_email: EmailStr
    start_date: date
    end_date: date
    reason: str
    status: str
    hr_comment: Optional[str] = None
    created_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


# ============================================================
# WORK REPORTS
# ============================================================

class WorkReportCreate(BaseModel):
    project_id: Optional[int] = None
    start_date: date
    title: str
    description: str
    tag: str
    completion_percentage: Optional[float] = 0


class WorkReportUpdate(BaseModel):
    project_id: Optional[int] = None
    start_date: Optional[date] = None
    title: Optional[str] = None
    description: Optional[str] = None
    tag: Optional[str] = None
    completion_percentage: Optional[float] = None


class WorkReportOut(BaseModel):
    id: int
    employee_id: int
    employee_name: Optional[str] = None
    project_id: Optional[int] = None
    start_date: date
    title: str
    description: str
    tag: str
    completion_percentage: Optional[float] = 0
    status: Optional[str] = None
    created_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


# ============================================================
# PROJECTS
# ============================================================

class ProjectCreate(BaseModel):
    name: str
    description: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    status: Optional[str] = "not_started"
    completion_percentage: float = 0

    # One project can be assigned to multiple employees
    assigned_employee_ids: List[int] = []


class ProjectUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    status: Optional[str] = None
    completion_percentage: Optional[float] = None

    # None = don't change assignments
    # [] = remove all assignments
    # [1,2,3] = assign employees 1,2,3
    assigned_employee_ids: Optional[List[int]] = None


class ProjectProgressUpdate(BaseModel):
    completion_percentage: float


class ProjectOut(BaseModel):
    id: int
    name: str
    description: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    status: Optional[str] = None
    completion_percentage: float = 0

    # Multiple assigned employees
    assigned_employee_ids: List[int] = []

    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)

# ============================================================
# NOTIFICATIONS
# ============================================================

class NotificationCreate(BaseModel):
    title: str
    message: str
    notification_type: str = "general"
    notification_date: date
    is_active: bool = True


class NotificationOut(BaseModel):
    id: int
    user_id: int
    title: str
    message: str
    notification_type: str
    notification_date: date
    is_active: bool
    is_read: bool
    created_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class NotificationReadUpdate(BaseModel):
    is_read: bool


class NotificationStatusUpdate(BaseModel):
    is_active: bool

# ============================================================
# ATTENDANCE
# ============================================================

class AttendanceCreate(BaseModel):
    attendance_date: Optional[date] = None
    check_in: Optional[time] = None
    check_out: Optional[time] = None
    status: Optional[str] = "present"
    remarks: Optional[str] = None


class AttendanceUpdate(BaseModel):
    check_in: Optional[time] = None
    check_out: Optional[time] = None
    status: Optional[str] = None
    remarks: Optional[str] = None


class AttendanceOut(BaseModel):
    id: int
    employee_id: int
    employee_name: Optional[str] = None
    employee_email: Optional[EmailStr] = None
    attendance_date: date
    check_in: Optional[time] = None
    check_out: Optional[time] = None
    status: Optional[str] = None
    working_hours: Optional[float] = None
    remarks: Optional[str] = None
    created_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


# ============================================================
# ATTENDANCE CORRECTION
# ============================================================

class AttendanceCorrectionCreate(BaseModel):
    requested_check_in: Optional[time] = None
    requested_check_out: Optional[time] = None
    reason: str


class AttendanceCorrectionReview(BaseModel):
    status: str
    hr_comment: Optional[str] = None


class AttendanceCorrectionOut(BaseModel):
    id: int
    attendance_id: int
    employee_id: int
    requested_check_in: Optional[time] = None
    requested_check_out: Optional[time] = None
    reason: str
    status: str
    hr_comment: Optional[str] = None
    reviewed_by: Optional[int] = None
    reviewed_at: Optional[datetime] = None
    created_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)