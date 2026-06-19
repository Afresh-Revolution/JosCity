import React, { useState, useRef, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
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
  Copy,
  CheckCircle,
  AlertCircle,
  Loader2,
} from "lucide-react";
import SearchBar from "../../components/SearchBar";
import {
  getProfileUsername,
  getUserId,
  isAuthenticated,
  isBusinessUser,
} from "../../utils/userUtils";
import { pickEventCreatorUserId } from "../../utils/eventOwnership";
import {
  buildEventDateTimeIsoFromForm,
  formatEventDateOnly,
  formatEventTimeOnly,
  getLagosFormPartsFromIso,
} from "../../utils/eventDateDisplay";
import {
  createEvent,
  updateEvent,
  deleteEvent,
  getEvents,
  getMyPaymentRequest,
  submitEventPaymentRequest,
  getCustomerPaymentRequests,
  acceptEventPaymentRequest,
  rejectEventPaymentRequest,
  type Event,
  type MyPaymentRequest,
  type CustomerPaymentRequestRow,
} from "../../api/events";
import EventShareButton from "../../components/EventShareButton";
import NewsFeedHeader from "../NewsFeed/NewsFeedHeader";
import NewsFeedSidebar from "../NewsFeed/NewsFeedSidebar";
import { useNewsFeedNavPanels } from "../../hooks/useNewsFeedNavPanels";
import { compressImage } from "../../utils/imageCompression";
import { fileToDataUrl, isBlobUrl } from "../../utils/mediaUrl";
import eventPlaceholder from "../../image/discover.jpg";
import "../../main.css";
import "../../scss/_eventspage.scss";
import "../../scss/_searchbar.scss";
import "../../scss/_newsfeed.scss";
import "../../scss/_emojipicker.scss";
import "../../scss/_profilemodal.scss";
import "../../scss/_messagepopup.scss";

// Helper function to normalize event data from API to component format
const normalizeEvent = (event: Event): Event => {
  const rawCover = event.event_cover || event.image;
  const cover =
    typeof rawCover === "string" && rawCover.trim() && !isBlobUrl(rawCover)
      ? rawCover.trim()
      : eventPlaceholder;

  const creatorId = pickEventCreatorUserId(event);

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
    image: cover,
    event_cover: cover,
    capacity: event.event_capacity ?? event.capacity,
    event_capacity: event.event_capacity ?? event.capacity,
    tickets_sold:
      event.tickets_sold ??
      (event as Event).event_tickets_sold ??
      0,
    user_picture: event.user_picture,
    source: event.source,
    ticket_url: event.ticket_url ?? null,
    event_admin: event.event_admin ?? creatorId ?? null,
    user_id: creatorId ?? event.user_id ?? undefined,
    event_price_naira: event.event_price_naira ?? 0,
    payment_contact_email: event.payment_contact_email ?? null,
    payment_bank_name: event.payment_bank_name ?? null,
    payment_account_name: event.payment_account_name ?? null,
    payment_account_number: event.payment_account_number ?? null,
  };
};

const EventsPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const eventParam = searchParams.get("event");
  const [isLeftSidebarOpen, setIsLeftSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("Discover");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [events, setEvents] = useState<Event[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<Event[]>([]);
  const [isCategoryMenuOpen, setIsCategoryMenuOpen] = useState(false);
  const [isCreateEventModalOpen, setIsCreateEventModalOpen] = useState(false);
  const [isEditEventModalOpen, setIsEditEventModalOpen] = useState(false);
  const [editingEventId, setEditingEventId] = useState<number | null>(null);
  const [isSubmittingEvent, setIsSubmittingEvent] = useState(false);
  const [eventsLoading, setEventsLoading] = useState(false);
  const [eventsError, setEventsError] = useState<string | null>(null);
  const [myPaymentByEventId, setMyPaymentByEventId] = useState<
    Record<number, MyPaymentRequest | null>
  >({});
  const [payConfirmName, setPayConfirmName] = useState<Record<number, string>>(
    {},
  );
  const [customerRows, setCustomerRows] = useState<
    CustomerPaymentRequestRow[]
  >([]);
  const [customerLoading, setCustomerLoading] = useState(false);
  const [customerError, setCustomerError] = useState<string | null>(null);
  /** In-app toast for payment / Customers actions (replaces browser alert). */
  const [eventsActionNotice, setEventsActionNotice] = useState<{
    variant: "success" | "error";
    message: string;
  } | null>(null);
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
    payment_contact_email: "",
    payment_bank_name: "",
    payment_account_name: "",
    payment_account_number: "",
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
        const response = await getEvents({ limit: 40, page: 1 });
        if (response.success && response.data) {
          const normalizedEvents = response.data.map(normalizeEvent);
          setEvents(normalizedEvents);
        } else {
          setEvents([]);
        }
      } catch (error) {
        console.error("Error loading events:", error);
        setEventsError(
          error instanceof Error ? error.message : "Failed to load events",
        );
        setEvents([]);
      } finally {
        setEventsLoading(false);
      }
    };

    loadEvents();
  }, []);

  useEffect(() => {
    if (eventsLoading || events.length === 0 || !eventParam) return;
    const id = Number(eventParam);
    if (!Number.isFinite(id)) return;
    const t = window.setTimeout(() => {
      const el = document.getElementById(`events-event-${id}`);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }, 120);
    return () => window.clearTimeout(t);
  }, [eventsLoading, events, eventParam]);

  // Filter events based on selected category and active tab
  useEffect(() => {
    if (activeTab === "Customers") {
      setFilteredEvents([]);
      return;
    }

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
        userEventLists.going.includes(event.id),
      );
    } else if (activeTab === "Interested") {
      filtered = filtered.filter((event) =>
        userEventLists.interested.includes(event.id),
      );
    } else if (activeTab === "Invited") {
      filtered = filtered.filter((event) =>
        userEventLists.invited.includes(event.id),
      );
    } else if (activeTab === "My Events") {
      const uid = getUserId();
      filtered = filtered.filter((event) => {
        const ownerId = pickEventCreatorUserId(event);
        if (uid && ownerId === uid) return true;
        return userEventLists.myEvents.includes(event.id);
      });
    }
    // "Discover" tab shows all events

    // Then filter by selected category
    if (selectedCategory !== "All") {
      filtered = filtered.filter(
        (event) =>
          event.category?.toLowerCase() === selectedCategory.toLowerCase(),
      );
    }

    setFilteredEvents(filtered);
  }, [selectedCategory, events, activeTab, userEventLists]);

  // When API returns event_admin, merge owned event ids into myEvents (works across devices / cleared storage).
  useEffect(() => {
    const uid = getUserId();
    if (!uid || events.length === 0) return;

    const ownedIds = events
      .filter((e) => pickEventCreatorUserId(e) === uid)
      .map((e) => e.id);
    if (ownedIds.length === 0) return;

    setUserEventLists((prev) => {
      const nextSet = new Set(prev.myEvents);
      let changed = false;
      for (const id of ownedIds) {
        if (!nextSet.has(id)) {
          nextSet.add(id);
          changed = true;
        }
      }
      if (!changed) return prev;
      const next = { ...prev, myEvents: [...nextSet] };
      try {
        localStorage.setItem("userEventLists", JSON.stringify(next));
      } catch {
        /* ignore */
      }
      return next;
    });
  }, [events]);

  // Navigation tabs (Customers = paid-event requests for business accounts)
  const tabs = [
    "Discover",
    "Going",
    "Interested",
    "Invited",
    "My Events",
    ...(isBusinessUser() ? (["Customers"] as const) : []),
  ];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        categoryMenuRef.current &&
        !categoryMenuRef.current.contains(event.target as Node)
      ) {
        setIsCategoryMenuOpen(false);
      }
    };

    if (isCategoryMenuOpen || isCreateEventModalOpen || isEditEventModalOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isCategoryMenuOpen, isCreateEventModalOpen, isEditEventModalOpen]);

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

  const handleCloseCreateEventModal = (force = false) => {
    if (isSubmittingEvent && !force) return;
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
      payment_contact_email: "",
      payment_bank_name: "",
      payment_account_name: "",
      payment_account_number: "",
      isPublic: true,
    });
    setImageError("");
  };

  const handleEditEvent = (eventId: number) => {
    const eventToEdit = events.find((e) => e.id === eventId);
    if (!eventToEdit) return;

    setEditingEventId(eventId);

    const lagosParts = getLagosFormPartsFromIso(eventToEdit.date);
    const dateStr = lagosParts?.dateStr ?? "";
    const minuteStr =
      lagosParts?.timeMinute ?? "00";
    const timeDisplay = lagosParts
      ? `${lagosParts.timeHour}:${minuteStr} ${lagosParts.timePeriod}`
      : "12:00 PM";

    const existingCover = eventToEdit.event_cover || eventToEdit.image || "";
    const safePreview =
      typeof existingCover === "string" && !isBlobUrl(existingCover)
        ? existingCover
        : "";

    setEventForm({
      title: eventToEdit.title,
      description: eventToEdit.description || "",
      category: eventToEdit.category || "All",
      date: dateStr,
      time: timeDisplay,
      timeHour: lagosParts?.timeHour ?? "12",
      timeMinute: minuteStr,
      timePeriod: lagosParts?.timePeriod ?? "PM",
      location: eventToEdit.location || "",
      image: null,
      imagePreview: safePreview,
      capacity: eventToEdit.capacity?.toString() || "",
      price:
        eventToEdit.event_price_naira != null &&
        Number(eventToEdit.event_price_naira) > 0
          ? String(eventToEdit.event_price_naira)
          : "",
      payment_contact_email: eventToEdit.payment_contact_email || "",
      payment_bank_name: eventToEdit.payment_bank_name || "",
      payment_account_name: eventToEdit.payment_account_name || "",
      payment_account_number: eventToEdit.payment_account_number || "",
      isPublic: true,
    });
    setImageError("");
    setIsCreateEventModalOpen(true);
    setIsEditEventModalOpen(true);
  };

  // Get number of people going to an event
  const getGoingCount = (eventId: number): number => {
    return userEventLists.going.filter((id) => id === eventId).length;
  };

  const handleEventFormChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
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
        "Invalid file type. Please upload a JPEG, PNG, GIF, or WebP image.",
      );
      e.target.value = ""; // Clear the input
      return;
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB in bytes
    if (file.size > maxSize) {
      setImageError(
        "File size too large. Please upload an image smaller than 10MB.",
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
    if (isSubmittingEvent) return;
    setEventsError(null);

    try {
      setIsSubmittingEvent(true);
      // Create new event object
      const time24 = convertTo24Hour(
        eventForm.timeHour,
        eventForm.timeMinute,
        eventForm.timePeriod,
      );
      const eventDate = buildEventDateTimeIsoFromForm(
        eventForm.date,
        time24,
      );

      let imageForApi: string | undefined;
      if (eventForm.image instanceof File) {
        const compressed = await compressImage(eventForm.image, {
          maxWidth: 1200,
          maxHeight: 1200,
          maxSizeMB: 1,
        });
        imageForApi = await fileToDataUrl(compressed);
      } else if (eventForm.imagePreview?.trim()) {
        const p = eventForm.imagePreview.trim();
        if (!isBlobUrl(p)) {
          imageForApi = p;
        }
      }

      const priceNum = parseFloat(eventForm.price);
      const hasPrice = Number.isFinite(priceNum) && priceNum > 0;

      const eventData = {
        title: eventForm.title,
        description: eventForm.description || undefined,
        category: eventForm.category !== "All" ? eventForm.category : undefined,
        date: eventDate,
        location: eventForm.location || undefined,
        ...(imageForApi !== undefined ? { image: imageForApi } : {}),
        capacity: eventForm.capacity ? parseInt(eventForm.capacity, 10) : undefined,
        ...(hasPrice
          ? {
              price_naira: priceNum,
              payment_contact_email: eventForm.payment_contact_email.trim(),
              payment_bank_name: eventForm.payment_bank_name.trim(),
              payment_account_name: eventForm.payment_account_name.trim(),
              payment_account_number: eventForm.payment_account_number.trim(),
            }
          : { price_naira: 0 }),
      };

      let savedEvent: Event;

      if (editingEventId) {
        // Update existing event
        const response = await updateEvent(editingEventId, eventData);
        if (response.success && response.data) {
          savedEvent = normalizeEvent(response.data);
          // Update events list
          const updatedEvents = events.map((event) =>
            event.id === editingEventId ? savedEvent : event,
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
            localStorage.setItem(
              "userEventLists",
              JSON.stringify(updatedLists),
            );
          } catch (error) {
            console.error("Error saving user event lists:", error);
          }

          alert("Event created successfully!");
        } else {
          throw new Error("Failed to create event");
        }
      }

      // Close modal and reset form
      handleCloseCreateEventModal(true);
    } catch (error) {
      console.error("Error saving event:", error);
      setEventsError(
        error instanceof Error ? error.message : "Failed to save event",
      );
      alert(
        error instanceof Error
          ? `Error: ${error.message}`
          : "Failed to save event. Please try again.",
      );
    } finally {
      setIsSubmittingEvent(false);
    }
  };

  // Convert 12-hour time to 24-hour format
  const convertTo24Hour = (
    hour: string,
    minute: string,
    period: string,
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
    action: "going" | "interested" | "invited",
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
    list: "going" | "interested" | "invited" | "myEvents",
  ): boolean => {
    return userEventLists[list].includes(eventId);
  };

  /** Owner = API event_admin / creator id matches current user, or legacy localStorage myEvents. */
  const isCurrentUserEventOwner = (event: Event): boolean => {
    const uid = getUserId();
    const ownerId = pickEventCreatorUserId(event);
    if (uid && ownerId != null && ownerId === uid) return true;
    return userEventLists.myEvents.includes(event.id);
  };

  // External event (e.g. gatewav): show "Buy tickets" link, hide Going/Interested/Edit/Delete
  const isExternalEvent = (event: Event): boolean => {
    return !!(event.source === "gatewav" || event.ticket_url);
  };

  const isPaidJosCityEvent = (event: Event): boolean => {
    return (
      !isExternalEvent(event) && (Number(event.event_price_naira) || 0) > 0
    );
  };

  useEffect(() => {
    if (!isAuthenticated() || events.length === 0) return;
    let cancelled = false;
    const paid = events.filter(
      (e) => !isExternalEvent(e) && (Number(e.event_price_naira) || 0) > 0,
    );
    if (paid.length === 0) return;
    (async () => {
      const entries = await Promise.all(
        paid.map(async (e) => {
          try {
            const r = await getMyPaymentRequest(e.id);
            return [e.id, r.data ?? null] as const;
          } catch {
            return [e.id, null] as const;
          }
        }),
      );
      if (cancelled) return;
      setMyPaymentByEventId((prev) => {
        const next = { ...prev };
        for (const [id, data] of entries) {
          next[id] = data;
        }
        return next;
      });
    })();
    return () => {
      cancelled = true;
    };
  }, [events]);

  useEffect(() => {
    if (!eventsActionNotice) return;
    const t = window.setTimeout(() => setEventsActionNotice(null), 5200);
    return () => window.clearTimeout(t);
  }, [eventsActionNotice]);

  useEffect(() => {
    if (activeTab !== "Customers" || !isBusinessUser()) return;
    let cancelled = false;
    setCustomerLoading(true);
    setCustomerError(null);
    getCustomerPaymentRequests()
      .then((r) => {
        if (!cancelled && r.success && r.data) setCustomerRows(r.data);
      })
      .catch((e) => {
        if (!cancelled)
          setCustomerError(
            e instanceof Error ? e.message : "Failed to load customers",
          );
      })
      .finally(() => {
        if (!cancelled) setCustomerLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [activeTab]);

  const copyPaymentField = async (text: string) => {
    const t = String(text || "").trim();
    if (!t) return;
    try {
      await navigator.clipboard.writeText(t);
    } catch {
      window.prompt("Copy:", t);
    }
  };

  const refreshEventsFromApi = async () => {
    try {
      const response = await getEvents({ limit: 40, page: 1 });
      if (response.success && response.data) {
        setEvents(response.data.map(normalizeEvent));
      }
    } catch {
      /* ignore */
    }
  };

  const handleFeePaid = async (event: Event) => {
    const name = (payConfirmName[event.id] ?? "").trim();
    if (!name) {
      setEventsActionNotice({
        variant: "error",
        message:
          "Enter your bank account name — the name on your account as it will appear on the transfer.",
      });
      return;
    }
    try {
      await submitEventPaymentRequest(event.id, name);
      const r = await getMyPaymentRequest(event.id);
      setMyPaymentByEventId((prev) => ({
        ...prev,
        [event.id]: r.data ?? null,
      }));
      setEventsActionNotice({
        variant: "success",
        message: "Request sent. The organizer has been notified.",
      });
    } catch (e) {
      setEventsActionNotice({
        variant: "error",
        message:
          e instanceof Error
            ? e.message
            : "Could not submit payment request",
      });
    }
  };

  const handleAcceptCustomer = async (requestId: number) => {
    try {
      await acceptEventPaymentRequest(requestId);
      const r = await getCustomerPaymentRequests();
      if (r.success && r.data) setCustomerRows(r.data);
      await refreshEventsFromApi();
      setEventsActionNotice({
        variant: "success",
        message: "Accepted. Ticket email sent to the buyer.",
      });
    } catch (e) {
      setEventsActionNotice({
        variant: "error",
        message: e instanceof Error ? e.message : "Failed to accept",
      });
    }
  };

  const handleRejectCustomer = async (requestId: number) => {
    try {
      await rejectEventPaymentRequest(requestId);
      const r = await getCustomerPaymentRequests();
      if (r.success && r.data) setCustomerRows(r.data);
      setEventsActionNotice({
        variant: "success",
        message: "Rejected. The buyer has been notified.",
      });
    } catch (e) {
      setEventsActionNotice({
        variant: "error",
        message: e instanceof Error ? e.message : "Failed to reject",
      });
    }
  };

  // Handle event deletion
  const handleDeleteEvent = async (eventId: number) => {
    if (
      window.confirm(
        "Are you sure you want to delete this event? This action cannot be undone.",
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
            interested: userEventLists.interested.filter(
              (id) => id !== eventId,
            ),
            invited: userEventLists.invited.filter((id) => id !== eventId),
            myEvents: userEventLists.myEvents.filter((id) => id !== eventId),
          };
          setUserEventLists(updatedLists);

          // Save updated lists
          try {
            localStorage.setItem(
              "userEventLists",
              JSON.stringify(updatedLists),
            );
          } catch (error) {
            console.error("Error saving user event lists:", error);
          }

          alert("Event deleted successfully!");
        } else {
          throw new Error("Failed to delete event");
        }
      } catch (error) {
        console.error("Error deleting event:", error);
        setEventsError(
          error instanceof Error ? error.message : "Failed to delete event",
        );
        alert(
          error instanceof Error
            ? `Error: ${error.message}`
            : "Error deleting event. Please try again.",
        );
      }
    }
  };

  return (
    <div className="newsfeed-page events-page-wrapper events-page">
      <div className="eventspage">
        <NewsFeedHeader
          isLeftSidebarOpen={isLeftSidebarOpen}
          onToggleLeftSidebar={() => setIsLeftSidebarOpen(!isLeftSidebarOpen)}
          onProfileClick={handleProfileClick}
          showRightSidebarToggle={false}
          {...headerNavProps}
        />

        <div className="newsfeed-container newsfeed-container--no-aside">
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

          <main className="newsfeed-main" ref={mainContentRef}>
            {eventsActionNotice && (
              <div
                className={`eventspage-action-badge eventspage-action-badge--${eventsActionNotice.variant}`}
                role="status"
              >
                {eventsActionNotice.variant === "success" ? (
                  <CheckCircle
                    size={20}
                    className="eventspage-action-badge__icon"
                    aria-hidden
                  />
                ) : (
                  <AlertCircle
                    size={20}
                    className="eventspage-action-badge__icon"
                    aria-hidden
                  />
                )}
                <span className="eventspage-action-badge__text">
                  {eventsActionNotice.message}
                </span>
                <button
                  type="button"
                  className="eventspage-action-badge__dismiss"
                  onClick={() => setEventsActionNotice(null)}
                  aria-label="Dismiss notification"
                >
                  <X size={16} />
                </button>
              </div>
            )}
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
                <div className="eventspage-main">
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
                                  : activeTab === "Customers"
                                    ? "Customers"
                                    : "Events"}
                      </h2>
                      {/* Mobile Category Filter Button */}
                      <button
                        className="eventspage-main__category-toggle"
                        onClick={() =>
                          setIsCategoryMenuOpen(!isCategoryMenuOpen)
                        }
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
                    {activeTab === "Customers" ? (
                      customerLoading ? (
                        <div className="eventspage-main__empty">
                          <Clock size={48} />
                          <p className="eventspage-main__empty-text">
                            Loading customers...
                          </p>
                        </div>
                      ) : customerError ? (
                        <div className="eventspage-main__empty">
                          <p className="eventspage-main__empty-text">
                            {customerError}
                          </p>
                        </div>
                      ) : customerRows.length === 0 ? (
                        <div className="eventspage-main__empty">
                          <p className="eventspage-main__empty-text">
                            No pending “I have paid” requests
                          </p>
                          <p className="eventspage-main__empty-subtext">
                            When ticket buyers submit a payment, they will appear
                            here for you to accept or reject.
                          </p>
                        </div>
                      ) : (
                        <div className="eventspage-customers-list">
                          {customerRows.map((row) => (
                            <div
                              key={row.request_id}
                              className="eventspage-customers-card"
                            >
                              <div className="eventspage-customers-card__head">
                                <h3 className="eventspage-customers-card__title">
                                  {row.event_title}
                                </h3>
                                <span className="eventspage-customers-card__fee">
                                  ₦{Number(row.event_price_naira).toLocaleString()}
                                </span>
                              </div>
                              <p className="eventspage-customers-card__buyer">
                                {row.buyer_name} · {row.buyer_email}
                              </p>
                                <p className="eventspage-customers-card__meta">
                                Attendee account (on transfer):{" "}
                                <strong>
                                  {row.buyer_confirmed_account_name}
                                </strong>
                              </p>
                              <div className="eventspage-customers-card__actions">
                                <button
                                  type="button"
                                  className="eventspage-event-card__action-btn eventspage-event-card__action-btn--primary"
                                  onClick={() =>
                                    handleAcceptCustomer(row.request_id)
                                  }
                                >
                                  Accept
                                </button>
                                <button
                                  type="button"
                                  className="eventspage-event-card__remove-btn"
                                  onClick={() =>
                                    handleRejectCustomer(row.request_id)
                                  }
                                >
                                  Reject
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )
                    ) : eventsLoading ? (
                      <div className="eventspage-main__empty">
                        <div className="eventspage-main__empty-illustration">
                          <div className="eventspage-main__empty-icon">
                            <Clock size={48} />
                          </div>
                        </div>
                        <p className="eventspage-main__empty-text">
                          Loading events...
                        </p>
                      </div>
                    ) : eventsError ? (
                      <div className="eventspage-main__empty">
                        <div className="eventspage-main__empty-illustration">
                          <div className="eventspage-main__empty-icon">
                            <X size={48} />
                          </div>
                        </div>
                        <p className="eventspage-main__empty-text">
                          Error loading events
                        </p>
                        <p className="eventspage-main__empty-subtext">
                          {eventsError}
                        </p>
                      </div>
                    ) : filteredEvents.length === 0 ? (
                      <div className="eventspage-main__empty">
                        <div className="eventspage-main__empty-illustration">
                          <div className="eventspage-main__empty-icon">
                            <Search size={48} />
                          </div>
                        </div>
                        <p className="eventspage-main__empty-text">
                          No Data Found
                        </p>
                        <p className="eventspage-main__empty-subtext">
                          {selectedCategory === "All"
                            ? "There is no data to show you right now"
                            : `No ${selectedCategory} events found`}
                        </p>
                      </div>
                    ) : (
                      <div className="eventspage-main__events-list">
                        {filteredEvents.map((event) => (
                          <div
                            key={event.id}
                            id={`events-event-${event.id}`}
                            className="eventspage-event-card"
                          >
                            {event.image && (
                              <div className="eventspage-event-card__image">
                                <img src={event.image} alt={event.title} />
                              </div>
                            )}
                            <div className="eventspage-event-card__content">
                              <div className="eventspage-event-card__title-row">
                                <h3 className="eventspage-event-card__title">
                                  {event.title}
                                </h3>
                                <EventShareButton
                                  eventId={event.id}
                                  title={event.title}
                                  className="eventspage-event-card__share"
                                  iconSize={17}
                                />
                              </div>
                              {event.description && (
                                <p className="eventspage-event-card__description">
                                  {event.description}
                                </p>
                              )}
                              <div className="eventspage-event-card__meta">
                                {event.date && (
                                  <span className="eventspage-event-card__date">
                                    <Calendar size={16} />
                                    {formatEventDateOnly(event.date)}
                                    <span className="eventspage-event-card__time">
                                      {" "}
                                      {formatEventTimeOnly(event.date)}
                                    </span>
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
                                    {isExternalEvent(event) ||
                                    isPaidJosCityEvent(event)
                                      ? `${event.tickets_sold ?? 0} / ${event.capacity} tickets`
                                      : `${getGoingCount(event.id)} / ${event.capacity} going`}
                                  </span>
                                  {(isExternalEvent(event) ||
                                  isPaidJosCityEvent(event)
                                    ? (event.tickets_sold ?? 0) >=
                                      event.capacity
                                    : getGoingCount(event.id) >=
                                      event.capacity) && (
                                    <span className="eventspage-event-card__capacity-full">
                                      Full
                                    </span>
                                  )}
                                </div>
                              )}
                              {isPaidJosCityEvent(event) &&
                                !isCurrentUserEventOwner(event) &&
                                event.payment_account_name && (
                                  <div className="eventspage-event-card__payment">
                                    <div className="eventspage-event-card__payment-fee">
                                      <span>Fee</span>
                                      <strong>
                                        ₦
                                        {Number(
                                          event.event_price_naira,
                                        ).toLocaleString()}
                                      </strong>
                                    </div>
                                    <p className="eventspage-event-card__payment-hint">
                                      Pay via bank transfer to the account
                                      below. Then enter{" "}
                                      <strong>your</strong> bank account name
                                      (as on your transfer) and tap Fee Paid.
                                    </p>
                                    {(
                                      [
                                        [
                                          "Email",
                                          event.payment_contact_email,
                                        ],
                                        [
                                          "Bank name",
                                          event.payment_bank_name,
                                        ],
                                        [
                                          "Account name",
                                          event.payment_account_name,
                                        ],
                                        [
                                          "Account number",
                                          event.payment_account_number,
                                        ],
                                      ] as const
                                    ).map(([label, val]) =>
                                      val ? (
                                        <div
                                          key={label}
                                          className="eventspage-event-card__pay-row"
                                        >
                                          <span className="eventspage-event-card__pay-label">
                                            {label}
                                          </span>
                                          <span className="eventspage-event-card__pay-value">
                                            {val}
                                          </span>
                                          <button
                                            type="button"
                                            className="eventspage-event-card__pay-copy"
                                            onClick={() =>
                                              copyPaymentField(String(val))
                                            }
                                            aria-label={`Copy ${label}`}
                                          >
                                            <Copy size={16} />
                                          </button>
                                        </div>
                                      ) : null,
                                    )}
                                    {isAuthenticated() &&
                                      (() => {
                                        const st =
                                          myPaymentByEventId[event.id]?.status;
                                        if (st === "pending") {
                                          return (
                                            <p className="eventspage-event-card__pay-status eventspage-event-card__pay-status--pending">
                                              Payment pending — waiting for the
                                              organizer to accept.
                                            </p>
                                          );
                                        }
                                        if (st === "accepted") {
                                          return (
                                            <p className="eventspage-event-card__pay-status eventspage-event-card__pay-status--ok">
                                              Ticket:{" "}
                                              <strong>
                                                {
                                                  myPaymentByEventId[event.id]
                                                    ?.ticket_number
                                                }
                                              </strong>
                                            </p>
                                          );
                                        }
                                        if (st === "rejected") {
                                          return (
                                            <p className="eventspage-event-card__pay-status eventspage-event-card__pay-status--bad">
                                              Your last request was not
                                              accepted. You can submit again
                                              after paying.
                                            </p>
                                          );
                                        }
                                        return (
                                          <div className="eventspage-event-card__pay-confirm">
                                            <label
                                              className="eventspage-event-card__pay-confirm-label"
                                              htmlFor={`pay-acc-${event.id}`}
                                            >
                                              Your account name (attendee)
                                            </label>
                                            <input
                                              id={`pay-acc-${event.id}`}
                                              className="eventspage-event-card__pay-confirm-input"
                                              value={
                                                payConfirmName[event.id] ?? ""
                                              }
                                              onChange={(e) =>
                                                setPayConfirmName((p) => ({
                                                  ...p,
                                                  [event.id]: e.target.value,
                                                }))
                                              }
                                              placeholder="Name on your bank account (as on the transfer)"
                                              autoComplete="name"
                                            />
                                            <button
                                              type="button"
                                              className="eventspage-event-card__fee-paid-btn"
                                              onClick={() =>
                                                handleFeePaid(event)
                                              }
                                            >
                                              Fee Paid
                                            </button>
                                          </div>
                                        );
                                      })()}
                                    {!isAuthenticated() && (
                                      <p className="eventspage-event-card__pay-signin">
                                        Sign in to confirm your transfer and
                                        notify the organizer.
                                      </p>
                                    )}
                                  </div>
                                )}
                              {/* External event badge */}
                              {isExternalEvent(event) && (
                                <div className="eventspage-event-card__source-badge">
                                  {event.source === "gatewav"
                                    ? "Gatewav"
                                    : event.source}
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
                                {!isExternalEvent(event) &&
                                  isCurrentUserEventOwner(event) && (
                                    <>
                                      <button
                                        className="eventspage-event-card__edit-btn"
                                        onClick={() =>
                                          handleEditEvent(event.id)
                                        }
                                        title="Edit event"
                                      >
                                        <Edit size={16} />
                                        <span>Edit</span>
                                      </button>
                                      <button
                                        className="eventspage-event-card__delete-btn"
                                        onClick={() =>
                                          handleDeleteEvent(event.id)
                                        }
                                        title="Delete event"
                                      >
                                        <X size={16} />
                                        <span>Delete</span>
                                      </button>
                                    </>
                                  )}

                                {/* Going button - show Add if not in list, Remove if in list (only for JOSCITY events) */}
                                {!isExternalEvent(event) &&
                                  (!isPaidJosCityEvent(event) ||
                                    isCurrentUserEventOwner(event)) &&
                                  (isEventInList(event.id, "going") ? (
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
                                {!isExternalEvent(event) &&
                                  (!isPaidJosCityEvent(event) ||
                                    isCurrentUserEventOwner(event)) &&
                                  (isEventInList(event.id, "interested") ? (
                                    <button
                                      className="eventspage-event-card__remove-btn"
                                      onClick={() =>
                                        handleEventAction(
                                          event.id,
                                          "interested",
                                        )
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
                                        handleEventAction(
                                          event.id,
                                          "interested",
                                        )
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
                </div>
              </div>
            </div>
          </main>
        </div>

        {/* Create / Edit Event Modal (both flags open the same dialog) */}
        {(isCreateEventModalOpen || isEditEventModalOpen) && (
          <>
            <div
              className="eventspage-create-modal__backdrop"
              onClick={() => handleCloseCreateEventModal()}
            />
            <div
              className="eventspage-create-modal"
              ref={
                isEditEventModalOpen ? editEventModalRef : createEventModalRef
              }
              onClick={(e) => e.stopPropagation()}
            >
              <div className="eventspage-create-modal__header">
                <h2 className="eventspage-create-modal__title">
                  {editingEventId ? "Edit Event" : "Create New Event"}
                </h2>
                <button
                  className="eventspage-create-modal__close"
                  onClick={() => handleCloseCreateEventModal()}
                  aria-label="Close modal"
                  disabled={isSubmittingEvent}
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
                          disabled={isSubmittingEvent}
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
                          disabled={isSubmittingEvent}
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
                          ),
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
                      Price (₦)
                    </label>
                    <input
                      type="number"
                      id="event-price"
                      name="price"
                      value={eventForm.price}
                      onChange={handleEventFormChange}
                      className="eventspage-create-modal__input"
                      placeholder="0"
                      min="0"
                      step="1"
                    />
                  </div>
                </div>

                {Number(eventForm.price) > 0 && (
                  <>
                    <p className="eventspage-create-modal__paid-hint">
                      Paid event (₦): add where you want payment notices sent and
                      your bank details for transfers.
                    </p>
                    <div className="eventspage-create-modal__field">
                      <label
                        htmlFor="payment_contact_email"
                        className="eventspage-create-modal__label"
                      >
                        Email *
                      </label>
                      <input
                        type="email"
                        id="payment_contact_email"
                        name="payment_contact_email"
                        value={eventForm.payment_contact_email}
                        onChange={handleEventFormChange}
                        className="eventspage-create-modal__input"
                        placeholder="you@example.com"
                        required={Number(eventForm.price) > 0}
                      />
                    </div>
                    <div className="eventspage-create-modal__field">
                      <label
                        htmlFor="payment_bank_name"
                        className="eventspage-create-modal__label"
                      >
                        Bank name *
                      </label>
                      <input
                        type="text"
                        id="payment_bank_name"
                        name="payment_bank_name"
                        value={eventForm.payment_bank_name}
                        onChange={handleEventFormChange}
                        className="eventspage-create-modal__input"
                        required={Number(eventForm.price) > 0}
                      />
                    </div>
                    <div className="eventspage-create-modal__row">
                      <div className="eventspage-create-modal__field">
                        <label
                          htmlFor="payment_account_name"
                          className="eventspage-create-modal__label"
                        >
                          Account name *
                        </label>
                        <input
                          type="text"
                          id="payment_account_name"
                          name="payment_account_name"
                          value={eventForm.payment_account_name}
                          onChange={handleEventFormChange}
                          className="eventspage-create-modal__input"
                          required={Number(eventForm.price) > 0}
                        />
                      </div>
                      <div className="eventspage-create-modal__field">
                        <label
                          htmlFor="payment_account_number"
                          className="eventspage-create-modal__label"
                        >
                          Account number *
                        </label>
                        <input
                          type="text"
                          id="payment_account_number"
                          name="payment_account_number"
                          value={eventForm.payment_account_number}
                          onChange={handleEventFormChange}
                          className="eventspage-create-modal__input"
                          inputMode="numeric"
                          autoComplete="off"
                          required={Number(eventForm.price) > 0}
                        />
                      </div>
                    </div>
                  </>
                )}

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
                    onClick={() => handleCloseCreateEventModal()}
                    disabled={isSubmittingEvent}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="eventspage-create-modal__submit"
                    disabled={isSubmittingEvent}
                  >
                    {isSubmittingEvent ? (
                      <>
                        <Loader2 size={18} className="eventspage-create-modal__spinner" />
                        {editingEventId ? "Updating..." : "Creating..."}
                      </>
                    ) : editingEventId ? (
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
