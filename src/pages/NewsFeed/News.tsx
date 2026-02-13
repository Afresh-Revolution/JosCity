import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, X } from "lucide-react";
import "../../main.css";
import "../../scss/_newsfeed.scss";
import "../../scss/_marketplace.scss";
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
    <div className="marketplace-page" style={{ paddingTop: '64px' }}>
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

      <div className="marketplace-container">
        {/* Mobile Overlay */}
        {isLeftSidebarOpen && (
          <div
            className="marketplace-overlay"
            onClick={() => setIsLeftSidebarOpen(false)}
          />
        )}

        {/* News Hero Section */}
        <section className="marketplace-hero">
          <div className="marketplace-hero__content">
            <div className="marketplace-hero__image">
              <div className="marketplace-hero__icon">
                <svg
                  width="250"
                  height="180"
                  viewBox="0 0 140 140"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  {/* 3D Newspaper Icon - Enhanced */}
                  <g transform="translate(10, 10)">
                    {/* Main paper base - white */}
                    <rect
                      x="0"
                      y="0"
                      width="80"
                      height="100"
                      rx="3"
                      fill="#ffffff"
                      stroke="#e0e0e0"
                      strokeWidth="1.5"
                    />
                    
                    {/* Folded corner - orange */}
                    <path
                      d="M 80 0 L 80 25 L 55 0 Z"
                      fill="#ff6f00"
                      stroke="#ff6f00"
                      strokeWidth="1.5"
                    />
                    
                    {/* Blue accent page edge */}
                    <rect
                      x="75"
                      y="0"
                      width="5"
                      height="100"
                      fill="#2196f3"
                      opacity="0.8"
                    />
                    
                    {/* Yellow accent stripe */}
                    <rect
                      x="0"
                      y="15"
                      width="80"
                      height="8"
                      fill="#ffc107"
                      opacity="0.6"
                    />
                    
                    {/* NEWS text - white and orange */}
                    <text
                      x="40"
                      y="35"
                      fontSize="20"
                      fontWeight="900"
                      fill="#ffffff"
                      textAnchor="middle"
                      fontFamily="Arial, sans-serif"
                      stroke="#ff6f00"
                      strokeWidth="0.5"
                    >
                      NEWS
                    </text>
                    <text
                      x="40"
                      y="35"
                      fontSize="20"
                      fontWeight="900"
                      fill="#ff6f00"
                      textAnchor="middle"
                      fontFamily="Arial, sans-serif"
                    >
                      NEWS
                    </text>
                    
                    {/* Lines on paper */}
                    <line
                      x1="12"
                      y1="50"
                      x2="68"
                      y2="50"
                      stroke="#cccccc"
                      strokeWidth="1.5"
                    />
                    <line
                      x1="12"
                      y1="60"
                      x2="65"
                      y2="60"
                      stroke="#cccccc"
                      strokeWidth="1.5"
                    />
                    <line
                      x1="12"
                      y1="70"
                      x2="68"
                      y2="70"
                      stroke="#cccccc"
                      strokeWidth="1.5"
                    />
                    <line
                      x1="12"
                      y1="80"
                      x2="60"
                      y2="80"
                      stroke="#cccccc"
                      strokeWidth="1.5"
                    />
                    
                    {/* Shadow for 3D effect */}
                    <rect
                      x="3"
                      y="98"
                      width="74"
                      height="4"
                      fill="rgba(0,0,0,0.15)"
                      rx="2"
                    />
                    
                    {/* Additional depth shadow */}
                    <ellipse
                      cx="40"
                      cy="102"
                      rx="35"
                      ry="3"
                      fill="rgba(0,0,0,0.1)"
                    />
                  </g>
                </svg>
              </div>
            </div>
            <div className="news-hero__text">
              <h1 className="news-hero__title">News</h1>
              <p className="news-hero__subtitle">Discover events</p>
              <form onSubmit={(e) => e.preventDefault()} className="news-hero__search">
                <input
                  type="text"
                  placeholder="Search for news"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="news-hero__search-input"
                />
                <button
                  type="submit"
                  className="news-hero__search-icon"
                  aria-label="Search"
                >
                  <Search size={20} />
                </button>
              </form>
            </div>
          </div>
        </section>

        {/* Container for sidebar and main content */}
        <div className="newsfeed-container newsfeed-container--no-aside">
          {/* Navigation Menu Sidebar */}
          <NewsFeedSidebar
            isOpen={isLeftSidebarOpen}
            onClose={() => setIsLeftSidebarOpen(false)}
          />

          {/* Categories and Content Section (Light Gray Background) */}
          <div className="marketplace-content-section">
            <div className="marketplace-main-layout">
              {/* Main Content Area Container */}
              <main className="marketplace-content-container">
                <div className="marketplace-content">
                <div className="marketplace-empty">
                  <div className="marketplace-empty__icon">
              <svg
                width="120"
                height="120"
                viewBox="0 0 120 120"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                {/* Document shape */}
                <rect
                  x="30"
                  y="20"
                  width="60"
                  height="80"
                  rx="3"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  fill="none"
                />
                {/* Dotted lines inside document */}
                <circle cx="40" cy="35" r="1.5" fill="currentColor" />
                <circle cx="45" cy="35" r="1.5" fill="currentColor" />
                <circle cx="50" cy="35" r="1.5" fill="currentColor" />
                <circle cx="55" cy="35" r="1.5" fill="currentColor" />
                <circle cx="60" cy="35" r="1.5" fill="currentColor" />
                <circle cx="65" cy="35" r="1.5" fill="currentColor" />
                <circle cx="70" cy="35" r="1.5" fill="currentColor" />
                <circle cx="75" cy="35" r="1.5" fill="currentColor" />
                
                <circle cx="40" cy="45" r="1.5" fill="currentColor" />
                <circle cx="45" cy="45" r="1.5" fill="currentColor" />
                <circle cx="50" cy="45" r="1.5" fill="currentColor" />
                <circle cx="55" cy="45" r="1.5" fill="currentColor" />
                <circle cx="60" cy="45" r="1.5" fill="currentColor" />
                <circle cx="65" cy="45" r="1.5" fill="currentColor" />
                <circle cx="70" cy="45" r="1.5" fill="currentColor" />
                
                <circle cx="40" cy="55" r="1.5" fill="currentColor" />
                <circle cx="45" cy="55" r="1.5" fill="currentColor" />
                <circle cx="50" cy="55" r="1.5" fill="currentColor" />
                <circle cx="55" cy="55" r="1.5" fill="currentColor" />
                <circle cx="60" cy="55" r="1.5" fill="currentColor" />
                <circle cx="65" cy="55" r="1.5" fill="currentColor" />
                <circle cx="70" cy="55" r="1.5" fill="currentColor" />
                <circle cx="75" cy="55" r="1.5" fill="currentColor" />
                
                <circle cx="40" cy="65" r="1.5" fill="currentColor" />
                <circle cx="45" cy="65" r="1.5" fill="currentColor" />
                <circle cx="50" cy="65" r="1.5" fill="currentColor" />
                <circle cx="55" cy="65" r="1.5" fill="currentColor" />
                <circle cx="60" cy="65" r="1.5" fill="currentColor" />
                <circle cx="65" cy="65" r="1.5" fill="currentColor" />
                
                <circle cx="40" cy="75" r="1.5" fill="currentColor" />
                <circle cx="45" cy="75" r="1.5" fill="currentColor" />
                <circle cx="50" cy="75" r="1.5" fill="currentColor" />
                <circle cx="55" cy="75" r="1.5" fill="currentColor" />
                <circle cx="60" cy="75" r="1.5" fill="currentColor" />
                <circle cx="65" cy="75" r="1.5" fill="currentColor" />
                <circle cx="70" cy="75" r="1.5" fill="currentColor" />
                <circle cx="75" cy="75" r="1.5" fill="currentColor" />
                
                {/* Magnifying glass overlapping */}
                <circle
                  cx="75"
                  cy="30"
                  r="18"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  fill="none"
                />
                <line
                  x1="88"
                  y1="43"
                  x2="95"
                  y2="50"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
              </svg>
                  </div>
                  <h2 className="marketplace-empty__title">No Data Found</h2>
                  <p className="marketplace-empty__message">
                    There is no data to show you right now.
                  </p>
                </div>
              </div>
            </main>
          </div>
        </div>
      </div>
    </div>
  );
};

export default News;
