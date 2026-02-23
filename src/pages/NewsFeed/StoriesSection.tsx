import React, { useState, useRef, useEffect, useMemo } from "react";
import { Plus, Type, Image, Video, X } from "lucide-react";
import LazyImage from "../../components/LazyImage";
import CreateStoryModal from "./CreateStoryModal";
import StoryViewer from "./StoryViewer";
import { getUserName, isAuthenticated, getInitialsFromName, getUserInitials } from "../../utils/userUtils";
import { useNavigate } from "react-router-dom";
import { feedApi } from "../../services/feedApi";

interface Story {
  id: number;
  userName: string;
  avatar: string;
  hasNewStory?: boolean;
  type: "text" | "photo" | "video";
  content: string;
  caption?: string;
  createdAt: number;
  expiresAt: number;
  views?: Array<{ userId: number; userName: string; viewedAt: number }>;
  reactions?: Array<{ userId: number; userName: string; reactedAt: number }>;
  isOwner?: boolean;
}

interface StoriesSectionProps {
  userName?: string;
  userAvatar?: string;
  onStory?: (
    type: "text" | "photo" | "video",
    content: string,
    caption?: string
  ) => void;
  forceOpenStoryModal?: boolean;
  onStoryModalClose?: () => void;
}

const StoriesSection: React.FC<StoriesSectionProps> = ({
  userName = "You",
  userAvatar,
  onStory,
  forceOpenStoryModal = false,
  onStoryModalClose,
}) => {
  const navigate = useNavigate();
  const [stories, setStories] = useState<Story[]>([]);
  const [storiesByUser, setStoriesByUser] = useState<Map<string, Story[]>>(
    new Map()
  );
  const [isStoryTypePanelOpen, setIsStoryTypePanelOpen] = useState(false);
  const [isStoryModalOpen, setIsStoryModalOpen] = useState(false);
  const [selectedStoryType, setSelectedStoryType] = useState<
    "text" | "photo" | "video"
  >("text");
  const [viewingStories, setViewingStories] = useState<Story[]>([]);
  const [currentStoryIndex, setCurrentStoryIndex] = useState(0);
  const [showViewerAfterPost, setShowViewerAfterPost] = useState(false);
  const [newlyPostedStory, setNewlyPostedStory] = useState<Story | null>(null);
  const [postedViewerIndex, setPostedViewerIndex] = useState(0);
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
          const currentUserId =
            JSON.parse(localStorage.getItem("user") || "{}")?.user_id || null;

          const storiesMap = new Map<string, Story[]>();
          const latestStories: Story[] = [];

          response.data.forEach(
            (userStoryGroup: {
              user?: {
                id?: number;
                name?: string;
                display_name?: string;
                picture?: string;
                profile_image_url?: string;
              };
              stories?: Array<{
                id?: number;
                story_id?: number;
                type?: "text" | "photo" | "video";
                src?: string;
                content?: string;
                image_url?: string;
                video_url?: string;
                caption?: string;
                created_at?: string;
                expires_at?: string;
                views?: Array<{
                  userId: number;
                  userName: string;
                  viewedAt: number;
                }>;
                reactions?: Array<{
                  userId: number;
                  userName: string;
                  reactedAt: number;
                }>;
                user_id?: number;
              }>;
              has_unseen?: boolean;
            }) => {
              if (
                userStoryGroup.stories &&
                Array.isArray(userStoryGroup.stories)
              ) {
                const storyUserName =
                  userStoryGroup.user?.name ||
                  userStoryGroup.user?.display_name ||
                  "Unknown";
                const userStories: Story[] = [];

                userStoryGroup.stories.forEach((story) => {
                  const storyObj: Story = {
                    id: story.id || story.story_id || Date.now(),
                    userName: storyUserName,
                    avatar:
                      userStoryGroup.user?.picture ||
                      userStoryGroup.user?.profile_image_url ||
                      "",
                    hasNewStory: userStoryGroup.has_unseen || false,
                    type: (story.type || "text") as "text" | "photo" | "video",
                    content:
                      story.src ||
                      story.content ||
                      story.image_url ||
                      story.video_url ||
                      "",
                    caption: story.caption,
                    createdAt: story.created_at
                      ? new Date(story.created_at).getTime()
                      : Date.now(),
                    expiresAt: story.expires_at
                      ? new Date(story.expires_at).getTime()
                      : Date.now() + 24 * 60 * 60 * 1000,
                    views: story.views || [],
                    reactions: story.reactions || [],
                    isOwner:
                      userStoryGroup.user?.id === currentUserId ||
                      story.user_id === currentUserId,
                  };
                  userStories.push(storyObj);
                });

                // Sort stories by creation date (newest first)
                userStories.sort(
                  (a, b) => (b.createdAt || 0) - (a.createdAt || 0)
                );

                // Store all stories for this user
                storiesMap.set(storyUserName, userStories);

                // Add only the latest story to display
                if (userStories.length > 0) {
                  latestStories.push(userStories[0]);
                }
              }
            }
          );

          setStoriesByUser(storiesMap);
          setStories(latestStories);
        } else {
          setStories([]);
          setStoriesByUser(new Map());
        }
      } catch (error) {
        console.error("Error fetching stories:", error);
        setStories([]);
        setStoriesByUser(new Map());
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
          const hasViewed = story.views?.some(
            (view) => view.userName === currentUser
          );
          return {
            ...story,
            hasNewStory:
              index === 0 && !hasViewed && story.userName === currentUser,
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

  // Handle force open story modal from parent component
  useEffect(() => {
    if (forceOpenStoryModal) {
      // Check if user is authenticated
      if (!isAuthenticated()) {
        alert("Please sign in to create a story.");
        navigate("/signin");
        if (onStoryModalClose) onStoryModalClose();
        return;
      }
      // Open the story type selection panel
      setIsStoryTypePanelOpen(true);
      // Reset the parent state so it can be triggered again
      if (onStoryModalClose) {
        onStoryModalClose();
      }
    }
  }, [forceOpenStoryModal, navigate, onStoryModalClose]);

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

  // Initialize/keep the posted viewer index in sync with the newly posted story set
  useEffect(() => {
    if (showViewerAfterPost && newlyPostedStory) {
      const userStories = storiesByUser.get(newlyPostedStory.userName) || [
        newlyPostedStory,
      ];
      const storyIndex = userStories.findIndex(
        (s) => s.id === newlyPostedStory.id
      );
      const indexToShow = storyIndex >= 0 ? storyIndex : 0;
      setPostedViewerIndex(indexToShow);
    }
  }, [showViewerAfterPost, newlyPostedStory, storiesByUser]);

  const handleStoryCreated = async (
    type: "text" | "photo" | "video",
    content: string,
    caption?: string,
    mediaFile?: File | Blob
  ) => {
    // Check if user is authenticated
    if (!isAuthenticated()) {
      alert("Please sign in to create a story.");
      navigate("/signin");
      return;
    }

    try {
      // Prepare story data for API (photo/video: backend expects multipart with "media" file)
      const storyData: {
        type: "photo" | "video" | "text";
        src: string;
        background_color?: string;
        text_color?: string;
        duration?: number;
        mediaFile?: File | Blob;
      } = {
        type: type,
        src: content,
        duration: 24, // 24 hours
      };
      if (mediaFile != null) {
        storyData.mediaFile = mediaFile;
      }

      // Call API to create story
      const response = await feedApi.createStory(storyData);

      if (response.success && response.data) {
        const apiStory = response.data as {
          story_id?: number;
          id?: number;
          user?: { display_name?: string; profile_image_url?: string };
          user_name?: string;
          user_avatar?: string;
          caption?: string;
          created_at?: string;
          expires_at?: string;
        };
        const storyUserName =
          apiStory.user?.display_name || apiStory.user_name || userName;
        const newStory: Story = {
          id: apiStory.story_id || apiStory.id || Date.now(),
          userName: storyUserName,
          avatar:
            apiStory.user?.profile_image_url ||
            apiStory.user_avatar ||
            userAvatar ||
            "",
          hasNewStory: false,
          type: type,
          content: content,
          caption: caption || apiStory.caption,
          createdAt: apiStory.created_at
            ? new Date(apiStory.created_at).getTime()
            : Date.now(),
          expiresAt: apiStory.expires_at
            ? new Date(apiStory.expires_at).getTime()
            : Date.now() + 24 * 60 * 60 * 1000,
          views: [],
          reactions: [],
          isOwner: true,
        };

        // Add to stories map
        const userNameForMap = newStory.userName;
        setStoriesByUser((prevMap) => {
          const userStories = prevMap.get(userNameForMap) || [];
          const updatedStories = [newStory, ...userStories].sort(
            (a, b) => (b.createdAt || 0) - (a.createdAt || 0)
          );
          const newMap = new Map(prevMap);
          newMap.set(userNameForMap, updatedStories);
          return newMap;
        });

        // Update latest stories display
        setStories((prevStories) => {
          const filtered = prevStories.filter(
            (s) => s.userName !== userNameForMap
          );
          return [newStory, ...filtered];
        });

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
      alert(
        error instanceof Error
          ? `Error creating story: ${error.message}`
          : "Failed to create story. Please try again."
      );
    }
  };

  // Removed unused handleStoryClick - using handleUserStoryClick instead
  //   // Removed unused handleStoryClick - using handleUserStoryClick instead
  // const handleStoryClick = (story: Story) => {
  //   setViewingStory(story);
  // };

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
            const hasViewed = views.some(
              (view) => view.userName === currentUser
            );
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
            const hasViewed = views.some(
              (view) => view.userName === currentUser
            );
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
          const hasReacted = reactions.some(
            (reaction) => reaction.userName === currentUser
          );
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
              console.log(
                `Notification: ${currentUser} reacted to ${story.userName}'s story`
              );
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

      // Find the story to get userName
      const storyToDelete = Array.from(storiesByUser.values())
        .flat()
        .find((s) => s.id === storyId);

      if (storyToDelete) {
        const userName = storyToDelete.userName;

        // Update stories map
        setStoriesByUser((prevMap) => {
          const userStories = prevMap.get(userName) || [];
          const updatedStories = userStories.filter((s) => s.id !== storyId);
          const newMap = new Map(prevMap);
          if (updatedStories.length > 0) {
            newMap.set(userName, updatedStories);
            // Update latest story for this user
            setStories((prevStories) => {
              const filtered = prevStories.filter(
                (s) => s.userName !== userName
              );
              return [updatedStories[0], ...filtered];
            });
          } else {
            newMap.delete(userName);
            // Remove user from latest stories
            setStories((prevStories) =>
              prevStories.filter((s) => s.userName !== userName)
            );
          }
          return newMap;
        });
      }

      // Update viewing stories
      setViewingStories((prevStories) => {
        const updated = prevStories.filter((s) => s.id !== storyId);
        if (updated.length === 0) {
          setViewingStories([]);
          setCurrentStoryIndex(0);
        } else if (currentStoryIndex >= updated.length) {
          setCurrentStoryIndex(updated.length - 1);
        }
        return updated;
      });

      setShowViewerAfterPost(false);
      setNewlyPostedStory(null);
    } catch (error) {
      console.error("Error deleting story:", error);
      alert(
        error instanceof Error
          ? `Error deleting story: ${error.message}`
          : "Failed to delete story. Please try again."
      );
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

  const filteredStories = useMemo(() => {
    if (!Array.isArray(stories)) {
      console.warn("stories is not an array:", stories);
      return [];
    }
    return stories.filter((story) => {
      if (!story || !story.expiresAt) return true;
      return story.expiresAt > Date.now();
    });
  }, [stories]);

  // Group stories by user (one card per user)
  interface UserStoryGroup {
    userName: string;
    avatar: string;
    stories: Story[];
    hasNewStory: boolean;
    mostRecentStory: Story | null;
  }

  const groupedStories = useMemo(() => {
    const groups = new Map<string, UserStoryGroup>();

    // Safety check - ensure filteredStories is an array
    if (!Array.isArray(filteredStories)) {
      console.warn("filteredStories is not an array:", filteredStories);
      return [];
    }

    filteredStories.forEach((story) => {
      const key = story.userName;
      if (!groups.has(key)) {
        groups.set(key, {
          userName: story.userName,
          avatar: story.avatar,
          stories: [],
          hasNewStory: false,
          mostRecentStory: null,
        });
      }

      const group = groups.get(key)!;
      group.stories.push(story);

      // Sort stories by creation date (most recent first)
      group.stories.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

      // Set most recent story (prefer photo/video for preview, but any story works)
      if (
        !group.mostRecentStory ||
        (story.createdAt || 0) > (group.mostRecentStory.createdAt || 0)
      ) {
        group.mostRecentStory = story;
      }

      // Check if user has new story
      if (story.hasNewStory) {
        group.hasNewStory = true;
      }
    });

    // Sort groups by most recent story (most recent first)
    return Array.from(groups.values()).sort((a, b) => {
      const aTime = a.mostRecentStory?.createdAt || 0;
      const bTime = b.mostRecentStory?.createdAt || 0;
      return bTime - aTime;
    });
  }, [filteredStories]);

  // Check if user is logged in (has a valid currentUser)
  const isLoggedIn = currentUser && currentUser !== "User";

  const handleUserStoryClick = (userGroup: UserStoryGroup) => {
    // Set all stories for this user to start viewing
    // All stories for this user will be passed to StoryViewer
    if (userGroup.stories.length > 0) {
      setViewingStories(userGroup.stories);
      setCurrentStoryIndex(0);
    }
  };

  return (
    <div className="newsfeed-stories">
      <div className="newsfeed-stories__container">
        {/* Add Story Button - Always show for logged-in users */}
        {isLoggedIn &&
          (() => {
            try {
              // Get user's own stories for preview
              const userStories = filteredStories
                .filter((s) => s.userName === (userName || currentUser))
                .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
              const mostRecentUserStory =
                userStories.length > 0 ? userStories[0] : null;
              const hasUserStories = userStories.length > 0;

              return (
                <div
                  className="newsfeed-stories__item"
                  onClick={(e) => {
                    // If user has stories, clicking on avatar opens viewer with all user stories
                    if (
                      hasUserStories &&
                      !(e.target as HTMLElement).closest(
                        ".newsfeed-stories__add-icon"
                      )
                    ) {
                      setViewingStories(userStories);
                      setCurrentStoryIndex(0);
                    }
                  }}
                  style={{ cursor: hasUserStories ? "pointer" : "default" }}
                >
                  <button
                    ref={buttonRef}
                    className="newsfeed-stories__add-icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAddStoryClick();
                    }}
                    aria-label="Add story"
                    title="Add story"
                  >
                    <Plus size={16} />
                  </button>
                  <div className="newsfeed-stories__avatar-wrapper">
                    {/* Show preview of most recent story as background */}
                    {mostRecentUserStory &&
                    mostRecentUserStory.type &&
                    mostRecentUserStory.content ? (
                      <>
                        <div className="newsfeed-stories__story-preview">
                          {mostRecentUserStory.type === "photo" ? (
                            <img
                              src={mostRecentUserStory.content}
                              alt="Story preview"
                              className="newsfeed-stories__preview-image"
                              onError={(e) => {
                                // Hide preview if image fails to load
                                (e.target as HTMLElement).style.display =
                                  "none";
                              }}
                            />
                          ) : mostRecentUserStory.type === "video" ? (
                            <video
                              src={mostRecentUserStory.content}
                              className="newsfeed-stories__preview-video"
                              muted
                              playsInline
                              autoPlay
                              loop
                              onError={(e) => {
                                // Hide preview if video fails to load
                                (e.target as HTMLElement).style.display =
                                  "none";
                              }}
                            />
                          ) : mostRecentUserStory.type === "text" ? (
                            <div className="newsfeed-stories__preview-text">
                              <p>{mostRecentUserStory.content}</p>
                            </div>
                          ) : null}
                        </div>
                        {/* User avatar overlay when story preview exists */}
                        {userAvatar ? (
                          <div className="newsfeed-stories__avatar-overlay">
                            <LazyImage
                              src={userAvatar}
                              alt={userName || currentUser || "You"}
                              className="newsfeed-stories__avatar"
                            />
                          </div>
                        ) : null}
                      </>
                    ) : /* User avatar or initials when no story preview */
                    userAvatar ? (
                      <div className="newsfeed-stories__avatar-overlay">
                        <LazyImage
                          src={userAvatar}
                          alt={userName || currentUser || "You"}
                          className="newsfeed-stories__avatar"
                        />
                      </div>
                    ) : (
                      <div className="newsfeed-stories__avatar newsfeed-stories__avatar--initials">
                        <span>{getUserInitials()}</span>
                      </div>
                    )}
                  </div>
                  <p className="newsfeed-stories__name">
                    {userName || currentUser || "You"}
                  </p>
                </div>
              );
            } catch (error) {
              console.error("Error rendering user story card:", error);
              // Fallback to simple version without preview
              return (
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
                  <p className="newsfeed-stories__name">
                    {userName || currentUser || "You"}
                  </p>
                </div>
              );
            }
          })()}

        {/* Display one card per user with preview of most recent story */}
        {/* Filter out current user to avoid duplicate - they already have their own card above */}
        {groupedStories
          .filter((userGroup) => {
            const currentUserName = userName || currentUser;
            // Exclude current user from the list to prevent duplicate cards
            return (
              userGroup.userName !== currentUserName &&
              userGroup.userName !== currentUser &&
              userGroup.userName !== userName
            );
          })
          .map((userGroup) => {
            try {
              const shouldShowInitials =
                !userGroup.avatar || userGroup.avatar.trim() === "";
              const mostRecent = userGroup.mostRecentStory;

              return (
                <div
                  key={userGroup.userName}
                  className="newsfeed-stories__item"
                  onClick={() => handleUserStoryClick(userGroup)}
                  style={{ cursor: "pointer" }}
                >
                  <div className="newsfeed-stories__avatar-wrapper">
                    {/* Show preview of most recent story as background */}
                    {mostRecent && mostRecent.type && mostRecent.content ? (
                      <>
                        <div className="newsfeed-stories__story-preview">
                          {mostRecent.type === "photo" ? (
                            <img
                              src={mostRecent.content}
                              alt="Story preview"
                              className="newsfeed-stories__preview-image"
                              onError={(e) => {
                                // Hide preview if image fails to load
                                (e.target as HTMLElement).style.display =
                                  "none";
                              }}
                            />
                          ) : mostRecent.type === "video" ? (
                            <video
                              src={mostRecent.content}
                              className="newsfeed-stories__preview-video"
                              muted
                              playsInline
                              autoPlay
                              loop
                              onError={(e) => {
                                // Hide preview if video fails to load
                                (e.target as HTMLElement).style.display =
                                  "none";
                              }}
                            />
                          ) : mostRecent.type === "text" ? (
                            <div className="newsfeed-stories__preview-text">
                              <p>{mostRecent.content}</p>
                            </div>
                          ) : null}
                        </div>
                        {/* User avatar overlay when story preview exists */}
                        {!shouldShowInitials && (
                          <div className="newsfeed-stories__avatar-overlay">
                            <LazyImage
                              src={userGroup.avatar}
                              alt={userGroup.userName}
                              className="newsfeed-stories__avatar"
                            />
                          </div>
                        )}
                      </>
                    ) : /* User avatar or initials when no story preview */
                    !shouldShowInitials ? (
                      <div className="newsfeed-stories__avatar-overlay">
                        <LazyImage
                          src={userGroup.avatar}
                          alt={userGroup.userName}
                          className="newsfeed-stories__avatar"
                        />
                      </div>
                    ) : (
                      <div className="newsfeed-stories__avatar newsfeed-stories__avatar--initials">
                        <span>{getInitialsFromName(userGroup.userName)}</span>
                      </div>
                    )}
                    {userGroup.hasNewStory && (
                      <div className="newsfeed-stories__new-indicator" />
                    )}
                  </div>
                  <p className="newsfeed-stories__name">{userGroup.userName}</p>
                </div>
              );
            } catch (error) {
              console.error(
                "Error rendering story card for user:",
                userGroup.userName,
                error
              );
              // Fallback to simple version without preview
              return (
                <div
                  key={userGroup.userName}
                  className="newsfeed-stories__item"
                  onClick={() => handleUserStoryClick(userGroup)}
                  style={{ cursor: "pointer" }}
                >
                  <div className="newsfeed-stories__avatar-wrapper">
                    {userGroup.avatar && userGroup.avatar.trim() !== "" ? (
                      <LazyImage
                        src={userGroup.avatar}
                        alt={userGroup.userName}
                        className="newsfeed-stories__avatar"
                      />
                    ) : (
                      <div className="newsfeed-stories__avatar newsfeed-stories__avatar--initials">
                        <span>{getInitialsFromName(userGroup.userName)}</span>
                      </div>
                    )}
                    {userGroup.hasNewStory && (
                      <div className="newsfeed-stories__new-indicator" />
                    )}
                  </div>
                  <p className="newsfeed-stories__name">{userGroup.userName}</p>
                </div>
              );
            }
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

      {/* Story Viewer - Pass all stories for the user */}
      {viewingStories.length > 0 && (
        <StoryViewer
          stories={viewingStories}
          currentIndex={currentStoryIndex}
          onNavigate={(index) => setCurrentStoryIndex(index)}
          onClose={() => {
            setViewingStories([]);
            setCurrentStoryIndex(0);
          }}
          onDelete={handleStoryDelete}
          onView={handleStoryView}
          onReact={handleStoryReact}
        />
      )}

      {/* Show viewer after posting */}
      {showViewerAfterPost &&
        newlyPostedStory &&
        newlyPostedStory.type &&
        newlyPostedStory.content &&
        (() => {
          // Get all stories for the user who posted
          const userStories = storiesByUser.get(newlyPostedStory.userName) || [
            newlyPostedStory,
          ];

          return (
            <StoryViewer
              stories={userStories}
              currentIndex={postedViewerIndex}
              onNavigate={(index) => {
                if (index >= 0 && index < userStories.length) {
                  setPostedViewerIndex(index);
                }
              }}
              onClose={() => {
                setShowViewerAfterPost(false);
                setNewlyPostedStory(null);
                setPostedViewerIndex(0);
              }}
              onDelete={handleStoryDelete}
              onView={handleStoryView}
              onReact={handleStoryReact}
            />
          );
        })()}
    </div>
  );
};

export default StoriesSection;
