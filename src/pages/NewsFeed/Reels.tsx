import React, { useEffect, useState, useRef, useCallback } from "react";
import { Play } from "lucide-react";
import "../../main.css";
import ReelVideoModal from "../../components/ReelVideoModal";
import NewsFeedHeader from "./NewsFeedHeader";
import NewsFeedSidebar from "./NewsFeedSidebar";

interface VideoData {
  id: number;
  views: string;
  title?: string;
  videoUrl?: string;
}

// Sample video thumbnails data with video URLs
const initialVideos: VideoData[] = [
  {
    id: 1,
    views: "345",
    title: "Reel Video 1",
    videoUrl:
      "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
  },
  {
    id: 2,
    views: "1.2K",
    title: "Reel Video 2",
    videoUrl:
      "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
  },
  {
    id: 3,
    views: "856",
    title: "Reel Video 3",
    videoUrl:
      "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
  },
  {
    id: 4,
    views: "2.5K",
    title: "Reel Video 4",
    videoUrl:
      "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
  },
];

const Reels: React.FC = () => {
  const [selectedVideo, setSelectedVideo] = useState<VideoData | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLeftSidebarOpen, setIsLeftSidebarOpen] = useState(false);
  const [videos, setVideos] = useState<VideoData[]>([]);
  const [filteredVideos, setFilteredVideos] = useState<VideoData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const observerTarget = useRef<HTMLDivElement>(null);
  const mainContentRef = useRef<HTMLDivElement>(null);

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
    setFilteredVideos(initialVideos);
  }, []);

  // Filter videos when category changes
  useEffect(() => {
    if (selectedCategory === "All") {
      setFilteredVideos(videos);
    } else {
      // In a real app, videos would have category metadata
      // For now, we'll just show all videos (you can add category filtering logic later)
      setFilteredVideos(videos);
    }
  }, [selectedCategory, videos]);

  // Load more videos function
  const loadMoreVideos = useCallback(() => {
    if (isLoading || !hasMore) return;

    setIsLoading(true);

    // Simulate API call delay
    setTimeout(() => {
      const newVideos: VideoData[] = Array.from({ length: 4 }, (_, i) => ({
        id: videos.length + i + 1,
        views: `${Math.floor(Math.random() * 5000)}`,
        title: `Reel Video ${videos.length + i + 1}`,
        videoUrl: [
          "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
          "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
          "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
          "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
        ][i % 4],
      }));

      setVideos((prev) => [...prev, ...newVideos]);
      setIsLoading(false);

      // Stop loading after 20 videos (for demo purposes)
      if (videos.length + newVideos.length >= 20) {
        setHasMore(false);
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
    return filteredVideos.findIndex((v) => v.id === selectedVideo.id);
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
        onNotificationClick={() => {
          // Handle notification click
        }}
        onAddFriendClick={() => {
          // Handle add friend click
        }}
        onMessageClick={() => {
          // Handle message click
        }}
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

      {/* Navigation Menu Sidebar */}
      <NewsFeedSidebar
        isOpen={isLeftSidebarOpen}
        onClose={() => setIsLeftSidebarOpen(false)}
      />

      <div className="reels-container">
        {/* Category Sidebar */}
        <aside className="reels-sidebar">
          <button
            className={`reels-sidebar__all-btn ${
              selectedCategory === "All" ? "reels-sidebar__all-btn--active" : ""
            }`}
            onClick={() => setSelectedCategory("All")}
          >
            All
          </button>
          <nav className="reels-sidebar__nav">
            <ul className="reels-sidebar__list">
              {categories.map((category, index) => (
                <li
                  key={index}
                  className={`reels-sidebar__item ${
                    selectedCategory === category
                      ? "reels-sidebar__item--active"
                      : ""
                  }`}
                  onClick={() => setSelectedCategory(category)}
                >
                  {category}
                </li>
              ))}
            </ul>
          </nav>
        </aside>

        {/* Main Content Area */}
        <main className="reels-main" ref={mainContentRef}>
          {selectedCategory !== "All" && (
            <div className="reels-category-header">
              <h2>{selectedCategory} Reels</h2>
            </div>
          )}
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

          {/* Loading indicator and infinite scroll trigger */}
          <div ref={observerTarget} className="reels-scroll-trigger">
            {isLoading && (
              <div className="reels-loading">
                <div className="reels-loading-spinner"></div>
                <p>Loading more reels...</p>
              </div>
            )}
            {!hasMore && videos.length > 4 && (
              <div className="reels-end-message">
                <p>You've reached the end!</p>
              </div>
            )}
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
    </div>
  );
};

export default Reels;
