import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import welcomeVideo from "../vid/welcome-vid.mp4";
import primaryLogo from "../image/primary-logo.png";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ShieldCheck,
  User,
  Building2,
} from "lucide-react";
import {
  loginPersonal,
  loginBusiness,
  checkActivationRequired,
  resendActivationOtp,
  requestPasswordResetOtp,
  verifyPasswordResetOtp,
  resetPasswordWithOtp,
} from "../api/auth";
// Citizen count is now fetched from API
import "../main.css";

function SignIn() {
  const navigate = useNavigate();
  const location = useLocation();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [accountType, setAccountType] = useState<"personal" | "business">(
    "personal"
  );
  const [activationRequired, setActivationRequired] = useState(true);
  const [checkingActivation, setCheckingActivation] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    activationCode: "",
  });
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotStep, setForgotStep] = useState<"email" | "otp" | "password">(
    "email"
  );
  const [forgotData, setForgotData] = useState({
    email: "",
    otp: "",
    newPassword: "",
  });
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotError, setForgotError] = useState<string | null>(null);
  const [forgotMessage, setForgotMessage] = useState<string | null>(null);

  const normalizedEmail = formData.email.toLowerCase().trim();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setError(null);
    setMessage(null);
  };

  useEffect(() => {
    const canCheck = normalizedEmail && normalizedEmail.includes("@");
    if (!canCheck) {
      setActivationRequired(true);
      return;
    }

    const timer = setTimeout(async () => {
      setCheckingActivation(true);
      const response = await checkActivationRequired(normalizedEmail, accountType);
      if (response.success && typeof response.activation_required === "boolean") {
        setActivationRequired(response.activation_required);
      } else {
        setActivationRequired(true);
      }
      setCheckingActivation(false);
    }, 350);

    return () => clearTimeout(timer);
  }, [normalizedEmail, accountType]);

  const resetForgotState = () => {
    setForgotStep("email");
    setForgotData({
      email: formData.email,
      otp: "",
      newPassword: "",
    });
    setForgotError(null);
    setForgotMessage(null);
    setForgotLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setIsLoading(true);

    try {
      const result =
        accountType === "personal"
          ? await loginPersonal({
              email: formData.email,
              password: formData.password,
              activationCode: formData.activationCode,
            })
          : await loginBusiness({
              email: formData.email,
              password: formData.password,
              activationCode: formData.activationCode,
            });

      if (!result.success) {
        throw new Error(result.message || "Sign in failed");
      }

      if (result.token) {
        localStorage.setItem("token", result.token);
        localStorage.setItem("authToken", result.token);
      }

      if (result.user) {
        const userData = {
          ...result.user,
          account_type: accountType,
        };
        localStorage.setItem("user", JSON.stringify(userData));
      }

      const redirectTo =
        (location.state as { redirectTo?: string } | null)?.redirectTo;
      navigate(
        typeof redirectTo === "string" && redirectTo.startsWith("/")
          ? redirectTo
          : "/newsfeed",
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "An error occurred. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError(null);
    setForgotMessage(null);
    setForgotLoading(true);

    try {
      if (forgotStep === "email") {
        const response = await requestPasswordResetOtp(forgotData.email, accountType);
        if (!response.success) {
          throw new Error(response.message || "Failed to send OTP");
        }
        setForgotMessage("If the email exists, an OTP has been sent. It expires in 5 minutes.");
        setForgotStep("otp");
      } else if (forgotStep === "otp") {
        const response = await verifyPasswordResetOtp(forgotData.email, forgotData.otp);
        if (!response.success) {
          throw new Error(response.message || "Invalid or expired OTP");
        }
        setForgotMessage("OTP verified. Set your new password.");
        setForgotStep("password");
      } else {
        if (!forgotData.newPassword.trim()) {
          throw new Error("New password is required");
        }
        const response = await resetPasswordWithOtp(
          forgotData.email,
          forgotData.otp,
          forgotData.newPassword
        );
        if (!response.success) {
          throw new Error(response.message || "Failed to reset password");
        }

        setShowForgotPassword(false);
        setFormData((prev) => ({
          ...prev,
          email: forgotData.email,
          password: "",
          activationCode: "",
        }));
        setMessage(
          "Password reset successful. Please sign in with your new password."
        );
      }
    } catch (err) {
      setForgotError(
        err instanceof Error ? err.message : "An error occurred. Please try again."
      );
    } finally {
      setForgotLoading(false);
    }
  };

  const toggleForgotPassword = () => {
    if (!showForgotPassword) {
      setForgotData((prev) => ({
        ...prev,
        email: formData.email || prev.email,
      }));
      resetForgotState();
    }
    setShowForgotPassword((prev) => !prev);
    setError(null);
    setMessage(null);
  };

  const handleResendActivationOtp = async () => {
    setError(null);
    setMessage(null);
    const email = formData.email.trim();
    if (!email) {
      setError("Enter your account email first to resend activation OTP.");
      return;
    }

    setResendLoading(true);
    try {
      const response = await resendActivationOtp(email, accountType);
      if (!response.success) {
        throw new Error(response.message || "Failed to resend activation OTP");
      }
      setMessage("A fresh activation OTP has been sent to your email.");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not resend activation OTP."
      );
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="signin-page">
      <div className="signin-background">
        <video autoPlay loop muted playsInline className="signin-video">
          <source src={welcomeVideo} type="video/mp4" />
          Your browser does not support the video tag.
        </video>
      </div>

      <div className="signin-container">
        <div className="signin-form-panel">
          <div className="signin-logo-container">
            <img src={primaryLogo} alt="JOSCITY Logo" className="signin-logo" />
          </div>

          <h2 className="signin-title">Sign in to your account</h2>

          <div
            className="signin-account-type-selector"
            style={{
              display: "flex",
              gap: "10px",
              marginBottom: "20px",
              padding: "8px",
              backgroundColor: "rgba(255, 255, 255, 0.05)",
              borderRadius: "8px",
            }}
          >
            <button
              type="button"
              onClick={() => setAccountType("personal")}
              style={{
                flex: 1,
                padding: "12px",
                borderRadius: "6px",
                border: "none",
                backgroundColor:
                  accountType === "personal"
                    ? "rgba(57, 240, 57, 0.2)"
                    : "transparent",
                color: accountType === "personal" ? "#ffffff" : "#ffffff",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                fontWeight: accountType === "personal" ? "600" : "400",
                transition: "all 0.2s",
              }}
            >
              <User size={18} />
              Personal
            </button>
            <button
              type="button"
              onClick={() => setAccountType("business")}
              style={{
                flex: 1,
                padding: "12px",
                borderRadius: "6px",
                border: "none",
                backgroundColor:
                  accountType === "business"
                    ? "rgba(53, 207, 76, 0.2)"
                    : "transparent",
                color: accountType === "business" ? "#ffffff" : "#ffffff",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                fontWeight: accountType === "business" ? "600" : "400",
                transition: "all 0.2s",
              }}
            >
              <Building2 size={18} />
              Business
            </button>
          </div>

          {!showForgotPassword ? (
            <form className="signin-form" onSubmit={handleSubmit}>
              <div className="signin-form-group">
                <label htmlFor="email">Email</label>
                <div className="signin-input-wrapper">
                  <Mail className="signin-input-icon" size={20} />
                  <input
                    type="email"
                    id="email"
                    name="email"
                    autoComplete="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="Email"
                    required
                  />
                </div>
              </div>

              <div className="signin-form-group">
                <label htmlFor="password">Password</label>
                <div className="signin-input-wrapper">
                  <Lock className="signin-input-icon" size={20} />
                  <input
                    type={showPassword ? "text" : "password"}
                    id="password"
                    name="password"
                    autoComplete="current-password"
                    value={formData.password}
                    onChange={handleInputChange}
                    placeholder="Password"
                    required
                  />
                  <button
                    type="button"
                    className="signin-password-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="signin-input-icon" size={20} />
                    ) : (
                      <Eye className="signin-input-icon" size={20} />
                    )}
                  </button>
                </div>
              </div>

              {activationRequired && (
                <div className="signin-form-group">
                  <label htmlFor="activationCode">
                    Activation Code
                    {checkingActivation ? " (checking...)" : ""}
                  </label>
                  <div className="signin-input-wrapper">
                    <ShieldCheck className="signin-input-icon" size={20} />
                    <input
                      type="text"
                      id="activationCode"
                      name="activationCode"
                      value={formData.activationCode}
                      onChange={handleInputChange}
                      placeholder="Activation Code"
                      required
                    />
                  </div>
                  <button
                    type="button"
                    className="signin-forgot-password-button"
                    onClick={handleResendActivationOtp}
                    disabled={resendLoading || checkingActivation}
                    style={{
                      alignSelf: "flex-start",
                      marginTop: "8px",
                      opacity: resendLoading || checkingActivation ? 0.6 : 1,
                      cursor:
                        resendLoading || checkingActivation
                          ? "not-allowed"
                          : "pointer",
                    }}
                  >
                    {resendLoading ? "Resending..." : "Resend OTP"}
                  </button>
                </div>
              )}

              {error && (
                <div
                  className="signin-error-message"
                  style={{
                    color: "#ff4444",
                    fontSize: "14px",
                    marginTop: "10px",
                    textAlign: "center",
                    padding: "10px",
                    backgroundColor: "rgba(255, 68, 68, 0.1)",
                    borderRadius: "8px",
                    border: "1px solid rgba(255, 68, 68, 0.3)",
                  }}
                >
                  {error}
                </div>
              )}

              {message && (
                <div className="signin-info-message">{message}</div>
              )}

              <button
                type="button"
                className="signin-forgot-password-button"
                onClick={toggleForgotPassword}
              >
                Forgot password?
              </button>

              <button
                type="submit"
                className="signin-submit-button"
                disabled={isLoading}
                style={{
                  opacity: isLoading ? 0.6 : 1,
                  cursor: isLoading ? "not-allowed" : "pointer",
                }}
              >
                {isLoading ? "SIGNING IN..." : "SIGN IN"}
              </button>
            </form>
          ) : (
            <form className="signin-form" onSubmit={handleForgotSubmit}>
              <h3 className="signin-title" style={{ fontSize: "1.1rem", marginBottom: "1rem" }}>
                Forgot Password
              </h3>

              {forgotStep === "email" && (
                <div className="signin-form-group">
                  <label htmlFor="forgotEmail">Account Email</label>
                  <div className="signin-input-wrapper">
                    <Mail className="signin-input-icon" size={20} />
                    <input
                      type="email"
                      id="forgotEmail"
                      value={forgotData.email}
                      onChange={(e) =>
                        setForgotData((prev) => ({ ...prev, email: e.target.value }))
                      }
                      placeholder="Enter your account email"
                      required
                    />
                  </div>
                </div>
              )}

              {forgotStep === "otp" && (
                <div className="signin-form-group">
                  <label htmlFor="forgotOtp">OTP</label>
                  <div className="signin-input-wrapper">
                    <ShieldCheck className="signin-input-icon" size={20} />
                    <input
                      type="text"
                      id="forgotOtp"
                      value={forgotData.otp}
                      onChange={(e) =>
                        setForgotData((prev) => ({ ...prev, otp: e.target.value }))
                      }
                      placeholder="Enter OTP from email"
                      required
                    />
                  </div>
                </div>
              )}

              {forgotStep === "password" && (
                <div className="signin-form-group">
                  <label htmlFor="newPassword">New Password</label>
                  <div className="signin-input-wrapper">
                    <Lock className="signin-input-icon" size={20} />
                    <input
                      type="password"
                      id="newPassword"
                      value={forgotData.newPassword}
                      onChange={(e) =>
                        setForgotData((prev) => ({
                          ...prev,
                          newPassword: e.target.value,
                        }))
                      }
                      placeholder="New Password"
                      required
                    />
                  </div>
                </div>
              )}

              {forgotError && (
                <div
                  className="signin-error-message"
                  style={{
                    color: "#ff4444",
                    fontSize: "14px",
                    marginTop: "10px",
                    textAlign: "center",
                    padding: "10px",
                    backgroundColor: "rgba(255, 68, 68, 0.1)",
                    borderRadius: "8px",
                    border: "1px solid rgba(255, 68, 68, 0.3)",
                  }}
                >
                  {forgotError}
                </div>
              )}

              {forgotMessage && (
                <div className="signin-info-message">{forgotMessage}</div>
              )}

              <button
                type="submit"
                className="signin-submit-button"
                disabled={forgotLoading}
                style={{
                  opacity: forgotLoading ? 0.6 : 1,
                  cursor: forgotLoading ? "not-allowed" : "pointer",
                }}
              >
                {forgotLoading
                  ? "PROCESSING..."
                  : forgotStep === "email"
                    ? "SEND OTP"
                    : forgotStep === "otp"
                      ? "VERIFY OTP"
                      : "RESET PASSWORD"}
              </button>

              <button
                type="button"
                className="signin-forgot-password-button"
                onClick={toggleForgotPassword}
              >
                Back to Sign In
              </button>
            </form>
          )}

          {!showForgotPassword && (
            <div className="signin-register-link">
              <p>
                Don't have an account?{" "}
                <button
                  className="signin-register-link-button"
                  onClick={() => navigate("/welcome")}
                  type="button"
                >
                  Register
                </button>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default SignIn;
