import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import NewsFeedHeader from "./NewsFeedHeader";
import NewsFeedSidebar from "./NewsFeedSidebar";
import "../../scss/_newsfeed.scss";

const SECTION_NAMES: Record<string, string> = {
  scheduled: "Scheduled Posts",
  saved: "Saved Posts",
  business: "Business",
  people: "People",
  reels: "Reels",
  news: "News",
  forums: "Forums",
  marketplace: "Marketplace",
  offers: "Offers",
  jobs: "Jobs",
  movies: "Movies",
  chat: "Chat",
};

const ComingSoonSection: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const section = location.pathname.replace(/^\//, "").split("/")[0];
  const [isLeftSidebarOpen, setIsLeftSidebarOpen] = useState(false);
  const sectionName = SECTION_NAMES[section] || section || "This section";
  const comingSoonMessage =
    section === "offers" || section === "movies"
      ? "coming in version 2.0"
      : `${sectionName} is under development. We're bringing you an amazing experience - please check back soon!`;

  return (
    <div className="newsfeed-page">
      <NewsFeedHeader
        isLeftSidebarOpen={isLeftSidebarOpen}
        onToggleLeftSidebar={() => setIsLeftSidebarOpen(!isLeftSidebarOpen)}
        showCreateMenu={false}
        showRightSidebarToggle={false}
        unreadNotificationsCount={0}
        onNotificationClick={() => {}}
        onAddFriendClick={() => {}}
        onMessageClick={() => {}}
        onCreateClick={() => {}}
      />
      <div className="newsfeed-container">
        {isLeftSidebarOpen && (
          <div
            className="newsfeed-overlay"
            onClick={() => setIsLeftSidebarOpen(false)}
          />
        )}
        <NewsFeedSidebar
          isOpen={isLeftSidebarOpen}
          onClose={() => setIsLeftSidebarOpen(false)}
        />
        <main className="newsfeed-main">
          <div className="coming-soon-section">
            <div className="coming-soon-section__card">
              <h1 className="coming-soon-section__title">Coming Soon</h1>
              <p className="coming-soon-section__message">{comingSoonMessage}</p>
              <button
                type="button"
                className="coming-soon-section__back"
                onClick={() => navigate("/newsfeed")}
              >
                Back to News Feed
              </button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default ComingSoonSection;
