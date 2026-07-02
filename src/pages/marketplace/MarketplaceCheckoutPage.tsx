import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Loader2 } from "lucide-react";
import InvoiceTransferCard from "../../components/marketplace/InvoiceTransferCard";
import {
  marketplaceApi,
  saveCheckoutResult,
  type CheckoutResult,
  type MarketplaceCart,
} from "../../services/marketplaceApi";
import { formatMarketplaceMoney } from "../../utils/marketplaceDisplay";
import { getUserEmail } from "../../utils/userUtils";
import "../../main.css";
import "../../scss/_marketplace.scss";

const MarketplaceCheckoutPage: React.FC = () => {
  const navigate = useNavigate();
  const [cart, setCart] = useState<MarketplaceCart | null>(null);
  const [cartLoading, setCartLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checkoutResult, setCheckoutResult] = useState<CheckoutResult | null>(null);

  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState(getUserEmail() || "");
  const [customerPhone, setCustomerPhone] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState("");

  useEffect(() => {
    void marketplaceApi
      .getCart()
      .then((res) => setCart(res.data))
      .catch((err) => setError(err instanceof Error ? err.message : "Could not load cart."))
      .finally(() => setCartLoading(false));
  }, []);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    if (!customerName.trim() || !customerEmail.trim() || !customerPhone.trim() || !deliveryAddress.trim()) {
      setError("Please complete all required fields.");
      return;
    }

    setSubmitting(true);
    try {
      const response = await marketplaceApi.checkout({
        customer_name: customerName.trim(),
        customer_email: customerEmail.trim(),
        customer_phone: customerPhone.trim(),
        delivery_address: deliveryAddress.trim(),
      });
      setCheckoutResult(response.data);
      saveCheckoutResult(response.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Checkout failed.");
    } finally {
      setSubmitting(false);
    }
  };

  if (cartLoading) {
    return (
      <div className="marketplace-subpage">
        <Loader2 size={32} className="spinner" />
      </div>
    );
  }

  if (checkoutResult) {
    return (
      <div className="marketplace-subpage">
        <InvoiceTransferCard
          checkout={checkoutResult}
          onContinuePayment={() =>
            navigate(`/marketplace/orders/${checkoutResult.order.id}/payment`)
          }
        />
      </div>
    );
  }

  return (
    <div className="marketplace-subpage">
      <button type="button" className="marketplace-subpage__back" onClick={() => navigate("/marketplace")}>
        <ArrowLeft size={18} /> Back to cart
      </button>

      <h1>Checkout</h1>
      {!cart?.items?.length ? (
        <p>
          Your cart is empty. <Link to="/marketplace">Continue shopping</Link>
        </p>
      ) : (
        <>
          <div className="marketplace-checkout-summary">
            <p>
              {cart.total_quantity} item(s) · Subtotal{" "}
              <strong>{formatMarketplaceMoney(cart.subtotal)}</strong>
            </p>
            <p className="marketplace-checkout-summary__note">
              Final total is confirmed by JosCity at checkout. Pay by bank transfer only — no card payments.
            </p>
          </div>

          <form className="marketplace-checkout-form" onSubmit={(e) => void handleSubmit(e)}>
            {error && <div className="marketplace-banner-error">{error}</div>}

            <label className="marketplace-modal__label">
              Full name
              <input
                className="marketplace-modal__input"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                required
              />
            </label>
            <label className="marketplace-modal__label">
              Email
              <input
                type="email"
                className="marketplace-modal__input"
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
                required
              />
            </label>
            <label className="marketplace-modal__label">
              Phone
              <input
                className="marketplace-modal__input"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                required
              />
            </label>
            <label className="marketplace-modal__label">
              Delivery address
              <textarea
                className="marketplace-modal__textarea"
                rows={3}
                value={deliveryAddress}
                onChange={(e) => setDeliveryAddress(e.target.value)}
                required
              />
            </label>

            <button type="submit" className="marketplace-checkout-main-btn" disabled={submitting}>
              {submitting ? "Placing order…" : "Place order & get bank details"}
            </button>
          </form>
        </>
      )}
    </div>
  );
};

export default MarketplaceCheckoutPage;
