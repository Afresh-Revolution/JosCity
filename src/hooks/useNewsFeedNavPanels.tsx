import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useNavigate } from "react-router-dom";
import { X, Bell, UserCheck, UserX, CheckCircle, Trash2 } from "lucide-react";
import { feedApi } from "../services/feedApi";
import { startVisibleInterval } from "../utils/visibleInterval";
import CreatePostModal, {
  type CreatePostListingPayload,
} from "../pages/NewsFeed/CreatePostModal";
import CreateReelModal from "../components/CreateReelModal";
import CreateStoryPopup from "../components/CreateStoryPopup";
import ChatPanel, { type ChatPanelPopupPayload } from "../components/ChatPanel";
import FindFriendsModal from "../components/FindFriendsModal";
import MessagePopup from "../components/MessagePopup";
import Avatar from "../components/Avatar";
import chatService from "../services/chatService";
import { useGlobalChatRealtime } from "./useGlobalChatRealtime";
import {
  isAuthenticated,
  getUserAvatar as getUserAvatarUtil,
  getUserName as getUserNameUtil,
  getUserData,
  getUserAccountType,
} from "../utils/userUtils";
import {
  type FeedPanelNotification,
  mapApiRowToFeedPanelNotification,
  getFeedPanelNotificationIcon,
  getFeedPanelNotificationColor,
} from "../utils/feedPanelNotifications";
import {
  playNotificationSound,
  showBrowserNotification,
  requestNotificationPermission,
} from "../utils/notificationUtils";
export type UseNewsFeedNavPanelsOptions = {
  mainContentRef?: React.RefObject<HTMLElement | null>;
  /** Default true: refetch main feed after creating a post */
  refetchMainFeedAfterPost?: boolean;
  afterPostCreated?: () => void | Promise<void>;
  createPost?: {
    businessListingFields?: boolean;
    businessFeedNotice?: string;
    customOnPost?: (
      caption: string,
      images: File[] | null,
      videos: File[] | null,
      listingDetails?: CreatePostListingPayload | null
    ) => void | Promise<void>;
    /** Return false to block opening the create-post modal */
    canOpenCreatePost?: () => boolean;
  };
};

export function useNewsFeedNavPanels(options: UseNewsFeedNavPanelsOptions = {}) {
  const {
    mainContentRef,
    refetchMainFeedAfterPost = true,
    afterPostCreated,
    createPost: createPostOpts,
  } = options;

  const navigate = useNavigate();
  const notificationPanelRef = useRef<HTMLDivElement>(null);
  const prevUnreadCountRef = useRef(0);

  const [isAddFriendModalOpen, setIsAddFriendModalOpen] = useState(false);
  const [isChatPanelOpen, setIsChatPanelOpen] = useState(false);
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);
  const [activeChatConversationId, setActiveChatConversationId] = useState<
    number | null
  >(null);
  const [isNotificationPanelOpen, setIsNotificationPanelOpen] = useState(false);
  const [messagePopup, setMessagePopup] = useState<{
    userId: number;
    userName: string;
    userAvatar: string;
    message: string;
    timestamp: string;
    conversationId: number;
  } | null>(null);
  const [isCreatePostModalOpen, setIsCreatePostModalOpen] = useState(false);
  const [isCreateReelModalOpen, setIsCreateReelModalOpen] = useState(false);
  const [isStoryPopupOpen, setIsStoryPopupOpen] = useState(false);
  const [notifications, setNotifications] = useState<FeedPanelNotification[]>(
    []
  );
  const displayName = useMemo(() => {
    if (!isAuthenticated()) return "";
    const user = getUserData();
    if (user) {
      if (user.username) return user.username;
      if (user.user_name) return user.user_name;
      if (user.display_name) return user.display_name;
      if (user.name) return user.name;
      if (user.user_firstname) {
        return user.user_lastname
          ? `${user.user_firstname} ${user.user_lastname}`
          : user.user_firstname;
      }
    }
    return getUserNameUtil();
  }, []);

  const getUserAvatar = () => getUserAvatarUtil() || undefined;

  const fetchNotifications = useCallback(async () => {
    if (!isAuthenticated()) return;
    try {
      const res = await feedApi.getNotifications();
      if (res.success && Array.isArray(res.data)) {
        const mapped: FeedPanelNotification[] = res.data.map((n) =>
          mapApiRowToFeedPanelNotification(
            n as unknown as Parameters<
              typeof mapApiRowToFeedPanelNotification
            >[0]
          )
        );
        setNotifications((prev) => {
          const prevUnread = prev.filter((x) => !x.isRead).length;
          const newUnread = mapped.filter((x) => !x.isRead).length;
          if (newUnread > prevUnread && prevUnreadCountRef.current > 0) {
            playNotificationSound();
          }
          prevUnreadCountRef.current = newUnread;
          return mapped;
        });
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
    return startVisibleInterval(fetchNotifications, 30000);
  }, [fetchNotifications]);

  const unreadNotificationsCount = notifications.filter(
    (n) => !n.isRead
  ).length;

  const markNotificationAsRead = (notificationId: number) => {
    setNotifications((prev) =>
      prev.map((notif) =>
        notif.id === notificationId ? { ...notif, isRead: true } : notif
      )
    );
    feedApi.markNotificationRead(notificationId).catch(() => {});
  };

  const markAllAsRead = async () => {
    try {
      const res = await feedApi.markAllNotificationsRead();
      if (res.success) {
        setNotifications((prev) =>
          prev.map((notif) => ({ ...notif, isRead: true }))
        );
      }
    } catch {
      await fetchNotifications();
    }
  };

  const deleteAllNotificationsForUser = async () => {
    try {
      const res = await feedApi.deleteAllNotifications();
      if (res.success) setNotifications([]);
    } catch {
      await fetchNotifications();
    }
  };

  const deleteNotification = async (notificationId: number) => {
    try {
      const res = await feedApi.deleteNotificationById(notificationId);
      if (res.success) {
        setNotifications((prev) =>
          prev.filter((notif) => notif.id !== notificationId)
        );
      }
    } catch {
      await fetchNotifications();
    }
  };

  const openChatPanel = useCallback((conversationId?: number | null) => {
    setMessagePopup(null);
    setActiveChatConversationId(conversationId ?? null);
    setIsChatPanelOpen(true);
  }, []);

  const closeChatPanel = useCallback(() => {
    setIsChatPanelOpen(false);
    setActiveChatConversationId(null);
  }, []);

  const acceptFriendFromNotification = async (
    e: React.MouseEvent,
    n: FeedPanelNotification
  ) => {
    e.preventDefault();
    e.stopPropagation();
    if (n.relatedFriendRequestId == null) return;
    try {
      const res = await feedApi.acceptFriendRequest(n.relatedFriendRequestId);
      if (res.success) {
        await fetchNotifications();
        const data = res.data as { conversation_id?: number | null } | undefined;
        const cid = data?.conversation_id;
        if (cid != null && Number.isFinite(Number(cid))) {
          setIsNotificationPanelOpen(false);
          openChatPanel(Number(cid));
        }
      }
    } catch {
      await fetchNotifications();
    }
  };

  const rejectFriendFromNotification = async (
    e: React.MouseEvent,
    n: FeedPanelNotification
  ) => {
    e.preventDefault();
    e.stopPropagation();
    if (n.relatedFriendRequestId == null) return;
    try {
      const res = await feedApi.rejectFriendRequest(n.relatedFriendRequestId);
      if (res.success) await fetchNotifications();
    } catch {
      await fetchNotifications();
    }
  };

  const handleIncomingChatMessage = useCallback(
    (payload: ChatPanelPopupPayload) => {
      const messagePreview =
        payload.message.length > 50
          ? `${payload.message.substring(0, 50)}...`
          : payload.message;

      setNotifications((prev) => {
        const existingNotification = prev.find(
          (notification) =>
            notification.type === "message" &&
            notification.relatedChatId === payload.conversationId &&
            notification.userId === payload.userId &&
            notification.timestamp === payload.timestamp
        );
        if (existingNotification) return prev;

        const nextNotification: FeedPanelNotification = {
          id: Date.now(),
          type: "message",
          userId: payload.userId,
          userName: payload.userName,
          userAvatar: payload.userAvatar,
          message: `sent you a message: "${messagePreview}"`,
          timestamp: payload.timestamp,
          isRead: false,
          relatedChatId: payload.conversationId,
        };
        return [nextNotification, ...prev];
      });

      playNotificationSound();
      showBrowserNotification(
        payload.userName,
        messagePreview,
        payload.userAvatar,
        { tag: `chat-${payload.conversationId}` }
      );
      setMessagePopup({
        userId: payload.userId,
        userName: payload.userName,
        userAvatar: payload.userAvatar,
        message: payload.message,
        timestamp: payload.timestamp,
        conversationId: payload.conversationId,
      });
    },
    []
  );

  const { presenceByUserId, handleChatPeerUserIds } = useGlobalChatRealtime(
    isChatPanelOpen,
    activeChatConversationId,
    handleIncomingChatMessage,
    setUnreadMessagesCount
  );

  useEffect(() => {
    requestNotificationPermission();
  }, []);

  useEffect(() => {
    if (!isAuthenticated()) return;
    const unsubscribe = chatService.onAdminNotification((payload: unknown) => {
      const data = payload as {
        id?: number;
        title?: string;
        message?: string;
        notification_type?: string;
        time?: string;
        event?: string;
        expires_at?: string | null;
      };
      const adminNid = data.id;
      if (adminNid == null) return;

      if (data.event === "deleted") {
        setNotifications((prev) => prev.filter((n) => n.id !== adminNid));
        return;
      }

      if (data.event === "updated") {
        setNotifications((prev) => {
          const raw = String(data.notification_type || "normal").toLowerCase();
          const typeForFeed: FeedPanelNotification["type"] =
            raw === "danger" ? "danger" : "mention";
          const idx = prev.findIndex((n) => n.id === adminNid);
          if (idx === -1) {
            const created: FeedPanelNotification = {
              id: adminNid,
              type: typeForFeed,
              nodeType: "admin_notification",
              createdByAdmin: true,
              notificationType: data.notification_type || "normal",
              title: data.title ?? null,
              expiresAt: data.expires_at ?? null,
              userId: 0,
              userName: "Admin",
              userAvatar: "",
              message: data.message || data.title || "Admin update",
              timestamp: data.time || new Date().toISOString(),
              isRead: false,
            };
            return [created, ...prev];
          }
          return prev.map((n) => {
            if (n.id !== adminNid) return n;
            return {
              ...n,
              type: typeForFeed,
              message:
                data.message !== undefined && data.message !== null
                  ? data.message
                  : n.message,
              title: data.title !== undefined ? data.title : n.title,
              notificationType:
                data.notification_type || n.notificationType || "normal",
              timestamp: data.time || n.timestamp,
              expiresAt:
                data.expires_at !== undefined ? data.expires_at : n.expiresAt,
            };
          });
        });
        return;
      }

      const raw = String(data.notification_type || "normal").toLowerCase();
      const next: FeedPanelNotification = {
        id: adminNid,
        type: raw === "danger" ? "danger" : "mention",
        nodeType: "admin_notification",
        createdByAdmin: true,
        notificationType: data.notification_type || "normal",
        title: data.title ?? null,
        expiresAt: data.expires_at ?? null,
        userId: 0,
        userName: "Admin",
        userAvatar: "",
        message: data.message || data.title || "Admin update",
        timestamp: data.time || new Date().toISOString(),
        isRead: false,
      };

      setNotifications((prev) => {
        const withoutCurrent = prev.filter((n) => n.id !== next.id);
        return [next, ...withoutCurrent];
      });
      playNotificationSound();
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const handleNewPost = async (
    caption: string,
    images: File[] | null,
    videos: File[] | null,
    listingDetails?: CreatePostListingPayload | null
  ) => {
    if (createPostOpts?.customOnPost) {
      try {
        await createPostOpts.customOnPost(
          caption,
          images,
          videos,
          listingDetails ?? null
        );
        setIsCreatePostModalOpen(false);
      } catch (error) {
        console.error(error);
        alert(
          error instanceof Error
            ? error.message
            : "Failed to create post. Please try again."
        );
      }
      return;
    }

    if (!isAuthenticated()) {
      alert("Please sign in to create a post.");
      navigate("/signin");
      return;
    }

    try {
      const response = await feedApi.createPost({
        caption: caption.trim() || undefined,
        images: images || undefined,
        videos: videos || undefined,
        listingDetails: listingDetails ?? undefined,
      });

      const feed =
        response.data ??
        (response as { post?: unknown }).post ??
        (response &&
        typeof response === "object" &&
        ("post_id" in response || "id" in response)
          ? response
          : null);

      if (feed) {
        if (refetchMainFeedAfterPost) {
          await feedApi.getFeeds({ feedChannel: "main" });
        }
        await afterPostCreated?.();
        setIsCreatePostModalOpen(false);
      } else {
        alert("Failed to create post. Please try again.");
      }
    } catch (error) {
      console.error("Error creating post:", error);
      alert(
        error instanceof Error
          ? `Error creating post: ${error.message}`
          : "Failed to create post. Please try again."
      );
    }
  };

  const handleStoryPublish = (
    _message: string,
    _image?: string,
    _video?: string
  ) => {
    setIsStoryPopupOpen(false);
  };

  const openCreatePost = useCallback(() => {
    if (
      createPostOpts?.canOpenCreatePost &&
      !createPostOpts.canOpenCreatePost()
    ) {
      return;
    }
    setIsCreatePostModalOpen(true);
  }, [createPostOpts?.canOpenCreatePost]);

  const headerNavProps = useMemo(
    () => ({
      onAddFriend: () => setIsAddFriendModalOpen(true),
      onOpenChat: () => openChatPanel(),
      onOpenNotifications: () => setIsNotificationPanelOpen(true),
      onCreatePost: openCreatePost,
      onCreateStory: () => setIsStoryPopupOpen(true),
      onCreateReel: () => setIsCreateReelModalOpen(true),
      unreadNotificationsCount,
      unreadMessagesCount,
      mainContentRef,
    }),
    [
      openChatPanel,
      openCreatePost,
      unreadNotificationsCount,
      unreadMessagesCount,
      mainContentRef,
    ]
  );

  const panels = useMemo(
    () => (
      <>
        <FindFriendsModal
          isOpen={isAddFriendModalOpen}
          onClose={() => setIsAddFriendModalOpen(false)}
        />

        <ChatPanel
          isOpen={isChatPanelOpen}
          onClose={closeChatPanel}
          onUnreadCountChange={setUnreadMessagesCount}
          activeConversationId={activeChatConversationId}
          remotePresenceByUserId={presenceByUserId}
          onChatPeerUserIds={handleChatPeerUserIds}
        />

        {isNotificationPanelOpen && (
          <div
            className="newsfeed-notification-panel-overlay"
            onClick={() => setIsNotificationPanelOpen(false)}
          >
            <div
              ref={notificationPanelRef}
              className="newsfeed-notification-panel"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="newsfeed-notification-panel__header">
                <div className="newsfeed-notification-panel__header-content">
                  <h3>Notifications</h3>
                  {unreadNotificationsCount > 0 && (
                    <span className="newsfeed-notification-panel__unread-count">
                      {unreadNotificationsCount} new
                    </span>
                  )}
                </div>
                <div className="newsfeed-notification-panel__header-actions">
                  {unreadNotificationsCount > 0 && (
                    <button
                      type="button"
                      className="newsfeed-notification-panel__action-btn"
                      onClick={() => void markAllAsRead()}
                      title="Mark all as read"
                    >
                      <CheckCircle size={18} />
                    </button>
                  )}
                  {notifications.length > 0 && (
                    <button
                      type="button"
                      className="newsfeed-notification-panel__action-btn"
                      onClick={() => void deleteAllNotificationsForUser()}
                      title="Clear all"
                    >
                      <Trash2 size={18} />
                    </button>
                  )}
                  <button
                    type="button"
                    className="newsfeed-notification-panel__close"
                    onClick={() => setIsNotificationPanelOpen(false)}
                    aria-label="Close notifications"
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>

              <div className="newsfeed-notification-panel__content">
                {notifications.length > 0 ? (
                  <div className="newsfeed-notification-panel__list">
                    {notifications.map((notification) => (
                      <div
                        key={notification.id}
                        className={`newsfeed-notification-panel__item ${
                          !notification.isRead
                            ? "newsfeed-notification-panel__item--unread"
                            : ""
                        }`}
                        onClick={() => {
                          markNotificationAsRead(notification.id);
                          if (
                            notification.type === "message" &&
                            notification.relatedChatId
                          ) {
                            setIsNotificationPanelOpen(false);
                            openChatPanel(notification.relatedChatId);
                          }
                        }}
                        role="presentation"
                      >
                        <div
                          className="newsfeed-notification-panel__icon-wrapper"
                          style={{
                            backgroundColor: `${getFeedPanelNotificationColor(
                              notification
                            )}20`,
                          }}
                        >
                          <div
                            className="newsfeed-notification-panel__icon"
                            style={{
                              color: getFeedPanelNotificationColor(notification),
                            }}
                          >
                            {getFeedPanelNotificationIcon(notification)}
                          </div>
                        </div>
                        <div className="newsfeed-notification-panel__content-wrapper">
                          <div className="newsfeed-notification-panel__user-info">
                            <Avatar
                              src={notification.userAvatar}
                              alt={notification.userName}
                              name={notification.userName}
                              size={40}
                              className="newsfeed-notification-panel__avatar"
                            />
                            <div className="newsfeed-notification-panel__text">
                              <p className="newsfeed-notification-panel__message">
                                <span className="newsfeed-notification-panel__user-name">
                                  {notification.userName}
                                </span>{" "}
                                {notification.message}
                              </p>
                              <span className="newsfeed-notification-panel__timestamp">
                                {notification.timestamp}
                              </span>
                              {notification.type === "friend_request" &&
                                notification.relatedFriendRequestId != null && (
                                  <div
                                    className="newsfeed-notification-panel__friend-actions"
                                    role="group"
                                    aria-label="Friend request actions"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <button
                                      type="button"
                                      className="newsfeed-notification-panel__friend-action-btn newsfeed-notification-panel__friend-action-btn--accept"
                                      title="Accept friend request"
                                      aria-label="Accept friend request"
                                      onClick={(e) =>
                                        void acceptFriendFromNotification(
                                          e,
                                          notification
                                        )
                                      }
                                    >
                                      <UserCheck size={18} />
                                    </button>
                                    <button
                                      type="button"
                                      className="newsfeed-notification-panel__friend-action-btn newsfeed-notification-panel__friend-action-btn--reject"
                                      title="Decline friend request"
                                      aria-label="Decline friend request"
                                      onClick={(e) =>
                                        void rejectFriendFromNotification(
                                          e,
                                          notification
                                        )
                                      }
                                    >
                                      <UserX size={18} />
                                    </button>
                                  </div>
                                )}
                            </div>
                          </div>
                          {!notification.isRead && (
                            <span className="newsfeed-notification-panel__unread-dot" />
                          )}
                        </div>
                        <button
                          type="button"
                          className="newsfeed-notification-panel__delete-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            void deleteNotification(notification.id);
                          }}
                          aria-label="Delete notification"
                          title="Delete"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="newsfeed-notification-panel__empty">
                    <Bell size={64} />
                    <p>No notifications</p>
                    <p className="newsfeed-notification-panel__empty-subtitle">
                      You&apos;re all caught up!
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {messagePopup && (
          <MessagePopup
            userId={messagePopup.userId}
            userName={messagePopup.userName}
            userAvatar={messagePopup.userAvatar}
            message={messagePopup.message}
            timestamp={messagePopup.timestamp}
            onClose={() => setMessagePopup(null)}
            onOpenChat={() => openChatPanel(messagePopup.conversationId)}
          />
        )}

        {isAuthenticated() && displayName && (
          <CreatePostModal
            isOpen={isCreatePostModalOpen}
            onClose={() => setIsCreatePostModalOpen(false)}
            userName={displayName}
            userAvatar={getUserAvatar()}
            businessListingFields={
              createPostOpts?.businessListingFields ??
              getUserAccountType().toLowerCase() === "business"
            }
            businessFeedNotice={
              createPostOpts?.businessFeedNotice ??
              "As a business account, this post appears only in the Business section, not on the main news feed."
            }
            onPost={handleNewPost}
          />
        )}

        {isAuthenticated() && displayName && (
          <CreateReelModal
            isOpen={isCreateReelModalOpen}
            onClose={() => setIsCreateReelModalOpen(false)}
            userName={displayName}
            userAvatar={getUserAvatar()}
            onCreated={() => {
              setIsCreateReelModalOpen(false);
              navigate("/reels");
            }}
          />
        )}

        <CreateStoryPopup
          isOpen={isStoryPopupOpen}
          onClose={() => setIsStoryPopupOpen(false)}
          onPublish={handleStoryPublish}
        />
      </>
    ),
    [
      isAddFriendModalOpen,
      isChatPanelOpen,
      closeChatPanel,
      activeChatConversationId,
      presenceByUserId,
      handleChatPeerUserIds,
      isNotificationPanelOpen,
      notifications,
      unreadNotificationsCount,
      messagePopup,
      openChatPanel,
      isCreatePostModalOpen,
      isCreateReelModalOpen,
      isStoryPopupOpen,
      displayName,
      createPostOpts?.businessListingFields,
      createPostOpts?.businessFeedNotice,
      navigate,
    ]
  );

  return {
    panels,
    headerNavProps,
    unreadNotificationsCount,
    unreadMessagesCount,
  };
}
