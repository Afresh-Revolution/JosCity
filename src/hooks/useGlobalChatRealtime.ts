import { useCallback, useEffect, useRef, useState } from "react";
import chatService, {
  CHAT_UI_REFRESH_EVENT,
  normalizeChatMessage,
  normalizeMessageNotification,
} from "../services/chatService";
import type { ChatPanelPopupPayload } from "../components/ChatPanel";
import { isAuthenticated, getUserData } from "../utils/userUtils";

/**
 * Keeps chat socket alive, syncs unread count, presence heartbeats, and routes
 * incoming messages to the parent for toasts/sounds when the user is not
 * viewing that conversation.
 */
export function useGlobalChatRealtime(
  isChatPanelOpen: boolean,
  activeChatConversationId: number | null,
  onIncomingChatMessage: (payload: ChatPanelPopupPayload) => void,
  setUnreadMessagesCount: React.Dispatch<React.SetStateAction<number>>
) {
  const [presenceByUserId, setPresenceByUserId] = useState<
    Record<number, { online?: boolean; lastSeenAt?: string }>
  >({});

  const chatViewRef = useRef({
    isOpen: false,
    activeConvId: null as number | null,
  });
  useEffect(() => {
    chatViewRef.current = {
      isOpen: isChatPanelOpen,
      activeConvId: activeChatConversationId,
    };
  }, [isChatPanelOpen, activeChatConversationId]);

  const incomingRef = useRef(onIncomingChatMessage);
  incomingRef.current = onIncomingChatMessage;

  const notifiedGlobalMessageIdsRef = useRef<Set<number>>(new Set());

  const refreshChatUnreadCount = useCallback(async () => {
    if (!isAuthenticated()) return;
    try {
      const { unreadCount } = await chatService.getUnreadCount();
      setUnreadMessagesCount(unreadCount);
    } catch {
      /* ignore */
    }
  }, [setUnreadMessagesCount]);

  const mergePresenceBatch = useCallback(
    (batch: Record<number, { online: boolean; lastSeenAt?: string }>) => {
      setPresenceByUserId((prev) => {
        const next = { ...prev };
        for (const [key, row] of Object.entries(batch)) {
          const uid = Number(key);
          if (!Number.isFinite(uid)) continue;
          next[uid] = {
            online: row.online,
            lastSeenAt: row.online
              ? prev[uid]?.lastSeenAt
              : row.lastSeenAt ?? prev[uid]?.lastSeenAt,
          };
        }
        return next;
      });
    },
    []
  );

  const handleChatPeerUserIds = useCallback(
    (ids: number[]) => {
      const unique = [...new Set(ids.filter((id) => id > 0))];
      if (!unique.length) return;
      void chatService.fetchPresenceBatch(unique).then(mergePresenceBatch);
    },
    [mergePresenceBatch]
  );

  useEffect(() => {
    if (!isAuthenticated()) return;

    chatService.initializeSocket();
    void refreshChatUnreadCount();

    const pollUnread = window.setInterval(
      () => void refreshChatUnreadCount(),
      25000
    );
    const heartbeat = window.setInterval(
      () => chatService.sendPresenceHeartbeat(),
      25000
    );
    const onVis = () => chatService.sendPresenceHeartbeat();
    document.addEventListener("visibilitychange", onVis);
    chatService.sendPresenceHeartbeat();

    const offPresence = chatService.onUserPresence((p) => {
      const lastFromPayload = p.lastSeenAt ?? p.last_seen_at;
      const explicitOnline = p.online;
      setPresenceByUserId((prev) => {
        const prior = prev[p.userId];
        let online: boolean;
        if (explicitOnline === true) online = true;
        else if (explicitOnline === false) online = false;
        else if (lastFromPayload) online = false;
        else online = prior?.online ?? false;

        const lastSeenAt =
          online === true
            ? prior?.lastSeenAt
            : lastFromPayload ??
              prior?.lastSeenAt ??
              new Date().toISOString();

        return {
          ...prev,
          [p.userId]: { online, lastSeenAt },
        };
      });
    });

    const currentUserNumericId = (): number => {
      const u = getUserData();
      const id = u?.user_id ?? u?.id;
      if (typeof id === "number" && Number.isFinite(id)) return id;
      if (typeof id === "string" && !Number.isNaN(Number(id))) return Number(id);
      return 0;
    };

    const shouldNotifyIncoming = (
      conversationId: number,
      senderId: number
    ): boolean => {
      const me = currentUserNumericId();
      if (!me || senderId === me) return false;
      const { isOpen, activeConvId } = chatViewRef.current;
      if (isOpen && activeConvId === conversationId) return false;
      return true;
    };

    const rememberNotify = (messageId: number | undefined) => {
      if (messageId == null) return true;
      const set = notifiedGlobalMessageIdsRef.current;
      if (set.has(messageId)) return false;
      set.add(messageId);
      if (set.size > 400) {
        notifiedGlobalMessageIdsRef.current = new Set([...set].slice(-200));
      }
      return true;
    };

    const dispatchIncoming = (args: {
      messageId?: number;
      conversationId: number;
      senderId: number;
      userName: string;
      userAvatar: string;
      message: string;
      createdAt?: string;
    }) => {
      if (!shouldNotifyIncoming(args.conversationId, args.senderId)) return;
      if (!rememberNotify(args.messageId)) return;
      incomingRef.current({
        messageId: args.messageId,
        conversationId: args.conversationId,
        userId: args.senderId,
        userName: args.userName,
        userAvatar: args.userAvatar,
        message: args.message,
        timestamp: args.createdAt
          ? new Date(args.createdAt).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })
          : "Now",
      });
    };

    const offNew = chatService.onNewMessage((payload) => {
      void refreshChatUnreadCount();
      const message =
        normalizeChatMessage((payload as Record<string, unknown>)?.message) ||
        normalizeChatMessage(payload);
      if (!message) return;
      dispatchIncoming({
        messageId: message.messageId,
        conversationId: message.conversationId,
        senderId: message.senderId,
        userName: message.username,
        userAvatar: message.senderAvatar || "",
        message: message.messageContent,
        createdAt: message.createdAt,
      });
    });

    const offNotif = chatService.onNewMessageNotification((payload) => {
      void refreshChatUnreadCount();
      const n = normalizeMessageNotification(payload);
      if (!n || !n.messageId) return;
      dispatchIncoming({
        messageId: n.messageId,
        conversationId: n.conversationId,
        senderId: n.senderId,
        userName: n.senderUsername,
        userAvatar: n.senderAvatar || "",
        message: n.messageContent,
        createdAt: n.createdAt,
      });
    });

    const onChatUiRefresh = () => void refreshChatUnreadCount();
    window.addEventListener(CHAT_UI_REFRESH_EVENT, onChatUiRefresh);

    return () => {
      window.clearInterval(pollUnread);
      window.clearInterval(heartbeat);
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener(CHAT_UI_REFRESH_EVENT, onChatUiRefresh);
      offPresence();
      offNew();
      offNotif();
    };
  }, [refreshChatUnreadCount]);

  return {
    presenceByUserId,
    refreshChatUnreadCount,
    handleChatPeerUserIds,
  };
}
