import React, { useState, useMemo, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  UserPlus,
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
import NewsFeedHeader from "../pages/NewsFeed/NewsFeedHeader";
import Avatar from "./Avatar";
import EmojiPicker from "./EmojiPicker";
import {
  getProfileUsername,
  getUserData,
  isAuthenticated,
} from "../utils/userUtils";
import {
  userApi,
  type ApprovedDirectoryUser,
} from "../services/userApi";
import { friendApi } from "../services/friendApi";
import "../main.css";
import "../scss/_emojipicker.scss";
import "../scss/_newsfeed.scss";
import "../scss/_profilemodal.scss";
import "../scss/_messagepopup.scss";
import { useNewsFeedNavPanels } from "../hooks/useNewsFeedNavPanels";

interface User {
  id: number;
  name: string;
  avatar: string;
  mutualFriends?: number;
  accountType?: string;
  profileSlug?: string;
  businessType?: string;
}

function mapDirectoryUser(u: ApprovedDirectoryUser): User {
  const isBiz = (u.account_type || "").toLowerCase() === "business";
  const name =
    isBiz && u.business_name?.trim()
      ? u.business_name.trim()
      : [u.user_firstname, u.user_lastname].filter(Boolean).join(" ").trim() ||
        u.user_email ||
        `User ${u.user_id}`;
  return {
    id: u.user_id,
    name,
    avatar: u.user_picture?.trim() || "/placeholder-avatar.png",
    accountType: u.account_type || "personal",
    profileSlug: u.user_name?.trim() || undefined,
    businessType: u.business_type?.trim() || undefined,
  };
}

const People: React.FC = () => {
  const navigate = useNavigate();
  const [isLeftSidebarOpen, setIsLeftSidebarOpen] = useState(false);
  const [isRightSidebarOpen, setIsRightSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("find");
  const [distance, setDistance] = useState(100);
  const [searchQuery, setSearchQuery] = useState("");
  const [showNotification, setShowNotification] = useState(false);
  const [isSearchEmojiPickerOpen, setIsSearchEmojiPickerOpen] = useState(false);
  const [directoryUsers, setDirectoryUsers] = useState<User[]>([]);
  const [directoryLoading, setDirectoryLoading] = useState(true);
  const [directoryError, setDirectoryError] = useState<string | null>(null);
  const [friendStatuses, setFriendStatuses] = useState<
    Record<number, "none" | "sent" | "pending" | "friends">
  >({});
  const [addActionLoading, setAddActionLoading] = useState<number | null>(null);

  // Handle profile navigation
  const handleProfileClick = () => {
    const username = getProfileUsername();
    navigate(`/profile/${encodeURIComponent(username)}`);
  };
  const [filterQuery, setFilterQuery] = useState("");
  const [filterState, setFilterState] = useState("Any");
  const [filterGender, setFilterGender] = useState("Any");
  const [filterRelationship, setFilterRelationship] = useState("Any");
  const [filterOnlineStatus, setFilterOnlineStatus] = useState("Any");
  const [filterVerifiedStatus, setFilterVerifiedStatus] = useState("Any");
  const [isFilterQueryEmojiPickerOpen, setIsFilterQueryEmojiPickerOpen] =
    useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const filterQueryInputRef = useRef<HTMLInputElement>(null);
  const mainContentRef = useRef<HTMLElement>(null);
  const { panels, headerNavProps } = useNewsFeedNavPanels({
    mainContentRef,
  });

  useEffect(() => {
    const loadDirectory = async () => {
      if (!isAuthenticated()) {
        setDirectoryUsers([]);
        setDirectoryLoading(false);
        return;
      }
      setDirectoryLoading(true);
      setDirectoryError(null);
      try {
        const res = await userApi.getApprovedUsers({ page: 1, limit: 100 });
        if (!res.success || !Array.isArray(res.data)) {
          setDirectoryUsers([]);
          return;
        }
        setDirectoryUsers(res.data.map(mapDirectoryUser));
      } catch (e) {
        setDirectoryError(
          e instanceof Error ? e.message : "Could not load people."
        );
        setDirectoryUsers([]);
      } finally {
        setDirectoryLoading(false);
      }
    };
    void loadDirectory();
  }, []);

  useEffect(() => {
    const loadFriendStatuses = async () => {
      if (!isAuthenticated()) return;
      try {
        const [friendsRes, requestsRes] = await Promise.all([
          friendApi.getFriends().catch(() => ({ success: false as const, data: [] })),
          friendApi
            .getPendingRequests()
            .catch(() => ({
              success: false as const,
              data: { sent: [], received: [] },
            })),
        ]);
        const statuses: Record<number, "none" | "sent" | "pending" | "friends"> =
          {};
        if (friendsRes.success && Array.isArray(friendsRes.data)) {
          friendsRes.data.forEach((f: { user_id: number }) => {
            statuses[f.user_id] = "friends";
          });
        }
        if (requestsRes.success && requestsRes.data) {
          requestsRes.data.sent.forEach(
            (r: { receiver_id: number }) => {
              statuses[r.receiver_id] = "sent";
            }
          );
          requestsRes.data.received.forEach((r: { sender_id: number }) => {
            if (!statuses[r.sender_id]) statuses[r.sender_id] = "pending";
          });
        }
        setFriendStatuses(statuses);
      } catch {
        // ignore
      }
    };
    void loadFriendStatuses();
  }, []);

  const handleAddFriend = async (user: User) => {
    if (!isAuthenticated()) {
      navigate("/signin");
      return;
    }
    const me = getUserData()?.user_id as number | undefined;
    if (me != null && user.id === me) return;
    const status = friendStatuses[user.id] || "none";
    if (status !== "none" && status !== "sent") return;
    setAddActionLoading(user.id);
    try {
      const res = await friendApi.sendFriendRequest(user.id);
      if (res.success && res.data?.request_id != null) {
        setFriendStatuses((prev) => ({ ...prev, [user.id]: "sent" }));
      } else if (res.success) {
        setFriendStatuses((prev) => ({ ...prev, [user.id]: "sent" }));
      } else {
        alert("Could not send friend request.");
      }
    } catch {
      alert("Could not send friend request.");
    } finally {
      setAddActionLoading(null);
    }
  };

  const openProfile = (user: User) => {
    const slug = user.profileSlug?.trim();
    if (slug) {
      navigate(`/profile/${encodeURIComponent(slug)}`);
    }
  };

  const renderPersonCard = (user: User) => {
    const status = friendStatuses[user.id] || "none";
    const me = getUserData() as { user_id?: number; id?: number } | null;
    const selfId = me?.user_id ?? me?.id ?? null;
    const isSelf = selfId != null && user.id === selfId;
    const busy = addActionLoading === user.id;
    const accountLabel =
      (user.accountType || "personal").toLowerCase() === "business"
        ? "Business"
        : "Personal";

    return (
      <div key={user.id} className="people-user-card">
        <div className="people-user-card__avatar">
          <Avatar
            src={user.avatar}
            name={user.name}
            alt={user.name}
            size={56}
            className="people-user-card__avatar-img"
          />
        </div>
        <div className="people-user-card__info">
          <h3
            className="people-user-card__name"
            style={
              user.profileSlug
                ? { cursor: "pointer" }
                : undefined
            }
            onClick={() => user.profileSlug && openProfile(user)}
            onKeyDown={(e) => {
              if (
                user.profileSlug &&
                (e.key === "Enter" || e.key === " ")
              ) {
                e.preventDefault();
                openProfile(user);
              }
            }}
            role={user.profileSlug ? "link" : undefined}
            tabIndex={user.profileSlug ? 0 : undefined}
          >
            {user.name}
          </h3>
          <p className="people-user-card__meta" style={{ marginTop: 4 }}>
            {accountLabel}
            {user.businessType ? ` · ${user.businessType}` : ""}
          </p>
          {user.mutualFriends !== undefined && user.mutualFriends > 0 && (
            <p className="people-user-card__mutual">
              {user.mutualFriends} mutual friend
              {user.mutualFriends !== 1 ? "s" : ""}
            </p>
          )}
        </div>
        <button
          type="button"
          className="people-user-card__action-btn"
          disabled={
            isSelf ||
            status === "friends" ||
            status === "pending" ||
            busy
          }
          onClick={() => void handleAddFriend(user)}
        >
          <UserPlus size={18} />
          <span>
            {isSelf
              ? "You"
              : status === "friends"
                ? "Friends"
                : status === "pending"
                  ? "Incoming"
                  : status === "sent"
                    ? "Request sent"
                    : "Add Friend"}
          </span>
        </button>
      </div>
    );
  };

  // Filter users based on search query and all filters
  const filteredUsers = useMemo(() => {
    let users = directoryUsers;

    // Apply main search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      users = users.filter((user) =>
        user.name.toLowerCase().includes(query)
      );
    }

    // Apply filter query
    if (filterQuery.trim()) {
      const query = filterQuery.toLowerCase().trim();
      users = users.filter((user) =>
        user.name.toLowerCase().includes(query)
      );
    }

    // Apply distance filter (if user has location data, this would filter by distance)
    // For now, we'll just return all users that match other filters
    // In a real implementation, this would filter by actual distance calculation

    // Note: Gender, Relationship Type, Online Status, and Verified Status filters
    // would require additional user data fields that aren't in the mock data
    // These filters are set up and ready for when real API data is integrated

    return users;
  }, [
    directoryUsers,
    searchQuery,
    filterQuery,
    distance,
    filterState,
    filterGender,
    filterRelationship,
    filterOnlineStatus,
    filterVerifiedStatus,
  ]);

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

      <NewsFeedHeader
        isLeftSidebarOpen={isLeftSidebarOpen}
        onToggleLeftSidebar={() => setIsLeftSidebarOpen(!isLeftSidebarOpen)}
        isRightSidebarOpen={isRightSidebarOpen}
        onToggleRightSidebar={() => setIsRightSidebarOpen(!isRightSidebarOpen)}
        onProfileClick={handleProfileClick}
        showRightSidebarToggle={false}
        extraActions={
          <button
            type="button"
            className="newsfeed-header__icon-btn newsfeed-header__icon-btn--filters"
            onClick={() => setIsRightSidebarOpen(!isRightSidebarOpen)}
            title="Search Filters"
            aria-label="Toggle filters"
          >
            <SlidersHorizontal size={20} />
          </button>
        }
        {...headerNavProps}
      />

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
                href="/scheduled"
                className="people-sidebar__item"
                onClick={(e) => {
                  e.preventDefault();
                  navigate("/scheduled");
                  setIsLeftSidebarOpen(false);
                }}
              >
                <Calendar size={20} />
                <span>Scheduled</span>
              </a>
              <a
                href="/saved"
                className="people-sidebar__item"
                onClick={(e) => {
                  e.preventDefault();
                  navigate("/saved");
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
              setActiveTab("sent-requests");
              navigate("/sent-requests");
            }}
          >
            Sent Requests
          </button>
        </div>

        {/* Main Content Area */}
        <main className="people-main" ref={mainContentRef}>
          {/* Search Results Section */}
          {searchQuery.trim() && (
            <div className="people-section">
              <h2 className="people-section__title">
                Search Results{" "}
                {filteredUsers.length > 0 && `(${filteredUsers.length})`}
              </h2>
              {filteredUsers.length > 0 ? (
                <div className="people-search-results">
                  {filteredUsers.map((user) => renderPersonCard(user))}
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

          {!searchQuery.trim() && (
            <div className="people-section">
              <h2 className="people-section__title">
                Community
                {filteredUsers.length > 0 && ` (${filteredUsers.length})`}
              </h2>
              {directoryLoading && (
                <div className="people-section__empty">
                  <p className="people-section__empty-text">Loading people…</p>
                </div>
              )}
              {!directoryLoading && directoryError && (
                <div className="people-section__empty">
                  <p className="people-section__empty-text">{directoryError}</p>
                </div>
              )}
              {!directoryLoading && !directoryError && filteredUsers.length === 0 && (
                <div className="people-section__empty">
                  <p className="people-section__empty-text">
                    No approved members match your filters yet.
                  </p>
                </div>
              )}
              {!directoryLoading && !directoryError && filteredUsers.length > 0 && (
                <div className="people-search-results">
                  {filteredUsers.map((user) => renderPersonCard(user))}
                </div>
              )}
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

      {panels}
    </div>
  );
};

export default People;
