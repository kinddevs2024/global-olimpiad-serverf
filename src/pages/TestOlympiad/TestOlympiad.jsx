import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { olympiadAPI } from '../../services/api';
import { useSocket } from '../../context/SocketContext';
import Timer from '../../components/Timer';
import QuestionCard from '../../components/QuestionCard';
import ProctoringMonitor from '../../components/ProctoringMonitor';
import NotificationToast from '../../components/NotificationToast';
import { useAuth } from '../../context/AuthContext';
import { useServerTimer } from '../../hooks/useServerTimer';
import { useAttemptSession } from '../../hooks/useAttemptSession';
import { useAntiCheat } from '../../hooks/useAntiCheat';
import { saveAnswers, getSavedAnswers, deleteSavedAnswers } from '../../utils/indexeddb';
import { getTimeRemaining, getTimeRemainingFromDuration } from '../../utils/helpers';
import { generateDeviceFingerprint } from '../../utils/device-fingerprint';
import './TestOlympiad.css';

const TestOlympiad = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { emit } = useSocket();
  
  const [olympiad, setOlympiad] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [nextSubmitting, setNextSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [faceDetected, setFaceDetected] = useState(false);
  const [faceCheckReady, setFaceCheckReady] = useState(false);
  const [savingDraft, setSavingDraft] = useState(false);
  const draftSaveTimeoutRef = useRef(null);
  const [attemptId, setAttemptId] = useState(null);
  const [deviceFingerprint, setDeviceFingerprint] = useState(null);
  const attemptIndexSyncedRef = useRef(false);

  // Load attempt session
  const { attempt, loading: attemptLoading, error: attemptError, isActive, isExpired, isCompleted } = useAttemptSession(id);
  
  // Set attempt ID when loaded
  useEffect(() => {
    if (attempt?._id) {
      setAttemptId(attempt._id);
      if (!attemptIndexSyncedRef.current && typeof attempt.currentQuestionIndex === 'number') {
        setCurrentQuestionIndex(attempt.currentQuestionIndex);
        attemptIndexSyncedRef.current = true;
      }
    }
  }, [attempt]);

  // Server-authoritative timer
  const { remainingSeconds, expired, formatted: timerFormatted, synced } = useServerTimer(
    id,
    attemptId,
    attempt?.endsAt
  );

  // Anti-cheat monitoring
  // Only enable if attempt is active and not submitted
  const shouldEnableAntiCheat = Boolean(isActive && !submitted && attemptId);
  useAntiCheat(id, attemptId, shouldEnableAntiCheat);

  // Update timeRemaining from server timer
  useEffect(() => {
    setTimeRemaining(remainingSeconds);
    if (expired && !submitted) {
      handleTimeExpire();
    }
  }, [remainingSeconds, expired, submitted]);

  useEffect(() => {
    fetchOlympiad();
    
    // Get attempt ID from localStorage if available
    const storedAttemptId = localStorage.getItem(`olympiad_${id}_attemptId`);
    if (storedAttemptId) {
      setAttemptId(storedAttemptId);
    }

    // Join WebSocket room for attempt (emit sends to server; on registers listener)
    if (emit && (attemptId || storedAttemptId)) {
      emit('join-olympiad', { olympiadId: id, attemptId: attemptId || storedAttemptId });
    }
  }, [id, emit, attemptId]);

  useEffect(() => {
    // Load or generate device fingerprint (persisted per olympiad)
    const storedFingerprint = localStorage.getItem(`olympiad_${id}_deviceFingerprint`);
    if (storedFingerprint) {
      try {
        setDeviceFingerprint(JSON.parse(storedFingerprint));
        return;
      } catch (err) {
        console.error('Error parsing stored device fingerprint:', err);
        localStorage.removeItem(`olympiad_${id}_deviceFingerprint`);
      }
    }

    generateDeviceFingerprint()
      .then(fp => {
        setDeviceFingerprint(fp);
        localStorage.setItem(`olympiad_${id}_deviceFingerprint`, JSON.stringify(fp));
      })
      .catch(err => {
        console.error('Error generating device fingerprint:', err);
      });
  }, [id]);

  // Load saved draft from server on mount
  useEffect(() => {
    const loadDraft = async () => {
      if (id && user) {
        try {
          const response = await olympiadAPI.getDraft(id);
          if (response.data.success && response.data.draft && response.data.draft.answers) {
            setAnswers(response.data.draft.answers);
            setNotification({ 
              message: 'Your previous answers have been loaded', 
              type: 'success' 
            });
            setTimeout(() => setNotification(null), 3000);
          }
        } catch (error) {
          console.error('Error loading draft:', error);
          // Fallback to localStorage if server draft fails
          const savedAnswers = localStorage.getItem(`olympiad_${id}_answers`);
          if (savedAnswers) {
            try {
              const parsedAnswers = JSON.parse(savedAnswers);
              setAnswers(parsedAnswers);
            } catch (e) {
              console.error('Error loading saved answers from localStorage:', e);
            }
          }
        }
      }
    };
    loadDraft();
  }, [id, user]);

  // Save answers to IndexedDB for offline recovery
  useEffect(() => {
    if (id && Object.keys(answers).length > 0 && !submitted) {
      saveAnswers(id, answers).catch(error => {
        console.error('Error saving answers to IndexedDB:', error);
      });
    }
  }, [answers, id, submitted]);

  // Handle tab close/refresh - skip current question
  useEffect(() => {
    const handleBeforeUnload = async () => {
      if (attemptId && currentQuestionIndex >= 0 && !submitted) {
        try {
          // Use sendBeacon for reliable delivery during page unload
          // Note: sendBeacon doesn't support custom headers, so we'll rely on API endpoint
          // In production, you might want to use a different approach or store skip request in IndexedDB
          olympiadAPI.skipQuestion(id, { reason: 'tab_close', deviceFingerprint }).catch(() => {
            // Ignore errors during unload
          });
        } catch (error) {
          // Ignore errors during unload
        }
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [id, attemptId, currentQuestionIndex, submitted, deviceFingerprint]);

  // Load current question from server if missing or missing nonce
  useEffect(() => {
    const loadCurrentQuestion = async () => {
      if (!attempt || attemptLoading) return;
      if (!attemptId || questions.length === 0) return;

      const authoritativeIndex =
        typeof attempt.currentQuestionIndex === 'number'
          ? attempt.currentQuestionIndex
          : currentQuestionIndex;

      if (authoritativeIndex > currentQuestionIndex) {
        setCurrentQuestionIndex(authoritativeIndex);
      }

      const currentQuestion = questions[authoritativeIndex];
      if (!currentQuestion || !currentQuestion.nonce) {
        try {
          const response = await olympiadAPI.getQuestion(id, authoritativeIndex);
          if (response.data.success && response.data.question) {
            const fetchedQuestion = response.data.question;
            setQuestions(prev => {
              const next = [...prev];
              const targetIndex = response.data.questionIndex ?? authoritativeIndex;
              next[targetIndex] = {
                ...(next[targetIndex] || {}),
                ...fetchedQuestion
              };
              return next;
            });
          }
        } catch (error) {
          const serverIndex = error.response?.data?.currentQuestionIndex;
          const code = error.response?.data?.code;
          if (code === 'INVALID_QUESTION_ACCESS' && typeof serverIndex === 'number') {
            setCurrentQuestionIndex(serverIndex);
          } else {
            console.error('Error loading current question:', error);
          }
        }
      }
    };
    loadCurrentQuestion();
  }, [id, attemptId, attempt, attemptLoading, currentQuestionIndex, questions]);

  const fetchOlympiad = async () => {
    try {
      const response = await olympiadAPI.getById(id);
      const olympiadData = response.data;
      setOlympiad(olympiadData);
      setQuestions(olympiadData.questions || []);

      // Check if user has gone through start page (optional check)
      const started = localStorage.getItem(`olympiad_${id}_started`);
      if (!started && olympiadData.status === 'published') {
        // Optional: redirect to start page if not started
        // Uncomment if you want to force users to go through start page
        // navigate(`/olympiad/${id}/start`);
      }
      
      // Calculate remaining time based on duration from start time
      const startTime = localStorage.getItem(`olympiad_${id}_startTime`);
      const duration = olympiadData.duration || 3600; // Default to 60 minutes (3600 seconds)
      
      if (startTime && duration) {
        // Use duration-based timer (countdown from when user started)
        const remaining = getTimeRemainingFromDuration(duration, startTime);
        setTimeRemaining(remaining);
      } else {
        // Fallback to endTime-based timer if no start time recorded
        const remaining = getTimeRemaining(olympiadData.endTime);
        setTimeRemaining(remaining);
      }
    } catch (error) {
      setNotification({ message: 'Failed to load olympiad', type: 'error' });
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerChange = (questionId, answer) => {
    // Update local state
    setAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }));

    // Save to IndexedDB for offline recovery (async, don't await)
    if (id) {
      const updatedAnswers = { ...answers, [questionId]: answer };
      saveAnswers(id, updatedAnswers).catch(err => console.error('IndexedDB save error:', err));
    }
  };

  const currentQuestion = questions[currentQuestionIndex];

  // Submit current answer and move to next question
  const handleNext = async () => {
    if (!attemptId || !currentQuestion || nextSubmitting) return;
    let nextIndexOverride = null;
    setNextSubmitting(true);

    try {
      // Submit current answer if provided
      const currentAnswer = answers[currentQuestion._id];
      if (currentAnswer !== undefined && currentAnswer !== null && currentAnswer !== '') {
        try {
          let nonce = null;
          try {
            const nonceResponse = await olympiadAPI.getQuestion(id, currentQuestionIndex);
            if (nonceResponse.data.success && nonceResponse.data.question?.nonce) {
              nonce = nonceResponse.data.question.nonce;
              const fetchedQuestion = nonceResponse.data.question;
              setQuestions(prev => {
                const next = [...prev];
                next[currentQuestionIndex] = {
                  ...(next[currentQuestionIndex] || {}),
                  ...fetchedQuestion
                };
                return next;
              });
            }
          } catch (nonceError) {
            // If nonce refresh fails, fall back to existing nonce if any
            nonce = currentQuestion?.nonce || null;
          }

          if (!nonce) {
            setNotification({
              message: 'Failed to load question nonce. Please retry.',
              type: 'error'
            });
            return;
          }
          const submitResponse = await olympiadAPI.submitAnswer(id, {
            questionIndex: currentQuestionIndex,
            answer: currentAnswer,
            nonce,
            deviceFingerprint
          });

          const nextIndexFromServer = submitResponse.data?.nextQuestionIndex;
          const isLastQuestion = submitResponse.data?.isLastQuestion;
          if (typeof nextIndexFromServer === 'number') {
            nextIndexOverride = nextIndexFromServer;
            setCurrentQuestionIndex(nextIndexFromServer);
          }

          if (isLastQuestion) {
            return;
          }
        } catch (error) {
          const responseData = error.response?.data;
          const serverIndex = responseData?.currentQuestionIndex;
          const code = responseData?.code;

          if (
            (code === 'INVALID_QUESTION_INDEX' || code === 'INVALID_QUESTION_ACCESS') &&
            typeof serverIndex === 'number'
          ) {
            setCurrentQuestionIndex(serverIndex);
            try {
              await olympiadAPI.getQuestion(id, serverIndex);
            } catch (syncError) {
              console.error('Error syncing question after index mismatch:', syncError);
            }
          }

          setNotification({
            message: responseData?.message || 'Failed to submit answer',
            type: 'error'
          });
          return; // Don't advance if submission failed
        }
      }

      // Move to next question if not last
      const nextIndex = typeof nextIndexOverride === 'number'
        ? nextIndexOverride
        : currentQuestionIndex + 1;

      if (nextIndex < questions.length) {
        try {
          const resolvedIndex = typeof nextIndexOverride === 'number'
            ? nextIndexOverride
            : nextIndex;
          setCurrentQuestionIndex(resolvedIndex);
          const response = await olympiadAPI.getQuestion(id, nextIndex);

          if (response.data.success) {
            // Update current question index from server response
            if (typeof nextIndexOverride !== 'number' && typeof response.data.currentQuestionIndex === 'number') {
              setCurrentQuestionIndex(response.data.currentQuestionIndex);
            }

            // Add question to questions array if not already there
            if (response.data.question && !questions.find(q => q._id === response.data.question._id)) {
              setQuestions(prev => [...prev, response.data.question]);
            }
          }
        } catch (error) {
          const responseData = error.response?.data;
          const serverIndex = responseData?.currentQuestionIndex;
          const code = responseData?.code;

          if (code === 'INVALID_QUESTION_ACCESS' && typeof serverIndex === 'number') {
            setCurrentQuestionIndex(serverIndex);
          }

          setNotification({
            message: responseData?.message || 'Failed to load next question',
            type: 'error'
          });
        }
      }
    } finally {
      setNextSubmitting(false);
    }
  };

  // Forward-only navigation - no previous button allowed
  // Removed handlePrevious function

  const handleSubmit = async ({ confirm = true } = {}) => {
    if (confirm && !window.confirm('Are you sure you want to submit? You cannot change answers after submission.')) {
      return;
    }
    if (!confirm) {
      setNotification({ message: 'Time expired. Submitting...', type: 'warning' });
    }

    try {
      setSubmitting(true);
      await olympiadAPI.submit(id, { answers });
      setSubmitted(true);
      // Clear saved answers and draft after successful submission
      localStorage.removeItem(`olympiad_${id}_answers`);
      if (draftSaveTimeoutRef.current) {
        clearTimeout(draftSaveTimeoutRef.current);
      }
      setNotification({ message: 'Answers submitted successfully!', type: 'success' });
      setTimeout(() => {
        navigate(`/olympiad/${id}/results`);
      }, 2000);
    } catch (error) {
      setNotification({ 
        message: error.response?.data?.message || 'Submission failed', 
        type: 'error' 
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleTimeExpire = () => {
    handleSubmit({ confirm: false });
  };

  if (loading) {
    return (
      <div className="olympiad-loading">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="olympiad-submitted">
        <div className="submitted-card card">
          <h2>✓ Submitted Successfully</h2>
          <p>Your answers have been submitted.</p>
          <button className="button-primary" onClick={() => navigate(`/olympiad/${id}/results`)}>
            View Results
          </button>
        </div>
      </div>
    );
  }

  const answeredCount = Object.keys(answers).length;
  const faceAllowed = faceCheckReady && faceDetected;
  const canProceed = isRecording && faceAllowed;

  // Show message if no questions available
  if (questions.length === 0) {
    return (
      <div className="test-olympiad-page">
        <div className="olympiad-container">
          <div className="card" style={{ textAlign: 'center', padding: '40px' }}>
            <h2>No Questions Available</h2>
            <p>This olympiad doesn't have any questions yet.</p>
            <button className="button-primary" onClick={() => navigate('/dashboard')}>
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Check attempt status
  if (attemptLoading) {
    return (
      <div className="olympiad-loading">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  if (attemptError || !attempt) {
    return (
      <div className="test-olympiad-page">
        <div className="olympiad-container">
          <div className="card" style={{ textAlign: 'center', padding: '40px' }}>
            <h2>No Active Attempt</h2>
            <p>{attemptError || 'Please start the olympiad first.'}</p>
            <button className="button-primary" onClick={() => navigate(`/olympiad/${id}/start`)}>
              Go to Start Page
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (isExpired || isCompleted) {
    return (
      <div className="test-olympiad-page">
        <div className="olympiad-container">
          <div className="card" style={{ textAlign: 'center', padding: '40px' }}>
            <h2>{isExpired ? 'Time Expired' : 'Attempt Completed'}</h2>
            <p>This attempt has {isExpired ? 'expired' : 'been completed'}.</p>
            <button className="button-primary" onClick={() => navigate(`/olympiad/${id}/results`)}>
              View Results
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="test-olympiad-page">
      <ProctoringMonitor 
        olympiadId={id} 
        userId={user?._id}
        olympiadTitle={olympiad?.title}
        onRecordingStatusChange={setIsRecording}
        onFaceStatusChange={({ detected, ready }) => {
          setFaceDetected(detected);
          setFaceCheckReady(ready);
        }}
      />
      
      <div className="olympiad-container">
        {/* Blocking overlay when not recording */}
        {!isRecording && (
          <div className="recording-block-overlay">
            <div className="blocking-message card">
              <h2>⏸️ Recording Not Active</h2>
              <p>Please wait for camera and screen recording to start.</p>
              <p className="blocking-hint">
                You cannot answer questions until recording is active.
              </p>
            </div>
          </div>
        )}
        {isRecording && !faceAllowed && (
          <div className="recording-block-overlay">
            <div className="blocking-message card">
              <h2>⚠️ Face Not Detected</h2>
              <p>Please keep your face visible in the camera.</p>
              <p className="blocking-hint">
                The olympiad will resume once your face is detected.
              </p>
            </div>
          </div>
        )}
        <div className="olympiad-header">
          <h1 className="olympiad-title">{olympiad?.title}</h1>
          <Timer 
            initialSeconds={timeRemaining} 
            onExpire={handleTimeExpire}
            className="olympiad-timer"
            formatted={timerFormatted}
          />
        </div>

        <div className="olympiad-progress">
          <div className="progress-bar">
            <div 
              className="progress-fill" 
              style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}
            />
          </div>
          <div className="progress-text">
            Question {currentQuestionIndex + 1} of {questions.length} 
            ({answeredCount} answered)
            {savingDraft && <span style={{ marginLeft: '10px', color: '#666', fontSize: '0.9em' }}>💾 Saving...</span>}
          </div>
        </div>

        <div className="questions-navigation">
          {questions.map((_, index) => (
            <button
              key={index}
              className={`nav-button ${index === currentQuestionIndex ? 'active' : ''} ${answers[questions[index]._id] ? 'answered' : ''}`}
              onClick={() => setCurrentQuestionIndex(index)}
              disabled={!canProceed || submitted}
            >
              {index + 1}
            </button>
          ))}
        </div>

        {/* Question Card - This is where the question appears */}
        {currentQuestion ? (
          <QuestionCard
            question={currentQuestion}
            questionNumber={currentQuestionIndex + 1}
            totalQuestions={questions.length}
            selectedAnswer={answers[currentQuestion._id]}
            onAnswerChange={handleAnswerChange}
            disabled={!canProceed || submitted}
          />
        ) : (
          <div className="card" style={{ textAlign: 'center', padding: '40px' }}>
            <p>Question not found. Please try selecting a different question.</p>
          </div>
        )}

        <div className="olympiad-actions">
          {/* Forward-only navigation - no previous button */}
          {currentQuestionIndex < questions.length - 1 ? (
            <button 
              className="button-primary" 
              onClick={handleNext}
              disabled={!canProceed || submitted || nextSubmitting}
            >
              Next →
            </button>
          ) : (
            <button 
              className="button-primary" 
              onClick={handleSubmit}
              disabled={!canProceed || submitted || submitting}
            >
              Submit Answers
            </button>
          )}
        </div>
      </div>

      {notification && (
        <NotificationToast
          message={notification.message}
          type={notification.type}
          onClose={() => setNotification(null)}
        />
      )}
    </div>
  );
};

export default TestOlympiad;

