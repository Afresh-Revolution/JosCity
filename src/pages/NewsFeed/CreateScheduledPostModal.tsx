import React, { useState, useRef } from "react";
import {
  X,
  Image as ImageIcon,
  Video,
  Mic,
  Calendar,
  Clock,
} from "lucide-react";
import LazyImage from "../../components/LazyImage";
import {
  getUserAvatar,
  getUserInitials,
  getUserAccountType,
} from "../../utils/userUtils";
import {
  BusinessOfferRow,
  emptyOffer,
  offerPayload,
  type Offer,
  type CreatePostListingPayload,
} from "./CreatePostModal";

type MediaEntry = { file: File; previewUrl: string; offer: Offer };

interface CreateScheduledPostModalProps {
  isOpen: boolean;
  onClose: () => void;
  userName: string;
  userAvatar?: string;
  onSchedule?: (
    caption: string,
    images: File[] | null,
    videos: File[] | null,
    scheduledDate: string,
    scheduledTime: string,
    listingDetails?: CreatePostListingPayload | null
  ) => void | Promise<void>;
}

const MAX_IMAGES = 5;
const MAX_VIDEOS = 3;
const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const MAX_VIDEO_BYTES = 50 * 1024 * 1024;

const CreateScheduledPostModal: React.FC<CreateScheduledPostModalProps> = ({
  isOpen,
  onClose,
  userName,
  userAvatar,
  onSchedule,
}) => {
  const [caption, setCaption] = useState("");
  const [imageEntries, setImageEntries] = useState<MediaEntry[]>([]);
  const [videoEntries, setVideoEntries] = useState<MediaEntry[]>([]);
  const [textOffer, setTextOffer] = useState<Offer>(() => emptyOffer());
  const [scheduledDate, setScheduledDate] = useState("");
  const [scheduledTime, setScheduledTime] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  const businessListingFields =
    getUserAccountType().toLowerCase() === "business";

  const today = new Date().toISOString().split("T")[0];

  const resetForm = () => {
    imageEntries.forEach((e) => URL.revokeObjectURL(e.previewUrl));
    videoEntries.forEach((e) => URL.revokeObjectURL(e.previewUrl));
    setCaption("");
    setImageEntries([]);
    setVideoEntries([]);
    setTextOffer(emptyOffer());
    setScheduledDate("");
    setScheduledTime("");
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (videoInputRef.current) videoInputRef.current.value = "";
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const errors: string[] = [];
    const toAdd: MediaEntry[] = [];

    Array.from(files).forEach((file, index) => {
      if (!file.type.startsWith("image/")) {
        errors.push(`File ${index + 1} is not an image file.`);
        return;
      }
      if (file.size > MAX_IMAGE_BYTES) {
        errors.push(`Image ${index + 1} size must be less than 10MB.`);
        return;
      }
      if (imageEntries.length + toAdd.length >= MAX_IMAGES) {
        errors.push(`Maximum ${MAX_IMAGES} images allowed.`);
        return;
      }
      toAdd.push({
        file,
        previewUrl: URL.createObjectURL(file),
        offer: emptyOffer(),
      });
    });

    if (errors.length > 0) alert(errors.join("\n"));

    if (toAdd.length > 0) {
      setImageEntries((prev) => [...prev, ...toAdd]);
      setVideoEntries((prev) => {
        prev.forEach((x) => URL.revokeObjectURL(x.previewUrl));
        return [];
      });
      if (videoInputRef.current) videoInputRef.current.value = "";
    }

    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleVideoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const errors: string[] = [];
    const toAdd: MediaEntry[] = [];

    Array.from(files).forEach((file, index) => {
      if (!file.type.startsWith("video/")) {
        errors.push(`File ${index + 1} is not a video file.`);
        return;
      }
      if (file.size > MAX_VIDEO_BYTES) {
        errors.push(`Video ${index + 1} size must be less than 50MB.`);
        return;
      }
      if (videoEntries.length + toAdd.length >= MAX_VIDEOS) {
        errors.push(`Maximum ${MAX_VIDEOS} videos allowed.`);
        return;
      }
      toAdd.push({
        file,
        previewUrl: URL.createObjectURL(file),
        offer: emptyOffer(),
      });
    });

    if (errors.length > 0) alert(errors.join("\n"));

    if (toAdd.length > 0) {
      setVideoEntries((prev) => [...prev, ...toAdd]);
      setImageEntries((prev) => {
        prev.forEach((x) => URL.revokeObjectURL(x.previewUrl));
        return [];
      });
      if (fileInputRef.current) fileInputRef.current.value = "";
    }

    if (videoInputRef.current) videoInputRef.current.value = "";
  };

  const removeImage = (index: number) => {
    setImageEntries((prev) => {
      const entry = prev[index];
      if (entry) URL.revokeObjectURL(entry.previewUrl);
      return prev.filter((_, i) => i !== index);
    });
  };

  const removeVideo = (index: number) => {
    setVideoEntries((prev) => {
      const entry = prev[index];
      if (entry) URL.revokeObjectURL(entry.previewUrl);
      return prev.filter((_, i) => i !== index);
    });
  };

  const handleSchedule = async () => {
    if (
      !caption.trim() &&
      imageEntries.length === 0 &&
      videoEntries.length === 0
    ) {
      alert("Please add some content to your post.");
      return;
    }

    if (!scheduledDate || !scheduledTime) {
      alert("Please select both date and time for scheduling.");
      return;
    }

    const scheduledDateTime = new Date(`${scheduledDate}T${scheduledTime}`);
    const now = new Date();

    if (scheduledDateTime <= now) {
      alert("Please select a date and time in the future.");
      return;
    }

    const minAhead = new Date(now.getTime() + 60 * 1000);
    if (scheduledDateTime < minAhead) {
      alert("Please schedule at least one minute from now.");
      return;
    }

    if (onSchedule) {
      setIsSubmitting(true);
      try {
        let listingDetails: CreatePostListingPayload | null = null;
        if (businessListingFields) {
          const textP = offerPayload(textOffer);
          const byMediaIndex = [
            ...imageEntries.map((e) => offerPayload(e.offer)),
            ...videoEntries.map((e) => offerPayload(e.offer)),
          ];
          const hasMedia = byMediaIndex.some((x) => x !== null);
          if (textP || hasMedia) {
            listingDetails = {};
            if (textP) listingDetails.text = textP;
            if (hasMedia) listingDetails.byMediaIndex = byMediaIndex;
          }
        }
        await onSchedule(
          caption,
          imageEntries.length > 0 ? imageEntries.map((e) => e.file) : null,
          videoEntries.length > 0 ? videoEntries.map((e) => e.file) : null,
          scheduledDate,
          scheduledTime,
          listingDetails
        );
        resetForm();
        onClose();
      } catch {
        // Parent shows error; keep modal open
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="newsfeed-modal-overlay" onClick={handleClose}>
      <div className="newsfeed-modal" onClick={(e) => e.stopPropagation()}>
        <div className="newsfeed-modal__header">
          <h2 className="newsfeed-modal__title">Schedule Post</h2>
          <button className="newsfeed-modal__close" onClick={handleClose}>
            <X size={24} />
          </button>
        </div>

        <div className="newsfeed-modal__content">
          <div className="newsfeed-modal__user-info">
            {(() => {
              const avatarUrl = userAvatar || getUserAvatar();
              if (avatarUrl) {
                return (
                  <LazyImage
                    src={avatarUrl}
                    alt={userName}
                    className="newsfeed-modal__avatar"
                  />
                );
              }
              return (
                <div className="newsfeed-modal__avatar newsfeed-modal__avatar--initials">
                  <span>{getUserInitials()}</span>
                </div>
              );
            })()}
            <span className="newsfeed-modal__user-name">{userName}</span>
          </div>

          {businessListingFields && (
            <p className="business-feed-notice">
              Business account: this will publish to the Business section only,
              at the scheduled time.
            </p>
          )}

          <div className="newsfeed-modal__caption-section">
            <textarea
              className="newsfeed-modal__caption"
              placeholder={`What's on your mind, ${userName}?`}
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              rows={4}
            />
          </div>

          {businessListingFields && (
            <BusinessOfferRow
              title="Listing for caption / description (optional)"
              value={textOffer}
              onChange={setTextOffer}
            />
          )}

          {imageEntries.length > 0 && (
            <div className="newsfeed-modal__media-preview">
              <div className="newsfeed-modal__media-grid">
                {imageEntries.map((entry, index) => (
                  <div key={entry.previewUrl} className="newsfeed-modal__media-item">
                    <img
                      src={entry.previewUrl}
                      alt={`Preview ${index + 1}`}
                      onError={() => {
                        alert(
                          `Error loading image ${
                            index + 1
                          }. Removing from selection.`
                        );
                        removeImage(index);
                      }}
                    />
                    <button
                      className="newsfeed-modal__remove-media"
                      onClick={() => removeImage(index)}
                      aria-label={`Remove image ${index + 1}`}
                    >
                      <X size={16} />
                    </button>
                    {businessListingFields && (
                      <BusinessOfferRow
                        title={`Image ${index + 1} (optional)`}
                        value={entry.offer}
                        onChange={(next) =>
                          setImageEntries((prev) => {
                            const copy = [...prev];
                            copy[index] = { ...copy[index], offer: next };
                            return copy;
                          })
                        }
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {videoEntries.length > 0 && (
            <div className="newsfeed-modal__media-preview">
              <div className="newsfeed-modal__media-grid">
                {videoEntries.map((entry, index) => (
                  <div key={entry.previewUrl} className="newsfeed-modal__media-item">
                    <video
                      src={entry.previewUrl}
                      controls
                      style={{
                        width: "100%",
                        maxHeight: "200px",
                        borderRadius: "8px",
                      }}
                      onError={() => {
                        alert(
                          `Error loading video ${
                            index + 1
                          }. Removing from selection.`
                        );
                        removeVideo(index);
                      }}
                    />
                    <button
                      className="newsfeed-modal__remove-media"
                      onClick={() => removeVideo(index)}
                      aria-label={`Remove video ${index + 1}`}
                    >
                      <X size={16} />
                    </button>
                    {businessListingFields && (
                      <BusinessOfferRow
                        title={`Video ${index + 1} (optional)`}
                        value={entry.offer}
                        onChange={(next) =>
                          setVideoEntries((prev) => {
                            const copy = [...prev];
                            copy[index] = { ...copy[index], offer: next };
                            return copy;
                          })
                        }
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="newsfeed-modal__schedule-section">
            <div className="newsfeed-modal__schedule-row">
              <div className="newsfeed-modal__schedule-item">
                <label
                  htmlFor="schedule-date"
                  className="newsfeed-modal__schedule-label"
                >
                  <Calendar size={18} />
                  <span>Date</span>
                </label>
                <input
                  type="date"
                  id="schedule-date"
                  className="newsfeed-modal__schedule-input"
                  value={scheduledDate}
                  onChange={(e) => setScheduledDate(e.target.value)}
                  min={today}
                  required
                />
              </div>
              <div className="newsfeed-modal__schedule-item">
                <label
                  htmlFor="schedule-time"
                  className="newsfeed-modal__schedule-label"
                >
                  <Clock size={18} />
                  <span>Time</span>
                </label>
                <input
                  type="time"
                  id="schedule-time"
                  className="newsfeed-modal__schedule-input"
                  value={scheduledTime}
                  onChange={(e) => setScheduledTime(e.target.value)}
                  required
                />
              </div>
            </div>
          </div>

          <div className="newsfeed-modal__actions">
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              onChange={handleImageSelect}
              style={{ display: "none" }}
              id="image-upload"
              multiple
            />
            <label
              htmlFor="image-upload"
              className="newsfeed-modal__action-btn"
            >
              <ImageIcon size={20} />
              <span>Photo</span>
            </label>
            <input
              type="file"
              ref={videoInputRef}
              accept="video/*"
              onChange={handleVideoSelect}
              style={{ display: "none" }}
              id="video-upload"
              multiple
            />
            <label
              htmlFor="video-upload"
              className="newsfeed-modal__action-btn"
            >
              <Video size={20} />
              <span>Video</span>
            </label>
            <button className="newsfeed-modal__action-btn" disabled>
              <Mic size={20} />
              <span>Audio</span>
            </button>
          </div>
        </div>

        <div className="newsfeed-modal__footer">
          <button className="newsfeed-modal__cancel-btn" onClick={handleClose}>
            Cancel
          </button>
          <button
            className="newsfeed-modal__post-btn"
            onClick={() => void handleSchedule()}
            disabled={
              isSubmitting ||
              (!caption.trim() &&
                imageEntries.length === 0 &&
                videoEntries.length === 0) ||
              !scheduledDate ||
              !scheduledTime
            }
          >
            {isSubmitting ? "Scheduling…" : "Schedule Post"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateScheduledPostModal;
