import { useCallback, useEffect, useRef, useState } from "react";
import { Nfc } from "lucide-react";
import { listingMarketplaceApi } from "../services/marketplaceApi";
import { isWebNfcSupported, NfcReadError, readCardTap } from "../utils/webNfc";
import { formatMarketplaceMoney } from "../utils/marketplaceDisplay";

type Props = {
  orderId: number;
  amountNaira: number;
  disabled?: boolean;
  /** Called once the tap payment has gone through. */
  onPaid: () => void;
  /** Lets the parent lock its other payment buttons while a tap payment is in flight. */
  onBusyChange?: (busy: boolean) => void;
};

type Phase = "idle" | "scanning" | "verifying" | "pin" | "paying";

const PIN_LENGTH = 4;
const SCAN_GRACE_MS = 2500;

// Server error codes after which the same tap session can still be used — the
// PIN can simply be re-submitted. Anything else ends the session (tap again).
const RETRY_IN_PLACE = new Set(["PIN_INVALID", "PAY_UNCERTAIN", "FINALIZE_FAILED", "RATE_LIMITED", "NETWORK"]);

let configRequest: Promise<boolean> | null = null;

function fetchTapEnabled(): Promise<boolean> {
  if (!configRequest) {
    configRequest = listingMarketplaceApi
      .getCbcTapConfig()
      .then((res) => Boolean(res.success && res.data?.enabled))
      .catch(() => false);
  }
  return configRequest;
}

/** "2345" -> "**** **** **** 2345" */
function maskedCard(last4: string | null): string {
  return last4 ? `**** **** **** ${last4}` : "**** **** **** ****";
}

function formatCountdown(seconds: number): string {
  const safe = Math.max(0, seconds);
  return `${Math.floor(safe / 60)}:${String(safe % 60).padStart(2, "0")}`;
}

export default function CbcTapPayPanel({ orderId, amountNaira, disabled, onPaid, onBusyChange }: Props) {
  // null while the server config is still loading
  const [enabled, setEnabled] = useState<boolean | null>(null);
  const [phase, setPhase] = useState<Phase>("idle");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [cardLast4, setCardLast4] = useState<string | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [pin, setPin] = useState<string[]>(() => Array(PIN_LENGTH).fill(""));
  // Set when a PIN submission ended in an unknown state (the card may already
  // have been charged): the session must not expire on the user, and a retry
  // is answered idempotently by the server.
  const [unresolved, setUnresolved] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const pinRefs = useRef<Array<HTMLInputElement | null>>([]);
  const mounted = useRef(true);
  const supported = isWebNfcSupported();

  useEffect(() => {
    mounted.current = true;
    void fetchTapEnabled().then((value) => {
      if (mounted.current) setEnabled(value);
    });
    return () => {
      mounted.current = false;
      abortRef.current?.abort();
    };
  }, []);

  const busy = phase !== "idle";
  const onBusyRef = useRef(onBusyChange);
  onBusyRef.current = onBusyChange;
  useEffect(() => {
    onBusyRef.current?.(busy);
  }, [busy]);

  const clearPin = useCallback(() => setPin(Array(PIN_LENGTH).fill("")), []);

  const reset = useCallback(
    (message: string | null = null) => {
      // Stop the NFC scan after a short grace period rather than instantly: the
      // card is usually still against the phone, and the moment the scan stops
      // Android would open its own "New tag scanned" screen over the page.
      const controller = abortRef.current;
      abortRef.current = null;
      if (controller) window.setTimeout(() => controller.abort(), SCAN_GRACE_MS);
      clearPin();
      setCardLast4(null);
      setSecondsLeft(0);
      setUnresolved(false);
      setNotice(null);
      setError(message);
      setPhase("idle");
    },
    [clearPin]
  );

  // Session countdown while waiting for the PIN.
  useEffect(() => {
    if (phase !== "pin") return undefined;
    const timer = window.setInterval(() => {
      setSecondsLeft((current) => current - 1);
    }, 1000);
    return () => window.clearInterval(timer);
  }, [phase]);

  useEffect(() => {
    if (phase === "pin" && !unresolved && secondsLeft <= 0) {
      reset("Your tap session expired. Tap your card again.");
    }
  }, [phase, secondsLeft, unresolved, reset]);

  useEffect(() => {
    if (phase === "pin") window.setTimeout(() => pinRefs.current[0]?.focus(), 80);
  }, [phase]);

  const startTap = async () => {
    if (busy || disabled) return;
    setError(null);
    setNotice(null);
    const controller = new AbortController();
    abortRef.current = controller;
    setPhase("scanning");

    let tag;
    try {
      // The NFC scan stays active until this controller is aborted (reset,
      // success or unmount) so Android never opens its own tag screen over us.
      tag = await readCardTap(controller.signal, (message) => {
        if (mounted.current) setNotice(message);
      });
    } catch (caught) {
      if (!mounted.current) return;
      if (caught instanceof NfcReadError && caught.code === "aborted") return;
      reset(caught instanceof Error ? caught.message : "Could not read the card. Try again.");
      return;
    }
    if (!mounted.current) return;

    setPhase("verifying");
    try {
      const res = await listingMarketplaceApi.startListingCbcTap(orderId, tag);
      if (!mounted.current) return;
      if (!res.success || !res.data) {
        reset(res.message || "We could not verify this card. Tap it again.");
        return;
      }
      setCardLast4(res.data.card_last4);
      setSecondsLeft(res.data.expires_in_seconds);
      clearPin();
      setPhase("pin");
    } catch {
      if (mounted.current) reset("Could not reach JosCity. Check your connection and tap again.");
    }
  };

  const submitPin = async (digits: string[]) => {
    const value = digits.join("");
    if (phase !== "pin" || value.length !== PIN_LENGTH) return;
    setError(null);
    setPhase("paying");
    try {
      const res = await listingMarketplaceApi.confirmListingCbcTap(orderId, value);
      if (!mounted.current) return;
      if (res.success) {
        clearPin();
        setUnresolved(false);
        abortRef.current?.abort();
        abortRef.current = null;
        setPhase("idle");
        onPaid();
        return;
      }
      const code = res.code || "NETWORK";
      if (RETRY_IN_PLACE.has(code)) {
        if (code === "PAY_UNCERTAIN" || code === "FINALIZE_FAILED") setUnresolved(true);
        clearPin();
        setPhase("pin");
        const left = typeof res.attemptsLeft === "number" ? ` ${res.attemptsLeft} attempt${res.attemptsLeft === 1 ? "" : "s"} left.` : "";
        setError(`${res.message || "Payment could not be completed."}${code === "PIN_INVALID" ? left : ""}`);
        return;
      }
      reset(res.message || "This payment could not be completed. Tap your card again.");
    } catch {
      if (!mounted.current) return;
      setUnresolved(true); // the request may have reached the server
      clearPin();
      setPhase("pin");
      setError("Could not reach JosCity. Check your connection and enter your PIN again.");
    }
  };

  const setDigit = (index: number, raw: string) => {
    const digit = raw.replace(/\D/g, "").slice(-1);
    const next = [...pin];
    next[index] = digit;
    setPin(next);
    if (digit && index < PIN_LENGTH - 1) pinRefs.current[index + 1]?.focus();
  };

  const onPinKeyDown = (index: number, event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Backspace" && !pin[index] && index > 0) {
      const next = [...pin];
      next[index - 1] = "";
      setPin(next);
      pinRefs.current[index - 1]?.focus();
      event.preventDefault();
    }
    if (event.key === "Enter" && pin.every(Boolean)) {
      event.preventDefault();
      void submitPin(pin);
    }
  };

  const onPinPaste = (event: React.ClipboardEvent<HTMLInputElement>) => {
    event.preventDefault();
    const digits = (event.clipboardData.getData("text") || "").replace(/\D/g, "").slice(0, PIN_LENGTH).split("");
    if (!digits.length) return;
    const next = Array(PIN_LENGTH).fill("");
    digits.forEach((digit, i) => {
      next[i] = digit;
    });
    setPin(next);
    pinRefs.current[Math.min(digits.length, PIN_LENGTH - 1)]?.focus();
  };

  const pinComplete = pin.every(Boolean);

  return (
    <div className="cbc-tap-pay">
      <h4>
        <Nfc size={18} aria-hidden="true" /> Tap to pay
      </h4>

      {enabled === null ? <p>Checking tap to pay…</p> : null}

      {enabled === false ? (
        <p>Tap to pay is not available right now. Use your card details or wallet instead.</p>
      ) : null}

      {enabled && !supported ? (
        <p>
          Tap to pay works on Chrome for Android with NFC turned on. On this device, use your card details or wallet
          instead.
        </p>
      ) : null}

      {enabled && supported && phase === "idle" ? (
        <>
          <p>
            Charge {formatMarketplaceMoney(amountNaira)} from your CBrilliance card by tapping it on the back of your
            phone, then enter your PIN. JosCity never stores your card details or PIN.
          </p>
          {error ? <div className="cbc-tap-pay__error">{error}</div> : null}
          <button
            type="button"
            className="marketplace-checkout-main-btn"
            disabled={disabled}
            onClick={() => void startTap()}
          >
            Tap card to pay
          </button>
        </>
      ) : null}

      {phase === "scanning" ? (
        <div className="cbc-tap-pay__status" role="status">
          <span className="cbc-tap-pay__pulse" aria-hidden="true">
            <Nfc size={32} />
          </span>
          <p>Hold your CBC card against the back of your phone.</p>
          {notice ? <div className="cbc-tap-pay__error">{notice}</div> : null}
          <button type="button" className="cbc-tap-pay__ghost" onClick={() => reset()}>
            Cancel
          </button>
        </div>
      ) : null}

      {phase === "verifying" ? (
        <div className="cbc-tap-pay__status" role="status">
          <p>Checking your card…</p>
        </div>
      ) : null}

      {phase === "pin" || phase === "paying" ? (
        <div className="cbc-tap-pay__pin">
          <div className="cbc-tap-pay__card" aria-label="Card detected">
            <span className="cbc-tap-pay__card-label">Card</span>
            <span className="cbc-tap-pay__card-number">{maskedCard(cardLast4)}</span>
          </div>
          <p>
            Pay {formatMarketplaceMoney(amountNaira)}
            {phase === "pin" && !unresolved ? ` · expires in ${formatCountdown(secondsLeft)}` : ""}
          </p>
          <p>Enter your 4-digit Card PIN.</p>
          <div className="cbc-tap-pay__boxes">
            {pin.map((digit, index) => (
              <input
                key={index}
                ref={(node) => {
                  pinRefs.current[index] = node;
                }}
                type="password"
                inputMode="numeric"
                autoComplete="off"
                maxLength={1}
                aria-label={`PIN digit ${index + 1}`}
                value={digit}
                disabled={phase === "paying"}
                onChange={(event) => setDigit(index, event.target.value)}
                onKeyDown={(event) => onPinKeyDown(index, event)}
                onPaste={onPinPaste}
              />
            ))}
          </div>
          {error ? <div className="cbc-tap-pay__error">{error}</div> : null}
          <button
            type="button"
            className="marketplace-checkout-main-btn"
            disabled={!pinComplete || phase === "paying"}
            onClick={() => void submitPin(pin)}
          >
            {phase === "paying" ? "Processing…" : `Pay ${formatMarketplaceMoney(amountNaira)}`}
          </button>
          <button type="button" className="cbc-tap-pay__ghost" disabled={phase === "paying"} onClick={() => reset()}>
            Cancel
          </button>
        </div>
      ) : null}
    </div>
  );
}
