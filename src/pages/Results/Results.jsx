import { useState, useEffect, useMemo, useCallback } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  olympiadAPI,
  adminAPI,
  resolterAPI,
  schoolTeacherAPI,
  universityAPI,
} from "../../services/api";
import { formatDate } from "../../utils/helpers";
import { useAuth } from "../../context/AuthContext";
import { USER_ROLES } from "../../utils/constants";
import NotificationToast from "../../components/NotificationToast";
import "./Results.css";

const Results = () => {
  const { id } = useParams(); // olympiadId from URL (optional)
  const { user } = useAuth();
  const navigate = useNavigate();
  const [userResult, setUserResult] = useState(null);
  const [topFive, setTopFive] = useState([]);
  const [totalParticipants, setTotalParticipants] = useState(0);
  const [olympiadTitle, setOlympiadTitle] = useState("");
  const [olympiadType, setOlympiadType] = useState("");
  const [allUserResults, setAllUserResults] = useState([]); // For /results page (all results)
  const [allResults, setAllResults] = useState([]); // For admin/owner: all results for an olympiad
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hasPendingSubmission, setHasPendingSubmission] = useState(false);
  const [notification, setNotification] = useState(null);
  const [editingResult, setEditingResult] = useState(null);
  const [editForm, setEditForm] = useState({
    totalScore: "",
    maxScore: "",
    percentage: "",
  });

  // Check if user is admin, owner, resolter, school teacher, or university (used throughout component)
  const isAdminOrOwner =
    user?.role === USER_ROLES.ADMIN || user?.role === USER_ROLES.OWNER;
  const isResolter = user?.role === USER_ROLES.RESOLTER;
  const isSchoolTeacher = user?.role === USER_ROLES.SCHOOL_TEACHER;
  const isUniversity = user?.role === USER_ROLES.UNIVERSITY;
  const canViewAllResults =
    isAdminOrOwner || isResolter || isSchoolTeacher || isUniversity;

  const fetchResults = useCallback(async () => {
    if (!id) {
      setError("Olympiad ID is required");
      setLoading(false);
      return;
    }

    try {
      let data;

      if (canViewAllResults) {
        // For admins/owners/resolters/school teachers/universities: fetch all results for this olympiad
        let submissionsResponse;
        if (isResolter) {
          // Use resolter API endpoint
          submissionsResponse = await resolterAPI.getResults(id);
        } else if (isSchoolTeacher) {
          // Use school teacher API endpoint (filtered by school)
          submissionsResponse = await schoolTeacherAPI.getSchoolResults(id);
        } else if (isUniversity) {
          // Use university API endpoint (filtered by university's olympiads)
          submissionsResponse = await universityAPI.getOlympiadResults(id);
        } else {
          // Use admin API endpoint
          submissionsResponse = await adminAPI.getSubmissions(id, null);
        }
        const submissionsData = submissionsResponse?.data;

        // Ensure submissions is always an array
        let submissions = [];
        if (Array.isArray(submissionsData)) {
          submissions = submissionsData;
        } else if (submissionsData && typeof submissionsData === "object") {
          submissions =
            submissionsData.submissions ||
            submissionsData.data ||
            submissionsData.results ||
            [];
        }

        // Final safety check
        if (!Array.isArray(submissions)) {
          submissions = [];
        }

        // Get olympiad details
        const olympiadResponse = await olympiadAPI.getById(id);
        const olympiad = olympiadResponse?.data;

        // Filter by visibility: students can see results that are:
        // 1. Their own results (always visible to them)
        // 2. Results with status 'checked' AND visible === true (anyone can see)
        // 3. Results with visible === true (if not checked, only visible to admins/resolters)
        let visibleSubmissions = submissions;
        let userHasPendingSubmission = false;
        if (!canViewAllResults) {
          // Check if user has a submission that isn't checked yet
            const userSubmission = (submissions || []).find((submission) => {
            const submissionUserId = submission.userId || submission.user?._id;
            return (
              user?._id &&
              (submissionUserId === user._id ||
                submissionUserId === user._id.toString())
            );
          });

          if (userSubmission && userSubmission.status !== "checked") {
            userHasPendingSubmission = true;
          }

          visibleSubmissions = (submissions || []).filter((submission) => {
            const isOwnResult =
              submission.userId === user?._id ||
              submission.user?._id === user?._id;
            const isCheckedAndVisible =
              submission.status === "checked" && submission.visible !== false;
            const isVisible = submission.visible !== false;

            return isOwnResult || isCheckedAndVisible || isVisible;
          });
        }

        setHasPendingSubmission(userHasPendingSubmission);

        // Transform submissions to results format - with try-catch protection
        let allResults = [];
        if (visibleSubmissions.length > 0) {
          try {
            allResults = (visibleSubmissions || []).map((submission, index) => ({
              ...submission,
              score: submission.score || submission.totalScore || 0,
              totalScore: submission.totalScore || submission.score || 0,
              totalPoints: Number(olympiad?.totalPoints) || 100,
              completedAt: submission.submittedAt || submission.completedAt,
              user: submission.user || { name: "Unknown", email: "Unknown" },
            }));
          } catch (mapError) {
            console.error(
              "Error mapping submissions in fetchResults:",
              mapError,
              "submissions:",
              visibleSubmissions
            );
            allResults = [];
          }
        }

        // Sort by score (highest first)
        if (Array.isArray(allResults)) {
          allResults.sort((a, b) => {
            if (b.totalScore !== a.totalScore) {
              return b.totalScore - a.totalScore;
            }
            const timeA = new Date(a.completedAt || 0).getTime();
            const timeB = new Date(b.completedAt || 0).getTime();
            return timeA - timeB;
          });

          // Assign ranks
          allResults.forEach((r, index) => {
            r.rank = index + 1;
          });
        }

        // Find user result if they participated
        const userResult = Array.isArray(allResults)
          ? (allResults || []).find((r) => {
              const resultUserId = r.user?._id || r.userId || r.user;
              return (
                user?._id &&
                (resultUserId === user._id ||
                  resultUserId === user._id.toString())
              );
            })
          : null;

        data = {
          success: true,
          userResult: userResult || null,
          topFive: Array.isArray(allResults) ? allResults.slice(0, 5) : [],
          totalParticipants: Array.isArray(allResults) ? allResults.length : 0,
          olympiadTitle: olympiad?.title || "",
          olympiadType: olympiad?.type || "",
          allResults: Array.isArray(allResults) ? allResults : [], // Store all results for admin/owner view
        };
      } else {
        // For students: fetch only their result
        if (!user?._id) {
          setError("User ID is required");
          setLoading(false);
          return;
        }
        const response = await olympiadAPI.getResults(id, user._id);
        data = response.data;

        // Check if user has a submission but results aren't ready
        if (!data.success || !data.userResult) {
          // Try to check if there's a submission that isn't checked yet
          try {
            const submissionsResponse = await olympiadAPI.getResults(id, user._id);
            const submissionsData = submissionsResponse?.data;
            let submissions = [];
            if (submissionsData?.results && Array.isArray(submissionsData.results)) {
              submissions = submissionsData.results;
            } else if (Array.isArray(submissionsData)) {
              submissions = submissionsData;
            } else if (submissionsData && typeof submissionsData === "object") {
              submissions =
                submissionsData.submissions || submissionsData.data || [];
            }

            const userSubmission = (submissions || []).find((submission) => {
              const submissionUserId =
                submission.userId || submission.user?._id;
              return (
                user?._id &&
                (submissionUserId === user._id ||
                  submissionUserId === user._id.toString())
              );
            });

            if (userSubmission && userSubmission.status !== "checked") {
              setHasPendingSubmission(true);
            }
          } catch (err) {
            // If we can't check submissions, just continue
          }
        }
      }

      // New API structure
      if (data.success) {
        setUserResult(data.userResult || null);
        setTopFive(data.topFive || []);
        setTotalParticipants(data.totalParticipants || 0);
        setOlympiadTitle(data.olympiadTitle || "");
        setOlympiadType(data.olympiadType || "");
        if (data.allResults) {
          setAllResults(data.allResults);
        }
        // Reset pending submission state if we have results
        if (data.userResult) {
          setHasPendingSubmission(false);
        }
      } else {
        // Fallback to old structure if needed
        const resultsList = data.results || [];
        const olympiadData = data.olympiad;

        if (resultsList.length > 0) {
          // Sort results by score (highest first)
          const sortedResults = [...resultsList].sort((a, b) => {
            if (b.totalScore !== a.totalScore) {
              return b.totalScore - a.totalScore;
            }
            const timeA = new Date(a.completedAt || 0).getTime();
            const timeB = new Date(b.completedAt || 0).getTime();
            return timeA - timeB;
          });

          // Assign ranks
          sortedResults.forEach((r, index) => {
            r.rank = index + 1;
          });

          // Find user result
          const foundUserResult = (sortedResults || []).find((r) => {
            const resultUserId = r.user?._id || r.userId || r.user;
            return (
              resultUserId === user._id || resultUserId === user._id.toString()
            );
          });

          if (foundUserResult) {
            setUserResult(foundUserResult);
          }

          // Get top 5
          setTopFive(sortedResults.slice(0, 5));
          setTotalParticipants(sortedResults.length);
        }

        if (olympiadData) {
          setOlympiadTitle(olympiadData.title || "");
          setOlympiadType(olympiadData.type || "");
        }
      }
    } catch (error) {
      console.error("Error fetching results:", error);
      const errorMessage = "Failed to fetch results. Please try again later.";

      // Check if error message indicates results are being processed
      const lowerErrorMessage = errorMessage.toLowerCase();
      if (
        lowerErrorMessage.includes("working on") ||
        lowerErrorMessage.includes("processing") ||
        lowerErrorMessage.includes("coming") ||
        lowerErrorMessage.includes("we are working")
      ) {
        setHasPendingSubmission(true);
        setError(null); // Don't show as error, show as pending
      } else {
        // Try to check if user has a pending submission
        if (id && !canViewAllResults && user?._id) {
          try {
            const submissionsResponse = await olympiadAPI.getResults(id, user._id);
            const submissionsData = submissionsResponse?.data;
            let submissions = [];
            if (submissionsData?.results && Array.isArray(submissionsData.results)) {
              submissions = submissionsData.results;
            } else if (Array.isArray(submissionsData)) {
              submissions = submissionsData;
            } else if (submissionsData && typeof submissionsData === "object") {
              submissions =
                submissionsData.submissions || submissionsData.data || [];
            }

            const userSubmission = (submissions || []).find((submission) => {
              const submissionUserId =
                submission.userId || submission.user?._id;
              return (
                user?._id &&
                (submissionUserId === user._id ||
                  submissionUserId === user._id.toString())
              );
            });

            if (userSubmission && userSubmission.status !== "checked") {
              setHasPendingSubmission(true);
              setError(null); // Don't show as error
            } else {
              setError(errorMessage);
            }
          } catch (checkError) {
            // If we can't check, just show the error
            setError(errorMessage);
          }
        } else {
          setError(errorMessage);
        }
      }
    } finally {
      setLoading(false);
    }
  }, [id, user?._id, canViewAllResults, isResolter, isSchoolTeacher, isUniversity, user]);

  // Fetch all user results (for /results page without olympiad ID)
  const fetchAllUserResults = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      let submissions = [];

      if (canViewAllResults) {
        // For admins/owners/resolters/school teachers/universities: get all submissions from all olympiads
        let response;
        if (isResolter) {
          // Use resolter API endpoint
          response = await resolterAPI.getAllResults();
        } else if (isSchoolTeacher) {
          // Use school teacher API endpoint (filtered by school)
          response = await schoolTeacherAPI.getSchoolResults();
        } else if (isUniversity) {
          // Use university API endpoint (filtered by university's olympiads)
          response = await universityAPI.getAllOlympiadResults();
        } else {
          // Use admin API endpoint
          response = await adminAPI.getSubmissions(null, null);
        }

        const submissionsData = response?.data;

        // Handle the resolter API response structure
        // Response format: { success: true, olympiadResults: [{ olympiadId, olympiad, results: [...] }] }
        if (submissionsData && typeof submissionsData === "object") {
          // Check if it's the resolter API format with olympiadResults
          if (
            submissionsData.olympiadResults &&
            Array.isArray(submissionsData.olympiadResults)
          ) {
            // Extract and flatten all results from all olympiads
            submissions = [];
            submissionsData.olympiadResults.forEach((olympiadGroup) => {
              if (
                olympiadGroup.results &&
                Array.isArray(olympiadGroup.results)
              ) {
                // Transform each result to include olympiad info
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
            // Direct array of results
            submissions = submissionsData;
          } else {
            // Try to extract from other possible structures
            submissions =
              submissionsData.submissions ||
              submissionsData.data ||
              submissionsData.results ||
              [];
          }
        } else if (Array.isArray(submissionsData)) {
          submissions = submissionsData;
        } else {
          submissions = [];
        }
      } else {
        // For students: get only their submissions
        if (!user?._id) {
          setError("User ID is required");
          setLoading(false);
          return;
        }
        const response = await olympiadAPI.getResults(null, user._id);
        const submissionsData = response?.data;
        // Ensure submissions is always an array
        if (submissionsData?.results && Array.isArray(submissionsData.results)) {
          submissions = submissionsData.results;
        } else if (Array.isArray(submissionsData)) {
          submissions = submissionsData;
        } else if (submissionsData && typeof submissionsData === "object") {
          // If it's an object, try to extract an array from it
          submissions =
            submissionsData.submissions || submissionsData.data || [];
        } else {
          submissions = [];
        }
      }

      // Final safety check - ensure submissions is an array
      if (!Array.isArray(submissions)) {
        submissions = [];
      }

      // Results from resolter API already have olympiad info, so we can use them directly
      // For other APIs, we might need to fetch olympiads separately
      let resultsWithOlympiad = [];

      if (submissions.length > 0) {
        // Check if results already have olympiad info (from resolter API)
        const hasOlympiadInfo =
          submissions?.[0]?.olympiad || submissions?.[0]?.olympiadTitle;

        if (hasOlympiadInfo) {
          // Results already have olympiad info, use them as-is
          resultsWithOlympiad = (submissions || []).map((submission) => ({
            ...submission,
            olympiadTitle:
              submission.olympiadTitle ||
              submission.olympiad?.title ||
              "Unknown Olympiad",
            olympiadType:
              submission.olympiadType || submission.olympiad?.type || "test",
          }));
        } else {
          // Need to fetch olympiads and match them
          try {
            const olympiadsResponse = await olympiadAPI.getAll();
            const olympiadsData = olympiadsResponse?.data?.data || olympiadsResponse?.data || [];
            const olympiads = Array.isArray(olympiadsData) ? olympiadsData : [];

            resultsWithOlympiad = (submissions || []).map((submission) => {
              const olympiad = (olympiads || []).find(
                (o) => o._id === submission.olympiadId
              );
              return {
                ...submission,
                olympiad: olympiad,
                olympiadTitle: olympiad?.title || "Unknown Olympiad",
                olympiadType: olympiad?.type || "test",
              };
            });
          } catch (mapError) {
            console.error(
              "Error mapping submissions:",
              mapError,
              "submissions:",
              submissions
            );
            resultsWithOlympiad = [];
          }
        }
      }

      // Filter by visibility: students can see results that are:
      // 1. Their own results (always visible to them)
      // 2. Results with status 'checked' AND visible === true (anyone can see)
      // 3. Results with visible === true (if not checked, only visible to admins/resolters)
      let visibleResults = resultsWithOlympiad;
      if (!canViewAllResults) {
        visibleResults = (resultsWithOlympiad || []).filter((result) => {
          const isOwnResult =
            result.userId === user?._id || result.user?._id === user?._id;
          const isCheckedAndVisible =
            result.status === "checked" && result.visible !== false;
          const isVisible = result.visible !== false;

          return isOwnResult || isCheckedAndVisible || isVisible;
        });
      }

      // Sort by submission date (most recent first)
      if (Array.isArray(visibleResults)) {
        visibleResults.sort((a, b) => {
          const dateA = new Date(a.submittedAt || a.completedAt || 0);
          const dateB = new Date(b.submittedAt || b.completedAt || 0);
          return dateB - dateA;
        });
      }

      setAllUserResults(visibleResults);
    } catch (error) {
      console.error("Error fetching all user results:", error);
      setError("Failed to fetch results. Please try again later.");
    } finally {
      setLoading(false);
    }
  }, [user?._id, canViewAllResults, isResolter, isSchoolTeacher, isUniversity, user]);

  useEffect(() => {
    if (!user) return;

    if (id) {
      fetchResults();
    } else {
      fetchAllUserResults();
    }
  }, [id, user, fetchResults, fetchAllUserResults]);

  // Get top 3 from topFive - must be before any early returns
  const topThree = useMemo(() => (topFive || []).slice(0, 3), [topFive]);

  if (loading) {
    return (
      <div className="results-loading">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  if (error && !hasPendingSubmission) {
    // Check if error message indicates results are being processed
    const isPendingMessage =
      error.toLowerCase().includes("working on") ||
      error.toLowerCase().includes("processing") ||
      error.toLowerCase().includes("coming");

    return (
      <div className="results-page page-container">
        <div>
          <div className="no-results card">
            {isPendingMessage ? (
              <>
                <h1 className="pending-results-title">
                  Your Results Are Being Checked
                </h1>
                <p className="pending-results-message">Please wait.</p>
                <Link to="/dashboard" className="button-primary">
                  Go to Dashboard
                </Link>
                <p className="pending-results-footer">
                  We will notify you once your results are ready.
                </p>
              </>
            ) : (
              <>
                <h2>Error</h2>
                <p>{error}</p>
                <Link to="/dashboard" className="button-primary">
                  Go to Dashboard
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  // If no olympiad ID, show all user results
  if (!id) {
    return (
      <div className="results-page page-container">
        <div>
          <div className="results-header">
            <h1 className="results-title text-glow">
              {canViewAllResults ? "All Results" : "All Your Results"}
            </h1>
            <p className="results-subtitle">
              {canViewAllResults
                ? "View all olympiad results from all users"
                : "View all your olympiad results"}
            </p>
          </div>

          {(allUserResults || []).length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📊</div>
              <h3>No Results Found</h3>
              <p>
                {canViewAllResults
                  ? "No olympiad results found yet."
                  : "You haven't completed any olympiads yet."}
              </p>
              <Link to="/dashboard" className="button-primary">
                Go to Dashboard
              </Link>
            </div>
          ) : (
            <div className="all-results-list">
              {(allUserResults || []).map((resultItem, index) => {
                const totalScore = Number(resultItem?.totalScore) || 0;
                const totalPoints = Number(resultItem?.olympiad?.totalPoints) || 100;
                const percentage = totalPoints > 0
                  ? Math.round((totalScore / totalPoints) * 100)
                  : 0;

                return (
                  <div
                    key={resultItem._id || index}
                    className="result-item-card card"
                    onClick={() =>
                      navigate(`/olympiad/${resultItem.olympiadId}/results`)
                    }
                    style={{ cursor: "pointer" }}
                  >
                    <div className="result-item-header">
                      <h3 className="result-item-title">
                        {resultItem.olympiadTitle}
                      </h3>
                      <div className="result-item-badge">
                        {resultItem.olympiadType}
                      </div>
                    </div>

                    <div className="result-item-content">
                      <div className="result-item-score">
                        <span className="score-value">
                          {totalScore}
                        </span>
                        <span className="score-divider">/</span>
                        <span className="score-total">
                          {totalPoints}
                        </span>
                        <span className="score-percentage">
                          ({percentage}%)
                        </span>
                      </div>

                      <div className="result-item-meta">
                        <div className="meta-item">
                          <span className="meta-label">Rank:</span>
                          <span className="meta-value">
                            #{resultItem.rank || "N/A"}
                          </span>
                        </div>
                        <div className="meta-item">
                          <span className="meta-label">Completed:</span>
                          <span className="meta-value">
                            {resultItem.submittedAt || resultItem.completedAt
                              ? formatDate(
                                  resultItem.submittedAt ||
                                    resultItem.completedAt
                                )
                              : "N/A"}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="result-item-action">
                      <span className="action-text">View Details →</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  }

  // If olympiad ID is provided, show specific olympiad results
  // For admins/owners/resolters, show all results even if they haven't participated
  if (!userResult && !canViewAllResults) {
    return (
      <div className="results-page page-container">
        <div>
          <div className="empty-state">
            {hasPendingSubmission ? (
              <>
                <div className="empty-icon">⏳</div>
                <h3>Your Results Are Being Checked</h3>
                <p>Please wait. We will notify you once your results are ready.</p>
                <Link to="/dashboard" className="button-primary">
                  Go to Dashboard
                </Link>
              </>
            ) : (
              <>
                <div className="empty-icon">📊</div>
                <h3>No Results Found</h3>
                <p>You haven't completed this olympiad yet.</p>
                <Link to="/dashboard" className="button-primary">
                  Go to Dashboard
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  // For admins/owners/resolters with no results at all for this olympiad
  if (canViewAllResults && (allResults || []).length === 0 && !userResult) {
    return (
      <div className="results-page page-container">
        <div>
          <div className="empty-state">
            <div className="empty-icon">📊</div>
            <h3>No Results Found</h3>
            <p>No one has completed this olympiad yet.</p>
            <Link to="/dashboard" className="button-primary">
              Go to Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const userScore = userResult ? (Number(userResult?.score) || Number(userResult?.totalScore) || 0) : 0;
  const userTotalPoints = userResult ? (Number(userResult?.totalPoints) || 100) : 100;
  const percentage = userResult
    ? (userResult.percentage !== undefined ? Number(userResult.percentage) : (userTotalPoints > 0 ? Math.round((userScore / userTotalPoints) * 100) : 0))
    : 0;

  // Check if user is in top 3
  const userInTopThree = userResult && (Number(userResult?.rank) || 0) <= 3;

  const handleEditResult = async (resultId) => {
    const totalScoreNum = Number(editForm?.totalScore);
    if (!editForm?.totalScore || isNaN(totalScoreNum) || totalScoreNum < 0) {
      setNotification({ message: "Please enter a valid score", type: "error" });
      return;
    }

    try {
      setLoading(true);
      const updateData = {};
      if (editForm?.totalScore)
        updateData.totalScore = Math.max(0, Number(editForm.totalScore) || 0);
      if (editForm?.maxScore) {
        const maxScoreNum = Number(editForm.maxScore) || 0;
        if (maxScoreNum > 0) updateData.maxScore = maxScoreNum;
      }
      if (editForm?.percentage) {
        const percentageNum = Number(editForm.percentage) || 0;
        if (percentageNum >= 0 && percentageNum <= 100) updateData.percentage = percentageNum;
      }

      await resolterAPI.editResult(resultId, updateData);

      setNotification({
        message: "Result updated successfully!",
        type: "success",
      });
      setEditingResult(null);
      setEditForm({ totalScore: "", maxScore: "", percentage: "" });

      // Refresh results
      if (id) {
        fetchResults();
      } else {
        fetchAllUserResults();
      }
    } catch (error) {
      setNotification({
        message: "Failed to update result. Please try again.",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const openEditModal = (result) => {
    if (!result) return;
    setEditingResult(result);
    setEditForm({
      totalScore: String(Number(result?.totalScore) || Number(result?.score) || 0),
      maxScore: String(Number(result?.totalPoints) || Number(result?.maxScore) || 100),
      percentage: result?.percentage !== undefined ? String(Number(result.percentage) || 0) : "",
    });
  };

  const closeEditModal = () => {
    setEditingResult(null);
    setEditForm({ totalScore: "", maxScore: "", percentage: "" });
  };

  // Helper to get position display
  const getPositionDisplay = (position) => {
    if (position) return position; // Use position from API if available
    if (!userResult) return "N/A";
    // Fallback to generating position
    const rank = Number(userResult?.rank) || 0;
    if (rank === 1) return "🥇 1st Place";
    if (rank === 2) return "🥈 2nd Place";
    if (rank === 3) return "🥉 3rd Place";
    return `#${rank}`;
  };

  return (
    <div className="results-page">
      <div className="container">
        <div className="results-header">
          <h1 className="results-title text-glow">
            {canViewAllResults ? "All Results" : "Your Results"}
          </h1>
          {olympiadTitle && (
            <h2 className="results-subtitle">{olympiadTitle}</h2>
          )}
        </div>

        {/* Top 3 Winners Section */}
        {topThree.length > 0 && (
          <div className="top-three-section">
            <h3 className="section-title">🏆 Top 3 Winners</h3>
            <div className="top-three-grid">
              {(topThree || []).map((topResult, index) => {
                const isCurrentUser =
                  topResult.userId === user._id ||
                  topResult.user?._id === user._id;
                const topScore = Number(topResult?.score) || Number(topResult?.totalScore) || 0;
                const topTotalPoints = Number(topResult?.totalPoints) || 100;
                const topPercentage = topResult?.percentage !== undefined
                  ? Number(topResult.percentage)
                  : (topTotalPoints > 0 ? Math.round((topScore / topTotalPoints) * 100) : 0);

                return (
                  <div
                    key={topResult.userId || topResult._id || index}
                    className={`top-three-card card ${
                      isCurrentUser ? "current-user" : ""
                    }`}
                  >
                    <div className="top-three-rank">
                      {topResult.position ||
                        (topResult.rank === 1
                          ? "🥇"
                          : topResult.rank === 2
                          ? "🥈"
                          : "🥉")}
                    </div>
                    <div className="top-three-info">
                      <div className="top-three-name">
                        {isCurrentUser
                          ? "You"
                          : topResult.userName || "Anonymous"}
                      </div>
                      <div className="top-three-score">
                        {topScore} / {topTotalPoints}
                      </div>
                      <div className="top-three-percentage">
                        {topPercentage}%
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Show all results table for admins/owners/resolters */}
        {canViewAllResults && (allResults || []).length > 0 && (
          <div className="all-results-table-section">
            <h3 className="section-title">
              All Participants ({(allResults || []).length})
            </h3>
            <div className="all-results-table card">
              <div
                className={`table-header ${isResolter ? "has-actions" : ""}`}
              >
                <div className="table-cell rank-cell">Rank</div>
                <div className="table-cell name-cell">Name</div>
                <div className="table-cell email-cell">Email</div>
                <div className="table-cell score-cell">Score</div>
                <div className="table-cell time-cell">Completed</div>
                {isResolter && (
                  <div className="table-cell actions-cell">Actions</div>
                )}
              </div>
              <div className="table-body">
                {(allResults || []).map((result, index) => {
                  const resultScore = Number(result?.totalScore) || Number(result?.score) || 0;
                  const resultTotalPoints = Number(result?.totalPoints) || 100;
                  const resultPercentage = resultTotalPoints > 0
                    ? Math.round((resultScore / resultTotalPoints) * 100)
                    : 0;
                  const isCurrentUser =
                    user?._id &&
                    (result.user?._id === user._id ||
                      result.userId === user._id ||
                      result.userId?.toString() === user._id.toString());

                  return (
                    <div
                      key={result._id || index}
                      className={`table-row ${
                        isCurrentUser ? "current-user-row" : ""
                      } ${index < 3 ? "top-three" : ""} ${
                        isResolter ? "has-actions" : ""
                      }`}
                    >
                      <div className="table-cell rank-cell">
                        <span className="rank-number">
                          {index === 0
                            ? "🥇"
                            : index === 1
                            ? "🥈"
                            : index === 2
                            ? "🥉"
                            : `#${result.rank || index + 1}`}
                        </span>
                      </div>
                      <div className="table-cell name-cell">
                        {isCurrentUser
                          ? "You"
                          : result.user?.name || "Anonymous"}
                      </div>
                      <div className="table-cell email-cell">
                        {result.user?.email || "-"}
                      </div>
                      <div className="table-cell score-cell">
                        <span className="score-value">{resultScore}</span>
                        <span className="score-max">
                          / {resultTotalPoints}
                        </span>
                        <span className="score-percentage">
                          ({resultPercentage}%)
                        </span>
                      </div>
                      <div className="table-cell time-cell">
                        {result.completedAt || result.submittedAt
                          ? formatDate(result.completedAt || result.submittedAt)
                          : "-"}
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
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Edit Result Modal for Resolters */}
        {isResolter && editingResult && (
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
                  <label>User: {editingResult.user?.name || "Anonymous"}</label>
                </div>
                <div className="form-group">
                  <label>Olympiad: {olympiadTitle || "Unknown"}</label>
                </div>
                <div className="form-group">
                  <label>
                    Current Score:{" "}
                    {Number(editingResult?.totalScore) || Number(editingResult?.score) || 0}
                    {editingResult?.totalPoints &&
                      ` / ${Number(editingResult.totalPoints) || 100}`}
                    {editingResult?.percentage !== undefined &&
                      ` (${Number(editingResult.percentage) || 0}%)`}
                  </label>
                </div>
                <div className="form-group">
                  <label htmlFor="edit-total-score">Total Score *</label>
                  <input
                    type="number"
                    id="edit-total-score"
                    value={editForm.totalScore}
                    onChange={(e) =>
                      setEditForm({ ...editForm, totalScore: e.target.value })
                    }
                    placeholder="Enter total score"
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="edit-max-score">Max Score (optional)</label>
                  <input
                    type="number"
                    id="edit-max-score"
                    value={editForm.maxScore}
                    onChange={(e) =>
                      setEditForm({ ...editForm, maxScore: e.target.value })
                    }
                    placeholder="Enter max score"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="edit-percentage">Percentage (optional)</label>
                  <input
                    type="number"
                    id="edit-percentage"
                    value={editForm.percentage}
                    onChange={(e) =>
                      setEditForm({ ...editForm, percentage: e.target.value })
                    }
                    placeholder="Enter percentage"
                    min="0"
                    max="100"
                  />
                </div>
              </div>
              <div className="modal-actions">
                <button className="button-secondary" onClick={closeEditModal}>
                  Cancel
                </button>
                <button
                  className="button-primary"
                  onClick={() => handleEditResult(editingResult._id)}
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        )}

        {/* User's Latest Result - Large Section (only show if user participated) */}
        {userResult && (
          <div className="user-result-large card">
            <div className="user-result-header">
              <h3 className="user-result-title">Your Latest Result</h3>
              <div className="user-rank-badge">
                {userResult.position || getPositionDisplay()}
              </div>
            </div>

            <div className="user-result-content">
              <div className="user-result-main">
                <div className="user-score-large">
                  <div className="score-number">{userScore}</div>
                  <div className="score-divider">/</div>
                  <div className="score-total">
                    {userTotalPoints}
                  </div>
                </div>
                <div className="user-percentage-large">{percentage}%</div>
              </div>

              <div className="user-result-details">
                <div className="detail-item">
                  <span className="detail-label">Rank</span>
                  <span className="detail-value">
                    {userResult?.position || `#${Number(userResult?.rank) || 0}`}
                  </span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Completed</span>
                  <span className="detail-value">
                    {userResult.submittedAt || userResult.completedAt
                      ? formatDate(
                          userResult.submittedAt || userResult.completedAt
                        )
                      : "N/A"}
                  </span>
                </div>
                {(Number(totalParticipants) || 0) > 0 && (
                  <div className="detail-item">
                    <span className="detail-label">Total Participants</span>
                    <span className="detail-value">{Number(totalParticipants) || 0}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* User's Position in List (if not in top 3) */}
        {userResult && !userInTopThree && (Number(userResult?.rank) || 0) > 3 && (
          <div className="user-position-section">
            <h3 className="section-title">Your Position</h3>
            <div className="user-position-card card highlighted">
              <div className="position-rank">
                {userResult?.position || `#${Number(userResult?.rank) || 0}`}
              </div>
              <div className="position-info">
                <div className="position-name">You</div>
                <div className="position-score">
                  {userScore} / {userTotalPoints} (
                  {percentage}%)
                </div>
                <div className="position-time">
                  Completed:{" "}
                  {userResult.submittedAt || userResult.completedAt
                    ? formatDate(
                        userResult.submittedAt || userResult.completedAt
                      )
                    : "N/A"}
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="results-actions">
          <Link to={`/olympiad/${id}/leaderboard`} className="button-primary">
            View Full Leaderboard
          </Link>
          <Link to="/dashboard" className="button-secondary">
            Back to Dashboard
          </Link>
        </div>

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

export default Results;
