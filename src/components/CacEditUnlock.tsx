import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Landmark, Lock, ShieldCheck, Unlock } from "lucide-react";
import { cacEditApi, type CacEditState } from "../services/cacEditApi";

function formatNaira(value?: number) {
  return `₦${Number(value || 0).toLocaleString("en-NG")}`;
}

type Props = {
  state: CacEditState | null;
  loading?: boolean;
  onUpdated: (next: CacEditState) => void;
};

const CacEditUnlock: React.FC<Props> = ({ state, loading, onUpdated }) => {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [busy, setBusy] = useState(false);
  const [step, setStep] = useState<"methods" | "manual">("methods");
  const [proof, setProof] = useState<File | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const funding = state?.funding;
  const amount = Number(state?.next_price || 0);
  const pending = state?.pending_request;
  const pendingReview = pending?.status === "pending_review";
  const paystackOn = Boolean(funding?.paystack?.enabled);
  const safehavenOn = Boolean(funding?.safehaven?.enabled);
  const manualOn = Boolean(funding?.manual?.enabled);
  const callbackUrl = `${window.location.origin}${window.location.pathname}`;

  const refresh = async () => {
    const next = await cacEditApi.getState();
    onUpdated(next);
    return next;
  };

  useEffect(() => {
    const reference = params.get("reference") || params.get("trxref");
    if (!reference) return;

    const method = cacEditApi.takePayMethod();
    setBusy(true);
    setError(null);

    const verify = async () => {
      try {
        if (method === "safehaven") {
          await cacEditApi.verifySafehaven(reference);
        } else {
          try {
            await cacEditApi.verifyPaystack(reference);
          } catch {
            await cacEditApi.verifySafehaven(reference);
          }
        }
        setMessage("Payment received. Admin will unlock one CAC edit after approval.");
        await refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not verify this payment.");
      } finally {
        setBusy(false);
        navigate({ pathname: window.location.pathname, search: "" }, { replace: true });
      }
    };

    void verify();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params]);

  const payPaystack = async () => {
    setBusy(true);
    setError(null);
    try {
      cacEditApi.rememberPayMethod("paystack");
      const checkout = await cacEditApi.startPaystack(callbackUrl);
      if (!checkout.authorization_url) {
        throw new Error("Paystack did not return a checkout URL");
      }
      window.location.href = checkout.authorization_url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Paystack is unavailable");
      setBusy(false);
    }
  };

  const paySafehaven = async () => {
    setBusy(true);
    setError(null);
    try {
      cacEditApi.rememberPayMethod("safehaven");
      const checkout = await cacEditApi.startSafehaven(callbackUrl);
      if (!checkout.authorization_url) {
        throw new Error("Safe Haven is not available");
      }
      window.location.href = checkout.authorization_url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Safe Haven is unavailable");
      setBusy(false);
    }
  };

  const submitManual = async () => {
    if (!proof) {
      setError("Upload a screenshot of the transfer.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await cacEditApi.submitManual(proof);
      setMessage("Transfer submitted. Admin will unlock one CAC edit after approval.");
      setProof(null);
      setStep("methods");
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not submit transfer");
    } finally {
      setBusy(false);
    }
  };

  const priceCopy = useMemo(() => formatNaira(amount), [amount]);

  if (loading && !state) {
    return (
      <div className="user-profile__cac-unlock">
        <p className="user-profile__cac-unlock-meta">Loading CAC edit options…</p>
      </div>
    );
  }

  if (!state) {
    return (
      <div className="user-profile__cac-unlock">
        <p className="user-profile__cac-unlock-meta">
          CAC unlock options could not be loaded. Refresh the page, then try again.
        </p>
      </div>
    );
  }

  if (state.can_edit) {
    return (
      <div className="user-profile__cac-unlock user-profile__cac-unlock--open">
        <div className="user-profile__cac-unlock-title">
          <Unlock size={18} />
          <span>CAC number is unlocked</span>
        </div>
        <p className="user-profile__cac-unlock-meta">
          {state.credits > 0
            ? `You have ${state.credits} paid unlock${state.credits === 1 ? "" : "s"} left. Save a new CAC number while this is open.`
            : "Your first CAC number is free. Extra changes cost ₦10,000, then double each time (₦20,000, ₦40,000…). Payment goes to admin, not your business wallet."}
        </p>
      </div>
    );
  }

  if (pendingReview) {
    return (
      <div className="user-profile__cac-unlock user-profile__cac-unlock--pending">
        <div className="user-profile__cac-unlock-title">
          <Lock size={18} />
          <span>Waiting for admin approval</span>
        </div>
        <p className="user-profile__cac-unlock-meta">
          {formatNaira(pending?.amount || amount)} was submitted. After approval you get one extra CAC edit. This does not credit your business wallet.
        </p>
      </div>
    );
  }

  return (
    <div className="user-profile__cac-unlock">
      <div className="user-profile__cac-unlock-title">
        <Lock size={18} />
        <span>Unlock another CAC edit</span>
      </div>
      <p className="user-profile__cac-unlock-meta">
        Extra CAC changes cost {priceCopy}. Pay with Paystack, Safe Haven, or a bank transfer. Money goes to the admin wallet, not your business wallet. Admin approval unlocks one edit; the next unlock doubles.
      </p>

      {error ? <p className="user-profile__cac-unlock-error">{error}</p> : null}
      {message ? <p className="user-profile__cac-unlock-ok">{message}</p> : null}

      {step === "methods" ? (
        <div className="user-profile__cac-unlock-actions">
          {paystackOn ? (
            <button
              type="button"
              className="user-profile__cac-unlock-btn user-profile__cac-unlock-btn--primary"
              onClick={() => void payPaystack()}
              disabled={busy}
            >
              <ShieldCheck size={16} />
              Pay with Paystack · {priceCopy}
            </button>
          ) : null}
          {safehavenOn ? (
            <button
              type="button"
              className="user-profile__cac-unlock-btn"
              onClick={() => void paySafehaven()}
              disabled={busy}
            >
              Pay with Safe Haven · {priceCopy}
            </button>
          ) : null}
          {manualOn ? (
            <button
              type="button"
              className="user-profile__cac-unlock-btn"
              onClick={() => setStep("manual")}
              disabled={busy}
            >
              <Landmark size={16} />
              Bank transfer · {priceCopy}
            </button>
          ) : null}
          {!paystackOn && !safehavenOn && !manualOn ? (
            <p className="user-profile__cac-unlock-meta">Payments are not available right now.</p>
          ) : null}
        </div>
      ) : (
        <div className="user-profile__cac-unlock-manual">
          <p className="user-profile__cac-unlock-meta">
            Transfer {priceCopy} to the JOSCITY account, then upload your receipt.
          </p>
          <div className="user-profile__cac-unlock-bank">
            <div>{funding?.manual?.bank_name}</div>
            <div>{funding?.manual?.account_name}</div>
            <strong>{funding?.manual?.account_number}</strong>
          </div>
          <input
            type="file"
            accept="image/*"
            onChange={(event) => setProof(event.target.files?.[0] || null)}
          />
          <div className="user-profile__cac-unlock-actions">
            <button
              type="button"
              className="user-profile__cac-unlock-btn user-profile__cac-unlock-btn--primary"
              onClick={() => void submitManual()}
              disabled={busy}
            >
              Submit screenshot for review
            </button>
            <button
              type="button"
              className="user-profile__cac-unlock-btn"
              onClick={() => setStep("methods")}
              disabled={busy}
            >
              Back
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CacEditUnlock;
