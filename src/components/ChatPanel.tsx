import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { X, Search, Send, Smile, CheckCircle, MessageCircle, ArrowLeft } from "lucide-react";
import Avatar from "./Avatar";
import EmojiPicker from "./EmojiPicker";
import { getUserData } from "../utils/userUtils";
import chatService, {
  type ChatConversation,
  type ChatMessage,
  normalizeChatMessage,
  normalizeMessageNotification,
} from "../services/chatService";

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
  onIncomingMessage?: (payload: ChatPanelPopupPayload) => void;
  activeConversationId?: number | null;
}

interface TypingUser {
  userId: number;
  username: string;
}

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

const ChatPanel: React.FC<ChatPanelProps> = ({
  isOpen,
  onClose,
  onUnreadCountChange,
  onIncomingMessage,
  activeConversationId,
}) => {
  const userId = useMemo(() => currentUserId(), []);
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
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
  const popupIdsRef = useRef<Set<number>>(new Set());
  const selectedConversationIdRef = useRef<number | null>(null);

  const selectedConversation = useMemo(
    () =>
      conversations.find(
        (conversation) => conversation.conversationId === selectedConversationId
      ) || null,
    [conversations, selectedConversationId]
  );

  const filteredConversations = useMemo(
    () =>
      conversations.filter((conversation) =>
        conversation.conversationName
          .toLowerCase()
          .includes(searchQuery.toLowerCase().trim())
      ),
    [conversations, searchQuery]
  );

  const unreadCount = useMemo(
    () =>
      conversations.reduce(
        (total, conversation) => total + Math.max(conversation.unreadCount, 0),
        0
      ),
    [conversations]
  );

  useEffect(() => {
    selectedConversationIdRef.current = selectedConversationId;
  }, [selectedConversationId]);

  useEffect(() => {
    onUnreadCountChange?.(unreadCount);
  }, [onUnreadCountChange, unreadCount]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, typingUsers]);

  const loadConversations = useCallback(async () => {
    try {
      const result = await chatService.getUserConversations();
      setConversations(sortConversations(result.conversations));
      setChatError(null);
    } catch (error) {
      setChatError(error instanceof Error ? error.message : "Unable to load chats.");
    }
  }, []);

  const markConversationRead = useCallback(
    async (conversationId: number) => {
      setConversations((prev) =>
        prev.map((conversation) =>
          conversation.conversationId === conversationId
            ? { ...conversation, unreadCount: 0 }
            : conversation
        )
      );
      setMessages((prev) =>
        prev.map((message) =>
          message.senderId === userId ? { ...message, isRead: true } : message
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
      setIsLoading(true);
      setSelectedConversationId(conversationId);
      try {
        const result = await chatService.getConversation(conversationId);
        setMessages(result.messages);
        setTypingUsers([]);
        chatService.joinConversation(conversationId);
        await markConversationRead(conversationId);
        setChatError(null);
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
    [markConversationRead]
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
        const notification = normalizeMessageNotification(payload);

        if (message) {
          setConversations((prev) =>
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
          } else if (
            message.senderId !== userId &&
            !popupIdsRef.current.has(message.messageId)
          ) {
            popupIdsRef.current.add(message.messageId);
            onIncomingMessage?.({
              messageId: message.messageId,
              conversationId: message.conversationId,
              userId: message.senderId,
              userName: message.username,
              userAvatar: message.senderAvatar || "",
              message: message.messageContent,
              timestamp: timeLabel(message.createdAt) || "Now",
            });
          }
        } else if (
          notification &&
          notification.senderId !== userId &&
          notification.messageId &&
          !popupIdsRef.current.has(notification.messageId)
        ) {
          popupIdsRef.current.add(notification.messageId);
          onIncomingMessage?.({
            messageId: notification.messageId,
            conversationId: notification.conversationId,
            userId: notification.senderId,
            userName: notification.senderUsername,
            userAvatar: notification.senderAvatar || "",
            message: notification.messageContent,
            timestamp: timeLabel(notification.createdAt) || "Now",
          });
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
      chatService.onMessagesRead(() => {
        setMessages((prev) =>
          prev.map((message) =>
            message.senderId === userId ? { ...message, isRead: true } : message
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
      chatService.disconnect();
    };
  }, [isOpen, loadConversations, markConversationRead, onIncomingMessage, userId]);

  const handleInputChange = (value: string) => {
    setMessageInput(value);
    if (!selectedConversationId) return;

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
    if (!selectedConversationId || !messageInput.trim()) return;

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

      setConversations((prev) =>
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

  const typingLabel =
    typingUsers.length > 0
      ? `${typingUsers.map((user) => user.username).join(", ")} ${
          typingUsers.length > 1 ? "are" : "is"
        } typing...`
      : selectedConversation?.isOnline
        ? "Online"
        : "Offline";

  if (!isOpen) return null;

  return (
    <div className="newsfeed-chat-panel-overlay" onClick={onClose}>
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
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
              />
            </div>

            {chatError && <div className="newsfeed-chat-panel__status-banner">{chatError}</div>}

            <div className="newsfeed-chat-panel__conversations-list">
              {filteredConversations.length > 0 ? (
                filteredConversations.map((conversation) => (
                  <div
                    key={conversation.conversationId}
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
                        name={conversation.otherUsername || conversation.conversationName}
                        size={48}
                        className="newsfeed-chat-panel__conversation-avatar"
                      />
                      {conversation.isOnline && (
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
                          {conversation.lastMessageContent || "Start the conversation"}
                        </p>
                        {conversation.unreadCount > 0 && (
                          <span className="newsfeed-chat-panel__unread-badge">
                            {conversation.unreadCount}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="newsfeed-chat-panel__empty-conversations">
                  {chatError ? "Chat is unavailable right now." : "No conversations yet."}
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
                      {selectedConversation.isOnline && (
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
                                    message.isRead
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
                      type="text"
                      className="newsfeed-chat-panel__input"
                      placeholder="Type a message..."
                      value={messageInput}
                      onChange={(event) => handleInputChange(event.target.value)}
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
