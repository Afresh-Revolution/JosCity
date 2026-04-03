import { apiUrl } from "../api/config";

export type ReelSortOption = "recent" | "views" | "trending";
export type ReelPreference = "interested" | "not_interested" | null;

interface ApiEnvelope<T> {
  success?: boolean;
  data?: T;
  error?: unknown;
  message?: unknown;
  categories?: Array<{ name?: string; count?: number | string }>;
  pagination?: {
    page?: number;
    limit?: number;
    total?: number;
    hasMore?: boolean;
  };
}

export interface ReelAuthor {
  id: number;
  name: string;
  picture?: string | null;
  verified?: boolean;
  type?: string;
}

export interface ReelMedia {
  url: string;
  type: string;
}

export interface ReelComment {
  id?: number;
  comment_id?: number;
  post_id: number;
  user_id: number;
  text?: string;
  comment?: string;
  created_at: string;
  time_ago?: string;
  author?: ReelAuthor;
}

export interface ReelItem {
  id: number;
  post_id: number;
  title: string;
  text?: string;
  caption?: string;
  category: string;
  video_url?: string | null;
  videoUrl?: string | null;
  thumbnail_url?: string | null;
  thumbnailUrl?: string | null;
  created_at?: string;
  time_ago?: string;
  views_count: number;
  views: string;
  reactions_count: number;
  comments_count: number;
  shares_count: number;
  user_reacted: boolean;
  user_shared: boolean;
  user_saved: boolean;
  user_preference: ReelPreference;
  author?: ReelAuthor;
  media?: ReelMedia[];
}

export interface ReelsListResponse {
  success: boolean;
  data: ReelItem[];
  categories: Array<{ name: string; count: number }>;
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };
}

interface FeedFallbackMedia {
  url?: string;
  type?: string;
}

interface FeedFallbackPost {
  id?: number;
  post_id?: number;
  title?: string;
  text?: string;
  caption?: string;
  reel_title?: string;
  reel_category?: string;
  category?: string;
  video_url?: string | null;
  videoUrl?: string | null;
  thumbnail_url?: string | null;
  thumbnailUrl?: string | null;
  created_at?: string;
  time_ago?: string;
  reactions_count?: number | string;
  comments_count?: number | string;
  shares_count?: number | string;
  user_reacted?: boolean;
  user_shared?: boolean;
  user_saved?: boolean;
  user_preference?: ReelPreference;
  author?: ReelAuthor;
  media?: FeedFallbackMedia[];
  media_urls?: string[];
  media_types?: string[];
}

const getAuthToken = () =>
  localStorage.getItem("token") || localStorage.getItem("authToken");

const getErrorMessage = (value: unknown, fallback: string): string => {
  if (typeof value === "string" && value.trim()) {
    return value;
  }

  if (value && typeof value === "object") {
    const errorObject = value as { message?: unknown; error?: unknown };
    if (typeof errorObject.message === "string" && errorObject.message.trim()) {
      return errorObject.message;
    }
    if (typeof errorObject.error === "string" && errorObject.error.trim()) {
      return errorObject.error;
    }
  }

  return fallback;
};

const parseJsonResponse = async <T>(response: Response): Promise<ApiEnvelope<T>> => {
  const text = await response.text().catch(() => "");
  if (!text.trim()) {
    return {};
  }

  try {
    return JSON.parse(text) as ApiEnvelope<T>;
  } catch {
    return {
      error: text,
    };
  }
};

const reelsApiRequest = async <T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiEnvelope<T>> => {
  const url = apiUrl(endpoint);
  const method = options.method || "GET";
  const token = getAuthToken();
  const isFormData = options.body instanceof FormData;
  const headers: Record<string, string> = {
    ...((options.headers as Record<string, string>) || {}),
  };

  if (!isFormData) {
    headers["Content-Type"] = headers["Content-Type"] || "application/json";
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  console.log("[reelsApi] Request", {
    method,
    url,
    body:
      typeof options.body === "string"
        ? options.body
        : isFormData
          ? "FormData"
          : options.body || null,
  });

  let response: Response;
  try {
    response = await fetch(url, {
      ...options,
      headers,
      signal: AbortSignal.timeout(30000),
    });
  } catch (error) {
    console.error("[reelsApi] Network error", {
      method,
      url,
      error,
    });
    throw new Error("We could not connect to the reels service.");
  }

  const payload = await parseJsonResponse<T>(response);

  console.log("[reelsApi] Response", {
    method,
    url,
    status: response.status,
    ok: response.ok,
    payload,
  });

  if (!response.ok || payload.success === false) {
    if (response.status === 404 && endpoint.startsWith("/reels")) {
      throw new Error(
        "Reels API route was not found on the server. The backend may not be deployed yet."
      );
    }

    throw new Error(
      getErrorMessage(
        payload.error ?? payload.message,
        "We could not complete the reels request."
      )
    );
  }

  return payload;
};

const totalReactionCount = (
  reactions: Array<{ count?: number | string }> | undefined
) =>
  Array.isArray(reactions)
    ? reactions.reduce((total, reaction) => total + Number(reaction.count || 0), 0)
    : 0;

const formatCompactCount = (value: number) => {
  if (!Number.isFinite(value) || value <= 0) {
    return "0";
  }

  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(value >= 10000000 ? 0 : 1)}M`.replace(
      ".0M",
      "M"
    );
  }

  if (value >= 1000) {
    return `${(value / 1000).toFixed(value >= 10000 ? 0 : 1)}K`.replace(
      ".0K",
      "K"
    );
  }

  return String(value);
};

const mapFeedPostToReel = (post: FeedFallbackPost): ReelItem => {
  const media = Array.isArray(post.media) ? post.media : [];
  const mediaUrls = Array.isArray(post.media_urls) ? post.media_urls : [];
  const mediaTypes = Array.isArray(post.media_types) ? post.media_types : [];

  const videoFromMedia = media.find((item) => item.type === "video")?.url;
  const imageFromMedia = media.find((item) => item.type === "image")?.url;
  const fallbackVideoFromArrays =
    mediaUrls.find((_, index) => mediaTypes[index] === "video") || null;
  const fallbackImageFromArrays =
    mediaUrls.find((_, index) => mediaTypes[index] === "image") || null;

  const reelId = Number(post.id ?? post.post_id ?? 0);
  const viewsCount = 0;
  const title =
    post.reel_title?.trim() ||
    post.title?.trim() ||
    post.caption?.trim() ||
    post.text?.trim() ||
    `Reel #${reelId}`;

  return {
    id: reelId,
    post_id: reelId,
    title,
    text: post.text,
    caption: post.caption || post.text,
    category: post.reel_category || post.category || "Others",
    video_url: post.video_url || post.videoUrl || videoFromMedia || fallbackVideoFromArrays,
    videoUrl: post.video_url || post.videoUrl || videoFromMedia || fallbackVideoFromArrays,
    thumbnail_url:
      post.thumbnail_url ||
      post.thumbnailUrl ||
      imageFromMedia ||
      fallbackImageFromArrays,
    thumbnailUrl:
      post.thumbnail_url ||
      post.thumbnailUrl ||
      imageFromMedia ||
      fallbackImageFromArrays,
    created_at: post.created_at,
    time_ago: post.time_ago,
    views_count: viewsCount,
    views: formatCompactCount(viewsCount),
    reactions_count: Number(post.reactions_count || 0),
    comments_count: Number(post.comments_count || 0),
    shares_count: Number(post.shares_count || 0),
    user_reacted: Boolean(post.user_reacted),
    user_shared: Boolean(post.user_shared),
    user_saved: Boolean(post.user_saved),
    user_preference:
      post.user_preference === "interested" ||
      post.user_preference === "not_interested"
        ? post.user_preference
        : null,
    author: post.author,
    media: media
      .filter((item): item is FeedFallbackMedia & { url: string; type: string } =>
        Boolean(item?.url && item?.type)
      )
      .map((item) => ({
        url: item.url,
        type: item.type,
      })),
  };
};

export const reelsApi = {
  async getReels(params?: {
    page?: number;
    limit?: number;
    search?: string;
    category?: string;
    sort?: ReelSortOption;
  }): Promise<ReelsListResponse> {
    const query = new URLSearchParams();
    query.set("page", String(params?.page ?? 1));
    query.set("limit", String(params?.limit ?? 12));
    if (params?.search?.trim()) {
      query.set("search", params.search.trim());
    }
    if (params?.category?.trim() && params.category !== "All") {
      query.set("category", params.category.trim());
    }
    query.set("sort", params?.sort ?? "recent");

    try {
      const response = await reelsApiRequest<ReelItem[]>(`/reels?${query.toString()}`);

      return {
        success: true,
        data: Array.isArray(response.data) ? response.data : [],
        categories: Array.isArray(response.categories)
          ? response.categories.map((category) => ({
              name: String(category.name || "Others"),
              count: Number(category.count || 0),
            }))
          : [],
        pagination: {
          page: Number(response.pagination?.page || params?.page || 1),
          limit: Number(response.pagination?.limit || params?.limit || 12),
          total: Number(response.pagination?.total || 0),
          hasMore: Boolean(response.pagination?.hasMore),
        },
      };
    } catch (primaryError) {
      console.warn("[reelsApi] Primary reels endpoint failed, falling back to feed", {
        error: primaryError,
      });

      const fallbackQuery = new URLSearchParams();
      fallbackQuery.set("page", String(params?.page ?? 1));
      fallbackQuery.set("limit", String(params?.limit ?? 12));
      fallbackQuery.set("type", "reel");

      const fallbackResponse = await reelsApiRequest<FeedFallbackPost[]>(
        `/feed/feeds?${fallbackQuery.toString()}`
      );

      const data = Array.isArray(fallbackResponse.data)
        ? fallbackResponse.data.map(mapFeedPostToReel)
        : [];

      return {
        success: true,
        data,
        categories: [],
        pagination: {
          page: Number(fallbackResponse.pagination?.page || params?.page || 1),
          limit: Number(fallbackResponse.pagination?.limit || params?.limit || 12),
          total: Number(fallbackResponse.pagination?.total || data.length || 0),
          hasMore: Boolean(fallbackResponse.pagination?.hasMore),
        },
      };
    }
  },

  async recordView(reelId: number): Promise<{
    views_count: number;
    views: string;
  }> {
    const response = await reelsApiRequest<{
      reel_id: number;
      views_count: number;
      views: string;
    }>(`/reels/${reelId}/view`, {
      method: "POST",
      body: JSON.stringify({}),
    });

    return {
      views_count: Number(response.data?.views_count || 0),
      views: String(response.data?.views || "0"),
    };
  },

  async toggleSave(
    reelId: number,
    saved: boolean
  ): Promise<{ saved: boolean }> {
    const response = await reelsApiRequest<{ saved: boolean }>(
      `/reels/${reelId}/save`,
      {
        method: "POST",
        body: JSON.stringify({ saved }),
      }
    );

    return {
      saved: Boolean(response.data?.saved),
    };
  },

  async setPreference(
    reelId: number,
    preference: ReelPreference
  ): Promise<{ preference: ReelPreference }> {
    const response = await reelsApiRequest<{ preference: ReelPreference }>(
      `/reels/${reelId}/preference`,
      {
        method: "POST",
        body: JSON.stringify({ preference }),
      }
    );

    const nextPreference = response.data?.preference;
    return {
      preference:
        nextPreference === "interested" || nextPreference === "not_interested"
          ? nextPreference
          : null,
    };
  },

  async reportReel(reelId: number, reason?: string): Promise<void> {
    await reelsApiRequest(`/reels/${reelId}/report`, {
      method: "POST",
      body: JSON.stringify({ reason: reason?.trim() || null }),
    });
  },

  async toggleLike(
    reelId: number,
    currentlyLiked: boolean
  ): Promise<{ liked: boolean; reactions_count: number }> {
    const response = currentlyLiked
      ? await reelsApiRequest<{
          reactions?: Array<{ count?: number | string }>;
        }>(`/posts/${reelId}/react`, {
          method: "DELETE",
        })
      : await reelsApiRequest<{
          reactions?: Array<{ count?: number | string }>;
        }>(`/posts/${reelId}/react`, {
          method: "POST",
          body: JSON.stringify({ reaction_id: 1, reaction: "like" }),
        });

    return {
      liked: !currentlyLiked,
      reactions_count: totalReactionCount(response.data?.reactions),
    };
  },

  async getComments(reelId: number): Promise<ReelComment[]> {
    const response = await reelsApiRequest<ReelComment[]>(
      `/posts/${reelId}/comments`
    );
    return Array.isArray(response.data) ? response.data : [];
  },

  async addComment(reelId: number, text: string): Promise<ReelComment | null> {
    const response = await reelsApiRequest<ReelComment>(`/posts/${reelId}/comment`, {
      method: "POST",
      body: JSON.stringify({ text }),
    });
    return response.data || null;
  },

  async shareReel(
    reelId: number
  ): Promise<{ shares_count?: number; user_shared?: boolean }> {
    const response = await reelsApiRequest<{ shares_count?: number; user_shared?: boolean }>(
      `/posts/${reelId}/share`,
      {
        method: "POST",
        body: JSON.stringify({}),
      }
    );

    return {
      shares_count:
        typeof response.data?.shares_count === "number"
          ? response.data.shares_count
          : undefined,
      user_shared:
        typeof response.data?.user_shared === "boolean"
          ? response.data.user_shared
          : undefined,
    };
  },
};
