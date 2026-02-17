import { useState, useEffect, useCallback } from 'react';
import { olympiadAPI } from '../services/api';

/**
 * Hook for managing attempt session
 * 
 * Loads attempt from server, validates status, handles disconnection recovery.
 */
export function useAttemptSession(olympiadId) {
  const [attempt, setAttempt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load attempt from server
  const loadAttempt = useCallback(async () => {
    if (!olympiadId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await olympiadAPI.getAttempt(olympiadId);
      
      if (response.data.success) {
        setAttempt(response.data.attempt);
      } else {
        setError(response.data.message || 'Failed to load attempt');
        setAttempt(null);
      }
    } catch (err) {
      console.error('Error loading attempt:', err);
      setError(err.response?.data?.message || err.message || 'Failed to load attempt');
      setAttempt(null);
    } finally {
      setLoading(false);
    }
  }, [olympiadId]);

  // Load attempt on mount
  useEffect(() => {
    loadAttempt();
  }, [loadAttempt]);

  // Refresh attempt
  const refreshAttempt = useCallback(() => {
    return loadAttempt();
  }, [loadAttempt]);

  return {
    attempt,
    loading,
    error,
    refreshAttempt,
    hasAttempt: !!attempt,
    isActive: attempt?.status === 'started',
    isCompleted: attempt?.status === 'completed',
    isExpired: attempt?.status === 'time_expired',
    isTerminated: attempt?.status === 'violation_terminated'
  };
}
