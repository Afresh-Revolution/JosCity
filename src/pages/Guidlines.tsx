import React, { useState, useEffect } from "react";
import "../main.css";
import "../scss/_guidelines.scss";
import primaryLogo from "../image/primary-logo.png"; // Fallback
import { useScrollAnimation } from "../hooks/useScrollAnimation";
import LazyImage from "../components/LazyImage";
import AppStoreDownload from "../components/AppStoreDownload";

interface Guideline {
  id: string;
  quote: string;
  author_name: string;
  author_role?: string;
  rating: number;
  author_image_url?: string;
  display_order: number;
  is_active: boolean;
}

const Guidelines: React.FC = () => {
  const [currentGuidelines, setCurrentGuidelines] = useState(0);
  const guidelines: Guideline[] = [
    {
      id: "1",
      quote:
        "Welcome to the Jos Smart City PWA! We're here to help you navigate and enjoy your city with ease. In this phase of the app, kindly click on the green 'Get Started' button to redirect you to an account type panel, select your type of account, carefully fill in your details, an email would be sent to you if submitted successfully, with a login button and an OTP. Your Information is protected and will not be shared with anyone.",
      author_name: "AfrESH Support",
      rating: 5,
      display_order: 0,
      is_active: true,
    },
  ];
  const [badgeText, setBadgeText] = useState<string>("Guidelines");
  const [heading, setHeading] = useState<string>("Guidelines");

  // Scroll animations
  const badgeAnimation = useScrollAnimation({
    threshold: 0.2,
    animationClass: "fade-in",
    scrollOutClass: "",
  });
  const headingAnimation = useScrollAnimation({
    threshold: 0.2,
    animationClass: "fade-in",
    scrollOutClass: "",
  });
  const cardAnimation = useScrollAnimation({
    threshold: 0.1,
    animationClass: "fade-in",
    scrollOutClass: "",
  });
  const imageAnimation = useScrollAnimation({
    threshold: 0.1,
    animationClass: "scroll-in",
    scrollOutClass: "scroll-out",
  });
  const downloadAnimation = useScrollAnimation({
    threshold: 0.15,
    animationClass: "fade-in",
    scrollOutClass: "",
  });

  useEffect(() => {
    // Use default values (no API calls)
    setBadgeText("Guidelines");
    setHeading("Guidelines");
    // Guidelines state already has default value
  }, []);

  const goToPrevious = () => {
    setCurrentGuidelines(
      (prev) => (prev - 1 + guidelines.length) % guidelines.length
    );
  };

  const goToNext = () => {
    setCurrentGuidelines((prev) => (prev + 1) % guidelines.length);
  };

  const current = guidelines[currentGuidelines];
  const currentImage = current?.author_image_url || primaryLogo;

  return (
    <section className="guidelines" id="guidelines">
      <div className="guidelines__container">
        <div className="guidelines__heading">
          <div
            ref={badgeAnimation.ref as React.RefObject<HTMLDivElement>}
            className={`guidelines__badge ${badgeAnimation.className}`}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span>{badgeText}</span>
          </div>
          <h2
            ref={headingAnimation.ref as React.RefObject<HTMLHeadingElement>}
            className={`guidelines__title ${headingAnimation.className}`}
          >
            {heading}
          </h2>
        </div>

        <div
          ref={cardAnimation.ref as React.RefObject<HTMLDivElement>}
          className={`guidelines__card ${cardAnimation.className}`}
        >
          <div className="guidelines__content">
            <p className="guidelines__quote">{current?.quote || ""}</p>
            <div className="guidelines__rating">
              {[...Array(current?.rating || 5)].map((_, index) => (
                <svg
                  key={index}
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
                </svg>
              ))}
            </div>
            <h3 className="guidelines__name">{current?.author_name || ""}</h3>
            {current?.author_role && (
              <p className="guidelines__role">{current.author_role}</p>
            )}
          </div>
          <LazyImage
            src={currentImage}
            alt={current?.author_name || "Guideline author"}
            className={`guidelines__image ${imageAnimation.className}`}
            ref={imageAnimation.ref as React.RefObject<HTMLDivElement>}
          />
        </div>

        <div className="guidelines__navigation">
          <button
            className="guidelines__nav-button guidelines__nav-button--prev"
            onClick={goToPrevious}
            aria-label="Previous testimonial"
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M15 18L9 12L15 6"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
          <button
            className="guidelines__nav-button guidelines__nav-button--next"
            onClick={goToNext}
            aria-label="Next testimonial"
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M9 18L15 12L9 6"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>

        <div
          ref={downloadAnimation.ref as React.RefObject<HTMLDivElement>}
          className={`guidelines__download ${downloadAnimation.className}`}
        >
          <AppStoreDownload />
        </div>
      </div>
    </section>
  );
};

export default Guidelines;
