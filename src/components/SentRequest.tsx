import React, { useState } from "react";
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
} from "lucide-react";
import primaryLogo from "../image/primary-logo.png";
import davidAvatar from "../image/newsfeed/David.jpg";
import LazyImage from "./LazyImage";
import { getUserInitials, getProfileUsername } from "../utils/userUtils";
import "../main.css";

const SentRequest: React.FC = () => {
  const navigate = useNavigate();
  const [isLeftSidebarOpen, setIsLeftSidebarOpen] = useState(false);
  const [isRightSidebarOpen, setIsRightSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("sent-requests");
  const [distance, setDistance] = useState(100);
  const [filterQuery, setFilterQuery] = useState("");
  const [filterCity, setFilterCity] = useState("");
  const [filterState, setFilterState] = useState("Any");
  const [filterGender, setFilterGender] = useState("Any");
  const [filterRelationship, setFilterRelationship] = useState("Any");
  const [filterOnlineStatus, setFilterOnlineStatus] = useState("Any");
  const [filterVerifiedStatus, setFilterVerifiedStatus] = useState("Any");

  // Handle profile navigation
  const handleProfileClick = () => {
    const username = getProfileUsername();
    navigate(`/profile/${encodeURIComponent(username)}`);
  };

  // Mock data for sent friend requests - using state so we can remove items
  const [sentRequests, setSentRequests] = useState([
    { id: 1, name: "David Peter", mutualFriends: 1, avatar: davidAvatar },
    { id: 2, name: "David Peter", mutualFriends: 1, avatar: davidAvatar },
    { id: 3, name: "David Peter", mutualFriends: 1, avatar: davidAvatar },
  ]);

  const handleCancelRequest = (id: number) => {
    // Remove the request from the list
    setSentRequests((prevRequests) =>
      prevRequests.filter((request) => request.id !== id)
    );
  };

  return (
    <div className="people-page">
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
              <Search size={20} />
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
              <a
                href="#"
                className="people-sidebar__item"
                onClick={(e) => {
                  e.preventDefault();
                  navigate("/coming-soon");
                  setIsLeftSidebarOpen(false);
                }}
              >
                <Calendar size={20} />
                <span>Scheduled</span>
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
        <div className="people-search-section">
          <div className="people-search-section__input-wrapper">
            <input
              type="text"
              placeholder="Search"
              className="people-search-section__input"
            />
            <Search size={20} className="people-search-section__icon" />
          </div>
        </div>

        {/* Tabs - Full Width */}
        <div className="people-tabs">
          <button
            className={`people-tabs__tab ${
              activeTab === "find" ? "people-tabs__tab--active" : ""
            }`}
            onClick={() => {
              setActiveTab("find");
              navigate("/people");
            }}
          >
            Find
          </button>
          <button
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
            className={`people-tabs__tab ${
              activeTab === "sent-requests" ? "people-tabs__tab--active" : ""
            }`}
            onClick={() => {
              setActiveTab("sent-requests");
              navigate("/sent-requests");
            }}
          >
            Sent Requests
            {sentRequests.length > 0 && (
              <span className="people-tabs__badge">{sentRequests.length}</span>
            )}
          </button>
        </div>

        {/* Main Content Area */}
        <main className="people-main">
          {/* Friend Request Sent Section */}
          <div className="people-section">
            <h2 className="people-section__title">Friend Request Sent</h2>
            {sentRequests.length > 0 ? (
              <div className="sent-requests-list">
                {sentRequests.map((request) => (
                  <div key={request.id} className="sent-request-card">
                    <div className="sent-request-card__avatar">
                      <LazyImage
                        src={request.avatar}
                        alt={request.name}
                        className="sent-request-card__avatar-img"
                      />
                    </div>
                    <div className="sent-request-card__info">
                      <h3 className="sent-request-card__name">
                        {request.name}
                      </h3>
                      <p className="sent-request-card__mutual">
                        {request.mutualFriends} Mutual Friend
                      </p>
                    </div>
                    <button
                      className="sent-request-card__cancel-btn"
                      onClick={() => handleCancelRequest(request.id)}
                      aria-label="Cancel request"
                    >
                      <span>Sent</span>
                      <span className="sent-request-card__cancel-icon">
                        <X size={14} />
                      </span>
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="people-section__empty">
                <p className="people-section__empty-text">
                  No Sent Requests Available
                </p>
              </div>
            )}
          </div>
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
              <Search size={18} className="people-filters__title-icon" />
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
                    background: `linear-gradient(to right, #4CAF50 0%, #4CAF50 ${
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
              <input
                type="text"
                className="people-filters__input"
                placeholder=""
                value={filterQuery}
                onChange={(e) => setFilterQuery(e.target.value)}
              />
            </div>

            {/* City */}
            <div className="people-filters__group">
              <label className="people-filters__label">City</label>
              <input
                type="text"
                className="people-filters__input"
                placeholder=""
                value={filterCity}
                onChange={(e) => setFilterCity(e.target.value)}
              />
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

export default SentRequest;
