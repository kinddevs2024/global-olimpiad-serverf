import { useState, useEffect, useRef } from "react";
import { gsap } from "gsap";
import "./VirtualAssistant.css";

const VirtualAssistant = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
  const [messages, setMessages] = useState([]);
  const bubbleRef = useRef(null);
  const messagesRef = useRef(null);
  const buttonRef = useRef(null);

  // Predefined messages for kids
  const assistantMessages = [
    "Hi! Welcome to Global Olympiad! 🌟",
    "This is a fun place where you can test your knowledge!",
    "You can compete in Math, Science, English, and more!",
    "Click 'Get Started' to begin your adventure!",
  ];

  useEffect(() => {
    // Check if this is the first visit
    const hasVisited = localStorage.getItem("global-olympiad-visited");
    
    if (!hasVisited) {
      // Show assistant after a short delay
      const timer = setTimeout(() => {
        setIsVisible(true);
        localStorage.setItem("global-olympiad-visited", "true");
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, []);

  useEffect(() => {
    if (isVisible && !isMinimized) {
      // Animate bubble appearance
      gsap.fromTo(
        bubbleRef.current,
        {
          scale: 0,
          opacity: 0,
          y: 50,
        },
        {
          scale: 1,
          opacity: 1,
          y: 0,
          duration: 0.6,
          ease: "back.out(1.7)",
        }
      );

      // Start showing messages
      showMessages();
    }
  }, [isVisible, isMinimized]);

  const showMessages = () => {
    let index = 0;
    const messageInterval = setInterval(() => {
      if (index < assistantMessages.length) {
        setMessages((prev) => [...prev, assistantMessages[index]]);
        index++;
        setCurrentMessageIndex(index);

        // Animate new message appearance
        if (messagesRef.current) {
          const messageElements = messagesRef.current.children;
          if (messageElements.length > 0) {
            const lastMessage = messageElements[messageElements.length - 1];
            gsap.fromTo(
              lastMessage,
              {
                opacity: 0,
                y: 20,
                scale: 0.8,
              },
              {
                opacity: 1,
                y: 0,
                scale: 1,
                duration: 0.4,
                ease: "power2.out",
              }
            );
          }
        }
      } else {
        clearInterval(messageInterval);
      }
    }, 2000); // Show next message every 2 seconds

    return () => clearInterval(messageInterval);
  };

  const handleMinimize = () => {
    setIsMinimized(true);
    gsap.to(bubbleRef.current, {
      scale: 0.8,
      opacity: 0.7,
      y: 20,
      duration: 0.3,
      ease: "power2.in",
    });
  };

  const handleExpand = () => {
    setIsMinimized(false);
    gsap.to(bubbleRef.current, {
      scale: 1,
      opacity: 1,
      y: 0,
      duration: 0.4,
      ease: "back.out(1.7)",
    });
  };

  const handleClose = () => {
    gsap.to(bubbleRef.current, {
      scale: 0,
      opacity: 0,
      y: 50,
      duration: 0.3,
      ease: "power2.in",
      onComplete: () => {
        setIsVisible(false);
      },
    });
  };

  if (!isVisible) return null;

  return (
    <div
      className={`virtual-assistant ${isMinimized ? "minimized" : ""}`}
      ref={bubbleRef}
    >
      {isMinimized ? (
        <button
          className="assistant-toggle"
          onClick={handleExpand}
          ref={buttonRef}
          aria-label="Expand assistant"
        >
          <span className="assistant-icon">💬</span>
        </button>
      ) : (
        <div className="assistant-bubble">
          <div className="assistant-header">
            <div className="assistant-avatar">🤖</div>
            <h3 className="assistant-title">Your Helper</h3>
            <div className="assistant-controls">
              <button
                className="assistant-btn minimize"
                onClick={handleMinimize}
                aria-label="Minimize"
              >
                −
              </button>
              <button
                className="assistant-btn close"
                onClick={handleClose}
                aria-label="Close"
              >
                ×
              </button>
            </div>
          </div>
          <div className="assistant-messages" ref={messagesRef}>
            {messages.map((message, index) => (
              <div
                key={index}
                className={`assistant-message ${
                  index === messages.length - 1 ? "latest" : ""
                }`}
              >
                <div className="message-bubble">
                  <p>{message}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default VirtualAssistant;


