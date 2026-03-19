import React, { useEffect, useState, useRef, useCallback } from "react";
import { Play, Search, X, ArrowUpDown, Loader2 } from "lucide-react";
import "../../main.css";
import ReelVideoModal from "../../components/ReelVideoModal";
import ChatPanel from "../../components/ChatPanel";
import NewsFeedHeader from "./NewsFeedHeader";
import NewsFeedSidebar from "./NewsFeedSidebar";

interface VideoData {
  id: number;
  views: string;
  title?: string;
  videoUrl?: string;
  category?: string;
  createdAt?: Date;
  viewCount?: number;
}

type SortOption = "recent" | "views" | "trending";

// Sample video thumbnails data with video URLs
const initialVideos: VideoData[] = [
  {
    id: 1,
    views: "345",
    title: "Reel Video 1",
    videoUrl:
      "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
    category: "Films",
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
    viewCount: 345,
  },
  {
    id: 2,
    views: "1.2K",
    title: "Reel Video 2",
    videoUrl:
      "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
    category: "Art",
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
    viewCount: 1200,
  },
  {
    id: 3,
    views: "856",
    title: "Reel Video 3",
    videoUrl:
      "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
    category: "Music",
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
    viewCount: 856,
  },
  {
    id: 4,
    views: "2.5K",
    title: "Reel Video 4",
    videoUrl:
      "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
    category: "Dance",
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
    viewCount: 2500,
  },
];

const Reels: React.FC = () => {
  const [selectedVideo, setSelectedVideo] = useState<VideoData | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLeftSidebarOpen, setIsLeftSidebarOpen] = useState(false);
  const [isChatPanelOpen, setIsChatPanelOpen] = useState(false);
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);
  const [videos, setVideos] = useState<VideoData[]>([]);
  const [filteredVideos, setFilteredVideos] = useState<VideoData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [sortOption, setSortOption] = useState<SortOption>("recent");
  const [error, setError] = useState<string | null>(null);
  const observerTarget = useRef<HTMLDivElement>(null);
  const mainContentRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Add class to body and html to hide scrollbars
    document.body.classList.add("reels-page-active");
    document.documentElement.classList.add("reels-page-active");

    // Cleanup: remove class when component unmounts
    return () => {
      document.body.classList.remove("reels-page-active");
      document.documentElement.classList.remove("reels-page-active");
    };
  }, []);

  const categories = [
    "Causes",
    "Art",
    "Crafts",
    "Dance",
    "Drinks",
    "Films",
    "Fitness",
    "Food",
    "Game",
    "Party",
    "Health",
    "Sport",
    "Literature",
    "Music",
    "Party",
    "Religion",
    "Others",
  ];

  // Initialize videos on mount
  useEffect(() => {
    setVideos(initialVideos);
  }, []);

  // Get category count
  const getCategoryCount = useCallback((category: string): number => {
    if (category === "All") {
      return videos.length;
    }
    return videos.filter((video) => video.category === category).length;
  }, [videos]);

  // Sort videos function
  const sortVideos = useCallback((videosToSort: VideoData[], sortBy: SortOption): VideoData[] => {
    const sorted = [...videosToSort];
    switch (sortBy) {
      case "recent":
        return sorted.sort((a, b) => {
          const dateA = a.createdAt?.getTime() || 0;
          const dateB = b.createdAt?.getTime() || 0;
          return dateB - dateA; // Newest first
        });
      case "views":
        return sorted.sort((a, b) => {
          const viewsA = a.viewCount || 0;
          const viewsB = b.viewCount || 0;
          return viewsB - viewsA; // Most views first
        });
      case "trending":
        // Trending: combination of recent views and recency
        return sorted.sort((a, b) => {
          const dateA = a.createdAt?.getTime() || 0;
          const dateB = b.createdAt?.getTime() || 0;
          const viewsA = a.viewCount || 0;
          const viewsB = b.viewCount || 0;
          // Trending score: views per day
          const daysA = Math.max(1, (Date.now() - dateA) / (24 * 60 * 60 * 1000));
          const daysB = Math.max(1, (Date.now() - dateB) / (24 * 60 * 60 * 1000));
          const scoreA = viewsA / daysA;
          const scoreB = viewsB / daysB;
          return scoreB - scoreA;
        });
      default:
        return sorted;
    }
  }, []);

  // Filter and sort videos
  useEffect(() => {
    let filtered = videos;

    // Filter by category
    if (selectedCategory !== "All") {
      filtered = filtered.filter((video) => video.category === selectedCategory);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (video) =>
          video.title?.toLowerCase().includes(query) ||
          video.category?.toLowerCase().includes(query)
      );
    }

    // Sort videos
    const sorted = sortVideos(filtered, sortOption);
    setFilteredVideos(sorted);
  }, [selectedCategory, videos, searchQuery, sortOption, sortVideos]);

  // Load more videos function
  const loadMoreVideos = useCallback(() => {
    if (isLoading || !hasMore) return;

    setIsLoading(true);
    setError(null);

    // Simulate API call delay
    setTimeout(() => {
      try {
        const categories = ["Films", "Art", "Music", "Dance", "Fitness", "Food", "Sport"];
        const newVideos: VideoData[] = Array.from({ length: 4 }, (_, i) => {
          const viewCount = Math.floor(Math.random() * 5000);
          const daysAgo = Math.floor(Math.random() * 7);
          return {
            id: videos.length + i + 1,
            views: viewCount > 1000 ? `${(viewCount / 1000).toFixed(1)}K` : `${viewCount}`,
            title: `Reel Video ${videos.length + i + 1}`,
            videoUrl: [
              "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
              "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
              "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
              "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
            ][i % 4],
            category: categories[Math.floor(Math.random() * categories.length)],
            createdAt: new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000),
            viewCount: viewCount,
          };
        });

        setVideos((prev) => [...prev, ...newVideos]);
        setIsLoading(false);

        // Stop loading after 20 videos (for demo purposes)
        if (videos.length + newVideos.length >= 20) {
          setHasMore(false);
        }
      } catch (err) {
        setError("Failed to load more videos. Please try again.");
        setIsLoading(false);
        console.error("Error loading videos:", err);
      }
    }, 500);
  }, [videos.length, isLoading, hasMore]);

  // Intersection Observer for infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoading) {
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
    };
  }, [loadMoreVideos, hasMore, isLoading]);

  const handleVideoClick = (video: VideoData) => {
    setSelectedVideo(video);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedVideo(null);
  };

  // Get the initial video index when opening modal
  const getInitialVideoIndex = () => {
    if (!selectedVideo) return 0;
    const index = filteredVideos.findIndex((v) => v.id === selectedVideo.id);
    return index >= 0 ? index : 0;
  };

  // Clear filters
  const handleClearFilters = () => {
    setSelectedCategory("All");
    setSearchQuery("");
    if (searchInputRef.current) {
      searchInputRef.current.value = "";
    }
  };

  // Handle manual load more
  const handleLoadMore = () => {
    loadMoreVideos();
  };

  return (
    <div className="reels-page">
      {/* Top Navigation Bar */}
      <NewsFeedHeader
        isLeftSidebarOpen={isLeftSidebarOpen}
        onToggleLeftSidebar={() => setIsLeftSidebarOpen(!isLeftSidebarOpen)}
        showCreateMenu={true}
        showRightSidebarToggle={false}
        unreadNotificationsCount={0}
        unreadMessagesCount={unreadMessagesCount}
        onNotificationClick={() => {
          // Handle notification click
        }}
        onAddFriendClick={() => {
          // Handle add friend click
        }}
        onMessageClick={() => setIsChatPanelOpen(true)}
        onCreateClick={() => {
          // Handle create click
        }}
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

        {/* Main Content Area */}
        <main className="reels-main" ref={mainContentRef}>
          {/* Search and Sort Bar */}
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
          </div>

          {/* Horizontal Category Filter Bar */}
          <div className="reels-category-filter">
            <div className="reels-category-filter__wrapper">
              <div className="reels-category-filter__fade reels-category-filter__fade--left"></div>
              <div className="reels-category-filter__scroll">
                <button
                  className={`reels-category-filter__item ${
                    selectedCategory === "All" ? "reels-category-filter__item--active" : ""
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
                    key={index}
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

          {/* Scrollable Content Area */}
          <div className="reels-content">
            {/* Video Grid */}
            <div className="reels-grid">
            {filteredVideos.map((video) => (
              <div
                key={video.id}
                className="reels-video-card"
                onClick={() => handleVideoClick(video)}
              >
                <div className="reels-video-thumbnail">
                  {/* Placeholder for video thumbnail - you can replace with actual image */}
                  <div className="reels-video-placeholder">
                    <svg
                      width="100%"
                      height="100%"
                      viewBox="0 0 300 400"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      {/* Background */}
                      <rect width="300" height="400" fill="#f5f5f5" />
                      {/* Garment shape */}
                      <path
                        d="M150 50 L200 150 L200 350 L100 350 L100 150 Z"
                        fill="white"
                        stroke="#ddd"
                        strokeWidth="2"
                      />
                      {/* Hanger */}
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
                      {/* Textured pattern on garment */}
                      <circle cx="150" cy="200" r="2" fill="#e0e0e0" />
                      <circle cx="140" cy="220" r="2" fill="#e0e0e0" />
                      <circle cx="160" cy="220" r="2" fill="#e0e0e0" />
                      <circle cx="150" cy="240" r="2" fill="#e0e0e0" />
                      <circle cx="140" cy="260" r="2" fill="#e0e0e0" />
                      <circle cx="160" cy="260" r="2" fill="#e0e0e0" />
                    </svg>
                  </div>
                  {/* Play button overlay */}
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

            {/* Loading indicator, error, and infinite scroll trigger */}
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
              {!isLoading && hasMore && (
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
              {!hasMore && videos.length > 4 && (
                <div className="reels-end-message">
                  <p>You've reached the end!</p>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>

      {/* Video Player Modal */}
      <ReelVideoModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        videos={filteredVideos}
        initialVideoIndex={getInitialVideoIndex()}
      />
      <ChatPanel
        isOpen={isChatPanelOpen}
        onClose={() => setIsChatPanelOpen(false)}
        onUnreadCountChange={setUnreadMessagesCount}
      />
    </div>
  );
};

export default Reels;
