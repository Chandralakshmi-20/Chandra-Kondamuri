
from datetime import date

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..database import get_db
from ..dependencies import get_current_user, require_roles
from ..models import Notification, User
from ..schemas import (
    NotificationCreate,
    NotificationOut,
    NotificationReadUpdate,
    NotificationStatusUpdate,
)
from ..email_service import send_notification_email


router = APIRouter(
    prefix="/notifications",
    tags=["Notifications"],
)


# ============================================================
# CREATE NOTIFICATION
# HR ONLY
# Sends notification to all active users
# Also sends email to employees
# ============================================================

@router.post(
    "",
    response_model=NotificationOut,
    status_code=status.HTTP_201_CREATED,
)
def create_notification(
    data: NotificationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("hr")),
):
    active_users = (
        db.query(User)
        .filter(User.is_active == True)
        .all()
    )

    if not active_users:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No active users found",
        )

    created_notifications = []

    for user in active_users:

        notification = Notification(
            user_id=user.id,
            title=data.title,
            message=data.message,
            notification_type=data.notification_type,
            notification_date=data.notification_date,
            is_active=data.is_active,
            is_read=False,
        )

        db.add(notification)
        created_notifications.append(notification)

    db.commit()

    for notification in created_notifications:
        db.refresh(notification)

    # ========================================================
    # SEND EMAIL TO ACTIVE EMPLOYEES
    # ========================================================

    if data.is_active:

        for user in active_users:

            # Do not send the general notification email
            # to the HR who created the notification.
            if user.role == "employee":

                try:
                    send_notification_email(
                        recipient_email=user.email,
                        employee_name=user.full_name,
                        title=data.title,
                        message=data.message,
                    )
                except Exception as error:
                    print(
                        f"[NOTIFICATION EMAIL ERROR] "
                        f"{user.email}: {error}"
                    )

    # ========================================================
    # RETURN HR'S NOTIFICATION ROW
    # ========================================================

    hr_notification = next(
        (
            notification
            for notification in created_notifications
            if notification.user_id == current_user.id
        ),
        created_notifications[0],
    )

    return hr_notification


# ============================================================
# GET MY NOTIFICATIONS
# ============================================================

@router.get(
    "",
    response_model=list[NotificationOut],
)
def get_notifications(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    notifications = (
        db.query(Notification)
        .filter(
            Notification.user_id == current_user.id,
            Notification.is_active == True,
            ~Notification.notification_type.in_(
                ["leave", "project"]
            ),
        )
        .order_by(
            Notification.created_at.desc()
        )
        .all()
    )

    return notifications

# ============================================================
# GET UNREAD COUNT
# ============================================================

@router.get(
    "/unread-count",
)
def get_unread_notification_count(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    count = (
        db.query(Notification)
        .filter(
            Notification.user_id == current_user.id,
            Notification.is_active == True,
            Notification.is_read == False,
        )
        .count()
    )

    return {
        "unread_count": count
    }


# ============================================================
# MARK ONE AS READ / UNREAD
# ============================================================

@router.patch(
    "/{notification_id}/read",
    response_model=NotificationOut,
)
def mark_notification_as_read(
    notification_id: int,
    data: NotificationReadUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    notification = (
        db.query(Notification)
        .filter(
            Notification.id == notification_id,
            Notification.user_id == current_user.id,
        )
        .first()
    )

    if not notification:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notification not found",
        )

    notification.is_read = data.is_read

    db.commit()
    db.refresh(notification)

    return notification


# ============================================================
# MARK ALL AS READ
# ============================================================

@router.patch(
    "/read-all",
)
def mark_all_notifications_as_read(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    updated_count = (
        db.query(Notification)
        .filter(
            Notification.user_id == current_user.id,
            Notification.is_active == True,
            Notification.is_read == False,
        )
        .update(
            {
                Notification.is_read: True
            },
            synchronize_session=False,
        )
    )

    db.commit()

    return {
        "message": "All notifications marked as read",
        "updated_count": updated_count,
    }


# ============================================================
# GET ALL NOTIFICATIONS
# HR ONLY
# Shows ONLY company/general notifications
#
# Leave and project notifications are personal notifications
# and must NOT appear in the HR Notifications page.
# ============================================================

@router.get(
    "/all",
    response_model=list[NotificationOut],
)
def get_all_notifications(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("hr")),
):
    notifications = (
        db.query(Notification)
        .filter(
            Notification.notification_type.notin_(
                ["leave", "project"]
            )
        )
        .order_by(
            Notification.created_at.desc()
        )
        .all()
    )

    # Remove duplicate company notifications for HR view
    unique_notifications = []
    seen = set()

    for notification in notifications:

        key = (
            notification.title,
            notification.message,
            notification.notification_type,
            notification.notification_date,
        )

        if key not in seen:
            seen.add(key)
            unique_notifications.append(notification)

    return unique_notifications


# ============================================================
# GET SINGLE NOTIFICATION
# ============================================================

@router.get(
    "/{notification_id}",
    response_model=NotificationOut,
)
def get_notification(
    notification_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    notification = (
        db.query(Notification)
        .filter(
            Notification.id == notification_id,
            Notification.user_id == current_user.id,
            Notification.is_active == True,
        )
        .first()
    )

    if not notification:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notification not found",
        )

    return notification


# ============================================================
# UPDATE NOTIFICATION STATUS
# HR ONLY
#
# IMPORTANT:
# HR notification and employee notifications are separate DB
# rows. Therefore status must be changed for ALL rows belonging
# to the same company notification.
# ============================================================

@router.patch(
    "/{notification_id}/status",
    response_model=NotificationOut,
)
def update_notification_status(
    notification_id: int,
    data: NotificationStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("hr")),
):
    # --------------------------------------------------------
    # Find the notification HR is changing
    # --------------------------------------------------------

    notification = (
        db.query(Notification)
        .filter(
            Notification.id == notification_id
        )
        .first()
    )

    if not notification:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notification not found",
        )

    # --------------------------------------------------------
    # Store old status
    # --------------------------------------------------------

    old_status = notification.is_active

    # --------------------------------------------------------
    # Find ALL notification rows belonging to the same
    # company notification.
    #
    # Every user has a separate row.
    # --------------------------------------------------------

    related_notifications = (
        db.query(Notification)
        .filter(
            Notification.title == notification.title,
            Notification.message == notification.message,
            Notification.notification_type
            == notification.notification_type,
            Notification.notification_date
            == notification.notification_date,
        )
        .all()
    )

    # --------------------------------------------------------
    # Update status for every user's notification row
    # --------------------------------------------------------

    for related_notification in related_notifications:
        related_notification.is_active = data.is_active

    db.commit()

    # --------------------------------------------------------
    # If notification is newly activated,
    # send email to employees.
    #
    # This prevents an email when HR is simply deactivating.
    # --------------------------------------------------------

    if data.is_active and not old_status:

        for related_notification in related_notifications:

            employee = (
                db.query(User)
                .filter(
                    User.id == related_notification.user_id,
                    User.role == "employee",
                    User.is_active == True,
                )
                .first()
            )

            if employee:

                try:
                    send_notification_email(
                        recipient_email=employee.email,
                        employee_name=employee.full_name,
                        title=related_notification.title,
                        message=related_notification.message,
                    )

                except Exception as error:
                    print(
                        f"[NOTIFICATION EMAIL ERROR] "
                        f"{employee.email}: {error}"
                    )

    # --------------------------------------------------------
    # Refresh HR notification
    # --------------------------------------------------------

    db.refresh(notification)

    return notification

