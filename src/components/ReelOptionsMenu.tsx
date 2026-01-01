import React, { useEffect } from "react";
import { createPortal } from "react-dom";
import {
  Bookmark,
  RefreshCw,
  Film,
  ClosedCaption,
  Maximize,
  Eye,
  EyeOff,
  AlertCircle,
  Settings,
} from "lucide-react";

interface ReelOptionsMenuProps {
  isOpen: boolean;
  onClose: () => void;
  videoId: number;
  isSaved?: boolean;
  isInterested?: boolean;
  isNotInterested?: boolean;
  closedCaptionsEnabled?: boolean;
  isFullscreen?: boolean;
  onSave?: () => void;
  onRemix?: () => void;
  onSequence?: () => void;
  onToggleClosedCaptions?: () => void;
  onToggleFullscreen?: () => void;
  onInterested?: () => void;
  onNotInterested?: () => void;
  onReport?: () => void;
  onManagePreferences?: () => void;
}

const ReelOptionsMenu: React.FC<ReelOptionsMenuProps> = ({
  isOpen,
  onClose,
  isSaved = false,
  isInterested = false,
  isNotInterested = false,
  closedCaptionsEnabled = false,
  isFullscreen = false,
  onSave,
  onRemix,
  onSequence,
  onToggleClosedCaptions,
  onToggleFullscreen,
  onInterested,
  onNotInterested,
  onReport,
  onManagePreferences,
}) => {
  const [mounted, setMounted] = React.useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!mounted || !isOpen) return null;

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleSave = () => {
    onSave?.();
    onClose();
  };

  const handleRemix = () => {
    onRemix?.();
    onClose();
  };

  const handleSequence = () => {
    onSequence?.();
    onClose();
  };

  const handleClosedCaptions = () => {
    onToggleClosedCaptions?.();
    // Don't close menu when toggling closed captions
  };

  const handleFullscreen = () => {
    onToggleFullscreen?.();
    // Don't close menu when toggling fullscreen
  };

  const handleInterested = () => {
    onInterested?.();
    onClose();
  };

  const handleNotInterested = () => {
    onNotInterested?.();
    onClose();
  };

  const handleReport = () => {
    onReport?.();
    // Menu will close after user confirms/cancels in the alert
    setTimeout(() => {
      onClose();
    }, 100);
  };

  const handleManagePreferences = () => {
    onManagePreferences?.();
    onClose();
  };

  const menuContent = (
    <div className="reel-options-menu-overlay" onClick={handleOverlayClick}>
      <div className="reel-options-menu" onClick={(e) => e.stopPropagation()}>
        {/* Handle */}
        <div className="reel-options-menu__handle" />

        {/* Top Action Buttons */}
        <div className="reel-options-menu__top-actions">
          <button
            className={`reel-options-menu__top-action ${
              isSaved ? "reel-options-menu__top-action--saved" : ""
            }`}
            onClick={handleSave}
          >
            <div className="reel-options-menu__top-action-icon">
              <Bookmark size={24} fill={isSaved ? "currentColor" : "none"} />
            </div>
            <span className="reel-options-menu__top-action-label">
              {isSaved ? "Saved" : "Save"}
            </span>
          </button>

          <button
            className="reel-options-menu__top-action"
            onClick={handleRemix}
          >
            <div className="reel-options-menu__top-action-icon">
              <RefreshCw size={24} />
              <span className="reel-options-menu__top-action-plus">+</span>
            </div>
            <span className="reel-options-menu__top-action-label">Remix</span>
          </button>

          <button
            className="reel-options-menu__top-action"
            onClick={handleSequence}
          >
            <div className="reel-options-menu__top-action-icon">
              <Film size={24} />
              <span className="reel-options-menu__top-action-plus">+</span>
            </div>
            <span className="reel-options-menu__top-action-label">
              Sequence
            </span>
          </button>
        </div>

        {/* Menu Items */}
        <div className="reel-options-menu__items">
          <button
            className={`reel-options-menu__item ${
              closedCaptionsEnabled ? "reel-options-menu__item--active" : ""
            }`}
            onClick={handleClosedCaptions}
          >
            <ClosedCaption size={24} className="reel-options-menu__item-icon" />
            <span className="reel-options-menu__item-text">
              {closedCaptionsEnabled
                ? "Hide Closed Captions"
                : "Show Closed Captions"}
            </span>
          </button>

          <button
            className={`reel-options-menu__item ${
              isFullscreen ? "reel-options-menu__item--active" : ""
            }`}
            onClick={handleFullscreen}
          >
            <Maximize size={24} className="reel-options-menu__item-icon" />
            <span className="reel-options-menu__item-text">
              {isFullscreen ? "Exit fullscreen" : "View fullscreen"}
            </span>
          </button>

          <button
            className={`reel-options-menu__item ${
              isInterested ? "reel-options-menu__item--active" : ""
            }`}
            onClick={handleInterested}
          >
            <Eye size={24} className="reel-options-menu__item-icon" />
            <span className="reel-options-menu__item-text">
              {isInterested ? "Remove from Interested" : "Interested"}
            </span>
          </button>

          <button
            className={`reel-options-menu__item ${
              isNotInterested ? "reel-options-menu__item--active" : ""
            }`}
            onClick={handleNotInterested}
          >
            <EyeOff size={24} className="reel-options-menu__item-icon" />
            <span className="reel-options-menu__item-text">
              {isNotInterested
                ? "Remove from Not Interested"
                : "Not interested"}
            </span>
          </button>

          <button
            className="reel-options-menu__item reel-options-menu__item--danger"
            onClick={handleReport}
          >
            <AlertCircle
              size={24}
              className="reel-options-menu__item-icon reel-options-menu__item-icon--danger"
            />
            <span className="reel-options-menu__item-text reel-options-menu__item-text--danger">
              Report...
            </span>
          </button>
        </div>

        {/* Bottom Item */}
        <div className="reel-options-menu__footer">
          <button
            className="reel-options-menu__footer-item"
            onClick={handleManagePreferences}
          >
            <Settings size={24} className="reel-options-menu__item-icon" />
            <span className="reel-options-menu__item-text">
              Manage content preferences
            </span>
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(menuContent, document.body);
};

export default ReelOptionsMenu;
