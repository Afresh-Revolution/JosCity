import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { X } from "lucide-react";
import "../main.css";
import "../scss/_services.scss";

interface Service {
  id: string;
  title: string;
  description: string;
  iconColor: string;
  icon: React.ReactNode;
}

// Fallback services
const fallbackServices: Service[] = [
    {
      id: "electricity",
      title: "Electricity Services",
      description: "Pay bills, report outages, and track consumption online",
      iconColor: "#FFC107",
      icon: (
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M13 2L3 14H12L11 22L21 10H12L13 2Z"
            fill="none"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ),
    },
    {
      id: "water",
      title: "Water Services",
      description: "Manage water bills and service requests efficiently",
      iconColor: "#2196F3",
      icon: (
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M12 2.5C10.5 2.5 9.5 5 9.5 7C9.5 8.5 10 10 12 12.5C14 10 14.5 8.5 14.5 7C14.5 5 13.5 2.5 12 2.5Z"
            fill="none"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M12 12.5V20"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      ),
    },
    {
      id: "transportation",
      title: "Transportation",
      description: "Access public transport schedules and smart ticketing",
      iconColor: "#00C950",
      icon: (
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <rect
            x="4"
            y="8"
            width="16"
            height="9"
            rx="1"
            fill="none"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <rect
            x="5.5"
            y="9.5"
            width="3.5"
            height="3"
            fill="none"
            stroke="white"
            strokeWidth="1.5"
          />
          <rect
            x="10"
            y="9.5"
            width="3.5"
            height="3"
            fill="none"
            stroke="white"
            strokeWidth="1.5"
          />
          <rect
            x="14.5"
            y="9.5"
            width="3.5"
            height="3"
            fill="none"
            stroke="white"
            strokeWidth="1.5"
          />
          <circle
            cx="7.5"
            cy="19"
            r="1.5"
            fill="none"
            stroke="white"
            strokeWidth="2"
          />
          <circle
            cx="16.5"
            cy="19"
            r="1.5"
            fill="none"
            stroke="white"
            strokeWidth="2"
          />
        </svg>
      ),
    },
    {
      id: "egovernance",
      title: "E-Governance",
      description: "Digital government services and documentation",
      iconColor: "#9C27B0",
      icon: (
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M7 4H17V20H7V4Z"
            fill="none"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M7 4H14V10H20"
            fill="none"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <line x1="9" y1="8" x2="15" y2="8" stroke="white" strokeWidth="1.5" />
          <line
            x1="9"
            y1="11"
            x2="13"
            y2="11"
            stroke="white"
            strokeWidth="1.5"
          />
          <line
            x1="9"
            y1="14"
            x2="15"
            y2="14"
            stroke="white"
            strokeWidth="1.5"
          />
        </svg>
      ),
    },
    {
      id: "permits",
      title: "Permits & Licenses",
      description: "Apply for permits, licenses, and certifications online",
      iconColor: "#FF9800",
      icon: (
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M6 4H18V20H6V4Z"
            fill="none"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M8 5H16V7H8V5Z"
            fill="none"
            stroke="white"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M9 11L11 13L15 9"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ),
    },
    {
      id: "tax",
      title: "Tax & Revenue",
      description: "Pay taxes, fees, and levies securely online",
      iconColor: "#F44336",
      icon: (
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <rect
            x="5"
            y="8"
            width="14"
            height="10"
            rx="1.5"
            fill="none"
            stroke="white"
            strokeWidth="2"
          />
          <line
            x1="7"
            y1="11"
            x2="17"
            y2="11"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      ),
    },
    {
      id: "wifi",
      title: "Smart City WiFi",
      description: "Free public WiFi hotspots across the city",
      iconColor: "#9C27B0",
      icon: (
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M1 9L3 11C7.97 6.03 16.03 6.03 21 11L23 9C16.93 2.93 7.07 2.93 1 9Z"
            fill="none"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M5 13L7 15C9.76 12.24 14.24 12.24 17 15L19 13C15.14 9.14 8.86 9.14 5 13Z"
            fill="none"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M9 17L11 19C11.55 18.45 12.45 18.45 13 19L15 17C14.09 16.09 13.91 16.09 13 17C12.09 16.09 11.91 16.09 11 17C10.09 16.09 9.91 16.09 9 17Z"
            fill="none"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx="12" cy="20" r="1" fill="white" />
        </svg>
      ),
    },
    {
      id: "traffic",
      title: "Traffic Management",
      description: "Real-time traffic updates and road safety info",
      iconColor: "#00BCD4",
      icon: (
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M6 8H18C18.5 8 19 8.5 19 9V15C19 15.5 18.5 16 18 16H6C5.5 16 5 15.5 5 15V9C5 8.5 5.5 8 6 8Z"
            fill="none"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M7 10L8 9L11 10V13H7V10Z"
            fill="none"
            stroke="white"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle
            cx="9"
            cy="18"
            r="1.5"
            fill="none"
            stroke="white"
            strokeWidth="2"
          />
          <circle
            cx="15"
            cy="18"
            r="1.5"
            fill="none"
            stroke="white"
            strokeWidth="2"
          />
        </svg>
      ),
    },
    {
      id: "property",
      title: "Property Services",
      description: "Land registry, property tax, and building approvals",
      iconColor: "#E91E63",
      icon: (
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M4 12L12 3L20 12H17V20H13V15H11V20H7V12H4Z"
            fill="none"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <rect
            x="11"
            y="18"
            width="2"
            height="2"
            fill="none"
            stroke="white"
            strokeWidth="1.5"
          />
        </svg>
      ),
    },
    {
      id: "emergency",
      title: "Emergency Services",
      description: "Quick access to fire, police, and medical services",
      iconColor: "#F44336",
      icon: (
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M12 2L6 7V12C6 17 9 20 12 20C15 20 18 17 18 12V7L12 2Z"
            fill="none"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ),
    },
    {
      id: "citizen",
      title: "Citizen Engagement",
      description: "Participate in city planning and community forums",
      iconColor: "#03A9F4",
      icon: (
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M9 7C9 8.5 7.5 10 6 10C4.5 10 3 8.5 3 7C3 5.5 4.5 4 6 4C7.5 4 9 5.5 9 7Z"
            fill="none"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M15 7C15 8.5 13.5 10 12 10C10.5 10 9 8.5 9 7C9 5.5 10.5 4 12 4C13.5 4 15 5.5 15 7Z"
            fill="none"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M3 20C3 17 6 14 12 14C18 14 21 17 21 20"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ),
    },
    {
      id: "payments",
      title: "Digital Payments",
      description: "Unified payment gateway for all city services",
      iconColor: "#00C950",
      icon: (
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <rect
            x="5"
            y="8"
            width="14"
            height="10"
            rx="1.5"
            fill="none"
            stroke="white"
            strokeWidth="2"
          />
          <circle
            cx="12"
            cy="13"
            r="2"
            fill="none"
            stroke="white"
            strokeWidth="2"
          />
          <circle cx="8" cy="13" r="0.8" fill="white" />
          <circle cx="16" cy="13" r="0.8" fill="white" />
        </svg>
      ),
    },
  ];

const Services: React.FC = () => {
  const navigate = useNavigate();
  const [visibleElements, setVisibleElements] = useState<Set<string>>(
    new Set()
  );
  const [visibleCards, setVisibleCards] = useState<Set<number>>(new Set());
  const [services] = useState<Service[]>(fallbackServices);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const badgeText = "Our Services";
  const heading = "Smart City Services";
  const subheading = "Access all municipal services in one place ";
  const badgeRef = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const subheadingRef = useRef<HTMLParagraphElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const viewAllRef = useRef<HTMLDivElement>(null);

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
            if (entry.target.classList.contains("services__card")) {
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
            if (entry.target.classList.contains("services__card")) {
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
      viewAllRef.current,
    ];

    elements.forEach((el) => {
      if (el) observer.observe(el);
    });

    // Observe all cards after a short delay to ensure they're rendered
    const cardObserverTimeout = setTimeout(() => {
      const cards = document.querySelectorAll(".services__card");
      cards.forEach((card) => {
        observer.observe(card);
      });
    }, 100);

    return () => {
      clearTimeout(cardObserverTimeout);
      elements.forEach((el) => {
        if (el) observer.unobserve(el);
      });
      const cards = document.querySelectorAll(".services__card");
      cards.forEach((card) => {
        observer.unobserve(card);
      });
    };
  }, []);

  // Handle modal open/close - prevent body scroll and handle ESC key
  useEffect(() => {
    if (isModalOpen) {
      // Prevent body scroll when modal is open
      document.body.style.overflow = "hidden";
      
      // Handle ESC key to close modal
      const handleEscape = (e: KeyboardEvent) => {
        if (e.key === "Escape") {
          setIsModalOpen(false);
        }
      };
      
      window.addEventListener("keydown", handleEscape);
      
      return () => {
        document.body.style.overflow = "";
        window.removeEventListener("keydown", handleEscape);
      };
    }
  }, [isModalOpen]);

  return (
    <>
      <section id="services" className="services">
        <div className="services__container">
          <div className="services__hero">
            <div
              ref={badgeRef}
              data-animate-id="services-badge"
              className={`services__badge ${
                visibleElements.has("services-badge") ? "fade-in" : ""
              }`}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M9 11L12 14L22 4"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M21 12V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H16"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span>{badgeText}</span>
            </div>
            <h1
              ref={headingRef}
              data-animate-id="services-heading"
              className={`services__heading ${
                visibleElements.has("services-heading") ? "fade-in" : ""
              }`}
            >
              {heading}
            </h1>
            <p
              ref={subheadingRef}
              data-animate-id="services-subheading"
              className={`services__subheading ${
                visibleElements.has("services-subheading") ? "fade-in" : ""
              }`}
            >
              {subheading}
              and accessible 24/7
            </p>
          </div>

          <div
            ref={gridRef}
            data-animate-id="services-grid"
            className={`services__grid ${
              visibleElements.has("services-grid") ? "fade-in" : ""
            }`}
          >
            {services.slice(0, 6).map((service, index) => (
              <div
                key={service.id}
                data-card-index={index}
                className={`services__card ${
                  visibleCards.has(index) ? "fade-in-up" : ""
                }`}
              >
                <div
                  className="services__card-icon"
                  style={{ backgroundColor: service.iconColor }}
                >
                  {service.icon}
                </div>
                <div className="services__card-content">
                  <h3 className="services__card-title">{service.title}</h3>
                  <p className="services__card-description">
                    {service.description}
                  </p>
                  <button className="services__card-link"
                    onClick={() => navigate("/services-coming-soon")}
                  >
                    Access Service <span>&gt;</span>
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div
            ref={viewAllRef}
            data-animate-id="services-view-all"
            className={`services__view-all ${
              visibleElements.has("services-view-all") ? "fade-in" : ""
            }`}
          >
            <button 
              className="services__view-all-button"
              onClick={() => setIsModalOpen(true)}
            >
              View All <span>&gt;</span>
            </button>
          </div>
        </div>
      </section>

      {/* Services Modal */}
      {isModalOpen && (
        <div className="services-modal" onClick={() => setIsModalOpen(false)}>
          <div 
            className="services-modal__content"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="services-modal__header">
              <h2 className="services-modal__title">All Services</h2>
              <button 
                className="services-modal__close"
                onClick={() => setIsModalOpen(false)}
                aria-label="Close modal"
              >
                <X size={24} />
              </button>
            </div>
            <div className="services-modal__body">
              <div className="services-modal__grid">
                {services.map((service) => (
                  <div key={service.id} className="services-modal__item">
                    <div 
                      className="services-modal__item-icon"
                      style={{ backgroundColor: service.iconColor }}
                    >
                      {service.icon}
                    </div>
                    <div className="services-modal__item-content">
                      <h3 className="services-modal__item-title">
                        {service.title}
                      </h3>
                      <p className="services-modal__item-description">
                        {service.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Services;
