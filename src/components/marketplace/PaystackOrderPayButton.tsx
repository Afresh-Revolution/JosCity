import { useRef, useState } from "react";
import { listingMarketplaceApi } from "../../services/marketplaceApi";

export default function PaystackOrderPayButton({ orderId, disabled, onPaid, onBusyChange }: {
  orderId: number; disabled?: boolean; onPaid: () => void; onBusyChange: (busy: boolean) => void;
}) {
  const [reference, setReference] = useState<string | null>(null);
  const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const running = useRef(false);
  const run = async (verify = false) => {
    if (running.current || disabled) return;
    running.current = true; setBusy(true); onBusyChange(true); setError(null);
    const popup = verify ? null : window.open("about:blank", "_blank");
    if (popup) popup.opener = null;
    try {
      if (verify) {
        if (!reference) throw new Error("Start the payment first.");
        const result = await listingMarketplaceApi.verifyListingPaystack(orderId, reference);
        if (!result.success) throw new Error(result.message || "Payment has not been confirmed yet.");
        onPaid();
      } else {
        const result = await listingMarketplaceApi.startListingPaystack(orderId);
        if (!result.success || !result.data?.authorization_url) throw new Error(result.message || "Could not open Paystack.");
        setReference(result.data.reference); setCheckoutUrl(result.data.authorization_url);
        if (popup) popup.location.href = result.data.authorization_url;
      }
    } catch (caught) { popup?.close(); setError(caught instanceof Error ? caught.message : "Payment could not be confirmed."); }
    finally { running.current = false; setBusy(false); onBusyChange(false); }
  };
  return <div>
    <button type="button" className="marketplace-modal__btn-primary" disabled={disabled || busy} onClick={() => void run()}>
      {busy ? "Please wait…" : "Pay with Paystack"}
    </button>
    {checkoutUrl ? <p><a href={checkoutUrl} target="_blank" rel="noopener noreferrer">Open Paystack checkout</a></p> : null}
    {reference ? <button type="button" disabled={disabled || busy} onClick={() => void run(true)}>Check payment</button> : null}
    {error ? <p role="alert">{error}</p> : null}
    <p>After paying, return here and check your payment. Approved Paystack refunds return through Paystack.</p>
  </div>;
}
