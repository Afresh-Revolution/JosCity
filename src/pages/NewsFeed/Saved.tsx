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
  Bookmark,
} from "lucide-react";
import primaryLogo from "../../image/primary-logo.png";
import "../../main.css";
import LazyImage from "../../components/LazyImage";
import Avatar from "../../components/Avatar";
import NewsFeedSidebar from "./NewsFeedSidebar";
import PostCard from "./PostCard";
import { getProfileUsername, getUserName } from "../../utils/userUtils";
import "../../scss/_saved.scss";

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
}

const Saved: React.FC = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [isLeftSidebarOpen, setIsLeftSidebarOpen] = useState(false);
  const [isRightSidebarOpen, setIsRightSidebarOpen] = useState(false);
  const [isCreateMenuOpen, setIsCreateMenuOpen] = useState(false);
  const [savedPosts, setSavedPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const createMenuRef = useRef<HTMLDivElement>(null);

  // Load saved posts from localStorage
  const loadSavedPosts = useCallback(() => {
    try {
      setIsLoading(true);
      // Get saved post IDs from localStorage
      const savedPostIds = JSON.parse(
        localStorage.getItem("savedPosts") || "[]"
      ) as number[];

      // Get all posts from localStorage (stored when posts are created/viewed)
      const allPosts = JSON.parse(
        localStorage.getItem("allPosts") || "[]"
      ) as Post[];

      // Filter posts that are saved
      const saved = allPosts.filter((post) => savedPostIds.includes(post.id));

      // If no posts in localStorage, use mock data for demonstration
      if (saved.length === 0 && allPosts.length === 0) {
        // Try to get from NewsFeed's mock data structure
        const mockPosts: Post[] = [
          {
            id: 1,
            userName: "Blessing Matthias",
            userAvatar: "/placeholder-avatar.png",
            action: "updated the profile picture",
            timeAgo: "6 days ago",
            image: "",
            likes: 5,
            comments: 0,
            views: 84,
            reviews: 0,
            caption:
              "Just updated my profile picture! Feeling great and ready for new opportunities.",
          },
          {
            id: 2,
            userName: "Joseph Azumara",
            userAvatar: "/placeholder-avatar.png",
            action: "updated the profile picture",
            timeAgo: "5 days ago",
            image: "",
            likes: 3,
            comments: 0,
            views: 60,
            reviews: 0,
            caption:
              "New profile picture! Excited about the journey ahead. This has been an incredible year of growth.",
          },
        ];

        // Filter mock posts by saved IDs
        const savedMockPosts = mockPosts.filter((post) =>
          savedPostIds.includes(post.id)
        );
        setSavedPosts(savedMockPosts);
      } else {
        setSavedPosts(saved);
      }
    } catch (error) {
      console.error("Error loading saved posts:", error);
      setSavedPosts([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Listen for storage changes to update saved posts
  useEffect(() => {
    loadSavedPosts();

    // Listen for custom event when posts are saved/unsaved
    const handleStorageChange = () => {
      loadSavedPosts();
    };

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("savedPostsUpdated", handleStorageChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("savedPostsUpdated", handleStorageChange);
    };
  }, [loadSavedPosts]);

  // Filter posts based on search query
  const filteredPosts = savedPosts.filter((post) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      post.caption?.toLowerCase().includes(query) ||
      post.userName.toLowerCase().includes(query) ||
      post.hashtags?.toLowerCase().includes(query) ||
      post.action?.toLowerCase().includes(query)
    );
  });

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
              <div className="newsfeed-header__join-initials">
                <Avatar
                  name={getUserName()}
                  size={32}
                  className="newsfeed-header__join-avatar"
                />
              </div>
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
          {/* Header Section */}
          <div className="newsfeed-search-section">
            <div className="newsfeed-search-section__input-wrapper">
              <input
                type="text"
                className="newsfeed-search-section__input"
                placeholder="Search saved posts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <Search className="newsfeed-search-section__icon" size={20} />
            </div>
          </div>

          {/* Saved Posts Header */}
          <div className="newsfeed-posts">
            <div className="newsfeed-post">
              <div className="newsfeed-post__header">
                <div className="newsfeed-post__user-info">
                  <div className="newsfeed-post__avatar">
                    <Bookmark size={24} fill="currentColor" />
                  </div>
                  <div className="newsfeed-post__user-details">
                    <h3 className="newsfeed-post__user-name">Saved Posts</h3>
                    <p className="newsfeed-post__action">
                      {savedPosts.length}{" "}
                      {savedPosts.length === 1 ? "post" : "posts"} saved
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Loading State */}
            {isLoading && (
              <div className="newsfeed-post">
                <div className="newsfeed-post__caption">
                  <p>Loading saved posts...</p>
                </div>
              </div>
            )}

            {/* Empty State */}
            {!isLoading && filteredPosts.length === 0 && (
              <div className="newsfeed-post">
                <div className="newsfeed-post__caption">
                  <p>
                    {searchQuery
                      ? "No saved posts match your search."
                      : savedPosts.length === 0
                      ? "You haven't saved any posts yet. Click the bookmark icon on any post to save it."
                      : "No saved posts match your search."}
                  </p>
                </div>
              </div>
            )}

            {/* Saved Posts List */}
            {!isLoading &&
              filteredPosts.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Saved;
