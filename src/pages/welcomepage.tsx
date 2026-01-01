import { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import welcomeVideo from "../vid/welcome-vid.mp4";
import primaryLogo from "../image/primary-logo.png";
import "../main.css";
import LazyImage from "../components/LazyImage";
import ScrollAnimate from "../components/ScrollAnimate";

function WelcomePage() {
  const navigate = useNavigate();

  const handlePersonalClick = useCallback(() => {
    try {
      navigate("/registernow", { replace: false });
    } catch (error) {
      console.error("Navigation error:", error);
    }
  }, [navigate]);

  const handleBusinessClick = useCallback(() => {
    try {
      navigate("/business-form", { replace: false });
    } catch (error) {
      console.error("Navigation error:", error);
    }
  }, [navigate]);

  return (
    <div className="welcome-page" role="main">
      <div className="welcome-background" aria-hidden="true">
        <video
          autoPlay
          loop
          muted
          playsInline
          className="welcome-video"
        >
          <source src={welcomeVideo} type="video/mp4" />
          Your browser does not support the video tag.
        </video>
      </div>

      <section
        className="registration-panel"
        aria-labelledby="registration-heading"
      >
        <ScrollAnimate animationType="fade-up" delay={0.1}>
          <div className="logo-container">
            <LazyImage
              src={primaryLogo}
              alt="JOSCITY Logo"
              className="logo-image"
              width={72}
              height={72}
            />
            <h1 id="registration-heading" className="register-heading">
              Register now
            </h1>
          </div>
        </ScrollAnimate>

        <ScrollAnimate animationType="fade-up" delay={0.2}>
          <nav
            className="registration-buttons"
            aria-label="Registration type selection"
          >
            <button
              type="button"
              className="reg-button personal-button"
              onClick={handlePersonalClick}
              aria-label="Register as a personal user"
              aria-pressed="false"
            >
              Personal
            </button>
            <button
              type="button"
              className="reg-button business-button"
              onClick={handleBusinessClick}
              aria-label="Register as a business"
              aria-pressed="false"
            >
              Business
            </button>
          </nav>
        </ScrollAnimate>
      </section>
    </div>
  );
}

export default WelcomePage;
