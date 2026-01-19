import React, { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { X, Calendar, Globe } from "lucide-react";
import jobsImg from "../../image/jobs.png";
import moviesBg from "../../image/movies-bg.jpg";
import "../../main.css";
import "../../scss/_newsfeed.scss";
import "../../scss/_Courses.scss";
import LazyImage from "../../components/LazyImage";
import JobCard from "../../components/JobCard";
import NewsFeedHeader from "./NewsFeedHeader";
import FindFriendsModal from "../../components/FindFriendsModal";
import { getProfileUsername } from "../../utils/userUtils";

// API removed - using fallback data only
interface Course {
  id: string;
  title: string;
  year?: string;
  category: string;
  rating?: number;
  image_url: string;
  description?: string;
  company?: string;
  location?: string;
  type?: string;
  language?: string;
}

const Courses: React.FC = () => {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType] = useState("All Types");
  const [selectedLanguage] = useState("All Languages");
  const [activeTab, setActiveTab] = useState<"discover">("discover");
  const [isLeftSidebarOpen, setIsLeftSidebarOpen] = useState(false);
  const [allCourses, setAllCourses] = useState<Course[]>([]);

  // Modal/Panel states
  const [isAddFriendModalOpen, setIsAddFriendModalOpen] = useState(false);
  const [isChatPanelOpen, setIsChatPanelOpen] = useState(false);
  const [isNotificationPanelOpen, setIsNotificationPanelOpen] = useState(false);
  const [notifications] = useState<any[]>([]); // Empty notifications for now

  // Calculate unread notifications count
  const unreadNotificationsCount = notifications.filter((n) => !n.isRead).length;

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
  const [categories] = useState<string[]>([
    "All",
    "Admin & Office",
    "Arts & Designs",
    "Business & Operations",
    "Cleaning & Facilities",
    "Community & Social Service",
    "Computer & Data",
    "Constructions & Mining",
    "Education",
    "Farming & Forestry",
    "Healthcare",
    "Installation & maintenance Repair",
    "Legal",
    "management",
    "Manufacturing",
    "Media & Communication",
    "Personal Care",
    "Protective Service",
    "Restaurant & hospitality",
    "Retail & Sales",
    "Science & Engineering",
    "Sports & Entertainment",
    "Transportation",
    "Other",
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Categories initialized with fallback data (API removed)
  // Categories are already set in useState above

  // API removed - no data fetching, will show empty state
  useEffect(() => {
    setIsLoading(false);
    setAllCourses([]);
    setError(null);
  }, [selectedCategory, searchQuery, selectedType, selectedLanguage]);

  const handleCategoryClick = (category: string) => {
    setSelectedCategory(category);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Search is handled by the useEffect above
  };

  // Courses are already filtered by API
  const filteredCourses = useMemo(() => {
    return allCourses;
  }, [allCourses]);

  return (
    <div className="courses-page">
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

      <div className="courses-container">
        {/* Mobile Overlay */}
        {isLeftSidebarOpen && (
          <div
            className="courses-overlay"
            onClick={() => setIsLeftSidebarOpen(false)}
          />
        )}

        {/* Hero/Banner Section */}
        <section className="courses-hero" style={{ backgroundImage: `url(${moviesBg})` }}>
          <div className="courses-hero__content">
            <div className="courses-hero__image">
              <LazyImage src={jobsImg} alt="Courses Illustration" />
            </div>
            <div className="courses-hero__text">
              <h1 className="courses-hero__title">Courses</h1>
              <p className="courses-hero__subtitle">Discover new Courses</p>
              <form onSubmit={handleSearch} className="courses-hero__search">
                <input
                  type="text"
                  placeholder="Search for courses"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="courses-hero__search-input"
                />
                <button
                  type="submit"
                  className="courses-hero__search-icon"
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

        {/* White Rounded Card - Overlaps Hero and Contains Tabs */}
        <div className="courses-tabs-card">
          <div className="courses-tabs">
            <button
              className={`courses-tabs__item ${
                activeTab === "discover" ? "courses-tabs__item--active" : ""
              }`}
              onClick={() => setActiveTab("discover")}
            >
              Discover
            </button>
          </div>
        </div>

        {/* Categories and Content Section (Light Gray Background) */}
        <div className="courses-content-section">
        <div className="courses-main-layout">
          {/* Left Sidebar - Categories */}
          <aside
            className={`courses-sidebar ${
              isLeftSidebarOpen ? "courses-sidebar--open" : ""
            }`}
          >
            <button
              className="courses-sidebar__close"
              onClick={() => setIsLeftSidebarOpen(false)}
              aria-label="Close sidebar"
            >
              <X size={20} />
            </button>
            <nav className="courses-sidebar__nav">
              {categories.map((category) => (
                <button
                  key={category}
                  className={`courses-sidebar__item ${
                    selectedCategory === category
                      ? "courses-sidebar__item--active"
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
          <main className="courses-content">
            <div className="courses-content__header">
              <h2 className="courses-content__title">Courses</h2>
              <div className="courses-content__filters">
                <button
                  className={`courses-content__filter-btn ${
                    selectedType !== "All Types"
                      ? "courses-content__filter-btn--active"
                      : ""
                  }`}
                  onClick={() => {
                    // TODO: Implement type filter dropdown
                    // For now, just toggle between "All Types" and show a placeholder
                    console.log("Filter by type");
                  }}
                >
                  <Calendar size={16} />
                  <span>{selectedType}</span>
                </button>
                <button
                  className={`courses-content__filter-btn ${
                    selectedLanguage !== "All Languages"
                      ? "courses-content__filter-btn--active"
                      : ""
                  }`}
                  onClick={() => {
                    // TODO: Implement language filter dropdown
                    // For now, just toggle between "All Languages" and show a placeholder
                    console.log("Filter by language");
                  }}
                >
                  <Globe size={16} />
                  <span>{selectedLanguage}</span>
                </button>
              </div>
            </div>
            {isLoading ? (
              <div className="courses-empty">
                <div className="courses-empty__icon">
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
                <h2 className="courses-empty__title">Loading...</h2>
                <p className="courses-empty__message">
                  Please wait while we fetch courses.
                </p>
              </div>
            ) : error ? (
              <div className="courses-empty">
                <div className="courses-empty__icon">
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
                <h2 className="courses-empty__title">Error</h2>
                <p className="courses-empty__message">{error}</p>
              </div>
            ) : filteredCourses.length === 0 ? (
              <div className="courses-empty">
                <div className="courses-empty__icon">
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
                <h2 className="courses-empty__title">No Data Found</h2>
                <p className="courses-empty__message">
                  There is no data to show you right now.
                </p>
              </div>
            ) : (
              <div className="courses-grid">
                {filteredCourses.map((course) => (
                  <JobCard
                    key={course.id}
                    job={{
                      id: typeof course.id === 'string' ? parseInt(course.id, 10) || 0 : course.id || 0,
                      title: course.title,
                      image: course.image_url,
                      category: course.category,
                      company: course.company,
                      location: course.location,
                      type: course.type,
                      year: typeof course.year === 'string' ? parseInt(course.year) || undefined : course.year,
                      rating: typeof course.rating === 'number' ? course.rating : undefined,
                    }}
                    onClick={() => {
                      // Handle course click - can navigate to course details page
                      console.log("Clicked course:", course.title);
                    }}
                  />
                ))}
              </div>
            )}
          </main>
        </div>
        </div>
      </div>

      {/* Add Friend Modal */}
      <FindFriendsModal
        isOpen={isAddFriendModalOpen}
        onClose={() => setIsAddFriendModalOpen(false)}
      />

      {/* Chat Panel */}
      {isChatPanelOpen && (
        <div
          className="newsfeed-chat-panel-overlay"
          onClick={() => setIsChatPanelOpen(false)}
        >
          <div
            className="newsfeed-chat-panel"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="newsfeed-chat-panel__header">
              <h3>Messages</h3>
              <button
                className="newsfeed-chat-panel__close"
                onClick={() => setIsChatPanelOpen(false)}
                aria-label="Close panel"
              >
                <X size={20} />
              </button>
            </div>
            <div className="newsfeed-chat-panel__content">
              <div className="newsfeed-chat-panel__empty">
                <p>No messages yet</p>
              </div>
            </div>
          </div>
        </div>
      )}

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

export default Courses;



