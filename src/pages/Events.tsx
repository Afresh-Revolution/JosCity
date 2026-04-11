import React, { useEffect, useRef, useState } from "react";
import { Calendar, Clock, MapPin, XCircle } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import "../main.css";
import "../scss/_events.scss";
import ChatPanel from "../components/ChatPanel";
import FindFriendsModal from "../components/FindFriendsModal";
import NewsFeedHeader from "./NewsFeed/NewsFeedHeader";
import NewsFeedSidebar from "./NewsFeed/NewsFeedSidebar";
import {
  getEvents,
  getPublicLandingEvents,
  type Event,
} from "../api/events";
import { getProfileUsername } from "../utils/userUtils";
import eventPlaceholder from "../image/discover.jpg";

const normalizeEvent = (event: Event) => {
  const rawCover = event.event_cover || event.image || "";
  return {
    id: event.event_id ?? event.id,
    title: event.event_title || event.title,
    description: event.event_description || event.description || "",
    date: event.event_date || event.date,
    location: event.event_location || event.location || "",
    image: String(rawCover).trim() || eventPlaceholder,
  };
};

const Events: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const isStandalonePage = location.pathname === "/events";
  const [isLeftSidebarOpen, setIsLeftSidebarOpen] = useState(false);
  const [isChatPanelOpen, setIsChatPanelOpen] = useState(false);
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);
  const [isAddFriendModalOpen, setIsAddFriendModalOpen] = useState(false);
  const [isNotificationPanelOpen, setIsNotificationPanelOpen] = useState(false);
  const [events, setEvents] = useState<ReturnType<typeof normalizeEvent>[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<ReturnType<
    typeof normalizeEvent
  > | null>(null);
  const [visibleElements, setVisibleElements] = useState<Set<string>>(
    new Set(),
  );
  const badgeRef = useRef<HTMLDivElement>(null);
  const imageWrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const elementId = entry.target.getAttribute("data-animate-id");
          if (!elementId) return;

          if (entry.isIntersecting) {
            setVisibleElements((prev) => new Set(prev).add(elementId));
          } else {
            setVisibleElements((prev) => {
              const next = new Set(prev);
              next.delete(elementId);
              return next;
            });
          }
        });
      },
      { threshold: 0.1 },
    );

    const elements = [badgeRef.current, imageWrapperRef.current];
    elements.forEach((el) => el && observer.observe(el));

    return () => {
      elements.forEach((el) => el && observer.unobserve(el));
    };
  }, []);

  useEffect(() => {
    const loadEvents = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = isStandalonePage
          ? await getEvents({ limit: 24, page: 1 })
          : await getPublicLandingEvents({ limit: 6 });
        const raw = response.data || [];
        const normalizedEvents = raw.map(normalizeEvent);
        const now = new Date();
        const upcomingOnly = normalizedEvents.filter((ev) => {
          if (!ev.date) return true;
          return new Date(ev.date) > now;
        });
        setEvents(isStandalonePage ? upcomingOnly.slice(0, 18) : upcomingOnly);
      } catch (loadError) {
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Unable to load events right now.",
        );
      } finally {
        setLoading(false);
      }
    };

    loadEvents();
  }, [isStandalonePage]);

  useEffect(() => {
    if (!selectedEvent) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setSelectedEvent(null);
      }
    };

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [selectedEvent]);

  const formatEventDate = (dateString: string) => {
    if (!dateString) return "";

    return new Date(dateString).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

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
          data-animate-id="events-grid"
          className={`events__grid-wrapper ${
            visibleElements.has("events-grid") ? "fade-in" : ""
          }`}
        >
          {loading ? (
            <div className="events__state">Loading events...</div>
          ) : error ? (
            <div className="events__state">{error}</div>
          ) : events.length === 0 ? (
            <div className="events__state">No events have been added yet.</div>
          ) : (
            <div className="events__grid">
              {events.map((event) => (
                <button
                  key={event.id}
                  type="button"
                  className="events__card"
                  onClick={() => setSelectedEvent(event)}
                >
                  <div className="events__card-image-shell">
                    <img
                      src={event.image}
                      alt={event.title}
                      className="events__card-image"
                    />
                  </div>
                  <div className="events__card-body">
                    <h3 className="events__card-title">{event.title}</h3>
                    {event.date && (
                      <div className="events__meta">
                        <Clock size={14} />
                        <span>{formatEventDate(event.date)}</span>
                      </div>
                    )}
                    {event.location && (
                      <div className="events__meta">
                        <MapPin size={14} />
                        <span>{event.location}</span>
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {selectedEvent && (
          <div
            className="events__lightbox"
            onClick={() => setSelectedEvent(null)}
          >
            <div
              className="events__lightbox-dialog"
              onClick={(event) => event.stopPropagation()}
            >
              <button
                type="button"
                className="events__lightbox-close"
                onClick={() => setSelectedEvent(null)}
                aria-label="Close event image"
              >
                <XCircle size={22} />
              </button>
              <img
                src={selectedEvent.image}
                alt={selectedEvent.title}
                className="events__lightbox-image"
              />
              <div className="events__lightbox-caption">
                <h3>{selectedEvent.title}</h3>
                {selectedEvent.description && (
                  <p>{selectedEvent.description}</p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );

  if (isStandalonePage) {
    return (
      <div className="events-page">
        <NewsFeedHeader
          isLeftSidebarOpen={isLeftSidebarOpen}
          onToggleLeftSidebar={() => setIsLeftSidebarOpen(!isLeftSidebarOpen)}
          unreadNotificationsCount={0}
          unreadMessagesCount={unreadMessagesCount}
          showRightSidebarToggle={false}
          onNotificationClick={() => setIsNotificationPanelOpen(true)}
          onMessageClick={() => setIsChatPanelOpen(true)}
          onAddFriendClick={() => setIsAddFriendModalOpen(true)}
          onCreatePost={() => navigate("/newsfeed")}
          onCreateStory={() => navigate("/newsfeed")}
          onProfileClick={() =>
            navigate(`/profile/${encodeURIComponent(getProfileUsername())}`)
          }
        />
        <div className="events-page__container">
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

  return eventsContent;
};

export default Events;
