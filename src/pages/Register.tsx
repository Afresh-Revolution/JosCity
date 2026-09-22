import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import welcomeVideo from "../vid/welcome-vid.mp4";
import primaryLogo from "../image/primary-logo.png";
import { updateAgentPreview, savePendingAgentApplication } from "./agentPreviewState";
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
import { registerPersonal, registerBusiness, fetchBusinessCategories } from "../api/auth";
import { BUSINESS_CATEGORIES } from "../constants/businessCategories";
import PageBackButton from "../components/PageBackButton";
import "../main.css";
import { apiUrl } from '../api/config';

function Register() {
  const navigate = useNavigate();
  const location = useLocation();
  useEffect(() => {
    const code = new URLSearchParams(location.search).get('ref')?.trim().toUpperCase();
    if (!code || !/^JOS[A-Z0-9]{6}$/.test(code)) return;
    try {
      sessionStorage.setItem('signupReferral', code);
      let visitor = localStorage.getItem('referralVisitor');
      if (!visitor) { visitor = crypto.randomUUID(); localStorage.setItem('referralVisitor', visitor); }
      void fetch(apiUrl('/account/referrals/visit'), { method: 'POST', headers: { 'Content-Type':'application/json' }, body: JSON.stringify({ ref: code, visitor_id: visitor }) }).catch(() => {});
    } catch { /* Signup remains available when browser storage is disabled. */ }
  }, [location.search]);
  const [registrationType, setRegistrationType] = useState<
    "personal" | "business" | "agent"
  >(location.pathname === "/agent-form" ? "agent" : location.pathname === "/business-form" ? "business" : "personal");

  // Check if we're on the business-form route and set registration type accordingly
  useEffect(() => {
    if (location.pathname === "/agent-form") { setRegistrationType("agent"); }
    else if (location.pathname === "/business-form") {
      setRegistrationType("business");
    } else if (location.pathname === "/registernow") {
      setRegistrationType("personal");
    }
  }, [location.pathname]);
  const [agentServices, setAgentServices] = useState(["Help me buy"]);
  const [agentBio, setAgentBio] = useState("");
  const [agentCategories, setAgentCategories] = useState("");
  const [confirmAgentPassword, setConfirmAgentPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [businessCategories, setBusinessCategories] = useState(BUSINESS_CATEGORIES);
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
    business_password_confirm: "",
    business_description: "",
    terms_accepted: false,
  });
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>(
    []
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void fetchBusinessCategories().then((items) => {
      if (!cancelled && items.length > 0) setBusinessCategories(items);
    });
    return () => {
      cancelled = true;
    };
  }, []);

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
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, type } = e.target;
    let next: string | boolean =
      type === "checkbox"
        ? (e.target as HTMLInputElement).checked
        : e.target.value;

    if (name === "business_email" && typeof next === "string") {
      next = next.toLowerCase().trim();
    }
    if (name === "CAC_number" && typeof next === "string") {
      next = next.replace(/[^A-Za-z0-9/-]/g, "").slice(0, 32).toUpperCase();
    }
    if (name === "business_description" && typeof next === "string") {
      next = next.slice(0, 240);
    }

    setBusinessFormData((prev) => ({
      ...prev,
      [name]: next,
    }));
    setValidationErrors((prev) => prev.filter((err) => err.field !== name));
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setValidationErrors([]);

    if (registrationType === "agent") {
      if (!agentServices.length) { setError("Choose at least one agent service."); return; }
      if (formData.user_password && formData.user_password !== confirmAgentPassword) { setError("Passwords do not match."); return; }
      updateAgentPreview({ firstName: formData.user_firstname || "John", lastName: formData.user_lastname || "Musa", email: formData.user_email, phone: formData.user_phone, gender: formData.user_gender, address: formData.address, bio: agentBio, category: agentCategories, services: agentServices });
      savePendingAgentApplication({ bio: agentBio, category: agentCategories, services: agentServices, nin: formData.nin_number });
      navigate("/agents"); return;
    }
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
      let referralCode = new URLSearchParams(location.search).get('ref') || '';
      try { referralCode ||= sessionStorage.getItem('signupReferral') || ''; } catch { /* Optional storage. */ }
      const result = await registerPersonal({ ...normalizedFormData, referral_code: referralCode });

      if (!result.success) {
        // Handle errors
        if (result.errors && result.errors.length > 0) {
          setValidationErrors(result.errors);
        }
        setError(result.message || "Registration failed");
        setIsLoading(false);
        return;
      }

      try { sessionStorage.removeItem("signupReferral"); } catch { /* Optional storage. */ }
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
      const errors = validateBusinessForm(
        normalizedBusinessFormData,
        businessCategories.map((item) => item.slug)
      );
      if (errors.length > 0) {
        setValidationErrors(errors);
        setError("Please fix the errors in the form before submitting.");
        return;
      }

      // Submit business form
      setIsLoading(true);

      // Call API service with normalized email
      let referralCode = new URLSearchParams(location.search).get('ref') || '';
      try { referralCode ||= sessionStorage.getItem('signupReferral') || ''; } catch { /* Optional storage. */ }
      const result = await registerBusiness({ ...normalizedBusinessFormData, referral_code: referralCode });

      if (!result.success) {
        // Handle errors
        if (result.errors && result.errors.length > 0) {
          setValidationErrors(result.errors);
        }
        setError(result.message || "Registration failed");
        setIsLoading(false);
        return;
      }

      try { sessionStorage.removeItem("signupReferral"); } catch { /* Optional storage. */ }
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
          <PageBackButton
            to="/welcome"
            disabled={isLoading}
            ariaLabel="Go back to registration options"
          />
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
                onTypeChange={type => { setRegistrationType(type); setError(null); setValidationErrors([]); }}
              />

              <form className="register-form" onSubmit={handleSubmit}>
                <PersonalFormFields
                  formData={formData}
                  showPassword={showPassword}
                  onInputChange={handleInputChange}
                  onTogglePassword={() => setShowPassword(!showPassword)}
                />

                {registrationType === "agent" && <>
                  <p className="agent-auth-note">Agent preview only. No account is created and credentials are not submitted.</p>
                  <div className="agent-service-options">{["Help me buy", "Help me deliver"].map(service => <button type="button" key={service} className="reg-button business-button" aria-pressed={agentServices.includes(service)} onClick={() => setAgentServices(current => current.includes(service) ? current.filter(s => s !== service) : [...current, service])}>{agentServices.includes(service) ? "Selected: " : ""}{service}</button>)}</div>
                  <div className="register-form-group"><label htmlFor="agent-confirm">Confirm password</label><input id="agent-confirm" type={showPassword ? "text" : "password"} autoComplete="new-password" value={confirmAgentPassword} onChange={e => setConfirmAgentPassword(e.target.value)} /></div>
                  <div className="register-form-group"><label htmlFor="agent-bio">Agent bio</label><input id="agent-bio" value={agentBio} onChange={e => setAgentBio(e.target.value)} placeholder="How can you help customers?" /></div>
                  <div className="register-form-group"><label htmlFor="agent-categories">Categories / specialties</label><input id="agent-categories" value={agentCategories} onChange={e => setAgentCategories(e.target.value)} placeholder="Electronics, groceries, fashion..." /></div>
                  <button type="button" className="register-submit-button" onClick={() => navigate("/agents")}>Explore agent dashboard</button>
                </>}
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
                  {isLoading ? "SUBMITTING..." : registrationType === "agent" ? "PREVIEW AGENT ACCOUNT" : "SUBMIT"}
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
                onTypeChange={type => { setRegistrationType(type); setError(null); setValidationErrors([]); }}
              />

              <form className="register-form" onSubmit={handleSubmit}>
                <BusinessFormFields
                  formData={businessFormData}
                  categories={businessCategories}
                  showPassword={showPassword}
                  showConfirmPassword={showConfirmPassword}
                  onInputChange={handleBusinessInputChange}
                  onTogglePassword={() => setShowPassword(!showPassword)}
                  onToggleConfirmPassword={() =>
                    setShowConfirmPassword((value) => !value)
                  }
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
                  disabled={isLoading || !businessFormData.terms_accepted}
                  style={{
                    opacity:
                      isLoading || !businessFormData.terms_accepted ? 0.6 : 1,
                    cursor:
                      isLoading || !businessFormData.terms_accepted
                        ? "not-allowed"
                        : "pointer",
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
