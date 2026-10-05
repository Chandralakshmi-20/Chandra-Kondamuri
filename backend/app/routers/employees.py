
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..database import get_db
from ..dependencies import require_roles
from ..models import (
    User,
    WorkReport,
    Leave,
    Project,
    Notification,
    Attendance,
)
from ..schemas import (
    EmployeeCreate,
    EmployeeUpdate,
    EmployeeStatusUpdate,
    UserOut
)


router = APIRouter(
    prefix="/employees",
    tags=["Employee Management"]
)


# =========================================================
# CREATE EMPLOYEE
# =========================================================

@router.post(
    "",
    response_model=UserOut,
    status_code=status.HTTP_201_CREATED
)
def create_employee(
    employee_data: EmployeeCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles("hr")
    )
):
    # -----------------------------------------------------
    # Check duplicate email
    # -----------------------------------------------------

    existing_user = (
        db.query(User)
        .filter(
            User.email == employee_data.email.lower()
        )
        .first()
    )

    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email already exists"
        )

    # -----------------------------------------------------
    # Create employee
    # -----------------------------------------------------

    employee = User(
        full_name=employee_data.full_name,
        email=employee_data.email.lower(),
        role=employee_data.role,
        phone=employee_data.phone,
        department=employee_data.department,
        designation=employee_data.designation,
        joining_date=employee_data.joining_date,
        date_of_birth=employee_data.date_of_birth,
        is_active=True
    )

    db.add(employee)
    db.commit()
    db.refresh(employee)

    return employee


# =========================================================
# GET ALL EMPLOYEES
# =========================================================

@router.get(
    "",
    response_model=list[UserOut]
)
def get_all_employees(
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles("hr")
    )
):
    # Only users whose role is employee
    # are returned here.
    #
    # HR accounts are not included.

    employees = (
        db.query(User)
        .filter(
            User.role == "employee"
        )
        .order_by(
            User.id.desc()
        )
        .all()
    )

    return employees


# =========================================================
# GET SINGLE EMPLOYEE
# =========================================================

@router.get(
    "/{employee_id}",
    response_model=UserOut
)
def get_employee(
    employee_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles("hr")
    )
):
    employee = (
        db.query(User)
        .filter(
            User.id == employee_id,
            User.role == "employee"
        )
        .first()
    )

    if not employee:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Employee not found"
        )

    return employee


# =========================================================
# UPDATE EMPLOYEE
# =========================================================

@router.put(
    "/{employee_id}",
    response_model=UserOut
)
def update_employee(
    employee_id: int,
    employee_data: EmployeeUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles("hr")
    )
):
    employee = (
        db.query(User)
        .filter(
            User.id == employee_id,
            User.role == "employee"
        )
        .first()
    )

    if not employee:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Employee not found"
        )

    # -----------------------------------------------------
    # Check duplicate email
    # -----------------------------------------------------

    if employee_data.email:
        existing_user = (
            db.query(User)
            .filter(
                User.email == employee_data.email.lower(),
                User.id != employee_id
            )
            .first()
        )

        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Another account already uses this email"
            )

    # -----------------------------------------------------
    # Get only fields sent by frontend
    # -----------------------------------------------------

    update_data = employee_data.model_dump(
        exclude_unset=True
    )

    # -----------------------------------------------------
    # Normalize email
    # -----------------------------------------------------

    if "email" in update_data:
        update_data["email"] = (
            update_data["email"].lower()
        )

    # -----------------------------------------------------
    # Prevent changing employee role
    # -----------------------------------------------------

    update_data.pop("role", None)

    # -----------------------------------------------------
    # Update employee fields
    # -----------------------------------------------------

    for field, value in update_data.items():
        setattr(
            employee,
            field,
            value
        )

    db.commit()
    db.refresh(employee)

    return employee


# =========================================================
# ACTIVATE / DEACTIVATE EMPLOYEE
# =========================================================

@router.patch(
    "/{employee_id}/status",
    response_model=UserOut
)
def update_employee_status(
    employee_id: int,
    status_data: EmployeeStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles("hr")
    )
):
    employee = (
        db.query(User)
        .filter(
            User.id == employee_id,
            User.role == "employee"
        )
        .first()
    )

    if not employee:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Employee not found"
        )

    employee.is_active = status_data.is_active

    db.commit()
    db.refresh(employee)

    return employee


# =========================================================
# DELETE EMPLOYEE
# =========================================================

@router.delete(
    "/{employee_id}"
)
def delete_employee(
    employee_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles("hr")
    )
):
    # -----------------------------------------------------
    # Find employee
    # -----------------------------------------------------

    employee = (
        db.query(User)
        .filter(
            User.id == employee_id,
            User.role == "employee"
        )
        .first()
    )

    if not employee:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Employee not found"
        )

    # -----------------------------------------------------
    # Safety check
    # -----------------------------------------------------

    if employee.id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="HR cannot delete the currently logged-in account"
        )

    employee_name = employee.full_name

    try:
        # -------------------------------------------------
        # 1. Delete employee notifications
        # -------------------------------------------------

        db.query(Notification).filter(
            Notification.user_id == employee.id
        ).delete(
            synchronize_session=False
        )

        # -------------------------------------------------
        # 2. Delete employee work reports
        # -------------------------------------------------

        db.query(WorkReport).filter(
            WorkReport.employee_id == employee.id
        ).delete(
            synchronize_session=False
        )

        # -------------------------------------------------
        # 3. Delete employee leaves
        # -------------------------------------------------

        db.query(Leave).filter(
            Leave.employee_id == employee.id
        ).delete(
            synchronize_session=False
        )

        # -------------------------------------------------
        # 4. Delete employee attendance records
        # -------------------------------------------------

        db.query(Attendance).filter(
            Attendance.employee_id == employee.id
        ).delete(
            synchronize_session=False
        )

        # -------------------------------------------------
        # 5. Remove employee from projects
        #
        # We don't delete the project itself.
        # The project can continue to exist.
        # Only the employee assignment is removed.
        # -------------------------------------------------

        db.query(Project).filter(
            Project.assigned_employee_id == employee.id
        ).update(
            {
                Project.assigned_employee_id: None
            },
            synchronize_session=False
        )

        # -------------------------------------------------
        # 6. Finally delete employee account
        # -------------------------------------------------

        db.delete(employee)

        # -------------------------------------------------
        # 7. Save all changes
        # -------------------------------------------------

        db.commit()

        return {
            "message": "Employee deleted successfully",
            "employee_name": employee_name
        }

    except Exception as error:
        # -------------------------------------------------
        # Roll back everything if any database operation
        # fails.
        # -------------------------------------------------

        db.rollback()

        print(
            f"Failed to delete employee {employee_id}:",
            error
        )

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete employee. Please try again."
        )

