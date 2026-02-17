import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import "./Intro.css";

// Video paths - Vite serves files from /public folder at root as static assets
// If videos are in src/public/, they need to be moved to root-level public/ folder
const VIDEO_PATHS = {
  original: "/intro.mp4",
  hd: "/intro_720.mp4",
  sd: "/intro_480.mp4",
};

const Intro = ({ onComplete }) => {
  const [videoSrc, setVideoSrc] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const videoRef = useRef(null);
  const navigate = useNavigate();

  // Detect connection speed and select appropriate video
  useEffect(() => {
    const detectConnectionSpeed = async () => {
      try {
        // Check if Network Information API is available
        const connection =
          navigator.connection ||
          navigator.mozConnection ||
          navigator.webkitConnection;

        let videoFile = VIDEO_PATHS.original; // Default to highest quality

        if (connection) {
          // Use effectiveType if available (4g, 3g, 2g, slow-2g)
          const effectiveType = connection.effectiveType;
          const downlink = connection.downlink; // Mbps

          if (
            effectiveType === "slow-2g" ||
            effectiveType === "2g" ||
            downlink < 1
          ) {
            // Very slow connection - use 480p
            videoFile = VIDEO_PATHS.sd;
          } else if (
            effectiveType === "3g" ||
            (downlink >= 1 && downlink < 3)
          ) {
            // Medium connection - use 720p
            videoFile = VIDEO_PATHS.hd;
          } else {
            // Fast connection (4g or better) - use original quality
            videoFile = VIDEO_PATHS.original;
          }
        } else {
          // Fallback: Test download speed with a small image
          try {
            const startTime = performance.now();
            const testImage = new Image();
            testImage.src = "/favicon.ico?" + new Date().getTime();

            await new Promise((resolve, reject) => {
              testImage.onload = resolve;
              testImage.onerror = resolve; // Continue even if image fails
              setTimeout(resolve, 2000); // Timeout after 2 seconds
            });

            const endTime = performance.now();
            const duration = (endTime - startTime) / 1000; // seconds

            // Rough estimate: if loading takes more than 1 second, use lower quality
            if (duration > 1.5) {
              videoFile = VIDEO_PATHS.sd;
            } else if (duration > 0.8) {
              videoFile = VIDEO_PATHS.hd;
            }
          } catch (e) {
            // If test fails, default to 720p for safety
            videoFile = VIDEO_PATHS.hd;
          }
        }

        setVideoSrc(videoFile);
        setLoading(false);
      } catch (err) {
        console.error("Error detecting connection speed:", err);
        // Default to 720p on error
        setVideoSrc(VIDEO_PATHS.hd);
        setLoading(false);
      }
    };

    detectConnectionSpeed();
  }, []);

  const handleVideoEnd = () => {
    // Mark intro as watched
    localStorage.setItem("introWatched", "true");
    if (onComplete) {
      onComplete();
    } else {
      navigate("/complete-profile");
    }
  };

  const handleSkip = () => {
    // Mark intro as watched
    localStorage.setItem("introWatched", "true");
    if (videoRef.current) {
      videoRef.current.pause();
    }
    if (onComplete) {
      onComplete();
    } else {
      navigate("/complete-profile");
    }
  };

  const handleVideoError = () => {
    setError("Failed to load video. Redirecting...");
    setTimeout(() => {
      handleSkip();
    }, 2000);
  };

  if (loading) {
    return (
      <div className="intro-container">
        <div className="intro-loading">
          <div className="loading-spinner"></div>
          <p>Loading intro video...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="intro-container">
        <div className="intro-error">
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="intro-container">
      <div className="intro-overlay">
        <button className="intro-skip-btn" onClick={handleSkip}>
          Skip
        </button>
        <video
          ref={videoRef}
          className="intro-video"
          src={videoSrc}
          autoPlay
          muted
          playsInline
          onEnded={handleVideoEnd}
          onError={handleVideoError}
        >
          Your browser does not support the video tag.
        </video>
      </div>
    </div>
  );
};

export default Intro;
