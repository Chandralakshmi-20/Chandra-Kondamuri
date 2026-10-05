
import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

import api from "../services/api";

const AuthContext =
  createContext(null);

export function AuthProvider({
  children,
}) {
  const [user, setUser] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  // =========================================================
  // RESTORE LOGIN AFTER PAGE REFRESH
  // =========================================================

  useEffect(() => {
    let mounted = true;

    const restoreLogin = async () => {

      // -------------------------------------------------------
      // API.JS USES SESSION STORAGE
      // SO AUTH CONTEXT MUST ALSO USE SESSION STORAGE
      // -------------------------------------------------------

      const token =
        sessionStorage.getItem(
          "access_token"
        );

      // -------------------------------------------------------
      // NO TOKEN
      // -------------------------------------------------------

      if (!token) {
        if (mounted) {
          setUser(null);
          setLoading(false);
        }

        return;
      }

      // -------------------------------------------------------
      // TOKEN EXISTS
      // ASK BACKEND WHO IS LOGGED IN
      // -------------------------------------------------------

      try {
        const response =
          await api.get(
            "/api/auth/me"
          );

        if (mounted) {
          setUser(
            response.data
          );
        }

      } catch (error) {
        console.error(
          "Failed to restore login:",
          error
        );

        // -----------------------------------------------------
        // INVALID TOKEN
        // -----------------------------------------------------

        sessionStorage.removeItem(
          "access_token"
        );

        sessionStorage.removeItem(
          "otp_email"
        );

        // Remove old legacy localStorage token.
        localStorage.removeItem(
          "access_token"
        );

        localStorage.removeItem(
          "otp_email"
        );

        if (mounted) {
          setUser(null);
        }

      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    restoreLogin();

    return () => {
      mounted = false;
    };

  }, []);

  // =========================================================
  // LOGIN
  // =========================================================

  const login = (userData) => {
    setUser(userData);
  };

  // =========================================================
  // LOGOUT
  // =========================================================

  const logout = async () => {

    try {
      await api.post(
        "/api/auth/logout"
      );

    } catch (error) {
      console.error(
        "Logout API error:",
        error
      );

    } finally {

      // -----------------------------------------------------
      // CLEAR SESSION AUTH DATA
      // -----------------------------------------------------

      sessionStorage.removeItem(
        "access_token"
      );

      sessionStorage.removeItem(
        "otp_email"
      );

      // -----------------------------------------------------
      // CLEAR OLD LOCAL STORAGE DATA
      // -----------------------------------------------------

      localStorage.removeItem(
        "access_token"
      );

      localStorage.removeItem(
        "otp_email"
      );

      setUser(null);
    }
  };

  // =========================================================
  // AUTH CONTEXT
  // =========================================================

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        loading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// =========================================================
// USE AUTH
// =========================================================

export function useAuth() {
  return useContext(
    AuthContext
  );
}

