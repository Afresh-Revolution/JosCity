import React, { useState, useEffect, useRef } from "react";
import { X, Search, UserPlus, Check, Clock } from "lucide-react";
import { userApi, User } from "../services/userApi";
import { friendApi } from "../services/friendApi";
import { getUserLocation } from "../utils/locationUtils";
import LazyImage from "./LazyImage";

interface FindFriendsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface FriendStatus {
  userId: number;
  status: "none" | "pending" | "friends" | "sent";
}

const FindFriendsModal: React.FC<FindFriendsModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [friendStatuses, setFriendStatuses] = useState<FriendStatus[]>([]);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  // Get current user ID from localStorage
  useEffect(() => {
    try {
      const userData = localStorage.getItem("user");
      if (userData) {
        const user = JSON.parse(userData);
        setCurrentUserId(user.user_id || null);
      }
    } catch (error) {
      console.error("Error getting current user:", error);
    }
  }, []);

  // Fetch nearby users when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchNearbyUsers();
      checkFriendStatuses();
    }
  }, [isOpen, currentUserId]);

  const fetchNearbyUsers = async () => {
    setLoading(true);
    try {
      const userLocation = getUserLocation();
      if (!userLocation) {
        console.warn("User location not available");
        // Still fetch users, backend can handle location filtering
      }

      const response = await userApi.getNearbyUsers(500);
      if (response.success && response.data) {
        // Filter out current user
        const filteredUsers = response.data.filter(
          (user) => user.user_id !== currentUserId
        );
        setUsers(filteredUsers);
      }
    } catch (error) {
      console.error("Error fetching nearby users:", error);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const checkFriendStatuses = async () => {
    if (!currentUserId) return;

    try {
      // Get user's friends
      const friendsResponse = await friendApi.getFriends();
      const friends = friendsResponse.success ? friendsResponse.data : [];

      // Get pending requests
      const requestsResponse = await friendApi.getPendingRequests();
      const requests = requestsResponse.success
        ? requestsResponse.data
        : { sent: [], received: [] };

      // Build friend status map
      const statusMap: Map<number, FriendStatus> = new Map();

      // Add friends
      friends.forEach((friend) => {
        statusMap.set(friend.user_id, {
          userId: friend.user_id,
          status: "friends",
        });
      });

      // Add sent requests
      requests.sent.forEach((req) => {
        statusMap.set(req.receiver_id, {
          userId: req.receiver_id,
          status: "sent",
        });
      });

      // Add received requests (pending)
      requests.received.forEach((req) => {
        statusMap.set(req.sender_id, {
          userId: req.sender_id,
          status: "pending",
        });
      });

      setFriendStatuses(Array.from(statusMap.values()));
    } catch (error) {
      console.error("Error checking friend statuses:", error);
    }
  };

  const handleAddFriend = async (userId: number) => {
    try {
      const response = await friendApi.sendFriendRequest(userId);
      if (response.success) {
        // Update friend status
        setFriendStatuses((prev) => {
          const existing = prev.find((s) => s.userId === userId);
          if (existing) {
            return prev.map((s) =>
              s.userId === userId ? { ...s, status: "sent" } : s
            );
          }
          return [...prev, { userId, status: "sent" }];
        });
      }
    } catch (error) {
      console.error("Error sending friend request:", error);
      alert("Failed to send friend request. Please try again.");
    }
  };

  const getFriendStatus = (
    userId: number
  ): "none" | "pending" | "friends" | "sent" => {
    const status = friendStatuses.find((s) => s.userId === userId);
    return status?.status || "none";
  };

  const getUserDisplayName = (user: User): string => {
    if (user.user_firstname && user.user_lastname) {
      return `${user.user_firstname} ${user.user_lastname}`;
    }
    return user.user_email || `User ${user.user_id}`;
  };

  const getUserAvatar = (user: User): string => {
    return user.user_picture || "/placeholder-avatar.png";
  };

  // Filter users based on search query
  const filteredUsers = users.filter((user) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    const name = getUserDisplayName(user).toLowerCase();
    const email = (user.user_email || "").toLowerCase();
    return name.includes(query) || email.includes(query);
  });

  if (!isOpen) return null;

  return (
    <div className="newsfeed-add-friend-modal-overlay" onClick={onClose}>
      <div
        ref={modalRef}
        className="newsfeed-add-friend-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="newsfeed-add-friend-modal__header">
          <h3>Find Friends</h3>
          <button
            className="newsfeed-add-friend-modal__close"
            onClick={onClose}
            aria-label="Close modal"
          >
            <X size={20} />
          </button>
        </div>
        <div className="newsfeed-add-friend-modal__search">
          <div className="newsfeed-add-friend-modal__search-wrapper">
            <Search
              size={20}
              className="newsfeed-add-friend-modal__search-icon"
            />
            <input
              type="text"
              className="newsfeed-add-friend-modal__search-input"
              placeholder="Search for friends..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        <div className="newsfeed-add-friend-modal__content">
          {loading ? (
            <div className="newsfeed-add-friend-modal__empty">
              <p>Loading users...</p>
            </div>
          ) : filteredUsers.length > 0 ? (
            <div className="newsfeed-add-friend-modal__list">
              {filteredUsers.map((user) => {
                const status = getFriendStatus(user.user_id);
                const displayName = getUserDisplayName(user);
                const avatar = getUserAvatar(user);

                return (
                  <div
                    key={user.user_id}
                    className="newsfeed-add-friend-modal__item"
                  >
                    <LazyImage
                      src={avatar}
                      alt={displayName}
                      className="newsfeed-add-friend-modal__avatar"
                    />
                    <div className="newsfeed-add-friend-modal__info">
                      <p className="newsfeed-add-friend-modal__name">
                        {displayName}
                      </p>
                      {user.distance !== undefined && (
                        <p className="newsfeed-add-friend-modal__mutual">
                          {Math.round(user.distance)} km away
                        </p>
                      )}
                    </div>
                    {status === "none" && (
                      <button
                        className="newsfeed-add-friend-modal__add-btn"
                        onClick={() => handleAddFriend(user.user_id)}
                        aria-label={`Add ${displayName} as friend`}
                      >
                        <UserPlus size={18} />
                      </button>
                    )}
                    {status === "sent" && (
                      <button
                        className="newsfeed-add-friend-modal__add-btn"
                        disabled
                        aria-label="Friend request sent"
                        title="Friend request sent"
                      >
                        <Clock size={18} />
                      </button>
                    )}
                    {status === "friends" && (
                      <button
                        className="newsfeed-add-friend-modal__add-btn"
                        disabled
                        aria-label="Already friends"
                        title="Already friends"
                      >
                        <Check size={18} />
                      </button>
                    )}
                    {status === "pending" && (
                      <button
                        className="newsfeed-add-friend-modal__add-btn"
                        disabled
                        aria-label="Friend request pending"
                        title="Friend request pending"
                      >
                        <Clock size={18} />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="newsfeed-add-friend-modal__empty">
              <p>
                {searchQuery.trim()
                  ? "No users found"
                  : "No users found within 500km"}
              </p>
              <p className="newsfeed-add-friend-modal__empty-subtitle">
                {searchQuery.trim()
                  ? "Try searching with a different name"
                  : "Make sure your location is enabled"}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FindFriendsModal;
