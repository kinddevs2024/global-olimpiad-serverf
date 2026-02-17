import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import NotificationToast from "../../components/NotificationToast";
import { authAPI } from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import "./VerifyEmail.css";

const VerifyEmail = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { completeAuth } = useAuth();

  const email = useMemo(() => searchParams.get("email") || "", [searchParams]);
  const token = useMemo(() => searchParams.get("token") || "", [searchParams]);

  const [loading, setLoading] = useState(true);
  const [done, setDone] = useState(false);
  const [notification, setNotification] = useState(null);

  useEffect(() => {
    const verify = async () => {
      if (!email || !token) {
        setNotification({
          message: "Missing email or token. Please use the link from your email.",
          type: "error",
        });
        setLoading(false);
        return;
      }

      try {
        const response = await authAPI.verifyEmail({ email, token });
        if (response.data?.success) {
          setDone(true);
          if (response.data?.token && response.data?.user) {
            completeAuth(response.data.token, response.data.user);
            navigate("/dashboard");
            return;
          }
          setNotification({
            message: response.data?.message || "Email verified successfully.",
            type: "success",
          });
        } else {
          setNotification({
            message: response.data?.message || "Failed to verify email",
            type: "error",
          });
        }
      } catch (error) {
        const errorMessage =
          error.response?.data?.message ||
          error.message ||
          (error.code === "ERR_NETWORK"
            ? "Connection failed. Please try again."
            : "Failed to verify email");
        setNotification({ message: errorMessage, type: "error" });
      } finally {
        setLoading(false);
      }
    };

    verify();
  }, [email, token]);

  return (
    <div className="verify-email-page">
      <div className="verify-email-container">
        <div className="verify-email-card card">
          <div className="verify-email-header">
            <h1 className="verify-email-title text-glow">Verify Email</h1>
            <p className="verify-email-subtitle">
              {loading
                ? "Verifying your email..."
                : done
                ? "Your email is verified. You can sign in now."
                : "We could not verify your email."}
            </p>
          </div>

          <div className="verify-email-actions">
            <button
              type="button"
              className="button-primary"
              onClick={() => navigate("/auth")}
            >
              Go to Sign In
            </button>
          </div>
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

export default VerifyEmail;
