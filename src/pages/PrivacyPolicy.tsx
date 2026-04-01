import React, { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Home, ArrowLeft } from "lucide-react";
import "../main.css";

const PrivacyPolicy: React.FC = () => {
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
          <h1 className="legal-page__title">Privacy Policy</h1>
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
            <h2>1. Introduction</h2>
            <p>
              JosCity Smart Services is committed to
              protecting your privacy. This Privacy Policy explains how we
              collect, use, disclose, and safeguard your information when you
              use our platform and services.
            </p>
          </section>

          <section className="legal-page__section">
            <h2>2. Information We Collect</h2>
            <h3>2.1 Personal Information</h3>
            <p>We may collect the following personal information:</p>
            <ul>
              <li>Name, email address, and contact information</li>
              <li>National Identification Number (NIN)</li>
              <li>Phone number and address</li>
              <li>
                Payment information (processed securely through third-party
                providers)
              </li>
              <li>Account credentials and preferences</li>
            </ul>

            <h3>2.2 Usage Data</h3>
            <p>
              We automatically collect information about how you interact with
              our platform, including:
            </p>
            <ul>
              <li>Device information and IP address</li>
              <li>Browser type and version</li>
              <li>Pages visited and time spent on pages</li>
              <li>Referring website addresses</li>
            </ul>
          </section>

          <section className="legal-page__section">
            <h2>3. How We Use Your Information</h2>
            <p>We use the collected information for the following purposes:</p>
            <ul>
              <li>To provide and maintain our services</li>
              <li>To process transactions and bill payments</li>
              <li>To communicate with you about your account and services</li>
              <li>To improve our platform and user experience</li>
              <li>To comply with legal obligations</li>
              <li>To prevent fraud and ensure security</li>
            </ul>
          </section>

          <section className="legal-page__section">
            <h2>4. Data Sharing and Disclosure</h2>
            <p>
              We do not sell your personal information. We may share your
              information:
            </p>
            <ul>
              <li>
                With government agencies for official services and compliance
              </li>
              <li>
                With trusted service providers who assist in our operations
              </li>
              <li>When required by law or legal process</li>
              <li>To protect our rights, property, or safety</li>
            </ul>
          </section>

          <section className="legal-page__section">
            <h2>5. Data Security</h2>
            <p>
              We implement industry-standard security measures to protect your
              personal information, including encryption, secure servers, and
              access controls. However, no method of transmission over the
              internet is 100% secure.
            </p>
          </section>

          <section className="legal-page__section">
            <h2>6. Your Rights</h2>
            <p>You have the right to:</p>
            <ul>
              <li>Access your personal information</li>
              <li>Correct inaccurate information</li>
              <li>Request deletion of your information</li>
              <li>Object to processing of your information</li>
              <li>Request data portability</li>
            </ul>
          </section>

          <section className="legal-page__section">
            <h2>7. Cookies and Tracking</h2>
            <p>
              We use cookies and similar tracking technologies to enhance your
              experience. You can control cookies through your browser settings.
              For more information, please see our Cookie Policy.
            </p>
          </section>

          <section className="legal-page__section">
            <h2>8. Contact Us</h2>
            <p>
              If you have questions about this Privacy Policy, please contact us
              at:
            </p>
            <p>
              <strong>Email:</strong> support@joscity.com
              <br />
              <strong>Phone:</strong> +234 7067621916
              <br />
              <strong>Address:</strong> Jos, Plateau State, Nigeria
            </p>
          </section>
        </div>

        <div className="legal-page__footer">
          <button
            className="legal-page__home-button"
            onClick={() => navigate("/")}
          >
            <Home size={20} />
            Return to Home
          </button>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
