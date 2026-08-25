import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Home, ArrowLeft } from "lucide-react";
import "../main.css";

const CommunityGuidelines: React.FC = () => {
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
          <h1 className="legal-page__title">Community Guidelines</h1>
          <p className="legal-page__last-updated">
            Last updated:{" "}
            {new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" })}
          </p>
        </div>

        <div className="legal-page__content">
          <section className="legal-page__section">
            <h2>1. Be a good neighbour</h2>
            <p>
              JOSCITY is built for people in Jos and around Plateau. Treat other
              members the way you would want to be treated in person: with
              respect, honesty, and patience.
            </p>
          </section>

          <section className="legal-page__section">
            <h2>2. Keep it real</h2>
            <p>You agree to:</p>
            <ul>
              <li>Use your own identity and accurate account details</li>
              <li>Post content you have the right to share</li>
              <li>Avoid impersonation, fake accounts, and misleading claims</li>
            </ul>
          </section>

          <section className="legal-page__section">
            <h2>3. What is not allowed</h2>
            <p>Do not use JOSCITY to:</p>
            <ul>
              <li>Harass, threaten, or bully anyone</li>
              <li>Share hate speech, discrimination, or violent content</li>
              <li>Post spam, scams, or fraudulent listings</li>
              <li>Share sexual content involving minors, or any illegal material</li>
              <li>Collect personal data about other members without consent</li>
              <li>Interfere with the platform or try to bypass security</li>
            </ul>
          </section>

          <section className="legal-page__section">
            <h2>4. Posts, messages, and marketplace</h2>
            <p>
              Public posts should be suitable for a mixed community feed.
              Private messages stay private — do not use them to harass others.
              Marketplace listings must describe goods and services honestly.
            </p>
          </section>

          <section className="legal-page__section">
            <h2>5. Reporting and enforcement</h2>
            <p>
              If you see something that breaks these guidelines, report it from
              the app or email support@joscity.com. We may remove content, warn
              a member, deactivate an account, or delete an account when these
              rules are broken.
            </p>
          </section>

          <section className="legal-page__section">
            <h2>6. Contact</h2>
            <p>
              Questions about these guidelines: <strong>support@joscity.com</strong>
            </p>
          </section>
        </div>

        <div className="legal-page__footer">
          <button className="legal-page__home-button" onClick={() => navigate("/")}>
            <Home size={20} />
            Return to Home
          </button>
        </div>
      </div>
    </div>
  );
};

export default CommunityGuidelines;
