from datetime import datetime
from zoneinfo import ZoneInfo

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..database import get_db
from ..dependencies import get_current_user, require_roles
from ..models import (
    Attendance,
    AttendanceCorrectionRequest,
    User,
)
from ..schemas import (
    AttendanceCreate,
    AttendanceOut,
    AttendanceUpdate,
    AttendanceCorrectionCreate,
    AttendanceCorrectionOut,
    AttendanceCorrectionReview,
)


router = APIRouter(
    prefix="/attendance",
    tags=["Attendance"],
)


# ============================================================
# HELPER - CALCULATE WORKING HOURS
# ============================================================

def calculate_working_hours(
    attendance_date,
    check_in,
    check_out,
):
    if not check_in or not check_out:
        return None

    check_in_datetime = datetime.combine(
        attendance_date,
        check_in,
    )

    check_out_datetime = datetime.combine(
        attendance_date,
        check_out,
    )

    if check_out_datetime <= check_in_datetime:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Check-out time must be after check-in time",
        )

    duration = (
        check_out_datetime - check_in_datetime
    )

    return round(
        duration.total_seconds() / 3600,
        2,
    )


# ============================================================
# HELPER - CREATE ATTENDANCE RESPONSE
# ============================================================

def attendance_response(
    attendance: Attendance,
    employee: User,
):
    return {
        "id": attendance.id,
        "employee_id": attendance.employee_id,
        "employee_name": employee.full_name,
        "employee_email": employee.email,
        "attendance_date": attendance.attendance_date,
        "check_in": attendance.check_in,
        "check_out": attendance.check_out,
        "status": attendance.status,
        "working_hours": attendance.working_hours,
        "remarks": attendance.remarks,
        "created_at": attendance.created_at,
    }


# ============================================================
# CREATE ATTENDANCE - HR ONLY
# ============================================================

@router.post(
    "",
    response_model=AttendanceOut,
    status_code=status.HTTP_201_CREATED,
)
def create_attendance(
    data: AttendanceCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("hr")),
):
    employee = (
        db.query(User)
        .filter(
            User.id == data.employee_id,
            User.is_active == True,
        )
        .first()
    )

    if not employee:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Employee not found or inactive",
        )

    existing = (
        db.query(Attendance)
        .filter(
            Attendance.employee_id == data.employee_id,
            Attendance.attendance_date == data.attendance_date,
        )
        .first()
    )

    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Attendance already exists for this date",
        )

    attendance = Attendance(
        employee_id=data.employee_id,
        attendance_date=data.attendance_date,
        check_in=data.check_in,
        check_out=data.check_out,
        status=data.status,
        working_hours=data.working_hours,
        remarks=data.remarks,
    )

    db.add(attendance)
    db.commit()
    db.refresh(attendance)

    return attendance_response(
        attendance,
        employee,
    )


# ============================================================
# GET MY ATTENDANCE
# ============================================================

@router.get(
    "",
    response_model=list[AttendanceOut],
)
def get_my_attendance(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    records = (
        db.query(Attendance)
        .filter(
            Attendance.employee_id == current_user.id
        )
        .order_by(
            Attendance.attendance_date.desc(),
            Attendance.id.desc(),
        )
        .all()
    )

    return [
        attendance_response(
            attendance,
            current_user,
        )
        for attendance in records
    ]


# ============================================================
# GET ALL ATTENDANCE - HR ONLY
# ============================================================

@router.get(
    "/all",
    response_model=list[AttendanceOut],
)
def get_all_attendance(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("hr")),
):
    records = (
        db.query(Attendance)
        .order_by(
            Attendance.attendance_date.desc(),
            Attendance.id.desc(),
        )
        .all()
    )

    result = []

    for attendance in records:
        employee = (
            db.query(User)
            .filter(
                User.id == attendance.employee_id
            )
            .first()
        )

        if employee:
            result.append(
                attendance_response(
                    attendance,
                    employee,
                )
            )

    return result


# ============================================================
# CHECK IN
# HR + EMPLOYEE
# ============================================================

@router.post(
    "/check-in",
    response_model=AttendanceOut,
    status_code=status.HTTP_201_CREATED,
)
def employee_check_in(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role not in ["employee", "hr"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not allowed to check in",
        )

    india_time = datetime.now(
        ZoneInfo("Asia/Kolkata")
    )

    today = india_time.date()

    current_time = india_time.time().replace(
        microsecond=0
    )

    existing = (
        db.query(Attendance)
        .filter(
            Attendance.employee_id == current_user.id,
            Attendance.attendance_date == today,
        )
        .first()
    )

    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Attendance already exists for today",
        )

    attendance = Attendance(
        employee_id=current_user.id,
        attendance_date=today,
        check_in=current_time,
        check_out=None,
        status="present",
        working_hours=None,
        remarks=None,
    )

    db.add(attendance)
    db.commit()
    db.refresh(attendance)

    return attendance_response(
        attendance,
        current_user,
    )


# ============================================================
# CHECK OUT
# HR + EMPLOYEE
# ============================================================

@router.post(
    "/check-out",
    response_model=AttendanceOut,
)
def employee_check_out(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role not in ["employee", "hr"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not allowed to check out",
        )

    india_time = datetime.now(
        ZoneInfo("Asia/Kolkata")
    )

    today = india_time.date()

    current_time = india_time.time().replace(
        microsecond=0
    )

    attendance = (
        db.query(Attendance)
        .filter(
            Attendance.employee_id == current_user.id,
            Attendance.attendance_date == today,
        )
        .first()
    )

    if not attendance:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Please check in first",
        )

    if not attendance.check_in:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Check-in time is missing",
        )

    if attendance.check_out:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Already checked out for today",
        )

    working_hours = calculate_working_hours(
        today,
        attendance.check_in,
        current_time,
    )

    attendance.check_out = current_time
    attendance.working_hours = working_hours

    db.commit()
    db.refresh(attendance)

    return attendance_response(
        attendance,
        current_user,
    )


# ============================================================
# CREATE ATTENDANCE CORRECTION REQUEST - EMPLOYEE
# ============================================================

@router.post(
    "/correction-request/{attendance_id}",
    response_model=AttendanceCorrectionOut,
    status_code=status.HTTP_201_CREATED,
)
def create_correction_request(
    attendance_id: int,
    data: AttendanceCorrectionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role != "employee":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=(
                "Only employees can submit "
                "attendance correction requests"
            ),
        )

    attendance = (
        db.query(Attendance)
        .filter(
            Attendance.id == attendance_id,
            Attendance.employee_id == current_user.id,
        )
        .first()
    )

    if not attendance:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Attendance record not found",
        )

    if (
        data.requested_check_in is None
        and data.requested_check_out is None
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "Please provide a corrected "
                "check-in or check-out time"
            ),
        )

    if (
        data.requested_check_in is not None
        and data.requested_check_out is not None
        and data.requested_check_out <= data.requested_check_in
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Check-out time must be after check-in time",
        )

    if not data.reason or not data.reason.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Correction reason is required",
        )

    pending_request = (
        db.query(AttendanceCorrectionRequest)
        .filter(
            AttendanceCorrectionRequest.attendance_id
            == attendance.id,
            AttendanceCorrectionRequest.employee_id
            == current_user.id,
            AttendanceCorrectionRequest.status
            == "pending",
        )
        .first()
    )

    if pending_request:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "A correction request is already pending "
                "for this attendance"
            ),
        )

    correction = AttendanceCorrectionRequest(
        attendance_id=attendance.id,
        employee_id=current_user.id,
        requested_check_in=data.requested_check_in,
        requested_check_out=data.requested_check_out,
        reason=data.reason.strip(),
        status="pending",
    )

    db.add(correction)
    db.commit()
    db.refresh(correction)

    return correction


# ============================================================
# GET MY CORRECTION REQUESTS - EMPLOYEE
# ============================================================

@router.get(
    "/correction-requests/my",
    response_model=list[AttendanceCorrectionOut],
)
def get_my_correction_requests(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("employee")),
):
    requests = (
        db.query(AttendanceCorrectionRequest)
        .filter(
            AttendanceCorrectionRequest.employee_id
            == current_user.id
        )
        .order_by(
            AttendanceCorrectionRequest.created_at.desc(),
            AttendanceCorrectionRequest.id.desc(),
        )
        .all()
    )

    return requests


# ============================================================
# GET ALL CORRECTION REQUESTS - HR ONLY
# ============================================================

@router.get(
    "/correction-requests",
    response_model=list[AttendanceCorrectionOut],
)
def get_all_correction_requests(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("hr")),
):
    requests = (
        db.query(AttendanceCorrectionRequest)
        .order_by(
            AttendanceCorrectionRequest.created_at.desc(),
            AttendanceCorrectionRequest.id.desc(),
        )
        .all()
    )

    return requests


# ============================================================
# REVIEW CORRECTION REQUEST - HR ONLY
# ============================================================

@router.put(
    "/correction-requests/{request_id}/review",
    response_model=AttendanceCorrectionOut,
)
def review_correction_request(
    request_id: int,
    data: AttendanceCorrectionReview,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("hr")),
):
    correction = (
        db.query(AttendanceCorrectionRequest)
        .filter(
            AttendanceCorrectionRequest.id == request_id
        )
        .first()
    )

    if not correction:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Correction request not found",
        )

    if correction.status != "pending":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "This correction request has "
                "already been reviewed"
            ),
        )

    requested_status = (
        data.status.strip().lower()
    )

    if requested_status not in [
        "approved",
        "rejected",
    ]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Status must be approved or rejected",
        )

    attendance = (
        db.query(Attendance)
        .filter(
            Attendance.id
            == correction.attendance_id
        )
        .first()
    )

    if not attendance:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Related attendance record not found",
        )

    # --------------------------------------------------------
    # SAVE HR COMMENT FIRST
    # --------------------------------------------------------

    correction.hr_comment = (
        data.hr_comment.strip()
        if data.hr_comment
        else None
    )

    # --------------------------------------------------------
    # APPROVE CORRECTION
    # --------------------------------------------------------

    if requested_status == "approved":

        new_check_in = (
            correction.requested_check_in
            if correction.requested_check_in is not None
            else attendance.check_in
        )

        new_check_out = (
            correction.requested_check_out
            if correction.requested_check_out is not None
            else attendance.check_out
        )

        if (
            new_check_in is not None
            and new_check_out is not None
            and new_check_out <= new_check_in
        ):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=(
                    "Corrected check-out time must "
                    "be after check-in time"
                ),
            )

        attendance.check_in = new_check_in
        attendance.check_out = new_check_out

        attendance.working_hours = (
            calculate_working_hours(
                attendance.attendance_date,
                new_check_in,
                new_check_out,
            )
        )

        if correction.hr_comment:
            attendance.remarks = correction.hr_comment

    # --------------------------------------------------------
    # REJECT CORRECTION
    # --------------------------------------------------------

    elif requested_status == "rejected":

        # Attendance remains unchanged.

        pass

    # --------------------------------------------------------
    # SAVE REVIEW DETAILS
    # --------------------------------------------------------

    correction.status = requested_status

    correction.reviewed_by = current_user.id

    correction.reviewed_at = datetime.now(
        ZoneInfo("Asia/Kolkata")
    )

    db.commit()
    db.refresh(correction)

    return correction


# ============================================================
# GET SINGLE ATTENDANCE
#
# IMPORTANT:
# This route is intentionally AFTER all
# /correction-requests/... routes.
# ============================================================

@router.get(
    "/{attendance_id}",
    response_model=AttendanceOut,
)
def get_attendance(
    attendance_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    attendance = (
        db.query(Attendance)
        .filter(
            Attendance.id == attendance_id
        )
        .first()
    )

    if not attendance:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Attendance record not found",
        )

    if (
        current_user.role != "hr"
        and attendance.employee_id != current_user.id
    ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=(
                "You do not have permission "
                "to view this attendance record"
            ),
        )

    employee = (
        db.query(User)
        .filter(
            User.id == attendance.employee_id
        )
        .first()
    )

    if not employee:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=(
                "Employee associated with "
                "attendance not found"
            ),
        )

    return attendance_response(
        attendance,
        employee,
    )


# ============================================================
# UPDATE ATTENDANCE - HR ONLY
# ============================================================

@router.put(
    "/{attendance_id}",
    response_model=AttendanceOut,
)
def update_attendance(
    attendance_id: int,
    data: AttendanceUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("hr")),
):
    attendance = (
        db.query(Attendance)
        .filter(
            Attendance.id == attendance_id
        )
        .first()
    )

    if not attendance:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Attendance record not found",
        )

    update_data = data.model_dump(
        exclude_unset=True
    )

    if (
        "attendance_date" in update_data
        and update_data["attendance_date"]
        != attendance.attendance_date
    ):
        existing = (
            db.query(Attendance)
            .filter(
                Attendance.employee_id
                == attendance.employee_id,
                Attendance.attendance_date
                == update_data["attendance_date"],
                Attendance.id != attendance.id,
            )
            .first()
        )

        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=(
                    "Attendance already exists "
                    "for this date"
                ),
            )

    for field, value in update_data.items():
        setattr(
            attendance,
            field,
            value,
        )

    # --------------------------------------------------------
    # RE-CALCULATE WORKING HOURS
    # --------------------------------------------------------

    if (
        "check_in" in update_data
        or "check_out" in update_data
        or "attendance_date" in update_data
    ):
        attendance.working_hours = (
            calculate_working_hours(
                attendance.attendance_date,
                attendance.check_in,
                attendance.check_out,
            )
        )

    db.commit()
    db.refresh(attendance)

    employee = (
        db.query(User)
        .filter(
            User.id == attendance.employee_id
        )
        .first()
    )

    if not employee:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=(
                "Employee associated with "
                "attendance not found"
            ),
        )

    return attendance_response(
        attendance,
        employee,
    )


# ============================================================
# DELETE ATTENDANCE - HR ONLY
# ============================================================

@router.delete(
    "/{attendance_id}",
)
def delete_attendance(
    attendance_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("hr")),
):
    attendance = (
        db.query(Attendance)
        .filter(
            Attendance.id == attendance_id
        )
        .first()
    )

    if not attendance:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Attendance record not found",
        )

    db.delete(attendance)
    db.commit()

    return {
        "message": "Attendance deleted successfully",
        "attendance_id": attendance_id,
    }