import { useAuth } from "../../context/AuthContext";
import "./BalanceDisplay.css";

/**
 * Compact balance/coins display for navbar.
 * Uses existing design tokens and spacing.
 */
const BalanceDisplay = () => {
  const { balance } = useAuth();

  return (
    <div className="balance-display" title="Your coin balance">
      <span className="balance-icon" aria-hidden="true">
        💰
      </span>
      <span className="balance-value">{balance}</span>
      <span className="balance-label">Coins</span>
    </div>
  );
};

export default BalanceDisplay;
