from datetime import date

from app.database import Base, SessionLocal, engine
from app.models import User


Base.metadata.create_all(
    bind=engine
)


db = SessionLocal()


try:
    email = input(
        "Enter HR email: "
    ).strip().lower()

    full_name = input(
        "Enter HR full name: "
    ).strip()

    existing_user = db.query(User).filter(
        User.email == email
    ).first()

    if existing_user:
        print(
            "User already exists."
        )
    else:
        hr_user = User(
            full_name=full_name,
            email=email,
            role="hr",
            is_active=True
        )

        db.add(hr_user)
        db.commit()
        db.refresh(hr_user)

        print()
        print("HR user created successfully.")
        print(f"ID: {hr_user.id}")
        print(f"Name: {hr_user.full_name}")
        print(f"Email: {hr_user.email}")
        print(f"Role: {hr_user.role}")

finally:
    db.close()