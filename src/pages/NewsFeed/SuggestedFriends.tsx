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
import { userApi } from "../../services/userApi";

interface Friend {
  id: number;
  name: string;
  avatar: string;
  mutualFriends: number;
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

const SuggestedFriends: React.FC<SuggestedFriendsProps> = ({
  friends: propFriends,
  onFriendAdded,
}) => {
  const [addedFriends, setAddedFriends] = useState<number[]>([]);
  const [fetchedBusinesses, setFetchedBusinesses] = useState<Friend[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSeeAllModalOpen, setIsSeeAllModalOpen] = useState(false);
  const userLocation = getUserLocation();
  const userRange = getUserRange();
  const accountType = getUserAccountType().toLowerCase();
  const isBusinessAccount = accountType === "business";

  // Load existing friends on mount
  useEffect(() => {
    setAddedFriends(getFriendsList());
  }, []);

  // Fetch business accounts when account type is business
  useEffect(() => {
    if (isBusinessAccount) {
      const fetchBusinessAccounts = async () => {
        setIsLoading(true);
        try {
          const userRangeKm = userRange || 500; // Default to 500km if not set
          const response = await userApi.getNearbyUsers(userRangeKm);
          
          if (response.success && response.data) {
            // Filter to only business accounts and transform to Friend format
            const businessAccounts: Friend[] = response.data
              .filter((user: any) => {
                // Check if account_type is business
                const userAccountType = (user.account_type || "").toLowerCase();
                return userAccountType === "business";
              })
              .map((user: any) => ({
                id: user.user_id,
                name: user.user_firstname && user.user_lastname
                  ? `${user.user_firstname} ${user.user_lastname}`
                  : user.display_name || user.user_email || "Unknown",
                avatar: user.user_picture || "",
                mutualFriends: 0, // Can be calculated if needed
                location: user.user_location || (user.latitude && user.longitude
                  ? {
                      latitude: parseFloat(user.latitude),
                      longitude: parseFloat(user.longitude),
                    }
                  : undefined),
                isApproved: true, // Assuming API only returns approved users
                isLoggedIn: true, // Assuming API only returns active users
              }));
            
            setFetchedBusinesses(businessAccounts);
          }
        } catch (error) {
          console.error("Error fetching business accounts:", error);
          setFetchedBusinesses([]);
        } finally {
          setIsLoading(false);
        }
      };

      fetchBusinessAccounts();
    }
  }, [isBusinessAccount, userRange]);

  // Use fetched businesses if business account, otherwise use prop friends
  const friends = isBusinessAccount ? fetchedBusinesses : propFriends;

  // Filter friends based on criteria
  const filteredFriends = useMemo(() => {
    if (isBusinessAccount && isLoading) {
      return []; // Don't show anything while loading
    }

    let filtered: Friend[] = [];

    if (!userLocation) {
      // If user location not set, show all approved and logged in users
      filtered = friends.filter(
        (friend) => friend.isApproved && friend.isLoggedIn
      );
    } else {
      filtered = friends.filter((friend) => {
        // Must be approved and logged in
        if (!friend.isApproved || !friend.isLoggedIn) {
          return false;
        }

        // Must have location data
        if (!friend.location) {
          return false;
        }

        // Must be within range
        const distance = calculateDistance(userLocation, friend.location);
        return distance <= userRange;
      });
    }

    return filtered;
  }, [friends, userLocation, userRange, isBusinessAccount, isLoading]);

  // Limit to 4 friends for main display
  const displayedFriends = useMemo(() => {
    return filteredFriends.slice(0, 4);
  }, [filteredFriends]);

  const handleAddFriend = (friend: Friend) => {
    // Add to friends list
    addFriend(friend.id);
    setAddedFriends((prev) => [...prev, friend.id]);

    // Notify parent component
    if (onFriendAdded) {
      onFriendAdded(friend.id, friend.name);
    }
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
                  {friend.mutualFriends > 0 && (
                    <p className="newsfeed-suggested-friends__mutual">
                      {friend.mutualFriends} Mutual friend
                      {friend.mutualFriends !== 1 ? "s" : ""}
                    </p>
                  )}
                </div>
                <button
                  className={`newsfeed-suggested-friends__add-btn ${
                    isAlreadyFriend
                      ? "newsfeed-suggested-friends__add-btn--added"
                      : ""
                  }`}
                  onClick={() => !isAlreadyFriend && handleAddFriend(friend)}
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
                        {friend.mutualFriends > 0 && (
                          <p className="newsfeed-suggested-friends__mutual">
                            {friend.mutualFriends} Mutual friend
                            {friend.mutualFriends !== 1 ? "s" : ""}
                          </p>
                        )}
                      </div>
                      <button
                        className={`newsfeed-suggested-friends__add-btn ${
                          isAlreadyFriend
                            ? "newsfeed-suggested-friends__add-btn--added"
                            : ""
                        }`}
                        onClick={() =>
                          !isAlreadyFriend && handleAddFriend(friend)
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
