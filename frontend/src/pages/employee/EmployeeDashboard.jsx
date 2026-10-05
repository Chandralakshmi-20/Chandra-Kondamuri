import { useEffect, useMemo, useState } from "react";
import {
  BriefcaseBusiness,
  CalendarDays,
  ClipboardCheck,
  Clock3,
  FolderKanban,
  TrendingUp,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import "./EmployeeDashboard.css";

import StatCard from "../../components/common/StatCard";
import PageHeader from "../../components/common/PageHeader";

import { useAuth } from "../../context/AuthContext";

import {
  getMyProjects,
  getMyWorkReports,
  getMyLeaves,
} from "../../services/employeeDashboardService";


function EmployeeDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [projects, setProjects] = useState([]);
  const [workReports, setWorkReports] = useState([]);
  const [leaves, setLeaves] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");


  // =========================================================
  // LOAD EMPLOYEE DASHBOARD DATA
  // =========================================================

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        setLoading(true);
        setError("");

        const [
          projectsData,
          reportsData,
          leavesData,
        ] = await Promise.all([
          getMyProjects(),
          getMyWorkReports(),
          getMyLeaves(),
        ]);

        setProjects(projectsData || []);
        setWorkReports(reportsData || []);
        setLeaves(leavesData || []);

      } catch (error) {
        console.error(
          "Failed to load employee dashboard:",
          error
        );

        setError(
          "Failed to load dashboard data. Please refresh the page."
        );
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, []);


  // =========================================================
  // CURRENT PROJECT
  // =========================================================

  const currentProject = useMemo(() => {
    if (!projects.length) {
      return null;
    }

    // Prefer active project.
    const activeProject = projects.find(
      (project) =>
        project.status?.toLowerCase() === "active"
    );

    return activeProject || projects[0];
  }, [projects]);


  // =========================================================
  // WORK COMPLETION
  // =========================================================

  const overallCompletion = useMemo(() => {
    if (!workReports.length) {
      return 0;
    }

    const total = workReports.reduce(
      (sum, report) =>
        sum + Number(report.completion_percentage || 0),
      0
    );

    return Math.round(
      total / workReports.length
    );
  }, [workReports]);


  // =========================================================
  // TODAY'S REPORTS
  // =========================================================

  const todayReports = useMemo(() => {
    const today = new Date();

    const todayString =
      `${today.getFullYear()}-${String(
        today.getMonth() + 1
      ).padStart(2, "0")}-${String(
        today.getDate()
      ).padStart(2, "0")}`;

    return workReports.filter((report) => {
      const startDate = report.start_date;
      const endDate = report.end_date;

      return (
        startDate === todayString ||
        endDate === todayString
      );
    });
  }, [workReports]);


  // =========================================================
  // COMPLETED REPORTS
  // =========================================================

  const completedReports = useMemo(() => {
    return workReports.filter(
      (report) =>
        Number(report.completion_percentage || 0) >= 100
    ).length;
  }, [workReports]);


  // =========================================================
  // RECENT LEAVES
  // =========================================================

  const recentLeaves = useMemo(() => {
    return [...leaves]
      .sort(
        (a, b) =>
          new Date(b.created_at) -
          new Date(a.created_at)
      )
      .slice(0, 3);
  }, [leaves]);


  // =========================================================
  // DATE FORMAT
  // =========================================================

  const formatDate = (dateValue) => {
    if (!dateValue) {
      return "-";
    }

    const date = new Date(dateValue);

    if (Number.isNaN(date.getTime())) {
      return "-";
    }

    return date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };


  // =========================================================
  // STATUS CLASS
  // =========================================================

  const getStatusClass = (status) => {
    const normalizedStatus =
      status?.toLowerCase();

    if (normalizedStatus === "approved") {
      return "success";
    }

    if (normalizedStatus === "rejected") {
      return "danger";
    }

    if (normalizedStatus === "pending") {
      return "warning";
    }

    if (normalizedStatus === "active") {
      return "success";
    }

    return "warning";
  };


  // =========================================================
  // LOADING
  // =========================================================

  if (loading) {
    return (
      <div className="employee-dashboard">
        <PageHeader
          title={`Welcome back, ${
            user?.full_name || "Employee"
          } 👋`}
          description="Here's an overview of your work, projects and leave status."
        />

        <div className="panel">
          <div className="leave-empty">
            <h3>Loading dashboard...</h3>
            <p>
              Please wait while we load your latest information.
            </p>
          </div>
        </div>
      </div>
    );
  }


  return (
    <div className="employee-dashboard">

      {/* =====================================================
          PAGE HEADER
      ====================================================== */}

      <PageHeader
        title={`Welcome back, ${
          user?.full_name || "Employee"
        } 👋`}
        description="Here's an overview of your work, projects and leave status."
      />


      {/* =====================================================
          ERROR MESSAGE
      ====================================================== */}

      {error && (
        <div className="panel">
          <div className="leave-empty">
            <h3>Unable to load dashboard</h3>
            <p>{error}</p>
          </div>
        </div>
      )}


      {/* =====================================================
          EMPLOYEE STATISTICS
      ====================================================== */}

      <section className="stats-grid">

        <StatCard
          title="My Projects"
          value={projects.length}
          subtitle="Currently assigned"
          icon={FolderKanban}
        />

        <StatCard
          title="Work Reports"
          value={workReports.length}
          subtitle="Reports submitted"
          icon={ClipboardCheck}
        />

        <StatCard
          title="Leave Requests"
          value={leaves.length}
          subtitle="Total requests"
          icon={CalendarDays}
        />

        <StatCard
          title="Work Completion"
          value={`${overallCompletion}%`}
          subtitle="Overall progress"
          icon={TrendingUp}
        />

      </section>


      {/* =====================================================
          MAIN DASHBOARD
      ====================================================== */}

      <section className="dashboard-grid">

        {/* ===================================================
            CURRENT PROJECT
        ==================================================== */}

        <div className="panel">

          <div className="panel-header">

            <div>
              <h2>My Current Project</h2>
              <p>Your assigned project</p>
            </div>

            <BriefcaseBusiness size={20} />

          </div>


          {currentProject ? (

            <div className="project-card">

              <div className="project-card-header">

                <div>
                  <strong>
                    {currentProject.name}
                  </strong>

                  <span>
                    {currentProject.description ||
                      "No project description available."}
                  </span>
                </div>

                <span
                  className={`status-badge ${getStatusClass(
                    currentProject.status
                  )}`}
                >
                  {currentProject.status || "Active"}
                </span>

              </div>


              <div className="project-progress">

                <div className="progress-label">

                  <span>
                    Completion
                  </span>

                  <strong>
                    {currentProject.completion_percentage || 0}%
                  </strong>

                </div>


                <div className="progress-track">

                  <div
                    className="progress-fill"
                    style={{
                      width: `${
                        currentProject.completion_percentage || 0
                      }%`,
                    }}
                  />

                </div>

              </div>


              <div className="project-dates">

                <div>
                  <span>
                    Start Date
                  </span>

                  <strong>
                    {formatDate(
                      currentProject.start_date
                    )}
                  </strong>
                </div>


                <div>
                  <span>
                    End Date
                  </span>

                  <strong>
                    {formatDate(
                      currentProject.end_date
                    )}
                  </strong>
                </div>

              </div>

            </div>

          ) : (

            <div className="leave-empty">

              <FolderKanban size={32} />

              <h3>
                No projects assigned
              </h3>

              <p>
                You currently don't have any assigned projects.
              </p>

            </div>

          )}

        </div>


        {/* ===================================================
            TODAY'S WORK
        ==================================================== */}

        <div className="panel">

          <div className="panel-header">

            <div>
              <h2>Today's Work</h2>
              <p>Your daily activity</p>
            </div>

            <Clock3 size={20} />

          </div>


          <div className="employee-work-summary">

            <div className="work-summary-item">
              <span>
                Today's Reports
              </span>

              <strong>
                {todayReports.length}
              </strong>
            </div>


            <div className="work-summary-item">
              <span>
                Total Reports
              </span>

              <strong>
                {workReports.length}
              </strong>
            </div>


            <div className="work-summary-item">
              <span>
                Completed Reports
              </span>

              <strong>
                {completedReports}
              </strong>
            </div>

          </div>


          <div
            style={{
              marginTop: "16px",
              fontSize: "13px",
              color: "#6b7280",
            }}
          >
            Working hours are not currently tracked by the
            employee dashboard API.
          </div>

        </div>

      </section>


      {/* =====================================================
          LEAVE STATUS
      ====================================================== */}

      <section className="dashboard-full">

        <div className="panel">

          <div className="panel-header">

            <div>
              <h2>Leave Status</h2>
              <p>Your recent leave requests</p>
            </div>

            <button
              type="button"
              className="text-button"
              onClick={() => navigate("/leaves")}
            >
              View all
            </button>

          </div>


          {recentLeaves.length > 0 ? (

            <div className="employee-leave-list">

              {recentLeaves.map((leave) => (

                <div
                  key={leave.id}
                  className="employee-leave-item"
                >

                  <div>

                    <strong>
                      {formatDate(leave.start_date)}
                      {" - "}
                      {formatDate(leave.end_date)}
                    </strong>

                    <span>
                      {leave.reason}
                    </span>

                  </div>


                  <span
                    className={`status-badge ${getStatusClass(
                      leave.status
                    )}`}
                  >
                    {leave.status || "Pending"}
                  </span>

                </div>

              ))}

            </div>

          ) : (

            <div className="leave-empty">

              <CalendarDays size={32} />

              <h3>
                No leave requests
              </h3>

              <p>
                You haven't submitted any leave requests yet.
              </p>

            </div>

          )}

        </div>

      </section>


      {/* =====================================================
          QUICK ACTIONS
      ====================================================== */}

      <section className="dashboard-full">

        <div className="panel">

          <div className="panel-header">

            <div>
              <h2>Quick Actions</h2>
              <p>
                Frequently used employee options
              </p>
            </div>

          </div>


          <div className="quick-actions">

            <button
              type="button"
              className="quick-action"
              onClick={() =>
                navigate("/work-reports")
              }
            >
              <ClipboardCheck size={20} />
              <span>
                Submit Work Report
              </span>
            </button>


            <button
              type="button"
              className="quick-action"
              onClick={() =>
                navigate("/leaves")
              }
            >
              <CalendarDays size={20} />
              <span>
                Apply Leave
              </span>
            </button>


            <button
              type="button"
              className="quick-action"
              onClick={() =>
                navigate("/projects")
              }
            >
              <FolderKanban size={20} />
              <span>
                View My Projects
              </span>
            </button>


            <button
              type="button"
              className="quick-action"
              onClick={() =>
                navigate("/work-reports")
              }
            >
              <TrendingUp size={20} />
              <span>
                View Performance
              </span>
            </button>

          </div>

        </div>

      </section>

    </div>
  );
}

export default EmployeeDashboard;