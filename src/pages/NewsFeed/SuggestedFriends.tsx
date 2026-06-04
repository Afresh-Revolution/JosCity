import React, { useState, useEffect, useMemo } from "react";
import { UserPlus, Check, Clock, X } from "lucide-react";
import Avatar from "../../components/Avatar";
import {
  calculateDistance,
  getUserLocation,
  getUserRange,
} from "../../utils/locationUtils";
import { userApi, type User } from "../../services/userApi";
import { friendApi } from "../../services/friendApi";

interface Friend {
  id: number;
  name: string;
  avatar: string;
  mutualFriends: number;
  distanceKm?: number;
  location?: {
    latitude: number;
    longitude: number;
  };
  isApproved?: boolean;
  isLoggedIn?: boolean;
}

interface SuggestedFriendsProps {
  friends: Friend[];
  onFriendAdded?: (friendId: number, friendName: string) => void;
}

function cleanNameCandidate(name?: string | null): string | null {
  const trimmed = name?.trim();
  if (!trimmed) return null;
  if (/^(user|business)\s*#?\s*\d+$/i.test(trimmed)) return null;
  return trimmed;
}

function getSuggestedUserName(user: User): string {
  const fullName = [user.user_firstname, user.user_lastname]
    .map((part) => part?.trim())
    .filter(Boolean)
    .join(" ");
  const isBusiness = (user.account_type || "").toLowerCase() === "business";
  const nameCandidates = isBusiness
    ? [
        user.business_name,
        user.display_name,
        user.full_name,
        fullName,
        user.user_name,
        user.user_email,
      ]
    : [
        user.display_name,
        user.full_name,
        fullName,
        user.user_name,
        user.business_name,
        user.user_email,
      ];

  return (
    nameCandidates
      .map((name) => cleanNameCandidate(name))
      .find((name): name is string => Boolean(name)) ||
    user.user_email?.trim() ||
    "Unnamed account"
  );
}

// Map API User to local Friend (same as Add Friends modal)
function userToFriend(user: User, mutualFriends = 0): Friend {
  return {
    id: user.user_id,
    name: getSuggestedUserName(user),
    avatar: user.user_picture || "",
    mutualFriends,
    distanceKm: user.distance,
    location: user.user_location,
    isApproved: true,
    isLoggedIn: true,
  };
}

const SuggestedFriends: React.FC<SuggestedFriendsProps> = ({
  friends: propFriends,
}) => {
  const [friendStatuses, setFriendStatuses] = useState<
    Record<number, "none" | "sent" | "pending" | "friends">
  >({});
  /** receiver_user_id → friend_requests.request_id for outgoing pending */
  const [sentRequestIdsByReceiver, setSentRequestIdsByReceiver] = useState<
    Record<number, number>
  >({});
  const [fetchedNearbyFriends, setFetchedNearbyFriends] = useState<Friend[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSeeAllModalOpen, setIsSeeAllModalOpen] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const userLocation = getUserLocation();
  const userRange = getUserRange();

  // Current user id from localStorage (same as Add Friends modal)
  useEffect(() => {
    try {
      const userData = localStorage.getItem("user");
      if (userData) {
        const user = JSON.parse(userData);
        setCurrentUserId(user.user_id ?? null);
      }
    } catch {
      setCurrentUserId(null);
    }
  }, []);

  // Load real friendship/request statuses
  useEffect(() => {
    const loadStatuses = async () => {
      try {
        const [friendsRes, requestsRes] = await Promise.all([
          friendApi.getFriends().catch(() => ({ success: false as const, data: [] })),
          friendApi
            .getPendingRequests()
            .catch(() => ({ success: false as const, data: { sent: [], received: [] } })),
        ]);

        const statuses: Record<number, "none" | "sent" | "pending" | "friends"> = {};
        const sentMap: Record<number, number> = {};
        if (friendsRes.success) {
          friendsRes.data.forEach((friend) => {
            statuses[friend.user_id] = "friends";
          });
        }
        if (requestsRes.success) {
          requestsRes.data.sent.forEach(
            (request: { receiver_id: number; request_id: number }) => {
              statuses[request.receiver_id] = "sent";
              sentMap[request.receiver_id] = request.request_id;
            }
          );
          requestsRes.data.received.forEach((request) => {
            if (!statuses[request.sender_id]) statuses[request.sender_id] = "pending";
          });
        }

        setFriendStatuses(statuses);
        setSentRequestIdsByReceiver(sentMap);
      } catch {
        // ignore status bootstrap errors
      }
    };

    void loadStatuses();
  }, []);

  // Fetch nearby users for the news feed suggestions, including personal and business accounts.
  useEffect(() => {
    const rangeKm = userRange || 500;
    const fetchNearby = async () => {
      setIsLoading(true);
      try {
        const [nearbyRes, friendsRes, requestsRes] = await Promise.all([
          userApi.getNearbyUsers({ rangeKm }),
          friendApi.getFriends().catch(() => ({ success: false as const, data: [] })),
          friendApi.getPendingRequests().catch(() => ({ success: false as const, data: { sent: [], received: [] } })),
        ]);

        if (!nearbyRes.success || !nearbyRes.data) {
          setFetchedNearbyFriends([]);
          return;
        }

        const friendIds = new Set<number>();
        if (friendsRes.success && Array.isArray(friendsRes.data)) {
          friendsRes.data.forEach((f: { user_id: number }) => friendIds.add(f.user_id));
        }
        const sentIds = new Set<number>();
        if (requestsRes.success && requestsRes.data?.sent) {
          requestsRes.data.sent.forEach((r: { receiver_id: number }) => sentIds.add(r.receiver_id));
        }

        const excludeIds = new Set([currentUserId].filter(Boolean));
        friendIds.forEach((id) => excludeIds.add(id));
        sentIds.forEach((id) => excludeIds.add(id));

        const list: Friend[] = nearbyRes.data
          .filter((u: User) => u.user_id !== currentUserId && !excludeIds.has(u.user_id))
          .map((u: User) => userToFriend(u));

        setFetchedNearbyFriends(list);
      } catch (error) {
        console.error("Error fetching nearby friends:", error);
        setFetchedNearbyFriends([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchNearby();
  }, [userRange, currentUserId]);

  // Use fetched nearby list for the news feed; fall back to parent-provided suggestions.
  const friends =
    fetchedNearbyFriends.length > 0 ? fetchedNearbyFriends : propFriends;

  // Filter friends: when using API nearby list show all; else apply location/range.
  const filteredFriends = useMemo(() => {
    if (isLoading) {
      return [];
    }
    const usingNearbyApi = fetchedNearbyFriends.length > 0;
    if (usingNearbyApi) {
      return friends; // Backend already applied range; show all returned
    }
    if (!userLocation) {
      return friends.filter((f) => f.isApproved && f.isLoggedIn);
    }
    return friends.filter((f) => {
      if (!f.isApproved || !f.isLoggedIn) return false;
      if (!f.location) return false;
      return calculateDistance(userLocation, f.location) <= (userRange || 500);
    });
  }, [friends, userLocation, userRange, isLoading, fetchedNearbyFriends.length]);

  // Limit to 4 friends for main display
  const displayedFriends = useMemo(() => {
    return filteredFriends.slice(0, 4);
  }, [filteredFriends]);

  const handleAddFriend = async (friend: Friend) => {
    try {
      const res = await friendApi.sendFriendRequest(friend.id);
      if (res.success && res.data?.request_id != null) {
        setFriendStatuses((prev) => ({ ...prev, [friend.id]: "sent" }));
        setSentRequestIdsByReceiver((prev) => ({
          ...prev,
          [friend.id]: res.data.request_id,
        }));
      } else if (res.success) {
        setFriendStatuses((prev) => ({ ...prev, [friend.id]: "sent" }));
      } else {
        alert("Could not send friend request. Please try again.");
      }
    } catch {
      alert("Failed to send friend request. Please try again.");
    }
  };

  const handleCancelSentRequest = async (friend: Friend) => {
    const rid = sentRequestIdsByReceiver[friend.id];
    if (rid == null) return;
    try {
      const res = await friendApi.cancelFriendRequest(rid);
      if (res.success) {
        setFriendStatuses((prev) => ({ ...prev, [friend.id]: "none" }));
        setSentRequestIdsByReceiver((prev) => {
          const next = { ...prev };
          delete next[friend.id];
          return next;
        });
      }
    } catch {
      alert("Could not cancel friend request. Please try again.");
    }
  };

  return (
    <div className="newsfeed-suggested-friends">
      <div className="newsfeed-suggested-friends__header">
        <h3 className="newsfeed-suggested-friends__title">
          Suggested Friends
        </h3>
        {filteredFriends.length > 4 && (
          <button
            className="newsfeed-suggested-friends__see-all"
            onClick={() => setIsSeeAllModalOpen(true)}
          >
            See All
          </button>
        )}
      </div>
      <div className="newsfeed-suggested-friends__list">
        {isLoading ? (
          <div className="newsfeed-suggested-friends__empty">
            <p>Loading friends...</p>
          </div>
        ) : filteredFriends.length === 0 ? (
          <div className="newsfeed-suggested-friends__empty">
            <p>No suggested friends found</p>
            <p className="newsfeed-suggested-friends__empty-subtitle">
              {!userLocation
                ? "Set your location to see nearby friends"
                : "Try adjusting your range settings"}
            </p>
          </div>
        ) : (
          displayedFriends.map((friend) => {
            const status = friendStatuses[friend.id] || "none";
            const isActionDisabled = status !== "none" && status !== "sent";
            return (
              <div
                key={friend.id}
                className="newsfeed-suggested-friends__item"
              >
                <Avatar
                  src={friend.avatar}
                  name={friend.name}
                  size={48}
                  className="newsfeed-suggested-friends__avatar"
                />
                <div className="newsfeed-suggested-friends__info">
                  <p className="newsfeed-suggested-friends__name">
                    {friend.name}
                  </p>
                  {friend.mutualFriends > 0 ? (
                    <p className="newsfeed-suggested-friends__mutual">
                      {friend.mutualFriends} Mutual friend
                      {friend.mutualFriends !== 1 ? "s" : ""}
                    </p>
                  ) : friend.distanceKm != null ? (
                    <p className="newsfeed-suggested-friends__mutual">
                      {Math.round(friend.distanceKm)} km away
                    </p>
                  ) : null}
                </div>
                {status === "sent" && sentRequestIdsByReceiver[friend.id] != null ? (
                  <button
                    type="button"
                    className="newsfeed-suggested-friends__add-btn newsfeed-suggested-friends__add-btn--cancel"
                    onClick={() => void handleCancelSentRequest(friend)}
                    title="Cancel friend request"
                    aria-label="Cancel friend request"
                  >
                    <X size={18} />
                  </button>
                ) : (
                  <button
                    className={`newsfeed-suggested-friends__add-btn ${
                      isActionDisabled
                        ? "newsfeed-suggested-friends__add-btn--added"
                        : ""
                    }`}
                    onClick={() =>
                      !isActionDisabled && void handleAddFriend(friend)
                    }
                    disabled={isActionDisabled}
                    title={
                      status === "friends"
                        ? "Already friends"
                        : status === "pending"
                          ? "Incoming request pending"
                          : "Add friend"
                    }
                  >
                    {status === "friends" ? (
                      <Check size={18} />
                    ) : status === "pending" ? (
                      <Clock size={18} />
                    ) : (
                      <UserPlus size={18} />
                    )}
                  </button>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* See All Modal */}
      {isSeeAllModalOpen && (
        <div
          className="newsfeed-suggested-friends__modal-overlay"
          onClick={() => setIsSeeAllModalOpen(false)}
        >
          <div
            className="newsfeed-suggested-friends__modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="newsfeed-suggested-friends__modal-header">
              <h3 className="newsfeed-suggested-friends__modal-title">
                All Suggested Friends
              </h3>
              <button
                className="newsfeed-suggested-friends__modal-close"
                onClick={() => setIsSeeAllModalOpen(false)}
                aria-label="Close modal"
              >
                <X size={24} />
              </button>
            </div>
            <div className="newsfeed-suggested-friends__modal-list">
              {filteredFriends.length === 0 ? (
                <div className="newsfeed-suggested-friends__empty">
                  <p>No suggested friends found</p>
                </div>
              ) : (
                filteredFriends.map((friend) => {
                  const status = friendStatuses[friend.id] || "none";
                  const isActionDisabled = status !== "none" && status !== "sent";
                  return (
                    <div
                      key={friend.id}
                      className="newsfeed-suggested-friends__item"
                    >
                      <Avatar
                        src={friend.avatar}
                        name={friend.name}
                        size={48}
                        className="newsfeed-suggested-friends__avatar"
                      />
                      <div className="newsfeed-suggested-friends__info">
                        <p className="newsfeed-suggested-friends__name">
                          {friend.name}
                        </p>
                        {friend.mutualFriends > 0 ? (
                          <p className="newsfeed-suggested-friends__mutual">
                            {friend.mutualFriends} Mutual friend
                            {friend.mutualFriends !== 1 ? "s" : ""}
                          </p>
                        ) : friend.distanceKm != null ? (
                          <p className="newsfeed-suggested-friends__mutual">
                            {Math.round(friend.distanceKm)} km away
                          </p>
                        ) : null}
                      </div>
                      {status === "sent" &&
                      sentRequestIdsByReceiver[friend.id] != null ? (
                        <button
                          type="button"
                          className="newsfeed-suggested-friends__add-btn newsfeed-suggested-friends__add-btn--cancel"
                          onClick={() => void handleCancelSentRequest(friend)}
                          title="Cancel friend request"
                          aria-label="Cancel friend request"
                        >
                          <X size={18} />
                        </button>
                      ) : (
                        <button
                          className={`newsfeed-suggested-friends__add-btn ${
                            isActionDisabled
                              ? "newsfeed-suggested-friends__add-btn--added"
                              : ""
                          }`}
                          onClick={() =>
                            !isActionDisabled && void handleAddFriend(friend)
                          }
                          disabled={isActionDisabled}
                          title={
                            status === "friends"
                              ? "Already friends"
                              : status === "pending"
                                ? "Incoming request pending"
                                : "Add friend"
                          }
                        >
                          {status === "friends" ? (
                            <Check size={18} />
                          ) : status === "pending" ? (
                            <Clock size={18} />
                          ) : (
                            <UserPlus size={18} />
                          )}
                        </button>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SuggestedFriends;
