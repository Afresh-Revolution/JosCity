import React, { useState, useEffect } from "react";
import {
  Users,
  CheckCircle,
  XCircle,
  Loader2,
  AlertCircle,
  DollarSign,
  Search,
  Filter,
  TrendingUp,
  Calendar,
  User,
  Mail,
  CreditCard,
  Award,
  Clock,
} from "lucide-react";
import {
  getAffiliatePayments,
  approveAffiliatePayment,
  rejectAffiliatePayment,
  getAffiliateStats,
  type AffiliatePayment,
  type AffiliateStats,
} from "../services/adminApi";
import "../main.css";
import "../scss/_admin.scss";

const AdminAffiliates: React.FC = () => {
  const [payments, setPayments] = useState<AffiliatePayment[]>([]);
  const [filteredPayments, setFilteredPayments] = useState<AffiliatePayment[]>([]);
  const [stats, setStats] = useState<AffiliateStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    loadData();
  }, [statusFilter]);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredPayments(payments);
    } else {
      const query = searchQuery.toLowerCase();
      setFilteredPayments(
        payments.filter(
          (payment) =>
            payment.user_id?.toString().includes(query) ||
            payment.user_firstname?.toLowerCase().includes(query) ||
            payment.user_lastname?.toLowerCase().includes(query) ||
            payment.user_email?.toLowerCase().includes(query) ||
            payment.method?.toLowerCase().includes(query)
        )
      );
    }
  }, [searchQuery, payments]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [paymentsResponse, statsResponse] = await Promise.all([
        getAffiliatePayments(statusFilter === "all" ? undefined : statusFilter as any),
        getAffiliateStats(),
      ]);
      setPayments(paymentsResponse.data || []);
      setFilteredPayments(paymentsResponse.data || []);
      setStats(statsResponse.data);
    } catch (err) {
      console.error("Failed to load affiliate data:", err);
      // Don't set error if it's just an empty result
      setPayments([]);
      setFilteredPayments([]);
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
      const result = await actionFn(paymentId);
      
      if (result.success) {
        setSuccess(result.message || `Payment ${action}d successfully`);
        await loadData();
      } else {
        setError(result.message || result.error || `Failed to ${action} payment`);
      }
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

  const getPaymentMethodIcon = (method?: string) => {
    switch (method?.toLowerCase()) {
      case "paypal":
        return "💳";
      case "bank":
        return "🏦";
      case "skrill":
        return "💵";
      case "moneypoolscash":
        return "💰";
      default:
        return "💳";
    }
  };

  return (
    <div className="admin-dashboard">
      <div className="admin-dashboard__header">
        <h1>
          <Users size={20} />
          Affiliates Management
        </h1>
      </div>

      {/* Enhanced Stats Grid */}
      {stats && (
        <div className="admin-affiliates-stats">
          <div className="admin-affiliate-stat-card">
            <div className="admin-affiliate-stat-card__icon admin-affiliate-stat-card__icon--users">
              <Users size={24} />
            </div>
            <div className="admin-affiliate-stat-card__content">
              <div className="admin-affiliate-stat-card__value">{stats.total_affiliates}</div>
              <div className="admin-affiliate-stat-card__label">Total Affiliates</div>
            </div>
          </div>
          <div className="admin-affiliate-stat-card admin-affiliate-stat-card--highlight">
            <div className="admin-affiliate-stat-card__icon admin-affiliate-stat-card__icon--earnings">
              <DollarSign size={24} />
            </div>
            <div className="admin-affiliate-stat-card__content">
              <div className="admin-affiliate-stat-card__value">
                {formatCurrency(stats.total_earnings)}
              </div>
              <div className="admin-affiliate-stat-card__label">Total Earnings</div>
            </div>
          </div>
          <div className="admin-affiliate-stat-card">
            <div className="admin-affiliate-stat-card__icon admin-affiliate-stat-card__icon--month">
              <TrendingUp size={24} />
            </div>
            <div className="admin-affiliate-stat-card__content">
              <div className="admin-affiliate-stat-card__value">
                {formatCurrency(stats.month_earnings || 0)}
              </div>
              <div className="admin-affiliate-stat-card__label">This Month</div>
            </div>
          </div>
          <div className="admin-affiliate-stat-card">
            <div className="admin-affiliate-stat-card__icon admin-affiliate-stat-card__icon--pending">
              <Clock size={24} />
            </div>
            <div className="admin-affiliate-stat-card__content">
              <div className="admin-affiliate-stat-card__value">{stats.pending_payments}</div>
              <div className="admin-affiliate-stat-card__label">Pending Payments</div>
              <div className="admin-affiliate-stat-card__subvalue">
                {formatCurrency(stats.pending_amount || 0)}
              </div>
            </div>
          </div>
          <div className="admin-affiliate-stat-card">
            <div className="admin-affiliate-stat-card__icon admin-affiliate-stat-card__icon--approved">
              <CheckCircle size={24} />
            </div>
            <div className="admin-affiliate-stat-card__content">
              <div className="admin-affiliate-stat-card__value">{stats.approved_payments || 0}</div>
              <div className="admin-affiliate-stat-card__label">Approved Payments</div>
              <div className="admin-affiliate-stat-card__subvalue">
                {formatCurrency(stats.approved_amount || 0)}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Top Affiliates Section */}
      {stats && stats.top_affiliates && stats.top_affiliates.length > 0 && (
        <div className="admin-top-affiliates">
          <h2 className="admin-section-title">
            <Award size={20} />
            Top Affiliates
          </h2>
          <div className="admin-top-affiliates-list">
            {stats.top_affiliates.slice(0, 5).map((affiliate, index) => (
              <div key={affiliate.user_id} className="admin-top-affiliate-item">
                <div className="admin-top-affiliate-item__rank">#{index + 1}</div>
                <div className="admin-top-affiliate-item__avatar">
                  {affiliate.user_picture ? (
                    <img src={affiliate.user_picture} alt={affiliate.user_firstname} />
                  ) : (
                    <User size={20} />
                  )}
                </div>
                <div className="admin-top-affiliate-item__info">
                  <div className="admin-top-affiliate-item__name">
                    {affiliate.user_firstname} {affiliate.user_lastname}
                  </div>
                  <div className="admin-top-affiliate-item__details">
                    {affiliate.total_payments} payments
                  </div>
                </div>
                <div className="admin-top-affiliate-item__earnings">
                  {formatCurrency(affiliate.total_earnings)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Search and Filters */}
      <div className="admin-dashboard__search">
        <Search size={18} />
        <input
          type="text"
          placeholder="Search by user name, email, ID, or payment method..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

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
          <span>Loading affiliate data...</span>
        </div>
      ) : filteredPayments.length === 0 ? (
        <div className="admin-dashboard__empty-state">
          <Users size={48} />
          <p>No affiliate payments yet{statusFilter !== "all" ? ` with status "${statusFilter}"` : ""}</p>
        </div>
      ) : (
        <div className="admin-affiliates-grid">
          {filteredPayments.map((payment) => (
            <div key={payment.payment_id} className="admin-affiliate-card">
              <div className="admin-affiliate-card__header">
                <div className="admin-affiliate-card__user">
                  {payment.user_picture ? (
                    <img
                      src={payment.user_picture}
                      alt={payment.user_firstname}
                      className="admin-affiliate-card__avatar"
                    />
                  ) : (
                    <div className="admin-affiliate-card__avatar admin-affiliate-card__avatar--default">
                      <User size={20} />
                    </div>
                  )}
                  <div className="admin-affiliate-card__user-info">
                    <div className="admin-affiliate-card__user-name">
                      {payment.user_firstname} {payment.user_lastname}
                    </div>
                    <div className="admin-affiliate-card__user-id">ID: {payment.user_id}</div>
                  </div>
                </div>
                <div className="admin-affiliate-card__amount">
                  {formatCurrency(payment.amount)}
                </div>
              </div>

              <div className="admin-affiliate-card__details">
                <div className="admin-affiliate-card__detail-item">
                  <span className={`badge badge--${payment.status}`}>
                    {payment.status === "pending" && <Clock size={12} />}
                    {payment.status === "approved" && <CheckCircle size={12} />}
                    {payment.status === "rejected" && <XCircle size={12} />}
                    {payment.status}
                  </span>
                </div>
                <div className="admin-affiliate-card__detail-item">
                  <CreditCard size={16} />
                  <span>
                    {getPaymentMethodIcon(payment.method)} {payment.method || "Unknown"}
                  </span>
                </div>
                {payment.method_details && (
                  <div className="admin-affiliate-card__detail-item">
                    <span className="admin-affiliate-card__method-details">
                      {payment.method_details}
                    </span>
                  </div>
                )}
                <div className="admin-affiliate-card__detail-item">
                  <Calendar size={16} />
                  <span>{formatDate(payment.requested_at)}</span>
                </div>
                {payment.user_email && (
                  <div className="admin-affiliate-card__detail-item">
                    <Mail size={16} />
                    <span>{payment.user_email}</span>
                  </div>
                )}
              </div>

              {payment.status === "pending" && (
                <div className="admin-affiliate-card__actions">
                  <button
                    onClick={() =>
                      handleAction(payment.payment_id, "approve", approveAffiliatePayment)
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
                      handleAction(payment.payment_id, "reject", rejectAffiliatePayment)
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

export default AdminAffiliates;
