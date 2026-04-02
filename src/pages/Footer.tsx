import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Facebook, Twitter, Instagram, Linkedin } from "lucide-react";
import logoImage from "../image/primary-logo.png";

const Footer: React.FC = () => {
  const navigate = useNavigate();
  const [visibleElements, setVisibleElements] = useState<Set<string>>(
    new Set()
  );
  const columnsRef = useRef<Array<HTMLDivElement | null>>([]);
  const copyrightRef = useRef<HTMLDivElement>(null);

  const footerSettings = {
    logo_url: logoImage,
    tagline: "Your gateway to smart\ncity services and digital\ngovernance.",
    copyright_text:
      "© 2025 JosCity Smart Services. All rights reserved. Developed by AfrESH",
    social_media: {
      facebook: "https://facebook.com/joscity",
      twitter: "https://twitter.com/joscity",
      instagram: "https://instagram.com/joscity",
      linkedin: "https://linkedin.com/company/joscity",
    },
  };

  const handleHashLink = (
    e: React.MouseEvent<HTMLAnchorElement>,
    url: string
  ) => {
    e.preventDefault();
    if (url.startsWith("/#")) {
      const hash = url.substring(1);
      if (window.location.pathname !== "/") {
        navigate("/");
        setTimeout(() => {
          const section = document.querySelector(hash);
          if (section) {
            section.scrollIntoView({ behavior: "smooth", block: "start" });
          }
        }, 100);
      } else {
        const section = document.querySelector(hash);
        if (section) {
          section.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }
    }
  };

  const handleYearClick = (e: React.MouseEvent<HTMLSpanElement>) => {
    e.stopPropagation();
    navigate("/admin");
  };

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const elementId = entry.target.getAttribute("data-animate-id");
          
          if (entry.isIntersecting) {
            if (elementId) {
              setVisibleElements((prev) => new Set(prev).add(elementId));
            }
          } else {
            // Remove from visible when scrolling out
            if (elementId) {
              setVisibleElements((prev) => {
                const newSet = new Set(prev);
                newSet.delete(elementId);
                return newSet;
              });
            }
          }
        });
      },
      { threshold: 0.1 }
    );

    const elements = [
      ...columnsRef.current.filter((el): el is HTMLDivElement => el !== null),
      copyrightRef.current,
    ].filter((el): el is HTMLDivElement => el !== null);

    elements.forEach((el) => {
      if (el) observer.observe(el);
    });

    return () => {
      elements.forEach((el) => {
        if (el) observer.unobserve(el);
      });
    };
  }, []);

  const footerLinks: Array<{
    section: string;
    links: Array<{ text: string; url: string; opens_in_new_tab?: boolean }>;
  }> = [
    {
      section: "quick_links",
      links: [
        { text: "Home", url: "/" },
        { text: "About", url: "/#about" },
        { text: "Services", url: "/#services" },
        { text: "Events", url: "/#events" },
        { text: "Contact Us", url: "/#contact" },
      ],
    },
    {
      section: "services",
      links: [
        { text: "News Feed", url: "/newsfeed" },
        { text: "People", url: "/people" },
        { text: "Forums", url: "/forums" },
        { text: "Events", url: "/events" },
        { text: "Get Started", url: "/welcome" },
      ],
    },
    {
      section: "legal",
      links: [
        { text: "Privacy Policy", url: "/privacy-policy" },
        { text: "Terms of Service", url: "/terms-of-service" },
        { text: "Cookie Policy", url: "/cookie-policy" },
        { text: "Accessibility", url: "/accessibility" },
      ],
    },
  ];

  return (
    <footer className="footer">
      <div className="footer__container">
        <div className="footer__content">
          <div
            ref={(el) => {
              columnsRef.current[0] = el;
            }}
            data-animate-id="footer-column-1"
            className={`footer__column footer__column--brand ${
              visibleElements.has("footer-column-1") ? "fade-in" : ""
            }`}
          >
            <div className="footer__logo">
              <img
                src={footerSettings.logo_url}
                alt="JosCity Logo"
                className="footer__logo-image"
              />
            </div>
            <p className="footer__tagline">
              {footerSettings.tagline.split("\n").map((line, i) => (
                <React.Fragment key={i}>
                  {line}
                  {i < footerSettings.tagline.split("\n").length - 1 && <br />}
                </React.Fragment>
              ))}
            </p>
          </div>

          {footerLinks.map((section, index) => {
            if (section.links.length === 0) return null;
            const sectionTitles: Record<string, string> = {
              quick_links: "Quick Links",
              services: "Services",
              legal: "Legal",
            };
            const columnIndex = index + 1; // Start from 1 (0 is brand column)
            return (
              <div
                key={section.section}
                ref={(el) => {
                  columnsRef.current[columnIndex] = el;
                }}
                data-animate-id={`footer-column-${columnIndex + 1}`}
                className={`footer__column ${
                  visibleElements.has(`footer-column-${columnIndex + 1}`)
                    ? "fade-in"
                    : ""
                }`}
              >
                <h3 className="footer__heading">
                  {sectionTitles[section.section]}
                </h3>
                <ul className="footer__links">
                  {section.links.map((link, index) => {
                    // Handle hash links specially
                    if (link.url.startsWith("/#")) {
                      return (
                        <li key={index}>
                          <a
                            href={link.url}
                            className="footer__link"
                            onClick={(e) => handleHashLink(e, link.url)}
                          >
                            {link.text}
                          </a>
                        </li>
                      );
                    }
                    // Use Link component for internal routes, regular <a> for external URLs
                    const isInternalRoute = link.url.startsWith("/");
                    return (
                      <li key={index}>
                        {isInternalRoute ? (
                          <Link
                            to={link.url}
                            className="footer__link"
                            target={
                              link.opens_in_new_tab ? "_blank" : undefined
                            }
                            rel={
                              link.opens_in_new_tab
                                ? "noopener noreferrer"
                                : undefined
                            }
                          >
                            {link.text}
                          </Link>
                        ) : (
                          <a
                            href={link.url}
                            className="footer__link"
                            target={
                              link.opens_in_new_tab ? "_blank" : undefined
                            }
                            rel={
                              link.opens_in_new_tab
                                ? "noopener noreferrer"
                                : undefined
                            }
                          >
                            {link.text}
                          </a>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}

          {/* Social Media Section */}
          <div
            ref={(el) => {
              columnsRef.current[4] = el; // Index 4: brand(0) + 3 footerLinks(1,2,3) + social(4)
            }}
            data-animate-id="footer-column-5"
            className={`footer__column ${
              visibleElements.has("footer-column-5") ? "fade-in" : ""
            }`}
          >
            <h3 className="footer__heading">Follow Us</h3>
            <div className="footer__social-links">
              <a
                href={footerSettings.social_media.facebook}
                target="_blank"
                rel="noopener noreferrer"
                className="footer__social-link"
                aria-label="Facebook"
              >
                <Facebook size={20} />
              </a>
              <a
                href={footerSettings.social_media.twitter}
                target="_blank"
                rel="noopener noreferrer"
                className="footer__social-link"
                aria-label="Twitter"
              >
                <Twitter size={20} />
              </a>
              <a
                href={footerSettings.social_media.instagram}
                target="_blank"
                rel="noopener noreferrer"
                className="footer__social-link"
                aria-label="Instagram"
              >
                <Instagram size={20} />
              </a>
              <a
                href={footerSettings.social_media.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                className="footer__social-link"
                aria-label="LinkedIn"
              >
                <Linkedin size={20} />
              </a>
            </div>
          </div>
        </div>
      </div>

      <div className="footer__divider"></div>

      <div className="footer__container">
        <div
          ref={copyrightRef}
          data-animate-id="footer-copyright"
          className={`footer__copyright ${
            visibleElements.has("footer-copyright") ? "fade-in" : ""
          }`}
        >
          <p>
            ©{" "}
            <span
              onClick={handleYearClick}
              style={{
                cursor: "pointer",
                textDecoration: "none",
                color: "inherit",
                fontWeight: "inherit",
                fontSize: "inherit",
              }}
            >
              2025
            </span>{" "}
            JosCity Smart Services. All rights reserved. Developed by{" "}
            <a
              href="https://afresh.center"
              className="footer__link"
              target="_blank"
              rel="noopener noreferrer"
            >
              AfrESH
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
