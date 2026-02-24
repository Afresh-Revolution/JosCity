import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  SquarePlus,
  UserPlus,
  MessageCircle,
  Bell,
  Search,
  Menu,
  X,
  FileText,
  Clock,
  Users,
  Calendar,
  TrendingUp,
} from "lucide-react";
import primaryLogo from "../../image/primary-logo.png";
import "../../main.css";
import LazyImage from "../../components/LazyImage";
import Avatar from "../../components/Avatar";
import { getUserName } from "../../utils/userUtils";
import NewsFeedSidebar from "./NewsFeedSidebar";

const News: React.FC = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [isLeftSidebarOpen, setIsLeftSidebarOpen] = useState(false);
  const [isRightSidebarOpen, setIsRightSidebarOpen] = useState(false);
  const [isCreateMenuOpen, setIsCreateMenuOpen] = useState(false);
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

  return (
    <div className="news-page">
      {/* Top Navigation Bar */}
      <header className="newsfeed-header">
        <div className="newsfeed-header__container">
          <div className="newsfeed-header__left">
            <button
              className="newsfeed-header__menu-toggle"
              onClick={() => setIsLeftSidebarOpen(!isLeftSidebarOpen)}
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
                    onClick={() => setIsCreateMenuOpen(false)}
                  >
                    <FileText size={18} />
                    <span>Create Post</span>
                  </button>
                  <button
                    className="newsfeed-header__create-item"
                    onClick={() => setIsCreateMenuOpen(false)}
                  >
                    <Clock size={18} />
                    <span>Create Story</span>
                  </button>
                  <button
                    className="newsfeed-header__create-item"
                    onClick={() => setIsCreateMenuOpen(false)}
                  >
                    <Users size={18} />
                    <span>Create Group</span>
                  </button>
                  <button
                    className="newsfeed-header__create-item"
                    onClick={() => setIsCreateMenuOpen(false)}
                  >
                    <Calendar size={18} />
                    <span>Create Event</span>
                  </button>
                </div>
              )}
            </div>
            <button className="newsfeed-header__icon-btn" title="Add Friend">
              <UserPlus size={20} />
            </button>
            <button className="newsfeed-header__icon-btn" title="Messages">
              <MessageCircle size={20} />
            </button>
            <button
              className="newsfeed-header__icon-btn newsfeed-header__icon-btn--notifications"
              title="Notifications"
            >
              <Bell size={20} />
            </button>
            <button className="newsfeed-header__join-btn">
              <div className="newsfeed-header__join-initials">
                <Avatar
                  name={getUserName()}
                  size={32}
                  className="newsfeed-header__join-avatar"
                />
              </div>
            </button>
            <button
              className="newsfeed-header__sidebar-toggle"
              onClick={() => setIsRightSidebarOpen(!isRightSidebarOpen)}
              aria-label="Toggle sidebar"
              title="Trending & Friends"
            >
              <TrendingUp size={20} />
            </button>
          </div>
        </div>
      </header>

      {/* Overlay for mobile sidebar */}
      {isLeftSidebarOpen && (
        <div
          className="newsfeed-overlay"
          onClick={() => setIsLeftSidebarOpen(false)}
        />
      )}

      <div className="newsfeed-container">
        <NewsFeedSidebar
          isOpen={isLeftSidebarOpen}
          onClose={() => setIsLeftSidebarOpen(false)}
        />
        {/* News Banner Section */}
        <div className="news-banner">
          <div className="news-banner__content">
            <div className="news-banner__left">
              <div className="news-banner__icon-wrapper">
                <div className="news-banner__icon">
                  <svg
                    width="120"
                    height="120"
                    viewBox="0 0 120 120"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    {/* 3D Newspaper Icon */}
                    <g transform="translate(20, 20)">
                      {/* Paper base */}
                      <rect
                        x="0"
                        y="0"
                        width="60"
                        height="80"
                        rx="2"
                        fill="#f5f5f5"
                        stroke="#ddd"
                        strokeWidth="1"
                      />
                      {/* Folded corner */}
                      <path
                        d="M 60 0 L 60 20 L 40 0 Z"
                        fill="#ffd700"
                        stroke="#ffb300"
                        strokeWidth="1"
                      />
                      {/* NEWS text */}
                      <text
                        x="30"
                        y="25"
                        fontSize="16"
                        fontWeight="bold"
                        fill="#d32f2f"
                        textAnchor="middle"
                        fontFamily="Arial, sans-serif"
                      >
                        NEWS
                      </text>
                      {/* Lines on paper */}
                      <line
                        x1="10"
                        y1="35"
                        x2="50"
                        y2="35"
                        stroke="#ccc"
                        strokeWidth="1"
                      />
                      <line
                        x1="10"
                        y1="45"
                        x2="45"
                        y2="45"
                        stroke="#ccc"
                        strokeWidth="1"
                      />
                      <line
                        x1="10"
                        y1="55"
                        x2="50"
                        y2="55"
                        stroke="#ccc"
                        strokeWidth="1"
                      />
                      {/* Shadow for 3D effect */}
                      <rect
                        x="2"
                        y="78"
                        width="56"
                        height="2"
                        fill="rgba(0,0,0,0.1)"
                      />
                    </g>
                  </svg>
                </div>
              </div>
            </div>
            <div className="news-banner__right">
              <div className="news-banner__text">
                <h1 className="news-banner__title">News</h1>
                <p className="news-banner__subtitle">Discover events</p>
              </div>
              <div className="news-banner__search-wrapper">
                <input
                  type="text"
                  className="news-banner__search"
                  placeholder="Search for news"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <Search size={20} className="news-banner__search-icon" />
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <main className="news-main">
          <h2 className="news-main__title">News</h2>
          <div className="news-main__empty">
            <div className="news-main__empty-icon">
              <svg
                width="120"
                height="120"
                viewBox="0 0 120 120"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <rect
                  x="20"
                  y="30"
                  width="30"
                  height="50"
                  rx="2"
                  stroke="currentColor"
                  strokeWidth="2"
                  fill="none"
                />
                <rect
                  x="25"
                  y="35"
                  width="20"
                  height="3"
                  rx="1"
                  fill="currentColor"
                />
                <rect
                  x="25"
                  y="42"
                  width="15"
                  height="3"
                  rx="1"
                  fill="currentColor"
                />
                <rect
                  x="25"
                  y="49"
                  width="20"
                  height="3"
                  rx="1"
                  fill="currentColor"
                />
                <rect
                  x="55"
                  y="30"
                  width="30"
                  height="50"
                  rx="2"
                  stroke="currentColor"
                  strokeWidth="2"
                  fill="none"
                />
                <rect
                  x="60"
                  y="35"
                  width="20"
                  height="3"
                  rx="1"
                  fill="currentColor"
                />
                <rect
                  x="60"
                  y="42"
                  width="15"
                  height="3"
                  rx="1"
                  fill="currentColor"
                />
                <rect
                  x="60"
                  y="49"
                  width="20"
                  height="3"
                  rx="1"
                  fill="currentColor"
                />
                <rect
                  x="70"
                  y="30"
                  width="30"
                  height="50"
                  rx="2"
                  stroke="currentColor"
                  strokeWidth="2"
                  fill="none"
                />
                <rect
                  x="75"
                  y="35"
                  width="20"
                  height="3"
                  rx="1"
                  fill="currentColor"
                />
                <rect
                  x="75"
                  y="42"
                  width="15"
                  height="3"
                  rx="1"
                  fill="currentColor"
                />
                <rect
                  x="75"
                  y="49"
                  width="20"
                  height="3"
                  rx="1"
                  fill="currentColor"
                />
                <circle
                  cx="95"
                  cy="20"
                  r="15"
                  stroke="currentColor"
                  strokeWidth="2"
                  fill="none"
                />
                <path
                  d="M88 20 L92 24 L102 14"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <p className="news-main__empty-text">No Data Found</p>
            <p className="news-main__empty-subtext">
              There is no data to show you right now.
            </p>
          </div>
        </main>
      </div>
    </div>
  );
};

export default News;
