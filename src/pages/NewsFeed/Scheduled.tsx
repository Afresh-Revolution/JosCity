import React, { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  X,
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
} from "lucide-react";
import PostCard from "./PostCard";
import NewsFeedHeader from "./NewsFeedHeader";
import CreateScheduledPostModal from "./CreateScheduledPostModal";
import type { CreatePostListingPayload } from "./CreatePostModal";
import {
  getProfileUsername,
  getUserName,
  getUserAvatar,
  getUserData,
} from "../../utils/userUtils";
import { feedApi, type ScheduledPostApiRow } from "../../services/feedApi";
import "../../main.css";
import "../../scss/_scheduled.scss";
import "../../scss/_people.scss";
import "../../scss/_newsfeed.scss";
import "../../scss/_emojipicker.scss";
import "../../scss/_profilemodal.scss";
import "../../scss/_messagepopup.scss";
import { useNewsFeedNavPanels } from "../../hooks/useNewsFeedNavPanels";

function formatScheduledTimeAgo(iso: string): string {
  const scheduledDate = new Date(iso);
  const now = new Date();
  const diff = scheduledDate.getTime() - now.getTime();
  if (diff <= 0) return "Publishing soon";
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor(
    (diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
  );
  const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  if (days > 0) {
    return `In ${days} day${days === 1 ? "" : "s"} · ${scheduledDate.toLocaleString(
      undefined,
      { dateStyle: "medium", timeStyle: "short" }
    )}`;
  }
  if (hours > 0) return `In ${hours} hour${hours === 1 ? "" : "s"}`;
  if (mins > 0) return `In ${mins} minute${mins === 1 ? "" : "s"}`;
  return "Soon";
}

function mapScheduledRowToPost(
  row: ScheduledPostApiRow,
  displayName: string,
  avatar: string,
  userId: number | null
): Post {
  const urls = row.media_urls || [];
  const types = row.media_types || [];
  const images: string[] = [];
  const videos: string[] = [];
  urls.forEach((url, i) => {
    if (!url) return;
    if (types[i] === "video") videos.push(url);
    else images.push(url);
  });
  return {
    id: row.id,
    userId: userId ?? undefined,
    userName: displayName,
    userAvatar: avatar,
    action: "scheduled a post",
    timeAgo: formatScheduledTimeAgo(row.scheduled_at),
    caption: row.text || undefined,
    images: images.length ? images : undefined,
    image: images[0],
    videos: videos.length ? videos : undefined,
    video: videos[0],
    likes: 0,
    comments: 0,
    views: 0,
    reviews: 0,
    scheduledDateTime: row.scheduled_at,
  };
}

// Post interface matching the PostCard component
interface Post {
  id: number;
  userId?: number;
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
  const [isCreateScheduledModalOpen, setIsCreateScheduledModalOpen] =
    useState(false);
  const [scheduledPosts, setScheduledPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const mainContentRef = useRef<HTMLElement>(null);

  const loadScheduledPosts = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const res = await feedApi.listScheduledPosts("pending");
      const rows = Array.isArray(res.data) ? res.data : [];
      const user = getUserData();
      const userId =
        (user?.user_id as number) ??
        (user as { id?: number } | null)?.id ??
        null;
      const displayName = getUserName();
      const avatar = getUserAvatar() || "";

      const mapped = rows.map((row) =>
        mapScheduledRowToPost(row, displayName, avatar, userId)
      );
      mapped.sort((a, b) => {
        const ta = a.scheduledDateTime
          ? new Date(a.scheduledDateTime).getTime()
          : 0;
        const tb = b.scheduledDateTime
          ? new Date(b.scheduledDateTime).getTime()
          : 0;
        return ta - tb;
      });
      setScheduledPosts(mapped);
    } catch (error) {
      console.error("Error loading scheduled posts:", error);
      setLoadError(
        error instanceof Error
          ? error.message
          : "Could not load scheduled posts."
      );
      setScheduledPosts([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const { panels, headerNavProps } = useNewsFeedNavPanels({
    mainContentRef,
    refetchMainFeedAfterPost: false,
    afterPostCreated: () => void loadScheduledPosts(),
  });

  useEffect(() => {
    void loadScheduledPosts();
    const id = window.setInterval(() => void loadScheduledPosts(), 60_000);
    return () => clearInterval(id);
  }, [loadScheduledPosts]);

  const handleProfileClick = () => {
    const username = getProfileUsername();
    if (username) {
      navigate(`/profile/${username}`);
    }
  };

  const handleSchedulePost = async (
    caption: string,
    images: File[] | null,
    videos: File[] | null,
    scheduledDate: string,
    scheduledTime: string,
    listingDetails?: CreatePostListingPayload | null
  ) => {
    try {
      const scheduledAt = new Date(
        `${scheduledDate}T${scheduledTime}`
      ).toISOString();
      await feedApi.createScheduledPost({
        caption,
        images: images ?? [],
        videos: videos ?? [],
        scheduledAt,
        listingDetails: listingDetails ?? undefined,
      });
      await loadScheduledPosts();
    } catch (error) {
      console.error("Error scheduling post:", error);
      alert(
        error instanceof Error
          ? error.message
          : "Failed to schedule post. Please try again."
      );
      throw error;
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
      <NewsFeedHeader
        isLeftSidebarOpen={isLeftSidebarOpen}
        onToggleLeftSidebar={() => setIsLeftSidebarOpen(!isLeftSidebarOpen)}
        onProfileClick={handleProfileClick}
        showRightSidebarToggle={false}
        {...headerNavProps}
      />

      <div className="newsfeed-container newsfeed-container--scheduled-no-aside">
        {/* Mobile Overlay */}
        {isLeftSidebarOpen && (
          <div
            className="newsfeed-overlay"
            onClick={() => {
              setIsLeftSidebarOpen(false);
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
          <div className="scheduled-page-toolbar">
            <div className="scheduled-page-title">
              <h2>Scheduled Posts</h2>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <main className="people-main" ref={mainContentRef}>
          {/* Scheduled Posts Section */}
          <div className="people-section">
            {loadError && (
              <div
                className="people-section__empty"
                style={{ marginBottom: 16 }}
              >
                <p className="people-section__empty-text">{loadError}</p>
                <button
                  type="button"
                  className="scheduled-create-btn"
                  onClick={() => void loadScheduledPosts()}
                >
                  Try again
                </button>
              </div>
            )}

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
                <h3 className="people-section__empty-title">No scheduled posts</h3>
                <p className="people-section__empty-text">
                  Schedule a post with a date and time — it will publish
                  automatically.
                </p>
                <button
                  type="button"
                  className="scheduled-create-btn"
                  onClick={() => setIsCreateScheduledModalOpen(true)}
                  style={{ marginTop: 16 }}
                >
                  <Clock size={18} />
                  <span>Schedule a post</span>
                </button>
              </div>
            )}

            {/* Scheduled Posts List */}
            {!isLoading && filteredPosts.length > 0 && (
              <div className="scheduled-posts-list">
                {filteredPosts.map((post) => (
                  <div key={post.id} className="scheduled-post-card">
                    <PostCard
                      post={post}
                      variant="scheduled"
                      onPostDeleted={() => void loadScheduledPosts()}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>

        {/* Create Scheduled Post Modal */}
        <CreateScheduledPostModal
          isOpen={isCreateScheduledModalOpen}
          onClose={() => setIsCreateScheduledModalOpen(false)}
          userName={getUserName()}
          userAvatar={getUserAvatar() || undefined}
          onSchedule={handleSchedulePost}
        />
      </div>

      {panels}
    </div>
  );
};

export default Scheduled;
