import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import logoImage from "../image/primary-logo.png";
import welcomeVideo from "../vid/welcome-vid.mp4";
import "../main.css";
import LazyImage from "../components/LazyImage";
import ScrollAnimate from "../components/ScrollAnimate";

const ComingSoon: React.FC = () => {
  const navigate = useNavigate();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Trigger fade-in animation after component mounts
    setTimeout(() => {
      setIsVisible(true);
    }, 50);
  }, []);

  const handleBackToRegister = () => {
    navigate("/");
  };

  return (
    <div className="coming-soon-page">
      <div className="coming-soon-background">
        <video autoPlay loop muted playsInline className="coming-soon-video">
          <source src={welcomeVideo} type="video/mp4" />
          Your browser does not support the video tag.
        </video>
      </div>

      <ScrollAnimate
        animationType="fade-up"
        className={`coming-soon-container ${isVisible ? "fade-in" : ""}`}
      >
        <div className="coming-soon-card">
          <div className="coming-soon-top-section">
            <ScrollAnimate animationType="scale" delay={0.1}>
              <div className="coming-soon-logo-container">
                <LazyImage
                  src={logoImage}
                  alt="JOSCITY Logo"
                  className="coming-soon-logo"
                />
              </div>
            </ScrollAnimate>

            <ScrollAnimate animationType="fade-up" delay={0.2}>
              <h1 className="coming-soon-heading">Coming Soon</h1>
            </ScrollAnimate>

            <div className="coming-soon-icon-container">
              <div className="coming-soon-icon">
                <svg
                  width="160"
                  height="160"
                  viewBox="0 0 160 160"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <circle
                    cx="80"
                    cy="80"
                    r="70"
                    stroke="white"
                    strokeWidth="4"
                    strokeDasharray="10 5"
                    opacity="0.6"
                  />
                  <circle
                    cx="80"
                    cy="80"
                    r="50"
                    stroke="white"
                    strokeWidth="3"
                    strokeDasharray="8 4"
                    opacity="0.4"
                  />
                  <path
                    d="M80 30 L80 80 L110 110"
                    stroke="white"
                    strokeWidth="4"
                    strokeLinecap="round"
                    opacity="0.8"
                  />
                </svg>
              </div>
            </div>
          </div>

          <div className="coming-soon-bottom-section">
            <div className="coming-soon-message">
              <p className="coming-soon-text">
                The Sign In feature Would be active shortly. Bringing you an
                amazing experience. Please check back soon!
              </p>
            </div>

            <button
              type="button"
              className="coming-soon-back-button"
              onClick={handleBackToRegister}
            >
              Back Home
            </button>
          </div>
        </div>
      </ScrollAnimate>

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

export default ComingSoon;
