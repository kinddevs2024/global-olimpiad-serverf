import { useEffect, useCallback, useRef } from 'react';
import { useSocket } from '../context/SocketContext';
import { olympiadAPI } from '../services/api';

/**
 * Anti-cheat monitoring hook
 * 
 * Monitors and reports suspicious behaviors:
 * - Tab visibility changes
 * - Window blur/minimize
 * - DevTools detection
 * - Copy/paste events
 * - Keyboard anomalies
 * - Page unload
 */
export function useAntiCheat(olympiadId, attemptId, enabled = true) {
  const { emit, socket } = useSocket();
  const violationsRef = useRef(new Set());
  const devToolsOpenRef = useRef(false);

  // Report violation
  const reportViolation = useCallback((violationType, details = {}) => {
    if (!olympiadId || !attemptId || !enabled) return;

    // Prevent duplicate violations in same session
    const violationKey = `${violationType}_${Date.now()}`;
    if (violationsRef.current.has(violationKey)) return;
    violationsRef.current.add(violationKey);

    // Clean old violations (keep last 100)
    if (violationsRef.current.size > 100) {
      const entries = Array.from(violationsRef.current);
      violationsRef.current = new Set(entries.slice(-50));
    }

    // Report via WebSocket if available
    if (socket && socket.connected) {
      emit('violation-report', {
        attemptId,
        violationType,
        details: {
          ...details,
          timestamp: new Date().toISOString()
        }
      });
    }

    // Also report via API as fallback
    olympiadAPI.reportViolation(olympiadId, {
      violationType,
      details: {
        ...details,
        timestamp: new Date().toISOString()
      }
    }).catch(error => {
      console.error('Error reporting violation:', error);
    });
  }, [olympiadId, attemptId, enabled, socket, emit]);

  // Tab visibility change
  useEffect(() => {
    if (!enabled) return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        reportViolation('TAB_HIDDEN', {
          visibilityState: document.visibilityState
        });
      } else {
        reportViolation('TAB_VISIBLE', {
          visibilityState: document.visibilityState
        });
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [enabled, reportViolation]);

  // Window blur/focus
  useEffect(() => {
    if (!enabled) return;

    const handleBlur = () => {
      reportViolation('WINDOW_BLUR');
    };

    const handleFocus = () => {
      reportViolation('WINDOW_FOCUS');
    };

    window.addEventListener('blur', handleBlur);
    window.addEventListener('focus', handleFocus);

    return () => {
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('focus', handleFocus);
    };
  }, [enabled, reportViolation]);

  // DevTools detection (skip in production - debugger causes false positives)
  useEffect(() => {
    if (!enabled || import.meta.env?.PROD) return;

    const detectDevTools = () => {
      const start = performance.now();
      debugger; // eslint-disable-line no-debugger
      const end = performance.now();
      if (end - start > 100) {
        if (!devToolsOpenRef.current) {
          devToolsOpenRef.current = true;
          reportViolation('DEVTOOLS_OPEN', { detectionMethod: 'debugger_timing' });
        }
      } else {
        devToolsOpenRef.current = false;
      }
    };

    const interval = setInterval(detectDevTools, 2000);
    return () => clearInterval(interval);
  }, [enabled, reportViolation]);

  // Copy event detection
  useEffect(() => {
    if (!enabled) return;

    const handleCopy = (e) => {
      reportViolation('COPY_ATTEMPT', {
        clipboardData: e.clipboardData?.getData('text')?.substring(0, 50) || 'unknown'
      });
      // Don't prevent copy, just log it
    };

    document.addEventListener('copy', handleCopy);
    return () => document.removeEventListener('copy', handleCopy);
  }, [enabled, reportViolation]);

  // Paste event detection
  useEffect(() => {
    if (!enabled) return;

    const handlePaste = (e) => {
      reportViolation('PASTE_ATTEMPT', {
        clipboardData: e.clipboardData?.getData('text')?.substring(0, 50) || 'unknown'
      });
      // Don't prevent paste, just log it
    };

    document.addEventListener('paste', handlePaste);
    return () => document.removeEventListener('paste', handlePaste);
  }, [enabled, reportViolation]);

  // Right-click detection (context menu)
  useEffect(() => {
    if (!enabled) return;

    const handleContextMenu = (e) => {
      e.preventDefault(); // Block context menu
      
      // Show alert to user
      alert('⚠️ Security Warning: Right-click menu is disabled during the exam.');
      
      reportViolation('CONTEXT_MENU', {
        target: e.target?.tagName || 'unknown'
      });
    };

    document.addEventListener('contextmenu', handleContextMenu);
    return () => document.removeEventListener('contextmenu', handleContextMenu);
  }, [enabled, reportViolation]);

  // Keyboard shortcuts detection (Ctrl+Shift+I, F12, etc.)
  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e) => {
      // Detect and block common devtools shortcuts
      if (
        (e.key === 'F12') ||
        (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'J' || e.key === 'C')) ||
        (e.ctrlKey && e.key === 'U') // View source
      ) {
        e.preventDefault(); // Block the shortcut
        e.stopPropagation();
        
        // Show alert to user
        alert('⚠️ Security Warning: Developer tools are disabled during the exam.');
        
        reportViolation('SUSPICIOUS_KEYBOARD_SHORTCUT', {
          key: e.key,
          ctrlKey: e.ctrlKey,
          shiftKey: e.shiftKey,
          altKey: e.altKey
        });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [enabled, reportViolation]);

  return {
    reportViolation
  };
}
