import React, { useRef, useEffect, useState, useCallback } from "react";
import {
  X,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Heart,
  MessageSquare,
  Share2,
  MoreVertical,
} from "lucide-react";
import ReelOptionsMenu from "./ReelOptionsMenu";
import ReelCommentModal from "./ReelCommentModal";

interface VideoData {
  id: number;
  views: string;
  title?: string;
  videoUrl?: string;
}

interface ReelVideoModalProps {
  isOpen: boolean;
  onClose: () => void;
  videos: VideoData[];
  initialVideoIndex?: number;
}

const ReelVideoModal: React.FC<ReelVideoModalProps> = ({
  isOpen,
  onClose,
  videos,
  initialVideoIndex = 0,
}) => {
  const [currentVideoIndex, setCurrentVideoIndex] = useState(initialVideoIndex);
  const [isMuted, setIsMuted] = useState(true);
  const [showControls, setShowControls] = useState(true);
  const videoRefs = useRef<{ [key: number]: HTMLVideoElement | null }>({});
  const containerRef = useRef<HTMLDivElement>(null);
  const [playingVideoId, setPlayingVideoId] = useState<number | null>(null);
  const [likedVideos, setLikedVideos] = useState<Set<number>>(new Set());
  const [likeCounts, setLikeCounts] = useState<{ [key: number]: number }>({});
  const [commentCounts, setCommentCounts] = useState<{
    [key: number]: number;
  }>({});
  const [optionsMenuOpen, setOptionsMenuOpen] = useState(false);
  const [selectedVideoForOptions, setSelectedVideoForOptions] = useState<
    number | null
  >(null);
  const [savedVideos, setSavedVideos] = useState<Set<number>>(new Set());
  const [interestedVideos, setInterestedVideos] = useState<Set<number>>(
    new Set()
  );
  const [notInterestedVideos, setNotInterestedVideos] = useState<Set<number>>(
    new Set()
  );
  const [closedCaptionsEnabled, setClosedCaptionsEnabled] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [commentModalOpen, setCommentModalOpen] = useState(false);
  const [selectedVideoForComments, setSelectedVideoForComments] = useState<
    number | null
  >(null);

  const currentVideo = videos[currentVideoIndex];
  const currentVideoRef = videoRefs.current[currentVideo?.id || -1];

  // Load saved videos from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem("savedReels");
    if (saved) {
      try {
        const savedIds = JSON.parse(saved);
        setSavedVideos(new Set(savedIds));
      } catch (e) {
        console.error("Error loading saved reels:", e);
      }
    }

    const interested = localStorage.getItem("interestedReels");
    if (interested) {
      try {
        const interestedIds = JSON.parse(interested);
        setInterestedVideos(new Set(interestedIds));
      } catch (e) {
        console.error("Error loading interested reels:", e);
      }
    }

    const notInterested = localStorage.getItem("notInterestedReels");
    if (notInterested) {
      try {
        const notInterestedIds = JSON.parse(notInterested);
        setNotInterestedVideos(new Set(notInterestedIds));
      } catch (e) {
        console.error("Error loading not interested reels:", e);
      }
    }
  }, []);

  // Initialize video index when modal opens
  useEffect(() => {
    if (isOpen) {
      setCurrentVideoIndex(initialVideoIndex);
      setIsMuted(true);
      setShowControls(true);
      // Initialize like and comment counts
      const initialLikeCounts: { [key: number]: number } = {};
      const initialCommentCounts: { [key: number]: number } = {};
      videos.forEach((video) => {
        // Generate random counts for demo
        initialLikeCounts[video.id] = Math.floor(Math.random() * 1000) + 10;
        initialCommentCounts[video.id] = Math.floor(Math.random() * 100) + 1;
      });
      setLikeCounts(initialLikeCounts);
      setCommentCounts(initialCommentCounts);
    }
  }, [isOpen, initialVideoIndex, videos]);

  // Play current video when it changes
  useEffect(() => {
    if (isOpen && currentVideoRef && currentVideo) {
      // Pause all videos first
      Object.values(videoRefs.current).forEach((video) => {
        if (video) {
          video.pause();
        }
      });

      // Try to play current video
      const playPromise = currentVideoRef.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            setPlayingVideoId(currentVideo.id);
            setShowControls(true);
            setTimeout(() => {
              setShowControls(false);
            }, 3000);
          })
          .catch((error) => {
            // Auto-play failed, user interaction required
            console.log("Auto-play prevented:", error);
            setPlayingVideoId(null);
            setShowControls(true); // Show controls so user can click play
          });
      }
    }
  }, [isOpen, currentVideoIndex, currentVideoRef, currentVideo, videos]);

  // Handle video end - scroll to next video
  const handleVideoEnd = useCallback(() => {
    if (currentVideoIndex < videos.length - 1) {
      const nextIndex = currentVideoIndex + 1;
      const nextVideo = videos[nextIndex];

      // Scroll to next video
      const nextVideoElement = containerRef.current?.querySelector(
        `[data-video-id="${nextVideo.id}"]`
      );
      if (nextVideoElement && containerRef.current) {
        nextVideoElement.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
        // Update index after a short delay to ensure scroll completes
        setTimeout(() => {
          setCurrentVideoIndex(nextIndex);
        }, 100);
      } else {
        setCurrentVideoIndex(nextIndex);
      }
    }
  }, [currentVideoIndex, videos]);

  // Intersection Observer for auto-play when scrolling
  useEffect(() => {
    if (!isOpen || !containerRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio > 0.7) {
            const videoId = parseInt(
              entry.target.getAttribute("data-video-id") || "-1"
            );
            const video = videoRefs.current[videoId];

            if (video && playingVideoId !== videoId) {
              // Pause all videos
              Object.values(videoRefs.current).forEach((v) => {
                if (v) v.pause();
              });

              // Play the visible video
              video
                .play()
                .then(() => {
                  setPlayingVideoId(videoId);
                  setShowControls(true);
                  setTimeout(() => {
                    setShowControls(false);
                  }, 3000);
                })
                .catch((error) => {
                  // Auto-play failed
                  console.log("Auto-play prevented on scroll:", error);
                  setPlayingVideoId(null);
                  setShowControls(true); // Show controls so user can click play
                });

              // Update current video index
              const index = videos.findIndex((v) => v.id === videoId);
              if (index !== -1) {
                setCurrentVideoIndex(index);
              }
            }
          } else {
            const videoId = parseInt(
              entry.target.getAttribute("data-video-id") || "-1"
            );
            const video = videoRefs.current[videoId];
            if (
              video &&
              playingVideoId === videoId &&
              entry.intersectionRatio < 0.5
            ) {
              video.pause();
            }
          }
        });
      },
      { threshold: [0.5, 0.7] }
    );

    // Observe all video items
    const videoItems = containerRef.current.querySelectorAll(
      ".reel-video-modal__video-item"
    );
    videoItems.forEach((item) => {
      observer.observe(item);
    });

    return () => {
      observer.disconnect();
    };
  }, [isOpen, videos, playingVideoId]);

  const handlePlayPause = (videoId: number) => {
    const video = videoRefs.current[videoId];
    if (video) {
      if (video.paused) {
        // Pause all videos
        Object.values(videoRefs.current).forEach((v) => {
          if (v) v.pause();
        });
        // Play the selected video
        video
          .play()
          .then(() => {
            setPlayingVideoId(videoId);
            setShowControls(true);
            setTimeout(() => {
              setShowControls(false);
            }, 3000);
          })
          .catch((error) => {
            console.error("Error playing video:", error);
            // Keep controls visible if play fails
            setShowControls(true);
          });
      } else {
        video.pause();
        setPlayingVideoId(null);
        setShowControls(true);
        setTimeout(() => {
          setShowControls(false);
        }, 3000);
      }
    }
  };

  const handleMuteToggle = () => {
    const newMutedState = !isMuted;
    setIsMuted(newMutedState);
    // Apply mute state to all videos
    Object.values(videoRefs.current).forEach((video) => {
      if (video) {
        video.muted = newMutedState;
      }
    });
  };

  const handleVideoClick = (videoId: number) => {
    handlePlayPause(videoId);
  };

  const handleLike = (videoId: number) => {
    setLikedVideos((prev) => {
      const newSet = new Set(prev);
      const isLiked = newSet.has(videoId);

      if (isLiked) {
        newSet.delete(videoId);
        setLikeCounts((prev) => ({
          ...prev,
          [videoId]: Math.max(0, (prev[videoId] || 0) - 1),
        }));
      } else {
        newSet.add(videoId);
        setLikeCounts((prev) => ({
          ...prev,
          [videoId]: (prev[videoId] || 0) + 1,
        }));
      }

      return newSet;
    });
  };

  const handleComment = (videoId: number) => {
    setSelectedVideoForComments(videoId);
    setCommentModalOpen(true);
  };

  const handleCloseCommentModal = () => {
    setCommentModalOpen(false);
    setSelectedVideoForComments(null);
  };

  const handleSaveVideo = (videoId: number) => {
    setSavedVideos((prev) => {
      const newSet = new Set(prev);
      const isSaved = newSet.has(videoId);

      if (isSaved) {
        newSet.delete(videoId);
      } else {
        newSet.add(videoId);
      }

      // Save to localStorage
      localStorage.setItem("savedReels", JSON.stringify(Array.from(newSet)));

      return newSet;
    });
  };

  const handleRemix = (videoId: number) => {
    const video = videos.find((v) => v.id === videoId);
    alert(
      `Remix feature coming soon! This will allow you to create a remix of "${
        video?.title || "this reel"
      }"`
    );
  };

  const handleSequence = (videoId: number) => {
    const video = videos.find((v) => v.id === videoId);
    alert(
      `Sequence feature coming soon! This will allow you to create a sequence with "${
        video?.title || "this reel"
      }"`
    );
  };

  const handleToggleClosedCaptions = () => {
    setClosedCaptionsEnabled((prev) => {
      const newState = !prev;
      // Apply closed captions to all videos
      Object.values(videoRefs.current).forEach((video) => {
        if (video && video.textTracks) {
          for (let i = 0; i < video.textTracks.length; i++) {
            const track = video.textTracks[i];
            track.mode = newState ? "showing" : "hidden";
          }
        }
      });
      return newState;
    });
  };

  const handleToggleFullscreen = () => {
    const modalElement = document.querySelector(".reel-video-modal");
    if (!modalElement) return;

    if (!document.fullscreenElement) {
      modalElement
        .requestFullscreen()
        .then(() => {
          setIsFullscreen(true);
        })
        .catch((err) => {
          console.error("Error attempting to enable fullscreen:", err);
          alert("Fullscreen mode is not supported by your browser");
        });
    } else {
      document
        .exitFullscreen()
        .then(() => {
          setIsFullscreen(false);
        })
        .catch((err) => {
          console.error("Error attempting to exit fullscreen:", err);
        });
    }
  };

  const handleInterested = (videoId: number) => {
    setInterestedVideos((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(videoId)) {
        newSet.delete(videoId);
      } else {
        newSet.add(videoId);
        // Remove from not interested if it's there
        setNotInterestedVideos((prevNot) => {
          const newNotSet = new Set(prevNot);
          newNotSet.delete(videoId);
          localStorage.setItem(
            "notInterestedReels",
            JSON.stringify(Array.from(newNotSet))
          );
          return newNotSet;
        });
      }
      localStorage.setItem(
        "interestedReels",
        JSON.stringify(Array.from(newSet))
      );
      return newSet;
    });
  };

  const handleNotInterested = (videoId: number) => {
    setNotInterestedVideos((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(videoId)) {
        newSet.delete(videoId);
      } else {
        newSet.add(videoId);
        // Remove from interested if it's there
        setInterestedVideos((prevInt) => {
          const newIntSet = new Set(prevInt);
          newIntSet.delete(videoId);
          localStorage.setItem(
            "interestedReels",
            JSON.stringify(Array.from(newIntSet))
          );
          return newIntSet;
        });
      }
      localStorage.setItem(
        "notInterestedReels",
        JSON.stringify(Array.from(newSet))
      );
      return newSet;
    });
  };

  const handleReport = (videoId: number) => {
    const video = videos.find((v) => v.id === videoId);
    const confirmed = window.confirm(
      `Are you sure you want to report "${
        video?.title || "this reel"
      }"?\n\nThis action cannot be undone.`
    );
    if (confirmed) {
      alert(
        "Thank you for your report. We'll review this content and take appropriate action."
      );
      console.log("Reported video:", videoId);
    }
  };

  const handleManagePreferences = () => {
    alert(
      "Content preferences management coming soon! This will allow you to customize what content you see."
    );
  };

  // Listen for fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);

  const handleShare = async (videoId: number) => {
    const video = videos.find((v) => v.id === videoId);
    const shareData = {
      title: video?.title || "Check out this reel!",
      text: `Watch this amazing reel: ${video?.title || "Reel Video"}`,
      url: window.location.href,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        // Fallback: Copy to clipboard
        await navigator.clipboard.writeText(window.location.href);
        alert("Link copied to clipboard!");
      }
    } catch (error) {
      // User cancelled or error occurred
      console.log("Share cancelled or failed:", error);
    }
  };

  const handleOpenOptions = (videoId: number) => {
    setSelectedVideoForOptions(videoId);
    setOptionsMenuOpen(true);
  };

  const handleCloseOptions = () => {
    setOptionsMenuOpen(false);
    setSelectedVideoForOptions(null);
  };

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // Only close if clicking directly on the overlay, not when scrolling
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen || videos.length === 0) return null;

  return (
    <div className="reel-video-modal-overlay" onClick={handleOverlayClick}>
      <div className="reel-video-modal" onClick={(e) => e.stopPropagation()}>
        <div className="reel-video-modal__header">
          <h3 className="reel-video-modal__title">Reels</h3>
          <button
            className="reel-video-modal__close"
            onClick={onClose}
            aria-label="Close video"
          >
            <X size={24} />
          </button>
        </div>

        <div className="reel-video-modal__feed" ref={containerRef}>
          {videos.map((video, index) => {
            const videoUrl =
              video.videoUrl ||
              "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4";
            const isPlaying = playingVideoId === video.id;

            return (
              <div
                key={video.id}
                data-video-id={video.id}
                className="reel-video-modal__video-item"
              >
                <div className="reel-video-modal__video-container">
                  <video
                    ref={(el) => {
                      videoRefs.current[video.id] = el;
                    }}
                    src={videoUrl}
                    className="reel-video-modal__video"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleVideoClick(video.id);
                    }}
                    onEnded={() => {
                      // Only auto-scroll if this is the currently playing video
                      if (
                        playingVideoId === video.id &&
                        index < videos.length - 1
                      ) {
                        handleVideoEnd();
                      }
                    }}
                    muted={isMuted}
                    playsInline
                    loop={false} // Don't loop, scroll to next instead
                  />

                  {/* Action Buttons (Like, Comment, Share) */}
                  <div className="reel-video-modal__actions">
                    <button
                      className={`reel-video-modal__action-btn ${
                        likedVideos.has(video.id)
                          ? "reel-video-modal__action-btn--liked"
                          : ""
                      }`}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleLike(video.id);
                      }}
                      aria-label="Like"
                    >
                      <Heart
                        size={28}
                        fill={likedVideos.has(video.id) ? "#e91e63" : "none"}
                        color={likedVideos.has(video.id) ? "#e91e63" : "white"}
                      />
                      <span className="reel-video-modal__action-count">
                        {likeCounts[video.id] || 0}
                      </span>
                    </button>

                    <button
                      className="reel-video-modal__action-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleComment(video.id);
                      }}
                      aria-label="Comment"
                    >
                      <MessageSquare size={28} color="white" />
                      <span className="reel-video-modal__action-count">
                        {commentCounts[video.id] || 0}
                      </span>
                    </button>

                    <button
                      className="reel-video-modal__action-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleShare(video.id);
                      }}
                      aria-label="Share"
                    >
                      <Share2 size={28} color="white" />
                    </button>

                    <button
                      className="reel-video-modal__action-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenOptions(video.id);
                      }}
                      aria-label="More options"
                      type="button"
                    >
                      <MoreVertical size={28} color="white" />
                    </button>
                  </div>

                  {/* Bottom Controls (Play, Mute, Views) */}
                  {showControls && (
                    <div className="reel-video-modal__controls">
                      <button
                        className="reel-video-modal__control-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          handlePlayPause(video.id);
                        }}
                        aria-label={isPlaying ? "Pause" : "Play"}
                      >
                        {isPlaying ? <Pause size={24} /> : <Play size={24} />}
                      </button>
                      <button
                        className="reel-video-modal__control-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMuteToggle();
                        }}
                        aria-label={isMuted ? "Unmute" : "Mute"}
                      >
                        {isMuted ? (
                          <VolumeX size={24} />
                        ) : (
                          <Volume2 size={24} />
                        )}
                      </button>
                      <span className="reel-video-modal__views">
                        {video.views} views
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Options Menu */}
      <ReelOptionsMenu
        isOpen={optionsMenuOpen}
        onClose={handleCloseOptions}
        videoId={selectedVideoForOptions || 0}
        isSaved={
          selectedVideoForOptions
            ? savedVideos.has(selectedVideoForOptions)
            : false
        }
        isInterested={
          selectedVideoForOptions
            ? interestedVideos.has(selectedVideoForOptions)
            : false
        }
        isNotInterested={
          selectedVideoForOptions
            ? notInterestedVideos.has(selectedVideoForOptions)
            : false
        }
        closedCaptionsEnabled={closedCaptionsEnabled}
        isFullscreen={isFullscreen}
        onSave={() => {
          if (selectedVideoForOptions) {
            handleSaveVideo(selectedVideoForOptions);
          }
        }}
        onRemix={() => {
          if (selectedVideoForOptions) {
            handleRemix(selectedVideoForOptions);
          }
        }}
        onSequence={() => {
          if (selectedVideoForOptions) {
            handleSequence(selectedVideoForOptions);
          }
        }}
        onToggleClosedCaptions={handleToggleClosedCaptions}
        onToggleFullscreen={handleToggleFullscreen}
        onInterested={() => {
          if (selectedVideoForOptions) {
            handleInterested(selectedVideoForOptions);
          }
        }}
        onNotInterested={() => {
          if (selectedVideoForOptions) {
            handleNotInterested(selectedVideoForOptions);
          }
        }}
        onReport={() => {
          if (selectedVideoForOptions) {
            handleReport(selectedVideoForOptions);
          }
        }}
        onManagePreferences={handleManagePreferences}
      />

      {/* Comment Modal */}
      <ReelCommentModal
        isOpen={commentModalOpen}
        onClose={handleCloseCommentModal}
        videoId={selectedVideoForComments || 0}
        videoTitle={
          selectedVideoForComments
            ? videos.find((v) => v.id === selectedVideoForComments)?.title
            : undefined
        }
        onCommentAdded={() => {
          if (selectedVideoForComments) {
            setCommentCounts((prev) => ({
              ...prev,
              [selectedVideoForComments]:
                (prev[selectedVideoForComments] || 0) + 1,
            }));
          }
        }}
      />
    </div>
  );
};

export default ReelVideoModal;
