import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../main.css";
import primaryLogo from "../image/primary-logo.png";

function App() {
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuItems: Array<{
    label: string;
    link_type: string;
    link_target?: string;
    scroll_target_id?: string;
    requires_auth: boolean;
  }> = [];
  const navbarSettings = {
    logo_url: primaryLogo,
    get_started_button_text: "Get Started",
    get_started_button_route: "/welcome",
  };

  const handleGetStarted = () => {
    navigate(navbarSettings.get_started_button_route);
  };

  const handleMenuItemClick = (item: typeof menuItems[0]) => {
    setIsMenuOpen(false);
    if (item.link_type === "scroll" && item.scroll_target_id) {
      const targetId = item.scroll_target_id;
      if (window.location.pathname !== "/") {
        navigate("/");
        setTimeout(() => {
          const section = document.getElementById(targetId);
          if (section) {
            section.scrollIntoView({ behavior: "smooth", block: "start" });
          }
        }, 100);
      } else {
        const section = document.getElementById(targetId);
        if (section) {
          section.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }
    } else if (item.link_type === "route" && item.link_target) {
      navigate(item.link_target);
    } else if (item.link_type === "external" && item.link_target) {
      window.open(item.link_target, "_blank");
    }
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const scrollToAbout = () => {
    setIsMenuOpen(false);
    if (window.location.pathname !== "/") {
      navigate("/");
      setTimeout(() => {
        const aboutSection = document.getElementById("about");
        if (aboutSection) {
          aboutSection.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }, 100);
    } else {
      const aboutSection = document.getElementById("about");
      if (aboutSection) {
        aboutSection.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }
  };

  const scrollToContact = () => {
    setIsMenuOpen(false);
    if (window.location.pathname !== "/") {
      navigate("/");
      setTimeout(() => {
        const contactSection = document.getElementById("contact");
        if (contactSection) {
          contactSection.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }, 100);
    } else {
      const contactSection = document.getElementById("contact");
      if (contactSection) {
        contactSection.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }
  };

  const scrollToServices = () => {
    setIsMenuOpen(false);
    if (window.location.pathname !== "/") {
      navigate("/");
      setTimeout(() => {
        const servicesSection = document.getElementById("services");
        if (servicesSection) {
          servicesSection.scrollIntoView({
            behavior: "smooth",
            block: "start",
          });
        }
      }, 100);
    } else {
      const servicesSection = document.getElementById("services");
      if (servicesSection) {
        servicesSection.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }
  };

  const scrollToHome = () => {
    setIsMenuOpen(false);
    // Navigate to home if not already there
    if (window.location.pathname !== "/") {
      navigate("/");
      setTimeout(() => {
        const homeSection = document.getElementById("home");
        if (homeSection) {
          homeSection.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }, 100);
    } else {
      const homeSection = document.getElementById("home");
      if (homeSection) {
        homeSection.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }
  };

  const scrollToGuidlines = () => {
    setIsMenuOpen(false);
    if (window.location.pathname !== "/") {
      navigate("/");
      setTimeout(() => {
        const guidelinesSection = document.getElementById("guidelines");
        if (guidelinesSection) {
          guidelinesSection.scrollIntoView({
            behavior: "smooth",
            block: "start",
          });
        }
      }, 100);
    } else {
      const guidelinesSection = document.getElementById("guidelines");
      if (guidelinesSection) {
        guidelinesSection.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }
    }
  };

  const handleLogoClick = () => {
    navigate("/");
  };

  return (
    <>
      {/* Dark overlay for mobile menu */}
      {isMenuOpen && (
        <div
          className="navbar__overlay"
          onClick={() => setIsMenuOpen(false)}
          aria-hidden="true"
        />
      )}
      <nav className="navbar">
        <div className="navbar__left-section">
          <div
            className="navbar__brand"
            onClick={handleLogoClick}
            style={{ cursor: "pointer" }}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                handleLogoClick();
              }
            }}
            aria-label="Navigate to home"
          >
            <img src={primaryLogo} alt="Logo" className="navbar__logo-image" />
          </div>
        </div>
        <div className="navbar__middle-section">
          <button
            className={`navbar__menu-toggle ${isMenuOpen ? "active" : ""}`}
            onClick={toggleMenu}
            aria-label={isMenuOpen ? "Close menu" : "Open menu"}
            aria-expanded={isMenuOpen}
            type="button"
          >
            <span aria-hidden="true"></span>
            <span aria-hidden="true"></span>
            <span aria-hidden="true"></span>
          </button>
          <ul
            className={`navbar__nav-list ${isMenuOpen ? "active" : ""}`}
            aria-hidden={!isMenuOpen}
          >
            {menuItems.length > 0 ? (
              menuItems.map((item, index) => (
                <li
                  key={index}
                  className="navbar__nav-item"
                  onClick={() => handleMenuItemClick(item)}
                >
                  {item.label}
                </li>
              ))
            ) : (
              // Fallback menu items if API fails
              <>
                <li className="navbar__nav-item active" onClick={scrollToHome}>
                  HOME
                </li>
                <li className="navbar__nav-item" onClick={scrollToAbout}>
                  ABOUT
                </li>
                <li className="navbar__nav-item" onClick={scrollToGuidlines}>
                  GUIDELINES
                </li>
                <li className="navbar__nav-item" onClick={scrollToServices}>
                  SERVICES
                </li>
                <li className="navbar__nav-item" onClick={scrollToContact}>
                  CONTACT US
                </li>
              </>
            )}
          </ul>
        </div>
        <div className="navbar__right-section">
          <button
            type="button"
            onClick={handleGetStarted}
            className="navbar__get-started-button"
          >
            {navbarSettings.get_started_button_text || "GET STARTED"}
          </button>
        </div>
      </nav>
    </>
  );
}

export default App;
