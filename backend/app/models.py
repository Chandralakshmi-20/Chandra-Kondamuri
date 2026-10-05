
from datetime import datetime

from sqlalchemy import (
    Boolean,
    Column,
    Date,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    String,
    Table,
    Text,
    Time,
)

from sqlalchemy.orm import relationship

from .database import Base


# ============================================================
# PROJECT - EMPLOYEE ASSOCIATION TABLE
# ============================================================

project_employees = Table(
    "project_employees",
    Base.metadata,
    Column(
        "project_id",
        Integer,
        ForeignKey("projects.id", ondelete="CASCADE"),
        primary_key=True,
    ),
    Column(
        "employee_id",
        Integer,
        ForeignKey("users.id", ondelete="CASCADE"),
        primary_key=True,
    ),
)


# ============================================================
# USER
# ============================================================

class User(Base):
    __tablename__ = "users"

    id = Column(
        Integer,
        primary_key=True,
        index=True,
    )

    full_name = Column(
        String(150),
        nullable=False,
    )

    email = Column(
        String(255),
        unique=True,
        nullable=False,
        index=True,
    )

    role = Column(
        String(20),
        nullable=False,
        default="employee",
    )

    phone = Column(
        String(30),
        nullable=True,
    )

    department = Column(
        String(100),
        nullable=True,
    )

    designation = Column(
        String(100),
        nullable=True,
    )

    joining_date = Column(
        Date,
        nullable=True,
    )

    date_of_birth = Column(
        Date,
        nullable=True,
    )

    profile_image_url = Column(
        String(500),
        nullable=True,
    )

    is_active = Column(
        Boolean,
        default=True,
        nullable=False,
    )

    otp_hash = Column(
        String(128),
        nullable=True,
    )

    otp_expires_at = Column(
        DateTime,
        nullable=True,
    )

    created_at = Column(
        DateTime,
        default=datetime.utcnow,
        nullable=False,
    )

    # --------------------------------------------------------
    # RELATIONSHIPS
    # --------------------------------------------------------

    work_reports = relationship(
        "WorkReport",
        back_populates="employee",
        cascade="all, delete-orphan",
    )

    leaves = relationship(
        "Leave",
        back_populates="employee",
        cascade="all, delete-orphan",
    )

    # One employee can have many projects
    # One project can have many employees
    projects = relationship(
        "Project",
        secondary=project_employees,
        back_populates="employees",
    )

    attendance_records = relationship(
        "Attendance",
        back_populates="employee",
        cascade="all, delete-orphan",
    )

    notifications = relationship(
        "Notification",
        back_populates="user",
        cascade="all, delete-orphan",
    )


# ============================================================
# WORK REPORT
# ============================================================

class WorkReport(Base):
    __tablename__ = "work_reports"

    id = Column(
        Integer,
        primary_key=True,
        index=True,
    )

    employee_id = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=False,
        index=True,
    )

    project_id = Column(
        Integer,
        ForeignKey("projects.id"),
        nullable=True,
        index=True,
    )

    start_date = Column(
        Date,
        nullable=False,
    )

    title = Column(
        String(200),
        nullable=False,
    )

    description = Column(
        Text,
        nullable=False,
    )

    tag = Column(
        String(50),
        nullable=False,
    )

    completion_percentage = Column(
        Integer,
        default=0,
        nullable=False,
    )

    status = Column(
        String(30),
        default="submitted",
        nullable=False,
    )

    created_at = Column(
        DateTime,
        default=datetime.utcnow,
        nullable=False,
    )

    employee = relationship(
        "User",
        back_populates="work_reports",
    )

    project = relationship(
        "Project",
        back_populates="work_reports",
    )


# ============================================================
# LEAVE
# ============================================================

class Leave(Base):
    __tablename__ = "leaves"

    id = Column(
        Integer,
        primary_key=True,
        index=True,
    )

    employee_id = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=False,
        index=True,
    )

    start_date = Column(
        Date,
        nullable=False,
    )

    end_date = Column(
        Date,
        nullable=False,
    )

    reason = Column(
        Text,
        nullable=False,
    )

    status = Column(
        String(30),
        default="pending",
        nullable=False,
    )

    hr_comment = Column(
        Text,
        nullable=True,
    )

    created_at = Column(
        DateTime,
        default=datetime.utcnow,
        nullable=False,
    )

    employee = relationship(
        "User",
        back_populates="leaves",
    )


# ============================================================
# PROJECT
# ============================================================

class Project(Base):
    __tablename__ = "projects"

    id = Column(
        Integer,
        primary_key=True,
        index=True,
    )

    name = Column(
        String(200),
        nullable=False,
    )

    description = Column(
        Text,
        nullable=True,
    )

    # --------------------------------------------------------
    # LEGACY SINGLE EMPLOYEE COLUMN
    # --------------------------------------------------------
    # Kept temporarily so existing database data is preserved.
    # Existing values will be copied into project_employees.
    #
    # New application logic will use the employees relationship.
    # --------------------------------------------------------

    assigned_employee_id = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=True,
    )

    start_date = Column(
        Date,
        nullable=True,
    )

    end_date = Column(
        Date,
        nullable=True,
    )

    status = Column(
        String(30),
        default="active",
        nullable=False,
    )

    completion_percentage = Column(
        Integer,
        default=0,
        nullable=False,
    )

    created_at = Column(
        DateTime,
        default=datetime.utcnow,
        nullable=False,
    )

    # --------------------------------------------------------
    # MULTIPLE EMPLOYEES
    # --------------------------------------------------------

    employees = relationship(
        "User",
        secondary=project_employees,
        back_populates="projects",
    )

    # --------------------------------------------------------
    # WORK REPORTS
    # --------------------------------------------------------

    work_reports = relationship(
        "WorkReport",
        back_populates="project",
    )


# ============================================================
# NOTIFICATION
# ============================================================

class Notification(Base):
    __tablename__ = "notifications"

    id = Column(
        Integer,
        primary_key=True,
        index=True,
    )

    # --------------------------------------------------------
    # USER WHO RECEIVES THE NOTIFICATION
    # --------------------------------------------------------

    user_id = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=False,
        index=True,
    )

    title = Column(
        String(200),
        nullable=False,
    )

    message = Column(
        Text,
        nullable=False,
    )

    notification_type = Column(
        String(50),
        nullable=False,
        default="general",
    )

    notification_date = Column(
        Date,
        nullable=True,
    )

    is_active = Column(
        Boolean,
        default=True,
        nullable=False,
    )

    # --------------------------------------------------------
    # READ / UNREAD
    # --------------------------------------------------------

    is_read = Column(
        Boolean,
        default=False,
        nullable=False,
    )

    created_at = Column(
        DateTime,
        default=datetime.utcnow,
        nullable=False,
    )

    # --------------------------------------------------------
    # RELATIONSHIP
    # --------------------------------------------------------

    user = relationship(
        "User",
        back_populates="notifications",
    )


# ============================================================
# ATTENDANCE
# ============================================================

class Attendance(Base):
    __tablename__ = "attendance"

    id = Column(
        Integer,
        primary_key=True,
        index=True,
    )

    employee_id = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=False,
        index=True,
    )

    attendance_date = Column(
        Date,
        nullable=False,
    )

    check_in = Column(
        Time,
        nullable=True,
    )

    check_out = Column(
        Time,
        nullable=True,
    )

    status = Column(
        String(30),
        nullable=False,
        default="present",
    )

    working_hours = Column(
        Float,
        nullable=True,
    )

    remarks = Column(
        Text,
        nullable=True,
    )

    created_at = Column(
        DateTime,
        default=datetime.utcnow,
        nullable=False,
    )

    employee = relationship(
        "User",
        back_populates="attendance_records",
    )


# ============================================================
# ATTENDANCE CORRECTION REQUEST
# ============================================================

class AttendanceCorrectionRequest(Base):
    __tablename__ = "attendance_correction_requests"

    id = Column(
        Integer,
        primary_key=True,
        index=True,
    )

    attendance_id = Column(
        Integer,
        ForeignKey("attendance.id"),
        nullable=False,
        index=True,
    )

    employee_id = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=False,
        index=True,
    )

    requested_check_in = Column(
        Time,
        nullable=True,
    )

    requested_check_out = Column(
        Time,
        nullable=True,
    )

    reason = Column(
        Text,
        nullable=False,
    )

    status = Column(
        String(30),
        nullable=False,
        default="pending",
    )

    hr_comment = Column(
        Text,
        nullable=True,
    )

    reviewed_by = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=True,
    )

    reviewed_at = Column(
        DateTime,
        nullable=True,
    )

    created_at = Column(
        DateTime,
        default=datetime.utcnow,
        nullable=False,
    )

