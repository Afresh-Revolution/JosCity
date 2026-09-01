import React, { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  UserPlus,
  Check,
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
  MapPin,
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
  type User as NearbyApiUser,
} from "../services/userApi";
import {
  friendApi,
  type Friend,
  type FriendRequest,
} from "../services/friendApi";
import { CHAT_UI_REFRESH_EVENT } from "../services/chatService";
import "../main.css";
import "../scss/_emojipicker.scss";
import "../scss/_newsfeed.scss";
import "../scss/_profilemodal.scss";
import "../scss/_messagepopup.scss";
import { useNewsFeedNavPanels } from "../hooks/useNewsFeedNavPanels";
import { businessCategoryLabel } from "../constants/businessCategories";

interface User {
  id: number;
  name: string;
  avatar: string;
  mutualFriends?: number;
  accountType?: string;
  profileSlug?: string;
  businessType?: string;
  address?: string;
  distanceKm?: number;
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
    address: u.address?.trim() || undefined,
  };
}

function mapNearbyApiUser(
  u: NearbyApiUser,
  profileSlugFallback?: string
): User {
  const isBiz = (u.account_type || "").toLowerCase() === "business";
  const name =
    isBiz && u.business_name?.trim()
      ? u.business_name.trim()
      : [u.user_firstname, u.user_lastname].filter(Boolean).join(" ").trim() ||
        u.user_email ||
        `User ${u.user_id}`;
  const slug =
    u.user_name?.trim() || profileSlugFallback || undefined;
  return {
    id: u.user_id,
    name,
    avatar: u.user_picture?.trim() || "/placeholder-avatar.png",
    accountType: u.account_type || "personal",
    profileSlug: slug,
    businessType: u.business_type?.trim() || undefined,
    address: u.address?.trim() || undefined,
    distanceKm: typeof u.distance === "number" ? u.distance : undefined,
  };
}

function textMatchesUser(user: User, rawQuery: string) {
  const q = rawQuery.toLowerCase().trim();
  if (!q) return true;
  const hay = [
    user.name,
    user.address,
    user.businessType,
    user.businessType ? businessCategoryLabel(user.businessType) : "",
    user.profileSlug,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return hay.includes(q);
}

const People: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const activeTab = useMemo(() => {
    const p = location.pathname;
    if (p === "/request") return "friend-requests";
    if (p === "/sent-requests") return "sent-requests";
    if (p === "/my-friends") return "my-friends";
    return "find";
  }, [location.pathname]);

  const [isLeftSidebarOpen, setIsLeftSidebarOpen] = useState(false);
  const [isRightSidebarOpen, setIsRightSidebarOpen] = useState(false);
  const [distance, setDistance] = useState(100);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [showNotification, setShowNotification] = useState(false);
  const [isSearchEmojiPickerOpen, setIsSearchEmojiPickerOpen] = useState(false);
  const [allApprovedUsers, setAllApprovedUsers] = useState<User[]>([]);
  const [directoryUsers, setDirectoryUsers] = useState<User[]>([]);
  const [directoryLoading, setDirectoryLoading] = useState(true);
  const [directoryError, setDirectoryError] = useState<string | null>(null);
  const [useLocationFilter, setUseLocationFilter] = useState(false);
  const [myCoords, setMyCoords] = useState<{ lat: number; lng: number } | null>(
    null
  );
  const [nearbyLoading, setNearbyLoading] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const useLocationFilterRef = useRef(false);
  const [friendStatuses, setFriendStatuses] = useState<
    Record<number, "none" | "sent" | "pending" | "friends">
  >({});
  const [addActionLoading, setAddActionLoading] = useState<number | null>(null);
  const [incomingRequests, setIncomingRequests] = useState<FriendRequest[]>([]);
  const [outgoingRequests, setOutgoingRequests] = useState<FriendRequest[]>(
    []
  );
  const [friendsList, setFriendsList] = useState<Friend[]>([]);
  const [friendGraphLoading, setFriendGraphLoading] = useState(true);
  const [requestActionId, setRequestActionId] = useState<number | null>(null);
  const [removeFriendUserId, setRemoveFriendUserId] = useState<number | null>(
    null
  );

  // Handle profile navigation
  const handleProfileClick = () => {
    const username = getProfileUsername();
    navigate(`/profile/${encodeURIComponent(username)}`);
  };
  const [filterQuery, setFilterQuery] = useState("");
  const [filterAccountType, setFilterAccountType] = useState<
    "any" | "personal" | "business"
  >("any");
  const [isFilterQueryEmojiPickerOpen, setIsFilterQueryEmojiPickerOpen] =
    useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const filterQueryInputRef = useRef<HTMLInputElement>(null);
  const mainContentRef = useRef<HTMLElement>(null);
  const { panels, headerNavProps } = useNewsFeedNavPanels({
    mainContentRef,
  });

  useEffect(() => {
    useLocationFilterRef.current = useLocationFilter;
  }, [useLocationFilter]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch((searchQuery || filterQuery).trim());
    }, 250);
    return () => window.clearTimeout(timer);
  }, [searchQuery, filterQuery]);

  useEffect(() => {
    const loadDirectory = async () => {
      if (!isAuthenticated()) {
        setAllApprovedUsers([]);
        setDirectoryUsers([]);
        setDirectoryLoading(false);
        return;
      }
      setDirectoryLoading(true);
      setDirectoryError(null);
      try {
        const res = await userApi.getApprovedUsers({
          page: 1,
          limit: 100,
          q: debouncedSearch || undefined,
        });
        if (!res.success || !Array.isArray(res.data)) {
          setAllApprovedUsers([]);
          if (!useLocationFilterRef.current) setDirectoryUsers([]);
          return;
        }
        const mapped = res.data.map(mapDirectoryUser);
        setAllApprovedUsers(mapped);
        if (!useLocationFilterRef.current) {
          setDirectoryUsers(mapped);
        }
      } catch (e) {
        setDirectoryError(
          e instanceof Error ? e.message : "Could not load people."
        );
        setAllApprovedUsers([]);
        if (!useLocationFilterRef.current) setDirectoryUsers([]);
      } finally {
        setDirectoryLoading(false);
      }
    };
    void loadDirectory();
  }, [debouncedSearch]);

  useEffect(() => {
    if (!isAuthenticated() || !myCoords || !useLocationFilter) return;
    let cancelled = false;
    setNearbyLoading(true);
    void (async () => {
      try {
        const res = await userApi.getNearbyUsers({
          rangeKm: Math.max(distance, 1),
          latitude: myCoords.lat,
          longitude: myCoords.lng,
        });
        if (cancelled) return;
        if (res.success && Array.isArray(res.data)) {
          setDirectoryError(null);
          const slugMap = new Map(
            allApprovedUsers.map((u) => [u.id, u.profileSlug])
          );
          setDirectoryUsers(
            res.data.map((row) =>
              mapNearbyApiUser(row, slugMap.get(row.user_id) || undefined)
            )
          );
        } else {
          setDirectoryUsers([]);
        }
      } catch (e) {
        if (!cancelled) {
          setDirectoryError(
            e instanceof Error ? e.message : "Could not load nearby people."
          );
          setDirectoryUsers([]);
        }
      } finally {
        if (!cancelled) setNearbyLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [myCoords, useLocationFilter, distance, allApprovedUsers]);

  const syncFriendGraph = useCallback(async () => {
    if (!isAuthenticated()) {
      setFriendStatuses({});
      setIncomingRequests([]);
      setOutgoingRequests([]);
      setFriendsList([]);
      return;
    }
    try {
      const [friendsRes, requestsRes] = await Promise.all([
        friendApi.getFriends().catch(() => ({ success: false as const, data: [] })),
        friendApi.getPendingRequests().catch(() => ({
          success: false as const,
          data: { sent: [] as FriendRequest[], received: [] as FriendRequest[] },
        })),
      ]);
      const statuses: Record<number, "none" | "sent" | "pending" | "friends"> =
        {};
      if (friendsRes.success && Array.isArray(friendsRes.data)) {
        friendsRes.data.forEach((f: Friend) => {
          statuses[f.user_id] = "friends";
        });
        setFriendsList(friendsRes.data);
      } else {
        setFriendsList([]);
      }
      if (requestsRes.success && requestsRes.data) {
        const pendingSent = requestsRes.data.sent.filter(
          (r) => r.status === "pending"
        );
        const pendingReceived = requestsRes.data.received.filter(
          (r) => r.status === "pending"
        );
        pendingSent.forEach((r) => {
          if (!statuses[r.receiver_id]) statuses[r.receiver_id] = "sent";
        });
        pendingReceived.forEach((r) => {
          if (!statuses[r.sender_id]) statuses[r.sender_id] = "pending";
        });
        setOutgoingRequests(pendingSent);
        setIncomingRequests(pendingReceived);
      } else {
        setOutgoingRequests([]);
        setIncomingRequests([]);
      }
      setFriendStatuses(statuses);
    } catch {
      setIncomingRequests([]);
      setOutgoingRequests([]);
      setFriendsList([]);
    }
  }, []);

  useEffect(() => {
    let alive = true;
    void (async () => {
      setFriendGraphLoading(true);
      await syncFriendGraph();
      if (alive) setFriendGraphLoading(false);
    })();
    return () => {
      alive = false;
    };
  }, [syncFriendGraph]);

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
      if (res.success) {
        await syncFriendGraph();
      } else {
        alert("Could not send friend request.");
      }
    } catch {
      alert("Could not send friend request.");
    } finally {
      setAddActionLoading(null);
    }
  };

  const profileSlugForUserId = useCallback(
    (userId: number) =>
      allApprovedUsers.find((u) => u.id === userId)?.profileSlug,
    [allApprovedUsers]
  );

  const requestBrowserLocation = useCallback(() => {
    setLocationError(null);
    if (!navigator.geolocation) {
      setLocationError("Location is not supported in this browser.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocationError(null);
        setMyCoords({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
        setUseLocationFilter(true);
      },
      (err: GeolocationPositionError) => {
        setLocationError(
          err.code === 1
            ? "Location permission denied. Enable it in your browser settings to filter by distance."
            : err.message || "Could not read your location."
        );
      },
      { enableHighAccuracy: true, timeout: 20000, maximumAge: 60_000 }
    );
  }, []);

  const stopUsingLocation = useCallback(() => {
    setMyCoords(null);
    setUseLocationFilter(false);
    setNearbyLoading(false);
    setLocationError(null);
    setDirectoryUsers(allApprovedUsers);
  }, [allApprovedUsers]);

  const handleAcceptRequest = async (requestId: number) => {
    setRequestActionId(requestId);
    try {
      const res = await friendApi.acceptFriendRequest(requestId);
      if (res.success) await syncFriendGraph();
      else alert("Could not accept request.");
    } catch {
      alert("Could not accept request.");
    } finally {
      setRequestActionId(null);
    }
  };

  const handleRejectRequest = async (requestId: number) => {
    setRequestActionId(requestId);
    try {
      const res = await friendApi.rejectFriendRequest(requestId);
      if (res.success) await syncFriendGraph();
      else alert("Could not decline request.");
    } catch {
      alert("Could not decline request.");
    } finally {
      setRequestActionId(null);
    }
  };

  const handleCancelOutgoing = async (requestId: number) => {
    setRequestActionId(requestId);
    try {
      const res = await friendApi.cancelFriendRequest(requestId);
      if (res.success) await syncFriendGraph();
      else alert("Could not cancel request.");
    } catch {
      alert("Could not cancel request.");
    } finally {
      setRequestActionId(null);
    }
  };

  const handleRemoveFriend = async (userId: number) => {
    if (!window.confirm("Remove this person from your friends?")) return;
    setRemoveFriendUserId(userId);
    try {
      const res = await friendApi.removeFriend(userId);
      if (res.success) {
        await syncFriendGraph();
        window.dispatchEvent(
          new CustomEvent(CHAT_UI_REFRESH_EVENT, { detail: { peerUserId: userId } })
        );
      }
      else alert("Could not remove friend.");
    } catch {
      alert("Could not remove friend.");
    } finally {
      setRemoveFriendUserId(null);
    }
  };

  const openProfile = (user: User) => {
    const slug = user.profileSlug?.trim();
    if (slug) {
      navigate(`/profile/${encodeURIComponent(slug)}`);
    }
  };

  const userFromFriend = (f: Friend): User => ({
    id: f.user_id,
    name:
      [f.user_firstname, f.user_lastname].filter(Boolean).join(" ").trim() ||
      `User ${f.user_id}`,
    avatar: f.user_picture?.trim() || "/placeholder-avatar.png",
    profileSlug: profileSlugForUserId(f.user_id),
  });

  const userFromIncomingRequest = (r: FriendRequest): User => {
    const s = r.sender;
    const id = r.sender_id;
    if (s) {
      return {
        id: s.user_id,
        name:
          [s.user_firstname, s.user_lastname].filter(Boolean).join(" ").trim() ||
          `User ${s.user_id}`,
        avatar: s.user_picture?.trim() || "/placeholder-avatar.png",
        profileSlug: profileSlugForUserId(s.user_id),
      };
    }
    return {
      id,
      name: `User ${id}`,
      avatar: "/placeholder-avatar.png",
      profileSlug: profileSlugForUserId(id),
    };
  };

  const userFromOutgoingRequest = (r: FriendRequest): User => {
    const rec = r.receiver;
    const id = r.receiver_id;
    if (rec) {
      return {
        id: rec.user_id,
        name:
          [rec.user_firstname, rec.user_lastname].filter(Boolean).join(" ").trim() ||
          `User ${rec.user_id}`,
        avatar: rec.user_picture?.trim() || "/placeholder-avatar.png",
        profileSlug: profileSlugForUserId(rec.user_id),
      };
    }
    return {
      id,
      name: `User ${id}`,
      avatar: "/placeholder-avatar.png",
      profileSlug: profileSlugForUserId(id),
    };
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
            {user.businessType
              ? ` · ${businessCategoryLabel(user.businessType)}`
              : ""}
            {user.distanceKm != null && (
              <span>{` · ${user.distanceKm} km away`}</span>
            )}
          </p>
          {user.address?.trim() && (
            <p className="people-user-card__location">{user.address.trim()}</p>
          )}
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

  const filteredUsers = useMemo(() => {
    let users = directoryUsers;

    if (searchQuery.trim()) {
      users = users.filter((user) => textMatchesUser(user, searchQuery));
    }

    if (filterQuery.trim()) {
      users = users.filter((user) => textMatchesUser(user, filterQuery));
    }

    if (filterAccountType !== "any") {
      users = users.filter((user) => {
        const t = (user.accountType || "personal").toLowerCase();
        return filterAccountType === "business"
          ? t === "business"
          : t !== "business";
      });
    }

    return users;
  }, [
    directoryUsers,
    searchQuery,
    filterQuery,
    filterAccountType,
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

  const findListLoading =
    directoryLoading || (useLocationFilter && nearbyLoading);

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
            onClick={() => navigate("/people")}
          >
            Find
          </button>
          <button
            type="button"
            className={`people-tabs__tab ${
              activeTab === "friend-requests" ? "people-tabs__tab--active" : ""
            }`}
            onClick={() => navigate("/request")}
          >
            Friend Requests
            {incomingRequests.length > 0 && (
              <span className="people-tabs__badge">
                {incomingRequests.length}
              </span>
            )}
          </button>
          <button
            type="button"
            className={`people-tabs__tab ${
              activeTab === "sent-requests" ? "people-tabs__tab--active" : ""
            }`}
            onClick={() => navigate("/sent-requests")}
          >
            Sent Requests
            {outgoingRequests.length > 0 && (
              <span className="people-tabs__badge">
                {outgoingRequests.length}
              </span>
            )}
          </button>
          <button
            type="button"
            className={`people-tabs__tab ${
              activeTab === "my-friends" ? "people-tabs__tab--active" : ""
            }`}
            onClick={() => navigate("/my-friends")}
          >
            My Friends
            {friendsList.length > 0 && (
              <span className="people-tabs__badge">{friendsList.length}</span>
            )}
          </button>
        </div>

        {/* Main Content Area */}
        <main className="people-main" ref={mainContentRef}>
          {activeTab === "find" && (
            <>
              {searchQuery.trim() && (
                <div className="people-section">
                  <h2 className="people-section__title">
                    Search Results{" "}
                    {filteredUsers.length > 0 && `(${filteredUsers.length})`}
                  </h2>
                  {findListLoading && (
                    <div className="people-section__empty">
                      <p className="people-section__empty-text">
                        Loading…
                      </p>
                    </div>
                  )}
                  {!findListLoading && filteredUsers.length > 0 && (
                    <div className="people-search-results">
                      {filteredUsers.map((user) => renderPersonCard(user))}
                    </div>
                  )}
                  {!findListLoading && filteredUsers.length === 0 && (
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
                    {filteredUsers.length > 0 &&
                      ` (${filteredUsers.length})`}
                  </h2>
                  {findListLoading && (
                    <div className="people-section__empty">
                      <p className="people-section__empty-text">
                        Loading people…
                      </p>
                    </div>
                  )}
                  {!findListLoading && directoryError && (
                    <div className="people-section__empty">
                      <p className="people-section__empty-text">
                        {directoryError}
                      </p>
                    </div>
                  )}
                  {!findListLoading &&
                    !directoryError &&
                    filteredUsers.length === 0 && (
                      <div className="people-section__empty">
                        <p className="people-section__empty-text">
                          {useLocationFilter
                            ? "No members with a saved location are within this distance. Try a larger radius, or stop using your location to browse the full directory."
                            : "No approved members match your filters yet."}
                        </p>
                      </div>
                    )}
                  {!findListLoading &&
                    !directoryError &&
                    filteredUsers.length > 0 && (
                      <div className="people-search-results">
                        {filteredUsers.map((user) => renderPersonCard(user))}
                      </div>
                    )}
                </div>
              )}
            </>
          )}

          {activeTab === "friend-requests" && (
            <div className="people-section">
              <h2 className="people-section__title">
                Friend requests
                {incomingRequests.length > 0 &&
                  ` (${incomingRequests.length})`}
              </h2>
              {!isAuthenticated() && (
                <div className="people-section__empty">
                  <p className="people-section__empty-text">
                    Sign in to see friend requests sent to you.
                  </p>
                </div>
              )}
              {isAuthenticated() && friendGraphLoading && (
                <div className="people-section__empty">
                  <p className="people-section__empty-text">Loading…</p>
                </div>
              )}
              {isAuthenticated() &&
                !friendGraphLoading &&
                incomingRequests.length === 0 && (
                  <div className="people-section__empty">
                    <p className="people-section__empty-text">
                      No pending friend requests.
                    </p>
                  </div>
                )}
              {isAuthenticated() && !friendGraphLoading && (
                <div className="people-search-results">
                  {incomingRequests.map((req) => {
                    const peer = userFromIncomingRequest(req);
                    const busy = requestActionId === req.request_id;
                    return (
                      <div
                        key={req.request_id}
                        className="people-user-card"
                      >
                        <div className="people-user-card__avatar">
                          <Avatar
                            src={peer.avatar}
                            name={peer.name}
                            alt={peer.name}
                            size={56}
                            className="people-user-card__avatar-img"
                          />
                        </div>
                        <div className="people-user-card__info">
                          <h3
                            className="people-user-card__name"
                            style={
                              peer.profileSlug
                                ? { cursor: "pointer" }
                                : undefined
                            }
                            onClick={() =>
                              peer.profileSlug && openProfile(peer)
                            }
                            onKeyDown={(e) => {
                              if (
                                peer.profileSlug &&
                                (e.key === "Enter" || e.key === " ")
                              ) {
                                e.preventDefault();
                                openProfile(peer);
                              }
                            }}
                            role={peer.profileSlug ? "link" : undefined}
                            tabIndex={peer.profileSlug ? 0 : undefined}
                          >
                            {peer.name}
                          </h3>
                          <p className="people-user-card__meta">
                            Wants to be friends
                          </p>
                        </div>
                        <div
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: 8,
                            flexShrink: 0,
                          }}
                        >
                          <button
                            type="button"
                            className="people-user-card__action-btn"
                            disabled={busy}
                            onClick={() =>
                              void handleAcceptRequest(req.request_id)
                            }
                          >
                            <Check size={18} />
                            <span>Accept</span>
                          </button>
                          <button
                            type="button"
                            className="people-user-card__action-btn"
                            style={{
                              backgroundColor: "transparent",
                              color: "#333",
                              border: "1px solid var(--border-color)",
                            }}
                            disabled={busy}
                            onClick={() =>
                              void handleRejectRequest(req.request_id)
                            }
                          >
                            <X size={18} />
                            <span>Decline</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {activeTab === "sent-requests" && (
            <div className="people-section">
              <h2 className="people-section__title">
                Sent requests
                {outgoingRequests.length > 0 &&
                  ` (${outgoingRequests.length})`}
              </h2>
              {!isAuthenticated() && (
                <div className="people-section__empty">
                  <p className="people-section__empty-text">
                    Sign in to see requests you&apos;ve sent.
                  </p>
                </div>
              )}
              {isAuthenticated() && friendGraphLoading && (
                <div className="people-section__empty">
                  <p className="people-section__empty-text">Loading…</p>
                </div>
              )}
              {isAuthenticated() &&
                !friendGraphLoading &&
                outgoingRequests.length === 0 && (
                  <div className="people-section__empty">
                    <p className="people-section__empty-text">
                      No outgoing pending requests.
                    </p>
                  </div>
                )}
              {isAuthenticated() && !friendGraphLoading && (
                <div className="sent-requests-list">
                  {outgoingRequests.map((req) => {
                    const peer = userFromOutgoingRequest(req);
                    const busy = requestActionId === req.request_id;
                    return (
                      <div
                        key={req.request_id}
                        className="sent-request-card"
                      >
                        <div className="sent-request-card__avatar">
                          <Avatar
                            src={peer.avatar}
                            name={peer.name}
                            alt={peer.name}
                            size={56}
                            className="sent-request-card__avatar-img"
                          />
                        </div>
                        <div className="sent-request-card__info">
                          <h3
                            className="sent-request-card__name"
                            style={
                              peer.profileSlug
                                ? { cursor: "pointer" }
                                : undefined
                            }
                            onClick={() =>
                              peer.profileSlug && openProfile(peer)
                            }
                          >
                            {peer.name}
                          </h3>
                          <p className="sent-request-card__mutual">
                            Awaiting response
                          </p>
                        </div>
                        <button
                          type="button"
                          className="sent-request-card__cancel-btn"
                          disabled={busy}
                          onClick={() =>
                            void handleCancelOutgoing(req.request_id)
                          }
                          aria-label="Cancel request"
                        >
                          <span>Cancel</span>
                          <span className="sent-request-card__cancel-icon">
                            <X size={14} />
                          </span>
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {activeTab === "my-friends" && (
            <div className="people-section">
              <h2 className="people-section__title">
                My friends
                {friendsList.length > 0 && ` (${friendsList.length})`}
              </h2>
              {!isAuthenticated() && (
                <div className="people-section__empty">
                  <p className="people-section__empty-text">
                    Sign in to see your friends.
                  </p>
                </div>
              )}
              {isAuthenticated() && friendGraphLoading && (
                <div className="people-section__empty">
                  <p className="people-section__empty-text">Loading…</p>
                </div>
              )}
              {isAuthenticated() &&
                !friendGraphLoading &&
                friendsList.length === 0 && (
                  <div className="people-section__empty">
                    <p className="people-section__empty-text">
                      You don&apos;t have any friends yet. Send requests from
                      Find.
                    </p>
                  </div>
                )}
              {isAuthenticated() && !friendGraphLoading && (
                <div className="people-search-results">
                  {friendsList.map((f) => {
                    const peer = userFromFriend(f);
                    const busy = removeFriendUserId === f.user_id;
                    return (
                      <div key={f.friendship_id} className="people-user-card">
                        <div className="people-user-card__avatar">
                          <Avatar
                            src={peer.avatar}
                            name={peer.name}
                            alt={peer.name}
                            size={56}
                            className="people-user-card__avatar-img"
                          />
                        </div>
                        <div className="people-user-card__info">
                          <h3
                            className="people-user-card__name"
                            style={
                              peer.profileSlug
                                ? { cursor: "pointer" }
                                : undefined
                            }
                            onClick={() =>
                              peer.profileSlug && openProfile(peer)
                            }
                            onKeyDown={(e) => {
                              if (
                                peer.profileSlug &&
                                (e.key === "Enter" || e.key === " ")
                              ) {
                                e.preventDefault();
                                openProfile(peer);
                              }
                            }}
                            role={peer.profileSlug ? "link" : undefined}
                            tabIndex={peer.profileSlug ? 0 : undefined}
                          >
                            {peer.name}
                          </h3>
                          <p className="people-user-card__meta">Friends</p>
                        </div>
                        <div
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: 8,
                            flexShrink: 0,
                          }}
                        >
                          <button
                            type="button"
                            className="people-user-card__action-btn"
                            style={{
                              backgroundColor: "transparent",
                              color: "#b91c1c",
                              border: "1px solid #fecaca",
                            }}
                            disabled={busy}
                            onClick={() =>
                              void handleRemoveFriend(f.user_id)
                            }
                          >
                            <span>Remove</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
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
            <div className="people-filters__group">
              <label className="people-filters__label">Your location</label>
              <p
                style={{
                  fontSize: 13,
                  color: "var(--text-tertiary)",
                  margin: "0 0 10px 0",
                  lineHeight: 1.45,
                }}
              >
                Share your location to list people within the max distance who
                have saved coordinates on their profile.
              </p>
              {!useLocationFilter ? (
                <button
                  type="button"
                  className="people-user-card__action-btn"
                  style={{ width: "100%", justifyContent: "center" }}
                  onClick={() => requestBrowserLocation()}
                >
                  <MapPin size={18} />
                  <span>Use my location</span>
                </button>
              ) : (
                <button
                  type="button"
                  className="people-user-card__action-btn"
                  style={{
                    width: "100%",
                    justifyContent: "center",
                    backgroundColor: "transparent",
                    color: "var(--text-primary)",
                    border: "1px solid var(--border-color)",
                  }}
                  onClick={() => stopUsingLocation()}
                >
                  <span>Stop using my location</span>
                </button>
              )}
              {locationError && (
                <p
                  style={{
                    fontSize: 12,
                    color: "#b91c1c",
                    margin: "8px 0 0 0",
                  }}
                >
                  {locationError}
                </p>
              )}
              {useLocationFilter && myCoords && (
                <p
                  style={{
                    fontSize: 12,
                    color: "var(--text-tertiary)",
                    margin: "8px 0 0 0",
                  }}
                >
                  Using your device position (updates when you change max
                  distance).
                </p>
              )}
            </div>

            <div className="people-filters__group">
              <label className="people-filters__label">Max distance</label>
              {!useLocationFilter && (
                <p
                  style={{
                    fontSize: 12,
                    color: "var(--text-tertiary)",
                    margin: "0 0 8px 0",
                  }}
                >
                  Applies after you enable location.
                </p>
              )}
              <div className="people-filters__slider-wrapper">
                <div className="people-filters__slider-value">{distance} km</div>
                <input
                  type="range"
                  min={1}
                  max={500}
                  value={distance}
                  onChange={(e) => setDistance(Number(e.target.value))}
                  className="people-filters__slider"
                  disabled={!useLocationFilter}
                  style={{
                    opacity: useLocationFilter ? 1 : 0.5,
                    background: `linear-gradient(to right, #0d4a1f 0%, #0d4a1f ${
                      ((distance - 1) / 499) * 100
                    }%, #e7e7e7 ${((distance - 1) / 499) * 100}%, #e7e7e7 100%)`,
                  }}
                />
                <div className="people-filters__slider-labels">
                  <span>1 km</span>
                  <span>500 km</span>
                </div>
              </div>
            </div>

            <div className="people-filters__group">
              <label className="people-filters__label">Keywords</label>
              <div style={{ position: "relative" }}>
                <input
                  ref={filterQueryInputRef}
                  type="text"
                  className="people-filters__input"
                  placeholder="Name, address, @username…"
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

            <div className="people-filters__group">
              <label className="people-filters__label">Account type</label>
              <select
                className="people-filters__select"
                value={filterAccountType}
                onChange={(e) =>
                  setFilterAccountType(
                    e.target.value as "any" | "personal" | "business"
                  )
                }
              >
                <option value="any">All</option>
                <option value="personal">Personal</option>
                <option value="business">Business</option>
              </select>
            </div>

            <div className="people-filters__group">
              <button
                type="button"
                onClick={() => {
                  setFilterQuery("");
                  setFilterAccountType("any");
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
