import React, { useState } from "react";
import { Loader2 } from "lucide-react";
import type { PaymentLogInput } from "../../services/marketplaceApi";
import { formatMarketplaceMoney } from "../../utils/marketplaceDisplay";

interface PaymentSubmissionFormProps {
  orderId: string;
  invoiceNumber: string;
  defaultAmount: number;
  onSubmit: (input: PaymentLogInput) => Promise<void>;
}

const PaymentSubmissionForm: React.FC<PaymentSubmissionFormProps> = ({
  orderId,
  invoiceNumber,
  defaultAmount,
  onSubmit,
}) => {
  const [amount, setAmount] = useState(String(defaultAmount));
  const [bankName, setBankName] = useState("");
  const [accountName, setAccountName] = useState("");
  const [transferReference, setTransferReference] = useState("");
  const [paymentProofUrl, setPaymentProofUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    const parsedAmount = Number(amount);
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      setError("Enter a valid transfer amount.");
      return;
    }
    if (!bankName.trim() || !accountName.trim() || !transferReference.trim()) {
      setError("Bank name, account name, and transfer reference are required.");
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit({
        amount: parsedAmount,
        bank_name: bankName.trim(),
        account_name: accountName.trim(),
        transfer_reference: transferReference.trim(),
        payment_proof_url: paymentProofUrl.trim() || undefined,
      });
      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit payment log.");
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="marketplace-payment-success" role="status">
        <h2>Payment submitted</h2>
        <p>
          Payment submitted. Your transfer is awaiting JosCity administrator confirmation.
        </p>
        <p className="marketplace-payment-success__meta">
          Order <strong>{orderId}</strong> · Invoice <strong>{invoiceNumber}</strong>
        </p>
      </div>
    );
  }

  return (
    <form className="marketplace-payment-form" onSubmit={(e) => void handleSubmit(e)}>
      <h2>Submit payment details</h2>
      <p className="marketplace-payment-form__lead">
        After your bank transfer, log the payment so an administrator can confirm it.
        Invoice: <strong>{invoiceNumber}</strong>
      </p>

      {error && <div className="marketplace-banner-error">{error}</div>}

      <label className="marketplace-modal__label">
        Amount transferred
        <input
          className="marketplace-modal__input"
          type="number"
          min="1"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          required
        />
        <span className="marketplace-payment-form__hint">
          Expected: {formatMarketplaceMoney(defaultAmount)}
        </span>
      </label>

      <label className="marketplace-modal__label">
        Bank name
        <input
          className="marketplace-modal__input"
          value={bankName}
          onChange={(e) => setBankName(e.target.value)}
          required
        />
      </label>

      <label className="marketplace-modal__label">
        Account name (sender)
        <input
          className="marketplace-modal__input"
          value={accountName}
          onChange={(e) => setAccountName(e.target.value)}
          required
        />
      </label>

      <label className="marketplace-modal__label">
        Transfer reference
        <input
          className="marketplace-modal__input"
          value={transferReference}
          onChange={(e) => setTransferReference(e.target.value)}
          required
        />
      </label>

      <label className="marketplace-modal__label">
        Payment proof URL (optional)
        <input
          className="marketplace-modal__input"
          type="url"
          value={paymentProofUrl}
          onChange={(e) => setPaymentProofUrl(e.target.value)}
          placeholder="https://..."
        />
      </label>

      <button
        type="submit"
        className="marketplace-checkout-main-btn"
        disabled={submitting}
      >
        {submitting ? (
          <>
            <Loader2 size={16} className="spinner" /> Submitting…
          </>
        ) : (
          "Submit payment log"
        )}
      </button>
    </form>
  );
};

export default PaymentSubmissionForm;
