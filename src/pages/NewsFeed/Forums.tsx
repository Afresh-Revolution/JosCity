import React, { useState, useRef, useEffect, useCallback } from "react";
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
  Send,
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
  Plus,
  Edit,
  Shield,
  ArrowLeft,
  MoreVertical,
  UserX,
} from "lucide-react";

import primaryLogo from "../../image/primary-logo.png";
import "../../main.css";
import LazyImage from "../../components/LazyImage";
import Avatar from "../../components/Avatar";
import EmojiPicker from "../../components/EmojiPicker";
import { getUserInitials, getProfileUsername, getUserAvatar } from "../../utils/userUtils";
import CreateForumModal from "./CreateForumModal";
import FindFriendsModal from "../../components/FindFriendsModal";
import "../../scss/_emojipicker.scss";
import "../../scss/_forums.scss";
import NewsFeedSidebar from "./NewsFeedSidebar";

const Forums: React.FC = () => {
  const navigate = useNavigate();
  const [isLeftSidebarOpen, setIsLeftSidebarOpen] = useState(false);
  const [isRightSidebarOpen, setIsRightSidebarOpen] = useState(false);
  const [isCreateMenuOpen, setIsCreateMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("discover");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddFriendModalOpen, setIsAddFriendModalOpen] = useState(false);
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
  const [isCreateForumModalOpen, setIsCreateForumModalOpen] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState("");
  const [selectedForumId, setSelectedForumId] = useState<number | null>(null);
  const [forumMessageInput, setForumMessageInput] = useState("");
  const [forumMessageAttachment, setForumMessageAttachment] = useState<{
    type: "image" | "video" | "file";
    url: string;
    fileName?: string;
    fileSize?: number;
  } | null>(null);
  const [isForumEmojiPickerOpen, setIsForumEmojiPickerOpen] = useState(false);
  const [isForumAdminMenuOpen, setIsForumAdminMenuOpen] = useState(false);
  const [isEditForumModalOpen, setIsEditForumModalOpen] = useState(false);
  const [editingForum, setEditingForum] = useState<{
    id: number;
    name: string;
    description: string;
    category: string;
    backgroundColor?: string;
    backgroundImage?: string;
    backgroundOpacity?: number;
  } | null>(null);
  const forumAdminMenuRef = useRef<HTMLDivElement>(null);
  const forumMessagesEndRef = useRef<HTMLDivElement>(null);
  const forumFileInputRef = useRef<HTMLInputElement>(null);
  const forumImageInputRef = useRef<HTMLInputElement>(null);
  const forumVideoInputRef = useRef<HTMLInputElement>(null);
  const [joinedForumIds, setJoinedForumIds] = useState<Set<number>>(new Set());
  const createMenuRef = useRef<HTMLDivElement>(null);
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

  const categories = [
    "All",
    "Cars and Vehicles",
    "Comedy",
    "Economics and Trade",
    "Education",
    "Entertainment",
    "Movies and Animation",
    "Gaming",
    "History and Facts",
    "Life Styles",
    "Natural",
    "News and Politics",
    "Pets and Animals",
    "Place and Region",
    "Sports",
    "Science and Technology",
    "Travels and Events",
    "Others",
  ];

  // Forum interfaces and state
  interface ForumMessage {
    id: number;
    senderId: number;
    senderName: string;
    senderAvatar?: string;
    text: string;
    timestamp: string;
    attachment?: {
      type: "image" | "video" | "file";
      url: string;
      fileName?: string;
      fileSize?: number;
    };
  }

  interface Forum {
    id: number;
    name: string;
    description: string;
    category: string;
    createdAt: string;
    memberCount: number;
    postCount: number;
    creatorId: number;
    creatorName: string;
    creatorAvatar?: string;
    messages: ForumMessage[];
    members: number[]; // Array of user IDs who are members
    admins: number[]; // Array of user IDs who are admins
    backgroundColor?: string; // Background color for chat
    backgroundImage?: string; // Background image URL for chat
    backgroundOpacity?: number; // Background image opacity (0-1)
  }

  const [forums, setForums] = useState<Forum[]>([]);
  const currentUserId = 0; // Current user ID

  // Get current user's forums (created by user)
  const myForums = forums.filter((forum) => forum.creatorId === currentUserId);

  // Get joined forums (user is member but not creator)
  const joinedForums = forums.filter(
    (forum) =>
      forum.creatorId !== currentUserId && joinedForumIds.has(forum.id)
  );

  // Get discover forums (all forums user hasn't joined)
  const discoverForums = forums.filter(
    (forum) =>
      forum.creatorId !== currentUserId && !joinedForumIds.has(forum.id)
  );

  // Filter categories based on search
  const filteredCategories = categories.filter((category) =>
    category.toLowerCase().includes(categoryFilter.toLowerCase())
  );

  // Get forums based on active tab
  const getForumsForActiveTab = () => {
    let tabForums: Forum[] = [];
    if (activeTab === "my-forums") {
      tabForums = myForums;
    } else if (activeTab === "joined") {
      tabForums = joinedForums;
    } else {
      tabForums = discoverForums;
    }
    return tabForums;
  };

  // Filter forums based on selected category and search query
  const filteredForums = getForumsForActiveTab().filter((forum) => {
    // Filter by category (case-insensitive)
    const matchesCategory =
      selectedCategory === "All" || 
      forum.category?.toLowerCase().trim() === selectedCategory.toLowerCase().trim();

    // Filter by search query (name or description)
    const matchesSearch =
      !searchQuery.trim() ||
      forum.name.toLowerCase().includes(searchQuery.toLowerCase().trim()) ||
      forum.description.toLowerCase().includes(searchQuery.toLowerCase().trim()) ||
      forum.category?.toLowerCase().includes(searchQuery.toLowerCase().trim());

    return matchesCategory && matchesSearch;
  });

  const selectedForum = forums.find((f) => f.id === selectedForumId);
  const isForumAdmin = selectedForum
    ? selectedForum.creatorId === currentUserId ||
      selectedForum.admins.includes(currentUserId)
    : false;

  // Handle forum creation
  const handleCreateForum = (forumData: {
    name: string;
    description: string;
    category: string;
    backgroundColor?: string;
    backgroundImage?: string;
    backgroundOpacity?: number;
  }) => {
    const newForum: Forum = {
      id: Date.now(),
      name: forumData.name,
      description: forumData.description,
      category: forumData.category,
      createdAt: new Date().toISOString(),
      memberCount: 1,
      postCount: 0,
      creatorId: currentUserId,
      creatorName: getProfileUsername(),
      messages: [],
      members: [currentUserId],
      admins: [currentUserId],
      backgroundColor: forumData.backgroundColor,
      backgroundImage: forumData.backgroundImage,
      backgroundOpacity: forumData.backgroundOpacity,
    };
    setForums((prev) => [newForum, ...prev]);
    setJoinedForumIds((prev) => new Set(prev).add(newForum.id));
    // Auto-select the newly created forum
    setSelectedForumId(newForum.id);
  };

  // Handle joining a forum
  const handleJoinForum = (forumId: number) => {
    setForums((prev) =>
      prev.map((forum) => {
        if (forum.id === forumId) {
          const isAlreadyMember = forum.members.includes(currentUserId);
          return {
            ...forum,
            memberCount: isAlreadyMember
              ? forum.memberCount
              : forum.memberCount + 1,
            members: isAlreadyMember
              ? forum.members
              : [...forum.members, currentUserId],
          };
        }
        return forum;
      })
    );
    setJoinedForumIds((prev) => new Set(prev).add(forumId));
  };

  // Handle leaving a forum
  const handleLeaveForum = (forumId: number) => {
    setForums((prev) =>
      prev.map((forum) => {
        if (forum.id === forumId) {
          return {
            ...forum,
            memberCount: Math.max(0, forum.memberCount - 1),
            members: forum.members.filter((id) => id !== currentUserId),
          };
        }
        return forum;
      })
    );
    setJoinedForumIds((prev) => {
      const newSet = new Set(prev);
      newSet.delete(forumId);
      return newSet;
    });
    if (selectedForumId === forumId) {
      setSelectedForumId(null);
    }
  };

  // Handle sending a forum message
  const handleSendForumMessage = () => {
    if (
      (!forumMessageInput.trim() && !forumMessageAttachment) ||
      !selectedForumId
    )
      return;

    const newMessage: ForumMessage = {
      id: Date.now(),
      senderId: currentUserId,
      senderName: getProfileUsername(),
      text: forumMessageInput.trim(),
      timestamp: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
      attachment: forumMessageAttachment || undefined,
    };

    setForums((prev) =>
      prev.map((forum) => {
        if (forum.id === selectedForumId) {
          return {
            ...forum,
            messages: [...forum.messages, newMessage],
            postCount: forum.postCount + 1,
          };
        }
        return forum;
      })
    );

    setForumMessageInput("");
    setForumMessageAttachment(null);
  };

  // Handle forum file select
  const handleForumFileSelect = (
    e: React.ChangeEvent<HTMLInputElement>,
    type: "image" | "video" | "file"
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setForumMessageAttachment({
          type: type,
          url: reader.result as string,
          fileName: file.name,
          fileSize: file.size,
        });
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle delete forum (admin only)
  const handleDeleteForum = (forumId: number) => {
    if (
      window.confirm(
        "Are you sure you want to delete this forum? This action cannot be undone."
      )
    ) {
      setForums((prev) => prev.filter((forum) => forum.id !== forumId));
      setJoinedForumIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(forumId);
        return newSet;
      });
      if (selectedForumId === forumId) {
        setSelectedForumId(null);
      }
    }
  };

  // Handle edit forum (admin only)
  const handleEditForum = (
    forumId: number,
    forumData: {
      name: string;
      description: string;
      category: string;
      backgroundColor?: string;
      backgroundImage?: string;
      backgroundOpacity?: number;
    }
  ) => {
    setForums((prev) =>
      prev.map((forum) => {
        if (forum.id === forumId) {
          return {
            ...forum,
            name: forumData.name,
            description: forumData.description,
            category: forumData.category,
            backgroundColor: forumData.backgroundColor,
            backgroundImage: forumData.backgroundImage,
            backgroundOpacity: forumData.backgroundOpacity,
          };
        }
        return forum;
      })
    );
    setEditingForum(null);
    setIsEditForumModalOpen(false);
  };

  // Handle remove user from forum (admin only)
  const handleRemoveUserFromForum = (forumId: number, userId: number) => {
    if (
      window.confirm(
        "Are you sure you want to remove this user from the forum?"
      )
    ) {
      setForums((prev) =>
        prev.map((forum) => {
          if (forum.id === forumId) {
            return {
              ...forum,
              members: forum.members.filter((id) => id !== userId),
              admins: forum.admins.filter((id) => id !== userId),
              memberCount: Math.max(0, forum.memberCount - 1),
            };
          }
          return forum;
        })
      );
      // If removed user was viewing the forum, close it
      if (selectedForumId === forumId && userId === currentUserId) {
        setSelectedForumId(null);
      }
    }
  };

  // Handle grant admin privileges (creator/admin only)
  const handleGrantAdmin = (forumId: number, userId: number) => {
    setForums((prev) =>
      prev.map((forum) => {
        if (forum.id === forumId && !forum.admins.includes(userId)) {
          return {
            ...forum,
            admins: [...forum.admins, userId],
          };
        }
        return forum;
      })
    );
  };

  // Handle revoke admin privileges (creator only)
  const handleRevokeAdmin = (forumId: number, userId: number) => {
    // Cannot revoke creator's admin status
    const forum = forums.find((f) => f.id === forumId);
    if (forum && forum.creatorId === userId) {
      alert("Cannot revoke admin privileges from the forum creator.");
      return;
    }

    if (
      window.confirm(
        "Are you sure you want to revoke admin privileges from this user?"
      )
    ) {
      setForums((prev) =>
        prev.map((forum) => {
          if (forum.id === forumId) {
            return {
              ...forum,
              admins: forum.admins.filter((id) => id !== userId),
            };
          }
          return forum;
        })
      );
    }
  };

  // Scroll forum messages to bottom
  useEffect(() => {
    if (forumMessagesEndRef.current && selectedForum) {
      forumMessagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [selectedForum?.messages]);

  // Close admin menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        forumAdminMenuRef.current &&
        !forumAdminMenuRef.current.contains(event.target as Node)
      ) {
        setIsForumAdminMenuOpen(false);
      }
    };

    if (isForumAdminMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isForumAdminMenuOpen]);

  // Handle profile navigation
  const handleProfileClick = () => {
    const username = getProfileUsername();
    navigate(`/profile/${encodeURIComponent(username)}`);
  };

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

  const unreadNotificationsCount = notifications.filter(
    (n) => !n.isRead
  ).length;

  const markNotificationAsRead = (notificationId: number) => {
    setNotifications((prev) =>
      prev.map((notif) =>
        notif.id === notificationId ? { ...notif, isRead: true } : notif
      )
    );
  };

  const markAllAsRead = () => {
    setNotifications((prev) =>
      prev.map((notif) => ({ ...notif, isRead: true }))
    );
  };

  const clearAllNotifications = () => {
    setNotifications([]);
  };

  const deleteNotification = (notificationId: number) => {
    setNotifications((prev) =>
      prev.filter((notif) => notif.id !== notificationId)
    );
  };

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


  const filteredConversations = chatConversations.filter((chat) =>
    chat.userName.toLowerCase().includes(chatSearchQuery.toLowerCase().trim())
  );

  const selectedChat = chatConversations.find(
    (chat) => chat.id === selectedChatId
  );

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [selectedChat?.messages]);

  const handleSendMessage = () => {
    if ((!messageInput.trim() && !messageAttachment) || !selectedChatId) return;

    const newMessage: ChatMessage = {
      id: Date.now(),
      senderId: 0,
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
      reader.readAsDataURL(file);
    }
  };

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

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleCreateClick = () => {
    setIsCreateMenuOpen(!isCreateMenuOpen);
  };

  const handleCreatePost = () => {
    setIsCreateMenuOpen(false);
  };

  const handleCreateStory = () => {
    setIsCreateMenuOpen(false);
  };

  const handleCreateGroup = () => {
    setIsCreateMenuOpen(false);
  };

  const handleCreateEvent = () => {
    setIsCreateMenuOpen(false);
  };

  // Close dropdown when clicking outside
  const handleClickOutside = useCallback((event: MouseEvent) => {
    if (
      createMenuRef.current &&
      !createMenuRef.current.contains(event.target as Node)
    ) {
      setIsCreateMenuOpen(false);
    }
  }, []);

  useEffect(() => {
    if (isCreateMenuOpen || isAddFriendModalOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isCreateMenuOpen, isAddFriendModalOpen, handleClickOutside]);

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

  return (
    <div className="forums-page">
      {/* Top Navigation Bar - Same as NewsFeed */}
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
            <div className="newsfeed-header__logo" onClick={() => navigate("/")}>
              <LazyImage src={primaryLogo} alt="JOSCity Logo" />
              <span>JOSCity</span>
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
              >
                <SquarePlus size={20} />
              </button>
              {isCreateMenuOpen && (
                <div className="newsfeed-header__create-dropdown">
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
                    <span>Create Group</span>
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
            <button
              className="newsfeed-header__icon-btn"
              title="Add Friend"
              onClick={() => setIsAddFriendModalOpen(true)}
            >
              <UserPlus size={20} />
            </button>
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

        <NewsFeedSidebar
          isOpen={isLeftSidebarOpen}
          onClose={() => setIsLeftSidebarOpen(false)}
        />

        {/* Forums Banner Section */}
        <div className="forums-banner">
          <div className="forums-banner__content">
            <h1 className="forums-banner__title">Forums</h1>
            <div className="forums-banner__search-wrapper">
              <input
                type="text"
                className="forums-banner__search"
                placeholder="Search for forums"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <Search size={20} className="forums-banner__search-icon" />
            </div>
            <div className="forums-banner__illustration">
              {/* Illustration placeholder - can be replaced with actual image */}
            </div>
          </div>
        </div>

        {/* Navigation Tabs and Create Forum Button */}
        <div className="forums-nav">
          <div className="forums-nav__tabs">
            <button
              type="button"
              className={`forums-nav__tab ${
                activeTab === "discover" ? "forums-nav__tab--active" : ""
              }`}
              onClick={() => setActiveTab("discover")}
            >
              Discover
            </button>
            <button
              type="button"
              className={`forums-nav__tab ${
                activeTab === "joined" ? "forums-nav__tab--active" : ""
              }`}
              onClick={() => setActiveTab("joined")}
            >
              Joined Forums
            </button>
            <button
              type="button"
              className={`forums-nav__tab ${
                activeTab === "my-forums" ? "forums-nav__tab--active" : ""
              }`}
              onClick={() => setActiveTab("my-forums")}
            >
              My Forums
            </button>
          </div>
          <button
            className="forums-nav__create-btn"
            onClick={() => setIsCreateForumModalOpen(true)}
          >
            <Plus size={18} />
            <span>Create Forum</span>
          </button>
        </div>

        {/* Categories Sidebar */}
        <aside className="forums-categories">
          <div className="forums-categories__header">
            <h3 className="forums-categories__title">Categories</h3>
          </div>
          <div
            style={{
              marginBottom: "16px",
              position: "relative",
            }}
          >
            <input
              type="text"
              placeholder="Filter categories..."
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              style={{
                width: "100%",
                padding: "10px 12px 10px 36px",
                borderRadius: "8px",
                border: "1px solid var(--border-color)",
                fontSize: "14px",
                backgroundColor: "var(--bg-secondary)",
                color: "var(--text-primary)",
                boxSizing: "border-box",
              }}
            />
            <Search
              size={16}
              style={{
                position: "absolute",
                left: "12px",
                top: "50%",
                transform: "translateY(-50%)",
                color: "var(--text-tertiary)",
                pointerEvents: "none",
              }}
            />
          </div>
          <div className="forums-categories__list">
            {filteredCategories.length > 0 ? (
              filteredCategories.map((category) => (
              <button
                key={category}
                type="button"
                className={`forums-categories__item ${
                  selectedCategory === category
                    ? "forums-categories__item--active"
                    : ""
                }`}
                onClick={() => {
                  setSelectedCategory(category);
                  // Reset search when changing category for better UX
                  if (category !== selectedCategory) {
                    setSearchQuery("");
                  }
                }}
                title={`Filter forums by ${category === "All" ? "all categories" : category}`}
              >
                {category}
                {selectedCategory === category && (
                  <span style={{ marginLeft: "8px", fontSize: "12px" }}>✓</span>
                )}
              </button>
              ))
            ) : (
              <div
                style={{
                  padding: "12px",
                  textAlign: "center",
                  color: "var(--text-tertiary)",
                  fontSize: "14px",
                }}
              >
                No categories found
              </div>
            )}
          </div>
        </aside>

        {/* Main Content Area */}
        <main
          className="forums-main"
          style={
            selectedForum
              ? {
                  padding: 0,
                  display: "flex",
                  flexDirection: "column",
                  height: "calc(100vh - 300px)",
                  minHeight: "600px",
                }
              : {}
          }
        >
          {selectedForum ? (
            /* Forum Chat View */
            <div
              style={{
                width: "100%",
                height: "100%",
                display: "flex",
                flexDirection: "column",
              }}
            >
              {/* Forum Header */}
              <div
                style={{
                  padding: "20px",
                  borderBottom: "1px solid var(--border-color)",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                  <button
                    onClick={() => setSelectedForumId(null)}
                    style={{
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      padding: "8px",
                      borderRadius: "8px",
                      display: "flex",
                      alignItems: "center",
                      color: "var(--text-primary)",
                    }}
                    title="Back to forums"
                  >
                    <ArrowLeft size={20} />
                  </button>
                  <div>
                    <h2
                      style={{
                        fontSize: "20px",
                        fontWeight: "600",
                        color: "var(--text-primary)",
                        margin: "0 0 4px 0",
                      }}
                    >
                      {selectedForum.name}
                      {isForumAdmin && (
                        <span title="You are the admin">
                          <Shield
                            size={16}
                            style={{
                              marginLeft: "8px",
                              display: "inline-block",
                              verticalAlign: "middle",
                              color: "var(--color-primary)",
                            }}
                          />
                        </span>
                      )}
                    </h2>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                        fontSize: "14px",
                        color: "var(--text-tertiary)",
                      }}
                    >
                      <span
                        style={{
                          padding: "4px 12px",
                          backgroundColor: "var(--color-primary)",
                          color: "white",
                          borderRadius: "12px",
                          fontSize: "12px",
                          fontWeight: "500",
                        }}
                      >
                        {selectedForum.category}
                      </span>
                      <span>{selectedForum.memberCount} members</span>
                    </div>
                  </div>
                </div>
                {isForumAdmin && (
                  <div style={{ position: "relative" }} ref={forumAdminMenuRef}>
                    <button
                      onClick={() => setIsForumAdminMenuOpen(!isForumAdminMenuOpen)}
                      style={{
                        padding: "8px",
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        borderRadius: "8px",
                        color: "var(--text-primary)",
                      }}
                      title="Admin options"
                    >
                      <MoreVertical size={20} />
                    </button>
                    {isForumAdminMenuOpen && (
                      <div
                        style={{
                          position: "absolute",
                          top: "100%",
                          right: "0",
                          marginTop: "8px",
                          backgroundColor: "var(--card-bg)",
                          borderRadius: "8px",
                          boxShadow: "0 4px 12px var(--shadow-medium)",
                          minWidth: "180px",
                          zIndex: 1000,
                          border: "1px solid var(--border-color)",
                        }}
                      >
                        <button
                          onClick={() => {
                            if (selectedForum) {
                              setEditingForum({
                                id: selectedForum.id,
                                name: selectedForum.name,
                                description: selectedForum.description,
                                category: selectedForum.category,
                                backgroundColor: selectedForum.backgroundColor,
                                backgroundImage: selectedForum.backgroundImage,
                                backgroundOpacity: selectedForum.backgroundOpacity,
                              });
                              setIsEditForumModalOpen(true);
                              setIsForumAdminMenuOpen(false);
                            }
                          }}
                          style={{
                            width: "100%",
                            padding: "12px 16px",
                            background: "none",
                            border: "none",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: "12px",
                            fontSize: "14px",
                            color: "var(--text-primary)",
                            borderBottom: "1px solid var(--border-color)",
                          }}
                        >
                          <Edit size={16} />
                          <span>Edit Forum</span>
                        </button>
                        <button
                          onClick={() => {
                            handleDeleteForum(selectedForum.id);
                            setIsForumAdminMenuOpen(false);
                          }}
                          style={{
                            width: "100%",
                            padding: "12px 16px",
                            background: "none",
                            border: "none",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: "12px",
                            fontSize: "14px",
                            color: "#d32f2f",
                          }}
                        >
                          <Trash2 size={16} />
                          <span>Delete Forum</span>
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Forum Description */}
              <div
                style={{
                  padding: "16px 20px",
                  backgroundColor: "var(--bg-secondary)",
                  borderBottom: "1px solid var(--border-color)",
                }}
              >
                <p
                  style={{
                    color: "var(--text-secondary)",
                    fontSize: "14px",
                    lineHeight: "1.6",
                    margin: 0,
                  }}
                >
                  {selectedForum.description}
                </p>
              </div>

              {/* Forum Messages */}
              <div
                style={{
                  flex: 1,
                  overflowY: "auto",
                  padding: "12px 16px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "12px",
                  position: "relative",
                  backgroundColor: selectedForum.backgroundColor || "#f8f9fa",
                }}
              >
                {selectedForum.backgroundImage && (
                  <div
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      backgroundImage: `url(${selectedForum.backgroundImage})`,
                      backgroundSize: "cover",
                      backgroundPosition: "center",
                      backgroundRepeat: "no-repeat",
                      opacity: selectedForum.backgroundOpacity ?? 0.5,
                      zIndex: 0,
                    }}
                  />
                )}
                <div style={{ position: "relative", zIndex: 1, width: "100%" }}>
                {selectedForum.messages.length > 0 ? (
                  selectedForum.messages.map((message) => {
                    const isCurrentUser = message.senderId === currentUserId;
                    return (
                      <div
                        key={message.id}
                        style={{
                          display: "flex",
                          alignItems: "flex-end",
                          gap: "8px",
                          maxWidth: "75%",
                          alignSelf: isCurrentUser ? "flex-end" : "flex-start",
                          flexDirection: isCurrentUser ? "row-reverse" : "row",
                          marginLeft: isCurrentUser ? "auto" : "0",
                          marginRight: isCurrentUser ? "0" : "auto",
                        }}
                      >
                        <div
                          style={{
                            width: "32px",
                            height: "32px",
                            borderRadius: "50%",
                            backgroundColor: "var(--color-primary)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: "white",
                            fontSize: "12px",
                            fontWeight: "600",
                            flexShrink: 0,
                          }}
                        >
                          {message.senderName
                            .split(" ")
                            .map((n) => n[0])
                            .join("")
                            .toUpperCase()
                            .slice(0, 2)}
                        </div>
                        <div
                          style={{
                            padding: "10px 14px",
                            borderRadius: "16px",
                            backgroundColor: isCurrentUser
                              ? "#0d4a1f"
                              : "var(--card-bg)",
                            color: isCurrentUser ? "white" : "var(--text-primary)",
                            boxShadow: "0 1px 2px rgba(0,0,0,0.1)",
                          }}
                        >
                          <div
                            style={{
                              fontSize: "12px",
                              fontWeight: "600",
                              marginBottom: "4px",
                              color: isCurrentUser
                                ? "rgba(255,255,255,0.9)"
                                : "var(--text-primary)",
                            }}
                          >
                            {message.senderName}
                          </div>
                          {message.text && (
                            <p
                              style={{
                                margin: 0,
                                fontSize: "14px",
                                lineHeight: "1.5",
                              }}
                            >
                              {message.text}
                            </p>
                          )}
                          <div
                            style={{
                              fontSize: "11px",
                              opacity: 0.7,
                              marginTop: "4px",
                            }}
                          >
                            {message.timestamp}
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div
                    style={{
                      textAlign: "center",
                      padding: "40px",
                      color: "var(--text-tertiary)",
                    }}
                  >
                    <MessageSquare size={48} style={{ opacity: 0.5 }} />
                    <p style={{ marginTop: "16px" }}>
                      No messages yet. Start the conversation!
                    </p>
                  </div>
                )}
                <div ref={forumMessagesEndRef} />
                </div>
              </div>

              {/* Forum Message Input */}
              <div
                style={{
                  padding: "16px 20px",
                  borderTop: "1px solid var(--border-color)",
                  backgroundColor: "var(--card-bg)",
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  position: "relative",
                  overflow: "visible",
                }}
              >
                <input
                  type="file"
                  ref={forumFileInputRef}
                  accept="*/*"
                  onChange={(e) => handleForumFileSelect(e, "file")}
                  style={{ display: "none" }}
                />
                <input
                  type="file"
                  ref={forumImageInputRef}
                  accept="image/*"
                  onChange={(e) => handleForumFileSelect(e, "image")}
                  style={{ display: "none" }}
                />
                <input
                  type="file"
                  ref={forumVideoInputRef}
                  accept="video/*"
                  onChange={(e) => handleForumFileSelect(e, "video")}
                  style={{ display: "none" }}
                />
                <button
                  onClick={() => forumImageInputRef.current?.click()}
                  style={{
                    padding: "8px",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: "var(--text-tertiary)",
                  }}
                  title="Attach image"
                >
                  <Image size={20} />
                </button>
                <input
                  type="text"
                  placeholder="Type a message..."
                  value={forumMessageInput}
                  onChange={(e) => setForumMessageInput(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSendForumMessage();
                    }
                  }}
                  style={{
                    flex: 1,
                    padding: "12px 16px",
                    borderRadius: "24px",
                    border: "1px solid var(--border-color)",
                    fontSize: "14px",
                    backgroundColor: "var(--bg-secondary)",
                    color: "var(--text-primary)",
                  }}
                />
                <div style={{ position: "relative" }}>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      setIsForumEmojiPickerOpen(!isForumEmojiPickerOpen);
                    }}
                    onMouseDown={(e) => {
                      e.stopPropagation();
                    }}
                    style={{
                      padding: "8px",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      color: "var(--text-tertiary)",
                    }}
                    title="Add emoji"
                  >
                    <Smile size={20} />
                  </button>
                  {isForumEmojiPickerOpen && (
                    <div
                      style={{
                        position: "absolute",
                        bottom: "100%",
                        right: 0,
                        marginBottom: "8px",
                      }}
                      onMouseDown={(e) => e.stopPropagation()}
                    >
                      <EmojiPicker
                        isOpen={isForumEmojiPickerOpen}
                        onClose={() => setIsForumEmojiPickerOpen(false)}
                        onEmojiSelect={(emoji) => {
                          setForumMessageInput((prev) => prev + emoji);
                          setIsForumEmojiPickerOpen(false);
                        }}
                        position="top"
                      />
                    </div>
                  )}
                </div>
                <button
                  onClick={handleSendForumMessage}
                  disabled={!forumMessageInput.trim() && !forumMessageAttachment}
                  style={{
                    padding: "12px",
                    background: "var(--color-primary)",
                    border: "none",
                    borderRadius: "50%",
                    cursor: forumMessageInput.trim() || forumMessageAttachment
                      ? "pointer"
                      : "not-allowed",
                    color: "white",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    opacity: forumMessageInput.trim() || forumMessageAttachment
                      ? 1
                      : 0.5,
                  }}
                  title="Send message"
                >
                  <Send size={20} />
                </button>
              </div>

              {/* Members Management (Admin only) */}
              {isForumAdmin && selectedForum && (
                <div
                  style={{
                    padding: "16px 20px",
                    borderTop: "1px solid var(--border-color)",
                    backgroundColor: "var(--bg-secondary)",
                  }}
                >
                  <h3
                    style={{
                      fontSize: "16px",
                      fontWeight: "600",
                      color: "var(--text-primary)",
                      margin: "0 0 12px 0",
                    }}
                  >
                    Forum Members ({selectedForum.memberCount})
                  </h3>
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "8px",
                      maxHeight: "200px",
                      overflowY: "auto",
                    }}
                  >
                    {selectedForum.members.map((memberId) => {
                      const isMemberAdmin = selectedForum.admins.includes(memberId);
                      const isMemberCreator = selectedForum.creatorId === memberId;
                      const memberName =
                        memberId === currentUserId
                          ? getProfileUsername()
                          : `User ${memberId}`;

                      return (
                        <div
                          key={memberId}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            padding: "8px 12px",
                            borderRadius: "8px",
                            backgroundColor: "var(--card-bg)",
                          }}
                        >
                          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                            <div
                              style={{
                                width: "32px",
                                height: "32px",
                                borderRadius: "50%",
                                backgroundColor: "var(--color-primary)",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                color: "white",
                                fontSize: "12px",
                                fontWeight: "600",
                              }}
                            >
                              {memberName
                                .split(" ")
                                .map((n) => n[0])
                                .join("")
                                .toUpperCase()
                                .slice(0, 2)}
                            </div>
                            <div>
                              <div
                                style={{
                                  fontSize: "14px",
                                  fontWeight: "500",
                                  color: "var(--text-primary)",
                                }}
                              >
                                {memberName}
                                {isMemberCreator && (
                                  <span
                                    style={{
                                      marginLeft: "8px",
                                      fontSize: "12px",
                                      color: "var(--color-primary)",
                                    }}
                                  >
                                    (Creator)
                                  </span>
                                )}
                                {isMemberAdmin && !isMemberCreator && (
                                  <span
                                    style={{
                                      marginLeft: "8px",
                                      fontSize: "12px",
                                      color: "var(--color-primary)",
                                    }}
                                  >
                                    (Admin)
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          <div style={{ display: "flex", gap: "8px" }}>
                            {!isMemberCreator &&
                              isForumAdmin &&
                              selectedForum.creatorId === currentUserId && (
                                <>
                                  {isMemberAdmin ? (
                                    <button
                                      onClick={() =>
                                        handleRevokeAdmin(selectedForum.id, memberId)
                                      }
                                      style={{
                                        padding: "6px 12px",
                                        backgroundColor: "transparent",
                                        border: "1px solid var(--border-color)",
                                        borderRadius: "6px",
                                        fontSize: "12px",
                                        color: "var(--text-primary)",
                                        cursor: "pointer",
                                      }}
                                      title="Revoke Admin"
                                    >
                                      <Shield size={14} />
                                    </button>
                                  ) : (
                                    <button
                                      onClick={() =>
                                        handleGrantAdmin(selectedForum.id, memberId)
                                      }
                                      style={{
                                        padding: "6px 12px",
                                        backgroundColor: "transparent",
                                        border: "1px solid var(--border-color)",
                                        borderRadius: "6px",
                                        fontSize: "12px",
                                        color: "var(--text-primary)",
                                        cursor: "pointer",
                                      }}
                                      title="Grant Admin"
                                    >
                                      <Shield size={14} />
                                    </button>
                                  )}
                                </>
                              )}
                            {!isMemberCreator && isForumAdmin && (
                              <button
                                onClick={() =>
                                  handleRemoveUserFromForum(selectedForum.id, memberId)
                                }
                                style={{
                                  padding: "6px 12px",
                                  backgroundColor: "transparent",
                                  border: "1px solid var(--border-color)",
                                  borderRadius: "6px",
                                  fontSize: "12px",
                                  color: "#d32f2f",
                                  cursor: "pointer",
                                }}
                                title="Remove User"
                              >
                                <UserX size={14} />
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Forum List View */
            <>
              <h2 className="forums-main__title">
                {activeTab === "discover"
                  ? "Discover Forums"
                  : activeTab === "joined"
                  ? "Joined Forums"
                  : "My Forums"}
              </h2>
              {selectedCategory !== "All" && (
                <div
                  style={{
                    padding: "12px 16px",
                    marginBottom: "16px",
                    backgroundColor: "var(--bg-secondary)",
                    borderRadius: "8px",
                    fontSize: "14px",
                    color: "var(--text-secondary)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <span>
                    Showing forums in <strong>{selectedCategory}</strong> category
                    {filteredForums.length > 0 && (
                      <span> ({filteredForums.length} {filteredForums.length === 1 ? "forum" : "forums"})</span>
                    )}
                  </span>
                  <button
                    onClick={() => setSelectedCategory("All")}
                    style={{
                      padding: "4px 12px",
                      backgroundColor: "transparent",
                      border: "1px solid var(--border-color)",
                      borderRadius: "6px",
                      fontSize: "12px",
                      color: "var(--text-primary)",
                      cursor: "pointer",
                    }}
                  >
                    Clear Filter
                  </button>
                </div>
              )}
              {filteredForums.length > 0 ? (
                <div
                  style={{
                    width: "100%",
                    display: "flex",
                    flexDirection: "column",
                    gap: "16px",
                  }}
                >
                  {filteredForums.map((forum) => {
                    const isMember =
                      forum.creatorId === currentUserId ||
                      joinedForumIds.has(forum.id);
                    const isCreator = forum.creatorId === currentUserId;
                    return (
                      <div
                        key={forum.id}
                        style={{
                          padding: "20px",
                          backgroundColor: "var(--bg-secondary)",
                          borderRadius: "12px",
                          border: "1px solid var(--border-color)",
                          cursor: isMember ? "pointer" : "default",
                        }}
                        onClick={() => {
                          if (isMember) {
                            setSelectedForumId(forum.id);
                          }
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "flex-start",
                            marginBottom: "12px",
                          }}
                        >
                          <div>
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "8px",
                              }}
                            >
                              <h3
                                style={{
                                  fontSize: "18px",
                                  fontWeight: "600",
                                  color: "var(--text-primary)",
                                  margin: "0 0 8px 0",
                                }}
                              >
                                {forum.name}
                              </h3>
                              {isCreator && (
                                <span title="You created this forum">
                                  <Shield
                                    size={16}
                                    style={{ color: "var(--color-primary)" }}
                                  />
                                </span>
                              )}
                            </div>
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "12px",
                                fontSize: "14px",
                                color: "var(--text-tertiary)",
                              }}
                            >
                              <span
                                style={{
                                  padding: "4px 12px",
                                  backgroundColor: "var(--color-primary)",
                                  color: "white",
                                  borderRadius: "12px",
                                  fontSize: "12px",
                                  fontWeight: "500",
                                }}
                              >
                                {forum.category}
                              </span>
                              <span>{forum.memberCount} members</span>
                              <span>{forum.postCount} messages</span>
                            </div>
                          </div>
                        </div>
                        <p
                          style={{
                            color: "var(--text-secondary)",
                            fontSize: "14px",
                            lineHeight: "1.6",
                            margin: "0 0 12px 0",
                          }}
                        >
                          {forum.description}
                        </p>
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                          }}
                        >
                          <div
                            style={{
                              fontSize: "12px",
                              color: "var(--text-tertiary)",
                            }}
                          >
                            Created by {forum.creatorName}
                          </div>
                          {isMember ? (
                            <div style={{ display: "flex", gap: "8px" }}>
                              {!isCreator && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleLeaveForum(forum.id);
                                  }}
                                  style={{
                                    padding: "8px 16px",
                                    backgroundColor: "transparent",
                                    color: "var(--text-primary)",
                                    border: "1px solid var(--border-color)",
                                    borderRadius: "8px",
                                    fontSize: "14px",
                                    fontWeight: "500",
                                    cursor: "pointer",
                                  }}
                                >
                                  Leave
                                </button>
                              )}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedForumId(forum.id);
                                }}
                                style={{
                                  padding: "8px 16px",
                                  backgroundColor: "var(--color-primary)",
                                  color: "white",
                                  border: "none",
                                  borderRadius: "8px",
                                  fontSize: "14px",
                                  fontWeight: "500",
                                  cursor: "pointer",
                                }}
                              >
                                Open Chat
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleJoinForum(forum.id);
                              }}
                              style={{
                                padding: "8px 16px",
                                backgroundColor: "var(--color-primary)",
                                color: "white",
                                border: "none",
                                borderRadius: "8px",
                                fontSize: "14px",
                                fontWeight: "500",
                                cursor: "pointer",
                              }}
                            >
                              Join Forum
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
          <div className="forums-main__empty">
            <div className="forums-main__empty-icon">
              <MessageSquare size={64} />
              <Search size={32} />
            </div>
            <p className="forums-main__empty-text">No Data Found</p>
            <p className="forums-main__empty-subtext">
                    {selectedCategory === "All"
                      ? activeTab === "my-forums"
                        ? "You haven't created any forums yet. Create one to get started!"
                        : activeTab === "joined"
                        ? "You haven't joined any forums yet. Discover forums to join!"
                        : "There are no forums yet. Create one to get started!"
                      : `No forums found in "${selectedCategory}" category.`}
            </p>
          </div>
              )}
            </>
          )}
        </main>
      </div>

      {/* Add Friend Modal */}
      <FindFriendsModal
        isOpen={isAddFriendModalOpen}
        onClose={() => setIsAddFriendModalOpen(false)}
      />

      {/* Chat Panel - Same as NewsFeed */}
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
                        {/* Back button for mobile */}
                        <button
                          className="newsfeed-chat-panel__back-btn"
                          onClick={() => setSelectedChatId(null)}
                          aria-label="Back to conversations"
                          title="Back"
                        >
                          <X size={20} />
                        </button>
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
                        <div>
                          <p className="newsfeed-chat-panel__chat-user-name">
                            {selectedChat.userName}
                          </p>
                          <p className="newsfeed-chat-panel__chat-status">
                            {selectedChat.isOnline ? "Online" : "Offline"}
                          </p>
                        </div>
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
                              {message.text && (
                                <p className="newsfeed-chat-panel__message-text">
                                  {message.text}
                                </p>
                              )}
                              <span className="newsfeed-chat-panel__message-time">
                                {message.timestamp}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                      <div ref={messagesEndRef} />
                    </div>

                    <div className="newsfeed-chat-panel__input-area">
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
                      <div style={{ position: "relative", zIndex: 1000 }}>
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

      {/* Notification Panel - Same as NewsFeed */}
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

      {/* Create Forum Modal */}
      <CreateForumModal
        isOpen={isCreateForumModalOpen}
        onClose={() => setIsCreateForumModalOpen(false)}
        userName={getProfileUsername()}
        userAvatar={getUserAvatar() || undefined}
        categories={categories}
        onForum={handleCreateForum}
      />

      {/* Edit Forum Modal */}
      <CreateForumModal
        isOpen={isEditForumModalOpen}
        onClose={() => {
          setIsEditForumModalOpen(false);
          setEditingForum(null);
        }}
        userName={getProfileUsername()}
        userAvatar={getUserAvatar() || undefined}
        categories={categories}
        editingForum={editingForum}
        onEdit={handleEditForum}
      />
    </div>
  );
};

export default Forums;
