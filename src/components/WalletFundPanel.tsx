import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Landmark, Wallet } from "lucide-react";
import {
  walletApi,
  type WalletFundingOptions,
  type WalletSnapshot,
} from "../services/walletApi";

function formatNaira(value?: number) {
  return `₦${Number(value || 0).toLocaleString("en-NG")}`;
}

type Props = {
  needed: number;
  wallet: WalletSnapshot | null;
  onFunded: (next: WalletSnapshot) => void;
};

const WalletFundPanel: React.FC<Props> = ({ needed, wallet, onFunded }) => {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [busy, setBusy] = useState(false);
  const [amount, setAmount] = useState(String(Math.max(needed, 100)));
  const [proof, setProof] = useState<File | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const funding: WalletFundingOptions | undefined = wallet?.funding;
  const paystackOn = Boolean(funding?.paystack?.enabled);
  const safehavenOn = Boolean(funding?.safehaven?.enabled);
  const manualOn = Boolean(funding?.manual?.enabled);
  const callbackUrl = `${window.location.origin}/membership`;
  const fundAmount = Math.max(Number(amount) || 0, funding?.min_amount || 100);

  useEffect(() => {
    setAmount(String(Math.max(needed, funding?.min_amount || 100)));
  }, [needed, funding?.min_amount]);

  const refresh = async () => {
    const next = await walletApi.getWallet();
    onFunded(next);
    return next;
  };

  useEffect(() => {
    const reference = params.get("reference") || params.get("trxref");
    if (!reference) return;
    const method = walletApi.takePayMethod();
    setBusy(true);
    setError(null);
    const verify = async () => {
      try {
        if (method === "safehaven") {
          await walletApi.verifySafehaven(reference);
        } else {
          try {
            await walletApi.verifyPaystack(reference);
          } catch {
            await walletApi.verifySafehaven(reference);
          }
        }
        setMessage("Wallet funded. You can subscribe now.");
        await refresh();
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Could not verify this payment."
        );
      } finally {
        setBusy(false);
        navigate({ pathname: "/membership", search: "" }, { replace: true });
      }
    };
    void verify();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params]);

  const startPaystack = async () => {
    setBusy(true);
    setError(null);
    try {
      walletApi.rememberPayMethod("paystack");
      const checkout = await walletApi.startPaystack(fundAmount, callbackUrl);
      if (!checkout.authorization_url) {
        throw new Error("Paystack did not return a checkout URL");
      }
      window.location.href = checkout.authorization_url;
    } catch (err) {
      setBusy(false);
      setError(err instanceof Error ? err.message : "Could not start Paystack.");
    }
  };

  const startSafehaven = async () => {
    setBusy(true);
    setError(null);
    try {
      walletApi.rememberPayMethod("safehaven");
      const checkout = await walletApi.startSafehaven(fundAmount, callbackUrl);
      if (!checkout.authorization_url) {
        throw new Error("Safe Haven did not return a checkout URL");
      }
      window.location.href = checkout.authorization_url;
    } catch (err) {
      setBusy(false);
      setError(err instanceof Error ? err.message : "Could not start Safe Haven.");
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
      await walletApi.submitManual(fundAmount, proof);
      setMessage("Transfer submitted for review. Your wallet is credited after approval.");
      setProof(null);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not submit the transfer.");
    } finally {
      setBusy(false);
    }
  };

  const shortfallCopy = useMemo(() => {
    const gap = Math.max(needed - Number(wallet?.balance || 0), 0);
    return gap > 0
      ? `You need ${formatNaira(gap)} more in your wallet for this plan.`
      : "Fund your wallet, then subscribe.";
  }, [needed, wallet?.balance]);

  return (
    <div className="membership-fund">
      <div className="membership-fund__head">
        <Wallet size={18} />
        <div>
          <strong>Fund your wallet</strong>
          <p>{shortfallCopy}</p>
        </div>
      </div>
      <label className="membership-fund__amount">
        Amount
        <div className="membership-fund__amount-row">
          <span>₦</span>
          <input
            type="number"
            min={funding?.min_amount || 100}
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
            disabled={busy}
          />
        </div>
      </label>
      <div className="membership-fund__actions">
        {paystackOn ? (
          <button type="button" onClick={() => void startPaystack()} disabled={busy}>
            Pay with Paystack
          </button>
        ) : null}
        {safehavenOn ? (
          <button type="button" onClick={() => void startSafehaven()} disabled={busy}>
            Pay with Safe Haven
          </button>
        ) : null}
      </div>
      {manualOn ? (
        <div className="membership-fund__manual">
          <p>
            <Landmark size={14} /> Transfer {formatNaira(fundAmount)} to{" "}
            {funding?.manual?.account_name} · {funding?.manual?.bank_name} ·{" "}
            {funding?.manual?.account_number}
          </p>
          <input
            type="file"
            accept="image/*"
            onChange={(event) => setProof(event.target.files?.[0] || null)}
            disabled={busy}
          />
          <button type="button" onClick={() => void submitManual()} disabled={busy}>
            Submit transfer proof
          </button>
        </div>
      ) : null}
      {message ? <p className="membership-fund__ok">{message}</p> : null}
      {error ? <p className="membership-fund__err">{error}</p> : null}
    </div>
  );
};

export default WalletFundPanel;
