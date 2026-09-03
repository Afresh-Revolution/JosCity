import { useCallback, useEffect, useState } from "react";
import {
  AlertCircle,
  BadgeCheck,
  CheckCircle,
  Loader2,
  Search,
  XCircle,
} from "lucide-react";
import {
  getAdminMemberships,
  hardCancelAdminMembership,
  type AdminMembershipRow,
} from "../services/adminApi";
import ConfirmationModal from "../components/ConfirmationModal";
import "../main.css";
import "../scss/_admin.scss";

function formatNaira(value?: number) {
  return `₦${Number(value || 0).toLocaleString("en-NG")}`;
}

function statusLabel(row: AdminMembershipRow) {
  if (row.status === "STOPPED") return "Stopped";
  if (row.status === "ACTIVE" && row.cancelled) return "Cancelling";
  if (row.status === "ACTIVE") return "Active";
  return "Expired";
}

const AdminMembershipList = () => {
  const [rows, setRows] = useState<AdminMembershipRow[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [pending, setPending] = useState<AdminMembershipRow | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(searchQuery.trim());
      setPage(1);
    }, 400);
    return () => window.clearTimeout(timer);
  }, [searchQuery]);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getAdminMemberships({
        search: debouncedSearch,
        status: statusFilter,
        page,
        limit: 20,
      });
      if (!response.success) {
        throw new Error(response.message || "Could not load memberships");
      }
      setRows(response.data || []);
      setTotal(Number(response.total || 0));
      setTotalPages(Number(response.total_pages || 1));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load memberships");
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, statusFilter, page]);

  useEffect(() => {
    void load();
  }, [load]);

  const confirmHardCancel = async () => {
    if (!pending) return;
    try {
      setProcessing(pending.user_id);
      setError(null);
      setSuccess(null);
      const result = await hardCancelAdminMembership(pending.user_id);
      if (!result.success) {
        throw new Error(result.message || "Could not stop membership");
      }
      setSuccess(
        result.message ||
          "Membership stopped. Discount and remaining cashback have ended."
      );
      setPending(null);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not stop membership");
    } finally {
      setProcessing(null);
    }
  };

  return (
    <div className="admin-dashboard">
      <div className="admin-dashboard__header">
        <h1>
          <BadgeCheck size={20} />
          Memberships
        </h1>
      </div>

      {error ? (
        <div className="admin-dashboard__message admin-dashboard__message--error">
          <AlertCircle size={18} />
          <span>{error}</span>
          <button type="button" onClick={() => setError(null)} aria-label="Dismiss error">
            <XCircle size={18} />
          </button>
        </div>
      ) : null}
      {success ? (
        <div className="admin-dashboard__message admin-dashboard__message--success">
          <CheckCircle size={18} />
          <span>{success}</span>
          <button type="button" onClick={() => setSuccess(null)} aria-label="Dismiss success">
            <XCircle size={18} />
          </button>
        </div>
      ) : null}

      <div className="admin-memberships__toolbar">
        <div className="admin-dashboard__search">
          <Search size={18} />
          <input
            type="search"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search name, email, or plan"
          />
        </div>
        <select
          className="admin-settings__input admin-memberships__filter"
          value={statusFilter}
          onChange={(event) => {
            setStatusFilter(event.target.value);
            setPage(1);
          }}
        >
          <option value="all">All statuses</option>
          <option value="active">Active</option>
          <option value="expired">Expired</option>
          <option value="stopped">Stopped by admin</option>
        </select>
      </div>

      <p className="admin-memberships__count">{total} membership{total === 1 ? "" : "s"}</p>

      {loading ? (
        <div className="admin-dashboard__loading">
          <Loader2 size={32} className="spinner" />
          <span className="admin-dashboard__loading-text">Loading memberships...</span>
        </div>
      ) : rows.length === 0 ? (
        <p className="admin-memberships__empty">No memberships match this filter.</p>
      ) : (
        <div className="admin-memberships__table-wrap">
          <table className="admin-memberships__table">
            <thead>
              <tr>
                <th>Member</th>
                <th>Plan</th>
                <th>Status</th>
                <th>Cashback sent</th>
                <th>Remaining</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.user_id}>
                  <td>
                    <strong>{row.name}</strong>
                    <span>{row.email || `User #${row.user_id}`}</span>
                  </td>
                  <td>
                    <strong>{row.package_title || row.package_id}</strong>
                    <span>
                      {formatNaira(row.amount)} · {row.josride_discount_percent}% off
                    </span>
                  </td>
                  <td>
                    <span
                      className={`admin-memberships__status admin-memberships__status--${row.status.toLowerCase()}`}
                    >
                      {statusLabel(row)}
                    </span>
                    <span>{row.expires_at ? `Until ${row.expires_at}` : "—"}</span>
                  </td>
                  <td>{formatNaira(row.cashback_sent)}</td>
                  <td>
                    {row.status === "STOPPED"
                      ? "Stopped"
                      : row.cashback_remaining_months > 0
                        ? `${row.cashback_remaining_months} month${
                            row.cashback_remaining_months === 1 ? "" : "s"
                          } · ${formatNaira(row.cashback_amount)} / 30 days`
                        : "None"}
                  </td>
                  <td>
                    {row.status === "STOPPED" ? (
                      <span className="admin-memberships__ended">Ended</span>
                    ) : (
                      <button
                        type="button"
                        className="admin-memberships__stop"
                        disabled={processing === row.user_id}
                        onClick={() => setPending(row)}
                      >
                        {processing === row.user_id ? (
                          <Loader2 size={14} className="spinner" />
                        ) : null}
                        Hard cancel
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {totalPages > 1 ? (
        <div className="admin-memberships__pager">
          <button
            type="button"
            disabled={page <= 1 || loading}
            onClick={() => setPage((current) => Math.max(1, current - 1))}
          >
            Previous
          </button>
          <span>
            Page {page} of {totalPages}
          </span>
          <button
            type="button"
            disabled={page >= totalPages || loading}
            onClick={() => setPage((current) => current + 1)}
          >
            Next
          </button>
        </div>
      ) : null}

      <ConfirmationModal
        isOpen={Boolean(pending)}
        onClose={() => setPending(null)}
        onConfirm={() => void confirmHardCancel()}
        title="Hard cancel this membership?"
        message={`This immediately stops ${pending?.name || "this member"}'s JosRide discount and remaining wallet cashback. Already credited cashback stays in their wallet.`}
        confirmText="Stop membership"
        cancelText="Keep benefits"
        type="warning"
        isLoading={processing != null}
      />
    </div>
  );
};

export default AdminMembershipList;
