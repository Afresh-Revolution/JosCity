import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  getPublicMembershipCatalog,
  getAccountMembership,
  cancelMembership,
  resumeMembership,
  PLAN_REVISED_COPY,
  type CurrentMembership,
  type PublicMembershipPlan,
} from "../services/membershipApi";
import { isAuthenticated } from "../utils/userUtils";
import MembershipCountdown from "../components/MembershipCountdown";
import ConfirmationModal from "../components/ConfirmationModal";
import "../scss/_pricing.scss";

const CARD_SIZE_CLASSES = ["platinum", "gold", "silver", "bronze"] as const;

function formatNaira(value?: number) {
  return `₦${Number(value || 0).toLocaleString("en-NG")}`;
}

const Pricing: React.FC = () => {
  const navigate = useNavigate();
  const [visibleElements, setVisibleElements] = useState<Set<string>>(
    new Set()
  );
  const [visibleCards, setVisibleCards] = useState<Set<number>>(new Set());
  const [plans, setPlans] = useState<PublicMembershipPlan[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [current, setCurrent] = useState<CurrentMembership>(null);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [resuming, setResuming] = useState(false);
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

            if (entry.target.classList.contains("pricing__card")) {
              const cardIndex = parseInt(
                entry.target.getAttribute("data-card-index") || "0"
              );
              setTimeout(() => {
                setVisibleCards((prev) => new Set(prev).add(cardIndex));
              }, cardIndex * 100);
            }
          } else {
            if (elementId) {
              setVisibleElements((prev) => {
                const newSet = new Set(prev);
                newSet.delete(elementId);
                return newSet;
              });
            }

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
  }, [plans]);

  useEffect(() => {
    let cancelled = false;
    void getPublicMembershipCatalog()
      .then((catalog) => {
        if (cancelled) return;
        setPlans(catalog.plans);
        setLoadError(null);
      })
      .catch((err) => {
        if (cancelled) return;
        setPlans([]);
        setLoadError(
          err instanceof Error
            ? err.message
            : "Couldn't load membership plans."
        );
      })
      .finally(() => {
        if (!cancelled) setLoaded(true);
      });

    if (isAuthenticated()) {
      void getAccountMembership()
        .then((membership) => {
          if (!cancelled) setCurrent(membership.current || null);
        })
        .catch(() => {
          if (!cancelled) setCurrent(null);
        });
    } else {
      setCurrent(null);
    }

    return () => {
      cancelled = true;
    };
  }, []);

  const goToSubscribe = () => {
    if (isAuthenticated()) {
      navigate("/membership");
      return;
    }
    navigate("/signin", { state: { redirectTo: "/membership" } });
  };

  const confirmCancelSubscription = async () => {
    setCancelling(true);
    try {
      const next = await cancelMembership();
      setCurrent(next || null);
    } catch {
      setConfirmCancel(false);
      setCancelling(false);
      navigate("/membership");
      return;
    }
    setCancelling(false);
    setConfirmCancel(false);
  };

  const undoCancellation = async () => {
    setResuming(true);
    try {
      const next = await resumeMembership();
      setCurrent(next || null);
    } catch {
      navigate("/membership");
    } finally {
      setResuming(false);
    }
  };

  const showComingSoon = loaded && !loadError && plans.length === 0;

  return (
    <>
    <section className="pricing" id="pricing">
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

        {!loaded ? (
          <p className="pricing__status">Loading membership plans...</p>
        ) : loadError ? (
          <p className="pricing__status pricing__status--error">{loadError}</p>
        ) : showComingSoon ? (
          <div className="pricing__status">
            <h2>Coming soon</h2>
            <p>
              Membership plans are set by JosCity admin. They are not available
              yet.
            </p>
          </div>
        ) : (
          <div
            ref={gridRef}
            data-animate-id="pricing-grid"
            className={`pricing__grid ${
              visibleElements.has("pricing-grid") ? "fade-in" : ""
            }`}
          >
            {plans.map((plan, index) => {
              const sizeClass =
                CARD_SIZE_CLASSES[Math.min(index, CARD_SIZE_CLASSES.length - 1)];
              const featured = index === 0;
              const isCurrent =
                current?.status === "ACTIVE" &&
                String(current.package_id) === String(plan.id);
              const isRevised = Boolean(isCurrent && current?.plan_revised);
              return (
                <div
                  key={plan.id}
                  data-card-index={index}
                  className={`pricing__card pricing__card--${sizeClass}${
                    featured ? " pricing__card--featured" : ""
                  }${isCurrent ? " pricing__card--subscribed" : ""}${
                    isRevised ? " pricing__card--revised" : ""
                  } ${
                    visibleCards.has(index) ? "fade-in-up" : ""
                  }`}
                >
                  <div className="pricing__card-header">
                    <div className="pricing__card-name-row">
                      <h3 className="pricing__card-name">{plan.title}</h3>
                      {isCurrent ? (
                        <div className="pricing__card-badges">
                          <span className="pricing__subscribed-badge">
                            {current?.cancelled ? "Cancelled" : "Subscribed"}
                          </span>
                          {isRevised ? (
                            <span className="pricing__subscribed-badge pricing__subscribed-badge--revised">
                              Plan revised
                            </span>
                          ) : null}
                        </div>
                      ) : null}
                    </div>
                    {isRevised ? (
                      <p className="pricing__card-revised">{PLAN_REVISED_COPY}</p>
                    ) : null}
                    <div className="pricing__card-price">
                      {formatNaira(plan.amount)}
                    </div>
                    <p className="pricing__card-billing">
                      Billed every 30 days · Pause / Cancel anytime
                    </p>
                  </div>
                  <div className="pricing__card-features">
                    <h4 className="pricing__card-features-title">Features :</h4>
                    <ul className="pricing__card-features-list">
                      {plan.features.map((feature, featureIndex) => (
                        <li
                          key={`${plan.id}-${featureIndex}`}
                          className="pricing__card-feature included"
                        >
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
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  {isCurrent ? (
                    <div className="pricing__card-subscribed">
                      <MembershipCountdown
                        expiresAt={current?.expires_at}
                        cancelled={Boolean(current?.cancelled)}
                      />
                      {current?.cancelled ? (
                        <>
                          {current?.plan_revised ? (
                            <button
                              type="button"
                              className="pricing__card-button pricing__card-button--manage"
                              onClick={goToSubscribe}
                            >
                              Resubscribe
                            </button>
                          ) : null}
                          <button
                            type="button"
                            className="pricing__card-button pricing__card-button--manage"
                            disabled={resuming}
                            onClick={() => void undoCancellation()}
                          >
                            {resuming ? "Resuming..." : "Undo cancellation"}
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            type="button"
                            className="pricing__card-button pricing__card-button--manage"
                            onClick={goToSubscribe}
                          >
                            {current?.plan_revised
                              ? "Resubscribe"
                              : "Renew / manage"}
                          </button>
                          <button
                            type="button"
                            className="pricing__card-button pricing__card-button--cancel"
                            disabled={cancelling || resuming}
                            onClick={() => setConfirmCancel(true)}
                          >
                            Cancel subscription
                          </button>
                        </>
                      )}
                    </div>
                  ) : (
                    <button
                      type="button"
                      className="pricing__card-button"
                      onClick={goToSubscribe}
                    >
                      Subscribe Now <span>→</span>
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
    <ConfirmationModal
      isOpen={confirmCancel}
      onClose={() => setConfirmCancel(false)}
      onConfirm={() => void confirmCancelSubscription()}
      title="Cancel subscription?"
      message="You keep your paid JosRide discount until the expiry date. Wallet cashback already in progress still credits every 30 days until its duration ends, even after you cancel. You will not be reminded to renew, and this payment is not refunded."
      confirmText="Cancel subscription"
      cancelText="Keep plan"
      type="warning"
      isLoading={cancelling}
    />
    </>
  );
};

export default Pricing;
