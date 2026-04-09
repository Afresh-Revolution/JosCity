import React, { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Bookmark } from "lucide-react";
import "../../main.css";
import NewsFeedSidebar from "./NewsFeedSidebar";
import NewsFeedHeader from "./NewsFeedHeader";
import PostCard from "./PostCard";
import { getProfileUsername } from "../../utils/userUtils";
import { feedApi } from "../../services/feedApi";
import {
  mapFeedApiItemToPost,
  type CardPostShape,
} from "../../utils/mapFeedApiItemToPost";
import { useNewsFeedNavPanels } from "../../hooks/useNewsFeedNavPanels";
import "../../scss/_saved.scss";
import "../../scss/_newsfeed.scss";
import "../../scss/_emojipicker.scss";
import "../../scss/_profilemodal.scss";
import "../../scss/_messagepopup.scss";

const Saved: React.FC = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [isLeftSidebarOpen, setIsLeftSidebarOpen] = useState(false);
  const [isRightSidebarOpen, setIsRightSidebarOpen] = useState(false);
  const [savedPosts, setSavedPosts] = useState<CardPostShape[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const mainContentRef = useRef<HTMLElement>(null);

  const loadSavedPosts = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const res = await feedApi.getSavedPosts({ page: 1, limit: 50 });
      const rows = Array.isArray(res.data) ? res.data : [];
      const mapped = rows
        .map((row) => mapFeedApiItemToPost(row))
        .filter((p): p is CardPostShape => p != null)
        .map((p) => ({ ...p, userSaved: true }));
      setSavedPosts(mapped);
    } catch (error) {
      console.error("Error loading saved posts:", error);
      setLoadError(
        error instanceof Error ? error.message : "Could not load saved posts."
      );
      setSavedPosts([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const { panels, headerNavProps } = useNewsFeedNavPanels({
    mainContentRef,
    refetchMainFeedAfterPost: false,
    afterPostCreated: () => void loadSavedPosts(),
  });

  useEffect(() => {
    void loadSavedPosts();
    const handleSavedUpdated = () => {
      void loadSavedPosts();
    };
    window.addEventListener("savedPostsUpdated", handleSavedUpdated);
    return () => {
      window.removeEventListener("savedPostsUpdated", handleSavedUpdated);
    };
  }, [loadSavedPosts]);

  const filteredPosts = savedPosts.filter((post) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      post.caption?.toLowerCase().includes(query) ||
      post.userName.toLowerCase().includes(query) ||
      post.hashtags?.toLowerCase().includes(query) ||
      post.action?.toLowerCase().includes(query)
    );
  });

  const handleProfileClick = () => {
    const username = getProfileUsername();
    if (username) {
      navigate(`/profile/${username}`);
    }
  };

  return (
    <div className="newsfeed-page saved-page">
      <NewsFeedHeader
        isLeftSidebarOpen={isLeftSidebarOpen}
        onToggleLeftSidebar={() => setIsLeftSidebarOpen(!isLeftSidebarOpen)}
        isRightSidebarOpen={isRightSidebarOpen}
        onToggleRightSidebar={() => setIsRightSidebarOpen(!isRightSidebarOpen)}
        onProfileClick={handleProfileClick}
        showRightSidebarToggle={false}
        {...headerNavProps}
        showAddFriend={false}
      />

      {(isLeftSidebarOpen || isRightSidebarOpen) && (
        <div
          className="newsfeed-overlay"
          onClick={() => {
            setIsLeftSidebarOpen(false);
            setIsRightSidebarOpen(false);
          }}
        />
      )}

      <div className="newsfeed-container newsfeed-container--no-aside">
        <NewsFeedSidebar
          isOpen={isLeftSidebarOpen}
          onClose={() => setIsLeftSidebarOpen(false)}
        />

        <main className="newsfeed-main" ref={mainContentRef}>
          <div className="newsfeed-search-section">
            <div className="newsfeed-search-section__input-wrapper">
              <input
                type="text"
                className="newsfeed-search-section__input"
                placeholder="Search saved posts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <Search className="newsfeed-search-section__icon" size={20} />
            </div>
          </div>

          <div className="newsfeed-posts">
            <div className="newsfeed-post">
              <div className="newsfeed-post__header">
                <div className="newsfeed-post__user-info">
                  <div className="newsfeed-post__avatar">
                    <Bookmark size={24} fill="currentColor" />
                  </div>
                  <div className="newsfeed-post__user-details">
                    <h3 className="newsfeed-post__user-name">Saved Posts</h3>
                    <p className="newsfeed-post__action">
                      {savedPosts.length}{" "}
                      {savedPosts.length === 1 ? "post" : "posts"} saved
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {loadError && (
              <div className="newsfeed-post">
                <div className="newsfeed-post__caption">
                  <p>{loadError}</p>
                  <button
                    type="button"
                    className="newsfeed-header__join-btn"
                    style={{ marginTop: 12 }}
                    onClick={() => void loadSavedPosts()}
                  >
                    Try again
                  </button>
                </div>
              </div>
            )}

            {isLoading && (
              <div className="newsfeed-post">
                <div className="newsfeed-post__caption">
                  <p>Loading saved posts...</p>
                </div>
              </div>
            )}

            {!isLoading && !loadError && filteredPosts.length === 0 && (
              <div className="newsfeed-post">
                <div className="newsfeed-post__caption">
                  <p>
                    {searchQuery
                      ? "No saved posts match your search."
                      : savedPosts.length === 0
                      ? "You haven't saved any posts yet. Click the bookmark icon on any post to save it."
                      : "No saved posts match your search."}
                  </p>
                </div>
              </div>
            )}

            {!isLoading &&
              !loadError &&
              filteredPosts.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
          </div>
        </main>
      </div>

      {panels}
    </div>
  );
};

export default Saved;
