import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import "../scss/_pricing.scss";

interface PricingFeature {
  name: string;
  included: boolean;
}

interface PricingPlan {
  id: string;
  name: string;
  price: string;
  features: PricingFeature[];
}

// Fallback plans
const fallbackPlans: PricingPlan[] = [
    {
      id: "platinum",
      name: "Platinium Membership Package",
      price: "₦20,000",
      features: [
        { name: "10% Discount", included: true },
        { name: "Premium Partners", included: true },
        { name: "Free Monthly Service", included: true },
        { name: "Unlimited brands/users", included: true },
        { name: "VIP perks", included: true },
      ],
    },
    {
      id: "gold",
      name: "Gold Membership Package",
      price: "₦10,000",
      features: [
        { name: "10% Discount", included: true },
        { name: "Premium Partners", included: true },
        { name: "Free Monthly Service", included: true },
        { name: "Unlimited brands/users", included: false },
        { name: "VIP perks", included: false },
      ],
    },
    {
      id: "silver",
      name: "Silver Membership Package",
      price: "₦5,000",
      features: [
        { name: "10% Discount", included: true },
        { name: "Premium Partners", included: true },
        { name: "Free Monthly Service", included: false },
        { name: "Unlimited brands/users", included: false },
        { name: "VIP perks", included: false },
      ],
    },
    {
      id: "bronze",
      name: "Bronze Membership Package",
      price: "₦2,000",
      features: [
        { name: "10% Discount", included: true },
        { name: "Premium Partners", included: false },
        { name: "Free Monthly Service", included: false },
        { name: "Unlimited brands/users", included: false },
        { name: "VIP perks", included: false },
      ],
    },
  ];

const Pricing: React.FC = () => {
  const navigate = useNavigate();
  const [visibleElements, setVisibleElements] = useState<Set<string>>(
    new Set()
  );
  const [visibleCards, setVisibleCards] = useState<Set<number>>(new Set());
  const [plans] = useState<PricingPlan[]>(fallbackPlans);
  const badgeText = "Pricing Plans";
  const heading = "Choose Your Plan";
  const subheading = "Select the perfect membership package for your ";
  const badgeRef = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const subheadingRef = useRef<HTMLParagraphElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);

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
            if (entry.target.classList.contains("pricing__card")) {
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
            if (entry.target.classList.contains("pricing__card")) {
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
      const cards = document.querySelectorAll(".pricing__card");
      cards.forEach((card) => {
        observer.observe(card);
      });
    }, 100);

    return () => {
      clearTimeout(cardObserverTimeout);
      elements.forEach((el) => {
        if (el) observer.unobserve(el);
      });
      const cards = document.querySelectorAll(".pricing__card");
      cards.forEach((card) => {
        observer.unobserve(card);
      });
    };
  }, []);

  return (
    <section className="pricing">
      <div className="pricing__container">
        <div className="pricing__hero">
          <div
            ref={badgeRef}
            data-animate-id="pricing-badge"
            className={`pricing__badge ${
              visibleElements.has("pricing-badge") ? "fade-in" : ""
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
                d="M12 2L2 7L12 12L22 7L12 2Z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M2 17L12 22L22 17"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M2 12L12 17L22 12"
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
            data-animate-id="pricing-heading"
            className={`pricing__heading ${
              visibleElements.has("pricing-heading") ? "fade-in" : ""
            }`}
          >
            {heading}
          </h1>
          <p
            ref={subheadingRef}
            data-animate-id="pricing-subheading"
            className={`pricing__subheading ${
              visibleElements.has("pricing-subheading") ? "fade-in" : ""
            }`}
          >
            {subheading}
            residents, businesses, and visitors through one powerful digital
            membership platform that brings your city's marketplace, wallet, and
            community together.
          </p>
        </div>

        <div
          ref={gridRef} // ref to the grid container
          data-animate-id="pricing-grid"
          className={`pricing__grid ${
            visibleElements.has("pricing-grid") ? "fade-in" : ""
          }`}
        >
          {plans.map((plan, index) => (
            <div
              key={plan.id}
              data-card-index={index}
              className={`pricing__card pricing__card--${plan.id} ${
                visibleCards.has(index) ? "fade-in-up" : ""
              }`}
            >
              <div className="pricing__card-header">
                <h3 className="pricing__card-name">{plan.name}</h3>
                <div className="pricing__card-price">{plan.price}</div>
                <p className="pricing__card-billing">
                  Billed monthly Pause / Cancel anytime
                </p>
              </div>
              <div className="pricing__card-features">
                <h4 className="pricing__card-features-title">Features :</h4>
                <ul className="pricing__card-features-list">
                  {plan.features.map((feature, featureIndex) => (
                    <li
                      key={featureIndex}
                      className={`pricing__card-feature ${
                        feature.included ? "included" : "excluded"
                      }`}
                    >
                      {feature.included ? (
                        <svg
                          width="20"
                          height="20"
                          viewBox="0 0 24 24"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            d="M20 6L9 17L4 12"
                            stroke="#ffffff"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      ) : (
                        <svg
                          width="20"
                          height="20"
                          viewBox="0 0 24 24"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <line
                            x1="18"
                            y1="6"
                            x2="6"
                            y2="18"
                            stroke="rgba(255, 255, 255, 0.5)"
                            strokeWidth="2"
                            strokeLinecap="round"
                          />
                          <line
                            x1="6"
                            y1="6"
                            x2="18"
                            y2="18"
                            stroke="rgba(255, 255, 255, 0.5)"
                            strokeWidth="2"
                            strokeLinecap="round"
                          />
                        </svg>
                      )}
                      <span>{feature.name}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <button
                className="pricing__card-button"
                onClick={() => navigate("/welcome")}
              >
                Subscribe Now <span>→</span>
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Pricing;
