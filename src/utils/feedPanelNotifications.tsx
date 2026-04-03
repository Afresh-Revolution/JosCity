import {
  Bell,
  Info,
  CheckCircle2,
  AlertTriangle,
  AlertOctagon,
  Heart,
  MessageSquare,
  MessageCircle,
  UserCheck,
  Hash,
  ThumbsUp,
  Calendar,
} from "lucide-react";
import { normalizeAdminBroadcastType } from "../components/AdminBroadcastStrip";

export interface FeedPanelNotification {
  id: number;
  type:
    | "like"
    | "comment"
    | "friend_request"
    | "mention"
    | "share"
    | "event"
    | "message"
    | "danger";
  nodeType?: string;
  createdByAdmin?: boolean;
  notificationType?: string;
  title?: string | null;
  expiresAt?: string | null;
  userId: number;
  userName: string;
  userAvatar: string;
  message: string;
  timestamp: string;
  isRead: boolean;
  relatedPostId?: number;
  relatedEventId?: number;
  relatedChatId?: number;
  /** friend_requests.request_id when type is friend_request */
  relatedFriendRequestId?: number;
}

export function mapApiRowToFeedPanelNotification(n: {
  id: number;
  from_user_id?: number;
  action: string;
  title?: string;
  message?: string;
  notification_type?: string;
  node_type?: string;
  node_id?: number;
  time: string;
  is_read?: boolean;
  is_global?: boolean;
  created_by_admin?: boolean;
  expires_at?: string | null;
  from_user?: { display_name?: string; profile_image_url?: string };
}): FeedPanelNotification {
  const item = n;
  const isAdminBroadcast =
    item.node_type === "admin_notification" || !!item.created_by_admin;
  const rawType = String(item.notification_type || "normal").toLowerCase();
  const typeForFeed: FeedPanelNotification["type"] = isAdminBroadcast
    ? rawType === "danger"
      ? "danger"
      : "mention"
    : item.notification_type === "danger"
      ? "danger"
      : n.action?.toLowerCase().includes("like") ||
          n.action?.toLowerCase().includes("react")
        ? "like"
        : n.action?.toLowerCase().includes("comment")
          ? "comment"
          : n.action?.toLowerCase().includes("friend_request")
            ? "friend_request"
            : n.action?.toLowerCase().includes("share")
              ? "share"
              : "mention";

  const relatedFriendRequestId =
    (typeForFeed === "friend_request" || item.node_type === "friend_request") &&
    n.node_id != null
      ? Number(n.node_id)
      : undefined;

  return {
    id: n.id,
    type: typeForFeed,
    nodeType: item.node_type,
    createdByAdmin: !!item.created_by_admin,
    notificationType: item.notification_type || "normal",
    title: item.title ?? null,
    expiresAt: item.expires_at ?? null,
    userId: n.from_user_id ?? 0,
    userName:
      n.from_user?.display_name ??
      (item.is_global || isAdminBroadcast ? "Admin" : "Someone"),
    userAvatar: n.from_user?.profile_image_url ?? "",
    message: item.message || n.action || "",
    timestamp: n.time ?? "",
    isRead: !!n.is_read,
    relatedPostId: n.node_type === "post" ? n.node_id : undefined,
    relatedFriendRequestId,
  };
}

export function getFeedPanelNotificationIcon(n: FeedPanelNotification) {
  if (n.nodeType === "admin_notification" || n.createdByAdmin) {
    const t = normalizeAdminBroadcastType(n.notificationType);
    switch (t) {
      case "info":
        return <Info size={20} />;
      case "success":
        return <CheckCircle2 size={20} />;
      case "warning":
        return <AlertTriangle size={20} />;
      case "danger":
        return <AlertOctagon size={20} />;
      default:
        return <Bell size={20} />;
    }
  }
  switch (n.type) {
    case "like":
      return <Heart size={20} />;
    case "comment":
      return <MessageSquare size={20} />;
    case "message":
      return <MessageCircle size={20} />;
    case "friend_request":
      return <UserCheck size={20} />;
    case "mention":
      return <Hash size={20} />;
    case "share":
      return <ThumbsUp size={20} />;
    case "event":
      return <Calendar size={20} />;
    case "danger":
      return <AlertTriangle size={20} />;
    default:
      return <Bell size={20} />;
  }
}

export function getFeedPanelNotificationColor(n: FeedPanelNotification) {
  if (n.nodeType === "admin_notification" || n.createdByAdmin) {
    const t = normalizeAdminBroadcastType(n.notificationType);
    switch (t) {
      case "info":
        return "#0288d1";
      case "success":
        return "#2e7d32";
      case "warning":
        return "#f57c00";
      case "danger":
        return "#c62828";
      default:
        return "#5c6bc0";
    }
  }
  switch (n.type) {
    case "like":
      return "#e91e63";
    case "comment":
      return "#2196f3";
    case "message":
      return "#10b981";
    case "friend_request":
      return "#4caf50";
    case "mention":
      return "#ff9800";
    case "share":
      return "#9c27b0";
    case "event":
      return "#00bcd4";
    case "danger":
      return "#d32f2f";
    default:
      return "#666";
  }
}
