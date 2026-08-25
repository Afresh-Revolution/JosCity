import { useCallback, useEffect, useState } from "react";
import {
  AlertCircle,
  CheckCircle,
  Loader2,
  MessageSquare,
  Plus,
  Star,
  Trash2,
  XCircle,
} from "lucide-react";
import {
  createSupportCategory,
  createSupportContact,
  deleteSupportCategory,
  deleteSupportContact,
  deleteSupportFeedback,
  deleteSupportProblem,
  getSupportAdmin,
  updateSupportProblem,
  updateSupportSettings,
  type SupportAdminData,
  type SupportSettings,
} from "../services/adminApi";
import AdminFaqs from "./AdminFaqs";
import "../main.css";
import "../scss/_admin.scss";

type Tab = "feedback" | "problems" | "faq" | "contacts";

const emptyData: SupportAdminData = {
  settings: {
    chat_hours: "",
    chat_url: "",
    member_guide_title: "Member guide",
    member_guide_url: "",
    member_guide_body: "",
  },
  contacts: [],
  faqs: [],
  categories: [],
  feedback: [],
  problems: [],
};

const AdminFeedback: React.FC = () => {
  const [tab, setTab] = useState<Tab>("feedback");
  const [data, setData] = useState<SupportAdminData>(emptyData);
  const [settings, setSettings] = useState<SupportSettings>(emptyData.settings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [contactForm, setContactForm] = useState({
    kind: "email" as "email" | "phone",
    label: "",
    value: "",
  });
  const [categoryLabel, setCategoryLabel] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getSupportAdmin();
      if (!response.success || !response.data) throw new Error("Could not load support data");
      setData(response.data);
      setSettings(response.data.settings);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load support data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const notice = (ok: string | null, fail?: string) => {
    setSuccess(ok);
    setError(fail || null);
  };

  const saveSettings = async () => {
    setSaving(true);
    notice(null);
    try {
      await updateSupportSettings(settings);
      notice("Support settings saved");
      await load();
    } catch (err) {
      notice(null, err instanceof Error ? err.message : "Could not save settings");
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (value: string) =>
    new Date(value).toLocaleString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  return (
    <div className="admin-dashboard">
      <div className="admin-dashboard__header">
        <h1>
          <MessageSquare size={20} />
          Feedback
        </h1>
      </div>
      <p style={{ marginTop: -8, marginBottom: 16, color: "var(--text-tertiary)" }}>
        App Help & support: member feedback, problem reports, FAQs, emails and phone numbers.
      </p>

      {error ? (
        <div className="admin-dashboard__message admin-dashboard__message--error">
          <AlertCircle size={18} />
          <span>{error}</span>
          <button onClick={() => setError(null)}>
            <XCircle size={18} />
          </button>
        </div>
      ) : null}
      {success ? (
        <div className="admin-dashboard__message admin-dashboard__message--success">
          <CheckCircle size={18} />
          <span>{success}</span>
          <button onClick={() => setSuccess(null)}>
            <XCircle size={18} />
          </button>
        </div>
      ) : null}

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 18 }}>
        {(
          [
            ["feedback", `Feedback (${data.feedback.length})`],
            ["problems", `Problems (${data.problems.length})`],
            ["faq", "FAQ"],
            ["contacts", "Contacts"],
          ] as Array<[Tab, string]>
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={`admin-sidebar-section-container__item ${
              tab === id ? "admin-sidebar-section-container__item--active" : ""
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="admin-dashboard__loading">
          <Loader2 className="admin-spin" size={22} />
          <span className="admin-dashboard__loading-text">Loading…</span>
        </div>
      ) : null}

      {!loading && tab === "feedback" ? (
        <div className="admin-panel-card">
          {!data.feedback.length ? (
            <p>No app feedback yet.</p>
          ) : (
            data.feedback.map((item) => (
              <div
                key={item.id}
                style={{
                  borderBottom: "1px solid var(--border-color, #e6e6e6)",
                  padding: "12px 0",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                  <div>
                    <strong>{item.member_name}</strong>
                    <div style={{ color: "var(--text-tertiary)", fontSize: 13 }}>
                      {item.user_email || "—"} · {formatDate(item.created_at)}
                    </div>
                    <div style={{ marginTop: 6 }}>
                      {Array.from({ length: 5 }).map((_, index) => (
                        <Star
                          key={index}
                          size={14}
                          fill={index < item.rating ? "#0F3D26" : "none"}
                          color="#0F3D26"
                        />
                      ))}
                    </div>
                    {item.comment ? <p style={{ marginTop: 8 }}>{item.comment}</p> : null}
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      if (!window.confirm("Delete this feedback?")) return;
                      void deleteSupportFeedback(item.id).then(load);
                    }}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      ) : null}

      {!loading && tab === "problems" ? (
        <div className="admin-panel-card">
          {!data.problems.length ? (
            <p>No problem reports yet.</p>
          ) : (
            data.problems.map((item) => (
              <div
                key={item.id}
                style={{
                  borderBottom: "1px solid var(--border-color, #e6e6e6)",
                  padding: "12px 0",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                  <div>
                    <strong>{item.category}</strong> · {item.status}
                    <div style={{ color: "var(--text-tertiary)", fontSize: 13 }}>
                      {item.member_name} · {item.user_email || "—"} · {formatDate(item.created_at)}
                    </div>
                    <p style={{ marginTop: 8 }}>{item.message}</p>
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button
                      type="button"
                      onClick={() =>
                        void updateSupportProblem(
                          item.id,
                          item.status === "resolved" ? "open" : "resolved"
                        ).then(load)
                      }
                    >
                      {item.status === "resolved" ? "Reopen" : "Resolve"}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (!window.confirm("Delete this report?")) return;
                        void deleteSupportProblem(item.id).then(load);
                      }}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      ) : null}

      {!loading && tab === "faq" ? <AdminFaqs embedded /> : null}

      {!loading && tab === "contacts" ? (
        <div>
          <form
            className="admin-panel-card admin-panel-card--form"
            onSubmit={(event) => {
              event.preventDefault();
              void saveSettings();
            }}
          >
            <h3>Hours, chat and member guide</h3>
            <label>
              Chat hours
              <input
                className="admin-panel-input"
                value={settings.chat_hours}
                onChange={(event) =>
                  setSettings((current) => ({ ...current, chat_hours: event.target.value }))
                }
              />
            </label>
            <label>
              Chat URL (optional WhatsApp / web chat)
              <input
                className="admin-panel-input"
                value={settings.chat_url}
                onChange={(event) =>
                  setSettings((current) => ({ ...current, chat_url: event.target.value }))
                }
              />
            </label>
            <label>
              Member guide title
              <input
                className="admin-panel-input"
                value={settings.member_guide_title}
                onChange={(event) =>
                  setSettings((current) => ({
                    ...current,
                    member_guide_title: event.target.value,
                  }))
                }
              />
            </label>
            <label>
              Member guide URL (optional)
              <input
                className="admin-panel-input"
                value={settings.member_guide_url}
                onChange={(event) =>
                  setSettings((current) => ({ ...current, member_guide_url: event.target.value }))
                }
              />
            </label>
            <label className="admin-panel-field">
              Member guide body
              <textarea
                className="admin-panel-textarea"
                rows={4}
                value={settings.member_guide_body}
                onChange={(event) =>
                  setSettings((current) => ({ ...current, member_guide_body: event.target.value }))
                }
              />
            </label>
            <button type="submit" disabled={saving}>
              Save settings
            </button>
          </form>

          <form
            className="admin-panel-card admin-panel-card--form"
            style={{ marginTop: 16 }}
            onSubmit={(event) => {
              event.preventDefault();
              if (!contactForm.value.trim()) {
                notice(null, "Enter an email or phone number");
                return;
              }
              void createSupportContact(contactForm)
                .then(() => {
                  setContactForm({ kind: contactForm.kind, label: "", value: "" });
                  notice("Contact added");
                  return load();
                })
                .catch((err) =>
                  notice(null, err instanceof Error ? err.message : "Could not add contact")
                );
            }}
          >
            <h3>Emails and phone numbers</h3>
            <label>
              Type
              <select
                className="admin-panel-input"
                value={contactForm.kind}
                onChange={(event) =>
                  setContactForm((current) => ({
                    ...current,
                    kind: event.target.value === "phone" ? "phone" : "email",
                  }))
                }
              >
                <option value="email">Email</option>
                <option value="phone">Phone</option>
              </select>
            </label>
            <label>
              Label
              <input
                className="admin-panel-input"
                value={contactForm.label}
                onChange={(event) =>
                  setContactForm((current) => ({ ...current, label: event.target.value }))
                }
                placeholder="Email support"
              />
            </label>
            <label>
              Value
              <input
                className="admin-panel-input"
                value={contactForm.value}
                onChange={(event) =>
                  setContactForm((current) => ({ ...current, value: event.target.value }))
                }
                placeholder="support@joscity.com"
              />
            </label>
            <button type="submit">
              <Plus size={16} /> Add contact
            </button>
            {data.contacts.map((item) => (
              <div key={item.id} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0" }}>
                <span>
                  {item.kind}: {item.label ? `${item.label} — ` : ""}
                  {item.value}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    if (!window.confirm("Remove this contact?")) return;
                    void deleteSupportContact(item.id).then(load);
                  }}
                >
                  Delete
                </button>
              </div>
            ))}
          </form>

          <form
            className="admin-panel-card admin-panel-card--form"
            style={{ marginTop: 16 }}
            onSubmit={(event) => {
              event.preventDefault();
              if (!categoryLabel.trim()) return;
              void createSupportCategory(categoryLabel.trim())
                .then(() => {
                  setCategoryLabel("");
                  notice("Category added");
                  return load();
                })
                .catch((err) =>
                  notice(null, err instanceof Error ? err.message : "Could not add category")
                );
            }}
          >
            <h3>Report-a-problem categories</h3>
            <label>
              New category
              <input
                className="admin-panel-input"
                value={categoryLabel}
                onChange={(event) => setCategoryLabel(event.target.value)}
              />
            </label>
            <button type="submit">Add category</button>
            {data.categories.map((item) => (
              <div key={item.id} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0" }}>
                <span>{item.label}</span>
                <button
                  type="button"
                  onClick={() => {
                    if (!window.confirm("Remove this category?")) return;
                    void deleteSupportCategory(item.id).then(load);
                  }}
                >
                  Delete
                </button>
              </div>
            ))}
          </form>
        </div>
      ) : null}
    </div>
  );
};

export default AdminFeedback;
