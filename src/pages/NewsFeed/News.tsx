import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search } from "lucide-react";
import "../../main.css";
import NewsFeedSidebar from "./NewsFeedSidebar";
import NewsFeedHeader from "./NewsFeedHeader";
import { getProfileUsername } from "../../utils/userUtils";

const News: React.FC = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [isLeftSidebarOpen, setIsLeftSidebarOpen] = useState(false);
  
  // Modal/Panel states
  const [isAddFriendModalOpen, setIsAddFriendModalOpen] = useState(false);
  const [isChatPanelOpen, setIsChatPanelOpen] = useState(false);
  const [isNotificationPanelOpen, setIsNotificationPanelOpen] = useState(false);
  const [notifications] = useState<any[]>([]); // Empty notifications for now

  // Calculate unread notifications count
  const unreadNotificationsCount = notifications.filter(
    (n) => !n.isRead
  ).length;

  // Handle profile navigation
  const handleProfileClick = () => {
    const username = getProfileUsername();
    navigate(`/profile/${encodeURIComponent(username)}`);
  };

  // Handle notification click
  const handleNotificationClick = () => {
    setIsNotificationPanelOpen(true);
  };

  // Handle message click
  const handleMessageClick = () => {
    setIsChatPanelOpen(true);
  };

  // Handle add friend click
  const handleAddFriendClick = () => {
    setIsAddFriendModalOpen(true);
  };

  return (
    <div className="news-page">
      {/* Top Navigation Bar - Using NewsFeed Header */}
      <NewsFeedHeader
        isLeftSidebarOpen={isLeftSidebarOpen}
        onToggleLeftSidebar={() => setIsLeftSidebarOpen(!isLeftSidebarOpen)}
        onProfileClick={handleProfileClick}
        onNotificationClick={handleNotificationClick}
        onMessageClick={handleMessageClick}
        onAddFriendClick={handleAddFriendClick}
        unreadNotificationsCount={unreadNotificationsCount}
      />

      {/* Mobile Overlay */}
      {isLeftSidebarOpen && (
        <div
          className="newsfeed-overlay"
          onClick={() => setIsLeftSidebarOpen(false)}
        />
      )}

      {/* Container for sidebar and main content */}
      <div className="newsfeed-container newsfeed-container--no-aside">
        {/* Navigation Menu Sidebar */}
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
                        fill="#ff9800"
                        stroke="#ff6f00"
                        strokeWidth="1"
                      />
                      {/* NEWS text */}
                      <text
                        x="30"
                        y="25"
                        fontSize="16"
                        fontWeight="bold"
                        fill="#ff6f00"
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
                <p className="news-banner__subtitle">Discover events.</p>
              </div>
            </div>
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
