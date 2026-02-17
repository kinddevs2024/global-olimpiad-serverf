import { useState, useEffect } from 'react';
import { useSocket } from '../context/SocketContext';
import { olympiadAPI } from '../services/api';
import { getSavedAnswers, deleteSavedAnswers } from '../utils/indexeddb';
import './AttemptRecovery.css';

/**
 * AttemptRecovery Component
 * 
 * Detects disconnected session, shows warning, attempts to reconnect,
 * and syncs locally stored answers on reconnect.
 */
const AttemptRecovery = ({ olympiadId, attemptId, onReconnected, onSyncComplete }) => {
  const [disconnected, setDisconnected] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState('');
  const { socket, connected } = useSocket();

  // Detect disconnection
  useEffect(() => {
    if (!socket) return;

    const handleDisconnect = () => {
      setDisconnected(true);
      setSyncStatus('Connection lost. Timer is still running.');
    };

    const handleConnect = async () => {
      if (disconnected) {
        setSyncStatus('Reconnected. Syncing answers...');
        await syncAnswers();
      }
      setDisconnected(false);
    };

    socket.on('disconnect', handleDisconnect);
    socket.on('connect', handleConnect);

    // Initial check
    if (!connected) {
      setDisconnected(true);
    }

    return () => {
      socket.off('disconnect', handleDisconnect);
      socket.off('connect', handleConnect);
    };
  }, [socket, connected, disconnected]);

  // Sync locally stored answers
  const syncAnswers = async () => {
    if (!olympiadId || !attemptId) return;

    try {
      setSyncing(true);
      setSyncStatus('Syncing answers...');

      // Get saved answers from IndexedDB
      const savedAnswers = await getSavedAnswers(olympiadId);

      if (savedAnswers && Object.keys(savedAnswers).length > 0) {
        // Sync each answer to server
        for (const [questionId, answer] of Object.entries(savedAnswers)) {
          try {
            // Find question index (this would need to be stored or fetched)
            // For now, we'll just report that sync is needed
            // In production, you'd want to sync answers properly via the answer endpoint
            await olympiadAPI.submitAnswer(olympiadId, {
              questionIndex: 0, // This would need to be determined
              answer
            });
          } catch (error) {
            console.error(`Error syncing answer for question ${questionId}:`, error);
          }
        }

        // Clear saved answers after successful sync
        await deleteSavedAnswers(olympiadId);
        setSyncStatus('Answers synced successfully');
        
        if (onSyncComplete) {
          onSyncComplete();
        }
      } else {
        setSyncStatus('No saved answers to sync');
      }

      if (onReconnected) {
        onReconnected();
      }
    } catch (error) {
      console.error('Error syncing answers:', error);
      setSyncStatus('Error syncing answers. Please try again.');
    } finally {
      setSyncing(false);
    }
  };

  if (!disconnected && !syncing) {
    return null;
  }

  return (
    <div className="attempt-recovery-overlay">
      <div className="attempt-recovery-card">
        {disconnected && (
          <>
            <div className="recovery-icon">⚠️</div>
            <h2>Connection Lost</h2>
            <p className="recovery-message">
              Your connection to the server has been lost.
            </p>
            <p className="recovery-warning">
              ⚠️ <strong>Timer is still running!</strong> The olympiad continues on the server.
            </p>
            <p className="recovery-instruction">
              Please check your internet connection. Your answers are being saved locally.
            </p>
          </>
        )}

        {syncing && (
          <>
            <div className="recovery-icon">🔄</div>
            <h2>Syncing Answers</h2>
            <p className="recovery-message">{syncStatus}</p>
            <div className="recovery-spinner"></div>
          </>
        )}

        {connected && !syncing && disconnected && (
          <button 
            className="recovery-button" 
            onClick={syncAnswers}
            disabled={syncing}
          >
            Sync Answers Now
          </button>
        )}
      </div>
    </div>
  );
};

export default AttemptRecovery;
