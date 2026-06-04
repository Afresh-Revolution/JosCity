import React, { useState, useEffect, useRef } from "react";
import { Loader2, X } from "lucide-react";
import Avatar from "../../components/Avatar";
import { getUserAvatar, getProfileUsername } from "../../utils/userUtils";

interface CreateForumModalProps {
  isOpen: boolean;
  onClose: () => void;
  userName: string;
  userAvatar?: string;
  categories: string[];
  editingForum?: {
    id: number;
    name: string;
    description: string;
    category: string;
    backgroundColor?: string;
    backgroundImage?: string;
    backgroundOpacity?: number;
  } | null;
  onForum?: (forum: {
    name: string;
    description: string;
    category: string;
    visibility: "public" | "private";
    backgroundColor?: string;
    backgroundImage?: string;
    backgroundOpacity?: number;
  }) => void | Promise<void>;
  onEdit?: (
    forumId: number,
    forum: {
      name: string;
      description: string;
      category: string;
      backgroundColor?: string;
      backgroundImage?: string;
      backgroundOpacity?: number;
    }
  ) => void | Promise<void>;
}

const CreateForumModal: React.FC<CreateForumModalProps> = ({
  isOpen,
  onClose,
  userName,
  userAvatar,
  categories,
  editingForum,
  onForum,
  onEdit,
}) => {
  const [forumName, setForumName] = useState(editingForum?.name || "");
  const [description, setDescription] = useState(
    editingForum?.description || ""
  );
  const [selectedCategory, setSelectedCategory] = useState(
    editingForum?.category || "Others"
  );
  const [backgroundColor, setBackgroundColor] = useState(
    editingForum?.backgroundColor || "#f8f9fa"
  );
  const [backgroundImage, setBackgroundImage] = useState(
    editingForum?.backgroundImage || ""
  );
  const [backgroundOpacity, setBackgroundOpacity] = useState(
    editingForum?.backgroundOpacity ?? 0.5
  );
  const [visibility, setVisibility] = useState<"public" | "private">("public");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const backgroundImageInputRef = useRef<HTMLInputElement>(null);

  // Update form when editingForum changes
  useEffect(() => {
    if (editingForum) {
      setForumName(editingForum.name);
      setDescription(editingForum.description);
      setSelectedCategory(editingForum.category);
      setBackgroundColor(editingForum.backgroundColor || "#f8f9fa");
      setBackgroundImage(editingForum.backgroundImage || "");
      setBackgroundOpacity(editingForum.backgroundOpacity ?? 0.5);
    } else {
      setForumName("");
      setDescription("");
      setSelectedCategory("Others");
      setBackgroundColor("#f8f9fa");
      setBackgroundImage("");
      setBackgroundOpacity(0.5);
    }
    setError("");
  }, [editingForum]);

  const handleCreate = async () => {
    if (isSubmitting) return;
    // Validation
    if (!forumName.trim()) {
      setError("Forum name is required");
      return;
    }

    if (forumName.trim().length < 3) {
      setError("Forum name must be at least 3 characters");
      return;
    }

    if (!description.trim()) {
      setError("Description is required");
      return;
    }

    if (description.trim().length < 10) {
      setError("Description must be at least 10 characters");
      return;
    }

    setError("");

    try {
      setIsSubmitting(true);
      // Call the appropriate callback
      if (editingForum && onEdit) {
        await onEdit(editingForum.id, {
          name: forumName.trim(),
          description: description.trim(),
          category: selectedCategory,
          backgroundColor: backgroundColor.trim() || undefined,
          backgroundImage: backgroundImage.trim() || undefined,
          backgroundOpacity: backgroundImage.trim()
            ? backgroundOpacity
            : undefined,
        });
      } else if (onForum) {
        await onForum({
          name: forumName.trim(),
          description: description.trim(),
          category: selectedCategory,
          visibility,
          backgroundColor: backgroundColor.trim() || undefined,
          backgroundImage: backgroundImage.trim() || undefined,
          backgroundOpacity: backgroundImage.trim()
            ? backgroundOpacity
            : undefined,
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save forum");
      return;
    } finally {
      setIsSubmitting(false);
    }

    // Reset form (only if not editing)
    if (!editingForum) {
      setForumName("");
      setDescription("");
      setSelectedCategory("Others");
      setBackgroundColor("#f8f9fa");
      setBackgroundImage("");
      setBackgroundOpacity(0.5);
    }
    onClose();
  };

  const handleClose = () => {
    if (isSubmitting) return;
    setForumName("");
    setDescription("");
    setSelectedCategory("Others");
    setBackgroundColor("#f8f9fa");
    setBackgroundImage("");
    setBackgroundOpacity(0.5);
    setError("");
    onClose();
  };

  const handleBackgroundImageSelect = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setBackgroundImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Filter out "All" from categories for the select
  const categoryOptions = categories.filter((cat) => cat !== "All");

  if (!isOpen) return null;

  return (
    <div className="newsfeed-modal-overlay" onClick={handleClose}>
      <div className="newsfeed-modal" onClick={(e) => e.stopPropagation()}>
        <div className="newsfeed-modal__header">
          <h2 className="newsfeed-modal__title">
            {editingForum ? "Edit Forum" : "Create Forum"}
          </h2>
          <button
            className="newsfeed-modal__close"
            onClick={handleClose}
            disabled={isSubmitting}
          >
            <X size={24} />
          </button>
        </div>

        <div className="newsfeed-modal__content">
          <div className="newsfeed-modal__user-info">
            <Avatar
              src={userAvatar || getUserAvatar() || undefined}
              alt={userName || getProfileUsername()}
              name={userName || getProfileUsername()}
              size={48}
              className="newsfeed-modal__avatar"
            />
            <span className="newsfeed-modal__user-name">{userName || getProfileUsername()}</span>
          </div>

          {error && (
            <div
              style={{
                padding: "12px",
                backgroundColor: "#fee",
                color: "#c33",
                borderRadius: "8px",
                marginBottom: "16px",
                fontSize: "14px",
              }}
            >
              {error}
            </div>
          )}

          <div
            style={{ display: "flex", flexDirection: "column", gap: "16px" }}
          >
            <div>
              <label
                style={{
                  display: "block",
                  marginBottom: "8px",
                  fontSize: "14px",
                  fontWeight: "500",
                  color: "var(--text-primary)",
                }}
              >
                Forum Name *
              </label>
              <input
                type="text"
                placeholder="Enter forum name"
                value={forumName}
                onChange={(e) => {
                  setForumName(e.target.value);
                  setError("");
                }}
                style={{
                  width: "100%",
                  padding: "12px",
                  borderRadius: "8px",
                  border: "1px solid var(--border-color)",
                  fontSize: "14px",
                  backgroundColor: "var(--bg-secondary)",
                  color: "var(--text-primary)",
                  boxSizing: "border-box",
                }}
              />
            </div>

            <div>
              <label
                style={{
                  display: "block",
                  marginBottom: "8px",
                  fontSize: "14px",
                  fontWeight: "500",
                  color: "var(--text-primary)",
                }}
              >
                Category *
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                style={{
                  width: "100%",
                  padding: "12px",
                  borderRadius: "8px",
                  border: "1px solid var(--border-color)",
                  fontSize: "14px",
                  backgroundColor: "var(--bg-secondary)",
                  color: "var(--text-primary)",
                  boxSizing: "border-box",
                  cursor: "pointer",
                }}
              >
                {categoryOptions.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>

            {!editingForum && (
              <div>
                <label
                  style={{
                    display: "block",
                    marginBottom: "8px",
                    fontSize: "14px",
                    fontWeight: "500",
                    color: "var(--text-primary)",
                  }}
                >
                  Who can find &amp; join this forum? *
                </label>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "10px",
                    fontSize: "14px",
                    color: "var(--text-secondary)",
                  }}
                >
                  <label style={{ display: "flex", alignItems: "flex-start", gap: "10px", cursor: "pointer" }}>
                    <input
                      type="radio"
                      name="forum-visibility"
                      checked={visibility === "public"}
                      onChange={() => setVisibility("public")}
                    />
                    <span>
                      <strong style={{ color: "var(--text-primary)" }}>Public</strong> — listed for everyone; anyone can join.
                    </span>
                  </label>
                  <label style={{ display: "flex", alignItems: "flex-start", gap: "10px", cursor: "pointer" }}>
                    <input
                      type="radio"
                      name="forum-visibility"
                      checked={visibility === "private"}
                      onChange={() => setVisibility("private")}
                    />
                    <span>
                      <strong style={{ color: "var(--text-primary)" }}>Private</strong> — not listed; join via invite link or admin invite only.
                    </span>
                  </label>
                </div>
              </div>
            )}

            <div>
              <label
                style={{
                  display: "block",
                  marginBottom: "8px",
                  fontSize: "14px",
                  fontWeight: "500",
                  color: "var(--text-primary)",
                }}
              >
                Description *
              </label>
              <textarea
                placeholder="Describe what this forum is about..."
                value={description}
                onChange={(e) => {
                  setDescription(e.target.value);
                  setError("");
                }}
                rows={6}
                style={{
                  width: "100%",
                  padding: "12px",
                  borderRadius: "8px",
                  border: "1px solid var(--border-color)",
                  fontSize: "14px",
                  backgroundColor: "var(--bg-secondary)",
                  color: "var(--text-primary)",
                  boxSizing: "border-box",
                  fontFamily: "inherit",
                  resize: "vertical",
                }}
              />
            </div>

            <div>
              <label
                style={{
                  display: "block",
                  marginBottom: "8px",
                  fontSize: "14px",
                  fontWeight: "500",
                  color: "var(--text-primary)",
                }}
              >
                Chat Background Color
              </label>
              <div
                style={{
                  display: "flex",
                  gap: "12px",
                  alignItems: "center",
                }}
              >
                <input
                  type="color"
                  value={backgroundColor}
                  onChange={(e) => setBackgroundColor(e.target.value)}
                  style={{
                    width: "60px",
                    height: "40px",
                    borderRadius: "8px",
                    border: "1px solid var(--border-color)",
                    cursor: "pointer",
                  }}
                />
                <input
                  type="text"
                  placeholder="#f8f9fa"
                  value={backgroundColor}
                  onChange={(e) => setBackgroundColor(e.target.value)}
                  style={{
                    flex: 1,
                    padding: "12px",
                    borderRadius: "8px",
                    border: "1px solid var(--border-color)",
                    fontSize: "14px",
                    backgroundColor: "var(--bg-secondary)",
                    color: "var(--text-primary)",
                    boxSizing: "border-box",
                  }}
                />
              </div>
            </div>

            <div>
              <label
                style={{
                  display: "block",
                  marginBottom: "8px",
                  fontSize: "14px",
                  fontWeight: "500",
                  color: "var(--text-primary)",
                }}
              >
                Chat Background Image (optional)
              </label>
              <input
                type="file"
                ref={backgroundImageInputRef}
                accept="image/*"
                onChange={handleBackgroundImageSelect}
                style={{ display: "none" }}
              />
              <div
                style={{
                  display: "flex",
                  gap: "12px",
                  alignItems: "center",
                }}
              >
                <input
                  type="text"
                  placeholder="Image URL or upload file"
                  value={backgroundImage}
                  onChange={(e) => setBackgroundImage(e.target.value)}
                  style={{
                    flex: 1,
                    padding: "12px",
                    borderRadius: "8px",
                    border: "1px solid var(--border-color)",
                    fontSize: "14px",
                    backgroundColor: "var(--bg-secondary)",
                    color: "var(--text-primary)",
                    boxSizing: "border-box",
                  }}
                />
                <button
                  type="button"
                  onClick={() => backgroundImageInputRef.current?.click()}
                  style={{
                    padding: "12px 20px",
                    backgroundColor: "var(--bg-secondary)",
                    border: "1px solid var(--border-color)",
                    borderRadius: "8px",
                    fontSize: "14px",
                    color: "var(--text-primary)",
                    cursor: "pointer",
                  }}
                >
                  Upload
                </button>
              </div>
              {backgroundImage && (
                <div
                  style={{
                    marginTop: "8px",
                    padding: "8px",
                    borderRadius: "8px",
                    backgroundColor: "var(--bg-secondary)",
                    border: "1px solid var(--border-color)",
                  }}
                >
                  <img
                    src={backgroundImage}
                    alt="Preview"
                    style={{
                      maxWidth: "100%",
                      maxHeight: "150px",
                      borderRadius: "4px",
                    }}
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = "none";
                    }}
                  />
                </div>
              )}
              {backgroundImage && (
                <div style={{ marginTop: "8px" }}>
                  <label
                    style={{
                      display: "block",
                      marginBottom: "8px",
                      fontSize: "14px",
                      fontWeight: "500",
                      color: "var(--text-primary)",
                    }}
                  >
                    Background Image Opacity:{" "}
                    {Math.round(backgroundOpacity * 100)}%
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={backgroundOpacity}
                    onChange={(e) =>
                      setBackgroundOpacity(parseFloat(e.target.value))
                    }
                    style={{
                      width: "100%",
                      height: "8px",
                      borderRadius: "4px",
                      background: "var(--bg-secondary)",
                      outline: "none",
                      cursor: "pointer",
                    }}
                  />
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      fontSize: "12px",
                      color: "var(--text-tertiary)",
                      marginTop: "4px",
                    }}
                  >
                    <span>0%</span>
                    <span>100%</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="newsfeed-modal__footer">
          <button
            className="newsfeed-modal__cancel-btn"
            onClick={handleClose}
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            className="newsfeed-modal__post-btn"
            onClick={handleCreate}
            disabled={isSubmitting || !forumName.trim() || !description.trim()}
          >
            {isSubmitting ? (
              <>
                <Loader2 size={18} className="newsfeed-modal__spinner" />
                {editingForum ? "Saving..." : "Creating..."}
              </>
            ) : editingForum ? (
              "Save Changes"
            ) : (
              "Create Forum"
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateForumModal;
