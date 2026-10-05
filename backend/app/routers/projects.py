from datetime import date

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..database import get_db
from ..dependencies import require_roles
from ..models import (
    Project,
    User,
    Notification,
    project_employees,
)
from ..schemas import (
    ProjectCreate,
    ProjectUpdate,
    ProjectProgressUpdate,
    ProjectOut,
)
from ..email_service import send_project_assignment_email


router = APIRouter(
    prefix="/projects",
    tags=["Project Management"],
)


# ============================================================
# HELPERS
# ============================================================

def get_project_employee_ids(db: Session, project_id: int):
    rows = (
        db.query(project_employees.c.employee_id)
        .filter(
            project_employees.c.project_id == project_id
        )
        .all()
    )

    return [row[0] for row in rows]


def get_project_status(completion_percentage):
    completion = completion_percentage or 0

    if completion == 100:
        return "completed"

    if completion > 0:
        return "active"

    return "not_started"


def build_project_response(db: Session, project: Project):
    return ProjectOut(
        id=project.id,
        name=project.name,
        description=project.description,
        start_date=project.start_date,
        end_date=project.end_date,
        status=get_project_status(
            project.completion_percentage
        ),
        completion_percentage=project.completion_percentage or 0,
        assigned_employee_ids=get_project_employee_ids(
            db,
            project.id
        ),
        created_at=project.created_at,
        updated_at=getattr(project, "updated_at", None),
    )


def get_active_employees(
    db: Session,
    employee_ids: list[int],
):
    if not employee_ids:
        return []

    # Remove duplicate IDs
    employee_ids = list(set(employee_ids))

    employees = (
        db.query(User)
        .filter(
            User.id.in_(employee_ids),
            User.is_active == True,
            User.role == "employee",
        )
        .all()
    )

    if len(employees) != len(employee_ids):
        found_ids = {employee.id for employee in employees}

        missing_ids = [
            employee_id
            for employee_id in employee_ids
            if employee_id not in found_ids
        ]

        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=(
                f"Active employee(s) not found: "
                f"{missing_ids}"
            ),
        )

    return employees


def create_project_notification(
    db: Session,
    employee: User,
    title: str,
    message: str,
):
    """
    Create an in-app notification for one employee.
    """

    notification = Notification(
        user_id=employee.id,
        title=title,
        message=message,
        notification_type="project",
        notification_date=date.today(),
        is_active=True,
        is_read=False,
    )

    db.add(notification)


# ============================================================
# CREATE PROJECT
# HR ONLY
# ============================================================

@router.post(
    "",
    response_model=ProjectOut,
    status_code=status.HTTP_201_CREATED,
)
def create_project(
    data: ProjectCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("hr")),
):
    # --------------------------------------------------------
    # Validate dates
    # --------------------------------------------------------

    if data.start_date and data.end_date:
        if data.start_date > data.end_date:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Start date cannot be after end date",
            )

    # --------------------------------------------------------
    # Validate completion percentage
    # --------------------------------------------------------

    if not 0 <= data.completion_percentage <= 100:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Completion percentage must be between 0 and 100",
        )

    # --------------------------------------------------------
    # Validate employees
    # --------------------------------------------------------

    employees = get_active_employees(
        db,
        data.assigned_employee_ids,
    )

    # --------------------------------------------------------
    # Create project
    # --------------------------------------------------------

    project = Project(
        name=data.name,
        description=data.description,
        start_date=data.start_date,
        end_date=data.end_date,
        status=get_project_status(
            data.completion_percentage
        ),
        completion_percentage=data.completion_percentage,
    )

    db.add(project)
    db.flush()

    # --------------------------------------------------------
    # Multiple employee assignment
    # --------------------------------------------------------

    project.employees = employees

    # --------------------------------------------------------
    # Create in-app notifications
    # --------------------------------------------------------

    for employee in employees:
        create_project_notification(
            db=db,
            employee=employee,
            title="New Project Assigned",
            message=(
                f"The project '{project.name}' "
                f"has been assigned to you."
            ),
        )

    # --------------------------------------------------------
    # Save project + notifications
    # --------------------------------------------------------

    db.commit()
    db.refresh(project)

    # --------------------------------------------------------
    # Send assignment email
    # --------------------------------------------------------

    for employee in employees:
        try:
            send_project_assignment_email(
                recipient_email=employee.email,
                employee_name=employee.full_name,
                project_name=project.name,
                description=project.description,
                start_date=project.start_date,
                end_date=project.end_date,
                status=get_project_status(
                    project.completion_percentage
                ),
                completion_percentage=project.completion_percentage,
            )
        except Exception as exc:
            print(
                f"Project assignment email failed for "
                f"{employee.email}: {exc}"
            )

    return build_project_response(db, project)


# ============================================================
# GET MY PROJECTS
# EMPLOYEE ONLY
# ============================================================

@router.get(
    "",
    response_model=list[ProjectOut],
)
def get_my_projects(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("employee")),
):
    projects = (
        db.query(Project)
        .join(
            project_employees,
            Project.id == project_employees.c.project_id,
        )
        .filter(
            project_employees.c.employee_id == current_user.id
        )
        .order_by(Project.created_at.desc())
        .all()
    )

    return [
        build_project_response(db, project)
        for project in projects
    ]


# ============================================================
# GET ALL PROJECTS
# HR ONLY
# ============================================================

@router.get(
    "/all",
    response_model=list[ProjectOut],
)
def get_all_projects(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("hr")),
):
    projects = (
        db.query(Project)
        .order_by(Project.created_at.desc())
        .all()
    )

    return [
        build_project_response(db, project)
        for project in projects
    ]


# ============================================================
# UPDATE PROJECT PROGRESS
# HR + EMPLOYEE
#
# HR:
#   Can update any project.
#
# EMPLOYEE:
#   Can update only a project assigned to them.
# ============================================================

@router.patch(
    "/{project_id}/progress",
    response_model=ProjectOut,
)
def update_project_progress(
    project_id: int,
    data: ProjectProgressUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles("hr", "employee")
    ),
):
    # --------------------------------------------------------
    # Validate progress
    # --------------------------------------------------------

    if not 0 <= data.completion_percentage <= 100:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Completion percentage must be between 0 and 100",
        )

    # --------------------------------------------------------
    # Find project
    # --------------------------------------------------------

    project = (
        db.query(Project)
        .filter(Project.id == project_id)
        .first()
    )

    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found",
        )

    # --------------------------------------------------------
    # Employee authorization
    # --------------------------------------------------------

    if current_user.role == "employee":

        assigned = (
            db.query(project_employees)
            .filter(
                project_employees.c.project_id == project_id,
                project_employees.c.employee_id == current_user.id,
            )
            .first()
        )

        if not assigned:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=(
                    "You can update progress only for "
                    "your assigned projects"
                ),
            )

    # --------------------------------------------------------
    # Update progress
    # --------------------------------------------------------

    old_progress = project.completion_percentage or 0

    project.completion_percentage = (
        data.completion_percentage
    )

    # --------------------------------------------------------
    # AUTOMATIC PROJECT STATUS
    # --------------------------------------------------------

    project.status = get_project_status(
        data.completion_percentage
    )

    # --------------------------------------------------------
    # HR progress update notification
    # --------------------------------------------------------

    if current_user.role == "hr":
        employee_ids = get_project_employee_ids(
            db,
            project.id,
        )

        employees = get_active_employees(
            db,
            employee_ids,
        )

        if old_progress != data.completion_percentage:

            for employee in employees:
                create_project_notification(
                    db=db,
                    employee=employee,
                    title="Project Progress Updated",
                    message=(
                        f"The completion of project "
                        f"'{project.name}' was updated from "
                        f"{old_progress}% to "
                        f"{data.completion_percentage}%."
                    ),
                )

    db.commit()
    db.refresh(project)

    return build_project_response(db, project)


# ============================================================
# GET SINGLE PROJECT
# HR OR ASSIGNED EMPLOYEE
# ============================================================

@router.get(
    "/{project_id}",
    response_model=ProjectOut,
)
def get_project(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles("hr", "employee")
    ),
):
    project = (
        db.query(Project)
        .filter(Project.id == project_id)
        .first()
    )

    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found",
        )

    # --------------------------------------------------------
    # HR can view all projects
    # --------------------------------------------------------

    if current_user.role == "hr":
        return build_project_response(db, project)

    # --------------------------------------------------------
    # Employee can view only assigned projects
    # --------------------------------------------------------

    assigned = (
        db.query(project_employees)
        .filter(
            project_employees.c.project_id == project_id,
            project_employees.c.employee_id == current_user.id,
        )
        .first()
    )

    if not assigned:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not allowed to view this project",
        )

    return build_project_response(db, project)


# ============================================================
# UPDATE PROJECT
# HR ONLY
# ============================================================

@router.put(
    "/{project_id}",
    response_model=ProjectOut,
)
def update_project(
    project_id: int,
    data: ProjectUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("hr")),
):
    # --------------------------------------------------------
    # Find project
    # --------------------------------------------------------

    project = (
        db.query(Project)
        .filter(Project.id == project_id)
        .first()
    )

    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found",
        )

    # --------------------------------------------------------
    # Store old values
    # --------------------------------------------------------

    old_name = project.name
    old_description = project.description
    old_start_date = project.start_date
    old_end_date = project.end_date
    old_status = project.status
    old_completion = project.completion_percentage or 0

    old_employee_ids = set(
        get_project_employee_ids(
            db,
            project.id,
        )
    )

    # --------------------------------------------------------
    # Validate dates
    # --------------------------------------------------------

    new_start_date = (
        data.start_date
        if data.start_date is not None
        else project.start_date
    )

    new_end_date = (
        data.end_date
        if data.end_date is not None
        else project.end_date
    )

    if new_start_date and new_end_date:
        if new_start_date > new_end_date:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Start date cannot be after end date",
            )

    # --------------------------------------------------------
    # Validate completion
    # --------------------------------------------------------

    if data.completion_percentage is not None:
        if not 0 <= data.completion_percentage <= 100:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=(
                    "Completion percentage must be "
                    "between 0 and 100"
                ),
            )

    # --------------------------------------------------------
    # Update normal fields
    # --------------------------------------------------------

    if data.name is not None:
        project.name = data.name

    if data.description is not None:
        project.description = data.description

    if data.start_date is not None:
        project.start_date = data.start_date

    if data.end_date is not None:
        project.end_date = data.end_date

    if data.completion_percentage is not None:
        project.completion_percentage = (
            data.completion_percentage
        )

    # --------------------------------------------------------
    # AUTOMATIC PROJECT STATUS
    # --------------------------------------------------------

    if data.completion_percentage is not None:
        project.status = get_project_status(
            data.completion_percentage
        )
    elif data.status is not None:
        project.status = data.status

    # --------------------------------------------------------
    # Multiple employee assignment
    # --------------------------------------------------------

    newly_assigned_employees = []
    removed_employee_ids = set()

    if data.assigned_employee_ids is not None:

        new_employees = get_active_employees(
            db,
            data.assigned_employee_ids,
        )

        new_employee_ids = {
            employee.id
            for employee in new_employees
        }

        # Employees newly added
        newly_assigned_ids = (
            new_employee_ids - old_employee_ids
        )

        # Employees removed
        removed_employee_ids = (
            old_employee_ids - new_employee_ids
        )

        # Replace assignments
        project.employees = new_employees

        newly_assigned_employees = [
            employee
            for employee in new_employees
            if employee.id in newly_assigned_ids
        ]

    # --------------------------------------------------------
    # Detect project changes
    # --------------------------------------------------------

    project_details_changed = (
        old_name != project.name
        or old_description != project.description
        or old_start_date != project.start_date
        or old_end_date != project.end_date
        or old_status != project.status
        or old_completion != (
            project.completion_percentage or 0
        )
    )

    assignment_changed = (
        data.assigned_employee_ids is not None
        and (
            old_employee_ids
            != set(data.assigned_employee_ids)
        )
    )

    # --------------------------------------------------------
    # Save project
    # --------------------------------------------------------

    db.commit()
    db.refresh(project)

    # --------------------------------------------------------
    # Current assigned employees
    # --------------------------------------------------------

    current_employee_ids = set(
        get_project_employee_ids(
            db,
            project.id,
        )
    )

    current_employees = get_active_employees(
        db,
        list(current_employee_ids),
    )

    # --------------------------------------------------------
    # NEWLY ASSIGNED EMPLOYEE NOTIFICATION
    # --------------------------------------------------------

    for employee in newly_assigned_employees:

        create_project_notification(
            db=db,
            employee=employee,
            title="New Project Assigned",
            message=(
                f"The project '{project.name}' "
                f"has been assigned to you."
            ),
        )

    # --------------------------------------------------------
    # PROJECT CHANGE NOTIFICATION
    #
    # Send to existing assigned employees.
    # Newly assigned employees already receive
    # "New Project Assigned", so don't duplicate.
    # --------------------------------------------------------

    if project_details_changed or assignment_changed:

        for employee in current_employees:

            if employee.id in {
                emp.id
                for emp in newly_assigned_employees
            }:
                continue

            create_project_notification(
                db=db,
                employee=employee,
                title="Project Updated",
                message=(
                    f"The project '{project.name}' "
                    f"has been updated by HR."
                ),
            )

    # --------------------------------------------------------
    # Removed employee notification
    # --------------------------------------------------------

    if removed_employee_ids:

        removed_employees = (
            db.query(User)
            .filter(
                User.id.in_(removed_employee_ids),
                User.role == "employee",
            )
            .all()
        )

        for employee in removed_employees:

            create_project_notification(
                db=db,
                employee=employee,
                title="Project Assignment Updated",
                message=(
                    f"Your assignment for project "
                    f"'{project.name}' has been updated by HR."
                ),
            )

    # --------------------------------------------------------
    # Save notifications
    # --------------------------------------------------------

    db.commit()

    # --------------------------------------------------------
    # EMAIL TO NEWLY ASSIGNED EMPLOYEES
    # --------------------------------------------------------

    for employee in newly_assigned_employees:

        try:
            send_project_assignment_email(
                recipient_email=employee.email,
                employee_name=employee.full_name,
                project_name=project.name,
                description=project.description,
                start_date=project.start_date,
                end_date=project.end_date,
                status=get_project_status(
                    project.completion_percentage
                ),
                completion_percentage=project.completion_percentage,
            )

        except Exception as exc:
            print(
                f"Project assignment email failed for "
                f"{employee.email}: {exc}"
            )

    # --------------------------------------------------------
    # EMAIL FOR PROJECT CHANGES
    #
    # Existing project email function is reused here.
    # --------------------------------------------------------

    if project_details_changed or assignment_changed:

        newly_assigned_ids = {
            employee.id
            for employee in newly_assigned_employees
        }

        for employee in current_employees:

            if employee.id in newly_assigned_ids:
                continue

            try:
                send_project_assignment_email(
                    recipient_email=employee.email,
                    employee_name=employee.full_name,
                    project_name=project.name,
                    description=project.description,
                    start_date=project.start_date,
                    end_date=project.end_date,
                    status=get_project_status(
                        project.completion_percentage
                    ),
                    completion_percentage=project.completion_percentage,
                )

            except Exception as exc:
                print(
                    f"Project update email failed for "
                    f"{employee.email}: {exc}"
                )

    return build_project_response(db, project)


# ============================================================
# DELETE PROJECT
# HR ONLY
# ============================================================

@router.delete(
    "/{project_id}"
)
def delete_project(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("hr")),
):
    # --------------------------------------------------------
    # Find project
    # --------------------------------------------------------

    project = (
        db.query(Project)
        .filter(Project.id == project_id)
        .first()
    )

    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found",
        )

    # --------------------------------------------------------
    # Get assigned employees before deleting
    # --------------------------------------------------------

    assigned_employee_ids = get_project_employee_ids(
        db,
        project.id,
    )

    assigned_employees = get_active_employees(
        db,
        assigned_employee_ids,
    )

    project_name = project.name

    # --------------------------------------------------------
    # Create deletion notifications
    # --------------------------------------------------------

    for employee in assigned_employees:

        create_project_notification(
            db=db,
            employee=employee,
            title="Project Deleted",
            message=(
                f"The project '{project_name}' "
                f"has been deleted by HR."
            ),
        )

    db.delete(project)
    db.commit()

    return {
        "message": "Project deleted successfully",
        "project_id": project_id,
    }