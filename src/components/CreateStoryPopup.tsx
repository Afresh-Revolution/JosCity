import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { X, Image as ImageIcon, Video } from "lucide-react";

interface CreateStoryPopupProps {
  isOpen: boolean;
  onClose: () => void;
  onPublish?: (message: string, image?: string, video?: string) => void;
}

const CreateStoryPopup: React.FC<CreateStoryPopupProps> = ({
  isOpen,
  onClose,
  onPublish,
}) => {
  const [message, setMessage] = useState("");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen || !mounted) {
    return null;
  }

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        alert("Please select an image file");
        if (imageInputRef.current) {
          imageInputRef.current.value = "";
        }
        return;
      }

      const MAX_FILE_SIZE = 10 * 1024 * 1024;
      if (file.size > MAX_FILE_SIZE) {
        alert("Image size must be less than 10MB");
        if (imageInputRef.current) {
          imageInputRef.current.value = "";
        }
        return;
      }

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
        if (imageInputRef.current) {
          imageInputRef.current.value = "";
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleVideoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith("video/")) {
        alert("Please select a video file");
        if (videoInputRef.current) {
          videoInputRef.current.value = "";
        }
        return;
      }

      setSelectedImage(null);
      if (imageInputRef.current) {
        imageInputRef.current.value = "";
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

  const handlePublish = () => {
    if (onPublish) {
      onPublish(message, selectedImage || undefined, selectedVideo || undefined);
    }
    setMessage("");
    setSelectedImage(null);
    setSelectedVideo(null);
    if (imageInputRef.current) {
      imageInputRef.current.value = "";
    }
    if (videoInputRef.current) {
      videoInputRef.current.value = "";
    }
    onClose();
  };

  const handleClose = () => {
    setMessage("");
    setSelectedImage(null);
    setSelectedVideo(null);
    if (imageInputRef.current) {
      imageInputRef.current.value = "";
    }
    if (videoInputRef.current) {
      videoInputRef.current.value = "";
    }
    onClose();
  };

  const canPublish = message.trim().length > 0 || selectedImage !== null || selectedVideo !== null;

  const popupContent = (
    <div 
      className="create-story-popup-overlay" 
      onClick={handleClose}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 10000,
        padding: "20px",
      }}
    >
      <div 
        className="create-story-popup" 
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: "#ffffff",
          borderRadius: "12px",
          width: "100%",
          maxWidth: "500px",
          maxHeight: "90vh",
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 4px 20px rgba(0, 0, 0, 0.15)",
          overflow: "hidden",
        }}
      >
        <div className="create-story-popup__header">
          <h2 className="create-story-popup__title">Create a story</h2>
          <button className="create-story-popup__close" onClick={handleClose} aria-label="Close">
            <X size={20} />
          </button>
        </div>

        <div className="create-story-popup__content">
          <textarea
            className="create-story-popup__message"
            placeholder="Message..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={6}
          />

          <div className="create-story-popup__upload-section">
            <input
              type="file"
              ref={imageInputRef}
              accept="image/*"
              onChange={handleImageSelect}
              style={{ display: "none" }}
              id="story-image-upload"
            />
            <label
              htmlFor="story-image-upload"
              className="create-story-popup__upload-item"
            >
              <div className="create-story-popup__upload-icon">
                <ImageIcon size={32} />
              </div>
              <span className="create-story-popup__upload-text">Upload a Photo</span>
            </label>
          </div>

          <div className="create-story-popup__upload-section">
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
              className="create-story-popup__upload-item"
            >
              <div className="create-story-popup__upload-icon">
                <Video size={32} />
              </div>
              <span className="create-story-popup__upload-text">Upload a Video</span>
            </label>
          </div>

          {(selectedImage || selectedVideo) && (
            <div className="create-story-popup__preview">
              {selectedImage && (
                <div className="create-story-popup__preview-item">
                  <img src={selectedImage} alt="Preview" />
                  <button
                    className="create-story-popup__remove"
                    onClick={() => {
                      setSelectedImage(null);
                      if (imageInputRef.current) {
                        imageInputRef.current.value = "";
                      }
                    }}
                    aria-label="Remove image"
                  >
                    <X size={16} />
                  </button>
                </div>
              )}
              {selectedVideo && (
                <div className="create-story-popup__preview-item">
                  <video src={selectedVideo} controls />
                  <button
                    className="create-story-popup__remove"
                    onClick={() => {
                      setSelectedVideo(null);
                      if (videoInputRef.current) {
                        videoInputRef.current.value = "";
                      }
                    }}
                    aria-label="Remove video"
                  >
                    <X size={16} />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="create-story-popup__footer">
          <button
            className="create-story-popup__publish-btn"
            onClick={handlePublish}
            disabled={!canPublish}
          >
            Publish
          </button>
        </div>
      </div>
    </div>
  );

  // Ensure document.body exists
  if (typeof document === "undefined" || !document.body) {
    console.error("Cannot create portal - document.body not available");
    return null;
  }

  return createPortal(popupContent, document.body);
};

export default CreateStoryPopup;
