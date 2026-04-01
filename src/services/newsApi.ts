import API_BASE_URL from "../api/config";

export interface NewsPost {
  id: number;
  title: string;
  content: string;
  image_urls: string[];
  video_urls: string[];
  source_links: string[];
  is_published?: boolean;
  is_featured?: boolean;
  created_by?: string;
  created_at: string;
  updated_at?: string;
}

export interface AdminNewsPayload {
  title: string;
  content: string;
  image_urls?: string[];
  video_urls?: string[];
  source_links?: string[];
  is_published?: boolean;
  is_featured?: boolean;
  image_files?: File[];
  video_files?: File[];
}

const getAdminHeaders = () => {
  const token = localStorage.getItem("adminToken");
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

const getFriendlyError = (status: number, fallback: string) => {
  if (status === 401) return "Your admin session has expired. Please sign in again.";
  if (status === 403) return "You are not allowed to do this action.";
  if (status === 404) return "The requested item was not found.";
  if (status >= 500) return "Something went wrong on our side. Please try again.";
  return fallback;
};

const buildNewsFormData = (payload: AdminNewsPayload) => {
  const formData = new FormData();
  formData.append("title", payload.title || "");
  formData.append("content", payload.content || "");
  formData.append("image_urls", (payload.image_urls || []).join(","));
  formData.append("video_urls", (payload.video_urls || []).join(","));
  formData.append("source_links", (payload.source_links || []).join(","));
  formData.append("is_published", String(payload.is_published ?? true));
  formData.append("is_featured", String(payload.is_featured ?? false));
  (payload.image_files || []).forEach((file) => formData.append("news_images", file));
  (payload.video_files || []).forEach((file) => formData.append("news_videos", file));
  return formData;
};

export const newsApi = {
  async getPublished(limit = 20, featured = false): Promise<NewsPost[]> {
    const query = new URLSearchParams({
      limit: String(limit),
      ...(featured ? { featured: "true" } : {}),
    });
    const response = await fetch(`${API_BASE_URL}/news?${query.toString()}`, {
      method: "GET",
      signal: AbortSignal.timeout(20000),
    });
    const data = (await response.json().catch(() => ({}))) as {
      success?: boolean;
      data?: NewsPost[];
      message?: string;
    };
    if (!response.ok || !data.success) {
      throw new Error(getFriendlyError(response.status, data.message || "Unable to load news."));
    }
    return Array.isArray(data.data) ? data.data : [];
  },

  async getAdminNews(): Promise<NewsPost[]> {
    const response = await fetch(`${API_BASE_URL}/admin/news`, {
      method: "GET",
      headers: getAdminHeaders(),
      signal: AbortSignal.timeout(20000),
    });
    const data = (await response.json().catch(() => ({}))) as {
      success?: boolean;
      data?: NewsPost[];
      message?: string;
    };
    if (!response.ok || !data.success) {
      throw new Error(
        getFriendlyError(response.status, data.message || "Unable to load admin news posts.")
      );
    }
    return Array.isArray(data.data) ? data.data : [];
  },

  async createAdminNews(payload: AdminNewsPayload): Promise<NewsPost> {
    const token = localStorage.getItem("adminToken");
    const response = await fetch(`${API_BASE_URL}/admin/news`, {
      method: "POST",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: buildNewsFormData(payload),
      signal: AbortSignal.timeout(20000),
    });
    const data = (await response.json().catch(() => ({}))) as {
      success?: boolean;
      data?: NewsPost;
      message?: string;
    };
    if (!response.ok || !data.success || !data.data) {
      throw new Error(getFriendlyError(response.status, data.message || "Unable to create news post."));
    }
    return data.data;
  },

  async updateAdminNews(id: number, payload: AdminNewsPayload): Promise<NewsPost> {
    const token = localStorage.getItem("adminToken");
    const response = await fetch(`${API_BASE_URL}/admin/news/${id}`, {
      method: "PUT",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: buildNewsFormData(payload),
      signal: AbortSignal.timeout(20000),
    });
    const data = (await response.json().catch(() => ({}))) as {
      success?: boolean;
      data?: NewsPost;
      message?: string;
    };
    if (!response.ok || !data.success || !data.data) {
      throw new Error(getFriendlyError(response.status, data.message || "Unable to update news post."));
    }
    return data.data;
  },

  async deleteAdminNews(id: number): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/admin/news/${id}`, {
      method: "DELETE",
      headers: getAdminHeaders(),
      signal: AbortSignal.timeout(20000),
    });
    const data = (await response.json().catch(() => ({}))) as {
      success?: boolean;
      message?: string;
    };
    if (!response.ok || !data.success) {
      throw new Error(getFriendlyError(response.status, data.message || "Unable to delete news post."));
    }
  },
};
