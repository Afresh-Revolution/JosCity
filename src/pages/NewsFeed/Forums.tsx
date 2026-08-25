import React, { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
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
  Send,
  Smile,
  MessageSquare,
  UserCheck,
  UserX,
  CheckCircle,
  Trash2,
  Image,
  Plus,
  Edit,
  Shield,
  ArrowLeft,
  MoreVertical,
  Copy,
  Lock,
  Link2,
} from "lucide-react";
import ConfirmationModal from "../../components/ConfirmationModal";

import primaryLogo from "../../image/primary-logo.png";
import "../../main.css";
import LazyImage from "../../components/LazyImage";
import Avatar from "../../components/Avatar";
import ChatPanel from "../../components/ChatPanel";
import EmojiPicker from "../../components/EmojiPicker";
import {
  getProfileUsername,
  getUserName,
  getUserAvatar,
  isAuthenticated,
  getUserId,
} from "../../utils/userUtils";
import { feedApi } from "../../services/feedApi";
import { startVisibleInterval } from "../../utils/visibleInterval";
import { forumsApi } from "../../services/forumsApi";
import { CHAT_UI_REFRESH_EVENT } from "../../services/chatService";
import {
  type Forum,
  mapApiSummaryToForum,
  mapApiDetailToForum,
  type ForumMessage,
  type ForumMemberDetail,
  formatForumTime,
  stripForumDisplayHandle,
} from "./forumsHelpers";
import {
  type FeedPanelNotification,
  mapApiRowToFeedPanelNotification,
  getFeedPanelNotificationIcon,
  getFeedPanelNotificationColor,
} from "../../utils/feedPanelNotifications";
import CreateForumModal from "./CreateForumModal";
import FindFriendsModal from "../../components/FindFriendsModal";
import "../../scss/_emojipicker.scss";
import "../../scss/_forums.scss";
import NewsFeedSidebar from "./NewsFeedSidebar";

function forumMessageDisplayName(
  message: ForumMessage,
  memberDetails: ForumMemberDetail[] | undefined,
  currentUserId: number | null
): string {
  const raw = message.senderName?.trim() || "";
  const looksLikeIdPlaceholder = /^User\s+\d+$/i.test(raw);
  if (!looksLikeIdPlaceholder && raw) return stripForumDisplayHandle(raw);
  if (currentUserId != null && message.senderId === currentUserId) {
    const self = getProfileUsername();
    if (self?.trim()) return stripForumDisplayHandle(self.trim());
  }
  const row = memberDetails?.find((d) => d.userId === message.senderId);
  if (row?.displayName?.trim()) return stripForumDisplayHandle(row.displayName.trim());
  return stripForumDisplayHandle(raw || `User ${message.senderId}`);
}

const Forums: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [isLeftSidebarOpen, setIsLeftSidebarOpen] = useState(false);
  const [isRightSidebarOpen, setIsRightSidebarOpen] = useState(false);
  const [isCreateMenuOpen, setIsCreateMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("discover");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddFriendModalOpen, setIsAddFriendModalOpen] = useState(false);
  const [isChatPanelOpen, setIsChatPanelOpen] = useState(false);
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);
  const [activeChatConversationId, setActiveChatConversationId] = useState<
    number | null
  >(null);
  const [isNotificationPanelOpen, setIsNotificationPanelOpen] = useState(false);
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
  const forumEmojiAnchorRef = useRef<HTMLDivElement>(null);
  const [joinedForumIds, setJoinedForumIds] = useState<Set<number>>(new Set());
  const [showDeleteForumConfirm, setShowDeleteForumConfirm] = useState(false);
  const [showRemoveUserConfirm, setShowRemoveUserConfirm] = useState(false);
  const [showRevokeAdminConfirm, setShowRevokeAdminConfirm] = useState(false);
  const [pendingAction, setPendingAction] = useState<{
    type: "deleteForum" | "removeUser" | "revokeAdmin";
    forumId: number;
    userId?: number;
  } | null>(null);
  const [forumsLoadError, setForumsLoadError] = useState<string | null>(null);
  const [forumDetailError, setForumDetailError] = useState<string | null>(null);
  const [isForumListLoading, setIsForumListLoading] = useState(false);
  const [addMemberUserId, setAddMemberUserId] = useState("");
  const createMenuRef = useRef<HTMLDivElement>(null);
  const notificationPanelRef = useRef<HTMLDivElement>(null);

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

  const [forums, setForums] = useState<Forum[]>([]);
  const currentUserId = getUserId();

  const refreshForumList = useCallback(async () => {
    if (!isAuthenticated()) return;
    setIsForumListLoading(true);
    setForumsLoadError(null);
    try {
      const tab =
        activeTab === "discover"
          ? "discover"
          : activeTab === "joined"
            ? "joined"
            : "mine";
      const res = await forumsApi.list(tab);
      if (!res.success || !res.data) {
        setForumsLoadError(res.message || "Could not load forums");
        setForums([]);
        return;
      }
      const mapped = res.data.map((row) => mapApiSummaryToForum(row));
      setForums(mapped);
      if (activeTab === "joined" || activeTab === "my-forums") {
        setJoinedForumIds(new Set(mapped.map((f) => f.id)));
      }
    } catch {
      setForumsLoadError("Network error");
      setForums([]);
    } finally {
      setIsForumListLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    void refreshForumList();
  }, [refreshForumList]);

  const refetchSelectedForum = useCallback(async () => {
    if (!selectedForumId || !isAuthenticated()) return;
    setForumDetailError(null);
    const res = await forumsApi.getById(selectedForumId);
    if (!res.success || !res.data) {
      setForumDetailError(res.message || "Could not load forum");
      return;
    }
    const mapped = mapApiDetailToForum(res.data);
    setForums((prev) => {
      const idx = prev.findIndex((p) => p.id === mapped.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = { ...next[idx], ...mapped };
        return next;
      }
      return [...prev, mapped];
    });
    if (!mapped.joinRequired) {
      setJoinedForumIds((prev) => new Set(prev).add(selectedForumId));
    }
  }, [selectedForumId]);

  useEffect(() => {
    void refetchSelectedForum();
  }, [refetchSelectedForum]);

  useEffect(() => {
    const token = searchParams.get("invite")?.trim();
    if (!token || !isAuthenticated()) return;
    let cancelled = false;
    (async () => {
      const res = await forumsApi.joinByInviteToken(token);
      if (cancelled) return;
      const joinedId = res.data?.forumId;
      if (res.success && joinedId != null) {
        setSearchParams({});
        setJoinedForumIds((s) => new Set(s).add(joinedId));
        setActiveTab("joined");
        setSelectedForumId(joinedId);
      } else if (res.message) {
        setForumsLoadError(res.message);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [searchParams, setSearchParams]);

  // Get current user's forums (created by user)
  const myForums = forums.filter((forum) => forum.creatorId === currentUserId);

  // Get joined forums (user is member but not creator)
  const joinedForums = forums.filter(
    (forum) =>
      forum.creatorId !== currentUserId && joinedForumIds.has(forum.id)
  );

  // Discover: from API = public forums you’re not in + forums you created (you’re a member as creator).
  // Still show your own public forum even if joinedForumIds was populated from another tab.
  const discoverForums = forums.filter(
    (forum) =>
      !joinedForumIds.has(forum.id) || forum.creatorId === currentUserId
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
    ? selectedForum.isAdmin !== undefined
      ? selectedForum.isAdmin
      : selectedForum.creatorId === currentUserId ||
        selectedForum.admins.includes(currentUserId)
    : false;

  // Handle forum creation
  const handleCreateForum = async (forumData: {
    name: string;
    description: string;
    category: string;
    visibility: "public" | "private";
    backgroundColor?: string;
    backgroundImage?: string;
    backgroundOpacity?: number;
  }) => {
    const res = await forumsApi.create({
      name: forumData.name,
      description: forumData.description,
      category: forumData.category,
      visibility: forumData.visibility,
      backgroundColor: forumData.backgroundColor,
      backgroundImage: forumData.backgroundImage,
      backgroundOpacity: forumData.backgroundOpacity,
    });
    if (!res.success || !res.data) {
      throw new Error(res.message || "Could not create forum");
    }
    const mapped = mapApiSummaryToForum(res.data);
    setJoinedForumIds((prev) => new Set(prev).add(mapped.id));
    setActiveTab("my-forums");
    setSelectedForumId(mapped.id);
  };

  // Handle joining a forum
  const handleJoinForum = async (forumId: number) => {
    const res = await forumsApi.joinPublic(forumId);
    if (!res.success) {
      window.alert(res.message || "Could not join forum");
      return;
    }
    setJoinedForumIds((prev) => new Set(prev).add(forumId));
    if (selectedForumId === forumId) {
      await refetchSelectedForum();
    } else {
      await refreshForumList();
    }
  };

  // Handle leaving a forum
  const handleLeaveForum = async (forumId: number) => {
    const res = await forumsApi.leave(forumId);
    if (!res.success) {
      window.alert(res.message || "Could not leave forum");
      return;
    }
    setJoinedForumIds((prev) => {
      const next = new Set(prev);
      next.delete(forumId);
      return next;
    });
    if (selectedForumId === forumId) {
      setSelectedForumId(null);
    }
    await refreshForumList();
  };

  // Handle sending a forum message
  const handleSendForumMessage = async () => {
    if (
      (!forumMessageInput.trim() && !forumMessageAttachment) ||
      !selectedForumId
    )
      return;

    const res = await forumsApi.sendMessage(selectedForumId, {
      text: forumMessageInput.trim(),
      attachment: forumMessageAttachment || undefined,
    });
    if (!res.success || !res.data) {
      window.alert(res.message || "Could not send message");
      return;
    }
    const m = res.data;
    const newMessage: ForumMessage = {
      id: m.id,
      senderId: m.senderId,
      senderName: stripForumDisplayHandle(m.senderName),
      text: m.text,
      timestamp:
        typeof m.timestamp === "string"
          ? formatForumTime(m.timestamp)
          : new Date().toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            }),
      attachment: m.attachment as ForumMessage["attachment"],
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
    setPendingAction({ type: "deleteForum", forumId });
    setShowDeleteForumConfirm(true);
  };

  const handleConfirmDeleteForum = async () => {
    if (!pendingAction || pendingAction.type !== "deleteForum") return;
    const { forumId } = pendingAction;
    const res = await forumsApi.remove(forumId);
    if (!res.success) {
      window.alert(res.message || "Could not delete forum");
      return;
    }
    setForums((prev) => prev.filter((forum) => forum.id !== forumId));
    setJoinedForumIds((prev) => {
      const newSet = new Set(prev);
      newSet.delete(forumId);
      return newSet;
    });
    if (selectedForumId === forumId) {
      setSelectedForumId(null);
    }
    setShowDeleteForumConfirm(false);
    setPendingAction(null);
    await refreshForumList();
  };

  // Handle edit forum (admin only)
  const handleEditForum = async (
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
    const res = await forumsApi.update(forumId, {
      name: forumData.name,
      description: forumData.description,
      category: forumData.category,
      backgroundColor: forumData.backgroundColor,
      backgroundImage: forumData.backgroundImage,
      backgroundOpacity: forumData.backgroundOpacity,
    });
    if (!res.success || !res.data) {
      throw new Error(res.message || "Could not update forum");
    }
    const mapped = mapApiSummaryToForum(res.data);
    setForums((prev) =>
      prev.map((forum) =>
        forum.id === forumId ? { ...forum, ...mapped } : forum
      )
    );
    setEditingForum(null);
    setIsEditForumModalOpen(false);
    if (selectedForumId === forumId) {
      await refetchSelectedForum();
    }
  };

  // Handle remove user from forum (admin only)
  const handleRemoveUserFromForum = (forumId: number, userId: number) => {
    setPendingAction({ type: "removeUser", forumId, userId });
    setShowRemoveUserConfirm(true);
  };

  const handleConfirmRemoveUser = async () => {
    if (!pendingAction || pendingAction.type !== "removeUser" || !pendingAction.userId) return;
    const { forumId, userId } = pendingAction;
    const res = await forumsApi.removeMember(forumId, userId);
    if (!res.success) {
      window.alert(res.message || "Could not remove member");
      return;
    }
    if (selectedForumId === forumId && userId === currentUserId) {
      setSelectedForumId(null);
    } else {
      await refetchSelectedForum();
    }
    await refreshForumList();
    setShowRemoveUserConfirm(false);
    setPendingAction(null);
  };

  // Handle grant admin privileges (creator/admin only)
  const handleGrantAdmin = async (forumId: number, userId: number) => {
    const res = await forumsApi.patchMember(forumId, userId, { role: "admin" });
    if (!res.success) {
      window.alert(res.message || "Could not update member");
      return;
    }
    await refetchSelectedForum();
  };

  // Handle revoke admin privileges (creator only)
  const handleRevokeAdmin = (forumId: number, userId: number) => {
    // Cannot revoke creator's admin status
    const forum = forums.find((f) => f.id === forumId);
    if (forum && forum.creatorId === userId) {
      // Show a simple alert for this case (not a destructive action, just informational)
      alert("Cannot revoke admin privileges from the forum creator.");
      return;
    }

    setPendingAction({ type: "revokeAdmin", forumId, userId });
    setShowRevokeAdminConfirm(true);
  };

  const handleConfirmRevokeAdmin = async () => {
    if (!pendingAction || pendingAction.type !== "revokeAdmin" || !pendingAction.userId) return;
    const { forumId, userId } = pendingAction;
    const res = await forumsApi.patchMember(forumId, userId, { role: "member" });
    if (!res.success) {
      window.alert(res.message || "Could not update member");
      return;
    }
    await refetchSelectedForum();
    setShowRevokeAdminConfirm(false);
    setPendingAction(null);
  };

  const handleToggleMemberCanPost = async (forumId: number, userId: number, canPost: boolean) => {
    const res = await forumsApi.patchMember(forumId, userId, { canPost });
    if (!res.success) {
      window.alert(res.message || "Could not update member");
      return;
    }
    await refetchSelectedForum();
  };

  const handleToggleLockReplies = async () => {
    if (!selectedForumId || !selectedForum) return;
    const next = !selectedForum.repliesLocked;
    const res = await forumsApi.setSettings(selectedForumId, next);
    if (!res.success) {
      window.alert(res.message || "Could not update settings");
      return;
    }
    await refetchSelectedForum();
  };

  const handleCopyInviteLink = async () => {
    if (!selectedForum?.inviteToken) return;
    const url = `${window.location.origin}/forums?invite=${selectedForum.inviteToken}`;
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      window.prompt("Copy invite link", url);
    }
  };

  const handleRegenerateInvite = async () => {
    if (!selectedForumId) return;
    const res = await forumsApi.regenerateInvite(selectedForumId);
    if (!res.success || !res.data?.inviteToken) {
      window.alert(res.message || "Could not regenerate invite");
      return;
    }
    setForums((prev) =>
      prev.map((f) =>
        f.id === selectedForumId
          ? { ...f, inviteToken: res.data!.inviteToken }
          : f
      )
    );
  };

  const handleAddMemberById = async () => {
    if (!selectedForumId || !addMemberUserId.trim()) return;
    const uid = Number(addMemberUserId.trim());
    if (!Number.isFinite(uid) || uid <= 0) {
      window.alert("Enter a valid user ID");
      return;
    }
    const res = await forumsApi.addMemberById(selectedForumId, uid);
    if (!res.success) {
      window.alert(res.message || "Could not add member");
      return;
    }
    setAddMemberUserId("");
    await refetchSelectedForum();
    await refreshForumList();
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

  const [notifications, setNotifications] = useState<FeedPanelNotification[]>(
    []
  );

  const fetchNotifications = useCallback(async () => {
    if (!isAuthenticated()) return;
    try {
      const res = await feedApi.getNotifications();
      if (res.success && Array.isArray(res.data)) {
        setNotifications(
          res.data.map((n) =>
            mapApiRowToFeedPanelNotification(n as never)
          )
        );
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
          window.dispatchEvent(new CustomEvent(CHAT_UI_REFRESH_EVENT));
          setActiveChatConversationId(cid);
          setIsChatPanelOpen(true);
          setIsNotificationPanelOpen(false);
        } else {
          window.dispatchEvent(new CustomEvent(CHAT_UI_REFRESH_EVENT));
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
              className="newsfeed-header__icon-btn newsfeed-header__icon-btn--notifications"
              title="Messages"
              onClick={() => {
                setActiveChatConversationId(null);
                setIsChatPanelOpen(true);
              }}
            >
              <MessageCircle size={20} />
              {unreadMessagesCount > 0 && (
                <span className="newsfeed-header__badge">
                  {unreadMessagesCount > 9 ? "9+" : unreadMessagesCount}
                </span>
              )}
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
                <Avatar
                  name={getUserName()}
                  size={32}
                  className="newsfeed-header__join-avatar"
                />
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
          className={
            selectedForum ? "forums-main forums-main--thread" : "forums-main"
          }
        >
          {forumsLoadError && (
            <div
              style={{
                margin: "0 0 12px 0",
                padding: "10px 14px",
                borderRadius: "8px",
                backgroundColor: "rgba(211, 47, 47, 0.12)",
                color: "var(--text-primary)",
                fontSize: "14px",
              }}
              role="alert"
            >
              {forumsLoadError}
            </div>
          )}
          {selectedForum ? (
            /* Forum Chat View */
            <div
              style={{
                width: "100%",
                maxWidth: "100%",
                display: "flex",
                flexDirection: "column",
                minHeight: 0,
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
                        flexWrap: "wrap",
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
                      <span
                        style={{
                          padding: "4px 10px",
                          borderRadius: "12px",
                          fontSize: "11px",
                          fontWeight: "600",
                          textTransform: "uppercase",
                          backgroundColor:
                            selectedForum.visibility === "private"
                              ? "rgba(128, 128, 128, 0.25)"
                              : "rgba(46, 125, 50, 0.2)",
                          color: "var(--text-primary)",
                        }}
                      >
                        {selectedForum.visibility === "private" ? "Private" : "Public"}
                      </span>
                      {selectedForum.repliesLocked && (
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "4px",
                            fontSize: "12px",
                            color: "var(--text-secondary)",
                          }}
                          title="Only admins can post"
                        >
                          <Lock size={14} />
                          Replies locked
                        </span>
                      )}
                      {selectedForum.suspended && (
                        <span
                          style={{
                            padding: "2px 8px",
                            borderRadius: "8px",
                            fontSize: "11px",
                            fontWeight: 600,
                            background: "rgba(180, 50, 50, 0.2)",
                            color: "var(--text-primary)",
                          }}
                        >
                          Suspended
                        </span>
                      )}
                      <span>{selectedForum.memberCount} members</span>
                    </div>
                    <p
                      style={{
                        margin: "8px 0 0 0",
                        fontSize: "13px",
                        color: "var(--text-tertiary)",
                        lineHeight: 1.4,
                      }}
                    >
                      Created by {selectedForum.creatorName}
                      {selectedForum.adminsPreview?.length ? (
                        <>
                          {" "}
                          · Admins:{" "}
                          {selectedForum.adminsPreview.map((a) => a.displayName).join(", ")}
                        </>
                      ) : null}
                    </p>
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
                          type="button"
                          onClick={() => {
                            void handleToggleLockReplies();
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
                            color: "var(--text-primary)",
                            borderBottom: "1px solid var(--border-color)",
                          }}
                        >
                          <Lock size={16} />
                          <span>
                            {selectedForum.repliesLocked
                              ? "Unlock replies (everyone can post)"
                              : "Lock replies (admins only)"}
                          </span>
                        </button>
                        {selectedForum.visibility === "private" && selectedForum.inviteToken && (
                          <>
                            <button
                              type="button"
                              onClick={() => {
                                void handleCopyInviteLink();
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
                                color: "var(--text-primary)",
                                borderBottom: "1px solid var(--border-color)",
                              }}
                            >
                              <Copy size={16} />
                              <span>Copy invite link</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                void handleRegenerateInvite();
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
                                color: "var(--text-primary)",
                                borderBottom: "1px solid var(--border-color)",
                              }}
                            >
                              <Link2 size={16} />
                              <span>Regenerate invite link</span>
                            </button>
                          </>
                        )}
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

              {forumDetailError && (
                <div
                  style={{
                    padding: "10px 20px",
                    backgroundColor: "rgba(211, 47, 47, 0.1)",
                    fontSize: "14px",
                    color: "var(--text-primary)",
                  }}
                  role="alert"
                >
                  {forumDetailError}
                </div>
              )}

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

              {selectedForum.joinRequired && (
                <div
                  style={{
                    padding: "14px 20px",
                    backgroundColor: "var(--bg-secondary)",
                    borderBottom: "1px solid var(--border-color)",
                    display: "flex",
                    flexWrap: "wrap",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: "12px",
                  }}
                >
                  <p style={{ margin: 0, fontSize: "14px", color: "var(--text-secondary)" }}>
                    This is a preview. Join this public forum to read the full conversation and post
                    messages.
                  </p>
                  <button
                    type="button"
                    onClick={() => void handleJoinForum(selectedForum.id)}
                    style={{
                      padding: "10px 18px",
                      backgroundColor: "var(--color-primary)",
                      color: "white",
                      border: "none",
                      borderRadius: "8px",
                      fontSize: "14px",
                      fontWeight: "600",
                      cursor: "pointer",
                    }}
                  >
                    Join forum
                  </button>
                </div>
              )}

              {/* Forum Messages */}
              <div
                style={{
                  width: "100%",
                  maxWidth: "100%",
                  overflowX: "hidden",
                  overflowY: "visible",
                  padding: "12px 16px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "12px",
                  position: "relative",
                  backgroundColor: "var(--bg-secondary)",
                  borderTop: "1px solid var(--border-color)",
                  borderBottom: "1px solid var(--border-color)",
                  minHeight: "120px",
                }}
              >
                {selectedForum.backgroundColor ? (
                  <div
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      width: 4,
                      height: "100%",
                      backgroundColor: selectedForum.backgroundColor,
                      borderRadius: "0 2px 2px 0",
                      zIndex: 0,
                      opacity: 0.95,
                    }}
                  />
                ) : null}
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
                      opacity: Math.min(0.22, (selectedForum.backgroundOpacity ?? 0.35) * 0.45),
                      zIndex: 0,
                      pointerEvents: "none",
                    }}
                  />
                )}
                <div
                  className="forums-chat-thread-glass"
                  style={{
                    position: "relative",
                    zIndex: 1,
                    width: "100%",
                    borderRadius: "12px",
                    padding: "14px 12px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "12px",
                    minHeight: "100px",
                    /* Glassmorphic: ~transparent + blur; theme tweaks in _forums.scss */
                    backgroundColor: "rgba(255, 255, 255, 0.02)",
                    border: "1px solid rgba(255, 255, 255, 0.09)",
                    backdropFilter: "blur(20px) saturate(1.4)",
                    WebkitBackdropFilter: "blur(20px) saturate(1.4)",
                    boxShadow:
                      "0 8px 32px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.05)",
                  }}
                >
                {selectedForum.messages.length > 0 ? (
                  selectedForum.messages.map((message) => {
                    const isCurrentUser = message.senderId === currentUserId;
                    const senderLabel = forumMessageDisplayName(
                      message,
                      selectedForum.memberDetails,
                      currentUserId
                    );
                    const initials = senderLabel
                      .split(/\s+/)
                      .filter(Boolean)
                      .map((n) => n[0])
                      .join("")
                      .toUpperCase()
                      .slice(0, 2);
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
                          {initials || "?"}
                        </div>
                        <div
                          style={{
                            padding: "10px 14px",
                            borderRadius: "16px",
                            backgroundColor: isCurrentUser
                              ? "var(--color-primary)"
                              : "var(--card-bg)",
                            color: isCurrentUser ? "white" : "var(--text-primary)",
                            boxShadow:
                              "0 2px 8px rgba(0,0,0,0.12), 0 0 0 1px rgba(255,255,255,0.06)",
                            border: isCurrentUser
                              ? "1px solid rgba(255,255,255,0.12)"
                              : "1px solid var(--border-color)",
                          }}
                        >
                          <div
                            style={{
                              fontSize: "12px",
                              fontWeight: "600",
                              marginBottom: "4px",
                              color: isCurrentUser
                                ? "rgba(255,255,255,0.95)"
                                : "var(--text-secondary)",
                            }}
                          >
                            {senderLabel}
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
                className="forums-composer"
                style={{
                  opacity:
                    selectedForum.joinRequired || selectedForum.canPost === false
                      ? 0.55
                      : 1,
                  pointerEvents:
                    selectedForum.joinRequired || selectedForum.canPost === false
                      ? "none"
                      : "auto",
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
                  type="button"
                  className="forums-composer__attach"
                  onClick={() => forumImageInputRef.current?.click()}
                  title="Attach image"
                >
                  <Image size={20} />
                </button>
                <input
                  type="text"
                  className="forums-composer__input"
                  placeholder={
                    selectedForum.joinRequired
                      ? "Join the forum to post…"
                      : selectedForum.canPost === false
                        ? "Posting is disabled for you in this forum…"
                        : "Type a message..."
                  }
                  value={forumMessageInput}
                  onChange={(e) => setForumMessageInput(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      void handleSendForumMessage();
                    }
                  }}
                  disabled={
                    selectedForum.joinRequired || selectedForum.canPost === false
                  }
                />
                <div
                  ref={forumEmojiAnchorRef}
                  className="forums-composer__emoji-wrap"
                >
                  <button
                    type="button"
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
                    <EmojiPicker
                      isOpen={isForumEmojiPickerOpen}
                      onClose={() => setIsForumEmojiPickerOpen(false)}
                      onEmojiSelect={(emoji) => {
                        setForumMessageInput((prev) => prev + emoji);
                        setIsForumEmojiPickerOpen(false);
                      }}
                      position="top"
                      anchorRef={forumEmojiAnchorRef}
                      detachToBody
                    />
                  )}
                </div>
                <button
                  type="button"
                  className="forums-composer__send"
                  onClick={() => void handleSendForumMessage()}
                  disabled={
                    (!forumMessageInput.trim() && !forumMessageAttachment) ||
                    selectedForum.joinRequired ||
                    selectedForum.canPost === false
                  }
                  title="Send message"
                  aria-label="Send message"
                >
                  <Send size={20} className="forums-composer__send-icon" aria-hidden />
                </button>
              </div>

              {/* Members Management (Admin only) */}
              {isForumAdmin && selectedForum && !selectedForum.joinRequired && (
                <div
                  style={{
                    padding: "16px 20px",
                    borderTop: "1px solid var(--border-color)",
                    backgroundColor: "var(--bg-secondary)",
                  }}
                >
                  {selectedForum.visibility === "private" && selectedForum.inviteToken && (
                    <div
                      style={{
                        marginBottom: "16px",
                        padding: "12px",
                        borderRadius: "8px",
                        border: "1px dashed var(--border-color)",
                        fontSize: "13px",
                        color: "var(--text-secondary)",
                      }}
                    >
                      <strong style={{ color: "var(--text-primary)" }}>Invite link</strong>
                      <div
                        style={{
                          marginTop: "8px",
                          wordBreak: "break-all",
                          fontFamily: "monospace",
                          fontSize: "12px",
                        }}
                      >
                        {`${window.location.origin}/forums?invite=${selectedForum.inviteToken}`}
                      </div>
                      <div style={{ marginTop: "8px", display: "flex", gap: "8px", flexWrap: "wrap" }}>
                        <button
                          type="button"
                          onClick={() => void handleCopyInviteLink()}
                          style={{
                            padding: "6px 12px",
                            fontSize: "12px",
                            borderRadius: "6px",
                            border: "1px solid var(--border-color)",
                            background: "var(--card-bg)",
                            cursor: "pointer",
                          }}
                        >
                          <Copy size={14} style={{ verticalAlign: "middle", marginRight: "4px" }} />
                          Copy
                        </button>
                        <button
                          type="button"
                          onClick={() => void handleRegenerateInvite()}
                          style={{
                            padding: "6px 12px",
                            fontSize: "12px",
                            borderRadius: "6px",
                            border: "1px solid var(--border-color)",
                            background: "var(--card-bg)",
                            cursor: "pointer",
                          }}
                        >
                          New link
                        </button>
                      </div>
                    </div>
                  )}
                  <div
                    style={{
                      display: "flex",
                      flexWrap: "wrap",
                      gap: "8px",
                      marginBottom: "12px",
                      alignItems: "center",
                    }}
                  >
                    <input
                      type="text"
                      inputMode="numeric"
                      placeholder="Add member by user ID"
                      value={addMemberUserId}
                      onChange={(e) => setAddMemberUserId(e.target.value)}
                      style={{
                        flex: "1 1 180px",
                        padding: "8px 12px",
                        borderRadius: "8px",
                        border: "1px solid var(--border-color)",
                        fontSize: "14px",
                        backgroundColor: "var(--card-bg)",
                        color: "var(--text-primary)",
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => void handleAddMemberById()}
                      style={{
                        padding: "8px 14px",
                        borderRadius: "8px",
                        border: "none",
                        background: "var(--color-primary)",
                        color: "white",
                        fontSize: "14px",
                        cursor: "pointer",
                      }}
                    >
                      Add
                    </button>
                  </div>
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
                      const rowDetail = selectedForum.memberDetails?.find(
                        (d) => d.userId === memberId
                      );
                      const memberCanPost = rowDetail ? rowDetail.canPost : true;
                      const memberName =
                        memberId === currentUserId
                          ? getProfileUsername()
                          : rowDetail?.displayName?.trim() || `User ${memberId}`;

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
                                {!isMemberCreator && !memberCanPost && (
                                  <span
                                    style={{
                                      marginLeft: "8px",
                                      fontSize: "12px",
                                      color: "var(--text-tertiary)",
                                    }}
                                  >
                                    (Muted)
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                            {!isMemberCreator && isForumAdmin && (
                              <button
                                type="button"
                                onClick={() =>
                                  void handleToggleMemberCanPost(
                                    selectedForum.id,
                                    memberId,
                                    !memberCanPost
                                  )
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
                                title={
                                  memberCanPost
                                    ? "Stop this member from posting"
                                    : "Allow posting again"
                                }
                              >
                                {memberCanPost ? "Mute" : "Unmute"}
                              </button>
                            )}
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
                {isForumListLoading && (
                  <span style={{ marginLeft: "12px", fontSize: "14px", fontWeight: "400", color: "var(--text-tertiary)" }}>
                    Loading…
                  </span>
                )}
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
                          cursor: "pointer",
                        }}
                        onClick={() => setSelectedForumId(forum.id)}
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
                              <span
                                style={{
                                  padding: "2px 8px",
                                  borderRadius: "10px",
                                  fontSize: "11px",
                                  fontWeight: "600",
                                  textTransform: "uppercase",
                                  backgroundColor:
                                    forum.visibility === "private"
                                      ? "rgba(128, 128, 128, 0.2)"
                                      : "rgba(46, 125, 50, 0.15)",
                                }}
                              >
                                {forum.visibility === "private" ? "Private" : "Public"}
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
                              lineHeight: 1.5,
                            }}
                          >
                            {forum.suspended && (
                              <span
                                style={{
                                  display: "inline-block",
                                  marginRight: 8,
                                  padding: "2px 6px",
                                  borderRadius: 6,
                                  fontSize: 10,
                                  fontWeight: 600,
                                  background: "rgba(180, 50, 50, 0.2)",
                                }}
                              >
                                Suspended
                              </span>
                            )}
                            Created by {forum.creatorName}
                            {forum.adminsPreview?.length ? (
                              <>
                                <br />
                                Admins:{" "}
                                {forum.adminsPreview.map((a) => a.displayName).join(", ")}
                              </>
                            ) : null}
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

      <ChatPanel
        isOpen={isChatPanelOpen}
        onClose={() => {
          setIsChatPanelOpen(false);
          setActiveChatConversationId(null);
        }}
        onUnreadCountChange={setUnreadMessagesCount}
        activeConversationId={activeChatConversationId}
      />

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

      {/* Delete Forum Confirmation Modal */}
      <ConfirmationModal
        isOpen={showDeleteForumConfirm}
        onClose={() => {
          setShowDeleteForumConfirm(false);
          setPendingAction(null);
        }}
        onConfirm={handleConfirmDeleteForum}
        title="Delete Forum"
        message="Are you sure you want to delete this forum? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        type="delete"
      />

      {/* Remove User Confirmation Modal */}
      <ConfirmationModal
        isOpen={showRemoveUserConfirm}
        onClose={() => {
          setShowRemoveUserConfirm(false);
          setPendingAction(null);
        }}
        onConfirm={handleConfirmRemoveUser}
        title="Remove User"
        message="Are you sure you want to remove this user from the forum?"
        confirmText="Remove"
        cancelText="Cancel"
        type="warning"
      />

      {/* Revoke Admin Confirmation Modal */}
      <ConfirmationModal
        isOpen={showRevokeAdminConfirm}
        onClose={() => {
          setShowRevokeAdminConfirm(false);
          setPendingAction(null);
        }}
        onConfirm={handleConfirmRevokeAdmin}
        title="Revoke Admin Privileges"
        message="Are you sure you want to revoke admin privileges from this user?"
        confirmText="Revoke"
        cancelText="Cancel"
        type="warning"
      />
    </div>
  );
};

export default Forums;
