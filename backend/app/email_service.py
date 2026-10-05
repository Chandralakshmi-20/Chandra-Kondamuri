
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

from .config import (
    SMTP_EMAIL,
    SMTP_HOST,
    SMTP_PASSWORD,
    SMTP_PORT,
)


# =========================================================
# COMMON EMAIL SENDER
# =========================================================

def send_email(
    recipient_email: str,
    subject: str,
    html: str
):
    """
    Common function to send an HTML email.
    """

    if not SMTP_EMAIL or not SMTP_PASSWORD:
        print("=" * 60)
        print("SMTP is not configured.")
        print(f"Email could not be sent to: {recipient_email}")
        print("=" * 60)
        return False

    message = MIMEMultipart("alternative")

    message["Subject"] = subject
    message["From"] = SMTP_EMAIL
    message["To"] = recipient_email

    message.attach(
        MIMEText(html, "html")
    )

    try:
        with smtplib.SMTP(
            SMTP_HOST,
            SMTP_PORT
        ) as server:

            server.starttls()

            server.login(
                SMTP_EMAIL,
                SMTP_PASSWORD
            )

            server.sendmail(
                SMTP_EMAIL,
                recipient_email,
                message.as_string()
            )

        print(
            f"[EMAIL] Email sent successfully to {recipient_email}"
        )

        return True

    except Exception as exc:
        print("=" * 60)
        print("[EMAIL ERROR] Failed to send email")
        print(f"Recipient: {recipient_email}")
        print(f"Subject: {subject}")
        print(f"Error: {exc}")
        print("=" * 60)

        return False


# =========================================================
# SEND OTP EMAIL
# =========================================================

def send_otp_email(
    recipient_email: str,
    otp: str
):
    """
    Send login OTP email to the user.
    """

    html = f"""
    <html>
        <body style="font-family: Arial, sans-serif;">

            <div style="
                max-width: 500px;
                margin: auto;
                padding: 30px;
                border: 1px solid #ddd;
                border-radius: 12px;
            ">

                <h2>HRMS Login Verification</h2>

                <p>
                    Your One-Time Password (OTP) is:
                </p>

                <h1 style="letter-spacing: 8px;">
                    {otp}
                </h1>

                <p>
                    This OTP is valid for 5 minutes.
                </p>

                <p>
                    If you did not request this OTP,
                    please ignore this email.
                </p>

            </div>

        </body>
    </html>
    """

    return send_email(
        recipient_email=recipient_email,
        subject="HRMS Login OTP",
        html=html
    )


# =========================================================
# SEND NEW LEAVE REQUEST EMAIL TO HR
# =========================================================

def send_new_leave_request_email(
    recipient_email: str,
    employee_name: str,
    start_date: str,
    end_date: str,
    reason: str
):
    """
    Notify HR when an employee creates a new leave request.
    """

    subject = "HRMS - New Leave Request"

    html = f"""
    <html>
        <body style="
            font-family: Arial, sans-serif;
            background-color: #f5f6fa;
            padding: 20px;
        ">

            <div style="
                max-width: 600px;
                margin: auto;
                background: #ffffff;
                padding: 30px;
                border-radius: 12px;
                border: 1px solid #e1e1e1;
            ">

                <h2>
                    New Leave Request
                </h2>

                <p>
                    Hello HR,
                </p>

                <p>
                    <strong>{employee_name}</strong>
                    has submitted a new leave request.
                </p>

                <div style="
                    margin-top: 20px;
                    padding: 20px;
                    background: #f8f9fc;
                    border-radius: 10px;
                ">

                    <p>
                        <strong>Employee:</strong>
                        {employee_name}
                    </p>

                    <p>
                        <strong>Start Date:</strong>
                        {start_date}
                    </p>

                    <p>
                        <strong>End Date:</strong>
                        {end_date}
                    </p>

                    <p>
                        <strong>Reason:</strong>
                        {reason}
                    </p>

                    <p>
                        <strong>Status:</strong>
                        Pending
                    </p>

                </div>

                <p style="
                    margin-top: 25px;
                    color: #666;
                ">
                    Please log in to HRMS to review
                    and approve or reject this leave request.
                </p>

                <p style="
                    color: #666;
                ">
                    This is an automated email from HRMS.
                </p>

            </div>

        </body>
    </html>
    """

    return send_email(
        recipient_email=recipient_email,
        subject=subject,
        html=html
    )


# =========================================================
# SEND LEAVE STATUS EMAIL TO EMPLOYEE
# =========================================================

def send_leave_status_email(
    recipient_email: str,
    employee_name: str,
    start_date: str,
    end_date: str,
    status: str,
    reason: str,
    hr_comment: str | None = None
):
    """
    Send leave approval/rejection email to the employee.
    """

    status_text = status.capitalize()

    if status == "approved":

        subject = "HRMS - Leave Request Approved"

        heading = "Leave Request Approved"

        status_message = (
            "Your leave request has been approved by HR."
        )

    else:

        subject = "HRMS - Leave Request Rejected"

        heading = "Leave Request Rejected"

        status_message = (
            "Your leave request has been rejected by HR."
        )

    comment_html = ""

    if hr_comment:

        comment_html = f"""
        <div style="
            margin-top: 20px;
            padding: 15px;
            background: #f7f7f7;
            border-radius: 8px;
        ">

            <strong>HR Comment:</strong>

            <p style="margin-bottom: 0;">
                {hr_comment}
            </p>

        </div>
        """

    html = f"""
    <html>
        <body style="
            font-family: Arial, sans-serif;
            background-color: #f5f6fa;
            padding: 20px;
        ">

            <div style="
                max-width: 600px;
                margin: auto;
                background: #ffffff;
                padding: 30px;
                border-radius: 12px;
                border: 1px solid #e1e1e1;
            ">

                <h2>
                    {heading}
                </h2>

                <p>
                    Hello <strong>{employee_name}</strong>,
                </p>

                <p>
                    {status_message}
                </p>

                <div style="
                    margin-top: 20px;
                    padding: 20px;
                    background: #f8f9fc;
                    border-radius: 10px;
                ">

                    <p>
                        <strong>Leave Status:</strong>
                        {status_text}
                    </p>

                    <p>
                        <strong>Start Date:</strong>
                        {start_date}
                    </p>

                    <p>
                        <strong>End Date:</strong>
                        {end_date}
                    </p>

                    <p>
                        <strong>Reason:</strong>
                        {reason}
                    </p>

                </div>

                {comment_html}

                <p style="
                    margin-top: 25px;
                    color: #666;
                ">
                    This is an automated email from HRMS.
                    Please do not reply to this email.
                </p>

            </div>

        </body>
    </html>
    """

    return send_email(
        recipient_email=recipient_email,
        subject=subject,
        html=html
    )


# =========================================================
# SEND PROJECT ASSIGNMENT EMAIL
# =========================================================

def send_project_assignment_email(
    recipient_email,
    employee_name,
    project_name,
    description=None,
    start_date=None,
    end_date=None,
    status=None,
    completion_percentage=None
):
    """
    Send project assignment email to an employee.
    """

    subject = f"New Project Assigned - {project_name}"

    html = f"""
    <html>
    <body style="
        font-family: Arial, sans-serif;
        line-height: 1.6;
        background-color: #f5f6fa;
        padding: 20px;
    ">

        <div style="
            max-width: 600px;
            margin: auto;
            background: #ffffff;
            padding: 30px;
            border-radius: 12px;
            border: 1px solid #e1e1e1;
        ">

            <h2>New Project Assigned</h2>

            <p>
                Hello <strong>{employee_name}</strong>,
            </p>

            <p>
                A new project has been assigned to you
                in the HRMS.
            </p>

            <table style="
                border-collapse: collapse;
                width: 100%;
                max-width: 600px;
            ">

                <tr>
                    <td style="
                        padding: 8px;
                        border: 1px solid #ddd;
                    ">
                        <strong>Project</strong>
                    </td>

                    <td style="
                        padding: 8px;
                        border: 1px solid #ddd;
                    ">
                        {project_name}
                    </td>
                </tr>

                <tr>
                    <td style="
                        padding: 8px;
                        border: 1px solid #ddd;
                    ">
                        <strong>Description</strong>
                    </td>

                    <td style="
                        padding: 8px;
                        border: 1px solid #ddd;
                    ">
                        {description or "Not provided"}
                    </td>
                </tr>

                <tr>
                    <td style="
                        padding: 8px;
                        border: 1px solid #ddd;
                    ">
                        <strong>Start Date</strong>
                    </td>

                    <td style="
                        padding: 8px;
                        border: 1px solid #ddd;
                    ">
                        {start_date or "Not specified"}
                    </td>
                </tr>

                <tr>
                    <td style="
                        padding: 8px;
                        border: 1px solid #ddd;
                    ">
                        <strong>End Date</strong>
                    </td>

                    <td style="
                        padding: 8px;
                        border: 1px solid #ddd;
                    ">
                        {end_date or "Not specified"}
                    </td>
                </tr>

                <tr>
                    <td style="
                        padding: 8px;
                        border: 1px solid #ddd;
                    ">
                        <strong>Status</strong>
                    </td>

                    <td style="
                        padding: 8px;
                        border: 1px solid #ddd;
                    ">
                        {status or "Not specified"}
                    </td>
                </tr>

                <tr>
                    <td style="
                        padding: 8px;
                        border: 1px solid #ddd;
                    ">
                        <strong>Completion</strong>
                    </td>

                    <td style="
                        padding: 8px;
                        border: 1px solid #ddd;
                    ">
                        {completion_percentage or 0}%
                    </td>
                </tr>

            </table>

            <p>
                Please log in to HRMS to view the complete
                project details.
            </p>

            <p>
                Regards,<br>
                <strong>HRMS Team</strong>
            </p>

        </div>

    </body>
    </html>
    """

    return send_email(
        recipient_email,
        subject,
        html
    )


# =========================================================
# SEND GENERAL HRMS NOTIFICATION EMAIL
# =========================================================

def send_notification_email(
    recipient_email: str,
    employee_name: str,
    title: str,
    message: str,
):
    """
    Send a general HRMS notification email to an employee.

    Used for:
    - Public holidays
    - Birthdays
    - Festivals
    - Team meetings
    - General HR announcements
    - Other HRMS notifications
    """

    subject = f"HRMS Notification - {title}"

    html = f"""
    <html>

    <body style="
        font-family: Arial, sans-serif;
        background-color: #f5f6fa;
        padding: 20px;
    ">

        <div style="
            max-width: 600px;
            margin: auto;
            background: #ffffff;
            padding: 30px;
            border-radius: 12px;
            border: 1px solid #e1e1e1;
        ">

            <h2 style="
                margin-top: 0;
                color: #222;
            ">
                {title}
            </h2>

            <p>
                Hello <strong>{employee_name}</strong>,
            </p>

            <div style="
                margin-top: 20px;
                padding: 20px;
                background: #f8f9fc;
                border-radius: 10px;
                line-height: 1.6;
            ">

                <p style="margin: 0;">
                    {message}
                </p>

            </div>

            <p style="
                margin-top: 25px;
                color: #666;
            ">
                Please log in to HRMS to view your
                notifications.
            </p>

            <p style="
                color: #666;
            ">
                This is an automated email from HRMS.
                Please do not reply to this email.
            </p>

            <p>
                Regards,<br>
                <strong>HRMS Team</strong>
            </p>

        </div>

    </body>

    </html>
    """

    return send_email(
        recipient_email=recipient_email,
        subject=subject,
        html=html,
    )

