import React, { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bell,
  Search,
  X,
  Building2,
  UserCheck,
  UserX,
  CheckCircle,
  Trash2,
} from "lucide-react";
import Avatar from "../../components/Avatar";
import ChatPanel from "../../components/ChatPanel";
import ProfileModal from "../../components/ProfileModal";
import FindFriendsModal from "../../components/FindFriendsModal";
import NewsFeedSidebar from "./NewsFeedSidebar";
import NewsFeedHeader from "./NewsFeedHeader";
import PostCard from "./PostCard";
import NewsfeedRightAside from "./NewsfeedRightAside";
import { useNewsfeedAsideTrending } from "../../hooks/useNewsfeedAsideTrending";
import {
  getProfileUsername,
  getUserName,
  isAuthenticated,
  getUserAccountType,
  getUserAvatar,
  getUserData,
} from "../../utils/userUtils";
import { feedApi } from "../../services/feedApi";
import { mapFeedApiItemToPost } from "../../utils/mapFeedApiItemToPost";
import CreatePostModal, {
  type CreatePostListingPayload,
} from "./CreatePostModal";
import {
  type FeedPanelNotification,
  mapApiRowToFeedPanelNotification,
  getFeedPanelNotificationIcon,
  getFeedPanelNotificationColor,
} from "../../utils/feedPanelNotifications";
import { addFriend } from "../../utils/friendUtils";
import { friendApi } from "../../services/friendApi";
import { CHAT_UI_REFRESH_EVENT } from "../../services/chatService";
import {
  playNotificationSound,
  showBrowserNotification,
  requestNotificationPermission,
} from "../../utils/notificationUtils";
import "../../scss/_business.scss";
import "../../scss/_emojipicker.scss";
import "../../scss/_profilemodal.scss";
import "../../scss/_messagepopup.scss";

// Post interface matching the PostCard component
interface Post {
  id: number;
  userName: string;
  userAvatar: string;
  action: string;
  timeAgo: string;
  image?: string;
  images?: string[];
  video?: string;
  videos?: string[];
  likes: number;
  comments: number;
  views: number;
  reviews: number;
  hashtags?: string;
  caption?: string;
  accountType?: string;
  userId?: number;
  userReacted?: boolean;
  userShared?: boolean;
  originalPost?: import("../../utils/mapFeedApiItemToPost").EmbeddedPostShape;
  listingDetails?: import("../../utils/mapFeedApiItemToPost").ListingDetails | null;
}

const Business: React.FC = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [isLeftSidebarOpen, setIsLeftSidebarOpen] = useState(false);
  const [isRightSidebarOpen, setIsRightSidebarOpen] = useState(false);
  const [businessPosts, setBusinessPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreatePostModalOpen, setIsCreatePostModalOpen] = useState(false);
  const mainContentRef = useRef<HTMLElement>(null);
  const isBusinessAccount =
    getUserAccountType().toLowerCase() === "business";

  const [isChatPanelOpen, setIsChatPanelOpen] = useState(false);
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);
  const [activeChatConversationId, setActiveChatConversationId] = useState<
    number | null
  >(null);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [selectedProfileUserId, setSelectedProfileUserId] = useState<
    number | null
  >(null);

  // Notifications state
  const [isNotificationPanelOpen, setIsNotificationPanelOpen] = useState(false);
  const [notifications, setNotifications] = useState<FeedPanelNotification[]>(
    []
  );
  const [friendsList, setFriendsList] = useState<number[]>([]); // List of user IDs that are following the current user
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);

  // Refs
  const notificationPanelRef = useRef<HTMLDivElement>(null);

  // Add Friend Modal state
  const [isAddFriendModalOpen, setIsAddFriendModalOpen] = useState(false);

  const trending = useNewsfeedAsideTrending(businessPosts);

  const loadBusinessPosts = useCallback(async () => {
    if (!isAuthenticated()) {
      setBusinessPosts([]);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const response = await feedApi.getFeeds({
        feedChannel: "business",
        limit: 30,
        page: 1,
      });
      if (
        response?.success &&
        Array.isArray(response.data) &&
        response.data.length > 0
      ) {
        const mapped = (response.data as unknown[])
          .map((row) => mapFeedApiItemToPost(row))
          .filter((p): p is NonNullable<typeof p> => p != null)
          .map(
            (p): Post => ({
              id: p.id,
              userId: p.userId,
              userName: p.userName,
              userAvatar: p.userAvatar,
              action: p.action,
              timeAgo: p.timeAgo,
              image: p.image,
              images: p.images,
              video: p.video,
              videos: p.videos,
              likes: p.likes,
              comments: p.comments,
              views: p.views,
              reviews: p.reviews,
              caption: p.caption,
              hashtags: p.hashtags,
              accountType: p.accountType,
              userReacted: p.userReacted,
              userShared: p.userShared,
              originalPost: p.originalPost,
              listingDetails: p.listingDetails,
            })
          )
          .filter(
            (p) => p.accountType?.toLowerCase() === "business"
          );
        setBusinessPosts(mapped);
      } else {
        setBusinessPosts([]);
      }
    } catch (error) {
      console.error("Error loading business feed:", error);
      setBusinessPosts([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadBusinessPosts();
  }, [loadBusinessPosts]);

  const handleBusinessNewPost = async (
    caption: string,
    images: File[] | null,
    videos: File[] | null,
    listingDetails?: CreatePostListingPayload | null
  ) => {
    if (!isAuthenticated()) {
      alert("Please sign in to create a post.");
      navigate("/signin");
      return;
    }
    if (!isBusinessAccount) {
      alert("Only business accounts can post in the Business section.");
      return;
    }
    await feedApi.createPost({
      caption: caption.trim() || undefined,
      images: images || undefined,
      videos: videos || undefined,
      listingDetails: listingDetails ?? undefined,
    });
    await loadBusinessPosts();
  };

  const openBusinessCreatePost = () => {
    if (!isBusinessAccount) {
      alert("Only business accounts can create posts in the Business section.");
      return;
    }
    setIsCreatePostModalOpen(true);
  };

  // Filter posts based on search query
  const filteredPosts = businessPosts.filter((post) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      post.caption?.toLowerCase().includes(query) ||
      post.userName.toLowerCase().includes(query) ||
      post.hashtags?.toLowerCase().includes(query) ||
      post.action?.toLowerCase().includes(query)
    );
  });

  const handleProfileClick = () => {
    const username = getProfileUsername();
    if (username) {
      navigate(`/profile/${username}`);
    }
  };

  const fetchNotifications = useCallback(async () => {
    if (!isAuthenticated()) return;
    try {
      const res = await feedApi.getNotifications();
      if (res.success && Array.isArray(res.data)) {
        setNotifications(
          res.data.map((n) => mapApiRowToFeedPanelNotification(n as never))
        );
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
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
        const cid =
          data?.conversation_id != null ? Number(data.conversation_id) : undefined;
        if (cid != null && Number.isFinite(cid)) {
          handleFriendAdded(n.userId, n.userName, cid);
          setActiveChatConversationId(cid);
          setIsChatPanelOpen(true);
          setIsNotificationPanelOpen(false);
        } else {
          handleFriendAdded(n.userId, n.userName);
          setActiveChatConversationId(-n.userId);
          setIsChatPanelOpen(true);
          setIsNotificationPanelOpen(false);
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

  // Request notification permission on mount
  useEffect(() => {
    requestNotificationPermission();
  }, []);

  // Get current user ID and load friends list
  useEffect(() => {
    const user = getUserData();
    if (user && (user.user_id || (user as { id?: number }).id)) {
      const userId = (user.user_id as number) || ((user as { id?: number }).id as number);
      setCurrentUserId(userId);
      loadFriendsList();
    }
  }, []);

  // Load friends list to check who is following the current user
  const loadFriendsList = useCallback(async () => {
    try {
      const response = await friendApi.getFriends();
      if (response.success && response.data) {
        // Get list of user IDs who are friends (following the current user)
        const friendIds = response.data.map((friend) => friend.user_id);
        setFriendsList(friendIds);
      }
    } catch (error) {
      console.error("Error loading friends list:", error);
    }
  }, []);

  // Helper function to check if post belongs to current user
  const isMyPost = (postOwnerName: string): boolean => {
    const user = getUserData();
    if (!user) return false;
    
    // Check various name formats
    const currentDisplayName = user.display_name || user.name || "";
    const currentFullName = user.user_firstname && user.user_lastname
      ? `${user.user_firstname} ${user.user_lastname}`.trim()
      : "";
    const currentBusinessName = (user as { business_name?: string }).business_name || "";
    
    // Normalize names for comparison (case-insensitive, trim whitespace)
    const normalize = (str: string) => str.toLowerCase().trim();
    
    return (
      normalize(postOwnerName) === normalize(currentDisplayName) ||
      normalize(postOwnerName) === normalize(currentFullName) ||
      normalize(postOwnerName) === normalize(currentBusinessName)
    );
  };

  // Listen for post likes - only notify if the user who liked is following
  useEffect(() => {
    const handlePostLike = async (event: CustomEvent) => {
      const { postId, postOwnerName, likerId, likerName, likerAvatar } = event.detail;
      
      // Don't notify if user liked their own post
      if (likerId === currentUserId) return;
      
      // Only notify if:
      // 1. It's the current user's post
      // 2. The liker is following the current user (is in friends list)
      if (isMyPost(postOwnerName) && likerId && friendsList.includes(likerId)) {
        const newNotification: FeedPanelNotification = {
          id: Date.now(),
          type: "like",
          userId: likerId,
          userName: likerName || "Someone",
          userAvatar: likerAvatar || "",
          message: "liked your post",
          timestamp: "Just now",
          isRead: false,
          relatedPostId: postId,
        };

        setNotifications((prev) => {
          // Check if notification already exists for this like
          const existingNotification = prev.find(
            (n) =>
              n.type === "like" &&
              n.relatedPostId === postId &&
              n.userId === likerId
          );
          if (!existingNotification) {
            playNotificationSound();
            showBrowserNotification(
              likerName || "Someone",
              "liked your post",
              likerAvatar || ""
            );
            return [newNotification, ...prev];
          }
          return prev;
        });
      }
    };

    window.addEventListener("postLiked" as any, handlePostLike as unknown as EventListener);
    return () => {
      window.removeEventListener("postLiked" as any, handlePostLike as unknown as EventListener);
    };
  }, [currentUserId, friendsList]);

  // Listen for post comments - only notify if the user who commented is following
  useEffect(() => {
    const handlePostComment = async (event: CustomEvent) => {
      const { postId, postOwnerName, commenterId, commenterName, commenterAvatar, commentText } = event.detail;
      
      // Don't notify if user commented on their own post
      if (commenterId === currentUserId) return;
      
      // Only notify if:
      // 1. It's the current user's post
      // 2. The commenter is following the current user (is in friends list)
      if (isMyPost(postOwnerName) && commenterId && friendsList.includes(commenterId)) {
        const messageText = commentText && commentText.length > 50
          ? `commented: "${commentText.substring(0, 50)}..."`
          : commentText
          ? `commented: "${commentText}"`
          : "commented on your post";

        const newNotification: FeedPanelNotification = {
          id: Date.now(),
          type: "comment",
          userId: commenterId,
          userName: commenterName || "Someone",
          userAvatar: commenterAvatar || "",
          message: messageText,
          timestamp: "Just now",
          isRead: false,
          relatedPostId: postId,
        };

        setNotifications((prev) => {
          // Check if notification already exists for this comment (within last 5 seconds)
          const recentNotification = prev.find(
            (n) =>
              n.type === "comment" &&
              n.relatedPostId === postId &&
              n.userId === commenterId &&
              n.timestamp === "Just now"
          );
          if (!recentNotification) {
            playNotificationSound();
            showBrowserNotification(
              commenterName || "Someone",
              commentText && commentText.length > 50
                ? commentText.substring(0, 50) + "..."
                : commentText || "commented on your post",
              commenterAvatar || ""
            );
            return [newNotification, ...prev];
          }
          return prev;
        });
      }
    };

    window.addEventListener("postCommented" as any, handlePostComment as unknown as EventListener);
    return () => {
      window.removeEventListener("postCommented" as any, handlePostComment as unknown as EventListener);
    };
  }, [currentUserId, friendsList]);

  // Listen for friend request acceptances (when someone starts following)
  useEffect(() => {
    const handleFriendAddedEvent = (event: CustomEvent) => {
      const { friendId, friendName, friendAvatar } = event.detail;
      
      // Add to friends list
      setFriendsList((prev) => {
        if (!prev.includes(friendId)) {
          return [...prev, friendId];
        }
        return prev;
      });

      // Reload friends list to ensure it's up to date
      loadFriendsList();

      // Create notification for friend request acceptance
      const newNotification: FeedPanelNotification = {
        id: Date.now(),
        type: "friend_request",
        userId: friendId,
        userName: friendName || "Someone",
        userAvatar: friendAvatar || "",
        message: "started following you",
        timestamp: "Just now",
        isRead: false,
      };

      setNotifications((prev) => {
        const existingNotification = prev.find(
          (n) =>
            n.type === "friend_request" &&
            n.userId === friendId &&
            n.message === "started following you"
        );
        if (!existingNotification) {
          playNotificationSound();
          showBrowserNotification(
            friendName || "Someone",
            "started following you",
            friendAvatar || ""
          );
          return [newNotification, ...prev];
        }
        return prev;
      });
    };

    window.addEventListener("friendAdded" as any, handleFriendAddedEvent as EventListener);
    return () => {
      window.removeEventListener("friendAdded" as any, handleFriendAddedEvent as EventListener);
    };
  }, []);

  // Refresh friends list periodically to catch new followers
  useEffect(() => {
    const interval = setInterval(() => {
      loadFriendsList();
    }, 60000); // Refresh every minute

    return () => clearInterval(interval);
  }, [loadFriendsList]);

  // Handle friend added
  const handleFriendAdded = (
    friendId: number,
    friendName: string,
    _conversationId?: number
  ) => {
    // Add friend to friends list
    addFriend(friendId);
    
    // Update friends list state
    setFriendsList((prev) => {
      if (!prev.includes(friendId)) {
        return [...prev, friendId];
      }
      return prev;
    });

    window.dispatchEvent(new CustomEvent(CHAT_UI_REFRESH_EVENT));

    // Dispatch event for friend added notification
    const friendAddedEvent = new CustomEvent("friendAdded", {
      detail: {
        friendId,
        friendName,
        friendAvatar: "",
      },
    });
    window.dispatchEvent(friendAddedEvent);
  };

  return (
    <div className="newsfeed-page business-page">
      <NewsFeedHeader
        isLeftSidebarOpen={isLeftSidebarOpen}
        onToggleLeftSidebar={() => setIsLeftSidebarOpen(!isLeftSidebarOpen)}
        isRightSidebarOpen={isRightSidebarOpen}
        onToggleRightSidebar={() => setIsRightSidebarOpen(!isRightSidebarOpen)}
        onCreatePost={openBusinessCreatePost}
        onProfileClick={handleProfileClick}
        onAddFriend={() => setIsAddFriendModalOpen(true)}
        onOpenChat={() => {
          setActiveChatConversationId(null);
          setIsChatPanelOpen(true);
        }}
        onOpenNotifications={() => setIsNotificationPanelOpen(true)}
        unreadNotificationsCount={unreadNotificationsCount}
        unreadMessagesCount={unreadMessagesCount}
        mainContentRef={mainContentRef}
      />

      {/* Main Content */}
      <div className="newsfeed-container">
        {/* Left Sidebar */}
        <NewsFeedSidebar
          isOpen={isLeftSidebarOpen}
          onClose={() => setIsLeftSidebarOpen(false)}
        />

        <main className="newsfeed-main" ref={mainContentRef}>
          {/* Header Section */}
          <div className="newsfeed-search-section">
            <div className="newsfeed-search-section__input-wrapper">
              <input
                type="text"
                className="newsfeed-search-section__input"
                placeholder="Search business posts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <Search className="newsfeed-search-section__icon" size={20} />
            </div>
          </div>

          {/* Business Posts Header */}
          <div className="newsfeed-posts">
            <div className="newsfeed-post">
              <div className="newsfeed-post__header">
                <div className="newsfeed-post__user-info">
                  <div className="newsfeed-post__avatar">
                    <Building2 size={24} fill="currentColor" />
                  </div>
                  <div className="newsfeed-post__user-details">
                    <h3 className="newsfeed-post__user-name">Business Posts</h3>
                    <p className="newsfeed-post__action">
                      {businessPosts.length}{" "}
                      {businessPosts.length === 1 ? "post" : "posts"} from
                      businesses
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Loading State */}
            {isLoading && (
              <div className="newsfeed-post">
                <div className="newsfeed-post__caption">
                  <p>Loading business posts...</p>
                </div>
              </div>
            )}

            {/* Empty State */}
            {!isLoading && filteredPosts.length === 0 && (
              <div className="newsfeed-post">
                <div className="newsfeed-post__caption">
                  <p>
                    {searchQuery
                      ? "No business posts match your search."
                      : businessPosts.length === 0
                      ? "No business posts available yet. Posts from business accounts will appear here."
                      : "No business posts match your search."}
                  </p>
                </div>
              </div>
            )}

            {/* Business Posts List */}
            {!isLoading &&
              filteredPosts.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
          </div>
        </main>

        <NewsfeedRightAside
          isOpen={isRightSidebarOpen}
          onClose={() => setIsRightSidebarOpen(false)}
          trending={trending}
          onHashtagClick={(hashtag) => setSearchQuery(hashtag)}
          suggestedSection="businesses"
        />

        {/* Below nav panels in stacking order: dims main; left/right panels stay above */}
        {(isLeftSidebarOpen || isRightSidebarOpen) && (
          <div
            className="newsfeed-overlay newsfeed-overlay--in-container"
            onClick={() => {
              setIsLeftSidebarOpen(false);
              setIsRightSidebarOpen(false);
            }}
            aria-hidden="true"
          />
        )}
      </div>

      {/* Add Friend Modal */}
      <FindFriendsModal
        isOpen={isAddFriendModalOpen}
        onClose={() => setIsAddFriendModalOpen(false)}
      />

      {isAuthenticated() && isBusinessAccount && (
        <CreatePostModal
          isOpen={isCreatePostModalOpen}
          onClose={() => setIsCreatePostModalOpen(false)}
          userName={getUserName()}
          userAvatar={getUserAvatar() ?? undefined}
          businessListingFields
          businessFeedNotice="This post is published to the Business section only."
          onPost={handleBusinessNewPost}
        />
      )}

      <ChatPanel
        isOpen={isChatPanelOpen}
        onClose={() => {
          setIsChatPanelOpen(false);
          setActiveChatConversationId(null);
        }}
        onUnreadCountChange={setUnreadMessagesCount}
        activeConversationId={activeChatConversationId}
      />

      {/* Profile Modal */}
      {isProfileModalOpen && selectedProfileUserId && (
        <ProfileModal
          isOpen={isProfileModalOpen}
          onClose={() => {
            setIsProfileModalOpen(false);
            setSelectedProfileUserId(null);
          }}
          userId={selectedProfileUserId}
          userName="User"
          userAvatar=""
          isOnline={false}
          onMessage={() => {
            if (selectedProfileUserId != null) {
              setActiveChatConversationId(-selectedProfileUserId);
              setIsChatPanelOpen(true);
            }
          }}
          onAddFriend={() => {
            console.log("Add friend:", selectedProfileUserId);
          }}
        />
      )}

      {/* Notification Panel */}
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
                    className="newsfeed-notification-panel__action-btn"
                    onClick={() => void markAllAsRead()}
                    title="Mark all as read"
                  >
                    <CheckCircle size={18} />
                  </button>
                )}
                {notifications.length > 0 && (
                  <button
                    className="newsfeed-notification-panel__action-btn"
                    onClick={() => void deleteAllNotificationsForUser()}
                    title="Clear all"
                  >
                    <Trash2 size={18} />
                  </button>
                )}
                <button
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
                      onClick={() => markNotificationAsRead(notification.id)}
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
                          <span className="newsfeed-notification-panel__unread-dot"></span>
                        )}
                      </div>
                      <button
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
                    You're all caught up!
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Business;
