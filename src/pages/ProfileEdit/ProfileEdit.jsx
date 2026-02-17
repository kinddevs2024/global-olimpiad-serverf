import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { authAPI } from "../../services/api";
import { USER_ROLES } from "../../utils/constants";
import { getImageUrl } from "../../utils/helpers";
import NotificationToast from "../../components/NotificationToast";
import "./ProfileEdit.css";

const ProfileEdit = () => {
  const { user, setUser } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    firstName: "",
    secondName: "",
    email: "",
    gmail: "",
    tel: "",
    phone: null,
    address: "",
    schoolName: "",
    schoolId: "",
    dateBorn: "",
    gender: "",
    userLogo: null,
  });

  useEffect(() => {
    if (user) {
      // Format date for date input (YYYY-MM-DD)
      const formatDateForInput = (dateString) => {
        if (!dateString) return "";
        const date = new Date(dateString);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");
        return `${year}-${month}-${day}`;
      };

      // Parse name into firstName and secondName if needed
      let firstName = user.firstName || "";
      let secondName = user.secondName || "";
      const name = user.name || "";

      // If we have name but no firstName/secondName, try to split it
      if (name && !firstName && !secondName) {
        const nameParts = name.trim().split(/\s+/);
        firstName = nameParts[0] || "";
        secondName = nameParts.slice(1).join(" ") || "";
      }

      setFormData({
        name: name,
        firstName: firstName,
        secondName: secondName,
        email: user.email || "",
        gmail: user.gmail || "",
        tel: user.tel || "",
        phone: user.phone || null,
        address: user.address || "",
        schoolName: user.schoolName || "",
        schoolId: user.schoolId || "",
        dateBorn: formatDateForInput(user.dateBorn),
        gender: user.gender || "",
        userLogo: null,
      });
    }
  }, [user]);

  const handleChange = (e) => {
    if (e.target.type === "file") {
      setFormData({
        ...formData,
        [e.target.name]: e.target.files[0] || null,
      });
    } else {
      const newFormData = {
        ...formData,
        [e.target.name]: e.target.value,
      };

      // Auto-update name field when firstName or secondName changes
      if (e.target.name === "firstName" || e.target.name === "secondName") {
        const firstName =
          e.target.name === "firstName" ? e.target.value : formData.firstName;
        const secondName =
          e.target.name === "secondName" ? e.target.value : formData.secondName;
        newFormData.name =
          `${firstName || ""} ${secondName || ""}`.trim() || newFormData.name;
      }

      setFormData(newFormData);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setNotification(null);

    try {
      let logoUrl = user.userLogo || null;

      // First, upload logo if a new one is selected
      if (formData.userLogo) {
        try {
          const logoResponse = await authAPI.uploadLogo(formData.userLogo);
          logoUrl =
            logoResponse.data.logoUrl ||
            logoResponse.data.url ||
            logoResponse.data.userLogo;
          setNotification({
            message: "Logo uploaded successfully!",
            type: "success",
          });
        } catch (logoError) {
          setNotification({
            message:
              logoError.response?.data?.message ||
              "Failed to upload logo. Please try again.",
            type: "error",
          });
          setLoading(false);
          return;
        }
      }

      // Then update profile with logo URL
      // Backend expects 'name' field, not 'firstName' and 'secondName'
      // Construct name from firstName and secondName if name is empty
      const fullName =
        formData.name.trim() ||
        `${formData.firstName || ""} ${formData.secondName || ""}`.trim();

      if (!fullName) {
        setNotification({
          message: "Name is required",
          type: "error",
        });
        setLoading(false);
        return;
      }

      // Prepare JSON data for update
      const jsonData = {
        name: fullName,
        email: formData.email,
        firstName: formData.firstName || "",
        secondName: formData.secondName || "",
        gmail: formData.gmail || "",
        tel: formData.tel || "",
        phone: formData.phone || null,
        address: formData.address || "",
        gender: formData.gender || "",
        dateBorn: formData.dateBorn
          ? new Date(formData.dateBorn + "T00:00:00").toISOString()
          : "",
      };

      if (user.role === USER_ROLES.STUDENT) {
        jsonData.schoolName = formData.schoolName || "";
        jsonData.schoolId = formData.schoolId || "";
      }

      if (logoUrl) {
        jsonData.userLogo = logoUrl;
      }

      const response = await authAPI.updateProfile(jsonData);

      // Fetch updated user data with devices from /me endpoint
      try {
        const meResponse = await authAPI.getMe();
        const userData = meResponse.data;
        // Ensure devices array exists
        if (!userData.devices) {
          userData.devices = user.devices || [];
        }
        setUser(userData);
      } catch (meError) {
        console.error(
          "Error fetching user data after profile update:",
          meError
        );
        // Fallback to response data
        const updatedUser = response.data.user || response.data;
        if (!updatedUser.devices) {
          updatedUser.devices = user.devices || [];
        }
        setUser(updatedUser);
      }

      setNotification({
        message: "Profile updated successfully!",
        type: "success",
      });

      setTimeout(() => {
        navigate("/profile");
      }, 1500);
    } catch (error) {
      console.error("Profile update error:", error);
      console.error("Error response:", error.response?.data);
      const errorMessage =
        error.response?.data?.message ||
        error.response?.data?.error ||
        error.message ||
        "Failed to update profile. Please check all required fields.";
      setNotification({
        message: errorMessage,
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="profile-edit-page">
        <div className="container">
          <div className="profile-loading">
            <div className="loading-spinner"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-edit-page">
      <div className="container">
        <div className="profile-edit-header">
          <h1 className="profile-edit-title text-glow">Edit Profile</h1>
          <button
            className="button-secondary"
            onClick={() => navigate("/profile")}
          >
            Cancel
          </button>
        </div>

        <form onSubmit={handleSubmit} className="profile-edit-form card">
          <div className="form-section">
            <h3 className="section-title">Profile Picture</h3>
            <div className="form-group">
              <label htmlFor="userLogo">Upload Profile Picture</label>
              <input
                type="file"
                id="userLogo"
                name="userLogo"
                accept="image/*"
                onChange={handleChange}
                className="file-input"
              />
              {formData.userLogo && (
                <div className="file-preview">
                  <img
                    src={URL.createObjectURL(formData.userLogo)}
                    alt="Preview"
                    className="preview-image"
                  />
                </div>
              )}
              {!formData.userLogo && user.userLogo && (
                <div className="file-preview">
                  <img
                    src={getImageUrl(user.userLogo)}
                    alt="Current"
                    className="preview-image"
                  />
                  <p className="preview-note">Current profile picture</p>
                </div>
              )}
            </div>
          </div>

          <div className="form-section">
            <h3 className="section-title">Personal Information</h3>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="firstName">First Name</label>
                <input
                  type="text"
                  id="firstName"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  placeholder="Enter your first name"
                />
              </div>
              <div className="form-group">
                <label htmlFor="secondName">Last Name</label>
                <input
                  type="text"
                  id="secondName"
                  name="secondName"
                  value={formData.secondName}
                  onChange={handleChange}
                  placeholder="Enter your last name"
                />
              </div>
            </div>
            <div className="form-group">
              <label htmlFor="name">Full Name</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                placeholder="Enter your full name"
              />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="dateBorn">Date of Birth</label>
                <input
                  type="date"
                  id="dateBorn"
                  name="dateBorn"
                  value={formData.dateBorn}
                  onChange={handleChange}
                />
              </div>
              <div className="form-group">
                <label htmlFor="gender">Gender</label>
                <select
                  id="gender"
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  className="form-select"
                >
                  <option value="">Select gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                  <option value="prefer-not-to-say">Prefer not to say</option>
                </select>
              </div>
            </div>
            <div className="form-group">
              <label htmlFor="address">Address</label>
              <textarea
                id="address"
                name="address"
                value={formData.address}
                onChange={handleChange}
                placeholder="Enter your address"
                rows="3"
              />
            </div>
          </div>

          {user.role === USER_ROLES.STUDENT && (
            <div className="form-section">
              <h3 className="section-title">School Information</h3>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="schoolName">School Name</label>
                  <input
                    type="text"
                    id="schoolName"
                    name="schoolName"
                    value={formData.schoolName}
                    onChange={handleChange}
                    placeholder="Enter your school name"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="schoolId">School ID</label>
                  <input
                    type="text"
                    id="schoolId"
                    name="schoolId"
                    value={formData.schoolId}
                    onChange={handleChange}
                    placeholder="Enter your school ID"
                  />
                </div>
              </div>
            </div>
          )}

          <div className="form-section">
            <h3 className="section-title">Contact Information</h3>
            <div className="form-group">
              <label htmlFor="tel">Phone Number</label>
              <input
                type="tel"
                id="tel"
                name="tel"
                value={formData.tel}
                onChange={handleChange}
                placeholder="Enter your phone number"
              />
            </div>
            <div className="form-group">
              <label htmlFor="email">Gmail</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                placeholder="Enter your email"
              />
            </div>
          </div>

          <div className="form-actions">
            <button
              type="button"
              className="button-secondary"
              onClick={() => navigate("/profile")}
            >
              Cancel
            </button>
            <button type="submit" className="button-primary" disabled={loading}>
              {loading ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>

        {notification && (
          <NotificationToast
            message={notification.message}
            type={notification.type}
            onClose={() => setNotification(null)}
          />
        )}
      </div>
    </div>
  );
};

export default ProfileEdit;
