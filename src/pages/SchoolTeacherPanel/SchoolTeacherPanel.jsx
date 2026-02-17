import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { schoolTeacherAPI, olympiadAPI } from '../../services/api';
import { formatDate } from '../../utils/helpers';
import NotificationToast from '../../components/NotificationToast';
import RealTimeCaptureViewer from '../../components/RealTimeCaptureViewer';
import './SchoolTeacherPanel.css';

const SchoolTeacherPanel = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState(null);
  const [results, setResults] = useState([]);
  const [olympiads, setOlympiads] = useState([]);
  const [activeStudents, setActiveStudents] = useState([]);
  const [selectedOlympiad, setSelectedOlympiad] = useState(null);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [viewMode, setViewMode] = useState('results'); // 'results' or 'monitoring'
  const [refreshInterval, setRefreshInterval] = useState(null);

  useEffect(() => {
    fetchData();
    
    // Set up auto-refresh for monitoring mode
    if (viewMode === 'monitoring') {
      const interval = setInterval(() => {
        fetchActiveStudents();
      }, 5000); // Refresh every 5 seconds
      setRefreshInterval(interval);
      
      return () => {
        if (interval) clearInterval(interval);
      };
    } else {
      if (refreshInterval) {
        clearInterval(refreshInterval);
        setRefreshInterval(null);
      }
    }
  }, [viewMode]);

  useEffect(() => {
    if (selectedOlympiad) {
      fetchResults(selectedOlympiad);
    } else {
      fetchAllResults();
    }
  }, [selectedOlympiad]);

  const fetchData = async () => {
    try {
      const [olympiadsRes] = await Promise.all([
        olympiadAPI.getAll(),
      ]);
      const olympiadsData = olympiadsRes.data?.data || olympiadsRes.data || [];
      setOlympiads(Array.isArray(olympiadsData) ? olympiadsData : []);
      
      if (viewMode === 'monitoring') {
        await fetchActiveStudents();
      } else {
        await fetchAllResults();
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      setNotification({ message: 'Failed to load data', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const fetchAllResults = async () => {
    try {
      setLoading(true);
      const response = await schoolTeacherAPI.getSchoolResults();
      const data = response.data;
      
      if (Array.isArray(data)) {
        setResults(data);
      } else if (data.results) {
        setResults(data.results);
      } else {
        setResults([]);
      }
    } catch (error) {
      console.error('Error fetching school results:', error);
      setNotification({ message: 'Failed to load results', type: 'error' });
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchResults = async (olympiadId) => {
    try {
      setLoading(true);
      const response = await schoolTeacherAPI.getSchoolResults(olympiadId);
      const data = response.data;
      
      if (Array.isArray(data)) {
        setResults(data);
      } else if (data.results) {
        setResults(data.results);
      } else {
        setResults([]);
      }
    } catch (error) {
      console.error('Error fetching olympiad results:', error);
      setNotification({ message: 'Failed to load results', type: 'error' });
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchActiveStudents = async () => {
    try {
      const response = await schoolTeacherAPI.getActiveStudents();
      const data = response.data;
      
      if (Array.isArray(data)) {
        setActiveStudents(data);
      } else if (data.students) {
        setActiveStudents(data.students);
      } else {
        setActiveStudents([]);
      }
    } catch (error) {
      console.error('Error fetching active students:', error);
      // Don't show error notification for monitoring refresh failures
    }
  };

  const handleViewStudent = (student) => {
    setSelectedStudent(student);
    setViewMode('monitoring');
  };

  if (loading && results.length === 0 && activeStudents.length === 0) {
    return (
      <div className="school-teacher-panel-page">
        <div className="container">
          <div className="teacher-loading">
            <div className="loading-spinner"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="school-teacher-panel-page">
      <div className="container">
        <div className="teacher-header">
          <h1 className="teacher-title text-glow">School Teacher Panel</h1>
          <p className="teacher-subtitle">
            View results and monitor students from {user?.schoolName || 'your school'}
          </p>
        </div>

        {/* Mode Toggle */}
        <div className="mode-toggle">
          <button
            className={`mode-button ${viewMode === 'results' ? 'active' : ''}`}
            onClick={() => setViewMode('results')}
          >
            📊 Results
          </button>
          <button
            className={`mode-button ${viewMode === 'monitoring' ? 'active' : ''}`}
            onClick={() => setViewMode('monitoring')}
          >
            📹 Real-Time Monitoring
          </button>
        </div>

        {/* Results View */}
        {viewMode === 'results' && (
          <>
            {/* Filters */}
            <div className="teacher-filters">
              <div className="filter-group">
                <label>Filter by Olympiad:</label>
                <select
                  value={selectedOlympiad || ''}
                  onChange={(e) => {
                    setSelectedOlympiad(e.target.value || null);
                  }}
                  className="filter-select"
                >
                  <option value="">All Olympiads</option>
                  {olympiads.map((olympiad) => (
                    <option key={olympiad._id} value={olympiad._id}>
                      {olympiad.title}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Results Table */}
            <div className="teacher-results card">
              <div className="results-header">
                <h2 className="results-title">
                  {selectedOlympiad
                    ? `Results for ${olympiads.find((o) => o._id === selectedOlympiad)?.title || 'Olympiad'}`
                    : 'All School Results'}
                </h2>
                <button
                  className="button-secondary"
                  onClick={() => {
                    setSelectedOlympiad(null);
                    fetchAllResults();
                  }}
                >
                  Clear Filter
                </button>
              </div>

              {results.length === 0 ? (
                <div className="empty-results">
                  <p>No results found for your school</p>
                </div>
              ) : (
                <div className="results-table">
                  <div className="table-header">
                    <div className="table-cell">Student</div>
                    <div className="table-cell">Email</div>
                    <div className="table-cell">Olympiad</div>
                    <div className="table-cell">Score</div>
                    <div className="table-cell">Status</div>
                    <div className="table-cell">Submitted</div>
                  </div>
                  <div className="table-body">
                    {results.map((result, index) => (
                      <div key={result._id || index} className="table-row">
                        <div className="table-cell">
                          {result.user?.name || 'Anonymous'}
                        </div>
                        <div className="table-cell">
                          {result.user?.email || '-'}
                        </div>
                        <div className="table-cell">
                          {result.olympiadTitle || result.olympiad?.title || '-'}
                        </div>
                        <div className="table-cell">
                          <span className="score-value">
                            {result.totalScore || result.score || 0}
                          </span>
                          {result.totalPoints && (
                            <span className="score-max">
                              {' '}/ {result.totalPoints}
                            </span>
                          )}
                          {result.percentage !== undefined && (
                            <span className="score-percentage">
                              {' '}({result.percentage}%)
                            </span>
                          )}
                        </div>
                        <div className="table-cell">
                          <span
                            className={`status-badge ${
                              result.gradedAt ? 'graded' : 'pending'
                            }`}
                          >
                            {result.gradedAt ? 'Graded' : 'Pending'}
                          </span>
                        </div>
                        <div className="table-cell">
                          {result.submittedAt || result.completedAt
                            ? formatDate(result.submittedAt || result.completedAt)
                            : '-'}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </>
        )}

        {/* Real-Time Monitoring View */}
        {viewMode === 'monitoring' && (
          <div className="monitoring-view">
            {selectedStudent ? (
              <RealTimeCaptureViewer
                student={selectedStudent}
                onBack={() => setSelectedStudent(null)}
              />
            ) : (
              <div className="active-students card">
                <div className="students-header">
                  <h2 className="students-title">Active Students</h2>
                  <p className="students-subtitle">
                    Students currently taking olympiads
                  </p>
                </div>

                {activeStudents.length === 0 ? (
                  <div className="empty-students">
                    <p>No active students at the moment</p>
                  </div>
                ) : (
                  <div className="students-grid">
                    {activeStudents.map((student, index) => (
                      <div
                        key={student._id || student.userId || index}
                        className="student-card"
                        onClick={() => handleViewStudent(student)}
                      >
                        <div className="student-info">
                          <div className="student-name">
                            {student.user?.name || student.name || 'Anonymous'}
                          </div>
                          <div className="student-email">
                            {student.user?.email || student.email || '-'}
                          </div>
                          <div className="student-olympiad">
                            {student.olympiadTitle || student.olympiad?.title || 'Unknown Olympiad'}
                          </div>
                          <div className="student-status">
                            <span className="status-indicator active"></span>
                            Active
                          </div>
                        </div>
                        <div className="student-action">
                          <button className="button-primary">View Live</button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
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
    </div>
  );
};

export default SchoolTeacherPanel;

