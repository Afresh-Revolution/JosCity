import React, { useState, useRef, useEffect } from "react";
import { Plus, Type, Image, Video, X } from "lucide-react";
import LazyImage from "../../components/LazyImage";
import CreateStoryModal from "./CreateStoryModal";
import StoryViewer from "./StoryViewer";
import { getUserName, isAuthenticated, getUserInitials } from "../../utils/userUtils";
import { useNavigate } from "react-router-dom";
import { feedApi } from "../../services/feedApi";

interface Story {
  id: number;
  userName: string;
  avatar: string;
  hasNewStory?: boolean;
  type?: "text" | "photo" | "video";
  content?: string;
  caption?: string;
  createdAt?: number;
  expiresAt?: number;
  views?: Array<{ userId: number; userName: string; viewedAt: number }>;
  reactions?: Array<{ userId: number; userName: string; reactedAt: number }>;
  isOwner?: boolean;
}

interface StoriesSectionProps {
  userName?: string;
  userAvatar?: string;
  onStory?: (type: "text" | "photo" | "video", content: string, caption?: string) => void;
  forceOpenStoryModal?: boolean;
  onStoryModalClose?: () => void;
}

const StoriesSection: React.FC<StoriesSectionProps> = ({ 
  userName = "You",
  userAvatar,
  onStory,
  forceOpenStoryModal = false,
  onStoryModalClose
}) => {
  const navigate = useNavigate();
  const [stories, setStories] = useState<Story[]>([]);
  const [isStoryTypePanelOpen, setIsStoryTypePanelOpen] = useState(false);
  const [isStoryModalOpen, setIsStoryModalOpen] = useState(false);
  const [selectedStoryType, setSelectedStoryType] = useState<"text" | "photo" | "video">("text");
  const [viewingStory, setViewingStory] = useState<Story | null>(null);
  const [showViewerAfterPost, setShowViewerAfterPost] = useState(false);
  const [newlyPostedStory, setNewlyPostedStory] = useState<Story | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const currentUser = getUserName();

  // Fetch stories from API only if user is authenticated
  useEffect(() => {
    if (!isAuthenticated()) {
      // Clear stories if user is not authenticated
      setStories([]);
      return;
    }

    const fetchStories = async () => {
      try {
        const response = await feedApi.getStories();
        if (response.success && response.data && Array.isArray(response.data)) {
          // Backend returns stories grouped by user
          // Structure: [{ user: { id, name, picture, verified }, stories: [{ id, type, src, ... }], has_unseen: boolean }]
          // We need to flatten this structure and map field names
          const currentUserId = JSON.parse(localStorage.getItem("user") || "{}")?.user_id || null;
          
          const transformedStories: Story[] = [];
          response.data.forEach((userStoryGroup: any) => {
            if (userStoryGroup.stories && Array.isArray(userStoryGroup.stories)) {
              userStoryGroup.stories.forEach((story: any) => {
                transformedStories.push({
                  id: story.id || story.story_id || Date.now(),
                  userName: userStoryGroup.user?.name || userStoryGroup.user?.display_name || "Unknown",
                  avatar: userStoryGroup.user?.picture || userStoryGroup.user?.profile_image_url || "",
                  hasNewStory: userStoryGroup.has_unseen || false,
                  type: story.type || "text",
                  content: story.src || story.content || story.image_url || story.video_url || "",
                  caption: story.caption,
                  createdAt: story.created_at ? new Date(story.created_at).getTime() : Date.now(),
                  expiresAt: story.expires_at ? new Date(story.expires_at).getTime() : Date.now() + 24 * 60 * 60 * 1000,
                  views: story.views || [],
                  reactions: story.reactions || [],
                  isOwner: userStoryGroup.user?.id === currentUserId || story.user_id === currentUserId,
                });
              });
            }
          });
          
          setStories(transformedStories);
        } else {
          setStories([]);
        }
      } catch (error) {
        console.error("Error fetching stories:", error);
        setStories([]);
      }
    };

    fetchStories();
  }, []);

  // Filter out expired stories and update hasNewStory
  useEffect(() => {
    const now = Date.now();
    setStories((prevStories) => {
      return prevStories
        .filter((story) => {
          // Keep stories that don't have expiration or haven't expired yet
          if (!story.expiresAt) return true;
          return story.expiresAt > now;
        })
        .map((story, index) => {
          // Update hasNewStory based on whether user has viewed
          const hasViewed = story.views?.some((view) => view.userName === currentUser);
          return {
            ...story,
            hasNewStory: index === 0 && !hasViewed && story.userName === currentUser,
          };
        });
    });
  }, [currentUser]);

  // Auto-remove expired stories every minute
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      setStories((prevStories) =>
        prevStories.filter((story) => {
          if (!story.expiresAt) return true;
          return story.expiresAt > now;
        })
      );
    }, 60000); // Check every minute

    return () => clearInterval(interval);
  }, []);

  const handleAddStoryClick = () => {
    // Check if user is authenticated
    if (!isAuthenticated()) {
      alert("Please sign in to create a story.");
      navigate("/signin");
      return;
    }
    setIsStoryTypePanelOpen(true);
  };

  const handleStoryTypeSelect = (type: "text" | "photo" | "video") => {
    setIsStoryTypePanelOpen(false);
    setSelectedStoryType(type);
    setIsStoryModalOpen(true);
  };

  const handleStoryCreated = async (type: "text" | "photo" | "video", content: string, caption?: string) => {
    // Check if user is authenticated
    if (!isAuthenticated()) {
      alert("Please sign in to create a story.");
      navigate("/signin");
      return;
    }

    try {
      // Prepare story data for API
      const storyData: {
        type: "photo" | "video" | "text";
        src: string;
        background_color?: string;
        text_color?: string;
        duration?: number;
      } = {
        type: type,
        src: content,
        duration: 24, // 24 hours
      };

      // Call API to create story
      const response = await feedApi.createStory(storyData);
      
      if (response.success && response.data) {
        const apiStory: any = response.data;
        const newStory: Story = {
          id: apiStory.story_id || apiStory.id || Date.now(),
          userName: apiStory.user?.display_name || apiStory.user_name || userName,
          avatar: apiStory.user?.profile_image_url || apiStory.user_avatar || userAvatar || "",
          hasNewStory: false,
          type: type,
          content: content,
          caption: caption || apiStory.caption,
          createdAt: apiStory.created_at ? new Date(apiStory.created_at).getTime() : Date.now(),
          expiresAt: apiStory.expires_at ? new Date(apiStory.expires_at).getTime() : Date.now() + 24 * 60 * 60 * 1000,
          views: [],
          reactions: [],
          isOwner: true,
        };

        // Add to stories
        setStories((prevStories) => [newStory, ...prevStories]);

        // Show viewer after posting
        setNewlyPostedStory(newStory);
        setShowViewerAfterPost(true);

        // Call parent callback if provided
        if (onStory) {
          onStory(type, content, caption);
        }
        setIsStoryModalOpen(false);
        // Notify parent that story modal closed
        if (onStoryModalClose) {
          onStoryModalClose();
        }
      } else {
        alert("Failed to create story. Please try again.");
      }
    } catch (error) {
      console.error("Error creating story:", error);
      alert(error instanceof Error ? `Error creating story: ${error.message}` : "Failed to create story. Please try again.");
    }
  };

  const handleStoryClick = (story: Story) => {
    setViewingStory(story);
  };

  const handleStoryView = async (storyId: number) => {
    try {
      // Call API to record story view
      await feedApi.viewStory(storyId);
      
      // Update local state optimistically
      setStories((prevStories) =>
        prevStories.map((story) => {
          if (story.id === storyId) {
            const views = story.views || [];
            // Check if current user already viewed
            const hasViewed = views.some((view) => view.userName === currentUser);
            if (!hasViewed) {
              return {
                ...story,
                views: [
                  ...views,
                  {
                    userId: Date.now(), // In real app, use actual user ID
                    userName: currentUser,
                    viewedAt: Date.now(),
                  },
                ],
              };
            }
          }
          return story;
        })
      );
    } catch (error) {
      console.error("Error viewing story:", error);
      // Still update UI optimistically even if API call fails
      setStories((prevStories) =>
        prevStories.map((story) => {
          if (story.id === storyId) {
            const views = story.views || [];
            const hasViewed = views.some((view) => view.userName === currentUser);
            if (!hasViewed) {
              return {
                ...story,
                views: [
                  ...views,
                  {
                    userId: Date.now(),
                    userName: currentUser,
                    viewedAt: Date.now(),
                  },
                ],
              };
            }
          }
          return story;
        })
      );
    }
  };

  const handleStoryReact = (storyId: number) => {
    setStories((prevStories) =>
      prevStories.map((story) => {
        if (story.id === storyId) {
          const reactions = story.reactions || [];
          // Check if current user already reacted
          const hasReacted = reactions.some((reaction) => reaction.userName === currentUser);
          if (!hasReacted) {
            const updatedStory = {
              ...story,
              reactions: [
                ...reactions,
                {
                  userId: Date.now(), // In real app, use actual user ID
                  userName: currentUser,
                  reactedAt: Date.now(),
                },
              ],
            };
            
            // Notify story owner (if not the current user)
            if (story.userName !== currentUser) {
              // In a real app, you'd send a notification to the backend
              console.log(`Notification: ${currentUser} reacted to ${story.userName}'s story`);
            }
            
            return updatedStory;
          }
        }
        return story;
      })
    );
  };

  const handleStoryDelete = async (storyId: number) => {
    try {
      // Call API to delete story
      await feedApi.deleteStory(storyId);
      
      // Update local state
      setStories((prevStories) => prevStories.filter((story) => story.id !== storyId));
      setViewingStory(null);
      setShowViewerAfterPost(false);
      setNewlyPostedStory(null);
    } catch (error) {
      console.error("Error deleting story:", error);
      alert(error instanceof Error ? `Error deleting story: ${error.message}` : "Failed to delete story. Please try again.");
    }
  };

  // Close panel when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        panelRef.current &&
        !panelRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsStoryTypePanelOpen(false);
      }
    };

    if (isStoryTypePanelOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isStoryTypePanelOpen]);

  const filteredStories = stories.filter((story) => {
    if (!story.expiresAt) return true;
    return story.expiresAt > Date.now();
  });

  // Check if user is logged in (has a valid currentUser)
  const isLoggedIn = currentUser && currentUser !== "User";

  return (
    <div className="newsfeed-stories">
      <div className="newsfeed-stories__container">
        {/* Add Story Button - Always show for logged-in users */}
        {isLoggedIn && (
          <div className="newsfeed-stories__item">
            <button
              ref={buttonRef}
              className="newsfeed-stories__add-icon"
              onClick={handleAddStoryClick}
              aria-label="Add story"
              title="Add story"
            >
              <Plus size={16} />
            </button>
            <div className="newsfeed-stories__avatar-wrapper">
              {userAvatar ? (
                <LazyImage
                  src={userAvatar}
                  alt={userName || currentUser || "You"}
                  className="newsfeed-stories__avatar"
                />
              ) : (
                <div className="newsfeed-stories__avatar newsfeed-stories__avatar--initials">
                  <span>{getUserInitials()}</span>
                </div>
              )}
            </div>
            <p className="newsfeed-stories__name">{userName || currentUser || "You"}</p>
          </div>
        )}

        {filteredStories.map((story) => {
          const shouldShowInitials = !story.avatar || story.avatar.trim() === "";
          const getInitialsFromName = (name: string): string => {
            const parts = name.trim().split(" ");
            if (parts.length >= 2) {
              return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
            }
            return name.substring(0, 2).toUpperCase();
          };

          return (
            <div
              key={story.id}
              className="newsfeed-stories__item"
              onClick={() => handleStoryClick(story)}
              style={{ cursor: "pointer" }}
            >
              <div className="newsfeed-stories__avatar-wrapper">
                {shouldShowInitials ? (
                  <div className="newsfeed-stories__avatar newsfeed-stories__avatar--initials">
                    <span>{getInitialsFromName(story.userName)}</span>
                  </div>
                ) : (
                  <LazyImage
                    src={story.avatar}
                    alt={story.userName}
                    className="newsfeed-stories__avatar"
                  />
                )}
                {story.hasNewStory && (
                  <div className="newsfeed-stories__new-indicator" />
                )}
              </div>
              <p className="newsfeed-stories__name">{story.userName}</p>
            </div>
          );
        })}
      </div>

      {/* Story Type Selection Panel */}
      {isStoryTypePanelOpen && (
        <div
          className="newsfeed-story-type-panel-overlay"
          onClick={() => setIsStoryTypePanelOpen(false)}
        >
          <div
            ref={panelRef}
            className="newsfeed-story-type-panel"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="newsfeed-story-type-panel__header">
              <h3>Create Story</h3>
              <button
                className="newsfeed-story-type-panel__close"
                onClick={() => setIsStoryTypePanelOpen(false)}
                aria-label="Close panel"
              >
                <X size={20} />
              </button>
            </div>
            <div className="newsfeed-story-type-panel__content">
              <button
                className="newsfeed-story-type-panel__option"
                onClick={() => handleStoryTypeSelect("text")}
              >
                <div className="newsfeed-story-type-panel__icon newsfeed-story-type-panel__icon--text">
                  <Type size={24} />
                </div>
                <div className="newsfeed-story-type-panel__option-content">
                  <h4>Text Story</h4>
                  <p>Share your thoughts with text</p>
                </div>
              </button>
              <button
                className="newsfeed-story-type-panel__option"
                onClick={() => handleStoryTypeSelect("photo")}
              >
                <div className="newsfeed-story-type-panel__icon newsfeed-story-type-panel__icon--photo">
                  <Image size={24} />
                </div>
                <div className="newsfeed-story-type-panel__option-content">
                  <h4>Photo Story</h4>
                  <p>Share a photo from your device</p>
                </div>
              </button>
              <button
                className="newsfeed-story-type-panel__option"
                onClick={() => handleStoryTypeSelect("video")}
              >
                <div className="newsfeed-story-type-panel__icon newsfeed-story-type-panel__icon--video">
                  <Video size={24} />
                </div>
                <div className="newsfeed-story-type-panel__option-content">
                  <h4>Video Story</h4>
                  <p>Share a video from your device</p>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Story Creation Modal */}
      <CreateStoryModal
        isOpen={isStoryModalOpen}
        onClose={() => {
          setIsStoryModalOpen(false);
          if (onStoryModalClose) onStoryModalClose();
        }}
        userName={userName}
        userAvatar={userAvatar}
        storyType={selectedStoryType}
        onStory={handleStoryCreated}
      />

      {/* Story Viewer */}
      {viewingStory && viewingStory.type && viewingStory.content && (
        <StoryViewer
          story={{
            id: viewingStory.id,
            userName: viewingStory.userName,
            avatar: viewingStory.avatar,
            type: viewingStory.type,
            content: viewingStory.content,
            caption: viewingStory.caption,
            createdAt: viewingStory.createdAt || Date.now(),
            expiresAt: viewingStory.expiresAt || Date.now() + 24 * 60 * 60 * 1000,
            views: viewingStory.views,
            reactions: viewingStory.reactions,
            isOwner: viewingStory.isOwner,
          }}
          onClose={() => setViewingStory(null)}
          onDelete={handleStoryDelete}
          onView={handleStoryView}
          onReact={handleStoryReact}
        />
      )}

      {/* Show viewer after posting */}
      {showViewerAfterPost && newlyPostedStory && newlyPostedStory.type && newlyPostedStory.content && (
        <StoryViewer
          story={{
            id: newlyPostedStory.id,
            userName: newlyPostedStory.userName,
            avatar: newlyPostedStory.avatar,
            type: newlyPostedStory.type,
            content: newlyPostedStory.content,
            caption: newlyPostedStory.caption,
            createdAt: newlyPostedStory.createdAt || Date.now(),
            expiresAt: newlyPostedStory.expiresAt || Date.now() + 24 * 60 * 60 * 1000,
            views: newlyPostedStory.views,
            reactions: newlyPostedStory.reactions,
            isOwner: newlyPostedStory.isOwner,
          }}
          onClose={() => {
            setShowViewerAfterPost(false);
            setNewlyPostedStory(null);
          }}
          onDelete={handleStoryDelete}
          onView={handleStoryView}
          onReact={handleStoryReact}
        />
      )}
    </div>
  );
};

export default StoriesSection;
