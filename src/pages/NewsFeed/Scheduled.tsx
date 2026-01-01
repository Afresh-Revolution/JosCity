import React, { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  SquarePlus,
  MessageCircle,
  Bell,
  Search,
  Menu,
  X,
  FileText,
  Clock,
  Users,
  Plus,
} from "lucide-react";
import primaryLogo from "../../image/primary-logo.png";
import LazyImage from "../../components/LazyImage";
import NewsFeedSidebar from "./NewsFeedSidebar";
import PostCard from "./PostCard";
import CreateScheduledPostModal from "./CreateScheduledPostModal";
import {
  getUserInitials,
  getProfileUsername,
  getUserName,
  getUserAvatar,
} from "../../utils/userUtils";
import "../../scss/_scheduled.scss";

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
  scheduledDate?: string;
  scheduledTime?: string;
  scheduledDateTime?: string; // ISO string for comparison
}

const Scheduled: React.FC = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [isLeftSidebarOpen, setIsLeftSidebarOpen] = useState(false);
  const [isRightSidebarOpen, setIsRightSidebarOpen] = useState(false);
  const [isCreateMenuOpen, setIsCreateMenuOpen] = useState(false);
  const [isCreateScheduledModalOpen, setIsCreateScheduledModalOpen] =
    useState(false);
  const [scheduledPosts, setScheduledPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const createMenuRef = useRef<HTMLDivElement>(null);

  // Load scheduled posts from localStorage
  const loadScheduledPosts = useCallback(() => {
    try {
      setIsLoading(true);
      const scheduledPostsData = JSON.parse(
        localStorage.getItem("scheduledPosts") || "[]"
      ) as Post[];

      // Filter out posts that have already been published (past scheduled time)
      const now = new Date();
      const activeScheduledPosts = scheduledPostsData.filter((post) => {
        if (!post.scheduledDateTime) return true;
        const scheduledDate = new Date(post.scheduledDateTime);
        return scheduledDate > now;
      });

      // Sort by scheduled date/time (earliest first)
      activeScheduledPosts.sort((a, b) => {
        const dateA = a.scheduledDateTime
          ? new Date(a.scheduledDateTime).getTime()
          : 0;
        const dateB = b.scheduledDateTime
          ? new Date(b.scheduledDateTime).getTime()
          : 0;
        return dateA - dateB;
      });

      setScheduledPosts(activeScheduledPosts);
    } catch (error) {
      console.error("Error loading scheduled posts:", error);
      setScheduledPosts([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Listen for storage changes to update scheduled posts
  useEffect(() => {
    loadScheduledPosts();

    // Listen for custom event when posts are scheduled
    const handleStorageChange = () => {
      loadScheduledPosts();
    };

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("scheduledPostsUpdated", handleStorageChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("scheduledPostsUpdated", handleStorageChange);
    };
  }, [loadScheduledPosts]);

  // Close create menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        createMenuRef.current &&
        !createMenuRef.current.contains(event.target as Node)
      ) {
        setIsCreateMenuOpen(false);
      }
    };

    if (isCreateMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isCreateMenuOpen]);

  const handleCreateClick = () => {
    setIsCreateMenuOpen(!isCreateMenuOpen);
  };

  const handleProfileClick = () => {
    const username = getProfileUsername();
    if (username) {
      navigate(`/profile/${username}`);
    }
  };

  const handleSchedulePost = (
    caption: string,
    images: string[] | null,
    videos: string[] | null,
    scheduledDate: string,
    scheduledTime: string
  ) => {
    try {
      // Create scheduled post object
      const scheduledDateTime = new Date(`${scheduledDate}T${scheduledTime}`);
      const now = new Date();

      // Calculate time ago for display
      const timeDiff = scheduledDateTime.getTime() - now.getTime();
      const daysDiff = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
      const hoursDiff = Math.floor(
        (timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
      );

      let timeAgo = "";
      if (daysDiff > 0) {
        timeAgo = `Scheduled for ${daysDiff} ${
          daysDiff === 1 ? "day" : "days"
        } from now`;
      } else if (hoursDiff > 0) {
        timeAgo = `Scheduled for ${hoursDiff} ${
          hoursDiff === 1 ? "hour" : "hours"
        } from now`;
      } else {
        timeAgo = "Scheduled for soon";
      }

      // Get user avatar or use null (PostCard will show initials if null)
      const userAvatar = getUserAvatar();

      const newPost: Post = {
        id: Date.now(),
        userName: getUserName(),
        userAvatar: userAvatar || "", // Empty string will trigger initials display in PostCard
        action: "scheduled a post",
        timeAgo: timeAgo,
        caption: caption,
        images: images || undefined,
        image: images && images.length > 0 ? images[0] : undefined,
        videos: videos || undefined,
        video: videos && videos.length > 0 ? videos[0] : undefined,
        likes: 0,
        comments: 0,
        views: 0,
        reviews: 0,
        scheduledDate: scheduledDate,
        scheduledTime: scheduledTime,
        scheduledDateTime: scheduledDateTime.toISOString(),
      };

      // Get existing scheduled posts
      const existingPosts = JSON.parse(
        localStorage.getItem("scheduledPosts") || "[]"
      ) as Post[];

      // Add new post
      existingPosts.push(newPost);

      // Save to localStorage
      localStorage.setItem("scheduledPosts", JSON.stringify(existingPosts));

      // Dispatch custom event
      window.dispatchEvent(new Event("scheduledPostsUpdated"));

      // Reload scheduled posts
      loadScheduledPosts();
    } catch (error) {
      console.error("Error scheduling post:", error);
      alert("Failed to schedule post. Please try again.");
    }
  };

  // Filter posts based on search query
  const filteredPosts = scheduledPosts.filter((post) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      post.caption?.toLowerCase().includes(query) ||
      post.userName.toLowerCase().includes(query) ||
      post.hashtags?.toLowerCase().includes(query) ||
      post.action?.toLowerCase().includes(query)
    );
  });

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
              >
                <SquarePlus size={20} />
              </button>
              {isCreateMenuOpen && (
                <div className="newsfeed-header__create-dropdown">
                  <button
                    className="newsfeed-header__create-item"
                    onClick={() => setIsCreateMenuOpen(false)}
                  >
                    <FileText size={18} />
                    <span>Create Post</span>
                  </button>
                  <button
                    className="newsfeed-header__create-item"
                    onClick={() => setIsCreateMenuOpen(false)}
                  >
                    <Clock size={18} />
                    <span>Create Story</span>
                  </button>
                  <button
                    className="newsfeed-header__create-item"
                    onClick={() => setIsCreateMenuOpen(false)}
                  >
                    <Users size={18} />
                    <span>Create Group</span>
                  </button>
                </div>
              )}
            </div>
            <button
              className="newsfeed-header__icon-btn"
              title="Messages"
              onClick={() => {}}
            >
              <MessageCircle size={20} />
            </button>
            <button
              className="newsfeed-header__icon-btn newsfeed-header__icon-btn--notifications"
              title="Notifications"
              onClick={() => {}}
            >
              <Bell size={20} />
            </button>
            <button
              className="newsfeed-header__join-btn"
              onClick={handleProfileClick}
            >
              <span className="newsfeed-header__join-initials">
                {getUserInitials()}
              </span>
              <span className="newsfeed-header__join-text">Profile</span>
            </button>
          </div>
        </div>
      </header>

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
      <div className="newsfeed-container newsfeed-container--no-aside">
        {/* Left Sidebar */}
        <NewsFeedSidebar
          isOpen={isLeftSidebarOpen}
          onClose={() => setIsLeftSidebarOpen(false)}
        />

        <main className="newsfeed-main">
          <div className="newsfeed-search-section">
            <div className="newsfeed-search-section__input-wrapper">
              <input
                type="text"
                className="newsfeed-search-section__input"
                placeholder="Search scheduled posts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <Search className="newsfeed-search-section__icon" size={20} />
            </div>
          </div>

          {/* Create Scheduled Post Button */}
          <div className="newsfeed-posts">
            <button
              className="scheduled-create-btn"
              onClick={() => setIsCreateScheduledModalOpen(true)}
            >
              <Plus size={20} />
              <span>Schedule New Post</span>
            </button>

            {/* Header Post */}
            <div className="newsfeed-post">
              <div className="newsfeed-post__header">
                <div className="newsfeed-post__user-info">
                  <div className="newsfeed-post__avatar">
                    <Clock size={24} fill="currentColor" />
                  </div>
                  <div className="newsfeed-post__user-details">
                    <h3 className="newsfeed-post__user-name">
                      Scheduled Posts
                    </h3>
                    <p className="newsfeed-post__action">
                      {scheduledPosts.length}{" "}
                      {scheduledPosts.length === 1 ? "post" : "posts"} scheduled
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Loading State */}
            {isLoading && (
              <div className="newsfeed-post">
                <div className="newsfeed-post__caption">
                  <p>Loading scheduled posts...</p>
                </div>
              </div>
            )}

            {/* Empty State */}
            {!isLoading && filteredPosts.length === 0 && (
              <div className="newsfeed-post">
                <div className="newsfeed-post__caption">
                  <p>
                    {searchQuery
                      ? "No scheduled posts match your search."
                      : scheduledPosts.length === 0
                      ? "You haven't scheduled any posts yet. Click 'Schedule New Post' to create your first scheduled post."
                      : "No scheduled posts match your search."}
                  </p>
                </div>
              </div>
            )}

            {/* Scheduled Posts List */}
            {!isLoading &&
              filteredPosts.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
          </div>

          {/* Create Scheduled Post Modal */}
          <CreateScheduledPostModal
            isOpen={isCreateScheduledModalOpen}
            onClose={() => setIsCreateScheduledModalOpen(false)}
            userName={getUserName()}
            userAvatar={getUserAvatar() || undefined}
            onSchedule={handleSchedulePost}
          />
        </main>
      </div>
    </div>
  );
};

export default Scheduled;
