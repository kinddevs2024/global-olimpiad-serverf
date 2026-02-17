import { useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import NotificationToast from "../../components/NotificationToast";
import { authAPI } from "../../services/api";
import "./UpdatePassword.css";

const UpdatePassword = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const email = useMemo(() => searchParams.get("email") || "", [searchParams]);
  const token = useMemo(() => searchParams.get("token") || "", [searchParams]);

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState(null);
  const [done, setDone] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setNotification(null);

    if (!email || !token) {
      setNotification({
        message: "Missing email or token. Please use the link from your email.",
        type: "error",
      });
      return;
    }

    if (password.length < 6) {
      setNotification({
        message: "Password must be at least 6 characters",
        type: "error",
      });
      return;
    }

    if (password !== confirmPassword) {
      setNotification({ message: "Passwords do not match", type: "error" });
      return;
    }

    try {
      setLoading(true);
      const response = await authAPI.setPassword({
        email,
        token,
        password,
      });

      if (response.data?.success) {
        setDone(true);
        setNotification({
          message: "Password set successfully. You can sign in now.",
          type: "success",
        });
      } else {
        setNotification({
          message: response.data?.message || "Failed to set password",
          type: "error",
        });
      }
    } catch (error) {
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        (error.code === "ERR_NETWORK"
          ? "Connection failed. Please try again."
          : "Failed to set password");
      setNotification({ message: errorMessage, type: "error" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="update-password-page">
      <div className="update-password-container">
        <div className="update-password-card card">
          <div className="update-password-header">
            <h1 className="update-password-title text-glow">Set Password</h1>
            <p className="update-password-subtitle">
              Create a password to access your account.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="update-password-form">
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                value={email}
                disabled
                readOnly
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">New Password</label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="Enter new password"
              />
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword">Confirm Password</label>
              <input
                type="password"
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                placeholder="Confirm new password"
              />
            </div>

            <div className="update-password-actions">
              <button
                type="submit"
                className="button-primary"
                disabled={loading || done}
              >
                {loading ? "Saving..." : "Set Password"}
              </button>
              <button
                type="button"
                className="button-secondary"
                onClick={() => navigate("/auth")}
              >
                Back to Sign In
              </button>
            </div>
          </form>
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

export default UpdatePassword;
