import React, { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  X,
  Users,
  Building2,
  Send,
  MoreVertical,
  Paperclip,
  Smile,
  Heart,
  MessageSquare,
  UserCheck,
  ThumbsUp,
  CheckCircle,
  Trash2,
  Image,
  Video,
  User,
  Calendar,
  Hash,
  Bell,
} from "lucide-react";
import LazyImage from "../../components/LazyImage";
import Avatar from "../../components/Avatar";
import EmojiPicker from "../../components/EmojiPicker";
import ProfileModal from "../../components/ProfileModal";
import FindFriendsModal from "../../components/FindFriendsModal";
import NewsFeedSidebar from "./NewsFeedSidebar";
import NewsFeedHeader from "./NewsFeedHeader";
import PostCard from "./PostCard";
import SuggestedBusinesses from "./SuggestedBusinesses";
import {
  getUserInitials,
  getProfileUsername,
} from "../../utils/userUtils";
import { addFriend } from "../../utils/friendUtils";
import { friendApi } from "../../services/friendApi";
import {
  playNotificationSound,
  showBrowserNotification,
  requestNotificationPermission,
} from "../../utils/notificationUtils";
import { getUserData } from "../../utils/userUtils";
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
  accountType?: string; // Store account type with post
}

// Chat interfaces
interface ChatMessage {
  id: number;
  senderId: number;
  text: string;
  timestamp: string;
  isRead: boolean;
  attachment?: {
    type: "image" | "video" | "file";
    url: string;
    fileName?: string;
    fileSize?: number;
  };
}

interface ChatConversation {
  id: number;
  userId: number;
  userName: string;
  userAvatar: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  isOnline: boolean;
  messages: ChatMessage[];
}

// Notification interface
interface Notification {
  id: number;
  type:
  | "like"
  | "comment"
  | "friend_request"
  | "mention"
  | "share"
  | "event"
  | "message";
  userId: number;
  userName: string;
  userAvatar: string;
  message: string;
  timestamp: string;
  isRead: boolean;
  relatedPostId?: number;
  relatedEventId?: number;
  relatedChatId?: number;
}

const Business: React.FC = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [isLeftSidebarOpen, setIsLeftSidebarOpen] = useState(false);
  const [isRightSidebarOpen, setIsRightSidebarOpen] = useState(false);
  const [businessPosts, setBusinessPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Chat/Messages state
  const [isChatPanelOpen, setIsChatPanelOpen] = useState(false);
  const [selectedChatId, setSelectedChatId] = useState<number | null>(null);
  const [chatSearchQuery, setChatSearchQuery] = useState("");
  const [messageInput, setMessageInput] = useState("");
  const [chatConversations, setChatConversations] = useState<
    ChatConversation[]
  >([]);
  const [messageAttachment, setMessageAttachment] = useState<{
    type: "image" | "video" | "file";
    url: string;
    fileName?: string;
    fileSize?: number;
  } | null>(null);
  const [isAttachmentMenuOpen, setIsAttachmentMenuOpen] = useState(false);
  const [isChatMenuOpen, setIsChatMenuOpen] = useState(false);
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [selectedProfileUserId, setSelectedProfileUserId] = useState<
    number | null
  >(null);

  // Notifications state
  const [isNotificationPanelOpen, setIsNotificationPanelOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [friendsList, setFriendsList] = useState<number[]>([]); // List of user IDs that are following the current user
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);

  // Refs
  const chatPanelRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const notificationPanelRef = useRef<HTMLDivElement>(null);
  const attachmentMenuRef = useRef<HTMLDivElement>(null);
  const attachmentButtonRef = useRef<HTMLButtonElement>(null);
  const chatMenuRef = useRef<HTMLDivElement>(null);
  const chatMenuButtonRef = useRef<HTMLButtonElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  // Add Friend Modal state
  const [isAddFriendModalOpen, setIsAddFriendModalOpen] = useState(false);

  // Load business posts from localStorage
  const loadBusinessPosts = useCallback(() => {
    try {
      setIsLoading(true);
      // Get all posts from localStorage
      const allPosts = JSON.parse(
        localStorage.getItem("allPosts") || "[]"
      ) as Post[];

      // Filter posts from business account_type users
      const business = allPosts.filter((post) => {
        // If post has accountType field, use it
        if (post.accountType) {
          const accountType = post.accountType.toLowerCase();
          return accountType === "business" || accountType === "Business";
        }
        // For posts without accountType, we can't reliably filter
        // So we'll only show posts that explicitly have accountType: "Business"
        return false;
      });

      // If no business posts found, use mock data for demonstration
      if (business.length === 0) {
        // Mock business posts
        const mockBusinessPosts: Post[] = [
          {
            id: 101,
            userName: "Tech Solutions Inc.",
            userAvatar: "",
            action: "shared a new product",
            timeAgo: "2 hours ago",
            image: "",
            likes: 12,
            comments: 3,
            views: 150,
            reviews: 5,
            caption:
              "Introducing our latest innovation! We're excited to share this with our community. #TechInnovation #Business",
            accountType: "Business",
          },
          {
            id: 102,
            userName: "Local Restaurant",
            userAvatar: "",
            action: "updated their menu",
            timeAgo: "5 hours ago",
            image: "",
            likes: 8,
            comments: 2,
            views: 89,
            reviews: 4,
            caption:
              "Check out our new seasonal menu! Fresh ingredients, amazing flavors. Come visit us today! #Food #LocalBusiness",
            accountType: "Business",
          },
        ];
        setBusinessPosts(mockBusinessPosts);
      } else {
        setBusinessPosts(business);
      }
    } catch (error) {
      console.error("Error loading business posts:", error);
      setBusinessPosts([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Listen for storage changes to update business posts
  useEffect(() => {
    loadBusinessPosts();

    // Listen for custom event when posts are updated
    const handleStorageChange = () => {
      loadBusinessPosts();
    };

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("allPostsUpdated", handleStorageChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("allPostsUpdated", handleStorageChange);
    };
  }, [loadBusinessPosts]);

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

  // Calculate unread notifications count
  const unreadNotificationsCount = notifications.filter(
    (n) => !n.isRead
  ).length;

  // Mark notification as read
  const markNotificationAsRead = (notificationId: number) => {
    setNotifications((prev) =>
      prev.map((notif) =>
        notif.id === notificationId ? { ...notif, isRead: true } : notif
      )
    );
  };

  // Mark all notifications as read
  const markAllAsRead = () => {
    setNotifications((prev) =>
      prev.map((notif) => ({ ...notif, isRead: true }))
    );
  };

  // Clear all notifications
  const clearAllNotifications = () => {
    setNotifications([]);
  };

  // Delete notification
  const deleteNotification = (notificationId: number) => {
    setNotifications((prev) =>
      prev.filter((notif) => notif.id !== notificationId)
    );
  };

  // Get notification icon based on type
  const getNotificationIcon = (type: Notification["type"]) => {
    switch (type) {
      case "like":
        return <Heart size={20} />;
      case "comment":
        return <MessageSquare size={20} />;
      case "friend_request":
        return <UserCheck size={20} />;
      case "mention":
        return <Hash size={20} />;
      case "share":
        return <ThumbsUp size={20} />;
      case "event":
        return <Calendar size={20} />;
      default:
        return <Bell size={20} />;
    }
  };

  // Get notification color based on type
  const getNotificationColor = (type: Notification["type"]) => {
    switch (type) {
      case "like":
        return "#e91e63";
      case "comment":
        return "#2196f3";
      case "friend_request":
        return "#4caf50";
      case "mention":
        return "#ff9800";
      case "share":
        return "#9c27b0";
      case "event":
        return "#00bcd4";
      default:
        return "#666";
    }
  };

  // Filter conversations based on search query
  const filteredConversations = chatConversations.filter((chat) =>
    chat.userName.toLowerCase().includes(chatSearchQuery.toLowerCase().trim())
  );

  // Get selected chat
  const selectedChat = chatConversations.find(
    (chat) => chat.id === selectedChatId
  );

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [selectedChat?.messages]);

  // Request notification permission on mount
  useEffect(() => {
    requestNotificationPermission();
  }, []);

  // Clear any mock or persisted notifications on mount
  useEffect(() => {
    // Ensure notifications start empty
    setNotifications([]);
    // Clear any notifications from localStorage if they exist
    try {
      localStorage.removeItem("notifications");
      localStorage.removeItem("businessNotifications");
    } catch (error) {
      // Ignore localStorage errors
    }
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
        const newNotification: Notification = {
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

        const newNotification: Notification = {
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
      const newNotification: Notification = {
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

  // Add notification when receiving a new message
  useEffect(() => {
    chatConversations.forEach((chat) => {
      if (chat.messages.length > 0) {
        const lastMessage = chat.messages[chat.messages.length - 1];
        // Only create notification for messages from other users that are unread
        // and when chat is not currently selected (user is not viewing the chat)
        if (
          lastMessage &&
          lastMessage.senderId !== 0 &&
          !lastMessage.isRead &&
          selectedChatId !== chat.id
        ) {
          setNotifications((prev) => {
            // Check if notification already exists for this message
            const existingNotification = prev.find(
              (n) =>
                n.type === "message" &&
                n.relatedChatId === chat.id &&
                n.userId === chat.userId
            );

            if (!existingNotification) {
              const messageText = lastMessage.attachment
                ? lastMessage.attachment.type === "image"
                  ? "sent you a photo"
                  : lastMessage.attachment.type === "video"
                    ? "sent you a video"
                    : "sent you a file"
                : lastMessage.text
                  ? lastMessage.text
                  : "sent you a message";

              const newNotification: Notification = {
                id: Date.now(),
                type: "message",
                userId: chat.userId,
                userName: chat.userName,
                userAvatar: chat.userAvatar,
                message:
                  messageText.length > 50
                    ? `sent you a message: "${messageText.substring(0, 50)}..."`
                    : `sent you a message: "${messageText}"`,
                timestamp: "Just now",
                isRead: false,
                relatedChatId: chat.id,
              };

              // Play notification sound
              playNotificationSound();

              // Show browser notification
              showBrowserNotification(
                chat.userName,
                messageText.length > 50
                  ? messageText.substring(0, 50) + "..."
                  : messageText,
                chat.userAvatar
              );

              return [newNotification, ...prev];
            }
            return prev;
          });
        }
      }
    });
  }, [chatConversations, selectedChatId]);

  // Handle friend added
  const handleFriendAdded = (friendId: number, friendName: string) => {
    // Add friend to friends list
    addFriend(friendId);

    // Update friends list state
    setFriendsList((prev) => {
      if (!prev.includes(friendId)) {
        return [...prev, friendId];
      }
      return prev;
    });

    // Add friend to chat conversations if not already there
    setChatConversations((prev) => {
      const existingChat = prev.find((chat) => chat.userId === friendId);
      if (!existingChat) {
        const newChat: ChatConversation = {
          id: Date.now(),
          userId: friendId,
          userName: friendName,
          userAvatar: "", // Avatar will be fetched from user data
          lastMessage: "",
          lastMessageTime: "",
          unreadCount: 0,
          isOnline: true,
          messages: [],
        };
        return [...prev, newChat];
      }
      return prev;
    });

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

  // Handle sending a message
  const handleSendMessage = () => {
    if ((!messageInput.trim() && !messageAttachment) || !selectedChatId) return;

    const newMessage: ChatMessage = {
      id: Date.now(),
      senderId: 0, // Current user
      text: messageInput.trim(),
      timestamp: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
      isRead: false,
      attachment: messageAttachment || undefined,
    };

    setChatConversations((prev) =>
      prev.map((chat) => {
        if (chat.id === selectedChatId) {
          const lastMessageText = messageAttachment
            ? messageAttachment.type === "image"
              ? "📷 Photo"
              : messageAttachment.type === "video"
                ? "🎥 Video"
                : `📎 ${messageAttachment.fileName || "File"}`
            : newMessage.text;
          return {
            ...chat,
            messages: [...chat.messages, newMessage],
            lastMessage: lastMessageText,
            lastMessageTime: "Just now",
          };
        }
        return chat;
      })
    );

    setMessageInput("");
    setMessageAttachment(null);
  };

  // Handle file attachment
  const handleFileSelect = (
    e: React.ChangeEvent<HTMLInputElement>,
    type: "image" | "video" | "file"
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setMessageAttachment({
          type: type,
          url: reader.result as string,
          fileName: file.name,
          fileSize: file.size,
        });
      };
      reader.readAsDataURL(file);
    }
    e.target.value = "";
  };

  // Handle attachment click
  const handleAttachmentClick = (type: "image" | "video" | "file") => {
    setIsAttachmentMenuOpen(false);
    if (type === "image" && imageInputRef.current) {
      imageInputRef.current.click();
    } else if (type === "video" && videoInputRef.current) {
      videoInputRef.current.click();
    } else if (type === "file" && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // Handle key press in message input
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        attachmentMenuRef.current &&
        attachmentButtonRef.current &&
        !attachmentMenuRef.current.contains(event.target as Node) &&
        !attachmentButtonRef.current.contains(event.target as Node)
      ) {
        setIsAttachmentMenuOpen(false);
      }
      if (
        chatMenuRef.current &&
        chatMenuButtonRef.current &&
        !chatMenuRef.current.contains(event.target as Node) &&
        !chatMenuButtonRef.current.contains(event.target as Node)
      ) {
        setIsChatMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div className="newsfeed-page">
      {/* Top Navigation Bar */}
      <NewsFeedHeader
        isLeftSidebarOpen={isLeftSidebarOpen}
        onToggleLeftSidebar={() => setIsLeftSidebarOpen(!isLeftSidebarOpen)}
        onToggleRightSidebar={() => setIsRightSidebarOpen(!isRightSidebarOpen)}
        onProfileClick={handleProfileClick}
        onOpenChat={() => setIsChatPanelOpen(true)}
        onOpenNotifications={() => setIsNotificationPanelOpen(true)}
        onAddFriend={() => setIsAddFriendModalOpen(true)}
        unreadNotificationsCount={unreadNotificationsCount}
        showRightSidebarToggle={true}
      />

      {/* Mobile Overlay */}
      {(isLeftSidebarOpen || isRightSidebarOpen) && (
        <div
          className="newsfeed-overlay"
          onClick={() => {
            setIsLeftSidebarOpen(false);
            setIsRightSidebarOpen(false);
          }}
        />
      )}

      {/* Main Content */}
      <div className="newsfeed-container">
        {/* Left Sidebar */}
        <NewsFeedSidebar
          isOpen={isLeftSidebarOpen}
          onClose={() => setIsLeftSidebarOpen(false)}
        />

        <main className="newsfeed-main">
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

        {/* Right Sidebar */}
        <aside
          className={`newsfeed-aside ${isRightSidebarOpen ? "newsfeed-aside--open" : ""
            }`}
        >
          <div className="newsfeed-aside__header">
            <h3>Trending & Businesses</h3>
            <button
              className="newsfeed-aside__close"
              onClick={() => setIsRightSidebarOpen(false)}
              aria-label="Close sidebar"
            >
              <X size={20} />
            </button>
          </div>
          <SuggestedBusinesses
            businesses={[]}
            onBusinessAdded={handleFriendAdded}
          />

          {/* Footer inside Aside */}
          <footer className="newsfeed-footer">
            <p>© 2026 JOSCity</p>
            <div className="newsfeed-footer__links">
              <a
                href="/about"
                onClick={(e) => {
                  e.preventDefault();
                  navigate("/about", { state: { fromNewsfeed: true } });
                }}
              >
                About
              </a>
              <a
                href="/terms-of-service"
                onClick={(e) => {
                  e.preventDefault();
                  navigate("/terms-of-service", { state: { fromNewsfeed: true } });
                }}
              >
                Terms
              </a>
              <a
                href="/privacy-policy"
                onClick={(e) => {
                  e.preventDefault();
                  navigate("/privacy-policy", { state: { fromNewsfeed: true } });
                }}
              >
                Privacy
              </a>
              <a
                href="/contact"
                onClick={(e) => {
                  e.preventDefault();
                  navigate("/contact", { state: { fromNewsfeed: true } });
                }}
              >
                Contact Us
              </a>
            </div>
          </footer>
        </aside>
      </div>

      {/* Add Friend Modal */}
      <FindFriendsModal
        isOpen={isAddFriendModalOpen}
        onClose={() => setIsAddFriendModalOpen(false)}
      />

      {/* Chat Panel */}
      {isChatPanelOpen && (
        <div
          className="newsfeed-chat-panel-overlay"
          onClick={() => setIsChatPanelOpen(false)}
        >
          <div
            ref={chatPanelRef}
            className="newsfeed-chat-panel"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="newsfeed-chat-panel__header">
              <h3>Messages</h3>
              <button
                className="newsfeed-chat-panel__close"
                onClick={() => setIsChatPanelOpen(false)}
                aria-label="Close chat"
              >
                <X size={20} />
              </button>
            </div>

            <div className="newsfeed-chat-panel__container">
              {/* Conversations List */}
              <div
                className={`newsfeed-chat-panel__conversations ${selectedChatId
                  ? "newsfeed-chat-panel__conversations--hidden"
                  : ""
                  }`}
              >
                <div className="newsfeed-chat-panel__search-wrapper">
                  <Search
                    size={18}
                    className="newsfeed-chat-panel__search-icon"
                  />
                  <input
                    type="text"
                    className="newsfeed-chat-panel__search-input"
                    placeholder="Search conversations..."
                    value={chatSearchQuery}
                    onChange={(e) => setChatSearchQuery(e.target.value)}
                  />
                </div>
                <div className="newsfeed-chat-panel__conversations-list">
                  {filteredConversations.length > 0 ? (
                    filteredConversations.map((conversation) => (
                      <div
                        key={conversation.id}
                        className={`newsfeed-chat-panel__conversation-item ${selectedChatId === conversation.id
                          ? "newsfeed-chat-panel__conversation-item--active"
                          : ""
                          }`}
                        onClick={() => {
                          setSelectedChatId(conversation.id);
                          // Mark messages as read when opening chat
                          setChatConversations((prev) =>
                            prev.map((chat) =>
                              chat.id === conversation.id
                                ? {
                                  ...chat,
                                  messages: chat.messages.map((msg) => ({
                                    ...msg,
                                    isRead: true,
                                  })),
                                  unreadCount: 0,
                                }
                                : chat
                            )
                          );
                        }}
                      >
                        <div className="newsfeed-chat-panel__conversation-avatar-wrapper">
                          <Avatar
                            src={conversation.userAvatar}
                            alt={conversation.userName}
                            name={conversation.userName}
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
                              {conversation.userName}
                            </p>
                            <span className="newsfeed-chat-panel__conversation-time">
                              {conversation.lastMessageTime}
                            </span>
                          </div>
                          <div className="newsfeed-chat-panel__conversation-preview">
                            <p className="newsfeed-chat-panel__conversation-message">
                              {conversation.lastMessage}
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
                      <p>No conversations found</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Chat Window */}
              <div
                className={`newsfeed-chat-panel__chat-window ${selectedChatId
                  ? "newsfeed-chat-panel__chat-window--visible"
                  : ""
                  }`}
              >
                {selectedChat ? (
                  <>
                    <div className="newsfeed-chat-panel__chat-header">
                      <button
                        className="newsfeed-chat-panel__back-btn"
                        onClick={() => setSelectedChatId(null)}
                        aria-label="Back to conversations"
                      >
                        <X size={20} />
                      </button>
                      <div className="newsfeed-chat-panel__chat-user-info">
                        <div className="newsfeed-chat-panel__chat-avatar-wrapper">
                          <Avatar
                            src={selectedChat.userAvatar}
                            alt={selectedChat.userName}
                            name={selectedChat.userName}
                            size={40}
                            className="newsfeed-chat-panel__chat-avatar"
                          />
                          {selectedChat.isOnline && (
                            <span className="newsfeed-chat-panel__online-indicator"></span>
                          )}
                        </div>
                        <div className="newsfeed-chat-panel__chat-user-details">
                          <p className="newsfeed-chat-panel__chat-user-name">
                            {selectedChat.userName}
                          </p>
                          <p className="newsfeed-chat-panel__chat-status">
                            {selectedChat.isOnline ? "Online" : "Offline"}
                          </p>
                        </div>
                      </div>
                      <div
                        className="newsfeed-chat-panel__chat-menu-wrapper"
                        ref={chatMenuRef}
                      >
                        <button
                          ref={chatMenuButtonRef}
                          className="newsfeed-chat-panel__chat-menu-btn"
                          aria-label="More options"
                          onClick={() => setIsChatMenuOpen(!isChatMenuOpen)}
                        >
                          <MoreVertical size={20} />
                        </button>
                        {isChatMenuOpen && (
                          <div className="newsfeed-chat-panel__chat-menu-dropdown">
                            <button
                              className="newsfeed-chat-panel__chat-menu-item"
                              onClick={() => {
                                setIsChatMenuOpen(false);
                                if (selectedChat) {
                                  setSelectedProfileUserId(selectedChat.userId);
                                  setIsProfileModalOpen(true);
                                }
                              }}
                            >
                              <User size={18} />
                              <span>View Profile</span>
                            </button>
                            <button
                              className="newsfeed-chat-panel__chat-menu-item newsfeed-chat-panel__chat-menu-item--danger"
                              onClick={() => {
                                setIsChatMenuOpen(false);
                                if (
                                  window.confirm(
                                    "Are you sure you want to delete this conversation?"
                                  )
                                ) {
                                  setChatConversations((prev) =>
                                    prev.filter(
                                      (chat) => chat.id !== selectedChatId
                                    )
                                  );
                                  setSelectedChatId(null);
                                }
                              }}
                            >
                              <X size={18} />
                              <span>Delete Conversation</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="newsfeed-chat-panel__messages">
                      {selectedChat.messages.map((message) => {
                        const isCurrentUser = message.senderId === 0;
                        return (
                          <div
                            key={message.id}
                            className={`newsfeed-chat-panel__message ${isCurrentUser
                              ? "newsfeed-chat-panel__message--sent"
                              : "newsfeed-chat-panel__message--received"
                              }`}
                          >
                            {!isCurrentUser && (
                              <Avatar
                                src={selectedChat.userAvatar}
                                alt={selectedChat.userName}
                                name={selectedChat.userName}
                                size={32}
                                className="newsfeed-chat-panel__message-avatar"
                              />
                            )}
                            <div className="newsfeed-chat-panel__message-content">
                              {message.attachment && (
                                <div className="newsfeed-chat-panel__message-attachment">
                                  {message.attachment.type === "image" && (
                                    <img
                                      src={message.attachment.url}
                                      alt="Attachment"
                                      className="newsfeed-chat-panel__attachment-image"
                                    />
                                  )}
                                  {message.attachment.type === "video" && (
                                    <video
                                      src={message.attachment.url}
                                      controls
                                      className="newsfeed-chat-panel__attachment-video"
                                    />
                                  )}
                                  {message.attachment.type === "file" && (
                                    <div className="newsfeed-chat-panel__attachment-file">
                                      <Paperclip size={20} />
                                      <div>
                                        <p className="newsfeed-chat-panel__attachment-filename">
                                          {message.attachment.fileName ||
                                            "File"}
                                        </p>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              )}
                              {message.text && (
                                <p className="newsfeed-chat-panel__message-text">
                                  {message.text}
                                </p>
                              )}
                              <div className="newsfeed-chat-panel__message-footer">
                                <span className="newsfeed-chat-panel__message-time">
                                  {message.timestamp}
                                </span>
                                {isCurrentUser && (
                                  <span
                                    className={`newsfeed-chat-panel__message-status ${message.isRead
                                      ? "newsfeed-chat-panel__message-status--read"
                                      : "newsfeed-chat-panel__message-status--sent"
                                      }`}
                                    title={message.isRead ? "Read" : "Sent"}
                                  >
                                    {message.isRead ? (
                                      <CheckCircle
                                        size={14}
                                        fill="currentColor"
                                        color="currentColor"
                                      />
                                    ) : (
                                      <CheckCircle size={14} />
                                    )}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                      <div ref={messagesEndRef} />
                    </div>

                    <div className="newsfeed-chat-panel__input-area">
                      {messageAttachment && (
                        <div className="newsfeed-chat-panel__attachment-preview">
                          <div className="newsfeed-chat-panel__attachment-preview-content">
                            {messageAttachment.type === "image" && (
                              <Image size={16} />
                            )}
                            {messageAttachment.type === "video" && (
                              <Video size={16} />
                            )}
                            {messageAttachment.type === "file" && (
                              <Paperclip size={16} />
                            )}
                            <span className="newsfeed-chat-panel__attachment-preview-name">
                              {messageAttachment.fileName || "Attachment"}
                            </span>
                          </div>
                          <button
                            onClick={() => setMessageAttachment(null)}
                            className="newsfeed-chat-panel__attachment-preview-remove"
                            aria-label="Remove attachment"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      )}
                      <div className="newsfeed-chat-panel__input-row">
                        <div
                          className="newsfeed-chat-panel__attachment-menu-wrapper"
                          ref={attachmentMenuRef}
                        >
                          <button
                            ref={attachmentButtonRef}
                            className="newsfeed-chat-panel__input-btn"
                            aria-label="Attach file"
                            title="Attach file"
                            onClick={() =>
                              setIsAttachmentMenuOpen(!isAttachmentMenuOpen)
                            }
                          >
                            <Paperclip size={20} />
                          </button>
                          {isAttachmentMenuOpen && (
                            <div className="newsfeed-chat-panel__attachment-menu">
                              <button
                                className="newsfeed-chat-panel__attachment-menu-item"
                                onClick={() => handleAttachmentClick("image")}
                              >
                                <Image size={18} />
                                <span>Photo</span>
                              </button>
                              <button
                                className="newsfeed-chat-panel__attachment-menu-item"
                                onClick={() => handleAttachmentClick("video")}
                              >
                                <Video size={18} />
                                <span>Video</span>
                              </button>
                              <button
                                className="newsfeed-chat-panel__attachment-menu-item"
                                onClick={() => handleAttachmentClick("file")}
                              >
                                <Paperclip size={18} />
                                <span>File</span>
                              </button>
                            </div>
                          )}
                        </div>
                        <input
                          type="file"
                          ref={fileInputRef}
                          accept="*/*"
                          onChange={(e) => handleFileSelect(e, "file")}
                          style={{ display: "none" }}
                        />
                        <input
                          type="file"
                          ref={imageInputRef}
                          accept="image/*"
                          onChange={(e) => handleFileSelect(e, "image")}
                          style={{ display: "none" }}
                        />
                        <input
                          type="file"
                          ref={videoInputRef}
                          accept="video/*"
                          onChange={(e) => handleFileSelect(e, "video")}
                          style={{ display: "none" }}
                        />
                        <input
                          type="text"
                          className="newsfeed-chat-panel__input"
                          placeholder="Type a message..."
                          value={messageInput}
                          onChange={(e) => setMessageInput(e.target.value)}
                          onKeyPress={handleKeyPress}
                        />
                        <div className="newsfeed-chat-panel__emoji-wrapper">
                          <button
                            className="newsfeed-chat-panel__input-btn"
                            aria-label="Add emoji"
                            title="Add emoji"
                            onClick={() =>
                              setIsEmojiPickerOpen(!isEmojiPickerOpen)
                            }
                          >
                            <Smile size={20} />
                          </button>
                          {isEmojiPickerOpen && (
                            <EmojiPicker
                              isOpen={isEmojiPickerOpen}
                              onClose={() => setIsEmojiPickerOpen(false)}
                              onEmojiSelect={(emoji) => {
                                setMessageInput((prev) => prev + emoji);
                                setIsEmojiPickerOpen(false);
                              }}
                              position="top"
                            />
                          )}
                        </div>
                        <button
                          className="newsfeed-chat-panel__send-btn"
                          onClick={handleSendMessage}
                          disabled={!messageInput.trim() && !messageAttachment}
                          aria-label="Send message"
                          title="Send message"
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
      )}

      {/* Profile Modal */}
      {isProfileModalOpen && selectedProfileUserId && (
        <ProfileModal
          isOpen={isProfileModalOpen}
          onClose={() => {
            setIsProfileModalOpen(false);
            setSelectedProfileUserId(null);
          }}
          userId={selectedProfileUserId}
          userName={
            chatConversations.find((c) => c.userId === selectedProfileUserId)
              ?.userName || "User"
          }
          userAvatar={
            chatConversations.find((c) => c.userId === selectedProfileUserId)
              ?.userAvatar || ""
          }
          isOnline={
            chatConversations.find((c) => c.userId === selectedProfileUserId)
              ?.isOnline || false
          }
          onMessage={() => {
            const chat = chatConversations.find(
              (c) => c.userId === selectedProfileUserId
            );
            if (chat) {
              setSelectedChatId(chat.id);
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
                    onClick={markAllAsRead}
                    title="Mark all as read"
                  >
                    <CheckCircle size={18} />
                  </button>
                )}
                {notifications.length > 0 && (
                  <button
                    className="newsfeed-notification-panel__action-btn"
                    onClick={clearAllNotifications}
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
                      className={`newsfeed-notification-panel__item ${!notification.isRead
                        ? "newsfeed-notification-panel__item--unread"
                        : ""
                        }`}
                      onClick={() => markNotificationAsRead(notification.id)}
                    >
                      <div
                        className="newsfeed-notification-panel__icon-wrapper"
                        style={{
                          backgroundColor: `${getNotificationColor(
                            notification.type
                          )}20`,
                        }}
                      >
                        <div
                          className="newsfeed-notification-panel__icon"
                          style={{
                            color: getNotificationColor(notification.type),
                          }}
                        >
                          {getNotificationIcon(notification.type)}
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
                          deleteNotification(notification.id);
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
