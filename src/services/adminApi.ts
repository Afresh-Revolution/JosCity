import API_BASE_URL from "../api/config";

/** Express/HTML error pages: extract a short line and avoid dumping full HTML into the UI. */
function normalizeNonJsonAdminError(status: number, statusText: string, body: string): string {
  const trimmed = body.trim();
  const preMatch = trimmed.match(/<pre[^>]*>([\s\S]*?)<\/pre>/i);
  const fromPre = preMatch ? preMatch[1].trim() : "";
  if (fromPre) {
    if (status === 404 && /cannot\s+get/i.test(fromPre)) {
      return `${fromPre}. This route may not be on your deployed API yet — deploy the latest backend or confirm your API base URL.`;
    }
    return fromPre.length > 400 ? `${fromPre.slice(0, 400)}…` : fromPre;
  }
  if (trimmed.startsWith("<!DOCTYPE") || /^<html[\s>]/i.test(trimmed)) {
    if (status === 404) {
      return "Admin endpoint not found (404). Deploy the latest backend or verify the API URL matches the server that includes admin notifications.";
    }
    return `Request failed (${status} ${statusText}). The server returned HTML instead of JSON.`;
  }
  return trimmed.length > 500 ? `${trimmed.slice(0, 500)}…` : trimmed || `${status} ${statusText}`;
}

// Helper function to get admin token
const getAdminToken = (): string | null => {
  return localStorage.getItem("adminToken");
};

// Generic API request helper for admin endpoints
const adminApiRequest = async (
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> => {
  const adminToken = getAdminToken();

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...((options.headers as Record<string, string>) || {}),
  };

  if (adminToken) {
    headers["Authorization"] = `Bearer ${adminToken}`;
  }

  const response = await fetch(`${API_BASE_URL}/admin${endpoint}`, {
    ...options,
    headers,
    signal: AbortSignal.timeout(30000), // 30 second timeout
  });

  if (!response.ok) {
    const contentType = response.headers.get("content-type");
    let errorData: Record<string, unknown> = {};

    if (contentType && contentType.includes("application/json")) {
      try {
        errorData = (await response.json()) as Record<string, unknown>;
      } catch {
        errorData = {};
      }
    } else {
      const text = await response.text();
      errorData = {
        message: normalizeNonJsonAdminError(response.status, response.statusText, text),
      };
    }

    // Prefer message (string); backend often sends { error: true, message: "..." }
    const message =
      typeof errorData.message === "string"
        ? errorData.message
        : typeof errorData.error === "string"
          ? errorData.error
          : `HTTP ${response.status}: ${response.statusText}`;
    const err = new Error(message) as Error & { status?: number };
    err.status = response.status;
    throw err;
  }

  return response;
};

/** Refresh admin token (get new 7-day token). Call when dashboard loads to keep token renewed. */
export const refreshAdminToken = async (): Promise<boolean> => {
  try {
    const response = await adminApiRequest("/refresh", { method: "POST" });
    const data = (await response.json()) as { token?: string; admin?: unknown };
    if (data.token) {
      localStorage.setItem("adminToken", data.token);
      if (data.admin) {
        localStorage.setItem("adminData", JSON.stringify(data.admin));
      }
      return true;
    }
  } catch {
    // ignore; token stays as-is
  }
  return false;
};

// ==================== DASHBOARD ====================
export interface DashboardData {
  success: boolean;
  data: {
    insights: {
      totalUsers: number;
      pendingApprovals: number;
      notActivated: number;
      bannedUsers: number;
      onlineUsers: number;
      totalPosts: number;
      totalComments: number;
      totalPages: number;
      totalGroups: number;
      totalEvents: number;
      totalMessages: number;
      totalNotifications: number;
      pendingReports: number;
      pendingVerifications: number;
    };
    chart: Array<{
      month: string;
      users: number;
      posts: number;
      pages: number;
      groups: number;
      events: number;
    }>;
  };
}

export const getDashboard = async (): Promise<DashboardData> => {
  const response = await adminApiRequest("/dashboard");
  return response.json();
};

export const getStats = async (): Promise<DashboardData> => {
  const response = await adminApiRequest("/dashboard/stats");
  return response.json();
};

// ==================== USERS ====================
export interface User {
  user_id: string;
  user_firstname: string;
  user_lastname: string;
  user_email: string;
  user_phone: string;
  user_gender: string;
  user_picture: string;
  user_cover: string;
  user_registered: string;
  user_last_seen: string;
  user_activated: boolean;
  user_approved: boolean;
  user_banned: boolean;
  user_verified: boolean;
  user_group: string;
  account_status: string;
  business_name?: string;
  business_email?: string;
  business_phone?: string;
  business_location?: string;
  business_type?: string;
  nin_number?: string;
  CAC_number?: string;
  address?: string;
}

export interface UsersResponse {
  success: boolean;
  data: User[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export const getUsers = async (params?: {
  page?: number;
  limit?: number;
  status?: "pending" | "banned" | "not_activated" | "approved" | "rejected" | "online";
  search?: string;
  group?: string;
}): Promise<UsersResponse> => {
  const queryParams = new URLSearchParams();
  if (params?.page) queryParams.append("page", params.page.toString());
  if (params?.limit) queryParams.append("limit", params.limit.toString());
  if (params?.status) queryParams.append("status", params.status);
  if (params?.search) queryParams.append("search", params.search);
  if (params?.group) queryParams.append("group", params.group);

  const queryString = queryParams.toString();
  const endpoint = `/user/all${queryString ? `?${queryString}` : ""}`;
  const response = await adminApiRequest(endpoint);
  return response.json();
};

export const getUser = async (id: string): Promise<{ success: boolean; data: User }> => {
  const response = await adminApiRequest(`/user/${id}`);
  return response.json();
};

// Admin approval with email (for pending registrations)
export const approveAccount = async (user_id: string): Promise<{ success: boolean; message: string }> => {
  const response = await adminApiRequest(`/auth/approve`, {
    method: "POST",
    body: JSON.stringify({ user_id }),
  });
  return response.json();
};

// Admin user approval (for existing users - no email)
export const approveUser = async (id: string): Promise<{ success: boolean; message: string; error?: string }> => {
  const response = await adminApiRequest(`/user/${id}/approve`, {
    method: "POST",
  });
  const data = await response.json();
  
  // Handle error responses
  if (!response.ok) {
    return {
      success: false,
      message: data.message || data.error || "Failed to approve user",
      error: data.error || data.message
    };
  }
  
  return data;
};

export const banUser = async (id: string, reason?: string): Promise<{ success: boolean; message: string }> => {
  const response = await adminApiRequest(`/user/${id}/ban`, {
    method: "POST",
    body: JSON.stringify({ reason }),
  });
  return response.json();
};

export const unbanUser = async (id: string): Promise<{ success: boolean; message: string }> => {
  const response = await adminApiRequest(`/user/${id}/unban`, {
    method: "POST",
  });
  return response.json();
};

export const verifyUser = async (id: string): Promise<{ success: boolean; message: string; error?: string }> => {
  const response = await adminApiRequest(`/user/${id}/verify`, {
    method: "POST",
  });
  const data = await response.json();
  
  // Handle error responses
  if (!response.ok) {
    return {
      success: false,
      message: data.message || data.error || "Failed to verify user",
      error: data.error || data.message
    };
  }
  
  return data;
};

export const updateUserGroup = async (id: string, user_group: string): Promise<{ success: boolean; message: string }> => {
  const response = await adminApiRequest(`/user/${id}/group`, {
    method: "PUT",
    body: JSON.stringify({ user_group }),
  });
  return response.json();
};

export const deleteUser = async (id: string): Promise<{ success: boolean; message: string; account_type?: string }> => {
  const response = await adminApiRequest(`/user/${id}`, {
    method: "DELETE",
  });
  return response.json();
};

// ==================== POSTS ====================
export interface Post {
  post_id: string;
  user_id: string;
  user_type: string;
  text: string;
  time: string;
  pre_approved: boolean;
  has_approved: boolean;
  post_type: string;
  author_name?: string;
  author_picture?: string;
  author_url?: string;
}

export interface PostsResponse {
  success: boolean;
  data: Post[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export const getPosts = async (params?: {
  page?: number;
  limit?: number;
  status?: "pending" | "approved";
  type?: string;
  search?: string;
}): Promise<PostsResponse> => {
  const queryParams = new URLSearchParams();
  if (params?.page) queryParams.append("page", params.page.toString());
  if (params?.limit) queryParams.append("limit", params.limit.toString());
  if (params?.status) queryParams.append("status", params.status);
  if (params?.type) queryParams.append("type", params.type);
  if (params?.search) queryParams.append("search", params.search);

  const queryString = queryParams.toString();
  const endpoint = `/posts${queryString ? `?${queryString}` : ""}`;
  const response = await adminApiRequest(endpoint);
  return response.json();
};

export const getPost = async (id: string): Promise<{ success: boolean; data: Post }> => {
  const response = await adminApiRequest(`/posts/${id}`);
  return response.json();
};

export const approvePost = async (id: string): Promise<{ success: boolean; message: string }> => {
  const response = await adminApiRequest(`/posts/${id}/approve`, {
    method: "POST",
  });
  return response.json();
};

export const deletePost = async (
  id: string,
  reason: string
): Promise<{ success: boolean; message: string }> => {
  const response = await adminApiRequest(`/posts/${id}`, {
    method: "DELETE",
    body: JSON.stringify({ reason }),
  });
  return response.json();
};

// ==================== PAGES ====================
export interface Page {
  page_id: string;
  page_name: string;
  page_title: string;
  page_picture: string;
  page_cover: string;
  page_date: string;
  page_verified: boolean;
}

export interface PagesResponse {
  success: boolean;
  data: Page[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export const getPages = async (params?: {
  page?: number;
  limit?: number;
  search?: string;
}): Promise<PagesResponse> => {
  const queryParams = new URLSearchParams();
  if (params?.page) queryParams.append("page", params.page.toString());
  if (params?.limit) queryParams.append("limit", params.limit.toString());
  if (params?.search) queryParams.append("search", params.search);

  const queryString = queryParams.toString();
  const endpoint = `/pages${queryString ? `?${queryString}` : ""}`;
  const response = await adminApiRequest(endpoint);
  return response.json();
};

export const getPage = async (id: string): Promise<{ success: boolean; data: Page }> => {
  const response = await adminApiRequest(`/pages/${id}`);
  return response.json();
};

export const verifyPage = async (id: string): Promise<{ success: boolean; message: string }> => {
  const response = await adminApiRequest(`/pages/${id}/verify`, {
    method: "POST",
  });
  return response.json();
};

export const deletePage = async (id: string): Promise<{ success: boolean; message: string }> => {
  const response = await adminApiRequest(`/pages/${id}`, {
    method: "DELETE",
  });
  return response.json();
};

// ==================== GROUPS ====================
export interface Group {
  group_id: string;
  group_name: string;
  group_title: string;
  group_picture: string;
  group_cover: string;
  group_date: string;
}

export interface GroupsResponse {
  success: boolean;
  data: Group[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export const getGroups = async (params?: {
  page?: number;
  limit?: number;
  search?: string;
}): Promise<GroupsResponse> => {
  const queryParams = new URLSearchParams();
  if (params?.page) queryParams.append("page", params.page.toString());
  if (params?.limit) queryParams.append("limit", params.limit.toString());
  if (params?.search) queryParams.append("search", params.search);

  const queryString = queryParams.toString();
  const endpoint = `/groups${queryString ? `?${queryString}` : ""}`;
  const response = await adminApiRequest(endpoint);
  return response.json();
};

export const getGroup = async (id: string): Promise<{ success: boolean; data: Group }> => {
  const response = await adminApiRequest(`/groups/${id}`);
  return response.json();
};

export const deleteGroup = async (id: string): Promise<{ success: boolean; message: string }> => {
  const response = await adminApiRequest(`/groups/${id}`, {
    method: "DELETE",
  });
  return response.json();
};

// ==================== FORUMS ====================
export interface AdminForumAdmin {
  userId: number;
  displayName: string;
}

export interface AdminForumRow {
  id: number;
  name: string;
  description: string;
  category: string;
  visibility: string;
  suspended: boolean;
  created_by: number;
  creator_name: string;
  creator_picture?: string;
  member_count: number;
  created_at: string;
  updated_at: string;
  admins: AdminForumAdmin[];
}

export interface AdminForumsResponse {
  success: boolean;
  data: AdminForumRow[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export const getAdminForums = async (params?: {
  page?: number;
  limit?: number;
  search?: string;
}): Promise<AdminForumsResponse> => {
  const queryParams = new URLSearchParams();
  if (params?.page) queryParams.append("page", params.page.toString());
  if (params?.limit) queryParams.append("limit", params.limit.toString());
  if (params?.search) queryParams.append("search", params.search);
  const qs = queryParams.toString();
  const response = await adminApiRequest(`/forums${qs ? `?${qs}` : ""}`);
  return response.json();
};

export const setAdminForumSuspended = async (
  id: number,
  suspended: boolean
): Promise<{ success: boolean; data?: { id: number; suspended: boolean } }> => {
  const response = await adminApiRequest(`/forums/${id}/suspend`, {
    method: "PATCH",
    body: JSON.stringify({ suspended }),
  });
  return response.json();
};

export const deleteAdminForum = async (id: number): Promise<{ success: boolean; message?: string }> => {
  const response = await adminApiRequest(`/forums/${id}`, {
    method: "DELETE",
  });
  return response.json();
};

// ==================== EVENTS ====================
export interface Event {
  event_id: string;
  event_title: string;
  event_description: string;
  event_cover: string;
  event_date: string;
  event_admin: string;
  user_name?: string;
  user_firstname?: string;
  user_lastname?: string;
  user_picture?: string;
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

export const getEvents = async (params?: {
  page?: number;
  limit?: number;
  search?: string;
}): Promise<EventsResponse> => {
  const queryParams = new URLSearchParams();
  if (params?.page) queryParams.append("page", params.page.toString());
  if (params?.limit) queryParams.append("limit", params.limit.toString());
  if (params?.search) queryParams.append("search", params.search);

  const queryString = queryParams.toString();
  const endpoint = `/events${queryString ? `?${queryString}` : ""}`;
  const response = await adminApiRequest(endpoint);
  return response.json();
};

export const getEvent = async (id: string): Promise<{ success: boolean; data: Event }> => {
  const response = await adminApiRequest(`/events/${id}`);
  return response.json();
};

const parseEventMutationError = async (response: Response): Promise<never> => {
  const errorData = await response.json().catch(() => ({}));
  const message =
    typeof errorData.message === "string"
      ? errorData.message
      : typeof errorData.error === "string"
        ? errorData.error
        : "Event creation failed";
  throw new Error(
    message || `HTTP ${response.status}: ${response.statusText}`
  );
};

export const createEvent = async (event: {
  title: string;
  description?: string;
  category?: string;
  date: string;
  location?: string;
  image?: string;
  capacity?: number;
}): Promise<{ success: boolean; message?: string; data: Event }> => {
  try {
    const response = await adminApiRequest("/events", {
      method: "POST",
      body: JSON.stringify(event),
    });
    return response.json();
  } catch (error) {
    const status = (error as Error & { status?: number }).status;

    // Fallback for deployments where event creation is exposed on the public
    // events endpoint but still accepts the admin bearer token.
    if (status === 404 || status === 405 || status === 501) {
      const adminToken = getAdminToken();
      const response = await fetch(`${API_BASE_URL}/events`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(adminToken ? { Authorization: `Bearer ${adminToken}` } : {}),
        },
        body: JSON.stringify(event),
        signal: AbortSignal.timeout(30000),
      });

      if (!response.ok) {
        await parseEventMutationError(response);
      }

      return response.json();
    }

    throw error;
  }
};

export const updateEvent = async (
  id: string,
  event: {
    title: string;
    description?: string;
    category?: string;
    date: string;
    location?: string;
    image?: string;
    capacity?: number;
  }
): Promise<{ success: boolean; message?: string; data: Event }> => {
  try {
    const response = await adminApiRequest(`/events/${id}`, {
      method: "PUT",
      body: JSON.stringify(event),
    });
    return response.json();
  } catch (error) {
    const status = (error as Error & { status?: number }).status;

    if (status === 404 || status === 405 || status === 501) {
      const adminToken = getAdminToken();
      const response = await fetch(`${API_BASE_URL}/events/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(adminToken ? { Authorization: `Bearer ${adminToken}` } : {}),
        },
        body: JSON.stringify(event),
        signal: AbortSignal.timeout(30000),
      });

      if (!response.ok) {
        await parseEventMutationError(response);
      }

      return response.json();
    }

    throw error;
  }
};

export const deleteEvent = async (id: string): Promise<{ success: boolean; message: string }> => {
  const response = await adminApiRequest(`/events/${id}`, {
    method: "DELETE",
  });
  return response.json();
};

// ==================== REPORTS ====================
export interface Report {
  report_id: string;
  reporter_id: string;
  node_id: string;
  node_type: string;
  reason: string;
  seen: string;
  time: string;
}

export interface ReportsResponse {
  success: boolean;
  data: Report[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export const getReports = async (params?: {
  page?: number;
  limit?: number;
  seen?: boolean;
}): Promise<ReportsResponse> => {
  const queryParams = new URLSearchParams();
  if (params?.page) queryParams.append("page", params.page.toString());
  if (params?.limit) queryParams.append("limit", params.limit.toString());
  if (params?.seen !== undefined) queryParams.append("seen", params.seen.toString());

  const queryString = queryParams.toString();
  const endpoint = `/reports${queryString ? `?${queryString}` : ""}`;
  const response = await adminApiRequest(endpoint);
  return response.json();
};

export const markReportSeen = async (id: string): Promise<{ success: boolean; message: string }> => {
  const response = await adminApiRequest(`/reports/${id}/seen`, {
    method: "POST",
  });
  return response.json();
};

export const deleteReport = async (id: string): Promise<{ success: boolean; message: string }> => {
  const response = await adminApiRequest(`/reports/${id}`, {
    method: "DELETE",
  });
  return response.json();
};

// ==================== VERIFICATION ====================
export interface VerificationRequest {
  request_id: string;
  user_id?: string;
  page_id?: string;
  type: "user" | "page";
  status: string;
  submitted_at: string;
}

export interface VerificationRequestsResponse {
  success: boolean;
  data: VerificationRequest[];
}

export const getVerificationRequests = async (): Promise<VerificationRequestsResponse> => {
  const response = await adminApiRequest("/verification/requests");
  return response.json();
};

export const approveVerification = async (id: string): Promise<{ success: boolean; message: string }> => {
  const response = await adminApiRequest(`/verification/requests/${id}/approve`, {
    method: "POST",
  });
  return response.json();
};

export const rejectVerification = async (id: string): Promise<{ success: boolean; message: string }> => {
  const response = await adminApiRequest(`/verification/requests/${id}/reject`, {
    method: "POST",
  });
  return response.json();
};

export const getVerifiedUsers = async (): Promise<{ success: boolean; data: User[] }> => {
  const response = await adminApiRequest("/verification/users");
  return response.json();
};

export const getVerifiedPages = async (): Promise<{ success: boolean; data: Page[] }> => {
  const response = await adminApiRequest("/verification/pages");
  return response.json();
};

export const removeVerification = async (type: "user" | "page", id: string): Promise<{ success: boolean; message: string }> => {
  const response = await adminApiRequest(`/verification/${type}/${id}`, {
    method: "DELETE",
  });
  return response.json();
};

// ==================== SETTINGS ====================
export interface Settings {
  site_name: string;
  site_title: string;
  site_email: string;
  site_keywords: string;
  site_description: string;
  default_language: string;
  default_timezone: string;
  [key: string]: any;
}

export const getSettings = async (): Promise<{ success: boolean; data: Settings }> => {
  const response = await adminApiRequest("/settings");
  return response.json();
};

export const updateSettings = async (settings: Partial<Settings>): Promise<{ success: boolean; message: string }> => {
  const response = await adminApiRequest("/settings", {
    method: "PUT",
    body: JSON.stringify(settings),
  });
  return response.json();
};

export const getRegistrationSettings = async (): Promise<{ success: boolean; data: any }> => {
  const response = await adminApiRequest("/settings/registration");
  return response.json();
};

export const updateRegistrationSettings = async (settings: any): Promise<{ success: boolean; message: string }> => {
  const response = await adminApiRequest("/settings/registration", {
    method: "PUT",
    body: JSON.stringify(settings),
  });
  return response.json();
};

// ==================== WALLET ====================
export interface WalletPaymentRequest {
  request_id: string;
  user_id: string;
  amount: number;
  status: string;
  requested_at: string;
}

export interface WalletPaymentsResponse {
  success: boolean;
  data: WalletPaymentRequest[];
}

export const getWalletPayments = async (): Promise<WalletPaymentsResponse> => {
  const response = await adminApiRequest("/wallet/payments");
  return response.json();
};

export const approveWalletPayment = async (id: string): Promise<{ success: boolean; message: string }> => {
  const response = await adminApiRequest(`/wallet/payments/${id}/approve`, {
    method: "POST",
  });
  return response.json();
};

export const rejectWalletPayment = async (id: string): Promise<{ success: boolean; message: string }> => {
  const response = await adminApiRequest(`/wallet/payments/${id}/reject`, {
    method: "POST",
  });
  return response.json();
};

// ==================== ADS ====================
export interface UserAd {
  ad_id: string;
  user_id: string;
  title: string;
  description: string;
  status: string;
  created_at: string;
}

export interface SystemAd {
  ad_id: string;
  title: string;
  description: string;
  image_url: string;
  link_url: string;
  active: boolean;
  created_at: string;
}

export const getUsersAds = async (): Promise<{ success: boolean; data: UserAd[] }> => {
  const response = await adminApiRequest("/ads/users");
  return response.json();
};

export const approveUserAd = async (id: string): Promise<{ success: boolean; message: string }> => {
  const response = await adminApiRequest(`/ads/users/${id}/approve`, {
    method: "POST",
  });
  return response.json();
};

export const declineUserAd = async (id: string): Promise<{ success: boolean; message: string }> => {
  const response = await adminApiRequest(`/ads/users/${id}/decline`, {
    method: "POST",
  });
  return response.json();
};

export const getSystemAds = async (): Promise<{ success: boolean; data: SystemAd[] }> => {
  const response = await adminApiRequest("/ads/system");
  return response.json();
};

export const getSystemAd = async (id: string): Promise<{ success: boolean; data: SystemAd }> => {
  const response = await adminApiRequest(`/ads/system/${id}`);
  return response.json();
};

export const createSystemAd = async (ad: Partial<SystemAd>): Promise<{ success: boolean; message: string; data: SystemAd }> => {
  const response = await adminApiRequest("/ads/system", {
    method: "POST",
    body: JSON.stringify(ad),
  });
  return response.json();
};

export const updateSystemAd = async (id: string, ad: Partial<SystemAd>): Promise<{ success: boolean; message: string }> => {
  const response = await adminApiRequest(`/ads/system/${id}`, {
    method: "PUT",
    body: JSON.stringify(ad),
  });
  return response.json();
};

export const deleteSystemAd = async (id: string): Promise<{ success: boolean; message: string }> => {
  const response = await adminApiRequest(`/ads/system/${id}`, {
    method: "DELETE",
  });
  return response.json();
};

// ==================== PRO SYSTEM ====================
export interface ProPackage {
  package_id: string;
  name: string;
  description: string;
  price: number;
  duration: number;
  features: string[];
  active: boolean;
}

export interface ProSubscriber {
  subscription_id: string;
  user_id: string;
  package_id: string;
  start_date: string;
  end_date: string;
  status: string;
}

export const getPackages = async (): Promise<{ success: boolean; data: ProPackage[] }> => {
  const response = await adminApiRequest("/pro/packages");
  return response.json();
};

export const getPackage = async (id: string): Promise<{ success: boolean; data: ProPackage }> => {
  const response = await adminApiRequest(`/pro/packages/${id}`);
  return response.json();
};

export const createPackage = async (pkg: Partial<ProPackage>): Promise<{ success: boolean; message: string; data: ProPackage }> => {
  const response = await adminApiRequest("/pro/packages", {
    method: "POST",
    body: JSON.stringify(pkg),
  });
  return response.json();
};

export const updatePackage = async (id: string, pkg: Partial<ProPackage>): Promise<{ success: boolean; message: string }> => {
  const response = await adminApiRequest(`/pro/packages/${id}`, {
    method: "PUT",
    body: JSON.stringify(pkg),
  });
  return response.json();
};

export const deletePackage = async (id: string): Promise<{ success: boolean; message: string }> => {
  const response = await adminApiRequest(`/pro/packages/${id}`, {
    method: "DELETE",
  });
  return response.json();
};

export const getSubscribers = async (): Promise<{ success: boolean; data: ProSubscriber[] }> => {
  const response = await adminApiRequest("/pro/subscribers");
  return response.json();
};

// ==================== AFFILIATES ====================
export interface AffiliatePayment {
  payment_id: string;
  user_id: string;
  amount: number;
  status: string;
  requested_at: string;
}

export interface AffiliateStats {
  total_affiliates: number;
  total_earnings: number;
  month_earnings: number;
  pending_payments: number;
  pending_amount: number;
  approved_payments: number;
  approved_amount: number;
  top_affiliates: Array<{
    user_id: string;
    user_name: string;
    user_firstname: string;
    user_lastname: string;
    user_picture: string;
    total_payments: number;
    total_earnings: number;
  }>;
}

export interface AffiliatePayment {
  payment_id: string;
  user_id: string;
  amount: number;
  status: string;
  requested_at: string;
  method?: string;
  method_details?: string;
  user_name?: string;
  user_firstname?: string;
  user_lastname?: string;
  user_picture?: string;
  user_email?: string;
}

export const getAffiliatePayments = async (status?: "pending" | "approved" | "rejected" | "all"): Promise<{ success: boolean; data: AffiliatePayment[] }> => {
  const queryParams = new URLSearchParams();
  if (status) queryParams.append("status", status);
  
  const queryString = queryParams.toString();
  const endpoint = `/affiliates/payments${queryString ? `?${queryString}` : ""}`;
  const response = await adminApiRequest(endpoint);
  return response.json();
};

export const approveAffiliatePayment = async (id: string): Promise<{ success: boolean; message: string }> => {
  const response = await adminApiRequest(`/affiliates/payments/${id}/approve`, {
    method: "POST",
  });
  return response.json();
};

export const rejectAffiliatePayment = async (id: string): Promise<{ success: boolean; message: string }> => {
  const response = await adminApiRequest(`/affiliates/payments/${id}/reject`, {
    method: "POST",
  });
  return response.json();
};

export const getAffiliateStats = async (): Promise<{ success: boolean; data: AffiliateStats }> => {
  const response = await adminApiRequest("/affiliates/stats");
  return response.json();
};

// ==================== POINTS ====================
export interface PointsPayment {
  payment_id: string;
  user_id: string;
  points: number;
  cbc_amount?: number;
  usd_amount?: number;
  amount: number;
  status: string;
  requested_at: string;
  method?: string;
  method_details?: string;
  user_name?: string;
  user_firstname?: string;
  user_lastname?: string;
  user_picture?: string;
  user_email?: string;
}

export interface PointsStats {
  total_points: number;
  total_cbc: number;
  total_usd: number;
  month_points: number;
  month_cbc: number;
  pending_payments: number;
  pending_points: number;
  approved_payments: number;
  approved_points: number;
  conversion_rate: number; // 100 points = 1 CBC
  cbc_to_usd_rate: number; // 1 CBC = $8.231
  earning_rates: {
    likes: number;
    comments: number;
    shares: number;
    posts: number;
    stories: number;
    events: number;
    service_requests: number;
    referrals: number;
    profile_completion: number;
    check_ins: number;
    reviews: number;
  };
  top_earners: Array<{
    user_id: string;
    user_name: string;
    user_firstname: string;
    user_lastname: string;
    user_picture: string;
    total_points: number;
    total_cbc: number;
    total_payments: number;
  }>;
}

export const getPointsPayments = async (status?: "pending" | "approved" | "rejected" | "all"): Promise<{ success: boolean; data: PointsPayment[] }> => {
  const queryParams = new URLSearchParams();
  if (status) queryParams.append("status", status);
  
  const queryString = queryParams.toString();
  const endpoint = `/points/payments${queryString ? `?${queryString}` : ""}`;
  const response = await adminApiRequest(endpoint);
  return response.json();
};

export interface UserPointsBalance {
  user_id: string;
  user_name: string;
  user_firstname: string;
  user_lastname: string;
  user_picture: string;
  user_email: string;
  user_verified: boolean;
  user_approved: boolean;
  starting_balance: number;
  starting_cbc: number;
  earned_from_activities: number;
  earned_from_redemptions: number;
  total_points: number;
  total_cbc: number;
  total_usd: number;
  total_redemptions: number;
  earnings_breakdown: {
    posts: { count: number; points: number; cbc: number };
    likes: { count: number; points: number; cbc: number };
    comments: { count: number; points: number; cbc: number };
    recent_activity_bonus: { count: number; points: number; cbc: number };
  };
}

export const getUserPointsBalances = async (status?: "all" | "approved" | "pending", search?: string): Promise<{ success: boolean; data: UserPointsBalance[] }> => {
  const queryParams = new URLSearchParams();
  if (status) queryParams.append("status", status);
  if (search && search.trim()) queryParams.append("search", search.trim());
  
  const queryString = queryParams.toString();
  const endpoint = `/points/users${queryString ? `?${queryString}` : ""}`;
  const response = await adminApiRequest(endpoint);
  return response.json();
};

export const getPointsStats = async (): Promise<{ success: boolean; data: PointsStats }> => {
  const response = await adminApiRequest("/points/stats");
  return response.json();
};

export const approvePointsPayment = async (id: string): Promise<{ success: boolean; message: string }> => {
  const response = await adminApiRequest(`/points/payments/${id}/approve`, {
    method: "POST",
  });
  return response.json();
};

export const rejectPointsPayment = async (id: string): Promise<{ success: boolean; message: string }> => {
  const response = await adminApiRequest(`/points/payments/${id}/reject`, {
    method: "POST",
  });
  return response.json();
};

// ==================== MARKET ====================
export interface MarketProduct {
  product_id: string;
  seller_id: string;
  title: string;
  description: string;
  price: number;
  category_id: string;
  status: string;
  created_at: string;
}

export interface MarketOrder {
  order_id: string;
  buyer_id: string;
  product_id: string;
  quantity: number;
  total_price: number;
  status: string;
  created_at: string;
}

export interface MarketCategory {
  category_id: string;
  name: string;
  description: string;
  active: boolean;
}

export const getProducts = async (): Promise<{ success: boolean; data: MarketProduct[] }> => {
  const response = await adminApiRequest("/market/products");
  return response.json();
};

export const deleteProduct = async (id: string): Promise<{ success: boolean; message: string }> => {
  const response = await adminApiRequest(`/market/products/${id}`, {
    method: "DELETE",
  });
  return response.json();
};

export const getOrders = async (): Promise<{ success: boolean; data: MarketOrder[] }> => {
  const response = await adminApiRequest("/market/orders");
  return response.json();
};

export const getMarketCategories = async (): Promise<{ success: boolean; data: MarketCategory[] }> => {
  const response = await adminApiRequest("/market/categories");
  return response.json();
};

export const createMarketCategory = async (category: Partial<MarketCategory>): Promise<{ success: boolean; message: string; data: MarketCategory }> => {
  const response = await adminApiRequest("/market/categories", {
    method: "POST",
    body: JSON.stringify(category),
  });
  return response.json();
};

export const updateMarketCategory = async (id: string, category: Partial<MarketCategory>): Promise<{ success: boolean; message: string }> => {
  const response = await adminApiRequest(`/market/categories/${id}`, {
    method: "PUT",
    body: JSON.stringify(category),
  });
  return response.json();
};

export const deleteMarketCategory = async (id: string): Promise<{ success: boolean; message: string }> => {
  const response = await adminApiRequest(`/market/categories/${id}`, {
    method: "DELETE",
  });
  return response.json();
};

export const getMarketPayments = async (): Promise<{ success: boolean; data: any[] }> => {
  const response = await adminApiRequest("/market/payments");
  return response.json();
};

export const approveMarketPayment = async (id: string): Promise<{ success: boolean; message: string }> => {
  const response = await adminApiRequest(`/market/payments/${id}/approve`, {
    method: "POST",
  });
  return response.json();
};

// ==================== FUNDING ====================
export interface FundingRequest {
  request_id: string;
  user_id: string;
  title: string;
  description: string;
  target_amount: number;
  current_amount: number;
  status: string;
  created_at: string;
}

export const getFundingRequests = async (): Promise<{ success: boolean; data: FundingRequest[] }> => {
  const response = await adminApiRequest("/funding/requests");
  return response.json();
};

export const deleteFundingRequest = async (id: string): Promise<{ success: boolean; message: string }> => {
  const response = await adminApiRequest(`/funding/requests/${id}`, {
    method: "DELETE",
  });
  return response.json();
};

export const getFundingPayments = async (): Promise<{ success: boolean; data: any[] }> => {
  const response = await adminApiRequest("/funding/payments");
  return response.json();
};

export const approveFundingPayment = async (id: string): Promise<{ success: boolean; message: string }> => {
  const response = await adminApiRequest(`/funding/payments/${id}/approve`, {
    method: "POST",
  });
  return response.json();
};

// ==================== MONETIZATION ====================
export interface MonetizationPayment {
  payment_id: string;
  user_id: string;
  amount: number;
  status: string;
  requested_at: string;
}

export interface MonetizationStats {
  total_earnings: number;
  pending_payments: number;
  completed_payments: number;
}

export const getMonetizationPayments = async (): Promise<{ success: boolean; data: MonetizationPayment[] }> => {
  const response = await adminApiRequest("/monetization/payments");
  return response.json();
};

export const approveMonetizationPayment = async (id: string): Promise<{ success: boolean; message: string }> => {
  const response = await adminApiRequest(`/monetization/payments/${id}/approve`, {
    method: "POST",
  });
  return response.json();
};

export const rejectMonetizationPayment = async (id: string): Promise<{ success: boolean; message: string }> => {
  const response = await adminApiRequest(`/monetization/payments/${id}/reject`, {
    method: "POST",
  });
  return response.json();
};

export const getMonetizationStats = async (): Promise<{ success: boolean; data: MonetizationStats }> => {
  const response = await adminApiRequest("/monetization/stats");
  return response.json();
};

// ==================== ADMIN AUTH (Registration Approvals) ====================
export const rejectAccount = async (user_id: string, reason?: string): Promise<{ success: boolean; message: string }> => {
  const response = await adminApiRequest(`/auth/reject`, {
    method: "POST",
    body: JSON.stringify({ user_id, reason }),
  });
  return response.json();
};

// ==================== ADMIN NOTIFICATIONS ====================
export interface AdminNotificationPayload {
  target: "all" | "user";
  user_id?: number;
  title: string;
  message: string;
  notification_type: "normal" | "info" | "success" | "warning" | "danger";
  show_on_landing?: boolean;
  expires_at?: string | null;
}

export interface AdminNotificationItem {
  id: number;
  to_user_id?: number | null;
  title?: string | null;
  message?: string | null;
  notification_type?: string;
  is_global?: boolean;
  show_on_landing?: boolean;
  time: string;
  user_firstname?: string | null;
  user_lastname?: string | null;
  user_email?: string | null;
}

export const sendAdminNotification = async (
  payload: AdminNotificationPayload
): Promise<{ success: boolean; message: string; data: AdminNotificationItem }> => {
  const response = await adminApiRequest("/notifications", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return response.json();
};

export const getAdminNotifications = async (
  limit: number = 50
): Promise<{ success: boolean; data: AdminNotificationItem[] }> => {
  const response = await adminApiRequest(`/notifications?limit=${limit}`);
  return response.json();
};

export const updateAdminNotification = async (
  id: number,
  payload: Omit<AdminNotificationPayload, "target" | "user_id">
): Promise<{ success: boolean; message: string; data: AdminNotificationItem }> => {
  const response = await adminApiRequest(`/notifications/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
  return response.json();
};

export const deleteAdminNotification = async (
  id: number
): Promise<{ success: boolean; message: string }> => {
  const response = await adminApiRequest(`/notifications/${id}`, {
    method: "DELETE",
  });
  return response.json();
};

