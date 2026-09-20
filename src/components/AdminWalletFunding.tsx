import { useCallback, useEffect, useState } from "react";
import {
  AlertCircle,
  Banknote,
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
  getWithdrawSettings,
  rejectWalletPayment,
  updateWithdrawSettings,
  type CbcQuote,
  type WalletPaymentRequest,
  type WithdrawSettings,
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

function isWithdrawalRequest(payment: WalletPaymentRequest) {
  return String(payment.request_type || "").toLowerCase() === "withdrawal";
}

const EMPTY_WITHDRAW: WithdrawSettings = {
  min_amount: 100,
  max_amount: 2000000,
  daily_limit: 5000000,
  paystack_enabled: true,
  manual_enabled: true,
};

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
  const [rejectTarget, setRejectTarget] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [typeFilter, setTypeFilter] = useState<"funding" | "withdrawal">("funding");
  const [withdraw, setWithdraw] = useState<WithdrawSettings>(EMPTY_WITHDRAW);
  const [minText, setMinText] = useState("100");
  const [maxText, setMaxText] = useState("2000000");
  const [dailyText, setDailyText] = useState("5000000");
  const [savingWithdraw, setSavingWithdraw] = useState(false);

  const applyQuote = useCallback((next: CbcQuote | null) => {
    setQuote(next);
    if (!next) return;
    setCbcUsdText(String(next.cbc_usd || DEFAULT_CBC_USD));
    setUsdNgnText(next.usd_ngn ? String(next.usd_ngn) : "");
  }, []);

  const draftQuote = quoteFromInputs(
    Number(cbcUsdText.replace(/,/g, "")),
    usdNgnText.trim() ? Number(usdNgnText.replace(/,/g, "")) : quote?.usd_ngn || null
  );
  const activeQuote = quote || draftQuote;
  const locked = true;

  const cbcOf = (payment: WalletPaymentRequest) => {
    if (Number(payment.cbc_amount) > 0 && quote && quote.admin_can_edit === false) {
      return Number(payment.cbc_amount);
    }
    return nairaToCbc(payment.amount, activeQuote);
  };

  const loadPayments = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getWalletPayments();
      if (response.success === false || !Array.isArray(response.data)) {
        throw new Error("Could not load funding requests: invalid server response.");
      }
      const data = response.data;
      if (response.quote) applyQuote(response.quote);
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
      setError(err instanceof Error ? err.message : "Failed to load funding requests");
    } finally {
      setLoading(false);
    }
  }, [applyQuote]);

  useEffect(() => {
    void loadPayments();
  }, [loadPayments]);

  useEffect(() => {
    let active = true;
    void getWithdrawSettings().then((settings) => {
      if (!active) return;
      setWithdraw(settings);
      setMinText(String(settings.min_amount ?? EMPTY_WITHDRAW.min_amount));
      setMaxText(String(settings.max_amount ?? EMPTY_WITHDRAW.max_amount));
      setDailyText(String(settings.daily_limit ?? EMPTY_WITHDRAW.daily_limit));
    }).catch(() => { /* Keep the default settings visible if unavailable. */ });
    void getCbcQuote().then((next) => {
      if (active) applyQuote(next);
    }).catch(() => { /* Rates must not block the funding request list. */ });
    return () => { active = false; };
  }, [applyQuote]);

  const scoped = payments.filter((payment) =>
    typeFilter === "withdrawal" ? isWithdrawalRequest(payment) : isFundingRequest(payment)
  );
  const filtered =
    statusFilter === "all"
      ? scoped
      : scoped.filter((payment) => payment.status === statusFilter);

  const stats = {
    pending: scoped.filter((p) => p.status === "pending").length,
    approved: scoped.filter((p) => p.status === "approved").length,
    rejected: scoped.filter((p) => p.status === "rejected").length,
    naira: scoped.reduce((sum, p) => sum + (Number(p.amount) || 0), 0),
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
      setSuccess("Request approved");
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
      setSuccess("Request declined");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to reject payment");
    } finally {
      setProcessing(null);
    }
  };

  const saveWithdraw = async () => {
    const minAmount = Number(String(minText).replace(/,/g, ""));
    const maxAmount = Number(String(maxText).replace(/,/g, ""));
    const dailyLimit = Number(String(dailyText).replace(/,/g, ""));
    if (![minAmount, maxAmount, dailyLimit].every((value) => Number.isFinite(value) && value >= 0)) {
      setError("Enter valid naira amounts for the withdrawal limits.");
      return;
    }
    if (minAmount < 1) {
      setError("Minimum withdrawal must be at least ₦1.");
      return;
    }
    if (maxAmount < minAmount) {
      setError("Maximum withdrawal cannot be below the minimum.");
      return;
    }
    try {
      setSavingWithdraw(true);
      setError(null);
      const next = await updateWithdrawSettings({
        min_amount: minAmount,
        max_amount: maxAmount,
        daily_limit: dailyLimit,
        paystack_enabled: withdraw.paystack_enabled,
        manual_enabled: withdraw.manual_enabled,
      });
      setWithdraw(next);
      setMinText(String(next.min_amount));
      setMaxText(String(next.max_amount));
      setDailyText(String(next.daily_limit));
      setSuccess("Withdrawal limits saved.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save withdrawal limits");
    } finally {
      setSavingWithdraw(false);
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
            CBC rate is display only. Admins cannot edit this price.
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
              disabled={locked}
              readOnly
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
              disabled={locked}
              readOnly
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
        </div>
        {quote?.api_configured && (
          <p className="admin-cbc-quote__source">
            Cbrilliance API env is set{quote.api_error ? ` (using admin price: ${quote.api_error})` : ""}.
          </p>
        )}
      </section>

      <section className="admin-cbc-quote">
        <div className="admin-cbc-quote__head">
          <h2>
            <Banknote size={18} />
            Withdrawal limits
          </h2>
          <p>
            These limits apply to personal, agent, and business wallet withdrawals. Paystack
            sends money immediately; manual payouts wait for admin approval.
          </p>
        </div>
        <div className="admin-cbc-quote__fields">
          <label className="admin-cbc-quote__field">
            <span>Minimum (₦)</span>
            <input
              type="number"
              min="1"
              step="1"
              value={minText}
              disabled={savingWithdraw}
              onChange={(event) => setMinText(event.target.value)}
            />
          </label>
          <label className="admin-cbc-quote__field">
            <span>Maximum (₦)</span>
            <input
              type="number"
              min="1"
              step="1"
              value={maxText}
              disabled={savingWithdraw}
              onChange={(event) => setMaxText(event.target.value)}
            />
          </label>
          <label className="admin-cbc-quote__field">
            <span>Daily limit (₦)</span>
            <input
              type="number"
              min="0"
              step="1"
              value={dailyText}
              disabled={savingWithdraw}
              onChange={(event) => setDailyText(event.target.value)}
            />
          </label>
        </div>
        <div className="admin-cbc-quote__fields">
          <label className="admin-cbc-quote__field">
            <span>Paystack payouts</span>
            <input
              type="checkbox"
              checked={withdraw.paystack_enabled}
              disabled={savingWithdraw}
              onChange={(event) =>
                setWithdraw((current) => ({ ...current, paystack_enabled: event.target.checked }))
              }
            />
          </label>
          <label className="admin-cbc-quote__field">
            <span>Manual payouts</span>
            <input
              type="checkbox"
              checked={withdraw.manual_enabled}
              disabled={savingWithdraw}
              onChange={(event) =>
                setWithdraw((current) => ({ ...current, manual_enabled: event.target.checked }))
              }
            />
          </label>
        </div>
        <div className="admin-cbc-quote__bar">
          <div>
            <span>Paystack keys</span>
            <strong>{withdraw.paystack_configured ? "Configured on API" : "Missing on API"}</strong>
          </div>
          <div>
            <span>Per transaction</span>
            <strong>
              {formatNaira(Number(minText) || 0)} – {formatNaira(Number(maxText) || 0)}
            </strong>
          </div>
          <button
            type="button"
            className="admin-action-btn admin-action-btn--approve"
            onClick={() => void saveWithdraw()}
            disabled={savingWithdraw}
          >
            {savingWithdraw ? <Loader2 size={16} className="spinner" /> : <Save size={16} />}
            Save limits
          </button>
        </div>
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
        {(["funding", "withdrawal"] as const).map((type) => (
          <button
            key={type}
            className={`admin-filter-btn ${typeFilter === type ? "active" : ""}`}
            onClick={() => setTypeFilter(type)}
          >
            {type === "funding" ? "Funding" : "Withdrawals"}
          </button>
        ))}
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
          <button type="button" disabled={loading} onClick={() => void loadPayments()}>Retry</button>
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
          <span>Loading {typeFilter === "withdrawal" ? "withdrawals" : "funding requests"}...</span>
        </div>
      ) : filtered.length === 0 ? (
        <div className="admin-dashboard__empty-state">
          <Wallet size={48} />
          <p>
            No {typeFilter === "withdrawal" ? "withdrawal" : "wallet funding"} requests
            {statusFilter !== "all" ? ` (${statusFilter})` : ""}
          </p>
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
                  <span>{payment.method || (typeFilter === "withdrawal" ? "Payout" : "Bank transfer")}</span>
                </div>
                {typeFilter === "withdrawal" && payment.payout_destination ? (
                  <div className="admin-wallet-card__detail-item">
                    <Banknote size={16} />
                    <span>{payment.payout_destination}</span>
                  </div>
                ) : null}
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
