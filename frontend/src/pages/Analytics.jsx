
import { useEffect, useState } from "react";
import {
  ChartNoAxesCombined,
  TrendingUp,
  Users,
  ClipboardCheck,
} from "lucide-react";

import PageHeader from "../components/common/PageHeader";
import api from "../services/api";
import "./Analytics.css";

function Analytics() {
  const [employees, setEmployees] = useState([]);
  const [reports, setReports] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      setError("");

      const [employeesResponse, reportsResponse] =
        await Promise.all([
          api.get("/api/employees"),
          api.get("/api/work-reports/all"),
        ]);

      setEmployees(employeesResponse.data || []);
      setReports(reportsResponse.data || []);
    } catch (error) {
      console.error(
        "Failed to load analytics:",
        error
      );

      setError(
        error?.response?.data?.detail ||
          "Failed to load analytics."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnalytics();
  }, []);

  const getEmployeeReports = (employeeId) => {
    return reports.filter(
      (report) =>
        report.employee_id === employeeId
    );
  };

  const getEmployeeCompletion = (employeeId) => {
    const employeeReports =
      getEmployeeReports(employeeId);

    if (employeeReports.length === 0) {
      return 0;
    }

    const total = employeeReports.reduce(
      (sum, report) =>
        sum +
        Number(
          report.completion_percentage || 0
        ),
      0
    );

    return Math.round(
      total / employeeReports.length
    );
  };

  const totalReports = reports.length;

  const averageCompletion =
    totalReports === 0
      ? 0
      : Math.round(
          reports.reduce(
            (sum, report) =>
              sum +
              Number(
                report.completion_percentage || 0
              ),
            0
          ) / totalReports
        );

  const completedReports = reports.filter(
    (report) =>
      Number(
        report.completion_percentage || 0
      ) === 100
  ).length;

  if (loading) {
    return (
      <div className="analytics-page">
        <PageHeader
          title="Analytics"
          description="Track employee work completion and performance."
        />

        <div className="empty-panel">
          <p>Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="analytics-page">
        <PageHeader
          title="Analytics"
          description="Track employee work completion and performance."
        />

        <div className="empty-panel">
          <h2>Unable to load analytics</h2>

          <p>{error}</p>

          <button
            type="button"
            onClick={loadAnalytics}
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="analytics-page">
      <PageHeader
        title="Analytics"
        description="Track employee work completion and performance."
      />

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">
            <Users size={22} />
          </div>

          <div>
            <span>Total Employees</span>
            <strong>{employees.length}</strong>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            <ClipboardCheck size={22} />
          </div>

          <div>
            <span>Total Reports</span>
            <strong>{totalReports}</strong>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            <TrendingUp size={22} />
          </div>

          <div>
            <span>Average Completion</span>
            <strong>
              {averageCompletion}%
            </strong>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            <ChartNoAxesCombined size={22} />
          </div>

          <div>
            <span>Completed Reports</span>
            <strong>
              {completedReports}
            </strong>
          </div>
        </div>
      </div>

      <div className="panel">
        <div className="panel-header">
          <div>
            <h2>Employee Performance</h2>

            <p>
              Work completion based on submitted
              work reports.
            </p>
          </div>
        </div>

        {employees.length === 0 ? (
          <div className="empty-panel">
            <h2>No employees found</h2>
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Department</th>
                  <th>Designation</th>
                  <th>Reports</th>
                  <th>Completion</th>
                </tr>
              </thead>

              <tbody>
                {employees.map((employee) => {
                  const employeeReports =
                    getEmployeeReports(
                      employee.id
                    );

                  const completion =
                    getEmployeeCompletion(
                      employee.id
                    );

                  return (
                    <tr key={employee.id}>
                      <td>
                        <strong>
                          {employee.full_name}
                        </strong>
                      </td>

                      <td>
                        {employee.department ||
                          "Not assigned"}
                      </td>

                      <td>
                        {employee.designation ||
                          "Not assigned"}
                      </td>

                      <td>
                        {employeeReports.length}
                      </td>

                      <td>
                        <div className="completion-cell">
                          <div className="completion-track">
                            <div
                              className="completion-fill"
                              style={{
                                width: `${completion}%`,
                              }}
                            />
                          </div>

                          <strong className="completion-value">
                            {completion}%
                          </strong>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default Analytics;

