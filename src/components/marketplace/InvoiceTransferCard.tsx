import React, { useState } from "react";
import { Copy, Check } from "lucide-react";
import type { CheckoutResult } from "../../services/marketplaceApi";
import { copyToClipboard, formatMarketplaceMoney } from "../../utils/marketplaceDisplay";

interface InvoiceTransferCardProps {
  checkout: CheckoutResult;
  onContinuePayment: () => void;
}

const InvoiceTransferCard: React.FC<InvoiceTransferCardProps> = ({
  checkout,
  onContinuePayment,
}) => {
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const bank = checkout.bank_transfer_instructions;

  const handleCopy = async (field: string, value: string) => {
    const ok = await copyToClipboard(value);
    if (ok) {
      setCopiedField(field);
      window.setTimeout(() => setCopiedField(null), 2000);
    }
  };

  return (
    <div className="marketplace-invoice-card">
      <h2>Bank transfer invoice</h2>
      <p className="marketplace-invoice-card__lead">
        Transfer the exact total below and use the invoice number as your payment narration.
      </p>

      <div className="marketplace-invoice-card__highlight">
        <span>Total amount</span>
        <strong>{formatMarketplaceMoney(checkout.total_amount)}</strong>
      </div>

      <dl className="marketplace-invoice-card__details">
        <div>
          <dt>Invoice number</dt>
          <dd>
            <span>{checkout.invoice_number}</span>
            <button
              type="button"
              className="marketplace-invoice-card__copy"
              onClick={() => void handleCopy("invoice", checkout.invoice_number)}
            >
              {copiedField === "invoice" ? <Check size={14} /> : <Copy size={14} />}
              Copy Invoice Number
            </button>
          </dd>
        </div>
        <div>
          <dt>Bank name</dt>
          <dd>{bank.bank_name}</dd>
        </div>
        <div>
          <dt>Account name</dt>
          <dd>{bank.account_name}</dd>
        </div>
        <div>
          <dt>Account number</dt>
          <dd>
            <span>{bank.account_number}</span>
            <button
              type="button"
              className="marketplace-invoice-card__copy"
              onClick={() => void handleCopy("account", bank.account_number)}
            >
              {copiedField === "account" ? <Check size={14} /> : <Copy size={14} />}
              Copy Account Number
            </button>
          </dd>
        </div>
        <div>
          <dt>Narration</dt>
          <dd>{bank.narration}</dd>
        </div>
      </dl>

      <p className="marketplace-invoice-card__instruction">{bank.instruction}</p>
      {checkout.email_sent && (
        <p className="marketplace-invoice-card__email-note">
          A copy of these instructions was emailed to you.
        </p>
      )}

      <button
        type="button"
        className="marketplace-checkout-main-btn"
        onClick={onContinuePayment}
      >
        Continue to Payment Submission
      </button>
    </div>
  );
};

export default InvoiceTransferCard;
