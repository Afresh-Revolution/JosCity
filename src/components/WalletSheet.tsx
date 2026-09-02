import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Landmark, Loader2, Wallet, X } from "lucide-react";
import ActionBadge from "./ActionBadge";
import {
  walletApi,
  type PayoutAccount,
  type WalletMember,
  type WalletSnapshot,
} from "../services/walletApi";

type Sheet =
  | "hub"
  | "fund"
  | "fundMethod"
  | "fundManual"
  | "payout"
  | "choose"
  | "bank"
  | "share";

type Props = {
  open: boolean;
  needed?: number;
  wallet: WalletSnapshot | null;
  onClose: () => void;
  onUpdated: (next: WalletSnapshot) => void;
};

function formatNaira(value?: number) {
  return `₦${Number(value || 0).toLocaleString("en-NG")}`;
}

export default function WalletSheet({
  open,
  needed = 0,
  wallet,
  onClose,
  onUpdated,
}: Props) {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [sheet, setSheet] = useState<Sheet>("hub");
  const [amountText, setAmountText] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<{
    variant: "success" | "error";
    message: string;
  } | null>(null);
  const [afterPayout, setAfterPayout] = useState<"choose" | null>(null);
  const [bankName, setBankName] = useState("");
  const [accountName, setAccountName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [memberIdText, setMemberIdText] = useState("");
  const [recipient, setRecipient] = useState<WalletMember | null>(null);
  const [recipientError, setRecipientError] = useState<string | null>(null);
  const [lookingUp, setLookingUp] = useState(false);
  const [proof, setProof] = useState<File | null>(null);
  const [paystackFailed, setPaystackFailed] = useState(false);

  const funding = wallet?.funding;
  const paystackOn = Boolean(funding?.paystack?.enabled);
  const safehavenOn = Boolean(funding?.safehaven?.enabled);
  const manualOn = Boolean(funding?.manual?.enabled);
  const minFund = Number(funding?.min_amount || 100);
  const available = Number(wallet?.balance || 0);
  const ownMemberId = String(wallet?.member_id || "");
  const callbackUrl = `${window.location.origin}/membership`;
  const parseAmount = () => Number(String(amountText).replace(/,/g, ""));
  const showError = (text: string) =>
    setNotice({ variant: "error", message: text });
  const showSuccess = (text: string) =>
    setNotice({ variant: "success", message: text });

  const resetLocal = () => {
    setAmountText("");
    setMemberIdText("");
    setRecipient(null);
    setRecipientError(null);
    setAfterPayout(null);
    setProof(null);
    setPaystackFailed(false);
    setNotice(null);
    setSheet("hub");
  };

  const openedRef = useRef(false);
  useEffect(() => {
    if (open && !openedRef.current) {
      setSheet(needed > 0 ? "fund" : "hub");
      setAmountText(needed > 0 ? String(Math.max(needed, minFund)) : "");
      setNotice(null);
      if (wallet?.payout_account) {
        setBankName(wallet.payout_account.bank_name || "");
        setAccountName(wallet.payout_account.account_name || "");
        setAccountNumber(wallet.payout_account.account_number || "");
      }
    }
    openedRef.current = open;
  }, [open, needed, minFund, wallet?.payout_account]);

  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(null), 5200);
    return () => window.clearTimeout(timer);
  }, [notice]);

  const refresh = async () => {
    const next = await walletApi.getWallet();
    onUpdated(next);
    return next;
  };

  useEffect(() => {
    const reference = params.get("reference") || params.get("trxref");
    if (!reference) return;
    const method = walletApi.takePayMethod();
    setBusy(true);
    setNotice(null);
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
        showSuccess("Wallet funded. You can subscribe now.");
        await refresh();
      } catch (err) {
        showError(
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

  const openWithdraw = () => {
    setNotice(null);
    if (!wallet?.payout_account) {
      setAfterPayout("choose");
      setSheet("payout");
      return;
    }
    setSheet("choose");
  };

  const continueFunding = () => {
    const amount = parseAmount();
    if (!Number.isFinite(amount) || amount < minFund) {
      showError(`Enter an amount of at least ₦${minFund}.`);
      return;
    }
    setPaystackFailed(false);
    setNotice(null);
    setSheet("fundMethod");
  };

  const startPaystack = async () => {
    const amount = parseAmount();
    setBusy(true);
    setNotice(null);
    try {
      walletApi.rememberPayMethod("paystack");
      const checkout = await walletApi.startPaystack(amount, callbackUrl);
      if (!checkout.authorization_url) {
        throw new Error("Paystack did not return a checkout URL");
      }
      window.location.href = checkout.authorization_url;
    } catch (err) {
      setBusy(false);
      setPaystackFailed(true);
      showError(err instanceof Error ? err.message : "Could not start Paystack.");
    }
  };

  const startSafehaven = async () => {
    const amount = parseAmount();
    setBusy(true);
    setNotice(null);
    try {
      walletApi.rememberPayMethod("safehaven");
      const checkout = await walletApi.startSafehaven(amount, callbackUrl);
      if (!checkout.authorization_url) {
        throw new Error("Safe Haven did not return a checkout URL");
      }
      window.location.href = checkout.authorization_url;
    } catch (err) {
      setBusy(false);
      showError(err instanceof Error ? err.message : "Could not start Safe Haven.");
    }
  };

  const submitManual = async () => {
    const amount = parseAmount();
    if (!Number.isFinite(amount) || amount < minFund) {
      showError(`Enter an amount of at least ₦${minFund}.`);
      return;
    }
    if (!proof) {
      showError("Upload a screenshot of the transfer.");
      return;
    }
    setBusy(true);
    setNotice(null);
    try {
      await walletApi.submitManual(amount, proof);
      showSuccess(
        "Transfer submitted for review. Your wallet is credited after approval."
      );
      setProof(null);
      await refresh();
      setSheet("hub");
    } catch (err) {
      showError(
        err instanceof Error ? err.message : "Could not submit the transfer."
      );
    } finally {
      setBusy(false);
    }
  };

  const submitBankWithdraw = async () => {
    const amount = parseAmount();
    if (!Number.isFinite(amount) || amount <= 0) {
      showError("Enter a valid naira amount.");
      return;
    }
    if (amount > available) {
      showError("You cannot send more than your available balance.");
      return;
    }
    setBusy(true);
    setNotice(null);
    try {
      await walletApi.withdraw(amount);
      showSuccess(
        "Withdrawal submitted. Payouts stay pending until JOSCITY approves them."
      );
      await refresh();
      setSheet("hub");
      setAmountText("");
    } catch (err) {
      showError(err instanceof Error ? err.message : "Could not withdraw");
    } finally {
      setBusy(false);
    }
  };

  const submitPayoutAccount = async () => {
    const name = bankName.trim();
    const holder = accountName.trim();
    const number = accountNumber.replace(/\s+/g, "");
    if (!name || !holder || number.length < 8) {
      showError("Enter the bank name, account name and account number.");
      return;
    }
    setBusy(true);
    setNotice(null);
    try {
      const result = await walletApi.updatePayoutAccount({
        bank_name: name,
        account_name: holder,
        account_number: number,
      });
      const nextAccount: PayoutAccount | null =
        result.payout_account || wallet?.payout_account || null;
      onUpdated({
        ...(wallet || { balance: available }),
        payout_account: nextAccount,
      });
      showSuccess("Payout account saved.");
      if (afterPayout === "choose") {
        setAfterPayout(null);
        setSheet("choose");
      } else {
        setSheet("hub");
      }
    } catch (err) {
      showError(
        err instanceof Error ? err.message : "Could not save payout account"
      );
    } finally {
      setBusy(false);
    }
  };

  const submitShare = async () => {
    if (!recipient) {
      showError(recipientError || "No member found with that ID.");
      return;
    }
    const amount = parseAmount();
    if (!Number.isFinite(amount) || amount <= 0) {
      showError("Enter a valid naira amount.");
      return;
    }
    if (amount > available) {
      showError("You cannot send more than your available balance.");
      return;
    }
    setBusy(true);
    setNotice(null);
    try {
      await walletApi.share(recipient.member_id, amount);
      showSuccess(`${formatNaira(amount)} was sent to ${recipient.name}.`);
      await refresh();
      setSheet("hub");
      setAmountText("");
      setMemberIdText("");
      setRecipient(null);
    } catch (err) {
      showError(err instanceof Error ? err.message : "Could not share");
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    if (!open || sheet !== "share") return;
    const normalized = memberIdText.trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
    if (normalized.length < 12) {
      setRecipient(null);
      setRecipientError(null);
      setLookingUp(false);
      return;
    }
    const formatted = `${normalized.slice(0, 4)}-${normalized.slice(4, 8)}-${normalized.slice(8, 12)}`;
    if (ownMemberId && formatted === ownMemberId) {
      setRecipient(null);
      setRecipientError("You cannot share to your own wallet.");
      setLookingUp(false);
      return;
    }
    let cancelled = false;
    setLookingUp(true);
    const timer = window.setTimeout(() => {
      void walletApi
        .lookupMember(formatted)
        .then((data) => {
          if (cancelled) return;
          setLookingUp(false);
          setRecipient(data);
          setRecipientError(null);
        })
        .catch((err) => {
          if (cancelled) return;
          setLookingUp(false);
          setRecipient(null);
          setRecipientError(
            err instanceof Error ? err.message : "No member found with that ID."
          );
        });
    }, 400);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [memberIdText, open, ownMemberId, sheet]);

  if (!open) return null;

  return (
    <>
      {notice ? (
        <ActionBadge
          variant={notice.variant}
          message={notice.message}
          onDismiss={() => setNotice(null)}
        />
      ) : null}
    <div className="wallet-sheet" role="dialog" aria-modal="true" aria-labelledby="wallet-sheet-title">
      <button
        type="button"
        className="wallet-sheet__backdrop"
        aria-label="Close wallet"
        onClick={() => {
          if (busy) return;
          resetLocal();
          onClose();
        }}
      />
      <div className="wallet-sheet__card">
        <div className="wallet-sheet__top">
          <h2 id="wallet-sheet-title">Wallet</h2>
          <button
            type="button"
            className="wallet-sheet__close"
            onClick={() => {
              if (busy) return;
              resetLocal();
              onClose();
            }}
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>
        <p className="wallet-sheet__balance">
          <Wallet size={16} /> Available {formatNaira(available)}
        </p>

        {sheet === "hub" ? (
          <div className="wallet-sheet__choices">
            <button type="button" onClick={() => setSheet("fund")} disabled={busy}>
              Fund wallet
            </button>
            <button type="button" className="wallet-sheet__ghost" onClick={openWithdraw} disabled={busy}>
              Withdraw
            </button>
          </div>
        ) : null}

        {sheet === "payout" ? (
          <>
            <h3>Payout account</h3>
            <p className="wallet-sheet__meta">
              This is the bank account JOSCITY uses for approved withdrawals.
            </p>
            <label>
              Bank name
              <input value={bankName} onChange={(e) => setBankName(e.target.value)} disabled={busy} />
            </label>
            <label>
              Account name
              <input value={accountName} onChange={(e) => setAccountName(e.target.value)} disabled={busy} />
            </label>
            <label>
              Account number
              <input value={accountNumber} onChange={(e) => setAccountNumber(e.target.value)} disabled={busy} />
            </label>
            <button type="button" onClick={() => void submitPayoutAccount()} disabled={busy}>
              {busy ? <Loader2 size={16} className="spinner" /> : null}
              Save
            </button>
          </>
        ) : null}

        {sheet === "choose" ? (
          <>
            <h3>Withdraw</h3>
            <p className="wallet-sheet__meta">
              Send to your bank for review, or share instantly with another member.
            </p>
            <div className="wallet-sheet__choices">
              <button
                type="button"
                onClick={() => {
                  setAmountText("");
                  setSheet("bank");
                }}
              >
                To bank
              </button>
              <button
                type="button"
                className="wallet-sheet__ghost"
                onClick={() => {
                  setAmountText("");
                  setMemberIdText("");
                  setRecipient(null);
                  setRecipientError(null);
                  setSheet("share");
                }}
              >
                Share
              </button>
            </div>
          </>
        ) : null}

        {sheet === "fund" || sheet === "bank" ? (
          <>
            <h3>{sheet === "bank" ? "Withdraw" : "Fund"}</h3>
            {sheet === "bank" ? (
              <p className="wallet-sheet__meta">Available: {formatNaira(available)}</p>
            ) : null}
            <label className="wallet-sheet__amount">
              Amount
              <div className="wallet-sheet__amount-row">
                <span>₦</span>
                <input
                  type="number"
                  min={sheet === "fund" ? minFund : 0}
                  value={amountText}
                  onChange={(e) => setAmountText(e.target.value)}
                  disabled={busy}
                />
              </div>
            </label>
            <button
              type="button"
              onClick={() =>
                void (sheet === "bank" ? submitBankWithdraw() : continueFunding())
              }
              disabled={busy}
            >
              {busy ? <Loader2 size={16} className="spinner" /> : null}
              {sheet === "bank" ? "Submit for review" : "Continue"}
            </button>
          </>
        ) : null}

        {sheet === "fundMethod" ? (
          <>
            <h3>Choose how to pay</h3>
            {paystackFailed ? (
              <p className="wallet-sheet__meta">
                Paystack could not complete this payment. Try Safe Haven or a bank transfer.
              </p>
            ) : null}
            {paystackOn ? (
              <button type="button" onClick={() => void startPaystack()} disabled={busy}>
                {busy ? <Loader2 size={16} className="spinner" /> : null}
                Paystack
              </button>
            ) : null}
            {safehavenOn ? (
              <button
                type="button"
                className="wallet-sheet__ghost"
                onClick={() => void startSafehaven()}
                disabled={busy}
              >
                Safe Haven
              </button>
            ) : null}
            {manualOn ? (
              <button
                type="button"
                className="wallet-sheet__ghost"
                onClick={() => setSheet("fundManual")}
                disabled={busy}
              >
                Bank transfer
              </button>
            ) : null}
          </>
        ) : null}

        {sheet === "fundManual" ? (
          <>
            <h3>Bank transfer</h3>
            <p className="wallet-sheet__meta">
              Send {formatNaira(parseAmount() || minFund)} to the JOSCITY
              account, then upload a screenshot for review.
            </p>
            <div className="wallet-sheet__bank">
              <p>{funding?.manual?.bank_name}</p>
              <p>{funding?.manual?.account_name}</p>
              <p>{funding?.manual?.account_number}</p>
              <button
                type="button"
                className="wallet-sheet__ghost"
                onClick={() => {
                  const number = funding?.manual?.account_number;
                  if (number) void navigator.clipboard.writeText(number);
                }}
              >
                Copy account number
              </button>
            </div>
            <label>
              <Landmark size={14} /> Attach transfer screenshot
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setProof(e.target.files?.[0] || null)}
                disabled={busy}
              />
            </label>
            <button type="button" onClick={() => void submitManual()} disabled={busy}>
              {busy ? <Loader2 size={16} className="spinner" /> : null}
              Submit for review
            </button>
          </>
        ) : null}

        {sheet === "share" ? (
          <>
            <h3>Share</h3>
            <p className="wallet-sheet__meta">
              Enter the receiver&apos;s membership ID. Sharing moves funds immediately.
            </p>
            <label>
              Membership ID
              <input
                value={memberIdText}
                onChange={(e) => {
                  setMemberIdText(e.target.value);
                  setAmountText("");
                }}
                placeholder="XXXX-XXXX-XXXX"
                disabled={busy}
              />
            </label>
            {lookingUp ? <p className="wallet-sheet__meta">Checking membership ID…</p> : null}
            {recipient ? (
              <p className="wallet-sheet__ok">
                {recipient.name} · {recipient.account_type_label || recipient.account_type}
              </p>
            ) : recipientError ? (
              <p className="wallet-sheet__err">{recipientError}</p>
            ) : null}
            <p className="wallet-sheet__meta">Available: {formatNaira(available)}</p>
            <label className="wallet-sheet__amount">
              Amount
              <div className="wallet-sheet__amount-row">
                <span>₦</span>
                <input
                  type="number"
                  min={0}
                  value={amountText}
                  onChange={(e) => setAmountText(e.target.value)}
                  disabled={busy || !recipient}
                />
              </div>
            </label>
            <button type="button" onClick={() => void submitShare()} disabled={busy || !recipient}>
              {busy ? <Loader2 size={16} className="spinner" /> : null}
              Share now
            </button>
          </>
        ) : null}

        {sheet !== "hub" ? (
          <button
            type="button"
            className="wallet-sheet__ghost"
            onClick={() => {
              if (busy) return;
              setNotice(null);
              setSheet("hub");
            }}
          >
            Back
          </button>
        ) : null}
      </div>
    </div>
    </>
  );
}
