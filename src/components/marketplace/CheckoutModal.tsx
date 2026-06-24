import React, { useState } from "react";
import { X } from "lucide-react";
import type { CheckoutBuyerPayload, CheckoutResponseData } from "../../services/marketplaceApi";
import { formatMarketplaceMoney } from "../../utils/marketplaceDisplay";

export interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultEmail?: string;
  onSubmit: (payload: CheckoutBuyerPayload) => Promise<{
    success: boolean;
    data?: CheckoutResponseData;
    message?: string;
  }>;
}

const CheckoutModal: React.FC<CheckoutModalProps> = ({
  isOpen,
  onClose,
  defaultEmail = "",
  onSubmit,
}) => {
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [country, setCountry] = useState("Nigeria");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<CheckoutResponseData | null>(null);

  React.useEffect(() => {
    if (isOpen) {
      setError(null);
      setResult(null);
      if (defaultEmail) setEmail(defaultEmail);
    }
  }, [isOpen, defaultEmail]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!fullName.trim() || !phone.trim() || !email.trim() || !address.trim() || !city.trim() || !state.trim()) {
      setError("Please complete all required fields.");
      return;
    }
    setSubmitting(true);
    const res = await onSubmit({
      fullName: fullName.trim(),
      phone: phone.trim(),
      email: email.trim(),
      address: address.trim(),
      city: city.trim(),
      state: state.trim(),
      country: country.trim() || "Nigeria",
      notes: notes.trim() || undefined,
    });
    setSubmitting(false);
    if (!res.success || !res.data) {
      setError(res.message || "Checkout failed.");
      return;
    }
    setResult(res.data);
  };

  if (result) {
    return (
      <div className="marketplace-modal-overlay" onClick={onClose} role="presentation">
        <div
          className="marketplace-modal marketplace-modal--wide"
          onClick={(e) => e.stopPropagation()}
          role="dialog"
          aria-labelledby="checkout-done-title"
        >
          <div className="marketplace-modal__header">
            <h2 id="checkout-done-title">Order placed</h2>
            <button type="button" className="marketplace-modal__close" onClick={onClose} aria-label="Close">
              <X size={22} />
            </button>
          </div>
          <div className="marketplace-checkout-success">
            <p className="marketplace-checkout-success__lead">
              Pay each seller using the bank details below. Your delivery details were recorded for the
              seller.
            </p>
            {result.orders.map((ord) => (
              <div key={ord.id} className="marketplace-checkout-order">
                <h3>Order #{ord.id} — {formatMarketplaceMoney(ord.totalNaira)}</h3>
                <div className="marketplace-checkout-bank">
                  <h4>Pay to this account</h4>
                  <p>
                    <strong>Bank:</strong> {ord.sellerBank.bankName}
                  </p>
                  <p>
                    <strong>Account number:</strong> {ord.sellerBank.bankAccountNumber}
                  </p>
                  <p>
                    <strong>Account name:</strong> {ord.sellerBank.bankAccountName}
                  </p>
                </div>
                <ul className="marketplace-checkout-items">
                  {ord.items.map((it) => (
                    <li key={`${ord.id}-${it.listingId}`}>
                      {it.title} × {it.quantity} @ {formatMarketplaceMoney(it.unitPriceNaira)}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
            <div className="marketplace-modal__actions">
              <button type="button" className="marketplace-modal__btn-primary" onClick={onClose}>
                Done
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="marketplace-modal-overlay" onClick={onClose} role="presentation">
      <div
        className="marketplace-modal marketplace-modal--wide"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-labelledby="checkout-title"
      >
        <div className="marketplace-modal__header">
          <h2 id="checkout-title">Checkout</h2>
          <button type="button" className="marketplace-modal__close" onClick={onClose} aria-label="Close">
            <X size={22} />
          </button>
        </div>
        <form className="marketplace-modal__form" onSubmit={(e) => void handleSubmit(e)}>
          {error && <div className="marketplace-modal__error">{error}</div>}
          <p className="marketplace-checkout-intro">
            Enter your contact and delivery details. After confirming, you will see each seller&apos;s bank
            details for payment.
          </p>
          <label className="marketplace-modal__label">
            Full name <span className="marketplace-modal__req">*</span>
            <input
              className="marketplace-modal__input"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
            />
          </label>
          <label className="marketplace-modal__label">
            Phone <span className="marketplace-modal__req">*</span>
            <input
              className="marketplace-modal__input"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
            />
          </label>
          <label className="marketplace-modal__label">
            Email <span className="marketplace-modal__req">*</span>
            <input
              className="marketplace-modal__input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </label>
          <label className="marketplace-modal__label">
            Receiving address <span className="marketplace-modal__req">*</span>
            <textarea
              className="marketplace-modal__textarea"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              rows={2}
              required
            />
          </label>
          <div className="marketplace-modal__grid2">
            <label className="marketplace-modal__label">
              City <span className="marketplace-modal__req">*</span>
              <input
                className="marketplace-modal__input"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                required
              />
            </label>
            <label className="marketplace-modal__label">
              State <span className="marketplace-modal__req">*</span>
              <input
                className="marketplace-modal__input"
                value={state}
                onChange={(e) => setState(e.target.value)}
                required
              />
            </label>
          </div>
          <label className="marketplace-modal__label">
            Country
            <input
              className="marketplace-modal__input"
              value={country}
              onChange={(e) => setCountry(e.target.value)}
            />
          </label>
          <label className="marketplace-modal__label">
            Notes for seller (optional)
            <textarea
              className="marketplace-modal__textarea"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
            />
          </label>
          <div className="marketplace-modal__actions">
            <button type="button" className="marketplace-modal__btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="marketplace-modal__btn-primary" disabled={submitting}>
              {submitting ? "Placing order…" : "Confirm & Checkout"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CheckoutModal;
