from sqlalchemy import text

from .database import engine


def migrate_notifications():
    with engine.begin() as connection:

        # Add user_id column if it does not exist
        connection.execute(
            text(
                """
                ALTER TABLE notifications
                ADD COLUMN IF NOT EXISTS user_id INTEGER
                """
            )
        )

        # Add is_read column if it does not exist
        connection.execute(
            text(
                """
                ALTER TABLE notifications
                ADD COLUMN IF NOT EXISTS is_read BOOLEAN DEFAULT FALSE
                """
            )
        )

        # Make sure existing notifications have is_read value
        connection.execute(
            text(
                """
                UPDATE notifications
                SET is_read = FALSE
                WHERE is_read IS NULL
                """
            )
        )

        # Find an HR user for existing notifications
        result = connection.execute(
            text(
                """
                SELECT id
                FROM users
                WHERE role = 'hr'
                ORDER BY id
                LIMIT 1
                """
            )
        )

        hr_user = result.fetchone()

        if hr_user is None:
            raise RuntimeError(
                "No HR user found. Cannot assign existing notifications."
            )

        hr_user_id = hr_user[0]

        # Assign existing notifications to the HR user
        connection.execute(
            text(
                """
                UPDATE notifications
                SET user_id = :hr_user_id
                WHERE user_id IS NULL
                """
            ),
            {"hr_user_id": hr_user_id},
        )

        # Make user_id NOT NULL
        connection.execute(
            text(
                """
                ALTER TABLE notifications
                ALTER COLUMN user_id SET NOT NULL
                """
            )
        )

        # Add foreign key if it does not already exist
        connection.execute(
            text(
                """
                DO $$
                BEGIN
                    IF NOT EXISTS (
                        SELECT 1
                        FROM pg_constraint
                        WHERE conname = 'fk_notifications_user_id'
                    ) THEN
                        ALTER TABLE notifications
                        ADD CONSTRAINT fk_notifications_user_id
                        FOREIGN KEY (user_id)
                        REFERENCES users(id)
                        ON DELETE CASCADE;
                    END IF;
                END
                $$;
                """
            )
        )


if __name__ == "__main__":
    try:
        migrate_notifications()
        print("==============================================")
        print("Notifications migration completed successfully")
        print("==============================================")
    except Exception as e:
        print("==============================================")
        print("Notifications migration FAILED")
        print("Error:", e)
        print("==============================================")
        raise