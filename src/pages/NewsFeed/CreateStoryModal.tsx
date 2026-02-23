import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { X, Image as ImageIcon, Video } from "lucide-react";
import Avatar from "../../components/Avatar";
import VideoTrimmer from "./VideoTrimmer";
import { isAuthenticated } from "../../utils/userUtils";

interface CreateStoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  userName: string;
  userAvatar?: string;
  storyType: "text" | "photo" | "video";
  onStory?: (type: "text" | "photo" | "video", content: string, caption?: string, mediaFile?: File | Blob) => void;
}

const CreateStoryModal: React.FC<CreateStoryModalProps> = ({
  isOpen,
  onClose,
  userName,
  userAvatar,
  storyType,
  onStory,
}) => {
  const navigate = useNavigate();
  const [textContent, setTextContent] = useState("");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null);
  const [selectedVideoFile, setSelectedVideoFile] = useState<File | null>(null);
  const [videoDuration, setVideoDuration] = useState(0);
  const [showTrimmer, setShowTrimmer] = useState(false);
  const [trimmedVideo, setTrimmedVideo] = useState<string | null>(null);
  const [trimmedVideoBlob, setTrimmedVideoBlob] = useState<Blob | null>(null);
  const [caption, setCaption] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const videoElementRef = useRef<HTMLVideoElement>(null);

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
      setSelectedVideoFile(null);
      setTrimmedVideo(null);
      setTrimmedVideoBlob(null);
      if (videoInputRef.current) {
        videoInputRef.current.value = "";
      }

      setSelectedImageFile(file);
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
      setSelectedImageFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      setSelectedVideoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        const videoUrl = reader.result as string;
        setSelectedVideo(videoUrl);
        
        // Check video duration
        const video = document.createElement("video");
        video.src = videoUrl;
        video.onloadedmetadata = () => {
          const duration = video.duration;
          setVideoDuration(duration);
          
          // If video is longer than 1 minute (60 seconds), show trimmer
          if (duration > 60) {
            setShowTrimmer(true);
            setTrimmedVideo(null);
          } else {
            setShowTrimmer(false);
            setTrimmedVideo(videoUrl);
          }
        };
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

  const handleVideoTrimmed = (trimmedBlob: Blob) => {
    setTrimmedVideoBlob(trimmedBlob);
    const reader = new FileReader();
    reader.onloadend = () => {
      setTrimmedVideo(reader.result as string);
      setShowTrimmer(false);
    };
    reader.readAsDataURL(trimmedBlob);
  };

  const handleTrimmerCancel = () => {
    setShowTrimmer(false);
    setSelectedVideo(null);
    setSelectedVideoFile(null);
    setVideoDuration(0);
    setTrimmedVideo(null);
    setTrimmedVideoBlob(null);
    if (videoInputRef.current) {
      videoInputRef.current.value = "";
    }
  };

  const handlePost = () => {
    // Check if user is authenticated
    if (!isAuthenticated()) {
      alert("Please sign in to create a story.");
      navigate("/signin");
      onClose();
      return;
    }

    let content = "";
    
    if (storyType === "text") {
      if (!textContent.trim()) {
        return;
      }
      content = textContent;
    } else if (storyType === "photo") {
      if (!selectedImage) {
        return;
      }
      content = selectedImage;
    } else if (storyType === "video") {
      // Use trimmed video if available, otherwise use original
      const videoToUse = trimmedVideo || selectedVideo;
      if (!videoToUse) {
        return;
      }
      // If video is still longer than 60 seconds and not trimmed, don't allow posting
      if (videoDuration > 60 && !trimmedVideo) {
        alert("Please trim the video to 1 minute or less");
        setShowTrimmer(true);
        return;
      }
      content = videoToUse;
    }

    // Call the onStory callback if provided (pass media file for photo/video so backend receives multipart)
    if (onStory) {
      const mediaFile =
        storyType === "photo"
          ? selectedImageFile
          : storyType === "video"
            ? trimmedVideoBlob ?? selectedVideoFile
            : undefined;
      onStory(storyType, content, caption.trim() || undefined, mediaFile ?? undefined);
    }

    // Reset form
    setTextContent("");
    setSelectedImage(null);
    setSelectedImageFile(null);
    setSelectedVideo(null);
    setSelectedVideoFile(null);
    setVideoDuration(0);
    setShowTrimmer(false);
    setTrimmedVideo(null);
    setTrimmedVideoBlob(null);
    setCaption("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    if (videoInputRef.current) {
      videoInputRef.current.value = "";
    }
    onClose();
  };

  const handleClose = () => {
    setTextContent("");
    setSelectedImage(null);
    setSelectedImageFile(null);
    setSelectedVideo(null);
    setSelectedVideoFile(null);
    setVideoDuration(0);
    setShowTrimmer(false);
    setTrimmedVideo(null);
    setTrimmedVideoBlob(null);
    setCaption("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    if (videoInputRef.current) {
      videoInputRef.current.value = "";
    }
    onClose();
  };

  if (!isOpen) return null;

  const canPost = () => {
    if (storyType === "text") {
      return textContent.trim().length > 0;
    } else if (storyType === "photo") {
      return selectedImage !== null;
    } else if (storyType === "video") {
      // Must have video and either it's under 60 seconds or it's been trimmed
      return (selectedVideo !== null) && (videoDuration <= 60 || trimmedVideo !== null);
    }
    return false;
  };

  return (
    <div className="newsfeed-modal-overlay" onClick={handleClose}>
      <div className="newsfeed-modal" onClick={(e) => e.stopPropagation()}>
        <div className="newsfeed-modal__header">
          <h2 className="newsfeed-modal__title">
            Create {storyType === "text" ? "Text" : storyType === "photo" ? "Photo" : "Video"} Story
          </h2>
          <button className="newsfeed-modal__close" onClick={handleClose}>
            <X size={24} />
          </button>
        </div>

        <div className="newsfeed-modal__content">
          <div className="newsfeed-modal__user-info">
            <Avatar
              src={userAvatar}
              name={userName}
              size={40}
              className="newsfeed-modal__avatar"
            />
            <span className="newsfeed-modal__user-name">{userName}</span>
          </div>

          {storyType === "text" && (
            <div className="newsfeed-modal__caption-section">
              <textarea
                className="newsfeed-modal__caption"
                placeholder="What's on your mind?"
                value={textContent}
                onChange={(e) => setTextContent(e.target.value)}
                rows={8}
                style={{ fontSize: "18px", minHeight: "200px" }}
              />
            </div>
          )}

          {storyType === "photo" && (
            <>
              <div className="newsfeed-modal__caption-section">
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  onChange={handleImageSelect}
                  style={{ display: "none" }}
                  id="story-image-upload"
                />
                <label
                  htmlFor="story-image-upload"
                  className="newsfeed-modal__action-btn"
                  style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", marginBottom: "16px" }}
                >
                  <ImageIcon size={20} />
                  <span>Select Photo</span>
                </label>
              </div>

              {selectedImage && (
                <div className="newsfeed-modal__image-preview">
                  <img
                    src={selectedImage}
                    alt="Preview"
                    style={{ maxHeight: "400px", width: "100%", objectFit: "contain" }}
                    onError={() => {
                      alert("Error loading image preview. Please try selecting the image again.");
                      setSelectedImage(null);
                      if (fileInputRef.current) {
                        fileInputRef.current.value = "";
                      }
                    }}
                  />
                  <button
                    className="newsfeed-modal__remove-image"
                    onClick={() => {
                      setSelectedImage(null);
                      if (fileInputRef.current) {
                        fileInputRef.current.value = "";
                      }
                    }}
                    aria-label="Remove image"
                  >
                    <X size={20} />
                  </button>
                </div>
              )}

              <div className="newsfeed-modal__caption-section" style={{ marginTop: "16px" }}>
                <textarea
                  className="newsfeed-modal__caption"
                  placeholder="Add a caption..."
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  rows={3}
                />
              </div>
            </>
          )}

          {storyType === "video" && (
            <>
              <div className="newsfeed-modal__caption-section">
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
                  className="newsfeed-modal__action-btn"
                  style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", marginBottom: "16px" }}
                >
                  <Video size={20} />
                  <span>Select Video</span>
                </label>
              </div>

              {showTrimmer && selectedVideo && (
                <div className="newsfeed-modal__video-trimmer">
                  <VideoTrimmer
                    videoSrc={selectedVideo}
                    maxDuration={60}
                    onTrimmed={handleVideoTrimmed}
                    onCancel={handleTrimmerCancel}
                  />
                </div>
              )}

              {!showTrimmer && selectedVideo && (
                <div className="newsfeed-modal__image-preview">
                  <video
                    ref={videoElementRef}
                    src={trimmedVideo || selectedVideo}
                    controls
                    style={{ width: "100%", maxHeight: "400px", borderRadius: "8px" }}
                    onError={() => {
                      alert("Error loading video preview. Please try selecting the video again.");
                      setSelectedVideo(null);
                      setSelectedVideoFile(null);
                      setTrimmedVideo(null);
                      setTrimmedVideoBlob(null);
                      if (videoInputRef.current) {
                        videoInputRef.current.value = "";
                      }
                    }}
                  />
                  {videoDuration > 60 && !trimmedVideo && (
                    <div style={{ padding: "8px", background: "#fff3cd", color: "#856404", borderRadius: "4px", marginTop: "8px" }}>
                      Video is {Math.floor(videoDuration / 60)}:{(Math.floor(videoDuration % 60)).toString().padStart(2, "0")} long. Maximum allowed: 1:00. Please trim the video.
                    </div>
                  )}
                  <button
                    className="newsfeed-modal__remove-image"
                    onClick={() => {
                      setSelectedVideo(null);
                      setSelectedVideoFile(null);
                      setTrimmedVideo(null);
                      setTrimmedVideoBlob(null);
                      setVideoDuration(0);
                      setShowTrimmer(false);
                      if (videoInputRef.current) {
                        videoInputRef.current.value = "";
                      }
                    }}
                    aria-label="Remove video"
                  >
                    <X size={20} />
                  </button>
                </div>
              )}

              {!showTrimmer && (
                <div className="newsfeed-modal__caption-section" style={{ marginTop: "16px" }}>
                  <textarea
                    className="newsfeed-modal__caption"
                    placeholder="Add a caption..."
                    value={caption}
                    onChange={(e) => setCaption(e.target.value)}
                    rows={3}
                  />
                </div>
              )}
            </>
          )}
        </div>

        <div className="newsfeed-modal__footer">
          <button className="newsfeed-modal__cancel-btn" onClick={handleClose}>
            Cancel
          </button>
          <button
            className="newsfeed-modal__post-btn"
            onClick={handlePost}
            disabled={!canPost()}
          >
            Share Story
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateStoryModal;

