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
  post_type?: string | null;
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

let reelsListRouteAvailable: boolean | null = null;

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

const getFallbackMediaDetails = (post: FeedFallbackPost) => {
  const media = Array.isArray(post.media) ? post.media : [];
  const mediaUrls = Array.isArray(post.media_urls) ? post.media_urls : [];
  const mediaTypes = Array.isArray(post.media_types) ? post.media_types : [];

  const videoFromMedia = media.find((item) => item.type === "video")?.url || null;
  const imageFromMedia = media.find((item) => item.type === "image")?.url || null;
  const fallbackVideoFromArrays =
    mediaUrls.find((_, index) => mediaTypes[index] === "video") || null;
  const fallbackImageFromArrays =
    mediaUrls.find((_, index) => mediaTypes[index] === "image") || null;

  return {
    media,
    videoUrl: post.video_url || post.videoUrl || videoFromMedia || fallbackVideoFromArrays,
    imageUrl:
      post.thumbnail_url ||
      post.thumbnailUrl ||
      imageFromMedia ||
      fallbackImageFromArrays,
  };
};

const isFeedFallbackReel = (post: FeedFallbackPost) => {
  const normalizedPostType =
    typeof post.post_type === "string" ? post.post_type.trim().toLowerCase() : "";
  const mediaDetails = getFallbackMediaDetails(post);

  return normalizedPostType === "reel" || Boolean(mediaDetails.videoUrl);
};

const mapFeedPostToReel = (post: FeedFallbackPost): ReelItem => {
  const { media, videoUrl, imageUrl } = getFallbackMediaDetails(post);

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
    video_url: videoUrl,
    videoUrl,
    thumbnail_url: imageUrl,
    thumbnailUrl: imageUrl,
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

const filterFallbackReels = (
  reels: ReelItem[],
  params?: {
    search?: string;
    category?: string;
  }
) => {
  const normalizedCategory =
    typeof params?.category === "string" ? params.category.trim().toLowerCase() : "";
  const normalizedSearch =
    typeof params?.search === "string" ? params.search.trim().toLowerCase() : "";

  return reels.filter((reel) => {
    if (
      normalizedCategory &&
      normalizedCategory !== "all" &&
      String(reel.category || "Others").trim().toLowerCase() !== normalizedCategory
    ) {
      return false;
    }

    if (!normalizedSearch) {
      return true;
    }

    const haystacks = [
      reel.title,
      reel.caption,
      reel.text,
      reel.category,
      reel.author?.name,
    ]
      .filter((value): value is string => typeof value === "string")
      .map((value) => value.toLowerCase());

    return haystacks.some((value) => value.includes(normalizedSearch));
  });
};

const sortFallbackReels = (reels: ReelItem[], sort: ReelSortOption = "recent") => {
  const sorted = [...reels];

  switch (sort) {
    case "views":
      return sorted.sort((left, right) => {
        const leftScore =
          Number(left.views_count || 0) +
          Number(left.reactions_count || 0) +
          Number(left.comments_count || 0) +
          Number(left.shares_count || 0);
        const rightScore =
          Number(right.views_count || 0) +
          Number(right.reactions_count || 0) +
          Number(right.comments_count || 0) +
          Number(right.shares_count || 0);
        return rightScore - leftScore;
      });
    case "trending":
      return sorted.sort((left, right) => {
        const leftCreatedAt = left.created_at ? new Date(left.created_at).getTime() : 0;
        const rightCreatedAt = right.created_at
          ? new Date(right.created_at).getTime()
          : 0;
        const leftAgeDays = Math.max(
          1,
          (Date.now() - leftCreatedAt) / (24 * 60 * 60 * 1000)
        );
        const rightAgeDays = Math.max(
          1,
          (Date.now() - rightCreatedAt) / (24 * 60 * 60 * 1000)
        );
        const leftScore =
          (Number(left.views_count || 0) +
            Number(left.reactions_count || 0) +
            Number(left.comments_count || 0) * 2 +
            Number(left.shares_count || 0) * 3) /
          leftAgeDays;
        const rightScore =
          (Number(right.views_count || 0) +
            Number(right.reactions_count || 0) +
            Number(right.comments_count || 0) * 2 +
            Number(right.shares_count || 0) * 3) /
          rightAgeDays;
        return rightScore - leftScore;
      });
    case "recent":
    default:
      return sorted.sort((left, right) => {
        const leftCreatedAt = left.created_at ? new Date(left.created_at).getTime() : 0;
        const rightCreatedAt = right.created_at
          ? new Date(right.created_at).getTime()
          : 0;
        return rightCreatedAt - leftCreatedAt;
      });
  }
};

const buildFallbackCategories = (reels: ReelItem[]) =>
  Array.from(
    reels.reduce((counts, reel) => {
      const key = String(reel.category || "Others").trim() || "Others";
      counts.set(key, (counts.get(key) || 0) + 1);
      return counts;
    }, new Map<string, number>())
  ).map(([name, count]) => ({
    name,
    count,
  }));

export const reelsApi = {
  async createReel(payload: {
    title?: string;
    caption?: string;
    category?: string;
    video: File;
    thumbnail?: File | null;
  }): Promise<ReelItem> {
    const title = payload.title?.trim() || "";
    const caption = payload.caption?.trim() || "";
    const category = payload.category?.trim() || "Others";

    const buildDedicatedReelFormData = () => {
      const formData = new FormData();
      formData.append("title", title);
      formData.append("text", caption);
      formData.append("category", category);
      formData.append("videos", payload.video);

      if (payload.thumbnail) {
        formData.append("thumbnail", payload.thumbnail);
      }

      return formData;
    };

    const buildFeedFallbackFormData = () => {
      const formData = new FormData();
      formData.append("text", caption);
      formData.append("post_type", "reel");
      formData.append("reel_title", title);
      formData.append("reel_category", category);
      formData.append("videos", payload.video);

      if (payload.thumbnail) {
        formData.append("photos", payload.thumbnail);
      }

      return formData;
    };

    try {
      const response = await reelsApiRequest<ReelItem>("/reels", {
        method: "POST",
        body: buildDedicatedReelFormData(),
      });

      if (!response.data) {
        throw new Error("The reel was created, but the server returned no data.");
      }

      return response.data;
    } catch (primaryError) {
      console.warn(
        "[reelsApi] Primary create reel endpoint failed, falling back to feed post creation",
        {
          error: primaryError,
        }
      );

      const fallbackResponse = await reelsApiRequest<FeedFallbackPost>(
        "/feed/posts",
        {
          method: "POST",
          body: buildFeedFallbackFormData(),
        }
      );

      const fallbackEnvelope = fallbackResponse as ApiEnvelope<FeedFallbackPost> & {
        post?: FeedFallbackPost;
      };
      const fallbackPost = fallbackEnvelope.data || fallbackEnvelope.post;

      if (!fallbackPost) {
        throw new Error(
          "The reel was created, but the fallback feed API returned no data."
        );
      }

      return mapFeedPostToReel({
        ...fallbackPost,
        reel_title: fallbackPost.reel_title || title,
        reel_category: fallbackPost.reel_category || category,
      });
    }
  },

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
      if (reelsListRouteAvailable === false) {
        throw new Error("Reels API route was not found on the server.");
      }

      const response = await reelsApiRequest<ReelItem[]>(`/reels?${query.toString()}`);
      reelsListRouteAvailable = true;

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
      if (
        primaryError instanceof Error &&
        primaryError.message.includes("Reels API route was not found")
      ) {
        reelsListRouteAvailable = false;
      }

      console.warn("[reelsApi] Primary reels endpoint failed, falling back to feed", {
        error: primaryError,
      });

      const requestedPage = Number(params?.page || 1);
      const requestedLimit = Number(params?.limit || 12);
      const fallbackQuery = new URLSearchParams();
      fallbackQuery.set("page", String(requestedPage));
      fallbackQuery.set("limit", String(requestedLimit));
      fallbackQuery.set("type", "reel");

      try {
        const fallbackResponse = await reelsApiRequest<FeedFallbackPost[]>(
          `/feed/feeds?${fallbackQuery.toString()}`
        );

        const directFallbackData = Array.isArray(fallbackResponse.data)
          ? filterFallbackReels(
              fallbackResponse.data
                .filter(isFeedFallbackReel)
                .map(mapFeedPostToReel),
              params
            )
          : [];

        if (directFallbackData.length > 0) {
          return {
            success: true,
            data: sortFallbackReels(directFallbackData, params?.sort),
            categories: buildFallbackCategories(directFallbackData),
            pagination: {
              page: Number(fallbackResponse.pagination?.page || requestedPage),
              limit: Number(fallbackResponse.pagination?.limit || requestedLimit),
              total: Number(
                fallbackResponse.pagination?.total || directFallbackData.length || 0
              ),
              hasMore: Boolean(fallbackResponse.pagination?.hasMore),
            },
          };
        }
      } catch (fallbackError) {
        console.warn(
          "[reelsApi] Reel-typed feed fallback failed, trying general feed fallback",
          {
            error: fallbackError,
          }
        );
      }

      const generalFeedLimit = Math.max(requestedPage * requestedLimit * 4, 30);
      const generalFallbackQuery = new URLSearchParams();
      generalFallbackQuery.set("page", "1");
      generalFallbackQuery.set("limit", String(generalFeedLimit));
      generalFallbackQuery.set("type", "all");

      const generalFallbackResponse = await reelsApiRequest<FeedFallbackPost[]>(
        `/feed/feeds?${generalFallbackQuery.toString()}`
      );

      const reelLikePosts = Array.isArray(generalFallbackResponse.data)
        ? generalFallbackResponse.data.filter(isFeedFallbackReel).map(mapFeedPostToReel)
        : [];
      const filteredReels = sortFallbackReels(
        filterFallbackReels(reelLikePosts, params),
        params?.sort
      );
      const startIndex = (requestedPage - 1) * requestedLimit;
      const pagedReels = filteredReels.slice(startIndex, startIndex + requestedLimit);

      return {
        success: true,
        data: pagedReels,
        categories: buildFallbackCategories(filteredReels),
        pagination: {
          page: requestedPage,
          limit: requestedLimit,
          total: filteredReels.length,
          hasMore: startIndex + requestedLimit < filteredReels.length,
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
