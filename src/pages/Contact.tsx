import React, { useState, useEffect, useRef } from "react";
import { ExternalLink, Phone, Mail, MapPin, Users, X } from "lucide-react";
import CommonQuestions from "../components/CommonQuestions";
import {
  DeveloperProfile,
  developersApi,
  fallbackDevelopers,
} from "../services/developersApi";
import blessingImage from "../image/newsfeed/blessing.jpg";
import fallbackDeveloperImage from "../image/primary-logo.png";
import olaImage from "../image/newsfeed/Ola.jpeg";
import sandersonImage from "../image/newsfeed/Sanderson.jpeg";
import williamImage from "../image/newsfeed/William.jpeg";

const developerImages: Record<string, string> = {
  blessing: blessingImage,
  ola: olaImage,
  sanderson: sandersonImage,
  william: williamImage,
};

const developerImage = (developer: DeveloperProfile) =>
  developer.imageUrl ||
  developerImages[developer.imageKey] ||
  fallbackDeveloperImage;

const Contact: React.FC = () => {
  const [visibleElements, setVisibleElements] = useState<Set<string>>(
    new Set()
  );
  const [visibleCards, setVisibleCards] = useState<Set<number>>(new Set());
  const [isDevelopersModalOpen, setIsDevelopersModalOpen] = useState(false);
  const [developers, setDevelopers] = useState<DeveloperProfile[]>([]);
  const [developersLoading, setDevelopersLoading] = useState(false);
  const [developersNotice, setDevelopersNotice] = useState<string | null>(null);
  const badgeRef = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const subheadingRef = useRef<HTMLParagraphElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const badgeText = "Contact Us";
  const heading = "Get in Touch";
  const subheading = "Our support team is available 24/7 to assist you";

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const elementId = entry.target.getAttribute("data-animate-id");
          
          if (entry.isIntersecting) {
            if (elementId) {
              setVisibleElements((prev) => new Set(prev).add(elementId));
            }

            // Handle card animations with staggered delay
            if (entry.target.classList.contains("contact__card")) {
              const cardIndex = parseInt(
                entry.target.getAttribute("data-card-index") || "0"
              );
              setTimeout(() => {
                setVisibleCards((prev) => new Set(prev).add(cardIndex));
              }, cardIndex * 100);
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

            // Handle card animations - remove when scrolling out
            if (entry.target.classList.contains("contact__card")) {
              const cardIndex = parseInt(
                entry.target.getAttribute("data-card-index") || "0"
              );
              setVisibleCards((prev) => {
                const newSet = new Set(prev);
                newSet.delete(cardIndex);
                return newSet;
              });
            }
          }
        });
      },
      { threshold: 0.1 }
    );

    const elements = [
      badgeRef.current,
      headingRef.current,
      subheadingRef.current,
      gridRef.current,
    ];

    elements.forEach((el) => {
      if (el) observer.observe(el);
    });

    // Observe all cards after a short delay to ensure they're rendered
    const cardObserverTimeout = setTimeout(() => {
      const cards = document.querySelectorAll(".contact__card");
      cards.forEach((card) => {
        observer.observe(card);
      });
    }, 100);

    return () => {
      clearTimeout(cardObserverTimeout);
      elements.forEach((el) => {
        if (el) observer.unobserve(el);
      });
      const cards = document.querySelectorAll(".contact__card");
      cards.forEach((card) => {
        observer.unobserve(card);
      });
    };
  }, []);

  useEffect(() => {
    if (!isDevelopersModalOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsDevelopersModalOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isDevelopersModalOpen]);

  const contactMethods = [
    {
      id: "phone",
      icon: Phone,
      iconColor: "#2196F3",
      iconBg: "rgba(33, 150, 243, 0.1)",
      title: "Phone",
      detail1: "+234 7067621916",
      detail2: "Mon - Sat 24/7",
      action: () => {
        window.location.href = "tel:+234 7067621916";
      },
    },
    {
      id: "email",
      icon: Mail,
      iconColor: "#00C950",
      iconBg: "rgba(0, 201, 80, 0.1)",
      title: "Email",
      detail1: "support@joscity.com",
      detail2: "Response in 24 hours",
      action: () => {
        window.location.href = "mailto:support@joscity.com";
      },
    },
    {
      id: "location",
      icon: MapPin,
      iconColor: "#9C27B0",
      iconBg: "rgba(156, 39, 176, 0.1)",
      title: "Location",
      detail1: "Jos City Center",
      detail2: "Plateau State, Nigeria",
      action: () => {
        const address = encodeURIComponent(
          "Jos City Center, Plateau State, Nigeria"
        );
        window.open(
          `https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d15723.033480422853!2d8.871507993915424!3d9.870628226907453!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x105374831abc0e1f%3A0xc8061ae6c03b94cd!2s75%20Yakubu%20Gowon%20Way%2C%20Jos%20930104%2C%20Plateau!5e0!3m2!1sen!2sng!4v1764023260145!5m2!1sen!2sng"=${address}`,
          "_blank"
        );
      },
    },
  ];

  const openDevelopersModal = async () => {
    setIsDevelopersModalOpen(true);

    if (developers.length > 0 || developersLoading) {
      return;
    }

    setDevelopersLoading(true);
    setDevelopersNotice(null);

    try {
      const developerProfiles = await developersApi.getDevelopers();
      setDevelopers(developerProfiles);
    } catch {
      setDevelopers(fallbackDevelopers);
      setDevelopersNotice(
        "Showing saved developer profiles while the server is unavailable."
      );
    } finally {
      setDevelopersLoading(false);
    }
  };

  const closeDevelopersModal = () => {
    setIsDevelopersModalOpen(false);
  };

  return (
    <section id="contact" className="contact">
      <div className="contact__container">
        <div className="contact__hero">
          <div
            ref={badgeRef}
            data-animate-id="contact-badge"
            className={`contact__badge ${
              visibleElements.has("contact-badge") ? "fade-in" : ""
            }`}
          >
            <Phone size={16} />
            <span>{badgeText}</span>
          </div>
          <h1
            ref={headingRef}
            data-animate-id="contact-heading"
            className={`contact__heading ${
              visibleElements.has("contact-heading") ? "fade-in" : ""
            }`}
          >
            {heading}
          </h1>
          <p
            ref={subheadingRef}
            data-animate-id="contact-subheading"
            className={`contact__subheading ${
              visibleElements.has("contact-subheading") ? "fade-in" : ""
            }`}
          >
            {subheading}
          </p>
        </div>

        <div
          ref={gridRef}
          data-animate-id="contact-grid"
          className={`contact__grid ${
            visibleElements.has("contact-grid") ? "fade-in" : ""
          }`}
        >
          {contactMethods.map((method, index) => {
            const IconComponent = method.icon;
            return (
              <div
                key={method.id}
                data-card-index={index}
                className={`contact__card ${
                  visibleCards.has(index) ? "fade-in-up" : ""
                }`}
                onClick={method.action}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    method.action();
                  }
                }}
              >
                <div
                  className="contact__card-icon"
                  style={{
                    backgroundColor: method.iconBg,
                    color: method.iconColor,
                  }}
                >
                  <IconComponent size={24} />
                </div>
                <h3 className="contact__card-title">{method.title}</h3>
                <p className="contact__card-detail">{method.detail1}</p>
                <p className="contact__card-detail contact__card-detail--secondary">
                  {method.detail2}
                </p>
              </div>
            );
          })}
        </div>

        <CommonQuestions className="contact__faqs" heading="Common questions" />

        <div
          className={`contact__developers-cta ${
            visibleElements.has("contact-grid") ? "fade-in" : ""
          }`}
        >
          <button
            type="button"
            className="contact__developers-link"
            onClick={openDevelopersModal}
          >
            <Users size={18} />
            <span>view developers</span>
          </button>
        </div>
      </div>

      {isDevelopersModalOpen && (
        <div
          className="contact-developers-modal-overlay"
          onClick={closeDevelopersModal}
        >
          <div
            className="contact-developers-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="contact-developers-modal-title"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              className="contact-developers-modal__close"
              onClick={closeDevelopersModal}
              aria-label="Close developers modal"
            >
              <X size={20} />
            </button>

            <div className="contact-developers-modal__header">
              <div className="contact-developers-modal__icon">
                <Users size={24} />
              </div>
              <h2
                id="contact-developers-modal-title"
                className="contact-developers-modal__title"
              >
                Developers
              </h2>
            </div>

            {developersNotice && (
              <p className="contact-developers-modal__notice">
                {developersNotice}
              </p>
            )}

            {developersLoading ? (
              <p className="contact-developers-modal__status">
                Loading developers...
              </p>
            ) : developers.length === 0 ? (
              <p className="contact-developers-modal__status">
                No developer profiles are available yet.
              </p>
            ) : (
              <div className="contact-developers-modal__grid">
                {developers.map((developer) => (
                  <article
                    key={developer.id}
                    className="contact-developers-modal__card"
                  >
                    <img
                      className="contact-developers-modal__avatar"
                      src={developerImage(developer)}
                      alt={developer.fullName}
                    />
                    <div className="contact-developers-modal__body">
                      <h3 className="contact-developers-modal__name">
                        {developer.fullName}
                      </h3>
                      <p className="contact-developers-modal__role">
                        {developer.role}
                      </p>
                      <p className="contact-developers-modal__description">
                        {developer.description}
                      </p>
                      {developer.portfolioUrl && (
                        <a
                          className="contact-developers-modal__portfolio"
                          href={developer.portfolioUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          View portfolio <ExternalLink size={14} />
                        </a>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            )}

            <button
              type="button"
              className="contact-developers-modal__cancel"
              onClick={closeDevelopersModal}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </section>
  );
};

export default Contact;
