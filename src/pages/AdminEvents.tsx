import React, { useState, useEffect } from "react";
import {
  Search,
  Calendar,
  Trash2,
  Loader2,
  AlertCircle,
  XCircle,
  Clock,
} from "lucide-react";
import {
  getEvents,
  deleteEvent,
  type Event,
  type EventsResponse,
} from "../services/adminApi";
import "../main.css";
import "../scss/_admin.scss";

const AdminEvents: React.FC = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<Event[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    loadEvents();
  }, [page]);

  const loadEvents = async () => {
    try {
      setLoading(true);
      setError(null);
      const response: EventsResponse = await getEvents({
        page,
        limit: 20,
        search: searchQuery || undefined,
      });
      setEvents(response.data);
      setFilteredEvents(response.data);
      setTotalPages(response.pagination.totalPages);
    } catch (err) {
      console.error("Failed to load events:", err);
      // Don't set error if it's just an empty result
      setEvents([]);
      setFilteredEvents([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredEvents(events);
    } else {
      const query = searchQuery.toLowerCase();
      setFilteredEvents(
        events.filter((event) =>
          event.event_title?.toLowerCase().includes(query)
        )
      );
    }
  }, [searchQuery, events]);

  const handleDelete = async (eventId: string) => {
    try {
      setProcessing(eventId);
      setError(null);
      setSuccess(null);
      await deleteEvent(eventId);
      setSuccess("Event deleted successfully");
      await loadEvents();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete event");
    } finally {
      setProcessing(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="admin-dashboard">
      <div className="admin-dashboard__header">
        <h1>
          <Calendar size={20} />
          Events Management
        </h1>
      </div>

      <div className="admin-dashboard__search">
        <Search size={18} />
        <input
          type="text"
          placeholder="Search events by title..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {error && (
        <div className="admin-dashboard__message admin-dashboard__message--error">
          <AlertCircle size={18} />
          <span>{error}</span>
          <button onClick={() => setError(null)}>
            <XCircle size={18} />
          </button>
        </div>
      )}

      {success && (
        <div className="admin-dashboard__message admin-dashboard__message--success">
          <span>{success}</span>
          <button onClick={() => setSuccess(null)}>
            <XCircle size={18} />
          </button>
        </div>
      )}

      {loading ? (
        <div className="admin-dashboard__loading">
          <Loader2 size={32} className="spinner" />
          <span>Loading events...</span>
        </div>
      ) : filteredEvents.length === 0 ? (
        <div className="admin-dashboard__empty-state">
          <Calendar size={48} />
          <p>No events yet</p>
        </div>
      ) : (
        <>
          <div className="admin-events-grid">
            {filteredEvents.map((event) => (
              <div key={event.event_id} className="admin-event-card">
                <div className="admin-event-card__header">
                  {event.event_cover && (
                    <img
                      src={event.event_cover}
                      alt={event.event_title}
                      className="admin-event-card__image"
                    />
                  )}
                  <div className="admin-event-card__info">
                    <h3>{event.event_title}</h3>
                    <p className="admin-event-card__description">
                      {event.event_description?.substring(0, 100)}...
                    </p>
                    <div className="admin-event-card__organizer">
                      <span>
                        Organizer: {event.user_firstname} {event.user_lastname}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="admin-event-card__details">
                  <div className="admin-event-card__detail-item">
                    <Clock size={16} />
                    <span>{formatDate(event.event_date)}</span>
                  </div>
                </div>

                <div className="admin-event-card__actions">
                  <button
                    onClick={() => handleDelete(event.event_id)}
                    disabled={processing === event.event_id}
                    className="admin-action-btn admin-action-btn--delete"
                  >
                    {processing === event.event_id ? (
                      <Loader2 size={16} className="spinner" />
                    ) : (
                      <Trash2 size={16} />
                    )}
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="admin-pagination">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="admin-pagination__btn"
              >
                Previous
              </button>
              <span>
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="admin-pagination__btn"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default AdminEvents;

