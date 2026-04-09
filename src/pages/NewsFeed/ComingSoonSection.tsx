import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import NewsFeedHeader from "./NewsFeedHeader";
import NewsFeedSidebar from "./NewsFeedSidebar";
import ChatPanel from "../../components/ChatPanel";
import FindFriendsModal from "../../components/FindFriendsModal";
import { getProfileUsername } from "../../utils/userUtils";
import "../../scss/_newsfeed.scss";

const SECTION_NAMES: Record<string, string> = {
  scheduled: "Scheduled Posts",
  saved: "Saved Posts",
  business: "Business",
  people: "People",
  reels: "Reels",
  news: "News",
  forums: "Forums",
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
  const [isAddFriendModalOpen, setIsAddFriendModalOpen] = useState(false);
  const [isNotificationPanelOpen, setIsNotificationPanelOpen] = useState(false);
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
        unreadMessagesCount={unreadMessagesCount}
        onNotificationClick={() => setIsNotificationPanelOpen(true)}
        onAddFriendClick={() => setIsAddFriendModalOpen(true)}
        onMessageClick={() => setIsChatPanelOpen(true)}
        onCreateClick={() => navigate("/newsfeed")}
        onProfileClick={() =>
          navigate(`/profile/${encodeURIComponent(getProfileUsername())}`)
        }
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
      <ChatPanel
        isOpen={isChatPanelOpen}
        onClose={() => setIsChatPanelOpen(false)}
        onUnreadCountChange={setUnreadMessagesCount}
      />
      <FindFriendsModal
        isOpen={isAddFriendModalOpen}
        onClose={() => setIsAddFriendModalOpen(false)}
      />
      {isNotificationPanelOpen && (
        <div
          className="newsfeed-notification-panel-overlay"
          onClick={() => setIsNotificationPanelOpen(false)}
        >
          <div
            className="newsfeed-notification-panel"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="newsfeed-notification-panel__header">
              <h3>Notifications</h3>
              <button
                className="newsfeed-notification-panel__close"
                onClick={() => setIsNotificationPanelOpen(false)}
                aria-label="Close panel"
              >
                X
              </button>
            </div>
            <div className="newsfeed-notification-panel__content">
              <div className="newsfeed-notification-panel__empty">
                <p>No notifications</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ComingSoonSection;
