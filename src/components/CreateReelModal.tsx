import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Loader2, Upload, Video, Image as ImageIcon, X } from "lucide-react";
import Avatar from "./Avatar";
import { REEL_CATEGORIES } from "../constants/reels";
import { reelsApi, ReelItem } from "../services/reelsApi";

interface CreateReelModalProps {
  isOpen: boolean;
  onClose: () => void;
  userName: string;
  userAvatar?: string;
  onCreated?: (reel: ReelItem) => void;
}

const MAX_VIDEO_SIZE = 100 * 1024 * 1024;
const MAX_THUMBNAIL_SIZE = 5 * 1024 * 1024;

const CreateReelModal: React.FC<CreateReelModalProps> = ({
  isOpen,
  onClose,
  userName,
  userAvatar,
  onCreated,
}) => {
  const [mounted, setMounted] = useState(false);
  const [title, setTitle] = useState("");
  const [caption, setCaption] = useState("");
  const [category, setCategory] = useState<string>("Others");
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [videoPreviewUrl, setVideoPreviewUrl] = useState<string | null>(null);
  const [thumbnailPreviewUrl, setThumbnailPreviewUrl] = useState<string | null>(
    null
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const thumbnailInputRef = useRef<HTMLInputElement>(null);
  const videoObjectUrlRef = useRef<string | null>(null);
  const thumbnailObjectUrlRef = useRef<string | null>(null);

  const revokePreviewUrl = (previewRef: React.MutableRefObject<string | null>) => {
    if (previewRef.current) {
      URL.revokeObjectURL(previewRef.current);
      previewRef.current = null;
    }
  };

  const resetForm = () => {
    setTitle("");
    setCaption("");
    setCategory("Others");
    setVideoFile(null);
    setThumbnailFile(null);
    setVideoPreviewUrl(null);
    setThumbnailPreviewUrl(null);
    setIsSubmitting(false);
    setError(null);
    revokePreviewUrl(videoObjectUrlRef);
    revokePreviewUrl(thumbnailObjectUrlRef);

    if (videoInputRef.current) {
      videoInputRef.current.value = "";
    }
    if (thumbnailInputRef.current) {
      thumbnailInputRef.current.value = "";
    }
  };

  useEffect(() => {
    setMounted(true);
    return () => {
      revokePreviewUrl(videoObjectUrlRef);
      revokePreviewUrl(thumbnailObjectUrlRef);
    };
  }, []);

  useEffect(() => {
    if (!isOpen) {
      document.body.style.overflow = "";
      return;
    }

    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const handleClose = () => {
    if (isSubmitting) {
      return;
    }

    resetForm();
    onClose();
  };

  const handleVideoSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const nextFile = event.target.files?.[0] || null;
    if (!nextFile) {
      return;
    }

    if (!nextFile.type.startsWith("video/")) {
      setError("Please choose a valid video file for your reel.");
      return;
    }

    if (nextFile.size > MAX_VIDEO_SIZE) {
      setError("Please choose a video smaller than 100MB.");
      return;
    }

    revokePreviewUrl(videoObjectUrlRef);
    const objectUrl = URL.createObjectURL(nextFile);
    videoObjectUrlRef.current = objectUrl;
    setVideoFile(nextFile);
    setVideoPreviewUrl(objectUrl);
    setError(null);
  };

  const handleThumbnailSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const nextFile = event.target.files?.[0] || null;
    if (!nextFile) {
      return;
    }

    if (!nextFile.type.startsWith("image/")) {
      setError("Please choose a valid image file for the thumbnail.");
      return;
    }

    if (nextFile.size > MAX_THUMBNAIL_SIZE) {
      setError("Please choose a thumbnail smaller than 5MB.");
      return;
    }

    revokePreviewUrl(thumbnailObjectUrlRef);
    const objectUrl = URL.createObjectURL(nextFile);
    thumbnailObjectUrlRef.current = objectUrl;
    setThumbnailFile(nextFile);
    setThumbnailPreviewUrl(objectUrl);
    setError(null);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!videoFile) {
      setError("Add a video to publish your reel.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const createdReel = await reelsApi.createReel({
        title,
        caption,
        category,
        video: videoFile,
        thumbnail: thumbnailFile,
      });

      onCreated?.(createdReel);
      resetForm();
      onClose();
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "We could not publish your reel."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOverlayClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget) {
      handleClose();
    }
  };

  if (!mounted || !isOpen) {
    return null;
  }

  const modalContent = (
    <div className="reel-create-modal-overlay" onClick={handleOverlayClick}>
      <div className="reel-create-modal" onClick={(event) => event.stopPropagation()}>
        <div className="reel-create-modal__header">
          <div>
            <h3 className="reel-create-modal__title">Create Reel</h3>
            <p className="reel-create-modal__subtitle">
              Upload a short vertical video for the reels feed.
            </p>
          </div>
          <button
            className="reel-create-modal__close"
            onClick={handleClose}
            aria-label="Close create reel modal"
            type="button"
          >
            <X size={22} />
          </button>
        </div>

        <form className="reel-create-modal__body" onSubmit={handleSubmit}>
          <div className="reel-create-modal__author">
            <Avatar
              src={userAvatar}
              name={userName}
              size={42}
              className="reel-create-modal__avatar"
            />
            <div>
              <p className="reel-create-modal__author-name">{userName}</p>
              <p className="reel-create-modal__author-note">
                This reel will publish to your reels feed.
              </p>
            </div>
          </div>

          <div className="reel-create-modal__grid">
            <label className="reel-create-modal__field">
              <span className="reel-create-modal__label">Title</span>
              <input
                type="text"
                className="reel-create-modal__input"
                placeholder="Give your reel a short title"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                maxLength={120}
              />
            </label>

            <label className="reel-create-modal__field">
              <span className="reel-create-modal__label">Category</span>
              <select
                className="reel-create-modal__select"
                value={category}
                onChange={(event) => setCategory(event.target.value)}
              >
                {REEL_CATEGORIES.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <label className="reel-create-modal__field">
            <span className="reel-create-modal__label">Caption</span>
            <textarea
              className="reel-create-modal__textarea"
              placeholder="Tell people what this reel is about"
              value={caption}
              onChange={(event) => setCaption(event.target.value)}
              rows={4}
              maxLength={500}
            />
          </label>

          <div className="reel-create-modal__uploads">
            <div className="reel-create-modal__upload-card">
              <div className="reel-create-modal__upload-header">
                <Video size={18} />
                <span>Reel Video</span>
              </div>
              {videoPreviewUrl ? (
                <video
                  src={videoPreviewUrl}
                  className="reel-create-modal__video-preview"
                  controls
                  playsInline
                />
              ) : (
                <button
                  type="button"
                  className="reel-create-modal__upload-dropzone"
                  onClick={() => videoInputRef.current?.click()}
                >
                  <Upload size={22} />
                  <span>Choose video</span>
                  <small>MP4, MOV, WebM up to 100MB</small>
                </button>
              )}
              <input
                ref={videoInputRef}
                type="file"
                accept="video/*"
                onChange={handleVideoSelect}
                hidden
              />
              {videoPreviewUrl && (
                <div className="reel-create-modal__upload-actions">
                  <button
                    type="button"
                    className="reel-create-modal__secondary-btn"
                    onClick={() => videoInputRef.current?.click()}
                  >
                    Replace video
                  </button>
                  <button
                    type="button"
                    className="reel-create-modal__secondary-btn"
                    onClick={() => {
                      revokePreviewUrl(videoObjectUrlRef);
                      setVideoFile(null);
                      setVideoPreviewUrl(null);
                      if (videoInputRef.current) {
                        videoInputRef.current.value = "";
                      }
                    }}
                  >
                    Remove
                  </button>
                </div>
              )}
            </div>

            <div className="reel-create-modal__upload-card">
              <div className="reel-create-modal__upload-header">
                <ImageIcon size={18} />
                <span>Thumbnail</span>
              </div>
              {thumbnailPreviewUrl ? (
                <img
                  src={thumbnailPreviewUrl}
                  alt="Reel thumbnail preview"
                  className="reel-create-modal__image-preview"
                />
              ) : (
                <button
                  type="button"
                  className="reel-create-modal__upload-dropzone reel-create-modal__upload-dropzone--thumbnail"
                  onClick={() => thumbnailInputRef.current?.click()}
                >
                  <Upload size={22} />
                  <span>Optional thumbnail</span>
                  <small>JPG or PNG up to 5MB</small>
                </button>
              )}
              <input
                ref={thumbnailInputRef}
                type="file"
                accept="image/*"
                onChange={handleThumbnailSelect}
                hidden
              />
              {thumbnailPreviewUrl && (
                <div className="reel-create-modal__upload-actions">
                  <button
                    type="button"
                    className="reel-create-modal__secondary-btn"
                    onClick={() => thumbnailInputRef.current?.click()}
                  >
                    Replace thumbnail
                  </button>
                  <button
                    type="button"
                    className="reel-create-modal__secondary-btn"
                    onClick={() => {
                      revokePreviewUrl(thumbnailObjectUrlRef);
                      setThumbnailFile(null);
                      setThumbnailPreviewUrl(null);
                      if (thumbnailInputRef.current) {
                        thumbnailInputRef.current.value = "";
                      }
                    }}
                  >
                    Remove
                  </button>
                </div>
              )}
            </div>
          </div>

          {error && (
            <div className="reel-create-modal__error" role="alert">
              {error}
            </div>
          )}

          <div className="reel-create-modal__footer">
            <button
              type="button"
              className="reel-create-modal__cancel-btn"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="reel-create-modal__submit-btn"
              disabled={!videoFile || isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={18} className="reel-create-modal__spinner" />
                  Publishing...
                </>
              ) : (
                "Publish Reel"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

export default CreateReelModal;
