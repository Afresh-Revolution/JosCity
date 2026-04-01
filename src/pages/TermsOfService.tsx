import React, { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Home, ArrowLeft } from "lucide-react";
import "../main.css";

const TermsOfService: React.FC = () => {
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
          <h1 className="legal-page__title">Terms of Service</h1>
          <p className="legal-page__last-updated">
            Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </p>
        </div>

        <div className="legal-page__content">
          <section className="legal-page__section">
            <h2>1. Acceptance of Terms</h2>
            <p>
              By accessing and using JosCity Smart Services ("the Platform"),
              you accept and agree to be bound by these Terms of Service. If you
              do not agree to these terms, please do not use our services.
            </p>
          </section>

          <section className="legal-page__section">
            <h2>2. Description of Services</h2>
            <p>
              JosCity Smart Services provides a digital platform for citizens to:
            </p>
            <ul>
              <li>Access municipal services and information</li>
              <li>Make bill payments and process transactions</li>
              <li>Apply for permits and licenses</li>
              <li>Register personal and business accounts</li>
              <li>Engage with community services and events</li>
            </ul>
          </section>

          <section className="legal-page__section">
            <h2>3. User Accounts</h2>
            <h3>3.1 Registration</h3>
            <p>
              To use certain features, you must register for an account. You
              agree to provide accurate, current, and complete information
              during registration.
            </p>

            <h3>3.2 Account Security</h3>
            <p>
              You are responsible for maintaining the confidentiality of your
              account credentials and for all activities that occur under your
              account.
            </p>

            <h3>3.3 Account Approval</h3>
            <p>
              All accounts are subject to review and approval. We reserve the
              right to reject or suspend accounts that violate these terms.
            </p>
          </section>

          <section className="legal-page__section">
            <h2>4. Acceptable Use</h2>
            <p>You agree not to:</p>
            <ul>
              <li>Use the platform for any illegal or unauthorized purpose</li>
              <li>Violate any laws or regulations</li>
              <li>Transmit viruses, malware, or harmful code</li>
              <li>Attempt to gain unauthorized access to our systems</li>
              <li>Interfere with or disrupt the platform</li>
              <li>Impersonate any person or entity</li>
              <li>Collect or store personal data about other users</li>
            </ul>
          </section>

          <section className="legal-page__section">
            <h2>5. Payments and Transactions</h2>
            <p>
              All payments are processed securely through third-party payment
              providers. You agree to provide valid payment information and
              authorize us to charge your payment method for services rendered.
            </p>
            <p>
              Refunds are subject to our refund policy and applicable
              government regulations.
            </p>
          </section>

          <section className="legal-page__section">
            <h2>6. Intellectual Property</h2>
            <p>
              The platform and its content, including logos, text, graphics, and
              software, are the property of JosCity Smart Services and are
              protected by intellectual property laws.
            </p>
          </section>

          <section className="legal-page__section">
            <h2>7. Limitation of Liability</h2>
            <p>
              To the maximum extent permitted by law, JosCity Smart Services
              shall not be liable for any indirect, incidental, special, or
              consequential damages arising from your use of the platform.
            </p>
          </section>

          <section className="legal-page__section">
            <h2>8. Modifications to Terms</h2>
            <p>
              We reserve the right to modify these terms at any time. We will
              notify users of significant changes. Continued use of the platform
              after changes constitutes acceptance of the new terms.
            </p>
          </section>

          <section className="legal-page__section">
            <h2>9. Termination</h2>
            <p>
              We may terminate or suspend your account immediately, without
              prior notice, for conduct that we believe violates these Terms of
              Service or is harmful to other users or our services.
            </p>
          </section>

          <section className="legal-page__section">
            <h2>10. Contact Information</h2>
            <p>
              For questions about these Terms of Service, please contact us at:
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

export default TermsOfService;

