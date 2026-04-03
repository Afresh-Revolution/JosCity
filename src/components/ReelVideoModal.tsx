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
import { reelsApi, ReelItem } from "../services/reelsApi";

interface ReelVideoModalProps {
  isOpen: boolean;
  onClose: () => void;
  videos: ReelItem[];
  initialVideoIndex?: number;
  onVideoUpdate?: (videoId: number, updates: Partial<ReelItem>) => void;
}

const ReelVideoModal: React.FC<ReelVideoModalProps> = ({
  isOpen,
  onClose,
  videos,
  initialVideoIndex = 0,
  onVideoUpdate,
}) => {
  const [currentVideoIndex, setCurrentVideoIndex] = useState(initialVideoIndex);
  const [isMuted, setIsMuted] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const videoRefs = useRef<{ [key: number]: HTMLVideoElement | null }>({});
  const containerRef = useRef<HTMLDivElement>(null);
  const viewedVideoIdsRef = useRef<Set<number>>(new Set());
  const manuallyPausedVideoIdsRef = useRef<Set<number>>(new Set());
  const controlsTimeoutRef = useRef<number | null>(null);
  const [playingVideoId, setPlayingVideoId] = useState<number | null>(null);
  const [optionsMenuOpen, setOptionsMenuOpen] = useState(false);
  const [selectedVideoForOptions, setSelectedVideoForOptions] = useState<
    number | null
  >(null);
  const [closedCaptionsEnabled, setClosedCaptionsEnabled] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [commentModalOpen, setCommentModalOpen] = useState(false);
  const [selectedVideoForComments, setSelectedVideoForComments] = useState<
    number | null
  >(null);
  const [actionLoadingIds, setActionLoadingIds] = useState<number[]>([]);

  const currentVideo = videos[currentVideoIndex];
  const currentVideoRef = videoRefs.current[currentVideo?.id || -1];

  const clearControlsTimeout = useCallback(() => {
    if (controlsTimeoutRef.current != null) {
      window.clearTimeout(controlsTimeoutRef.current);
      controlsTimeoutRef.current = null;
    }
  }, []);

  const scheduleControlsHide = useCallback(() => {
    clearControlsTimeout();
    controlsTimeoutRef.current = window.setTimeout(() => {
      setShowControls(false);
    }, 3000);
  }, [clearControlsTimeout]);

  const getVideoById = useCallback(
    (videoId: number) => videos.find((video) => video.id === videoId),
    [videos]
  );

  const runWithVideoLock = useCallback(
    async (videoId: number, action: () => Promise<void>) => {
      if (actionLoadingIds.includes(videoId)) {
        return;
      }

      setActionLoadingIds((previous) => [...previous, videoId]);
      try {
        await action();
      } finally {
        setActionLoadingIds((previous) =>
          previous.filter((id) => id !== videoId)
        );
      }
    },
    [actionLoadingIds]
  );

  const recordView = useCallback(
    async (videoId: number) => {
      if (viewedVideoIdsRef.current.has(videoId)) {
        return;
      }

      viewedVideoIdsRef.current.add(videoId);
      try {
        const response = await reelsApi.recordView(videoId);
        onVideoUpdate?.(videoId, {
          views_count: response.views_count,
          views: response.views,
        });
      } catch (error) {
        viewedVideoIdsRef.current.delete(videoId);
        console.error("Error recording reel view:", error);
      }
    },
    [onVideoUpdate]
  );

  useEffect(() => {
    if (isOpen) {
      setCurrentVideoIndex(initialVideoIndex);
      setIsMuted(false);
      setShowControls(true);
      manuallyPausedVideoIdsRef.current.clear();
      clearControlsTimeout();
    }
  }, [clearControlsTimeout, initialVideoIndex, isOpen]);

  useEffect(() => {
    return () => {
      clearControlsTimeout();
    };
  }, [clearControlsTimeout]);

  useEffect(() => {
    if (
      isOpen &&
      currentVideoRef &&
      currentVideo &&
      !manuallyPausedVideoIdsRef.current.has(currentVideo.id)
    ) {
      Object.values(videoRefs.current).forEach((video) => {
        if (video) {
          video.pause();
        }
      });

      const playPromise = currentVideoRef.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            setPlayingVideoId(currentVideo.id);
            setShowControls(true);
            recordView(currentVideo.id);
            scheduleControlsHide();
          })
          .catch((error) => {
            console.log("Auto-play prevented:", error);
            setPlayingVideoId(null);
            setShowControls(true);
          });
      }
    }
  }, [
    currentVideo,
    currentVideoRef,
    currentVideoIndex,
    isOpen,
    recordView,
    scheduleControlsHide,
  ]);

  const handleVideoEnd = useCallback(() => {
    if (currentVideoIndex < videos.length - 1) {
      const nextIndex = currentVideoIndex + 1;
      const nextVideo = videos[nextIndex];

      const nextVideoElement = containerRef.current?.querySelector(
        `[data-video-id="${nextVideo.id}"]`
      );
      if (nextVideoElement && containerRef.current) {
        nextVideoElement.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
        setTimeout(() => {
          setCurrentVideoIndex(nextIndex);
        }, 100);
      } else {
        setCurrentVideoIndex(nextIndex);
      }
    }
  }, [currentVideoIndex, videos]);

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

            if (
              video &&
              playingVideoId !== videoId &&
              !manuallyPausedVideoIdsRef.current.has(videoId)
            ) {
              Object.values(videoRefs.current).forEach((item) => {
                if (item) item.pause();
              });

              video
                .play()
                .then(() => {
                  setPlayingVideoId(videoId);
                  setShowControls(true);
                  recordView(videoId);
                  scheduleControlsHide();
                })
                .catch((error) => {
                  console.log("Auto-play prevented on scroll:", error);
                  setPlayingVideoId(null);
                  setShowControls(true);
                });

              const index = videos.findIndex((item) => item.id === videoId);
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

    const videoItems = containerRef.current.querySelectorAll(
      ".reel-video-modal__video-item"
    );
    videoItems.forEach((item) => observer.observe(item));

    return () => {
      observer.disconnect();
    };
  }, [isOpen, playingVideoId, recordView, scheduleControlsHide, videos]);

  const handlePlayPause = (videoId: number) => {
    const video = videoRefs.current[videoId];
    if (!video) {
      return;
    }

    if (video.paused) {
      manuallyPausedVideoIdsRef.current.delete(videoId);
      Object.values(videoRefs.current).forEach((item) => {
        if (item) item.pause();
      });
      video
        .play()
        .then(() => {
          setPlayingVideoId(videoId);
          setShowControls(true);
          recordView(videoId);
          scheduleControlsHide();
        })
        .catch((error) => {
          console.error("Error playing video:", error);
          setShowControls(true);
        });
      return;
    }

    clearControlsTimeout();
    manuallyPausedVideoIdsRef.current.add(videoId);
    video.pause();
    setPlayingVideoId(null);
    setShowControls(true);
  };

  const handleMuteToggle = () => {
    const newMutedState = !isMuted;
    setIsMuted(newMutedState);
    Object.values(videoRefs.current).forEach((video) => {
      if (video) {
        video.muted = newMutedState;
      }
    });
  };

  const handleVideoClick = (videoId: number) => {
    handlePlayPause(videoId);
  };

  const handleLike = async (videoId: number) => {
    const video = getVideoById(videoId);
    if (!video) {
      return;
    }

    await runWithVideoLock(videoId, async () => {
      const response = await reelsApi.toggleLike(videoId, video.user_reacted);
      onVideoUpdate?.(videoId, {
        user_reacted: response.liked,
        reactions_count: response.reactions_count,
      });
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

  const handleSaveVideo = async (videoId: number) => {
    const video = getVideoById(videoId);
    if (!video) {
      return;
    }

    await runWithVideoLock(videoId, async () => {
      const response = await reelsApi.toggleSave(videoId, !video.user_saved);
      onVideoUpdate?.(videoId, {
        user_saved: response.saved,
      });
    });
  };

  const handleRemix = (videoId: number) => {
    const video = getVideoById(videoId);
    alert(
      `Remix feature coming soon! This will allow you to create a remix of "${
        video?.title || "this reel"
      }".`
    );
  };

  const handleSequence = (videoId: number) => {
    const video = getVideoById(videoId);
    alert(
      `Sequence feature coming soon! This will allow you to create a sequence with "${
        video?.title || "this reel"
      }".`
    );
  };

  const handleToggleClosedCaptions = () => {
    setClosedCaptionsEnabled((previous) => {
      const nextState = !previous;
      Object.values(videoRefs.current).forEach((video) => {
        if (video && video.textTracks) {
          for (let index = 0; index < video.textTracks.length; index += 1) {
            const track = video.textTracks[index];
            track.mode = nextState ? "showing" : "hidden";
          }
        }
      });
      return nextState;
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
        .catch((error) => {
          console.error("Error attempting to enable fullscreen:", error);
          alert("Fullscreen mode is not supported by your browser");
        });
    } else {
      document
        .exitFullscreen()
        .then(() => {
          setIsFullscreen(false);
        })
        .catch((error) => {
          console.error("Error attempting to exit fullscreen:", error);
        });
    }
  };

  const handleInterested = async (videoId: number) => {
    const video = getVideoById(videoId);
    if (!video) {
      return;
    }

    await runWithVideoLock(videoId, async () => {
      const response = await reelsApi.setPreference(
        videoId,
        video.user_preference === "interested" ? null : "interested"
      );
      onVideoUpdate?.(videoId, {
        user_preference: response.preference,
      });
    });
  };

  const handleNotInterested = async (videoId: number) => {
    const video = getVideoById(videoId);
    if (!video) {
      return;
    }

    await runWithVideoLock(videoId, async () => {
      const response = await reelsApi.setPreference(
        videoId,
        video.user_preference === "not_interested" ? null : "not_interested"
      );
      onVideoUpdate?.(videoId, {
        user_preference: response.preference,
      });
    });
  };

  const handleReport = async (videoId: number) => {
    const video = getVideoById(videoId);
    const confirmed = window.confirm(
      `Report "${video?.title || "this reel"}" for review?`
    );
    if (!confirmed) {
      return;
    }

    const reason = window.prompt(
      "Optional: tell us why you are reporting this reel.",
      ""
    );

    await runWithVideoLock(videoId, async () => {
      await reelsApi.reportReel(videoId, reason || undefined);
      alert("Thanks. Your report has been submitted.");
    });
  };

  const handleManagePreferences = () => {
    alert(
      "Content preferences management is still coming soon. For now, you can mark reels as Interested or Not Interested."
    );
  };

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
    const video = getVideoById(videoId);
    if (!video) {
      return;
    }

    await runWithVideoLock(videoId, async () => {
      await reelsApi.shareReel(videoId);
      onVideoUpdate?.(videoId, {
        shares_count: (video.shares_count || 0) + 1,
        user_shared: true,
      });

      const shareUrl = `${window.location.origin}/reels`;
      const shareData = {
        title: video.title || "Check out this reel!",
        text: `Watch this reel: ${video.title || "Reel"}`,
        url: shareUrl,
      };

      try {
        if (navigator.share) {
          await navigator.share(shareData);
        } else {
          await navigator.clipboard.writeText(shareUrl);
          alert("Link copied to clipboard!");
        }
      } catch (error) {
        console.log("Share cancelled or failed:", error);
      }
    });
  };

  const handleOpenOptions = (videoId: number) => {
    setSelectedVideoForOptions(videoId);
    setOptionsMenuOpen(true);
  };

  const handleCloseOptions = () => {
    setOptionsMenuOpen(false);
    setSelectedVideoForOptions(null);
  };

  const handleOverlayClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget) {
      onClose();
    }
  };

  if (!isOpen || videos.length === 0) return null;

  const selectedVideoForOptionsData = selectedVideoForOptions
    ? getVideoById(selectedVideoForOptions)
    : null;

  return (
    <div className="reel-video-modal-overlay" onClick={handleOverlayClick}>
      <div className="reel-video-modal" onClick={(event) => event.stopPropagation()}>
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
            const videoUrl = video.video_url || video.videoUrl;
            const isPlaying = playingVideoId === video.id;

            return (
              <div
                key={video.id}
                data-video-id={video.id}
                className="reel-video-modal__video-item"
              >
                <div className="reel-video-modal__video-container">
                  <video
                    ref={(element) => {
                      videoRefs.current[video.id] = element;
                    }}
                    src={videoUrl || undefined}
                    className="reel-video-modal__video"
                    poster={video.thumbnail_url || video.thumbnailUrl || undefined}
                    onClick={(event) => {
                      event.stopPropagation();
                      handleVideoClick(video.id);
                    }}
                    onEnded={() => {
                      if (playingVideoId === video.id && index < videos.length - 1) {
                        handleVideoEnd();
                      }
                    }}
                    muted={isMuted}
                    playsInline
                    loop={false}
                  />

                  <div className="reel-video-modal__actions">
                    <button
                      className={`reel-video-modal__action-btn ${
                        video.user_reacted
                          ? "reel-video-modal__action-btn--liked"
                          : ""
                      }`}
                      onClick={(event) => {
                        event.stopPropagation();
                        void handleLike(video.id);
                      }}
                      aria-label="Like"
                      disabled={actionLoadingIds.includes(video.id)}
                    >
                      <Heart
                        size={28}
                        fill={video.user_reacted ? "#e91e63" : "none"}
                        color={video.user_reacted ? "#e91e63" : "white"}
                      />
                      <span className="reel-video-modal__action-count">
                        {video.reactions_count || 0}
                      </span>
                    </button>

                    <button
                      className="reel-video-modal__action-btn"
                      onClick={(event) => {
                        event.stopPropagation();
                        handleComment(video.id);
                      }}
                      aria-label="Comment"
                    >
                      <MessageSquare size={28} color="white" />
                      <span className="reel-video-modal__action-count">
                        {video.comments_count || 0}
                      </span>
                    </button>

                    <button
                      className="reel-video-modal__action-btn"
                      onClick={(event) => {
                        event.stopPropagation();
                        void handleShare(video.id);
                      }}
                      aria-label="Share"
                      disabled={actionLoadingIds.includes(video.id)}
                    >
                      <Share2 size={28} color="white" />
                      <span className="reel-video-modal__action-count">
                        {video.shares_count || 0}
                      </span>
                    </button>

                    <button
                      className="reel-video-modal__action-btn"
                      onClick={(event) => {
                        event.stopPropagation();
                        handleOpenOptions(video.id);
                      }}
                      aria-label="More options"
                      type="button"
                    >
                      <MoreVertical size={28} color="white" />
                    </button>
                  </div>

                  {showControls && (
                    <div className="reel-video-modal__controls">
                      <button
                        className="reel-video-modal__control-btn"
                        onClick={(event) => {
                          event.stopPropagation();
                          handlePlayPause(video.id);
                        }}
                        aria-label={isPlaying ? "Pause" : "Play"}
                      >
                        {isPlaying ? <Pause size={24} /> : <Play size={24} />}
                      </button>
                      <button
                        className="reel-video-modal__control-btn"
                        onClick={(event) => {
                          event.stopPropagation();
                          handleMuteToggle();
                        }}
                        aria-label={isMuted ? "Unmute" : "Mute"}
                      >
                        {isMuted ? <VolumeX size={24} /> : <Volume2 size={24} />}
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

      <ReelOptionsMenu
        isOpen={optionsMenuOpen}
        onClose={handleCloseOptions}
        videoId={selectedVideoForOptions || 0}
        isSaved={Boolean(selectedVideoForOptionsData?.user_saved)}
        isInterested={selectedVideoForOptionsData?.user_preference === "interested"}
        isNotInterested={
          selectedVideoForOptionsData?.user_preference === "not_interested"
        }
        closedCaptionsEnabled={closedCaptionsEnabled}
        isFullscreen={isFullscreen}
        onSave={() => {
          if (selectedVideoForOptions) {
            void handleSaveVideo(selectedVideoForOptions);
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
            void handleInterested(selectedVideoForOptions);
          }
        }}
        onNotInterested={() => {
          if (selectedVideoForOptions) {
            void handleNotInterested(selectedVideoForOptions);
          }
        }}
        onReport={() => {
          if (selectedVideoForOptions) {
            void handleReport(selectedVideoForOptions);
          }
        }}
        onManagePreferences={handleManagePreferences}
      />

      <ReelCommentModal
        isOpen={commentModalOpen}
        onClose={handleCloseCommentModal}
        videoId={selectedVideoForComments || 0}
        videoTitle={
          selectedVideoForComments
            ? videos.find((video) => video.id === selectedVideoForComments)?.title
            : undefined
        }
        onCommentAdded={() => {
          if (selectedVideoForComments) {
            const selectedVideo = getVideoById(selectedVideoForComments);
            onVideoUpdate?.(selectedVideoForComments, {
              comments_count: (selectedVideo?.comments_count || 0) + 1,
            });
          }
        }}
      />
    </div>
  );
};

export default ReelVideoModal;
