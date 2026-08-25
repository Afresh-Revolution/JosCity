import React, { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Home } from "lucide-react";
import NavBar from "./NavBar";
import Footer from "./Footer";
import "../main.css";

const ChildSafety: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    window.scrollTo(0, 0);
    document.title = "Joscity Child Safety Standards";
    const description =
      "Joscity has zero tolerance for child sexual abuse and exploitation (CSAE) and child sexual abuse material (CSAM). Report concerns to child-safety@joscity.com.";
    let meta = document.querySelector('meta[name="description"]');
    if (!meta) {
      meta = document.createElement("meta");
      meta.setAttribute("name", "description");
      document.head.appendChild(meta);
    }
    meta.setAttribute("content", description);
  }, []);

  return (
    <>
      <NavBar />
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
            <h1 className="legal-page__title">Joscity Child Safety Standards</h1>
            <p className="legal-page__last-updated">Last updated: August 2026</p>
          </div>

          <div className="legal-page__content">
            <section className="legal-page__section">
              <p>
                Joscity has zero tolerance for child sexual abuse and exploitation
                (CSAE) and child sexual abuse material (CSAM).
              </p>
            </section>

            <section className="legal-page__section">
              <h2>Prohibited conduct</h2>
              <p>
                Users must not create, upload, share, request, promote, or
                distribute content that sexually exploits, abuses, or endangers
                children. Prohibited conduct includes grooming, sextortion, sexual
                trafficking, inappropriate sexual communication involving minors,
                and any visual depiction of a minor engaged in sexually explicit
                conduct.
              </p>
            </section>

            <section className="legal-page__section">
              <h2>How Joscity responds</h2>
              <p>
                Joscity reviews reports of suspected child exploitation and takes
                appropriate action. This may include removing content, restricting
                or permanently suspending accounts, preserving relevant
                information, and reporting confirmed CSAM to the National Center
                for Missing &amp; Exploited Children or the appropriate regional
                law-enforcement authority, as required by applicable law.
              </p>
            </section>

            <section className="legal-page__section">
              <h2>How to report</h2>
              <p>
                Users can report prohibited content or behaviour through Joscity’s
                in-app reporting tools or by emailing{" "}
                <a href="mailto:child-safety@joscity.com">
                  child-safety@joscity.com
                </a>
                .
              </p>
              <p>
                If a child is in immediate danger, contact local emergency
                services or the appropriate law-enforcement authority.
              </p>
            </section>

            <section className="legal-page__section">
              <h2>Child-safety contact</h2>
              <p>
                Child-safety contact:{" "}
                <a href="mailto:child-safety@joscity.com">
                  child-safety@joscity.com
                </a>
              </p>
              <p>
                Related policies:{" "}
                <Link to="/privacy-policy">Privacy Policy</Link>
                {", "}
                <Link to="/terms-of-service">Terms of Service</Link>
                {", and "}
                <Link to="/community-guidelines">Community Guidelines</Link>.
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
      <Footer />
    </>
  );
};

export default ChildSafety;
