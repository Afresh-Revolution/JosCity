import React, { useState, useMemo, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  SquarePlus,
  UserPlus,
  MessageCircle,
  Bell,
  Menu,
  X,
  Calendar,
  Bookmark,
  Briefcase,
  Users,
  Calendar as Events,
  Film,
  Newspaper,
  MessageSquare,
  Store,
  Tag,
  Briefcase as Jobs,
  Video,
  Search,
  AlertCircle,
  SlidersHorizontal,
  Smile,
} from "lucide-react";
import primaryLogo from "../image/primary-logo.png";
import blessingImg from "../image/newsfeed/blessing.jpg";
import davidImg from "../image/newsfeed/David.jpg";
import chistyImg from "../image/newsfeed/chisty.jpg";
import tianaImg from "../image/newsfeed/tiana.jpg";
import willImg from "../image/newsfeed/will.jpg";
import josephImg from "../image/newsfeed/joseph.png";
import LazyImage from "./LazyImage";
import EmojiPicker from "./EmojiPicker";
import { getUserInitials, getProfileUsername } from "../utils/userUtils";
import "../main.css";
import "../scss/_emojipicker.scss";

interface User {
  id: number;
  name: string;
  avatar: string;
  location?: string;
  mutualFriends?: number;
}

// Mock user data
const mockUsers: User[] = [
  {
    id: 1,
    name: "Blessing Matthias",
    avatar: blessingImg,
    location: "Jos, Nigeria",
    mutualFriends: 5,
  },
  {
    id: 2,
    name: "David Gabriel",
    avatar: davidImg,
    location: "Abuja, Nigeria",
    mutualFriends: 3,
  },
  {
    id: 3,
    name: "Chisty Ola",
    avatar: chistyImg,
    location: "Lagos, Nigeria",
    mutualFriends: 8,
  },
  {
    id: 4,
    name: "Tiana James",
    avatar: tianaImg,
    location: "Kaduna, Nigeria",
    mutualFriends: 2,
  },
  {
    id: 5,
    name: "Will Smith",
    avatar: willImg,
    location: "Plateau, Nigeria",
    mutualFriends: 12,
  },
  {
    id: 6,
    name: "Joseph Azumara",
    avatar: josephImg,
    location: "Jos, Nigeria",
    mutualFriends: 7,
  },
  {
    id: 7,
    name: "Sarah Johnson",
    avatar: primaryLogo,
    location: "Abuja, Nigeria",
    mutualFriends: 4,
  },
  {
    id: 8,
    name: "Michael Brown",
    avatar: primaryLogo,
    location: "Lagos, Nigeria",
    mutualFriends: 6,
  },
  {
    id: 9,
    name: "Emily Davis",
    avatar: primaryLogo,
    location: "Kano, Nigeria",
    mutualFriends: 9,
  },
  {
    id: 10,
    name: "James Wilson",
    avatar: primaryLogo,
    location: "Port Harcourt, Nigeria",
    mutualFriends: 1,
  },
];

const People: React.FC = () => {
  const navigate = useNavigate();
  const [isLeftSidebarOpen, setIsLeftSidebarOpen] = useState(false);
  const [isRightSidebarOpen, setIsRightSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("find");
  const [distance, setDistance] = useState(100);
  const [searchQuery, setSearchQuery] = useState("");
  const [showNotification, setShowNotification] = useState(false);
  const [isSearchEmojiPickerOpen, setIsSearchEmojiPickerOpen] = useState(false);

  // Handle profile navigation
  const handleProfileClick = () => {
    const username = getProfileUsername();
    navigate(`/profile/${encodeURIComponent(username)}`);
  };
  const [filterQuery, setFilterQuery] = useState("");
  const [filterCity, setFilterCity] = useState("");
  const [filterState, setFilterState] = useState("Any");
  const [filterGender, setFilterGender] = useState("Any");
  const [filterRelationship, setFilterRelationship] = useState("Any");
  const [filterOnlineStatus, setFilterOnlineStatus] = useState("Any");
  const [filterVerifiedStatus, setFilterVerifiedStatus] = useState("Any");
  const [isFilterQueryEmojiPickerOpen, setIsFilterQueryEmojiPickerOpen] =
    useState(false);
  const [isFilterCityEmojiPickerOpen, setIsFilterCityEmojiPickerOpen] =
    useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const filterQueryInputRef = useRef<HTMLInputElement>(null);
  const filterCityInputRef = useRef<HTMLInputElement>(null);

  // Filter users based on search query and all filters
  const filteredUsers = useMemo(() => {
    let users = mockUsers;

    // Apply main search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      users = users.filter(
        (user) =>
          user.name.toLowerCase().includes(query) ||
          user.location?.toLowerCase().includes(query)
      );
    }

    // Apply filter query
    if (filterQuery.trim()) {
      const query = filterQuery.toLowerCase().trim();
      users = users.filter(
        (user) =>
          user.name.toLowerCase().includes(query) ||
          user.location?.toLowerCase().includes(query)
      );
    }

    // Apply city filter
    if (filterCity.trim()) {
      const city = filterCity.toLowerCase().trim();
      users = users.filter((user) =>
        user.location?.toLowerCase().includes(city)
      );
    }

    // Apply distance filter (if user has location data, this would filter by distance)
    // For now, we'll just return all users that match other filters
    // In a real implementation, this would filter by actual distance calculation

    // Note: Gender, Relationship Type, Online Status, and Verified Status filters
    // would require additional user data fields that aren't in the mock data
    // These filters are set up and ready for when real API data is integrated

    return users;
  }, [searchQuery, filterQuery, filterCity, distance, filterState, filterGender, filterRelationship, filterOnlineStatus, filterVerifiedStatus]);

  // Show notification when no users are found
  useEffect(() => {
    if (searchQuery.trim() && filteredUsers.length === 0) {
      setShowNotification(true);
      const timer = setTimeout(() => {
        setShowNotification(false);
      }, 5000); // Hide after 5 seconds

      return () => clearTimeout(timer);
    } else {
      setShowNotification(false);
    }
  }, [searchQuery, filteredUsers.length]);

  return (
    <div className="people-page">
      {/* Notification Toast */}
      {showNotification && (
        <div className="people-notification">
          <div className="people-notification__content">
            <AlertCircle size={20} className="people-notification__icon" />
            <div className="people-notification__message">
              <strong>No users found</strong>
              <span>No users match your search "{searchQuery}"</span>
            </div>
            <button
              className="people-notification__close"
              onClick={() => setShowNotification(false)}
              aria-label="Close notification"
            >
              <X size={18} />
            </button>
          </div>
        </div>
      )}

      {/* Top Navigation Bar */}
      <header className="newsfeed-header">
        <div className="newsfeed-header__container">
          <div className="newsfeed-header__left">
            <button
              className="newsfeed-header__menu-toggle"
              onClick={() => setIsLeftSidebarOpen(!isLeftSidebarOpen)}
              aria-label="Toggle menu"
            >
              {isLeftSidebarOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
            <div className="newsfeed-header__logo" onClick={() => navigate("/")}>
              <LazyImage src={primaryLogo} alt="JOSCity Logo" />
              <span>JOSCity</span>
            </div>
          </div>
          <div className="newsfeed-header__actions">
            <button className="newsfeed-header__icon-btn" title="Create">
              <SquarePlus size={20} />
            </button>
            <button className="newsfeed-header__icon-btn" title="Add Friend">
              <UserPlus size={20} />
            </button>
            <button className="newsfeed-header__icon-btn" title="Messages">
              <MessageCircle size={20} />
            </button>
            <button
              className="newsfeed-header__icon-btn newsfeed-header__icon-btn--notifications"
              title="Notifications"
            >
              <Bell size={20} />
            </button>
            <button
              className="newsfeed-header__icon-btn newsfeed-header__icon-btn--filters"
              onClick={() => setIsRightSidebarOpen(!isRightSidebarOpen)}
              title="Search Filters"
              aria-label="Toggle filters"
            >
              <SlidersHorizontal size={20} />
            </button>
            <button 
              className="newsfeed-header__join-btn"
              onClick={handleProfileClick}
              title="View Profile"
            >
              <div className="newsfeed-header__join-initials">
                {getUserInitials()}
              </div>
            </button>
          </div>
        </div>
      </header>

      <div className="newsfeed-container">
        {/* Mobile Overlay */}
        {(isLeftSidebarOpen || isRightSidebarOpen) && (
          <div
            className="newsfeed-overlay"
            onClick={() => {
              setIsLeftSidebarOpen(false);
              setIsRightSidebarOpen(false);
            }}
          />
        )}

        {/* Left Sidebar */}
        <aside
          className={`people-sidebar ${
            isLeftSidebarOpen ? "people-sidebar--open" : ""
          }`}
        >
          <div className="people-sidebar__header">
            <h3 className="people-sidebar__title">Menu</h3>
            {isLeftSidebarOpen && (
              <button
                className="people-sidebar__close"
                onClick={() => setIsLeftSidebarOpen(false)}
                aria-label="Close menu"
              >
                <X size={20} />
              </button>
            )}
          </div>

          <nav className="people-sidebar__nav">
            <div className="people-sidebar__section">
              <a
                href="/newsfeed"
                className="people-sidebar__item"
                onClick={(e) => {
                  e.preventDefault();
                  navigate("/newsfeed");
                  setIsLeftSidebarOpen(false);
                }}
              >
                <Newspaper size={20} />
                <span>News Feed</span>
              </a>
              <a href="#" className="people-sidebar__item">
                <Calendar size={20} />
                <span>Scheduled</span>
              </a>
              <a href="#" className="people-sidebar__item">
                <Bookmark size={20} />
                <span>Saved</span>
              </a>
            </div>

            <div className="people-sidebar__section">
              <h3 className="people-sidebar__section-title">EXPLORE</h3>
              <a
                href="/business"
                className="people-sidebar__item"
                onClick={(e) => {
                  e.preventDefault();
                  navigate("/business");
                  setIsLeftSidebarOpen(false);
                }}
              >
                <Briefcase size={20} />
                <span>Business</span>
              </a>
              <a
                href="/people"
                className="people-sidebar__item people-sidebar__item--active"
                onClick={(e) => {
                  e.preventDefault();
                  navigate("/people");
                  setIsLeftSidebarOpen(false);
                }}
              >
                <Users size={20} />
                <span>People</span>
              </a>
              <a
                href="/events"
                className="people-sidebar__item"
                onClick={(e) => {
                  e.preventDefault();
                  navigate("/events");
                  setIsLeftSidebarOpen(false);
                }}
              >
                <Events size={20} />
                <span>Events</span>
              </a>
              <a
                href="#"
                className="people-sidebar__item"
                onClick={(e) => {
                  e.preventDefault();
                  navigate("/coming-soon");
                  setIsLeftSidebarOpen(false);
                }}
              >
                <Video size={20} />
                <span>Reels</span>
              </a>
              <a
                href="/news"
                className="people-sidebar__item"
                onClick={(e) => {
                  e.preventDefault();
                  navigate("/news");
                  setIsLeftSidebarOpen(false);
                }}
              >
                <Newspaper size={20} />
                <span>News</span>
              </a>
              <a
                href="/forums"
                className="people-sidebar__item"
                onClick={(e) => {
                  e.preventDefault();
                  navigate("/forums");
                  setIsLeftSidebarOpen(false);
                }}
              >
                <MessageSquare size={20} />
                <span>Forums</span>
              </a>
              <a
                href="/marketplace"
                className="people-sidebar__item"
                onClick={(e) => {
                  e.preventDefault();
                  navigate("/marketplace");
                  setIsLeftSidebarOpen(false);
                }}
              >
                <Store size={20} />
                <span>Marketplace</span>
              </a>
              <a
                href="/offers"
                className="people-sidebar__item"
                onClick={(e) => {
                  e.preventDefault();
                  navigate("/offers");
                  setIsLeftSidebarOpen(false);
                }}
              >
                <Tag size={20} />
                <span>Offers</span>
              </a>
              <a
                href="/jobs"
                className="people-sidebar__item"
                onClick={(e) => {
                  e.preventDefault();
                  navigate("/jobs");
                  setIsLeftSidebarOpen(false);
                }}
              >
                <Jobs size={20} />
                <span>Jobs</span>
              </a>
              <a
                href="/movies"
                className="people-sidebar__item"
                onClick={(e) => {
                  e.preventDefault();
                  navigate("/movies");
                  setIsLeftSidebarOpen(false);
                }}
              >
                <Film size={20} />
                <span>Movies</span>
              </a>
            </div>
          </nav>
        </aside>

        {/* Search Bar - Full Width */}
        <div className="newsfeed-search-section">
          <div
            className="newsfeed-search-section__input-wrapper"
            style={{ position: "relative" }}
          >
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search people, hashtags, or posts..."
              className="newsfeed-search-section__input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ paddingRight: "80px" }}
            />
            <div
              style={{
                position: "absolute",
                right: "40px",
                top: "50%",
                transform: "translateY(-50%)",
                zIndex: 10,
              }}
            >
              <button
                type="button"
                onClick={() =>
                  setIsSearchEmojiPickerOpen(!isSearchEmojiPickerOpen)
                }
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: "4px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
                aria-label="Add emoji"
                title="Add emoji"
              >
                <Smile size={18} />
              </button>
              {isSearchEmojiPickerOpen && (
                <div
                  style={{
                    position: "absolute",
                    bottom: "100%",
                    right: 0,
                    marginBottom: "8px",
                    zIndex: 10001,
                  }}
                >
                  <EmojiPicker
                    isOpen={isSearchEmojiPickerOpen}
                    onClose={() => setIsSearchEmojiPickerOpen(false)}
                    onEmojiSelect={(emoji) => {
                      setSearchQuery((prev) => prev + emoji);
                      setIsSearchEmojiPickerOpen(false);
                      searchInputRef.current?.focus();
                    }}
                    position="top"
                  />
                </div>
              )}
            </div>
            <Search size={20} className="newsfeed-search-section__icon" />
          </div>
        </div>

        {/* Tabs - Full Width */}
        <div className="people-tabs">
          <button
            type="button"
            className={`people-tabs__tab ${
              activeTab === "find" ? "people-tabs__tab--active" : ""
            }`}
            onClick={() => setActiveTab("find")}
          >
            Find
          </button>
          <button
            type="button"
            className={`people-tabs__tab ${
              activeTab === "friend-requests" ? "people-tabs__tab--active" : ""
            }`}
            onClick={() => {
              setActiveTab("friend-requests");
              navigate("/request");
            }}
          >
            Friend Requests
          </button>
          <button
            type="button"
            className={`people-tabs__tab ${
              activeTab === "sent-requests" ? "people-tabs__tab--active" : ""
            }`}
            onClick={() => {
              console.log("Sent Requests button clicked");
              setActiveTab("sent-requests");
              navigate("/sent-requests");
            }}
          >
            Sent Requests
            <span className="people-tabs__badge">7</span>
          </button>
        </div>

        {/* Main Content Area */}
        <main className="people-main">
          {/* Search Results Section */}
          {searchQuery.trim() && (
            <div className="people-section">
              <h2 className="people-section__title">
                Search Results{" "}
                {filteredUsers.length > 0 && `(${filteredUsers.length})`}
              </h2>
              {filteredUsers.length > 0 ? (
                <div className="people-search-results">
                  {filteredUsers.map((user) => (
                    <div key={user.id} className="people-user-card">
                      <div className="people-user-card__avatar">
                        <LazyImage
                          src={user.avatar}
                          alt={user.name}
                          className="people-user-card__avatar-img"
                        />
                      </div>
                      <div className="people-user-card__info">
                        <h3 className="people-user-card__name">{user.name}</h3>
                        {user.location && (
                          <p className="people-user-card__location">
                            {user.location}
                          </p>
                        )}
                        {user.mutualFriends !== undefined && (
                          <p className="people-user-card__mutual">
                            {user.mutualFriends} mutual friend
                            {user.mutualFriends !== 1 ? "s" : ""}
                          </p>
                        )}
                      </div>
                      <button className="people-user-card__action-btn">
                        <UserPlus size={18} />
                        <span>Add Friend</span>
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="people-section__empty people-section__empty--search">
                  <p className="people-section__empty-text people-section__empty-text--search">
                    No users found matching "{searchQuery}"
                  </p>
                </div>
              )}
            </div>
          )}

          {/* People You May Know Section - Only show when not searching */}
          {!searchQuery.trim() && (
            <div className="people-section">
              <h2 className="people-section__title">People You May Know</h2>
              <div className="people-section__empty">
                <p className="people-section__empty-text">
                  No People Available
                </p>
              </div>
            </div>
          )}
        </main>

        {/* Right Sidebar - Search Filters */}
        <aside
          className={`people-filters ${
            isRightSidebarOpen ? "people-filters--open" : ""
          }`}
        >
          <div className="people-filters__header">
            <h3 className="people-filters__title">
              Search Filters
              <SlidersHorizontal
                size={18}
                className="people-filters__title-icon"
              />
            </h3>
            <button
              className="people-filters__close"
              onClick={() => setIsRightSidebarOpen(false)}
              aria-label="Close filters"
            >
              <X size={20} />
            </button>
          </div>

          <div className="people-filters__content">
            {/* Distance Slider */}
            <div className="people-filters__group">
              <label className="people-filters__label">Distance</label>

              <div className="people-filters__slider-wrapper">
                <div className="people-filters__slider-value">{distance}km</div>
                <input
                  type="range"
                  min="0"
                  max="500"
                  value={distance}
                  onChange={(e) => setDistance(Number(e.target.value))}
                  className="people-filters__slider"
                  style={{
                    background: `linear-gradient(to right, #0d4a1f 0%, #0d4a1f ${
                      (distance / 500) * 100
                    }%, #e7e7e7 ${(distance / 500) * 100}%, #e7e7e7 100%)`,
                  }}
                />
                <div className="people-filters__slider-labels">
                  <span>0km</span>
                  <span>500km</span>
                </div>
              </div>
            </div>

            {/* Query */}
            <div className="people-filters__group">
              <label className="people-filters__label">Query</label>
              <div style={{ position: "relative" }}>
                <input
                  ref={filterQueryInputRef}
                  type="text"
                  className="people-filters__input"
                  placeholder=""
                  value={filterQuery}
                  onChange={(e) => setFilterQuery(e.target.value)}
                  style={{ paddingRight: "40px" }}
                />
                <div
                  style={{
                    position: "absolute",
                    right: "8px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    zIndex: 10,
                  }}
                >
                  <button
                    type="button"
                    onClick={() =>
                      setIsFilterQueryEmojiPickerOpen(
                        !isFilterQueryEmojiPickerOpen
                      )
                    }
                    style={{
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      padding: "4px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                    aria-label="Add emoji"
                    title="Add emoji"
                  >
                    <Smile size={16} />
                  </button>
                  {isFilterQueryEmojiPickerOpen && (
                    <div
                      style={{
                        position: "absolute",
                        bottom: "100%",
                        right: 0,
                        marginBottom: "8px",
                        zIndex: 10001,
                      }}
                    >
                      <EmojiPicker
                        isOpen={isFilterQueryEmojiPickerOpen}
                        onClose={() => setIsFilterQueryEmojiPickerOpen(false)}
                        onEmojiSelect={(emoji) => {
                          setFilterQuery((prev) => prev + emoji);
                          setIsFilterQueryEmojiPickerOpen(false);
                          filterQueryInputRef.current?.focus();
                        }}
                        position="top"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* City */}
            <div className="people-filters__group">
              <label className="people-filters__label">City</label>
              <div style={{ position: "relative" }}>
                <input
                  ref={filterCityInputRef}
                  type="text"
                  className="people-filters__input"
                  placeholder=""
                  value={filterCity}
                  onChange={(e) => setFilterCity(e.target.value)}
                  style={{ paddingRight: "40px" }}
                />
                <div
                  style={{
                    position: "absolute",
                    right: "8px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    zIndex: 10,
                  }}
                >
                  <button
                    type="button"
                    onClick={() =>
                      setIsFilterCityEmojiPickerOpen(
                        !isFilterCityEmojiPickerOpen
                      )
                    }
                    style={{
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      padding: "4px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                    aria-label="Add emoji"
                    title="Add emoji"
                  >
                    <Smile size={16} />
                  </button>
                  {isFilterCityEmojiPickerOpen && (
                    <div
                      style={{
                        position: "absolute",
                        bottom: "100%",
                        right: 0,
                        marginBottom: "8px",
                        zIndex: 10001,
                      }}
                    >
                      <EmojiPicker
                        isOpen={isFilterCityEmojiPickerOpen}
                        onClose={() => setIsFilterCityEmojiPickerOpen(false)}
                        onEmojiSelect={(emoji) => {
                          setFilterCity((prev) => prev + emoji);
                          setIsFilterCityEmojiPickerOpen(false);
                          filterCityInputRef.current?.focus();
                        }}
                        position="top"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* State */}
            <div className="people-filters__group">
              <label className="people-filters__label">State</label>
              <select 
                className="people-filters__select"
                value={filterState}
                onChange={(e) => setFilterState(e.target.value)}
              >
                <option value="Any">Any</option>
                <option value="Abia">Abia</option>
                <option value="Adamawa">Adamawa</option>
                <option value="Akwa Ibom">Akwa Ibom</option>
                <option value="Anambra">Anambra</option>
                <option value="Bauchi">Bauchi</option>
                <option value="Bayelsa">Bayelsa</option>
                <option value="Benue">Benue</option>
                <option value="Borno">Borno</option>
                <option value="Cross River">Cross River</option>
                <option value="Delta">Delta</option>
                <option value="Ebonyi">Ebonyi</option>
                <option value="Edo">Edo</option>
                <option value="Ekiti">Ekiti</option>
                <option value="Enugu">Enugu</option>
                <option value="Gombe">Gombe</option>
                <option value="Imo">Imo</option>
                <option value="Jigawa">Jigawa</option>
                <option value="Kaduna">Kaduna</option>
                <option value="Kano">Kano</option>
                <option value="Katsina">Katsina</option>
                <option value="Kebbi">Kebbi</option>
                <option value="Kogi">Kogi</option>
                <option value="Kwara">Kwara</option>
                <option value="Lagos">Lagos</option>
                <option value="Nasarawa">Nasarawa</option>
                <option value="Niger">Niger</option>
                <option value="Ogun">Ogun</option>
                <option value="Ondo">Ondo</option>
                <option value="Osun">Osun</option>
                <option value="Oyo">Oyo</option>
                <option value="Plateau">Plateau</option>
                <option value="Rivers">Rivers</option>
                <option value="Sokoto">Sokoto</option>
                <option value="Taraba">Taraba</option>
                <option value="Yobe">Yobe</option>
                <option value="Zamfara">Zamfara</option>
                <option value="FCT">FCT (Abuja)</option>
              </select>
            </div>

            {/* Gender */}
            <div className="people-filters__group">
              <label className="people-filters__label">Gender</label>
              <select 
                className="people-filters__select"
                value={filterGender}
                onChange={(e) => setFilterGender(e.target.value)}
              >
                <option value="Any">Any</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
                <option value="Prefer not to say">Prefer not to say</option>
              </select>
            </div>

            {/* Relationship Type */}
            <div className="people-filters__group">
              <label className="people-filters__label">Relationship Type</label>
              <select 
                className="people-filters__select"
                value={filterRelationship}
                onChange={(e) => setFilterRelationship(e.target.value)}
              >
                <option value="Any">Any</option>
                <option value="Single">Single</option>
                <option value="In a relationship">In a relationship</option>
                <option value="Engaged">Engaged</option>
                <option value="Married">Married</option>
                <option value="Divorced">Divorced</option>
                <option value="Widowed">Widowed</option>
                <option value="It's complicated">It's complicated</option>
              </select>
            </div>

            {/* Online Status */}
            <div className="people-filters__group">
              <label className="people-filters__label">Online Status</label>
              <select 
                className="people-filters__select"
                value={filterOnlineStatus}
                onChange={(e) => setFilterOnlineStatus(e.target.value)}
              >
                <option value="Any">Any</option>
                <option value="Online">Online</option>
                <option value="Offline">Offline</option>
                <option value="Recently active">Recently active</option>
              </select>
            </div>

            {/* Verified Status */}
            <div className="people-filters__group">
              <label className="people-filters__label">Verified Status</label>
              <select 
                className="people-filters__select"
                value={filterVerifiedStatus}
                onChange={(e) => setFilterVerifiedStatus(e.target.value)}
              >
                <option value="Any">Any</option>
                <option value="Verified">Verified</option>
                <option value="Not verified">Not verified</option>
              </select>
            </div>

            {/* Clear Filters Button */}
            <div className="people-filters__group">
              <button
                type="button"
                onClick={() => {
                  setFilterQuery("");
                  setFilterCity("");
                  setFilterState("Any");
                  setFilterGender("Any");
                  setFilterRelationship("Any");
                  setFilterOnlineStatus("Any");
                  setFilterVerifiedStatus("Any");
                  setDistance(100);
                }}
                style={{
                  width: "100%",
                  padding: "10px 16px",
                  backgroundColor: "#f0f0f0",
                  border: "1px solid #ddd",
                  borderRadius: "8px",
                  cursor: "pointer",
                  fontSize: "14px",
                  fontWeight: "500",
                  color: "#333",
                  transition: "all 0.2s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "#e0e0e0";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "#f0f0f0";
                }}
              >
                Clear All Filters
              </button>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default People;
