import { useState, useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { olympiadAPI, adminAPI, resolterAPI } from '../../services/api';
import { useSocket } from '../../context/SocketContext';
import { useAuth } from '../../context/AuthContext';
import { formatDate } from '../../utils/helpers';
import { USER_ROLES } from '../../utils/constants';
import NotificationToast from '../../components/NotificationToast';
import './Leaderboard.css';

const Leaderboard = () => {
  const { id } = useParams();
  const { on } = useSocket();
  const { user } = useAuth();
  const [allResults, setAllResults] = useState([]);
  const [olympiads, setOlympiads] = useState([]);
  const [olympiad, setOlympiad] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [notification, setNotification] = useState(null);
  const [editingResult, setEditingResult] = useState(null);
  const [editForm, setEditForm] = useState({
    totalScore: '',
    maxScore: '',
    percentage: '',
    status: 'active',
    visible: true,
  });

  // Check if user is resolter
  const isResolter = user?.role === USER_ROLES.RESOLTER;

  useEffect(() => {
    if (!user) return; // Wait for user to be loaded
    fetchLeaderboard();
    
    if (on) {
      on('leaderboard-update', (data) => {
        if (id && data.olympiadId === id) {
          fetchLeaderboard();
        } else if (!id) {
          fetchLeaderboard();
        }
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, on, user?.role]);

  const fetchLeaderboard = async () => {
    setLoading(true);
    
    try {
      // Fetch all results from all olympiads
      let submissionsResponse;
      if (isResolter) {
        submissionsResponse = await resolterAPI.getAllResults();
      } else {
        submissionsResponse = await adminAPI.getSubmissions(null, null);
      }
      
      const submissionsData = submissionsResponse?.data;
      
      let submissions = [];
      
      // Handle resolter API response structure with olympiadResults
      if (submissionsData && typeof submissionsData === 'object' && submissionsData.olympiadResults && Array.isArray(submissionsData.olympiadResults)) {
        // Extract and flatten all results from all olympiads
        submissionsData.olympiadResults.forEach((olympiadGroup) => {
          if (olympiadGroup.results && Array.isArray(olympiadGroup.results)) {
            olympiadGroup.results.forEach((result) => {
              submissions.push({
                ...result,
                _id: result.resultId || result._id,
                olympiadId: olympiadGroup.olympiadId,
                olympiad: olympiadGroup.olympiad,
                olympiadTitle: olympiadGroup.olympiad?.title,
                olympiadType: olympiadGroup.olympiad?.type,
                user: {
                  _id: result.userId,
                  name: result.userName,
                  email: result.userEmail,
                },
                totalScore: result.score,
                submittedAt: result.completedAt,
                completedAt: result.completedAt,
              });
            });
          }
        });
      } else if (Array.isArray(submissionsData)) {
        submissions = submissionsData;
      } else if (submissionsData && typeof submissionsData === 'object') {
        submissions = submissionsData.submissions || submissionsData.data || [];
      }
      
      // Get all olympiads
      const olympiadsResponse = await olympiadAPI.getAll();
      const olympiadsData = olympiadsResponse?.data || [];
      const olympiadsList = Array.isArray(olympiadsData) ? olympiadsData : [];
      setOlympiads(olympiadsList);
      
      // If specific olympiad ID provided, get its details
      if (id) {
        const olympiadData = olympiadsList.find(o => o._id === id);
        if (olympiadData) {
          setOlympiad(olympiadData);
          // Set filter to this olympiad
          setSelectedFilter(`olympiad-${olympiadData.title}`);
        }
      }
      
      // Combine submissions with olympiad data
      const resultsWithOlympiad = submissions.map((submission) => {
        const olympiad = olympiadsList.find((o) => o._id === submission.olympiadId);
        return {
          ...submission,
          olympiad: olympiad,
          olympiadTitle: olympiad?.title || 'Unknown Olympiad',
          olympiadType: olympiad?.type || 'test',
          totalPoints: olympiad?.totalPoints || 100,
          score: submission.score || submission.totalScore || 0,
          totalScore: submission.totalScore || submission.score || 0,
          completedAt: submission.submittedAt || submission.completedAt,
          user: submission.user || { name: 'Unknown', email: 'Unknown' }
        };
      });
      
      // Sort by score (highest first), then by completion time
      resultsWithOlympiad.sort((a, b) => {
        if (b.totalScore !== a.totalScore) {
          return b.totalScore - a.totalScore;
        }
        const timeA = new Date(a.completedAt || 0).getTime();
        const timeB = new Date(b.completedAt || 0).getTime();
        return timeA - timeB;
      });
      
      setAllResults(resultsWithOlympiad);
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  // Get unique olympiad types and titles for filters
  const filterOptions = useMemo(() => {
    const options = [{ value: 'all', label: 'All' }];
    
    // Always show filters when we have results
    if (allResults.length > 0) {
      // Get unique olympiad titles first (most important for switching)
      const titles = [...new Set(allResults.map(r => r.olympiadTitle).filter(Boolean))];
      titles.forEach(title => {
        options.push({ value: `olympiad-${title}`, label: title });
      });
      
      // Then get unique olympiad types
      const types = [...new Set(allResults.map(r => r.olympiadType).filter(Boolean))];
      types.forEach(type => {
        options.push({ value: `type-${type}`, label: type.charAt(0).toUpperCase() + type.slice(1) });
      });
    }
    
    return options;
  }, [allResults]);

  // Filter and search results
  const filteredResults = useMemo(() => {
    let filtered = [...allResults];
    
    // Apply filter
    if (selectedFilter !== 'all') {
      if (selectedFilter.startsWith('type-')) {
        const type = selectedFilter.replace('type-', '');
        filtered = filtered.filter(r => r.olympiadType === type);
      } else if (selectedFilter.startsWith('olympiad-')) {
        const title = selectedFilter.replace('olympiad-', '');
        filtered = filtered.filter(r => r.olympiadTitle === title);
      }
    }
    
    // Apply search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(r => {
        const name = (r.user?.name || '').toLowerCase();
        const email = (r.user?.email || '').toLowerCase();
        const olympiadTitle = (r.olympiadTitle || '').toLowerCase();
        return name.includes(query) || email.includes(query) || olympiadTitle.includes(query);
      });
    }
    
    // Assign ranks to filtered results
    filtered.forEach((r, index) => {
      r.rank = index + 1;
    });
    
    return filtered;
  }, [allResults, selectedFilter, searchQuery]);

  const getRankIcon = (rank) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `#${rank}`;
  };

  const openEditModal = (result) => {
    setEditingResult(result);
    setEditForm({
      totalScore: result.totalScore || result.score || '',
      maxScore: result.totalPoints || result.maxScore || '',
      percentage: result.percentage || '',
      status: result.status || 'active',
      visible: result.visible !== false,
    });
  };

  const closeEditModal = () => {
    setEditingResult(null);
    setEditForm({
      totalScore: '',
      maxScore: '',
      percentage: '',
      status: 'active',
      visible: true,
    });
  };

  const handleEditResult = async () => {
    if (!editingResult) return;

    try {
      setLoading(true);
      const updateData = {};
      
      if (editForm.totalScore) {
        updateData.totalScore = parseFloat(editForm.totalScore);
      }
      if (editForm.maxScore) {
        updateData.maxScore = parseFloat(editForm.maxScore);
      }
      if (editForm.percentage) {
        updateData.percentage = parseFloat(editForm.percentage);
      }

      await resolterAPI.editResult(editingResult._id || editingResult.resultId, updateData);
      
      setNotification({ message: 'Result updated successfully!', type: 'success' });
      closeEditModal();
      fetchLeaderboard();
    } catch (error) {
      setNotification({
        message: error.response?.data?.message || 'Failed to update result',
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChangeStatus = async (resultId, status) => {
    try {
      setLoading(true);
      await resolterAPI.changeResultStatus(resultId, status);
      setNotification({ message: `Result status changed to ${status}`, type: 'success' });
      fetchLeaderboard();
    } catch (error) {
      setNotification({
        message: error.response?.data?.message || 'Failed to change status',
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleToggleVisibility = async (resultId, currentVisible) => {
    try {
      setLoading(true);
      await resolterAPI.toggleResultVisibility(resultId, !currentVisible);
      setNotification({ 
        message: `Result ${!currentVisible ? 'made visible' : 'hidden'}`, 
        type: 'success' 
      });
      fetchLeaderboard();
    } catch (error) {
      setNotification({
        message: error.response?.data?.message || 'Failed to toggle visibility',
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="leaderboard-loading">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  return (
    <div className="leaderboard-page">
      <NotificationToast
        notification={notification}
        onClose={() => setNotification(null)}
      />
      <div className="container">
        <div className="leaderboard-header">
          <h1 className="leaderboard-title text-glow">Leaderboard</h1>
          {olympiad && id ? (
            <h2 className="leaderboard-subtitle">{olympiad.title}</h2>
          ) : (
            <p className="leaderboard-description">All results from all olympiads</p>
          )}
          {isResolter && (
            <p className="leaderboard-hint">You can edit results by clicking the Edit button</p>
          )}
        </div>

        {/* Search Bar */}
        <div className="leaderboard-search-container">
          <div className="search-bar">
            <input
              type="text"
              placeholder="Search by name, email, or olympiad..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
            <button className="search-button" type="button">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8"></circle>
                <path d="m21 21-4.35-4.35"></path>
              </svg>
            </button>
          </div>
        </div>

        {/* Filter Bar - Always show when viewing all results */}
        {filterOptions.length > 1 && (
          <div className="leaderboard-filters">
            <div className="filters-scroll-container">
              <div className="filters-scroll">
                {filterOptions.map((option) => (
                  <button
                    key={option.value}
                    className={`filter-button ${selectedFilter === option.value ? 'active' : ''}`}
                    onClick={() => setSelectedFilter(option.value)}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className={`leaderboard-table card ${allResults.length > 0 ? 'has-olympiad-column' : ''}`}>
          <div className="table-header">
            {allResults.length > 0 && <div className="table-cell olympiad-cell">Olympiad</div>}
            <div className="table-cell rank-cell">Rank</div>
            <div className="table-cell name-cell">Name</div>
            <div className="table-cell email-cell">Email</div>
            <div className="table-cell score-cell">Score</div>
            <div className="table-cell time-cell">Time</div>
            {isResolter && <div className="table-cell actions-cell">Actions</div>}
          </div>

          {filteredResults.length === 0 ? (
            <div className="empty-leaderboard">
              <p>{searchQuery ? 'No results found' : 'No results yet'}</p>
            </div>
          ) : (
            <div className="table-body">
              {filteredResults.map((result, index) => (
                <div 
                  key={result._id || index} 
                  className={`table-row ${result.rank <= 3 ? 'top-three' : ''}`}
                >
                  {allResults.length > 0 && (
                    <div className="table-cell olympiad-cell">
                      <div className="olympiad-name">{result.olympiadTitle || 'Unknown'}</div>
                      <div className="olympiad-type">{result.olympiadType || 'test'}</div>
                    </div>
                  )}
                  <div className="table-cell rank-cell">
                    <span className="rank-number">{getRankIcon(result.rank || index + 1)}</span>
                  </div>
                  <div className="table-cell name-cell">
                    {result.user?.name || 'Anonymous'}
                  </div>
                  <div className="table-cell email-cell">
                    {result.user?.email || '-'}
                  </div>
                  <div className="table-cell score-cell">
                    <span className="score-value">{result.totalScore || 0}</span>
                    <span className="score-max">/ {result.totalPoints || olympiad?.totalPoints || 100}</span>
                  </div>
                  <div className="table-cell time-cell">
                    {result.completedAt 
                      ? formatDate(result.completedAt)
                      : '-'
                    }
                  </div>
                  {isResolter && (
                    <div className="table-cell actions-cell">
                      <button
                        className="button-small button-primary"
                        onClick={() => openEditModal(result)}
                      >
                        Edit
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Edit Modal */}
        {editingResult && isResolter && (
          <div className="modal-overlay" onClick={closeEditModal}>
            <div
              className="modal-content card"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="modal-header">
                <h3>Edit Result</h3>
                <button className="modal-close" onClick={closeEditModal}>
                  ×
                </button>
              </div>
              <div className="modal-body">
                <div className="form-group">
                  <label>User: {editingResult.user?.name || 'Anonymous'}</label>
                </div>
                <div className="form-group">
                  <label>Email: {editingResult.user?.email || '-'}</label>
                </div>
                <div className="form-group">
                  <label>Olympiad: {editingResult.olympiadTitle || 'Unknown'}</label>
                </div>
                <div className="form-group">
                  <label>
                    Current Score: {editingResult.totalScore || editingResult.score || 0}
                    {editingResult.totalPoints && ` / ${editingResult.totalPoints}`}
                    {editingResult.percentage !== undefined && ` (${editingResult.percentage}%)`}
                  </label>
                </div>
                <div className="form-group">
                  <label htmlFor="edit-totalScore">New Total Score</label>
                  <input
                    type="number"
                    id="edit-totalScore"
                    value={editForm.totalScore}
                    onChange={(e) =>
                      setEditForm({ ...editForm, totalScore: e.target.value })
                    }
                    placeholder="Enter new total score"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="edit-maxScore">Max Score (Optional)</label>
                  <input
                    type="number"
                    id="edit-maxScore"
                    value={editForm.maxScore}
                    onChange={(e) =>
                      setEditForm({ ...editForm, maxScore: e.target.value })
                    }
                    placeholder="Enter max score"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="edit-percentage">Percentage (Optional)</label>
                  <input
                    type="number"
                    id="edit-percentage"
                    value={editForm.percentage}
                    onChange={(e) =>
                      setEditForm({ ...editForm, percentage: e.target.value })
                    }
                    placeholder="Enter percentage"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="edit-status">Status</label>
                  <select
                    id="edit-status"
                    value={editForm.status}
                    onChange={(e) => {
                      setEditForm({ ...editForm, status: e.target.value });
                      handleChangeStatus(editingResult._id || editingResult.resultId, e.target.value);
                    }}
                  >
                    <option value="active">Active</option>
                    <option value="checked">Checked</option>
                    <option value="blocked">Blocked</option>
                    <option value="pending">Pending</option>
                    <option value="under-review">Under Review</option>
                  </select>
                  {editForm.status === 'checked' && editForm.visible && (
                    <div className="status-hint success">✓ This result will be visible to all students</div>
                  )}
                </div>
                <div className="form-group">
                  <label>Visibility:</label>
                  <button
                    className={`button-secondary ${editForm.visible ? 'button-success' : 'button-warning'}`}
                    onClick={() => {
                      const newVisible = !editForm.visible;
                      setEditForm({ ...editForm, visible: newVisible });
                      handleToggleVisibility(editingResult._id || editingResult.resultId, !newVisible);
                    }}
                  >
                    {editForm.visible ? 'Visible' : 'Hidden'} - Click to Toggle
                  </button>
                </div>
              </div>
              <div className="modal-actions">
                <button className="button-secondary" onClick={closeEditModal}>
                  Cancel
                </button>
                <button
                  className="button-primary"
                  onClick={handleEditResult}
                  disabled={loading}
                >
                  {loading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Leaderboard;

