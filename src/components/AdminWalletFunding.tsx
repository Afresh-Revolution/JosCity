import { useEffect, useState } from "react";
import {
  AlertCircle,
  Calendar,
  CheckCircle,
  Coins,
  DollarSign,
  Filter,
  Loader2,
  Save,
  TrendingDown,
  TrendingUp,
  User,
  Wallet,
  XCircle,
} from "lucide-react";
import {
  approveWalletPayment,
  getCbcQuote,
  getWalletPayments,
  rejectWalletPayment,
  updateCbcQuote,
  type CbcQuote,
  type WalletPaymentRequest,
} from "../services/adminApi";
import {
  DEFAULT_CBC_USD,
  nairaToCbc,
  quoteFromInputs,
} from "../utils/cbcQuote";

function isFundingRequest(payment: WalletPaymentRequest) {
  const type = String(payment.request_type || "funding").toLowerCase();
  return type === "funding";
}

export default function AdminWalletFunding() {
  const [payments, setPayments] = useState<WalletPaymentRequest[]>([]);
  const [statusFilter, setStatusFilter] = useState("pending");
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [quote, setQuote] = useState<CbcQuote | null>(null);
  const [cbcUsdText, setCbcUsdText] = useState(String(DEFAULT_CBC_USD));
  const [usdNgnText, setUsdNgnText] = useState("");
  const [savingQuote, setSavingQuote] = useState(false);
  const [rejectTarget, setRejectTarget] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  const applyQuote = (next: CbcQuote | null) => {
    setQuote(next);
    if (!next) return;
    setCbcUsdText(String(next.cbc_usd || DEFAULT_CBC_USD));
    setUsdNgnText(next.usd_ngn ? String(next.usd_ngn) : "");
  };

  const draftQuote = quoteFromInputs(
    Number(cbcUsdText.replace(/,/g, "")),
    usdNgnText.trim() ? Number(usdNgnText.replace(/,/g, "")) : quote?.usd_ngn || null
  );
  const activeQuote = quote?.admin_can_edit === false ? quote : { ...quote, ...draftQuote };
  const locked = quote?.admin_can_edit === false;

  const cbcOf = (payment: WalletPaymentRequest) => {
    if (Number(payment.cbc_amount) > 0 && quote && quote.admin_can_edit === false) {
      return Number(payment.cbc_amount);
    }
    return nairaToCbc(payment.amount, activeQuote);
  };

  const loadPayments = async () => {
    try {
      setLoading(true);
      setError(null);
      const [response, quoteResult] = await Promise.all([
        getWalletPayments(),
        getCbcQuote().catch(() => null),
      ]);
      const data = (response.data || []).filter(isFundingRequest);
      let resolved = quoteResult || response.quote || null;
      if (!resolved) {
        try {
          const fx = await fetch("https://open.er-api.com/v6/latest/USD", {
            signal: AbortSignal.timeout(8000),
          });
          const json = (await fx.json()) as { rates?: { NGN?: number } };
          const ngn = Number(json?.rates?.NGN);
          resolved = quoteFromInputs(
            DEFAULT_CBC_USD,
            Number.isFinite(ngn) && ngn > 0 ? ngn : null
          );
        } catch {
          resolved = quoteFromInputs(DEFAULT_CBC_USD, null);
        }
      }
      applyQuote(resolved);
      setPayments((prev) => {
        const incoming = data;
        const seen = new Set(incoming.map((row) => row.request_id));
        const kept = prev.filter(
          (row) =>
            (row.status === "approved" || row.status === "rejected") &&
            !seen.has(row.request_id)
        );
        return kept.length ? [...incoming, ...kept] : incoming;
      });
    } catch (err) {
      console.error("Failed to load funding requests:", err);
      setPayments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadPayments();
  }, []);

  const filtered =
    statusFilter === "all"
      ? payments
      : payments.filter((payment) => payment.status === statusFilter);

  const stats = {
    pending: payments.filter((p) => p.status === "pending").length,
    approved: payments.filter((p) => p.status === "approved").length,
    rejected: payments.filter((p) => p.status === "rejected").length,
    naira: payments.reduce((sum, p) => sum + (p.amount || 0), 0),
  };

  const handleApprove = async (id: string) => {
    try {
      setProcessing(id);
      setError(null);
      setSuccess(null);
      await approveWalletPayment(id);
      setPayments((prev) =>
        prev.map((payment) =>
          payment.request_id === id ? { ...payment, status: "approved" } : payment
        )
      );
      setStatusFilter("approved");
      setSuccess("Funding request approved");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to approve payment");
    } finally {
      setProcessing(null);
    }
  };

  const submitReject = async () => {
    if (!rejectTarget) return;
    const reason = rejectReason.trim();
    if (!reason) {
      setError("Enter a reason so the member knows why this was declined.");
      return;
    }
    try {
      setProcessing(rejectTarget);
      setError(null);
      await rejectWalletPayment(rejectTarget, reason);
      setPayments((prev) =>
        prev.map((payment) =>
          payment.request_id === rejectTarget
            ? { ...payment, status: "rejected" }
            : payment
        )
      );
      setRejectTarget(null);
      setRejectReason("");
      setStatusFilter("rejected");
      setSuccess("Funding request declined");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to reject payment");
    } finally {
      setProcessing(null);
    }
  };

  const saveQuote = async () => {
    const cbcUsd = Number(String(cbcUsdText).replace(/,/g, ""));
    if (!Number.isFinite(cbcUsd) || cbcUsd <= 0) {
      setError("Enter a CBC price in USD greater than 0.");
      return;
    }
    const usdNgnRaw = usdNgnText.trim().replace(/,/g, "");
    const usdNgn = usdNgnRaw ? Number(usdNgnRaw) : null;
    if (usdNgnRaw && (!Number.isFinite(usdNgn) || Number(usdNgn) <= 0)) {
      setError("USD to NGN rate must be greater than 0, or leave it blank to use the live rate.");
      return;
    }
    try {
      setSavingQuote(true);
      setError(null);
      applyQuote(await updateCbcQuote({ cbc_usd: cbcUsd, usd_ngn: usdNgn }));
      setSuccess("CBC price saved.");
      await loadPayments();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save CBC price");
    } finally {
      setSavingQuote(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return "—";
    return date.toLocaleString("en-NG", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatNaira = (amount: number) =>
    new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN" }).format(amount || 0);

  const formatCBC = (amount: number) =>
    new Intl.NumberFormat("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 4,
    }).format(amount || 0);

  const formatUsd = (amount: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 4,
    }).format(amount || 0);

  return (
    <>
      <section className="admin-cbc-quote">
        <div className="admin-cbc-quote__head">
          <h2>
            <Coins size={18} />
            Cbrilliance (CBC)
          </h2>
          <p>
            {locked
              ? "CBC price is coming from the Cbrilliance API."
              : "Set what 1 CBC costs in USD. Naira funding is converted with CBC = ₦ ÷ (USD price × USD/NGN)."}
          </p>
        </div>
        <div className="admin-cbc-quote__fields">
          <label className="admin-cbc-quote__field">
            <span>1 CBC in USD</span>
            <input
              type="number"
              min="0"
              step="0.01"
              value={cbcUsdText}
              disabled={locked || savingQuote}
              onChange={(event) => setCbcUsdText(event.target.value)}
            />
          </label>
          <label className="admin-cbc-quote__field">
            <span>USD to NGN</span>
            <input
              type="number"
              min="0"
              step="0.01"
              placeholder="Live rate if blank"
              value={usdNgnText}
              disabled={locked || savingQuote}
              onChange={(event) => setUsdNgnText(event.target.value)}
            />
          </label>
        </div>
        <div className="admin-cbc-quote__bar">
          <div>
            <span>1 CBC</span>
            <strong>
              {formatUsd(Number(activeQuote.cbc_usd || 0))}
              {activeQuote.cbc_ngn ? ` · ${formatNaira(activeQuote.cbc_ngn)}` : ""}
            </strong>
          </div>
          <div>
            <span>₦2,000 funding</span>
            <strong>
              {activeQuote.cbc_ngn ? `${formatCBC(nairaToCbc(2000, activeQuote))} CBC` : "—"}
            </strong>
          </div>
          <button
            type="button"
            className="admin-action-btn admin-action-btn--approve"
            onClick={() => void saveQuote()}
            disabled={locked || savingQuote}
          >
            {savingQuote ? <Loader2 size={16} className="spinner" /> : <Save size={16} />}
            Save price
          </button>
        </div>
        {quote?.api_configured && (
          <p className="admin-cbc-quote__source">
            Cbrilliance API env is set{quote.api_error ? ` (using admin price: ${quote.api_error})` : ""}.
          </p>
        )}
      </section>

      <div className="admin-wallet-stats">
        <div className="admin-wallet-stat-card">
          <div className="admin-wallet-stat-card__icon admin-wallet-stat-card__icon--pending">
            <Coins size={22} />
          </div>
          <div className="admin-wallet-stat-card__content">
            <div className="admin-wallet-stat-card__value">{stats.pending}</div>
            <div className="admin-wallet-stat-card__label">Pending</div>
          </div>
        </div>
        <div className="admin-wallet-stat-card">
          <div className="admin-wallet-stat-card__icon admin-wallet-stat-card__icon--approved">
            <TrendingUp size={22} />
          </div>
          <div className="admin-wallet-stat-card__content">
            <div className="admin-wallet-stat-card__value">{stats.approved}</div>
            <div className="admin-wallet-stat-card__label">Approved</div>
          </div>
        </div>
        <div className="admin-wallet-stat-card">
          <div className="admin-wallet-stat-card__icon admin-wallet-stat-card__icon--rejected">
            <TrendingDown size={22} />
          </div>
          <div className="admin-wallet-stat-card__content">
            <div className="admin-wallet-stat-card__value">{stats.rejected}</div>
            <div className="admin-wallet-stat-card__label">Rejected</div>
          </div>
        </div>
        <div className="admin-wallet-stat-card">
          <div className="admin-wallet-stat-card__icon admin-wallet-stat-card__icon--amount">
            <DollarSign size={22} />
          </div>
          <div className="admin-wallet-stat-card__content">
            <div className="admin-wallet-stat-card__value">{formatNaira(stats.naira)}</div>
            <div className="admin-wallet-stat-card__label">Total NGN</div>
          </div>
        </div>
        <div className="admin-wallet-stat-card admin-wallet-stat-card--highlight">
          <div className="admin-wallet-stat-card__icon admin-wallet-stat-card__icon--cbc">
            <Coins size={22} />
          </div>
          <div className="admin-wallet-stat-card__content">
            <div className="admin-wallet-stat-card__value">
              <span className="admin-wallet-stat-card__figure">
                {formatCBC(nairaToCbc(stats.naira, activeQuote))}
              </span>
              <span className="admin-wallet-stat-card__currency">CBC</span>
            </div>
            <div className="admin-wallet-stat-card__label">Total CBC</div>
          </div>
        </div>
      </div>

      <div className="admin-dashboard__filters">
        {["pending", "all", "approved", "rejected"].map((status) => (
          <button
            key={status}
            className={`admin-filter-btn ${statusFilter === status ? "active" : ""}`}
            onClick={() => setStatusFilter(status)}
          >
            {status === "pending" ? <Filter size={14} /> : null}
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </button>
        ))}
      </div>

      {error && (
        <div className="admin-dashboard__message admin-dashboard__message--error">
          <AlertCircle size={18} />
          <span>{error}</span>
          <button type="button" onClick={() => setError(null)}>
            <XCircle size={18} />
          </button>
        </div>
      )}

      {success && (
        <div className="admin-dashboard__message admin-dashboard__message--success">
          <CheckCircle size={18} />
          <span>{success}</span>
          <button type="button" onClick={() => setSuccess(null)}>
            <XCircle size={18} />
          </button>
        </div>
      )}

      {loading ? (
        <div className="admin-dashboard__loading">
          <Loader2 size={32} className="spinner" />
          <span>Loading funding requests...</span>
        </div>
      ) : filtered.length === 0 ? (
        <div className="admin-dashboard__empty-state">
          <Wallet size={48} />
          <p>No wallet funding requests{statusFilter !== "all" ? ` (${statusFilter})` : ""}</p>
        </div>
      ) : (
        <div className="admin-wallet-grid">
          {filtered.map((payment) => (
            <div key={payment.request_id} className="admin-wallet-card">
              <div className="admin-wallet-card__header admin-wallet-card__header--row">
                <div className="admin-wallet-card__icon">
                  <Wallet size={22} />
                </div>
                <div className="admin-wallet-card__amounts">
                  <div className="admin-wallet-card__amount-primary">
                    {formatNaira(payment.amount)}
                  </div>
                  <div className="admin-wallet-card__amount-secondary">
                    ≈ {formatCBC(cbcOf(payment))} CBC
                  </div>
                </div>
              </div>

              {payment.proof_url ? (
                <a
                  href={payment.proof_url}
                  target="_blank"
                  rel="noreferrer"
                  className="admin-cac-card__proof-link"
                >
                  <img src={payment.proof_url} alt="Transfer proof" className="admin-cac-card__proof" />
                </a>
              ) : null}

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
                  <span>{payment.method || "Bank transfer"}</span>
                </div>
                <div className="admin-wallet-card__status">
                  <span className={`badge badge--${payment.status}`}>{payment.status}</span>
                </div>
              </div>

              {payment.status === "pending" && (
                <div className="admin-wallet-card__actions">
                  <button
                    type="button"
                    onClick={() => void handleApprove(payment.request_id)}
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
                    type="button"
                    onClick={() => {
                      setRejectTarget(payment.request_id);
                      setRejectReason("");
                    }}
                    disabled={processing === payment.request_id}
                    className="admin-action-btn admin-action-btn--reject"
                  >
                    <XCircle size={16} />
                    Reject
                  </button>
                </div>
              )}

              {rejectTarget === payment.request_id && (
                <div className="admin-cac-reject">
                  <p>Why is this funding request being declined?</p>
                  <textarea
                    rows={3}
                    value={rejectReason}
                    onChange={(event) => setRejectReason(event.target.value)}
                    placeholder="Reason sent to the member"
                  />
                  <div className="admin-wallet-card__actions">
                    <button
                      type="button"
                      className="admin-action-btn admin-action-btn--reject"
                      onClick={() => void submitReject()}
                      disabled={processing === payment.request_id}
                    >
                      Confirm reject
                    </button>
                    <button
                      type="button"
                      className="admin-action-btn"
                      onClick={() => setRejectTarget(null)}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </>
  );
}
