import React, { useEffect, useMemo, useState } from "react";
import {
  deleteAdminNotification,
  getAdminNotifications,
  getUsers,
  sendAdminNotification,
  updateAdminNotification,
  type AdminNotificationItem,
} from "../services/adminApi";

type NotificationType = "normal" | "info" | "success" | "warning" | "danger";
type Audience = "all" | "personal" | "business" | "agent";

const AUDIENCE_LABEL: Record<Audience, string> = {
  all: "Everyone",
  personal: "Personal accounts",
  business: "Business accounts",
  agent: "Agents",
};

const TYPE_LABEL: Record<NotificationType, string> = {
  normal: "Normal",
  info: "Info",
  success: "Success",
  warning: "Warning",
  danger: "Danger alert",
};

function asAudience(value?: string | null): Audience {
  const audience = String(value || "all").toLowerCase();
  if (audience === "personal" || audience === "business" || audience === "agent") return audience;
  return "all";
}

function asType(value?: string | null): NotificationType {
  const type = String(value || "normal").toLowerCase();
  if (type === "info" || type === "success" || type === "warning" || type === "danger") return type;
  return "normal";
}

const AdminNotifications: React.FC = () => {
  const [target, setTarget] = useState<"all" | "user">("all");
  const [audience, setAudience] = useState<Audience>("all");
  const [userId, setUserId] = useState<string>("");
  const [recipientSearch, setRecipientSearch] = useState("");
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [notificationType, setNotificationType] = useState<NotificationType>("normal");
  const [showOnLanding, setShowOnLanding] = useState(false);
  const [expiresAt, setExpiresAt] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string>("");
  const [statusIsError, setStatusIsError] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [notifications, setNotifications] = useState<AdminNotificationItem[]>([]);
  const [users, setUsers] = useState<
    Array<{
      user_id: string;
      user_firstname?: string;
      user_lastname?: string;
      user_email?: string;
      account_type?: string;
    }>
  >([]);
  const [loadingList, setLoadingList] = useState(true);
  const [listError, setListError] = useState<string | null>(null);

  const loadData = async () => {
    setListError(null);
    setLoadingList(true);
    const settled = await Promise.allSettled([
      getAdminNotifications(100),
      getUsers({ page: 1, limit: 200 }),
    ]);

    const [notifResult, usersResult] = settled;

    if (notifResult.status === "fulfilled") {
      const data = notifResult.value;
      setNotifications(Array.isArray(data.data) ? data.data : []);
    } else {
      setNotifications([]);
      const err = notifResult.reason;
      const msg = err instanceof Error ? err.message : "Could not load announcements.";
      setListError(msg);
    }

    if (usersResult.status === "fulfilled") {
      const data = usersResult.value;
      setUsers(Array.isArray(data.data) ? data.data : []);
    } else {
      setUsers([]);
      const err = usersResult.reason;
      const msg = err instanceof Error ? err.message : "Could not load users for targeting.";
      setListError((prev) => (prev ? `${prev} ${msg}` : msg));
    }

    setLoadingList(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (notificationType === "danger" && target === "all" && audience === "all") {
      setShowOnLanding(true);
      return;
    }
    setShowOnLanding(false);
  }, [notificationType, target, audience]);

  const filteredUsers = useMemo(() => {
    const q = recipientSearch.trim().toLowerCase();
    const list = users.filter((user) => {
      if (audience === "all") return true;
      return String(user.account_type || "personal").toLowerCase() === audience;
    });
    const matched = !q
      ? list
      : list.filter((user) => {
          const fullName = [user.user_firstname, user.user_lastname].filter(Boolean).join(" ");
          return fullName.toLowerCase().includes(q) || (user.user_email || "").toLowerCase().includes(q);
        });
    return matched.slice(0, 30);
  }, [users, recipientSearch, audience]);

  const selectedUser = useMemo(
    () => users.find((user) => String(user.user_id) === userId),
    [users, userId]
  );

  const resetForm = () => {
    setTarget("all");
    setAudience("all");
    setUserId("");
    setRecipientSearch("");
    setTitle("");
    setMessage("");
    setNotificationType("normal");
    setShowOnLanding(false);
    setExpiresAt("");
    setEditingId(null);
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMessage("");
    setStatusIsError(false);

    if (!title.trim() || !message.trim()) {
      setStatusMessage("Title and message are required.");
      setStatusIsError(true);
      return;
    }
    if (target === "user" && !userId) {
      setStatusMessage("Please select a person in this audience.");
      setStatusIsError(true);
      return;
    }

    try {
      setIsSubmitting(true);
      const landing = notificationType === "danger" && target === "all" && audience === "all" && showOnLanding;
      if (editingId) {
        const response = await updateAdminNotification(editingId, {
          title: title.trim(),
          message: message.trim(),
          notification_type: notificationType,
          show_on_landing: landing,
          expires_at: expiresAt ? new Date(expiresAt).toISOString() : null,
        });
        setStatusMessage(response.message || "Announcement updated.");
      } else {
        const response = await sendAdminNotification({
          target,
          audience,
          user_id: target === "user" ? Number(userId) : undefined,
          title: title.trim(),
          message: message.trim(),
          notification_type: notificationType,
          show_on_landing: landing,
          expires_at: expiresAt ? new Date(expiresAt).toISOString() : null,
        });
        setStatusMessage(response.message || "Announcement published.");
      }
      resetForm();
      await loadData();
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : "Failed to publish announcement");
      setStatusIsError(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const startEdit = (item: AdminNotificationItem) => {
    setEditingId(item.id);
    setTarget(item.is_global ? "all" : "user");
    setAudience(asAudience(item.audience));
    setUserId(item.to_user_id ? String(item.to_user_id) : "");
    setTitle(item.title || "");
    setMessage(item.message || "");
    setNotificationType(asType(item.notification_type));
    setShowOnLanding(Boolean(item.show_on_landing));
    setExpiresAt(item.expires_at ? item.expires_at.slice(0, 16) : "");
    setRecipientSearch("");
  };

  const handleDelete = async (id: number) => {
    const ok = window.confirm("Delete this announcement?");
    if (!ok) return;
    try {
      const response = await deleteAdminNotification(id);
      setStatusMessage(response.message || "Announcement deleted.");
      setStatusIsError(false);
      await loadData();
      if (editingId === id) resetForm();
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : "Failed to delete announcement");
      setStatusIsError(true);
    }
  };

  return (
    <div className="admin-dashboard">
      <div className="admin-dashboard__header">
        <div>
          <h1>Announcements</h1>
          <p className="admin-panel-lede">
            Publish a Joscity announcement to an audience. People with the app get a push notification.
            Danger alerts use an alarm sound.
          </p>
        </div>
      </div>

      {listError && (
        <div className="admin-panel-card admin-panel-card--form" role="alert">
          <p className="admin-panel-status admin-panel-status--error">
            <strong>Could not load data.</strong> {listError}
          </p>
        </div>
      )}

      <form onSubmit={onSubmit} className="admin-panel-card admin-panel-card--form">
        <section className="admin-panel-section">
          <h2 className="admin-panel-section__title">Who receives it</h2>
          <p className="admin-panel-section__hint">
            Choose the account audience, then send it to everyone in that audience or one person.
          </p>
          <div className="admin-panel-grid">
            <label className="admin-panel-field" style={{ marginTop: 0 }}>
              Audience
              <select
                className="admin-panel-select"
                value={audience}
                disabled={Boolean(editingId)}
                onChange={(e) => {
                  setAudience(e.target.value as Audience);
                  setUserId("");
                }}
              >
                <option value="all">Everyone</option>
                <option value="personal">Personal accounts</option>
                <option value="business">Business accounts</option>
                <option value="agent">Agents</option>
              </select>
            </label>
            <label className="admin-panel-field" style={{ marginTop: 0 }}>
              Target
              <select
                className="admin-panel-select"
                value={target}
                disabled={Boolean(editingId)}
                onChange={(e) => setTarget(e.target.value as "all" | "user")}
              >
                <option value="all">Everyone in this audience</option>
                <option value="user">One person</option>
              </select>
            </label>
          </div>

          {target === "user" && (
            <div className="admin-panel-field">
              <label>
                Search by name or email
                <input
                  className="admin-panel-input"
                  value={recipientSearch}
                  disabled={Boolean(editingId)}
                  onChange={(e) => setRecipientSearch(e.target.value)}
                  placeholder="Type a name or email"
                />
              </label>
              <div className="admin-panel-user-pick">
                {filteredUsers.length === 0 ? (
                  <p className="admin-panel-status">No matching people in this audience.</p>
                ) : (
                  filteredUsers.map((user) => {
                    const fullName =
                      [user.user_firstname, user.user_lastname].filter(Boolean).join(" ") || "Unnamed";
                    const isSelected = String(user.user_id) === userId;
                    return (
                      <button
                        key={user.user_id}
                        type="button"
                        disabled={Boolean(editingId)}
                        className={`admin-panel-user-pick__row ${isSelected ? "admin-panel-user-pick__row--selected" : ""}`}
                        onClick={() => setUserId(String(user.user_id))}
                      >
                        <strong>{fullName}</strong>
                        <div className="admin-panel-user-pick__meta">
                          {user.user_email || `User #${user.user_id}`}
                          {user.account_type ? ` · ${user.account_type}` : ""}
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
              {selectedUser && (
                <small className="admin-panel-status">
                  Selected:{" "}
                  {[selectedUser.user_firstname, selectedUser.user_lastname].filter(Boolean).join(" ") ||
                    selectedUser.user_email ||
                    `User #${selectedUser.user_id}`}
                </small>
              )}
            </div>
          )}
        </section>

        <section className="admin-panel-section">
          <h2 className="admin-panel-section__title">What kind</h2>
          <p className="admin-panel-section__hint">
            Danger alerts arrive as a push notification with an alarm sound.
          </p>
          <div className="admin-panel-grid">
            <label className="admin-panel-field" style={{ marginTop: 0 }}>
              Type
              <select
                className="admin-panel-select"
                value={notificationType}
                onChange={(e) => setNotificationType(e.target.value as NotificationType)}
              >
                <option value="normal">Normal</option>
                <option value="info">Info</option>
                <option value="success">Success</option>
                <option value="warning">Warning</option>
                <option value="danger">Danger alert</option>
              </select>
            </label>
            <label className="admin-panel-field" style={{ marginTop: 0 }}>
              Expires at (optional)
              <input
                className="admin-panel-input"
                type="datetime-local"
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
              />
            </label>
          </div>
          {notificationType === "danger" && target === "all" && audience === "all" && (
            <label className="admin-panel-check" style={{ marginTop: "0.75rem" }}>
              <input
                type="checkbox"
                checked={showOnLanding}
                onChange={(e) => setShowOnLanding(e.target.checked)}
              />
              Show this danger alert on the public landing page
            </label>
          )}
        </section>

        <section className="admin-panel-section">
          <h2 className="admin-panel-section__title">Announcement</h2>
          <p className="admin-panel-section__hint">
            People see this from Joscity. The word Admin is not used on the notification.
          </p>
          <label className="admin-panel-field" style={{ marginTop: 0 }}>
            Title
            <input
              className="admin-panel-input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={255}
              placeholder="Short headline"
            />
          </label>
          <label className="admin-panel-field">
            Message
            <textarea
              className="admin-panel-textarea"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={5}
              placeholder="Full announcement"
            />
          </label>
        </section>

        <div className="admin-panel-actions">
          <button
            type="submit"
            disabled={isSubmitting}
            className="admin-panel-button admin-panel-button--primary"
          >
            {isSubmitting ? "Processing…" : editingId ? "Update announcement" : "Publish announcement"}
          </button>
          {editingId && (
            <button type="button" onClick={resetForm} className="admin-panel-button admin-panel-button--secondary">
              Cancel edit
            </button>
          )}
        </div>
        {statusMessage && (
          <p className={`admin-panel-status ${statusIsError ? "admin-panel-status--error" : ""}`}>{statusMessage}</p>
        )}
      </form>

      <div className="admin-panel-card">
        <h3 className="admin-panel-subtitle">Recent announcements</h3>
        {loadingList ? (
          <p className="admin-panel-status">Loading…</p>
        ) : notifications.length === 0 ? (
          <p className="admin-panel-status">
            {listError ? "No announcements loaded." : "No announcements yet."}
          </p>
        ) : (
          <div className="admin-panel-list">
            {notifications.map((item) => {
              const person =
                [item.user_firstname, item.user_lastname].filter(Boolean).join(" ") ||
                item.user_email ||
                (item.to_user_id ? `User #${item.to_user_id}` : "");
              return (
                <div key={item.id} className="admin-panel-list-item">
                  <strong>{item.title || "Announcement"}</strong>
                  <p className="admin-panel-list-content">{item.message || "—"}</p>
                  <small className="admin-panel-status">
                    <span className="admin-panel-badge">{AUDIENCE_LABEL[asAudience(item.audience)]}</span>
                    <span className="admin-panel-badge">{item.is_global ? "Everyone in audience" : person || "One person"}</span>
                    <span className="admin-panel-badge">{TYPE_LABEL[asType(item.notification_type)]}</span>
                    {item.show_on_landing ? <span className="admin-panel-badge">Landing page</span> : null}
                    {item.time ? new Date(item.time).toLocaleString() : ""}
                  </small>
                  <div className="admin-panel-actions admin-panel-actions--compact">
                    <button
                      type="button"
                      onClick={() => startEdit(item)}
                      className="admin-panel-button admin-panel-button--secondary"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(item.id)}
                      className="admin-panel-button admin-panel-button--danger"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminNotifications;
