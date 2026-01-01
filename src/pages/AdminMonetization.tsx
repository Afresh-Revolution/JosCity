import React, { useState, useEffect } from "react";
import {
  TrendingUp,
  CheckCircle,
  XCircle,
  Loader2,
  AlertCircle,
  DollarSign,
} from "lucide-react";
import {
  getMonetizationPayments,
  approveMonetizationPayment,
  rejectMonetizationPayment,
  getMonetizationStats,
  type MonetizationPayment,
  type MonetizationStats,
} from "../services/adminApi";
import "../main.css";
import "../scss/_admin.scss";

const AdminMonetization: React.FC = () => {
  const [payments, setPayments] = useState<MonetizationPayment[]>([]);
  const [stats, setStats] = useState<MonetizationStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [paymentsResponse, statsResponse] = await Promise.all([
        getMonetizationPayments(),
        getMonetizationStats(),
      ]);
      setPayments(paymentsResponse.data);
      setStats(statsResponse.data);
    } catch (err) {
      console.error("Failed to load monetization data:", err);
      setError(err instanceof Error ? err.message : "Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (
    paymentId: string,
    action: "approve" | "reject",
    actionFn: (id: string) => Promise<any>
  ) => {
    try {
      setProcessing(paymentId);
      setError(null);
      setSuccess(null);
      await actionFn(paymentId);
      setSuccess(`Payment ${action}d successfully`);
      await loadData();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : `Failed to ${action} payment`
      );
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
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="admin-dashboard">
      <div className="admin-dashboard__header">
        <h1>
          <TrendingUp size={20} />
          Monetization Management
        </h1>
      </div>

      {stats && (
        <div className="admin-stats-grid">
          <div className="admin-stat-card">
            <div className="admin-stat-card__number">
              {formatCurrency(stats.total_earnings)}
            </div>
            <div className="admin-stat-card__label">Total Earnings</div>
          </div>
          <div className="admin-stat-card">
            <div className="admin-stat-card__number">{stats.pending_payments}</div>
            <div className="admin-stat-card__label">Pending Payments</div>
          </div>
          <div className="admin-stat-card">
            <div className="admin-stat-card__number">{stats.completed_payments}</div>
            <div className="admin-stat-card__label">Completed Payments</div>
          </div>
        </div>
      )}

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
          <span>Loading monetization data...</span>
        </div>
      ) : payments.length === 0 ? (
        <div className="admin-dashboard__empty-state">
          <TrendingUp size={48} />
          <p>No monetization payments yet</p>
        </div>
      ) : (
        <div className="admin-monetization-grid">
          {payments.map((payment) => (
            <div key={payment.payment_id} className="admin-monetization-card">
              <div className="admin-monetization-card__header">
                <div className="admin-monetization-card__icon">
                  <DollarSign size={24} />
                </div>
                <div className="admin-monetization-card__amount">
                  {formatCurrency(payment.amount)}
                </div>
              </div>

              <div className="admin-monetization-card__details">
                <div className="admin-monetization-card__detail-item">
                  <span>User ID: {payment.user_id}</span>
                </div>
                <div className="admin-monetization-card__detail-item">
                  <span>Status: {payment.status}</span>
                </div>
                <div className="admin-monetization-card__detail-item">
                  <span>Requested: {formatDate(payment.requested_at)}</span>
                </div>
              </div>

              {payment.status === "pending" && (
                <div className="admin-monetization-card__actions">
                  <button
                    onClick={() =>
                      handleAction(payment.payment_id, "approve", approveMonetizationPayment)
                    }
                    disabled={processing === payment.payment_id}
                    className="admin-action-btn admin-action-btn--approve"
                  >
                    {processing === payment.payment_id ? (
                      <Loader2 size={16} className="spinner" />
                    ) : (
                      <CheckCircle size={16} />
                    )}
                    Approve
                  </button>
                  <button
                    onClick={() =>
                      handleAction(payment.payment_id, "reject", rejectMonetizationPayment)
                    }
                    disabled={processing === payment.payment_id}
                    className="admin-action-btn admin-action-btn--reject"
                  >
                    {processing === payment.payment_id ? (
                      <Loader2 size={16} className="spinner" />
                    ) : (
                      <XCircle size={16} />
                    )}
                    Reject
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminMonetization;

