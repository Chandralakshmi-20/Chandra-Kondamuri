import {
  Navigate,
  Outlet,
  useLocation,
} from "react-router-dom";

import { useAuth } from "../../context/AuthContext";

function ProtectedRoute({
  allowedRoles,
}) {
  const {
    user,
    loading,
  } = useAuth();

  const location =
    useLocation();

  // =========================================================
  // AUTHENTICATION CHECK
  // =========================================================

  if (loading) {
    return (
      <div className="auth-loading">
        Checking authentication...
      </div>
    );
  }

  // =========================================================
  // NOT LOGGED IN
  // =========================================================

  if (!user) {
    return (
      <Navigate
        to="/login"
        replace
        state={{
          from: location,
        }}
      />
    );
  }

  // =========================================================
  // USER ROLE
  // =========================================================

  const userRole =
    String(
      user.role || ""
    )
      .trim()
      .toLowerCase();

  // =========================================================
  // ALLOWED ROLES
  // =========================================================

  const normalizedAllowedRoles =
    allowedRoles?.map(
      (role) =>
        String(role)
          .trim()
          .toLowerCase()
    );

  // =========================================================
  // ROLE AUTHORIZATION
  // =========================================================

  if (
    normalizedAllowedRoles &&
    !normalizedAllowedRoles.includes(
      userRole
    )
  ) {
    // Employee cannot open HR-only page.
    if (
      userRole === "employee"
    ) {
      return (
        <Navigate
          to="/employee/dashboard"
          replace
        />
      );
    }

    // HR cannot open employee-only page.
    if (
      userRole === "hr"
    ) {
      return (
        <Navigate
          to="/hr/dashboard"
          replace
        />
      );
    }

    // Unknown role.
    return (
      <Navigate
        to="/login"
        replace
      />
    );
  }

  // =========================================================
  // AUTHENTICATED + AUTHORIZED
  // =========================================================

  return <Outlet />;
}

export default ProtectedRoute;