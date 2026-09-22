import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Check, Copy, Gift } from "lucide-react";
import { apiUrl } from "../api/config";
import "./Referrals.scss";

type Info = {
  share_url: string;
  referral_code: string;
  earning_copy: string;
  code_active: boolean;
  posts_required_to_share: number;
  stats: { referrals: number; approved: number; earnings_naira: number };
  referrals: { user_id: number; name: string; status: string; earning_naira: number }[];
};

export default function Referrals() {
  const [data, setData] = useState<Info | null>(null);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token") || localStorage.getItem("authToken");
    if (!token) {
      setError("Sign in to see your referrals.");
      return;
    }
    fetch(apiUrl("/account/referrals"), {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async (r) => {
        const body = await r.json();
        if (!r.ok || !body.success) throw new Error(body.message || "Could not load referrals");
        setData(body.data);
      })
      .catch((e) => setError(e.message));
  }, []);

  const copyLink = async () => {
    if (!data?.share_url) return;
    try {
      await navigator.clipboard.writeText(data.share_url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setError("Please select and copy the link above.");
    }
  };

  return (
    <main className="referrals-page">
      <div className="referrals-page__inner">
        <Link className="referrals-page__back" to="/newsfeed">
          <ArrowLeft size={16} aria-hidden="true" />
          Back to feed
        </Link>

        <header className="referrals-page__hero">
          <span className="referrals-page__hero-icon" aria-hidden="true">
            <Gift size={26} />
          </span>
          <div className="referrals-page__hero-copy">
            <h1>Referrals &amp; rewards</h1>
            <p>
              {data?.earning_copy ||
                "Invite friends to JosCity and earn when they make their first post."}
            </p>
          </div>
        </header>

        {error && (
          <p className="referrals-page__alert" role="alert">
            {error} <Link to="/signin">Sign in</Link>
          </p>
        )}

        {!data && !error && (
          <p className="referrals-page__status" role="status">
            Loading referrals...
          </p>
        )}

        {data && (
          <>
            <section className="referrals-page__card" aria-label="Referral stats">
              <div className="referrals-page__stats">
                <div className="referrals-page__stat">
                  <strong>{Number(data.stats.referrals).toLocaleString()}</strong>
                  <span>Referrals</span>
                </div>
                <div className="referrals-page__stat">
                  <strong>{Number(data.stats.approved).toLocaleString()}</strong>
                  <span>Approved</span>
                </div>
                <div className="referrals-page__stat">
                  <strong>
                    ₦{Number(data.stats.earnings_naira).toLocaleString("en-NG")}
                  </strong>
                  <span>Earned</span>
                </div>
              </div>
            </section>

            <section className="referrals-page__card" aria-labelledby="referrals-share-title">
              <h2 id="referrals-share-title" className="referrals-page__section-title">
                Your invite link
              </h2>
              <div className="referrals-page__code-row">
                <span className="referrals-page__code-label">Your code</span>
                <code className="referrals-page__code">{data.referral_code}</code>
              </div>
              {data.code_active ? (
                <div className="referrals-page__share">
                  <input
                    className="referrals-page__share-input"
                    aria-label="Referral link"
                    readOnly
                    value={data.share_url}
                  />
                  <button
                    type="button"
                    className={`referrals-page__copy${copied ? " referrals-page__copy--done" : ""}`}
                    onClick={() => void copyLink()}
                  >
                    {copied ? <Check size={16} aria-hidden="true" /> : <Copy size={16} aria-hidden="true" />}
                    {copied ? "Copied" : "Copy link"}
                  </button>
                </div>
              ) : (
                <p className="referrals-page__locked">
                  Make {data.posts_required_to_share}{" "}
                  {data.posts_required_to_share === 1 ? "post" : "posts"} to activate your
                  referral link.
                </p>
              )}
            </section>

            <section className="referrals-page__card" aria-labelledby="referrals-latest-title">
              <h2 id="referrals-latest-title" className="referrals-page__section-title">
                Latest referrals
              </h2>
              {!data.referrals.length ? (
                <p className="referrals-page__empty">No referrals yet. Share your link to get started.</p>
              ) : (
                <ul className="referrals-page__list">
                  {data.referrals.map((r) => (
                    <li key={r.user_id} className="referrals-page__row">
                      <span className="referrals-page__row-name">{r.name}</span>
                      <span className="referrals-page__row-meta">
                        <span className="referrals-page__badge">{r.status}</span>
                        <span className="referrals-page__earn">
                          ₦{Number(r.earning_naira).toLocaleString("en-NG")}
                        </span>
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </>
        )}
      </div>
    </main>
  );
}
