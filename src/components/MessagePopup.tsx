import React, { useEffect } from "react";
import { X, MessageCircle } from "lucide-react";
import LazyImage from "./LazyImage";
import "../scss/_messagepopup.scss";

interface MessagePopupProps {
  userId: number;
  userName: string;
  userAvatar: string;
  message: string;
  timestamp: string;
  onClose: () => void;
  onOpenChat?: () => void;
}

const MessagePopup: React.FC<MessagePopupProps> = ({
  userName,
  userAvatar,
  message,
  timestamp,
  onClose,
  onOpenChat,
}) => {
  // Auto-close after 5 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 5000);

    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="message-popup" onClick={onClose}>
      <div
        className="message-popup__content"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          className="message-popup__close"
          onClick={onClose}
          aria-label="Close notification"
        >
          <X size={18} />
        </button>
        <div className="message-popup__header">
          <LazyImage
            src={userAvatar || "/placeholder-avatar.png"}
            alt={userName}
            className="message-popup__avatar"
          />
          <div className="message-popup__info">
            <h4 className="message-popup__name">{userName}</h4>
            <p className="message-popup__timestamp">{timestamp}</p>
          </div>
        </div>
        <div className="message-popup__body">
          <div className="message-popup__icon">
            <MessageCircle size={24} />
          </div>
          <p className="message-popup__message">{message}</p>
        </div>
        {onOpenChat && (
          <button
            className="message-popup__action"
            onClick={() => {
              onOpenChat();
              onClose();
            }}
          >
            Open Chat
          </button>
        )}
      </div>
    </div>
  );
};

export default MessagePopup;

