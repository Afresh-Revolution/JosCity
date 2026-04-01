import React, { useEffect, useState } from "react";
import { newsApi, type NewsPost } from "../services/newsApi";

const toCsv = (values?: string[]) => (Array.isArray(values) ? values.join(", ") : "");
const fromCsv = (value: string) =>
  value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

const emptyForm = {
  title: "",
  content: "",
  imageUrls: "",
  videoUrls: "",
  sourceLinks: "",
  isPublished: true,
  isFeatured: false,
};

const AdminNews: React.FC = () => {
  const [items, setItems] = useState<NewsPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [videoFiles, setVideoFiles] = useState<File[]>([]);

  const loadNews = async () => {
    try {
      setLoading(true);
      const data = await newsApi.getAdminNews();
      setItems(data);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to load news posts.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNews();
  }, []);

  const resetForm = () => {
    setForm(emptyForm);
    setImageFiles([]);
    setVideoFiles([]);
    setEditingId(null);
  };

  const startEdit = (item: NewsPost) => {
    setEditingId(item.id);
    setForm({
      title: item.title,
      content: item.content,
      imageUrls: toCsv(item.image_urls),
      videoUrls: toCsv(item.video_urls),
      sourceLinks: toCsv(item.source_links),
      isPublished: Boolean(item.is_published),
      isFeatured: Boolean(item.is_featured),
    });
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");
    if (!form.title.trim() || !form.content.trim()) {
      setMessage("Please add both title and content.");
      return;
    }

    const payload = {
      title: form.title.trim(),
      content: form.content.trim(),
      image_urls: fromCsv(form.imageUrls),
      video_urls: fromCsv(form.videoUrls),
      source_links: fromCsv(form.sourceLinks),
      is_published: form.isPublished,
      is_featured: form.isFeatured,
      image_files: imageFiles,
      video_files: videoFiles,
    };

    try {
      setSaving(true);
      if (editingId) {
        await newsApi.updateAdminNews(editingId, payload);
        setMessage("News post updated.");
      } else {
        await newsApi.createAdminNews(payload);
        setMessage("News post created.");
      }
      resetForm();
      await loadNews();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to save news post.");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: number) => {
    if (!window.confirm("Delete this news post?")) return;
    try {
      await newsApi.deleteAdminNews(id);
      setMessage("News post deleted.");
      if (editingId === id) resetForm();
      await loadNews();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to delete news post.");
    }
  };

  const removeImageFile = (index: number) => {
    setImageFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const removeVideoFile = (index: number) => {
    setVideoFiles((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="admin-dashboard">
      <div className="admin-dashboard__header">
        <h1>News Management</h1>
      </div>

      <form onSubmit={submit} className="admin-panel-card admin-panel-card--form">
        <label>
          Title
          <input
            className="admin-panel-input"
            value={form.title}
            onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
            maxLength={255}
          />
        </label>

        <label className="admin-panel-field">
          Content
          <textarea
            className="admin-panel-textarea"
            rows={5}
            value={form.content}
            onChange={(e) => setForm((prev) => ({ ...prev, content: e.target.value }))}
          />
        </label>

        <label className="admin-panel-field">
          Existing image URLs (comma separated, optional)
          <input
            className="admin-panel-input"
            value={form.imageUrls}
            onChange={(e) => setForm((prev) => ({ ...prev, imageUrls: e.target.value }))}
          />
        </label>
        <label className="admin-panel-field">
          Upload Images (optional)
          <input
            className="admin-panel-input"
            type="file"
            accept="image/*"
            multiple
            onChange={(e) => setImageFiles(Array.from(e.target.files || []))}
          />
        </label>
        {imageFiles.length > 0 && (
          <div className="admin-panel-file-preview-group">
            <small>{imageFiles.length} image file(s) selected.</small>
            <div className="admin-panel-file-grid">
              {imageFiles.map((file, index) => {
                const preview = URL.createObjectURL(file);
                return (
                  <div key={`${file.name}-${index}`} className="admin-panel-file-card">
                    <img
                      src={preview}
                      alt={file.name}
                      className="admin-panel-file-preview-image"
                      onLoad={() => URL.revokeObjectURL(preview)}
                    />
                    <button
                      type="button"
                      onClick={() => removeImageFile(index)}
                      className="admin-panel-button admin-panel-button--ghost"
                    >
                      Remove
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <label className="admin-panel-field">
          Existing video URLs (comma separated, optional)
          <input
            className="admin-panel-input"
            value={form.videoUrls}
            onChange={(e) => setForm((prev) => ({ ...prev, videoUrls: e.target.value }))}
          />
        </label>
        <label className="admin-panel-field">
          Upload Videos (optional)
          <input
            className="admin-panel-input"
            type="file"
            accept="video/*"
            multiple
            onChange={(e) => setVideoFiles(Array.from(e.target.files || []))}
          />
        </label>
        {videoFiles.length > 0 && (
          <div className="admin-panel-file-preview-group">
            <small>{videoFiles.length} video file(s) selected.</small>
            <div className="admin-panel-file-grid">
              {videoFiles.map((file, index) => {
                const preview = URL.createObjectURL(file);
                return (
                  <div key={`${file.name}-${index}`} className="admin-panel-file-card admin-panel-file-card--video">
                    <video
                      src={preview}
                      className="admin-panel-file-preview-video"
                      controls
                      onLoadedData={() => URL.revokeObjectURL(preview)}
                    />
                    <button
                      type="button"
                      onClick={() => removeVideoFile(index)}
                      className="admin-panel-button admin-panel-button--ghost"
                    >
                      Remove
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <label className="admin-panel-field">
          Source Links (comma separated, optional)
          <input
            className="admin-panel-input"
            value={form.sourceLinks}
            onChange={(e) => setForm((prev) => ({ ...prev, sourceLinks: e.target.value }))}
          />
        </label>

        <div className="admin-panel-inline-options">
          <label className="admin-panel-check">
            <input
              type="checkbox"
              checked={form.isPublished}
              onChange={(e) => setForm((prev) => ({ ...prev, isPublished: e.target.checked }))}
            />
            Published
          </label>
          <label className="admin-panel-check">
            <input
              type="checkbox"
              checked={form.isFeatured}
              onChange={(e) => setForm((prev) => ({ ...prev, isFeatured: e.target.checked }))}
            />
            Featured in top updates
          </label>
        </div>

        <div className="admin-panel-actions">
          <button type="submit" disabled={saving} className="admin-panel-button admin-panel-button--primary">
            {saving ? "Saving..." : editingId ? "Update News" : "Create News"}
          </button>
          {editingId && (
            <button type="button" onClick={resetForm} className="admin-panel-button admin-panel-button--secondary">
              Cancel Edit
            </button>
          )}
        </div>
        {message && <p className="admin-panel-status">{message}</p>}
      </form>

      <div className="admin-panel-card">
        <h3 className="admin-panel-subtitle">Recent News Posts</h3>
        {loading ? (
          <p>Loading news posts...</p>
        ) : items.length === 0 ? (
          <p>No news posts yet.</p>
        ) : (
          <div className="admin-panel-list">
            {items.map((item) => (
              <div key={item.id} className="admin-panel-list-item">
                <strong>{item.title}</strong>
                <p className="admin-panel-list-content">
                  {item.content.slice(0, 150)}...
                </p>
                <small>
                  {item.is_published ? "Published" : "Draft"} |{" "}
                  {item.is_featured ? "Featured" : "Regular"} |{" "}
                  {new Date(item.created_at).toLocaleString()}
                </small>
                <div className="admin-panel-actions admin-panel-actions--compact">
                  <button type="button" onClick={() => startEdit(item)} className="admin-panel-button admin-panel-button--secondary">
                    Edit
                  </button>
                  <button type="button" onClick={() => remove(item.id)} className="admin-panel-button admin-panel-button--danger">
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

export default AdminNews;
