import API_BASE_URL from "./config";

export interface Event {
  id: number;
  event_id?: number;
  title: string;
  event_title?: string;
  description?: string;
  event_description?: string;
  category?: string;
  event_category?: string;
  date: string;
  event_date?: string;
  location?: string;
  event_location?: string;
  image?: string;
  event_cover?: string;
  capacity?: number;
  event_capacity?: number;
  /** For ticketing (gatewav) events: number of tickets sold from Ticketing API */
  tickets_sold?: number;
  user_picture?: string;
  /** External source e.g. "gatewav" for Ticketing platform */
  source?: string;
  /** URL to buy tickets on external site (e.g. gatewav) */
  ticket_url?: string | null;
}

export interface EventsResponse {
  success: boolean;
  data: Event[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface EventResponse {
  success: boolean;
  data: Event;
  message?: string;
}

// Helper function to get auth token
const getAuthToken = (): string | null => {
  return localStorage.getItem("token");
};

/**
 * Create a new event
 */
export const createEvent = async (eventData: {
  title: string;
  description?: string;
  category?: string;
  date: string;
  location?: string;
  image?: string;
  capacity?: number;
}): Promise<EventResponse> => {
  const token = getAuthToken();
  
  if (!token) {
    throw new Error("Authentication required");
  }

  const response = await fetch(`${API_BASE_URL}/events`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(eventData),
    signal: AbortSignal.timeout(30000), // 30 second timeout
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || errorData.message || `HTTP ${response.status}: ${response.statusText}`);
  }

  return response.json();
};

/**
 * Update an event
 */
export const updateEvent = async (
  eventId: number,
  eventData: {
    title?: string;
    description?: string;
    category?: string;
    date?: string;
    location?: string;
    image?: string;
    capacity?: number;
  }
): Promise<EventResponse> => {
  const token = getAuthToken();
  
  if (!token) {
    throw new Error("Authentication required");
  }

  const response = await fetch(`${API_BASE_URL}/events/${eventId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(eventData),
    signal: AbortSignal.timeout(30000),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || errorData.message || `HTTP ${response.status}: ${response.statusText}`);
  }

  return response.json();
};

/**
 * Get all events
 */
export const getEvents = async (params?: {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
}): Promise<EventsResponse> => {
  const queryParams = new URLSearchParams();
  if (params?.page) queryParams.append("page", params.page.toString());
  if (params?.limit) queryParams.append("limit", params.limit.toString());
  if (params?.search) queryParams.append("search", params.search);
  if (params?.category) queryParams.append("category", params.category);

  const queryString = queryParams.toString();
  const endpoint = `/events${queryString ? `?${queryString}` : ""}`;

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
    signal: AbortSignal.timeout(30000),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || errorData.message || `HTTP ${response.status}: ${response.statusText}`);
  }

  return response.json();
};

/**
 * Get a single event by ID
 */
export const getEvent = async (eventId: number): Promise<EventResponse> => {
  const response = await fetch(`${API_BASE_URL}/events/${eventId}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
    signal: AbortSignal.timeout(30000),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || errorData.message || `HTTP ${response.status}: ${response.statusText}`);
  }

  return response.json();
};

/**
 * Delete an event
 */
export const deleteEvent = async (eventId: number): Promise<{ success: boolean; message: string }> => {
  const token = getAuthToken();
  
  if (!token) {
    throw new Error("Authentication required");
  }

  const response = await fetch(`${API_BASE_URL}/events/${eventId}`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    signal: AbortSignal.timeout(30000),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || errorData.message || `HTTP ${response.status}: ${response.statusText}`);
  }

  return response.json();
};

