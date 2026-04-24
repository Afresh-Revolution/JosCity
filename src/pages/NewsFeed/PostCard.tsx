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
import type { ListingDetails } from "../../utils/mapFeedApiItemToPost";
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

interface EmbeddedPost {
  id: number;
  userId?: number;
  userName: string;
  userAvatar: string;
  timeAgo: string;
  caption?: string;
  image?: string;
  images?: string[];
  video?: string;
  videos?: string[];
  unavailable?: boolean;
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
  userShared?: boolean;
  userSaved?: boolean;
  originalPost?: EmbeddedPost;
  listingDetails?: ListingDetails | null;
}

interface PostCardProps {
  post: Post;
  onPostDeleted?: (postId: number) => void;
  onPostUpdated?: (postId: number, updates: { caption?: string; pinned?: boolean }) => void;
  /** Draft scheduled posts: hide feed actions; delete calls scheduled-posts API. */
  variant?: "feed" | "scheduled";
}

const PostCard: React.FC<PostCardProps> = ({
  post,
  onPostDeleted,
  onPostUpdated,
  variant = "feed",
}) => {
  const navigate = useNavigate();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isLiked, setIsLiked] = useState(Boolean(post.userReacted));
  const [hasShared, setHasShared] = useState(Boolean(post.userShared));
  const [likeCount, setLikeCount] = useState(post.likes);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSaved, setIsSaved] = useState(() => Boolean(post.userSaved));
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

  const getImageSources = useCallback(
    (postItem: { images?: string[]; image?: string }) => {
      const imageArray: string[] = [];
      if (postItem.images && postItem.images.length > 0) {
        imageArray.push(...postItem.images.filter((img) => img && img.trim()));
      } else if (postItem.image && postItem.image.trim()) {
        imageArray.push(postItem.image);
      }
      return imageArray;
    },
    []
  );

  const getVideoSources = useCallback(
    (postItem: { videos?: string[]; video?: string }) => {
      const videoArray: string[] = [];
      if (postItem.videos && postItem.videos.length > 0) {
        videoArray.push(...postItem.videos.filter((vid) => vid && vid.trim()));
      } else if (postItem.video && postItem.video.trim()) {
        videoArray.push(postItem.video);
      }
      return videoArray;
    },
    []
  );

  const renderSharedOriginalPost = (originalPost: EmbeddedPost) => {
    if (originalPost.unavailable) {
      return (
        <div className="newsfeed-post__shared-card newsfeed-post__shared-card--unavailable">
          <p>Original post is no longer available.</p>
        </div>
      );
    }

    const originalImages = getImageSources(originalPost);
    const originalVideos = getVideoSources(originalPost);

    return (
      <div className="newsfeed-post__shared-card">
        <div className="newsfeed-post__shared-header">
          <Avatar
            src={originalPost.userAvatar}
            name={originalPost.userName}
            size={36}
            className="newsfeed-post__shared-avatar"
          />
          <div className="newsfeed-post__shared-details">
            <h4 className="newsfeed-post__shared-name">{originalPost.userName}</h4>
            <span className="newsfeed-post__shared-time">
              {originalPost.timeAgo}
            </span>
          </div>
        </div>

        {originalPost.caption && (
          <div className="newsfeed-post__shared-caption">
            <p>{originalPost.caption}</p>
          </div>
        )}

        {originalImages.length > 0 && (
          <div className="newsfeed-post__shared-media">
            {originalImages.map((imageSrc, index) => (
              <LazyImage
                key={`${originalPost.id}-image-${index}`}
                src={imageSrc}
                alt={`${originalPost.userName}'s post image ${index + 1}`}
                className="newsfeed-post__image"
              />
            ))}
          </div>
        )}

        {originalVideos.length > 0 && (
          <div className="newsfeed-post__shared-media">
            {originalVideos.map((videoSrc, index) => (
              <video
                key={`${originalPost.id}-video-${index}`}
                src={videoSrc}
                controls
                className="newsfeed-post__image"
                style={{ width: "100%", height: "auto", display: "block" }}
              />
            ))}
          </div>
        )}
      </div>
    );
  };

  useEffect(() => {
    setIsLiked(Boolean(post.userReacted));
    setLikeCount(post.likes);
    setHasShared(Boolean(post.userShared));
    setIsSaved(Boolean(post.userSaved));
  }, [post.id, post.likes, post.userReacted, post.userShared, post.userSaved]);

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

  const handleSave = async () => {
    if (!isAuthenticated()) {
      alert("Please sign in to save posts.");
      navigate("/signin");
      return;
    }

    const nextSaved = !isSaved;
    setIsSaved(nextSaved);

    try {
      if (nextSaved) {
        const res = await feedApi.savePost(post.id);
        if (!res.success) throw new Error("Save failed");
      } else {
        const res = await feedApi.unsavePost(post.id);
        if (!res.success) throw new Error("Unsave failed");
      }
      window.dispatchEvent(new Event("savedPostsUpdated"));
    } catch (error) {
      console.error("Error saving post:", error);
      setIsSaved(!nextSaved);
      alert(
        error instanceof Error ? error.message : "Could not update saved posts."
      );
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
            id: comment.comment_id ?? comment.id ?? Date.now(),
            userName: (() => {
              const backendName =
                comment.author?.name || comment.user?.display_name;
              if (backendName && String(backendName).trim()) {
                return String(backendName).trim();
              }

              const currentUser = getUserData();
              const currentUserId =
                (currentUser?.user_id as number) ||
                ((currentUser as { id?: number } | null)?.id as number) ||
                null;
              if (
                currentUserId != null &&
                Number(comment.user_id) === Number(currentUserId)
              ) {
                return getUserName();
              }

              return "Unknown User";
            })(),
            userAvatar:
              comment.author?.picture ||
              comment.user?.profile_image_url ||
              "",
            text: comment.text || comment.comment || "",
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
          id: response.data.comment_id ?? response.data.id ?? Date.now(),
          userName: (() => {
            const backendName =
              response.data.author?.name || response.data.user?.display_name;
            if (backendName && String(backendName).trim()) {
              return String(backendName).trim();
            }
            return getUserName();
          })(),
          userAvatar:
            response.data.author?.picture ||
            response.data.user?.profile_image_url ||
            post.userAvatar,
          text: response.data.text || response.data.comment || newComment,
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
            commenterAvatar:
              response.data.author?.picture ||
              response.data.user?.profile_image_url ||
              "",
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
      const response = await feedApi.sharePost(post.id);
      if (response.success) {
        setHasShared(true);
        window.dispatchEvent(
          new CustomEvent("feedPostShared", {
            detail: response.data,
          })
        );
      }
    } catch (error) {
      console.error("Error sharing:", error);
      alert(
        error instanceof Error
          ? error.message
          : "Failed to share this post into the feed."
      );
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
      if (variant === "scheduled") {
        await feedApi.deleteScheduledPost(post.id);
      } else {
        await feedApi.deletePost(post.id);
      }
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
  const getAllImages = useCallback(() => getImageSources(post), [getImageSources, post]);

  const getAllVideos = useCallback(() => getVideoSources(post), [getVideoSources, post]);

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
                {variant === "feed" && (
                  <>
                    <button className="newsfeed-post__menu-item" onClick={handleEdit}>
                      <Edit size={18} />
                      <span>Edit Post</span>
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
                  </>
                )}
                <button
                  className="newsfeed-post__menu-item"
                  onClick={handleDelete}
                >
                  <Trash2 size={18} />
                  <span>
                    {variant === "scheduled"
                      ? "Cancel schedule"
                      : "Delete Post"}
                  </span>
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

      {post.listingDetails &&
        (post.listingDetails.text ||
          (post.listingDetails.byMediaIndex &&
            post.listingDetails.byMediaIndex.some(Boolean))) && (
          <div className="newsfeed-post__listing" aria-label="Listing details">
            {post.listingDetails.text &&
              (post.listingDetails.text.cost ||
                post.listingDetails.text.location ||
                post.listingDetails.text.contact) && (
                <>
                  <div className="newsfeed-post__listing-row">
                    <span className="newsfeed-post__listing-label">
                      Description listing
                    </span>
                  </div>
                  {post.listingDetails.text.cost ? (
                    <div className="newsfeed-post__listing-row">
                      <span className="newsfeed-post__listing-label">Price</span>
                      {post.listingDetails.text.cost}
                    </div>
                  ) : null}
                  {post.listingDetails.text.location ? (
                    <div className="newsfeed-post__listing-row">
                      <span className="newsfeed-post__listing-label">
                        Location
                      </span>
                      {post.listingDetails.text.location}
                    </div>
                  ) : null}
                  {post.listingDetails.text.contact ? (
                    <div className="newsfeed-post__listing-row">
                      <span className="newsfeed-post__listing-label">
                        Contact
                      </span>
                      {post.listingDetails.text.contact}
                    </div>
                  ) : null}
                </>
              )}
            {post.listingDetails.byMediaIndex?.map((off, idx) => {
              if (
                !off ||
                (!off.cost && !off.location && !off.contact)
              ) {
                return null;
              }
              return (
                <React.Fragment key={`listing-media-${idx}`}>
                  <div className="newsfeed-post__listing-row">
                    <span className="newsfeed-post__listing-label">
                      Item {idx + 1}
                    </span>
                  </div>
                  {off.cost ? (
                    <div className="newsfeed-post__listing-row">
                      <span className="newsfeed-post__listing-label">Price</span>
                      {off.cost}
                    </div>
                  ) : null}
                  {off.location ? (
                    <div className="newsfeed-post__listing-row">
                      <span className="newsfeed-post__listing-label">
                        Location
                      </span>
                      {off.location}
                    </div>
                  ) : null}
                  {off.contact ? (
                    <div className="newsfeed-post__listing-row">
                      <span className="newsfeed-post__listing-label">
                        Contact
                      </span>
                      {off.contact}
                    </div>
                  ) : null}
                </React.Fragment>
              );
            })}
          </div>
        )}

      {post.originalPost && renderSharedOriginalPost(post.originalPost)}

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

      {variant !== "scheduled" && (
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
              className={`newsfeed-post__action-btn ${
                hasShared ? "newsfeed-post__action-btn--active" : ""
              }`}
              onClick={handleShare}
              title={hasShared ? "Shared" : "Share"}
            >
              <Share2 size={20} />
              <span>{hasShared ? "Shared" : "Share"}</span>
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
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleConfirmDelete}
        title={variant === "scheduled" ? "Cancel scheduled post?" : "Delete Post"}
        message={
          variant === "scheduled"
            ? "This draft will be removed and will not be published."
            : "Are you sure you want to delete this post? This action cannot be undone."
        }
        confirmText={variant === "scheduled" ? "Cancel schedule" : "Delete"}
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
