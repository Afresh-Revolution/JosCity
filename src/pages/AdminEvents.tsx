import React, { useState, useEffect } from "react";
import {
  Search,
  Calendar,
  Trash2,
  Edit,
  Loader2,
  AlertCircle,
  XCircle,
  Clock,
  Plus,
  MapPin,
  Image as ImageIcon,
  Users,
} from "lucide-react";
import {
  getEvents,
  createEvent,
  updateEvent,
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
  const [formError, setFormError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [createForm, setCreateForm] = useState({
    title: "",
    description: "",
    category: "",
    date: "",
    time: "",
    location: "",
    image: "",
    capacity: "",
  });

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

  const resetCreateForm = () => {
    setEditingEventId(null);
    setFormError(null);
    setCreateForm({
      title: "",
      description: "",
      category: "",
      date: "",
      time: "",
      location: "",
      image: "",
      capacity: "",
    });
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

  const handleCreateFormChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = event.target;
    setCreateForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setFormError("Please upload a valid image file.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (typeof result === "string") {
        setCreateForm((prev) => ({
          ...prev,
          image: result,
        }));
      }
    };
    reader.readAsDataURL(file);
  };

  const handleCreateEvent = async (event: React.FormEvent) => {
    event.preventDefault();
    setCreating(true);
    setFormError(null);
    setSuccess(null);

    try {
      const dateTime = createForm.time
        ? `${createForm.date}T${createForm.time}`
        : createForm.date;

      const payload = {
        title: createForm.title.trim(),
        description: createForm.description.trim() || undefined,
        category: createForm.category.trim() || undefined,
        date: dateTime,
        location: createForm.location.trim() || undefined,
        image: createForm.image || undefined,
        capacity: createForm.capacity
          ? Number.parseInt(createForm.capacity, 10)
          : undefined,
      };

      if (editingEventId) {
        await updateEvent(editingEventId, payload);
        setSuccess("Event updated successfully");
      } else {
        await createEvent(payload);
        setSuccess("Event created successfully");
      }

      setIsCreateModalOpen(false);
      setError(null);
      resetCreateForm();
      await loadEvents();
    } catch (err) {
      setFormError(
        err instanceof Error && err.message && err.message !== "true"
          ? err.message
          : editingEventId
            ? "Event update failed"
            : "Event creation failed"
      );
    } finally {
      setCreating(false);
    }
  };

  const handleEdit = (event: Event) => {
    const eventDate = event.event_date ? new Date(event.event_date) : null;
    const formattedDate = eventDate && !Number.isNaN(eventDate.getTime())
      ? eventDate.toISOString().split("T")[0]
      : "";
    const formattedTime = eventDate && !Number.isNaN(eventDate.getTime())
      ? `${eventDate.getHours().toString().padStart(2, "0")}:${eventDate
          .getMinutes()
          .toString()
          .padStart(2, "0")}`
      : "";

    setEditingEventId(event.event_id);
    setCreateForm({
      title: event.event_title || "",
      description: event.event_description || "",
      category: "",
      date: formattedDate,
      time: formattedTime,
      location: "",
      image: event.event_cover || "",
      capacity: "",
    });
    setFormError(null);
    setSuccess(null);
    setIsCreateModalOpen(true);
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
        <button
          type="button"
          className="admin-action-btn admin-action-btn--primary"
          onClick={() => {
            resetCreateForm();
            setSuccess(null);
            setIsCreateModalOpen(true);
          }}
        >
          <Plus size={16} />
          Add Event
        </button>
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
                    onClick={() => handleEdit(event)}
                    disabled={processing === event.event_id}
                    className="admin-action-btn admin-action-btn--edit"
                  >
                    <Edit size={16} />
                    Edit
                  </button>
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

      {isCreateModalOpen && (
        <div
          className="admin-modal-overlay"
          onClick={() => {
            if (!creating) {
              setIsCreateModalOpen(false);
              resetCreateForm();
            }
          }}
        >
          <div
            className="admin-event-modal"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="admin-event-modal__header">
              <h2>{editingEventId ? "Edit Event" : "Create Event"}</h2>
              <button
                type="button"
                onClick={() => {
                  if (!creating) {
                    setIsCreateModalOpen(false);
                    resetCreateForm();
                  }
                }}
                aria-label="Close event modal"
              >
                <XCircle size={20} />
              </button>
            </div>

            {formError && (
              <div className="admin-event-modal__message admin-event-modal__message--error">
                <AlertCircle size={18} />
                <span>{formError}</span>
                <button type="button" onClick={() => setFormError(null)}>
                  <XCircle size={18} />
                </button>
              </div>
            )}

            <form
              className="admin-event-modal__form"
              onSubmit={handleCreateEvent}
            >
              <div className="admin-event-modal__field">
                <label htmlFor="admin-event-title">Title</label>
                <input
                  id="admin-event-title"
                  name="title"
                  type="text"
                  value={createForm.title}
                  onChange={handleCreateFormChange}
                  placeholder="Enter event title"
                  required
                />
              </div>

              <div className="admin-event-modal__field">
                <label htmlFor="admin-event-description">Description</label>
                <textarea
                  id="admin-event-description"
                  name="description"
                  value={createForm.description}
                  onChange={handleCreateFormChange}
                  placeholder="Write a short event description"
                  rows={4}
                  required
                />
              </div>

              <div className="admin-event-modal__grid">
                <div className="admin-event-modal__field">
                  <label htmlFor="admin-event-category">Category</label>
                  <input
                    id="admin-event-category"
                    name="category"
                    type="text"
                    value={createForm.category}
                    onChange={handleCreateFormChange}
                    placeholder="Music, Art, Sport..."
                  />
                </div>

                <div className="admin-event-modal__field">
                  <label htmlFor="admin-event-capacity">
                    <Users size={14} />
                    Capacity
                  </label>
                  <input
                    id="admin-event-capacity"
                    name="capacity"
                    type="number"
                    min="1"
                    value={createForm.capacity}
                    onChange={handleCreateFormChange}
                    placeholder="200"
                  />
                </div>
              </div>

              <div className="admin-event-modal__grid">
                <div className="admin-event-modal__field">
                  <label htmlFor="admin-event-date">
                    <Calendar size={14} />
                    Date
                  </label>
                  <input
                    id="admin-event-date"
                    name="date"
                    type="date"
                    value={createForm.date}
                    onChange={handleCreateFormChange}
                    required
                  />
                </div>

                <div className="admin-event-modal__field">
                  <label htmlFor="admin-event-time">
                    <Clock size={14} />
                    Time
                  </label>
                  <input
                    id="admin-event-time"
                    name="time"
                    type="time"
                    value={createForm.time}
                    onChange={handleCreateFormChange}
                  />
                </div>
              </div>

              <div className="admin-event-modal__field">
                <label htmlFor="admin-event-location">
                  <MapPin size={14} />
                  Location
                </label>
                <input
                  id="admin-event-location"
                  name="location"
                  type="text"
                  value={createForm.location}
                  onChange={handleCreateFormChange}
                  placeholder="Venue or address"
                  required
                />
              </div>

              <div className="admin-event-modal__field">
                <label htmlFor="admin-event-image-url">
                  <ImageIcon size={14} />
                  Image URL
                </label>
                <input
                  id="admin-event-image-url"
                  name="image"
                  type="url"
                  value={createForm.image.startsWith("data:") ? "" : createForm.image}
                  onChange={handleCreateFormChange}
                  placeholder="https://example.com/event-image.jpg"
                />
              </div>

              <div className="admin-event-modal__field">
                <label htmlFor="admin-event-image-file">Or Upload Image</label>
                <input
                  id="admin-event-image-file"
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                />
              </div>

              {createForm.image && (
                <div className="admin-event-modal__preview">
                  <img src={createForm.image} alt="Event preview" />
                </div>
              )}

              <div className="admin-event-modal__actions">
                <button
                  type="button"
                  className="admin-action-btn"
                  onClick={() => {
                    if (!creating) {
                      setIsCreateModalOpen(false);
                      resetCreateForm();
                    }
                  }}
                  disabled={creating}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="admin-action-btn admin-action-btn--primary"
                  disabled={creating}
                >
                  {creating ? (
                    <>
                      <Loader2 size={16} className="spinner" />
                      {editingEventId ? "Saving..." : "Creating..."}
                    </>
                  ) : (
                    <>
                      {editingEventId ? <Edit size={16} /> : <Plus size={16} />}
                      {editingEventId ? "Save Changes" : "Create Event"}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminEvents;

