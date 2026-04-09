import { apiUrl } from "../api/config";

export interface FriendRequest {
  request_id: number;
  sender_id: number;
  receiver_id: number;
  status: "pending" | "accepted" | "rejected";
  created_at: string;
  sender?: {
    user_id: number;
    user_firstname: string;
    user_lastname: string;
    user_picture?: string;
  };
  receiver?: {
    user_id: number;
    user_firstname: string;
    user_lastname: string;
    user_picture?: string;
  };
}

export interface Friend {
  user_id: number;
  user_firstname: string;
  user_lastname: string;
  user_picture?: string;
  friendship_id: number;
  created_at: string;
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

  const response = await fetch(apiUrl(endpoint), {
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

export const friendApi = {
  // Send a friend request
  sendFriendRequest: async (userId: number): Promise<{
    success: boolean;
    data: FriendRequest;
    message: string;
  }> => {
    return apiRequest(`/friends/request`, {
      method: "POST",
      body: JSON.stringify({ user_id: userId }),
    });
  },

  // Accept a friend request
  acceptFriendRequest: async (requestId: number): Promise<{
    success: boolean;
    data: Friend;
    message: string;
  }> => {
    return apiRequest(`/friends/request/${requestId}/accept`, {
      method: "POST",
    });
  },

  // Reject a friend request
  rejectFriendRequest: async (requestId: number): Promise<{
    success: boolean;
    message: string;
  }> => {
    return apiRequest(`/friends/request/${requestId}/reject`, {
      method: "POST",
    });
  },

  cancelFriendRequest: async (requestId: number): Promise<{
    success: boolean;
    message: string;
  }> => {
    return apiRequest(`/friends/request/${requestId}`, {
      method: "DELETE",
    });
  },

  // Get user's friends list
  getFriends: async (userId?: number): Promise<{
    success: boolean;
    data: Friend[];
  }> => {
    const endpoint = userId
      ? `/friends/user/${userId}`
      : "/friends/my";
    return apiRequest(endpoint);
  },

  // Get pending friend requests (sent and received)
  getPendingRequests: async (): Promise<{
    success: boolean;
    data: {
      sent: FriendRequest[];
      received: FriendRequest[];
    };
  }> => {
    return apiRequest("/friends/requests");
  },

  // Remove a friend
  removeFriend: async (userId: number): Promise<{
    success: boolean;
    message: string;
  }> => {
    return apiRequest(`/friends/${userId}`, {
      method: "DELETE",
    });
  },

  // Check if two users are friends
  checkFriendship: async (userId: number): Promise<{
    success: boolean;
    data: {
      are_friends: boolean;
      friendship_id?: number;
      request_status?: "pending" | "accepted" | "rejected";
    };
  }> => {
    return apiRequest(`/friends/check/${userId}`);
  },
};

