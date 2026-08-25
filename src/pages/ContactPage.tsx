import React, { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft, Phone, Mail, MapPin } from "lucide-react";
import CommonQuestions from "../components/CommonQuestions";
import "../main.css";

const ContactPage: React.FC = () => {
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
          <h1 className="legal-page__title">Contact Us</h1>
          <p className="legal-page__last-updated">
            We're here to help! Get in touch with us.
          </p>
        </div>

        <div className="legal-page__content">
          <section className="legal-page__section">
            <h2>Get in Touch</h2>
            <p>
              Our support team is available 24/7 to assist you with any questions,
              concerns, or feedback you may have about JOSCity.
            </p>
          </section>

          <section className="legal-page__section">
            <h2>Contact Information</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
                <Mail size={24} style={{ color: "var(--primary-color, #0d4a1f)", flexShrink: 0, marginTop: "4px" }} />
                <div>
                  <h3 style={{ margin: "0 0 4px 0" }}>Email</h3>
                  <p style={{ margin: 0 }}>
                    <a
                      href="mailto:support@joscity.com"
                      style={{ color: "var(--primary-color, #0d4a1f)" }}
                    >
                      support@joscity.com
                    </a>
                  </p>
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
                <Phone size={24} style={{ color: "var(--primary-color, #0d4a1f)", flexShrink: 0, marginTop: "4px" }} />
                <div>
                  <h3 style={{ margin: "0 0 4px 0" }}>Phone</h3>
                  <p style={{ margin: 0 }}>
                    <a
                      href="tel:+2348000000000"
                      style={{ color: "var(--primary-color, #0d4a1f)" }}
                    >
                      +234 800 000 0000
                    </a>
                  </p>
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
                <MapPin size={24} style={{ color: "var(--primary-color, #0d4a1f)", flexShrink: 0, marginTop: "4px" }} />
                <div>
                  <h3 style={{ margin: "0 0 4px 0" }}>Address</h3>
                  <p style={{ margin: 0 }}>
                    Jos, Plateau State, Nigeria
                  </p>
                </div>
              </div>
            </div>
          </section>

          <section className="legal-page__section">
            <h2>Business Hours</h2>
            <p>
              <strong>Monday - Friday:</strong> 9:00 AM - 6:00 PM<br />
              <strong>Saturday:</strong> 10:00 AM - 4:00 PM<br />
              <strong>Sunday:</strong> Closed
            </p>
          </section>

          <section className="legal-page__section">
            <CommonQuestions heading="Common questions" />
          </section>

          <section className="legal-page__section">
            <h2>Support</h2>
            <p>
              For technical support, account issues, or general inquiries, please
              email us at{" "}
              <a
                href="mailto:support@joscity.com"
                style={{ color: "var(--primary-color, #0d4a1f)" }}
              >
                support@joscity.com
              </a>
              . We typically respond within 24 hours.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default ContactPage;

