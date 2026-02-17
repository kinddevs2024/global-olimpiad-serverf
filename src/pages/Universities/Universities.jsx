import { useState, useEffect } from "react";
import { adminAPI } from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import NotificationToast from "../../components/NotificationToast";
import { formatDate } from "../../utils/helpers";
import "./Universities.css";

const Universities = () => {
  const { user } = useAuth();
  const [universities, setUniversities] = useState([]);
  const [universitiesWithStats, setUniversitiesWithStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notification, setNotification] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [selectedUniversity, setSelectedUniversity] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  useEffect(() => {
    fetchUniversities();
  }, []);

  const fetchUniversities = async () => {
    try {
      setLoading(true);
      const [usersResponse, olympiadsResponse, resultsResponse] = await Promise.all([
        adminAPI.getUsers(),
        adminAPI.getAllOlympiads(),
        adminAPI.getSubmissions(),
      ]);

      // Filter users with university role
      const universityUsers = (usersResponse.data?.data || usersResponse.data || []).filter(
        (u) => u.role === "university"
      );

      const allOlympiads = olympiadsResponse.data?.data || olympiadsResponse.data || [];
      const allResults = resultsResponse.data?.data || resultsResponse.data || [];

      // Calculate stats for each university
      const universitiesWithStatsData = universityUsers.map((univ) => {
        // Count olympiads created by this university
        const olympiadCount = allOlympiads.filter(
          (olympiad) => olympiad.createdBy === univ._id
        ).length;

        // Get olympiad IDs created by this university
        const universityOlympiadIds = allOlympiads
          .filter((olympiad) => olympiad.createdBy === univ._id)
          .map((olympiad) => olympiad._id);

        // Count unique students who have results/submissions for these olympiads
        const studentIds = new Set();
        allResults.forEach((result) => {
          if (universityOlympiadIds.includes(result.olympiadId)) {
            if (result.userId) {
              studentIds.add(result.userId);
            }
          }
        });

        return {
          ...univ,
          olympiadCount,
          studentCount: studentIds.size,
        };
      });

      setUniversities(universitiesWithStatsData);
      setUniversitiesWithStats(universitiesWithStatsData);
      setError(null);
    } catch (err) {
      console.error("Error fetching universities:", err);
      setError("Failed to load universities");
      setNotification({
        type: "error",
        message: "Failed to load universities. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredUniversities = universitiesWithStats.filter((univ) => {
    const matchesSearch =
      univ.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      univ.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      univ.schoolName?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      filterStatus === "all" ||
      (filterStatus === "active" && !univ.userBan) ||
      (filterStatus === "blocked" && univ.userBan);

    return matchesSearch && matchesStatus;
  });

  const handleBlockToggle = async (universityId, currentStatus) => {
    try {
      // Use adminAPI to update user ban status
      // This assumes a backend endpoint exists or will be created
      // For now, we'll use a PUT request to update the user
      const response = await adminAPI.getUsers();
      const allUsers = response.data?.data || response.data || [];
      const university = allUsers.find((u) => u._id === universityId && u.role === "university");
      
      if (!university) {
        setNotification({
          type: "error",
          message: "University not found",
        });
        return;
      }

      // Update user ban status via profile endpoint (admin/owner can update other users)
      // Note: This requires backend support for admin/owner to update userBan
      setNotification({
        type: "info",
        message: `Block/unblock functionality requires backend endpoint implementation. Current status: ${currentStatus ? "Blocked" : "Active"}`,
      });
      
      // After backend endpoint is implemented:
      // await adminAPI.toggleUserBan(universityId, !currentStatus);
      // fetchUniversities();
    } catch (err) {
      setNotification({
        type: "error",
        message: "Failed to update university status",
      });
    }
  };

  const handleViewDetails = (university) => {
    setSelectedUniversity(university);
    setShowDetailsModal(true);
  };

  const handleCloseDetails = () => {
    setShowDetailsModal(false);
    setSelectedUniversity(null);
  };

  if (loading) {
    return (
      <div className="universities-page">
        <div className="container">
          <div className="loading-spinner"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="universities-page">
      <div className="container">
        <div className="universities-header">
          <h1 className="universities-title text-glow">Universities Management</h1>
          <div className="universities-header-actions">
            <input
              type="text"
              placeholder="Search universities..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="status-filter"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="blocked">Blocked</option>
            </select>
          </div>
        </div>

        {error && (
          <div className="error-message card">
            <p>{error}</p>
            <button
              className="button-secondary"
              onClick={fetchUniversities}
            >
              Retry
            </button>
          </div>
        )}

        <div className="universities-stats card">
          <div className="stat-item">
            <span className="stat-label">Total Universities</span>
            <span className="stat-value">{universitiesWithStats.length}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Active</span>
            <span className="stat-value">
              {universitiesWithStats.filter((u) => !u.userBan).length}
            </span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Blocked</span>
            <span className="stat-value">
              {universitiesWithStats.filter((u) => u.userBan).length}
            </span>
          </div>
        </div>

        <div className="universities-list">
          {filteredUniversities.length === 0 ? (
            <div className="empty-state card">
              <p>No universities found</p>
            </div>
          ) : (
            <div className="universities-table">
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Status</th>
                    <th>Olympiads</th>
                    <th>Students</th>
                    <th>Created</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUniversities.map((univ) => (
                    <tr key={univ._id}>
                      <td>{univ.name || "N/A"}</td>
                      <td>{univ.email || "N/A"}</td>
                      <td>
                        <span
                          className={`status-badge ${
                            univ.userBan ? "blocked" : "active"
                          }`}
                        >
                          {univ.userBan ? "Blocked" : "Active"}
                        </span>
                      </td>
                      <td>{univ.olympiadCount || 0}</td>
                      <td>{univ.studentCount || 0}</td>
                      <td>
                        {univ.createdAt
                          ? formatDate(univ.createdAt)
                          : "N/A"}
                      </td>
                      <td>
                        <div className="action-buttons">
                          <button
                            className="button-secondary small"
                            onClick={() => handleViewDetails(univ)}
                            title="View Details"
                          >
                            View
                          </button>
                          <button
                            className={`button-secondary small ${
                              univ.userBan ? "button-success" : "button-danger"
                            }`}
                            onClick={() =>
                              handleBlockToggle(univ._id, univ.userBan)
                            }
                          >
                            {univ.userBan ? "Unblock" : "Block"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {notification && (
        <NotificationToast
          type={notification.type}
          message={notification.message}
          onClose={() => setNotification(null)}
        />
      )}

      {/* University Details Modal */}
      {showDetailsModal && selectedUniversity && (
        <div className="modal-overlay" onClick={handleCloseDetails}>
          <div
            className="modal-content university-details-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h2>University Details</h2>
              <button className="modal-close" onClick={handleCloseDetails}>
                ×
              </button>
            </div>
            <div className="modal-body">
              <div className="university-details">
                <div className="detail-section">
                  <h3>Basic Information</h3>
                  <div className="detail-row">
                    <span className="detail-label">Name:</span>
                    <span className="detail-value">{selectedUniversity.name || "N/A"}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Email:</span>
                    <span className="detail-value">{selectedUniversity.email || "N/A"}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Phone:</span>
                    <span className="detail-value">{selectedUniversity.tel || "N/A"}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Address:</span>
                    <span className="detail-value">{selectedUniversity.address || "N/A"}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">School/Organization:</span>
                    <span className="detail-value">{selectedUniversity.schoolName || "N/A"}</span>
                  </div>
                </div>

                <div className="detail-section">
                  <h3>Status & Statistics</h3>
                  <div className="detail-row">
                    <span className="detail-label">Status:</span>
                    <span
                      className={`status-badge ${
                        selectedUniversity.userBan ? "blocked" : "active"
                      }`}
                    >
                      {selectedUniversity.userBan ? "Blocked" : "Active"}
                    </span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Olympiad Count:</span>
                    <span className="detail-value">{selectedUniversity.olympiadCount || 0}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Student Count:</span>
                    <span className="detail-value">{selectedUniversity.studentCount || 0}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Created At:</span>
                    <span className="detail-value">
                      {selectedUniversity.createdAt
                        ? formatDate(selectedUniversity.createdAt)
                        : "N/A"}
                    </span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Last Updated:</span>
                    <span className="detail-value">
                      {selectedUniversity.updatedAt
                        ? formatDate(selectedUniversity.updatedAt)
                        : "N/A"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button
                className={`button-secondary ${
                  selectedUniversity.userBan ? "button-success" : "button-danger"
                }`}
                onClick={() => {
                  handleBlockToggle(selectedUniversity._id, selectedUniversity.userBan);
                }}
              >
                {selectedUniversity.userBan ? "Unblock" : "Block"}
              </button>
              <button className="button-secondary" onClick={handleCloseDetails}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Universities;

