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
        <div className="admin-signup-reports__table-wrap">
          <table className="admin-signup-reports__table">
            <thead>
              <tr>
                <th>Order</th>
                <th>People</th>
                <th>Amounts</th>
                <th>Request</th>
                <th>Decision</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const open = OPEN.has(row.status);
                return (
                  <tr key={row.id}>
                    <td>
                      <strong>{row.code}</strong>
                      <div>{row.title}</div>
                      <div>{row.status}</div>
                      <div>{when(row.created_at)}</div>
                    </td>
                    <td>
                      <div>{row.buyer_name}</div>
                      <div>{row.buyer_email}</div>
                      <div>{row.seller_name}</div>
                      <div>{row.seller_email}</div>
                    </td>
                    <td>
                      <div>Paid {naira(row.gross_naira)}</div>
                      <div>Fee {naira(row.service_fee_naira)} kept</div>
                      <div>Refundable {naira(row.refundable_naira)}</div>
                      {row.refunded_naira != null ? <div>Returned {naira(row.refunded_naira)}</div> : null}
                    </td>
                    <td>
                      <div>{row.reason}</div>
                      {row.dispute_reason ? <div>Dispute: {row.dispute_reason}</div> : null}
                      {row.admin_note ? <div>Note: {row.admin_note}</div> : null}
                    </td>
                    <td>
                      {open ? (
                        <div style={{ display: "grid", gap: 8, minWidth: 180 }}>
                          {activeId === row.id ? (
                            <>
                              <textarea
                                value={note}
                                onChange={(event) => setNote(event.target.value)}
                                placeholder="Reason for the customer and the business"
                                rows={3}
                              />
                              <input
                                value={percent}
                                onChange={(event) => setPercent(event.target.value)}
                                inputMode="numeric"
                                aria-label="Customer percentage"
                              />
                            </>
                          ) : null}
                          <button type="button" disabled={busyId === row.id} onClick={() => void decide(row, "approve")}>
                            {busyId === row.id ? "Working..." : "Approve refund"}
                          </button>
                          <button
                            type="button"
                            disabled={busyId === row.id}
                            onClick={() => {
                              if (activeId !== row.id) {
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
                            disabled={busyId === row.id}
                            onClick={() => {
                              if (activeId !== row.id) {
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
                            disabled={busyId === row.id}
                            onClick={() => {
                              if (activeId !== row.id) {
                                setActiveId(row.id);
                                setError("Write why the refund is not valid, then choose it again.");
                                return;
                              }
                              void decide(row, "reject");
                            }}
                          >
                            Refund not valid
                          </button>
                          {activeId !== row.id ? (
                            <button type="button" onClick={() => setActiveId(row.id)}>
                              Add a reason
                            </button>
                          ) : null}
                        </div>
                      ) : (
                        <span>{row.partial_percent ? `${row.partial_percent}% returned` : row.status}</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="admin-signup-reports__empty">No refund requests in this list.</p>
      )}
    </div>
  );
}
