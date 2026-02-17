import { useState } from "react";
import "./CookieConsentModal.css";

const CookieConsentModal = ({ onAccept, onReject }) => {
  const [showDetails, setShowDetails] = useState(false);

  const handleAcceptAll = () => {
    onAccept(true);
  };

  const handleReject = () => {
    onAccept(false);
  };

  return (
    <div className="cookie-consent-overlay">
      <div className="cookie-consent-modal" onClick={(e) => e.stopPropagation()}>
        <div className="cookie-consent-header">
          <div className="cookie-icon">🍪</div>
          <h2 className="cookie-consent-title">Cookie Consent</h2>
        </div>

        <div className="cookie-consent-body">
          <p className="cookie-consent-description">
            We use cookies to enhance your browsing experience, analyze site
            traffic, and personalize content. By clicking "Accept All Cookies",
            you consent to our use of cookies.
          </p>

          {showDetails && (
            <div className="cookie-details">
              <div className="cookie-type">
                <h4>Essential Cookies</h4>
                <p>
                  These cookies are necessary for the website to function
                  properly. They enable core functionality such as security,
                  network management, and accessibility.
                </p>
              </div>
              <div className="cookie-type">
                <h4>Analytics Cookies</h4>
                <p>
                  These cookies help us understand how visitors interact with
                  our website by collecting and reporting information
                  anonymously.
                </p>
              </div>
              <div className="cookie-type">
                <h4>Functional Cookies</h4>
                <p>
                  These cookies enable enhanced functionality and
                  personalization, such as remembering your preferences and
                  login status.
                </p>
              </div>
            </div>
          )}

          <button
            className="cookie-details-toggle"
            onClick={() => setShowDetails(!showDetails)}
          >
            {showDetails ? "Hide Details" : "Show Details"}
          </button>
        </div>

        <div className="cookie-consent-footer">
          <button className="button-secondary" onClick={handleReject}>
            Reject All
          </button>
          <button className="button-primary" onClick={handleAcceptAll}>
            Accept All Cookies
          </button>
        </div>
      </div>
    </div>
  );
};

export default CookieConsentModal;

