import React, { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import "../main.css";
 
const About: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const fromNewsfeed = location.state?.fromNewsfeed || false;

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const handleBack = () => {
    if (fromNewsfeed) {
      navigate("/newsfeed");
    } else {
      navigate("/");
    }
  };

  return (
    <div className="legal-page">
      <div className="legal-page__container">
        <div className="legal-page__header">
          <button
            className="legal-page__back-button"
            onClick={handleBack}
          >
            <ArrowLeft size={20} />
            {fromNewsfeed ? "Back to Newsfeed" : "Back Home"}
            
          </button>
          <h1 className="legal-page__title">About JOSCity</h1>
          <p className="legal-page__last-updated">
            Last updated:{" "}
            {new Date().toLocaleDateString("en-US", {
              month: "long",
              year: "numeric",
            })}
          </p>
        </div>

        <div className="legal-page__content">
          <section className="legal-page__section">
            <h2>Welcome to JOSCity</h2>
            <p>
              JOSCity is a comprehensive smart city platform designed to connect
              residents, businesses, and organizations in Jos, Nigeria. Our mission
              is to create a digital ecosystem that fosters community engagement,
              facilitates business growth, and enhances the quality of life for
              all citizens.
            </p>
          </section>

          <section className="legal-page__section">
            <h2>Our Mission</h2>
            <p>
              To transform Jos into a digitally connected smart city where
              technology serves the community, enabling seamless communication,
              efficient services, and sustainable development.
            </p>
          </section>

          <section className="legal-page__section">
            <h2>What We Offer</h2>
            <h3>For Residents</h3>
            <ul>
              <li>Social networking and community engagement</li>
              <li>Access to local events and news</li>
              <li>Business directory and marketplace</li>
              <li>Job opportunities and career resources</li>
              <li>Entertainment and cultural content</li>
            </ul>

            <h3>For Businesses</h3>
            <ul>
              <li>Business profile and promotion</li>
              <li>Marketplace for products and services</li>
              <li>Event management and promotion</li>
              <li>Customer engagement tools</li>
              <li>Networking opportunities</li>
            </ul>
          </section>

          <section className="legal-page__section">
            <h2>Our Values</h2>
            <ul>
              <li>
                <strong>Community First:</strong> We prioritize the needs and
                well-being of our community members.
              </li>
              <li>
                <strong>Innovation:</strong> We continuously evolve our platform
                to meet changing needs and leverage new technologies.
              </li>
              <li>
                <strong>Transparency:</strong> We believe in open communication
                and clear policies.
              </li>
              <li>
                <strong>Inclusivity:</strong> We welcome everyone and strive to
                create an accessible platform for all.
              </li>
            </ul>
          </section>

          <section className="legal-page__section">
            <h2>Contact Us</h2>
            <p>
              Have questions or feedback? We'd love to hear from you. Visit our{" "}
              <a
                href="/contact"
                onClick={(e) => {
                  e.preventDefault();
                  navigate("/contact");
                }}
                style={{ color: "var(--primary-color, #0d4a1f)" }}
              >
                Contact Us
              </a>{" "}
              page to get in touch.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default About;

