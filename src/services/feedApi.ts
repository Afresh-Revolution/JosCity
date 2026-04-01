import API_BASE_URL from "../api/config";

// Types for feed operations
export type ReactionType =
  | "like"
  | "love"
  | "haha"
  | "yay"
  | "wow"
  | "sad"
  | "angry";

export interface Story {
  story_id: number;
  user_id: number;
  content?: string;
  image_url?: string;
  video_url?: string;
  created_at: string;
  expires_at: string;
  views_count?: number;
  user?: {
    user_id: number;
    display_name: string;
    profile_image_url?: string;
  };
}

export interface Reaction {
  reaction_id: number;
  post_id: number;
  user_id: number;
  reaction: ReactionType;
  created_at: string;
  user?: {
    user_id: number;
    display_name: string;
    profile_image_url?: string;
  };
}

export interface Comment {
  comment_id: number;
  post_id: number;
  user_id: number;
  parent_comment_id?: number;
  text?: string;
  image?: string;
  created_at: string;
  updated_at?: string;
  user?: {
    user_id: number;
    display_name: string;
    profile_image_url?: string;
  };
  replies?: Comment[];
  time_ago?: string;
}

export interface Share {
  share_id: number;
  post_id: number;
  user_id: number;
  created_at: string;
  user?: {
    user_id: number;
    display_name: string;
    profile_image_url?: string;
  };
}

// Generic API request helper
const apiRequest = async (endpoint: string, options: RequestInit = {}) => {
  // Get authentication token from localStorage
  const token =
    localStorage.getItem("token") || localStorage.getItem("authToken");

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...((options.headers as Record<string, string>) || {}),
  };

  // Add authorization header if token exists
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
      signal: AbortSignal.timeout(30000), // 30 second timeout
    });
  } catch (fetchError: unknown) {
    // Handle network errors
    const error = fetchError as { name?: string; message?: string };
    if (error.name === "AbortError" || error.name === "TimeoutError") {
      throw new Error(
        "Request timed out. Please check your connection and try again."
      );
    }
    if (
      error.message?.includes("Failed to fetch") ||
      error.message?.includes("ECONNREFUSED")
    ) {
      throw new Error(
        "Unable to connect to server. Please ensure the backend is running on port 3000."
      );
    }
    throw new Error(`Network error: ${error.message || "Connection failed"}`);
  }

  // Check if response is ok before trying to parse
  const contentType = response.headers.get("content-type");
  const text = await response.text().catch(() => "");

  interface ApiResponse {
    success?: boolean;
    data?: unknown;
    error?: unknown;
    message?: unknown;
    [key: string]: unknown;
  }

  let data: ApiResponse;

  if (contentType && contentType.includes("application/json") && text.trim()) {
    try {
      data = JSON.parse(text) as ApiResponse;
    } catch (parseError) {
      data = { error: response.statusText || "Invalid response format" };
    }
  } else if (text.trim()) {
    data = { error: text.substring(0, 200) || response.statusText };
  } else {
    data = { error: response.statusText || "Empty response" };
  }

  // Helper to convert error message to string
  const getErrorMessage = (value: unknown): string => {
    if (typeof value === "string") return value;
    if (typeof value === "boolean")
      return value ? "An error occurred" : "Request failed";
    if (value && typeof value === "object") {
      const errorObj = value as { message?: unknown; error?: unknown };
      if (errorObj.message) return String(errorObj.message);
      if (errorObj.error) return String(errorObj.error);
      return JSON.stringify(value);
    }
    return String(value || "Request failed");
  };

  if (!response.ok) {
    // Log detailed error information for debugging
    console.error(`API Error ${response.status} (${response.statusText})`, {
      endpoint: `${API_BASE_URL}${endpoint}`,
      status: response.status,
      statusText: response.statusText,
      responseData: data,
      responseText: text.substring(0, 500), // First 500 chars for debugging
    });

    // Provide user-friendly error messages based on status codes
    let defaultMessage = `API Error: ${response.statusText}`;
    if (response.status === 500) {
      defaultMessage =
        "Server error. Please try again later or contact support if the problem persists.";
    } else if (response.status === 401) {
      defaultMessage = "Authentication required. Please sign in again.";
    } else if (response.status === 403) {
      defaultMessage = "You don't have permission to access this resource.";
    } else if (response.status === 404) {
      defaultMessage = "The requested resource was not found.";
    } else if (response.status >= 500) {
      defaultMessage = "Server error. Please try again later.";
    } else if (response.status >= 400) {
      defaultMessage = "Request failed. Please check your input and try again.";
    }

    const errorMessage =
      getErrorMessage(data.error) ||
      getErrorMessage(data.message) ||
      defaultMessage;
    throw new Error(errorMessage);
  }

  // Check if response has success field and it's false
  if (data.success === false) {
    const errorMessage =
      getErrorMessage(data.error) ||
      getErrorMessage(data.message) ||
      "Request failed";
    throw new Error(errorMessage);
  }

  // Type assertion needed because API response structure varies by endpoint
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return data as any;
};

// Feed API functions
export const feedApi = {
  // ========== Stories ==========
  createStory: async (data: {
    type: "photo" | "video" | "text";
    src: string; // image/video URL or text content
    background_color?: string;
    text_color?: string;
    duration?: number; // hours until expiration (default: 24)
  }): Promise<{ success: boolean; data: Story; message: string }> => {
    console.log("Creating story via POST /api/stories", {
      type: data.type,
      hasSrc: !!data.src,
    });
    return apiRequest("/stories", {
      method: "POST",
      body: JSON.stringify(data),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    }) as any; // Type assertion needed - API response structure varies
  },

  getStories: async (): Promise<{ success: boolean; data: Story[] }> => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return apiRequest("/stories") as any; // Type assertion needed - API response structure varies
  },

  getMyStories: async (): Promise<{ success: boolean; data: Story[] }> => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return apiRequest("/stories/my") as any; // Type assertion needed - API response structure varies
  },

  viewStory: async (
    storyId: number
  ): Promise<{ success: boolean; data: Story }> => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return apiRequest(`/stories/${storyId}/view`) as any; // Type assertion needed - API response structure varies
  },

  getStoryViews: async (
    storyId: number
  ): Promise<{ success: boolean; data: { views_count: number } }> => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return apiRequest(`/stories/${storyId}/views`) as any; // Type assertion needed - API response structure varies
  },

  deleteStory: async (
    storyId: number
  ): Promise<{ success: boolean; message: string }> => {
    return apiRequest(`/stories/${storyId}`, {
      method: "DELETE",
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    }) as any; // Type assertion needed - API response structure varies
  },

  reactToStory: async (
    storyId: number
  ): Promise<{
    success: boolean;
    data: {
      reaction_id: number;
      story_id: number;
      user_id: number;
      created_at: string;
    };
    message: string;
  }> => {
    return apiRequest(`/stories/${storyId}/react`, {
      method: "POST",
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    }) as any; // Type assertion needed - API response structure varies
  },

  removeStoryReaction: async (
    storyId: number
  ): Promise<{ success: boolean; message: string }> => {
    return apiRequest(`/stories/${storyId}/react`, {
      method: "DELETE",
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    }) as any; // Type assertion needed - API response structure varies
  },

  getStoryReactions: async (
    storyId: number
  ): Promise<{
    success: boolean;
    data: Array<{
      reaction_id: number;
      story_id: number;
      user_id: number;
      created_at: string;
      user?: {
        user_id: number;
        display_name: string;
        profile_image_url?: string;
      };
    }>;
  }> => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return apiRequest(`/stories/${storyId}/reactions`) as any; // Type assertion needed - API response structure varies
  },

  getStoryViewers: async (
    storyId: number
  ): Promise<{
    success: boolean;
    data: Array<{
      view_id: number;
      story_id: number;
      user_id: number;
      viewed_at: string;
      user?: {
        user_id: number;
        display_name: string;
        profile_image_url?: string;
      };
    }>;
  }> => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return apiRequest(`/stories/${storyId}/viewers`) as any; // Type assertion needed - API response structure varies
  },

  // ========== Reactions ==========
  reactToPost: async (
    postId: number,
    reaction: ReactionType
  ): Promise<{ success: boolean; data: Reaction; message: string }> => {
    return apiRequest(`/posts/${postId}/react`, {
      method: "POST",
      body: JSON.stringify({ reaction }),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    }) as any; // Type assertion needed - API response structure varies
  },

  removeReaction: async (
    postId: number
  ): Promise<{ success: boolean; message: string }> => {
    return apiRequest(`/posts/${postId}/react`, {
      method: "DELETE",
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    }) as any; // Type assertion needed - API response structure varies
  },

  getPostReactions: async (
    postId: number
  ): Promise<{ success: boolean; data: Reaction[] }> => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return apiRequest(`/posts/${postId}/reactions`) as any; // Type assertion needed - API response structure varies
  },

  // ========== Comments ==========
  commentOnPost: async (
    postId: number,
    data: { text?: string; image?: string }
  ): Promise<{ success: boolean; data: Comment; message: string }> => {
    return apiRequest(`/posts/${postId}/comment`, {
      method: "POST",
      body: JSON.stringify(data),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    }) as any; // Type assertion needed - API response structure varies
  },

  replyToComment: async (
    commentId: number,
    data: { text?: string; image?: string }
  ): Promise<{ success: boolean; data: Comment; message: string }> => {
    return apiRequest(`/comments/${commentId}/reply`, {
      method: "POST",
      body: JSON.stringify(data),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    }) as any; // Type assertion needed - API response structure varies
  },

  getPostComments: async (
    postId: number
  ): Promise<{ success: boolean; data: Comment[] }> => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return apiRequest(`/posts/${postId}/comments`) as any; // Type assertion needed - API response structure varies
  },

  deleteComment: async (
    commentId: number
  ): Promise<{ success: boolean; message: string }> => {
    return apiRequest(`/comments/${commentId}`, {
      method: "DELETE",
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    }) as any; // Type assertion needed - API response structure varies
  },

  // ========== Shares ==========
  sharePost: async (
    postId: number
  ): Promise<{ success: boolean; data: Share; message: string }> => {
    return apiRequest(`/posts/${postId}/share`, {
      method: "POST",
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    }) as any; // Type assertion needed - API response structure varies
  },

  getPostShares: async (
    postId: number
  ): Promise<{ success: boolean; data: Share[] }> => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return apiRequest(`/posts/${postId}/shares`) as any; // Type assertion needed - API response structure varies
  },

  // ========== Feeds (News Feed - matches backend getNewsFeed) ==========
  getFeeds: async (params?: {
    page?: number;
    limit?: number;
    type?: string;
  }): Promise<{
    success: boolean;
    data: unknown[];
    pagination?: { page: number; limit: number; hasMore: boolean };
  }> => {
    const page = params?.page ?? 1;
    const limit = params?.limit ?? 10;
    const type = params?.type ?? "all";
    const query = new URLSearchParams({
      page: String(page),
      limit: String(limit),
      type,
    }).toString();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return apiRequest(`/feed/feeds?${query}`) as any;
  },

  // ========== Posts ==========
  createPost: async (data: {
    caption?: string;
    images?: File[];
    videos?: File[];
  }): Promise<{
    success: boolean;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data: any; // API response data structure varies by endpoint
    message: string;
  }> => {
    const hasFiles =
      (data.images && data.images.length > 0) ||
      (data.videos && data.videos.length > 0);

    console.log("Creating post via POST /api/feed/posts (FormData)", {
      hasCaption: !!data.caption,
      imagesCount: data.images?.length || 0,
      videosCount: data.videos?.length || 0,
    });

    // Get authentication token from localStorage
    const token =
      localStorage.getItem("token") || localStorage.getItem("authToken");

    // Always use FormData to match backend: req.body.text, req.files.photos, req.files.videos
    // Do not set Content-Type so the browser sets multipart/form-data with boundary
    const headers: Record<string, string> = {};
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const formData = new FormData();
    // Backend: const { text } = req.body
    formData.append("text", data.caption ?? "");
    // Backend: req.files?.photos, req.files?.videos
    if (data.images && data.images.length > 0) {
      data.images.forEach((file) => formData.append("photos", file));
    }
    if (data.videos && data.videos.length > 0) {
      data.videos.forEach((file) => formData.append("videos", file));
    }

    const body = formData;

    let response: Response;
    try {
      response = await fetch(`${API_BASE_URL}/feed/posts`, {
        method: "POST",
        headers,
        body,
        signal: AbortSignal.timeout(hasFiles ? 45000 : 20000),
      });
    } catch (fetchError: unknown) {
      // Handle network errors
      const error = fetchError as { name?: string; message?: string };
      if (error.name === "AbortError" || error.name === "TimeoutError") {
        throw new Error(
          "Request timed out. Please check your connection and try again."
        );
      }
      if (
        error.message?.includes("Failed to fetch") ||
        error.message?.includes("ECONNREFUSED")
      ) {
        throw new Error(
          "Unable to connect to server. Please ensure the backend is running on port 3000."
        );
      }
      throw new Error(`Network error: ${error.message || "Connection failed"}`);
    }

    // Check if response is ok before trying to parse
    const contentType = response.headers.get("content-type");
    const text = await response.text().catch(() => "");

    interface ApiResponse {
      success?: boolean;
      data?: unknown;
      error?: unknown;
      message?: unknown;
      [key: string]: unknown;
    }

    let responseData: ApiResponse;

    if (
      contentType &&
      contentType.includes("application/json") &&
      text.trim()
    ) {
      try {
        responseData = JSON.parse(text) as ApiResponse;
      } catch (parseError) {
        responseData = {
          error: response.statusText || "Invalid response format",
        };
      }
    } else if (text.trim()) {
      responseData = { error: text.substring(0, 200) || response.statusText };
    } else {
      responseData = { error: response.statusText || "Empty response" };
    }

    // Helper to convert error message to string
    const getErrorMessage = (value: unknown): string => {
      if (typeof value === "string") return value;
      if (typeof value === "boolean")
        return value ? "An error occurred" : "Request failed";
      if (value && typeof value === "object") {
        const errorObj = value as { message?: unknown; error?: unknown };
        if (errorObj.message) return String(errorObj.message);
        if (errorObj.error) return String(errorObj.error);
        return JSON.stringify(value);
      }
      return String(value || "Request failed");
    };

    if (!response.ok) {
      // Log detailed error information for debugging
      console.error(`API Error ${response.status} (${response.statusText})`, {
        endpoint: `${API_BASE_URL}/feed/posts`,
        status: response.status,
        statusText: response.statusText,
        responseData: responseData,
        responseText: text.substring(0, 500), // First 500 chars for debugging
      });

      // Provide user-friendly error messages based on status codes
      let defaultMessage = `API Error: ${response.statusText}`;
      if (response.status === 500) {
        defaultMessage =
          "Server error. Please try again later or contact support if the problem persists.";
      } else if (response.status === 401) {
        defaultMessage = "Authentication required. Please sign in again.";
      } else if (response.status === 403) {
        defaultMessage = "You don't have permission to access this resource.";
      } else if (response.status === 404) {
        defaultMessage = "The requested resource was not found.";
      } else if (response.status >= 500) {
        defaultMessage = "Server error. Please try again later.";
      } else if (response.status >= 400) {
        defaultMessage =
          "Request failed. Please check your input and try again.";
      }

      const errorMessage =
        getErrorMessage(responseData.error) ||
        getErrorMessage(responseData.message) ||
        defaultMessage;
      throw new Error(errorMessage);
    }

    // Check if response has success field and it's false
    if (responseData.success === false) {
      const errorMessage =
        getErrorMessage(responseData.error) ||
        getErrorMessage(responseData.message) ||
        "Request failed";
      throw new Error(errorMessage);
    }

    // Normalize response: backend may return { data }, { post }, or the post object directly.
    // Always return { success: true, data } so the frontend has a single contract.
    const postData =
      (responseData as { data?: unknown; post?: unknown }).data ??
      (responseData as { data?: unknown; post?: unknown }).post ??
      responseData;

    return {
      success: true,
      data: postData,
      message:
        (typeof (responseData as { message?: string }).message === "string"
          ? (responseData as { message?: string }).message
          : "Post created") as string,
    };
  },
};
