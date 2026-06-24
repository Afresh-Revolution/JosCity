import React, { useEffect, useMemo, useState } from "react";
import { Code, ExternalLink } from "lucide-react";
import {
  DeveloperProfile,
  DeveloperPayload,
  developersApi,
} from "../services/developersApi";
import blessingImage from "../image/newsfeed/blessing.jpg";
import fallbackDeveloperImage from "../image/primary-logo.png";
import olaImage from "../image/newsfeed/Ola.jpeg";
import sandersonImage from "../image/newsfeed/Sanderson.jpeg";
import williamImage from "../image/newsfeed/William.jpeg";
import "../main.css";
import "../scss/_admin.scss";

const developerImages: Record<string, string> = {
  blessing: blessingImage,
  ola: olaImage,
  sanderson: sandersonImage,
  william: williamImage,
};

const emptyForm = {
  fullName: "",
  role: "",
  description: "",
  imageUrl: "",
  portfolioUrl: "",
  imageKey: "",
  sortOrder: 0,
  isActive: true,
};

const developerImage = (developer: DeveloperProfile) =>
  developer.imageUrl ||
  developerImages[developer.imageKey] ||
  fallbackDeveloperImage;

const AdminDevelopers: React.FC = () => {
  const [developers, setDevelopers] = useState<DeveloperProfile[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [editingId, setEditingId] = useState<string | number | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const selectedImagePreview = useMemo(
    () => (imageFile ? URL.createObjectURL(imageFile) : ""),
    [imageFile]
  );

  useEffect(() => {
    return () => {
      if (selectedImagePreview) URL.revokeObjectURL(selectedImagePreview);
    };
  }, [selectedImagePreview]);

  const loadDevelopers = async () => {
    try {
      setLoading(true);
      setMessage("");
      const data = await developersApi.getAdminDevelopers();
      setDevelopers(data);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to load developers.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDevelopers();
  }, []);

  const resetForm = () => {
    setForm(emptyForm);
    setImageFile(null);
    setEditingId(null);
  };

  const startEdit = (developer: DeveloperProfile) => {
    setEditingId(developer.id);
    setImageFile(null);
    setForm({
      fullName: developer.fullName,
      role: developer.role,
      description: developer.description,
      imageUrl: developer.imageUrl || "",
      portfolioUrl: developer.portfolioUrl || "",
      imageKey: developer.imageKey || "",
      sortOrder: developer.sortOrder || 0,
      isActive: developer.isActive ?? true,
    });
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setMessage("");

    if (!form.fullName.trim() || !form.role.trim() || !form.description.trim()) {
      setMessage("Please add full name, role, and description.");
      return;
    }

    const payload: DeveloperPayload = {
      fullName: form.fullName.trim(),
      role: form.role.trim(),
      description: form.description.trim(),
      imageUrl: form.imageUrl.trim(),
      portfolioUrl: form.portfolioUrl.trim(),
      imageKey: form.imageKey.trim(),
      sortOrder: Number(form.sortOrder) || 0,
      isActive: form.isActive,
      imageFile,
    };

    try {
      setSaving(true);
      if (editingId) {
        await developersApi.updateAdminDeveloper(editingId, payload);
        setMessage("Developer updated.");
      } else {
        await developersApi.createAdminDeveloper(payload);
        setMessage("Developer added.");
      }
      resetForm();
      await loadDevelopers();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to save developer.");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (developer: DeveloperProfile) => {
    if (!window.confirm(`Delete ${developer.fullName}?`)) return;

    try {
      await developersApi.deleteAdminDeveloper(developer.id);
      setMessage("Developer deleted.");
      if (editingId === developer.id) resetForm();
      await loadDevelopers();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to delete developer.");
    }
  };

  return (
    <div className="admin-dashboard admin-developers">
      <div className="admin-dashboard__header">
        <h1>
          <Code size={20} />
          Developers
        </h1>
      </div>

      <form onSubmit={submit} className="admin-panel-card admin-panel-card--form">
        <div className="admin-panel-grid">
          <label className="admin-panel-field" style={{ marginTop: 0 }}>
            Full Name
            <input
              className="admin-panel-input"
              value={form.fullName}
              onChange={(event) =>
                setForm((previous) => ({ ...previous, fullName: event.target.value }))
              }
              maxLength={160}
            />
          </label>

          <label className="admin-panel-field" style={{ marginTop: 0 }}>
            Role
            <input
              className="admin-panel-input"
              value={form.role}
              onChange={(event) =>
                setForm((previous) => ({ ...previous, role: event.target.value }))
              }
              maxLength={160}
            />
          </label>
        </div>

        <label className="admin-panel-field">
          Short Description
          <textarea
            className="admin-panel-textarea"
            rows={4}
            value={form.description}
            onChange={(event) =>
              setForm((previous) => ({ ...previous, description: event.target.value }))
            }
          />
        </label>

        <div className="admin-panel-grid">
          <label className="admin-panel-field" style={{ marginTop: 0 }}>
            Image URL
            <input
              className="admin-panel-input"
              value={form.imageUrl}
              onChange={(event) =>
                setForm((previous) => ({ ...previous, imageUrl: event.target.value }))
              }
              placeholder="https://..."
            />
          </label>

          <label className="admin-panel-field" style={{ marginTop: 0 }}>
            Upload Image
            <input
              className="admin-panel-input"
              type="file"
              accept="image/*"
              onChange={(event) => setImageFile(event.target.files?.[0] || null)}
            />
          </label>
        </div>

        <div className="admin-panel-grid">
          <label className="admin-panel-field" style={{ marginTop: 0 }}>
            Portfolio URL
            <input
              className="admin-panel-input"
              value={form.portfolioUrl}
              onChange={(event) =>
                setForm((previous) => ({ ...previous, portfolioUrl: event.target.value }))
              }
              placeholder="https://..."
            />
          </label>

          <label className="admin-panel-field" style={{ marginTop: 0 }}>
            Sort Order
            <input
              className="admin-panel-input"
              type="number"
              value={form.sortOrder}
              onChange={(event) =>
                setForm((previous) => ({
                  ...previous,
                  sortOrder: Number(event.target.value),
                }))
              }
            />
          </label>
        </div>

        {selectedImagePreview && (
          <div className="admin-developers__preview">
            <img src={selectedImagePreview} alt="Selected developer" />
            <button
              type="button"
              className="admin-panel-button admin-panel-button--ghost"
              onClick={() => setImageFile(null)}
            >
              Remove Image
            </button>
          </div>
        )}

        <div className="admin-panel-inline-options">
          <label className="admin-panel-check">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(event) =>
                setForm((previous) => ({ ...previous, isActive: event.target.checked }))
              }
            />
            Active on public contact modal
          </label>
        </div>

        <div className="admin-panel-actions">
          <button
            type="submit"
            disabled={saving}
            className="admin-panel-button admin-panel-button--primary"
          >
            {saving ? "Saving..." : editingId ? "Update Developer" : "Add Developer"}
          </button>
          {editingId && (
            <button
              type="button"
              onClick={resetForm}
              className="admin-panel-button admin-panel-button--secondary"
            >
              Cancel Edit
            </button>
          )}
        </div>

        {message && <p className="admin-panel-status">{message}</p>}
      </form>

      <div className="admin-panel-card">
        <h3 className="admin-panel-subtitle">Developer Profiles</h3>
        {loading ? (
          <p className="admin-panel-status">Loading developers...</p>
        ) : developers.length === 0 ? (
          <p className="admin-panel-status">No developers added yet.</p>
        ) : (
          <div className="admin-developers__grid">
            {developers.map((developer) => (
              <article key={developer.id} className="admin-developers__card">
                <img
                  className="admin-developers__avatar"
                  src={developerImage(developer)}
                  alt={developer.fullName}
                />
                <div className="admin-developers__body">
                  <div className="admin-developers__title-row">
                    <h4>{developer.fullName}</h4>
                    <span
                      className={`admin-developers__status ${
                        developer.isActive ? "admin-developers__status--active" : ""
                      }`}
                    >
                      {developer.isActive ? "Active" : "Hidden"}
                    </span>
                  </div>
                  <p className="admin-developers__role">{developer.role}</p>
                  <p className="admin-developers__description">
                    {developer.description}
                  </p>
                  {developer.portfolioUrl && (
                    <a
                      className="admin-developers__portfolio"
                      href={developer.portfolioUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Portfolio <ExternalLink size={14} />
                    </a>
                  )}
                  <div className="admin-panel-actions admin-panel-actions--compact">
                    <button
                      type="button"
                      onClick={() => startEdit(developer)}
                      className="admin-panel-button admin-panel-button--secondary"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => remove(developer)}
                      className="admin-panel-button admin-panel-button--danger"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDevelopers;
