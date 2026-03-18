import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { X, Send, Heart } from "lucide-react";

interface Comment {
  id: number;
  author: string;
  text: string;
  likes: number;
  timestamp: string;
  isLiked?: boolean;
}

interface ReelCommentModalProps {
  isOpen: boolean;
  onClose: () => void;
  videoId: number;
  videoTitle?: string;
  onCommentAdded?: () => void;
}

const ReelCommentModal: React.FC<ReelCommentModalProps> = ({
  isOpen,
  onClose,
  videoId,
  videoTitle,
  onCommentAdded,
}) => {
  const [mounted, setMounted] = React.useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      // Load comments from localStorage or generate sample comments
      const savedComments = localStorage.getItem(`reel_comments_${videoId}`);
      if (savedComments) {
        try {
          setComments(JSON.parse(savedComments));
        } catch (e) {
          console.error("Error loading comments:", e);
          generateSampleComments();
        }
      } else {
        generateSampleComments();
      }
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen, videoId]);

  const generateSampleComments = () => {
    const sampleComments: Comment[] = [
      {
        id: 1,
        author: "John Doe",
        text: "This is amazing! 🔥",
        likes: 12,
        timestamp: "2 hours ago",
        isLiked: false,
      },
      {
        id: 2,
        author: "Jane Smith",
        text: "Love this content!",
        likes: 8,
        timestamp: "5 hours ago",
        isLiked: false,
      },
      {
        id: 3,
        author: "Mike Johnson",
        text: "Great work! Keep it up!",
        likes: 15,
        timestamp: "1 day ago",
        isLiked: false,
      },
    ];
    setComments(sampleComments);
  };

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || isSubmitting) return;

    setIsSubmitting(true);

    // Simulate API call delay
    await new Promise((resolve) => setTimeout(resolve, 500));

    const comment: Comment = {
      id: Date.now(),
      author: "You", // In real app, get from user context
      text: newComment.trim(),
      likes: 0,
      timestamp: "Just now",
      isLiked: false,
    };

    const updatedComments = [comment, ...comments];
    setComments(updatedComments);
    localStorage.setItem(
      `reel_comments_${videoId}`,
      JSON.stringify(updatedComments)
    );
    setNewComment("");
    setIsSubmitting(false);
    onCommentAdded?.();
  };

  const handleLikeComment = (commentId: number) => {
    setComments((prev) => {
      const updated = prev.map((comment) => {
        if (comment.id === commentId) {
          const isLiked = comment.isLiked || false;
          return {
            ...comment,
            isLiked: !isLiked,
            likes: isLiked ? comment.likes - 1 : comment.likes + 1,
          };
        }
        return comment;
      });
      localStorage.setItem(`reel_comments_${videoId}`, JSON.stringify(updated));
      return updated;
    });
  };

  if (!mounted || !isOpen) return null;

  const modalContent = (
    <div className="reel-comment-modal-overlay" onClick={handleOverlayClick}>
      <div className="reel-comment-modal" onClick={(e) => e.stopPropagation()}>
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
            {comments.length === 0 ? (
              <div className="reel-comment-modal__empty">
                <p>No comments yet. Be the first to comment!</p>
              </div>
            ) : (
              comments.map((comment) => (
                <div key={comment.id} className="reel-comment-modal__comment">
                  <div className="reel-comment-modal__comment-avatar">
                    {comment.author.charAt(0).toUpperCase()}
                  </div>
                  <div className="reel-comment-modal__comment-content">
                    <div className="reel-comment-modal__comment-header">
                      <span className="reel-comment-modal__comment-author">
                        {comment.author}
                      </span>
                      <span className="reel-comment-modal__comment-time">
                        {comment.timestamp}
                      </span>
                    </div>
                    <p className="reel-comment-modal__comment-text">
                      {comment.text}
                    </p>
                    <button
                      className={`reel-comment-modal__comment-like ${
                        comment.isLiked
                          ? "reel-comment-modal__comment-like--liked"
                          : ""
                      }`}
                      onClick={() => handleLikeComment(comment.id)}
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
              ))
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
            onChange={(e) => setNewComment(e.target.value)}
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

