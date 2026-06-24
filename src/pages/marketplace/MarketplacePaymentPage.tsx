import React from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import PaymentSubmissionForm from "../../components/marketplace/PaymentSubmissionForm";
import {
  loadCheckoutResult,
  marketplaceApi,
} from "../../services/marketplaceApi";
import "../../main.css";
import "../../scss/_marketplace.scss";

const MarketplacePaymentPage: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const stored = loadCheckoutResult();

  if (!orderId) {
    return (
      <div className="marketplace-subpage">
        <p>Invalid order.</p>
        <Link to="/marketplace">Back to marketplace</Link>
      </div>
    );
  }

  const invoiceNumber = stored?.invoice_number ?? stored?.order?.invoice_number ?? "";
  const defaultAmount = Number(stored?.total_amount ?? stored?.order?.total_amount ?? 0);

  return (
    <div className="marketplace-subpage">
      <button type="button" className="marketplace-subpage__back" onClick={() => navigate(-1)}>
        <ArrowLeft size={18} /> Back
      </button>

      <PaymentSubmissionForm
        orderId={orderId}
        invoiceNumber={invoiceNumber}
        defaultAmount={defaultAmount}
        onSubmit={async (input) => {
          await marketplaceApi.submitPaymentLog(orderId, input);
        }}
      />
    </div>
  );
};

export default MarketplacePaymentPage;
