import { useState } from "react";
import { Mail, ArrowRight, ShieldCheck } from "lucide-react";
import { useNavigate } from "react-router-dom";

import api from "../../services/api";

function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");
    setLoading(true);

    try {
      await api.post("/api/auth/request-otp", {
        email: email.trim(),
      });

      // Store email temporarily for this browser tab.
      sessionStorage.setItem(
        "otp_email",
        email.trim()
      );

      navigate("/verify-otp");
    } catch (error) {
      console.error("OTP request error:", error);

      if (error.response?.data?.detail) {
        setError(error.response.data.detail);
      } else {
        setError(
          "Unable to send OTP. Please check whether the backend is running."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-left">
        <div className="auth-brand">
          <div className="brand-icon">HR</div>
          <span>HRMS</span>
        </div>

        <div className="auth-content">
          <span className="auth-eyebrow">
            HUMAN RESOURCE MANAGEMENT
          </span>

          <h1>
            Manage your workforce
            <br />
            <span>with confidence.</span>
          </h1>

          <p>
            A centralized platform for employees, projects,
            work reports, leaves and HR analytics.
          </p>
        </div>

        <div className="auth-footer">
          © 2026 HRMS. All rights reserved.
        </div>
      </div>

      <div className="auth-right">
        <div className="login-card">
          <div className="login-icon">
            <ShieldCheck size={25} />
          </div>

          <h2>Welcome back</h2>

          <p>
            Sign in using your registered email address.
          </p>

          <form onSubmit={handleSubmit}>
            <label>Email Address</label>

            <div className="input-wrapper">
              <Mail size={18} />

              <input
                type="email"
                placeholder="you@company.com"
                value={email}
                onChange={(event) =>
                  setEmail(event.target.value)
                }
                required
              />
            </div>

            {error && (
              <div className="auth-error">
                {error}
              </div>
            )}

            <button
              className="primary-button"
              type="submit"
              disabled={loading}
            >
              {loading
                ? "Sending OTP..."
                : "Continue with Email"}

              {!loading && <ArrowRight size={18} />}
            </button>
          </form>

          <div className="login-note">
            A secure one-time password will be sent to
            your email.
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;