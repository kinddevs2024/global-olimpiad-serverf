import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { formatDate, getImageUrl } from "../../utils/helpers";
import { USER_ROLES } from "../../utils/constants";
import "./Profile.css";

const Profile = () => {
  const { user, balance } = useAuth();
  const [loading, setLoading] = useState(false);

  if (!user) {
    return (
      <div className="profile-page page-container">
        <div>
          <div className="profile-loading">
            <div className="loading-spinner"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-page page-container">
      <div>
        <div className="profile-header">
          <h1 className="profile-title text-glow">My Profile</h1>
          <div className="profile-actions">
            <Link to="/profile/edit" className="button-primary">
              Edit Profile
            </Link>
            <Link to="/settings" className="button-secondary">
              Settings
            </Link>
          </div>
        </div>

        <div className="profile-content">
          <div className="profile-card card">
            <div className="profile-avatar-section">
              {user.userLogo ? (
                <img
                  src={getImageUrl(user.userLogo)}
                  alt="Profile"
                  className="profile-avatar"
                />
              ) : (
                <div className="profile-avatar-placeholder">
                  {user.name?.charAt(0).toUpperCase() || "U"}
                </div>
              )}
              <div className="profile-name-section">
                <h2 className="profile-name">{user.name || "No Name"}</h2>
                <p className="profile-email">
                  {user.email || user.gmail || "No Email"}
                </p>
                <span className="profile-role-badge">
                  {user.role || "student"}
                </span>
              </div>
            </div>

            <div className="profile-details">
              <div className="profile-section">
                <h3 className="section-title">Personal Information</h3>
                <div className="detail-grid">
                  <div className="detail-item">
                    <span className="detail-label">First Name</span>
                    <span className="detail-value">
                      {user.firstName || "Not set"}
                    </span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Last Name</span>
                    <span className="detail-value">
                      {user.secondName || "Not set"}
                    </span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Date of Birth</span>
                    <span className="detail-value">
                      {user.dateBorn ? formatDate(user.dateBorn) : "Not set"}
                    </span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Gender</span>
                    <span className="detail-value">
                      {user.gender
                        ? user.gender.charAt(0).toUpperCase() +
                          user.gender.slice(1)
                        : "Not set"}
                    </span>
                  </div>
                  <div className="detail-item full-width">
                    <span className="detail-label">Address</span>
                    <span className="detail-value">
                      {user.address || "Not set"}
                    </span>
                  </div>
                </div>
              </div>

              {user.role === USER_ROLES.STUDENT && (
                <div className="profile-section">
                  <h3 className="section-title">School Information</h3>
                  <div className="detail-grid">
                    <div className="detail-item">
                      <span className="detail-label">School Name</span>
                      <span className="detail-value">
                        {user.schoolName || "Not set"}
                      </span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">School ID</span>
                      <span className="detail-value">
                        {user.schoolId || "Not set"}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              <div className="profile-section">
                <h3 className="section-title">Contact Information</h3>
                <div className="detail-grid">
                  <div className="detail-item">
                    <span className="detail-label">Phone Number</span>
                    <span className="detail-value">
                      {user.tel || "Not set"}
                    </span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Gmail</span>
                    <span className="detail-value">
                      {user.email || "Not set"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="profile-section">
                <h3 className="section-title">Account Information</h3>
                <div className="detail-grid">
                  <div className="detail-item">
                    <span className="detail-label">Role</span>
                    <span className="detail-value">
                      {user.role || "student"}
                    </span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Account Status</span>
                    <span
                      className={`detail-value ${
                        user.userBan ? "banned" : "active"
                      }`}
                    >
                      {user.userBan ? "Banned" : "Active"}
                    </span>
                  </div>
                  <div className="detail-item full-width profile-coins-row">
                    <span className="detail-label">Coins</span>
                    <span className="detail-value">
                      <span className="profile-balance">💰 {balance ?? 0} coins</span>
                      <Link to="/buy-coins" className="profile-get-more">
                        Get more
                      </Link>
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
