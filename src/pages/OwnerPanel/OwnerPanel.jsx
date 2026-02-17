import { useState, useEffect } from "react";
import { ownerAPI, adminAPI } from "../../services/api";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import NotificationToast from "../../components/NotificationToast";
import {
  isOlympiadActive,
  isOlympiadUpcoming,
  isOlympiadEnded,
} from "../../utils/helpers";
import "./OwnerPanel.css";

const OwnerPanel = () => {
  const [analytics, setAnalytics] = useState(null);
  const [users, setUsers] = useState([]);
  const [olympiads, setOlympiads] = useState([]);
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [usersLoading, setUsersLoading] = useState(true);
  const [olympiadsLoading, setOlympiadsLoading] = useState(true);
  const [metricsLoading, setMetricsLoading] = useState(false);
  const [auditLoading, setAuditLoading] = useState(false);
  const [notification, setNotification] = useState(null);

  const [usersPage, setUsersPage] = useState(1);
  const [usersLimit, setUsersLimit] = useState(20);
  const [usersSearch, setUsersSearch] = useState("");
  const [usersRole, setUsersRole] = useState("");
  const [usersPagination, setUsersPagination] = useState({
    page: 1,
    pages: 1,
    total: 0,
    limit: 20,
  });

  const [olympiadsPage, setOlympiadsPage] = useState(1);
  const [olympiadsLimit, setOlympiadsLimit] = useState(20);
  const [olympiadsSearch, setOlympiadsSearch] = useState("");
  const [olympiadsStatus, setOlympiadsStatus] = useState("");
  const [olympiadsPagination, setOlympiadsPagination] = useState({
    page: 1,
    pages: 1,
    total: 0,
    limit: 20,
  });

  const getDefaultDateRange = () => {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - 29);
    return {
      startDate: start.toISOString().slice(0, 10),
      endDate: end.toISOString().slice(0, 10),
    };
  };

  const defaultRange = getDefaultDateRange();
  const [metricsStartDate, setMetricsStartDate] = useState(defaultRange.startDate);
  const [metricsEndDate, setMetricsEndDate] = useState(defaultRange.endDate);
  const [metricsData, setMetricsData] = useState(null);

  const [auditPage, setAuditPage] = useState(1);
  const [auditLimit, setAuditLimit] = useState(20);
  const [auditAction, setAuditAction] = useState("");
  const [auditStartDate, setAuditStartDate] = useState("");
  const [auditEndDate, setAuditEndDate] = useState("");
  const [auditLogs, setAuditLogs] = useState([]);
  const [auditPagination, setAuditPagination] = useState({
    page: 1,
    pages: 1,
    total: 0,
    limit: 20,
  });

  const [pendingRoleChange, setPendingRoleChange] = useState(null);

  useEffect(() => {
    fetchSummary();
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [usersPage, usersLimit, usersSearch, usersRole]);

  useEffect(() => {
    fetchOlympiads();
  }, [olympiadsPage, olympiadsLimit, olympiadsSearch, olympiadsStatus]);

  useEffect(() => {
    if (metricsStartDate && metricsEndDate) {
      fetchMetrics();
    }
  }, [metricsStartDate, metricsEndDate]);

  useEffect(() => {
    fetchAuditLogs();
  }, [auditPage, auditLimit, auditAction, auditStartDate, auditEndDate]);

  const fetchSummary = async () => {
    setSummaryLoading(true);
    try {
      const summaryRes = await ownerAPI.getDashboardSummary();
      setAnalytics(summaryRes.data?.data || summaryRes.data);
    } catch (error) {
      console.error("Error fetching data:", error);
      setNotification({ message: "Failed to load data", type: "error" });
    } finally {
      setSummaryLoading(false);
    }
  };

  const fetchUsers = async () => {
    setUsersLoading(true);
    try {
      const usersRes = await adminAPI.getUsers({
        page: usersPage,
        limit: usersLimit,
        search: usersSearch,
        role: usersRole,
      });
      const usersData = usersRes.data?.data || usersRes.data || [];
      setUsers(Array.isArray(usersData) ? usersData : []);
      setUsersPagination(
        usersRes.data?.pagination || {
          page: usersPage,
          pages: 1,
          total: Array.isArray(usersData) ? usersData.length : 0,
          limit: usersLimit,
        }
      );
    } catch (error) {
      console.error("Error fetching users:", error);
      setNotification({ message: "Failed to load users", type: "error" });
      setUsers([]);
    } finally {
      setUsersLoading(false);
    }
  };

  const fetchOlympiads = async () => {
    setOlympiadsLoading(true);
    try {
      const olympiadsRes = await adminAPI.getAllOlympiads({
        page: olympiadsPage,
        limit: olympiadsLimit,
        search: olympiadsSearch,
        status: olympiadsStatus,
      });
      const olympiadsData = olympiadsRes.data?.data || olympiadsRes.data || [];
      setOlympiads(Array.isArray(olympiadsData) ? olympiadsData : []);
      setOlympiadsPagination(
        olympiadsRes.data?.pagination || {
          page: olympiadsPage,
          pages: 1,
          total: Array.isArray(olympiadsData) ? olympiadsData.length : 0,
          limit: olympiadsLimit,
        }
      );
    } catch (error) {
      console.error("Error fetching olympiads:", error);
      setNotification({ message: "Failed to load olympiads", type: "error" });
      setOlympiads([]);
    } finally {
      setOlympiadsLoading(false);
    }
  };

  const fetchMetrics = async () => {
    setMetricsLoading(true);
    try {
      const metricsRes = await ownerAPI.getMetrics({
        startDate: metricsStartDate,
        endDate: metricsEndDate,
      });
      setMetricsData(metricsRes.data?.data || null);
    } catch (error) {
      console.error("Error fetching metrics:", error);
      setNotification({ message: "Failed to load metrics", type: "error" });
      setMetricsData(null);
    } finally {
      setMetricsLoading(false);
    }
  };

  const fetchAuditLogs = async () => {
    setAuditLoading(true);
    try {
      const auditRes = await ownerAPI.getAuditLogs({
        page: auditPage,
        limit: auditLimit,
        action: auditAction,
        startDate: auditStartDate || null,
        endDate: auditEndDate || null,
      });
      const data = auditRes.data?.data || [];
      setAuditLogs(Array.isArray(data) ? data : []);
      setAuditPagination(
        auditRes.data?.pagination || {
          page: auditPage,
          pages: 1,
          total: Array.isArray(data) ? data.length : 0,
          limit: auditLimit,
        }
      );
    } catch (error) {
      console.error("Error fetching audit logs:", error);
      setNotification({ message: "Failed to load audit logs", type: "error" });
      setAuditLogs([]);
    } finally {
      setAuditLoading(false);
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    try {
      await ownerAPI.changeUserRole(userId, newRole);
      setNotification({
        message: "User role updated successfully",
        type: "success",
      });
      fetchSummary();
      fetchUsers();
      fetchAuditLogs();
    } catch (error) {
      setNotification({ message: "Failed to update role", type: "error" });
    }
  };

  const requestRoleChange = (user, newRole) => {
    if (user.role === newRole) return;
    setPendingRoleChange({
      userId: user._id,
      userName: user.name || user.email,
      previousRole: user.role,
      newRole,
    });
  };

  const confirmRoleChange = async () => {
    if (!pendingRoleChange) return;
    await handleRoleChange(pendingRoleChange.userId, pendingRoleChange.newRole);
    setPendingRoleChange(null);
  };

  const cancelRoleChange = () => {
    setPendingRoleChange(null);
  };

  const isInitialLoading = summaryLoading || usersLoading || olympiadsLoading;

  const renderMetricChart = (title, series, valueSuffix = "") => {
    if (!Array.isArray(series) || series.length === 0) {
      return (
        <div className="chart-card card">
          <div className="chart-header">
            <h3 className="chart-title">{title}</h3>
          </div>
          <div className="chart-empty">No data</div>
        </div>
      );
    }

    return (
      <div className="chart-card card">
        <div className="chart-header">
          <h3 className="chart-title">{title}</h3>
          <div className="chart-range">{metricsStartDate} → {metricsEndDate}</div>
        </div>
        <div className="chart-body">
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={series}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
              <XAxis dataKey="date" tickFormatter={(value) => value.slice(5)} />
              <YAxis />
              <Tooltip formatter={(value) => `${value}${valueSuffix}`} />
              <Line type="monotone" dataKey="value" stroke="#38bdf8" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  };

  const formatShortDate = (value) => {
    if (!value) return "N/A";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "N/A";
    return date.toLocaleDateString();
  };

  const formatTimestamp = (value) => {
    if (!value) return "N/A";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "N/A";
    return date.toLocaleString();
  };

  const usersTotal = analytics?.totals?.users || usersPagination.total || users.length || 0;
  const olympiadsTotal = analytics?.totals?.olympiads || olympiadsPagination.total || olympiads.length || 0;

  const downloadCsv = (data, filename) => {
    const blob = data instanceof Blob ? data : new Blob([data], { type: "text/csv;charset=utf-8;" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  };

  const handleExportUsers = async () => {
    try {
      const response = await ownerAPI.exportUsers({
        search: usersSearch,
        role: usersRole,
      });
      downloadCsv(response.data, "owner-users.csv");
    } catch (error) {
      console.error("Export users error:", error);
      setNotification({ message: "Failed to export users", type: "error" });
    }
  };

  const handleExportOlympiads = async () => {
    try {
      const response = await ownerAPI.exportOlympiads({
        search: olympiadsSearch,
        status: olympiadsStatus,
      });
      downloadCsv(response.data, "owner-olympiads.csv");
    } catch (error) {
      console.error("Export olympiads error:", error);
      setNotification({ message: "Failed to export olympiads", type: "error" });
    }
  };

  const handleExportAuditLogs = async () => {
    try {
      const response = await ownerAPI.exportAuditLogs({
        action: auditAction,
        startDate: auditStartDate || null,
        endDate: auditEndDate || null,
      });
      downloadCsv(response.data, "owner-audit-logs.csv");
    } catch (error) {
      console.error("Export audit logs error:", error);
      setNotification({ message: "Failed to export audit logs", type: "error" });
    }
  };

  const handleExportMetrics = async () => {
    try {
      const response = await ownerAPI.exportMetrics({
        startDate: metricsStartDate,
        endDate: metricsEndDate,
      });
      downloadCsv(response.data, "owner-metrics.csv");
    } catch (error) {
      console.error("Export metrics error:", error);
      setNotification({ message: "Failed to export metrics", type: "error" });
    }
  };

  if (isInitialLoading) {
    return (
      <div className="owner-loading">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  return (
    <div className="owner-panel-page">
      <div className="container">
        <div className="owner-header">
          <h1 className="owner-title text-glow">Owner Panel</h1>
        </div>

        {/* Analytics Dashboard */}
        <div className="analytics-section">
          <h2 className="section-title">📊 Platform Analytics & Statistics</h2>

          {/* Key Metrics Cards */}
          <div className="analytics-grid">
            <div className="analytics-card card">
              <div className="analytics-icon">👥</div>
              <div className="analytics-label">Total Users</div>
              <div className="analytics-value">
                {usersTotal}
              </div>
              <div className="analytics-change positive">
                {analytics?.usersByRole?.student ||
                  users.filter((u) => u.role === "student").length} students
              </div>
            </div>

            <div className="analytics-card card">
              <div className="analytics-icon">🏆</div>
              <div className="analytics-label">Total Olympiads</div>
              <div className="analytics-value">
                {olympiadsTotal}
              </div>
              <div className="analytics-change">
                {analytics?.olympiadsByStatus?.published ||
                  olympiads.filter((o) => o.status === "published").length}{" "}
                published
              </div>
            </div>

            <div className="analytics-card card">
              <div className="analytics-icon">📝</div>
              <div className="analytics-label">Total Submissions</div>
              <div className="analytics-value">
                {analytics?.totals?.submissions || 0}
              </div>
              <div className="analytics-change">
                {analytics?.uniqueParticipants || 0}{" "}
                participants
              </div>
            </div>

            <div className="analytics-card card">
              <div className="analytics-icon">⚡</div>
              <div className="analytics-label">Active Olympiads</div>
              <div className="analytics-value">
                {analytics?.olympiadsByTime?.active ||
                  olympiads.filter((o) =>
                    isOlympiadActive(o.startTime, o.endTime)
                  ).length}
              </div>
              <div className="analytics-change positive">Currently running</div>
            </div>
          </div>

          {/* Detailed Statistics */}
          <div className="analytics-details">
            {/* User Distribution */}
            <div className="stat-card card">
              <h3 className="stat-title">👥 User Distribution</h3>
              <div className="stat-content">
                <div className="stat-item">
                  <span className="stat-label">Students</span>
                  <div className="stat-bar-container">
                    <div
                      className="stat-bar stat-bar-student"
                      style={{
                        width: `${
                          usersTotal > 0
                            ? ((analytics?.usersByRole?.student ||
                                users.filter((u) => u.role === "student")
                                  .length) /
                                usersTotal) *
                              100
                            : 0
                        }%`,
                      }}
                    ></div>
                    <span className="stat-value">
                      {analytics?.usersByRole?.student ||
                        users.filter((u) => u.role === "student").length}
                    </span>
                  </div>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Admins</span>
                  <div className="stat-bar-container">
                    <div
                      className="stat-bar stat-bar-admin"
                      style={{
                        width: `${
                          usersTotal > 0
                            ? ((analytics?.usersByRole?.admin ||
                                users.filter((u) => u.role === "admin")
                                  .length) /
                                usersTotal) *
                              100
                            : 0
                        }%`,
                      }}
                    ></div>
                    <span className="stat-value">
                      {analytics?.usersByRole?.admin ||
                        users.filter((u) => u.role === "admin").length}
                    </span>
                  </div>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Owners</span>
                  <div className="stat-bar-container">
                    <div
                      className="stat-bar stat-bar-owner"
                      style={{
                        width: `${
                          usersTotal > 0
                            ? ((analytics?.usersByRole?.owner ||
                                users.filter((u) => u.role === "owner")
                                  .length) /
                                usersTotal) *
                              100
                            : 0
                        }%`,
                      }}
                    ></div>
                    <span className="stat-value">
                      {analytics?.usersByRole?.owner ||
                        users.filter((u) => u.role === "owner").length}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Olympiad Status */}
            <div className="stat-card card">
              <h3 className="stat-title">🏆 Olympiad Status</h3>
              <div className="stat-content">
                <div className="stat-item">
                  <span className="stat-label">Published</span>
                  <div className="stat-bar-container">
                    <div
                      className="stat-bar stat-bar-published"
                      style={{
                        width: `${
                          olympiadsTotal > 0
                            ? ((analytics?.olympiadsByStatus?.published ||
                                olympiads.filter((o) => o.status === "published")
                                  .length) /
                                olympiadsTotal) *
                              100
                            : 0
                        }%`,
                      }}
                    ></div>
                    <span className="stat-value">
                      {analytics?.olympiadsByStatus?.published ||
                        olympiads.filter((o) => o.status === "published").length}
                    </span>
                  </div>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Draft</span>
                  <div className="stat-bar-container">
                    <div
                      className="stat-bar stat-bar-draft"
                      style={{
                        width: `${
                          olympiadsTotal > 0
                            ? ((analytics?.olympiadsByStatus?.draft ||
                                olympiads.filter((o) => o.status === "draft")
                                  .length) /
                                olympiadsTotal) *
                              100
                            : 0
                        }%`,
                      }}
                    ></div>
                    <span className="stat-value">
                      {analytics?.olympiadsByStatus?.draft ||
                        olympiads.filter((o) => o.status === "draft").length}
                    </span>
                  </div>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Unpublished</span>
                  <div className="stat-bar-container">
                    <div
                      className="stat-bar stat-bar-unpublished"
                      style={{
                        width: `${
                          olympiadsTotal > 0
                            ? ((analytics?.olympiadsByStatus?.unpublished ||
                                olympiads.filter(
                                  (o) => o.status === "unpublished"
                                ).length) /
                                olympiadsTotal) *
                              100
                            : 0
                        }%`,
                      }}
                    ></div>
                    <span className="stat-value">
                      {analytics?.olympiadsByStatus?.unpublished ||
                        olympiads.filter((o) => o.status === "unpublished")
                          .length}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Olympiad Timeline */}
            <div className="stat-card card">
              <h3 className="stat-title">📅 Olympiad Timeline</h3>
              <div className="stat-content">
                <div className="stat-item">
                  <span className="stat-label">Active</span>
                  <div className="stat-bar-container">
                    <div
                      className="stat-bar stat-bar-active"
                      style={{
                        width: `${
                          olympiadsTotal > 0
                            ? ((analytics?.olympiadsByTime?.active ||
                                olympiads.filter((o) =>
                                  isOlympiadActive(o.startTime, o.endTime)
                                ).length) /
                                olympiadsTotal) *
                              100
                            : 0
                        }%`,
                      }}
                    ></div>
                    <span className="stat-value">
                      {analytics?.olympiadsByTime?.active ||
                        olympiads.filter((o) =>
                          isOlympiadActive(o.startTime, o.endTime)
                        ).length}
                    </span>
                  </div>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Upcoming</span>
                  <div className="stat-bar-container">
                    <div
                      className="stat-bar stat-bar-upcoming"
                      style={{
                        width: `${
                          olympiadsTotal > 0
                            ? ((analytics?.olympiadsByTime?.upcoming ||
                                olympiads.filter((o) =>
                                  isOlympiadUpcoming(o.startTime)
                                ).length) /
                                olympiadsTotal) *
                              100
                            : 0
                        }%`,
                      }}
                    ></div>
                    <span className="stat-value">
                      {analytics?.olympiadsByTime?.upcoming ||
                        olympiads.filter((o) => isOlympiadUpcoming(o.startTime))
                          .length}
                    </span>
                  </div>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Ended</span>
                  <div className="stat-bar-container">
                    <div
                      className="stat-bar stat-bar-ended"
                      style={{
                        width: `${
                          olympiadsTotal > 0
                            ? ((analytics?.olympiadsByTime?.ended ||
                                olympiads.filter((o) =>
                                  isOlympiadEnded(o.endTime)
                                ).length) /
                                olympiadsTotal) *
                              100
                            : 0
                        }%`,
                      }}
                    ></div>
                    <span className="stat-value">
                      {analytics?.olympiadsByTime?.ended ||
                        olympiads.filter((o) => isOlympiadEnded(o.endTime))
                          .length}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Participation Statistics */}
            <div className="stat-card card">
              <h3 className="stat-title">📊 Participation Statistics</h3>
              <div className="stat-content">
                <div className="stat-metric">
                  <div className="metric-value">
                    {analytics?.uniqueParticipants || 0}
                  </div>
                  <div className="metric-label">Unique Participants</div>
                </div>
                <div className="stat-metric">
                  <div className="metric-value">
                    {analytics?.avgSubmissionsPerOlympiad !== undefined
                      ? analytics.avgSubmissionsPerOlympiad.toFixed(1)
                      : "0"}
                  </div>
                  <div className="metric-label">
                    Avg Submissions per Olympiad
                  </div>
                </div>
                <div className="stat-metric">
                  <div className="metric-value">
                    {analytics?.studentParticipationRate !== undefined
                      ? analytics.studentParticipationRate.toFixed(1)
                      : "0"}
                    %
                  </div>
                  <div className="metric-label">Student Participation Rate</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="trends-section">
          <div className="section-header">
            <h2 className="section-title">📈 Trends</h2>
            <div className="filters-row">
              <button className="export-button" onClick={handleExportMetrics}>
                Export CSV
              </button>
              <div className="filter-group">
                <label className="filter-label">Start</label>
                <input
                  type="date"
                  value={metricsStartDate}
                  onChange={(e) => setMetricsStartDate(e.target.value)}
                  className="filter-input"
                />
              </div>
              <div className="filter-group">
                <label className="filter-label">End</label>
                <input
                  type="date"
                  value={metricsEndDate}
                  onChange={(e) => setMetricsEndDate(e.target.value)}
                  className="filter-input"
                />
              </div>
            </div>
          </div>

          {metricsLoading ? (
            <div className="section-loading">Loading metrics...</div>
          ) : (
            <div className="charts-grid">
              {renderMetricChart("User Signups", metricsData?.users)}
              {renderMetricChart("Olympiad Creation", metricsData?.olympiads)}
              {renderMetricChart("Submissions", metricsData?.submissions)}
              {renderMetricChart("Results", metricsData?.results)}
              {renderMetricChart("Average Score", metricsData?.averageScore, "%")}
            </div>
          )}
        </div>

        <div className="olympiads-section">
          <div className="section-header">
            <h2 className="section-title">🏆 Olympiads</h2>
            <div className="filters-row">
              <button className="export-button" onClick={handleExportOlympiads}>
                Export CSV
              </button>
              <div className="filter-group">
                <label className="filter-label">Search</label>
                <input
                  type="text"
                  value={olympiadsSearch}
                  onChange={(e) => {
                    setOlympiadsSearch(e.target.value);
                    setOlympiadsPage(1);
                  }}
                  placeholder="Title or subject"
                  className="filter-input"
                />
              </div>
              <div className="filter-group">
                <label className="filter-label">Status</label>
                <select
                  value={olympiadsStatus}
                  onChange={(e) => {
                    setOlympiadsStatus(e.target.value);
                    setOlympiadsPage(1);
                  }}
                  className="filter-select"
                >
                  <option value="">All</option>
                  <option value="published">Published</option>
                  <option value="draft">Draft</option>
                  <option value="unpublished">Unpublished</option>
                  <option value="active">Active</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
              <div className="filter-group">
                <label className="filter-label">Per Page</label>
                <select
                  value={olympiadsLimit}
                  onChange={(e) => {
                    setOlympiadsLimit(Number(e.target.value));
                    setOlympiadsPage(1);
                  }}
                  className="filter-select"
                >
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                </select>
              </div>
            </div>
          </div>

          <div className="olympiads-table card">
            <div className="table-header">
              <div className="table-cell">Title</div>
              <div className="table-cell">Subject</div>
              <div className="table-cell">Status</div>
              <div className="table-cell">Starts</div>
              <div className="table-cell">Ends</div>
            </div>
            <div className="table-body">
              {olympiadsLoading ? (
                <div className="table-row table-empty">Loading olympiads...</div>
              ) : olympiads.length === 0 ? (
                <div className="table-row table-empty">No olympiads found.</div>
              ) : (
                olympiads.map((olympiad) => (
                  <div key={olympiad._id} className="table-row">
                    <div className="table-cell">{olympiad.title}</div>
                    <div className="table-cell">{olympiad.subject || "N/A"}</div>
                    <div className="table-cell">
                      <span className="role-badge">{olympiad.status}</span>
                    </div>
                    <div className="table-cell">{formatShortDate(olympiad.startTime)}</div>
                    <div className="table-cell">{formatShortDate(olympiad.endTime)}</div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="pagination-row">
            <button
              className="pagination-button"
              onClick={() => setOlympiadsPage(Math.max(1, olympiadsPage - 1))}
              disabled={olympiadsPage <= 1}
            >
              Prev
            </button>
            <div className="pagination-info">
              Page {olympiadsPagination.page} of {olympiadsPagination.pages} · {olympiadsPagination.total} total
            </div>
            <button
              className="pagination-button"
              onClick={() => setOlympiadsPage(Math.min(olympiadsPagination.pages, olympiadsPage + 1))}
              disabled={olympiadsPage >= olympiadsPagination.pages}
            >
              Next
            </button>
          </div>
        </div>

        <div className="users-section">
          <div className="section-header">
            <h2>User Management</h2>
            <div className="filters-row">
              <button className="export-button" onClick={handleExportUsers}>
                Export CSV
              </button>
              <div className="filter-group">
                <label className="filter-label">Search</label>
                <input
                  type="text"
                  value={usersSearch}
                  onChange={(e) => {
                    setUsersSearch(e.target.value);
                    setUsersPage(1);
                  }}
                  placeholder="Name or email"
                  className="filter-input"
                />
              </div>
              <div className="filter-group">
                <label className="filter-label">Role</label>
                <select
                  value={usersRole}
                  onChange={(e) => {
                    setUsersRole(e.target.value);
                    setUsersPage(1);
                  }}
                  className="filter-select"
                >
                  <option value="">All</option>
                  <option value="student">Student</option>
                  <option value="admin">Admin</option>
                  <option value="owner">Owner</option>
                  <option value="resolter">Resolter</option>
                  <option value="school-admin">School Admin</option>
                  <option value="school-teacher">School Teacher</option>
                  <option value="university">University</option>
                  <option value="checker">Checker</option>
                </select>
              </div>
              <div className="filter-group">
                <label className="filter-label">Per Page</label>
                <select
                  value={usersLimit}
                  onChange={(e) => {
                    setUsersLimit(Number(e.target.value));
                    setUsersPage(1);
                  }}
                  className="filter-select"
                >
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                </select>
              </div>
            </div>
          </div>
          <div className="users-table card">
            <div className="table-header">
              <div className="table-cell">Name</div>
              <div className="table-cell">Email</div>
              <div className="table-cell">Role</div>
              <div className="table-cell">Actions</div>
            </div>
            <div className="table-body">
              {usersLoading ? (
                <div className="table-row table-empty">Loading users...</div>
              ) : users.length === 0 ? (
                <div className="table-row table-empty">No users found.</div>
              ) : (
                users.map((user) => (
                  <div key={user._id} className="table-row">
                    <div className="table-cell">{user.name || "N/A"}</div>
                    <div className="table-cell">{user.email}</div>
                    <div className="table-cell">
                      <span className="role-badge">{user.role}</span>
                    </div>
                    <div className="table-cell">
                      <select
                        value={user.role}
                        onChange={(e) =>
                          requestRoleChange(user, e.target.value)
                        }
                        className="role-select"
                      >
                        <option value="student">Student</option>
                        <option value="admin">Admin</option>
                        <option value="owner">Owner</option>
                        <option value="resolter">Resolter</option>
                        <option value="school-admin">School Admin</option>
                        <option value="school-teacher">School Teacher</option>
                        <option value="university">University</option>
                        <option value="checker">Checker</option>
                      </select>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="pagination-row">
            <button
              className="pagination-button"
              onClick={() => setUsersPage(Math.max(1, usersPage - 1))}
              disabled={usersPage <= 1}
            >
              Prev
            </button>
            <div className="pagination-info">
              Page {usersPagination.page} of {usersPagination.pages} · {usersPagination.total} total
            </div>
            <button
              className="pagination-button"
              onClick={() => setUsersPage(Math.min(usersPagination.pages, usersPage + 1))}
              disabled={usersPage >= usersPagination.pages}
            >
              Next
            </button>
          </div>
        </div>

        <div className="audit-section">
          <div className="section-header">
            <h2 className="section-title">🧾 Owner Audit Log</h2>
            <div className="filters-row">
              <button className="export-button" onClick={handleExportAuditLogs}>
                Export CSV
              </button>
              <div className="filter-group">
                <label className="filter-label">Action</label>
                <select
                  value={auditAction}
                  onChange={(e) => {
                    setAuditAction(e.target.value);
                    setAuditPage(1);
                  }}
                  className="filter-select"
                >
                  <option value="">All</option>
                  <option value="user_role_change">Role Change</option>
                  <option value="olympiad_create">Olympiad Create</option>
                  <option value="olympiad_update">Olympiad Update</option>
                  <option value="olympiad_delete">Olympiad Delete</option>
                  <option value="olympiad_status_change">Olympiad Status</option>
                  <option value="olympiad_start">Olympiad Start</option>
                  <option value="olympiad_finish">Olympiad Finish</option>
                </select>
              </div>
              <div className="filter-group">
                <label className="filter-label">Start</label>
                <input
                  type="date"
                  value={auditStartDate}
                  onChange={(e) => {
                    setAuditStartDate(e.target.value);
                    setAuditPage(1);
                  }}
                  className="filter-input"
                />
              </div>
              <div className="filter-group">
                <label className="filter-label">End</label>
                <input
                  type="date"
                  value={auditEndDate}
                  onChange={(e) => {
                    setAuditEndDate(e.target.value);
                    setAuditPage(1);
                  }}
                  className="filter-input"
                />
              </div>
              <div className="filter-group">
                <label className="filter-label">Per Page</label>
                <select
                  value={auditLimit}
                  onChange={(e) => {
                    setAuditLimit(Number(e.target.value));
                    setAuditPage(1);
                  }}
                  className="filter-select"
                >
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                </select>
              </div>
            </div>
          </div>

          <div className="audit-table card">
            <div className="table-header">
              <div className="table-cell">Time</div>
              <div className="table-cell">Action</div>
              <div className="table-cell">Target</div>
              <div className="table-cell">Message</div>
            </div>
            <div className="table-body">
              {auditLoading ? (
                <div className="table-row table-empty">Loading audit logs...</div>
              ) : auditLogs.length === 0 ? (
                <div className="table-row table-empty">No audit logs found.</div>
              ) : (
                auditLogs.map((log) => (
                  <div key={log._id} className="table-row">
                    <div className="table-cell">{formatTimestamp(log.timestamp)}</div>
                    <div className="table-cell">{log.action}</div>
                    <div className="table-cell">{log.targetType}{log.targetId ? ` · ${log.targetId}` : ""}</div>
                    <div className="table-cell">{log.message || "-"}</div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="pagination-row">
            <button
              className="pagination-button"
              onClick={() => setAuditPage(Math.max(1, auditPage - 1))}
              disabled={auditPage <= 1}
            >
              Prev
            </button>
            <div className="pagination-info">
              Page {auditPagination.page} of {auditPagination.pages} · {auditPagination.total} total
            </div>
            <button
              className="pagination-button"
              onClick={() => setAuditPage(Math.min(auditPagination.pages, auditPage + 1))}
              disabled={auditPage >= auditPagination.pages}
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {pendingRoleChange && (
        <div className="modal-backdrop">
          <div className="modal-card">
            <h3 className="modal-title">Confirm Role Change</h3>
            <p className="modal-text">
              Change role for <strong>{pendingRoleChange.userName}</strong> from {pendingRoleChange.previousRole} to {pendingRoleChange.newRole}?
            </p>
            <div className="modal-actions">
              <button className="modal-button ghost" onClick={cancelRoleChange}>Cancel</button>
              <button className="modal-button primary" onClick={confirmRoleChange}>Confirm</button>
            </div>
          </div>
        </div>
      )}

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

export default OwnerPanel;
