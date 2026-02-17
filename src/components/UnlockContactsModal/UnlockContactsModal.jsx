import { useState } from "react";
import { Link } from "react-router-dom";
import "./UnlockContactsModal.css";

const UnlockContactsModal = ({ portfolio, balance = 0, coinsRequired = 10, onConfirm, onClose }) => {
  const hasEnoughCoins = balance >= coinsRequired;
  const [showBuyInfo, setShowBuyInfo] = useState(false);

  return (
    <div className="verification-modal-overlay" onClick={onClose}>
      <div
        className="verification-modal-content"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="verification-modal-header">
          <h3>Unlock Student Contacts</h3>
          <button
            className="verification-modal-close"
            onClick={onClose}
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <div className="verification-modal-body">
          <div className="portfolio-info">
            <p>
              <strong>Portfolio:</strong> {portfolio.title || portfolio.hero?.title || "Untitled"}
            </p>
            <p>
              <strong>Student:</strong> {portfolio.studentName || portfolio.studentId || "Unknown"}
            </p>
          </div>

          <div className="unlock-info">
            <p>
              Unlock access to this student's contact information. Cost: {coinsRequired} coins.
              {!hasEnoughCoins && (
                <>
                  <span className="unlock-insufficient"> Your balance: {balance} coins (insufficient).</span>
                  <button
                    type="button"
                    className="unlock-buy-link"
                    onClick={() => setShowBuyInfo(true)}
                  >
                    How can I buy coins?
                  </button>
                </>
              )}
            </p>
          </div>
          {showBuyInfo && (
            <div className="unlock-buy-info">
              <p>Visit the Buy Coins page to see packages and submit a purchase request.</p>
              <Link to="/buy-coins" className="button-primary" onClick={onClose}>Go to Buy Coins</Link>
            </div>
          )}
        </div>

        <div className="verification-modal-footer">
          <button className="button-secondary" onClick={onClose}>
            Cancel
          </button>
          <button
            className="button-primary"
            onClick={onConfirm}
            disabled={!hasEnoughCoins}
            title={!hasEnoughCoins ? "Insufficient balance" : undefined}
          >
            Unlock Contacts ({coinsRequired} coins)
          </button>
        </div>
      </div>
    </div>
  );
};

export default UnlockContactsModal;

