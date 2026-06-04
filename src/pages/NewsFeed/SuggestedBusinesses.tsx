import React, { useState, useEffect, useMemo } from "react";
import { Check, Building2, Clock, X } from "lucide-react";
import Avatar from "../../components/Avatar";
import {
  calculateDistance,
  getUserLocation,
  getUserRange,
} from "../../utils/locationUtils";
import { friendApi } from "../../services/friendApi";
import { userApi, type User } from "../../services/userApi";

type UserWithBusinessFields = User & {
  business_name?: string;
  business_type?: string;
};

interface Business {
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
  businessType?: string;
}

interface SuggestedBusinessesProps {
  businesses: Business[];
  onBusinessAdded?: (businessId: number, businessName: string) => void;
}

function cleanNameCandidate(name?: string | null): string | null {
  const trimmed = name?.trim();
  if (!trimmed) return null;
  if (/^(user|business)\s*#?\s*\d+$/i.test(trimmed)) return null;
  return trimmed;
}

function getBusinessDisplayName(user: UserWithBusinessFields): string {
  const fullName = [user.user_firstname, user.user_lastname]
    .map((part) => part?.trim())
    .filter(Boolean)
    .join(" ");
  const nameCandidates = [
    user.business_name,
    user.display_name,
    user.full_name,
    fullName,
    user.user_name,
    user.user_email,
  ];

  return (
    nameCandidates
      .map((name) => cleanNameCandidate(name))
      .find((name): name is string => Boolean(name)) ||
    user.user_email?.trim() ||
    "Unnamed business account"
  );
}

function userToBusiness(user: User): Business {
  const u = user as UserWithBusinessFields;
  return {
    id: u.user_id,
    name: getBusinessDisplayName(u),
    avatar: u.user_picture || "",
    mutualFriends: 0,
    location: u.user_location,
    isApproved: true,
    isLoggedIn: true,
    businessType: u.business_type,
  };
}

const SuggestedBusinesses: React.FC<SuggestedBusinessesProps> = ({
  businesses,
}) => {
  const [businessStatuses, setBusinessStatuses] = useState<
    Record<number, "none" | "sent" | "pending" | "friends">
  >({});
  const [sentRequestIdsByReceiver, setSentRequestIdsByReceiver] = useState<
    Record<number, number>
  >({});
  const [isSeeAllModalOpen, setIsSeeAllModalOpen] = useState(false);
  const [fetchedBusinesses, setFetchedBusinesses] = useState<Business[]>([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const userLocation = getUserLocation();
  const userRange = getUserRange();

  useEffect(() => {
    try {
      const userData = localStorage.getItem("user");
      if (userData) {
        const user = JSON.parse(userData) as { user_id?: number };
        setCurrentUserId(user.user_id ?? null);
      }
    } catch {
      setCurrentUserId(null);
    }
  }, []);

  // When parent does not supply a list, load nearby users and keep only business accounts
  useEffect(() => {
    if (businesses.length > 0) return;

    let cancelled = false;
    const run = async () => {
      setIsLoadingSuggestions(true);
      try {
        const rangeKm = userRange || 500;
        const [nearbyRes, friendsRes, requestsRes] = await Promise.all([
          userApi.getNearbyUsers({ rangeKm }),
          friendApi.getFriends().catch(() => ({ success: false as const, data: [] })),
          friendApi
            .getPendingRequests()
            .catch(() => ({ success: false as const, data: { sent: [], received: [] } })),
        ]);
        if (cancelled) return;

        if (nearbyRes.success && Array.isArray(nearbyRes.data)) {
          const friendIds = new Set<number>();
          if (friendsRes.success && Array.isArray(friendsRes.data)) {
            friendsRes.data.forEach((friend: { user_id: number }) => {
              friendIds.add(friend.user_id);
            });
          }

          const sentIds = new Set<number>();
          if (requestsRes.success && requestsRes.data?.sent) {
            requestsRes.data.sent.forEach((request: { receiver_id: number }) => {
              sentIds.add(request.receiver_id);
            });
          }

          const excludeIds = new Set([currentUserId].filter(Boolean));
          friendIds.forEach((id) => excludeIds.add(id));
          sentIds.forEach((id) => excludeIds.add(id));

          const onlyBusiness = nearbyRes.data
            .filter(
              (u: User) =>
                !excludeIds.has(u.user_id) &&
                (u.account_type || "").toLowerCase() === "business"
            )
            .map((u: User) => userToBusiness(u));
          setFetchedBusinesses(onlyBusiness);
        } else {
          setFetchedBusinesses([]);
        }
      } catch {
        if (!cancelled) setFetchedBusinesses([]);
      } finally {
        if (!cancelled) setIsLoadingSuggestions(false);
      }
    };

    void run();
    return () => {
      cancelled = true;
    };
  }, [businesses.length, userRange, currentUserId]);

  const allBusinesses =
    businesses.length > 0 ? businesses : fetchedBusinesses;

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
        setBusinessStatuses(statuses);
        setSentRequestIdsByReceiver(sentMap);
      } catch {
        // ignore status bootstrap errors
      }
    };

    void loadStatuses();
  }, []);

  // Filter businesses based on criteria
  const filteredBusinesses = useMemo(() => {
    if (isLoadingSuggestions && businesses.length === 0) {
      return [];
    }

    let filtered: Business[] = [];

    if (!userLocation) {
      // If user location not set, show all approved and logged in businesses
      filtered = allBusinesses.filter(
        (business) => business.isApproved && business.isLoggedIn
      );
    } else {
      filtered = allBusinesses.filter((business) => {
        // Must be approved and logged in
        if (!business.isApproved || !business.isLoggedIn) {
          return false;
        }

        // Must have location data
        if (!business.location) {
          return false;
        }

        // Must be within range
        const distance = calculateDistance(userLocation, business.location);
        return distance <= (userRange || 500);
      });
    }

    return filtered;
  }, [
    allBusinesses,
    userLocation,
    userRange,
    isLoadingSuggestions,
    businesses.length,
  ]);

  // Limit to 4 businesses for main display
  const displayedBusinesses = useMemo(() => {
    return filteredBusinesses.slice(0, 4);
  }, [filteredBusinesses]);

  const handleAddBusiness = async (business: Business) => {
    try {
      const response = await friendApi.sendFriendRequest(business.id);
      if (response.success && response.data?.request_id != null) {
        setBusinessStatuses((prev) => ({ ...prev, [business.id]: "sent" }));
        setSentRequestIdsByReceiver((prev) => ({
          ...prev,
          [business.id]: response.data.request_id,
        }));
      } else if (response.success) {
        setBusinessStatuses((prev) => ({ ...prev, [business.id]: "sent" }));
      }
    } catch (error) {
      console.error("Error sending friend request:", error);
    }
  };

  const handleCancelSentRequest = async (business: Business) => {
    const rid = sentRequestIdsByReceiver[business.id];
    if (rid == null) return;
    try {
      const res = await friendApi.cancelFriendRequest(rid);
      if (res.success) {
        setBusinessStatuses((prev) => ({ ...prev, [business.id]: "none" }));
        setSentRequestIdsByReceiver((prev) => {
          const next = { ...prev };
          delete next[business.id];
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
        <h3 className="newsfeed-suggested-friends__title">Suggested Businesses</h3>
        {filteredBusinesses.length > 4 && (
          <button
            className="newsfeed-suggested-friends__see-all"
            onClick={() => setIsSeeAllModalOpen(true)}
          >
            See All
          </button>
        )}
      </div>
      <div className="newsfeed-suggested-friends__list">
        {isLoadingSuggestions && businesses.length === 0 ? (
          <div className="newsfeed-suggested-friends__empty">
            <p>Loading suggested businesses…</p>
          </div>
        ) : filteredBusinesses.length === 0 ? (
          <div className="newsfeed-suggested-friends__empty">
            <p>No suggested businesses found</p>
            <p className="newsfeed-suggested-friends__empty-subtitle">
              {!userLocation
                ? "Set your location to see nearby businesses"
                : "Try adjusting your range settings"}
            </p>
          </div>
        ) : (
          displayedBusinesses.map((business) => {
            const status = businessStatuses[business.id] || "none";
            const isActionDisabled = status !== "none" && status !== "sent";
            return (
              <div
                key={business.id}
                className="newsfeed-suggested-friends__item"
              >
                <Avatar
                  src={business.avatar}
                  name={business.name}
                  size={48}
                  className="newsfeed-suggested-friends__avatar"
                />
                <div className="newsfeed-suggested-friends__info">
                  <p className="newsfeed-suggested-friends__name">
                    {business.name}
                  </p>
                  {business.businessType && (
                    <p className="newsfeed-suggested-friends__mutual">
                      {business.businessType}
                    </p>
                  )}
                  {business.mutualFriends > 0 && (
                    <p className="newsfeed-suggested-friends__mutual">
                      {business.mutualFriends} Mutual connection
                      {business.mutualFriends !== 1 ? "s" : ""}
                    </p>
                  )}
                </div>
                {status === "sent" &&
                sentRequestIdsByReceiver[business.id] != null ? (
                  <button
                    type="button"
                    className="newsfeed-suggested-friends__add-btn newsfeed-suggested-friends__add-btn--cancel"
                    onClick={() => void handleCancelSentRequest(business)}
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
                      !isActionDisabled && void handleAddBusiness(business)
                    }
                    disabled={isActionDisabled}
                    title={
                      status === "friends"
                        ? "Already friends"
                        : status === "pending"
                          ? "Incoming request pending"
                          : "Add business"
                    }
                  >
                    {status === "friends" ? (
                      <Check size={18} />
                    ) : status === "pending" ? (
                      <Clock size={18} />
                    ) : (
                      <Building2 size={18} />
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
                All Suggested Businesses
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
              {filteredBusinesses.length === 0 ? (
                <div className="newsfeed-suggested-friends__empty">
                  <p>No suggested businesses found</p>
                </div>
              ) : (
                filteredBusinesses.map((business) => {
                  const status = businessStatuses[business.id] || "none";
                  const isActionDisabled = status !== "none" && status !== "sent";
                  return (
                    <div
                      key={business.id}
                      className="newsfeed-suggested-friends__item"
                    >
                      <Avatar
                        src={business.avatar}
                        name={business.name}
                        size={48}
                        className="newsfeed-suggested-friends__avatar"
                      />
                      <div className="newsfeed-suggested-friends__info">
                        <p className="newsfeed-suggested-friends__name">
                          {business.name}
                        </p>
                        {business.businessType && (
                          <p className="newsfeed-suggested-friends__mutual">
                            {business.businessType}
                          </p>
                        )}
                        {business.mutualFriends > 0 && (
                          <p className="newsfeed-suggested-friends__mutual">
                            {business.mutualFriends} Mutual connection
                            {business.mutualFriends !== 1 ? "s" : ""}
                          </p>
                        )}
                      </div>
                      {status === "sent" &&
                      sentRequestIdsByReceiver[business.id] != null ? (
                        <button
                          type="button"
                          className="newsfeed-suggested-friends__add-btn newsfeed-suggested-friends__add-btn--cancel"
                          onClick={() => void handleCancelSentRequest(business)}
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
                            !isActionDisabled && void handleAddBusiness(business)
                          }
                          disabled={isActionDisabled}
                          title={
                            status === "friends"
                              ? "Already friends"
                              : status === "pending"
                                ? "Incoming request pending"
                                : "Add business"
                          }
                        >
                          {status === "friends" ? (
                            <Check size={18} />
                          ) : status === "pending" ? (
                            <Clock size={18} />
                          ) : (
                            <Building2 size={18} />
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

export default SuggestedBusinesses;

