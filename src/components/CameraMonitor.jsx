import { useEffect, useRef, useState } from 'react';
import { olympiadAPI } from '../services/api';
import { CAMERA_CAPTURE_INTERVAL } from '../utils/constants';
import './CameraMonitor.css';

const CameraMonitor = ({ olympiadId, userId }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [isActive, setIsActive] = useState(false);
  const [error, setError] = useState(null);
  const [isCapturing, setIsCapturing] = useState(false);

  useEffect(() => {
    let stream = null;
    let captureInterval = null;

    const startCamera = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { 
            facingMode: 'user',
            width: { ideal: 640 },
            height: { ideal: 480 }
          }
        });
        
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          setIsActive(true);
          setError(null);
        }

        // Capture screenshot periodically
        captureInterval = setInterval(() => {
          captureScreenshot();
        }, CAMERA_CAPTURE_INTERVAL);

        // Initial capture after 5 seconds
        setTimeout(() => {
          captureScreenshot();
        }, 5000);
      } catch (err) {
        setError('Camera access denied or unavailable');
        console.error('Camera error:', err);
        setIsActive(false);
      }
    };

    const captureScreenshot = async () => {
      if (!videoRef.current || !canvasRef.current || !isActive) return;

      try {
        setIsCapturing(true);
        const canvas = canvasRef.current;
        const video = videoRef.current;
        
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        
        const ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0);
        
        canvas.toBlob(async (blob) => {
          if (blob) {
            const formData = new FormData();
            formData.append('image', blob, `capture-${Date.now()}.jpg`);
            formData.append('captureType', 'camera'); // Backend expects 'captureType'
            formData.append('olympiadId', olympiadId);
            // userId is not needed - backend gets it from JWT token

            try {
              await olympiadAPI.uploadCameraCapture(formData);
            } catch (uploadError) {
              console.error('Upload error:', uploadError);
            }
          }
          setIsCapturing(false);
        }, 'image/jpeg', 0.8);
      } catch (err) {
        console.error('Capture error:', err);
        setIsCapturing(false);
      }
    };

    startCamera();

    return () => {
      if (captureInterval) {
        clearInterval(captureInterval);
      }
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [olympiadId, userId, isActive]);

  return (
    <div className="camera-monitor">
      <div className="camera-header">
        <span className="camera-title">Camera Monitor</span>
        {isActive && <div className="camera-indicator" />}
      </div>
      
      {error ? (
        <div className="camera-error">
          <div className="camera-error-icon">📷</div>
          <div className="camera-error-text">{error}</div>
        </div>
      ) : (
        <div className="camera-preview-container">
          <video
            ref={videoRef}
            autoPlay
            muted
            playsInline
            className="camera-preview"
          />
          {isCapturing && (
            <div className="camera-capture-indicator">
              <div className="capture-pulse"></div>
            </div>
          )}
        </div>
      )}
      
      <canvas ref={canvasRef} style={{ display: 'none' }} />
    </div>
  );
};

export default CameraMonitor;

