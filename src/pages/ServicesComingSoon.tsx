import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import logoImage from "../image/primary-logo.png";
import welcomeVideo from "../vid/welcome-vid.mp4";
import "../main.css";
import LazyImage from "../components/LazyImage";
import ScrollAnimate from "../components/ScrollAnimate";

const ServicesComingSoon: React.FC = () => {
  const navigate = useNavigate();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Trigger fade-in animation after component mounts
    setTimeout(() => {
      setIsVisible(true);
    }, 50);
  }, []);

  const handleBackToServices = () => {
    navigate("/#services");
  };

  return (
    <div className="services-coming-soon-page">
      <div className="services-coming-soon-background">
        <video autoPlay loop muted playsInline className="services-coming-soon-video">
          <source src={welcomeVideo} type="video/mp4" />
          Your browser does not support the video tag.
        </video>
      </div>

      <ScrollAnimate
        animationType="fade-up"
        className={`services-coming-soon-container ${isVisible ? "fade-in" : ""}`}
      >
        <div className="services-coming-soon-card">
          <div className="services-coming-soon-top-section">
            <ScrollAnimate animationType="scale" delay={0.1}>
              <div className="services-coming-soon-logo-container">
                <LazyImage
                  src={logoImage}
                  alt="JOSCITY Logo"
                  className="services-coming-soon-logo"
                />
              </div>
            </ScrollAnimate>

            <ScrollAnimate animationType="fade-up" delay={0.2}>
              <h1 className="services-coming-soon-heading">Service Coming Soon</h1>
            </ScrollAnimate>

            <div className="services-coming-soon-icon-container">
              <div className="services-coming-soon-icon">
                <svg
                  width="160"
                  height="160"
                  viewBox="0 0 160 160"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  {/* Outer circle */}
                  <circle
                    cx="80"
                    cy="80"
                    r="70"
                    stroke="white"
                    strokeWidth="4"
                    strokeDasharray="10 5"
                    opacity="0.6"
                  />
                  {/* Clock face circle */}
                  <circle
                    cx="80"
                    cy="80"
                    r="50"
                    stroke="white"
                    strokeWidth="3"
                    opacity="0.4"
                  />
                  {/* Hour markers */}
                  <line x1="80" y1="35" x2="80" y2="45" stroke="white" strokeWidth="3" strokeLinecap="round" opacity="0.8" />
                  <line x1="125" y1="80" x2="115" y2="80" stroke="white" strokeWidth="3" strokeLinecap="round" opacity="0.8" />
                  <line x1="80" y1="125" x2="80" y2="115" stroke="white" strokeWidth="3" strokeLinecap="round" opacity="0.8" />
                  <line x1="35" y1="80" x2="45" y2="80" stroke="white" strokeWidth="3" strokeLinecap="round" opacity="0.8" />
                  {/* Hour hand (pointing to 3) */}
                  <line
                    x1="80"
                    y1="80"
                    x2="105"
                    y2="80"
                    stroke="white"
                    strokeWidth="4"
                    strokeLinecap="round"
                    opacity="0.9"
                  />
                  {/* Minute hand (pointing to 12) */}
                  <line
                    x1="80"
                    y1="80"
                    x2="80"
                    y2="50"
                    stroke="white"
                    strokeWidth="3"
                    strokeLinecap="round"
                    opacity="0.9"
                  />
                  {/* Center dot */}
                  <circle
                    cx="80"
                    cy="80"
                    r="4"
                    fill="white"
                    opacity="0.9"
                  />
                </svg>
              </div>
            </div>
          </div>

          <div className="services-coming-soon-bottom-section">
            <div className="services-coming-soon-message">
              <p className="services-coming-soon-text">
                This service is currently under development and will be available soon. 
                We're working hard to bring you an amazing experience with all the features 
                you need. Please check back soon!
              </p>
            </div>

            <div className="services-coming-soon-buttons">
              <button
                type="button"
                className="services-coming-soon-button services-coming-soon-button--primary"
                onClick={handleBackToServices}
              >
                Back to Services
              </button>
            </div>
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

export default ServicesComingSoon;

