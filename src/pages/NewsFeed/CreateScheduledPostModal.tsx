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
import { getUserAvatar, getUserInitials } from "../../utils/userUtils";

interface CreateScheduledPostModalProps {
  isOpen: boolean;
  onClose: () => void;
  userName: string;
  userAvatar?: string;
  onSchedule?: (
    caption: string,
    images: string[] | null,
    videos: string[] | null,
    scheduledDate: string,
    scheduledTime: string
  ) => void;
}

const CreateScheduledPostModal: React.FC<CreateScheduledPostModalProps> = ({
  isOpen,
  onClose,
  userName,
  userAvatar,
  onSchedule,
}) => {
  const [caption, setCaption] = useState("");
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [selectedVideos, setSelectedVideos] = useState<string[]>([]);
  const [scheduledDate, setScheduledDate] = useState("");
  const [scheduledTime, setScheduledTime] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  // Set minimum date to today
  const today = new Date().toISOString().split("T")[0];

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
    const MAX_IMAGES = 10; // Maximum number of images
    const validFiles: File[] = [];
    const errors: string[] = [];

    // Filter and validate files
    Array.from(files).forEach((file, index) => {
      if (!file.type.startsWith("image/")) {
        errors.push(`File ${index + 1} is not an image file.`);
        return;
      }

      if (file.size > MAX_FILE_SIZE) {
        errors.push(`Image ${index + 1} size must be less than 10MB.`);
        return;
      }

      if (selectedImages.length + validFiles.length >= MAX_IMAGES) {
        errors.push(`Maximum ${MAX_IMAGES} images allowed.`);
        return;
      }

      validFiles.push(file);
    });

    if (errors.length > 0) {
      alert(errors.join("\n"));
    }

    if (validFiles.length === 0) {
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      return;
    }

    // Process all valid files
    const newImages: string[] = [];
    let processedCount = 0;

    validFiles.forEach((file, index) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        newImages.push(reader.result as string);
        processedCount++;

        // Update state when all files are processed
        if (processedCount === validFiles.length) {
          setSelectedImages((prev) => [...prev, ...newImages]);
        }
      };
      reader.onerror = () => {
        alert(`Error reading image ${index + 1}. Please try again.`);
        processedCount++;
        if (processedCount === validFiles.length && newImages.length > 0) {
          setSelectedImages((prev) => [...prev, ...newImages]);
        }
      };
      reader.readAsDataURL(file);
    });

    // Clear video if images are selected
    setSelectedVideos([]);
    if (videoInputRef.current) {
      videoInputRef.current.value = "";
    }
  };

  const handleVideoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
    const MAX_VIDEOS = 5; // Maximum number of videos
    const validFiles: File[] = [];
    const errors: string[] = [];

    // Filter and validate files
    Array.from(files).forEach((file, index) => {
      if (!file.type.startsWith("video/")) {
        errors.push(`File ${index + 1} is not a video file.`);
        return;
      }

      if (file.size > MAX_FILE_SIZE) {
        errors.push(`Video ${index + 1} size must be less than 50MB.`);
        return;
      }

      if (selectedVideos.length + validFiles.length >= MAX_VIDEOS) {
        errors.push(`Maximum ${MAX_VIDEOS} videos allowed.`);
        return;
      }

      validFiles.push(file);
    });

    if (errors.length > 0) {
      alert(errors.join("\n"));
    }

    if (validFiles.length === 0) {
      if (videoInputRef.current) {
        videoInputRef.current.value = "";
      }
      return;
    }

    // Process all valid files
    const newVideos: string[] = [];
    let processedCount = 0;

    validFiles.forEach((file, index) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        newVideos.push(reader.result as string);
        processedCount++;

        // Update state when all files are processed
        if (processedCount === validFiles.length) {
          setSelectedVideos((prev) => [...prev, ...newVideos]);
        }
      };
      reader.onerror = () => {
        alert(`Error reading video ${index + 1}. Please try again.`);
        processedCount++;
        if (processedCount === validFiles.length && newVideos.length > 0) {
          setSelectedVideos((prev) => [...prev, ...newVideos]);
        }
      };
      reader.readAsDataURL(file);
    });

    // Clear images if videos are selected
    setSelectedImages([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSchedule = () => {
    if (
      !caption.trim() &&
      selectedImages.length === 0 &&
      selectedVideos.length === 0
    ) {
      alert("Please add some content to your post.");
      return;
    }

    if (!scheduledDate || !scheduledTime) {
      alert("Please select both date and time for scheduling.");
      return;
    }

    // Validate that scheduled date/time is in the future
    const scheduledDateTime = new Date(`${scheduledDate}T${scheduledTime}`);
    const now = new Date();

    if (scheduledDateTime <= now) {
      alert("Please select a date and time in the future.");
      return;
    }

    // Call the onSchedule callback if provided
    if (onSchedule) {
      onSchedule(
        caption,
        selectedImages.length > 0 ? selectedImages : null,
        selectedVideos.length > 0 ? selectedVideos : null,
        scheduledDate,
        scheduledTime
      );
    }

    // Reset form
    setCaption("");
    setSelectedImages([]);
    setSelectedVideos([]);
    setScheduledDate("");
    setScheduledTime("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    if (videoInputRef.current) {
      videoInputRef.current.value = "";
    }
    onClose();
  };

  const handleClose = () => {
    setCaption("");
    setSelectedImages([]);
    setSelectedVideos([]);
    setScheduledDate("");
    setScheduledTime("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    if (videoInputRef.current) {
      videoInputRef.current.value = "";
    }
    onClose();
  };

  const removeImage = (index: number) => {
    setSelectedImages((prev) => prev.filter((_, i) => i !== index));
  };

  const removeVideo = (index: number) => {
    setSelectedVideos((prev) => prev.filter((_, i) => i !== index));
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

          <div className="newsfeed-modal__caption-section">
            <textarea
              className="newsfeed-modal__caption"
              placeholder={`What's on your mind, ${userName}?`}
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              rows={4}
            />
          </div>

          {selectedImages.length > 0 && (
            <div className="newsfeed-modal__media-preview">
              <div className="newsfeed-modal__media-grid">
                {selectedImages.map((image, index) => (
                  <div key={index} className="newsfeed-modal__media-item">
                    <img
                      src={image}
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
                  </div>
                ))}
              </div>
            </div>
          )}

          {selectedVideos.length > 0 && (
            <div className="newsfeed-modal__media-preview">
              <div className="newsfeed-modal__media-grid">
                {selectedVideos.map((video, index) => (
                  <div key={index} className="newsfeed-modal__media-item">
                    <video
                      src={video}
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
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Schedule Date and Time Section */}
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
            onClick={handleSchedule}
            disabled={
              (!caption.trim() &&
                selectedImages.length === 0 &&
                selectedVideos.length === 0) ||
              !scheduledDate ||
              !scheduledTime
            }
          >
            Schedule Post
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateScheduledPostModal;
