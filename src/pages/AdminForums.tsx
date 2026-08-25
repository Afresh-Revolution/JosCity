import React, { useState, useEffect, useCallback } from "react";
import { Search, MessageSquare, Trash2, Loader2, AlertCircle, XCircle, ShieldOff, Shield } from "lucide-react";
import {
  getAdminForums,
  deleteAdminForum,
  setAdminForumSuspended,
  getAdminForumThreads,
  deleteAdminForumThread,
  type AdminForumRow,
  type AdminForumThreadRow,
  type AdminForumsResponse,
  type AdminForumThreadsResponse,
} from "../services/adminApi";
import "../main.css";
import "../scss/_admin.scss";

type ForumTab = "threads" | "groups";

const AdminForums: React.FC = () => {
  const [tab, setTab] = useState<ForumTab>("threads");
  const [forums, setForums] = useState<AdminForumRow[]>([]);
  const [threads, setThreads] = useState<AdminForumThreadRow[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
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

  const loadThreads = useCallback(
    async (opts?: { page?: number; search?: string }) => {
      const p = opts?.page ?? page;
      const searchStr = opts?.search !== undefined ? opts.search : appliedSearch;
      try {
        setLoading(true);
        setError(null);
        const response: AdminForumThreadsResponse = await getAdminForumThreads({
          page: p,
          limit: 20,
          search: searchStr.trim() || undefined,
        });
        setThreads(response.data || []);
        setTotalPages(response.pagination?.totalPages || 1);
      } catch (err) {
        console.error("Failed to load threads:", err);
        setThreads([]);
      } finally {
        setLoading(false);
      }
    },
    [page, appliedSearch]
  );

  useEffect(() => {
    if (tab === "threads") void loadThreads();
    else void loadForums();
  }, [tab, loadThreads, loadForums]);

  const runSearch = () => {
    const q = searchQuery.trim();
    setAppliedSearch(q);
    setPage(1);
    if (tab === "threads") void loadThreads({ page: 1, search: q });
    else void loadForums({ page: 1, search: q });
  };

  const handleDeleteForum = async (forumId: number) => {
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

  const handleDeleteThread = async (threadId: number) => {
    if (!window.confirm("Delete this discussion and all replies? This cannot be undone.")) return;
    try {
      setProcessing(`thread-${threadId}`);
      setError(null);
      setSuccess(null);
      const result = await deleteAdminForumThread(threadId);
      if (!result.success) {
        setError(result.message || "Failed to delete thread");
        return;
      }
      setSuccess("Thread deleted");
      setThreads((current) => current.filter((row) => row.id !== threadId));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete thread");
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

      <div className="admin-tabs">
        <button
          type="button"
          className={`admin-tab ${tab === "threads" ? "active" : ""}`}
          onClick={() => {
            setTab("threads");
            setPage(1);
            setSearchQuery("");
            setAppliedSearch("");
          }}
        >
          Discussions
        </button>
        <button
          type="button"
          className={`admin-tab ${tab === "groups" ? "active" : ""}`}
          onClick={() => {
            setTab("groups");
            setPage(1);
            setSearchQuery("");
            setAppliedSearch("");
          }}
        >
          Groups
        </button>
      </div>

      <div className="admin-dashboard__search">
        <Search size={18} />
        <input
          type="text"
          placeholder={
            tab === "threads"
              ? "Search threads by title, category, or author..."
              : "Search forums by name, description, or creator..."
          }
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") runSearch();
          }}
        />
        <button type="button" className="admin-pagination__btn" onClick={runSearch} disabled={loading}>
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
          <span>{tab === "threads" ? "Loading discussions..." : "Loading forums..."}</span>
        </div>
      ) : tab === "threads" ? (
        threads.length === 0 ? (
          <div className="admin-dashboard__empty-state">
            <MessageSquare size={48} />
            <p>No discussions found</p>
          </div>
        ) : (
          <>
            <div className="admin-groups-grid">
              {threads.map((thread) => (
                <div key={thread.id} className="admin-group-card">
                  <div className="admin-group-card__header">
                    {thread.author_picture && (
                      <img src={thread.author_picture} alt="" className="admin-group-card__image" />
                    )}
                    <div className="admin-group-card__info">
                      <h3>{thread.title}</h3>
                      <p className="admin-group-card__name">
                        {thread.category_name} · {thread.reply_count}{" "}
                        {thread.reply_count === 1 ? "reply" : "replies"}
                      </p>
                    </div>
                  </div>
                  <p
                    style={{
                      fontSize: "13px",
                      color: "var(--text-secondary)",
                      margin: "0 0 8px 0",
                      lineHeight: 1.5,
                    }}
                  >
                    {thread.body?.slice(0, 200)}
                    {(thread.body?.length || 0) > 200 ? "…" : ""}
                  </p>
                  <div
                    className="admin-group-card__details"
                    style={{ flexDirection: "column", alignItems: "flex-start", gap: 6 }}
                  >
                    <span>
                      <strong>Author:</strong> {thread.author_name}
                    </span>
                    <span>Posted: {formatDate(thread.created_at)}</span>
                  </div>
                  <div className="admin-group-card__actions" style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    <button
                      type="button"
                      onClick={() => void handleDeleteThread(thread.id)}
                      disabled={processing === `thread-${thread.id}`}
                      className="admin-action-btn admin-action-btn--delete"
                    >
                      {processing === `thread-${thread.id}` ? (
                        <Loader2 size={16} className="spinner" />
                      ) : (
                        <Trash2 size={16} />
                      )}
                      Delete thread
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
        )
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
                    <img src={forum.creator_picture} alt="" className="admin-group-card__image" />
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

                <div
                  className="admin-group-card__details"
                  style={{ flexDirection: "column", alignItems: "flex-start", gap: 6 }}
                >
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
                    onClick={() => void handleDeleteForum(forum.id)}
                    disabled={processing === `del-${forum.id}`}
                    className="admin-action-btn admin-action-btn--delete"
                  >
                    {processing === `del-${forum.id}` ? <Loader2 size={16} className="spinner" /> : <Trash2 size={16} />}
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
