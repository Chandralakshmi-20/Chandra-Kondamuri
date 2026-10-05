import { useNavigate } from "react-router-dom";

function WorkProgress({
  employees = [],
  workReports = [],
}) {
  const navigate = useNavigate();

  // ---------------------------------------------------------
  // ONLY EMPLOYEES
  // HR USERS SHOULD NOT APPEAR IN EMPLOYEE PERFORMANCE
  // ---------------------------------------------------------

  const employeeUsers = employees.filter(
    (employee) =>
      employee.role?.toLowerCase() === "employee"
  );

  // ---------------------------------------------------------
  // CALCULATE EMPLOYEE COMPLETION
  // ---------------------------------------------------------

  const employeePerformance = employeeUsers
    .map((employee) => {
      const employeeReports = workReports.filter(
        (report) =>
          report.employee_id === employee.id
      );

      let percentage = 0;

      if (employeeReports.length > 0) {
        const totalCompletion =
          employeeReports.reduce(
            (total, report) =>
              total +
              Number(
                report.completion_percentage || 0
              ),
            0
          );

        percentage = Math.round(
          totalCompletion /
            employeeReports.length
        );
      }

      return {
        id: employee.id,
        name: employee.full_name,
        department:
          employee.department || "Not assigned",
        percentage,
      };
    })
    .sort(
      (a, b) =>
        b.percentage - a.percentage
    );

  return (
    <div className="panel">

      {/* =====================================================
          HEADER
      ====================================================== */}

      <div className="panel-header">

        <div>
          <h2>Employee Performance</h2>

          <p>
            Current work completion overview
          </p>
        </div>

        <button
          type="button"
          className="text-button"
          onClick={() => navigate("/analytics")}
        >
          View all
        </button>

      </div>

      {/* =====================================================
          EMPTY STATE
      ====================================================== */}

      {employeePerformance.length === 0 ? (

        <div className="empty-state">
          No employees found.
        </div>

      ) : (

        <div className="progress-list">

          {employeePerformance.map(
            (employee) => (

              <div
                className="progress-item"
                key={employee.id}
              >

                {/* Employee */}

                <div className="employee-mini">

                  <div className="mini-avatar">

                    {employee.name
                      .split(" ")
                      .map(
                        (word) => word[0]
                      )
                      .join("")
                      .slice(0, 2)
                      .toUpperCase()}

                  </div>

                  <div>

                    <strong>
                      {employee.name}
                    </strong>

                    <span>
                      {employee.department}
                    </span>

                  </div>

                </div>

                {/* Completion */}

                <div className="progress-area">

                  <div className="progress-label">

                    <span>
                      Completion
                    </span>

                    <strong>
                      {employee.percentage}%
                    </strong>

                  </div>

                  <div className="progress-track">

                    <div
                      className="progress-fill"
                      style={{
                        width: `${employee.percentage}%`,
                      }}
                    />

                  </div>

                </div>

              </div>

            )
          )}

        </div>

      )}

    </div>
  );
}

export default WorkProgress;