import { useNavigate } from "react-router-dom";

function RecentReports({
  reports = [],
  employees = [],
}) {
  const navigate = useNavigate();

  // ---------------------------------------------------------
  // GET EMPLOYEE NAME
  // ---------------------------------------------------------

  const getEmployeeName = (employeeId) => {
    const employee = employees.find(
      (item) => item.id === employeeId
    );

    return employee
      ? employee.full_name
      : "Unknown Employee";
  };

  // ---------------------------------------------------------
  // FORMAT DATE
  // ---------------------------------------------------------

  const formatDate = (dateValue) => {
    if (!dateValue) {
      return "N/A";
    }

    const date = new Date(dateValue);

    if (Number.isNaN(date.getTime())) {
      return dateValue;
    }

    return date.toLocaleDateString(
      "en-IN",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }
    );
  };

  // ---------------------------------------------------------
  // GET RECENT REPORTS
  // ---------------------------------------------------------

  const recentReports = [...reports]
    .sort(
      (a, b) =>
        new Date(b.created_at) -
        new Date(a.created_at)
    )
    .slice(0, 5);

  return (
    <div className="panel">

      {/* =====================================================
          HEADER
      ====================================================== */}

      <div className="panel-header">

        <div>
          <h2>Recent Work Reports</h2>

          <p>
            Latest employee submissions
          </p>
        </div>

        <button
          type="button"
          className="text-button"
          onClick={() => navigate("/work-reports")}
        >
          View reports
        </button>

      </div>

      {/* =====================================================
          EMPTY STATE
      ====================================================== */}

      {recentReports.length === 0 ? (

        <div className="empty-state">
          No work reports submitted yet.
        </div>

      ) : (

        <div className="table-wrapper">

          <table className="data-table">

            <thead className="professional-table-head">

              <tr>
                <th>Employee</th>
                <th>Work</th>
                <th>Tag</th>
                <th>Completion</th>
                <th>Date</th>
              </tr>

            </thead>

            <tbody>

              {recentReports.map(
                (report) => {

                  const completion =
                    Number(
                      report.completion_percentage || 0
                    );

                  return (
                    <tr
                      key={report.id}
                    >

                      <td>
                        <strong>
                          {getEmployeeName(
                            report.employee_id
                          )}
                        </strong>
                      </td>

                      <td>
                        {report.title}
                      </td>

                      <td>
                        {report.tag}
                      </td>

                      <td>

                        <span
                          className={`status-badge ${
                            completion === 100
                              ? "success"
                              : completion === 0
                                ? "danger"
                                : "warning"
                          }`}
                        >
                          {completion}%
                        </span>

                      </td>

                      <td>
                        {formatDate(
                          report.created_at
                        )}
                      </td>

                    </tr>
                  );
                }
              )}

            </tbody>

          </table>

        </div>

      )}

    </div>
  );
}

export default RecentReports;