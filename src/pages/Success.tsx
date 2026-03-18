import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import logoImage from "../image/primary-logo.png";
import successLogo from "../image/success-logo.png";
import welcomeVideo from "../vid/welcome-vid.mp4";
import "../main.css";

const Success: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isVisible, setIsVisible] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    // Check if user came from a successful form submission
    const submitted = location.state?.submitted;

    if (!submitted) {
      // Redirect to business form if accessed directly without submission
      navigate("/business-form", { replace: true });
      return;
    }

    // User is authorized to view success page
    setIsAuthorized(true);

    // Trigger fade-in animation after component mounts
    setTimeout(() => {
      setIsVisible(true);
    }, 50);
  }, [location.state, navigate]);

  const handleBackHome = () => {
    navigate("/");
  };

  // Don't render content if not authorized (prevents flash before redirect)
  if (!isAuthorized) {
    return null;
  }

  return (
    <div className="success-page">
      <div className="success-background">
        <video autoPlay loop muted playsInline className="success-video">
          <source src={welcomeVideo} type="video/mp4" />
          Your browser does not support the video tag.
        </video>
      </div>

      <div className={`success-container ${isVisible ? "fade-in" : ""}`}>
        <div className="success-card">
          <div className="success-top-section">
            <div className="success-logo-container">
              <img
                src={logoImage}
                alt="JOSCITY Logo"
                className="success-logo"
              />
            </div>

            <h1 className="success-heading">Success</h1>

            <div className="success-icon-container">
              <div className="success-checkmark">
                <img
                  src={successLogo}
                  alt="Success"
                  className="success-logo-icon"
                />
              </div>
            </div>
          </div>

          <div className="success-bottom-section">
            <div className="success-message">
              <p className="success-text">
                Your request has been successfully submitted. you will receive a
                second email when your details have been verified
              </p>
            </div>

            <button
              type="button"
              className="success-signin-button"
              onClick={handleBackHome}
            >
              Back home
            </button>
          </div>
        </div>
      </div>

      <footer className="register-footer">
        <div className="register-footer-content">
          <p className="register-footer-copyright">© 2025 JOS Smart City</p>
          <div className="register-footer-links">
            <a href="#about">About</a>
            <a href="#legal">Legal</a>
            <a href="#privacy">Privacy</a>
            <a href="#contact">Contact Us</a>
            <a href="#directory">Directory</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Success;
