import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  ThumbsUp,
  MessageCircle,
  Eye,
  Star,
  Share2,
  Bookmark,
  MoreVertical,
  Edit,
  Trash2,
  Pin,
  X,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import LazyImage from "../LazyImage";

interface Comment {
  id: number;
  userName: string;
  userAvatar: string;
  text: string;
  timeAgo: string;
}

interface Post {
  id: number;
  userName: string;
  userAvatar: string;
  action: string;
  timeAgo: string;
  image?: string;
  images?: string[]; // Support for multiple images
  likes: number;
  comments: number;
  views: number;
  reviews: number;
  hashtags?: string;
  caption?: string;
}

interface PostCardProps {
  post: Post;
}

const PostCard: React.FC<PostCardProps> = ({ post }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(post.likes);
  const [isSaved, setIsSaved] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [showMenu, setShowMenu] = useState(false);
  const [isPinned, setIsPinned] = useState(false);
  const [isImageViewerOpen, setIsImageViewerOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const menuRef = useRef<HTMLDivElement>(null);
  const MAX_CAPTION_LENGTH = 150;

  // Fixed caption handling with null checks
  const caption = post.caption || "";
  const shouldTruncate = caption.length > MAX_CAPTION_LENGTH;

  const displayCaption =
    shouldTruncate && !isExpanded
      ? `${caption.substring(0, MAX_CAPTION_LENGTH)}...`
      : caption;

  const handleLike = () => {
    setIsLiked(!isLiked);
    setLikeCount((prev) => (isLiked ? prev - 1 : prev + 1));
  };

  const handleSave = () => {
    setIsSaved(!isSaved);
  };

  const handleCommentClick = () => {
    setShowComments(!showComments);
  };

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (newComment.trim()) {
      const comment: Comment = {
        id: Date.now(),
        userName: "You",
        userAvatar: post.userAvatar,
        text: newComment,
        timeAgo: "Just now",
      };
      setComments([...comments, comment]);
      setNewComment("");
    }
  };

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: `${post.userName}'s post`,
          text: caption || post.hashtags || "",
          url: window.location.href,
        });
      } else {
        await navigator.clipboard.writeText(window.location.href);
        // You might want to show a toast notification here
        console.log("Link copied to clipboard");
      }
    } catch (error) {
      // User cancelled share or error occurred
      if ((error as Error).name !== "AbortError") {
        console.error("Error sharing:", error);
      }
      // Fallback to clipboard
      try {
        await navigator.clipboard.writeText(window.location.href);
        console.log("Link copied to clipboard");
      } catch (clipboardError) {
        console.error("Clipboard error:", clipboardError);
      }
    }
  };

  const handleEdit = () => {
    setShowMenu(false);
    console.log("Edit post:", post.id);
  };

  const handleDelete = () => {
    setShowMenu(false);
    if (window.confirm("Are you sure you want to delete this post?")) {
      console.log("Delete post:", post.id);
    }
  };

  const handlePin = () => {
    setShowMenu(false);
    setIsPinned(!isPinned);
    console.log("Pin post:", post.id, !isPinned);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };

    if (showMenu) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showMenu]);

  // Get all images
  const getAllImages = useCallback(() => {
    const imageArray: string[] = [];
    if (post.images && post.images.length > 0) {
      imageArray.push(...post.images.filter((img) => img && img.trim()));
    } else if (post.image && post.image.trim()) {
      imageArray.push(post.image);
    }
    return imageArray;
  }, [post.images, post.image]);

  const handleOpenImageViewer = (index: number) => {
    setCurrentImageIndex(index);
    setIsImageViewerOpen(true);
  };

  const handleCloseImageViewer = useCallback(() => {
    setIsImageViewerOpen(false);
  }, []);

  const handleNextImage = useCallback(() => {
    const images = getAllImages();
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  }, [getAllImages]);

  const handlePrevImage = useCallback(() => {
    const images = getAllImages();
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  }, [getAllImages]);

  // Keyboard navigation for image viewer
  useEffect(() => {
    if (!isImageViewerOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        handleCloseImageViewer();
      } else if (e.key === "ArrowLeft") {
        handlePrevImage();
      } else if (e.key === "ArrowRight") {
        handleNextImage();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden"; // Prevent background scrolling

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [
    isImageViewerOpen,
    handleNextImage,
    handlePrevImage,
    handleCloseImageViewer,
  ]);

  return (
    <article className="newsfeed-post">
      <div className="newsfeed-post__header">
        <div className="newsfeed-post__user-info">
          <LazyImage
            src={post.userAvatar || "/placeholder-avatar.png"}
            alt={post.userName}
            className="newsfeed-post__avatar"
          />
          <div className="newsfeed-post__user-details">
            <h3 className="newsfeed-post__user-name">{post.userName}</h3>
            {post.action && (
              <p className="newsfeed-post__action">{post.action}</p>
            )}
            <span className="newsfeed-post__time">{post.timeAgo}</span>
          </div>
        </div>
        <div className="newsfeed-post__menu-wrapper" ref={menuRef}>
          <button
            className="newsfeed-post__menu-btn"
            onClick={() => setShowMenu(!showMenu)}
            aria-label="Post options"
            title="More options"
          >
            <MoreVertical size={20} />
          </button>
          {showMenu && (
            <div className="newsfeed-post__menu-dropdown">
              <button className="newsfeed-post__menu-item" onClick={handleEdit}>
                <Edit size={18} />
                <span>Edit Post</span>
              </button>
              <button
                className="newsfeed-post__menu-item"
                onClick={handleDelete}
              >
                <Trash2 size={18} />
                <span>Delete Post</span>
              </button>
              <button
                className={`newsfeed-post__menu-item ${
                  isPinned ? "newsfeed-post__menu-item--active" : ""
                }`}
                onClick={handlePin}
              >
                <Pin size={18} />
                <span>{isPinned ? "Unpin Post" : "Pin Post"}</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {caption && (
        <div className="newsfeed-post__caption">
          <p>
            {displayCaption}
            {shouldTruncate && (
              <button
                className="newsfeed-post__see-more"
                onClick={() => setIsExpanded(!isExpanded)}
                aria-expanded={isExpanded}
              >
                {isExpanded ? " See less" : " See more"}
              </button>
            )}
          </p>
        </div>
      )}

      {(() => {
        // Get all images - support both single image and images array
        const imageArray: string[] = [];
        if (post.images && post.images.length > 0) {
          imageArray.push(...post.images.filter((img) => img && img.trim()));
        } else if (post.image && post.image.trim()) {
          imageArray.push(post.image);
        }

        if (imageArray.length === 0) return null;

        const totalImages = imageArray.length;
        const showRemaining = totalImages > 3;
        const displayImages = showRemaining
          ? imageArray.slice(0, 3)
          : imageArray;
        const remainingCount = totalImages - 3;

        // If more than 2 images, use grid layout
        const useGrid = totalImages > 2;
        const gridClass = useGrid ? "newsfeed-post__images-grid" : "";
        const wrapperClass = useGrid
          ? "newsfeed-post__images-wrapper"
          : "newsfeed-post__image-wrapper";

        return (
          <>
            <div className={wrapperClass}>
              {useGrid ? (
                <div className={gridClass}>
                  {displayImages.map((img, index) => (
                    <div
                      key={index}
                      className={`newsfeed-post__image-item ${
                        showRemaining && index === 2
                          ? "newsfeed-post__image-item--last"
                          : ""
                      }`}
                      onClick={() => handleOpenImageViewer(index)}
                      style={{ cursor: "pointer" }}
                    >
                      <LazyImage
                        src={img}
                        alt={`${post.action || caption || "Post image"} ${
                          index + 1
                        }`}
                        className="newsfeed-post__image"
                      />
                      {showRemaining && index === 2 && (
                        <div
                          className="newsfeed-post__remaining-overlay"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenImageViewer(2);
                          }}
                        >
                          <span className="newsfeed-post__remaining-count">
                            +{remainingCount}
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                imageArray.map((img, index) => (
                  <div
                    key={index}
                    onClick={() => handleOpenImageViewer(index)}
                    style={{ cursor: "pointer" }}
                  >
                    <LazyImage
                      src={img}
                      alt={post.action || caption || "Post image"}
                      className="newsfeed-post__image"
                    />
                  </div>
                ))
              )}
            </div>
            {isImageViewerOpen && (
              <ImageViewer
                images={imageArray}
                currentIndex={currentImageIndex}
                onClose={handleCloseImageViewer}
                onNext={handleNextImage}
                onPrev={handlePrevImage}
              />
            )}
          </>
        );
      })()}

      {post.hashtags && (
        <div className="newsfeed-post__hashtags">
          <p>{post.hashtags}</p>
        </div>
      )}

      <div className="newsfeed-post__interactions">
        <div className="newsfeed-post__stats-row">
          <div className="newsfeed-post__stat">
            <MessageCircle size={16} />
            <span>{post.comments + comments.length} Comments</span>
          </div>
          <div className="newsfeed-post__stat">
            <Eye size={16} />
            <span>{post.views} Views</span>
          </div>
          <div className="newsfeed-post__stat">
            <Star size={16} />
            <span>{post.reviews} Reviews</span>
          </div>
        </div>
        <div className="newsfeed-post__likes-row">
          <div className="newsfeed-post__likes">
            <ThumbsUp size={18} />
            <span>{likeCount}</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="newsfeed-post__action-buttons">
          <button
            className={`newsfeed-post__action-btn ${
              isLiked ? "newsfeed-post__action-btn--active" : ""
            }`}
            onClick={handleLike}
            title="Like"
            aria-pressed={isLiked}
          >
            <ThumbsUp size={20} />
            <span>Like</span>
          </button>
          <button
            className="newsfeed-post__action-btn"
            onClick={handleCommentClick}
            title="Comment"
            aria-expanded={showComments}
          >
            <MessageCircle size={20} />
            <span>Comment</span>
          </button>
          <button
            className="newsfeed-post__action-btn"
            onClick={handleShare}
            title="Share"
          >
            <Share2 size={20} />
            <span>Share</span>
          </button>
          <button
            className={`newsfeed-post__action-btn newsfeed-post__action-btn--save ${
              isSaved ? "newsfeed-post__action-btn--active" : ""
            }`}
            onClick={handleSave}
            title="Save"
            aria-pressed={isSaved}
          >
            <Bookmark size={20} />
            <span>Save</span>
          </button>
        </div>

        {/* Comment Section */}
        {showComments && (
          <div className="newsfeed-post__comments">
            <div className="newsfeed-post__comments-list">
              {comments.length === 0 ? (
                <p className="newsfeed-post__no-comments">
                  No comments yet. Be the first to comment!
                </p>
              ) : (
                comments.map((comment) => (
                  <div key={comment.id} className="newsfeed-post__comment">
                    <LazyImage
                      src={comment.userAvatar}
                      alt={comment.userName}
                      className="newsfeed-post__comment-avatar"
                    />
                    <div className="newsfeed-post__comment-content">
                      <div className="newsfeed-post__comment-header">
                        <span className="newsfeed-post__comment-name">
                          {comment.userName}
                        </span>
                        <span className="newsfeed-post__comment-time">
                          {comment.timeAgo}
                        </span>
                      </div>
                      <p className="newsfeed-post__comment-text">
                        {comment.text}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
            <form
              className="newsfeed-post__comment-form"
              onSubmit={handleAddComment}
            >
              <input
                type="text"
                className="newsfeed-post__comment-input"
                placeholder="Write a comment..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                aria-label="Write a comment"
              />
              <button
                type="submit"
                className="newsfeed-post__comment-submit"
                disabled={!newComment.trim()}
              >
                Post
              </button>
            </form>
          </div>
        )}
      </div>
    </article>
  );
};

// Full-screen Image Viewer Component
interface ImageViewerProps {
  images: string[];
  currentIndex: number;
  onClose: () => void;
  onNext: () => void;
  onPrev: () => void;
}

const ImageViewer: React.FC<ImageViewerProps> = ({
  images,
  currentIndex,
  onClose,
  onNext,
  onPrev,
}) => {
  if (images.length === 0) return null;

  return (
    <div className="newsfeed-image-viewer" onClick={onClose}>
      <button
        className="newsfeed-image-viewer__close"
        onClick={onClose}
        aria-label="Close viewer"
      >
        <X size={32} />
      </button>
      {images.length > 1 && (
        <>
          <button
            className="newsfeed-image-viewer__nav newsfeed-image-viewer__nav--prev"
            onClick={(e) => {
              e.stopPropagation();
              onPrev();
            }}
            aria-label="Previous image"
          >
            <ChevronLeft size={40} />
          </button>
          <button
            className="newsfeed-image-viewer__nav newsfeed-image-viewer__nav--next"
            onClick={(e) => {
              e.stopPropagation();
              onNext();
            }}
            aria-label="Next image"
          >
            <ChevronRight size={40} />
          </button>
          <div className="newsfeed-image-viewer__counter">
            {currentIndex + 1} / {images.length}
          </div>
        </>
      )}
      <div
        className="newsfeed-image-viewer__content"
        onClick={(e) => e.stopPropagation()}
      >
        <img
          src={images[currentIndex]}
          alt={`Image ${currentIndex + 1} of ${images.length}`}
          className="newsfeed-image-viewer__image"
        />
      </div>
    </div>
  );
};

export default PostCard;
