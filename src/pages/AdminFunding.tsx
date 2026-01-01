import React, { useState, useEffect } from "react";
import {
  DollarSign,
  Trash2,
  Loader2,
  AlertCircle,
  XCircle,
  CheckCircle,
  Target,
} from "lucide-react";
import {
  getFundingRequests,
  deleteFundingRequest,
  getFundingPayments,
  approveFundingPayment,
  type FundingRequest,
} from "../services/adminApi";
import "../main.css";
import "../scss/_admin.scss";

const AdminFunding: React.FC = () => {
  const [requests, setRequests] = useState<FundingRequest[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<"requests" | "payments">("requests");
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      if (activeTab === "requests") {
        const response = await getFundingRequests();
        setRequests(response.data);
      } else {
        const response = await getFundingPayments();
        setPayments(response.data);
      }
    } catch (err) {
      console.error("Failed to load funding data:", err);
      setError(err instanceof Error ? err.message : "Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (requestId: string) => {
    try {
      setProcessing(requestId);
      setError(null);
      setSuccess(null);
      await deleteFundingRequest(requestId);
      setSuccess("Funding request deleted successfully");
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete request");
    } finally {
      setProcessing(null);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="admin-dashboard">
      <div className="admin-dashboard__header">
        <h1>
          <DollarSign size={20} />
          Funding Management
        </h1>
      </div>

      <div className="admin-tabs">
        <button
          className={`admin-tab ${activeTab === "requests" ? "active" : ""}`}
          onClick={() => setActiveTab("requests")}
        >
          <Target size={16} />
          Funding Requests
        </button>
        <button
          className={`admin-tab ${activeTab === "payments" ? "active" : ""}`}
          onClick={() => setActiveTab("payments")}
        >
          <DollarSign size={16} />
          Payments
        </button>
      </div>

      {error && (
        <div className="admin-dashboard__message admin-dashboard__message--error">
          <AlertCircle size={18} />
          <span>{error}</span>
          <button onClick={() => setError(null)}>
            <XCircle size={18} />
          </button>
        </div>
      )}

      {success && (
        <div className="admin-dashboard__message admin-dashboard__message--success">
          <CheckCircle size={18} />
          <span>{success}</span>
          <button onClick={() => setSuccess(null)}>
            <XCircle size={18} />
          </button>
        </div>
      )}

      {loading ? (
        <div className="admin-dashboard__loading">
          <Loader2 size={32} className="spinner" />
          <span>Loading funding data...</span>
        </div>
      ) : (
        <>
          {activeTab === "requests" && (
            <div className="admin-funding-grid">
              {requests.length === 0 ? (
                <div className="admin-dashboard__empty-state">
                  <Target size={48} />
                  <p>No funding requests yet</p>
                </div>
              ) : (
                requests.map((request) => (
                  <div key={request.request_id} className="admin-funding-card">
                    <div className="admin-funding-card__header">
                      <h4>{request.title}</h4>
                      <span className={`badge badge--${request.status}`}>
                        {request.status}
                      </span>
                    </div>
                    <div className="admin-funding-card__content">
                      <p>{request.description}</p>
                      <div className="admin-funding-card__progress">
                        <div className="admin-funding-card__amounts">
                          <span>Raised: {formatCurrency(request.current_amount)}</span>
                          <span>Target: {formatCurrency(request.target_amount)}</span>
                        </div>
                        <div className="admin-funding-card__percentage">
                          {Math.round((request.current_amount / request.target_amount) * 100)}%
                        </div>
                      </div>
                      <div className="admin-funding-card__meta">
                        <span>User ID: {request.user_id}</span>
                        <span>Created: {formatDate(request.created_at)}</span>
                      </div>
                    </div>
                    <div className="admin-funding-card__actions">
                      <button
                        onClick={() => handleDelete(request.request_id)}
                        disabled={processing === request.request_id}
                        className="admin-action-btn admin-action-btn--delete"
                      >
                        {processing === request.request_id ? (
                          <Loader2 size={16} className="spinner" />
                        ) : (
                          <Trash2 size={16} />
                        )}
                        Delete
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === "payments" && (
            <div className="admin-funding-payments-list">
              {payments.length === 0 ? (
                <div className="admin-dashboard__empty-state">
                  <DollarSign size={48} />
                  <p>No payments yet</p>
                </div>
              ) : (
                payments.map((payment: any) => (
                  <div key={payment.payment_id} className="admin-funding-payment-card">
                    <h4>Payment #{payment.payment_id}</h4>
                    <p>Amount: {formatCurrency(payment.amount)}</p>
                    <p>Status: {payment.status}</p>
                    {payment.status === "pending" && (
                      <button
                        onClick={async () => {
                          try {
                            await approveFundingPayment(payment.payment_id);
                            setSuccess("Payment approved");
                            await loadData();
                          } catch (err) {
                            setError(err instanceof Error ? err.message : "Failed to approve");
                          }
                        }}
                        className="admin-action-btn admin-action-btn--approve"
                      >
                        <CheckCircle size={16} />
                        Approve
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default AdminFunding;

