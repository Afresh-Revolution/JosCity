import React, { useState } from "react";
import {
  TrendingUp,
  Loader2,
  AlertCircle,
  XCircle,
  CheckCircle,
  Shield,
} from "lucide-react";
import { setUserBadgeColorByEmail } from "../services/adminApi";
import AdminBadgeColorField, {
  PURPLE_BADGE,
} from "../components/AdminBadgeColorField";
import "../main.css";
import "../scss/_admin.scss";

const AdminPro: React.FC = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [color, setColor] = useState(PURPLE_BADGE);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault();
    const trimmedName = name.trim();
    const trimmedEmail = email.trim();
    if (!trimmedName) {
      setError("Enter the account name");
      return;
    }
    if (!trimmedEmail) {
      setError("Enter the account email");
      return;
    }
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);
      const result = await setUserBadgeColorByEmail({
        name: trimmedName,
        email: trimmedEmail,
        badge_color: color,
      });
      if (!result.success) {
        throw new Error(result.message || "Failed to save badge color");
      }
      setSuccess(
        `Badge color updated for ${result.data?.name || trimmedName}`
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save badge color");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="admin-dashboard">
      <div className="admin-dashboard__header">
        <h1>
          <TrendingUp size={20} />
          Pro System
        </h1>
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

      <form className="admin-pro-badge-form" onSubmit={(event) => void handleSave(event)}>
        <div className="admin-pro-badge-form__intro">
          <Shield size={18} />
          <p>
            Enter a member's name and email, then pick a color for their name
            badge icon. No subscription is required.
          </p>
        </div>

        <label className="admin-pro-badge-form__field">
          Name
          <input
            type="text"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Full name or business name"
            disabled={saving}
            autoComplete="off"
          />
        </label>

        <label className="admin-pro-badge-form__field">
          Email
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="account@email.com"
            disabled={saving}
            autoComplete="off"
          />
        </label>

        <div className="admin-pro-badge-form__color">
          <span className="admin-pro-badge-form__label">Badge icon color</span>
          <AdminBadgeColorField
            value={color}
            onChange={setColor}
            disabled={saving}
            hint="Purple is the default special-account color. You can also type a hex code."
          />
        </div>

        <button
          type="submit"
          className="admin-action-btn admin-action-btn--primary"
          disabled={saving}
        >
          {saving ? <Loader2 size={16} className="spinner" /> : <Shield size={16} />}
          {saving ? "Saving..." : "Save badge color"}
        </button>
      </form>
    </div>
  );
};

export default AdminPro;
