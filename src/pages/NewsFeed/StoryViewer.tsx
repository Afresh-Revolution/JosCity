import React, { useState, useEffect, useRef } from "react";
import { X, Heart, Eye, Trash2 } from "lucide-react";
import LazyImage from "../../components/LazyImage";
import Avatar from "../../components/Avatar";
import ConfirmationModal from "../../components/ConfirmationModal";
import { getUserName } from "../../utils/userUtils";
import { feedApi } from "../../services/feedApi";

interface Story {
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
}

interface StoryViewerProps {
  stories: Story[];
  currentIndex: number;
  onNavigate: (index: number) => void;
  onClose: () => void;
  onDelete?: (storyId: number) => void;
  onView?: (storyId: number) => void;
  onReact?: (storyId: number) => void;
}

const StoryViewer: React.FC<StoryViewerProps> = ({
  stories,
  currentIndex,
  onNavigate,
  onClose,
  onDelete,
  onView,
  onReact,
}) => {
  const [timerProgress, setTimerProgress] = useState(0);
  const [isExpired, setIsExpired] = useState(false);
  const [hasReacted, setHasReacted] = useState(false);
  const [showViews, setShowViews] = useState(false);
  const [showReactions, setShowReactions] = useState(false);
  const [viewsCount, setViewsCount] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const autoSlideTimerRef = useRef<NodeJS.Timeout | null>(null);
  const timerProgressIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);
  const pausedTimeRef = useRef<number>(0);
  const onNavigateRef = useRef(onNavigate);
  const onCloseRef = useRef(onClose);

  // Keep refs updated
  useEffect(() => {
    onNavigateRef.current = onNavigate;
    onCloseRef.current = onClose;
  }, [onNavigate, onClose]);

  // Ensure we have a valid story
  const currentStory = stories[currentIndex] || stories[0];
  const currentUser = getUserName();
  const story = stories[currentIndex];
  const isOwner = story?.isOwner || story?.userName === currentUser;

  // Sync currentIndex prop with internal state if needed
  useEffect(() => {
    if (currentIndex >= 0 && currentIndex < stories.length) {
      // Reset state when index changes
      setTimerProgress(0);
      setIsPaused(false);
    }
  }, [currentIndex, stories.length]);

  // Auto-slide to next story after 5 seconds with animated progress
  useEffect(() => {
    if (!story || isExpired || stories.length === 0) {
      return;
    }

    // Reset timer progress
    setTimerProgress(0);
    startTimeRef.current = Date.now();
    pausedTimeRef.current = 0;

    // Clear existing timers
    if (autoSlideTimerRef.current) {
      clearTimeout(autoSlideTimerRef.current);
      autoSlideTimerRef.current = null;
    }
    if (timerProgressIntervalRef.current) {
      clearInterval(timerProgressIntervalRef.current);
      timerProgressIntervalRef.current = null;
    }

    // Update progress every 50ms for smooth animation (5000ms / 50ms = 100 updates)
    timerProgressIntervalRef.current = setInterval(() => {
      const elapsed = Date.now() - startTimeRef.current - pausedTimeRef.current;
      const progress = Math.min((elapsed / 5000) * 100, 100);
      setTimerProgress(progress);

      if (progress >= 100) {
        if (timerProgressIntervalRef.current) {
          clearInterval(timerProgressIntervalRef.current);
          timerProgressIntervalRef.current = null;
        }
      }
    }, 50);

    // Set timer to auto-slide after 5 seconds
    const timerId = setTimeout(() => {
      if (currentIndex < stories.length - 1) {
        onNavigateRef.current(currentIndex + 1);
      } else {
        onCloseRef.current();
      }
    }, 5000);

    autoSlideTimerRef.current = timerId;

    return () => {
      if (autoSlideTimerRef.current) {
        clearTimeout(autoSlideTimerRef.current);
        autoSlideTimerRef.current = null;
      }
      if (timerProgressIntervalRef.current) {
        clearInterval(timerProgressIntervalRef.current);
        timerProgressIntervalRef.current = null;
      }
    };
  }, [story, currentIndex, stories.length, isExpired]);

  useEffect(() => {
    if (!story) return;

    // Reset state when story changes (but don't reset timer progress here - let the timer effect handle it)
    setIsExpired(false);
    setHasReacted(false);
    setShowViews(false);
    setShowReactions(false);
    setViewsCount(story.views?.length || 0);

    // Check if story is expired
    const now = Date.now();
    if (currentStory?.expiresAt && currentStory.expiresAt <= now) {
      setIsExpired(true);
      // Auto-advance to next story or close
      if (currentIndex < stories.length - 1) {
        onNavigate(currentIndex + 1);
      } else {
        onClose();
      }
      return;
    }

    // Check if current user has already viewed
    const userViewed = currentStory?.views?.some(
      (view: { userId: number; userName: string; viewedAt: number }) =>
        view.userName === currentUser
    );

    // Check if current user has already reacted
    const userReacted = currentStory?.reactions?.some(
      (reaction: { userId: number; userName: string; reactedAt: number }) =>
        reaction.userName === currentUser
    );
    setHasReacted(!!userReacted);

    // Track view if not already viewed and not owner
    if (!userViewed && !isOwner && onView && currentStory) {
      onView(currentStory.id);
    }
  }, [
    story,
    currentStory,
    currentUser,
    isOwner,
    onView,
    currentIndex,
    stories.length,
    onNavigate,
    onClose,
  ]);

  const handleReact = () => {
    if (!story || hasReacted || isExpired) return;

    if (onReact) {
      onReact(currentStory.id);
      setHasReacted(true);
    }
  };

  const handleDelete = () => {
    if (!story) return;
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = async () => {
    if (!story || !onDelete) return;
    setIsDeleting(true);
    try {
      await onDelete(currentStory.id);
      setShowDeleteConfirm(false);
    } catch (error) {
      console.error("Error deleting story:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      onNavigate(currentIndex - 1);
    }
  };

  const handleNext = () => {
    if (currentIndex < stories.length - 1) {
      onNavigate(currentIndex + 1);
    } else {
      onClose();
    }
  };

  const goToNextStory = () => {
    handleNext();
  };

  const reactionsCount = story?.reactions?.length || 0;

  if (!story) {
    return null;
  }

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

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    // Only close if clicking directly on overlay, not on story content
    if (target.classList.contains("story-viewer-overlay")) {
      onClose();
    }
  };

  const handleStoryClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    const rect = target.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const width = rect.width;

    // Click on left half goes to previous story (Instagram style)
    if (clickX < width / 2 && currentIndex > 0) {
      handlePrevious();
    }
    // Click on right half goes to next story (Instagram style)
    else if (clickX >= width / 2 && currentIndex < stories.length - 1) {
      handleNext();
    }
  };

  return (
    <div className="story-viewer-overlay" onClick={handleOverlayClick}>
      <div className="story-viewer" onClick={handleStoryClick}>
        {/* Progress indicators at top (Instagram style) */}
        <div className="story-viewer__progress-indicators">
          {stories.map((_, index) => (
            <div
              key={index}
              className={`story-viewer__progress-indicator ${
                index === currentIndex
                  ? "story-viewer__progress-indicator--active"
                  : ""
              } ${
                index < currentIndex
                  ? "story-viewer__progress-indicator--completed"
                  : ""
              }`}
              onClick={(e) => {
                e.stopPropagation();
                onNavigate(index);
              }}
            >
              {index === currentIndex && (
                <div
                  className="story-viewer__progress-indicator-fill"
                  style={{ width: `${timerProgress}%` }}
                />
              )}
            </div>
          ))}
        </div>

        {/* Header at top (Instagram style) */}
        <div className="story-viewer__header">
          <div className="story-viewer__user-info">
            <Avatar
              src={currentStory?.avatar}
              name={currentStory?.userName}
              size={32}
              className="story-viewer__avatar"
              backgroundColor="rgba(0, 0, 0, 0.5)"
            />
            <div>
              <p className="story-viewer__user-name">
                {currentStory?.userName}
              </p>
              <p className="story-viewer__time">
                {currentStory?.expiresAt
                  ? `${Math.floor(
                      (currentStory.expiresAt - Date.now()) / (1000 * 60 * 60)
                    )}h ${Math.floor(
                      ((currentStory.expiresAt - Date.now()) %
                        (1000 * 60 * 60)) /
                        (1000 * 60)
                    )}m`
                  : ""}
              </p>
            </div>
          </div>
          <button
            className="story-viewer__close-btn"
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            title="Close"
          >
            <X size={24} />
          </button>
        </div>

        {/* Navigation areas (invisible, Instagram style) */}
        {currentIndex > 0 && (
          <div
            className="story-viewer__nav-area story-viewer__nav-area--prev"
            onClick={(e) => {
              e.stopPropagation();
              handlePrevious();
            }}
          />
        )}
        {currentIndex < stories.length - 1 && (
          <div
            className="story-viewer__nav-area story-viewer__nav-area--next"
            onClick={(e) => {
              e.stopPropagation();
              handleNext();
            }}
          />
        )}

        {/* Content */}
        <div className="story-viewer__content">
          {/* {story.type === "text" && (
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
                cursor: "pointer",
              }}
            >
              <p style={{ fontSize: "24px", textAlign: "center" }}>
                {story.content}
              </p>
            </div>
          )} */}

          {story.type === "text" && (
            <div
              className="story-viewer__text-content"
              style={{
                background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                color: "white",
                padding: "2rem",
                borderRadius: "8px",
                minHeight: "400px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <p
                style={{
                  fontSize: "24px",
                  textAlign: "center",
                  wordWrap: "break-word",
                  overflowWrap: "break-word",
                  whiteSpace: "pre-wrap",
                  maxWidth: "100%",
                  padding: "1rem",
                }}
              >
                {story.content}
              </p>
            </div>
          )}

          {currentStory.type === "photo" && (
            <div className="story-viewer__media" style={{ cursor: "pointer" }}>
              <LazyImage
                src={currentStory.content}
                alt={currentStory.caption || "Story"}
                className="story-viewer__image"
              />
              {isPaused && (
                <div
                  style={{
                    position: "absolute",
                    top: "50%",
                    left: "50%",
                    transform: "translate(-50%, -50%)",
                    fontSize: "48px",
                    opacity: 0.7,
                    pointerEvents: "none",
                  }}
                >
                  ⏸
                </div>
              )}
            </div>
          )}

          {currentStory.type === "video" && (
            <div className="story-viewer__media" style={{ cursor: "pointer" }}>
              <video
                ref={videoRef}
                src={currentStory.content}
                controls
                autoPlay={!isPaused}
                className="story-viewer__video"
                onEnded={() => {
                  // Auto-advance to next story when video ends
                  setTimeout(() => goToNextStory(), 500);
                }}
                onPlay={() => setIsPaused(false)}
                onPause={() => setIsPaused(true)}
              />
            </div>
          )}

          {currentStory?.caption && (
            <div className="story-viewer__caption">
              <p>{currentStory.caption}</p>
            </div>
          )}
        </div>

        {/* Bottom actions (Instagram style) */}
        <div className="story-viewer__bottom-actions">
          <div className="story-viewer__actions-left">
            <button
              className="story-viewer__bottom-action-btn"
              onClick={(e) => {
                e.stopPropagation();
                if (!hasReacted) {
                  handleReact();
                }
                if (reactionsCount > 0 || hasReacted) {
                  setShowReactions(true);
                }
              }}
              title={hasReacted ? "You reacted" : "React"}
            >
              <Heart
                size={24}
                fill={hasReacted ? "#ff4444" : "none"}
                color={hasReacted ? "#ff4444" : "white"}
              />
              {(reactionsCount > 0 || hasReacted) && (
                <span className="story-viewer__action-count">
                  {reactionsCount +
                    (hasReacted &&
                    !story.reactions?.some((r) => r.userName === currentUser)
                      ? 1
                      : 0)}
                </span>
              )}
            </button>
            {isOwner && (
              <button
                className="story-viewer__bottom-action-btn"
                onClick={async (e) => {
                  e.stopPropagation();
                  setShowViews(true);
                  try {
                    const response = await feedApi.getStoryViews(
                      currentStory?.id || 0
                    );
                    if (response.success && response.data) {
                      setViewsCount(response.data.views_count || 0);
                    }
                  } catch (error) {
                    console.error("Error fetching story views:", error);
                  }
                }}
                title="View stats"
              >
                <Eye size={24} color="white" />
                {viewsCount > 0 && (
                  <span className="story-viewer__action-count">
                    {viewsCount}
                  </span>
                )}
              </button>
            )}
          </div>
          {isOwner && (
            <button
              className="story-viewer__bottom-action-btn story-viewer__bottom-action-btn--delete"
              onClick={(e) => {
                e.stopPropagation();
                handleDelete();
              }}
              title="Delete story"
            >
              <Trash2 size={24} color="white" />
            </button>
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
                {currentStory?.views && currentStory.views.length > 0 ? (
                  <ul className="story-viewer__viewers-list">
                    {currentStory.views.map(
                      (
                        view: {
                          userId: number;
                          userName: string;
                          viewedAt: number;
                        },
                        index: number
                      ) => (
                        <li key={index} className="story-viewer__viewer-item">
                          <span className="story-viewer__viewer-name">
                            {view.userName}
                          </span>
                          <span className="story-viewer__viewer-time">
                            {new Date(view.viewedAt).toLocaleString()}
                          </span>
                        </li>
                      )
                    )}
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
                {(story.reactions && story.reactions.length > 0) ||
                hasReacted ? (
                  <ul className="story-viewer__viewers-list">
                    {currentStory?.reactions?.map(
                      (
                        reaction: {
                          userId: number;
                          userName: string;
                          reactedAt: number;
                        },
                        index: number
                      ) => (
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
                      )
                    )}
                    {hasReacted &&
                      !story.reactions?.some(
                        (r) => r.userName === currentUser
                      ) && (
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

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleConfirmDelete}
        title="Delete Story"
        message="Are you sure you want to delete this story? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        type="delete"
        isLoading={isDeleting}
      />
    </div>
  );
};

export default StoryViewer;
