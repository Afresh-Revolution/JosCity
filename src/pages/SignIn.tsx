import { useState } from "react";
import { useNavigate } from "react-router-dom";
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
import { loginPersonal, loginBusiness } from "../api/auth";
// Citizen count is now fetched from API
import "../main.css";

function SignIn() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [accountType, setAccountType] = useState<"personal" | "business">(
    "personal"
  );
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    activationCode: "",
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear error when user starts typing
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      // Use the appropriate login function based on account type
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

      // Store authentication token
      if (result.token) {
        localStorage.setItem("token", result.token);
        localStorage.setItem("authToken", result.token); // Store both for compatibility
      }

      // Store user data for profile, initials, etc.
      if (result.user) {
        const userData = {
          ...result.user,
          account_type: accountType,
        };
        localStorage.setItem("user", JSON.stringify(userData));
      }

      // Note: Citizen count is now fetched from API, no need to increment on login
      // Count is only updated when users are approved/rejected/deleted by admin

      // Navigate to news feed on successful login
      navigate("/newsfeed");
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

          {/* Account Type Selection */}
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

          <form className="signin-form" onSubmit={handleSubmit}>
            <div className="signin-form-group">
              <label htmlFor="email">Email</label>
              <div className="signin-input-wrapper">
                <Mail className="signin-input-icon" size={20} />
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="Email"
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
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="Password"
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

            <div className="signin-form-group">
              <label htmlFor="activationCode">Activation Code</label>
              <div className="signin-input-wrapper">
                <ShieldCheck className="signin-input-icon" size={20} />
                <input
                  type="text"
                  id="activationCode"
                  name="activationCode"
                  value={formData.activationCode}
                  onChange={handleInputChange}
                  placeholder="Activation Code"
                />
              </div>
            </div>

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
        </div>
      </div>
    </div>
  );
}

export default SignIn;
