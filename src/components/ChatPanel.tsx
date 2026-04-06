import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { X, Search, Send, Smile, CheckCircle, MessageCircle, ArrowLeft } from "lucide-react";
import Avatar from "./Avatar";
import EmojiPicker from "./EmojiPicker";
import { getUserData } from "../utils/userUtils";
import chatService, {
  CHAT_UI_REFRESH_EVENT,
  type ChatConversation,
  type ChatMessage,
  normalizeChatConversation,
  normalizeChatMessage,
} from "../services/chatService";
import { feedApi } from "../services/feedApi";
import { formatChatPresenceLabel } from "../utils/presenceUtils";
import API_BASE_URL from "../api/config";

export interface ChatPanelPopupPayload {
  messageId?: number;
  conversationId: number;
  userId: number;
  userName: string;
  userAvatar: string;
  message: string;
  timestamp: string;
}

interface ChatPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onUnreadCountChange?: (count: number) => void;
  activeConversationId?: number | null;
  /** Real-time presence from socket / optional REST batch (parent-owned). */
  remotePresenceByUserId?: Record<number, { online?: boolean; lastSeenAt?: string }>;
  /** Called with distinct other-user IDs from loaded conversations (for presence batch fetch). */
  onChatPeerUserIds?: (userIds: number[]) => void;
}

interface TypingUser {
  userId: number;
  username: string;
}

/** Friend row from GET /friends/my — field names vary by account/backend. */
interface FriendsApiRow {
  user_id: number;
  user_firstname?: string;
  user_lastname?: string;
  user_picture?: string;
  profile_image_url?: string;
}

export interface ChatFriendContact {
  userId: number;
  displayName: string;
  avatarUrl: string;
}

/** Turn relative or partial image paths into a usable URL for <img src>. */
const resolveProfileImageUrl = (raw?: string | null): string => {
  const s = raw?.trim();
  if (!s || /placeholder-avatar/i.test(s)) return "";
  if (/^https?:\/\//i.test(s)) return s;
  if (s.startsWith("//")) return `https:${s}`;
  const path = s.startsWith("/") ? s : `/${s}`;
  if (typeof window !== "undefined") {
    if (API_BASE_URL.startsWith("http")) {
      try {
        return new URL(path, new URL(API_BASE_URL).origin).href;
      } catch {
        /* fall through */
      }
    }
    return `${window.location.origin}${path}`;
  }
  return path;
};

const friendDisplayName = (f: FriendsApiRow): string => {
  const first = f.user_firstname?.trim();
  const last = f.user_lastname?.trim();
  const combined = [first, last].filter(Boolean).join(" ").trim();
  if (combined) return combined;
  const r = f as unknown as Record<string, unknown>;
  const u = r.username ?? r.user_name ?? r.display_name;
  if (typeof u === "string" && u.trim()) return u.trim();
  return `User ${f.user_id}`;
};

const friendAvatarFromRow = (f: FriendsApiRow): string => {
  const r = f as unknown as Record<string, unknown>;
  const candidates = [
    f.user_picture,
    f.profile_image_url,
    r.avatar,
    r.picture,
    r.user_avatar,
    r.profileImage,
  ];
  for (const c of candidates) {
    if (typeof c === "string" && c.trim()) {
      return resolveProfileImageUrl(c);
    }
  }
  return "";
};

const firstResolvedAvatar = (...candidates: (string | undefined | null)[]): string => {
  for (const c of candidates) {
    const v = resolveProfileImageUrl(c);
    if (v) return v;
  }
  return "";
};

const currentUserId = (): number => {
  const user = getUserData();
  const rawId =
    (user?.user_id as number | string | undefined) ??
    (user?.id as number | string | undefined);
  return typeof rawId === "number"
    ? rawId
    : typeof rawId === "string" && !Number.isNaN(Number(rawId))
      ? Number(rawId)
      : 0;
};

const timeLabel = (value?: string): string => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
};

const sortConversations = (items: ChatConversation[]) =>
  [...items].sort((a, b) => {
    const right = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0;
    const left = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0;
    return right - left;
  });

/** Green tick only when the other user read our outgoing message. */
const isOutgoingReadByPeer = (message: ChatMessage): boolean => {
  if (message.readByRecipient === true) return true;
  if (message.readByRecipient === false) return false;
  return message.isRead;
};

const upsertMessage = (items: ChatMessage[], next: ChatMessage) => {
  const existingIndex = items.findIndex((item) => item.messageId === next.messageId);
  if (existingIndex === -1) {
    return [...items, next].sort(
      (left, right) =>
        new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime()
    );
  }
  const updated = [...items];
  updated[existingIndex] = { ...updated[existingIndex], ...next };
  return updated;
};

const mergeRemotePresence = (
  conversation: ChatConversation,
  remote?: Record<number, { online?: boolean; lastSeenAt?: string }>
): { isOnline: boolean; lastSeenIso?: string | null } => {
  const oid = conversation.otherUserId;
  if (oid == null || oid <= 0) {
    return {
      isOnline: conversation.isOnline,
      lastSeenIso: conversation.otherUserLastSeen ?? null,
    };
  }
  const row = remote?.[oid];
  let isOnline = conversation.isOnline;
  if (row?.online === true) isOnline = true;
  else if (row?.online === false) isOnline = false;
  const lastSeenIso =
    row?.lastSeenAt ?? conversation.otherUserLastSeen ?? null;
  return { isOnline, lastSeenIso };
};

const ChatPanel: React.FC<ChatPanelProps> = ({
  isOpen,
  onClose,
  onUnreadCountChange,
  activeConversationId,
  remotePresenceByUserId,
  onChatPeerUserIds,
}) => {
  const userId = useMemo(() => currentUserId(), []);
  const [activeChats, setActiveChats] = useState<ChatConversation[]>([]);
  const activeChatsRef = useRef<ChatConversation[]>([]);
  const [friendContacts, setFriendContacts] = useState<ChatFriendContact[]>([]);
  const [selectedConversationId, setSelectedConversationId] = useState<number | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [messageInput, setMessageInput] = useState("");
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);

  const typingTimeoutRef = useRef<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const selectedConversationIdRef = useRef<number | null>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const messageInputRef = useRef<HTMLInputElement>(null);

  const selectedConversation = useMemo((): ChatConversation | null => {
    if (selectedConversationId == null) return null;
    const chat = activeChats.find(
      (c) => c.conversationId === selectedConversationId
    );
    if (chat) return chat;
    if (selectedConversationId < 0) {
      const uid = -selectedConversationId;
      const fc = friendContacts.find((f) => f.userId === uid);
      if (!fc) return null;
      return {
        conversationId: selectedConversationId,
        conversationType: "direct",
        conversationName: fc.displayName,
        otherUserId: uid,
        otherUsername: fc.displayName,
        otherAvatar: fc.avatarUrl,
        lastMessageContent: "",
        unreadCount: 0,
        isOnline: false,
      };
    }
    return null;
  }, [activeChats, friendContacts, selectedConversationId]);

  const searchLower = searchQuery.toLowerCase().trim();

  const filteredChats = useMemo(
    () =>
      activeChats.filter((c) =>
        !searchLower
          ? true
          : c.conversationName.toLowerCase().includes(searchLower) ||
            (c.otherUsername?.toLowerCase().includes(searchLower) ?? false)
      ),
    [activeChats, searchLower]
  );

  const filteredFriends = useMemo(
    () =>
      friendContacts.filter((f) =>
        !searchLower
          ? true
          : f.displayName.toLowerCase().includes(searchLower)
      ),
    [friendContacts, searchLower]
  );

  const unreadCount = useMemo(
    () =>
      activeChats.reduce(
        (total, conversation) => total + Math.max(conversation.unreadCount, 0),
        0
      ),
    [activeChats]
  );

  useEffect(() => {
    selectedConversationIdRef.current = selectedConversationId;
  }, [selectedConversationId]);

  useEffect(() => {
    activeChatsRef.current = activeChats;
  }, [activeChats]);

  useEffect(() => {
    if (!isOpen || !onChatPeerUserIds) return;
    const fromChats = activeChats
      .map((c) => c.otherUserId)
      .filter((id): id is number => typeof id === "number" && id > 0);
    const fromFriends = friendContacts.map((f) => f.userId);
    onChatPeerUserIds([...new Set([...fromChats, ...fromFriends])]);
  }, [isOpen, activeChats, friendContacts, onChatPeerUserIds]);

  useEffect(() => {
    onUnreadCountChange?.(unreadCount);
  }, [onUnreadCountChange, unreadCount]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, typingUsers]);

  /** Full-screen chat on small viewports + shrink with on-screen keyboard (Visual Viewport API). */
  useEffect(() => {
    if (!isOpen) return;

    const el = overlayRef.current;
    if (!el) return;

    const mq = window.matchMedia("(max-width: 768px)");

    const syncVisualViewport = () => {
      if (!mq.matches) {
        el.style.removeProperty("top");
        el.style.removeProperty("left");
        el.style.removeProperty("width");
        el.style.removeProperty("height");
        return;
      }
      const vv = window.visualViewport;
      if (!vv) return;
      el.style.setProperty("top", `${vv.offsetTop}px`);
      el.style.setProperty("left", `${vv.offsetLeft}px`);
      el.style.setProperty("width", `${vv.width}px`);
      el.style.setProperty("height", `${vv.height}px`);
    };

    syncVisualViewport();

    const onMq = () => syncVisualViewport();
    mq.addEventListener("change", onMq);

    const vv = window.visualViewport;
    vv?.addEventListener("resize", syncVisualViewport);
    vv?.addEventListener("scroll", syncVisualViewport);
    window.addEventListener("resize", syncVisualViewport);

    return () => {
      mq.removeEventListener("change", onMq);
      vv?.removeEventListener("resize", syncVisualViewport);
      vv?.removeEventListener("scroll", syncVisualViewport);
      window.removeEventListener("resize", syncVisualViewport);
      el.style.removeProperty("top");
      el.style.removeProperty("left");
      el.style.removeProperty("width");
      el.style.removeProperty("height");
    };
  }, [isOpen]);

  const loadConversations = useCallback(async () => {
    try {
      const [convResult, friendsResult] = await Promise.all([
        chatService.getUserConversations(1, 50),
        feedApi.getMyFriends().catch(() => ({
          success: false as const,
          data: [] as FriendsApiRow[],
        })),
      ]);

      const fromApiRaw = sortConversations(convResult.conversations);
      const friends: FriendsApiRow[] =
        friendsResult.success && Array.isArray(friendsResult.data)
          ? (friendsResult.data as FriendsApiRow[])
          : [];

      const avatarByUserId = new Map<number, string>();
      for (const f of friends) {
        const fid = f.user_id;
        if (fid == null || fid === userId) continue;
        const url = friendAvatarFromRow(f);
        if (url) avatarByUserId.set(fid, url);
      }

      const fromApi = fromApiRaw.map((c) => {
        const oid = c.otherUserId;
        if (oid == null) return c;
        const missing = !c.otherAvatar?.trim();
        const fromFriend = avatarByUserId.get(oid);
        if (missing && fromFriend) {
          return { ...c, otherAvatar: fromFriend };
        }
        if (c.otherAvatar?.trim()) {
          return { ...c, otherAvatar: resolveProfileImageUrl(c.otherAvatar) };
        }
        return c;
      });

      const byOtherId = new Set<number>();
      for (const c of fromApi) {
        if (c.otherUserId != null) byOtherId.add(c.otherUserId);
      }

      const nextFriends: ChatFriendContact[] = [];
      for (const f of friends) {
        const fid = f.user_id;
        if (fid == null || fid === userId) continue;
        if (byOtherId.has(fid)) continue;
        nextFriends.push({
          userId: fid,
          displayName: friendDisplayName(f),
          avatarUrl: friendAvatarFromRow(f),
        });
      }
      nextFriends.sort((a, b) => a.displayName.localeCompare(b.displayName));

      setActiveChats(fromApi);
      setFriendContacts(nextFriends);
      setChatError(null);
    } catch (error) {
      setChatError(error instanceof Error ? error.message : "Unable to load chats.");
    }
  }, [userId]);

  useEffect(() => {
    const onRefresh = (e: Event) => {
      const peerUserId = (e as CustomEvent<{ peerUserId?: number }>).detail
        ?.peerUserId;
      void loadConversations();
      if (peerUserId == null || peerUserId <= 0) return;
      const sel = selectedConversationIdRef.current;
      if (sel == null) return;
      const isDraftWithPeer = sel < 0 && -sel === peerUserId;
      const conv = activeChatsRef.current.find((c) => c.conversationId === sel);
      const isOpenWithPeer = conv?.otherUserId === peerUserId;
      if (isDraftWithPeer || isOpenWithPeer) {
        setSelectedConversationId(null);
        setMessages([]);
        setTypingUsers([]);
      }
    };
    window.addEventListener(CHAT_UI_REFRESH_EVENT, onRefresh);
    return () => window.removeEventListener(CHAT_UI_REFRESH_EVENT, onRefresh);
  }, [loadConversations]);

  const markConversationRead = useCallback(
    async (conversationId: number) => {
      setActiveChats((prev) =>
        prev.map((conversation) =>
          conversation.conversationId === conversationId
            ? { ...conversation, unreadCount: 0 }
            : conversation
        )
      );
      try {
        await chatService.markAsRead(conversationId);
        chatService.markReadRealtime(conversationId);
      } catch {
        // Keep local UI state even if the read sync fails.
      }
    },
    [userId]
  );

  const openConversation = useCallback(
    async (conversationId: number) => {
      if (conversationId < 0) {
        const friendId = -conversationId;
        const fc = friendContacts.find((f) => f.userId === friendId);
        setSelectedConversationId(conversationId);
        setMessages([]);
        setIsLoading(true);
        setChatError(null);
        try {
          const { conversation: raw } =
            await chatService.createDirectConversation(friendId);
          let normalized = normalizeChatConversation(raw);
          if (!normalized) {
            throw new Error("Could not open this chat.");
          }
          const mergedAvatar = firstResolvedAvatar(
            normalized.otherAvatar,
            fc?.avatarUrl
          );
          normalized = {
            ...normalized,
            conversationName: fc?.displayName ?? normalized.conversationName,
            otherUsername: fc?.displayName ?? normalized.otherUsername,
            otherAvatar: mergedAvatar,
            otherUserId: normalized.otherUserId ?? friendId,
          };
          const realId = normalized.conversationId;
          setFriendContacts((prev) => prev.filter((f) => f.userId !== friendId));
          setActiveChats((prev) =>
            sortConversations([
              ...prev.filter((c) => c.conversationId !== realId),
              normalized,
            ])
          );
          setSelectedConversationId(realId);
          const result = await chatService.getConversation(realId);
          setMessages(result.messages);
          setTypingUsers([]);
          chatService.joinConversation(realId);
          await markConversationRead(realId);
          const apiConv = result.conversation;
          if (apiConv) {
            const patchedAvatar = firstResolvedAvatar(
              apiConv.otherAvatar,
              mergedAvatar,
              fc?.avatarUrl
            );
            if (patchedAvatar && patchedAvatar !== apiConv.otherAvatar) {
              setActiveChats((prev) =>
                sortConversations(
                  prev.map((c) =>
                    c.conversationId === realId
                      ? { ...c, otherAvatar: patchedAvatar }
                      : c
                  )
                )
              );
            }
          }
        } catch (error) {
          setSelectedConversationId(null);
          setChatError(
            error instanceof Error
              ? error.message
              : "Unable to open this conversation."
          );
        } finally {
          setIsLoading(false);
        }
        return;
      }

      setIsLoading(true);
      setSelectedConversationId(conversationId);
      try {
        const result = await chatService.getConversation(conversationId);
        setMessages(result.messages);
        setTypingUsers([]);
        chatService.joinConversation(conversationId);
        await markConversationRead(conversationId);
        setChatError(null);
        const apiConv = result.conversation;
        const oid = apiConv?.otherUserId;
        if (apiConv && oid != null) {
          const fromFriendList = friendContacts.find((f) => f.userId === oid);
          const patchedAvatar = firstResolvedAvatar(
            apiConv.otherAvatar,
            fromFriendList?.avatarUrl
          );
          if (patchedAvatar) {
            setActiveChats((prev) =>
              sortConversations(
                prev.map((c) =>
                  c.conversationId === conversationId
                    ? {
                        ...c,
                        otherAvatar: patchedAvatar,
                        conversationName:
                          c.conversationName || apiConv.conversationName,
                      }
                    : c
                )
              )
            );
          }
        }
      } catch (error) {
        setChatError(
          error instanceof Error
            ? error.message
            : "Unable to load this conversation."
        );
      } finally {
        setIsLoading(false);
      }
    },
    [friendContacts, markConversationRead]
  );

  useEffect(() => {
    if (!isOpen || activeConversationId == null) {
      return;
    }

    if (
      selectedConversationId === activeConversationId &&
      messages.length > 0
    ) {
      void markConversationRead(activeConversationId);
      return;
    }

    void openConversation(activeConversationId);
  }, [
    activeConversationId,
    isOpen,
    markConversationRead,
    messages.length,
    openConversation,
    selectedConversationId,
  ]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    chatService.initializeSocket();
    void loadConversations();

    const pollInterval = window.setInterval(() => {
      void loadConversations();
    }, 30000);

    const detachHandlers = [
      chatService.onNewMessage((payload) => {
        const message =
          normalizeChatMessage((payload as Record<string, unknown>)?.message) ||
          normalizeChatMessage(payload);

        if (message) {
          setActiveChats((prev) =>
            sortConversations(
              prev.map((conversation) =>
                conversation.conversationId === message.conversationId
                  ? {
                      ...conversation,
                      lastMessageContent: message.messageContent,
                      lastMessageAt: message.createdAt,
                      unreadCount:
                        message.senderId === userId ||
                        selectedConversationIdRef.current === message.conversationId
                          ? 0
                          : conversation.unreadCount + 1,
                    }
                  : conversation
              )
            )
          );

          if (selectedConversationIdRef.current === message.conversationId) {
            setMessages((prev) => upsertMessage(prev, message));
            if (message.senderId !== userId) {
              void markConversationRead(message.conversationId);
            }
          }
        }

        void loadConversations();
      }),
      chatService.onMessageEdited((payload) => {
        const message =
          normalizeChatMessage((payload as Record<string, unknown>)?.message) ||
          normalizeChatMessage(payload);
        if (message) {
          setMessages((prev) => upsertMessage(prev, message));
        }
      }),
      chatService.onUserTyping((payload) => {
        const record = payload as Record<string, unknown>;
        const conversationId =
          typeof record.conversationId === "number"
            ? record.conversationId
            : typeof record.conversation_id === "number"
              ? record.conversation_id
              : null;
        const typingUserId =
          typeof record.userId === "number"
            ? record.userId
            : typeof record.user_id === "number"
              ? record.user_id
              : 0;

        if (
          conversationId !== selectedConversationIdRef.current ||
          !typingUserId ||
          typingUserId === userId
        ) {
          return;
        }

        const username =
          typeof record.username === "string"
            ? record.username
            : typeof record.user_name === "string"
              ? record.user_name
              : "Someone";

        setTypingUsers((prev) =>
          prev.some((user) => user.userId === typingUserId)
            ? prev
            : [...prev, { userId: typingUserId, username }]
        );
      }),
      chatService.onUserStopTyping((payload) => {
        const record = payload as Record<string, unknown>;
        const typingUserId =
          typeof record.userId === "number"
            ? record.userId
            : typeof record.user_id === "number"
              ? record.user_id
              : 0;
        setTypingUsers((prev) => prev.filter((user) => user.userId !== typingUserId));
      }),
      chatService.onMessagesRead((payload) => {
        const r = payload as Record<string, unknown>;
        const readerId =
          typeof r.userId === "number"
            ? r.userId
            : typeof r.user_id === "number"
              ? r.user_id
              : typeof r.readerId === "number"
                ? r.readerId
                : typeof r.reader_id === "number"
                  ? r.reader_id
                  : null;
        if (readerId != null && readerId === userId) {
          return;
        }
        const convId =
          typeof r.conversationId === "number"
            ? r.conversationId
            : typeof r.conversation_id === "number"
              ? r.conversation_id
              : null;
        if (
          convId != null &&
          convId !== selectedConversationIdRef.current
        ) {
          return;
        }
        setMessages((prev) =>
          prev.map((message) =>
            message.senderId === userId
              ? {
                  ...message,
                  readByRecipient: true,
                  isRead: true,
                }
              : message
          )
        );
      }),
    ];

    return () => {
      window.clearInterval(pollInterval);
      detachHandlers.forEach((detach) => detach());
      if (typingTimeoutRef.current) {
        window.clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [isOpen, loadConversations, markConversationRead, userId]);

  const handleInputChange = (value: string) => {
    setMessageInput(value);
    if (!selectedConversationId || selectedConversationId < 0) return;

    if (value.trim()) {
      chatService.startTyping(selectedConversationId);
    } else {
      chatService.stopTyping(selectedConversationId);
    }

    if (typingTimeoutRef.current) {
      window.clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = window.setTimeout(() => {
      chatService.stopTyping(selectedConversationId);
      typingTimeoutRef.current = null;
    }, 1500);
  };

  const handleSendMessage = async () => {
    if (!selectedConversationId || selectedConversationId < 0 || !messageInput.trim()) {
      return;
    }

    const outgoingMessage = messageInput.trim();
    setIsSending(true);
    setMessageInput("");

    try {
      const result = await chatService.sendMessage(
        selectedConversationId,
        outgoingMessage
      );

      if (result.message) {
        setMessages((prev) => upsertMessage(prev, result.message!));
      }

      setActiveChats((prev) =>
        sortConversations(
          prev.map((conversation) =>
            conversation.conversationId === selectedConversationId
              ? {
                  ...conversation,
                  lastMessageContent: outgoingMessage,
                  lastMessageAt: new Date().toISOString(),
                }
              : conversation
          )
        )
      );

      chatService.sendMessageRealtime(selectedConversationId, outgoingMessage);
      setChatError(null);
    } catch (error) {
      setMessageInput(outgoingMessage);
      setChatError(error instanceof Error ? error.message : "Unable to send message.");
    } finally {
      setIsSending(false);
    }
  };

  const headerPresence = useMemo(() => {
    if (!selectedConversation) {
      return { showDot: false, label: "" };
    }
    const merged = mergeRemotePresence(
      selectedConversation,
      remotePresenceByUserId
    );
    return formatChatPresenceLabel({
      isOnline: merged.isOnline,
      lastSeenIso: merged.lastSeenIso,
    });
  }, [selectedConversation, remotePresenceByUserId]);

  const typingLabel =
    typingUsers.length > 0
      ? `${typingUsers.map((user) => user.username).join(", ")} ${
          typingUsers.length > 1 ? "are" : "is"
        } typing...`
      : headerPresence.label || "Offline";

  if (!isOpen) return null;

  return (
    <div
      ref={overlayRef}
      className="newsfeed-chat-panel-overlay"
      onClick={onClose}
    >
      <div className="newsfeed-chat-panel" onClick={(event) => event.stopPropagation()}>
        <div className="newsfeed-chat-panel__header">
          <h3>Messages</h3>
          <button className="newsfeed-chat-panel__close" onClick={onClose} aria-label="Close chat">
            <X size={20} />
          </button>
        </div>

        <div className="newsfeed-chat-panel__container">
          <div
            className={`newsfeed-chat-panel__conversations ${
              selectedConversationId
                ? "newsfeed-chat-panel__conversations--hidden"
                : "newsfeed-chat-panel__conversations--visible"
            }`}
          >
            <div className="newsfeed-chat-panel__search-wrapper">
              <Search size={18} className="newsfeed-chat-panel__search-icon" />
              <input
                type="text"
                className="newsfeed-chat-panel__search-input"
                placeholder="Search chats or friends..."
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
              />
            </div>

            {chatError && <div className="newsfeed-chat-panel__status-banner">{chatError}</div>}

            <div className="newsfeed-chat-panel__conversations-list">
              {filteredChats.length > 0 && (
                <>
                  <div
                    className="newsfeed-chat-panel__section-title"
                    id="chat-panel-section-chats"
                  >
                    Chats
                  </div>
                  {filteredChats.map((conversation) => {
                    const merged = mergeRemotePresence(
                      conversation,
                      remotePresenceByUserId
                    );
                    const listPresence = formatChatPresenceLabel({
                      isOnline: merged.isOnline,
                      lastSeenIso: merged.lastSeenIso,
                    });
                    return (
                      <div
                        key={`chat-${conversation.conversationId}`}
                        className={`newsfeed-chat-panel__conversation-item ${
                          selectedConversationId === conversation.conversationId
                            ? "newsfeed-chat-panel__conversation-item--active"
                            : ""
                        }`}
                        onClick={() => void openConversation(conversation.conversationId)}
                      >
                        <div className="newsfeed-chat-panel__conversation-avatar-wrapper">
                          <Avatar
                            src={conversation.otherAvatar}
                            name={
                              conversation.otherUsername || conversation.conversationName
                            }
                            size={48}
                            className="newsfeed-chat-panel__conversation-avatar"
                          />
                          {listPresence.showDot && (
                            <span className="newsfeed-chat-panel__online-indicator"></span>
                          )}
                        </div>
                        <div className="newsfeed-chat-panel__conversation-info">
                          <div className="newsfeed-chat-panel__conversation-header">
                            <p className="newsfeed-chat-panel__conversation-name">
                              {conversation.conversationName}
                            </p>
                            <span className="newsfeed-chat-panel__conversation-time">
                              {timeLabel(conversation.lastMessageAt)}
                            </span>
                          </div>
                          <div className="newsfeed-chat-panel__conversation-preview">
                            <p className="newsfeed-chat-panel__conversation-message">
                              {conversation.lastMessageContent ||
                                "No messages yet"}
                            </p>
                            {conversation.unreadCount > 0 && (
                              <span className="newsfeed-chat-panel__unread-badge">
                                {conversation.unreadCount}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </>
              )}

              {filteredFriends.length > 0 && (
                <>
                  <div
                    className="newsfeed-chat-panel__section-title"
                    id="chat-panel-section-friends"
                  >
                    Friends
                  </div>
                  {filteredFriends.map((f) => {
                    const pseudoConv: ChatConversation = {
                      conversationId: -f.userId,
                      conversationType: "direct",
                      conversationName: f.displayName,
                      otherUserId: f.userId,
                      otherUsername: f.displayName,
                      otherAvatar: f.avatarUrl,
                      lastMessageContent: "",
                      unreadCount: 0,
                      isOnline: false,
                    };
                    const merged = mergeRemotePresence(
                      pseudoConv,
                      remotePresenceByUserId
                    );
                    const listPresence = formatChatPresenceLabel({
                      isOnline: merged.isOnline,
                      lastSeenIso: merged.lastSeenIso,
                    });
                    return (
                      <div
                        key={`friend-${f.userId}`}
                        className={`newsfeed-chat-panel__conversation-item newsfeed-chat-panel__conversation-item--friend ${
                          selectedConversationId === -f.userId
                            ? "newsfeed-chat-panel__conversation-item--active"
                            : ""
                        }`}
                        onClick={() => void openConversation(-f.userId)}
                      >
                        <div className="newsfeed-chat-panel__conversation-avatar-wrapper">
                          <Avatar
                            src={f.avatarUrl}
                            name={f.displayName}
                            size={48}
                            className="newsfeed-chat-panel__conversation-avatar"
                          />
                          {listPresence.showDot && (
                            <span className="newsfeed-chat-panel__online-indicator"></span>
                          )}
                        </div>
                        <div className="newsfeed-chat-panel__conversation-info">
                          <div className="newsfeed-chat-panel__conversation-header">
                            <p className="newsfeed-chat-panel__conversation-name">
                              {f.displayName}
                            </p>
                          </div>
                          <div className="newsfeed-chat-panel__conversation-preview">
                            <p className="newsfeed-chat-panel__conversation-message newsfeed-chat-panel__conversation-message--hint">
                              Tap to start a conversation
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </>
              )}

              {filteredChats.length === 0 && filteredFriends.length === 0 && (
                <div className="newsfeed-chat-panel__empty-conversations">
                  {chatError
                    ? "Chat is unavailable right now."
                    : searchLower
                      ? "No chats or friends match your search."
                      : "No chats or friends to show yet."}
                </div>
              )}
            </div>
          </div>

          <div
            className={`newsfeed-chat-panel__chat-window ${
              selectedConversationId
                ? "newsfeed-chat-panel__chat-window--visible"
                : ""
            }`}
          >
            {selectedConversation ? (
              <>
                <div className="newsfeed-chat-panel__chat-header">
                  <div className="newsfeed-chat-panel__chat-user-info">
                    <button
                      className="newsfeed-chat-panel__back-btn"
                      onClick={() => {
                        setSelectedConversationId(null);
                        setMessages([]);
                        setTypingUsers([]);
                      }}
                      aria-label="Back to conversations"
                    >
                      <ArrowLeft size={18} />
                    </button>
                    <div className="newsfeed-chat-panel__chat-avatar-wrapper">
                      <Avatar
                        src={selectedConversation.otherAvatar}
                        name={selectedConversation.otherUsername || selectedConversation.conversationName}
                        size={40}
                        className="newsfeed-chat-panel__chat-avatar"
                      />
                      {headerPresence.showDot && (
                        <span className="newsfeed-chat-panel__online-indicator"></span>
                      )}
                    </div>
                    <div className="newsfeed-chat-panel__chat-user-details">
                      <p className="newsfeed-chat-panel__chat-user-name">
                        {selectedConversation.conversationName}
                      </p>
                      <span className="newsfeed-chat-panel__chat-status-separator">•</span>
                      <p className="newsfeed-chat-panel__chat-status">{typingLabel}</p>
                    </div>
                  </div>
                </div>

                <div className="newsfeed-chat-panel__messages">
                  {isLoading ? (
                    <div className="newsfeed-chat-panel__empty-state">Loading messages...</div>
                  ) : messages.length > 0 ? (
                    messages.map((message) => {
                      const isCurrentUser = message.senderId === userId;
                      return (
                        <div
                          key={message.messageId}
                          className={`newsfeed-chat-panel__message ${
                            isCurrentUser
                              ? "newsfeed-chat-panel__message--sent"
                              : "newsfeed-chat-panel__message--received"
                          }`}
                        >
                          {!isCurrentUser && (
                            <Avatar
                              src={message.senderAvatar}
                              name={message.username}
                              size={32}
                              className="newsfeed-chat-panel__message-avatar"
                            />
                          )}
                          <div className="newsfeed-chat-panel__message-content">
                            <p className="newsfeed-chat-panel__message-text">
                              {message.messageContent}
                            </p>
                            <div className="newsfeed-chat-panel__message-footer">
                              <span className="newsfeed-chat-panel__message-time">
                                {timeLabel(message.createdAt)}
                              </span>
                              {isCurrentUser && (
                                <span
                                  className={`newsfeed-chat-panel__message-status ${
                                    isOutgoingReadByPeer(message)
                                      ? "newsfeed-chat-panel__message-status--read"
                                      : "newsfeed-chat-panel__message-status--sent"
                                  }`}
                                >
                                  <CheckCircle size={14} />
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="newsfeed-chat-panel__empty-state">
                      No messages yet. Say hello.
                    </div>
                  )}
                  {typingUsers.length > 0 && (
                    <div className="newsfeed-chat-panel__typing-indicator">
                      {typingLabel}
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                <div className="newsfeed-chat-panel__input-area">
                  <div className="newsfeed-chat-panel__input-row">
                    <input
                      ref={messageInputRef}
                      type="text"
                      className="newsfeed-chat-panel__input"
                      placeholder="Type a message..."
                      value={messageInput}
                      onChange={(event) => handleInputChange(event.target.value)}
                      onFocus={() => {
                        window.setTimeout(() => {
                          messagesEndRef.current?.scrollIntoView({
                            block: "end",
                            behavior: "smooth",
                          });
                        }, 280);
                      }}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" && !event.shiftKey) {
                          event.preventDefault();
                          void handleSendMessage();
                        }
                      }}
                    />
                    <div className="newsfeed-chat-panel__emoji-wrapper">
                      <button
                        className="newsfeed-chat-panel__input-btn"
                        onClick={() => setIsEmojiPickerOpen((prev) => !prev)}
                        aria-label="Open emoji picker"
                      >
                        <Smile size={20} />
                      </button>
                      {isEmojiPickerOpen && (
                        <EmojiPicker
                          isOpen={isEmojiPickerOpen}
                          onClose={() => setIsEmojiPickerOpen(false)}
                          onEmojiSelect={(emoji) =>
                            setMessageInput((prev) => `${prev}${emoji}`)
                          }
                          position="top"
                        />
                      )}
                    </div>
                    <button
                      className="newsfeed-chat-panel__send-btn"
                      onClick={() => void handleSendMessage()}
                      disabled={!messageInput.trim() || isSending}
                      aria-label="Send message"
                    >
                      <Send size={20} />
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="newsfeed-chat-panel__no-chat-selected">
                <MessageCircle size={64} />
                <p>Select a conversation to start chatting</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatPanel;
