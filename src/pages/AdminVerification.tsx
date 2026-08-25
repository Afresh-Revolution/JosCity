import React, { useState, useEffect } from "react";
import {
  CheckCircle,
  XCircle,
  Loader2,
  AlertCircle,
  Shield,
  User as UserIcon,
  Flag,
  Mail,
} from "lucide-react";
import {
  getVerificationRequests,
  approveVerification,
  rejectVerification,
  getVerifiedUsers,
  getVerifiedPages,
  removeVerification,
  type Page,
  type User,
  type VerificationRequest,
} from "../services/adminApi";
import "../main.css";
import "../scss/_admin.scss";

type Tab = "requests" | "users" | "pages";

type VerificationItem = VerificationRequest &
  Partial<User> &
  Partial<Page> & {
    node_id?: string | number;
    node_type?: string;
    page_admin?: string | number;
    page_name?: string;
    page_title?: string;
    page_picture?: string;
    page_registered?: string;
    created_at?: string;
  };

const firstText = (...values: unknown[]): string => {
  for (const value of values) {
    if (value == null) continue;
    const text = String(value).trim();
    if (text && text !== "undefined" && text !== "null") return text;
  }
  return "";
};

const firstId = (...values: unknown[]): string => firstText(...values);

const itemId = (item: VerificationItem, tab: Tab): string => {
  if (tab === "requests") {
    return firstId(item.request_id, item.node_id, item.page_id, item.user_id);
  }
  if (tab === "pages") {
    return firstId(item.page_id, item.node_id, item.page_admin);
  }
  return firstId(item.user_id, item.node_id);
};

const personName = (item: VerificationItem): string =>
  firstText(
    [item.user_firstname, item.user_lastname].filter(Boolean).join(" ").trim(),
    item.business_name,
    item.user_email
  );

const displayName = (item: VerificationItem, tab: Tab): string => {
  const isPage = tab === "pages" || item.node_type === "page";
  if (isPage) {
    return (
      firstText(item.page_title, item.page_name, item.business_name) ||
      (itemId(item, "pages") ? `Page #${itemId(item, "pages")}` : personName(item) || "Verified page")
    );
  }
  return (
    personName(item) ||
    (itemId(item, "users") ? `User #${itemId(item, "users")}` : "Verified user")
  );
};

const displayEmail = (item: VerificationItem): string =>
  firstText(item.user_email, item.business_email);

const displayPicture = (item: VerificationItem, tab: Tab): string =>
  tab === "pages" || item.node_type === "page"
    ? firstText(item.page_picture, item.user_picture)
    : firstText(item.user_picture);

const displayDate = (item: VerificationItem, tab: Tab): string =>
  firstText(
    item.submitted_at,
    tab === "pages" ? item.page_date : "",
    item.page_registered,
    item.user_registered,
    item.created_at
  );

const AdminVerification: React.FC = () => {
  const [items, setItems] = useState<VerificationItem[]>([]);
  const [activeTab, setActiveTab] = useState<Tab>("requests");
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    void loadData();
  }, [activeTab]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      if (activeTab === "requests") {
        const response = await getVerificationRequests();
        setItems((response.data || []) as VerificationItem[]);
      } else if (activeTab === "users") {
        const response = await getVerifiedUsers();
        setItems((response.data || []) as VerificationItem[]);
      } else {
        const response = await getVerifiedPages();
        setItems((response.data || []) as VerificationItem[]);
      }
    } catch (err) {
      console.error("Failed to load verification data:", err);
      setError(err instanceof Error ? err.message : "Failed to load data");
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (
    id: string,
    action: "approve" | "reject" | "remove",
    actionFn: (id: string) => Promise<unknown>
  ) => {
    if (!id) return;
    try {
      setProcessing(id);
      setError(null);
      setSuccess(null);
      await actionFn(id);
      setSuccess(
        action === "remove"
          ? "Verification removed"
          : `Verification ${action}d successfully`
      );
      await loadData();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : `Failed to ${action} verification`
      );
    } finally {
      setProcessing(null);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return "";
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="admin-dashboard">
      <div className="admin-dashboard__header">
        <h1>
          <Shield size={20} />
          Verification Management
        </h1>
      </div>

      <div className="admin-tabs">
        <button
          className={`admin-tab ${activeTab === "requests" ? "active" : ""}`}
          onClick={() => setActiveTab("requests")}
        >
          Pending Requests
        </button>
        <button
          className={`admin-tab ${activeTab === "users" ? "active" : ""}`}
          onClick={() => setActiveTab("users")}
        >
          Verified Users
        </button>
        <button
          className={`admin-tab ${activeTab === "pages" ? "active" : ""}`}
          onClick={() => setActiveTab("pages")}
        >
          Verified Pages
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
          <span>Loading verification data...</span>
        </div>
      ) : items.length === 0 ? (
        <div className="admin-dashboard__empty-state">
          <Shield size={48} />
          <p>
            {activeTab === "requests"
              ? "No pending verification requests"
              : `No verified ${activeTab}`}
          </p>
        </div>
      ) : (
        <div className="admin-verification-list">
          {items.map((item) => {
            const id = itemId(item, activeTab);
            const name = displayName(item, activeTab);
            const email = displayEmail(item);
            const picture = displayPicture(item, activeTab);
            const submitted = formatDate(displayDate(item, activeTab));
            const handle = firstText(item.page_name);
            const busy = processing === id;
            const entityLabel =
              activeTab === "pages" || item.node_type === "page"
                ? `Page #${id || "—"}`
                : `User #${id || "—"}`;

            return (
              <div key={`${activeTab}-${id}`} className="admin-verification-card">
                <div className="admin-verification-card__header">
                  <div className="admin-verification-card__avatar">
                    {picture ? (
                      <img src={picture} alt={name} />
                    ) : activeTab === "pages" ? (
                      <Flag size={22} />
                    ) : (
                      <UserIcon size={22} />
                    )}
                  </div>
                  <div className="admin-verification-card__info">
                    <h4>{name}</h4>
                    <div className="admin-verification-card__meta">
                      <span className="admin-verification-card__badge">
                        <Shield size={12} />
                        {activeTab === "requests" ? "Pending" : "Verified"}
                      </span>
                      <span>{entityLabel}</span>
                    </div>
                  </div>
                </div>

                <div className="admin-verification-card__details">
                  {handle && (activeTab === "pages" || item.node_type === "page") ? (
                    <div className="admin-verification-card__detail">
                      <span>@{handle}</span>
                    </div>
                  ) : null}
                  {email ? (
                    <div className="admin-verification-card__detail">
                      <Mail size={16} />
                      <span>{email}</span>
                    </div>
                  ) : null}
                  {submitted ? (
                    <div className="admin-verification-card__detail">
                      <span>
                        {activeTab === "requests" ? "Submitted" : activeTab === "pages" ? "Created" : "Joined"}: {submitted}
                      </span>
                    </div>
                  ) : null}
                </div>

                <div className="admin-verification-card__actions">
                  {activeTab === "requests" ? (
                    <>
                      <button
                        type="button"
                        onClick={() =>
                          void handleAction(id, "approve", approveVerification)
                        }
                        disabled={busy}
                        className="admin-action-btn admin-action-btn--approve"
                      >
                        {busy ? (
                          <Loader2 size={16} className="spinner" />
                        ) : (
                          <CheckCircle size={16} />
                        )}
                        Approve
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          void handleAction(id, "reject", rejectVerification)
                        }
                        disabled={busy}
                        className="admin-action-btn admin-action-btn--reject"
                      >
                        {busy ? (
                          <Loader2 size={16} className="spinner" />
                        ) : (
                          <XCircle size={16} />
                        )}
                        Reject
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={() =>
                        void handleAction(id, "remove", (removeId) =>
                          removeVerification(
                            activeTab === "users" ? "user" : "page",
                            removeId
                          )
                        )
                      }
                      disabled={busy}
                      className="admin-action-btn admin-action-btn--delete"
                    >
                      {busy ? (
                        <Loader2 size={16} className="spinner" />
                      ) : (
                        <XCircle size={16} />
                      )}
                      Remove Verification
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AdminVerification;
