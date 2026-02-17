import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { paymentAPI } from "../../services/api";
import "./BuyCoins.css";

const COIN_PRICE_UZS = 2250; // 1 coin ≈ 2,250 so'm (for custom)

const BuyCoins = () => {
  const { balance, refreshBalance } = useAuth();
  const [formData, setFormData] = useState({
    amount: "50",
    customAmount: "",
  });
  const [paying, setPaying] = useState(false);
  const [payError, setPayError] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("success") === "1" && refreshBalance) {
      refreshBalance();
      window.history.replaceState({}, "", "/buy-coins");
    }
  }, [refreshBalance]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const selectPackage = (coins) => {
    setFormData((prev) => ({
      ...prev,
      amount: String(coins),
      customAmount: "",
    }));
  };

  const selectCustom = () => {
    setFormData((prev) => ({
      ...prev,
      amount: "custom",
      customAmount: prev.customAmount || "100",
    }));
  };

  const getAmountUzs = () => {
    if (isCustom) return (selectedCoins || 0) * COIN_PRICE_UZS;
    const pkg = packages.find((p) => String(p.coins) === formData.amount);
    return pkg ? pkg.priceUzs : 0;
  };

  const returnUrl = `${window.location.origin}/buy-coins?success=1`;

  const handlePayment = async (provider) => {
    if (selectedCoins < 1) return;
    setPayError("");
    setPaying(true);
    try {
      const api = provider === 'click' ? paymentAPI.createClick : paymentAPI.createPayme;
      const res = await api({
        coins: selectedCoins,
        amountUzs: getAmountUzs(),
        returnUrl,
      });
      if (res.data?.paymentUrl) {
        window.location.href = res.data.paymentUrl;
      } else {
        setPayError("Could not create payment. Please try again.");
      }
    } catch (err) {
      setPayError(err.response?.data?.message || "Connection failed. Please try again.");
    } finally {
      setPaying(false);
    }
  };

  const packages = [
    { coins: 50, priceUzs: 125000, recommended: false },
    { coins: 100, priceUzs: 225000, recommended: true, save: "10%" },
    { coins: 250, priceUzs: 500000, recommended: false, save: "20%" },
  ];

  const formatUzs = (n) => `${(n || 0).toLocaleString("uz-UZ")} so'm`;

  const isCustom = formData.amount === "custom";
  const selectedCoins = isCustom
    ? (parseInt(formData.customAmount, 10) || 0)
    : parseInt(formData.amount, 10);

  return (
    <div className="buy-coins-page">
      <header className="buy-coins-header">
        <h1 className="buy-coins-title">Buy Coins</h1>
        <p className="buy-coins-subtitle">
          Coins let you unlock student contact information in portfolios
        </p>
        <div className="buy-coins-balance">
          <span className="balance-icon">💰</span>
          <span>Your balance: <strong>{balance}</strong> coins</span>
        </div>
      </header>

      <section className="buy-coins-content">
        <div className="card buy-coins-card">
          <h2 className="section-title">Coin Packages</h2>
          <p className="section-description">
            Choose a package or request a custom amount. Pay with Payme (Uzbekistan so'm).
          </p>

          <div className="coin-packages">
            {packages.map((pkg) => (
              <button
                type="button"
                key={pkg.coins}
                className={`coin-package ${pkg.recommended ? "popular" : ""} ${formData.amount === String(pkg.coins) ? "selected" : ""}`}
                onClick={() => selectPackage(pkg.coins)}
              >
                {pkg.recommended && <div className="package-recommended">Recommended</div>}
                <div className="package-coins">{pkg.coins} coins</div>
                <div className="package-price">{formatUzs(pkg.priceUzs)}</div>
                {pkg.save && (
                  <span className="package-save">Save {pkg.save}</span>
                )}
              </button>
            ))}
            <button
              type="button"
              className={`coin-package custom ${isCustom ? "selected" : ""}`}
              onClick={selectCustom}
            >
              <div className="package-coins">Custom</div>
              <div className="package-price">Your choice</div>
            </button>
          </div>

          {isCustom && (
            <div className="form-group custom-amount-row">
              <label htmlFor="customAmount">Custom amount (coins)</label>
              <input
                type="number"
                id="customAmount"
                name="customAmount"
                min="1"
                max="9999"
                value={formData.customAmount}
                onChange={handleChange}
                placeholder="e.g. 150"
              />
            </div>
          )}

          <div className="buy-coins-form-section">
            <h3>Pay with</h3>
            <p className="form-description">
              Select a plan above and choose a payment method (Uzbek so'm).
            </p>

            <div className="payme-section">
              <div className="payme-summary">
                <span>{selectedCoins} coins</span>
                <span className="payme-amount">{formatUzs(getAmountUzs())}</span>
              </div>
              <div className="payment-buttons">
                <button
                  type="button"
                  className="button-primary payment-btn payme-btn"
                  onClick={() => handlePayment('payme')}
                  disabled={selectedCoins < 1 || paying}
                >
                  {paying ? "Redirecting…" : "Pay with Payme"}
                </button>
                <button
                  type="button"
                  className="button-primary payment-btn click-btn"
                  onClick={() => handlePayment('click')}
                  disabled={selectedCoins < 1 || paying}
                >
                  {paying ? "Redirecting…" : "Pay with Click"}
                </button>
              </div>
              {payError && <p className="payme-error">{payError}</p>}
            </div>
          </div>
        </div>

        <div className="card buy-coins-info">
          <h3>How it works</h3>
          <ul>
            <li>1 coin = 1 unlock of student contact information</li>
            <li>Pay with Payme or Click (Uzbek so'm)</li>
            <li>You will be redirected to the payment checkout</li>
            <li>Coins are added to your account after payment</li>
          </ul>
          <Link to="/contact" className="button-secondary">
            Contact support
          </Link>
        </div>
      </section>
    </div>
  );
};

export default BuyCoins;
