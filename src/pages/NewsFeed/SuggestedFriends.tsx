import React, { useState, useEffect, useMemo } from "react";
import { UserPlus, Check, X } from "lucide-react";
import Avatar from "../../components/Avatar";
import {
  calculateDistance,
  getUserLocation,
  getUserRange,
} from "../../utils/locationUtils";
import { addFriend, getFriendsList } from "../../utils/friendUtils";
import { getUserAccountType } from "../../utils/userUtils";
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

// Map API User to local Friend (same as Add Friends modal)
function userToFriend(user: User, mutualFriends = 0): Friend {
  const name =
    user.user_firstname && user.user_lastname
      ? `${user.user_firstname} ${user.user_lastname}`
      : user.user_email || `User ${user.user_id}`;
  return {
    id: user.user_id,
    name,
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
  onFriendAdded,
}) => {
  const [addedFriends, setAddedFriends] = useState<number[]>([]);
  const [fetchedBusinesses, setFetchedBusinesses] = useState<Friend[]>([]);
  const [fetchedNearbyFriends, setFetchedNearbyFriends] = useState<Friend[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSeeAllModalOpen, setIsSeeAllModalOpen] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const userLocation = getUserLocation();
  const userRange = getUserRange();
  const accountType = getUserAccountType().toLowerCase();
  const isBusinessAccount = accountType === "business";

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

  // Load existing friends on mount (local list for "added" state)
  useEffect(() => {
    setAddedFriends(getFriendsList());
  }, []);

  // Fetch nearby users: business accounts when business, else nearby users (same endpoint as Add Friends)
  useEffect(() => {
    const rangeKm = userRange || 500;

    if (isBusinessAccount) {
      const fetchBusinessAccounts = async () => {
        setIsLoading(true);
        try {
          const response = await userApi.getNearbyUsers(rangeKm);
          if (response.success && response.data) {
            const businessAccounts: Friend[] = response.data
              .filter((u: User) => (u.account_type || "").toLowerCase() === "business")
              .map((u: User) => userToFriend(u));
            setFetchedBusinesses(businessAccounts);
          } else {
            setFetchedBusinesses([]);
          }
        } catch (error) {
          console.error("Error fetching business accounts:", error);
          setFetchedBusinesses([]);
        } finally {
          setIsLoading(false);
        }
      };
      fetchBusinessAccounts();
      return;
    }

    // Personal account: same endpoint as Add Friends modal – nearby users
    const fetchNearby = async () => {
      setIsLoading(true);
      try {
        const [nearbyRes, friendsRes, requestsRes] = await Promise.all([
          userApi.getNearbyUsers(rangeKm),
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
  }, [isBusinessAccount, userRange, currentUserId]);

  // Use fetched list: businesses for business account, nearby for personal (same endpoint as Add Friends)
  const friends =
    isBusinessAccount ? fetchedBusinesses : (fetchedNearbyFriends.length > 0 ? fetchedNearbyFriends : propFriends);

  // Filter friends: when using API nearby list (personal) show all; else apply location/range
  const filteredFriends = useMemo(() => {
    if (isLoading) {
      return [];
    }
    const usingNearbyApi = !isBusinessAccount && fetchedNearbyFriends.length > 0;
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
  }, [friends, userLocation, userRange, isBusinessAccount, isLoading, fetchedNearbyFriends.length]);

  // Limit to 4 friends for main display
  const displayedFriends = useMemo(() => {
    return filteredFriends.slice(0, 4);
  }, [filteredFriends]);

  const handleAddFriend = async (friend: Friend) => {
    const usingApi = !isBusinessAccount && fetchedNearbyFriends.length > 0;
    if (usingApi) {
      try {
        const res = await friendApi.sendFriendRequest(friend.id);
        if (res.success) {
          setAddedFriends((prev) => [...prev, friend.id]);
          onFriendAdded?.(friend.id, friend.name);
        } else {
          alert("Could not send friend request. Please try again.");
        }
      } catch {
        alert("Failed to send friend request. Please try again.");
      }
      return;
    }
    addFriend(friend.id);
    setAddedFriends((prev) => [...prev, friend.id]);
    onFriendAdded?.(friend.id, friend.name);
  };

  return (
    <div className="newsfeed-suggested-friends">
      <div className="newsfeed-suggested-friends__header">
        <h3 className="newsfeed-suggested-friends__title">
          {isBusinessAccount ? "Suggested Businesses" : "Suggested Friends"}
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
            <p>Loading {isBusinessAccount ? "businesses" : "friends"}...</p>
          </div>
        ) : filteredFriends.length === 0 ? (
          <div className="newsfeed-suggested-friends__empty">
            <p>No suggested {isBusinessAccount ? "businesses" : "friends"} found</p>
            <p className="newsfeed-suggested-friends__empty-subtitle">
              {!userLocation
                ? `Set your location to see nearby ${isBusinessAccount ? "businesses" : "friends"}`
                : "Try adjusting your range settings"}
            </p>
          </div>
        ) : (
          displayedFriends.map((friend) => {
            const isAlreadyFriend = addedFriends.includes(friend.id);
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
                <button
                  className={`newsfeed-suggested-friends__add-btn ${
                    isAlreadyFriend
                      ? "newsfeed-suggested-friends__add-btn--added"
                      : ""
                  }`}
                  onClick={() => !isAlreadyFriend && void handleAddFriend(friend)}
                  disabled={isAlreadyFriend}
                  title={isAlreadyFriend ? "Already added" : "Add friend"}
                >
                  {isAlreadyFriend ? (
                    <Check size={18} />
                  ) : (
                    <UserPlus size={18} />
                  )}
                </button>
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
                {isBusinessAccount
                  ? "All Suggested Businesses"
                  : "All Suggested Friends"}
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
                  <p>
                    No suggested {isBusinessAccount ? "businesses" : "friends"}{" "}
                    found
                  </p>
                </div>
              ) : (
                filteredFriends.map((friend) => {
                  const isAlreadyFriend = addedFriends.includes(friend.id);
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
                      <button
                        className={`newsfeed-suggested-friends__add-btn ${
                          isAlreadyFriend
                            ? "newsfeed-suggested-friends__add-btn--added"
                            : ""
                        }`}
                        onClick={() =>
                          !isAlreadyFriend && void handleAddFriend(friend)
                        }
                        disabled={isAlreadyFriend}
                        title={isAlreadyFriend ? "Already added" : "Add friend"}
                      >
                        {isAlreadyFriend ? (
                          <Check size={18} />
                        ) : (
                          <UserPlus size={18} />
                        )}
                      </button>
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
