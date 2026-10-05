from sqlalchemy import text

from .database import engine


def migrate_projects():
    with engine.begin() as connection:

        # ---------------------------------------------------------
        # 1. Create project_employees association table
        # ---------------------------------------------------------
        connection.execute(
            text(
                """
                CREATE TABLE IF NOT EXISTS project_employees (
                    project_id INTEGER NOT NULL,
                    employee_id INTEGER NOT NULL,

                    PRIMARY KEY (project_id, employee_id),

                    CONSTRAINT fk_project_employees_project
                        FOREIGN KEY (project_id)
                        REFERENCES projects(id)
                        ON DELETE CASCADE,

                    CONSTRAINT fk_project_employees_employee
                        FOREIGN KEY (employee_id)
                        REFERENCES users(id)
                        ON DELETE CASCADE
                )
                """
            )
        )

        # ---------------------------------------------------------
        # 2. Copy existing single-employee assignments
        #    into the new multiple-employee table
        # ---------------------------------------------------------
        connection.execute(
            text(
                """
                INSERT INTO project_employees (project_id, employee_id)
                SELECT id, assigned_employee_id
                FROM projects
                WHERE assigned_employee_id IS NOT NULL
                ON CONFLICT (project_id, employee_id) DO NOTHING
                """
            )
        )

    print("Projects migration completed successfully")


if __name__ == "__main__":
    migrate_projects()