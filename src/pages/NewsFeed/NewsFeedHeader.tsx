import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Menu,
  X,
  SquarePlus,
  UserPlus,
  MessageCircle,
  Bell,
  FileText,
  Clock,
  Users,
  Calendar,
  TrendingUp,
} from "lucide-react";
import LazyImage from "../../components/LazyImage";
import primaryLogo from "../../image/primary-logo.png";
import { getUserInitials } from "../../utils/userUtils";
import CreateStoryPopup from "../../components/CreateStoryPopup";

interface NewsFeedHeaderProps {
  isLeftSidebarOpen: boolean;
  onToggleLeftSidebar: () => void;
  showCreateMenu?: boolean;
  showRightSidebarToggle?: boolean;
  onRightSidebarToggle?: () => void;
  unreadNotificationsCount?: number;
  onNotificationClick?: () => void;
  onAddFriendClick?: () => void;
  onMessageClick?: () => void;
  onCreateClick?: () => void;
  onProfileClick?: () => void;
}

const NewsFeedHeader: React.FC<NewsFeedHeaderProps> = ({
  isLeftSidebarOpen,
  onToggleLeftSidebar,
  showCreateMenu = true,
  showRightSidebarToggle = false,
  onRightSidebarToggle,
  unreadNotificationsCount = 0,
  onNotificationClick,
  onAddFriendClick,
  onMessageClick,
  onCreateClick,
  onProfileClick,
}) => {
  const navigate = useNavigate();
  const [isCreateMenuOpen, setIsCreateMenuOpen] = useState(false);
  const [isStoryPopupOpen, setIsStoryPopupOpen] = useState(false);
  const createMenuRef = useRef<HTMLDivElement>(null);

  // Close create menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        createMenuRef.current &&
        !createMenuRef.current.contains(event.target as Node)
      ) {
        setIsCreateMenuOpen(false);
      }
    };

    if (isCreateMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isCreateMenuOpen]);

  const handleCreateClick = () => {
    setIsCreateMenuOpen(!isCreateMenuOpen);
  };

  const handleCreatePost = () => {
    setIsCreateMenuOpen(false);
    onCreateClick?.();
  };

  const handleCreateStory = () => {
    setIsCreateMenuOpen(false);
    setIsStoryPopupOpen(true);
    console.log("Create Story clicked - popup should open:", true);
  };

  const handleStoryPublish = (message: string, image?: string, video?: string) => {
    // Handle story publishing logic here
    console.log("Publishing story:", { message, image, video });
    onCreateClick?.();
  };

  const handleCreateGroup = () => {
    setIsCreateMenuOpen(false);
    onCreateClick?.();
  };

  const handleCreateEvent = () => {
    setIsCreateMenuOpen(false);
    onCreateClick?.();
  };

  return (
    <header className="newsfeed-header">
      <div className="newsfeed-header__container">
        <div className="newsfeed-header__left">
          <button
            className="newsfeed-header__menu-toggle"
            onClick={onToggleLeftSidebar}
            aria-label="Toggle menu"
          >
            {isLeftSidebarOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
          <div className="newsfeed-header__logo" onClick={() => navigate("/")}>
            <LazyImage src={primaryLogo} alt="JOSCity Logo" />
            <span>JosCity</span>
          </div>
        </div>
        <div className="newsfeed-header__actions">
          {showCreateMenu && (
            <div
              className="newsfeed-header__create-wrapper"
              ref={createMenuRef}
            >
              <button
                className="newsfeed-header__icon-btn"
                title="Create"
                onClick={handleCreateClick}
              >
                <SquarePlus size={20} />
              </button>
              {isCreateMenuOpen && (
                <div className="newsfeed-header__create-dropdown">
                  <button
                    className="newsfeed-header__create-item"
                    onClick={handleCreatePost}
                  >
                    <FileText size={18} />
                    <span>Create Post</span>
                  </button>
                  <button
                    className="newsfeed-header__create-item"
                    onClick={handleCreateStory}
                  >
                    <Clock size={18} />
                    <span>Create Story</span>
                  </button>
                  <button
                    className="newsfeed-header__create-item"
                    onClick={handleCreateGroup}
                  >
                    <Users size={18} />
                    <span>Create Group</span>
                  </button>
                  <button
                    className="newsfeed-header__create-item"
                    onClick={handleCreateEvent}
                  >
                    <Calendar size={18} />
                    <span>Create Event</span>
                  </button>
                </div>
              )}
            </div>
          )}
          <button
            className="newsfeed-header__icon-btn"
            title="Add Friend"
            onClick={onAddFriendClick}
          >
            <UserPlus size={20} />
          </button>
          <button
            className="newsfeed-header__icon-btn"
            title="Messages"
            onClick={onMessageClick}
          >
            <MessageCircle size={20} />
          </button>
          <button
            className="newsfeed-header__icon-btn newsfeed-header__icon-btn--notifications"
            title="Notifications"
            onClick={onNotificationClick}
          >
            <Bell size={20} />
            {unreadNotificationsCount > 0 && (
              <span className="newsfeed-header__badge">
                {unreadNotificationsCount > 9 ? "9+" : unreadNotificationsCount}
              </span>
            )}
          </button>
          <button
            className="newsfeed-header__join-btn"
            onClick={onProfileClick}
            title="View Profile"
          >
            <div className="newsfeed-header__join-initials">
              {getUserInitials()}
            </div>
          </button>
          {showRightSidebarToggle && onRightSidebarToggle && (
            <button
              className="newsfeed-header__sidebar-toggle"
              onClick={onRightSidebarToggle}
              aria-label="Toggle sidebar"
              title="Trending & Friends"
            >
              <TrendingUp size={20} />
            </button>
          )}
        </div>
      </div>
      <CreateStoryPopup
        isOpen={isStoryPopupOpen}
        onClose={() => setIsStoryPopupOpen(false)}
        onPublish={handleStoryPublish}
      />
    </header>
  );
};

export default NewsFeedHeader;
