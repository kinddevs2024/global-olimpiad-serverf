import { useEffect, useRef, useState } from 'react';
import { olympiadAPI } from '../services/api';
import { VIDEO_WIDTH, VIDEO_HEIGHT, API_BASE_URL, CAMERA_CAPTURE_INTERVAL } from '../utils/constants';
import { generateVideoFilename, generateExitScreenshotFilename } from '../utils/helpers';
import './ProctoringMonitor.css';

const ProctoringMonitor = ({ olympiadId, userId, olympiadTitle, onRecordingStatusChange, onProctoringStatusChange, onFaceStatusChange }) => {
  const cameraVideoRef = useRef(null);
  const screenVideoRef = useRef(null);
  
  const [cameraActive, setCameraActive] = useState(false);
  const [screenActive, setScreenActive] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const [screenError, setScreenError] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [faceDetected, setFaceDetected] = useState(false);
  const [faceCheckReady, setFaceCheckReady] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({ camera: 0, screen: 0 });
  const [uploadStatus, setUploadStatus] = useState('');
  const [consentGiven, setConsentGiven] = useState(false);
  
  const cameraStreamRef = useRef(null);
  const screenStreamRef = useRef(null);
  const cameraRecorderRef = useRef(null);
  const screenRecorderRef = useRef(null);
  const cameraChunksRef = useRef([]);
  const screenChunksRef = useRef([]);
  const exitScreenshotSentRef = useRef(false);
  const canvasRef = useRef(null);
  const realTimeCaptureIntervalRef = useRef(null);
  const captureCanvasRef = useRef(null);
  const faceMeshRef = useRef(null);
  const faceDetectionRafRef = useRef(null);
  const faceMissingSinceRef = useRef(null);
  const monitoringStartedRef = useRef(false);

  const FACE_MISSING_GRACE_MS = 2000;

  const uploadVideo = async (type, chunks) => {
    try {
      setUploadStatus(`Uploading ${type} video...`);

      // Combine all chunks into a single blob
      const videoBlob = new Blob(chunks, {
        type: 'video/webm'
      });

      // Create File object from blob
      // Generate filename: {userId}_{date}_{olympiad-name}_{type}.webm
      const filename = generateVideoFilename(
        userId || 'unknown-user',
        olympiadTitle || `Olympiad-${olympiadId}`,
        type,
        new Date()
      );
      const videoFile = new File([videoBlob], filename, { type: 'video/webm' });

      // Create FormData
      const formData = new FormData();
      formData.append('video', videoFile);
      formData.append('olympiadId', olympiadId);
      formData.append('videoType', type); // 'camera' or 'screen'

      // Upload video with progress tracking
      await olympiadAPI.uploadVideo(formData, (progress) => {
        setUploadProgress(prev => ({
          ...prev,
          [type]: progress
        }));
      });

      // Clear chunks after successful upload
      if (type === 'camera') {
        cameraChunksRef.current = [];
      } else {
        screenChunksRef.current = [];
      }

    } catch (error) {
      console.error(`Error uploading ${type} video:`, error);
      throw error;
    }
  };

  const handleRecordingComplete = async () => {
    setIsUploading(true);
    setUploadProgress({ camera: 0, screen: 0 });

    try {
      const uploadPromises = [];

      // Upload camera video if available
      if (cameraChunksRef.current.length > 0) {
        uploadPromises.push(uploadVideo('camera', cameraChunksRef.current));
      }

      // Upload screen video if available
      if (screenChunksRef.current.length > 0) {
        uploadPromises.push(uploadVideo('screen', screenChunksRef.current));
      }

      // Upload both videos in parallel
      if (uploadPromises.length > 0) {
        await Promise.all(uploadPromises);
        setUploadStatus('Upload complete');
      } else {
        console.warn('No video chunks to upload');
        setUploadStatus('No videos recorded');
      }

    } catch (error) {
      console.error('Error uploading videos:', error);
      setUploadStatus('Upload failed');
      alert('Connection failed. Please try again.');
    } finally {
      setTimeout(() => {
        setIsUploading(false);
        setUploadProgress({ camera: 0, screen: 0 });
        setUploadStatus('');
      }, 2000);
    }
  };

  const stopRecording = () => {
    setIsRecording(false);

    // Stop real-time capture sending
    if (realTimeCaptureIntervalRef.current) {
      clearInterval(realTimeCaptureIntervalRef.current);
      realTimeCaptureIntervalRef.current = null;
    }

    // Notify parent that recording stopped
    if (onRecordingStatusChange) {
      onRecordingStatusChange(false);
    }

    // Stop camera recording
    if (cameraRecorderRef.current && cameraRecorderRef.current.state !== 'inactive') {
      cameraRecorderRef.current.stop();
    }

    // Stop screen recording
    if (screenRecorderRef.current && screenRecorderRef.current.state !== 'inactive') {
      screenRecorderRef.current.stop();
    }

    // Wait a bit for recording to finalize, then upload
    setTimeout(() => {
      handleRecordingComplete();
    }, 1000);
  };

  const isMobileDevice = () => {
    if (typeof navigator === 'undefined') return false;
    return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent || '');
  };

  const getScreenShareSupportMessage = () => {
    if (isMobileDevice()) {
      return 'Screen sharing is not supported on this mobile device/browser. Use a desktop browser, or Chrome/Edge on Android with screen sharing support.';
    }
    return 'Screen sharing is not supported on this browser. Use a desktop browser that supports screen sharing.';
  };

  const startCameraRecording = () => {
    const stream = cameraStreamRef.current;
    if (!stream) return;

    cameraChunksRef.current = [];

    // Check if MediaRecorder is supported
    if (!MediaRecorder.isTypeSupported('video/webm')) {
      console.error('MediaRecorder with webm not supported');
      return;
    }

    try {
      // Create MediaRecorder for camera stream
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'video/webm;codecs=vp9',
        videoBitsPerSecond: 2500000 // 2.5 Mbps for 720p
      });

      cameraRecorderRef.current = mediaRecorder;

      // Collect video chunks
      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          cameraChunksRef.current.push(event.data);
        }
      };

      // Start recording
      mediaRecorder.start(1000); // Collect data every 1 second

    } catch (error) {
      console.error('Error starting camera MediaRecorder:', error);
    }
  };

  const startScreenRecording = () => {
    const stream = screenStreamRef.current;
    if (!stream) return;

    screenChunksRef.current = [];

    // Check if MediaRecorder is supported
    if (!MediaRecorder.isTypeSupported('video/webm')) {
      console.error('MediaRecorder with webm not supported');
      return;
    }

    try {
      // Create MediaRecorder for screen stream
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'video/webm;codecs=vp9',
        videoBitsPerSecond: 2500000 // 2.5 Mbps for 720p
      });

      screenRecorderRef.current = mediaRecorder;

      // Collect video chunks
      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          screenChunksRef.current.push(event.data);
        }
      };

      // Start recording
      mediaRecorder.start(1000); // Collect data every 1 second

    } catch (error) {
      console.error('Error starting screen MediaRecorder:', error);
    }
  };

  // Helper function to convert data URL to blob
  const dataURLtoBlob = (dataURL) => {
    const byteString = atob(dataURL.split(',')[1]);
    const mimeString = dataURL.split(',')[0].split(':')[1].split(';')[0];
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    for (let i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
    }
    return new Blob([ab], { type: mimeString });
  };

  const sendRealTimeCapture = async () => {
    if (!cameraVideoRef.current || !screenVideoRef.current) return;
    if (!isRecording) return;

    try {
      if (!captureCanvasRef.current) {
        captureCanvasRef.current = document.createElement('canvas');
        captureCanvasRef.current.width = VIDEO_WIDTH;
        captureCanvasRef.current.height = VIDEO_HEIGHT;
      }

      const canvas = captureCanvasRef.current;
      const ctx = canvas.getContext('2d');

      // Capture camera frame
      let cameraDataURL = null;
      if (cameraVideoRef.current && cameraVideoRef.current.readyState >= 2) {
        ctx.drawImage(cameraVideoRef.current, 0, 0, canvas.width, canvas.height);
        cameraDataURL = canvas.toDataURL('image/jpeg', 0.7);
      }

      // Capture screen frame
      let screenDataURL = null;
      if (screenVideoRef.current && screenVideoRef.current.readyState >= 2) {
        ctx.drawImage(screenVideoRef.current, 0, 0, canvas.width, canvas.height);
        screenDataURL = canvas.toDataURL('image/jpeg', 0.7);
      }

      if (!cameraDataURL && !screenDataURL) return;

      // Convert data URLs to blobs
      const formData = new FormData();
      formData.append('olympiadId', olympiadId);
      formData.append('timestamp', new Date().toISOString());

      if (cameraDataURL) {
        const cameraBlob = dataURLtoBlob(cameraDataURL);
        formData.append('cameraImage', cameraBlob, 'camera.jpg');
      }

      if (screenDataURL) {
        const screenBlob = dataURLtoBlob(screenDataURL);
        formData.append('screenImage', screenBlob, 'screen.jpg');
      }

      // Get token from localStorage
      const token = localStorage.getItem('token');
      if (!token) return;

      // Send to backend (fire and forget - don't wait for response)
      fetch(`${API_BASE_URL}/olympiads/real-time-capture`, {
        method: 'POST',
        body: formData,
        headers: {
          'Authorization': `Bearer ${token}`
        },
        keepalive: true
      }).catch(error => {
        console.error('Error sending real-time capture:', error);
      });

    } catch (error) {
      console.error('Error in sendRealTimeCapture:', error);
    }
  };

  // Send real-time captures to backend
  const startRealTimeCaptureSending = () => {
    // Clear any existing interval
    if (realTimeCaptureIntervalRef.current) {
      clearInterval(realTimeCaptureIntervalRef.current);
    }

    // Create canvas for captures if not exists
    if (!captureCanvasRef.current) {
      captureCanvasRef.current = document.createElement('canvas');
      captureCanvasRef.current.width = VIDEO_WIDTH;
      captureCanvasRef.current.height = VIDEO_HEIGHT;
    }

    // Send captures periodically
    realTimeCaptureIntervalRef.current = setInterval(() => {
      sendRealTimeCapture();
    }, CAMERA_CAPTURE_INTERVAL || 1000); // Send every 1 second
  };

  const startMonitoring = async (isUserGesture = false) => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setCameraError('Camera access is not supported on this device/browser.');
      }

      if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) {
        setScreenError(getScreenShareSupportMessage());
      }

      // Start camera
      try {
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
          const cameraStream = await navigator.mediaDevices.getUserMedia({
            video: {
              facingMode: 'user',
              width: { ideal: VIDEO_WIDTH },
              height: { ideal: VIDEO_HEIGHT }
            },
            audio: false
          });

          cameraStreamRef.current = cameraStream;

          if (cameraVideoRef.current) {
            cameraVideoRef.current.srcObject = cameraStream;
            setCameraActive(true);
            setCameraError(null);

            // Notify parent component of proctoring status
            if (onProctoringStatusChange) {
              onProctoringStatusChange({
                frontCameraActive: true,
                backCameraActive: false,
                screenShareActive: screenActive,
                displaySurface: null // Screen not yet active
              });
            }
          }
        }
      } catch (err) {
        setCameraError('Camera access denied');
        console.error('Camera error:', err);
      }

      // Start screen capture - Force full screen sharing
      try {
        if (navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia) {
          const screenStream = await navigator.mediaDevices.getDisplayMedia({
            video: {
              mediaSource: 'screen',
              width: { ideal: VIDEO_WIDTH },
              height: { ideal: VIDEO_HEIGHT }
            },
            audio: false
          });

          screenStreamRef.current = screenStream;

          if (screenVideoRef.current) {
            screenVideoRef.current.srcObject = screenStream;
          }

          // Validate that full screen is being shared (not window/tab)
          const videoTrack = screenStream.getVideoTracks()[0];
          if (!videoTrack) {
            screenStream.getTracks().forEach(track => track.stop());
            screenStreamRef.current = null;
            setScreenError('No screen video track found. Please try sharing your entire screen again.');
            setScreenActive(false);
            return;
          }

          // Check displaySurface property (Screen Capture API)
          const settings = typeof videoTrack.getSettings === 'function' ? videoTrack.getSettings() : {};
          const displaySurface = settings.displaySurface || settings.logicalSurface;

          // displaySurface can be: 'monitor', 'window', 'browser', or 'application'
          // We require 'monitor' for full screen sharing
          if (displaySurface && displaySurface !== 'monitor') {
            // Stop the stream if not full screen
            videoTrack.stop();
            screenStream.getTracks().forEach(track => track.stop());
            screenStreamRef.current = null;
            setScreenError(`Full screen (monitor) sharing required. You selected: ${displaySurface}`);
            setScreenActive(false);
            // Show alert to user
            alert('⚠️ Full screen sharing required!\n\nPlease stop sharing and select "Entire Screen" (monitor) instead of a window, tab, or browser.');

            // Re-request full screen mode if it was lost
            try {
              if (document.fullscreenElement === null) {
                const elem = document.documentElement;
                if (elem.requestFullscreen) {
                  await elem.requestFullscreen();
                } else if (elem.webkitRequestFullscreen) { /* Safari */
                  await elem.webkitRequestFullscreen();
                } else if (elem.msRequestFullscreen) { /* IE11 */
                  await elem.msRequestFullscreen();
                }
              }
            } catch (fsErr) {
              console.warn("Failed to restore full screen:", fsErr);
            }

            return;
          }

          // Wait for video metadata to load and validate dimensions (additional validation)
          await new Promise((resolve) => {
            const checkDimensions = () => {
              if (screenVideoRef.current && screenVideoRef.current.readyState >= 2) {
                const video = screenVideoRef.current;
                const width = video.videoWidth || 0;
                const height = video.videoHeight || 0;

                // Full screen typically has dimensions >= 1200px width
                // Window/tab shares are usually smaller (< 1200px)
                const isFullScreen = width >= 1200 && height >= 800;

                // Check track label for screen indicator
                const trackLabel = videoTrack.label?.toLowerCase() || '';
                const hasScreenInLabel = trackLabel.includes('screen') ||
                                         trackLabel.includes('entire') ||
                                         trackLabel.includes('display');

                // If displaySurface check passed but dimensions suggest it's not full screen, warn
                if (!isFullScreen && !hasScreenInLabel && width > 0 && displaySurface !== 'monitor') {
                  // Stop the stream if not full screen
                  videoTrack.stop();
                  screenStream.getTracks().forEach(track => track.stop());
                  screenStreamRef.current = null;
                  setScreenError('Full screen sharing required. Please select "Entire Screen" option.');
                  setScreenActive(false);
                  // Show alert to user
                  alert('⚠️ Full screen sharing required!\n\nPlease stop sharing and select "Entire Screen" instead of a window or tab.');

                  // Re-request full screen mode if it was lost
                  try {
                    if (document.fullscreenElement === null) {
                      const elem = document.documentElement;
                      if (elem.requestFullscreen) {
                        elem.requestFullscreen().catch(e => console.warn(e));
                      }
                    }
                  } catch (fsErr) {
                    console.warn("Failed to restore full screen:", fsErr);
                  }

                  resolve();
                  return;
                }

                // Validation passed
                setScreenActive(true);
                setScreenError(null);

                // Notify parent component of proctoring status
                if (onProctoringStatusChange) {
                  onProctoringStatusChange({
                    frontCameraActive: cameraActive,
                    backCameraActive: false, // Can be enhanced if back camera is supported
                    screenShareActive: true,
                    displaySurface: displaySurface || 'monitor' // Use detected displaySurface
                  });
                }

                // Re-request full screen mode if it was lost during permission dialog
                try {
                  if (document.fullscreenElement === null) {
                    const elem = document.documentElement;
                    if (elem.requestFullscreen) {
                      elem.requestFullscreen().catch(e => console.warn(e));
                    }
                  }
                } catch (fsErr) {
                  console.warn("Failed to restore full screen:", fsErr);
                }

                resolve();
              } else if (screenVideoRef.current) {
                setTimeout(checkDimensions, 200);
              } else {
                // Video ref not available yet
                setTimeout(checkDimensions, 200);
              }
            };

            // Start checking after a brief delay
            setTimeout(checkDimensions, 500);

            // Timeout after 3 seconds
            setTimeout(() => {
              // If timeout, assume it's okay and proceed
              if (!screenVideoRef.current || screenVideoRef.current.readyState < 2) {
                console.warn('Screen validation timeout, proceeding anyway');
              }
              resolve();
            }, 3000);
          });

          // Handle screen share stop
          if (typeof videoTrack.addEventListener === 'function') {
            videoTrack.addEventListener('ended', () => {
              setScreenError('Screen sharing stopped');
              setScreenActive(false);
              stopRecording();
              if (onRecordingStatusChange) {
                onRecordingStatusChange(false);
              }
            });
          }
        }
      } catch (err) {
        if (err.message === 'Full screen sharing required') {
          // Error already set above
        } else {
          setScreenError('Screen sharing denied or unavailable. Full screen sharing is required.');
        }
        console.error('Screen error:', err);
      }

      // Wait for streams to initialize
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Start recording both videos - both must be active
      let cameraRecordingStarted = false;
      let screenRecordingStarted = false;

      if (cameraStreamRef.current) {
        startCameraRecording();
        cameraRecordingStarted = true;
      }
      if (screenStreamRef.current) {
        startScreenRecording();
        screenRecordingStarted = true;
      }

      // Only start recording when BOTH camera and screen are active
      if (cameraRecordingStarted && screenRecordingStarted) {
        setIsRecording(true);
        // Notify parent that recording started
        if (onRecordingStatusChange) {
          onRecordingStatusChange(true);
        }

        // Start real-time capture sending to backend
        startRealTimeCaptureSending();
      } else {
        // If either is missing, don't start recording
        setIsRecording(false);
        if (onRecordingStatusChange) {
          onRecordingStatusChange(false);
        }
      }

    } catch (error) {
      console.error('Monitoring setup error:', error);
    }
  };

  const beginMonitoring = async (isUserGesture = false) => {
    if (monitoringStartedRef.current) return;
    monitoringStartedRef.current = true;

    try {
      await startMonitoring(isUserGesture);
    } catch (error) {
      monitoringStartedRef.current = false;
      throw error;
    }
  };

  // Function to capture last frame from video element synchronously
  const captureLastFrameSync = (videoElement, type) => {
    if (!videoElement || videoElement.readyState < 2) {
      return null;
    }

    try {
      // Create temporary canvas for capture
      const canvas = document.createElement('canvas');
      const video = videoElement;

      // Set canvas dimensions to match video
      canvas.width = video.videoWidth || VIDEO_WIDTH;
      canvas.height = video.videoHeight || VIDEO_HEIGHT;

      // Draw current video frame to canvas
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Convert to data URL (synchronous)
      const dataURL = canvas.toDataURL('image/jpeg', 0.8);
      
      // Convert data URL to blob synchronously
      const byteString = atob(dataURL.split(',')[1]);
      const mimeString = dataURL.split(',')[0].split(':')[1].split(';')[0];
      const ab = new ArrayBuffer(byteString.length);
      const ia = new Uint8Array(ab);
      for (let i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i);
      }
      const blob = new Blob([ab], { type: mimeString });
      
      // Generate filename: {olympiad-name}_{date}_{time}_exit-{type}.jpg
      const filename = generateExitScreenshotFilename(
        olympiadTitle || `Olympiad-${olympiadId}`,
        type,
        new Date()
      );
      return new File([blob], filename, { type: 'image/jpeg' });
    } catch (error) {
      console.error(`Error capturing ${type} frame:`, error);
      return null;
    }
  };

  // Function to send exit screenshot to backend (synchronous during unload)
  const sendExitScreenshot = (exitType = 'tab_switch') => {
    // Prevent multiple sends
    if (exitScreenshotSentRef.current) {
      return;
    }
    exitScreenshotSentRef.current = true;

    try {
      // Capture last frames from both videos synchronously
      const cameraFrame = cameraVideoRef.current
        ? captureLastFrameSync(cameraVideoRef.current, 'camera')
        : null;
      const screenFrame = screenVideoRef.current
        ? captureLastFrameSync(screenVideoRef.current, 'screen')
        : null;

      if (!cameraFrame && !screenFrame) {
        console.warn('No frames captured for exit screenshot');
        exitScreenshotSentRef.current = false;
        return;
      }

      // Get user info from localStorage
      const user = JSON.parse(localStorage.getItem('user') || 'null');
      const token = localStorage.getItem('token');
      
      if (!token) {
        console.warn('No auth token available for exit screenshot');
        exitScreenshotSentRef.current = false;
        return;
      }

      // Create FormData with all required fields
      const formData = new FormData();
      formData.append('olympiadId', olympiadId);
      formData.append('exitType', exitType); // 'tab_switch', 'close', 'navigate'
      formData.append('timestamp', new Date().toISOString());

      // Add username if available (optional field for backend identification)
      // Backend will use userId from JWT token to save to uploads/users/{userId}/
      if (user) {
        const username = user.email || user.name || user.username || '';
        if (username) {
          formData.append('username', username);
        }
      }

      // Add screenshot images
      if (cameraFrame) {
        formData.append('cameraImage', cameraFrame);
      }
      if (screenFrame) {
        formData.append('screenImage', screenFrame);
      }

      // Use fetch with keepalive for reliable delivery during page unload
      // Backend will save to uploads/users/{userId}/ folder
      const url = `${API_BASE_URL}/olympiads/exit-screenshot`;
      
      // Use fetch with keepalive flag - ensures request completes even if page unloads
      fetch(url, {
        method: 'POST',
        body: formData,
        headers: {
          'Authorization': `Bearer ${token}`
        },
        keepalive: true // Critical: ensures request completes during page unload
      }).then((response) => {
        if (!response.ok) {
          // Ignore 404 errors as the endpoint might not be implemented yet
          if (response.status !== 404) {
            console.warn('Failed to send exit screenshot:', response.statusText);
          }
        }
      }).catch(() => {
        // Silently ignore network errors during unload as they are expected
        // Reset flag on error so it can be retried if page doesn't unload
        exitScreenshotSentRef.current = false;
      });

    } catch (error) {
      console.error('Error in sendExitScreenshot:', error);
      exitScreenshotSentRef.current = false;
    }
  };

  // Detect page visibility changes and exits
  useEffect(() => {
    if (!isRecording || !consentGiven) return;

    let isPageVisible = !document.hidden;
    let visibilityTimeout = null;

    const handleVisibilityChange = () => {
      const currentlyVisible = !document.hidden;

      if (isPageVisible && !currentlyVisible) {
        // User switched tabs or minimized window
        sendExitScreenshot('tab_switch');
      } else if (!isPageVisible && currentlyVisible) {
        // User returned to tab
        exitScreenshotSentRef.current = false; // Reset to allow future exit screenshots
      }

      isPageVisible = currentlyVisible;
    };

    const handleBeforeUnload = (e) => {
      // User is closing page or navigating away
      sendExitScreenshot('close');
    };

    const handlePageHide = () => {
      // Fallback for browsers that support pagehide
      sendExitScreenshot('navigate');
    };

    // Add event listeners
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('pagehide', handlePageHide);

    // Cleanup
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('pagehide', handlePageHide);
      if (visibilityTimeout) {
        clearTimeout(visibilityTimeout);
      }
    };
  }, [isRecording, consentGiven, olympiadId]);

  useEffect(() => {
    if (!consentGiven) return;

    const startCameraRecording = () => {
      const stream = cameraStreamRef.current;
      if (!stream) return;

      cameraChunksRef.current = [];

      // Check if MediaRecorder is supported
      if (!MediaRecorder.isTypeSupported('video/webm')) {
        console.error('MediaRecorder with webm not supported');
        return;
      }

      try {
        // Create MediaRecorder for camera stream
        const mediaRecorder = new MediaRecorder(stream, {
          mimeType: 'video/webm;codecs=vp9',
          videoBitsPerSecond: 2500000 // 2.5 Mbps for 720p
        });

        cameraRecorderRef.current = mediaRecorder;

        // Collect video chunks
        mediaRecorder.ondataavailable = (event) => {
          if (event.data && event.data.size > 0) {
            cameraChunksRef.current.push(event.data);
          }
        };

        // Start recording
        mediaRecorder.start(1000); // Collect data every 1 second

      } catch (error) {
        console.error('Error starting camera MediaRecorder:', error);
      }
    };

    const startScreenRecording = () => {
      const stream = screenStreamRef.current;
      if (!stream) return;

      screenChunksRef.current = [];

      // Check if MediaRecorder is supported
      if (!MediaRecorder.isTypeSupported('video/webm')) {
        console.error('MediaRecorder with webm not supported');
        return;
      }

      try {
        // Create MediaRecorder for screen stream
        const mediaRecorder = new MediaRecorder(stream, {
          mimeType: 'video/webm;codecs=vp9',
          videoBitsPerSecond: 2500000 // 2.5 Mbps for 720p
        });

        screenRecorderRef.current = mediaRecorder;

        // Collect video chunks
        mediaRecorder.ondataavailable = (event) => {
          if (event.data && event.data.size > 0) {
            screenChunksRef.current.push(event.data);
          }
        };

        // Start recording
        mediaRecorder.start(1000); // Collect data every 1 second

      } catch (error) {
        console.error('Error starting screen MediaRecorder:', error);
      }
    };

    beginMonitoring(false);

    // Cleanup function
    return () => {
      stopRecording();

      // Perform async cleanup
      (async () => {
        // Wait for uploads to complete
        await new Promise(resolve => setTimeout(resolve, 3000));

        // Stop streams
        if (cameraStreamRef.current) {
          cameraStreamRef.current.getTracks().forEach(track => track.stop());
          cameraStreamRef.current = null;
        }
        if (screenStreamRef.current) {
          screenStreamRef.current.getTracks().forEach(track => track.stop());
          screenStreamRef.current = null;
        }
      })();
    };
  }, [consentGiven, olympiadId, userId]);

  useEffect(() => {
    if (!consentGiven) return;

    let cancelled = false;

    const setupFaceMesh = async () => {
      if (!window.FaceMesh) {
        console.warn('FaceMesh not available. Face detection disabled.');
        setFaceCheckReady(true);
        setFaceDetected(false);
        return;
      }
      if (!cameraVideoRef.current) {
        return;
      }

      const faceMesh = new window.FaceMesh({
        locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`,
      });

      faceMesh.setOptions({
        maxNumFaces: 1,
        refineLandmarks: true,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5,
      });

      faceMesh.onResults((results) => {
        if (cancelled) return;
        setFaceCheckReady(true);

        const hasFace = Boolean(results?.multiFaceLandmarks?.length);
        if (hasFace) {
          faceMissingSinceRef.current = null;
          setFaceDetected(true);
          return;
        }

        if (!faceMissingSinceRef.current) {
          faceMissingSinceRef.current = Date.now();
        }
        if (Date.now() - faceMissingSinceRef.current >= FACE_MISSING_GRACE_MS) {
          setFaceDetected(false);
        }
      });

      faceMeshRef.current = faceMesh;

      const processFrame = async () => {
        if (cancelled) return;
        const video = cameraVideoRef.current;
        if (video && video.readyState >= 2) {
          try {
            await faceMesh.send({ image: video });
          } catch (err) {
            console.warn('FaceMesh processing error:', err);
          }
        }
        faceDetectionRafRef.current = requestAnimationFrame(processFrame);
      };

      processFrame();
    };

    const waitForVideo = () => {
      if (cancelled) return;
      const video = cameraVideoRef.current;
      if (!video || video.readyState < 2) {
        setTimeout(waitForVideo, 200);
        return;
      }
      setupFaceMesh();
    };

    waitForVideo();

    return () => {
      cancelled = true;
      if (faceDetectionRafRef.current) {
        cancelAnimationFrame(faceDetectionRafRef.current);
        faceDetectionRafRef.current = null;
      }
      if (faceMeshRef.current) {
        faceMeshRef.current.close();
        faceMeshRef.current = null;
      }
      faceMissingSinceRef.current = null;
      setFaceCheckReady(false);
      setFaceDetected(false);
    };
  }, [consentGiven]);

  useEffect(() => {
    if (!onFaceStatusChange) return;
    onFaceStatusChange({ detected: faceDetected, ready: faceCheckReady });
  }, [faceDetected, faceCheckReady, onFaceStatusChange]);

  if (!consentGiven) {
    return (
      <div className="proctoring-consent">
        <div className="consent-card card">
          <h3>Proctoring Consent</h3>
          <p>This olympiad requires monitoring for integrity:</p>
          <ul>
            <li>✓ Front camera will be recorded separately</li>
            <li>✓ Screen activity will be recorded separately</li>
            <li>✓ Both videos will be recorded at 720p resolution</li>
            <li>✓ Videos will be uploaded automatically</li>
          </ul>
          <p className="consent-warning">
            You must grant camera and screen sharing permissions to continue.
          </p>
          <p className="consent-warning" style={{ fontSize: '13px', marginTop: '10px' }}>
            ⚠️ <strong>Important:</strong> When sharing your screen, select <strong>"Entire Screen"</strong> option, not a single window or tab. Full screen sharing is required.
          </p>
          <p className="consent-warning" style={{ fontSize: '13px', marginTop: '8px' }}>
            ℹ️ On mobile devices, screen sharing may be unsupported. If no prompt appears, use a desktop browser (or Chrome/Edge on Android).
          </p>
          <button 
            className="button-primary"
            onClick={async () => {
              setConsentGiven(true);
              await beginMonitoring(true);
            }}
          >
            I Agree & Continue
          </button>
        </div>
      </div>
    );
  }

  const totalProgress = (uploadProgress.camera + uploadProgress.screen) / 2;

  return (
    <div className="proctoring-monitor">
      <div className="monitor-camera">
        <div className="monitor-header">
          <span className="monitor-title">Camera</span>
          {cameraActive && <div className="monitor-indicator" />}
        </div>
        {cameraError ? (
          <div className="monitor-error">
            <div className="error-icon">📷</div>
            <div className="error-text">{cameraError}</div>
          </div>
        ) : (
          <div className="monitor-preview">
            <video
              ref={cameraVideoRef}
              autoPlay
              muted
              playsInline
              className="monitor-video camera-video"
            />
          </div>
        )}
      </div>

      <div className="monitor-screen">
        <div className="monitor-header">
          <span className="monitor-title">Screen</span>
          {screenActive && <div className="monitor-indicator" />}
        </div>
        {screenError ? (
          <div className="monitor-error">
            <div className="error-icon">🖥️</div>
            <div className="error-text">{screenError}</div>
          </div>
        ) : (
          <div className="monitor-preview">
            <video
              ref={screenVideoRef}
              autoPlay
              muted
              playsInline
              className="monitor-video screen-video"
            />
          </div>
        )}
      </div>

      <div className="monitor-stats">
        <div className="stat-item">
          <span className="stat-label">Status:</span>
          <span className={`stat-value ${isRecording ? 'recording' : ''}`}>
            {isRecording ? '● Recording' : 'Stopped'}
          </span>
        </div>
        {isUploading && (
          <>
            {uploadStatus && (
              <div className="stat-item">
                <span className="stat-label">{uploadStatus}</span>
              </div>
            )}
            {uploadProgress.camera > 0 && (
              <div className="stat-item">
                <span className="stat-label">Camera:</span>
                <span className="stat-value">{uploadProgress.camera}%</span>
                <div className="upload-progress-bar">
                  <div 
                    className="upload-progress-fill" 
                    style={{ width: `${uploadProgress.camera}%` }}
                  />
                </div>
              </div>
            )}
            {uploadProgress.screen > 0 && (
              <div className="stat-item">
                <span className="stat-label">Screen:</span>
                <span className="stat-value">{uploadProgress.screen}%</span>
                <div className="upload-progress-bar">
                  <div 
                    className="upload-progress-fill" 
                    style={{ width: `${uploadProgress.screen}%` }}
                  />
                </div>
              </div>
            )}
            <div className="stat-item">
              <span className="stat-label">Total:</span>
              <span className="stat-value">{Math.round(totalProgress)}%</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ProctoringMonitor;
