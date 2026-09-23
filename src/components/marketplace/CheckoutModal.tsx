import React, { useState } from "react";
import { X } from "lucide-react";
import CbcCardPayForm from "../CbcCardPayForm";
import CbcTapPayPanel from "../CbcTapPayPanel";
import {
  listingMarketplaceApi,
  type CheckoutBuyerPayload,
  type CheckoutResponseData,
} from "../../services/marketplaceApi";
import { walletApi } from "../../services/walletApi";
import { formatMarketplaceMoney } from "../../utils/marketplaceDisplay";

function isPlatformPayee(value?: string | null) {
  const name = String(value || "").trim().toLowerCase();
  return name === "joscity" || name === "jos city" || name === "jos smart city";
}

function orderPayLabel(ord?: CheckoutResponseData["orders"][number]) {
  const titles = (ord?.items || [])
    .map((item) => {
      const title = String(item.title || "").trim();
      if (!title) return "";
      return item.quantity > 1 ? `${title} × ${item.quantity}` : title;
    })
    .filter(Boolean);
  return titles[0] || "Your order";
}

function orderPayeeName(ord?: CheckoutResponseData["orders"][number]) {
  const fromSeller = String(ord?.sellerName || "").trim();
  if (fromSeller && !isPlatformPayee(fromSeller)) return fromSeller;
  const fromBank = String(ord?.sellerBank?.bankAccountName || "").trim();
  if (fromBank && !isPlatformPayee(fromBank)) return fromBank;
  return fromSeller || "the seller";
}

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
  const [payBusyId, setPayBusyId] = useState<number | null>(null);
  const [tapBusyId, setTapBusyId] = useState<number | null>(null);
  const [payError, setPayError] = useState<string | null>(null);
  const [paidOrders, setPaidOrders] = useState<Record<number, true>>({});
  const [walletBalance, setWalletBalance] = useState(0);
  const payeeName = orderPayeeName(result?.orders?.[0]);

  React.useEffect(() => {
    if (isOpen) {
      setError(null);
      setResult(null);
      setPayError(null);
      setPaidOrders({});
      setPayBusyId(null);
      setTapBusyId(null);
      if (defaultEmail) setEmail(defaultEmail);
    }
  }, [isOpen, defaultEmail]);

  React.useEffect(() => {
    if (!result) return;
    void walletApi
      .getWallet()
      .then((wallet) => setWalletBalance(Number(wallet.balance || 0)))
      .catch(() => setWalletBalance(0));
  }, [result]);

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
              Pay {payeeName} with CBC or your JOSCITY wallet. The seller&apos;s wallet is credited
              when payment succeeds.
            </p>
            {result.orders.map((ord) => (
              <div key={ord.id} className="marketplace-checkout-order">
                <h3>{orderPayLabel(ord)} — {formatMarketplaceMoney(ord.totalNaira)}</h3>
                    {paidOrders[ord.id] ? (
                      <p className="marketplace-checkout-success__lead">
                        Payment received. The business wallet was credited.
                      </p>
                    ) : (
                      <>
                        <p className="marketplace-checkout-success__lead">
                          Wallet balance: {formatMarketplaceMoney(walletBalance)}
                        </p>
                        {payError ? (
                          <p className="marketplace-modal__error">{payError}</p>
                        ) : null}
                        <button
                          type="button"
                          className="marketplace-modal__btn-primary"
                          disabled={payBusyId === ord.id || tapBusyId === ord.id}
                          onClick={() => {
                            void (async () => {
                              setPayBusyId(ord.id);
                              setPayError(null);
                              const res = await listingMarketplaceApi.payListingWallet(ord.id);
                              setPayBusyId(null);
                              if (!res.success) {
                                setPayError(res.message || "Not enough wallet balance. Fund your wallet first.");
                                return;
                              }
                              setWalletBalance((current) => Math.max(0, current - ord.totalNaira));
                              setPaidOrders((current) => ({ ...current, [ord.id]: true }));
                            })();
                          }}
                        >
                          {payBusyId === ord.id ? "Paying…" : "Pay with wallet"}
                        </button>
                        <CbcCardPayForm
                          amountNaira={ord.totalNaira}
                          quote={result.funding?.cbc_quote}
                          busy={payBusyId === ord.id || tapBusyId === ord.id}
                          error={payBusyId === ord.id ? payError : null}
                          onPay={(details) => {
                            void (async () => {
                              setPayBusyId(ord.id);
                              setPayError(null);
                              const res = await listingMarketplaceApi.payListingCbcCard(ord.id, details);
                              setPayBusyId(null);
                              if (!res.success) {
                                setPayError(res.message || "This CBC card payment could not be completed.");
                                return;
                              }
                              setPaidOrders((current) => ({ ...current, [ord.id]: true }));
                            })();
                          }}
                        />
                        <CbcTapPayPanel
                          orderId={ord.id}
                          amountNaira={ord.totalNaira}
                          disabled={payBusyId === ord.id}
                          onBusyChange={(busy) => setTapBusyId(busy ? ord.id : null)}
                          onPaid={() => {
                            setPayError(null);
                            setPaidOrders((current) => ({ ...current, [ord.id]: true }));
                          }}
                        />
                  </>
                )}
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
            Enter your contact and delivery or service location. After confirming, you can pay with
            CBC or your JOSCITY wallet.
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
            Receiving / service address <span className="marketplace-modal__req">*</span>
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
              placeholder="For services, add the date, time, and where you need them."
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
