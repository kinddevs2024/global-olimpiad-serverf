import { useState, useEffect, useCallback } from 'react';
import { useSocket } from '../context/SocketContext';

/**
 * Hook for server-authoritative timer
 * 
 * Syncs with server timer via WebSocket and API.
 * Displays countdown from server-calculated endsAt.
 */
export function useServerTimer(olympiadId, attemptId, endsAt) {
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const [expired, setExpired] = useState(false);
  const [synced, setSynced] = useState(false);
  const { socket, emit, on, off } = useSocket();

  // Sync timer from server
  const syncTimer = useCallback(async () => {
    if (!olympiadId || !attemptId) return;

    try {
      // Request timer sync via WebSocket
      if (socket && socket.connected) {
        emit('timer-sync', { attemptId });
      }
    } catch (error) {
      console.error('Error syncing timer:', error);
    }
  }, [olympiadId, attemptId, socket, emit]);

  // Calculate remaining time from endsAt
  const updateTimer = useCallback(() => {
    if (!endsAt) {
      setRemainingSeconds(0);
      setExpired(true);
      return;
    }

    const now = new Date();
    const end = new Date(endsAt);
    const remaining = Math.max(0, Math.floor((end - now) / 1000));
    
    setRemainingSeconds(remaining);
    setExpired(remaining <= 0);
  }, [endsAt]);

  // Initial sync on mount
  useEffect(() => {
    if (endsAt) {
      updateTimer();
      syncTimer();
      setSynced(true);
    }
  }, [endsAt, updateTimer, syncTimer]);

  // Listen for timer sync response
  useEffect(() => {
    if (!socket) return;

    const handleTimerSync = (timerStatus) => {
      if (timerStatus && timerStatus.endsAt) {
        const end = new Date(timerStatus.endsAt);
        const now = new Date();
        const remaining = Math.max(0, Math.floor((end - now) / 1000));
        setRemainingSeconds(remaining);
        setExpired(remaining <= 0);
        setSynced(true);
      }
    };

    on('timer-sync-response', handleTimerSync);

    return () => {
      off('timer-sync-response', handleTimerSync);
    };
  }, [socket, on, off]);

  // Update timer every second
  useEffect(() => {
    if (!endsAt) return;

    const interval = setInterval(() => {
      updateTimer();
    }, 1000);

    return () => clearInterval(interval);
  }, [endsAt, updateTimer]);

  // Sync periodically (every 30 seconds)
  useEffect(() => {
    if (!synced) return;

    const syncInterval = setInterval(() => {
      syncTimer();
    }, 30000); // Sync every 30 seconds

    return () => clearInterval(syncInterval);
  }, [synced, syncTimer]);

  // Format remaining time
  const formatTime = useCallback((seconds) => {
    if (seconds <= 0) return '00:00';

    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    }

    return `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }, []);

  return {
    remainingSeconds,
    expired,
    formatted: formatTime(remainingSeconds),
    synced,
    syncTimer
  };
}
