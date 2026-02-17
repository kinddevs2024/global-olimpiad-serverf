import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { resolterAPI, olympiadAPI, adminAPI } from '../../services/api';
import { formatDate, getImageUrl } from '../../utils/helpers';
import NotificationToast from '../../components/NotificationToast';
import './ResolterPanel.css';

const ResolterPanel = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState(null);
  const [results, setResults] = useState([]);
  const [olympiads, setOlympiads] = useState([]);
  const [selectedOlympiad, setSelectedOlympiad] = useState(null);
  const [filter, setFilter] = useState('all'); // all, olympiad
  const [statusFilter, setStatusFilter] = useState('queue');
  const [editingSubmission, setEditingSubmission] = useState(null);
  const [editForm, setEditForm] = useState({ score: '', comment: '' });
  const [viewingSubmission, setViewingSubmission] = useState(null);
  const [submissionDetails, setSubmissionDetails] = useState(null);
  const [captures, setCaptures] = useState([]);
  const [capturesLoading, setCapturesLoading] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (selectedOlympiad) {
      fetchOlympiadResults(selectedOlympiad);
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
      const response = await resolterAPI.getAllResults();
      const data = response.data;
      
      // Handle resolter API response structure with olympiadResults
      let allResults = [];
      if (data && typeof data === 'object' && data.olympiadResults && Array.isArray(data.olympiadResults)) {
        // Extract and flatten all results from all olympiads
        data.olympiadResults.forEach((olympiadGroup) => {
          if (olympiadGroup.results && Array.isArray(olympiadGroup.results)) {
            olympiadGroup.results.forEach((result) => {
              allResults.push({
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
      } else if (Array.isArray(data)) {
        allResults = data;
      } else if (data.results) {
        allResults = data.results;
      }
      
      setResults(allResults);
    } catch (error) {
      console.error('Error fetching all results:', error);
      setNotification({ message: 'Failed to load results', type: 'error' });
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchOlympiadResults = async (olympiadId) => {
    try {
      setLoading(true);
      const response = await resolterAPI.getResults(olympiadId);
      const data = response.data;
      
      let allResults = [];
      if (data && typeof data === 'object' && data.olympiadResults && Array.isArray(data.olympiadResults)) {
        // Extract results from olympiadResults
        data.olympiadResults.forEach((olympiadGroup) => {
          if (olympiadGroup.results && Array.isArray(olympiadGroup.results)) {
            olympiadGroup.results.forEach((result) => {
              allResults.push({
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
      } else if (Array.isArray(data)) {
        allResults = data;
      } else if (data.results) {
        allResults = data.results;
      }
      
      setResults(allResults);
    } catch (error) {
      console.error('Error fetching olympiad results:', error);
      setNotification({ message: 'Failed to load results', type: 'error' });
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleGradeSubmission = async (submissionId) => {
    if (!editForm.score || isNaN(editForm.score)) {
      setNotification({ message: 'Please enter a valid score', type: 'error' });
      return;
    }

    try {
      setLoading(true);
      const response = await resolterAPI.gradeSubmission(submissionId, {
        score: parseFloat(editForm.score),
        comment: editForm.comment || '',
      });

      // Check if AI was detected in the response
      const aiInfo = response.data?.aiDetection;
      if (aiInfo && aiInfo.isAI) {
        const probability = (aiInfo.aiProbability * 100).toFixed(1);
        setNotification({ 
          message: `Submission graded! AI detected (${probability}% probability). Result status set to 'blocked'.`, 
          type: 'warning' 
        });
      } else {
        setNotification({ message: 'Submission graded successfully!', type: 'success' });
      }
      
      setEditingSubmission(null);
      setEditForm({ score: '', comment: '' });
      
      // Refresh results
      if (selectedOlympiad) {
        fetchOlympiadResults(selectedOlympiad);
      } else {
        fetchAllResults();
      }
    } catch (error) {
      setNotification({
        message: error.response?.data?.message || 'Failed to grade submission',
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEditResult = async (resultId) => {
    if (!editForm.score || isNaN(editForm.score)) {
      setNotification({ message: 'Please enter a valid score', type: 'error' });
      return;
    }

    try {
      setLoading(true);
      await resolterAPI.editResult(resultId, {
        totalScore: parseFloat(editForm.score),
      });

      setNotification({ message: 'Result updated successfully!', type: 'success' });
      setEditingSubmission(null);
      setEditForm({ score: '', comment: '' });
      
      // Refresh results
      if (selectedOlympiad) {
        fetchOlympiadResults(selectedOlympiad);
      } else {
        fetchAllResults();
      }
    } catch (error) {
      setNotification({
        message: error.response?.data?.message || 'Failed to update result',
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchSubmissionDetails = async (olympiadId, userId) => {
    try {
      setLoading(true);
      // Get submissions grouped by user + olympiad
      const response = await adminAPI.getSubmissions(olympiadId, userId);
      const data = response.data;
      const details = data?.data || data?.submissions || data?.submission || data;

      if (Array.isArray(details)) {
        setSubmissionDetails(details[0] || null);
      } else if (details) {
        setSubmissionDetails(details);
      } else {
        setSubmissionDetails(null);
      }
    } catch (error) {
      console.error('Error fetching submission details:', error);
      setNotification({ message: 'Failed to load submission details', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const openViewModal = async (submission) => {
    setViewingSubmission(submission);
    setCaptures([]);
    const submissionUserId = submission.user?._id || submission.userId;
    const submissionOlympiadId = submission.olympiadId || submission.olympiad?._id;
    if (submissionUserId && submissionOlympiadId) {
      await fetchCaptures(submissionOlympiadId, submissionUserId);
    }
    if (submissionUserId && submissionOlympiadId) {
      await fetchSubmissionDetails(submissionOlympiadId, submissionUserId);
    }
  };

  const openEditModal = (submission, type = 'submission') => {
    setEditingSubmission({ ...submission, editType: type });
    setEditForm({
      score: submission.score || submission.totalScore || '',
      comment: submission.comment || '',
    });
  };

  const closeEditModal = () => {
    setEditingSubmission(null);
    setEditForm({ score: '', comment: '' });
  };

  const fetchCaptures = async (olympiadId, userId) => {
    try {
      setCapturesLoading(true);
      const response = await resolterAPI.getCameraCaptures(olympiadId, {
        userId,
        fileType: 'video',
        limit: 50,
      });
      const data = response.data;
      const captureList = data?.captures || data?.data || data || [];
      setCaptures(Array.isArray(captureList) ? captureList : []);
    } catch (error) {
      console.error('Error fetching captures:', error);
      setCaptures([]);
    } finally {
      setCapturesLoading(false);
    }
  };

  const isVideoCapture = (capture) => {
    if (capture.fileType === 'video') return true;
    const path = capture.imagePath || capture.imageUrl || '';
    return /\.(mp4|webm|mov|avi)$/i.test(path);
  };

  const groupCaptures = (captureList) => {
    const groups = {
      screen: [],
      camera: [],
      front: [],
      back: [],
      both: [],
      other: [],
    };

    captureList.forEach((capture) => {
      const type = (capture.captureType || '').toLowerCase();
      if (type.includes('screen')) groups.screen.push(capture);
      else if (type.includes('front')) groups.front.push(capture);
      else if (type.includes('back')) groups.back.push(capture);
      else if (type.includes('camera')) groups.camera.push(capture);
      else if (type.includes('both')) groups.both.push(capture);
      else groups.other.push(capture);
    });

    return groups;
  };

  const renderVideoList = (list) => {
    if (capturesLoading) {
      return <div className="video-empty">Loading videos...</div>;
    }
    if (!list || list.length === 0) {
      return <div className="video-empty">No video available</div>;
    }

    return list.map((capture) => {
      const videoUrl = getImageUrl(capture.imageUrl || `/api/uploads/${capture.imagePath}`);
      return (
        <div key={capture._id} className="video-card">
          <video className="review-video-player" controls preload="metadata">
            <source src={videoUrl} />
          </video>
          <div className="video-meta">
            <span>{capture.captureType || 'video'}</span>
            <span>{capture.timestamp ? formatDate(capture.timestamp) : '-'}</span>
          </div>
        </div>
      );
    });
  };

  const getDisplaySubmissions = (submissionList) => {
    if (!Array.isArray(submissionList)) return [];
    const essaySubmissions = submissionList.filter((submission) =>
      typeof submission.answer === 'string' && submission.answer.trim().length > 50
    );
    return essaySubmissions.length > 0 ? essaySubmissions : submissionList;
  };

  const getFilteredResults = () => {
    const statusFiltered = results.filter((result) => {
      const status = result.status || 'active';
      const isVisible = result.visible !== false;
      const isQueued = status === 'pending' || status === 'under-review' || (!isVisible && status === 'active');
      const isPublished = isVisible && (status === 'checked' || status === 'active');

      if (statusFilter === 'queue') return isQueued;
      if (statusFilter === 'checked') return status === 'checked';
      if (statusFilter === 'published') return isPublished;
      if (statusFilter === 'blocked') return status === 'blocked';
      return true;
    });

    return statusFiltered;
  };

  const filteredResults = getFilteredResults();


  const handleChangeStatus = async (resultId, status) => {
    try {
      setLoading(true);
      await resolterAPI.changeResultStatus(resultId, status);
      
      setNotification({ 
        message: `Result status changed to ${status}`, 
        type: 'success' 
      });
      
      // Refresh results
      if (selectedOlympiad) {
        fetchOlympiadResults(selectedOlympiad);
      } else {
        fetchAllResults();
      }
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
      
      // Refresh results
      if (selectedOlympiad) {
        fetchOlympiadResults(selectedOlympiad);
      } else {
        fetchAllResults();
      }
    } catch (error) {
      setNotification({
        message: error.response?.data?.message || 'Failed to toggle visibility',
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleMakeAllVisible = async () => {
    if (!window.confirm('Are you sure you want to make all results visible? This will make all results visible to all students.')) {
      return;
    }

    try {
      setLoading(true);
      await resolterAPI.makeAllResultsVisible(selectedOlympiad || null);
      
      setNotification({ 
        message: 'All results have been made visible', 
        type: 'success' 
      });
      
      // Refresh results
      if (selectedOlympiad) {
        fetchOlympiadResults(selectedOlympiad);
      } else {
        fetchAllResults();
      }
    } catch (error) {
      setNotification({
        message: error.response?.data?.message || 'Failed to make all results visible',
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading && results.length === 0) {
    return (
      <div className="resolter-panel-page">
        <div className="container">
          <div className="resolter-loading">
            <div className="loading-spinner"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="resolter-panel-page">
      <div className="container">
        <div className="resolter-header">
          <h1 className="resolter-title text-glow">Resolter Panel</h1>
          <p className="resolter-subtitle">View and edit all results</p>
        </div>

        {/* Filters */}
        <div className="resolter-filters">
          <div className="filter-group">
            <label>Filter by Olympiad:</label>
            <select
              value={selectedOlympiad || ''}
              onChange={(e) => {
                setSelectedOlympiad(e.target.value || null);
                setFilter(e.target.value ? 'olympiad' : 'all');
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

        <div className="resolter-status-filters">
          <button
            className={`filter-button ${statusFilter === 'queue' ? 'active' : ''}`}
            onClick={() => setStatusFilter('queue')}
          >
            Queue
          </button>
          <button
            className={`filter-button ${statusFilter === 'checked' ? 'active' : ''}`}
            onClick={() => setStatusFilter('checked')}
          >
            Checked
          </button>
          <button
            className={`filter-button ${statusFilter === 'published' ? 'active' : ''}`}
            onClick={() => setStatusFilter('published')}
          >
            Published
          </button>
          <button
            className={`filter-button ${statusFilter === 'blocked' ? 'active' : ''}`}
            onClick={() => setStatusFilter('blocked')}
          >
            Blocked
          </button>
          <button
            className={`filter-button ${statusFilter === 'all' ? 'active' : ''}`}
            onClick={() => setStatusFilter('all')}
          >
            All
          </button>
        </div>

        {/* Results Table */}
        <div className="resolter-results card">
          <div className="results-header">
            <h2 className="results-title">
              {selectedOlympiad
                ? `Results for ${olympiads.find((o) => o._id === selectedOlympiad)?.title || 'Olympiad'}`
                : 'All Results'}
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

          {filteredResults.length === 0 ? (
            <div className="empty-results">
              <p>No results found</p>
            </div>
          ) : (
            <div className="results-table">
              <div className="table-header">
                <div className="table-cell">User</div>
                <div className="table-cell">Email</div>
                <div className="table-cell">Olympiad</div>
                <div className="table-cell">Type</div>
                <div className="table-cell">Score</div>
                <div className="table-cell">Status</div>
                <div className="table-cell">Visibility</div>
                <div className="table-cell">Submitted</div>
                <div className="table-cell">Actions</div>
              </div>
              <div className="table-body">
                {filteredResults.map((result, index) => (
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
                      <span className="type-badge">
                        {result.olympiadType || result.olympiad?.type || 'test'}
                      </span>
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
                      <select
                        className="status-select"
                        value={result.status || 'active'}
                        onChange={(e) => handleChangeStatus(result._id || result.resultId, e.target.value)}
                      >
                        <option value="active">Active</option>
                        <option value="checked">Checked</option>
                        <option value="blocked">Blocked</option>
                        <option value="pending">Pending</option>
                        <option value="under-review">Under Review</option>
                      </select>
                      {result.status === 'blocked' && (
                        <div className="status-hint">⚠️ AI Detected</div>
                      )}
                      {result.status === 'checked' && result.visible !== false && (
                        <div className="status-hint success">✓ Visible to all</div>
                      )}
                    </div>
                    <div className="table-cell">
                      <button
                        className={`button-small ${result.visible !== false ? 'button-success' : 'button-warning'}`}
                        onClick={() => handleToggleVisibility(result._id || result.resultId, result.visible !== false)}
                      >
                        {result.visible !== false ? 'Visible' : 'Hidden'}
                      </button>
                    </div>
                    <div className="table-cell">
                      {result.submittedAt || result.completedAt
                        ? formatDate(result.submittedAt || result.completedAt)
                        : '-'}
                    </div>
                    <div className="table-cell actions-cell">
                      <button
                        className="button-small button-secondary"
                        onClick={() => openViewModal(result)}
                      >
                        View
                      </button>
                      {(result.olympiadType === 'essay' || result.olympiad?.type === 'essay' || result.olympiadType === 'mixed' || result.olympiad?.type === 'mixed') && (
                        <button
                          className="button-small button-primary"
                          onClick={() => openEditModal(result, 'submission')}
                        >
                          Grade
                        </button>
                      )}
                      <button
                        className="button-small button-secondary"
                        onClick={() => openEditModal(result, 'result')}
                      >
                        Edit
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* View Submission Modal */}
        {viewingSubmission && (
          <div className="modal-overlay" onClick={() => setViewingSubmission(null)}>
            <div
              className="modal-content card"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="modal-header">
                <h3>Submission Details</h3>
                <button className="modal-close" onClick={() => setViewingSubmission(null)}>
                  ×
                </button>
              </div>
              <div className="modal-body">
                    <div className="review-layout">
                      <div className="review-left">
                        <div className="form-group">
                          <label>User: {viewingSubmission.user?.name || 'Anonymous'}</label>
                        </div>
                        <div className="form-group">
                          <label>Email: {viewingSubmission.user?.email || '-'}</label>
                        </div>
                        <div className="form-group">
                          <label>
                            Olympiad: {viewingSubmission.olympiadTitle || viewingSubmission.olympiad?.title || '-'}
                          </label>
                        </div>
                        <div className="form-group">
                          <label>
                            Score: {viewingSubmission.totalScore || viewingSubmission.score || 0}
                            {viewingSubmission.totalPoints && ` / ${viewingSubmission.totalPoints}`}
                            {viewingSubmission.percentage !== undefined && ` (${viewingSubmission.percentage}%)`}
                          </label>
                        </div>
                        <div className="form-group">
                          <label>
                            Submitted: {viewingSubmission.submittedAt || viewingSubmission.completedAt
                              ? formatDate(viewingSubmission.submittedAt || viewingSubmission.completedAt)
                              : '-'}
                          </label>
                        </div>
                        {viewingSubmission.gradedAt && (
                          <div className="form-group">
                            <label>
                              Graded: {formatDate(viewingSubmission.gradedAt)}
                              {viewingSubmission.gradedBy && ` by ${viewingSubmission.gradedBy.name || viewingSubmission.gradedBy.email || 'Unknown'}`}
                            </label>
                          </div>
                        )}
                        {viewingSubmission.submissions && Array.isArray(viewingSubmission.submissions) && viewingSubmission.submissions.length > 0 && (
                          <div className="form-group">
                            <label>Essay Answers:</label>
                            <div className="submission-answers">
                              {getDisplaySubmissions(viewingSubmission.submissions).map((submission, idx) => (
                                <div key={submission.submissionId || submission._id || idx} className="answer-item">
                                  <div className="answer-label">
                                    Question {submission.questionId || idx + 1}:
                                    {submission.score !== undefined && (
                                      <span className="submission-score"> ({submission.score} points)</span>
                                    )}
                                    {submission.isCorrect !== undefined && (
                                      <span className={`submission-correct ${submission.isCorrect ? 'correct' : 'incorrect'}`}>
                                        {submission.isCorrect ? ' ✓ Correct' : ' ✗ Incorrect'}
                                      </span>
                                    )}
                                  </div>
                                  <div className="answer-content">
                                    {typeof submission.answer === 'string' ? submission.answer : JSON.stringify(submission.answer)}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        {submissionDetails && submissionDetails.answers && (
                          <div className="form-group">
                            <label>All Answers:</label>
                            <div className="submission-answers">
                              {Object.entries(submissionDetails.answers).map(([questionId, answer]) => (
                                <div key={questionId} className="answer-item">
                                  <div className="answer-label">Question {questionId}:</div>
                                  <div className="answer-content">{typeof answer === 'string' ? answer : JSON.stringify(answer)}</div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        {viewingSubmission.comment && (
                          <div className="form-group">
                            <label>Comment:</label>
                            <div className="comment-display">{viewingSubmission.comment}</div>
                          </div>
                        )}
                        {viewingSubmission.submissions && Array.isArray(viewingSubmission.submissions) && viewingSubmission.submissions.length > 0 && (
                          <div className="form-group">
                            <label>AI Detection Status:</label>
                            {viewingSubmission.submissions.map((submission, idx) => {
                              if (submission.isAI !== undefined) {
                                return (
                                  <div key={idx} className={submission.isAI ? 'ai-warning' : 'ai-success'}>
                                    {submission.isAI ? (
                                      <>
                                        <strong>⚠️ AI Detected</strong>
                                        <p>Probability: {((submission.aiProbability || 0) * 100).toFixed(1)}%</p>
                                        {submission.aiCheckedAt && (
                                          <p className="ai-checked-info">
                                            Checked: {formatDate(submission.aiCheckedAt)}
                                            {submission.aiCheckedBy && typeof submission.aiCheckedBy === 'object' && (
                                              ` by ${submission.aiCheckedBy.name || submission.aiCheckedBy.email || 'Unknown'}`
                                            )}
                                          </p>
                                        )}
                                      </>
                                    ) : (
                                      <>
                                        <strong>✓ No AI Detected</strong>
                                        {submission.aiCheckedAt && (
                                          <p className="ai-checked-info">
                                            Checked: {formatDate(submission.aiCheckedAt)}
                                            {submission.aiCheckedBy && typeof submission.aiCheckedBy === 'object' && (
                                              ` by ${submission.aiCheckedBy.name || submission.aiCheckedBy.email || 'Unknown'}`
                                            )}
                                          </p>
                                        )}
                                      </>
                                    )}
                                  </div>
                                );
                              }
                              return null;
                            })}
                          </div>
                        )}
                      </div>
                      <div className="review-right">
                        <div className="video-panel">
                          <h4>Proctoring Videos</h4>
                          {(() => {
                            const videoCaptures = captures.filter(isVideoCapture);
                            const groups = groupCaptures(videoCaptures);
                            return (
                              <>
                                <div className="video-section">
                                  <div className="video-section-title">Screen</div>
                                  {renderVideoList(groups.screen)}
                                </div>
                                <div className="video-section">
                                  <div className="video-section-title">Camera</div>
                                  {renderVideoList(groups.camera)}
                                </div>
                                <div className="video-section">
                                  <div className="video-section-title">Front Camera</div>
                                  {renderVideoList(groups.front)}
                                </div>
                                <div className="video-section">
                                  <div className="video-section-title">Back Camera</div>
                                  {renderVideoList(groups.back)}
                                </div>
                              </>
                            );
                          })()}
                        </div>
                      </div>
                    </div>
              </div>
              <div className="modal-actions">
                <button
                  className="button-secondary"
                  onClick={() => setViewingSubmission(null)}
                >
                  Close
                </button>
                <button
                  className="button-primary"
                  onClick={() => {
                    setViewingSubmission(null);
                    openEditModal(viewingSubmission, 'submission');
                  }}
                >
                  Grade This Submission
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Modal */}
        {editingSubmission && (
          <div className="modal-overlay" onClick={closeEditModal}>
            <div
              className="modal-content card"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="modal-header">
                <h3>
                  {editingSubmission.editType === 'submission'
                    ? 'Grade Submission'
                    : 'Edit Result'}
                </h3>
                <button className="modal-close" onClick={closeEditModal}>
                  ×
                </button>
              </div>
              <div className="modal-body">
                <div className="form-group">
                  <label>
                    User: {editingSubmission.user?.name || 'Anonymous'}
                  </label>
                </div>
                <div className="form-group">
                  <label>
                    Olympiad:{' '}
                    {editingSubmission.olympiadTitle ||
                      editingSubmission.olympiad?.title ||
                      '-'}
                  </label>
                </div>
                <div className="form-group">
                  <label>
                    Current Score: {editingSubmission.totalScore || editingSubmission.score || 0}
                    {editingSubmission.totalPoints && ` / ${editingSubmission.totalPoints}`}
                  </label>
                </div>
                <div className="form-group">
                  <label htmlFor="edit-score">New Score *</label>
                  <input
                    type="number"
                    id="edit-score"
                    value={editForm.score}
                    onChange={(e) =>
                      setEditForm({ ...editForm, score: e.target.value })
                    }
                    placeholder="Enter score"
                    required
                  />
                </div>
                {editingSubmission.editType === 'submission' && (
                  <div className="form-group">
                    <label htmlFor="edit-comment">Comment</label>
                    <textarea
                      id="edit-comment"
                      value={editForm.comment}
                      onChange={(e) =>
                        setEditForm({ ...editForm, comment: e.target.value })
                      }
                      placeholder="Enter comment (optional)"
                      rows="4"
                    />
                  </div>
                )}
                {editingSubmission.comment && (
                  <div className="form-group">
                    <label>Previous Comment:</label>
                    <div className="comment-display">
                      {editingSubmission.comment}
                    </div>
                  </div>
                )}
                {editingSubmission.editType === 'submission' && 
                 (editingSubmission.olympiadType === 'essay' || editingSubmission.olympiad?.type === 'essay' || editingSubmission.olympiadType === 'mixed' || editingSubmission.olympiad?.type === 'mixed') && (
                  <div className="form-group">
                    <label>AI Detection Info:</label>
                    <div className="ai-info-box">
                      {editingSubmission.submissions?.[0]?.isAI ? (
                        <div className="ai-warning">
                          <strong>⚠️ AI Detected</strong>
                          <p>Probability: {((editingSubmission.submissions[0].aiProbability || 0) * 100).toFixed(1)}%</p>
                          {editingSubmission.submissions[0].aiCheckedAt && (
                            <p className="ai-checked-info">
                              Checked: {formatDate(editingSubmission.submissions[0].aiCheckedAt)}
                            </p>
                          )}
                          <p className="ai-note">Note: AI detection runs automatically when grading essays. If AI is detected (&gt;50%), the result status is automatically set to 'blocked'.</p>
                        </div>
                      ) : editingSubmission.submissions?.[0]?.aiCheckedAt ? (
                        <div className="ai-success">
                          <strong>✓ No AI Detected</strong>
                          <p className="ai-checked-info">
                            Checked: {formatDate(editingSubmission.submissions[0].aiCheckedAt)}
                          </p>
                        </div>
                      ) : (
                        <div className="ai-pending">
                          <p>AI detection will run automatically when you grade this submission.</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                <div className="form-group">
                  <label htmlFor="edit-status">Status</label>
                  <select
                    id="edit-status"
                    value={editingSubmission.status || 'active'}
                    onChange={(e) => {
                      setEditingSubmission({ ...editingSubmission, status: e.target.value });
                      handleChangeStatus(editingSubmission._id || editingSubmission.resultId, e.target.value);
                    }}
                  >
                    <option value="active">Active</option>
                    <option value="checked">Checked</option>
                    <option value="blocked">Blocked</option>
                    <option value="pending">Pending</option>
                    <option value="under-review">Under Review</option>
                  </select>
                  {editingSubmission.status === 'checked' && editingSubmission.visible !== false && (
                    <div className="status-hint success">✓ This result will be visible to all students</div>
                  )}
                  {editingSubmission.status === 'blocked' && (
                    <div className="status-hint">⚠️ This result is blocked (likely due to AI detection)</div>
                  )}
                </div>
                <div className="form-group">
                  <label>Visibility:</label>
                  <button
                    className={`button-secondary ${editingSubmission.visible !== false ? 'button-success' : 'button-warning'}`}
                    onClick={() => {
                      handleToggleVisibility(editingSubmission._id || editingSubmission.resultId, editingSubmission.visible !== false);
                      setEditingSubmission({ ...editingSubmission, visible: !editingSubmission.visible });
                    }}
                  >
                    {editingSubmission.visible !== false ? 'Visible' : 'Hidden'} - Click to Toggle
                  </button>
                </div>
              </div>
              <div className="modal-actions">
                <button
                  className="button-secondary"
                  onClick={closeEditModal}
                >
                  Cancel
                </button>
                <button
                  className="button-primary"
                  onClick={() => {
                    if (editingSubmission.editType === 'submission') {
                      const firstSubmission = editingSubmission.submissions?.[0];
                      const submissionId = firstSubmission?.submissionId || firstSubmission?._id || editingSubmission._id;
                      if (submissionId) {
                        handleGradeSubmission(submissionId);
                      } else {
                        setNotification({ message: 'No submission ID found', type: 'error' });
                      }
                    } else {
                      handleEditResult(editingSubmission._id || editingSubmission.resultId);
                    }
                  }}
                >
                  Save
                </button>
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
    </div>
  );
};

export default ResolterPanel;

