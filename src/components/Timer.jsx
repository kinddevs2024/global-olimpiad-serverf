import { useState, useEffect } from 'react';
import { formatTime } from '../utils/helpers';
import { TIMER_WARNING_THRESHOLD, TIMER_DANGER_THRESHOLD } from '../utils/constants';
import './Timer.css';

const Timer = ({ initialSeconds, onExpire, className = '' }) => {
  const [seconds, setSeconds] = useState(initialSeconds);
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    setSeconds(initialSeconds);
    setIsExpired(initialSeconds <= 0);
  }, [initialSeconds]);

  useEffect(() => {
    if (seconds <= 0) {
      setIsExpired(true);
      if (onExpire) {
        onExpire();
      }
      return;
    }

    const interval = setInterval(() => {
      setSeconds((prev) => {
        if (prev <= 1) {
          setIsExpired(true);
          if (onExpire) {
            onExpire();
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [seconds, onExpire]);

  const getTimerClass = () => {
    if (isExpired) return 'timer-expired';
    if (seconds <= TIMER_DANGER_THRESHOLD) return 'timer-danger';
    if (seconds <= TIMER_WARNING_THRESHOLD) return 'timer-warning';
    return '';
  };

  return (
    <div className={`timer ${getTimerClass()} ${className}`}>
      <div className="timer-label">Time Remaining</div>
      <div className="timer-display">{formatTime(seconds)}</div>
      {isExpired && <div className="timer-expired-message">Time's Up!</div>}
    </div>
  );
};

export default Timer;

