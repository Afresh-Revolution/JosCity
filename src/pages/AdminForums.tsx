import React, { useState, useEffect, useCallback } from "react";
import { Search, MessageSquare, Trash2, Loader2, AlertCircle, XCircle, ShieldOff, Shield } from "lucide-react";
import {
  getAdminForums,
  deleteAdminForum,
  setAdminForumSuspended,
  type AdminForumRow,
  type AdminForumsResponse,
} from "../services/adminApi";
import "../main.css";
import "../scss/_admin.scss";

const AdminForums: React.FC = () => {
  const [forums, setForums] = useState<AdminForumRow[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  /** Server-side filter; updated when user clicks Search */
  const [appliedSearch, setAppliedSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const loadForums = useCallback(
    async (opts?: { page?: number; search?: string }) => {
      const p = opts?.page ?? page;
      const searchStr = opts?.search !== undefined ? opts.search : appliedSearch;
      try {
        setLoading(true);
        setError(null);
        const response: AdminForumsResponse = await getAdminForums({
          page: p,
          limit: 20,
          search: searchStr.trim() || undefined,
        });
        setForums(response.data || []);
        setTotalPages(response.pagination?.totalPages || 1);
      } catch (err) {
        console.error("Failed to load forums:", err);
        setForums([]);
      } finally {
        setLoading(false);
      }
    },
    [page, appliedSearch]
  );

  useEffect(() => {
    void loadForums();
  }, [loadForums]);

  const handleDelete = async (forumId: number) => {
    if (!window.confirm("Delete this forum permanently? Members and messages will be removed.")) return;
    try {
      setProcessing(`del-${forumId}`);
      setError(null);
      setSuccess(null);
      await deleteAdminForum(forumId);
      setSuccess("Forum deleted");
      await loadForums({});
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete forum");
    } finally {
      setProcessing(null);
    }
  };

  const handleSuspend = async (forum: AdminForumRow) => {
    const next = !forum.suspended;
    try {
      setProcessing(`sus-${forum.id}`);
      setError(null);
      setSuccess(null);
      await setAdminForumSuspended(forum.id, next);
      setSuccess(next ? "Forum suspended" : "Forum reinstated");
      await loadForums({});
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update forum");
    } finally {
      setProcessing(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="admin-dashboard">
      <div className="admin-dashboard__header">
        <h1>
          <MessageSquare size={20} />
          Forums
        </h1>
      </div>

      <div className="admin-dashboard__search">
        <Search size={18} />
        <input
          type="text"
          placeholder="Search forums by name, description, or creator..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <button
          type="button"
          className="admin-pagination__btn"
          onClick={() => {
            const q = searchQuery.trim();
            setAppliedSearch(q);
            setPage(1);
            void loadForums({ page: 1, search: q });
          }}
          disabled={loading}
        >
          Search
        </button>
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
          <span>{success}</span>
          <button type="button" onClick={() => setSuccess(null)}>
            <XCircle size={18} />
          </button>
        </div>
      )}

      {loading ? (
        <div className="admin-dashboard__loading">
          <Loader2 size={32} className="spinner" />
          <span>Loading forums...</span>
        </div>
      ) : forums.length === 0 ? (
        <div className="admin-dashboard__empty-state">
          <MessageSquare size={48} />
          <p>No forums found</p>
        </div>
      ) : (
        <>
          <div className="admin-groups-grid">
            {forums.map((forum) => (
              <div key={forum.id} className="admin-group-card">
                <div className="admin-group-card__header">
                  {forum.creator_picture && (
                    <img
                      src={forum.creator_picture}
                      alt=""
                      className="admin-group-card__image"
                    />
                  )}
                  <div className="admin-group-card__info">
                    <h3>{forum.name}</h3>
                    <p className="admin-group-card__name">
                      {forum.visibility === "private" ? "Private" : "Public"} · {forum.member_count} members ·{" "}
                      {forum.category}
                    </p>
                  </div>
                </div>

                <p style={{ fontSize: "13px", color: "var(--text-secondary)", margin: "0 0 8px 0", lineHeight: 1.5 }}>
                  {forum.description?.slice(0, 200)}
                  {(forum.description?.length || 0) > 200 ? "…" : ""}
                </p>

                <div className="admin-group-card__details" style={{ flexDirection: "column", alignItems: "flex-start", gap: 6 }}>
                  <span>
                    <strong>Creator:</strong> {forum.creator_name}
                  </span>
                  <span>
                    <strong>Admins:</strong>{" "}
                    {forum.admins?.length ? forum.admins.map((a) => a.displayName).join(", ") : "—"}
                  </span>
                  <span>
                    Created: {formatDate(forum.created_at)}
                    {forum.suspended ? (
                      <span
                        style={{
                          marginLeft: 8,
                          padding: "2px 8px",
                          borderRadius: 6,
                          background: "rgba(180, 50, 50, 0.2)",
                          fontSize: 11,
                          fontWeight: 600,
                        }}
                      >
                        Suspended
                      </span>
                    ) : null}
                  </span>
                </div>

                <div className="admin-group-card__actions" style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <button
                    type="button"
                    onClick={() => void handleSuspend(forum)}
                    disabled={processing === `sus-${forum.id}`}
                    className="admin-action-btn"
                    style={{
                      border: "1px solid var(--border-color)",
                      background: "transparent",
                    }}
                  >
                    {processing === `sus-${forum.id}` ? (
                      <Loader2 size={16} className="spinner" />
                    ) : forum.suspended ? (
                      <Shield size={16} />
                    ) : (
                      <ShieldOff size={16} />
                    )}
                    {forum.suspended ? "Unsuspend" : "Suspend"}
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleDelete(forum.id)}
                    disabled={processing === `del-${forum.id}`}
                    className="admin-action-btn admin-action-btn--delete"
                  >
                    {processing === `del-${forum.id}` ? (
                      <Loader2 size={16} className="spinner" />
                    ) : (
                      <Trash2 size={16} />
                    )}
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="admin-pagination">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="admin-pagination__btn"
              >
                Previous
              </button>
              <span>
                Page {page} of {totalPages}
              </span>
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="admin-pagination__btn"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default AdminForums;
