import { useEffect, useState } from "react";

import {
  Users,
  FolderKanban,
  CalendarCheck,
  ClipboardCheck,
  TrendingUp,
  Clock3,
} from "lucide-react";

import "./HRDashboard.css";

import StatCard from "../../components/common/StatCard";
import PageHeader from "../../components/common/PageHeader";
import WorkProgress from "../../components/dashboard/WorkProgress";
import RecentReports from "../../components/dashboard/RecentReports";
import UpcomingEvents from "../../components/dashboard/UpcomingEvents";

import {
  getEmployees,
  getAllProjects,
  getAllLeaves,
  getAllWorkReports,
  getAllAttendance,
  getNotifications,
} from "../../services/dashboardService";


function HRDashboard() {
  const [employees, setEmployees] = useState([]);
  const [projects, setProjects] = useState([]);
  const [leaves, setLeaves] = useState([]);
  const [workReports, setWorkReports] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [notifications, setNotifications] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");


  // ---------------------------------------------------------
  // LOAD HR DASHBOARD DATA
  // ---------------------------------------------------------

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setLoading(true);
        setError("");

        const [
          employeesData,
          projectsData,
          leavesData,
          workReportsData,
          attendanceData,
          notificationsData,
        ] = await Promise.all([
          getEmployees(),
          getAllProjects(),
          getAllLeaves(),
          getAllWorkReports(),
          getAllAttendance(),
          getNotifications(),
        ]);

        setEmployees(employeesData || []);
        setProjects(projectsData || []);
        setLeaves(leavesData || []);
        setWorkReports(workReportsData || []);
        setAttendance(attendanceData || []);
        setNotifications(notificationsData || []);

      } catch (err) {
        console.error(
          "Failed to load HR dashboard:",
          err
        );

        setError(
          err?.response?.data?.detail ||
          "Failed to load dashboard data."
        );
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, []);


  // ---------------------------------------------------------
  // CALCULATE DASHBOARD VALUES
  // ---------------------------------------------------------

  const totalEmployees = employees.length;

  const activeProjects = projects.filter(
    (project) =>
      project.status?.toLowerCase() === "active"
  ).length;

  const pendingLeaves = leaves.filter(
    (leave) =>
      leave.status?.toLowerCase() === "pending"
  ).length;

  const reportsSubmitted = workReports.length;

  const averageCompletion =
    workReports.length > 0
      ? Math.round(
          workReports.reduce(
            (total, report) =>
              total +
              Number(
                report.completion_percentage || 0
              ),
            0
          ) / workReports.length
        )
      : 0;


  // ---------------------------------------------------------
  // LOADING
  // ---------------------------------------------------------

  if (loading) {
    return (
      <div className="hr-dashboard">
        <PageHeader
          title="Good morning, Chandra 👋"
          description="Here's what's happening across your organization today."
        />

        <div className="dashboard-loading">
          Loading dashboard data...
        </div>
      </div>
    );
  }


  // ---------------------------------------------------------
  // ERROR
  // ---------------------------------------------------------

  if (error) {
    return (
      <div className="hr-dashboard">
        <PageHeader
          title="Good morning, Chandra 👋"
          description="Here's what's happening across your organization today."
        />

        <div className="dashboard-error">
          {error}
        </div>
      </div>
    );
  }


  // ---------------------------------------------------------
  // DASHBOARD
  // ---------------------------------------------------------

  return (
    <div className="hr-dashboard">

      <PageHeader
        title="Good morning, Chandra 👋"
        description="Here's what's happening across your organization today."
      />


      {/* =====================================================
          STATISTICS
      ====================================================== */}

      <section className="stats-grid">

        <StatCard
          title="Total Employees"
          value={totalEmployees}
          subtitle="Registered employees"
          icon={Users}
        />

        <StatCard
          title="Active Projects"
          value={activeProjects}
          subtitle="Currently active"
          icon={FolderKanban}
        />

        <StatCard
          title="Pending Leaves"
          value={pendingLeaves}
          subtitle="Requires attention"
          icon={CalendarCheck}
        />

        <StatCard
          title="Work Reports"
          value={`${averageCompletion}%`}
          subtitle={`${reportsSubmitted} reports submitted`}
          icon={ClipboardCheck}
        />

      </section>


      {/* =====================================================
          PERFORMANCE + EVENTS
      ====================================================== */}

      <section className="dashboard-grid">

        <WorkProgress
          employees={employees}
          projects={projects}
          workReports={workReports}
        />

        <UpcomingEvents
          employees={employees}
          notifications={notifications}
        />

      </section>


      {/* =====================================================
          RECENT REPORTS
      ====================================================== */}

      <section className="dashboard-full">

        <RecentReports
          reports={workReports}
          employees={employees}
        />

      </section>


      {/* =====================================================
          SUMMARY
      ====================================================== */}

      <section className="analytics-summary">

        <div className="summary-card">

          <div className="summary-icon">
            <TrendingUp size={21} />
          </div>

          <div>
            <span>Average Completion</span>
            <strong>
              {averageCompletion}%
            </strong>
          </div>

        </div>


        <div className="summary-card">

          <div className="summary-icon">
            <Clock3 size={21} />
          </div>

          <div>
            <span>Reports Submitted</span>
            <strong>
              {reportsSubmitted}
            </strong>
          </div>

        </div>

      </section>


      {/* =====================================================
          ATTENDANCE INFORMATION
      ====================================================== */}

      <section className="analytics-summary">

        <div className="summary-card">

          <div className="summary-icon">
            <Users size={21} />
          </div>

          <div>
            <span>Attendance Records</span>
            <strong>
              {attendance.length}
            </strong>
          </div>

        </div>


        <div className="summary-card">

          <div className="summary-icon">
            <CalendarCheck size={21} />
          </div>

          <div>
            <span>Active Employees</span>
            <strong>
              {
                employees.filter(
                  (employee) =>
                    employee.is_active
                ).length
              }
            </strong>
          </div>

        </div>

      </section>

    </div>
  );
}

export default HRDashboard;