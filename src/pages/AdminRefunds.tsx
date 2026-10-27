import { useCallback, useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import {
  decideAdminRefund,
  getAdminRefunds,
  type AdminRefundRequest,
} from "../services/adminApi";
import "../main.css";
import "../scss/_admin.scss";

function naira(value?: number | null) {
  return `₦${Number(value || 0).toLocaleString("en-NG")}`;
}

function when(value?: string) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const OPEN = new Set(["pending", "disputed", "urged"]);
const WINDOW_MS = 48 * 60 * 60 * 1000;

function deadlineMs(row: { deadline_at?: string | null; created_at?: string | null }) {
  if (row.deadline_at) {
    const deadline = new Date(row.deadline_at).getTime();
    if (Number.isFinite(deadline)) return deadline;
  }
  const started = new Date(row.created_at || 0).getTime();
  if (!Number.isFinite(started) || started <= 0) return null;
  return started + WINDOW_MS;
}

function formatLeft(ms: number) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
}

function statusWord(status?: string | null) {
  const value = String(status || "").toLowerCase();
  if (value === "refund_pending") return "Queued with Paystack";
  if (value === "refund_processing") return "Paystack processing";
  if (value === "refund_failed") return "Paystack refund failed";
  if (value === "refund_needs_attention") return "Paystack review needed";
  if (value === "pending") return "Waiting";
  if (value === "urged") return "Asked to refund";
  if (value === "disputed") return "Disputed";
  if (value === "refunded") return "Refunded";
  if (value === "partial") return "Partial refund";
  if (value === "closed") return "Not valid";
  return value ? value.replace(/_/g, " ") : "Open";
}

function completionLabel(row: AdminRefundRequest) {
  const status = String(row.order_status || "").toLowerCase();
  if (status === "completed") return "Marked completed";
  if (status === "delivered") return "Marked delivered";
  if (row.fulfilled_at) return "Marked complete";
  if (status === "cancelled") return "Order cancelled";
  if (status === "out_for_delivery") return "Out for delivery";
  if (status === "processing") return "Still processing";
  if (status === "paid" || status === "confirmed") return "Paid, not completed";
  return "Not marked complete";
}

function RefundTimeline({ row }: { row: AdminRefundRequest }) {
  const steps: { label: string; at?: string | null; done: boolean }[] = [
    { label: "Customer paid", at: row.transaction_at, done: Boolean(row.transaction_at) },
    { label: completionLabel(row), at: row.fulfilled_at, done: Boolean(row.fulfilled_at) },
    { label: "Refund requested", at: row.created_at, done: Boolean(row.created_at) },
  ];
  if (row.dispute_reason) {
    steps.push({
      label: "Business disputed",
      at: row.status === "disputed" ? row.updated_at : null,
      done: true,
    });
  }
  if (row.status === "urged") {
    steps.push({ label: "JosCity asked the business to refund", at: row.updated_at, done: true });
  }
  if (row.resolved_at) {
    const label =
      row.status === "refunded"
        ? "Refund sent"
        : row.status === "partial"
          ? "Partial refund sent"
          : "Refund closed";
    steps.push({ label, at: row.resolved_at, done: true });
  }
  return (
    <ol className="admin-refunds__timeline">
      {steps.map((step) => (
        <li key={step.label} className={step.at ? "is-done" : step.done ? "is-noted" : "is-waiting"}>
          <span className="admin-refunds__dot" aria-hidden="true" />
          <div>
            <strong>{step.label}</strong>
            <span>{step.at ? when(step.at) : step.done ? "Recorded" : "Not yet"}</span>
          </div>
        </li>
      ))}
    </ol>
  );
}

function RefundClock({ row }: { row: AdminRefundRequest }) {
  const deadline = deadlineMs(row);
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    if (!deadline || !OPEN.has(row.status)) return;
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [deadline, row.status]);
  if (!deadline || !OPEN.has(row.status)) return null;
  const left = deadline - now;
  return (
    <p className="admin-refunds__clock">
      {left <= 0 ? "00:00:00 · Time is up" : `${formatLeft(left)} left of 48 hours`}
    </p>
  );
}

export default function AdminRefunds() {
  const [rows, setRows] = useState<AdminRefundRequest[]>([]);
  const [status, setStatus] = useState("open");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [note, setNote] = useState("");
  const [percent, setPercent] = useState("50");
  const [activeId, setActiveId] = useState<number | null>(null);

  const load = useCallback(async (next = status) => {
    setLoading(true);
    setError(null);
    try {
      const payload = await getAdminRefunds(next);
      if (!payload.success) throw new Error(payload.message || "Could not load refunds");
      setRows(Array.isArray(payload.data) ? payload.data : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load refunds");
    } finally {
      setLoading(false);
    }
  }, [status]);

  useEffect(() => {
    void load(status);
  }, [load, status]);

  const decide = async (
    row: AdminRefundRequest,
    action: "approve" | "reject" | "urge" | "partial" | "reconcile"
  ) => {
    const reason = note.trim();
    if (action !== "approve" && action !== "reconcile" && reason.length < 12) {
      setError("Add a short reason before you decide.");
      setActiveId(row.id);
      return;
    }
    setBusyId(row.id);
    setError(null);
    try {
      const payload = await decideAdminRefund(row.id, action, {
        note: reason,
        percent: action === "partial" ? Number(percent) : undefined,
      });
      if (!payload.success) throw new Error(payload.message || "Could not update this refund");
      setNote("");
      setActiveId(null);
      window.dispatchEvent(new Event("joscity-refunds-changed"));
      await load(status);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update this refund");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="admin-dashboard">
      <div className="admin-dashboard__header">
        <div>
          <h1>Refunds</h1>
          <p>Approve a refund now, ask the business to pay it, or split it.</p>
        </div>
      </div>

      <div className="admin-signup-reports__toolbar">
        <label className="admin-signup-reports__week-select">
          Show
          <select value={status} onChange={(event) => setStatus(event.target.value)}>
            <option value="open">Open</option>
            <option value="pending">Waiting</option>
            <option value="disputed">Disputed</option>
            <option value="urged">Asked to refund</option>
            <option value="refund_pending">Queued with Paystack</option>
            <option value="refund_processing">Paystack processing</option>
            <option value="refund_needs_attention">Paystack review needed</option>
            <option value="refund_failed">Paystack failed</option>
            <option value="refunded">Refunded</option>
            <option value="partial">Partial</option>
            <option value="closed">Closed</option>
            <option value="all">All</option>
          </select>
        </label>
      </div>

      {error ? (
        <div className="admin-dashboard__message admin-dashboard__message--error">{error}</div>
      ) : null}

      {loading ? (
        <div className="admin-dashboard__loading">
          <Loader2 className="spinner" size={18} />
          <span className="admin-dashboard__loading-text">Loading refunds...</span>
        </div>
      ) : rows.length ? (
        <div className="admin-refunds">
          {rows.map((row) => {
            const open = OPEN.has(row.status);
            const deciding = activeId === row.id;
            return (
              <article key={row.id} className="admin-refunds__card">
                <header className="admin-refunds__top">
                  <div>
                    <strong>{row.code}</strong>
                    <span>{row.title}</span>
                  </div>
                  <span className={`admin-refunds__status admin-refunds__status--${row.status}`}>
                    {statusWord(row.status)}
                  </span>
                </header>
                {row.refund_provider === "paystack" ? (
                  <p>Refund destination: customer payment method through Paystack.
                    {row.provider_refund_id ? ` Provider refund: ${row.provider_refund_id}.` : ""}
                    {row.status === "refund_needs_attention" || row.status === "refund_failed"
                      ? " Check the Paystack refund and reconcile its status before taking further action." : ""}
                    {row.settlement_reconciliation_required
                      ? " Reconcile this refund against the vendor settlement in Paystack; no vendor wallet debit was made." : ""}
                  </p>
                ) : null}
                {row.refund_provider === "paystack" && row.status.startsWith("refund_") ? (
                  <button type="button" disabled={busyId === row.id} onClick={() => void decide(row, "reconcile")}>Refresh Paystack status</button>
                ) : null}
                <RefundClock row={row} />
                <RefundTimeline row={row} />
                <dl className="admin-refunds__people">
                  <div>
                    <dt>Customer</dt>
                    <dd>
                      {row.buyer_name}
                      {row.buyer_email ? <span>{row.buyer_email}</span> : null}
                    </dd>
                  </div>
                  <div>
                    <dt>Business</dt>
                    <dd>
                      {row.seller_name}
                      {row.seller_email ? <span>{row.seller_email}</span> : null}
                    </dd>
                  </div>
                </dl>
                <dl className="admin-refunds__amounts">
                  <div>
                    <dt>Paid</dt>
                    <dd>{naira(row.gross_naira)}</dd>
                  </div>
                  <div>
                    <dt>Fee kept</dt>
                    <dd>{naira(row.service_fee_naira)}</dd>
                  </div>
                  <div>
                    <dt>Refundable</dt>
                    <dd>{naira(row.refundable_naira)}</dd>
                  </div>
                  {row.refunded_naira != null ? (
                    <div>
                      <dt>Returned</dt>
                      <dd>{naira(row.refunded_naira)}</dd>
                    </div>
                  ) : null}
                </dl>
                <div className="admin-refunds__reason">
                  <span>Customer reason</span>
                  <p>{row.reason}</p>
                </div>
                {row.dispute_reason ? (
                  <div className="admin-refunds__note">
                    <span>Business dispute</span>
                    <p>{row.dispute_reason}</p>
                  </div>
                ) : null}
                {row.admin_note ? (
                  <div className="admin-refunds__note">
                    <span>JosCity note</span>
                    <p>{row.admin_note}</p>
                  </div>
                ) : null}
                {open ? (
                  <div className="admin-refunds__actions">
                    {deciding ? (
                      <div className="admin-refunds__reason-form">
                        <label>
                          Reason for the customer and the business
                          <textarea
                            value={note}
                            onChange={(event) => setNote(event.target.value)}
                            rows={3}
                          />
                        </label>
                        <label>
                          Customer share (%)
                          <input
                            value={percent}
                            onChange={(event) => setPercent(event.target.value)}
                            inputMode="numeric"
                          />
                        </label>
                      </div>
                    ) : null}
                    <button
                      type="button"
                      className="admin-refunds__btn admin-refunds__btn--approve"
                      disabled={busyId === row.id}
                      onClick={() => void decide(row, "approve")}
                    >
                      {busyId === row.id ? "Working..." : "Approve refund"}
                    </button>
                    <button
                      type="button"
                      className="admin-refunds__btn"
                      disabled={busyId === row.id}
                      onClick={() => {
                        if (!deciding) {
                          setActiveId(row.id);
                          setError("Write why, then choose this decision again.");
                          return;
                        }
                        void decide(row, "urge");
                      }}
                    >
                      Ask business to refund
                    </button>
                    <button
                      type="button"
                      className="admin-refunds__btn"
                      disabled={busyId === row.id}
                      onClick={() => {
                        if (!deciding) {
                          setActiveId(row.id);
                          setError("Write why the split is fair, then choose it again.");
                          return;
                        }
                        void decide(row, "partial");
                      }}
                    >
                      Split {percent || "50"}%
                    </button>
                    <button
                      type="button"
                      className="admin-refunds__btn admin-refunds__btn--reject"
                      disabled={busyId === row.id}
                      onClick={() => {
                        if (!deciding) {
                          setActiveId(row.id);
                          setError("Write why the refund is not valid, then choose it again.");
                          return;
                        }
                        void decide(row, "reject");
                      }}
                    >
                      Refund not valid
                    </button>
                    {!deciding ? (
                      <button type="button" className="admin-refunds__btn admin-refunds__btn--quiet" onClick={() => setActiveId(row.id)}>
                        Add a reason
                      </button>
                    ) : null}
                  </div>
                ) : (
                  <p className="admin-refunds__closed">
                    {row.partial_percent && row.status === "partial"
                      ? `${row.partial_percent}% returned to the customer`
                      : statusWord(row.status)}
                  </p>
                )}
              </article>
            );
          })}
        </div>
      ) : (
        <p className="admin-signup-reports__empty">No refund requests in this list.</p>
      )}
    </div>
  );
}
