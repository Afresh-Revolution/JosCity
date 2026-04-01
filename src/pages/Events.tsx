import React, { useState, useEffect, useRef } from "react";
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import "../main.css";
import "../scss/_events.scss";
import multipleLaugh from "../image/multiple-laugh.png";
import smile from "../image/smile.png";
import ChatPanel from "../components/ChatPanel";
import FindFriendsModal from "../components/FindFriendsModal";
import NewsFeedHeader from "./NewsFeed/NewsFeedHeader";
import NewsFeedSidebar from "./NewsFeed/NewsFeedSidebar";
import { getProfileUsername } from "../utils/userUtils";

const Events: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const isStandalonePage = location.pathname === "/events";
  const [isLeftSidebarOpen, setIsLeftSidebarOpen] = useState(false);
  const [isChatPanelOpen, setIsChatPanelOpen] = useState(false);
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);
  const [isAddFriendModalOpen, setIsAddFriendModalOpen] = useState(false);
  const [isNotificationPanelOpen, setIsNotificationPanelOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [visibleElements, setVisibleElements] = useState<Set<string>>(
    new Set()
  );
  const badgeRef = useRef<HTMLDivElement>(null);
  const imageWrapperRef = useRef<HTMLDivElement>(null);

  // Event images
  const eventImages = [
    {
      id: 1,
      url: multipleLaugh,
      alt: "Community Gathering",
    },
    {
      id: 2,
      url: smile,
      alt: "Happy Community",
    },
  ];

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const elementId = entry.target.getAttribute("data-animate-id");

          if (entry.isIntersecting) {
            if (elementId) {
              setVisibleElements((prev) => new Set(prev).add(elementId));
            }
          } else {
            // Remove from visible when scrolling out
            if (elementId) {
              setVisibleElements((prev) => {
                const newSet = new Set(prev);
                newSet.delete(elementId);
                return newSet;
              });
            }
          }
        });
      },
      { threshold: 0.1 }
    );

    const elements = [badgeRef.current, imageWrapperRef.current];

    elements.forEach((el) => {
      if (el) observer.observe(el);
    });

    return () => {
      elements.forEach((el) => {
        if (el) observer.unobserve(el);
      });
    };
  }, []);

  const handlePrevImage = () => {
    setCurrentImageIndex((prev) =>
      prev === 0 ? eventImages.length - 1 : prev - 1
    );
  };

  const handleNextImage = () => {
    setCurrentImageIndex((prev) =>
      prev === eventImages.length - 1 ? 0 : prev + 1
    );
  };

  // Auto-advance images every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prev) =>
        prev === eventImages.length - 1 ? 0 : prev + 1
      );
    }, 5000);

    return () => clearInterval(interval);
  }, [eventImages.length]);

  const eventsContent = (
    <section id="events" className="events">
      <div className="events__container">
        <div className="events__heading">
          <div
            ref={badgeRef}
            data-animate-id="events-badge"
            className={`events__badge ${
              visibleElements.has("events-badge") ? "fade-in" : ""
            }`}
          >
            <Calendar size={16} />
            <span>City Events</span>
          </div>
        </div>

        <div
          ref={imageWrapperRef}
          data-animate-id="events-image"
          className={`events__image-wrapper ${
            visibleElements.has("events-image") ? "fade-in" : ""
          }`}
        >
          {eventImages.length > 0 && (
            <>
              <img
                src={eventImages[currentImageIndex].url}
                alt={eventImages[currentImageIndex].alt}
                className="events__image"
              />
              {eventImages.length > 1 && (
                <>
                  <button
                    className="events__nav-button events__nav-button--prev"
                    onClick={handlePrevImage}
                    aria-label="Previous event"
                  >
                    <ChevronLeft size={20} />
                  </button>
                  <button
                    className="events__nav-button events__nav-button--next"
                    onClick={handleNextImage}
                    aria-label="Next event"
                  >
                    <ChevronRight size={20} />
                  </button>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </section>
  );

  // If used as standalone page, wrap with header and sidebar
  if (isStandalonePage) {
    return (
      <div className="events-page">
        <NewsFeedHeader
          isLeftSidebarOpen={isLeftSidebarOpen}
          onToggleLeftSidebar={() => setIsLeftSidebarOpen(!isLeftSidebarOpen)}
          showCreateMenu={true}
          showRightSidebarToggle={false}
          unreadNotificationsCount={0}
          unreadMessagesCount={unreadMessagesCount}
          onNotificationClick={() => setIsNotificationPanelOpen(true)}
          onAddFriendClick={() => setIsAddFriendModalOpen(true)}
          onMessageClick={() => setIsChatPanelOpen(true)}
          onCreatePost={() => navigate("/newsfeed")}
          onCreateStory={() => navigate("/newsfeed")}
          onProfileClick={() =>
            navigate(`/profile/${encodeURIComponent(getProfileUsername())}`)
          }
        />
        <div className="events-page__container">
          {/* Mobile Overlay */}
          {isLeftSidebarOpen && (
            <div
              className={`events-overlay ${
                isLeftSidebarOpen ? "events-overlay--visible" : ""
              }`}
              onClick={() => setIsLeftSidebarOpen(false)}
            />
          )}
          <NewsFeedSidebar
            isOpen={isLeftSidebarOpen}
            onClose={() => setIsLeftSidebarOpen(false)}
          />
          <main className="events-page__main">{eventsContent}</main>
        </div>
        <ChatPanel
          isOpen={isChatPanelOpen}
          onClose={() => setIsChatPanelOpen(false)}
          onUnreadCountChange={setUnreadMessagesCount}
        />
        <FindFriendsModal
          isOpen={isAddFriendModalOpen}
          onClose={() => setIsAddFriendModalOpen(false)}
        />
        {isNotificationPanelOpen && (
          <div
            className="newsfeed-notification-panel-overlay"
            onClick={() => setIsNotificationPanelOpen(false)}
          >
            <div
              className="newsfeed-notification-panel"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="newsfeed-notification-panel__header">
                <h3>Notifications</h3>
                <button
                  className="newsfeed-notification-panel__close"
                  onClick={() => setIsNotificationPanelOpen(false)}
                  aria-label="Close panel"
                >
                  X
                </button>
              </div>
              <div className="newsfeed-notification-panel__content">
                <div className="newsfeed-notification-panel__empty">
                  <p>No notifications</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // If used as section in landing page, return just the content
  return eventsContent;
};

export default Events;
