import React, {
  useState,
  useRef,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import { useNavigate } from "react-router-dom";
import {
  X,
  Search,
  Hash,
  User,
  UserCheck,
  UserX,
  CheckCircle,
  Trash2,
  Bell,
  FileText,
} from "lucide-react";
import NewsFeedSidebar from "./NewsFeedSidebar";
import NewsFeedHeader from "./NewsFeedHeader";
import StoriesSection from "./StoriesSection";
import CreatePostInput from "./CreatePostInput";
import CreatePostModal, {
  type CreatePostListingPayload,
} from "./CreatePostModal";
import CreateReelModal from "../../components/CreateReelModal";
import PostCard from "./PostCard";
import NewsfeedRightAside from "./NewsfeedRightAside";
import { useNewsfeedAsideTrending } from "../../hooks/useNewsfeedAsideTrending";
import "../../main.css";
import Avatar from "../../components/Avatar";
import ChatPanel, { type ChatPanelPopupPayload } from "../../components/ChatPanel";
import FindFriendsModal from "../../components/FindFriendsModal";
import CreateStoryPopup from "../../components/CreateStoryPopup";
import MessagePopup from "../../components/MessagePopup";
import chatService from "../../services/chatService";
import {
  getProfileUsername,
  isAuthenticated,
  getUserAvatar as getUserAvatarUtil,
  getUserName as getUserNameUtil,
  getUserData,
  getUserAccountType,
} from "../../utils/userUtils";
import {
  playNotificationSound,
  showBrowserNotification,
  requestNotificationPermission,
} from "../../utils/notificationUtils";
import {
  mapFeedApiItemToPost,
  type ListingDetails,
} from "../../utils/mapFeedApiItemToPost";
import { getUserLocation, saveUserLocation } from "../../utils/locationUtils";
import "../../scss/_emojipicker.scss";
import "../../scss/_profilemodal.scss";
import "../../scss/_messagepopup.scss";
import "../../scss/_newsfeed.scss";
import { feedApi } from "../../services/feedApi";
import AdminBroadcastStrip, {
  type AdminBroadcastItem,
  normalizeAdminBroadcastType,
} from "../../components/AdminBroadcastStrip";
import {
  type FeedPanelNotification,
  mapApiRowToFeedPanelNotification,
  getFeedPanelNotificationIcon,
  getFeedPanelNotificationColor,
} from "../../utils/feedPanelNotifications";

interface SearchResult {
  type: "person" | "hashtag" | "post";
  id: string | number;
  title: string;
  subtitle?: string;
  avatar?: string;
  postCount?: number;
}

interface EmbeddedPost {
  id: number;
  userId?: number;
  userName: string;
  userAvatar: string;
  timeAgo: string;
  caption?: string;
  image?: string;
  images?: string[];
  video?: string;
  videos?: string[];
  unavailable?: boolean;
}

interface Post {
  id: number;
  userId?: number; // author user_id - for edit/delete/pin (own posts only)
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
  userReacted?: boolean;
  userShared?: boolean;
  originalPost?: EmbeddedPost;
  listingDetails?: ListingDetails | null;
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
  const [isCreatePostModalOpen, setIsCreatePostModalOpen] = useState(false);
  const [isCreateReelModalOpen, setIsCreateReelModalOpen] = useState(false);
  const [isCreateStoryModalOpen, setIsCreateStoryModalOpen] = useState(false);
  const [isStoryPopupOpen, setIsStoryPopupOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [filteredHashtag, setFilteredHashtag] = useState<string | null>(null);
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
  // const [isNavbarVisible, setIsNavbarVisible] = useState(true);
  // const [lastScrollY, setLastScrollY] = useState(0);


  const [prevScrollPos, setPrevScrollPos] = useState(0);
    const [isInitialMount, setIsInitialMount] = useState(true);

  const searchRef = useRef<HTMLDivElement>(null);
  const addFriendModalRef = useRef<HTMLDivElement>(null);
  const notificationPanelRef = useRef<HTMLDivElement>(null);
  const mainContentRef = useRef<HTMLElement>(null);

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
  const trending = useNewsfeedAsideTrending(posts);

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

      const response = await feedApi.getFeeds({ feedChannel: "main" });
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
          try {
            const transformedPosts: Post[] = (response.data as unknown[])
              .map((item) => mapFeedApiItemToPost(item))
              .filter((p): p is Post => p != null);
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

  const fetchFeedsByHashtag = useCallback((hashtag: string) => {
    setFilteredHashtag(hashtag);
    setTimeout(() => {
      const postsSection = document.querySelector(".newsfeed-posts");
      postsSection?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 100);
  }, []);

  useEffect(() => {
    const handleFeedPostShared = () => {
      void fetchFeeds();
    };

    window.addEventListener("feedPostShared", handleFeedPostShared);
    return () => {
      window.removeEventListener("feedPostShared", handleFeedPostShared);
    };
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
    videos: File[] | null,
    listingDetails?: CreatePostListingPayload | null
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
        listingDetails: listingDetails ?? undefined,
      });

      console.log("Post creation response:", response);

      // Accept success with data, or backend returning post in different shapes
      const feed =
        response.data ??
        (response as { post?: unknown }).post ??
        (response &&
        typeof response === "object" &&
        ("post_id" in response || "id" in response)
          ? response
          : null);

      if (feed) {
        // Transform API response to match Post format
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

        // Instead of adding to local state, refetch feeds from database
        // This ensures:
        // 1. Post is properly persisted in database
        // 2. All users see the same data
        // 3. Media URLs are correctly set after backend processing
        // 4. Posts persist across browser refreshes
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

  const [notifications, setNotifications] = useState<FeedPanelNotification[]>(
    []
  );
  const prevUnreadCountRef = useRef(0);

  // Fetch notifications from API and poll for new ones (comment/reaction)
  const fetchNotifications = useCallback(async () => {
    if (!isAuthenticated()) return;
    try {
      const res = await feedApi.getNotifications();
      if (res.success && Array.isArray(res.data)) {
        const mapped: FeedPanelNotification[] = res.data.map((n) =>
          mapApiRowToFeedPanelNotification(
            n as unknown as Parameters<typeof mapApiRowToFeedPanelNotification>[0]
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
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

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
      if (res.success) {
        setNotifications([]);
      }
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

  const adminBroadcastItems = useMemo((): AdminBroadcastItem[] => {
    return notifications
      .filter(
        (n) =>
          n.nodeType === "admin_notification" || n.createdByAdmin === true
      )
      .map((n) => ({
        id: n.id,
        title: n.title,
        message: n.message,
        notification_type: normalizeAdminBroadcastType(n.notificationType),
        time: n.timestamp,
        expires_at: n.expiresAt ?? undefined,
      }));
  }, [notifications]);

  // Extract all unique people from posts for search functionality
  const allPeople = [...new Set(posts.map((p) => p.userName))].map((name) => {
    const post = posts.find((p) => p.userName === name);
    return {
      id: Math.random(),
      name,
      avatar: post?.userAvatar || "",
    };
  });

  // Request notification permission on mount
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
              title:
                data.title !== undefined ? data.title : n.title,
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

  // Handle navbar visibility on scroll
  // useEffect(() => {
  //   const handleScroll = () => {
  //     // Check both window scroll and main content scroll
  //     const windowScrollY = window.scrollY;
  //     const mainContent = mainContentRef.current;
  //     const contentScrollY = mainContent ? mainContent.scrollTop : 0;
      
  //     // Use the larger of the two scroll positions
  //     const currentScrollY = Math.max(windowScrollY, contentScrollY);
      
  //     // Show navbar when scrolling up, hide when scrolling down
  //     if (currentScrollY > lastScrollY && currentScrollY > 100) {
  //       // Scrolling down and past 100px - hide navbar
  //       setIsNavbarVisible(false);
  //     } else if (currentScrollY < lastScrollY) {
  //       // Scrolling up - show navbar
  //       setIsNavbarVisible(true);
  //     }
      
  //     // Always show navbar at the top
  //     if (currentScrollY < 10) {
  //       setIsNavbarVisible(true);
  //     }
      
  //     setLastScrollY(currentScrollY);
  //   };

  //   // Listen to window scroll
  //   window.addEventListener("scroll", handleScroll, { passive: true });
    
  //   // Listen to main content scroll
  //   const mainContent = mainContentRef.current;
  //   if (mainContent) {
  //     mainContent.addEventListener("scroll", handleScroll, { passive: true });
  //   }
    
  //   return () => {
  //     window.removeEventListener("scroll", handleScroll);
  //     if (mainContent) {
  //       mainContent.removeEventListener("scroll", handleScroll);
  //     }
  //   };
  // }, [lastScrollY]);

  // Navbar visibility on scroll is handled inside NewsFeedHeader
  useEffect(() => {
    const handleScroll = () => {
        if (isInitialMount) {
            setIsInitialMount(false);
            return;
        }
        const currentScrollPos = window.scrollY;
        setPrevScrollPos(currentScrollPos);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [prevScrollPos, isInitialMount]);

  const openChatPanel = useCallback((conversationId?: number | null) => {
    setMessagePopup(null);
    setActiveChatConversationId(conversationId ?? null);
    setIsChatPanelOpen(true);
  }, []);

  const closeChatPanel = useCallback(() => {
    setIsChatPanelOpen(false);
    setActiveChatConversationId(null);
  }, []);

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

        if (existingNotification) {
          return prev;
        }

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
        payload.userAvatar
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
    },
    []
  );

  useEffect(() => {
    if (isSearchFocused || isAddFriendModalOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [
    isSearchFocused,
    isAddFriendModalOpen,
    handleClickOutside,
  ]);

  const handleCreatePost = () => {
    setIsCreatePostModalOpen(true);
  };

  const handleCreateReel = () => {
    setIsCreateReelModalOpen(true);
  };

  const handleCreateStory = () => {
    setIsStoryPopupOpen(true);
  };

  const handleStoryPublish = (message: string, image?: string, video?: string) => {
    // Handle story publishing logic here
    console.log("Publishing story:", { message, image, video });
    // You can add your story publishing logic here
    setIsStoryPopupOpen(false);
  };

  return (
    <div className="newsfeed-page">
      {/* Top Navigation Bar */}
      <NewsFeedHeader
        isLeftSidebarOpen={isLeftSidebarOpen}
        onToggleLeftSidebar={() => setIsLeftSidebarOpen(!isLeftSidebarOpen)}
        isRightSidebarOpen={isRightSidebarOpen}
        onToggleRightSidebar={() => setIsRightSidebarOpen(!isRightSidebarOpen)}
        onCreatePost={handleCreatePost}
        onCreateStory={handleCreateStory}
        onCreateReel={handleCreateReel}
        onAddFriend={() => setIsAddFriendModalOpen(true)}
        onOpenChat={() => openChatPanel()}
        onOpenNotifications={() => setIsNotificationPanelOpen(true)}
        onProfileClick={handleProfileClick}
        unreadNotificationsCount={unreadNotificationsCount}
        unreadMessagesCount={unreadMessagesCount}
        mainContentRef={mainContentRef}
      />

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
        <main className="newsfeed-main" ref={mainContentRef}>
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

          {/* Create post + Good morning: kept under add story, clean block */}
          <div className="newsfeed-feed-composer">
            {isAuthenticated() && userName && (
              <CreatePostInput
                userName={userName}
                userAvatar={getUserAvatar()}
                onPost={handleNewPost}
              />
            )}
            {showGoodMorningCard && (
              <div className="newsfeed-goodmorning-card">
                <div className="newsfeed-goodmorning-card__icon">
                  {greetingData.icon}
                </div>
                <div className="newsfeed-goodmorning-card__content">
                  <p>
                    {greetingData.greeting}, {userName || "there"}! {greetingData.message}
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
            {adminBroadcastItems.length > 0 && (
              <AdminBroadcastStrip
                variant="dashboard"
                items={adminBroadcastItems}
                className="admin-broadcast-strip--newsfeed-composer"
              />
            )}
          </div>

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
                    onClick={() => {
                      setFilteredHashtag(null);
                      fetchFeeds();
                    }}
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
                  We could not load your feed right now. {feedError}
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
                    <PostCard
                      key={post.id}
                      post={post}
                      onPostDeleted={(postId) =>
                        setPosts((prev) => prev.filter((p) => p.id !== postId))
                      }
                      onPostUpdated={(postId, updates) => {
                        if (updates.caption !== undefined)
                          setPosts((prev) =>
                            prev.map((p) =>
                              p.id === postId
                                ? { ...p, caption: (updates.caption ?? p.caption) ?? "" }
                                : p
                            )
                          );
                        if (updates.pinned !== undefined)
                          setPosts((prev) =>
                            prev.map((p) =>
                              p.id === postId
                                ? { ...p, pinned: updates.pinned }
                                : p
                            )
                          );
                      }}
                    />
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

        <NewsfeedRightAside
          isOpen={isRightSidebarOpen}
          onClose={() => setIsRightSidebarOpen(false)}
          trending={trending}
          onHashtagClick={fetchFeedsByHashtag}
        />
      </div>

      {/* Add Friend Modal */}
      <FindFriendsModal
        isOpen={isAddFriendModalOpen}
        onClose={() => setIsAddFriendModalOpen(false)}
      />

      <ChatPanel
        isOpen={isChatPanelOpen}
        onClose={closeChatPanel}
        onUnreadCountChange={setUnreadMessagesCount}
        onIncomingMessage={handleIncomingChatMessage}
        activeConversationId={activeChatConversationId}
      />

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

      {/* Create Post Modal */}
      {isAuthenticated() && userName && (
        <CreatePostModal
          isOpen={isCreatePostModalOpen}
          onClose={() => setIsCreatePostModalOpen(false)}
          userName={userName}
          userAvatar={getUserAvatar()}
          businessListingFields={
            getUserAccountType().toLowerCase() === "business"
          }
          businessFeedNotice="As a business account, this post appears only in the Business section, not on the main news feed."
          onPost={handleNewPost}
        />
      )}

      {isAuthenticated() && userName && (
        <CreateReelModal
          isOpen={isCreateReelModalOpen}
          onClose={() => setIsCreateReelModalOpen(false)}
          userName={userName}
          userAvatar={getUserAvatar()}
          onCreated={() => {
            setIsCreateReelModalOpen(false);
            navigate("/reels");
          }}
        />
      )}

      {/* Create Story Popup */}
      <CreateStoryPopup
        isOpen={isStoryPopupOpen}
        onClose={() => setIsStoryPopupOpen(false)}
        onPublish={handleStoryPublish}
      />
    </div>
  );
};

export default NewsFeed;

