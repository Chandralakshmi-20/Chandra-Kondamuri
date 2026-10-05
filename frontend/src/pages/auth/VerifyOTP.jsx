
import {
  useEffect,
  useRef,
  useState,
} from "react";

import {
  ArrowLeft,
  ShieldCheck,
} from "lucide-react";

import {
  useNavigate,
} from "react-router-dom";

import api from "../../services/api";
import { useAuth } from "../../context/AuthContext";

function VerifyOTP() {
  const navigate = useNavigate();

  const { login } = useAuth();

  const [email, setEmail] = useState("");

  const [otp, setOtp] = useState([
    "",
    "",
    "",
    "",
    "",
    "",
  ]);

  const [loading, setLoading] = useState(false);

  const [error, setError] = useState("");

  const inputRefs = useRef([]);

  const otpValue = otp.join("");

  // =========================================================
  // RESTORE EMAIL
  // =========================================================

  useEffect(() => {
    const savedEmail =
      sessionStorage.getItem("otp_email");

    if (!savedEmail) {
      navigate("/login", {
        replace: true,
      });

      return;
    }

    setEmail(savedEmail);

    setTimeout(() => {
      inputRefs.current[0]?.focus();
    }, 100);
  }, [navigate]);

  // =========================================================
  // HANDLE OTP INPUT
  // =========================================================

  const handleOtpChange = (
    index,
    value
  ) => {
    const digits =
      value.replace(/\D/g, "");

    if (!digits) {
      const updatedOtp = [...otp];

      updatedOtp[index] = "";

      setOtp(updatedOtp);
      setError("");

      return;
    }

    const updatedOtp = [...otp];

    // -------------------------------------------------------
    // OTP PASTE
    // -------------------------------------------------------

    if (digits.length > 1) {
      const pastedDigits =
        digits
          .slice(0, 6)
          .split("");

      pastedDigits.forEach(
        (digit, i) => {
          updatedOtp[i] = digit;
        }
      );

      setOtp(updatedOtp);
      setError("");

      const nextIndex =
        Math.min(
          pastedDigits.length,
          5
        );

      inputRefs.current[
        nextIndex
      ]?.focus();

      return;
    }

    // -------------------------------------------------------
    // SINGLE DIGIT
    // -------------------------------------------------------

    updatedOtp[index] =
      digits[0];

    setOtp(updatedOtp);
    setError("");

    if (index < 5) {
      inputRefs.current[
        index + 1
      ]?.focus();
    }
  };

  // =========================================================
  // HANDLE KEYBOARD
  // =========================================================

  const handleKeyDown = (
    index,
    event
  ) => {
    if (
      event.key === "Backspace" &&
      !otp[index] &&
      index > 0
    ) {
      inputRefs.current[
        index - 1
      ]?.focus();
    }

    if (
      event.key === "ArrowLeft" &&
      index > 0
    ) {
      inputRefs.current[
        index - 1
      ]?.focus();
    }

    if (
      event.key === "ArrowRight" &&
      index < 5
    ) {
      inputRefs.current[
        index + 1
      ]?.focus();
    }
  };

  // =========================================================
  // VERIFY OTP
  // =========================================================

  const handleSubmit = async (
    event
  ) => {
    event.preventDefault();

    setError("");

    if (otpValue.length !== 6) {
      setError(
        "Please enter the complete 6-digit OTP."
      );

      return;
    }

    setLoading(true);

    try {
      const response =
        await api.post(
          "/api/auth/verify-otp",
          {
            email,
            otp: otpValue,
          }
        );

      const data = response.data;

      // =====================================================
      // CLEAR OLD AUTH DATA
      // =====================================================

      localStorage.removeItem(
        "access_token"
      );

      localStorage.removeItem(
        "otp_email"
      );

      sessionStorage.removeItem(
        "access_token"
      );

      // =====================================================
      // SAVE NEW JWT IN SESSION STORAGE
      // IMPORTANT:
      // api.js ALSO READS FROM SESSION STORAGE
      // =====================================================

      sessionStorage.setItem(
        "access_token",
        data.access_token
      );

      // =====================================================
      // OTP EMAIL NO LONGER NEEDED
      // =====================================================

      sessionStorage.removeItem(
        "otp_email"
      );

      // =====================================================
      // SAVE USER IN AUTH CONTEXT
      // =====================================================

      login(data.user);

      // =====================================================
     // DEBUG
    // =====================================================

      console.log("OTP VERIFY RESPONSE:", data);
      console.log("USER:", data.user);
      console.log("ROLE:", data.user?.role);

      // =====================================================
      // NORMALIZE ROLE
      // =====================================================

      const role =
        String(
          data.user?.role || ""
        )
          .trim()
          .toLowerCase();

      // =====================================================
      // ROLE BASED REDIRECT
      // =====================================================

      if (role === "hr") {
        navigate(
          "/hr/dashboard",
          {
            replace: true,
          }
        );

        return;
      }

      if (role === "employee") {
        navigate(
          "/employee/dashboard",
          {
            replace: true,
          }
        );

        return;
      }

      // =====================================================
      // UNKNOWN ROLE
      // =====================================================

      setError(
        "Your account role is not recognized."
      );

      sessionStorage.removeItem(
        "access_token"
      );

      login(null);

    } catch (error) {
      console.error(
        "OTP verification error:",
        error
      );

      if (
        error.response?.data?.detail
      ) {
        setError(
          error.response.data.detail
        );
      } else {
        setError(
          "Unable to verify OTP. Please try again."
        );
      }

    } finally {
      setLoading(false);
    }
  };

  // =========================================================
  // RENDER
  // =========================================================

  return (
    <div className="auth-page">

      <div className="auth-left">

        <div className="auth-brand">
          <div className="brand-icon">
            HR
          </div>

          <span>
            HRMS
          </span>
        </div>

        <div className="auth-content">

          <span className="auth-eyebrow">
            SECURE ACCESS
          </span>

          <h1>
            Verify your
            <br />
            <span>
              identity.
            </span>
          </h1>

          <p>
            Enter the one-time
            password sent to your
            registered email address.
          </p>

        </div>

        <div className="auth-footer">
          © 2026 HRMS. All rights reserved.
        </div>

      </div>

      <div className="auth-right">

        <div className="login-card">

          <div className="login-icon">
            <ShieldCheck
              size={25}
            />
          </div>

          <h2>
            Enter OTP
          </h2>

          <p>
            We sent a verification
            code to your email.
          </p>

          {email && (
            <p>
              <strong>
                {email}
              </strong>
            </p>
          )}

          <form
            onSubmit={handleSubmit}
          >

            <label>
              One-Time Password
            </label>

            <div
              className="otp-box-container"
              style={{
                display: "flex",
                gap: "10px",
                justifyContent: "center",
                margin: "20px 0",
              }}
            >

              {otp.map(
                (
                  digit,
                  index
                ) => (
                  <input
                    key={index}
                    ref={(element) => {
                      inputRefs.current[
                        index
                      ] = element;
                    }}
                    className="otp-digit-box"
                    type="text"
                    inputMode="numeric"
                    autoComplete={
                      index === 0
                        ? "one-time-code"
                        : "off"
                    }
                    maxLength={6}
                    value={digit}
                    onChange={(
                      event
                    ) =>
                      handleOtpChange(
                        index,
                        event.target.value
                      )
                    }
                    onKeyDown={(
                      event
                    ) =>
                      handleKeyDown(
                        index,
                        event
                      )
                    }
                    onFocus={(
                      event
                    ) =>
                      event.target.select()
                    }
                    aria-label={`OTP digit ${
                      index + 1
                    }`}
                    required
                    style={{
                      width: "45px",
                      height: "52px",
                      textAlign: "center",
                      fontSize: "22px",
                      fontWeight: "600",
                      border:
                        "1px solid #d1d5db",
                      borderRadius: "10px",
                      outline: "none",
                    }}
                  />
                )
              )}

            </div>

            {error && (
              <div className="auth-error">
                {error}
              </div>
            )}

            <button
              className="primary-button"
              type="submit"
              disabled={
                loading ||
                otpValue.length !== 6
              }
            >
              {loading
                ? "Verifying..."
                : "Verify & Continue"}
            </button>

          </form>

          <button
            className="back-button"
            type="button"
            onClick={() => {
              sessionStorage.removeItem(
                "otp_email"
              );

              navigate("/login");
            }}
          >
            <ArrowLeft
              size={16}
            />

            Change email
          </button>

        </div>

      </div>

    </div>
  );
}

export default VerifyOTP;

