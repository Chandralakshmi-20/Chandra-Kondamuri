
from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from sqlalchemy.orm import Session

from ..cloudinary_service import upload_profile_image
from ..database import get_db
from ..dependencies import get_current_user
from ..models import User
from ..schemas import ProfileUpdate, UserOut


router = APIRouter(
    prefix="/profile",
    tags=["Profile"]
)


# ============================================================
# GET MY PROFILE
# ============================================================

@router.get(
    "/me",
    response_model=UserOut
)
def get_my_profile(
    current_user: User = Depends(get_current_user)
):
    return current_user


# ============================================================
# UPDATE MY PROFILE
# ============================================================

@router.put(
    "/me",
    response_model=UserOut
)
def update_my_profile(
    profile_data: ProfileUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):

    # --------------------------------------------------------
    # PERSONAL INFORMATION
    # --------------------------------------------------------

    if profile_data.full_name is not None:
        current_user.full_name = profile_data.full_name

    if profile_data.phone is not None:
        current_user.phone = profile_data.phone

    if profile_data.date_of_birth is not None:
        current_user.date_of_birth = profile_data.date_of_birth


    # --------------------------------------------------------
    # IMPORTANT
    # --------------------------------------------------------
    # Department
    # Designation
    # Joining Date
    #
    # These fields are HR-managed employee information.
    #
    # They are intentionally NOT updated from the
    # Profile page.
    #
    # HR can change them from:
    #
    # HR Dashboard
    #     ↓
    # Employees
    #     ↓
    # Edit Employee
    #
    # --------------------------------------------------------


    db.commit()
    db.refresh(current_user)

    return current_user


# ============================================================
# UPLOAD PROFILE IMAGE
# ============================================================

@router.post(
    "/me/profile-image",
    response_model=UserOut
)
async def upload_my_profile_image(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):

    allowed_types = {
        "image/jpeg",
        "image/png",
        "image/webp",
    }


    # --------------------------------------------------------
    # FILE TYPE VALIDATION
    # --------------------------------------------------------

    if file.content_type not in allowed_types:
        raise HTTPException(
            status_code=400,
            detail="Only JPG, PNG, and WEBP images are allowed"
        )


    try:

        # ----------------------------------------------------
        # UPLOAD IMAGE TO CLOUDINARY
        # ----------------------------------------------------

        image_url = upload_profile_image(
            file.file
        )


        if not image_url:
            raise HTTPException(
                status_code=500,
                detail="Cloudinary did not return an image URL"
            )


        # ----------------------------------------------------
        # SAVE CLOUDINARY URL
        # ----------------------------------------------------

        current_user.profile_image_url = image_url


        db.commit()
        db.refresh(current_user)


        return current_user


    except HTTPException:
        raise


    except Exception as error:

        db.rollback()

        print(
            "Cloudinary upload error:",
            error
        )

        raise HTTPException(
            status_code=500,
            detail="Failed to upload profile image"
        )

