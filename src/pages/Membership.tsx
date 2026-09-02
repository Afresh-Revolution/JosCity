import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { BadgeCheck, Loader2, Wallet } from "lucide-react";
import PageBackButton from "../components/PageBackButton";
import ConfirmationModal from "../components/ConfirmationModal";
import WalletSheet from "../components/WalletSheet";
import ActionBadge from "../components/ActionBadge";
import welcomeVideo from "../vid/welcome-vid.mp4";
import {
  getAccountMembership,
  getPublicMembershipCatalog,
  subscribeMembership,
  cancelMembership,
  resumeMembership,
  type AccountMembership,
  type CurrentMembership,
  type MembershipPackage,
} from "../services/membershipApi";
import { walletApi, type WalletSnapshot } from "../services/walletApi";
import { isAuthenticated } from "../utils/userUtils";
import MembershipCountdown, {
  toCalendarDate,
} from "../components/MembershipCountdown";
import "../scss/_membership.scss";

function formatNaira(value?: number) {
  return `₦${Number(value || 0).toLocaleString("en-NG")}`;
}

function featuresOf(pkg: MembershipPackage): string[] {
  if (Array.isArray(pkg.features) && pkg.features.length) {
    return pkg.features.filter(Boolean);
  }
  return String(pkg.description || "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

const MembershipPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const loggedIn = isAuthenticated();
  const [loading, setLoading] = useState(true);
  const [subscribingId, setSubscribingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [account, setAccount] = useState<AccountMembership | null>(null);
  const [publicPackages, setPublicPackages] = useState<MembershipPackage[]>([]);
  const [wallet, setWallet] = useState<WalletSnapshot | null>(null);
  const [pendingPackage, setPendingPackage] = useState<MembershipPackage | null>(null);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [resuming, setResuming] = useState(false);
  const [showWallet, setShowWallet] = useState(false);
  const [fundNeeded, setFundNeeded] = useState(0);

  const returningFromCheckout = Boolean(
    searchParams.get("reference") || searchParams.get("trxref")
  );

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (loggedIn) {
        const [membership, walletData] = await Promise.all([
          getAccountMembership(),
          walletApi.getWallet().catch(() => null),
        ]);
        setAccount(membership);
        setWallet(walletData);
      } else {
        const catalog = await getPublicMembershipCatalog();
        setPublicPackages(
          catalog.plans.map((plan, index) => ({
            id: plan.id,
            title: plan.title,
            amount: plan.amount,
            description: plan.description,
            josride_discount_percent: plan.josride_discount_percent,
            features: plan.features,
            sort_order: index,
          }))
        );
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not load membership."
      );
    } finally {
      setLoading(false);
    }
  }, [loggedIn]);

  useEffect(() => {
    void load();
  }, [load]);

  const packages = loggedIn ? account?.packages || [] : publicPackages;
  const current: CurrentMembership = account?.current || null;
  const balance = Number(wallet?.balance || 0);

  const currentCopy = useMemo(() => {
    if (!loggedIn) return null;
    if (!current) return { tone: "idle", text: "No active plan" };
    const expiresLabel = toCalendarDate(current.expires_at) || current.expires_at || "—";
    if (current.status === "EXPIRED") {
      return {
        tone: "expired",
        text: `Expired on ${expiresLabel}. Buy a plan to restore your JosRide discount.`,
      };
    }
    if (current.cancelled) {
      return {
        tone: "idle",
        text: `${current.title} is cancelled. Your paid JosRide discount stays until ${expiresLabel}. Undo to resume reminders on this same countdown.`,
      };
    }
    return {
      tone: "active",
      text: `${current.title} is active. ${current.josride_discount_percent}% off JosRide rides. Renews / expires ${expiresLabel}.`,
    };
  }, [current, loggedIn]);

  useEffect(() => {
    if (!error && !success) return;
    const timer = window.setTimeout(() => {
      setError(null);
      setSuccess(null);
    }, 5200);
    return () => window.clearTimeout(timer);
  }, [error, success]);

  const beginSubscribe = (pkg: MembershipPackage) => {
    setError(null);
    setSuccess(null);
    if (!loggedIn) {
      navigate("/signin", { state: { redirectTo: "/membership" } });
      return;
    }
    if (balance < pkg.amount) {
      setFundNeeded(pkg.amount);
      setShowWallet(true);
      setError("Insufficient wallet balance. Fund your wallet and try again.");
      return;
    }
    setPendingPackage(pkg);
  };

  const confirmSubscribe = async () => {
    if (!pendingPackage) return;
    setSubscribingId(pendingPackage.id);
    setError(null);
    try {
      const next = await subscribeMembership(pendingPackage.id);
      setAccount((currentAccount) =>
        currentAccount ? { ...currentAccount, current: next } : currentAccount
      );
      const walletData = await walletApi.getWallet().catch(() => null);
      if (walletData) setWallet(walletData);
      setSuccess(
        `Your ${next?.title || pendingPackage.title} plan is active. For 30 days, JosRide will automatically take ${next?.josride_discount_percent ?? pendingPackage.josride_discount_percent}% off the original price of each ride. You do not need to do anything in the JosRide app.`
      );
      setShowWallet(false);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Could not update membership";
      if (message.toLowerCase().includes("insufficient")) {
        setFundNeeded(pendingPackage.amount);
        setShowWallet(true);
      }
      setError(message);
    } finally {
      setSubscribingId(null);
      setPendingPackage(null);
    }
  };

  const confirmCancelSubscription = async () => {
    setCancelling(true);
    setError(null);
    try {
      const next = await cancelMembership();
      setAccount((currentAccount) =>
        currentAccount ? { ...currentAccount, current: next } : currentAccount
      );
      setSuccess(
        "Subscription cancelled. Your paid benefits stay until the expiry date, and you will not get renewal reminders."
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not cancel membership");
    } finally {
      setCancelling(false);
      setConfirmCancel(false);
    }
  };

  const undoCancellation = async () => {
    setResuming(true);
    setError(null);
    try {
      const next = await resumeMembership();
      setAccount((currentAccount) =>
        currentAccount ? { ...currentAccount, current: next } : currentAccount
      );
      setSuccess(
        "Subscription resumed. Your countdown continues from here, and renewal reminders are back on."
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not resume membership");
    } finally {
      setResuming(false);
    }
  };

  return (
    <div className="membership-page">
      {error ? (
        <ActionBadge
          variant="error"
          message={error}
          onDismiss={() => setError(null)}
        />
      ) : success ? (
        <ActionBadge
          variant="success"
          message={success}
          onDismiss={() => setSuccess(null)}
        />
      ) : null}
      <div className="membership-background" aria-hidden="true">
        <video autoPlay loop muted playsInline className="membership-video">
          <source src={welcomeVideo} type="video/mp4" />
        </video>
      </div>
      <div className="membership-page__inner">
        <div className="membership-page__toolbar">
          <PageBackButton
            to="/"
            ariaLabel="Go back to landing page"
            className="membership-page__back"
          />
        </div>
        <header className="membership-page__header">
          <p className="membership-page__eyebrow">JosCity membership</p>
          <h1>Ride discounts for 30 days</h1>
          <p>
            Pay from your JosCity wallet. JosRide then takes the plan percent off
            the original fare automatically. The fee is not ride credit.
          </p>
        </header>

        {loading ? (
          <div className="membership-page__loading">
            <Loader2 className="spinner" size={20} />
            Loading plans...
          </div>
        ) : (
          <>
            {loggedIn && currentCopy ? (
              <div
                className={`membership-page__banner membership-page__banner--${currentCopy.tone}`}
              >
                <BadgeCheck size={18} />
                <span>{currentCopy.text}</span>
              </div>
            ) : null}

            {loggedIn ? (
              <div className="membership-page__wallet">
                <span>
                  <Wallet size={16} /> Wallet balance {formatNaira(balance)}
                </span>
                <button
                  type="button"
                  className="membership-page__fund"
                  onClick={() => {
                    setFundNeeded(0);
                    setShowWallet(true);
                  }}
                >
                  Fund wallet
                </button>
              </div>
            ) : null}

            <div className="membership-page__grid">
              {packages.map((pkg) => {
                const isCurrent =
                  current?.status === "ACTIVE" &&
                  String(current.package_id) === String(pkg.id);
                return (
                  <article
                    key={pkg.id}
                    className={`membership-card${isCurrent ? " membership-card--current" : ""}`}
                  >
                    <div className="membership-card__top">
                      <h2>{pkg.title || "Membership"}</h2>
                      {isCurrent ? (
                        <span className="membership-card__badge">
                          {current?.cancelled ? "Cancelled" : "Subscribed"}
                        </span>
                      ) : null}
                    </div>
                    <p className="membership-card__price">
                      {formatNaira(pkg.amount)}
                      <span> / 30 days</span>
                    </p>
                    <p className="membership-card__discount">
                      {pkg.josride_discount_percent}% off every JosRide trip
                    </p>
                    <ul>
                      {featuresOf(pkg).map((feature) => (
                        <li key={feature}>{feature}</li>
                      ))}
                    </ul>
                    <p className="membership-card__billing">
                      {account?.billing_copy || "Billed every 30 days · pause or cancel anytime"}
                    </p>
                    {isCurrent ? (
                      <MembershipCountdown
                        expiresAt={current?.expires_at}
                        cancelled={Boolean(current?.cancelled)}
                      />
                    ) : null}
                    <div className="membership-card__actions">
                      {isCurrent && current?.cancelled ? (
                        <button
                          type="button"
                          disabled={resuming || cancelling || Boolean(subscribingId)}
                          onClick={() => void undoCancellation()}
                        >
                          {resuming ? (
                            <>
                              <Loader2 size={16} className="spinner" /> Resuming...
                            </>
                          ) : (
                            "Undo cancellation"
                          )}
                        </button>
                      ) : (
                        <button
                          type="button"
                          disabled={Boolean(subscribingId) || cancelling || resuming}
                          onClick={() => beginSubscribe(pkg)}
                        >
                          {subscribingId === pkg.id ? (
                            <>
                              <Loader2 size={16} className="spinner" /> Paying...
                            </>
                          ) : isCurrent ? (
                            "Renew now"
                          ) : loggedIn ? (
                            "Pay from wallet"
                          ) : (
                            "Sign in to subscribe"
                          )}
                        </button>
                      )}
                      {isCurrent && !current?.cancelled ? (
                        <button
                          type="button"
                          className="membership-card__cancel"
                          disabled={cancelling || resuming || Boolean(subscribingId)}
                          onClick={() => setConfirmCancel(true)}
                        >
                          {cancelling ? (
                            <>
                              <Loader2 size={16} className="spinner" /> Cancelling...
                            </>
                          ) : (
                            "Cancel subscription"
                          )}
                        </button>
                      ) : null}
                    </div>
                  </article>
                );
              })}
            </div>

            {!packages.length ? (
              <p className="membership-page__empty">
                No membership packages are available yet.
              </p>
            ) : null}

            {!loggedIn ? (
              <p className="membership-page__signin">
                Already a member? <Link to="/signin" state={{ redirectTo: "/membership" }}>Sign in</Link>
              </p>
            ) : null}
          </>
        )}
      </div>

      {loggedIn ? (
        <WalletSheet
          open={showWallet || returningFromCheckout}
          needed={fundNeeded}
          wallet={wallet}
          onClose={() => {
            setShowWallet(false);
            setFundNeeded(0);
          }}
          onUpdated={(next) => {
            setWallet(next);
            if (Number(next.balance || 0) >= fundNeeded) {
              setError(null);
            }
          }}
        />
      ) : null}

      <ConfirmationModal
        isOpen={Boolean(pendingPackage)}
        onClose={() => setPendingPackage(null)}
        onConfirm={() => void confirmSubscribe()}
        title={
          current?.status === "ACTIVE" &&
          pendingPackage &&
          String(current.package_id) === String(pendingPackage.id)
            ? current.cancelled
              ? "Subscribe again?"
              : "Renew membership?"
            : current?.status === "ACTIVE"
              ? "Replace current plan?"
              : "Confirm membership"
        }
        message={
          current?.status === "ACTIVE"
            ? "This starts a new 30-day period from today and replaces your current plan."
            : `Pay ${formatNaira(pendingPackage?.amount)} from your wallet for ${pendingPackage?.title || "this plan"}?`
        }
        confirmText="Pay from wallet"
        cancelText="Cancel"
        type="warning"
        isLoading={Boolean(subscribingId)}
      />
      <ConfirmationModal
        isOpen={confirmCancel}
        onClose={() => setConfirmCancel(false)}
        onConfirm={() => void confirmCancelSubscription()}
        title="Cancel subscription?"
        message="You keep your paid benefits until the expiry date. You will not be reminded to renew, and this payment is not refunded."
        confirmText="Cancel subscription"
        cancelText="Keep plan"
        type="warning"
        isLoading={cancelling}
      />
    </div>
  );
};

export default MembershipPage;
