import type { ApiForumDetail, ApiForumSummary } from "../../services/forumsApi";

export interface ForumMessage {
  id: number;
  senderId: number;
  senderName: string;
  senderAvatar?: string;
  text: string;
  timestamp: string;
  attachment?: {
    type: "image" | "video" | "file";
    url: string;
    fileName?: string;
    fileSize?: number;
  };
}

export interface ForumMemberDetail {
  userId: number;
  role: "admin" | "member";
  canPost: boolean;
  displayName?: string;
}

export interface ForumAdminPreview {
  userId: number;
  displayName: string;
}

export interface Forum {
  id: number;
  name: string;
  description: string;
  category: string;
  createdAt: string;
  memberCount: number;
  postCount: number;
  creatorId: number;
  creatorName: string;
  creatorAvatar?: string;
  adminsPreview: ForumAdminPreview[];
  suspended?: boolean;
  messages: ForumMessage[];
  members: number[];
  admins: number[];
  memberDetails?: ForumMemberDetail[];
  backgroundColor?: string;
  backgroundImage?: string;
  backgroundOpacity?: number;
  visibility: "public" | "private";
  inviteToken?: string | null;
  repliesLocked?: boolean;
  canPost?: boolean;
  joinRequired?: boolean;
  isAdmin?: boolean;
}

export function formatForumTime(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  } catch {
    return iso;
  }
}

/** DB `user_name` values are often `handle_userId`; strip the suffix for forum UI. */
export function stripForumDisplayHandle(name: string): string {
  const t = name.trim();
  if (!t) return t;
  return t.replace(/_(\d+)$/u, "").trim() || t;
}

export function mapApiSummaryToForum(row: ApiForumSummary): Forum {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    category: row.category,
    createdAt: row.createdAt,
    memberCount: row.memberCount,
    postCount: row.postCount,
    creatorId: row.creatorId,
    creatorName: stripForumDisplayHandle(row.creatorName?.trim() || `User ${row.creatorId}`),
    creatorAvatar: row.creatorAvatar,
    adminsPreview: (row.adminsPreview || []).map((a) => ({
      userId: a.userId,
      displayName: stripForumDisplayHandle(a.displayName),
    })),
    suspended: row.suspended === true,
    messages: [],
    members: [],
    admins: [],
    backgroundColor: row.backgroundColor,
    backgroundImage: row.backgroundImage,
    backgroundOpacity: row.backgroundOpacity,
    visibility: row.visibility ?? "public",
    inviteToken: row.inviteToken ?? undefined,
    repliesLocked: row.repliesLocked ?? false,
    joinRequired: row.joinRequired,
  };
}

function mapMemberDetails(
  raw: ApiForumDetail["memberDetails"]
): ForumMemberDetail[] | undefined {
  if (!raw?.length) return undefined;
  return raw.map((m) => ({
    userId: m.user_id,
    role: m.role === "admin" ? "admin" : "member",
    canPost: m.can_post,
    displayName: m.displayName ? stripForumDisplayHandle(m.displayName) : undefined,
  }));
}

export function mapApiDetailToForum(d: ApiForumDetail): Forum {
  const messages: ForumMessage[] = (d.messages || []).map((m) => ({
    id: m.id,
    senderId: m.senderId,
    senderName: stripForumDisplayHandle(m.senderName),
    text: m.text,
    timestamp: formatForumTime(m.timestamp),
    attachment: m.attachment as ForumMessage["attachment"],
  }));
  return {
    id: d.id,
    name: d.name,
    description: d.description,
    category: d.category,
    createdAt: d.createdAt,
    memberCount: d.memberCount,
    postCount: d.postCount,
    creatorId: d.creatorId,
    creatorName: stripForumDisplayHandle(d.creatorName?.trim() || `User ${d.creatorId}`),
    creatorAvatar: d.creatorAvatar,
    adminsPreview: (d.adminsPreview || []).map((a) => ({
      userId: a.userId,
      displayName: stripForumDisplayHandle(a.displayName),
    })),
    suspended: d.suspended === true,
    messages,
    members: d.members || [],
    admins: d.admins || [],
    memberDetails: mapMemberDetails(d.memberDetails),
    backgroundColor: d.backgroundColor,
    backgroundImage: d.backgroundImage,
    backgroundOpacity: d.backgroundOpacity,
    visibility: d.visibility ?? "public",
    inviteToken: d.inviteToken ?? undefined,
    repliesLocked: d.repliesLocked ?? false,
    canPost: d.canPost,
    joinRequired: d.joinRequired,
    isAdmin: d.isAdmin,
  };
}
