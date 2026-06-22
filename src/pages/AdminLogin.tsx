import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import welcomeVideo from "../vid/welcome-vid.mp4";
import primaryLogo from "../image/primary-logo.png";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ShieldCheck,
  AlertCircle,
} from "lucide-react";
import API_BASE_URL from "../api/config";
import { fetchWithTimeout } from "../utils/fetchWithTimeout";
import PageBackButton from "../components/PageBackButton";
import "../main.css";

function AdminLogin() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  // Redirect if already logged in
  useEffect(() => {
    // Check localStorage for admin token
    const adminToken = localStorage.getItem("adminToken");
    if (adminToken) {
      navigate("/admin");
    }
  }, [navigate]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear error when user starts typing
    if (error) setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const normalizedEmail = formData.email.toLowerCase().trim();

      // Validate form
      if (!normalizedEmail || !formData.password) {
        setError("Please fill in all fields");
        setIsLoading(false);
        return;
      }

      // Make API call to admin login endpoint
      const loginUrl = `${API_BASE_URL}/admin/login`;
      console.log("Admin Login - API URL:", loginUrl);

      const response = await fetchWithTimeout(
        loginUrl,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: normalizedEmail,
            password: formData.password,
          }),
          timeout: 30000,
        }
      );

      let data;
      try {
        const text = await response.text();
        data = text ? JSON.parse(text) : {};
      } catch (jsonError) {
        setError(`Server error: ${response.status} ${response.statusText}`);
        setIsLoading(false);
        return;
      }

      if (!response.ok) {
        setError(
          data.message ||
            data.error ||
            `Login failed: ${response.status} ${response.statusText}`
        );
        setIsLoading(false);
        return;
      }

      // Store admin token and data
      if (data.token) {
        localStorage.setItem("adminToken", data.token);
      }
      if (data.admin || data.user) {
        localStorage.setItem(
          "adminData",
          JSON.stringify(data.admin || data.user)
        );
      }

      // Redirect to admin dashboard
      navigate("/admin");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Login failed. Please try again."
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
          <PageBackButton
            to="/"
            disabled={isLoading}
            ariaLabel="Go back to home"
          />
          <div className="signin-logo-container">
            <img src={primaryLogo} alt="JOSCITY Logo" className="signin-logo" />
          </div>

          <h2 className="signin-title">Admin Login</h2>
          <p
            className="signin-subtitle"
            style={{
              marginTop: "0.5rem",
              marginBottom: "1.5rem",
              color: "#ffffff",
              fontSize: "0.9rem",
            }}
          >
            Sign in to access the admin dashboard
          </p>

          {error && (
            <div
              className="signin-error"
              style={{
                backgroundColor: "#fee",
                border: "1px solid #fcc",
                color: "#c33",
                padding: "0.75rem 1rem",
                borderRadius: "8px",
                marginBottom: "1.5rem",
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                fontSize: "0.9rem",
              }}
            >
              <AlertCircle size={18} />
              <span>{error}</span>
            </div>
          )}

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
                  placeholder="Enter your email"
                  autoComplete="email"
                  disabled={isLoading}
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
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  disabled={isLoading}
                  required
                />
                <button
                  type="button"
                  className="signin-password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isLoading}
                >
                  {showPassword ? (
                    <EyeOff className="signin-input-icon" size={20} />
                  ) : (
                    <Eye className="signin-input-icon" size={20} />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="signin-submit-button"
              disabled={isLoading}
              style={{
                opacity: isLoading ? 0.7 : 1,
                cursor: isLoading ? "not-allowed" : "pointer",
              }}
            >
              {isLoading ? "LOGGING IN..." : "LOGIN"}
            </button>
          </form>

          <div className="signin-register-link">
            <p>
              Regular user?{" "}
              <button
                className="signin-register-link-button"
                onClick={() => navigate("/signin")}
                type="button"
                disabled={isLoading}
              >
                Sign In Here
              </button>
            </p>
          </div>

          <div
            style={{
              marginTop: "1rem",
              padding: "1rem",
              backgroundColor: "#f0f7ff",
              borderRadius: "8px",
              fontSize: "0.85rem",
              color: "#555",
              border: "1px solid #d0e7ff",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                marginBottom: "0.5rem",
              }}
            >
              <ShieldCheck size={16} color="#0066cc" />
              <strong>Admin Access Required</strong>
            </div>
            <p style={{ margin: 0, lineHeight: "1.4" }}>
              This area is restricted to administrators only. Please use your
              admin credentials to access the dashboard.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminLogin;
