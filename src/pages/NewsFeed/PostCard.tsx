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
import LazyImage from "../../components/LazyImage";
import Avatar from "../../components/Avatar";
import ConfirmationModal from "../../components/ConfirmationModal";
import {
  feedApi,
  type Comment as ApiComment,
  type PostReactionStat,
} from "../../services/feedApi";
import { isAuthenticated, getUserData, getUserName } from "../../utils/userUtils";
import { useNavigate } from "react-router-dom";
// eslint-disable-next-line @typescript-eslint/no-unused-vars


interface Comment {
  id: number;
  userName: string;
  userAvatar: string;
  text: string;
  timeAgo: string;
}

interface Post {
  id: number;
  userId?: number; // author user_id - only they can edit/delete/pin
  userName: string;
  userAvatar: string;
  action: string;
  timeAgo: string;
  image?: string;
  images?: string[]; // Support for multiple images
  video?: string;
  videos?: string[]; // Support for multiple videos
  likes: number;
  comments: number;
  views: number;
  reviews: number;
  hashtags?: string;
  caption?: string;
  pinned?: boolean;
  userReacted?: boolean;
}

interface PostCardProps {
  post: Post;
  onPostDeleted?: (postId: number) => void;
  onPostUpdated?: (postId: number, updates: { caption?: string; pinned?: boolean }) => void;
}

const PostCard: React.FC<PostCardProps> = ({ post, onPostDeleted, onPostUpdated }) => {
  const navigate = useNavigate();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isLiked, setIsLiked] = useState(Boolean(post.userReacted));
  const [likeCount, setLikeCount] = useState(post.likes);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSaved, setIsSaved] = useState(() => {
    // Initialize saved state from localStorage
    try {
      const savedPostIds = JSON.parse(
        localStorage.getItem("savedPosts") || "[]"
      ) as number[];
      return savedPostIds.includes(post.id);
    } catch {
      return false;
    }
  });
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [showMenu, setShowMenu] = useState(false);
  const [isPinned, setIsPinned] = useState(!!post.pinned);
  const [isLoading, setIsLoading] = useState(false);
  const [isImageViewerOpen, setIsImageViewerOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isVideoViewerOpen, setIsVideoViewerOpen] = useState(false);
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const menuRef = useRef<HTMLDivElement>(null);
  const MAX_CAPTION_LENGTH = 150;

  // Only post author can edit, delete, or pin
  const user = getUserData();
  const currentUserId = (user?.user_id as number) ?? ((user as { id?: number })?.id as number) ?? null;
  const isOwnPost = post.userId != null && currentUserId != null && post.userId === currentUserId;

  // Fixed caption handling with null checks
  const caption = post.caption || "";
  const shouldTruncate = caption.length > MAX_CAPTION_LENGTH;

  const displayCaption =
    shouldTruncate && !isExpanded
      ? `${caption.substring(0, MAX_CAPTION_LENGTH)}...`
      : caption;

  useEffect(() => {
    setIsLiked(Boolean(post.userReacted));
    setLikeCount(post.likes);
  }, [post.id, post.likes, post.userReacted]);

  const getTotalReactionCount = (
    reactions: PostReactionStat[] | undefined,
    fallbackCount: number
  ) => {
    if (!Array.isArray(reactions)) return fallbackCount;

    return reactions.reduce(
      (total, currentReaction) =>
        total + Number(currentReaction.count || 0),
      0
    );
  };

  const handleLike = async () => {
    if (isLoading) return;
    
    // Check if user is authenticated
    if (!isAuthenticated()) {
      alert("Please sign in to like posts.");
      navigate("/signin");
      return;
    }

    setIsLoading(true);
    try {
      if (isLiked) {
        const response = await feedApi.removeReaction(post.id);
        setIsLiked(false);
        setLikeCount(
          getTotalReactionCount(
            response.data?.reactions,
            Math.max(likeCount - 1, 0)
          )
        );
      } else {
        const response = await feedApi.reactToPost(post.id, "like");
        const hasUserReaction = Boolean(response.data?.user_reaction);
        setIsLiked(hasUserReaction);
        setLikeCount(
          getTotalReactionCount(response.data?.reactions, likeCount + 1)
        );
        
        // Dispatch event for notification system
        const user = getUserData();
        const currentUserId = (user?.user_id as number) || ((user as { id?: number })?.id as number) || null;
        const currentUserName = getUserName();
        
        if (response && response.data && hasUserReaction) {
          const likeEvent = new CustomEvent("postLiked", {
            detail: {
              postId: post.id,
              postOwnerName: post.userName,
              postOwnerAvatar: post.userAvatar,
              likerId: currentUserId,
              likerName: currentUserName,
              likerAvatar: "", // Will be fetched if needed
            },
          });
          window.dispatchEvent(likeEvent);
        }
      }
    } catch (error) {
      console.error("Error reacting to post:", error);
      alert(
        error instanceof Error ? error.message : "Failed to update reaction."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = () => {
    const newSavedState = !isSaved;
    setIsSaved(newSavedState);

    // Save/unsave post in localStorage
    try {
      const savedPostIds = JSON.parse(
        localStorage.getItem("savedPosts") || "[]"
      ) as number[];

      if (newSavedState) {
        // Add post ID to saved posts
        if (!savedPostIds.includes(post.id)) {
          savedPostIds.push(post.id);
          localStorage.setItem("savedPosts", JSON.stringify(savedPostIds));
        }

        // Also save the full post data for the Saved page
        const allPosts = JSON.parse(
          localStorage.getItem("allPosts") || "[]"
        ) as Post[];
        const postExists = allPosts.some((p) => p.id === post.id);
        if (!postExists) {
          allPosts.push(post);
          localStorage.setItem("allPosts", JSON.stringify(allPosts));
        }
      } else {
        // Remove post ID from saved posts
        const updatedIds = savedPostIds.filter((id) => id !== post.id);
        localStorage.setItem("savedPosts", JSON.stringify(updatedIds));
      }

      // Dispatch custom event to notify Saved page
      window.dispatchEvent(new Event("savedPostsUpdated"));
    } catch (error) {
      console.error("Error saving post:", error);
    }
  };

  const handleCommentClick = async () => {
    const newShowComments = !showComments;
    setShowComments(newShowComments);
    
    // Load comments when opening
    if (newShowComments && comments.length === 0) {
      try {
        const response = await feedApi.getPostComments(post.id);
        if (response.success && response.data) {
          const formattedComments: Comment[] = response.data.map((comment: ApiComment) => ({
            id: comment.comment_id,
            userName: comment.user?.display_name || "Unknown",
            userAvatar: comment.user?.profile_image_url || "/placeholder-avatar.png",
            text: comment.text || "",
            timeAgo: comment.time_ago || "just now",
          }));
          setComments(formattedComments);
        }
      } catch (error) {
        console.error("Error loading comments:", error);
      }
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || isLoading) return;
    
    // Check if user is authenticated
    if (!isAuthenticated()) {
      alert("Please sign in to comment on posts.");
      navigate("/signin");
      return;
    }
    
    setIsLoading(true);
    try {
      const response = await feedApi.commentOnPost(post.id, { text: newComment });
      if (response.success && response.data) {
        const newCommentData: Comment = {
          id: response.data.comment_id,
          userName: response.data.user?.display_name || "You",
          userAvatar: response.data.user?.profile_image_url || post.userAvatar,
          text: response.data.text || newComment,
          timeAgo: response.data.time_ago || "just now",
        };
        setComments([...comments, newCommentData]);
        setNewComment("");
        
        // Dispatch event for notification system
        const user = getUserData();
        const currentUserId = (user?.user_id as number) || ((user as { id?: number })?.id as number) || null;
        const currentUserName = getUserName();
        
        const commentEvent = new CustomEvent("postCommented", {
          detail: {
            postId: post.id,
            postOwnerName: post.userName,
            postOwnerAvatar: post.userAvatar,
            commenterId: currentUserId,
            commenterName: currentUserName,
            commenterAvatar: response.data.user?.profile_image_url || "",
            commentText: newComment,
          },
        });
        window.dispatchEvent(commentEvent);
      }
    } catch (error) {
      console.error("Error adding comment:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleShare = async () => {
    if (isLoading) return;
    
    // Check if user is authenticated
    if (!isAuthenticated()) {
      alert("Please sign in to share posts.");
      navigate("/signin");
      return;
    }

    setIsLoading(true);
    try {
      // Share to feed
      await feedApi.sharePost(post.id);
      
      // Also use native share if available
      if (navigator.share) {
        await navigator.share({
          title: `${post.userName}'s post`,
          text: caption || post.hashtags || "",
          url: window.location.href,
        });
      } else {
        await navigator.clipboard.writeText(window.location.href);
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
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = () => {
    setShowMenu(false);
    const newText = window.prompt("Edit post caption:", caption);
    if (newText === null) return;
    setIsLoading(true);
    feedApi
      .updatePost(post.id, { text: newText })
      .then(() => {
        onPostUpdated?.(post.id, { caption: newText });
      })
      .catch((err) => {
        console.error("Error updating post:", err);
        alert(err instanceof Error ? err.message : "Failed to update post.");
      })
      .finally(() => setIsLoading(false));
  };

  const handleDelete = () => {
    setShowMenu(false);
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = async () => {
    setIsDeleting(true);
    try {
      await feedApi.deletePost(post.id);
      setShowDeleteConfirm(false);
      onPostDeleted?.(post.id);
    } catch (error) {
      console.error("Error deleting post:", error);
      alert(error instanceof Error ? error.message : "Failed to delete post.");
    } finally {
      setIsDeleting(false);
    }
  };

  const handlePin = () => {
    setShowMenu(false);
    const newPinned = !isPinned;
    setIsLoading(true);
    feedApi
      .pinPost(post.id, newPinned)
      .then(() => {
        setIsPinned(newPinned);
        onPostUpdated?.(post.id, { pinned: newPinned });
      })
      .catch((err) => {
        console.error("Error pinning post:", err);
        alert(err instanceof Error ? err.message : "Failed to update pin.");
      })
      .finally(() => setIsLoading(false));
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

  // Get all images and videos
  const getAllImages = useCallback(() => {
    const imageArray: string[] = [];
    if (post.images && post.images.length > 0) {
      imageArray.push(...post.images.filter(img => img && img.trim()));
    } else if (post.image && post.image.trim()) {
      imageArray.push(post.image);
    }
    return imageArray;
  }, [post.images, post.image]);

  const getAllVideos = useCallback(() => {
    const videoArray: string[] = [];
    if (post.videos && post.videos.length > 0) {
      videoArray.push(...post.videos.filter(vid => vid && vid.trim()));
    } else if (post.video && post.video.trim()) {
      videoArray.push(post.video);
    }
    return videoArray;
  }, [post.videos, post.video]);

  const handleOpenImageViewer = (index: number) => {
    setCurrentImageIndex(index);
    setIsImageViewerOpen(true);
  };

  const handleOpenVideoViewer = (index: number) => {
    setCurrentVideoIndex(index);
    setIsVideoViewerOpen(true);
  };

  const handleCloseImageViewer = useCallback(() => {
    setIsImageViewerOpen(false);
  }, []);

  const handleCloseVideoViewer = useCallback(() => {
    setIsVideoViewerOpen(false);
  }, []);

  const handleNextImage = useCallback(() => {
    const images = getAllImages();
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  }, [getAllImages]);

  const handlePrevImage = useCallback(() => {
    const images = getAllImages();
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  }, [getAllImages]);

  const handleNextVideo = useCallback(() => {
    const videos = getAllVideos();
    setCurrentVideoIndex((prev) => (prev + 1) % videos.length);
  }, [getAllVideos]);

  const handlePrevVideo = useCallback(() => {
    const videos = getAllVideos();
    setCurrentVideoIndex((prev) => (prev - 1 + videos.length) % videos.length);
  }, [getAllVideos]);

  // Keyboard navigation for image viewer
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isImageViewerOpen && !isVideoViewerOpen) return;

      if (e.key === "Escape") {
        if (isImageViewerOpen) handleCloseImageViewer();
        if (isVideoViewerOpen) handleCloseVideoViewer();
      } else if (e.key === "ArrowLeft") {
        if (isImageViewerOpen) handlePrevImage();
        if (isVideoViewerOpen) handlePrevVideo();
      } else if (e.key === "ArrowRight") {
        if (isImageViewerOpen) handleNextImage();
        if (isVideoViewerOpen) handleNextVideo();
      }
    };

    if (isImageViewerOpen || isVideoViewerOpen) {
      document.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden"; // Prevent background scrolling
    }

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [
    isImageViewerOpen,
    isVideoViewerOpen,
    handleCloseImageViewer,
    handleCloseVideoViewer,
    handleNextImage,
    handlePrevImage,
    handleNextVideo,
    handlePrevVideo,
  ]);

  return (
    <article className="newsfeed-post" data-post-id={post.id}>
      <div className="newsfeed-post__header">
        <div className="newsfeed-post__user-info">
          <Avatar
            src={post.userAvatar}
            name={post.userName}
            size={40}
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
        {isOwnPost && (
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
        )}
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
          imageArray.push(...post.images.filter(img => img && img.trim()));
        } else if (post.image && post.image.trim()) {
          imageArray.push(post.image);
        }

        if (imageArray.length === 0) return null;

        const totalImages = imageArray.length;
        const showRemaining = totalImages > 3;
        const displayImages = showRemaining ? imageArray.slice(0, 3) : imageArray;
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
                      className={`newsfeed-post__image-item ${showRemaining && index === 2 ? "newsfeed-post__image-item--last" : ""}`}
                      onClick={() => handleOpenImageViewer(index)}
                      style={{ cursor: "pointer" }}
                    >
                      <LazyImage
                        src={img}
                        alt={`${post.action || caption || "Post image"} ${index + 1}`}
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
                          <span className="newsfeed-post__remaining-count">+{remainingCount}</span>
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

      {(() => {
        // Get all videos - support both single video and videos array
        const videoArray: string[] = [];
        if (post.videos && post.videos.length > 0) {
          videoArray.push(...post.videos.filter(vid => vid && vid.trim()));
        } else if (post.video && post.video.trim()) {
          videoArray.push(post.video);
        }

        if (videoArray.length === 0) return null;

        const totalVideos = videoArray.length;
        const showRemaining = totalVideos > 3;
        const displayVideos = showRemaining ? videoArray.slice(0, 3) : videoArray;
        const remainingCount = totalVideos - 3;

        // If more than 2 videos, use grid layout
        const useGrid = totalVideos > 2;
        const gridClass = useGrid ? "newsfeed-post__images-grid" : "";
        const wrapperClass = useGrid 
          ? "newsfeed-post__images-wrapper" 
          : "newsfeed-post__image-wrapper";

        return (
          <>
            <div className={wrapperClass}>
              {useGrid ? (
                <div className={gridClass}>
                  {displayVideos.map((vid, index) => (
                    <div 
                      key={index} 
                      className={`newsfeed-post__image-item ${showRemaining && index === 2 ? "newsfeed-post__image-item--last" : ""}`}
                      onClick={() => handleOpenVideoViewer(index)}
                      style={{ cursor: "pointer" }}
                    >
                      <video
                        src={vid}
                        controls
                        className="newsfeed-post__image"
                        style={{ 
                          width: "100%", 
                          height: "100%",
                          maxHeight: "400px", 
                          objectFit: "contain",
                          boxSizing: "border-box"
                        }}
                        onClick={(e) => e.stopPropagation()}
                        onError={(e) => {
                          console.error("Error loading video:", vid);
                          const target = e.target as HTMLVideoElement;
                          target.style.display = "none";
                        }}
                      >
                        Your browser does not support the video tag.
                      </video>
                      {showRemaining && index === 2 && (
                        <div 
                          className="newsfeed-post__remaining-overlay"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenVideoViewer(2);
                          }}
                        >
                          <span className="newsfeed-post__remaining-count">+{remainingCount}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                videoArray.map((vid, index) => (
                  <div
                    key={index}
                    onClick={() => handleOpenVideoViewer(index)}
                    style={{ cursor: "pointer" }}
                  >
                    <video
                      src={vid}
                      controls
                      className="newsfeed-post__image"
                      style={{ 
                        width: "100%", 
                        maxWidth: "100%",
                        maxHeight: "600px", 
                        objectFit: "contain",
                        boxSizing: "border-box"
                      }}
                      onClick={(e) => e.stopPropagation()}
                      onError={(e) => {
                        console.error("Error loading video:", vid);
                        const target = e.target as HTMLVideoElement;
                        target.style.display = "none";
                      }}
                    >
                      Your browser does not support the video tag.
                    </video>
                  </div>
                ))
              )}
            </div>
            {isVideoViewerOpen && (
              <VideoViewer
                videos={videoArray}
                currentIndex={currentVideoIndex}
                onClose={handleCloseVideoViewer}
                onNext={handleNextVideo}
                onPrev={handlePrevVideo}
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
            title={isLiked ? "Liked" : "Like"}
            aria-pressed={isLiked}
          >
            <ThumbsUp size={20} />
            <span>{isLiked ? "Liked" : "Like"}</span>
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
                    <Avatar
                      src={comment.userAvatar}
                      name={comment.userName}
                      size={32}
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

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleConfirmDelete}
        title="Delete Post"
        message="Are you sure you want to delete this post? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        type="delete"
        isLoading={isDeleting}
      />
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

// Full-screen Video Viewer Component
interface VideoViewerProps {
  videos: string[];
  currentIndex: number;
  onClose: () => void;
  onNext: () => void;
  onPrev: () => void;
}

const VideoViewer: React.FC<VideoViewerProps> = ({
  videos,
  currentIndex,
  onClose,
  onNext,
  onPrev,
}) => {
  if (videos.length === 0) return null;

  return (
    <div className="newsfeed-image-viewer" onClick={onClose}>
      <button
        className="newsfeed-image-viewer__close"
        onClick={onClose}
        aria-label="Close viewer"
      >
        <X size={32} />
      </button>
      {videos.length > 1 && (
        <>
          <button
            className="newsfeed-image-viewer__nav newsfeed-image-viewer__nav--prev"
            onClick={(e) => {
              e.stopPropagation();
              onPrev();
            }}
            aria-label="Previous video"
          >
            <ChevronLeft size={40} />
          </button>
          <button
            className="newsfeed-image-viewer__nav newsfeed-image-viewer__nav--next"
            onClick={(e) => {
              e.stopPropagation();
              onNext();
            }}
            aria-label="Next video"
          >
            <ChevronRight size={40} />
          </button>
          <div className="newsfeed-image-viewer__counter">
            {currentIndex + 1} / {videos.length}
          </div>
        </>
      )}
      <div
        className="newsfeed-image-viewer__content"
        onClick={(e) => e.stopPropagation()}
      >
        <video
          src={videos[currentIndex]}
          controls
          autoPlay
          className="newsfeed-image-viewer__video"
        >
          Your browser does not support the video tag.
        </video>
      </div>
    </div>
  );
};

export default PostCard;
