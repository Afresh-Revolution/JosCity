import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import welcomeVideo from "../vid/welcome-vid.mp4";
import primaryLogo from "../image/primary-logo.png";
import RegistrationTabs from "../components/RegistrationTabs";
import PersonalFormFields from "../components/PersonalFormFields";
import BusinessFormFields from "../components/BusinessFormFields";
import SignInLink from "../components/SignInLink";
import {
  validatePersonalForm,
  validateBusinessForm,
  type PersonalFormData,
  type BusinessFormData,
  type ValidationError,
} from "../utils/validationSchemas";
import { registerPersonal, registerBusiness } from "../api/auth";
import "../main.css";

function Register() {
  const navigate = useNavigate();
  const location = useLocation();
  const [registrationType, setRegistrationType] = useState<
    "personal" | "business"
  >(location.pathname === "/business-form" ? "business" : "personal");

  // Check if we're on the business-form route and set registration type accordingly
  useEffect(() => {
    if (location.pathname === "/business-form") {
      setRegistrationType("business");
    } else if (location.pathname === "/registernow") {
      setRegistrationType("personal");
    }
  }, [location.pathname]);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState<PersonalFormData>({
    user_firstname: "",
    user_lastname: "",
    user_gender: "",
    user_phone: "",
    user_email: "",
    nin_number: "",
    address: "",
    user_password: "",
  });
  const [businessFormData, setBusinessFormData] = useState<BusinessFormData>({
    business_name: "",
    business_type: "",
    business_email: "",
    CAC_number: "",
    business_phone: "",
    business_location: "",
    business_password: "",
  });
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>(
    []
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    // Normalize email to lowercase in real-time
    const normalizedValue = name === "user_email" ? value.toLowerCase().trim() : value;
    setFormData((prev) => ({
      ...prev,
      [name]: normalizedValue,
    }));
    // Clear validation error for this field when user starts typing
    setValidationErrors((prev) => prev.filter((err) => err.field !== name));
    setError(null);
  };

  const handleBusinessInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    // Normalize email to lowercase in real-time
    const normalizedValue = name === "business_email" ? value.toLowerCase().trim() : value;
    setBusinessFormData((prev) => ({
      ...prev,
      [name]: normalizedValue,
    }));
    // Clear validation error for this field when user starts typing
    setValidationErrors((prev) => prev.filter((err) => err.field !== name));
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setValidationErrors([]);

    if (registrationType === "personal") {
      // Normalize email to lowercase before validation and submission
      const normalizedFormData = {
        ...formData,
        user_email: formData.user_email.toLowerCase().trim(),
      };

      // Validate personal form
      const errors = validatePersonalForm(normalizedFormData);
      if (errors.length > 0) {
        setValidationErrors(errors);
        setError("Please fix the errors in the form before submitting.");
        return;
      }

      // Submit personal form
      setIsLoading(true);

      // Call API service with normalized email
      const result = await registerPersonal(normalizedFormData);

      if (!result.success) {
        // Handle errors
        if (result.errors && result.errors.length > 0) {
          setValidationErrors(result.errors);
        }
        setError(result.message || "Registration failed");
        setIsLoading(false);
        return;
      }

      // Success - Navigate to success page
      navigate("/success", {
        state: {
          submitted: true,
          accountType: "personal",
          email: formData.user_email,
        },
      });
      setIsLoading(false);
    } else {
      // Normalize email to lowercase before validation and submission
      const normalizedBusinessFormData = {
        ...businessFormData,
        business_email: businessFormData.business_email.toLowerCase().trim(),
      };

      // Validate business form
      const errors = validateBusinessForm(normalizedBusinessFormData);
      if (errors.length > 0) {
        setValidationErrors(errors);
        setError("Please fix the errors in the form before submitting.");
        return;
      }

      // Submit business form
      setIsLoading(true);

      // Call API service with normalized email
      const result = await registerBusiness(normalizedBusinessFormData);

      if (!result.success) {
        // Handle errors
        if (result.errors && result.errors.length > 0) {
          setValidationErrors(result.errors);
        }
        setError(result.message || "Registration failed");
        setIsLoading(false);
        return;
      }

      // Success - Navigate to success page
      navigate("/success", {
        state: {
          submitted: true,
          accountType: "business",
          email: businessFormData.business_email,
        },
      });
      setIsLoading(false);
    }
  };

  return (
    <div className="register-page">
      <div className="register-background">
        <video autoPlay loop muted playsInline className="register-video">
          <source src={welcomeVideo} type="video/mp4" />
          Your browser does not support the video tag.
        </video>
      </div>

      <div className="register-container">
        <div className="register-flip-container">
          <div
            className={`register-form-panel ${
              registrationType === "business" ? "flipped" : ""
            }`}
          >
            <div className="register-card-face register-card-front">
              <div className="register-logo-container">
                <img
                  src={primaryLogo}
                  alt="JOSCITY Logo"
                  className="register-logo"
                />
              </div>

              <RegistrationTabs
                registrationType={registrationType}
                onTypeChange={setRegistrationType}
              />

              <form className="register-form" onSubmit={handleSubmit}>
                <PersonalFormFields
                  formData={formData}
                  showPassword={showPassword}
                  onInputChange={handleInputChange}
                  onTogglePassword={() => setShowPassword(!showPassword)}
                />

                {validationErrors.length > 0 && (
                  <div
                    className="register-error-message"
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
                    {validationErrors.map((err, idx) => (
                      <div key={idx}>{err.message}</div>
                    ))}
                  </div>
                )}

                {error && (
                  <div
                    className="register-error-message"
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
                  className="register-submit-button"
                  disabled={isLoading}
                  style={{
                    opacity: isLoading ? 0.6 : 1,
                    cursor: isLoading ? "not-allowed" : "pointer",
                  }}
                >
                  {isLoading ? "SUBMITTING..." : "SUBMIT"}
                </button>
              </form>

              <SignInLink />
            </div>

            <div className="register-card-face register-card-back">
              <div className="register-logo-container">
                <img
                  src={primaryLogo}
                  alt="JOSCITY Logo"
                  className="register-logo"
                />
              </div>

              <RegistrationTabs
                registrationType={registrationType}
                onTypeChange={setRegistrationType}
              />

              <form className="register-form" onSubmit={handleSubmit}>
                <BusinessFormFields
                  formData={businessFormData}
                  showPassword={showPassword}
                  onInputChange={handleBusinessInputChange}
                  onTogglePassword={() => setShowPassword(!showPassword)}
                />

                {validationErrors.length > 0 && (
                  <div
                    className="register-error-message"
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
                    {validationErrors.map((err, idx) => (
                      <div key={idx}>{err.message}</div>
                    ))}
                  </div>
                )}

                {error && (
                  <div
                    className="register-error-message"
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
                  className="register-submit-button"
                  disabled={isLoading}
                  style={{
                    opacity: isLoading ? 0.6 : 1,
                    cursor: isLoading ? "not-allowed" : "pointer",
                  }}
                >
                  {isLoading ? "SUBMITTING..." : "SUBMIT"}
                </button>
              </form>

              <SignInLink />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Register;
