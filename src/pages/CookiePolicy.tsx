import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Home, ArrowLeft } from "lucide-react";
import "../main.css";

const CookiePolicy: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="legal-page">
      <div className="legal-page__container">
        <div className="legal-page__header">
          <button
            className="legal-page__back-button"
            onClick={() => navigate("/")}
          >
            <ArrowLeft size={20} />
            Back Home
          </button>
          <h1 className="legal-page__title">Cookie Policy</h1>
          <p className="legal-page__last-updated">
            Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </p>
        </div>

        <div className="legal-page__content">
          <section className="legal-page__section">
            <h2>1. What Are Cookies?</h2>
            <p>
              Cookies are small text files that are placed on your device when
              you visit a website. They are widely used to make websites work
              more efficiently and to provide information to website owners.
            </p>
          </section>

          <section className="legal-page__section">
            <h2>2. How We Use Cookies</h2>
            <p>
              JosCity Smart Services uses cookies to enhance your experience and
              improve our services. We use cookies for the following purposes:
            </p>

            <h3>2.1 Essential Cookies</h3>
            <p>
              These cookies are necessary for the website to function properly.
              They enable core functionality such as security, network management,
              and accessibility.
            </p>

            <h3>2.2 Functional Cookies</h3>
            <p>
              These cookies allow the website to remember choices you make (such
              as your username, language, or region) and provide enhanced,
              personalized features.
            </p>

            <h3>2.3 Analytics Cookies</h3>
            <p>
              These cookies help us understand how visitors interact with our
              website by collecting and reporting information anonymously. This
              helps us improve our services.
            </p>

            <h3>2.4 Performance Cookies</h3>
            <p>
              These cookies collect information about how you use our website,
              such as which pages you visit most often. This data helps us
              optimize the website's performance.
            </p>
          </section>

          <section className="legal-page__section">
            <h2>3. Types of Cookies We Use</h2>
            <table className="legal-page__table">
              <thead>
                <tr>
                  <th>Cookie Name</th>
                  <th>Purpose</th>
                  <th>Duration</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>session_id</td>
                  <td>Maintains your session while using the platform</td>
                  <td>Session</td>
                </tr>
                <tr>
                  <td>auth_token</td>
                  <td>Stores authentication information</td>
                  <td>30 days</td>
                </tr>
                <tr>
                  <td>preferences</td>
                  <td>Remembers your language and display preferences</td>
                  <td>1 year</td>
                </tr>
                <tr>
                  <td>analytics</td>
                  <td>Collects anonymous usage statistics</td>
                  <td>2 years</td>
                </tr>
              </tbody>
            </table>
          </section>

          <section className="legal-page__section">
            <h2>4. Third-Party Cookies</h2>
            <p>
              Some cookies are placed by third-party services that appear on our
              pages. We use third-party services for:
            </p>
            <ul>
              <li>Payment processing</li>
              <li>Analytics and performance monitoring</li>
              <li>Security and fraud prevention</li>
            </ul>
            <p>
              These third parties may use cookies to collect information about
              your online activities across different websites.
            </p>
          </section>

          <section className="legal-page__section">
            <h2>5. Managing Cookies</h2>
            <p>
              You can control and manage cookies in various ways. Please keep in
              mind that removing or blocking cookies can impact your user
              experience.
            </p>

            <h3>5.1 Browser Settings</h3>
            <p>
              Most browsers allow you to control cookies through their settings.
              You can set your browser to refuse cookies or to alert you when
              cookies are being sent.
            </p>

            <h3>5.2 Cookie Preferences</h3>
            <p>
              You can manage your cookie preferences through our cookie consent
              banner when you first visit our website.
            </p>
          </section>

          <section className="legal-page__section">
            <h2>6. Impact of Disabling Cookies</h2>
            <p>
              If you disable cookies, some features of our platform may not
              function properly, including:
            </p>
            <ul>
              <li>Staying logged into your account</li>
              <li>Remembering your preferences</li>
              <li>Completing transactions</li>
              <li>Accessing certain personalized features</li>
            </ul>
          </section>

          <section className="legal-page__section">
            <h2>7. Updates to This Policy</h2>
            <p>
              We may update this Cookie Policy from time to time. We will notify
              you of any changes by posting the new policy on this page and
              updating the "Last updated" date.
            </p>
          </section>

          <section className="legal-page__section">
            <h2>8. Contact Us</h2>
            <p>
              If you have questions about our use of cookies, please contact us at:
            </p>
            <p>
              <strong>Email:</strong> support@afresh.academy
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

export default CookiePolicy;

