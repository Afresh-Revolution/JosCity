import React, { useState, useEffect, useMemo } from "react";
import { Check, Building2, Clock, X } from "lucide-react";
import Avatar from "../../components/Avatar";
import {
  calculateDistance,
  getUserLocation,
  getUserRange,
} from "../../utils/locationUtils";
import { friendApi } from "../../services/friendApi";

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

const SuggestedBusinesses: React.FC<SuggestedBusinessesProps> = ({
  businesses,
  onBusinessAdded: _onBusinessAdded,
}) => {
  const [businessStatuses, setBusinessStatuses] = useState<
    Record<number, "none" | "sent" | "pending" | "friends">
  >({});
  const [isSeeAllModalOpen, setIsSeeAllModalOpen] = useState(false);
  const userLocation = getUserLocation();
  const userRange = getUserRange();

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
        if (friendsRes.success) {
          friendsRes.data.forEach((friend) => {
            statuses[friend.user_id] = "friends";
          });
        }
        if (requestsRes.success) {
          requestsRes.data.sent.forEach((request) => {
            statuses[request.receiver_id] = "sent";
          });
          requestsRes.data.received.forEach((request) => {
            if (!statuses[request.sender_id]) statuses[request.sender_id] = "pending";
          });
        }
        setBusinessStatuses(statuses);
      } catch {
        // ignore status bootstrap errors
      }
    };

    void loadStatuses();
  }, []);

  // Filter businesses based on criteria
  const filteredBusinesses = useMemo(() => {
    let filtered: Business[] = [];

    if (!userLocation) {
      // If user location not set, show all approved and logged in businesses
      filtered = businesses.filter(
        (business) => business.isApproved && business.isLoggedIn
      );
    } else {
      filtered = businesses.filter((business) => {
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
        return distance <= userRange;
      });
    }

    return filtered;
  }, [businesses, userLocation, userRange]);

  // Limit to 4 businesses for main display
  const displayedBusinesses = useMemo(() => {
    return filteredBusinesses.slice(0, 4);
  }, [filteredBusinesses]);

  const handleAddBusiness = async (business: Business) => {
    try {
      const response = await friendApi.sendFriendRequest(business.id);
      if (response.success) {
        setBusinessStatuses((prev) => ({ ...prev, [business.id]: "sent" }));
      }
    } catch (error) {
      console.error("Error sending friend request:", error);
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
        {filteredBusinesses.length === 0 ? (
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
            const isActionDisabled = status !== "none";
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
                <button
                  className={`newsfeed-suggested-friends__add-btn ${
                    isActionDisabled
                      ? "newsfeed-suggested-friends__add-btn--added"
                      : ""
                  }`}
                  onClick={() => !isActionDisabled && void handleAddBusiness(business)}
                  disabled={isActionDisabled}
                  title={
                    status === "friends"
                      ? "Already friends"
                      : status === "sent"
                        ? "Request sent"
                        : status === "pending"
                          ? "Incoming request pending"
                          : "Add business"
                  }
                >
                  {status === "friends" ? (
                    <Check size={18} />
                  ) : status === "sent" || status === "pending" ? (
                    <Clock size={18} />
                  ) : (
                    <Building2 size={18} />
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
                  const isActionDisabled = status !== "none";
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
                            : status === "sent"
                              ? "Request sent"
                              : status === "pending"
                                ? "Incoming request pending"
                                : "Add business"
                        }
                      >
                        {status === "friends" ? (
                          <Check size={18} />
                        ) : status === "sent" || status === "pending" ? (
                          <Clock size={18} />
                        ) : (
                          <Building2 size={18} />
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

export default SuggestedBusinesses;

