import React, { FormEvent, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Home } from "lucide-react";
import { apiUrl } from "../api/config";
import "../main.css";

const DeleteAccount: React.FC = () => {
  const navigate = useNavigate();
  const [accountType, setAccountType] = useState<"personal" | "business">(
    "personal"
  );
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (busy || !confirmed) return;
    setError(null);
    setBusy(true);
    const controller = new AbortController();
    const timer = window.setTimeout(() => controller.abort(), 20000);
    try {
      const response = await fetch(apiUrl("/account/delete-web"), {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email.trim(),
          password,
          account_type: accountType,
        }),
        signal: controller.signal,
      });
      const payload = (await response.json().catch(() => ({}))) as {
        success?: boolean;
        message?: string;
      };
      if (!response.ok || !payload.success) {
        setError(
          payload.message ||
            "Could not delete this account. Check the details and try again."
        );
        return;
      }
      setDone(true);
      setPassword("");
    } catch {
      setError(
        "Could not reach JOSCITY. Try again or email support@joscity.com."
      );
    } finally {
      window.clearTimeout(timer);
      setBusy(false);
    }
  };

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
          <h1 className="legal-page__title">Delete your JOSCITY account</h1>
          <p className="legal-page__last-updated">
            Permanent deletion. Sign-in is removed immediately.
          </p>
        </div>

        <div className="legal-page__content">
          <section className="legal-page__section">
            <h2>What is deleted</h2>
            <p>
              Confirming deletion removes your profile, posts, messages, login
              credentials, and other personal content from JOSCITY. You will not
              be able to sign in again. Support cannot restore the account.
            </p>
            <p>
              We keep a limited security record (account ID, hashed identifiers,
              and masked contact details) so fraud, abuse, and legal requests
              can still be investigated. That record is not used as a live
              profile. See the{" "}
              <a href="/privacy-policy">Privacy Policy</a>.
            </p>
          </section>

          <section className="legal-page__section">
            <h2>In the app</h2>
            <p>
              Open JOSCITY → Profile (personal) or Manage (business) → Account
              settings → Delete account. Enter your password to confirm.
            </p>
            <p>Deactivate only pauses sign-in. It is not account deletion.</p>
          </section>

          <section className="legal-page__section">
            <h2>Delete from this page</h2>
            {done ? (
              <p>
                Your account has been deleted. You can close this page. If you
                still see emails from us, write to{" "}
                <a href="mailto:support@joscity.com">support@joscity.com</a>.
              </p>
            ) : (
              <form className="legal-page__form" onSubmit={onSubmit}>
                <label className="legal-page__field">
                  Account type
                  <select
                    value={accountType}
                    onChange={(event) =>
                      setAccountType(
                        event.target.value === "business"
                          ? "business"
                          : "personal"
                      )
                    }
                  >
                    <option value="personal">Personal</option>
                    <option value="business">Business</option>
                  </select>
                </label>
                <label className="legal-page__field">
                  Email
                  <input
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                  />
                </label>
                <label className="legal-page__field">
                  Password
                  <input
                    type="password"
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                  />
                </label>
                <label className="legal-page__check">
                  <input
                    type="checkbox"
                    checked={confirmed}
                    onChange={(event) => setConfirmed(event.target.checked)}
                  />
                  I understand this cannot be undone.
                </label>
                {error ? (
                  <p className="legal-page__form-error" role="alert">
                    {error}
                  </p>
                ) : null}
                <button
                  type="submit"
                  className="legal-page__delete-button"
                  disabled={busy || !confirmed}
                >
                  {busy ? "Deleting…" : "Permanently delete account"}
                </button>
              </form>
            )}
            <p>
              If you cannot use this form, email{" "}
              <a href="mailto:support@joscity.com?subject=Delete%20JOSCITY%20account">
                support@joscity.com
              </a>{" "}
              from the address on the account. Include “Delete account” in the
              subject.
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

export default DeleteAccount;
