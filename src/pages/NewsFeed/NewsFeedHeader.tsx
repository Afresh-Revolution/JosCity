import React, { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  SquarePlus,
  UserPlus,
  MessageCircle,
  Bell,
  Menu,
  X,
  TrendingUp,
  FileText,
  Clock,
  Users,
  Calendar,
} from "lucide-react";
import LazyImage from "../../components/LazyImage";
import { getUserInitials } from "../../utils/userUtils";
import primaryLogo from "../../image/primary-logo.png";
import "./NewsFeedHeader.scss";

interface NewsFeedHeaderProps {
  isLeftSidebarOpen: boolean;
  onToggleLeftSidebar: () => void;
  isRightSidebarOpen: boolean;
  onToggleRightSidebar: () => void;
  onCreatePost: () => void;
  onCreateStory: () => void;
  onAddFriend: () => void;
  onOpenChat: () => void;
  onOpenNotifications: () => void;
  onProfileClick: () => void;
  unreadNotificationsCount: number;
  mainContentRef?: React.RefObject<HTMLElement>;
}

const NewsFeedHeader: React.FC<NewsFeedHeaderProps> = ({
  isLeftSidebarOpen,
  onToggleLeftSidebar,
  isRightSidebarOpen,
  onToggleRightSidebar,
  onCreatePost,
  onCreateStory,
  onAddFriend,
  onOpenChat,
  onOpenNotifications,
  onProfileClick,
  unreadNotificationsCount,
  mainContentRef,
}) => {
  const navigate = useNavigate();
  const [isCreateMenuOpen, setIsCreateMenuOpen] = useState(false);
  const [isNavbarVisible, setIsNavbarVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const createMenuRef = useRef<HTMLDivElement>(null);

  // Handle navbar visibility on scroll
  useEffect(() => {
    const handleScroll = () => {
      // Check both window scroll and main content scroll
      const windowScrollY = window.scrollY;
      const mainContent = mainContentRef?.current;
      const contentScrollY = mainContent ? mainContent.scrollTop : 0;

      // Use the larger of the two scroll positions
      const currentScrollY = Math.max(windowScrollY, contentScrollY);

      // Show navbar when scrolling up, hide when scrolling down
      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        // Scrolling down and past 100px - hide navbar
        setIsNavbarVisible(false);
      } else if (currentScrollY < lastScrollY) {
        // Scrolling up - show navbar
        setIsNavbarVisible(true);
      }

      // Always show navbar at the top
      if (currentScrollY < 10) {
        setIsNavbarVisible(true);
      }

      setLastScrollY(currentScrollY);
    };

    // Listen to window scroll
    window.addEventListener("scroll", handleScroll, { passive: true });

    // Listen to main content scroll
    const mainContent = mainContentRef?.current;
    if (mainContent) {
      mainContent.addEventListener("scroll", handleScroll, { passive: true });
    }

    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (mainContent) {
        mainContent.removeEventListener("scroll", handleScroll);
      }
    };
  }, [lastScrollY, mainContentRef]);

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

  const handleCreateClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsCreateMenuOpen(!isCreateMenuOpen);
  };

  const handleCreatePost = () => {
    setIsCreateMenuOpen(false);
    onCreatePost();
  };

  const handleCreateStory = () => {
    setIsCreateMenuOpen(false);
    onCreateStory();
  };

  const handleCreateGroup = () => {
    setIsCreateMenuOpen(false);
    navigate("/forums");
  };

  const handleCreateEvent = () => {
    setIsCreateMenuOpen(false);
    navigate("/events");
  };

  return (
    <header
      className={`newsfeed-header ${
        !isNavbarVisible ? "newsfeed-header--hidden" : ""
      }`}
    >
      <div className="newsfeed-header__container">
        <div className="newsfeed-header__left">
          <button
            className="newsfeed-header__menu-toggle"
            onClick={onToggleLeftSidebar}
            aria-label="Toggle menu"
          >
            {isLeftSidebarOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
          <div
            className="newsfeed-header__logo"
            onClick={() => navigate("/")}
          >
            <LazyImage src={primaryLogo} alt="JOSCity Logo" />
            <span>JosCity</span>
          </div>
        </div>
        <div className="newsfeed-header__actions">
          <div
            className="newsfeed-header__create-wrapper"
            ref={createMenuRef}
          >
            <button
              className="newsfeed-header__icon-btn"
              title="Create"
              onClick={handleCreateClick}
              type="button"
              aria-expanded={isCreateMenuOpen}
            >
              <SquarePlus size={20} />
            </button>
            {isCreateMenuOpen && (
              <div
                className="newsfeed-header__create-dropdown"
                onClick={(e) => e.stopPropagation()}
                style={{
                  display: "block",
                  visibility: "visible",
                  opacity: 1,
                  zIndex: 1003,
                }}
              >
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
                  <span>Create Forum</span>
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
          <button
            className="newsfeed-header__icon-btn"
            title="Add Friend"
            onClick={onAddFriend}
          >
            <UserPlus size={20} />
          </button>
          <button
            className="newsfeed-header__icon-btn"
            title="Messages"
            onClick={onOpenChat}
          >
            <MessageCircle size={20} />
          </button>
          <button
            className="newsfeed-header__icon-btn newsfeed-header__icon-btn--notifications"
            title="Notifications"
            onClick={onOpenNotifications}
          >
            <Bell size={20} />
            {unreadNotificationsCount > 0 && (
              <span className="newsfeed-header__badge">
                {unreadNotificationsCount > 9
                  ? "9+"
                  : unreadNotificationsCount}
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
          <button
            className="newsfeed-header__sidebar-toggle"
            onClick={onToggleRightSidebar}
            aria-label="Toggle sidebar"
            title="Trending & Friends"
          >
            <TrendingUp size={20} />
          </button>
        </div>
      </div>
    </header>
  );
};

export default NewsFeedHeader;
