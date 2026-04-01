import { io, type Socket } from "socket.io-client";
import API_BASE_URL from "../api/config";

type ChatEventName =
  | "new_message"
  | "message_edited"
  | "message_deleted"
  | "user_typing"
  | "user_stop_typing"
  | "messages_read"
  | "user_joined"
  | "user_left"
  | "new_message_notification";

export interface ChatParticipant {
  userId: number;
  username: string;
  avatar?: string;
  isOnline?: boolean;
}

export interface ChatConversation {
  conversationId: number;
  conversationType: "direct" | "group";
  conversationName: string;
  otherUserId?: number;
  otherUsername?: string;
  otherAvatar?: string;
  lastMessageContent: string;
  lastMessageAt?: string;
  unreadCount: number;
  isOnline: boolean;
  participantCount?: number;
}

export interface ChatMessage {
  messageId: number;
  conversationId: number;
  senderId: number;
  username: string;
  senderAvatar?: string;
  messageContent: string;
  messageType: string;
  replyToId?: number | null;
  isEdited: boolean;
  isDeleted: boolean;
  createdAt: string;
  updatedAt?: string;
  isRead: boolean;
  readAt?: string;
}

export interface ChatMessageNotification {
  messageId?: number;
  conversationId: number;
  senderId: number;
  senderUsername: string;
  senderAvatar?: string;
  messageContent: string;
  createdAt?: string;
}

type JsonRecord = Record<string, unknown>;
type SocketCallback<T = unknown> = (payload: T) => void;

const CHAT_BASE_PATH = "/chat";

const getToken = (): string | null =>
  localStorage.getItem("token") || localStorage.getItem("authToken");

const pickString = (...values: unknown[]): string | undefined => {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return undefined;
};

const pickNumber = (...values: unknown[]): number | undefined => {
  for (const value of values) {
    if (typeof value === "number" && Number.isFinite(value)) return value;
    if (typeof value === "string" && value.trim() && !Number.isNaN(Number(value))) {
      return Number(value);
    }
  }
  return undefined;
};

const pickBoolean = (...values: unknown[]): boolean | undefined => {
  for (const value of values) {
    if (typeof value === "boolean") return value;
    if (typeof value === "number") return value > 0;
    if (typeof value === "string") {
      const normalized = value.trim().toLowerCase();
      if (["true", "1", "yes"].includes(normalized)) return true;
      if (["false", "0", "no"].includes(normalized)) return false;
    }
  }
  return undefined;
};

const toRecord = (value: unknown): JsonRecord =>
  value && typeof value === "object" ? (value as JsonRecord) : {};

const getSocketBaseUrl = (): string => {
  if (/^https?:\/\//i.test(API_BASE_URL)) {
    return new URL(API_BASE_URL).origin;
  }
  return window.location.origin;
};

const extractErrorMessage = (value: unknown, fallback: string): string => {
  if (typeof value === "string" && value.trim()) return value;
  if (value && typeof value === "object") {
    const record = value as JsonRecord;
    return (
      extractErrorMessage(record.message, "") ||
      extractErrorMessage(record.error, "") ||
      fallback
    );
  }
  return fallback;
};

const normalizeConversationType = (value: unknown): "direct" | "group" =>
  pickString(value)?.toLowerCase() === "group" ? "group" : "direct";

export const normalizeChatConversation = (value: unknown): ChatConversation | null => {
  const record = toRecord(value);
  const otherUser = toRecord(record.other_user ?? record.otherUser);
  const conversationId = pickNumber(
    record.conversationId,
    record.conversation_id,
    record.id
  );

  if (conversationId == null) return null;

  const conversationType = normalizeConversationType(
    record.conversation_type ?? record.conversationType ?? record.type
  );
  const conversationName =
    pickString(
      record.conversation_name,
      record.conversationName,
      record.group_name,
      record.groupName,
      record.other_username,
      record.otherUsername,
      otherUser.username,
      otherUser.display_name,
      record.username,
      record.name
    ) || "Conversation";

  const otherUsername = pickString(
    record.other_username,
    record.otherUsername,
    otherUser.username,
    otherUser.display_name,
    otherUser.name
  );

  return {
    conversationId,
    conversationType,
    conversationName,
    otherUserId: pickNumber(
      record.other_user_id,
      record.otherUserId,
      otherUser.user_id,
      otherUser.id
    ),
    otherUsername,
    otherAvatar: pickString(
      record.other_avatar,
      record.otherAvatar,
      record.other_user_avatar,
      record.otherUserAvatar,
      otherUser.profile_image_url,
      otherUser.user_picture,
      otherUser.picture,
      otherUser.avatar
    ),
    lastMessageContent:
      pickString(
        record.last_message_content,
        record.lastMessageContent,
        record.last_message,
        record.lastMessage,
        record.latest_message_content,
        record.latestMessageContent
      ) || "",
    lastMessageAt: pickString(
      record.last_message_at,
      record.lastMessageAt,
      record.updated_at,
      record.updatedAt,
      record.created_at,
      record.createdAt
    ),
    unreadCount: pickNumber(record.unread_count, record.unreadCount) ?? 0,
    isOnline:
      pickBoolean(
        record.is_online,
        record.isOnline,
        record.other_user_online,
        record.otherUserOnline
      ) ?? false,
    participantCount:
      Array.isArray(record.participants)
        ? record.participants.length
        : pickNumber(
            record.participant_count,
            record.participants_count,
            record.participantCount,
            record.participantsCount
          ),
  };
};

export const normalizeChatMessage = (value: unknown): ChatMessage | null => {
  const record = toRecord(value);
  const sender = toRecord(record.sender ?? record.user ?? record.author);
  const messageId = pickNumber(record.messageId, record.message_id, record.id);

  if (messageId == null) return null;

  const messageContent =
    pickString(
      record.message_content,
      record.messageContent,
      record.content,
      record.text,
      record.message,
      record.body
    ) || "";
  const isDeleted =
    pickBoolean(record.is_deleted, record.isDeleted, record.deleted) ?? false;

  return {
    messageId,
    conversationId:
      pickNumber(
        record.conversationId,
        record.conversation_id,
        record.chat_id,
        record.chatId
      ) ?? 0,
    senderId:
      pickNumber(
        record.sender_id,
        record.senderId,
        sender.user_id,
        sender.userId,
        sender.id,
        record.user_id,
        record.userId
      ) ?? 0,
    username:
      pickString(
        record.username,
        record.sender_username,
        record.senderUsername,
        record.sender_name,
        record.senderName,
        sender.display_name,
        sender.username,
        sender.name,
        record.user_name,
        record.userName
      ) || "User",
    senderAvatar: pickString(
      record.sender_avatar,
      record.senderAvatar,
      record.user_avatar,
      record.userAvatar,
      sender.profile_image_url,
      sender.user_picture,
      sender.picture,
      sender.avatar
    ),
    messageContent: isDeleted && !messageContent ? "Message deleted" : messageContent,
    messageType:
      pickString(record.message_type, record.messageType, record.type) || "text",
    replyToId:
      pickNumber(record.reply_to_id, record.replyToId) ?? null,
    isEdited: pickBoolean(record.is_edited, record.isEdited) ?? false,
    isDeleted,
    createdAt:
      pickString(
        record.created_at,
        record.createdAt,
        record.sent_at,
        record.sentAt,
        record.timestamp
      ) || new Date().toISOString(),
    updatedAt: pickString(record.updated_at, record.updatedAt),
    isRead:
      pickBoolean(
        record.is_read,
        record.isRead,
        record.read_by_current_user,
        record.readByCurrentUser
      ) ?? Boolean(record.read_at ?? record.readAt),
    readAt: pickString(record.read_at, record.readAt),
  };
};

export const normalizeMessageNotification = (
  value: unknown
): ChatMessageNotification | null => {
  const record = toRecord(value);
  const normalizedMessage =
    normalizeChatMessage(record.message) ||
    normalizeChatMessage(record.data) ||
    normalizeChatMessage(record);

  if (normalizedMessage) {
    return {
      messageId: normalizedMessage.messageId,
      conversationId: normalizedMessage.conversationId,
      senderId: normalizedMessage.senderId,
      senderUsername: normalizedMessage.username,
      senderAvatar: normalizedMessage.senderAvatar,
      messageContent: normalizedMessage.messageContent,
      createdAt: normalizedMessage.createdAt,
    };
  }

  const conversationId = pickNumber(
    record.conversationId,
    record.conversation_id,
    record.chat_id,
    record.chatId
  );
  if (conversationId == null) return null;

  return {
    messageId: pickNumber(record.messageId, record.message_id, record.id),
    conversationId,
    senderId:
      pickNumber(
        record.senderId,
        record.sender_id,
        record.user_id,
        record.userId
      ) ?? 0,
    senderUsername:
      pickString(
        record.senderUsername,
        record.sender_username,
        record.username,
        record.user_name
      ) || "User",
    senderAvatar: pickString(
      record.senderAvatar,
      record.sender_avatar,
      record.user_avatar
    ),
    messageContent:
      pickString(
        record.messageContent,
        record.message_content,
        record.content,
        record.message
      ) || "",
    createdAt: pickString(record.created_at, record.createdAt, record.timestamp),
  };
};

class ChatService {
  private socket: Socket | null = null;
  private apiUnavailable = false;
  private socketUnavailable = false;
  private availabilityMessage =
    "Chat is not available on this server yet. Please deploy the chat backend and try again.";
  private hasLoggedSocketError = false;

  private get headers(): HeadersInit {
    const token = getToken();
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    return headers;
  }

  private async apiRequest<T = unknown>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    if (this.apiUnavailable) {
      throw new Error(this.availabilityMessage);
    }

    const response = await fetch(`${API_BASE_URL}${CHAT_BASE_PATH}${endpoint}`, {
      ...options,
      headers: {
        ...this.headers,
        ...((options.headers as Record<string, string>) || {}),
      },
      signal: AbortSignal.timeout(30000),
    });

    const contentType = response.headers.get("content-type") || "";
    const text = await response.text().catch(() => "");
    const payload =
      contentType.includes("application/json") && text.trim()
        ? (JSON.parse(text) as JsonRecord)
        : ({ message: text } as JsonRecord);

    if (!response.ok) {
      if (response.status === 404) {
        this.apiUnavailable = true;
        this.disconnect();
        throw new Error(this.availabilityMessage);
      }

      throw new Error(
        extractErrorMessage(
          payload,
          `Chat request failed with status ${response.status}`
        )
      );
    }

    return payload as T;
  }

  initializeSocket(): Socket | null {
    const token = getToken();
    if (!token || this.socketUnavailable || this.apiUnavailable) return null;

    if (this.socket) {
      if (!this.socket.connected) {
        this.socket.auth = { token };
        this.socket.connect();
      }
      return this.socket;
    }

    this.socket = io(getSocketBaseUrl(), {
      auth: { token },
      transports: ["polling", "websocket"],
      autoConnect: true,
      withCredentials: true,
      reconnectionAttempts: 1,
      timeout: 5000,
    });

    this.socket.on("connect_error", (error) => {
      this.socketUnavailable = true;
      if (!this.hasLoggedSocketError) {
        console.warn("Chat socket connection error:", error.message);
        this.hasLoggedSocketError = true;
      }
      this.disconnect();
    });

    return this.socket;
  }

  async createDirectConversation(
    otherUserId: number
  ): Promise<{ conversation: ChatConversation | null; isNew: boolean }> {
    const response = await this.apiRequest<JsonRecord>("/conversations/direct", {
      method: "POST",
      body: JSON.stringify({ otherUserId }),
    });

    const conversation =
      normalizeChatConversation(response.conversation) ||
      normalizeChatConversation(response.data) ||
      normalizeChatConversation(response);

    return {
      conversation,
      isNew: Boolean(response.isNew ?? response.is_new),
    };
  }

  async getUserConversations(
    page = 1,
    limit = 20
  ): Promise<{ conversations: ChatConversation[] }> {
    const response = await this.apiRequest<JsonRecord>(
      `/conversations?page=${page}&limit=${limit}`
    );
    const rawConversations = Array.isArray(response.conversations)
      ? response.conversations
      : Array.isArray(response.data)
        ? response.data
        : [];

    return {
      conversations: rawConversations
        .map((item) => normalizeChatConversation(item))
        .filter((item): item is ChatConversation => item !== null),
    };
  }

  async getConversation(
    conversationId: number,
    page = 1,
    limit = 50
  ): Promise<{
    conversation: ChatConversation | null;
    messages: ChatMessage[];
  }> {
    const response = await this.apiRequest<JsonRecord>(
      `/conversations/${conversationId}?page=${page}&limit=${limit}`
    );

    const rawMessages = Array.isArray(response.messages)
      ? response.messages
      : Array.isArray(response.data)
        ? response.data
        : [];

    return {
      conversation:
        normalizeChatConversation(response.conversation) ||
        normalizeChatConversation(response.data),
      messages: rawMessages
        .map((item) => normalizeChatMessage(item))
        .filter((item): item is ChatMessage => item !== null),
    };
  }

  async sendMessage(
    conversationId: number,
    messageContent: string,
    messageType = "text",
    replyToId: number | null = null
  ): Promise<{ message: ChatMessage | null }> {
    const response = await this.apiRequest<JsonRecord>(
      `/conversations/${conversationId}/messages`,
      {
        method: "POST",
        body: JSON.stringify({ messageContent, messageType, replyToId }),
      }
    );

    return {
      message:
        normalizeChatMessage(response.message) ||
        normalizeChatMessage(response.data) ||
        normalizeChatMessage(response),
    };
  }

  async editMessage(
    messageId: number,
    messageContent: string
  ): Promise<{ message: ChatMessage | null }> {
    const response = await this.apiRequest<JsonRecord>(`/messages/${messageId}`, {
      method: "PUT",
      body: JSON.stringify({ messageContent }),
    });

    return {
      message:
        normalizeChatMessage(response.message) ||
        normalizeChatMessage(response.data) ||
        normalizeChatMessage(response),
    };
  }

  async deleteMessage(messageId: number): Promise<void> {
    await this.apiRequest(`/messages/${messageId}`, {
      method: "DELETE",
    });
  }

  async createGroupConversation(
    conversationName: string,
    participantIds: number[]
  ): Promise<{ conversation: ChatConversation | null }> {
    const response = await this.apiRequest<JsonRecord>("/conversations/group", {
      method: "POST",
      body: JSON.stringify({ conversationName, participantIds }),
    });

    return {
      conversation:
        normalizeChatConversation(response.conversation) ||
        normalizeChatConversation(response.data) ||
        normalizeChatConversation(response),
    };
  }

  async addParticipant(conversationId: number, userId: number): Promise<void> {
    await this.apiRequest(`/conversations/${conversationId}/participants`, {
      method: "POST",
      body: JSON.stringify({ userId }),
    });
  }

  async leaveConversationGroup(conversationId: number): Promise<void> {
    await this.apiRequest(`/conversations/${conversationId}/leave`, {
      method: "POST",
    });
  }

  async markAsRead(conversationId: number): Promise<void> {
    await this.apiRequest(`/conversations/${conversationId}/read`, {
      method: "POST",
      body: JSON.stringify({}),
    });
  }

  async getUnreadCount(): Promise<{ unreadCount: number }> {
    const response = await this.apiRequest<JsonRecord>("/unread-count");
    return {
      unreadCount:
        pickNumber(response.unreadCount, response.unread_count, response.count) ?? 0,
    };
  }

  joinConversation(conversationId: number): void {
    this.socket?.emit("join_conversation", conversationId);
  }

  leaveConversation(conversationId: number): void {
    this.socket?.emit("leave_conversation", conversationId);
  }

  sendMessageRealtime(
    conversationId: number,
    messageContent: string,
    messageType = "text",
    replyToId: number | null = null
  ): void {
    this.socket?.emit("send_message", {
      conversationId,
      messageContent,
      messageType,
      replyToId,
    });
  }

  startTyping(conversationId: number): void {
    this.socket?.emit("typing_start", conversationId);
  }

  stopTyping(conversationId: number): void {
    this.socket?.emit("typing_stop", conversationId);
  }

  markReadRealtime(conversationId: number): void {
    this.socket?.emit("mark_read", conversationId);
  }

  on<T = unknown>(event: ChatEventName, callback: SocketCallback<T>): () => void {
    const socket = this.initializeSocket();
    if (!socket) return () => {};

    const handler = (payload: T) => callback(payload);
    socket.on(event, handler);

    return () => {
      socket.off(event, handler);
    };
  }

  onNewMessage(callback: SocketCallback): () => void {
    return this.on("new_message", callback);
  }

  onMessageEdited(callback: SocketCallback): () => void {
    return this.on("message_edited", callback);
  }

  onMessageDeleted(callback: SocketCallback): () => void {
    return this.on("message_deleted", callback);
  }

  onUserTyping(callback: SocketCallback): () => void {
    return this.on("user_typing", callback);
  }

  onUserStopTyping(callback: SocketCallback): () => void {
    return this.on("user_stop_typing", callback);
  }

  onMessagesRead(callback: SocketCallback): () => void {
    return this.on("messages_read", callback);
  }

  onNewMessageNotification(callback: SocketCallback): () => void {
    return this.on("new_message_notification", callback);
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }
}

const chatService = new ChatService();

export default chatService;
