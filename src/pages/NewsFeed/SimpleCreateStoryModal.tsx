import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { X, Image as ImageIcon, Video } from "lucide-react";
import { isAuthenticated } from "../../utils/userUtils";

interface SimpleCreateStoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStory?: (type: "text" | "photo" | "video", content: string, caption?: string) => void;
}

const SimpleCreateStoryModal: React.FC<SimpleCreateStoryModalProps> = ({
  isOpen,
  onClose,
  onStory,
}) => {
  const navigate = useNavigate();
  const [message, setMessage] = useState("");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith("image/")) {
        alert("Please select an image file");
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
        return;
      }

      // Validate file size (max 10MB)
      const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
      if (file.size > MAX_FILE_SIZE) {
        alert("Image size must be less than 10MB");
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
        return;
      }

      // Clear video if image is selected
      setSelectedVideo(null);
      if (videoInputRef.current) {
        videoInputRef.current.value = "";
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
      };
      reader.onerror = () => {
        alert("Error reading file. Please try again.");
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleVideoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith("video/")) {
        alert("Please select a video file");
        if (videoInputRef.current) {
          videoInputRef.current.value = "";
        }
        return;
      }

      // Validate file size (max 50MB)
      const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
      if (file.size > MAX_FILE_SIZE) {
        alert("Video size must be less than 50MB");
        if (videoInputRef.current) {
          videoInputRef.current.value = "";
        }
        return;
      }

      // Clear image if video is selected
      setSelectedImage(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedVideo(reader.result as string);
      };
      reader.onerror = () => {
        alert("Error reading file. Please try again.");
        if (videoInputRef.current) {
          videoInputRef.current.value = "";
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePublish = async () => {
    // Check if user is authenticated
    if (!isAuthenticated()) {
      alert("Please sign in to create a story.");
      navigate("/signin");
      onClose();
      return;
    }

    // Determine story type and content
    let storyType: "text" | "photo" | "video" = "text";
    let content = "";

    if (selectedImage) {
      storyType = "photo";
      content = selectedImage;
    } else if (selectedVideo) {
      storyType = "video";
      content = selectedVideo;
    } else if (message.trim()) {
      storyType = "text";
      content = message.trim();
    } else {
      // Nothing to publish
      return;
    }

    // Call the onStory callback if provided (it will handle closing the modal)
    if (onStory) {
      await onStory(storyType, content, message.trim() || undefined);
    } else {
      // If no callback, just close and reset
      setMessage("");
      setSelectedImage(null);
      setSelectedVideo(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      if (videoInputRef.current) {
        videoInputRef.current.value = "";
      }
      onClose();
    }
  };

  const handleClose = () => {
    setMessage("");
    setSelectedImage(null);
    setSelectedVideo(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    if (videoInputRef.current) {
      videoInputRef.current.value = "";
    }
    onClose();
  };

  if (!isOpen) return null;

  const canPublish = message.trim().length > 0 || selectedImage !== null || selectedVideo !== null;

  return (
    <div className="simple-story-modal-overlay" onClick={handleClose}>
      <div className="simple-story-modal" onClick={(e) => e.stopPropagation()}>
        <div className="simple-story-modal__header">
          <h2 className="simple-story-modal__title">Create a story</h2>
          <button className="simple-story-modal__close" onClick={handleClose}>
            <X size={20} />
          </button>
        </div>

        <div className="simple-story-modal__content">
          <textarea
            className="simple-story-modal__message-input"
            placeholder="Message..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={6}
          />

          <div className="simple-story-modal__upload-section">
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              onChange={handleImageSelect}
              style={{ display: "none" }}
              id="story-photo-upload"
            />
            <label
              htmlFor="story-photo-upload"
              className="simple-story-modal__upload-item"
            >
              <div className="simple-story-modal__upload-icon">
                <ImageIcon size={32} />
              </div>
              <span className="simple-story-modal__upload-text">Upload a Photo</span>
            </label>
          </div>

          <div className="simple-story-modal__upload-section">
            <input
              type="file"
              ref={videoInputRef}
              accept="video/*"
              onChange={handleVideoSelect}
              style={{ display: "none" }}
              id="story-video-upload"
            />
            <label
              htmlFor="story-video-upload"
              className="simple-story-modal__upload-item"
            >
              <div className="simple-story-modal__upload-icon">
                <Video size={32} />
              </div>
              <span className="simple-story-modal__upload-text">Upload a Video</span>
            </label>
          </div>

          {(selectedImage || selectedVideo) && (
            <div className="simple-story-modal__preview">
              {selectedImage && (
                <div className="simple-story-modal__preview-item">
                  <img src={selectedImage} alt="Preview" />
                  <button
                    className="simple-story-modal__remove-preview"
                    onClick={() => {
                      setSelectedImage(null);
                      if (fileInputRef.current) {
                        fileInputRef.current.value = "";
                      }
                    }}
                  >
                    <X size={16} />
                  </button>
                </div>
              )}
              {selectedVideo && (
                <div className="simple-story-modal__preview-item">
                  <video src={selectedVideo} controls />
                  <button
                    className="simple-story-modal__remove-preview"
                    onClick={() => {
                      setSelectedVideo(null);
                      if (videoInputRef.current) {
                        videoInputRef.current.value = "";
                      }
                    }}
                  >
                    <X size={16} />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="simple-story-modal__footer">
          <button
            className="simple-story-modal__publish-btn"
            onClick={handlePublish}
            disabled={!canPublish}
          >
            Publish
          </button>
        </div>
      </div>
    </div>
  );
};

export default SimpleCreateStoryModal;
