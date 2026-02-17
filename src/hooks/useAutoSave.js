import { useEffect, useRef, useCallback } from "react";

/**
 * Custom hook for debounced auto-save with offline queue and retry
 * @param {Function} saveFunction - Async function to call when saving (returns Promise)
 * @param {any} data - Data to save
 * @param {number} delay - Debounce delay in milliseconds (default: 500)
 * @param {boolean} enabled - Whether auto-save is enabled
 */
export const useAutoSave = (saveFunction, data, delay = 500, enabled = true) => {
  const timeoutRef = useRef(null);
  const previousDataRef = useRef(null);
  const pendingQueueRef = useRef([]);
  const isOnlineRef = useRef(typeof navigator !== "undefined" ? navigator.onLine : true);

  const tryFlushQueue = useCallback(async () => {
    if (pendingQueueRef.current.length === 0 || !isOnlineRef.current) return;
    const item = pendingQueueRef.current.shift();
    try {
      await saveFunction(item);
    } catch (err) {
      pendingQueueRef.current.unshift(item);
      console.warn("[useAutoSave] Retry later:", err.message);
    }
  }, [saveFunction]);

  useEffect(() => {
    const handleOnline = () => {
      isOnlineRef.current = true;
      tryFlushQueue();
    };
    const handleOffline = () => {
      isOnlineRef.current = false;
    };
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [tryFlushQueue]);

  useEffect(() => {
    if (!enabled || !saveFunction || !data) {
      return;
    }

    const currentDataString = JSON.stringify(data);
    if (currentDataString === previousDataRef.current) {
      return;
    }

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(async () => {
      previousDataRef.current = currentDataString;
      if (!isOnlineRef.current) {
        pendingQueueRef.current.push(data);
        return;
      }
      try {
        await saveFunction(data);
      } catch (err) {
        pendingQueueRef.current.push(data);
        console.warn("[useAutoSave] Queued for retry:", err.message);
      }
    }, delay);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [data, saveFunction, delay, enabled]);
};

