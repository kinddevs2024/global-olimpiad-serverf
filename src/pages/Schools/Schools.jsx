import { useState, useEffect } from "react";
import { adminAPI } from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import NotificationToast from "../../components/NotificationToast";
import { formatDate } from "../../utils/helpers";
import "./Schools.css";

const Schools = () => {
  const { user } = useAuth();
  const [schools, setSchools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notification, setNotification] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterRole, setFilterRole] = useState("all");
  const [selectedSchool, setSelectedSchool] = useState(null);

  useEffect(() => {
    fetchSchools();
  }, []);

  const fetchSchools = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getUsers();
      // Filter users with school-admin or school-teacher roles
      const schoolUsers = response.data.filter(
        (u) =>
          u.role === "school-admin" ||
          u.role === "school_admin" ||
          u.role === "school-teacher" ||
          u.role === "school_teacher"
      );
      setSchools(schoolUsers);
      setError(null);
    } catch (err) {
      console.error("Error fetching schools:", err);
      setError("Failed to load schools");
      setNotification({
        type: "error",
        message: "Failed to load schools. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  const isSchoolAdmin = (role) => {
    return role === "school-admin" || role === "school_admin";
  };

  const isSchoolTeacher = (role) => {
    return role === "school-teacher" || role === "school_teacher";
  };

  const getRoleLabel = (role) => {
    if (isSchoolAdmin(role)) return "School Admin";
    if (isSchoolTeacher(role)) return "School Teacher";
    return role;
  };

  const filteredSchools = schools.filter((school) => {
    const matchesSearch =
      school.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      school.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      school.schoolName?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      filterStatus === "all" ||
      (filterStatus === "active" && !school.userBan) ||
      (filterStatus === "banned" && school.userBan);

    const matchesRole =
      filterRole === "all" ||
      (filterRole === "admin" && isSchoolAdmin(school.role)) ||
      (filterRole === "teacher" && isSchoolTeacher(school.role));

    return matchesSearch && matchesStatus && matchesRole;
  });

  const schoolAdmins = filteredSchools.filter((s) => isSchoolAdmin(s.role));
  const schoolTeachers = filteredSchools.filter((s) => isSchoolTeacher(s.role));

  const handleBlockToggle = async (schoolId, currentStatus) => {
    try {
      // Note: This would require a backend endpoint to block/unblock users
      // For now, we'll just show a notification
      setNotification({
        type: "info",
        message: `Block/unblock functionality requires backend implementation`,
      });
      // After backend is implemented, you would call:
      // await adminAPI.toggleUserBan(schoolId, !currentStatus);
      // fetchSchools();
    } catch (err) {
      setNotification({
        type: "error",
        message: "Failed to update school status",
      });
    }
  };

  const handleViewDetails = (school) => {
    setSelectedSchool(school);
  };

  const closeDetails = () => {
    setSelectedSchool(null);
  };

  const renderTable = (schoolsList, title) => {
    if (schoolsList.length === 0) return null;

    return (
      <div className="schools-group">
        <h2 className="schools-group-title">{title}</h2>
        <div className="schools-table">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>School Name</th>
                <th>Status</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {schoolsList.map((school) => (
                <tr key={school._id}>
                  <td>{school.name || "N/A"}</td>
                  <td>{school.email || "N/A"}</td>
                  <td>{school.schoolName || "N/A"}</td>
                  <td>
                    <span
                      className={`status-badge ${
                        school.userBan ? "banned" : "active"
                      }`}
                    >
                      {school.userBan ? "Banned" : "Active"}
                    </span>
                  </td>
                  <td>
                    {school.createdAt ? formatDate(school.createdAt) : "N/A"}
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button
                        className="button-secondary small"
                        onClick={() => handleViewDetails(school)}
                      >
                        View Details
                      </button>
                      <button
                        className="button-secondary small"
                        onClick={() =>
                          handleBlockToggle(school._id, school.userBan)
                        }
                      >
                        {school.userBan ? "Unblock" : "Block"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="schools-page">
        <div className="container">
          <div className="loading-spinner"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="schools-page">
      <div className="container">
        <div className="schools-header">
          <h1 className="schools-title text-glow">Schools Management</h1>
          <div className="schools-header-actions">
            <input
              type="text"
              placeholder="Search schools..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="role-filter"
            >
              <option value="all">All Roles</option>
              <option value="admin">School Admin</option>
              <option value="teacher">School Teacher</option>
            </select>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="status-filter"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="banned">Banned</option>
            </select>
          </div>
        </div>

        {error && (
          <div className="error-message card">
            <p>{error}</p>
            <button className="button-secondary" onClick={fetchSchools}>
              Retry
            </button>
          </div>
        )}

        <div className="schools-stats card">
          <div className="stat-item">
            <span className="stat-label">Total Schools</span>
            <span className="stat-value">{schools.length}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">School Admins</span>
            <span className="stat-value">
              {schools.filter((s) => isSchoolAdmin(s.role)).length}
            </span>
          </div>
          <div className="stat-item">
            <span className="stat-label">School Teachers</span>
            <span className="stat-value">
              {schools.filter((s) => isSchoolTeacher(s.role)).length}
            </span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Active</span>
            <span className="stat-value">
              {schools.filter((s) => !s.userBan).length}
            </span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Banned</span>
            <span className="stat-value">
              {schools.filter((s) => s.userBan).length}
            </span>
          </div>
        </div>

        <div className="schools-list">
          {filteredSchools.length === 0 ? (
            <div className="empty-state card">
              <p>No schools found</p>
            </div>
          ) : (
            <>
              {renderTable(schoolAdmins, "School Admins")}
              {renderTable(schoolTeachers, "School Teachers")}
            </>
          )}
        </div>
      </div>

      {selectedSchool && (
        <div className="details-modal-overlay" onClick={closeDetails}>
          <div
            className="details-modal card"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="details-modal-header">
              <h2>School Details</h2>
              <button className="details-modal-close" onClick={closeDetails}>
                ×
              </button>
            </div>
            <div className="details-modal-content">
              <div className="detail-row">
                <span className="detail-label">Name:</span>
                <span className="detail-value">
                  {selectedSchool.name || "N/A"}
                </span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Email:</span>
                <span className="detail-value">
                  {selectedSchool.email || "N/A"}
                </span>
              </div>
              <div className="detail-row">
                <span className="detail-label">School Name:</span>
                <span className="detail-value">
                  {selectedSchool.schoolName || "N/A"}
                </span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Role:</span>
                <span className="detail-value">
                  {getRoleLabel(selectedSchool.role)}
                </span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Status:</span>
                <span
                  className={`status-badge ${
                    selectedSchool.userBan ? "banned" : "active"
                  }`}
                >
                  {selectedSchool.userBan ? "Banned" : "Active"}
                </span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Created:</span>
                <span className="detail-value">
                  {selectedSchool.createdAt
                    ? formatDate(selectedSchool.createdAt)
                    : "N/A"}
                </span>
              </div>
              {selectedSchool.schoolId && (
                <div className="detail-row">
                  <span className="detail-label">School ID:</span>
                  <span className="detail-value">
                    {selectedSchool.schoolId}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {notification && (
        <NotificationToast
          type={notification.type}
          message={notification.message}
          onClose={() => setNotification(null)}
        />
      )}
    </div>
  );
};

export default Schools;
