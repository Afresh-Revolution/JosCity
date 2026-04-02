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

const AdminNotifications: React.FC = () => {
  const [target, setTarget] = useState<"all" | "user">("all");
  const [userId, setUserId] = useState<string>("");
  const [recipientSearch, setRecipientSearch] = useState("");
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [notificationType, setNotificationType] =
    useState<NotificationType>("normal");
  const [showOnLanding, setShowOnLanding] = useState(false);
  const [expiresAt, setExpiresAt] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string>("");
  const [statusIsError, setStatusIsError] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [notifications, setNotifications] = useState<AdminNotificationItem[]>([]);
  const [users, setUsers] = useState<
    Array<{ user_id: string; user_firstname?: string; user_lastname?: string; user_email?: string }>
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
      const msg =
        err instanceof Error ? err.message : "Could not load announcements.";
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
    if (notificationType !== "danger") {
      setShowOnLanding(false);
      return;
    }
    if (target === "all") {
      setShowOnLanding(true);
    } else {
      setShowOnLanding(false);
    }
  }, [notificationType, target]);

  const filteredUsers = useMemo(() => {
    const q = recipientSearch.trim().toLowerCase();
    const list = users.slice(0, 1000);
    if (!q) return list.slice(0, 30);
    return list
      .filter((u) => {
        const fullName = [u.user_firstname, u.user_lastname].filter(Boolean).join(" ");
        return fullName.toLowerCase().includes(q) || (u.user_email || "").toLowerCase().includes(q);
      })
      .slice(0, 30);
  }, [users, recipientSearch]);

  const selectedUser = useMemo(
    () => users.find((u) => String(u.user_id) === userId),
    [users, userId]
  );

  const resetForm = () => {
    setTarget("all");
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
      setStatusMessage("Please select a user.");
      setStatusIsError(true);
      return;
    }

    try {
      setIsSubmitting(true);
      if (editingId) {
        const response = await updateAdminNotification(editingId, {
          title: title.trim(),
          message: message.trim(),
          notification_type: notificationType,
          show_on_landing: notificationType === "danger" ? showOnLanding : false,
          expires_at: expiresAt ? new Date(expiresAt).toISOString() : null,
        });
        setStatusMessage(response.message || "Notification updated.");
      } else {
        const payload = {
          target,
          user_id: target === "user" ? Number(userId) : undefined,
          title: title.trim(),
          message: message.trim(),
          notification_type: notificationType,
          show_on_landing: notificationType === "danger" ? showOnLanding : false,
          expires_at: expiresAt ? new Date(expiresAt).toISOString() : null,
        } as const;
        const response = await sendAdminNotification(payload);
        setStatusMessage(response.message || "Notification sent.");
      }
      resetForm();
      await loadData();
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : "Failed to send notification");
      setStatusIsError(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const startEdit = (item: AdminNotificationItem) => {
    setEditingId(item.id);
    setTarget(item.is_global ? "all" : "user");
    setUserId(item.to_user_id ? String(item.to_user_id) : "");
    setTitle(item.title || "");
    setMessage(item.message || "");
    setNotificationType((item.notification_type as NotificationType) || "normal");
    setShowOnLanding(Boolean(item.show_on_landing));
    setExpiresAt("");
    setRecipientSearch("");
  };

  const handleDelete = async (id: number) => {
    const ok = window.confirm("Delete this admin notification?");
    if (!ok) return;
    try {
      const response = await deleteAdminNotification(id);
      setStatusMessage(response.message || "Notification deleted.");
      setStatusIsError(false);
      await loadData();
      if (editingId === id) resetForm();
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : "Failed to delete notification");
      setStatusIsError(true);
    }
  };

  return (
    <div className="admin-dashboard">
      <div className="admin-dashboard__header">
        <div>
          <h1>Announcements</h1>
          <p className="admin-panel-lede">
            Broadcast in-app announcements. Danger-type alerts can optionally appear on the public landing page when
            targeted to all users.
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
        <div className="admin-panel-grid">
          <label className="admin-panel-field" style={{ marginTop: 0 }}>
            Target
            <select
              className="admin-panel-select"
              value={target}
              disabled={Boolean(editingId)}
              onChange={(e) => setTarget(e.target.value as "all" | "user")}
            >
              <option value="all">All users</option>
              <option value="user">Single user</option>
            </select>
          </label>

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
              <option value="danger">Danger</option>
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

        {target === "user" && (
          <div className="admin-panel-field">
            <label>
              Search user by name or email
              <input
                className="admin-panel-input"
                value={recipientSearch}
                disabled={Boolean(editingId)}
                onChange={(e) => setRecipientSearch(e.target.value)}
                placeholder="Type a name or email"
              />
            </label>
            <div className="admin-panel-user-pick">
              {filteredUsers.map((u) => {
                const fullName = [u.user_firstname, u.user_lastname].filter(Boolean).join(" ") || "Unnamed";
                const isSelected = String(u.user_id) === userId;
                return (
                  <button
                    key={u.user_id}
                    type="button"
                    disabled={Boolean(editingId)}
                    className={`admin-panel-user-pick__row ${isSelected ? "admin-panel-user-pick__row--selected" : ""}`}
                    onClick={() => setUserId(String(u.user_id))}
                  >
                    <strong>{fullName}</strong>
                    <div className="admin-panel-user-pick__meta">
                      {u.user_email || `User #${u.user_id}`}
                    </div>
                  </button>
                );
              })}
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

        <label className="admin-panel-field">
          Title
          <input
            className="admin-panel-input"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={255}
          />
        </label>
        <label className="admin-panel-field">
          Message
          <textarea
            className="admin-panel-textarea"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={4}
          />
        </label>

        {notificationType === "danger" && target === "all" && (
          <label className="admin-panel-check" style={{ marginTop: "0.75rem" }}>
            <input
              type="checkbox"
              checked={showOnLanding}
              onChange={(e) => setShowOnLanding(e.target.checked)}
            />
            Show this danger alert on the landing page
          </label>
        )}

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
            {notifications.map((item) => (
              <div key={item.id} className="admin-panel-list-item">
                <strong>{item.title || "Notification"}</strong>
                <p className="admin-panel-list-content">{item.message || "—"}</p>
                <small className="admin-panel-status">
                  {item.is_global ? "All users" : `User #${item.to_user_id || "—"}`} · Type:{" "}
                  {item.notification_type || "normal"} · {new Date(item.time).toLocaleString()}
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
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminNotifications;
