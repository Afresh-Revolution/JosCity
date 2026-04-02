import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import NewsFeedHeader from "./NewsFeedHeader";
import NewsFeedSidebar from "./NewsFeedSidebar";
import ChatPanel from "../../components/ChatPanel";
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
  const [isChatPanelOpen, setIsChatPanelOpen] = useState(false);
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);
  const sectionName = SECTION_NAMES[section] || section || "This section";

  return (
    <div className="newsfeed-page">
      <NewsFeedHeader
        isLeftSidebarOpen={isLeftSidebarOpen}
        onToggleLeftSidebar={() => setIsLeftSidebarOpen(!isLeftSidebarOpen)}
        showCreateMenu={false}
        showRightSidebarToggle={false}
        unreadNotificationsCount={0}
        unreadMessagesCount={unreadMessagesCount}
        onNotificationClick={() => {}}
        onAddFriendClick={() => {}}
        onMessageClick={() => setIsChatPanelOpen(true)}
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
              <p className="coming-soon-section__message">
                {sectionName} is under development. We're bringing you an
                amazing experience — please check back soon!
              </p>
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
      <ChatPanel
        isOpen={isChatPanelOpen}
        onClose={() => setIsChatPanelOpen(false)}
        onUnreadCountChange={setUnreadMessagesCount}
      />
    </div>
  );
};

export default ComingSoonSection;
