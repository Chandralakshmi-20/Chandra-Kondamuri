import { Navigate, Route, Routes } from "react-router-dom";

import MainLayout from "./layouts/MainLayout";
import ProtectedRoute from "./components/common/ProtectedRoute";

import HRDashboard from "./pages/hr/HRDashboard";
import EmployeeDashboard from "./pages/employee/EmployeeDashboard";

import Employees from "./pages/Employees";
import Projects from "./pages/Projects";
import WorkReports from "./pages/WorkReports";
import Leaves from "./pages/Leaves";
import Notifications from "./pages/Notifications";
import Profile from "./pages/Profile";
import Analytics from "./pages/Analytics";
import Attendance from "./pages/Attendance";

import Login from "./pages/auth/Login";
import VerifyOTP from "./pages/auth/VerifyOTP";


function App() {
  return (
    <Routes>

      {/* ==================================================
          PUBLIC AUTHENTICATION
          ================================================== */}

      <Route
        path="/login"
        element={<Login />}
      />

      <Route
        path="/verify-otp"
        element={<VerifyOTP />}
      />


      {/* ==================================================
          COMMON AUTHENTICATED LAYOUT
          ================================================== */}

      <Route element={<ProtectedRoute />}>

        <Route element={<MainLayout />}>


          {/* ==================================================
              HR DASHBOARD
              HR ONLY
              ================================================== */}

          <Route
            element={
              <ProtectedRoute
                allowedRoles={["hr"]}
              />
            }
          >
            <Route
              path="/hr/dashboard"
              element={<HRDashboard />}
            />
          </Route>


          {/* ==================================================
              EMPLOYEE DASHBOARD
              EMPLOYEE ONLY
              ================================================== */}

          <Route
            element={
              <ProtectedRoute
                allowedRoles={["employee"]}
              />
            }
          >
            <Route
              path="/employee/dashboard"
              element={<EmployeeDashboard />}
            />
          </Route>


          {/* ==================================================
              EMPLOYEE MANAGEMENT
              HR ONLY
              ================================================== */}

          <Route
            element={
              <ProtectedRoute
                allowedRoles={["hr"]}
              />
            }
          >
            <Route
              path="/employees"
              element={<Employees />}
            />
          </Route>


          {/* ==================================================
              PROJECTS
              HR + EMPLOYEE
              ================================================== */}

          <Route
            element={
              <ProtectedRoute
                allowedRoles={[
                  "hr",
                  "employee",
                ]}
              />
            }
          >
            <Route
              path="/projects"
              element={<Projects />}
            />
          </Route>


          {/* ==================================================
              WORK REPORTS
              HR + EMPLOYEE
              ================================================== */}

          <Route
            element={
              <ProtectedRoute
                allowedRoles={[
                  "hr",
                  "employee",
                ]}
              />
            }
          >
            <Route
              path="/work-reports"
              element={<WorkReports />}
            />
          </Route>


          {/* ==================================================
              LEAVE MANAGEMENT
              HR + EMPLOYEE
              ================================================== */}

          <Route
            element={
              <ProtectedRoute
                allowedRoles={[
                  "hr",
                  "employee",
                ]}
              />
            }
          >
            <Route
              path="/leaves"
              element={<Leaves />}
            />
          </Route>


          {/* ==================================================
              ATTENDANCE
              HR + EMPLOYEE
              ================================================== */}

          <Route
            element={
              <ProtectedRoute
                allowedRoles={[
                  "hr",
                  "employee",
                ]}
              />
            }
          >
            <Route
              path="/attendance"
              element={<Attendance />}
            />
          </Route>


          {/* ==================================================
              NOTIFICATIONS
              HR + EMPLOYEE
              ================================================== */}

          <Route
            element={
              <ProtectedRoute
                allowedRoles={[
                  "hr",
                  "employee",
                ]}
              />
            }
          >
            <Route
              path="/notifications"
              element={<Notifications />}
            />
          </Route>


          {/* ==================================================
              PROFILE
              HR + EMPLOYEE
              ================================================== */}

          <Route
            element={
              <ProtectedRoute
                allowedRoles={[
                  "hr",
                  "employee",
                ]}
              />
            }
          >
            <Route
              path="/profile"
              element={<Profile />}
            />
          </Route>


          {/* ==================================================
              ANALYTICS
              HR ONLY
              ================================================== */}

          <Route
            element={
              <ProtectedRoute
                allowedRoles={["hr"]}
              />
            }
          >
            <Route
              path="/analytics"
              element={<Analytics />}
            />
          </Route>


        </Route>

      </Route>


      {/* ==================================================
          DEFAULT ROUTE
          ================================================== */}

      <Route
        path="/"
        element={
          <Navigate
            to="/login"
            replace
          />
        }
      />


      {/* ==================================================
          UNKNOWN ROUTE
          ================================================== */}

      <Route
        path="*"
        element={
          <Navigate
            to="/login"
            replace
          />
        }
      />

    </Routes>
  );
}

export default App;