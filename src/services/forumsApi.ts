import { apiUrl } from "../api/config";

const getToken = (): string | null =>
  localStorage.getItem("token") || localStorage.getItem("authToken");

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<{ success: boolean; data?: T; message?: string }> {
  const token = getToken();
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };
  if (token) {
    (headers as Record<string, string>)["Authorization"] = `Bearer ${token}`;
  }
  const res = await fetch(apiUrl(`/forums${path}`), {
    ...options,
    headers,
  });
  let body: unknown = {};
  try {
    const text = await res.text();
    body = text ? JSON.parse(text) : {};
  } catch {
    body = {};
  }
  const record = body as { success?: boolean; data?: T; message?: string };
  if (!res.ok) {
    return {
      success: false,
      message: record.message || `Request failed (${res.status})`,
    };
  }
  return { success: record.success !== false, data: record.data, message: record.message };
}

export type ForumVisibility = "public" | "private";

export interface ApiForumAdminPreview {
  userId: number;
  displayName: string;
}

export interface ApiForumSummary {
  id: number;
  name: string;
  description: string;
  category: string;
  visibility: ForumVisibility;
  createdAt: string;
  creatorId: number;
  memberCount: number;
  postCount: number;
  inviteToken?: string | null;
  repliesLocked?: boolean;
  backgroundColor?: string;
  backgroundImage?: string;
  backgroundOpacity?: number;
  joinRequired?: boolean;
  suspended?: boolean;
  creatorName?: string;
  creatorAvatar?: string;
  adminsPreview?: ApiForumAdminPreview[];
}

export interface ApiForumMessage {
  id: number;
  senderId: number;
  senderName: string;
  text: string;
  timestamp: string;
  attachment?: {
    type: string;
    url: string;
    fileName?: string;
    fileSize?: number;
  };
}

export interface ApiForumMemberRow {
  user_id: number;
  role: string;
  can_post: boolean;
  displayName?: string;
}

export interface ApiForumDetail extends ApiForumSummary {
  messages: ApiForumMessage[];
  members: number[];
  admins: number[];
  creatorName?: string;
  canPost?: boolean;
  isAdmin?: boolean;
  currentRole?: string;
  memberDetails?: ApiForumMemberRow[];
  adminsPreview?: ApiForumAdminPreview[];
}

export const forumsApi = {
  list(tab: "discover" | "joined" | "mine") {
    const path = tab === "mine" ? "/mine" : tab === "joined" ? "/joined" : "/discover";
    return request<ApiForumSummary[]>(path);
  },

  getById(id: number) {
    return request<ApiForumDetail>(`/${id}`);
  },

  create(payload: {
    name: string;
    description: string;
    category: string;
    visibility: ForumVisibility;
    backgroundColor?: string;
    backgroundImage?: string;
    backgroundOpacity?: number;
  }) {
    return request<ApiForumSummary>("/", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  update(
    id: number,
    payload: Partial<{
      name: string;
      description: string;
      category: string;
      backgroundColor: string;
      backgroundImage: string;
      backgroundOpacity: number;
    }>
  ) {
    return request<ApiForumSummary>(`/${id}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
  },

  remove(id: number) {
    return request<unknown>(`/${id}`, { method: "DELETE" });
  },

  joinPublic(id: number) {
    return request<unknown>(`/${id}/join`, { method: "POST", body: "{}" });
  },

  joinByInviteToken(token: string) {
    return request<{ forumId: number }>(`/join-invite`, {
      method: "POST",
      body: JSON.stringify({ token }),
    });
  },

  leave(id: number) {
    return request<unknown>(`/${id}/leave`, { method: "POST", body: "{}" });
  },

  sendMessage(
    forumId: number,
    payload: { text: string; attachment?: ApiForumMessage["attachment"] }
  ) {
    return request<ApiForumMessage>(`/${forumId}/messages`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  removeMember(forumId: number, userId: number) {
    return request<unknown>(`/${forumId}/members/${userId}`, { method: "DELETE" });
  },

  patchMember(
    forumId: number,
    userId: number,
    body: Partial<{ role: "admin" | "member"; canPost: boolean }>
  ) {
    return request<unknown>(`/${forumId}/members/${userId}`, {
      method: "PATCH",
      body: JSON.stringify({
        role: body.role,
        canPost: body.canPost,
      }),
    });
  },

  setSettings(forumId: number, repliesLocked: boolean) {
    return request<ApiForumSummary>(`/${forumId}/settings`, {
      method: "PATCH",
      body: JSON.stringify({ repliesLocked }),
    });
  },

  regenerateInvite(forumId: number) {
    return request<{ inviteToken: string }>(`/${forumId}/invite/regenerate`, {
      method: "POST",
      body: "{}",
    });
  },

  addMemberById(forumId: number, userId: number) {
    return request<unknown>(`/${forumId}/members`, {
      method: "POST",
      body: JSON.stringify({ userId }),
    });
  },
};
