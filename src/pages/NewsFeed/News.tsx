import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search } from "lucide-react";
import "../../main.css";
import NewsFeedSidebar from "./NewsFeedSidebar";
import NewsFeedHeader from "./NewsFeedHeader";
import ChatPanel from "../../components/ChatPanel";
import FindFriendsModal from "../../components/FindFriendsModal";
import { getProfileUsername } from "../../utils/userUtils";
import { newsApi, type NewsPost } from "../../services/newsApi";

const News: React.FC = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [isLeftSidebarOpen, setIsLeftSidebarOpen] = useState(false);
  const [isChatPanelOpen, setIsChatPanelOpen] = useState(false);
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);
  const [isAddFriendModalOpen, setIsAddFriendModalOpen] = useState(false);
  const [isNotificationPanelOpen, setIsNotificationPanelOpen] = useState(false);
  const [items, setItems] = useState<NewsPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError("");
        const data = await newsApi.getPublished(100);
        setItems(data);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "We could not load news right now."
        );
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return items;
    return items.filter(
      (item) =>
        item.title.toLowerCase().includes(q) ||
        item.content.toLowerCase().includes(q)
    );
  }, [items, searchQuery]);

  return (
    <div className="news-page">
      {/* Top Navigation Bar */}
      <NewsFeedHeader
        isLeftSidebarOpen={isLeftSidebarOpen}
        onToggleLeftSidebar={() => setIsLeftSidebarOpen(!isLeftSidebarOpen)}
        showRightSidebarToggle={false}
        onCreatePost={() => navigate("/newsfeed")}
        onCreateStory={() => navigate("/newsfeed")}
        onAddFriend={() => setIsAddFriendModalOpen(true)}
        onOpenChat={() => setIsChatPanelOpen(true)}
        onOpenNotifications={() => setIsNotificationPanelOpen(true)}
        onProfileClick={() =>
          navigate(`/profile/${encodeURIComponent(getProfileUsername())}`)
        }
        unreadMessagesCount={unreadMessagesCount}
      />

      {/* Overlay for mobile sidebar */}
      {isLeftSidebarOpen && (
        <div
          className="newsfeed-overlay"
          onClick={() => setIsLeftSidebarOpen(false)}
        />
      )}

      <div className="newsfeed-container newsfeed-container--no-aside">
        <NewsFeedSidebar
          isOpen={isLeftSidebarOpen}
          onClose={() => setIsLeftSidebarOpen(false)}
        />

        {/* Main Content Area */}
        <main className="newsfeed-main news-main">
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
                      <g transform="translate(20, 20)">
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
                        <path
                          d="M 60 0 L 60 20 L 40 0 Z"
                          fill="#ffd700"
                          stroke="#ffb300"
                          strokeWidth="1"
                        />
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
                        <line x1="10" y1="35" x2="50" y2="35" stroke="#ccc" strokeWidth="1" />
                        <line x1="10" y1="45" x2="45" y2="45" stroke="#ccc" strokeWidth="1" />
                        <line x1="10" y1="55" x2="50" y2="55" stroke="#ccc" strokeWidth="1" />
                        <rect x="2" y="78" width="56" height="2" fill="rgba(0,0,0,0.1)" />
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
          <h2 className="news-main__section-title">News</h2>
          {loading ? (
            <div className="news-main__empty">
              <p className="news-main__empty-text">Loading latest news...</p>
            </div>
          ) : error ? (
            <div className="news-main__empty">
              <p className="news-main__empty-text">{error}</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="news-main__empty">
              <p className="news-main__empty-text">No news found</p>
              <p className="news-main__empty-subtext">
                Try a different search term.
              </p>
            </div>
          ) : (
            <div className="news-main__list">
              {filtered.map((item) => {
                const images = Array.isArray(item.image_urls) ? item.image_urls.filter(Boolean) : [];
                const videos = Array.isArray(item.video_urls) ? item.video_urls.filter(Boolean) : [];
                return (
                  <article
                    key={item.id}
                    className={`news-main__card${item.is_featured ? " news-main__card--featured" : ""}`}
                  >
                    <header className="news-main__card-header">
                      <div className="news-main__card-heading-row">
                        {item.is_featured && (
                          <span className="news-main__card-badge">Featured</span>
                        )}
                        <h3 className="news-main__card-title">{item.title}</h3>
                      </div>
                      <time className="news-main__card-time" dateTime={item.created_at}>
                        {new Date(item.created_at).toLocaleString()}
                      </time>
                    </header>

                    {(images.length > 0 || videos.length > 0) && (
                      <div className="news-main__card-media" aria-label="Media">
                        {images.map((url, i) => (
                          <figure key={`${item.id}-img-${i}`} className="news-main__card-figure">
                            <img
                              src={url}
                              alt={images.length > 1 ? `${item.title} — image ${i + 1}` : item.title}
                              className="news-main__card-image"
                              loading="lazy"
                            />
                          </figure>
                        ))}
                        {videos.map((url, i) => (
                          <figure key={`${item.id}-vid-${i}`} className="news-main__card-figure news-main__card-figure--video">
                            <video controls className="news-main__card-video" preload="metadata">
                              <source src={url} />
                            </video>
                          </figure>
                        ))}
                      </div>
                    )}

                    <div className="news-main__card-body">
                      <p className="news-main__card-content">{item.content}</p>
                    </div>

                    {Array.isArray(item.source_links) && item.source_links.length > 0 && (
                      <div className="news-main__card-links">
                        {item.source_links.map((link, index) => (
                          <a
                            key={`${item.id}-link-${index}`}
                            href={link}
                            target="_blank"
                            rel="noreferrer"
                            className="news-main__card-link"
                          >
                            Source {index + 1}
                          </a>
                        ))}
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          )}
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

export default News;
