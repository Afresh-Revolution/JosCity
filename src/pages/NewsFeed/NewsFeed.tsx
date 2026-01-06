import React, {
  useState,
  useRef,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import { useNavigate } from "react-router-dom";
import {
  SquarePlus,
  UserPlus,
  MessageCircle,
  Bell,
  Menu,
  X,
  TrendingUp,
  FileText,
  Clock,
  Users,
  Calendar,
  Search,
  Hash,
  User,
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
} from "lucide-react";
import NewsFeedSidebar from "./NewsFeedSidebar";
import StoriesSection from "./StoriesSection";
import CreatePostInput from "./CreatePostInput";
import CreatePostModal from "./CreatePostModal";
import PostCard from "./PostCard";
import TrendingSection from "./TrendingSection";
import SuggestedFriends from "./SuggestedFriends";
import primaryLogo from "../../image/primary-logo.png";
import "../../main.css";
import LazyImage from "../../components/LazyImage";
import Avatar from "../../components/Avatar";
import EmojiPicker from "../../components/EmojiPicker";
import ProfileModal from "../../components/ProfileModal";
import FindFriendsModal from "../../components/FindFriendsModal";
import {
  getUserInitials,
  getProfileUsername,
  isAuthenticated,
  getUserAvatar as getUserAvatarUtil,
  getUserName as getUserNameUtil,
  getUserData,
  getUserAccountType,
} from "../../utils/userUtils";
import { addFriend } from "../../utils/friendUtils";
import {
  playNotificationSound,
  showBrowserNotification,
  requestNotificationPermission,
} from "../../utils/notificationUtils";
import { getUserLocation, saveUserLocation } from "../../utils/locationUtils";
import "../../scss/_emojipicker.scss";
import "../../scss/_profilemodal.scss";
import "../../scss/_messagepopup.scss";
import "../../scss/_newsfeed.scss";
import { feedApi } from "../../services/feedApi";
import { friendApi, type FriendRequest } from "../../services/friendApi";

interface SearchResult {
  type: "person" | "hashtag" | "post";
  id: string | number;
  title: string;
  subtitle?: string;
  avatar?: string;
  postCount?: number;
}

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
  caption: string;
  hashtags?: string;
  accountType?: string;
}

const NewsFeed: React.FC = () => {
  const navigate = useNavigate();

  // Debug: Log when component mounts
  useEffect(() => {
    console.log("NewsFeed component mounted");
  }, []);

  // Initialize user location if not set (mock location for demo)
  useEffect(() => {
    const currentLocation = getUserLocation();
    if (!currentLocation) {
      // Default to Lagos, Nigeria (can be replaced with actual geolocation)
      const defaultLocation = { latitude: 6.5244, longitude: 3.3792 };
      saveUserLocation(defaultLocation);
    }
  }, []);

  const [isLeftSidebarOpen, setIsLeftSidebarOpen] = useState(false);
  const [isRightSidebarOpen, setIsRightSidebarOpen] = useState(false);
  const [showGoodMorningCard, setShowGoodMorningCard] = useState(true);
  const [isCreateMenuOpen, setIsCreateMenuOpen] = useState(false);
  const [isCreatePostModalOpen, setIsCreatePostModalOpen] = useState(false);
  const [isCreateStoryModalOpen, setIsCreateStoryModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [filteredHashtag, setFilteredHashtag] = useState<string | null>(null);
  const [isAddFriendModalOpen, setIsAddFriendModalOpen] = useState(false);
  const [isFriendRequestsDropdownOpen, setIsFriendRequestsDropdownOpen] = useState(false);
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);
  const [isLoadingFriendRequests, setIsLoadingFriendRequests] = useState(false);
  const friendRequestsDropdownRef = useRef<HTMLDivElement>(null);
  const [isChatPanelOpen, setIsChatPanelOpen] = useState(false);
  const [selectedChatId, setSelectedChatId] = useState<number | null>(null);
  const [chatSearchQuery, setChatSearchQuery] = useState("");
  const [messageInput, setMessageInput] = useState("");
  const [isNotificationPanelOpen, setIsNotificationPanelOpen] = useState(false);
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
  const [, setMessagePopup] = useState<{
    userId: number;
    userName: string;
    userAvatar: string;
    message: string;
    timestamp: string;
    chatId: number;
  } | null>(null);
  const createMenuRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  const addFriendModalRef = useRef<HTMLDivElement>(null);
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

  // Get time-based greeting with motivational messages
  const getTimeBasedGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) {
      const morningMessages = [
        "Start your day with purpose and let every moment count",
        "Embrace the morning light and make today amazing",
        "Write it on your heart that every day is the best day in the year",
        "Rise and shine! Today is full of endless possibilities",
        "A beautiful morning begins with a grateful heart",
      ];
      return {
        greeting: "Good morning",
        icon: "☀️",
        message:
          morningMessages[Math.floor(Math.random() * morningMessages.length)],
      };
    } else if (hour >= 12 && hour < 17) {
      const afternoonMessages = [
        "Keep pushing forward! Your afternoon momentum is unstoppable",
        "Make the most of this afternoon - you've got this!",
        "Every afternoon brings new opportunities to shine",
        "Stay focused and let your afternoon productivity soar",
        "This afternoon is yours to create something wonderful",
      ];
      return {
        greeting: "Good afternoon",
        icon: "🌤️",
        message:
          afternoonMessages[
            Math.floor(Math.random() * afternoonMessages.length)
          ],
      };
    } else if (hour >= 17 && hour < 21) {
      const eveningMessages = [
        "Reflect on your day and celebrate your accomplishments",
        "Evening is a time to unwind and appreciate today's journey",
        "Let the evening bring you peace and new perspectives",
        "End your day with gratitude and prepare for tomorrow",
        "This evening, take a moment to appreciate how far you've come",
      ];
      return {
        greeting: "Good evening",
        icon: "🌅",
        message:
          eveningMessages[Math.floor(Math.random() * eveningMessages.length)],
      };
    } else {
      const nightMessages = [
        "Rest well and let tomorrow be even better",
        "End your day with peace and dream of great tomorrows",
        "Sleep well, knowing you gave today your best",
        "Let the night recharge you for another amazing day",
        "Good night - tomorrow is a fresh start full of promise",
      ];
      return {
        greeting: "Good night",
        icon: "🌙",
        message:
          nightMessages[Math.floor(Math.random() * nightMessages.length)],
      };
    }
  };

  // Get user's username - use utility function if authenticated, otherwise return empty
  const getUserName = () => {
    if (isAuthenticated()) {
      // Get username from user data (prefer username, then user_name, then display_name)
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
      // Fallback to utility function
      return getUserNameUtil();
    }
    return ""; // Return empty if not authenticated
  };

  // Handle profile navigation
  const handleProfileClick = () => {
    const username = getProfileUsername();
    navigate(`/profile/${encodeURIComponent(username)}`);
  };

  const [greetingData, setGreetingData] = useState(getTimeBasedGreeting());
  const userName = getUserName();

  // Update greeting based on time (check every hour)
  useEffect(() => {
    const updateGreeting = () => {
      setGreetingData(getTimeBasedGreeting());
    };

    // Update immediately
    updateGreeting();

    // Set up interval to check every hour
    const interval = setInterval(updateGreeting, 60 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  // Get user's avatar - will be fetched from API if needed
  const getUserAvatar = (): string | undefined => {
    return getUserAvatarUtil() || undefined; // Use utility function, return undefined if no avatar
  };

  // Posts state - will be populated from API
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoadingFeeds, setIsLoadingFeeds] = useState(true);
  const [feedError, setFeedError] = useState<string | null>(null);

  // Safety timeout to ensure loading state doesn't get stuck
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (isLoadingFeeds) {
        console.warn("Feed loading timeout - setting loading to false");
        setIsLoadingFeeds(false);
        setFeedError("Failed to load feeds. Please refresh the page.");
      }
    }, 10000); // 10 second timeout

    return () => clearTimeout(timeoutId);
  }, [isLoadingFeeds]);

  // Fetch feeds from API - extracted as a function so it can be called after creating posts
  const fetchFeeds = useCallback(async () => {
    try {
      setIsLoadingFeeds(true);
      console.log("Fetching feeds from API endpoint: /feed/feeds");

      const response = await feedApi.getFeeds();
      console.log("Feeds API response:", response);

      if (
        response &&
        response.success &&
        response.data &&
        Array.isArray(response.data)
      ) {
        console.log(`Received ${response.data.length} feeds from API`);

        if (response.data.length === 0) {
          console.log("API returned empty array - no posts available");
          setPosts([]);
        } else {
          // Transform API data to match the expected post format
          try {
            // Type guard for feed items - backend returns author, media, reactions, etc.
            interface FeedItem {
              post_id?: number;
              id?: number;
              author?: {
                id?: number;
                name?: string;
                display_name?: string;
                picture?: string;
                profile_image_url?: string;
                verified?: boolean;
              };
              user?: { display_name?: string; profile_image_url?: string };
              user_name?: string;
              user_avatar?: string;
              action?: string;
              time_ago?: string;
              created_at?: string;
              time?: string;
              media?: {
                photos?: Array<{ source?: string; photo_id?: number }>;
                videos?: Array<{ source?: string; video_id?: number }>;
              };
              image_url?: string;
              image?: string;
              images?: string[];
              video_url?: string;
              video?: string;
              videos?: string[];
              reactions?: Array<{ count?: number }>;
              reactions_count?: number;
              likes_count?: number;
              likes?: number;
              comments_preview?: Array<unknown>;
              comments_count?: number;
              comments?: number;
              views_count?: number;
              views?: number;
              reviews?: number;
              caption?: string;
              text?: string;
              hashtags?: string;
              [key: string]: unknown;
            }

            const transformedPosts: Post[] = (response.data as FeedItem[])
              .filter((feed) => {
                const hasId =
                  feed.post_id !== undefined || feed.id !== undefined;
                if (!hasId) {
                  console.warn("Feed without ID filtered out:", feed);
                }
                return hasId;
              })
              .map((feed): Post => {
                // Handle author/user field mapping (backend uses 'author', frontend expects 'user')
                const author = feed.author || feed.user;
                const userName =
                  author?.display_name || feed.user_name || "Unknown User";
                const userAvatar =
                  author?.profile_image_url || feed.user_avatar || "";

                // Handle media mapping (backend uses media.photos/media.videos arrays)
                // Supports posts with:
                // - Text only
                // - Text + Image(s)
                // - Text + Video(s)
                // - Text + Image(s) + Video(s)
                // - Image(s) only
                // - Video(s) only
                // - Image(s) + Video(s)
                let image = feed.image_url || feed.image || "";
                let images = feed.images;
                let video = feed.video_url || feed.video || "";
                let videos = feed.videos;

                if (feed.media) {
                  // Extract photos from media object (supports text + images posts)
                  if (feed.media.photos && feed.media.photos.length > 0) {
                    image = feed.media.photos[0].source || image;
                    images = feed.media.photos
                      .map((p) => p.source)
                      .filter((src): src is string => Boolean(src));
                  }
                  // Extract videos from media object (supports text + videos posts)
                  if (feed.media.videos && feed.media.videos.length > 0) {
                    video = feed.media.videos[0].source || video;
                    videos = feed.media.videos
                      .map((v) => v.source)
                      .filter((src): src is string => Boolean(src));
                  }
                }

                // Handle reactions (backend returns array, frontend expects count)
                let likes = 0;
                if (feed.reactions && Array.isArray(feed.reactions)) {
                  likes = feed.reactions.reduce(
                    (sum, r) => sum + (r.count || 0),
                    0
                  );
                } else {
                  likes =
                    feed.reactions_count || feed.likes_count || feed.likes || 0;
                }

                // Handle comments (backend returns comments_preview array, frontend expects count)
                const comments =
                  feed.comments_count ||
                  feed.comments ||
                  (feed.comments_preview ? feed.comments_preview.length : 0) ||
                  0;

                return {
                  id: feed.post_id ?? feed.id ?? 0,
                  userName,
                  userAvatar,
                  action: feed.action || "",
                  timeAgo: feed.time_ago || feed.time || feed.created_at || "",
                  image,
                  images: images || undefined,
                  video,
                  videos: videos || undefined,
                  likes,
                  comments,
                  views: feed.views_count || feed.views || 0,
                  reviews: feed.reviews || 0,
                  caption: feed.caption || feed.text || "",
                  hashtags: feed.hashtags || "",
                  accountType:
                    typeof feed.account_type === "string"
                      ? feed.account_type
                      : typeof feed.accountType === "string"
                      ? feed.accountType
                      : undefined,
                };
              });

            console.log(
              `Successfully transformed ${transformedPosts.length} posts`
            );
            setPosts(transformedPosts);
          } catch (transformError) {
            console.error("Error transforming posts:", transformError);
            setPosts([]);
          }
        }
      } else {
        console.warn(
          "API response missing success or data field, or data is not an array. Response:",
          response
        );
        setPosts([]);
      }
    } catch (error) {
      console.error("Error fetching feeds:", error);
      // Extract user-friendly error message (already formatted by apiRequest)
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to load news feed. Please try again later.";
      setFeedError(errorMessage);
      // Always set posts to empty array on error to ensure component renders
      setPosts([]);
    } finally {
      // Always set loading to false to ensure UI renders
      setIsLoadingFeeds(false);
      console.log("Finished loading feeds, isLoadingFeeds set to false");
    }
  }, []); // Empty dependency array - fetchFeeds doesn't depend on any props/state

  // Fetch feeds on component mount
  useEffect(() => {
    fetchFeeds();
  }, [fetchFeeds]);

  // Helper function to normalize media URLs (handle relative paths)
  const normalizeMediaUrl = (url: string | undefined): string => {
    if (!url) return "";
    // If URL is already absolute (starts with http:// or https://), return as is
    if (url.startsWith("http://") || url.startsWith("https://")) {
      return url;
    }
    // If URL starts with /, it's a relative path - return as is (will be handled by proxy/static server)
    if (url.startsWith("/")) {
      return url;
    }
    // Otherwise, prepend / to make it a relative path
    return `/${url}`;
  };

  // Function to handle new post creation
  const handleNewPost = async (
    caption: string,
    images: File[] | null,
    videos: File[] | null
  ) => {
    // Check if user is authenticated
    if (!isAuthenticated()) {
      alert("Please sign in to create a post.");
      navigate("/signin");
      return;
    }

    try {
      console.log("Creating post with:", {
        hasCaption: !!caption.trim(),
        imagesCount: images?.length || 0,
        videosCount: videos?.length || 0,
      });

      // Call API to create post with File objects (FormData will be used internally)
      const response = await feedApi.createPost({
        caption: caption.trim() || undefined,
        images: images || undefined,
        videos: videos || undefined,
      });

      console.log("Post creation response:", response);

      if (response.success && response.data) {
        // Transform API response to match Post format
        const feed = response.data;
        console.log("Transforming post data:", feed);

        // Handle photos - backend returns array of objects with 'source' property
        let image = "";
        let imagesArray: string[] | undefined = undefined;
        if (
          feed.photos &&
          Array.isArray(feed.photos) &&
          feed.photos.length > 0
        ) {
          // Extract source URLs from photo objects
          const photoSources = feed.photos
            .map((photo: { source?: string }) =>
              normalizeMediaUrl(photo?.source)
            )
            .filter((src: string): src is string => Boolean(src && src.trim()));

          if (photoSources.length > 0) {
            image = photoSources[0];
            if (photoSources.length > 1) {
              imagesArray = photoSources;
            }
          }
        } else if (feed.image_url || feed.image) {
          image = normalizeMediaUrl(feed.image_url || feed.image);
        } else if (
          feed.images &&
          Array.isArray(feed.images) &&
          feed.images.length > 0
        ) {
          const normalizedImages = feed.images
            .map((img: string) => normalizeMediaUrl(img))
            .filter((src: string): src is string => Boolean(src && src.trim()));
          if (normalizedImages.length > 0) {
            image = normalizedImages[0];
            if (normalizedImages.length > 1) {
              imagesArray = normalizedImages;
            }
          }
        }

        // Handle videos - backend returns array of objects with 'source' property
        let video = "";
        let videosArray: string[] | undefined = undefined;
        if (
          feed.videos &&
          Array.isArray(feed.videos) &&
          feed.videos.length > 0
        ) {
          // Check if videos is array of objects or strings
          if (
            typeof feed.videos[0] === "object" &&
            feed.videos[0] !== null &&
            "source" in feed.videos[0]
          ) {
            // Extract source URLs from video objects
            const videoSources = feed.videos
              .map((vid: { source?: string }) => normalizeMediaUrl(vid?.source))
              .filter((src: string): src is string =>
                Boolean(src && src.trim())
              );

            if (videoSources.length > 0) {
              video = videoSources[0];
              if (videoSources.length > 1) {
                videosArray = videoSources;
              }
            }
          } else {
            // Already array of strings
            const normalizedVideos = feed.videos
              .map((vid: string) => normalizeMediaUrl(vid))
              .filter((src: string): src is string =>
                Boolean(src && src.trim())
              );
            if (normalizedVideos.length > 0) {
              video = normalizedVideos[0];
              if (normalizedVideos.length > 1) {
                videosArray = normalizedVideos;
              }
            }
          }
        } else if (feed.video_url || feed.video) {
          video = normalizeMediaUrl(feed.video_url || feed.video);
        }

        const newPost: Post = {
          id: feed.post_id ?? feed.id ?? Date.now(),
          userName: feed.user?.display_name || feed.user_name || userName,
          userAvatar:
            feed.user?.profile_image_url || feed.user_avatar || getUserAvatar(),
          action: feed.action || "",
          timeAgo: feed.time_ago || feed.created_at || feed.time || "Just now",
          image,
          images: imagesArray,
          video,
          videos: videosArray,
          likes: feed.likes_count || feed.likes || 0,
          comments: feed.comments_count || feed.comments || 0,
          views: feed.views_count || feed.views || 0,
          reviews: feed.reviews || 0,
          caption: feed.caption || feed.text || caption || "",
          hashtags:
            feed.hashtags ||
            (caption
              ? caption
                  .split(" ")
                  .filter((word: string) => word.startsWith("#"))
                  .join(" ") || ""
              : ""),
        };

        console.log("Created new post:", newPost);

        // Add post to local state immediately for instant feedback
        setPosts((prevPosts) => [newPost, ...prevPosts]);

        // Add a small delay to ensure post is fully committed to database
        // This helps avoid race conditions where the feed query runs before the post is visible
        await new Promise((resolve) => setTimeout(resolve, 1000));

        // Refetch feeds from database to ensure:
        // 1. Post is properly persisted in database
        // 2. All users see the same data
        // 3. Media URLs are correctly set after backend processing
        // 4. Posts persist across browser refreshes
        // 5. Post appears in correct position with all metadata
        await fetchFeeds();

        console.log("Feeds refreshed after post creation");
      } else {
        console.error("Failed to create post:", response);
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

  // Stories are now managed by StoriesSection component via API

  // Function to handle new story creation
  // Note: StoriesSection now manages its own stories state internally
  // This callback is kept for compatibility but stories are managed in StoriesSection
  const handleNewStory = (
    type: "text" | "photo" | "video",
    content: string,
    caption?: string
  ) => {
    console.log("New story created:", { type, content, caption });
    // StoriesSection handles story creation internally now
  };

  // Get account type
  const accountType = getUserAccountType().toLowerCase();
  const isBusinessAccount = accountType === "business";

  // Calculate most common hashtags from posts
  // For business accounts, only count hashtags from business posts
  const calculateTrendingHashtags = () => {
    const hashtagCounts: Record<string, number> = {};

    // Filter posts based on account type
    const postsToAnalyze = isBusinessAccount
      ? posts.filter((post) => {
          // For business accounts, only analyze business posts
          const postAccountType = post.accountType?.toLowerCase();
          return postAccountType === "business";
        })
      : posts; // For personal accounts, analyze all posts

    postsToAnalyze.forEach((post) => {
      if (post.hashtags) {
        const hashtags = post.hashtags
          .split(" ")
          .filter((tag: string) => tag.startsWith("#") && tag.length > 1);
        hashtags.forEach((hashtag: string) => {
          hashtagCounts[hashtag] = (hashtagCounts[hashtag] || 0) + 1;
        });
      }
    });

    // Convert to array, sort by count, and take top 2
    const sortedHashtags = Object.entries(hashtagCounts)
      .map(([hashtag, count]) => ({ hashtag, posts: count }))
      .sort((a, b) => b.posts - a.posts)
      .slice(0, 2);

    return sortedHashtags;
  };

  const trending = calculateTrendingHashtags();

  // Mock chat conversations
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

  const [chatConversations, setChatConversations] = useState<
    ChatConversation[]
  >([]);

  // Mock notifications
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

  const [notifications, setNotifications] = useState<Notification[]>([]);

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

  // Extract all unique people from posts for search functionality
  const allPeople = [...new Set(posts.map((p) => p.userName))].map((name) => {
    const post = posts.find((p) => p.userName === name);
    return {
      id: Math.random(),
      name,
      avatar: post?.userAvatar || "",
    };
  });

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

              // Show message popup
              setMessagePopup({
                userId: chat.userId,
                userName: chat.userName,
                userAvatar: chat.userAvatar,
                message: messageText,
                timestamp: "Just now",
                chatId: chat.id,
              });

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
        setIsAttachmentMenuOpen(false);
      };
      reader.onerror = () => {
        alert("Error reading file. Please try again.");
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle attachment menu click
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

  // Close attachment menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        attachmentMenuRef.current &&
        !attachmentMenuRef.current.contains(event.target as Node) &&
        attachmentButtonRef.current &&
        !attachmentButtonRef.current.contains(event.target as Node)
      ) {
        setIsAttachmentMenuOpen(false);
      }
    };

    if (isAttachmentMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isAttachmentMenuOpen]);

  // Close chat menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        chatMenuRef.current &&
        !chatMenuRef.current.contains(event.target as Node) &&
        chatMenuButtonRef.current &&
        !chatMenuButtonRef.current.contains(event.target as Node)
      ) {
        setIsChatMenuOpen(false);
      }
    };

    if (isChatMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isChatMenuOpen]);

  // Handle Enter key to send message
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Extract all hashtags from posts
  const allHashtags = useMemo(() => {
    return [
      ...new Set(
        posts
          .filter((p) => p.hashtags)
          .flatMap((p) =>
            p.hashtags!.split(" ").filter((tag: string) => tag.startsWith("#"))
          )
      ),
    ];
  }, [posts]);

  // Search function
  const performSearch = useCallback(
    (query: string) => {
      if (!query.trim()) {
        setSearchResults([]);
        return;
      }

      const queryLower = query.toLowerCase().trim();
      const results: SearchResult[] = [];

      // Search people
      allPeople.forEach((person) => {
        if (person.name.toLowerCase().includes(queryLower)) {
          const postCount = posts.filter(
            (p) => p.userName === person.name
          ).length;
          results.push({
            type: "person",
            id: person.name,
            title: person.name,
            subtitle:
              postCount > 0
                ? `${postCount} post${postCount > 1 ? "s" : ""}`
                : "User",
            avatar: person.avatar,
          });
        }
      });

      // Search hashtags
      allHashtags.forEach((hashtag) => {
        if (hashtag.toLowerCase().includes(queryLower)) {
          const postCount = posts.filter(
            (p) => p.hashtags && p.hashtags.includes(hashtag)
          ).length;
          results.push({
            type: "hashtag",
            id: hashtag,
            title: hashtag,
            subtitle: `${postCount} post${postCount !== 1 ? "s" : ""}`,
            postCount,
          });
        }
      });

      // Search posts by caption content
      posts.forEach((post) => {
        if (
          post.caption.toLowerCase().includes(queryLower) ||
          (post.hashtags && post.hashtags.toLowerCase().includes(queryLower))
        ) {
          // Check if this post is already represented by a person or hashtag
          const alreadyIncluded =
            results.some(
              (r) =>
                r.type === "person" &&
                r.title === post.userName &&
                r.id === post.userName
            ) ||
            (post.hashtags &&
              results.some(
                (r) =>
                  r.type === "hashtag" &&
                  post.hashtags!.split(" ").some((tag: string) => tag === r.id)
              ));

          if (!alreadyIncluded) {
            results.push({
              type: "post",
              id: post.id,
              title: `Post by ${post.userName}`,
              subtitle: post.caption.substring(0, 50) + "...",
              avatar: post.userAvatar,
            });
          }
        }
      });

      // Limit results to 10
      setSearchResults(results.slice(0, 10));
    },
    [allPeople, allHashtags, posts]
  );

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    performSearch(value);
  };

  // Handle search result click
  const handleSearchResultClick = (result: SearchResult) => {
    setSearchQuery("");
    setSearchResults([]);
    setIsSearchFocused(false);

    // Scroll to relevant content based on result type
    if (result.type === "person") {
      // Find and scroll to first post by this person
      const userPost = posts.find((p) => p.userName === result.title);
      if (userPost) {
        const postElement = document.querySelector(
          `[data-post-id="${userPost.id}"]`
        );
        postElement?.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    } else if (result.type === "hashtag") {
      // Find and scroll to first post with this hashtag
      const hashtagPost = posts.find(
        (p) => p.hashtags && p.hashtags.includes(result.title)
      );
      if (hashtagPost) {
        const postElement = document.querySelector(
          `[data-post-id="${hashtagPost.id}"]`
        );
        postElement?.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    } else if (result.type === "post") {
      // Scroll to the specific post
      const postElement = document.querySelector(
        `[data-post-id="${result.id}"]`
      );
      postElement?.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  };

  // Close dropdown when clicking outside
  const handleClickOutside = useCallback(
    (event: MouseEvent) => {
      // Only close if menu is open and click is outside the wrapper
      if (
        isCreateMenuOpen &&
        createMenuRef.current &&
        !createMenuRef.current.contains(event.target as Node)
      ) {
        setIsCreateMenuOpen(false);
      }
      if (
        searchRef.current &&
        !searchRef.current.contains(event.target as Node)
      ) {
        setIsSearchFocused(false);
      }
      if (
        addFriendModalRef.current &&
        !addFriendModalRef.current.contains(event.target as Node)
      ) {
        // Don't close if clicking on the overlay itself (it will be handled by overlay onClick)
        const target = event.target as HTMLElement;
        if (!target.closest(".newsfeed-add-friend-modal")) {
          setIsAddFriendModalOpen(false);
        }
      }
      if (
        isFriendRequestsDropdownOpen &&
        friendRequestsDropdownRef.current &&
        !friendRequestsDropdownRef.current.contains(event.target as Node)
      ) {
        setIsFriendRequestsDropdownOpen(false);
      }
    },
    [isCreateMenuOpen, isFriendRequestsDropdownOpen]
  );

  useEffect(() => {
    if (isCreateMenuOpen || isSearchFocused || isAddFriendModalOpen || isFriendRequestsDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [
    isCreateMenuOpen,
    isSearchFocused,
    isAddFriendModalOpen,
    isFriendRequestsDropdownOpen,
    handleClickOutside,
  ]);

  // Fetch friend requests
  const fetchFriendRequests = useCallback(async () => {
    try {
      setIsLoadingFriendRequests(true);
      const response = await friendApi.getPendingRequests();
      if (response.success && response.data) {
        // Only show received requests (requests sent to the current user)
        setFriendRequests(response.data.received || []);
      }
    } catch (error) {
      console.error("Error fetching friend requests:", error);
      setFriendRequests([]);
    } finally {
      setIsLoadingFriendRequests(false);
    }
  }, []);

  // Handle friend requests dropdown toggle
  const handleFriendRequestsClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const newState = !isFriendRequestsDropdownOpen;
    setIsFriendRequestsDropdownOpen(newState);
    setIsCreateMenuOpen(false);
    
    // Fetch requests when opening
    if (newState) {
      fetchFriendRequests();
    }
  };

  // Handle accept friend request
  const handleAcceptFriendRequest = async (requestId: number) => {
    try {
      const response = await friendApi.acceptFriendRequest(requestId);
      if (response.success) {
        // Remove the accepted request from the list
        setFriendRequests((prev) => prev.filter((req) => req.request_id !== requestId));
        // Refresh feeds to show new friend's posts
        await fetchFeeds();
      }
    } catch (error) {
      console.error("Error accepting friend request:", error);
      alert("Failed to accept friend request. Please try again.");
    }
  };

  // Handle reject friend request
  const handleRejectFriendRequest = async (requestId: number) => {
    try {
      const response = await friendApi.rejectFriendRequest(requestId);
      if (response.success) {
        // Remove the rejected request from the list
        setFriendRequests((prev) => prev.filter((req) => req.request_id !== requestId));
      }
    } catch (error) {
      console.error("Error rejecting friend request:", error);
      alert("Failed to reject friend request. Please try again.");
    }
  };

  const handleCreateClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    console.log("Create button clicked, current state:", isCreateMenuOpen);
    const newState = !isCreateMenuOpen;
    setIsCreateMenuOpen(newState);
    setIsFriendRequestsDropdownOpen(false);
    console.log("Setting menu open to:", newState);
  };

  const handleCreatePost = () => {
    setIsCreateMenuOpen(false);
    setIsCreatePostModalOpen(true);
  };

  const handleCreateStory = () => {
    setIsCreateMenuOpen(false);
    setIsCreateStoryModalOpen(true);
  };

  const handleCreateGroup = () => {
    setIsCreateMenuOpen(false);
    navigate("/forums");
  };

  const handleCreateEvent = () => {
    setIsCreateMenuOpen(false);
    navigate("/events");
  };

  return (
    <div className="newsfeed-page">
      {/* Top Navigation Bar */}
      <header className="newsfeed-header">
        <div className="newsfeed-header__container">
          <div className="newsfeed-header__left">
            <button
              className="newsfeed-header__menu-toggle"
              onClick={() => setIsLeftSidebarOpen(!isLeftSidebarOpen)}
              aria-label="Toggle menu"
            >
              {isLeftSidebarOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
            <div
              className="newsfeed-header__logo"
              onClick={() => navigate("/")}
            >
              <LazyImage src={primaryLogo} alt="JOSCity Logo" />
              <span>JosCity</span>
            </div>
          </div>
          <div className="newsfeed-header__actions">
            <div
              className="newsfeed-header__create-wrapper"
              ref={createMenuRef}
            >
              <button
                className="newsfeed-header__icon-btn"
                title="Create"
                onClick={handleCreateClick}
                type="button"
                aria-expanded={isCreateMenuOpen}
              >
                <SquarePlus size={20} />
              </button>
              {isCreateMenuOpen && (
                <div
                  className="newsfeed-header__create-dropdown"
                  onClick={(e) => e.stopPropagation()}
                  style={{
                    display: "block",
                    visibility: "visible",
                    opacity: 1,
                    zIndex: 1003,
                  }}
                >
                  <button
                    className="newsfeed-header__create-item"
                    onClick={handleCreatePost}
                  >
                    <FileText size={18} />
                    <span>Create Post</span>
                  </button>
                  <button
                    className="newsfeed-header__create-item"
                    onClick={handleCreateStory}
                  >
                    <Clock size={18} />
                    <span>Create Story</span>
                  </button>
                  <button
                    className="newsfeed-header__create-item"
                    onClick={handleCreateGroup}
                  >
                    <Users size={18} />
                    <span>Create Forum</span>
                  </button>
                  <button
                    className="newsfeed-header__create-item"
                    onClick={handleCreateEvent}
                  >
                    <Calendar size={18} />
                    <span>Create Event</span>
                  </button>
                </div>
              )}
            </div>
            <div
              className="newsfeed-header__create-wrapper"
              ref={friendRequestsDropdownRef}
            >
              <button
                className="newsfeed-header__icon-btn"
                title="Friend Requests"
                onClick={handleFriendRequestsClick}
                type="button"
                aria-expanded={isFriendRequestsDropdownOpen}
              >
                <UserPlus size={20} />
                {friendRequests.length > 0 && (
                  <span className="newsfeed-header__badge">
                    {friendRequests.length > 9 ? "9+" : friendRequests.length}
                  </span>
                )}
              </button>
              {isFriendRequestsDropdownOpen && (
                <div
                  className="newsfeed-header__create-dropdown newsfeed-header__friend-requests-dropdown"
                  onClick={(e) => e.stopPropagation()}
                  style={{
                    display: "block",
                    visibility: "visible",
                    opacity: 1,
                    zIndex: 1003,
                  }}
                >
                  <div className="newsfeed-header__friend-requests-header">
                    <h3>Friend Requests</h3>
                  </div>
                  {isLoadingFriendRequests ? (
                    <div className="newsfeed-header__friend-requests-loading">
                      Loading...
                    </div>
                  ) : friendRequests.length === 0 ? (
                    <div className="newsfeed-header__friend-requests-empty">
                      No friend requests
                    </div>
                  ) : (
                    <div className="newsfeed-header__friend-requests-list">
                      {friendRequests.map((request) => {
                        const sender = request.sender;
                        const senderName = sender
                          ? `${sender.user_firstname || ""} ${sender.user_lastname || ""}`.trim() || "Unknown User"
                          : "Unknown User";
                        const senderAvatar = sender?.user_picture || "";
                        
                        return (
                          <div
                            key={request.request_id}
                            className="newsfeed-header__friend-request-item"
                          >
                            <div className="newsfeed-header__friend-request-info">
                              {senderAvatar ? (
                                <LazyImage
                                  src={senderAvatar}
                                  alt={senderName}
                                  className="newsfeed-header__friend-request-avatar"
                                />
                              ) : (
                                <div className="newsfeed-header__friend-request-avatar newsfeed-header__friend-request-avatar--placeholder">
                                  {senderName.charAt(0).toUpperCase()}
                                </div>
                              )}
                              <div className="newsfeed-header__friend-request-details">
                                <div className="newsfeed-header__friend-request-name">
                                  {senderName}
                                </div>
                              </div>
                            </div>
                            <div className="newsfeed-header__friend-request-actions">
                              <button
                                className="newsfeed-header__friend-request-btn newsfeed-header__friend-request-btn--accept"
                                onClick={() => handleAcceptFriendRequest(request.request_id)}
                                title="Accept"
                              >
                                <UserCheck size={16} />
                              </button>
                              <button
                                className="newsfeed-header__friend-request-btn newsfeed-header__friend-request-btn--reject"
                                onClick={() => handleRejectFriendRequest(request.request_id)}
                                title="Reject"
                              >
                                <X size={16} />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                  {friendRequests.length > 0 && (
                    <div className="newsfeed-header__friend-requests-footer">
                      <button
                        className="newsfeed-header__friend-requests-view-all"
                        onClick={() => {
                          setIsFriendRequestsDropdownOpen(false);
                          navigate("/request");
                        }}
                      >
                        View All Requests
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
            <button
              className="newsfeed-header__icon-btn"
              title="Messages"
              onClick={() => setIsChatPanelOpen(true)}
            >
              <MessageCircle size={20} />
            </button>
            <button
              className="newsfeed-header__icon-btn newsfeed-header__icon-btn--notifications"
              title="Notifications"
              onClick={() => setIsNotificationPanelOpen(true)}
            >
              <Bell size={20} />
              {unreadNotificationsCount > 0 && (
                <span className="newsfeed-header__badge">
                  {unreadNotificationsCount > 9
                    ? "9+"
                    : unreadNotificationsCount}
                </span>
              )}
            </button>
            <button
              className="newsfeed-header__join-btn"
              onClick={handleProfileClick}
              title="View Profile"
            >
              <div className="newsfeed-header__join-initials">
                {getUserInitials()}
              </div>
            </button>
            <button
              className="newsfeed-header__sidebar-toggle"
              onClick={() => setIsRightSidebarOpen(!isRightSidebarOpen)}
              aria-label="Toggle sidebar"
              title="Trending & Friends"
            >
              <TrendingUp size={20} />
            </button>
          </div>
        </div>
      </header>

      <div className="newsfeed-container">
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

        {/* Left Sidebar */}
        <NewsFeedSidebar
          isOpen={isLeftSidebarOpen}
          onClose={() => setIsLeftSidebarOpen(false)}
        />

        {/* Main Content Area */}
        <main className="newsfeed-main">
          {/* Search Section */}
          <div className="newsfeed-search-section" ref={searchRef}>
            <div className="newsfeed-search-section__input-wrapper">
              <input
                type="text"
                placeholder="Search people, hashtags, or posts..."
                className="newsfeed-search-section__input"
                value={searchQuery}
                onChange={handleSearchChange}
                onFocus={() => setIsSearchFocused(true)}
              />
              <Search size={20} className="newsfeed-search-section__icon" />
            </div>
            {isSearchFocused && searchResults.length > 0 && (
              <div className="newsfeed-search-results">
                {searchResults.map((result, index) => (
                  <button
                    key={`${result.type}-${result.id}-${index}`}
                    className="newsfeed-search-result"
                    onClick={() => handleSearchResultClick(result)}
                  >
                    <div className="newsfeed-search-result__icon">
                      {result.type === "person" ? (
                        <User size={18} />
                      ) : result.type === "hashtag" ? (
                        <Hash size={18} />
                      ) : (
                        <FileText size={18} />
                      )}
                    </div>
                    {result.avatar && (
                      <img
                        src={result.avatar}
                        alt={result.title}
                        className="newsfeed-search-result__avatar"
                      />
                    )}
                    <div className="newsfeed-search-result__content">
                      <div className="newsfeed-search-result__title">
                        {result.title}
                      </div>
                      {result.subtitle && (
                        <div className="newsfeed-search-result__subtitle">
                          {result.subtitle}
                        </div>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
            {isSearchFocused && searchQuery && searchResults.length === 0 && (
              <div className="newsfeed-search-results">
                <div className="newsfeed-search-result newsfeed-search-result--empty">
                  <div className="newsfeed-search-result__content">
                    <div className="newsfeed-search-result__title">
                      No results found
                    </div>
                    <div className="newsfeed-search-result__subtitle">
                      Try searching for a different name, hashtag, or keyword
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
          <StoriesSection
            userName={userName}
            userAvatar={getUserAvatar()}
            onStory={handleNewStory}
            forceOpenStoryModal={isCreateStoryModalOpen}
            onStoryModalClose={() => setIsCreateStoryModalOpen(false)}
          />
          {isAuthenticated() && userName && (
            <CreatePostInput
              userName={userName}
              userAvatar={getUserAvatar()}
              onPost={handleNewPost}
            />
          )}

          {/* Good Morning Card */}
          {showGoodMorningCard && (
            <div className="newsfeed-goodmorning-card">
              <div className="newsfeed-goodmorning-card__icon">
                {greetingData.icon}
              </div>
              <div className="newsfeed-goodmorning-card__content">
                <p>
                  {greetingData.greeting}, {userName}! {greetingData.message}
                </p>
              </div>
              <button
                className="newsfeed-goodmorning-card__close"
                onClick={() => setShowGoodMorningCard(false)}
                aria-label="Close good morning card"
              >
                ×
              </button>
            </div>
          )}

          {/* Posts */}
          <div className="newsfeed-posts">
            {filteredHashtag && (
              <div className="newsfeed-hashtag-filter">
                <div className="newsfeed-hashtag-filter__content">
                  <span className="newsfeed-hashtag-filter__label">
                    Showing posts for:
                  </span>
                  <span className="newsfeed-hashtag-filter__hashtag">
                    {filteredHashtag}
                  </span>
                  <button
                    className="newsfeed-hashtag-filter__clear"
                    onClick={() => setFilteredHashtag(null)}
                    aria-label="Clear filter"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>
            )}
            {isLoadingFeeds ? (
              <div className="newsfeed-no-posts">
                <p>Loading feeds...</p>
              </div>
            ) : feedError ? (
              <div className="newsfeed-no-posts">
                <p style={{ color: "var(--error-color, #e74c3c)" }}>
                  Error loading feeds: {feedError}
                </p>
                <button
                  onClick={() => {
                    setFeedError(null);
                    setIsLoadingFeeds(true);
                    window.location.reload();
                  }}
                  style={{
                    marginTop: "10px",
                    padding: "8px 16px",
                    backgroundColor: "var(--primary-color, #0d4a1f)",
                    color: "white",
                    border: "none",
                    borderRadius: "4px",
                    cursor: "pointer",
                  }}
                >
                  Retry
                </button>
              </div>
            ) : (
              <>
                {posts
                  .filter((post) => {
                    if (!filteredHashtag) return true;
                    return post.hashtags?.includes(filteredHashtag);
                  })
                  .map((post) => (
                    <PostCard key={post.id} post={post} />
                  ))}
                {filteredHashtag &&
                  posts.filter((post) =>
                    post.hashtags?.includes(filteredHashtag)
                  ).length === 0 && (
                    <div className="newsfeed-no-posts">
                      <p>No posts found for {filteredHashtag}</p>
                    </div>
                  )}
                {!filteredHashtag && posts.length === 0 && (
                  <div className="newsfeed-no-posts">
                    <p>No posts available</p>
                  </div>
                )}
              </>
            )}
          </div>
        </main>

        {/* Right Sidebar - Aside */}
        <aside
          className={`newsfeed-aside ${
            isRightSidebarOpen ? "newsfeed-aside--open" : ""
          }`}
        >
          <div className="newsfeed-aside__header">
            <h3>
              {isBusinessAccount
                ? "Trending & Businesses"
                : "Trending & Friends"}
            </h3>
            <button
              className="newsfeed-aside__close"
              onClick={() => setIsRightSidebarOpen(false)}
              aria-label="Close sidebar"
            >
              <X size={20} />
            </button>
          </div>
          <TrendingSection
            trending={trending}
            onHashtagClick={(hashtag) => {
              setFilteredHashtag(hashtag);
              // Scroll to posts section
              setTimeout(() => {
                const postsSection = document.querySelector(".newsfeed-posts");
                postsSection?.scrollIntoView({
                  behavior: "smooth",
                  block: "start",
                });
              }, 100);
            }}
          />
          <SuggestedFriends friends={[]} onFriendAdded={handleFriendAdded} />
        </aside>
      </div>

      {/* Footer */}
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
                className={`newsfeed-chat-panel__conversations ${
                  selectedChatId
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
                        className={`newsfeed-chat-panel__conversation-item ${
                          selectedChatId === conversation.id
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
                className={`newsfeed-chat-panel__chat-window ${
                  selectedChatId
                    ? "newsfeed-chat-panel__chat-window--visible"
                    : ""
                }`}
              >
                {selectedChat ? (
                  <>
                    <div className="newsfeed-chat-panel__chat-header">
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
                          <span className="newsfeed-chat-panel__chat-status-separator">
                            •
                          </span>
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
                              className="newsfeed-chat-panel__chat-menu-item"
                              onClick={() => {
                                setIsChatMenuOpen(false);
                                console.log("Mute conversation");
                              }}
                            >
                              <Bell size={18} />
                              <span>Mute Notifications</span>
                            </button>
                            <button
                              className="newsfeed-chat-panel__chat-menu-item"
                              onClick={() => {
                                setIsChatMenuOpen(false);
                                console.log("Clear chat");
                              }}
                            >
                              <Trash2 size={18} />
                              <span>Clear Chat</span>
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
                            className={`newsfeed-chat-panel__message ${
                              isCurrentUser
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
                                        {message.attachment.fileSize && (
                                          <p className="newsfeed-chat-panel__attachment-filesize">
                                            {(
                                              message.attachment.fileSize / 1024
                                            ).toFixed(2)}{" "}
                                            KB
                                          </p>
                                        )}
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
                                    className={`newsfeed-chat-panel__message-status ${
                                      message.isRead
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
              ?.userAvatar || "/placeholder-avatar.png"
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
            // Handle add friend action
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

      {/* Create Post Modal */}
      {isAuthenticated() && userName && (
        <CreatePostModal
          isOpen={isCreatePostModalOpen}
          onClose={() => setIsCreatePostModalOpen(false)}
          userName={userName}
          userAvatar={getUserAvatar()}
          onPost={handleNewPost}
        />
      )}
    </div>
  );
};

export default NewsFeed;
