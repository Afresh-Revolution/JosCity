import React, { useState, useRef, useEffect } from "react";
import { Scissors, Play, Pause } from "lucide-react";

interface VideoTrimmerProps {
  videoSrc: string;
  maxDuration: number; // in seconds (60 for 1 minute)
  onTrimmed: (trimmedBlob: Blob, startTime: number, endTime: number) => void;
  onCancel: () => void;
}

const VideoTrimmer: React.FC<VideoTrimmerProps> = ({
  videoSrc,
  maxDuration = 60,
  onTrimmed,
  onCancel,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [startTime, setStartTime] = useState(0);
  const [endTime, setEndTime] = useState(maxDuration);
  const [isTrimming, setIsTrimming] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => {
      const current = video.currentTime;
      setCurrentTime(current);
      
      // Stop at end time
      if (current >= endTime) {
        video.pause();
        setIsPlaying(false);
        video.currentTime = endTime;
      }
      
      // Don't allow seeking before start time
      if (current < startTime) {
        video.currentTime = startTime;
      }
    };

    video.addEventListener("timeupdate", handleTimeUpdate);

    return () => {
      video.removeEventListener("timeupdate", handleTimeUpdate);
    };
  }, [startTime, endTime]);

  const handlePlayPause = () => {
    const video = videoRef.current;
    if (!video) return;

    if (isPlaying) {
      video.pause();
    } else {
      if (video.currentTime >= endTime) {
        video.currentTime = startTime;
      }
      video.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const video = videoRef.current;
    if (!video) return;

    const newTime = parseFloat(e.target.value);
    if (newTime >= startTime && newTime <= endTime) {
      video.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  const handleStartTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newStartTime = parseFloat(e.target.value);
    if (newStartTime < endTime) {
      setStartTime(newStartTime);
      if (videoRef.current) {
        videoRef.current.currentTime = newStartTime;
      }
    }
  };

  const handleEndTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newEndTime = parseFloat(e.target.value);
    if (newEndTime > startTime && newEndTime <= duration) {
      setEndTime(newEndTime);
      if (videoRef.current && videoRef.current.currentTime > newEndTime) {
        videoRef.current.currentTime = newEndTime;
      }
    }
  };

  const handleTrim = async () => {
    const video = videoRef.current;
    if (!video) return;

    setIsTrimming(true);

    try {
      // For now, we'll use a simpler approach: just validate duration
      // In a production app, you'd use FFmpeg.wasm or a backend service for actual trimming
      // For client-side, we'll create a trimmed version using canvas and MediaRecorder
      
      // Check if browser supports MediaRecorder
      if (!MediaRecorder.isTypeSupported("video/webm")) {
        // Fallback: just use the original video with time constraints
        const response = await fetch(videoSrc);
        const blob = await response.blob();
        onTrimmed(blob, startTime, endTime);
        setIsTrimming(false);
        return;
      }

      // Create a new video element for processing
      const sourceVideo = document.createElement("video");
      sourceVideo.src = videoSrc;
      sourceVideo.currentTime = startTime;
      sourceVideo.muted = true; // Required for autoplay in some browsers
      
      await new Promise<void>((resolve) => {
        sourceVideo.addEventListener("loadeddata", () => resolve(), { once: true });
        sourceVideo.load();
      });

      await new Promise((resolve) => setTimeout(resolve, 100));

      const canvas = canvasRef.current;
      if (!canvas) {
        throw new Error("Canvas not available");
      }

      canvas.width = sourceVideo.videoWidth;
      canvas.height = sourceVideo.videoHeight;

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        throw new Error("Could not get canvas context");
      }

      // Create MediaRecorder
      const stream = canvas.captureStream(30);
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: "video/webm",
      });

      const chunks: Blob[] = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.push(e.data);
        }
      };

      await new Promise<void>((resolve, reject) => {
        mediaRecorder.onstop = () => {
          const trimmedBlob = new Blob(chunks, { type: "video/webm" });
          onTrimmed(trimmedBlob, startTime, endTime);
          setIsTrimming(false);
          resolve();
        };

        mediaRecorder.onerror = () => {
          setIsTrimming(false);
          reject(new Error("Error trimming video"));
        };

        // Start recording
        mediaRecorder.start();

        // Draw frames
        sourceVideo.currentTime = startTime;
        
        const playPromise = sourceVideo.play();
        if (playPromise !== undefined) {
          playPromise.catch(() => {
            // If autoplay fails, try with user interaction
            setIsTrimming(false);
            reject(new Error("Could not play video for trimming"));
          });
        }

        const drawFrame = () => {
          if (sourceVideo.currentTime < endTime && !sourceVideo.paused) {
            ctx.drawImage(sourceVideo, 0, 0, canvas.width, canvas.height);
            requestAnimationFrame(drawFrame);
          } else {
            sourceVideo.pause();
            mediaRecorder.stop();
          }
        };

        sourceVideo.addEventListener("play", () => {
          drawFrame();
        }, { once: true });
      });
    } catch (error) {
      console.error("Error trimming video:", error);
      // Fallback: use original video if trimming fails
      try {
        const response = await fetch(videoSrc);
        const blob = await response.blob();
        onTrimmed(blob, startTime, endTime);
      } catch (fetchError) {
        console.error("Error fetching video:", fetchError);
        alert("Error processing video. Please try again.");
      }
      setIsTrimming(false);
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // Initialize video duration when component mounts or video changes
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !videoSrc) return;

    const handleLoadedMetadata = () => {
      const videoDuration = video.duration;
      setDuration(videoDuration);
      
      // If video is longer than max duration, set end time to max duration
      if (videoDuration > maxDuration) {
        setEndTime(maxDuration);
      } else {
        setEndTime(videoDuration);
      }
    };

    video.addEventListener("loadedmetadata", handleLoadedMetadata);
    video.load(); // Trigger loading

    return () => {
      video.removeEventListener("loadedmetadata", handleLoadedMetadata);
    };
  }, [videoSrc, maxDuration]);

  const trimDuration = endTime - startTime;
  const exceedsMax = duration > maxDuration;

  return (
    <div className="video-trimmer">
      <div className="video-trimmer__preview">
        <video
          ref={videoRef}
          src={videoSrc}
          style={{ width: "100%", maxHeight: "400px", borderRadius: "8px" }}
          onLoadedMetadata={() => {
            if (videoRef.current) {
              const videoDuration = videoRef.current.duration;
              setDuration(videoDuration);
              if (videoDuration > maxDuration) {
                setEndTime(maxDuration);
              } else {
                setEndTime(videoDuration);
              }
            }
          }}
        />
        <canvas ref={canvasRef} style={{ display: "none" }} />
      </div>

      {exceedsMax && (
        <div className="video-trimmer__warning">
          <p>Video is {formatTime(duration)} long. Maximum allowed: {formatTime(maxDuration)}. Please trim to continue.</p>
        </div>
      )}

      <div className="video-trimmer__controls">
        <div className="video-trimmer__play-controls">
          <button
            className="video-trimmer__play-btn"
            onClick={handlePlayPause}
            disabled={isTrimming}
          >
            {isPlaying ? <Pause size={20} /> : <Play size={20} />}
          </button>
          <span className="video-trimmer__time">
            {formatTime(currentTime)} / {formatTime(endTime)}
          </span>
        </div>

        <div className="video-trimmer__range-controls">
          <div className="video-trimmer__range-group">
            <label>Start: {formatTime(startTime)}</label>
            <input
              type="range"
              min="0"
              max={duration}
              step="0.1"
              value={startTime}
              onChange={handleStartTimeChange}
              disabled={isTrimming}
            />
          </div>

          <div className="video-trimmer__range-group">
            <label>End: {formatTime(endTime)}</label>
            <input
              type="range"
              min={startTime}
              max={duration}
              step="0.1"
              value={endTime}
              onChange={handleEndTimeChange}
              disabled={isTrimming}
            />
          </div>

          <div className="video-trimmer__range-group">
            <label>Seek</label>
            <input
              type="range"
              min={startTime}
              max={endTime}
              step="0.1"
              value={currentTime}
              onChange={handleSeek}
              disabled={isTrimming}
            />
          </div>
        </div>

        <div className="video-trimmer__info">
          <p>Trimmed duration: {formatTime(trimDuration)}</p>
          {exceedsMax && trimDuration > maxDuration && (
            <p className="video-trimmer__error">
              Trimmed video must be {formatTime(maxDuration)} or less
            </p>
          )}
        </div>

        <div className="video-trimmer__actions">
          <button
            className="video-trimmer__cancel-btn"
            onClick={onCancel}
            disabled={isTrimming}
          >
            Cancel
          </button>
          <button
            className="video-trimmer__trim-btn"
            onClick={handleTrim}
            disabled={isTrimming || (exceedsMax && trimDuration > maxDuration)}
          >
            {isTrimming ? (
              "Trimming..."
            ) : (
              <>
                <Scissors size={16} />
                Trim Video
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default VideoTrimmer;

