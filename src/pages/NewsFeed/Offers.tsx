import React, { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { X, Calendar, Globe } from "lucide-react";
import moviesBg from "../../image/movies-bg.jpg";
import percentImage from "../../image/Adobe_ID.png";
import "../../main.css";
import "../../scss/_newsfeed.scss";
import "../../scss/_offers.scss";
import LazyImage from "../../components/LazyImage";
import OfferCard from "../../components/OfferCard";
import NewsFeedHeader from "./NewsFeedHeader";
import FindFriendsModal from "../../components/FindFriendsModal";
import ChatPanel from "../../components/ChatPanel";
import { getProfileUsername } from "../../utils/userUtils";

// API removed - using fallback data only
interface Offer {
  id: string;
  title: string;
  description?: string;
  category: string;
  image_url: string;
  discount?: number;
  company?: string;
  location?: string;
  type?: string;
  language?: string;
  valid_until?: string;
}

const Offers: React.FC = () => {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType] = useState("All Types");
  const [selectedLanguage] = useState("All Languages");
  const [activeTab, setActiveTab] = useState<"discover">("discover");
  const [isLeftSidebarOpen, setIsLeftSidebarOpen] = useState(false);
  const [allOffers, setAllOffers] = useState<Offer[]>([]);

  // Modal/Panel states
  const [isAddFriendModalOpen, setIsAddFriendModalOpen] = useState(false);
  const [isChatPanelOpen, setIsChatPanelOpen] = useState(false);
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);
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
    "Apparel & accessories",
    "Autos & vehicles",
    "Baby & children's products",
    "Beauty products & services",
    "Computers & peripherals",
    "Consumers & Electronics",
    "Dating Services",
    "Financial service",
    "Gifts & Occasions",
    "Home & Garden",
    "Other",
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Categories initialized with fallback data (API removed)
  // Categories are already set in useState above

  // API removed - no data fetching, will show empty state
  useEffect(() => {
    setIsLoading(false);
    setAllOffers([]);
    setError(null);
  }, [selectedCategory, searchQuery, selectedType, selectedLanguage]);

  const handleCategoryClick = (category: string) => {
    setSelectedCategory(category);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Search is handled by the useEffect above
  };

  // Offers are already filtered by API
  const filteredOffers = useMemo(() => {
    return allOffers;
  }, [allOffers]);

  return (
    <div className="offers-page">
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

      <div className="offers-container">
        {/* Hero/Banner Section */}
        <section className="offers-hero" style={{ backgroundImage: `url(${moviesBg})` }}>
          <div className="offers-hero__content">
            <div className="offers-hero__image">
              <LazyImage src={percentImage} alt="Percentage Symbol" />
            </div>
            <div className="offers-hero__text">
              <h1 className="offers-hero__title">Offers</h1>
              <p className="offers-hero__subtitle">Discover new offers</p>
              <form onSubmit={handleSearch} className="offers-hero__search">
                <input
                  type="text"
                  placeholder="Search for Offers"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="offers-hero__search-input"
                />
                <button
                  type="submit"
                  className="offers-hero__search-icon"
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
        <div className="offers-tabs-card">
          <div className="offers-tabs">
            <button
              className={`offers-tabs__item ${
                activeTab === "discover" ? "offers-tabs__item--active" : ""
              }`}
              onClick={() => setActiveTab("discover")}
            >
              Discover
            </button>
          </div>
        </div>

        {/* Categories and Content Section (Light Gray Background) */}
        <div className="offers-content-section">
        <div className="offers-main-layout">
          {/* Left Sidebar - Categories */}
          <aside
            className={`offers-sidebar ${
              isLeftSidebarOpen ? "offers-sidebar--open" : ""
            }`}
          >
            <button
              className="offers-sidebar__close"
              onClick={() => setIsLeftSidebarOpen(false)}
              aria-label="Close sidebar"
            >
              <X size={20} />
            </button>
            <nav className="offers-sidebar__nav">
              {categories.map((category) => (
                <button
                  key={category}
                  className={`offers-sidebar__item ${
                    selectedCategory === category
                      ? "offers-sidebar__item--active"
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
          <main className="offers-content">
            <div className="offers-content__header">
              <h2 className="offers-content__title">Offers</h2>
              <div className="offers-content__filters">
                <button
                  className={`offers-content__filter-btn ${
                    selectedType !== "All Types"
                      ? "offers-content__filter-btn--active"
                      : ""
                  }`}
                  onClick={() => {
                    // TODO: Implement type filter dropdown
                    console.log("Filter by type");
                  }}
                >
                  <Calendar size={16} />
                  <span>{selectedType}</span>
                </button>
                <button
                  className={`offers-content__filter-btn ${
                    selectedLanguage !== "All Languages"
                      ? "offers-content__filter-btn--active"
                      : ""
                  }`}
                  onClick={() => {
                    // TODO: Implement language filter dropdown
                    console.log("Filter by language");
                  }}
                >
                  <Globe size={16} />
                  <span>{selectedLanguage}</span>
                </button>
              </div>
            </div>
            {isLoading ? (
              <div className="offers-empty">
                <div className="offers-empty__icon">
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
                <h2 className="offers-empty__title">Loading...</h2>
                <p className="offers-empty__message">
                  Please wait while we fetch offers.
                </p>
              </div>
            ) : error ? (
              <div className="offers-empty">
                <div className="offers-empty__icon">
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
                <h2 className="offers-empty__title">Error</h2>
                <p className="offers-empty__message">{error}</p>
              </div>
            ) : filteredOffers.length === 0 ? (
              <div className="offers-empty">
                <div className="offers-empty__icon">
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
                <h2 className="offers-empty__title">No Data Found</h2>
                <p className="offers-empty__message">
                  There is no data to show you right now.
                </p>
              </div>
            ) : (
              <div className="offers-grid">
                {filteredOffers.map((offer) => (
                  <OfferCard
                    key={offer.id}
                    offer={{
                      id: typeof offer.id === 'string' ? parseInt(offer.id, 10) || 0 : offer.id || 0,
                      title: offer.title,
                      image: offer.image_url,
                      category: offer.category,
                      company: offer.company,
                      location: offer.location,
                      discount: offer.discount,
                      valid_until: offer.valid_until,
                    }}
                    onClick={() => {
                      // Handle offer click - can navigate to offer details page
                      console.log("Clicked offer:", offer.title);
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

export default Offers;
