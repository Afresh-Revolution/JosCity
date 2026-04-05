import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  Calendar,
  Plus,
  FileText,
  Clock,
  Users,
  Globe,
  Filter,
  X,
  MapPin,
  Image as ImageIcon,
  DollarSign,
  User,
  Eye,
  EyeOff,
  Edit,
} from "lucide-react";
import SearchBar from "../../components/SearchBar";
import {
  getProfileUsername,
  isAuthenticated,
} from "../../utils/userUtils";
import { createEvent, updateEvent, deleteEvent, getEvents, type Event } from "../../api/events";
import NewsFeedHeader from "../NewsFeed/NewsFeedHeader";
import NewsFeedSidebar from "../NewsFeed/NewsFeedSidebar";
import { useNewsFeedNavPanels } from "../../hooks/useNewsFeedNavPanels";
import "../../main.css";
import "../../scss/_eventspage.scss";
import "../../scss/_searchbar.scss";
import "../../scss/_newsfeed.scss";
import "../../scss/_emojipicker.scss";
import "../../scss/_profilemodal.scss";
import "../../scss/_messagepopup.scss";

// Helper function to normalize event data from API to component format
const normalizeEvent = (event: Event): Event => {
  return {
    id: event.event_id ?? event.id,
    event_id: event.event_id ?? event.id,
    title: event.event_title || event.title,
    event_title: event.event_title || event.title,
    description: event.event_description || event.description,
    event_description: event.event_description || event.description,
    category: event.event_category || event.category || "All",
    event_category: event.event_category || event.category,
    date: event.event_date || event.date,
    event_date: event.event_date || event.date,
    location: event.event_location || event.location,
    event_location: event.event_location || event.location,
    image: event.event_cover || event.image,
    event_cover: event.event_cover || event.image,
    capacity: event.event_capacity ?? event.capacity,
    event_capacity: event.event_capacity ?? event.capacity,
    tickets_sold: event.tickets_sold,
    user_picture: event.user_picture,
    source: event.source,
    ticket_url: event.ticket_url ?? null,
  };
};

const EventsPage: React.FC = () => {
  const navigate = useNavigate();
  const [isLeftSidebarOpen, setIsLeftSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("Discover");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [events, setEvents] = useState<Event[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<Event[]>([]);
  const [isCategoryMenuOpen, setIsCategoryMenuOpen] = useState(false);
  const [isCreateEventModalOpen, setIsCreateEventModalOpen] = useState(false);
  const [isEditEventModalOpen, setIsEditEventModalOpen] = useState(false);
  const [editingEventId, setEditingEventId] = useState<number | null>(null);
  const [eventsLoading, setEventsLoading] = useState(false);
  const [eventsError, setEventsError] = useState<string | null>(null);
  const mainContentRef = useRef<HTMLElement>(null);
  const categoryMenuRef = useRef<HTMLDivElement>(null);
  const createEventModalRef = useRef<HTMLDivElement>(null);
  const editEventModalRef = useRef<HTMLDivElement>(null);

  // Create Event Form State
  const [eventForm, setEventForm] = useState({
    title: "",
    description: "",
    category: "All",
    date: "",
    time: "",
    timeHour: "12",
    timeMinute: "00",
    timePeriod: "PM",
    location: "",
    image: null as File | null,
    imagePreview: "",
    capacity: "",
    price: "",
    isPublic: true,
  });

  // Image upload error state
  const [imageError, setImageError] = useState<string>("");

  const { panels, headerNavProps } = useNewsFeedNavPanels({
    mainContentRef,
    refetchMainFeedAfterPost: false,
  });

  // User event lists (Going, Interested, etc.)
  const [userEventLists, setUserEventLists] = useState<{
    going: number[];
    interested: number[];
    invited: number[];
    myEvents: number[];
  }>(() => {
    try {
      const saved = localStorage.getItem("userEventLists");
      return saved
        ? JSON.parse(saved)
        : { going: [], interested: [], invited: [], myEvents: [] };
    } catch {
      return { going: [], interested: [], invited: [], myEvents: [] };
    }
  });

  // Event categories
  const categories = [
    "All",
    "Art",
    "Crafts",
    "Dance",
    "Drinks",
    "Films",
    "Fitness",
    "Food",
    "Game",
    "Party",
    "Health",
    "Sport",
    "Literature",
    "Music",
    "Religion",
  ];

  // Load events from API
  useEffect(() => {
    const loadEvents = async () => {
      setEventsLoading(true);
      setEventsError(null);
      try {
        const response = await getEvents({ limit: 100 }); // Get all events
        if (response.success && response.data) {
          const normalizedEvents = response.data.map(normalizeEvent);
          setEvents(normalizedEvents);
        } else {
          setEvents([]);
        }
      } catch (error) {
        console.error("Error loading events:", error);
        setEventsError(error instanceof Error ? error.message : "Failed to load events");
        setEvents([]);
      } finally {
        setEventsLoading(false);
      }
    };

    loadEvents();
  }, []);

  // Filter events based on selected category and active tab
  useEffect(() => {
    let filtered = events;

    // Filter out events that have passed their start time
    const now = new Date();
    filtered = filtered.filter((event) => {
      if (!event.date) return true;
      const eventDate = new Date(event.date);
      return eventDate > now; // Only show events that haven't started yet
    });

    // First filter by active tab (Going, Interested, etc.)
    if (activeTab === "Going") {
      filtered = filtered.filter((event) =>
        userEventLists.going.includes(event.id)
      );
    } else if (activeTab === "Interested") {
      filtered = filtered.filter((event) =>
        userEventLists.interested.includes(event.id)
      );
    } else if (activeTab === "Invited") {
      filtered = filtered.filter((event) =>
        userEventLists.invited.includes(event.id)
      );
    } else if (activeTab === "My Events") {
      filtered = filtered.filter((event) =>
        userEventLists.myEvents.includes(event.id)
      );
    }
    // "Discover" tab shows all events

    // Then filter by selected category
    if (selectedCategory !== "All") {
      filtered = filtered.filter(
        (event) =>
          event.category?.toLowerCase() === selectedCategory.toLowerCase()
      );
    }

    setFilteredEvents(filtered);
  }, [selectedCategory, events, activeTab, userEventLists]);

  // Navigation tabs
  const tabs = ["Discover", "Going", "Interested", "Invited", "My Events"];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        categoryMenuRef.current &&
        !categoryMenuRef.current.contains(event.target as Node)
      ) {
        setIsCategoryMenuOpen(false);
      }
    };

    if (isCategoryMenuOpen || isCreateEventModalOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isCategoryMenuOpen, isCreateEventModalOpen]);

  const handleProfileClick = () => {
    const username = getProfileUsername();
    if (username) {
      navigate(`/profile/${username}`);
    }
  };

  const handleCreateEventClick = () => {
    if (!isAuthenticated()) {
      navigate("/signin");
      return;
    }
    setIsCreateEventModalOpen(true);
  };

  const handleCloseCreateEventModal = () => {
    setIsCreateEventModalOpen(false);
    setIsEditEventModalOpen(false);
    setEditingEventId(null);
    // Reset form
    setEventForm({
      title: "",
      description: "",
      category: "All",
      date: "",
      time: "",
      timeHour: "12",
      timeMinute: "00",
      timePeriod: "PM",
      location: "",
      image: null,
      imagePreview: "",
      capacity: "",
      price: "",
      isPublic: true,
    });
    setImageError("");
  };

  const handleEditEvent = (eventId: number) => {
    const eventToEdit = events.find((e) => e.id === eventId);
    if (!eventToEdit) return;

    setEditingEventId(eventId);

    // Parse date and time
    const eventDate = new Date(eventToEdit.date);
    const dateStr = eventDate.toISOString().split("T")[0];
    const hours = eventDate.getHours();
    const minutes = eventDate.getMinutes();
    const period = hours >= 12 ? "PM" : "AM";
    const hour12 = hours % 12 || 12;

    // Populate form with event data
    setEventForm({
      title: eventToEdit.title,
      description: eventToEdit.description || "",
      category: eventToEdit.category || "All",
      date: dateStr,
      time: "",
      timeHour: hour12.toString(),
      timeMinute: minutes.toString().padStart(2, "0"),
      timePeriod: period,
      location: eventToEdit.location || "",
      image: null,
      imagePreview: eventToEdit.image || "",
      capacity: eventToEdit.capacity?.toString() || "",
      price: "",
      isPublic: true,
    });
    setImageError("");
    setIsEditEventModalOpen(true);
  };

  // Get number of people going to an event
  const getGoingCount = (eventId: number): number => {
    return userEventLists.going.filter((id) => id === eventId).length;
  };

  const handleEventFormChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setEventForm((prev) => {
      const updated = { ...prev, [name]: value };
      // Update time field when hour, minute, or period changes
      if (
        name === "timeHour" ||
        name === "timeMinute" ||
        name === "timePeriod"
      ) {
        updated.time = `${updated.timeHour}:${updated.timeMinute} ${updated.timePeriod}`;
      }
      return updated;
    });
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      setImageError("");
      return;
    }

    // Validate file type
    const validImageTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/gif",
      "image/webp",
    ];
    if (!validImageTypes.includes(file.type)) {
      setImageError(
        "Invalid file type. Please upload a JPEG, PNG, GIF, or WebP image."
      );
      e.target.value = ""; // Clear the input
      return;
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB in bytes
    if (file.size > maxSize) {
      setImageError(
        "File size too large. Please upload an image smaller than 10MB."
      );
      e.target.value = ""; // Clear the input
      return;
    }

    // If validation passes, set the image
    setImageError("");
    setEventForm((prev) => ({
      ...prev,
      image: file,
      imagePreview: URL.createObjectURL(file),
    }));
  };

  const handleSubmitEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    setEventsError(null);

    try {
      // Create new event object
      const time24 = convertTo24Hour(
        eventForm.timeHour,
        eventForm.timeMinute,
        eventForm.timePeriod
      );
      const eventDate = `${eventForm.date}T${time24}`;

      const eventData = {
        title: eventForm.title,
        description: eventForm.description || undefined,
        category: eventForm.category !== "All" ? eventForm.category : undefined,
        date: eventDate,
        location: eventForm.location || undefined,
        image: eventForm.imagePreview || undefined,
        capacity: eventForm.capacity ? parseInt(eventForm.capacity) : undefined,
      };

      let savedEvent: Event;

      if (editingEventId) {
        // Update existing event
        const response = await updateEvent(editingEventId, eventData);
        if (response.success && response.data) {
          savedEvent = normalizeEvent(response.data);
          // Update events list
          const updatedEvents = events.map((event) =>
            event.id === editingEventId ? savedEvent : event
          );
          setEvents(updatedEvents);
          alert("Event updated successfully!");
        } else {
          throw new Error("Failed to update event");
        }
      } else {
        // Create new event
        const response = await createEvent(eventData);
        if (response.success && response.data) {
          savedEvent = normalizeEvent(response.data);
          // Add to events list
          const updatedEvents = [...events, savedEvent];
          setEvents(updatedEvents);
          
          // Automatically add to "My Events" list when user creates an event
          const updatedLists = {
            ...userEventLists,
            myEvents: [...userEventLists.myEvents, savedEvent.id],
          };
          setUserEventLists(updatedLists);
          // Save updated lists
          try {
            localStorage.setItem("userEventLists", JSON.stringify(updatedLists));
          } catch (error) {
            console.error("Error saving user event lists:", error);
          }
          
          alert("Event created successfully!");
        } else {
          throw new Error("Failed to create event");
        }
      }

      // Close modal and reset form
      handleCloseCreateEventModal();
    } catch (error) {
      console.error("Error saving event:", error);
      setEventsError(error instanceof Error ? error.message : "Failed to save event");
      alert(
        error instanceof Error
          ? `Error: ${error.message}`
          : "Failed to save event. Please try again."
      );
    }
  };

  // Convert 12-hour time to 24-hour format
  const convertTo24Hour = (
    hour: string,
    minute: string,
    period: string
  ): string => {
    let hour24 = parseInt(hour);
    if (period === "PM" && hour24 !== 12) {
      hour24 += 12;
    } else if (period === "AM" && hour24 === 12) {
      hour24 = 0;
    }
    return `${hour24.toString().padStart(2, "0")}:${minute}`;
  };

  // Handle adding/removing events from user lists
  const handleEventAction = (
    eventId: number,
    action: "going" | "interested" | "invited"
  ) => {
    setUserEventLists((prev) => {
      const currentList = prev[action];
      const isInList = currentList.includes(eventId);

      const updated = {
        ...prev,
        [action]: isInList
          ? currentList.filter((id) => id !== eventId)
          : [...currentList, eventId],
      };

      // Save to localStorage
      try {
        localStorage.setItem("userEventLists", JSON.stringify(updated));
      } catch (error) {
        console.error("Error saving user event lists:", error);
      }

      return updated;
    });
  };

  // Check if event is in a list
  const isEventInList = (
    eventId: number,
    list: "going" | "interested" | "invited" | "myEvents"
  ): boolean => {
    return userEventLists[list].includes(eventId);
  };

  // Check if event is created by user
  const isEventCreatedByUser = (eventId: number): boolean => {
    return userEventLists.myEvents.includes(eventId);
  };

  // External event (e.g. gatewav): show "Buy tickets" link, hide Going/Interested/Edit/Delete
  const isExternalEvent = (event: Event): boolean => {
    return !!(event.source === "gatewav" || event.ticket_url);
  };

  // Handle event deletion
  const handleDeleteEvent = async (eventId: number) => {
    if (
      window.confirm(
        "Are you sure you want to delete this event? This action cannot be undone."
      )
    ) {
      setEventsError(null);
      try {
        const response = await deleteEvent(eventId);
        if (response.success) {
          // Remove from events list
          const updatedEvents = events.filter((event) => event.id !== eventId);
          setEvents(updatedEvents);

          // Remove from all user lists
          const updatedLists = {
            going: userEventLists.going.filter((id) => id !== eventId),
            interested: userEventLists.interested.filter((id) => id !== eventId),
            invited: userEventLists.invited.filter((id) => id !== eventId),
            myEvents: userEventLists.myEvents.filter((id) => id !== eventId),
          };
          setUserEventLists(updatedLists);

          // Save updated lists
          try {
            localStorage.setItem("userEventLists", JSON.stringify(updatedLists));
          } catch (error) {
            console.error("Error saving user event lists:", error);
          }

          alert("Event deleted successfully!");
        } else {
          throw new Error("Failed to delete event");
        }
      } catch (error) {
        console.error("Error deleting event:", error);
        setEventsError(error instanceof Error ? error.message : "Failed to delete event");
        alert(
          error instanceof Error
            ? `Error: ${error.message}`
            : "Error deleting event. Please try again."
        );
      }
    }
  };

  return (
    <div className="events-page-wrapper events-page">
      <div className="eventspage eventspage--with-fixed-header">
      <NewsFeedHeader
        isLeftSidebarOpen={isLeftSidebarOpen}
        onToggleLeftSidebar={() => setIsLeftSidebarOpen(!isLeftSidebarOpen)}
        onProfileClick={handleProfileClick}
        showRightSidebarToggle={false}
        {...headerNavProps}
      />

      {isLeftSidebarOpen && (
        <div
          className="newsfeed-overlay"
          onClick={() => setIsLeftSidebarOpen(false)}
          aria-hidden="true"
        />
      )}
      <NewsFeedSidebar
        isOpen={isLeftSidebarOpen}
        onClose={() => setIsLeftSidebarOpen(false)}
      />

      {/* Hero Section */}
      <section className="eventspage-hero">
        <div className="eventspage-hero__container">
          <div className="eventspage-hero__content">
            <div className="eventspage-hero__illustration">
              <Calendar size={90} fill="white" stroke="white" />
            </div>
            <div className="eventspage-hero__text">
              <h1 className="eventspage-hero__title">Events</h1>
              <p className="eventspage-hero__subtitle">Discover events</p>
            </div>
          </div>
          <div className="eventspage-hero__search">
            <SearchBar
              placeholder="Search for Events"
              variant="hero"
              onSearch={(query) => {
                // Filter events based on search query
                // This will be implemented when events data is available
                console.log("Searching for:", query);
              }}
              onResultClick={(result) => {
                // Handle search result click
                console.log("Search result clicked:", result);
              }}
              searchData={{
                events: [], // Will be populated with actual events data
              }}
            />
          </div>
        </div>
      </section>

      {/* Navigation Tabs */}
      <div className="eventspage-tabs">
        <div className="eventspage-tabs__container">
          <div className="eventspage-tabs__list">
            {tabs.map((tab) => (
              <button
                key={tab}
                className={`eventspage-tabs__item ${
                  activeTab === tab ? "eventspage-tabs__item--active" : ""
                }`}
                onClick={() => setActiveTab(tab)}
              >
                {tab}
              </button>
            ))}
          </div>
          <button
            type="button"
            className="eventspage-tabs__create-btn"
            onClick={handleCreateEventClick}
            title={
              isAuthenticated()
                ? "Create a new event"
                : "Sign in to create an event"
            }
          >
            <Plus size={18} />
            <span>Add event</span>
          </button>
        </div>
      </div>

      {/* Content Wrapper */}
      <div className="eventspage-content">
        {/* Main Content Area */}
        <div className="eventspage-container">
          {/* Left Sidebar - Categories */}
          <aside className="eventspage-sidebar">
            <div className="eventspage-sidebar__categories">
              {categories.map((category) => (
                <button
                  key={category}
                  className={`eventspage-sidebar__category ${
                    selectedCategory === category
                      ? "eventspage-sidebar__category--active"
                      : ""
                  }`}
                  onClick={() => setSelectedCategory(category)}
                >
                  {category}
                </button>
              ))}
            </div>
          </aside>

          {/* Main Content */}
          <main className="eventspage-main" ref={mainContentRef}>
            <div className="eventspage-main__header">
              <div className="eventspage-main__header-left">
                <h2 className="eventspage-main__title">
                  {activeTab === "Discover"
                    ? "Discover Events"
                    : activeTab === "Going"
                    ? "Going Events"
                    : activeTab === "Interested"
                    ? "Interested Events"
                    : activeTab === "Invited"
                    ? "Invited Events"
                    : activeTab === "My Events"
                    ? "My Events"
                    : "Events"}
                </h2>
                {/* Mobile Category Filter Button */}
                <button
                  className="eventspage-main__category-toggle"
                  onClick={() => setIsCategoryMenuOpen(!isCategoryMenuOpen)}
                  aria-label="Filter by category"
                >
                  <Filter size={18} />
                  <span>{selectedCategory}</span>
                </button>
              </div>
              {(activeTab === "Going" ||
                activeTab === "Interested" ||
                activeTab === "Invited" ||
                activeTab === "My Events") && (
                <div className="eventspage-main__filters">
                  <button className="eventspage-main__filter-btn">
                    <FileText size={16} />
                    <span>All Types</span>
                  </button>
                  <button className="eventspage-main__filter-btn">
                    <Globe size={16} />
                    <span>All Languages</span>
                  </button>
                </div>
              )}
            </div>
            {/* Mobile Category Menu */}
            {isCategoryMenuOpen && (
              <>
                <div
                  className="eventspage-main__category-menu-backdrop"
                  onClick={() => setIsCategoryMenuOpen(false)}
                />
                <div
                  className="eventspage-main__category-menu"
                  ref={categoryMenuRef}
                >
                  <div className="eventspage-main__category-menu-header">
                    <h3>Filter by Category</h3>
                    <button
                      onClick={() => setIsCategoryMenuOpen(false)}
                      aria-label="Close category menu"
                    >
                      <X size={20} />
                    </button>
                  </div>
                  <div className="eventspage-main__category-menu-list">
                    {categories.map((category) => (
                      <button
                        key={category}
                        className={`eventspage-main__category-menu-item ${
                          selectedCategory === category
                            ? "eventspage-main__category-menu-item--active"
                            : ""
                        }`}
                        onClick={() => {
                          setSelectedCategory(category);
                          setIsCategoryMenuOpen(false);
                        }}
                      >
                        {category}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
            <div className="eventspage-main__content">
              {eventsLoading ? (
                <div className="eventspage-main__empty">
                  <div className="eventspage-main__empty-illustration">
                    <div className="eventspage-main__empty-icon">
                      <Clock size={48} />
                    </div>
                  </div>
                  <p className="eventspage-main__empty-text">Loading events...</p>
                </div>
              ) : eventsError ? (
                <div className="eventspage-main__empty">
                  <div className="eventspage-main__empty-illustration">
                    <div className="eventspage-main__empty-icon">
                      <X size={48} />
                    </div>
                  </div>
                  <p className="eventspage-main__empty-text">Error loading events</p>
                  <p className="eventspage-main__empty-subtext">{eventsError}</p>
                </div>
              ) : filteredEvents.length === 0 ? (
                <div className="eventspage-main__empty">
                  <div className="eventspage-main__empty-illustration">
                    <div className="eventspage-main__empty-icon">
                      <Search size={48} />
                    </div>
                  </div>
                  <p className="eventspage-main__empty-text">No Data Found</p>
                  <p className="eventspage-main__empty-subtext">
                    {selectedCategory === "All"
                      ? "There is no data to show you right now"
                      : `No ${selectedCategory} events found`}
                  </p>
                </div>
              ) : (
                <div className="eventspage-main__events-list">
                  {filteredEvents.map((event) => (
                    <div key={event.id} className="eventspage-event-card">
                      {event.image && (
                        <div className="eventspage-event-card__image">
                          <img src={event.image} alt={event.title} />
                        </div>
                      )}
                      <div className="eventspage-event-card__content">
                        <h3 className="eventspage-event-card__title">
                          {event.title}
                        </h3>
                        {event.description && (
                          <p className="eventspage-event-card__description">
                            {event.description}
                          </p>
                        )}
                        <div className="eventspage-event-card__meta">
                          {event.date && (
                            <span className="eventspage-event-card__date">
                              <Calendar size={16} />
                              {new Date(event.date).toLocaleDateString()}
                              {event.date.includes("T") && (
                                <span className="eventspage-event-card__time">
                                  {" "}
                                  {new Date(event.date).toLocaleTimeString(
                                    "en-US",
                                    {
                                      hour: "numeric",
                                      minute: "2-digit",
                                      hour12: true,
                                    }
                                  )}
                                </span>
                              )}
                            </span>
                          )}
                          {event.location && (
                            <span className="eventspage-event-card__location">
                              {event.location}
                            </span>
                          )}
                        </div>
                        <div className="eventspage-event-card__category">
                          <span className="eventspage-event-card__category-badge">
                            {event.category}
                          </span>
                        </div>
                        {/* Capacity/Attendee Info - JOSCITY: going count; Gatewav: tickets sold from Ticketing API */}
                        {event.capacity && (
                          <div className="eventspage-event-card__capacity">
                            <Users size={14} />
                            <span>
                              {isExternalEvent(event)
                                ? `${event.tickets_sold ?? 0} / ${event.capacity} tickets`
                                : `${getGoingCount(event.id)} / ${event.capacity} going`}
                            </span>
                            {(isExternalEvent(event)
                              ? (event.tickets_sold ?? 0) >= event.capacity
                              : getGoingCount(event.id) >= event.capacity) && (
                              <span className="eventspage-event-card__capacity-full">
                                Full
                              </span>
                            )}
                          </div>
                        )}
                        {/* External event badge */}
                        {isExternalEvent(event) && (
                          <div className="eventspage-event-card__source-badge">
                            {event.source === "gatewav" ? "Gatewav" : event.source}
                          </div>
                        )}
                        <div className="eventspage-event-card__actions">
                          {/* Buy tickets - for external (gatewav) events */}
                          {isExternalEvent(event) && event.ticket_url && (
                            <a
                              href={event.ticket_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="eventspage-event-card__action-btn eventspage-event-card__action-btn--primary"
                            >
                              <Globe size={16} />
                              <span>Buy tickets</span>
                            </a>
                          )}
                          {/* Edit and Delete buttons - show for all user-created events on any tab */}
                          {!isExternalEvent(event) && isEventCreatedByUser(event.id) && (
                            <>
                              <button
                                className="eventspage-event-card__edit-btn"
                                onClick={() => handleEditEvent(event.id)}
                                title="Edit event"
                              >
                                <Edit size={16} />
                                <span>Edit</span>
                              </button>
                              <button
                                className="eventspage-event-card__delete-btn"
                                onClick={() => handleDeleteEvent(event.id)}
                                title="Delete event"
                              >
                                <X size={16} />
                                <span>Delete</span>
                              </button>
                            </>
                          )}

                          {/* Going button - show Add if not in list, Remove if in list (only for JOSCITY events) */}
                          {!isExternalEvent(event) && (isEventInList(event.id, "going") ? (
                            <button
                              className="eventspage-event-card__remove-btn"
                              onClick={() =>
                                handleEventAction(event.id, "going")
                              }
                              title="Remove from Going"
                            >
                              <X size={16} />
                              <span>Remove from Going</span>
                            </button>
                          ) : (
                            <button
                              className="eventspage-event-card__action-btn"
                              onClick={() =>
                                handleEventAction(event.id, "going")
                              }
                              title="Add to Going"
                            >
                              <Calendar size={16} />
                              <span>Going</span>
                            </button>
                          ))}

                          {/* Interested button - show Add if not in list, Remove if in list (only for JOSCITY events) */}
                          {!isExternalEvent(event) && (isEventInList(event.id, "interested") ? (
                            <button
                              className="eventspage-event-card__remove-btn"
                              onClick={() =>
                                handleEventAction(event.id, "interested")
                              }
                              title="Remove from Interested"
                            >
                              <X size={16} />
                              <span>Remove from Interested</span>
                            </button>
                          ) : (
                            <button
                              className="eventspage-event-card__action-btn"
                              onClick={() =>
                                handleEventAction(event.id, "interested")
                              }
                              title="Add to Interested"
                            >
                              <Users size={16} />
                              <span>Interested</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </main>
        </div>
      </div>

      {/* Create Event Modal */}
      {isCreateEventModalOpen && (
        <>
          <div
            className="eventspage-create-modal__backdrop"
            onClick={handleCloseCreateEventModal}
          />
          <div
            className="eventspage-create-modal"
            ref={isEditEventModalOpen ? editEventModalRef : createEventModalRef}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="eventspage-create-modal__header">
              <h2 className="eventspage-create-modal__title">
                {editingEventId ? "Edit Event" : "Create New Event"}
              </h2>
              <button
                className="eventspage-create-modal__close"
                onClick={handleCloseCreateEventModal}
                aria-label="Close modal"
              >
                <X size={24} />
              </button>
            </div>

            <form
              className="eventspage-create-modal__form"
              onSubmit={handleSubmitEvent}
            >
              {/* Event Image Upload */}
              <div className="eventspage-create-modal__field">
                <label className="eventspage-create-modal__label">
                  <ImageIcon size={18} />
                  Event Image
                </label>
                <div className="eventspage-create-modal__image-upload">
                  {eventForm.imagePreview ? (
                    <div className="eventspage-create-modal__image-preview">
                      <img
                        src={eventForm.imagePreview}
                        alt="Event preview"
                        className="eventspage-create-modal__preview-img"
                      />
                      <button
                        type="button"
                        className="eventspage-create-modal__remove-image"
                        onClick={() =>
                          setEventForm((prev) => ({
                            ...prev,
                            image: null,
                            imagePreview: "",
                          }))
                        }
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ) : (
                    <label className="eventspage-create-modal__upload-area">
                      <input
                        type="file"
                        accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                        onChange={handleImageChange}
                        className="eventspage-create-modal__file-input"
                      />
                      <ImageIcon size={32} />
                      <span>Click to upload image</span>
                      <span className="eventspage-create-modal__upload-hint">
                        PNG, JPG, GIF, WebP up to 10MB
                      </span>
                    </label>
                  )}
                </div>
                {imageError && (
                  <div className="eventspage-create-modal__error">
                    {imageError}
                  </div>
                )}
              </div>

              {/* Event Title */}
              <div className="eventspage-create-modal__field">
                <label
                  htmlFor="event-title"
                  className="eventspage-create-modal__label"
                >
                  Event Title *
                </label>
                <input
                  type="text"
                  id="event-title"
                  name="title"
                  value={eventForm.title}
                  onChange={handleEventFormChange}
                  className="eventspage-create-modal__input"
                  placeholder="Enter event title"
                  required
                />
              </div>

              {/* Event Description */}
              <div className="eventspage-create-modal__field">
                <label
                  htmlFor="event-description"
                  className="eventspage-create-modal__label"
                >
                  Description *
                </label>
                <textarea
                  id="event-description"
                  name="description"
                  value={eventForm.description}
                  onChange={handleEventFormChange}
                  className="eventspage-create-modal__textarea"
                  placeholder="Describe your event..."
                  rows={4}
                  required
                />
              </div>

              {/* Category and Date Row */}
              <div className="eventspage-create-modal__row">
                <div className="eventspage-create-modal__field">
                  <label
                    htmlFor="event-category"
                    className="eventspage-create-modal__label"
                  >
                    Category *
                  </label>
                  <select
                    id="event-category"
                    name="category"
                    value={eventForm.category}
                    onChange={handleEventFormChange}
                    className="eventspage-create-modal__select"
                    required
                  >
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="eventspage-create-modal__field">
                  <label
                    htmlFor="event-date"
                    className="eventspage-create-modal__label"
                  >
                    Date *
                  </label>
                  <input
                    type="date"
                    id="event-date"
                    name="date"
                    value={eventForm.date}
                    onChange={handleEventFormChange}
                    className="eventspage-create-modal__input"
                    required
                    min={new Date().toISOString().split("T")[0]}
                  />
                </div>
              </div>

              {/* Time and Location Row */}
              <div className="eventspage-create-modal__row">
                <div className="eventspage-create-modal__field">
                  <label
                    htmlFor="event-time"
                    className="eventspage-create-modal__label"
                  >
                    Time *
                  </label>
                  <div className="eventspage-create-modal__time-inputs">
                    <select
                      name="timeHour"
                      value={eventForm.timeHour}
                      onChange={handleEventFormChange}
                      className="eventspage-create-modal__time-select"
                      required
                    >
                      {Array.from({ length: 12 }, (_, i) => i + 1).map(
                        (hour) => (
                          <option key={hour} value={hour.toString()}>
                            {hour}
                          </option>
                        )
                      )}
                    </select>
                    <span className="eventspage-create-modal__time-separator">
                      :
                    </span>
                    <select
                      name="timeMinute"
                      value={eventForm.timeMinute}
                      onChange={handleEventFormChange}
                      className="eventspage-create-modal__time-select"
                      required
                    >
                      {Array.from({ length: 60 }, (_, i) => i).map((min) => (
                        <option
                          key={min}
                          value={min.toString().padStart(2, "0")}
                        >
                          {min.toString().padStart(2, "0")}
                        </option>
                      ))}
                    </select>
                    <select
                      name="timePeriod"
                      value={eventForm.timePeriod}
                      onChange={handleEventFormChange}
                      className="eventspage-create-modal__time-select"
                      required
                    >
                      <option value="AM">AM</option>
                      <option value="PM">PM</option>
                    </select>
                  </div>
                </div>

                <div className="eventspage-create-modal__field">
                  <label
                    htmlFor="event-location"
                    className="eventspage-create-modal__label"
                  >
                    <MapPin size={16} />
                    Location *
                  </label>
                  <input
                    type="text"
                    id="event-location"
                    name="location"
                    value={eventForm.location}
                    onChange={handleEventFormChange}
                    className="eventspage-create-modal__input"
                    placeholder="Event location"
                    required
                  />
                </div>
              </div>

              {/* Capacity and Price Row */}
              <div className="eventspage-create-modal__row">
                <div className="eventspage-create-modal__field">
                  <label
                    htmlFor="event-capacity"
                    className="eventspage-create-modal__label"
                  >
                    <User size={16} />
                    Capacity
                  </label>
                  <input
                    type="number"
                    id="event-capacity"
                    name="capacity"
                    value={eventForm.capacity}
                    onChange={handleEventFormChange}
                    className="eventspage-create-modal__input"
                    placeholder="Max attendees"
                    min="1"
                  />
                </div>

                <div className="eventspage-create-modal__field">
                  <label
                    htmlFor="event-price"
                    className="eventspage-create-modal__label"
                  >
                    <DollarSign size={16} />
                    Price
                  </label>
                  <input
                    type="number"
                    id="event-price"
                    name="price"
                    value={eventForm.price}
                    onChange={handleEventFormChange}
                    className="eventspage-create-modal__input"
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                  />
                </div>
              </div>

              {/* Privacy Setting */}
              <div className="eventspage-create-modal__field">
                <label className="eventspage-create-modal__checkbox-label">
                  <input
                    type="checkbox"
                    name="isPublic"
                    checked={eventForm.isPublic}
                    onChange={(e) =>
                      setEventForm((prev) => ({
                        ...prev,
                        isPublic: e.target.checked,
                      }))
                    }
                    className="eventspage-create-modal__checkbox"
                  />
                  <div className="eventspage-create-modal__checkbox-content">
                    {eventForm.isPublic ? (
                      <Eye size={18} />
                    ) : (
                      <EyeOff size={18} />
                    )}
                    <span>
                      {eventForm.isPublic ? "Public Event" : "Private Event"}
                    </span>
                  </div>
                </label>
              </div>

              {/* Form Actions */}
              <div className="eventspage-create-modal__actions">
                <button
                  type="button"
                  className="eventspage-create-modal__cancel"
                  onClick={handleCloseCreateEventModal}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="eventspage-create-modal__submit"
                >
                  {editingEventId ? (
                    <>
                      <Edit size={18} />
                      Update Event
                    </>
                  ) : (
                    <>
                      <Plus size={18} />
                      Create Event
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </>
      )}
      </div>

      {panels}
    </div>
  );
};

export default EventsPage;
