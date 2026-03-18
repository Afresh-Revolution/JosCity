import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Home, ArrowLeft } from "lucide-react";
import "../main.css";

const Accessibility: React.FC = () => {
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
          <h1 className="legal-page__title">Accessibility Statement</h1>
          <p className="legal-page__last-updated">
            Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </p>
        </div>

        <div className="legal-page__content">
          <section className="legal-page__section">
            <h2>1. Our Commitment</h2>
            <p>
              JosCity Smart Services is committed to ensuring digital
              accessibility for people with disabilities. We are continually
              improving the user experience for everyone and applying the
              relevant accessibility standards to achieve these goals.
            </p>
          </section>

          <section className="legal-page__section">
            <h2>2. Accessibility Standards</h2>
            <p>
              We aim to conform to the Web Content Accessibility Guidelines
              (WCAG) 2.1 Level AA standards. These guidelines explain how to make
              web content more accessible for people with disabilities.
            </p>
            <p>Our accessibility efforts include:</p>
            <ul>
              <li>Keyboard navigation support</li>
              <li>Screen reader compatibility</li>
              <li>Alternative text for images</li>
              <li>Proper heading structure</li>
              <li>Sufficient color contrast</li>
              <li>Resizable text</li>
            </ul>
          </section>

          <section className="legal-page__section">
            <h2>3. Accessibility Features</h2>

            <h3>3.1 Keyboard Navigation</h3>
            <p>
              All functionality of our platform can be accessed using only a
              keyboard. Use the Tab key to navigate through interactive elements,
              and Enter or Space to activate them.
            </p>

            <h3>3.2 Screen Reader Support</h3>
            <p>
              Our website is compatible with major screen reader software,
              including JAWS, NVDA, and VoiceOver. We use semantic HTML and ARIA
              labels to provide meaningful information to screen reader users.
            </p>

            <h3>3.3 Text Size and Contrast</h3>
            <p>
              You can adjust text size using your browser's zoom controls. We
              maintain sufficient color contrast ratios to ensure text is
              readable for users with visual impairments.
            </p>

            <h3>3.4 Alternative Formats</h3>
            <p>
              We provide alternative formats for important documents and
              information when requested. Contact us if you need materials in a
              different format.
            </p>
          </section>

          <section className="legal-page__section">
            <h2>4. Known Issues</h2>
            <p>
              We are aware that some parts of our website may not be fully
              accessible. We are working to address these issues and improve our
              overall accessibility. Known areas we are improving include:
            </p>
            <ul>
              <li>Enhanced form error messaging</li>
              <li>Improved focus indicators</li>
              <li>Better mobile accessibility</li>
              <li>Video captions and transcripts</li>
            </ul>
          </section>

          <section className="legal-page__section">
            <h2>5. Third-Party Content</h2>
            <p>
              Some content on our website is provided by third parties. While we
              strive to ensure all content is accessible, we cannot guarantee the
              accessibility of third-party content.
            </p>
          </section>

          <section className="legal-page__section">
            <h2>6. Assistive Technologies</h2>
            <p>
              Our platform is tested with the following assistive technologies:
            </p>
            <ul>
              <li>Screen readers: JAWS, NVDA, VoiceOver</li>
              <li>Screen magnifiers: ZoomText, Windows Magnifier</li>
              <li>Voice recognition software: Dragon NaturallySpeaking</li>
              <li>Keyboard-only navigation</li>
            </ul>
          </section>

          <section className="legal-page__section">
            <h2>7. Feedback and Contact</h2>
            <p>
              We welcome feedback on the accessibility of our website. If you
              encounter accessibility barriers, please contact us:
            </p>
            <p>
              <strong>Email:</strong> support@afresh.academy
              <br />
              <strong>Phone:</strong> +234 7067621916
              <br />
              <strong>Address:</strong> Jos, Plateau State, Nigeria
              <br />
              <strong>Response Time:</strong> We aim to respond within 5 business days
            </p>
          </section>

          <section className="legal-page__section">
            <h2>8. Ongoing Efforts</h2>
            <p>
              Accessibility is an ongoing effort. We regularly review our website
              and conduct accessibility audits to identify and fix issues. We
              also provide training to our team to ensure accessibility is
              considered in all aspects of our work.
            </p>
          </section>

          <section className="legal-page__section">
            <h2>9. File a Complaint</h2>
            <p>
              If you are not satisfied with our response, you can file a
              complaint with the relevant accessibility authority in Nigeria.
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

export default Accessibility;

