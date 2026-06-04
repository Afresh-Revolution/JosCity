import API_BASE_URL from "../api/config";

export interface User {
  user_id: number;
  user_firstname: string;
  user_lastname: string;
  user_email?: string;
  user_picture?: string;
  user_cover?: string;
  account_type?: string;
  user_name?: string | null;
  display_name?: string | null;
  full_name?: string | null;
  address?: string | null;
  business_name?: string | null;
  business_type?: string | null;
  user_location?: {
    latitude: number;
    longitude: number;
  };
  distance?: number; // Distance in km from current user
}

export interface ApprovedDirectoryUser {
  user_id: number;
  user_firstname: string;
  user_lastname: string;
  user_email?: string;
  user_picture?: string | null;
  account_type?: string;
  user_name?: string | null;
  display_name?: string | null;
  full_name?: string | null;
  address?: string | null;
  business_name?: string | null;
  business_type?: string | null;
}

export interface UserProfile {
  user_id: number;
  user_firstname: string;
  user_lastname: string;
  user_gender: string;
  user_phone: string;
  user_email: string;
  nin_number: string;
  address: string;
  user_picture?: string | null;
  user_cover?: string | null;
  user_verified: boolean;
  is_verified: boolean;
  account_type: string;
  account_status: string;
  user_registered?: string | null;
  created_at?: string | null;
  display_name: string;
  full_name: string;
  // Business fields
  business_name?: string;
  business_type?: string;
  business_email?: string;
  business_phone?: string;
  business_location?: string;
  CAC_number?: string;
}

// Generic API request helper
const apiRequest = async (endpoint: string, options: RequestInit = {}) => {
  const token =
    localStorage.getItem("token") || localStorage.getItem("authToken");

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...((options.headers as Record<string, string>) || {}),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
    signal: AbortSignal.timeout(30000),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({
      error: response.statusText,
    }));
    throw new Error(error.error || error.message || "Request failed");
  }

  return response.json();
};

export const userApi = {
  /** Nearby users; optional lat/lng use browser geolocation as origin (see API). */
  getNearbyUsers: async (params?: {
    rangeKm?: number;
    latitude?: number;
    longitude?: number;
  }): Promise<{
    success: boolean;
    data: User[];
  }> => {
    const range = params?.rangeKm ?? 500;
    const q = new URLSearchParams({ range: String(range) });
    if (
      params?.latitude != null &&
      params?.longitude != null &&
      Number.isFinite(params.latitude) &&
      Number.isFinite(params.longitude)
    ) {
      q.set("lat", String(params.latitude));
      q.set("lng", String(params.longitude));
    }
    return apiRequest(`/users/nearby?${q.toString()}`);
  },

  /** Approved directory (personal + business), excludes current user. */
  getApprovedUsers: async (params?: {
    page?: number;
    limit?: number;
    q?: string;
  }): Promise<{
    success: boolean;
    data: ApprovedDirectoryUser[];
    pagination?: { page: number; limit: number; hasMore: boolean };
  }> => {
    const page = params?.page ?? 1;
    const limit = params?.limit ?? 100;
    const q = new URLSearchParams({
      page: String(page),
      limit: String(limit),
    });
    if (params?.q?.trim()) q.set("q", params.q.trim());
    return apiRequest(`/users/approved?${q.toString()}`);
  },

  // Search users by name
  searchUsers: async (
    query: string
  ): Promise<{
    success: boolean;
    data: User[];
  }> => {
    return apiRequest(`/users/search?q=${encodeURIComponent(query)}`);
  },

  // Get current user's complete profile
  getUserProfile: async (): Promise<{
    success: boolean;
    data: UserProfile;
  }> => {
    return apiRequest(`/users/profile`);
  },

  // Update user profile (handles both personal and business accounts)
  updateUserProfile: async (
    data: Partial<UserProfile>
  ): Promise<{
    success: boolean;
    message: string;
    data: Partial<UserProfile>;
  }> => {
    return apiRequest(`/users/profile`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },
};
