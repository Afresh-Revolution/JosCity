import React, { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  SquarePlus,
  UserPlus,
  MessageCircle,
  Bell,
  Search,
  Menu,
  X,
  FileText,
  Clock,
  Users,
  Calendar,
  Bookmark,
  Briefcase,
  Calendar as Events,
  Film,
  Newspaper,
  MessageSquare,
  Store,
  Tag,
  Briefcase as Jobs,
  Video,
  TrendingUp,
} from "lucide-react";
import primaryLogo from "../../image/primary-logo.png";
import LazyImage from "../../components/LazyImage";
import PostCard from "./PostCard";
import CreateScheduledPostModal from "./CreateScheduledPostModal";
import TrendingSection from "./TrendingSection";
import {
  getUserInitials,
  getProfileUsername,
  getUserName,
  getUserAvatar,
} from "../../utils/userUtils";
import "../../scss/_scheduled.scss";
import "../../scss/_people.scss";

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

  // Mock trending hashtags for scheduled posts
  const trending = [
    { hashtag: "#AfrESH", posts: 1 },
    { hashtag: "#C", posts: 1 },
  ];

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
    <div className="people-page">
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
              title="Add Friend"
              onClick={() => {}}
            >
              <UserPlus size={20} />
            </button>
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
              className="newsfeed-header__icon-btn newsfeed-header__icon-btn--sidebar"
              onClick={() => setIsRightSidebarOpen(!isRightSidebarOpen)}
              title="Trending & Friends"
              aria-label="Toggle sidebar"
            >
              <TrendingUp size={20} />
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
        <aside
          className={`people-sidebar ${
            isLeftSidebarOpen ? "people-sidebar--open" : ""
          }`}
        >
          <div className="people-sidebar__header">
            <h3 className="people-sidebar__title">Menu</h3>
            {isLeftSidebarOpen && (
              <button
                className="people-sidebar__close"
                onClick={() => setIsLeftSidebarOpen(false)}
                aria-label="Close menu"
              >
                <X size={20} />
              </button>
            )}
          </div>

          <nav className="people-sidebar__nav">
            <div className="people-sidebar__section">
              <a
                href="/newsfeed"
                className="people-sidebar__item"
                onClick={(e) => {
                  e.preventDefault();
                  navigate("/newsfeed");
                  setIsLeftSidebarOpen(false);
                }}
              >
                <Newspaper size={20} />
                <span>News Feed</span>
              </a>
              <a
                href="/scheduled"
                className="people-sidebar__item people-sidebar__item--active"
                onClick={(e) => {
                  e.preventDefault();
                  navigate("/scheduled");
                  setIsLeftSidebarOpen(false);
                }}
              >
                <Calendar size={20} />
                <span>Scheduled</span>
              </a>
              <a
                href="/saved"
                className="people-sidebar__item"
                onClick={(e) => {
                  e.preventDefault();
                  navigate("/saved");
                  setIsLeftSidebarOpen(false);
                }}
              >
                <Bookmark size={20} />
                <span>Saved</span>
              </a>
            </div>

            <div className="people-sidebar__section">
              <h3 className="people-sidebar__section-title">EXPLORE</h3>
              <a
                href="/business"
                className="people-sidebar__item"
                onClick={(e) => {
                  e.preventDefault();
                  navigate("/business");
                  setIsLeftSidebarOpen(false);
                }}
              >
                <Briefcase size={20} />
                <span>Business</span>
              </a>
              <a
                href="/people"
                className="people-sidebar__item"
                onClick={(e) => {
                  e.preventDefault();
                  navigate("/people");
                  setIsLeftSidebarOpen(false);
                }}
              >
                <Users size={20} />
                <span>People</span>
              </a>
              <a
                href="/events"
                className="people-sidebar__item"
                onClick={(e) => {
                  e.preventDefault();
                  navigate("/events");
                  setIsLeftSidebarOpen(false);
                }}
              >
                <Events size={20} />
                <span>Events</span>
              </a>
              <a
                href="/reels"
                className="people-sidebar__item"
                onClick={(e) => {
                  e.preventDefault();
                  navigate("/reels");
                  setIsLeftSidebarOpen(false);
                }}
              >
                <Video size={20} />
                <span>Reels</span>
              </a>
              <a
                href="/news"
                className="people-sidebar__item"
                onClick={(e) => {
                  e.preventDefault();
                  navigate("/news");
                  setIsLeftSidebarOpen(false);
                }}
              >
                <Newspaper size={20} />
                <span>News</span>
              </a>
              <a
                href="/forums"
                className="people-sidebar__item"
                onClick={(e) => {
                  e.preventDefault();
                  navigate("/forums");
                  setIsLeftSidebarOpen(false);
                }}
              >
                <MessageSquare size={20} />
                <span>Forums</span>
              </a>
              <a
                href="/marketplace"
                className="people-sidebar__item"
                onClick={(e) => {
                  e.preventDefault();
                  navigate("/marketplace");
                  setIsLeftSidebarOpen(false);
                }}
              >
                <Store size={20} />
                <span>Marketplace</span>
              </a>
              <a
                href="/offers"
                className="people-sidebar__item"
                onClick={(e) => {
                  e.preventDefault();
                  navigate("/offers");
                  setIsLeftSidebarOpen(false);
                }}
              >
                <Tag size={20} />
                <span>Offers</span>
              </a>
              <a
                href="/jobs"
                className="people-sidebar__item"
                onClick={(e) => {
                  e.preventDefault();
                  navigate("/jobs");
                  setIsLeftSidebarOpen(false);
                }}
              >
                <Jobs size={20} />
                <span>Jobs</span>
              </a>
              <a
                href="/movies"
                className="people-sidebar__item"
                onClick={(e) => {
                  e.preventDefault();
                  navigate("/movies");
                  setIsLeftSidebarOpen(false);
                }}
              >
                <Film size={20} />
                <span>Movies</span>
              </a>
            </div>
          </nav>
        </aside>

        {/* Search Bar - Full Width */}
        <div className="people-search-section">
          <div className="people-search-section__input-wrapper">
            <input
              type="text"
              placeholder="Search"
              className="people-search-section__input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <Search size={20} className="people-search-section__icon" />
          </div>
          {/* Page Title */}
          <div className="scheduled-page-title">
            <h2>Scheduled Posts</h2>
          </div>
        </div>

        {/* Main Content Area */}
        <main className="people-main">
          {/* Scheduled Posts Section */}
          <div className="people-section">

            {/* Loading State */}
            {isLoading && (
              <div className="people-section__empty">
                <p className="people-section__empty-text">
                  Loading scheduled posts...
                </p>
              </div>
            )}

            {/* Empty State */}
            {!isLoading && filteredPosts.length === 0 && (
              <div className="people-section__empty">
                <div className="people-section__empty-illustration">
                  <svg
                    width="120"
                    height="120"
                    viewBox="0 0 120 120"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <rect
                      x="20"
                      y="30"
                      width="80"
                      height="60"
                      rx="4"
                      fill="#E0E0E0"
                    />
                    <rect
                      x="30"
                      y="40"
                      width="60"
                      height="8"
                      rx="2"
                      fill="#BDBDBD"
                    />
                    <rect
                      x="30"
                      y="55"
                      width="40"
                      height="8"
                      rx="2"
                      fill="#BDBDBD"
                    />
                    <rect
                      x="20"
                      y="50"
                      width="80"
                      height="60"
                      rx="4"
                      fill="#E8E8E8"
                    />
                    <rect
                      x="30"
                      y="60"
                      width="60"
                      height="8"
                      rx="2"
                      fill="#D0D0D0"
                    />
                    <rect
                      x="30"
                      y="75"
                      width="40"
                      height="8"
                      rx="2"
                      fill="#D0D0D0"
                    />
                    <rect
                      x="20"
                      y="70"
                      width="80"
                      height="60"
                      rx="4"
                      fill="#F0F0F0"
                    />
                    <rect
                      x="30"
                      y="80"
                      width="60"
                      height="8"
                      rx="2"
                      fill="#E0E0E0"
                    />
                    <rect
                      x="30"
                      y="95"
                      width="40"
                      height="8"
                      rx="2"
                      fill="#E0E0E0"
                    />
                    <circle cx="90" cy="40" r="12" fill="#BDBDBD" />
                    <path
                      d="M85 40L88 43L95 36"
                      stroke="white"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
                <h3 className="people-section__empty-title">No Data Found</h3>
                <p className="people-section__empty-text">
                  There is no data to show you right now
                </p>
              </div>
            )}

            {/* Scheduled Posts List */}
            {!isLoading && filteredPosts.length > 0 && (
              <div className="scheduled-posts-list">
                {filteredPosts.map((post) => (
                  <div key={post.id} className="scheduled-post-card">
                    <PostCard post={post} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>

        {/* Right Sidebar - Trending */}
        <aside
          className={`newsfeed-aside ${
            isRightSidebarOpen ? "newsfeed-aside--open" : ""
          }`}
        >
          <div className="newsfeed-aside__header">
            <h3>Trending</h3>
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
              setSearchQuery(hashtag);
            }}
          />

          {/* Footer inside Aside */}
          <footer className="newsfeed-footer">
            <p>© 2025 JOSCity</p>
            <div className="newsfeed-footer__links">
              <a
                href="/about"
                onClick={(e) => {
                  e.preventDefault();
                  navigate("/about");
                }}
              >
                About
              </a>
              <a
                href="/terms-of-service"
                onClick={(e) => {
                  e.preventDefault();
                  navigate("/terms-of-service");
                }}
              >
                Terms
              </a>
              <a
                href="/privacy-policy"
                onClick={(e) => {
                  e.preventDefault();
                  navigate("/privacy-policy");
                }}
              >
                Privacy
              </a>
              <a
                href="/contact"
                onClick={(e) => {
                  e.preventDefault();
                  navigate("/contact");
                }}
              >
                Contact Us
              </a>
              <a
                href="/directory"
                onClick={(e) => {
                  e.preventDefault();
                  navigate("/directory");
                }}
              >
                Directory
              </a>
            </div>
          </footer>
        </aside>

        {/* Create Scheduled Post Modal */}
        <CreateScheduledPostModal
          isOpen={isCreateScheduledModalOpen}
          onClose={() => setIsCreateScheduledModalOpen(false)}
          userName={getUserName()}
          userAvatar={getUserAvatar() || undefined}
          onSchedule={handleSchedulePost}
        />
      </div>
    </div>
  );
};

export default Scheduled;
