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
    action: "approve" | "reject" | "urge" | "partial"
  ) => {
    const reason = note.trim();
    if (action !== "approve" && reason.length < 12) {
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
                    <span>Transaction {when(row.transaction_at || row.created_at)}</span>
                    {row.transaction_at ? <span>Requested {when(row.created_at)}</span> : null}
                  </div>
                  <span className={`admin-refunds__status admin-refunds__status--${row.status}`}>
                    {row.status}
                  </span>
                </header>
                <RefundClock row={row} />
                <h2>{row.title}</h2>
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
                <p className="admin-refunds__reason">{row.reason}</p>
                {row.dispute_reason ? <p className="admin-refunds__note">Dispute: {row.dispute_reason}</p> : null}
                {row.admin_note ? <p className="admin-refunds__note">Note: {row.admin_note}</p> : null}
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
                    {row.partial_percent ? `${row.partial_percent}% returned` : row.status}
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
