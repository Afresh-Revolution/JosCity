import React, { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { X } from "lucide-react";
import moviesBg from "../../image/movies-bg.jpg";
import moviesImg from "../../image/movies-imgg.png";
import "../../main.css";
import "../../scss/_newsfeed.scss";
import "../../scss/_movies.scss";
import LazyImage from "../../components/LazyImage";
import MovieCard from "../../components/MovieCard";
import NewsFeedHeader from "./NewsFeedHeader";
import FindFriendsModal from "../../components/FindFriendsModal";
import ChatPanel from "../../components/ChatPanel";
import { getProfileUsername } from "../../utils/userUtils";

// API removed - using fallback data only
interface Movie {
  id: string;
  title: string;
  year: string;
  category: string;
  rating: number;
  image_url: string;
  description?: string;
}

const Movies: React.FC = () => {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [isLeftSidebarOpen, setIsLeftSidebarOpen] = useState(false);
  const [allMovies, setAllMovies] = useState<Movie[]>([]);
  const [categories, setCategories] = useState<string[]>(["All"]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Modal/Panel states
  const [isAddFriendModalOpen, setIsAddFriendModalOpen] = useState(false);
  const [isChatPanelOpen, setIsChatPanelOpen] = useState(false);
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);
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

  // Categories initialized with fallback data (API removed)
  useEffect(() => {
    setCategories([
      "All",
      "Action",
      "Comedy",
      "Drama",
      "Horror",
      "Sci-Fi",
      "Thriller",
      "Romance",
      "Adventure",
      "Animation",
      "Documentary",
    ]);
  }, []);

  // API removed - no data fetching, will show empty state
  useEffect(() => {
    setIsLoading(false);
    setAllMovies([]);
    setError(null);
  }, [selectedCategory, searchQuery]);

  const handleCategoryClick = (category: string) => {
    setSelectedCategory(category);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Search is handled by filteredMovies
  };

  // Movies are already filtered by API, but we can do client-side filtering if needed
  const filteredMovies = useMemo(() => {
    return allMovies;
  }, [allMovies]);

  return (
    <div className="movies-page">
      {/* Top Navigation Bar - Using NewsFeed Header */}
      <NewsFeedHeader
        isLeftSidebarOpen={isLeftSidebarOpen}
        onToggleLeftSidebar={() => setIsLeftSidebarOpen(!isLeftSidebarOpen)}
        onProfileClick={handleProfileClick}
        onNotificationClick={handleNotificationClick}
        onMessageClick={handleMessageClick}
        onAddFriendClick={handleAddFriendClick}
        unreadNotificationsCount={unreadNotificationsCount}
        unreadMessagesCount={unreadMessagesCount}
      />

      <div className="movies-container">
        {/* Mobile Overlay */}
        {isLeftSidebarOpen && (
          <div
            className="movies-overlay"
            onClick={() => setIsLeftSidebarOpen(false)}
          />
        )}

        {/* Hero/Banner Section */}
        <section
          className="movies-hero"
          style={{ backgroundImage: `url(${moviesBg})` }}
        >
          <div className="movies-hero__content">
            <div className="movies-hero__image">
              <LazyImage src={moviesImg} alt="Movies Store Illustration" />
            </div>
            <div className="movies-hero__text">
              <h1 className="movies-hero__title">Movies</h1>
              <p className="movies-hero__subtitle">Discover new Movies</p>
              <form onSubmit={handleSearch} className="movies-hero__search">
                <input
                  type="text"
                  placeholder="Search for products"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="movies-hero__search-input"
                />
                <button
                  type="submit"
                  className="movies-hero__search-icon"
                  aria-label="Search"
                >
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <circle cx="11" cy="11" r="8"></circle>
                    <path d="m21 21-4.35-4.35"></path>
                  </svg>
                </button>
              </form>
            </div>
          </div>
        </section>

        <div className="movies-main-layout">
          {/* Left Sidebar - Categories */}
          <aside
            className={`movies-sidebar ${
              isLeftSidebarOpen ? "movies-sidebar--open" : ""
            }`}
          >
            <div className="movies-sidebar__header">
              <h3>Categories</h3>
              <button
                className="movies-sidebar__close"
                onClick={() => setIsLeftSidebarOpen(false)}
                aria-label="Close sidebar"
              >
                <X size={20} />
              </button>
            </div>
            <nav className="movies-sidebar__nav">
              {categories.map((category) => (
                <button
                  key={category}
                  className={`movies-sidebar__item ${
                    selectedCategory === category
                      ? "movies-sidebar__item--active"
                      : ""
                  }`}
                  onClick={() => handleCategoryClick(category)}
                >
                  {category}
                </button>
              ))}
            </nav>
          </aside>

          {/* Main Content Area */}
          <main className="movies-content">
            {isLoading ? (
              <div className="movies-empty">
                <div className="movies-empty__icon">
                  <svg
                    width="80"
                    height="80"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    className="spinning"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                  </svg>
                </div>
                <h2 className="movies-empty__title">Loading...</h2>
                <p className="movies-empty__message">
                  Please wait while we fetch movies.
                </p>
              </div>
            ) : error ? (
              <div className="movies-empty">
                <div className="movies-empty__icon">
                  <svg
                    width="80"
                    height="80"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                </div>
                <h2 className="movies-empty__title">Error</h2>
                <p className="movies-empty__message">{error}</p>
              </div>
            ) : filteredMovies.length === 0 ? (
              <div className="movies-empty">
                <div className="movies-empty__icon">
                  <svg
                    width="80"
                    height="80"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  >
                    <rect x="3" y="3" width="7" height="7" rx="1" />
                    <rect x="14" y="3" width="7" height="7" rx="1" />
                    <rect x="3" y="14" width="7" height="7" rx="1" />
                    <circle cx="17.5" cy="17.5" r="3.5" />
                    <path d="M17.5 14v7M17.5 14h7" />
                  </svg>
                </div>
                <h2 className="movies-empty__title">No Data Found</h2>
                <p className="movies-empty__message">
                  There is no data to show you right now.
                </p>
              </div>
            ) : (
              <div className="movies-grid">
                {filteredMovies.map((movie) => (
                  <MovieCard
                    key={movie.id}
                    movie={{
                      id:
                        typeof movie.id === "string"
                          ? parseInt(movie.id, 10) || 0
                          : movie.id || 0,
                      title: movie.title,
                      image: movie.image_url,
                      category: movie.category,
                      year:
                        typeof movie.year === "string"
                          ? parseInt(movie.year, 10) || undefined
                          : movie.year,
                      rating:
                        typeof movie.rating === "number" ? movie.rating : 0,
                    }}
                    onClick={() => {
                      // Handle movie click - can navigate to movie details page
                      console.log("Clicked movie:", movie.title);
                    }}
                  />
                ))}
              </div>
            )}
          </main>
        </div>
      </div>

      {/* Add Friend Modal */}
      <FindFriendsModal
        isOpen={isAddFriendModalOpen}
        onClose={() => setIsAddFriendModalOpen(false)}
      />

      <ChatPanel
        isOpen={isChatPanelOpen}
        onClose={() => setIsChatPanelOpen(false)}
        onUnreadCountChange={setUnreadMessagesCount}
      />

      {/* Notification Panel */}
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
                <X size={20} />
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

export default Movies;
