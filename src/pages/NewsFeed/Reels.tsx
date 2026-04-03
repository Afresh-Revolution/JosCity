import React, { useEffect, useState, useRef, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Play, Search, X, ArrowUpDown, Loader2, Plus } from "lucide-react";
import "../../main.css";
import CreateReelModal from "../../components/CreateReelModal";
import ReelVideoModal from "../../components/ReelVideoModal";
import ChatPanel from "../../components/ChatPanel";
import FindFriendsModal from "../../components/FindFriendsModal";
import NewsFeedHeader from "./NewsFeedHeader";
import NewsFeedSidebar from "./NewsFeedSidebar";
import {
  getProfileUsername,
  getUserAvatar as getCurrentUserAvatar,
  getUserName as getCurrentUserName,
} from "../../utils/userUtils";
import { REEL_CATEGORIES } from "../../constants/reels";
import { reelsApi, ReelItem } from "../../services/reelsApi";

interface VideoData extends ReelItem {
  videoUrl?: string;
  createdAt?: Date;
  viewCount?: number;
}

type SortOption = "recent" | "views" | "trending";

const PAGE_SIZE = 12;

const mapReelToVideo = (reel: ReelItem): VideoData => ({
  ...reel,
  title: reel.title || "Untitled Reel",
  videoUrl: reel.video_url || reel.videoUrl || undefined,
  category: reel.category || "Others",
  createdAt: reel.created_at ? new Date(reel.created_at) : undefined,
  viewCount: reel.views_count || 0,
});

const mergeUniqueVideos = (current: VideoData[], incoming: VideoData[]) => {
  const byId = new Map<number, VideoData>();
  current.forEach((video) => byId.set(video.id, video));
  incoming.forEach((video) =>
    byId.set(video.id, {
      ...byId.get(video.id),
      ...video,
    })
  );
  return Array.from(byId.values());
};

const Reels: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [selectedVideo, setSelectedVideo] = useState<VideoData | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCreateReelModalOpen, setIsCreateReelModalOpen] = useState(false);
  const [isLeftSidebarOpen, setIsLeftSidebarOpen] = useState(false);
  const [isChatPanelOpen, setIsChatPanelOpen] = useState(false);
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);
  const [isAddFriendModalOpen, setIsAddFriendModalOpen] = useState(false);
  const [isNotificationPanelOpen, setIsNotificationPanelOpen] = useState(false);
  const [videos, setVideos] = useState<VideoData[]>([]);
  const [filteredVideos, setFilteredVideos] = useState<VideoData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [autoLoadPaused, setAutoLoadPaused] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [sortOption, setSortOption] = useState<SortOption>("recent");
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const observerTarget = useRef<HTMLDivElement>(null);
  const mainContentRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const activeRequestIdRef = useRef(0);

  useEffect(() => {
    document.body.classList.add("reels-page-active");
    document.documentElement.classList.add("reels-page-active");

    return () => {
      document.body.classList.remove("reels-page-active");
      document.documentElement.classList.remove("reels-page-active");
    };
  }, []);

  const categories = REEL_CATEGORIES;

  useEffect(() => {
    const routeState = location.state as { openCreateReel?: boolean } | null;
    if (!routeState?.openCreateReel) {
      return;
    }

    setIsCreateReelModalOpen(true);
    navigate(location.pathname, { replace: true, state: {} });
  }, [location.pathname, location.state, navigate]);

  const loadVideosPage = useCallback(
    async (nextPage: number, reset: boolean) => {
      const requestId = ++activeRequestIdRef.current;

      setIsLoading(true);
      if (reset) {
        setError(null);
      }
      setAutoLoadPaused(false);

      try {
        const response = await reelsApi.getReels({
          page: nextPage,
          limit: PAGE_SIZE,
          category: selectedCategory === "All" ? undefined : selectedCategory,
          search: searchQuery.trim() || undefined,
          sort: sortOption,
        });

        if (requestId !== activeRequestIdRef.current) {
          return;
        }

        const nextVideos = response.data.map(mapReelToVideo);

        setVideos((prev) =>
          reset ? nextVideos : mergeUniqueVideos(prev, nextVideos)
        );
        setHasMore(Boolean(response.pagination.hasMore));
        setPage(nextPage);
        setError(null);
        setAutoLoadPaused(false);
      } catch (err) {
        if (requestId !== activeRequestIdRef.current) {
          return;
        }

        setError(
          err instanceof Error
            ? err.message
            : "Failed to load more videos. Please try again."
        );
        setAutoLoadPaused(true);
        if (reset) {
          setVideos([]);
          setHasMore(false);
        }
      } finally {
        if (requestId === activeRequestIdRef.current) {
          setIsLoading(false);
        }
      }
    },
    [searchQuery, selectedCategory, sortOption]
  );

  useEffect(() => {
    setPage(1);
    setHasMore(true);
    setAutoLoadPaused(false);
    void loadVideosPage(1, true);
  }, [loadVideosPage]);

  const getCategoryCount = useCallback(
    (category: string): number => {
      if (category === "All") {
        return videos.length;
      }
      return videos.filter((video) => video.category === category).length;
    },
    [videos]
  );

  const sortVideos = useCallback(
    (videosToSort: VideoData[], sortBy: SortOption): VideoData[] => {
      const sorted = [...videosToSort];
      switch (sortBy) {
        case "recent":
          return sorted.sort((a, b) => {
            const dateA = a.createdAt?.getTime() || 0;
            const dateB = b.createdAt?.getTime() || 0;
            return dateB - dateA;
          });
        case "views":
          return sorted.sort((a, b) => {
            const viewsA = a.viewCount || 0;
            const viewsB = b.viewCount || 0;
            return viewsB - viewsA;
          });
        case "trending":
          return sorted.sort((a, b) => {
            const dateA = a.createdAt?.getTime() || 0;
            const dateB = b.createdAt?.getTime() || 0;
            const viewsA = a.viewCount || 0;
            const viewsB = b.viewCount || 0;
            const daysA = Math.max(
              1,
              (Date.now() - dateA) / (24 * 60 * 60 * 1000)
            );
            const daysB = Math.max(
              1,
              (Date.now() - dateB) / (24 * 60 * 60 * 1000)
            );
            const scoreA = viewsA / daysA;
            const scoreB = viewsB / daysB;
            return scoreB - scoreA;
          });
        default:
          return sorted;
      }
    },
    []
  );

  useEffect(() => {
    let filtered = videos;

    if (selectedCategory !== "All") {
      filtered = filtered.filter((video) => video.category === selectedCategory);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (video) =>
          video.title?.toLowerCase().includes(query) ||
          video.category?.toLowerCase().includes(query)
      );
    }

    const sorted = sortVideos(filtered, sortOption);
    setFilteredVideos(sorted);
  }, [selectedCategory, videos, searchQuery, sortOption, sortVideos]);

  const loadMoreVideos = useCallback(() => {
    if (isLoading || !hasMore || autoLoadPaused || !!error) return;
    void loadVideosPage(page + 1, false);
  }, [autoLoadPaused, error, hasMore, isLoading, loadVideosPage, page]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (
          entries[0].isIntersecting &&
          hasMore &&
          !isLoading &&
          !error &&
          !autoLoadPaused
        ) {
          loadMoreVideos();
        }
      },
      { threshold: 0.1 }
    );

    const currentTarget = observerTarget.current;
    if (currentTarget) {
      observer.observe(currentTarget);
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget);
      }
      observer.disconnect();
    };
  }, [autoLoadPaused, error, loadMoreVideos, hasMore, isLoading]);

  const handleVideoClick = (video: VideoData) => {
    setSelectedVideo(video);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedVideo(null);
  };

  const getInitialVideoIndex = () => {
    if (!selectedVideo) return 0;
    const index = filteredVideos.findIndex((v) => v.id === selectedVideo.id);
    return index >= 0 ? index : 0;
  };

  const handleClearFilters = () => {
    setSelectedCategory("All");
    setSearchQuery("");
    if (searchInputRef.current) {
      searchInputRef.current.value = "";
    }
  };

  const handleLoadMore = () => {
    const retryPage = videos.length > 0 ? page + 1 : 1;
    const shouldReset = videos.length === 0;
    void loadVideosPage(retryPage, shouldReset);
  };

  const handleVideoUpdate = useCallback(
    (videoId: number, updates: Partial<ReelItem>) => {
      setVideos((prev) =>
        prev.map((video) => {
          if (video.id !== videoId) {
            return video;
          }

          const merged = {
            ...video,
            ...updates,
          };

          return {
            ...merged,
            videoUrl:
              merged.videoUrl || merged.video_url || video.videoUrl || undefined,
            createdAt: merged.created_at
              ? new Date(merged.created_at)
              : video.createdAt,
            viewCount:
              typeof merged.views_count === "number"
                ? merged.views_count
                : video.viewCount,
          };
        })
      );

      setSelectedVideo((prev) =>
        prev && prev.id === videoId
          ? {
              ...prev,
              ...updates,
              videoUrl:
                (updates.videoUrl as string | undefined) ||
                (updates.video_url as string | undefined) ||
                prev.videoUrl,
              createdAt:
                typeof updates.created_at === "string"
                  ? new Date(updates.created_at)
                  : prev.createdAt,
              viewCount:
                typeof updates.views_count === "number"
                  ? updates.views_count
                  : prev.viewCount,
            }
          : prev
      );
    },
    []
  );

  const handleReelCreated = useCallback((createdReel: ReelItem) => {
    const nextVideo = mapReelToVideo(createdReel);

    setSelectedCategory("All");
    setSearchQuery("");
    setSortOption("recent");
    setError(null);
    setAutoLoadPaused(false);
    setVideos((previous) => [
      nextVideo,
      ...previous.filter((video) => video.id !== nextVideo.id),
    ]);
    mainContentRef.current?.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }, []);

  return (
    <div className="reels-page">
      <NewsFeedHeader
        isLeftSidebarOpen={isLeftSidebarOpen}
        onToggleLeftSidebar={() => setIsLeftSidebarOpen(!isLeftSidebarOpen)}
        showCreateMenu={true}
        showRightSidebarToggle={false}
        unreadNotificationsCount={0}
        unreadMessagesCount={unreadMessagesCount}
        onNotificationClick={() => setIsNotificationPanelOpen(true)}
        onAddFriendClick={() => setIsAddFriendModalOpen(true)}
        onMessageClick={() => setIsChatPanelOpen(true)}
        onCreatePost={() => navigate("/newsfeed")}
        onCreateStory={() => navigate("/newsfeed")}
        onCreateReel={() => setIsCreateReelModalOpen(true)}
        onProfileClick={() =>
          navigate(`/profile/${encodeURIComponent(getProfileUsername())}`)
        }
      />

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

        <main className="reels-main" ref={mainContentRef}>
          <div className="reels-search-sort">
            <div className="reels-search">
              <Search size={18} className="reels-search__icon" />
              <input
                ref={searchInputRef}
                type="text"
                className="reels-search__input"
                placeholder="Search reels..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button
                  className="reels-search__clear"
                  onClick={() => {
                    setSearchQuery("");
                    if (searchInputRef.current) {
                      searchInputRef.current.value = "";
                    }
                  }}
                  aria-label="Clear search"
                >
                  <X size={16} />
                </button>
              )}
            </div>
            <div className="reels-sort">
              <ArrowUpDown size={16} />
              <select
                className="reels-sort__select"
                value={sortOption}
                onChange={(e) => setSortOption(e.target.value as SortOption)}
              >
                <option value="recent">Most Recent</option>
                <option value="views">Most Viewed</option>
                <option value="trending">Trending</option>
              </select>
            </div>
            <button
              type="button"
              className="reels-create-button"
              onClick={() => setIsCreateReelModalOpen(true)}
            >
              <Plus size={16} />
              <span>Create Reel</span>
            </button>
          </div>

          <div className="reels-category-filter">
            <div className="reels-category-filter__wrapper">
              <div className="reels-category-filter__fade reels-category-filter__fade--left"></div>
              <div className="reels-category-filter__scroll">
                <button
                  className={`reels-category-filter__item ${
                    selectedCategory === "All"
                      ? "reels-category-filter__item--active"
                      : ""
                  }`}
                  onClick={() => setSelectedCategory("All")}
                >
                  ALL
                  {selectedCategory === "All" && (
                    <span className="reels-category-filter__count">
                      ({getCategoryCount("All")})
                    </span>
                  )}
                </button>
                {categories.map((category, index) => (
                  <button
                    key={`${category}-${index}`}
                    className={`reels-category-filter__item ${
                      selectedCategory === category
                        ? "reels-category-filter__item--active"
                        : ""
                    }`}
                    onClick={() => setSelectedCategory(category)}
                  >
                    {category}
                    {selectedCategory === category && (
                      <span className="reels-category-filter__count">
                        ({getCategoryCount(category)})
                      </span>
                    )}
                  </button>
                ))}
              </div>
              <div className="reels-category-filter__fade reels-category-filter__fade--right"></div>
            </div>
            {(selectedCategory !== "All" || searchQuery) && (
              <button
                className="reels-category-filter__clear"
                onClick={handleClearFilters}
                aria-label="Clear filters"
              >
                <X size={14} />
                Clear
              </button>
            )}
          </div>

          <div className="reels-content">
            <div className="reels-grid">
              {filteredVideos.map((video) => (
                <div
                  key={video.id}
                  className="reels-video-card"
                  onClick={() => handleVideoClick(video)}
                >
                  <div className="reels-video-thumbnail">
                    {video.thumbnail_url || video.thumbnailUrl ? (
                      <img
                        src={video.thumbnail_url || video.thumbnailUrl || ""}
                        alt={video.title}
                        className="reels-video-media"
                        loading="lazy"
                      />
                    ) : video.videoUrl ? (
                      <video
                        src={video.videoUrl}
                        className="reels-video-media"
                        muted
                        playsInline
                        preload="metadata"
                      />
                    ) : (
                      <div className="reels-video-placeholder">
                        <svg
                          width="100%"
                          height="100%"
                          viewBox="0 0 300 400"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <rect width="300" height="400" fill="#f5f5f5" />
                          <path
                            d="M150 50 L200 150 L200 350 L100 350 L100 150 Z"
                            fill="white"
                            stroke="#ddd"
                            strokeWidth="2"
                          />
                          <line
                            x1="150"
                            y1="50"
                            x2="150"
                            y2="30"
                            stroke="#8b7355"
                            strokeWidth="3"
                            strokeLinecap="round"
                          />
                          <path
                            d="M130 30 Q150 20 170 30"
                            stroke="#8b7355"
                            strokeWidth="3"
                            fill="none"
                            strokeLinecap="round"
                          />
                          <circle cx="150" cy="200" r="2" fill="#e0e0e0" />
                          <circle cx="140" cy="220" r="2" fill="#e0e0e0" />
                          <circle cx="160" cy="220" r="2" fill="#e0e0e0" />
                          <circle cx="150" cy="240" r="2" fill="#e0e0e0" />
                          <circle cx="140" cy="260" r="2" fill="#e0e0e0" />
                          <circle cx="160" cy="260" r="2" fill="#e0e0e0" />
                        </svg>
                      </div>
                    )}
                    <div className="reels-video-overlay">
                      <div className="reels-play-icon">
                        <Play size={24} fill="white" />
                      </div>
                      <span className="reels-video-views">{video.views}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div ref={observerTarget} className="reels-scroll-trigger">
              {error && (
                <div className="reels-error">
                  <p>{error}</p>
                  <button
                    className="reels-error__retry"
                    onClick={handleLoadMore}
                    aria-label="Retry loading"
                  >
                    Retry
                  </button>
                </div>
              )}
              {isLoading && (
                <div className="reels-loading">
                  <Loader2 size={24} className="reels-loading__spinner" />
                  <p>Loading more reels...</p>
                </div>
              )}
              {!isLoading && hasMore && !error && !autoLoadPaused && (
                <div className="reels-load-more">
                  <button
                    className="reels-load-more__button"
                    onClick={handleLoadMore}
                    aria-label="Load more reels"
                  >
                    Load More
                  </button>
                </div>
              )}
              {!isLoading && !hasMore && videos.length > 0 && (
                <div className="reels-end-message">
                  <p>You've reached the end!</p>
                </div>
              )}
              {!isLoading && !videos.length && !error && (
                <div className="reels-end-message">
                  <p>No reels available yet.</p>
                  <button
                    type="button"
                    className="reels-create-button reels-create-button--empty"
                    onClick={() => setIsCreateReelModalOpen(true)}
                  >
                    <Plus size={16} />
                    <span>Create the first reel</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>

      <ReelVideoModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        videos={filteredVideos}
        initialVideoIndex={getInitialVideoIndex()}
        onVideoUpdate={handleVideoUpdate}
      />
      <CreateReelModal
        isOpen={isCreateReelModalOpen}
        onClose={() => setIsCreateReelModalOpen(false)}
        userName={getCurrentUserName()}
        userAvatar={getCurrentUserAvatar() || undefined}
        onCreated={handleReelCreated}
      />
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

export default Reels;
