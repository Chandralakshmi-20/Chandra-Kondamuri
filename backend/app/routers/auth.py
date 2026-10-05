import random
from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..database import get_db
from ..email_service import send_otp_email
from ..models import User
from ..schemas import RequestOTP, TokenResponse, UserOut, VerifyOTP
from ..security import create_access_token, hash_otp
from ..dependencies import get_current_user


router = APIRouter(
    prefix="/auth",
    tags=["Authentication"]
)


@router.post("/request-otp")
def request_otp(
    data: RequestOTP,
    db: Session = Depends(get_db)
):
    """
    Send a 6-digit OTP to an existing HRMS user.
    """

    user = db.query(User).filter(
        User.email == data.email.lower()
    ).first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No HRMS account found with this email"
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This account is inactive"
        )

    otp = str(
        random.randint(100000, 999999)
    )

    user.otp_hash = hash_otp(otp)

    user.otp_expires_at = (
        datetime.utcnow() + timedelta(minutes=5)
    )

    db.commit()

    try:
        send_otp_email(
            recipient_email=user.email,
            otp=otp
        )
    except Exception as exc:
        db.rollback()

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Unable to send OTP email: {str(exc)}"
        )

    response = {
        "message": "OTP sent successfully",
        "email": user.email
    }

    return response


@router.post(
    "/verify-otp",
    response_model=TokenResponse
)
def verify_otp(
    data: VerifyOTP,
    db: Session = Depends(get_db)
):
    """
    Verify OTP and generate JWT access token.
    """

    user = db.query(User).filter(
        User.email == data.email.lower()
    ).first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This account is inactive"
        )

    if not user.otp_hash:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No OTP requested"
        )

    if not user.otp_expires_at:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="OTP has expired"
        )

    if datetime.utcnow() > user.otp_expires_at:
        user.otp_hash = None
        user.otp_expires_at = None

        db.commit()

        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="OTP has expired"
        )

    if hash_otp(data.otp) != user.otp_hash:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid OTP"
        )

    user.otp_hash = None
    user.otp_expires_at = None

    db.commit()

    access_token = create_access_token(
        {
            "sub": str(user.id),
            "role": user.role,
            "email": user.email
        }
    )

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user
    }


@router.get(
    "/me",
    response_model=UserOut
)
def get_me(
    current_user: User = Depends(get_current_user)
):
    """
    Return currently logged-in user.
    """

    return current_user


@router.post("/logout")
def logout():
    """
    JWT logout is handled on the frontend by removing the token.
    """

    return {
        "message": "Logout successful"
    }