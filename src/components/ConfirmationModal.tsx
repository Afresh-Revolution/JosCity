import React from "react";
import { AlertTriangle, X, Trash2, Ban, UserX } from "lucide-react";

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: "delete" | "ban" | "warning" | "danger";
  isLoading?: boolean;
  avatarUrl?: string;
  avatarInitials?: string;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  type = "warning",
  isLoading = false,
  avatarUrl,
  avatarInitials,
}) => {
  if (!isOpen) return null;

  const handleConfirm = () => {
    onConfirm();
  };

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget && !isLoading) {
      onClose();
    }
  };

  const getIcon = () => {
    switch (type) {
      case "delete":
        return <Trash2 size={32} />;
      case "ban":
        return <Ban size={32} />;
      case "danger":
        return <UserX size={32} />;
      default:
        return <AlertTriangle size={32} />;
    }
  };

  const shouldShowAvatar = Boolean(avatarUrl || avatarInitials);

  const renderIcon = () => {
    if (!shouldShowAvatar) return getIcon();

    return (
      <div className="confirmation-modal__avatar" aria-hidden="true">
        {avatarUrl ? (
          <img
            className="confirmation-modal__avatar-img"
            src={avatarUrl}
            alt=""
          />
        ) : (
          <span className="confirmation-modal__avatar-initials">
            {avatarInitials}
          </span>
        )}
      </div>
    );
  };

  const getButtonClass = () => {
    switch (type) {
      case "delete":
      case "danger":
        return "confirmation-modal__btn confirmation-modal__btn--danger";
      case "ban":
        return "confirmation-modal__btn confirmation-modal__btn--warning";
      default:
        return "confirmation-modal__btn confirmation-modal__btn--primary";
    }
  };

  return (
    <div
      className="confirmation-modal-overlay"
      onClick={handleOverlayClick}
    >
      <div className="confirmation-modal" onClick={(e) => e.stopPropagation()}>
        <button
          className="confirmation-modal__close"
          onClick={onClose}
          disabled={isLoading}
          aria-label="Close"
        >
          <X size={20} />
        </button>

        <div
          className={`confirmation-modal__icon confirmation-modal__icon--${type} ${
            shouldShowAvatar ? "confirmation-modal__icon--avatar" : ""
          }`}
        >
          {renderIcon()}
        </div>

        <h2 className="confirmation-modal__title">{title}</h2>
        <p className="confirmation-modal__message">{message}</p>

        <div className="confirmation-modal__actions">
          <button
            className="confirmation-modal__btn confirmation-modal__btn--cancel"
            onClick={onClose}
            disabled={isLoading}
          >
            {cancelText}
          </button>
          <button
            className={getButtonClass()}
            onClick={handleConfirm}
            disabled={isLoading}
          >
            {isLoading ? "Processing..." : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;

