
from datetime import date
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user, require_roles
from app.email_service import (
    send_leave_status_email,
    send_new_leave_request_email,
)
from app.models import Leave, Notification, User
from app.schemas import LeaveCreate, LeaveOut, LeaveStatusUpdate


router = APIRouter(
    prefix="/leaves",
    tags=["Leave Management"],
)


# ============================================================
# HELPER
# ============================================================

def build_leave_response(
    db: Session,
    leave: Leave,
) -> LeaveOut:
    employee = (
        db.query(User)
        .filter(User.id == leave.employee_id)
        .first()
    )

    return LeaveOut(
        id=leave.id,
        employee_id=leave.employee_id,
        employee_name=employee.full_name if employee else None,
        employee_email=employee.email if employee else None,
        start_date=leave.start_date,
        end_date=leave.end_date,
        reason=leave.reason,
        status=leave.status,
        hr_comment=leave.hr_comment,
        created_at=leave.created_at,
    )


# ============================================================
# EMPLOYEE - CREATE LEAVE
# ============================================================

@router.post(
    "",
    response_model=LeaveOut,
    status_code=status.HTTP_201_CREATED,
)
def create_leave(
    data: LeaveCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles("employee")
    ),
):
    if data.end_date < data.start_date:
        raise HTTPException(
            status_code=400,
            detail="End date cannot be before start date",
        )

    if not data.reason.strip():
        raise HTTPException(
            status_code=400,
            detail="Leave reason is required",
        )

    leave = Leave(
        employee_id=current_user.id,
        start_date=data.start_date,
        end_date=data.end_date,
        reason=data.reason.strip(),
        status="pending",
    )

    db.add(leave)
    db.commit()
    db.refresh(leave)

    # --------------------------------------------------------
    # Notify all active HR users by email
    # --------------------------------------------------------

    hr_users = (
        db.query(User)
        .filter(
            User.role == "hr",
            User.is_active == True,
        )
        .all()
    )

    for hr in hr_users:
        try:
            send_new_leave_request_email(
                recipient_email=hr.email,
                employee_name=current_user.full_name,
                start_date=leave.start_date,
                end_date=leave.end_date,
                reason=leave.reason,
            )
        except Exception as exc:
            print(
                f"Failed to send leave request email "
                f"to {hr.email}: {exc}"
            )

    return build_leave_response(db, leave)


# ============================================================
# EMPLOYEE - MY LEAVES
# ============================================================

@router.get(
    "",
    response_model=list[LeaveOut],
)
def get_my_leaves(
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles("employee")
    ),
):
    leaves = (
        db.query(Leave)
        .filter(
            Leave.employee_id == current_user.id
        )
        .order_by(Leave.created_at.desc())
        .all()
    )

    return [
        build_leave_response(db, leave)
        for leave in leaves
    ]


# ============================================================
# HR - ALL LEAVES
# ============================================================

@router.get(
    "/all",
    response_model=list[LeaveOut],
)
def get_all_leaves(
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles("hr")
    ),
):
    leaves = (
        db.query(Leave)
        .order_by(Leave.created_at.desc())
        .all()
    )

    return [
        build_leave_response(db, leave)
        for leave in leaves
    ]


# ============================================================
# GET SINGLE LEAVE
# ============================================================

@router.get(
    "/{leave_id}",
    response_model=LeaveOut,
)
def get_leave(
    leave_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    leave = (
        db.query(Leave)
        .filter(Leave.id == leave_id)
        .first()
    )

    if not leave:
        raise HTTPException(
            status_code=404,
            detail="Leave not found",
        )

    if current_user.role == "hr":
        return build_leave_response(db, leave)

    if leave.employee_id != current_user.id:
        raise HTTPException(
            status_code=403,
            detail="You can only view your own leave",
        )

    return build_leave_response(db, leave)


# ============================================================
# HR - APPROVE / REJECT LEAVE
# ============================================================

@router.patch(
    "/{leave_id}/status",
    response_model=LeaveOut,
)
def update_leave_status(
    leave_id: int,
    data: LeaveStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles("hr")
    ),
):
    leave = (
        db.query(Leave)
        .filter(Leave.id == leave_id)
        .first()
    )

    if not leave:
        raise HTTPException(
            status_code=404,
            detail="Leave not found",
        )

    if leave.status != "pending":
        raise HTTPException(
            status_code=400,
            detail="Only pending leaves can be reviewed",
        )

    if data.status not in {"approved", "rejected"}:
        raise HTTPException(
            status_code=400,
            detail="Status must be approved or rejected",
        )

    # Update leave
    leave.status = data.status
    leave.hr_comment = (
        data.hr_comment.strip()
        if data.hr_comment
        else None
    )

    db.commit()
    db.refresh(leave)

    # Get employee
    employee = (
        db.query(User)
        .filter(User.id == leave.employee_id)
        .first()
    )

    if employee:
        # ----------------------------------------------------
        # IN-APP NOTIFICATION
        # ----------------------------------------------------

        notification_title = (
            "Leave Approved"
            if leave.status == "approved"
            else "Leave Rejected"
        )

        notification_message = (
            f"Your leave request from "
            f"{leave.start_date} to {leave.end_date} "
            f"has been {leave.status}."
        )

        if leave.hr_comment:
            notification_message += (
                f" HR Comment: {leave.hr_comment}"
            )

        notification = Notification(
            user_id=employee.id,
            title=notification_title,
            message=notification_message,
            notification_type="leave",
            notification_date=date.today(),
            is_active=True,
            is_read=False,
        )

        db.add(notification)
        db.commit()

        # ----------------------------------------------------
        # EMAIL NOTIFICATION
        # ----------------------------------------------------

        try:
            send_leave_status_email(
                recipient_email=employee.email,
                employee_name=employee.full_name,
                start_date=leave.start_date,
                end_date=leave.end_date,
                status=leave.status,
                reason=leave.reason,
                hr_comment=leave.hr_comment,
            )
        except Exception as exc:
            print(
                f"Failed to send leave status email "
                f"to {employee.email}: {exc}"
            )

    return build_leave_response(db, leave)


# ============================================================
# HR - REVOKE APPROVED LEAVE
# ============================================================

@router.patch(
    "/{leave_id}/revoke",
    response_model=LeaveOut,
)
def revoke_leave(
    leave_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles("hr")
    ),
):
    leave = (
        db.query(Leave)
        .filter(Leave.id == leave_id)
        .first()
    )

    if not leave:
        raise HTTPException(
            status_code=404,
            detail="Leave not found",
        )

    if leave.status != "approved":
        raise HTTPException(
            status_code=400,
            detail="Only approved leaves can be revoked",
        )

    # Update leave status
    leave.status = "revoked"

    db.commit()
    db.refresh(leave)

    # Get employee
    employee = (
        db.query(User)
        .filter(User.id == leave.employee_id)
        .first()
    )

    if employee:
        # ----------------------------------------------------
        # IN-APP NOTIFICATION
        # ----------------------------------------------------

        notification_message = (
            f"Your approved leave from "
            f"{leave.start_date} to {leave.end_date} "
            f"has been revoked by HR."
        )

        if leave.hr_comment:
            notification_message += (
                f" HR Comment: {leave.hr_comment}"
            )

        notification = Notification(
            user_id=employee.id,
            title="Leave Revoked",
            message=notification_message,
            notification_type="leave",
            notification_date=date.today(),
            is_active=True,
            is_read=False,
        )

        db.add(notification)
        db.commit()

        # ----------------------------------------------------
        # EMAIL NOTIFICATION
        # ----------------------------------------------------

        try:
            send_leave_status_email(
                recipient_email=employee.email,
                employee_name=employee.full_name,
                start_date=leave.start_date,
                end_date=leave.end_date,
                status="revoked",
                reason=leave.reason,
                hr_comment=leave.hr_comment,
            )
        except Exception as exc:
            print(
                f"Failed to send leave revoke email "
                f"to {employee.email}: {exc}"
            )

    return build_leave_response(db, leave)


# ============================================================
# HR - APPROVE REVOKED LEAVE AGAIN
# ============================================================

@router.patch(
    "/{leave_id}/approve-revoked",
    response_model=LeaveOut,
)
def approve_revoked_leave(
    leave_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles("hr")
    ),
):
    leave = (
        db.query(Leave)
        .filter(Leave.id == leave_id)
        .first()
    )

    if not leave:
        raise HTTPException(
            status_code=404,
            detail="Leave not found",
        )

    if leave.status != "revoked":
        raise HTTPException(
            status_code=400,
            detail="Only revoked leaves can be approved again",
        )

    # --------------------------------------------------------
    # CHANGE REVOKED → APPROVED
    # --------------------------------------------------------

    leave.status = "approved"

    db.commit()
    db.refresh(leave)

    # Get employee
    employee = (
        db.query(User)
        .filter(User.id == leave.employee_id)
        .first()
    )

    if employee:
        # ----------------------------------------------------
        # IN-APP NOTIFICATION
        # ----------------------------------------------------

        notification_message = (
            f"Your previously revoked leave from "
            f"{leave.start_date} to {leave.end_date} "
            f"has been approved again by HR."
        )

        if leave.hr_comment:
            notification_message += (
                f" HR Comment: {leave.hr_comment}"
            )

        notification = Notification(
            user_id=employee.id,
            title="Leave Approved Again",
            message=notification_message,
            notification_type="leave",
            notification_date=date.today(),
            is_active=True,
            is_read=False,
        )

        db.add(notification)
        db.commit()

        # ----------------------------------------------------
        # EMAIL NOTIFICATION
        # ----------------------------------------------------

        try:
            send_leave_status_email(
                recipient_email=employee.email,
                employee_name=employee.full_name,
                start_date=leave.start_date,
                end_date=leave.end_date,
                status="approved",
                reason=leave.reason,
                hr_comment=leave.hr_comment,
            )
        except Exception as exc:
            print(
                f"Failed to send leave re-approval email "
                f"to {employee.email}: {exc}"
            )

    return build_leave_response(db, leave)


# ============================================================
# EMPLOYEE - DELETE PENDING LEAVE
# ============================================================

@router.delete(
    "/{leave_id}",
)
def delete_leave(
    leave_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles("employee")
    ),
):
    leave = (
        db.query(Leave)
        .filter(
            Leave.id == leave_id,
            Leave.employee_id == current_user.id,
        )
        .first()
    )

    if not leave:
        raise HTTPException(
            status_code=404,
            detail="Leave not found",
        )

    if leave.status != "pending":
        raise HTTPException(
            status_code=400,
            detail="Only pending leave can be deleted",
        )

    db.delete(leave)
    db.commit()

    return {
        "message": "Leave deleted successfully"
    }
