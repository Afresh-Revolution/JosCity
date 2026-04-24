import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { X, Send, Heart, Loader2 } from "lucide-react";
import { reelsApi, ReelComment } from "../services/reelsApi";
import { getUserData, getUserName } from "../utils/userUtils";

interface LocalComment extends ReelComment {
  likes: number;
  isLiked?: boolean;
}

interface ReelCommentModalProps {
  isOpen: boolean;
  onClose: () => void;
  videoId: number;
  videoTitle?: string;
  onCommentAdded?: () => void;
}

const normalizeComment = (comment: ReelComment): LocalComment => ({
  ...comment,
  likes: 0,
  isLiked: false,
});

const getCommentAuthorName = (comment: LocalComment) => {
  const authorName =
    comment.author?.name ||
    comment.user?.display_name ||
    (comment as { business_name?: string }).business_name;

  if (authorName && String(authorName).trim()) {
    return String(authorName).trim();
  }

  const currentUser = getUserData();
  const currentUserId =
    (currentUser?.user_id as number) ||
    ((currentUser as { id?: number } | null)?.id as number) ||
    null;

  if (currentUserId != null && Number(comment.user_id) === Number(currentUserId)) {
    return getUserName();
  }

  return "Citizen";
};

const ReelCommentModal: React.FC<ReelCommentModalProps> = ({
  isOpen,
  onClose,
  videoId,
  videoTitle,
  onCommentAdded,
}) => {
  const [mounted, setMounted] = React.useState(false);
  const [comments, setComments] = useState<LocalComment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  useEffect(() => {
    if (!isOpen) {
      document.body.style.overflow = "";
      return;
    }

    document.body.style.overflow = "hidden";
    setError(null);
    setIsLoading(true);

    reelsApi
      .getComments(videoId)
      .then((loadedComments) => {
        setComments(loadedComments.map(normalizeComment));
      })
      .catch((loadError) => {
        const message =
          loadError instanceof Error
            ? loadError.message
            : "Failed to load comments.";
        setError(message);
        setComments([]);
      })
      .finally(() => {
        setIsLoading(false);
      });

    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen, videoId]);

  const handleOverlayClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget) {
      onClose();
    }
  };

  const handleSubmitComment = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!newComment.trim() || isSubmitting) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const createdComment = await reelsApi.addComment(videoId, newComment.trim());
      const commentToInsert = normalizeComment(
        createdComment || {
          post_id: videoId,
          user_id: 0,
          created_at: new Date().toISOString(),
          text: newComment.trim(),
          time_ago: "just now",
          author: {
            id: 0,
            name: "You",
          },
        }
      );

      setComments((previous) => [commentToInsert, ...previous]);
      setNewComment("");
      onCommentAdded?.();
    } catch (submitError) {
      const message =
        submitError instanceof Error
          ? submitError.message
          : "Failed to post comment.";
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLikeComment = (commentId: number) => {
    setComments((previous) =>
      previous.map((comment) => {
        const currentId = comment.id || comment.comment_id;
        if (currentId !== commentId) {
          return comment;
        }

        const isLiked = comment.isLiked || false;
        return {
          ...comment,
          isLiked: !isLiked,
          likes: isLiked ? Math.max(0, comment.likes - 1) : comment.likes + 1,
        };
      })
    );
  };

  if (!mounted || !isOpen) return null;

  const modalContent = (
    <div className="reel-comment-modal-overlay" onClick={handleOverlayClick}>
      <div className="reel-comment-modal" onClick={(event) => event.stopPropagation()}>
        <div className="reel-comment-modal__header">
          <h3 className="reel-comment-modal__title">
            Comments {videoTitle && `on "${videoTitle}"`}
          </h3>
          <button
            className="reel-comment-modal__close"
            onClick={onClose}
            aria-label="Close comments"
          >
            <X size={24} />
          </button>
        </div>

        <div className="reel-comment-modal__content">
          <div className="reel-comment-modal__comments">
            {isLoading ? (
              <div className="reels-loading">
                <Loader2 size={24} className="reels-loading__spinner" />
                <p>Loading comments...</p>
              </div>
            ) : error ? (
              <div className="reels-error">
                <p>{error}</p>
              </div>
            ) : comments.length === 0 ? (
              <div className="reel-comment-modal__empty">
                <p>No comments yet. Be the first to comment!</p>
              </div>
            ) : (
              comments.map((comment, index) => {
                const commentId = comment.id || comment.comment_id || 0;
                const authorName = getCommentAuthorName(comment);
                const commentKey =
                  commentId > 0
                    ? `comment-${commentId}`
                    : `comment-${comment.user_id || "anon"}-${
                        comment.created_at || "now"
                      }-${index}`;

                return (
                  <div key={commentKey} className="reel-comment-modal__comment">
                    <div className="reel-comment-modal__comment-avatar">
                      {authorName.charAt(0).toUpperCase()}
                    </div>
                    <div className="reel-comment-modal__comment-content">
                      <div className="reel-comment-modal__comment-header">
                        <span className="reel-comment-modal__comment-author">
                          {authorName}
                        </span>
                        <span className="reel-comment-modal__comment-time">
                          {comment.time_ago || "just now"}
                        </span>
                      </div>
                      <p className="reel-comment-modal__comment-text">
                        {comment.text || comment.comment}
                      </p>
                      <button
                        className={`reel-comment-modal__comment-like ${
                          comment.isLiked
                            ? "reel-comment-modal__comment-like--liked"
                            : ""
                        }`}
                        onClick={() => handleLikeComment(commentId)}
                        aria-label="Like comment"
                      >
                        <Heart
                          size={16}
                          fill={comment.isLiked ? "#e91e63" : "none"}
                          color={comment.isLiked ? "#e91e63" : "currentColor"}
                        />
                        <span>{comment.likes}</span>
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <form
          className="reel-comment-modal__form"
          onSubmit={handleSubmitComment}
        >
          <input
            type="text"
            className="reel-comment-modal__input"
            placeholder="Add a comment..."
            value={newComment}
            onChange={(event) => setNewComment(event.target.value)}
            disabled={isSubmitting}
          />
          <button
            type="submit"
            className="reel-comment-modal__submit"
            disabled={!newComment.trim() || isSubmitting}
            aria-label="Post comment"
          >
            <Send size={20} />
          </button>
        </form>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

export default ReelCommentModal;
