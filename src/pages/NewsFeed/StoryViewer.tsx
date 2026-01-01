import React, { useState, useEffect, useRef } from "react";
import { X, Heart, Eye, Trash2 } from "lucide-react";
import LazyImage from "../../components/LazyImage";
import Avatar from "../../components/Avatar";
import { getUserName } from "../../utils/userUtils";
import { feedApi } from "../../services/feedApi";

interface StoryViewerProps {
  story: {
    id: number;
    userName: string;
    avatar: string;
    type: "text" | "photo" | "video";
    content: string;
    caption?: string;
    createdAt: number;
    expiresAt: number;
    views?: Array<{ userId: number; userName: string; viewedAt: number }>;
    reactions?: Array<{ userId: number; userName: string; reactedAt: number }>;
    isOwner?: boolean;
  };
  onClose: () => void;
  onDelete?: (storyId: number) => void;
  onView?: (storyId: number) => void;
  onReact?: (storyId: number) => void;
}

const StoryViewer: React.FC<StoryViewerProps> = ({
  story,
  onClose,
  onDelete,
  onView,
  onReact,
}) => {
  const [currentTime, setCurrentTime] = useState(0);
  const [isExpired, setIsExpired] = useState(false);
  const [hasReacted, setHasReacted] = useState(false);
  const [showViews, setShowViews] = useState(false);
  const [showReactions, setShowReactions] = useState(false);
  const [viewsCount, setViewsCount] = useState(story.views?.length || 0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const currentUser = getUserName();
  const isOwner = story.isOwner || story.userName === currentUser;

  useEffect(() => {
    // Check if story is expired
    const now = Date.now();
    if (story.expiresAt <= now) {
      setIsExpired(true);
      return;
    }

    // Check if current user has already viewed
    const userViewed = story.views?.some(
      (view) => view.userName === currentUser
    );

    // Check if current user has already reacted
    const userReacted = story.reactions?.some(
      (reaction) => reaction.userName === currentUser
    );
    setHasReacted(!!userReacted);

    // Track view if not already viewed and not owner
    if (!userViewed && !isOwner && onView) {
      onView(story.id);
    }

    // Auto-close after remaining time (max 5 seconds for preview)
    const remainingTime = Math.min(story.expiresAt - now, 5000);
    const timer = setTimeout(() => {
      if (!isExpired) {
        onClose();
      }
    }, remainingTime);

    return () => {
      clearTimeout(timer);
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };
  }, [story, currentUser, isOwner, onView, onClose, isExpired]);

  useEffect(() => {
    // Update progress bar
    if (!isExpired && story.expiresAt) {
      progressIntervalRef.current = setInterval(() => {
        const now = Date.now();
        const elapsed = now - story.createdAt;
        const total = story.expiresAt - story.createdAt;
        const progress = (elapsed / total) * 100;
        setCurrentTime(progress);

        if (progress >= 100) {
          setIsExpired(true);
          if (progressIntervalRef.current) {
            clearInterval(progressIntervalRef.current);
          }
        }
      }, 100);

      return () => {
        if (progressIntervalRef.current) {
          clearInterval(progressIntervalRef.current);
        }
      };
    }
  }, [story.createdAt, story.expiresAt, isExpired]);

  const handleReact = () => {
    if (hasReacted || isExpired) return;

    if (onReact) {
      onReact(story.id);
      setHasReacted(true);
    }
  };

  const handleDelete = () => {
    if (window.confirm("Are you sure you want to delete this story?")) {
      if (onDelete) {
        onDelete(story.id);
      }
      onClose();
    }
  };

  const reactionsCount = story.reactions?.length || 0;

  if (isExpired) {
    return (
      <div className="story-viewer-overlay" onClick={onClose}>
        <div className="story-viewer" onClick={(e) => e.stopPropagation()}>
          <div className="story-viewer__expired">
            <p>This story has expired</p>
            <button className="story-viewer__close-btn" onClick={onClose}>
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="story-viewer-overlay" onClick={onClose}>
      <div className="story-viewer" onClick={(e) => e.stopPropagation()}>
        {/* Progress bar */}
        <div className="story-viewer__progress-container">
          <div
            className="story-viewer__progress"
            style={{ width: `${100 - currentTime}%` }}
          />
        </div>

        {/* Header */}
        <div className="story-viewer__header">
          <div className="story-viewer__user-info">
            <Avatar
              src={story.avatar}
              name={story.userName}
              size={40}
              className="story-viewer__avatar"
              backgroundColor="rgba(0, 0, 0, 0.5)"
            />
            <div>
              <p className="story-viewer__user-name">{story.userName}</p>
              <p className="story-viewer__time">
                {Math.floor((story.expiresAt - Date.now()) / (1000 * 60 * 60))}h
                {" "}
                {Math.floor(
                  ((story.expiresAt - Date.now()) % (1000 * 60 * 60)) /
                    (1000 * 60)
                )}
                m left
              </p>
            </div>
          </div>

          <div className="story-viewer__header-actions">
            {isOwner && (
              <button
                className="story-viewer__action-btn"
                onClick={async () => {
                  setShowViews(true);
                  // Fetch story views count from API
                  try {
                    const response = await feedApi.getStoryViews(story.id);
                    if (response.success && response.data) {
                      setViewsCount(response.data.views_count || 0);
                    }
                  } catch (error) {
                    console.error("Error fetching story views:", error);
                  }
                }}
                title="View stats"
              >
                <Eye size={20} />
                {viewsCount > 0 && (
                  <span className="story-viewer__badge">{viewsCount}</span>
                )}
              </button>
            )}
            <button
              className="story-viewer__action-btn"
              onClick={() => {
                if (!hasReacted) {
                  handleReact();
                }
                if (reactionsCount > 0 || hasReacted) {
                  setShowReactions(true);
                }
              }}
              title={hasReacted ? "You reacted - Click to see reactions" : "React"}
            >
              <Heart
                size={20}
                fill={hasReacted ? "currentColor" : "none"}
                color={hasReacted ? "#ff4444" : "currentColor"}
              />
              {(reactionsCount > 0 || hasReacted) && (
                <span className="story-viewer__badge">{reactionsCount + (hasReacted && !story.reactions?.some(r => r.userName === currentUser) ? 1 : 0)}</span>
              )}
            </button>
            {isOwner && (
              <button
                className="story-viewer__action-btn story-viewer__action-btn--delete"
                onClick={handleDelete}
                title="Delete story"
              >
                <Trash2 size={20} />
              </button>
            )}
            <button
              className="story-viewer__close-btn"
              onClick={onClose}
              title="Close"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="story-viewer__content">
          {story.type === "text" && (
            <div
              className="story-viewer__text-content"
              style={{
                background:
                  "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                color: "white",
                padding: "2rem",
                borderRadius: "8px",
                minHeight: "400px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <p style={{ fontSize: "24px", textAlign: "center" }}>
                {story.content}
              </p>
            </div>
          )}

          {story.type === "photo" && (
            <div className="story-viewer__media">
              <LazyImage
                src={story.content}
                alt={story.caption || "Story"}
                className="story-viewer__image"
              />
            </div>
          )}

          {story.type === "video" && (
            <div className="story-viewer__media">
              <video
                ref={videoRef}
                src={story.content}
                controls
                autoPlay
                className="story-viewer__video"
                onEnded={() => {
                  // Auto-close when video ends
                  setTimeout(() => onClose(), 1000);
                }}
              />
            </div>
          )}

          {story.caption && (
            <div className="story-viewer__caption">
              <p>{story.caption}</p>
            </div>
          )}
        </div>

        {/* Views Modal */}
        {showViews && (
          <div
            className="story-viewer__modal-overlay"
            onClick={() => setShowViews(false)}
          >
            <div
              className="story-viewer__modal"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="story-viewer__modal-header">
                <h3>Story Views ({viewsCount})</h3>
                <button onClick={() => setShowViews(false)}>
                  <X size={20} />
                </button>
              </div>
              <div className="story-viewer__modal-content">
                {story.views && story.views.length > 0 ? (
                  <ul className="story-viewer__viewers-list">
                    {story.views.map((view, index) => (
                      <li key={index} className="story-viewer__viewer-item">
                        <span className="story-viewer__viewer-name">
                          {view.userName}
                        </span>
                        <span className="story-viewer__viewer-time">
                          {new Date(view.viewedAt).toLocaleString()}
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p>No views yet</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Reactions Modal */}
        {showReactions && (
          <div
            className="story-viewer__modal-overlay"
            onClick={() => setShowReactions(false)}
          >
            <div
              className="story-viewer__modal"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="story-viewer__modal-header">
                <h3>Story Reactions ({reactionsCount})</h3>
                <button onClick={() => setShowReactions(false)}>
                  <X size={20} />
                </button>
              </div>
              <div className="story-viewer__modal-content">
                {((story.reactions && story.reactions.length > 0) || hasReacted) ? (
                  <ul className="story-viewer__viewers-list">
                    {story.reactions?.map((reaction, index) => (
                      <li key={index} className="story-viewer__viewer-item">
                        <Heart
                          size={16}
                          fill="#ff4444"
                          color="#ff4444"
                          style={{ marginRight: "8px" }}
                        />
                        <span className="story-viewer__viewer-name">
                          {reaction.userName}
                        </span>
                        <span className="story-viewer__viewer-time">
                          {new Date(reaction.reactedAt).toLocaleString()}
                        </span>
                      </li>
                    ))}
                    {hasReacted && !story.reactions?.some(r => r.userName === currentUser) && (
                      <li className="story-viewer__viewer-item">
                        <Heart
                          size={16}
                          fill="#ff4444"
                          color="#ff4444"
                          style={{ marginRight: "8px" }}
                        />
                        <span className="story-viewer__viewer-name">
                          {currentUser} (You)
                        </span>
                        <span className="story-viewer__viewer-time">
                          Just now
                        </span>
                      </li>
                    )}
                  </ul>
                ) : (
                  <p>No reactions yet</p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StoryViewer;

