import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../contexts/ThemeContext";
import { isAuthenticated } from "../utils/userUtils";
import "../main.css";
import primaryLogo from "../image/primary-logo.png";

function App() {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuItems: Array<{
    label: string;
    link_type: string;
    link_target?: string;
    scroll_target_id?: string;
    requires_auth: boolean;
  }> = [];

  const handleMenuItemClick = (item: (typeof menuItems)[0]) => {
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

  const scrollToNews = () => {
    setIsMenuOpen(false);
    if (window.location.pathname !== "/") {
      navigate("/");
      setTimeout(() => {
        const newsSection = document.getElementById("news");
        if (newsSection) {
          newsSection.scrollIntoView({
            behavior: "smooth",
            block: "start",
          });
        }
      }, 100);
    } else {
      const newsSection = document.getElementById("news");
      if (newsSection) {
        newsSection.scrollIntoView({
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
      <div className="navbar-shell">
        <div className="navbar-shell__glass" aria-hidden />
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
                <li className="navbar__nav-item" onClick={scrollToHome}>
                  HOME
                </li>
                <li className="navbar__nav-item" onClick={scrollToAbout}>
                  ABOUT
                </li>
                <li className="navbar__nav-item" onClick={scrollToNews}>
                  NEWS
                </li>
                <li className="navbar__nav-item" onClick={scrollToServices}>
                  SERVICES
                </li>
                <li className="navbar__nav-item" onClick={scrollToContact}>
                  CONTACT US
                </li>
                <li className="navbar__nav-item navbar__nav-item--theme-toggle" onClick={() => { toggleTheme(); setIsMenuOpen(false); }}>
                  <button type="button" className="navbar__theme-toggle-btn" aria-label={theme === "light" ? "Switch to dark mode" : "Switch to light mode"} title={theme === "light" ? "Dark mode" : "Light mode"}>
                    {theme === "light" ? (
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" /></svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="5" /><line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" /><line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" /><line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" /><line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" /></svg>
                    )}
                  </button>
                </li>
              </>
            )}
          </ul>
        </div>
        <div className="navbar__right-section">
          <div className="navbar__action-buttons">
            {isAuthenticated() ? (
              <button
                type="button"
                className="navbar__signin-button"
                onClick={() => {
                  setIsMenuOpen(false);
                  navigate("/newsfeed");
                }}
              >
                Feeds
              </button>
            ) : (
              <button
                type="button"
                className="navbar__signin-button"
                onClick={() => {
                  setIsMenuOpen(false);
                  navigate("/signin");
                }}
              >
                Login
              </button>
            )}
          </div>
        </div>
      </nav>
      </div>
    </>
  );
}

export default App;
