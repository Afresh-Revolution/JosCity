import React, { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  Calendar,
  CheckCircle,
  Filter,
  Loader2,
  Mail,
  Shield,
  User,
  Wallet,
  XCircle,
} from "lucide-react";
import {
  approveCacEdit,
  getCacEditRequests,
  rejectCacEdit,
  type CacEditRequest,
} from "../services/adminApi";
import "../main.css";
import "../scss/_admin.scss";

const AdminCacEdits: React.FC = () => {
  const [rows, setRows] = useState<CacEditRequest[]>([]);
  const [balance, setBalance] = useState(0);
  const [stats, setStats] = useState({ pending: 0, approved: 0, rejected: 0, total_received: 0 });
  const [statusFilter, setStatusFilter] = useState("pending");
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [rejectTarget, setRejectTarget] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  const load = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getCacEditRequests();
      setRows(response.data || []);
      setBalance(Number(response.admin_wallet_balance || 0));
      setStats(
        response.stats || { pending: 0, approved: 0, rejected: 0, total_received: 0 }
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load CAC edit requests");
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const filtered = useMemo(() => {
    if (statusFilter === "all") return rows;
    return rows.filter((row) => row.status === statusFilter);
  }, [rows, statusFilter]);

  const idOf = (row: CacEditRequest) => String(row.payment_id || row.request_id);

  const formatDate = (value?: string | null) => {
    if (!value) return "—";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "—";
    return date.toLocaleString("en-NG", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatNaira = (amount: number) =>
    new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN" }).format(amount || 0);

  const runApprove = async (id: string) => {
    try {
      setProcessing(id);
      setError(null);
      setSuccess(null);
      const result = await approveCacEdit(id);
      if (result && result.success === false) {
        throw new Error(result.message || "Failed to approve");
      }
      setSuccess(result.message || "Approved. Admin wallet credited and one CAC edit unlocked.");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to approve");
    } finally {
      setProcessing(null);
    }
  };

  const submitReject = async () => {
    if (!rejectTarget) return;
    const reason = rejectReason.trim();
    if (!reason) {
      setError("Enter a reason so the business knows why this was declined");
      return;
    }
    try {
      setProcessing(rejectTarget);
      setError(null);
      const result = await rejectCacEdit(rejectTarget, reason);
      if (result && result.success === false) {
        throw new Error(result.message || "Failed to reject");
      }
      setRejectTarget(null);
      setRejectReason("");
      setSuccess(result.message || "Rejected");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to reject");
    } finally {
      setProcessing(null);
    }
  };

  return (
    <div className="admin-dashboard admin-cac-page">
      <div className="admin-dashboard__header">
        <h1>
          <Shield size={20} />
          CAC edit payments
        </h1>
        <p className="admin-cac-page__lede">
          Extra CAC changes are paid. Approval credits the admin wallet, not the business wallet, and unlocks one edit.
        </p>
      </div>

      <div className="admin-wallet-stats">
        <div className="admin-wallet-stat-card admin-wallet-stat-card--highlight">
          <div className="admin-wallet-stat-card__icon admin-wallet-stat-card__icon--cbc">
            <Wallet size={24} />
          </div>
          <div className="admin-wallet-stat-card__content">
            <div className="admin-wallet-stat-card__value">{formatNaira(balance)}</div>
            <div className="admin-wallet-stat-card__label">Admin wallet</div>
          </div>
        </div>
        <div className="admin-wallet-stat-card">
          <div className="admin-wallet-stat-card__icon admin-wallet-stat-card__icon--pending">
            <Shield size={24} />
          </div>
          <div className="admin-wallet-stat-card__content">
            <div className="admin-wallet-stat-card__value">{stats.pending}</div>
            <div className="admin-wallet-stat-card__label">Pending</div>
          </div>
        </div>
        <div className="admin-wallet-stat-card">
          <div className="admin-wallet-stat-card__icon admin-wallet-stat-card__icon--approved">
            <CheckCircle size={24} />
          </div>
          <div className="admin-wallet-stat-card__content">
            <div className="admin-wallet-stat-card__value">{stats.approved}</div>
            <div className="admin-wallet-stat-card__label">Approved</div>
          </div>
        </div>
        <div className="admin-wallet-stat-card">
          <div className="admin-wallet-stat-card__icon admin-wallet-stat-card__icon--rejected">
            <XCircle size={24} />
          </div>
          <div className="admin-wallet-stat-card__content">
            <div className="admin-wallet-stat-card__value">{stats.rejected}</div>
            <div className="admin-wallet-stat-card__label">Rejected</div>
          </div>
        </div>
        <div className="admin-wallet-stat-card">
          <div className="admin-wallet-stat-card__icon admin-wallet-stat-card__icon--amount">
            <Wallet size={24} />
          </div>
          <div className="admin-wallet-stat-card__content">
            <div className="admin-wallet-stat-card__value">{formatNaira(stats.total_received)}</div>
            <div className="admin-wallet-stat-card__label">Received from CAC edits</div>
          </div>
        </div>
      </div>

      <div className="admin-dashboard__filters">
        {["pending", "approved", "rejected", "all"].map((key) => (
          <button
            key={key}
            className={`admin-filter-btn ${statusFilter === key ? "active" : ""}`}
            onClick={() => setStatusFilter(key)}
          >
            {key === "pending" ? <Filter size={14} /> : null}
            {key.charAt(0).toUpperCase() + key.slice(1)}
          </button>
        ))}
      </div>

      {error ? (
        <div className="admin-dashboard__message admin-dashboard__message--error">
          <AlertCircle size={18} />
          <span>{error}</span>
          <button onClick={() => setError(null)}>
            <XCircle size={18} />
          </button>
        </div>
      ) : null}

      {success ? (
        <div className="admin-dashboard__message admin-dashboard__message--success">
          <CheckCircle size={18} />
          <span>{success}</span>
          <button onClick={() => setSuccess(null)}>
            <XCircle size={18} />
          </button>
        </div>
      ) : null}

      {loading ? (
        <div className="admin-dashboard__loading">
          <Loader2 size={32} className="spinner" />
          <span>Loading CAC edit payments...</span>
        </div>
      ) : filtered.length === 0 ? (
        <div className="admin-dashboard__empty-state">
          <Shield size={48} />
          <p>No CAC edit payments{statusFilter !== "all" ? ` with status "${statusFilter}"` : ""}</p>
        </div>
      ) : (
        <div className="admin-wallet-grid">
          {filtered.map((row) => {
            const id = idOf(row);
            return (
              <div key={id} className="admin-wallet-card admin-cac-card">
                <div className="admin-wallet-card__header">
                  <div className="admin-wallet-card__icon">
                    <Shield size={22} />
                  </div>
                  <div className="admin-wallet-card__amounts">
                    <div className="admin-wallet-card__amount-primary">{formatNaira(row.amount)}</div>
                    <div className="admin-wallet-card__amount-secondary">{row.method || "Payment"}</div>
                  </div>
                </div>
                <div className="admin-wallet-card__details">
                  <div className="admin-wallet-card__detail-item">
                    <User size={16} />
                    <span>{row.business_name || `User ${row.user_id}`}</span>
                  </div>
                  {row.email ? (
                    <div className="admin-wallet-card__detail-item">
                      <Mail size={16} />
                      <span>{row.email}</span>
                    </div>
                  ) : null}
                  <div className="admin-wallet-card__detail-item">
                    <Shield size={16} />
                    <span>Current CAC: {row.cac_number || "none"}</span>
                  </div>
                  <div className="admin-wallet-card__detail-item">
                    <Calendar size={16} />
                    <span>{formatDate(row.requested_at)}</span>
                  </div>
                  <div className="admin-wallet-card__status">
                    <span className={`badge badge--${row.status}`}>{row.status}</span>
                  </div>
                </div>
                {row.proof_url ? (
                  <a href={row.proof_url} target="_blank" rel="noreferrer" className="admin-cac-card__proof-link">
                    <img src={row.proof_url} alt="Transfer proof" className="admin-cac-card__proof" />
                  </a>
                ) : null}
                {row.status === "pending" ? (
                  <div className="admin-wallet-card__actions">
                    <button
                      onClick={() => void runApprove(id)}
                      disabled={processing === id}
                      className="admin-action-btn admin-action-btn--approve"
                    >
                      {processing === id ? <Loader2 size={16} className="spinner" /> : <CheckCircle size={16} />}
                      Approve
                    </button>
                    <button
                      onClick={() => {
                        setError(null);
                        setRejectTarget(id);
                        setRejectReason("");
                      }}
                      disabled={processing === id}
                      className="admin-action-btn admin-action-btn--reject"
                    >
                      <XCircle size={16} />
                      Reject
                    </button>
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      )}

      {rejectTarget ? (
        <div className="admin-cac-reject">
          <strong>Reject CAC edit payment</strong>
          <p>This reason is shown to the business. It does not automatically refund Paystack or Safe Haven.</p>
          <textarea
            value={rejectReason}
            onChange={(event) => setRejectReason(event.target.value)}
            rows={3}
            placeholder="e.g. Receipt does not match the billed amount"
          />
          <div className="admin-wallet-card__actions">
            <button
              className="admin-action-btn admin-action-btn--reject"
              onClick={() => void submitReject()}
              disabled={processing === rejectTarget}
            >
              {processing === rejectTarget ? <Loader2 size={16} className="spinner" /> : <XCircle size={16} />}
              Confirm reject
            </button>
            <button
              className="admin-action-btn"
              onClick={() => {
                setRejectTarget(null);
                setRejectReason("");
              }}
              disabled={processing === rejectTarget}
            >
              Cancel
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default AdminCacEdits;
