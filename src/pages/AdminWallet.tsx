import React, { useState, useEffect } from "react";
import {
  Wallet,
  CheckCircle,
  XCircle,
  Loader2,
  AlertCircle,
  DollarSign,
  User,
  Calendar,
  Coins,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  Filter,
} from "lucide-react";
import {
  getWalletPayments,
  approveWalletPayment,
  rejectWalletPayment,
  type WalletPaymentRequest,
} from "../services/adminApi";
import "../main.css";
import "../scss/_admin.scss";

const AdminWallet: React.FC = () => {
  const [payments, setPayments] = useState<WalletPaymentRequest[]>([]);
  const [filteredPayments, setFilteredPayments] = useState<WalletPaymentRequest[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Wallet statistics
  const [stats, setStats] = useState({
    totalPending: 0,
    totalApproved: 0,
    totalRejected: 0,
    totalAmount: 0,
    totalCBC: 0,
  });

  useEffect(() => {
    loadPayments();
  }, []);

  const loadPayments = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getWalletPayments();
      const data = response.data || [];
      setPayments(data);
      setFilteredPayments(data);
      
      // Calculate statistics
      const stats = {
        totalPending: data.filter((p: WalletPaymentRequest) => p.status === "pending").length,
        totalApproved: data.filter((p: WalletPaymentRequest) => p.status === "approved").length,
        totalRejected: data.filter((p: WalletPaymentRequest) => p.status === "rejected").length,
        totalAmount: data.reduce((sum: number, p: WalletPaymentRequest) => sum + (p.amount || 0), 0),
        totalCBC: data.reduce((sum: number, p: WalletPaymentRequest) => sum + (p.amount || 0), 0), // Assuming 1:1 conversion for now
      };
      setStats(stats);
    } catch (err) {
      console.error("Failed to load wallet payments:", err);
      // Don't set error if it's just an empty result
      setPayments([]);
      setFilteredPayments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (statusFilter === "all") {
      setFilteredPayments(payments);
    } else {
      setFilteredPayments(payments.filter((p) => p.status === statusFilter));
    }
  }, [statusFilter, payments]);

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
      await loadPayments();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : `Failed to ${action} payment`
      );
    } finally {
      setProcessing(null);
    }
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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
    }).format(amount);
  };

  const formatCBC = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 8,
    }).format(amount);
  };

  return (
    <div className="admin-dashboard">
      <div className="admin-dashboard__header">
        <h1>
          <Wallet size={20} />
          Wallet Payment Requests
        </h1>
      </div>

      {/* Wallet Statistics */}
      <div className="admin-wallet-stats">
        <div className="admin-wallet-stat-card">
          <div className="admin-wallet-stat-card__icon admin-wallet-stat-card__icon--pending">
            <Coins size={24} />
          </div>
          <div className="admin-wallet-stat-card__content">
            <div className="admin-wallet-stat-card__value">{stats.totalPending}</div>
            <div className="admin-wallet-stat-card__label">Pending Requests</div>
          </div>
        </div>
        <div className="admin-wallet-stat-card">
          <div className="admin-wallet-stat-card__icon admin-wallet-stat-card__icon--approved">
            <TrendingUp size={24} />
          </div>
          <div className="admin-wallet-stat-card__content">
            <div className="admin-wallet-stat-card__value">{stats.totalApproved}</div>
            <div className="admin-wallet-stat-card__label">Approved</div>
          </div>
        </div>
        <div className="admin-wallet-stat-card">
          <div className="admin-wallet-stat-card__icon admin-wallet-stat-card__icon--rejected">
            <TrendingDown size={24} />
          </div>
          <div className="admin-wallet-stat-card__content">
            <div className="admin-wallet-stat-card__value">{stats.totalRejected}</div>
            <div className="admin-wallet-stat-card__label">Rejected</div>
          </div>
        </div>
        <div className="admin-wallet-stat-card admin-wallet-stat-card--highlight">
          <div className="admin-wallet-stat-card__icon admin-wallet-stat-card__icon--cbc">
            <Coins size={24} />
          </div>
          <div className="admin-wallet-stat-card__content">
            <div className="admin-wallet-stat-card__value">
              {formatCBC(stats.totalCBC)} <span className="admin-wallet-stat-card__currency">CBC</span>
            </div>
            <div className="admin-wallet-stat-card__label">Total CBC Amount</div>
          </div>
        </div>
        <div className="admin-wallet-stat-card">
          <div className="admin-wallet-stat-card__icon admin-wallet-stat-card__icon--amount">
            <DollarSign size={24} />
          </div>
          <div className="admin-wallet-stat-card__content">
            <div className="admin-wallet-stat-card__value">{formatCurrency(stats.totalAmount)}</div>
            <div className="admin-wallet-stat-card__label">Total Amount (NGN)</div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="admin-dashboard__filters">
        <button
          className={`admin-filter-btn ${statusFilter === "all" ? "active" : ""}`}
          onClick={() => setStatusFilter("all")}
        >
          <Filter size={14} />
          All
        </button>
        <button
          className={`admin-filter-btn ${statusFilter === "pending" ? "active" : ""}`}
          onClick={() => setStatusFilter("pending")}
        >
          Pending
        </button>
        <button
          className={`admin-filter-btn ${statusFilter === "approved" ? "active" : ""}`}
          onClick={() => setStatusFilter("approved")}
        >
          Approved
        </button>
        <button
          className={`admin-filter-btn ${statusFilter === "rejected" ? "active" : ""}`}
          onClick={() => setStatusFilter("rejected")}
        >
          Rejected
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
          <span>Loading wallet payments...</span>
        </div>
      ) : filteredPayments.length === 0 ? (
        <div className="admin-dashboard__empty-state">
          <Wallet size={48} />
          <p>No wallet payment requests{statusFilter !== "all" ? ` with status "${statusFilter}"` : ""}</p>
        </div>
      ) : (
        <div className="admin-wallet-grid">
          {filteredPayments.map((payment) => (
            <div key={payment.request_id} className="admin-wallet-card">
              <div className="admin-wallet-card__header">
                <div className="admin-wallet-card__icon">
                  <Wallet size={24} />
                </div>
                <div className="admin-wallet-card__amounts">
                  <div className="admin-wallet-card__amount-primary">
                    {formatCBC(payment.amount)} <span className="admin-wallet-card__currency">CBC</span>
                  </div>
                  <div className="admin-wallet-card__amount-secondary">
                    ≈ {formatCurrency(payment.amount)}
                  </div>
                </div>
              </div>

              <div className="admin-wallet-card__details">
                <div className="admin-wallet-card__detail-item">
                  <User size={16} />
                  <span>User ID: {payment.user_id}</span>
                </div>
                <div className="admin-wallet-card__detail-item">
                  <Calendar size={16} />
                  <span>{formatDate(payment.requested_at)}</span>
                </div>
                <div className="admin-wallet-card__detail-item">
                  <Coins size={16} />
                  <span>Native Coin: CBC (City Blockchain Coin)</span>
                </div>
                <div className="admin-wallet-card__status">
                  <span className={`badge badge--${payment.status}`}>
                    {payment.status === "pending" && <ArrowUpRight size={12} />}
                    {payment.status === "approved" && <CheckCircle size={12} />}
                    {payment.status === "rejected" && <XCircle size={12} />}
                    {payment.status}
                  </span>
                </div>
              </div>

              <div className="admin-wallet-card__actions">
                {payment.status === "pending" && (
                  <>
                    <button
                      onClick={() =>
                        handleAction(payment.request_id, "approve", approveWalletPayment)
                      }
                      disabled={processing === payment.request_id}
                      className="admin-action-btn admin-action-btn--approve"
                    >
                      {processing === payment.request_id ? (
                        <Loader2 size={16} className="spinner" />
                      ) : (
                        <CheckCircle size={16} />
                      )}
                      Approve
                    </button>
                    <button
                      onClick={() =>
                        handleAction(payment.request_id, "reject", rejectWalletPayment)
                      }
                      disabled={processing === payment.request_id}
                      className="admin-action-btn admin-action-btn--reject"
                    >
                      {processing === payment.request_id ? (
                        <Loader2 size={16} className="spinner" />
                      ) : (
                        <XCircle size={16} />
                      )}
                      Reject
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminWallet;

