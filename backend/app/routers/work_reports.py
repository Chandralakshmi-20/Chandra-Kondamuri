from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..database import get_db
from ..dependencies import get_current_user, require_roles
from ..models import WorkReport, User, Project, project_employees
from ..schemas import (
    WorkReportCreate,
    WorkReportUpdate,
    WorkReportOut,
)

router = APIRouter(
    prefix="/work-reports",
    tags=["Work Reports"]
)


# =========================================================
# VALIDATE PROJECT ASSIGNMENT
# =========================================================


def get_assigned_project(
    project_id: int,
    employee_id: int,
    db: Session
):
    project = (
        db.query(Project)
        .join(
            project_employees,
            Project.id == project_employees.c.project_id
        )
        .filter(
            Project.id == project_id,
            project_employees.c.employee_id == employee_id
        )
        .first()
    )

    if not project:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This project is not assigned to you"
        )

    return project

# =========================================================
# UPDATE PROJECT COMPLETION + STATUS
# =========================================================

def update_project_completion(
    project: Project,
    db: Session
):
    latest_report = (
        db.query(WorkReport)
        .filter(
            WorkReport.project_id == project.id
        )
        .order_by(
            WorkReport.created_at.desc(),
            WorkReport.id.desc()
        )
        .first()
    )

    if latest_report:
        project.completion_percentage = max(
            0,
            min(
                100,
                latest_report.completion_percentage
            )
        )

        if project.completion_percentage == 100:
            project.status = "completed"
        else:
            project.status = "active"

    else:
        project.completion_percentage = 0
        project.status = "not_started"


# =========================================================
# GET MY WORK REPORTS
# =========================================================

@router.get(
    "",
    response_model=list[WorkReportOut]
)
def get_my_work_reports(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return (
        db.query(WorkReport)
        .filter(
            WorkReport.employee_id == current_user.id
        )
        .order_by(
            WorkReport.created_at.desc()
        )
        .all()
    )


# =========================================================
# CREATE WORK REPORT
# =========================================================

@router.post(
    "",
    response_model=WorkReportOut,
    status_code=status.HTTP_201_CREATED
)
def create_work_report(
    data: WorkReportCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role != "employee":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only employees can submit work reports"
        )

    # -----------------------------------------------------
    # Project is required for a work report
    # -----------------------------------------------------

    if data.project_id is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Please select a project"
        )

    # -----------------------------------------------------
    # Check that the project belongs to this employee
    # -----------------------------------------------------

    project = get_assigned_project(
        project_id=data.project_id,
        employee_id=current_user.id,
        db=db
    )

    # -----------------------------------------------------
    # Validate completion percentage
    # -----------------------------------------------------

    completion_percentage = (
        data.completion_percentage
        if data.completion_percentage is not None
        else 0
    )

    if completion_percentage < 0 or completion_percentage > 100:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Completion percentage must be between 0 and 100"
        )

    # -----------------------------------------------------
    # Create work report
    # -----------------------------------------------------

    work_report = WorkReport(
        employee_id=current_user.id,
        project_id=data.project_id,
        start_date=data.start_date,
        title=data.title,
        description=data.description,
        tag=data.tag,
        completion_percentage=completion_percentage,
        status="submitted"
    )

    db.add(work_report)

    # Make the new report available for project calculation
    db.flush()

    # Update project completion
    update_project_completion(
        project=project,
        db=db
    )

    db.commit()
    db.refresh(work_report)

    return work_report


# =========================================================
# HR - GET ALL WORK REPORTS
# =========================================================

@router.get(
    "/all",
    response_model=list[WorkReportOut]
)
def get_all_work_reports(
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles("hr")
    )
):
    return (
        db.query(WorkReport)
        .order_by(
            WorkReport.created_at.desc()
        )
        .all()
    )


# =========================================================
# GET ONE WORK REPORT
# =========================================================

@router.get(
    "/{report_id}",
    response_model=WorkReportOut
)
def get_work_report(
    report_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(WorkReport).filter(
        WorkReport.id == report_id
    )

    if current_user.role != "hr":
        query = query.filter(
            WorkReport.employee_id == current_user.id
        )

    work_report = query.first()

    if not work_report:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Work report not found"
        )

    return work_report


# =========================================================
# UPDATE WORK REPORT
# =========================================================

@router.put(
    "/{report_id}",
    response_model=WorkReportOut
)
def update_work_report(
    report_id: int,
    data: WorkReportUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role != "employee":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only employees can update their reports"
        )

    work_report = (
        db.query(WorkReport)
        .filter(
            WorkReport.id == report_id,
            WorkReport.employee_id == current_user.id
        )
        .first()
    )

    if not work_report:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Work report not found"
        )

    update_data = data.model_dump(
        exclude_unset=True
    )

    # -----------------------------------------------------
    # Validate project if project is being changed
    # -----------------------------------------------------

    if "project_id" in update_data:
        if update_data["project_id"] is None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Please select a project"
            )

        get_assigned_project(
            project_id=update_data["project_id"],
            employee_id=current_user.id,
            db=db
        )

    # -----------------------------------------------------
    # Validate completion percentage
    # -----------------------------------------------------

    if "completion_percentage" in update_data:
        completion_percentage = update_data[
            "completion_percentage"
        ]

        if (
            completion_percentage is not None
            and (
                completion_percentage < 0
                or completion_percentage > 100
            )
        ):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Completion percentage must be between 0 and 100"
            )

    # Remember old project
    old_project_id = work_report.project_id

    # Apply updates
    for field, value in update_data.items():
        setattr(
            work_report,
            field,
            value
        )

    new_project_id = work_report.project_id

    # Get old project if project changed
    old_project = None

    if old_project_id:
        old_project = (
            db.query(Project)
            .filter(
                Project.id == old_project_id
            )
            .first()
        )

    # Get new project
    new_project = None

    if new_project_id:
        new_project = (
            db.query(Project)
            .filter(
                Project.id == new_project_id
            )
            .first()
        )

    db.flush()

    # Recalculate old project
    if old_project:
        update_project_completion(
            project=old_project,
            db=db
        )

    # Recalculate new project
    if new_project and new_project.id != old_project_id:
        update_project_completion(
            project=new_project,
            db=db
        )

    db.commit()
    db.refresh(work_report)

    return work_report


# =========================================================
# DELETE WORK REPORT
# =========================================================

@router.delete(
    "/{report_id}"
)
def delete_work_report(
    report_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role != "employee":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only employees can delete their reports"
        )

    work_report = (
        db.query(WorkReport)
        .filter(
            WorkReport.id == report_id,
            WorkReport.employee_id == current_user.id
        )
        .first()
    )

    if not work_report:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Work report not found"
        )

    # Remember project before deleting
    project = None

    if work_report.project_id:
        project = (
            db.query(Project)
            .filter(
                Project.id == work_report.project_id
            )
            .first()
        )

    # Delete report
    db.delete(work_report)

    # Apply deletion before recalculation
    db.flush()

    # Recalculate project completion
    if project:
        update_project_completion(
            project=project,
            db=db
        )

    db.commit()

    return {
        "message": "Work report deleted successfully",
        "report_id": report_id
    }