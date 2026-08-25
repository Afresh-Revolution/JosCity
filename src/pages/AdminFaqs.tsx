import { useCallback, useEffect, useState } from "react";
import { HelpCircle, Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import {
  createSupportFaq,
  deleteSupportFaq,
  getSupportAdmin,
  updateSupportFaq,
  type SupportFaq,
} from "../services/adminApi";
import "../main.css";
import "../scss/_admin.scss";

type Props = {
  embedded?: boolean;
};

const emptyForm = {
  question: "",
  answer: "",
  published: true,
  sort_order: 0,
};

const AdminFaqs = ({ embedded = false }: Props) => {
  const [faqs, setFaqs] = useState<SupportFaq[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [editing, setEditing] = useState<SupportFaq | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getSupportAdmin();
      setFaqs(response.data?.faqs || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load common questions");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const resetForm = () => {
    setEditing(null);
    setForm(emptyForm);
  };

  const save = async () => {
    if (form.question.trim().length < 5 || form.answer.trim().length < 5) {
      setSuccess(null);
      setError("Enter a question and answer (at least 5 characters each).");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      if (editing) {
        await updateSupportFaq(editing.id, {
          question: form.question.trim(),
          answer: form.answer.trim(),
          published: form.published,
          sort_order: Number(form.sort_order) || 0,
        });
        setSuccess("Common question updated");
      } else {
        await createSupportFaq({
          question: form.question.trim(),
          answer: form.answer.trim(),
          published: form.published,
        });
        setSuccess("Common question added");
      }
      resetForm();
      await load();
    } catch (err) {
      setSuccess(null);
      setError(err instanceof Error ? err.message : "Could not save this question");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (item: SupportFaq) => {
    if (!window.confirm(`Delete “${item.question}”? This removes it from the app and website.`)) {
      return;
    }
    setDeletingId(item.id);
    setError(null);
    try {
      await deleteSupportFaq(item.id);
      if (editing?.id === item.id) resetForm();
      setSuccess("Common question deleted");
      await load();
    } catch (err) {
      setSuccess(null);
      setError(err instanceof Error ? err.message : "Could not delete this question");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className={embedded ? undefined : "admin-dashboard"}>
      {embedded ? null : (
        <div className="admin-dashboard__header">
          <h1>
            <HelpCircle size={20} />
            Common questions
          </h1>
        </div>
      )}
      {embedded ? null : (
        <p className="admin-panel-lede">
          These answers appear in the app Help & support screen and on the public website. Edit or
          delete a question here to update both.
        </p>
      )}

      {error ? <p className="admin-panel-status admin-panel-status--error">{error}</p> : null}
      {success ? <p className="admin-panel-status">{success}</p> : null}

      <form
        className="admin-panel-card admin-panel-card--form"
        onSubmit={(event) => {
          event.preventDefault();
          void save();
        }}
      >
        <h3 className="admin-panel-subtitle">{editing ? "Edit question" : "Add a question"}</h3>
        <label className="admin-panel-field">
          Question
          <input
            className="admin-panel-input"
            value={form.question}
            onChange={(event) =>
              setForm((current) => ({ ...current, question: event.target.value }))
            }
            placeholder="How do withdrawals work?"
          />
        </label>
        <label className="admin-panel-field">
          Answer
          <textarea
            className="admin-panel-textarea"
            rows={5}
            value={form.answer}
            onChange={(event) =>
              setForm((current) => ({ ...current, answer: event.target.value }))
            }
            placeholder="Write the answer members should see."
          />
        </label>
        <div className="admin-panel-inline-options">
          <label className="admin-panel-check">
            <input
              type="checkbox"
              checked={form.published}
              onChange={(event) =>
                setForm((current) => ({ ...current, published: event.target.checked }))
              }
            />
            Published on app and website
          </label>
          {editing ? (
            <label className="admin-panel-check">
              Sort
              <input
                className="admin-panel-input"
                type="number"
                style={{ width: 88, marginTop: 0 }}
                value={form.sort_order}
                onChange={(event) =>
                  setForm((current) => ({ ...current, sort_order: Number(event.target.value) }))
                }
              />
            </label>
          ) : null}
        </div>
        <div className="admin-panel-actions">
          <button
            type="submit"
            className="admin-panel-button admin-panel-button--primary"
            disabled={saving}
          >
            {saving ? (
              <Loader2 size={16} className="admin-spin" />
            ) : editing ? null : (
              <Plus size={16} />
            )}
            {editing ? "Update question" : "Add question"}
          </button>
          {editing ? (
            <button
              type="button"
              className="admin-panel-button admin-panel-button--secondary"
              onClick={resetForm}
            >
              Cancel
            </button>
          ) : null}
        </div>
      </form>

      <div className="admin-panel-card">
        <h3 className="admin-panel-subtitle">Published questions</h3>
        {loading ? (
          <p className="admin-panel-status">Loading…</p>
        ) : !faqs.length ? (
          <p className="admin-panel-status">No common questions yet.</p>
        ) : (
          faqs.map((item) => (
            <div key={item.id} className="admin-faq-row">
              <div>
                <strong>{item.question}</strong>
                {!item.published ? <span> · hidden</span> : null}
                <p>{item.answer}</p>
              </div>
              <div className="admin-panel-actions admin-panel-actions--compact">
                <button
                  type="button"
                  className="admin-panel-button admin-panel-button--secondary"
                  onClick={() => {
                    setEditing(item);
                    setForm({
                      question: item.question,
                      answer: item.answer,
                      published: item.published !== false,
                      sort_order: item.sort_order || 0,
                    });
                    setSuccess(null);
                    setError(null);
                  }}
                >
                  <Pencil size={14} />
                  Edit
                </button>
                <button
                  type="button"
                  className="admin-panel-button admin-panel-button--danger"
                  disabled={deletingId === item.id}
                  onClick={() => void remove(item)}
                >
                  {deletingId === item.id ? (
                    <Loader2 size={14} className="admin-spin" />
                  ) : (
                    <Trash2 size={14} />
                  )}
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default AdminFaqs;
