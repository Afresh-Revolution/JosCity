import { useEffect, useState } from "react";
import logoImage from "../image/primary-logo.png";
import welcomeVideo from "../vid/welcome-vid.mp4";
import "../main.css";
import LazyImage from "../components/LazyImage";
import ScrollAnimate from "../components/ScrollAnimate";

const Maintenance: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Trigger fade-in animation after component mounts
    setTimeout(() => {
      setIsVisible(true);
    }, 50);
  }, []);

  return (
    <div className="maintenance-page">
      <div className="maintenance-background">
        <video autoPlay loop muted playsInline className="maintenance-video">
          <source src={welcomeVideo} type="video/mp4" />
          Your browser does not support the video tag.
        </video>
      </div>

      <ScrollAnimate
        animationType="fade-up"
        className={`maintenance-container ${isVisible ? "fade-in" : ""}`}
      >
        <div className="maintenance-card">
          <div className="maintenance-top-section">
            <ScrollAnimate animationType="scale" delay={0.1}>
              <div className="maintenance-logo-container">
                <LazyImage
                  src={logoImage}
                  alt="JOSCITY Logo"
                  className="maintenance-logo"
                />
              </div>
            </ScrollAnimate>

            <ScrollAnimate animationType="fade-up" delay={0.2}>
              <h1 className="maintenance-heading">We'll Be Back Soon</h1>
            </ScrollAnimate>

            <div className="maintenance-icon-container">
              <div className="maintenance-icon">
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
                    d="M60 60 L60 80 L80 100 M100 60 L100 80 L80 100"
                    stroke="white"
                    strokeWidth="4"
                    strokeLinecap="round"
                    opacity="0.8"
                  />
                  <path
                    d="M50 50 L50 50 M110 50 L110 50"
                    stroke="white"
                    strokeWidth="3"
                    strokeLinecap="round"
                    opacity="0.6"
                  />
                </svg>
              </div>
            </div>
          </div>

          <div className="maintenance-bottom-section">
            <div className="maintenance-message">
              <p className="maintenance-text">
                Our website is currently undergoing scheduled maintenance to
                improve your experience. We apologize for any inconvenience and
                appreciate your patience.
              </p>
              <p className="maintenance-text-secondary">
                Please check back shortly. We'll be up and running again soon!
              </p>
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

export default Maintenance;

