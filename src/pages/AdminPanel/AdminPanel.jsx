import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useLocation } from "react-router-dom";
import { adminAPI } from "../../services/api";
import NotificationToast from "../../components/NotificationToast";
import { formatDate } from "../../utils/helpers";
import "./AdminPanel.css";

// Question Form Component for Step 3
const QuestionFormStep = ({
  olympiadId,
  olympiadType,
  questions,
  onAddQuestion,
  onFinish,
  onBack,
}) => {
  const [questionForm, setQuestionForm] = useState({
    question: "",
    type: olympiadType === "test" ? "multiple-choice" : "essay",
    options: ["", "", "", ""],
    correctAnswer: "",
    points: 10,
  });

  const handleAddQuestion = (e) => {
    e.preventDefault();

    if (olympiadType === "test") {
      // Validate multiple choice question
      if (!questionForm.question || !questionForm.correctAnswer) {
        return;
      }
      const validOptions = (Array.isArray(questionForm.options) ? questionForm.options : []).filter(
        (opt) => opt && String(opt).trim() !== ""
      );
      if (validOptions.length < 2) {
        return;
      }

      onAddQuestion({
        question: questionForm.question,
        type: "multiple-choice",
        options: validOptions,
        correctAnswer: questionForm.correctAnswer,
        points: Number(questionForm.points) || 10,
      });
    } else {
      // Essay question
      if (!questionForm.question) {
        return;
      }

      onAddQuestion({
        question: questionForm.question,
        type: "essay",
        points: Number(questionForm.points) || 10,
      });
    }

    // Reset form
    setQuestionForm({
      question: "",
      type: olympiadType === "test" ? "multiple-choice" : "essay",
      options: ["", "", "", ""],
      correctAnswer: "",
      points: 10,
    });
  };

  const handleOptionChange = (index, value) => {
    const newOptions = [...questionForm.options];
    newOptions[index] = value;
    setQuestionForm({ ...questionForm, options: newOptions });
  };

  return (
    <div className="step-content">
      <h2>Step 3: Add Questions</h2>
      <p className="step-description">
        Add questions to your {olympiadType === "test" ? "test" : "essay"}{" "}
        olympiad
      </p>

      {/* Questions List */}
      {questions.length > 0 && (
        <div className="questions-list">
          <h3>Added Questions ({(questions || []).length})</h3>
          {(questions || []).map((q, index) => (
            <div key={q._id || index} className="question-item card">
              <div className="question-header">
                <span className="question-number">Q{index + 1}</span>
                <span className="question-points">{Number(q?.points) || 0} pts</span>
              </div>
              <p className="question-text">{q.question || "No question text"}</p>
              {q.type === "multiple-choice" && q.options && q.options.length > 0 && (
                <div className="question-options">
                  {(q.options || []).map((opt, optIndex) => (
                    <div
                      key={optIndex}
                      className={`option ${
                        opt === q.correctAnswer ? "correct" : ""
                      }`}
                    >
                      {String.fromCharCode(65 + optIndex)}. {opt}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add Question Form */}
      <form onSubmit={handleAddQuestion} className="question-form">
        <div className="form-group">
          <label>Question</label>
          <textarea
            value={questionForm.question}
            onChange={(e) =>
              setQuestionForm({ ...questionForm, question: e.target.value })
            }
            placeholder="Enter your question..."
            rows="3"
            required
          />
        </div>

        {olympiadType === "test" && (
          <>
            <div className="form-group">
              <label>Options</label>
              {(questionForm.options || []).map((option, index) => (
                <div key={index} className="option-input-row">
                  <span className="option-label">
                    {String.fromCharCode(65 + index)}.
                  </span>
                  <input
                    type="text"
                    value={option}
                    onChange={(e) => handleOptionChange(index, e.target.value)}
                    placeholder={`Option ${String.fromCharCode(65 + index)}`}
                    className="option-input"
                  />
                  <input
                    type="radio"
                    name="correctAnswer"
                    value={option}
                    checked={questionForm.correctAnswer === option}
                    onChange={(e) =>
                      setQuestionForm({
                        ...questionForm,
                        correctAnswer: e.target.value,
                      })
                    }
                    disabled={!option.trim()}
                  />
                  <label className="radio-label">Correct</label>
                </div>
              ))}
            </div>
          </>
        )}

        <div className="form-row">
          <div className="form-group">
            <label>Points</label>
            <input
              type="number"
              value={questionForm.points}
              onChange={(e) =>
                setQuestionForm({
                  ...questionForm,
                        points: Number(e.target.value) || 10,
                })
              }
              min="1"
              required
            />
          </div>
        </div>

        <div className="form-actions">
          <button type="button" className="button-secondary" onClick={onBack}>
            Back
          </button>
          <button type="submit" className="button-primary">
            Add Question
          </button>
          <button type="button" className="button-success" onClick={onFinish}>
            Finish
          </button>
        </div>
      </form>
    </div>
  );
};

const AdminPanel = () => {
  const location = useLocation();
  const handledEditIdRef = useRef(null);
  const [olympiads, setOlympiads] = useState([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedOlympiad, setSelectedOlympiad] = useState(null);
  const [editingOlympiad, setEditingOlympiad] = useState(null);
  const [showQuestionManager, setShowQuestionManager] = useState(false);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState(null);

  // Step-by-step form state
  const [currentStep, setCurrentStep] = useState(1); // 1: Type, 2: Basic Info, 3: Questions
  const [createdOlympiadId, setCreatedOlympiadId] = useState(null);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    subject: "Mathematics",
    type: "", // Will be set in step 1
    startTime: "",
    endTime: "",
    duration: 60, // in minutes - will convert to seconds
    status: "draft", // draft, published, unpublished
    olympiadLogo: null, // Logo file
  });

  const [statusFilter, setStatusFilter] = useState("all"); // all, published, unpublished, draft

  const [questions, setQuestions] = useState([]);

  const fetchOlympiads = useCallback(async () => {
    try {
      // Use admin endpoint to get all olympiads (including drafts)
      const response = await adminAPI.getAllOlympiads();
      const olympiadsData = response.data?.data || response.data || [];
      setOlympiads(Array.isArray(olympiadsData) ? olympiadsData : []);
    } catch (error) {
      setNotification({ message: "Failed to load olympiads", type: "error" });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOlympiads();
  }, [fetchOlympiads]);

  // Step 1: Select type
  const handleTypeSelect = useCallback((type) => {
    setFormData((prev) => ({ ...prev, type }));
    setCurrentStep(2);
  }, []);

  // Step 2: Create olympiad with basic info
  const handleCreateOlympiad = useCallback(async (e) => {
    e.preventDefault();

    // Validate required fields
    if (!formData.title || !formData.title.trim()) {
      setNotification({
        message: "Please provide a title for the olympiad",
        type: "error",
      });
      return;
    }

    if (!formData.type) {
      setNotification({
        message: "Please select an olympiad type",
        type: "error",
      });
      return;
    }

    if (!formData.subject) {
      setNotification({
        message: "Please select a subject",
        type: "error",
      });
      return;
    }

    setLoading(true);
    try {
      // Convert datetime-local to ISO 8601 format with timezone
      const formatDateTime = (dateTimeLocal) => {
        if (!dateTimeLocal) return "";
        return new Date(dateTimeLocal).toISOString();
      };

      // Prepare data for backend - create olympiad first without logo
      const olympiadData = {
        title: formData.title,
        description: formData.description,
        type: formData.type,
        subject: formData.subject,
        startTime: formatDateTime(formData.startTime),
        endTime: formatDateTime(formData.endTime),
        duration: (Number(formData.duration) || 60) * 60, // Convert minutes to seconds
        status: formData.status,
      };

      // Create olympiad first
      const response = await adminAPI.createOlympiad(olympiadData);

      // Try multiple possible response structures
      const newOlympiadId =
        response.data?._id ||
        response.data?.olympiad?._id ||
        response.data?.id ||
        response.data?.olympiad?.id;

      if (!newOlympiadId) {
        setNotification({
          message:
            "Olympiad created but ID not received. Please refresh and try again.",
          type: "error",
        });
        setLoading(false);
        return;
      }

      // Now upload logo if one was selected, using the newly created olympiad ID
      if (formData.olympiadLogo) {
        try {
          await adminAPI.uploadOlympiadLogo(
            formData.olympiadLogo,
            newOlympiadId
          );

          // Logo should now be associated with the olympiad via backend
          setNotification({
            message: "Olympiad created and logo uploaded successfully!",
            type: "success",
          });
        } catch (logoError) {
          console.error(
            "Logo upload error:",
            logoError.response?.data || logoError
          );
          // Don't fail the whole process if logo upload fails
          // Olympiad was created successfully, user can upload logo later
          setNotification({
            message:
              "Olympiad created successfully, but logo upload failed. You can update the logo later. " +
              (logoError.response?.data?.message ||
                logoError.response?.data?.error ||
                ""),
            type: "warning",
          });
        }
      } else {
        setNotification({
          message: "Olympiad created! Now add questions.",
          type: "success",
        });
      }

      setCreatedOlympiadId(newOlympiadId);
      setCurrentStep(3); // Move to questions step
    } catch (error) {
      console.error("Error creating olympiad:", error);
      setNotification({
        message: error?.response?.data?.message || error?.message || "Unable to create olympiad. Please check all fields and try again.",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  }, [formData, fetchOlympiads]);

  // Step 3: Add question
  const handleAddQuestion = useCallback(async (questionData) => {
    try {
      // Validate that olympiad was created successfully
      if (!createdOlympiadId) {
        setNotification({
          message: "Please create the olympiad first before adding questions",
          type: "error",
        });
        return;
      }

      const questionPayload = {
        olympiadId: createdOlympiadId,
        ...questionData,
        order: (Array.isArray(questions) ? questions.length : 0) + 1,
      };

      const response = await adminAPI.addQuestion(questionPayload);
      setQuestions((prev) => [...prev, response.data]);
      setNotification({
        message: "Question added successfully!",
        type: "success",
      });
    } catch (error) {
      setNotification({
        message: error.response?.data?.message || "Failed to save question",
        type: "error",
      });
    }
  }, [createdOlympiadId, questions]);

  const handleUpdateQuestion = useCallback(async (questionId, questionData) => {
    try {
      const response = await adminAPI.updateQuestion(questionId, questionData);
      const updatedQuestion = response.data;
      setQuestions((prev) =>
        (Array.isArray(prev) ? prev : []).map((q) =>
          q?._id === questionId ? { ...q, ...updatedQuestion } : q
        )
      );
      setNotification({ message: "Question updated", type: "success" });
    } catch (error) {
      setNotification({
        message: error.response?.data?.message || "Failed to update question",
        type: "error",
      });
    }
  }, []);

  const handleDeleteQuestion = useCallback(async (questionId) => {
    if (!window.confirm("Delete this question?")) return;
    try {
      await adminAPI.deleteQuestion(questionId);
      setQuestions((prev) =>
        (Array.isArray(prev) ? prev : []).filter((q) => q?._id !== questionId)
      );
      setNotification({ message: "Question deleted", type: "success" });
    } catch (error) {
      setNotification({
        message: error.response?.data?.message || "Failed to delete question",
        type: "error",
      });
    }
  }, []);

  // Finish and close
  const handleFinish = useCallback(() => {
    setShowCreateForm(false);
    setCurrentStep(1);
    setCreatedOlympiadId(null);
    setQuestions([]);
    setFormData({
      title: "",
      description: "",
      subject: "Mathematics",
      type: "",
      startTime: "",
      endTime: "",
      duration: 60,
      status: "draft",
      olympiadLogo: null,
    });
    fetchOlympiads();
    setNotification({
      message: "Olympiad created successfully with questions!",
      type: "success",
    });
  }, [fetchOlympiads]);

  // Reset form
  const handleCancel = useCallback(() => {
    setShowCreateForm(false);
    setCurrentStep(1);
    setCreatedOlympiadId(null);
    setEditingOlympiad(null);
    setQuestions([]);
    setFormData({
      title: "",
      description: "",
      subject: "Mathematics",
      type: "",
      startTime: "",
      endTime: "",
      duration: 60,
      status: "draft",
      olympiadLogo: null,
    });
  }, []);

  // Load olympiad for editing
  const handleEdit = useCallback(async (olympiad) => {
    const normalizeOlympiadData = (payload) => {
      if (!payload) return null;
      const data = payload.data ?? payload;
      if (data?.olympiad) return data.olympiad;
      if (data?.data?.olympiad) return data.data.olympiad;
      if (data?.data) return data.data;
      return data;
    };

    try {
      // Convert ISO dates to datetime-local format
      const formatToLocalDateTime = (isoString) => {
        if (!isoString) return "";
        const date = new Date(isoString);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");
        const hours = String(date.getHours()).padStart(2, "0");
        const minutes = String(date.getMinutes()).padStart(2, "0");
        return `${year}-${month}-${day}T${hours}:${minutes}`;
      };

      const buildFormData = (data) => ({
        title: data?.title || "",
        description: data?.description || "",
        subject: data?.subject || "Mathematics",
        type: data?.type || "test",
        startTime: formatToLocalDateTime(data?.startTime),
        endTime: formatToLocalDateTime(data?.endTime),
        duration: Math.floor((Number(data?.duration) || 3600) / 60),
        status: data?.status || "draft",
        olympiadLogo: null,
      });

      setEditingOlympiad(olympiad._id);
      setShowCreateForm(true);
      setCurrentStep(2); // Skip type selection for editing
      setFormData(buildFormData(olympiad));

      const response = await adminAPI.getOlympiadById(olympiad._id);
      const olympiadData = normalizeOlympiadData(response?.data);

      const hasValidData =
        olympiadData &&
        (olympiadData._id || olympiadData.id || olympiadData.title);

      if (hasValidData) {
        setFormData(buildFormData(olympiadData));
      }
    } catch (error) {
      setNotification({ message: "Failed to load olympiad", type: "error" });
    }
  }, []);

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const editId = searchParams.get("edit");
    if (!editId) return;
    if (handledEditIdRef.current === editId) return;

    handledEditIdRef.current = editId;
    handleEdit({ _id: editId });
  }, [location.search, handleEdit]);

  // Update olympiad
  const handleUpdateOlympiad = useCallback(async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const formatDateTime = (dateTimeLocal) => {
        if (!dateTimeLocal) return "";
        return new Date(dateTimeLocal).toISOString();
      };

      // Prepare data for backend - update olympiad first
      const olympiadData = {
        title: formData.title,
        description: formData.description,
        type: formData.type,
        subject: formData.subject,
        startTime: formatDateTime(formData.startTime),
        endTime: formatDateTime(formData.endTime),
        duration: (Number(formData.duration) || 60) * 60,
        status: formData.status,
      };

      // Keep existing logo URL if no new logo is selected
      if (!formData.olympiadLogo || !(formData.olympiadLogo instanceof File)) {
        const existingLogo = editingOlympiad?.olympiadLogo;
        if (existingLogo) {
          olympiadData.olympiadLogo = existingLogo;
        }
      }

      // Update olympiad first
      await adminAPI.updateOlympiad(editingOlympiad, olympiadData);

      // Then upload new logo if one was selected
      if (formData.olympiadLogo && formData.olympiadLogo instanceof File) {
        try {
          await adminAPI.uploadOlympiadLogo(
            formData.olympiadLogo,
            editingOlympiad
          );

          setNotification({
            message: "Olympiad updated and logo uploaded successfully",
            type: "success",
          });
        } catch (logoError) {
          console.error(
            "Logo upload error:",
            logoError.response?.data || logoError
          );
          // Don't fail the whole process if logo upload fails
          // Olympiad was updated successfully, user can upload logo later
          setNotification({
            message:
              "Olympiad updated successfully, but logo upload failed. You can try uploading the logo again. " +
              (logoError.response?.data?.message ||
                logoError.response?.data?.error ||
                ""),
            type: "warning",
          });
        }
      } else {
        setNotification({
          message: "Olympiad updated successfully",
          type: "success",
        });
      }
      setEditingOlympiad(null);
      setShowCreateForm(false);
      setFormData({
        title: "",
        description: "",
        subject: "Mathematics",
        type: "",
        startTime: "",
        endTime: "",
        duration: 60,
        status: "draft",
      });
      setCurrentStep(1);
      fetchOlympiads();
    } catch (error) {
      setNotification({
        message: error?.response?.data?.message || error?.message || "Unable to update olympiad. Please try again.",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  }, [formData, editingOlympiad, fetchOlympiads]);

  // Open question manager
  const handleManageQuestions = async (olympiad) => {
    setSelectedOlympiad(olympiad);
    setShowQuestionManager(true);
  };

  // Quick status toggle
  const handleToggleStatus = async (olympiad) => {
    try {
      const newStatus =
        olympiad.status === "published" ? "unpublished" : "published";
      await adminAPI.updateOlympiad(olympiad._id, { status: newStatus });
      setNotification({
        message: `Olympiad ${
          newStatus === "published" ? "published" : "unpublished"
        } successfully`,
        type: "success",
      });
      fetchOlympiads();
    } catch (error) {
      setNotification({
        message: error?.response?.data?.message || error?.message || "Unable to update status. Please try again.",
        type: "error",
      });
    }
  };

  // Filter olympiads by status
  const getFilteredOlympiads = useMemo(() => {
    if (!Array.isArray(olympiads)) return [];
    if (statusFilter === "all") return olympiads;
    return (Array.isArray(olympiads) ? olympiads : []).filter((olympiad) => {
      if (statusFilter === "published") return olympiad.status === "published";
      if (statusFilter === "unpublished")
        return olympiad.status === "unpublished";
      if (statusFilter === "draft") return olympiad.status === "draft";
      return true;
    });
  }, [olympiads, statusFilter]);

  // Get status badge
  const getStatusBadge = useCallback((status) => {
    const statusMap = {
      published: { label: "Published", class: "status-published" },
      unpublished: { label: "Unpublished", class: "status-unpublished" },
      draft: { label: "Draft", class: "status-draft" },
    };
    const statusInfo = statusMap[status] || statusMap["draft"];
    return (
      <span className={`status-badge ${statusInfo.class}`}>
        {statusInfo.label}
      </span>
    );
  }, []);

  const handleDelete = useCallback(async (id) => {
    if (window.confirm("Are you sure you want to delete this olympiad?")) {
      try {
        await adminAPI.deleteOlympiad(id);
        setNotification({
          message: "Olympiad deleted successfully",
          type: "success",
        });
        fetchOlympiads();
      } catch (error) {
        setNotification({
          message: "Failed to delete olympiad",
          type: "error",
        });
      }
    }
  }, [fetchOlympiads]);

  // Duplicate olympiad
  const handleDuplicate = useCallback(async (olympiad) => {
    if (!window.confirm(`Are you sure you want to duplicate "${olympiad.title}"?`)) {
      return;
    }

    setLoading(true);
    try {
      // 1. Get full olympiad details
      const response = await adminAPI.getOlympiadById(olympiad._id);
      const originalOlympiad = response.data.data || response.data;

      // 2. Get questions
      const questionsResponse = await adminAPI.getQuestions(olympiad._id);
      const originalQuestions = Array.isArray(questionsResponse.data?.data)
        ? questionsResponse.data.data
        : (questionsResponse.data || []);

      // 3. Create new olympiad
      const normalizedTitle = (originalOlympiad?.title || 'Olympiad').trim();
      const normalizedDescription = (originalOlympiad?.description || normalizedTitle).trim();
      const normalizedType = originalOlympiad?.type || 'test';
      const normalizedSubject = originalOlympiad?.subject || 'Mathematics';
      const normalizedDuration = Number(originalOlympiad?.duration) || 3600;

      const newOlympiadData = {
        title: `${normalizedTitle} (Copy)`,
        description: normalizedDescription,
        type: normalizedType,
        subject: normalizedSubject,
        startTime: new Date().toISOString(), // Reset start time
        endTime: new Date(Date.now() + 3600000).toISOString(), // Reset end time (1 hour from now)
        duration: normalizedDuration,
        status: "draft", // Always draft
      };

      const createResponse = await adminAPI.createOlympiad(newOlympiadData);
      const newOlympiadId =
        createResponse.data?._id ||
        createResponse.data?.olympiad?._id ||
        createResponse.data?.id ||
        createResponse.data?.olympiad?.id;

      if (!newOlympiadId) {
        throw new Error("Failed to get new olympiad ID");
      }

      // 4. Add questions to new olympiad
      // We use a loop to add questions sequentially to preserve order
      for (const question of originalQuestions) {
        const normalizedQuestion = question?.question || question?.questionText || '';
        const normalizedType = question?.type || originalOlympiad?.type || 'essay';
        const normalizedPoints = Number(question?.points) || 10;
        const normalizedOptions = Array.isArray(question?.options)
          ? question.options.filter((opt) => opt && String(opt).trim() !== '')
          : [];
        let normalizedCorrectAnswer = question?.correctAnswer;

        if (normalizedType === 'multiple-choice') {
          if (!normalizedOptions.length) {
            // Skip invalid MCQ instead of crashing the whole duplication
            // Backend requires options + correctAnswer
            continue;
          }
          if (!normalizedCorrectAnswer || !normalizedOptions.includes(normalizedCorrectAnswer)) {
            normalizedCorrectAnswer = normalizedOptions[0];
          }
        }

        if (!normalizedQuestion || !normalizedType || !normalizedPoints) {
          continue;
        }

        await adminAPI.addQuestion({
          olympiadId: newOlympiadId,
          question: normalizedQuestion,
          type: normalizedType,
          options: normalizedOptions,
          correctAnswer: normalizedType === 'multiple-choice' ? normalizedCorrectAnswer : undefined,
          points: normalizedPoints,
          order: question?.order,
        });
      }

      setNotification({
        message: "Olympiad duplicated successfully!",
        type: "success",
      });
      fetchOlympiads();
    } catch (error) {
      console.error("Duplicate error:", error);
      setNotification({
        message: "Failed to duplicate olympiad",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  }, [fetchOlympiads]);

  if (loading) {
    return (
      <div className="admin-loading">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  return (
    <div className="admin-panel-page">
      <div className="container">
        <div className="admin-header">
          <h1 className="admin-title text-glow">Admin Panel</h1>
          <div className="admin-header-actions">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="status-filter"
            >
              <option value="all">All Status</option>
              <option value="published">Published</option>
              <option value="unpublished">Unpublished</option>
              <option value="draft">Draft</option>
            </select>
            <button
              className="button-primary header-create-button"
              onClick={() => setShowCreateForm(!showCreateForm)}
            >
              {showCreateForm ? "Cancel" : "+ Create Olympiad"}
            </button>
          </div>
        </div>

        {showCreateForm && (
          <div className="create-form card">
            {/* Step Indicator */}
            <div className="step-indicator">
              <div
                className={`step ${currentStep >= 1 ? "active" : ""} ${
                  currentStep > 1 ? "completed" : ""
                }`}
              >
                <span className="step-number">1</span>
                <span className="step-label">Choose Type</span>
              </div>
              <div
                className={`step ${currentStep >= 2 ? "active" : ""} ${
                  currentStep > 2 ? "completed" : ""
                }`}
              >
                <span className="step-number">2</span>
                <span className="step-label">Basic Info</span>
              </div>
              <div className={`step ${currentStep >= 3 ? "active" : ""}`}>
                <span className="step-number">3</span>
                <span className="step-label">Add Questions</span>
              </div>
            </div>

            {/* Step 1: Choose Type */}
            {currentStep === 1 && (
              <div className="step-content">
                <h2>
                  {editingOlympiad
                    ? "Step 1: Olympiad Type"
                    : "Step 1: Choose Olympiad Type"}
                </h2>
                <p className="step-description">
                  {editingOlympiad
                    ? `Current type: ${
                        formData.type || "Not set"
                      }. Select a different type to change it.`
                    : "Select the type of olympiad you want to create"}
                </p>

                <div className="type-selection">
                  <button
                    type="button"
                    className={`type-card ${
                      formData.type === "test" ? "selected" : ""
                    }`}
                    onClick={() => {
                      setFormData({ ...formData, type: "test" });
                      if (!editingOlympiad) {
                        setCurrentStep(2);
                      }
                    }}
                  >
                    <div className="type-icon">📝</div>
                    <h3>Test</h3>
                    <p>Multiple choice questions with automatic grading</p>
                  </button>

                  <button
                    type="button"
                    className={`type-card ${
                      formData.type === "essay" ? "selected" : ""
                    }`}
                    onClick={() => {
                      setFormData({ ...formData, type: "essay" });
                      if (!editingOlympiad) {
                        setCurrentStep(2);
                      }
                    }}
                  >
                    <div className="type-icon">✍️</div>
                    <h3>Essay</h3>
                    <p>Essay questions requiring manual evaluation</p>
                  </button>

                  <button
                    type="button"
                    className={`type-card ${
                      formData.type === "mixed" ? "selected" : ""
                    }`}
                    onClick={() => {
                      setFormData({ ...formData, type: "mixed" });
                      if (!editingOlympiad) {
                        setCurrentStep(2);
                      }
                    }}
                  >
                    <div className="type-icon">📚</div>
                    <h3>Mixed</h3>
                    <p>Both test and essay questions in one olympiad</p>
                  </button>
                </div>

                <div className="form-actions">
                  <button
                    type="button"
                    className="button-secondary"
                    onClick={handleCancel}
                  >
                    Cancel
                  </button>
                  {formData.type && (
                    <button
                      type="button"
                      className="button-primary"
                      onClick={() => setCurrentStep(2)}
                    >
                      Next →
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Step 2: Basic Info */}
            {currentStep === 2 && (
              <div className="step-content">
                <h2>
                  {editingOlympiad
                    ? "Edit Olympiad"
                    : "Step 2: Basic Information"}
                </h2>
                <p className="step-description">
                  {editingOlympiad
                    ? "Update the olympiad details"
                    : "Fill in the olympiad details"}
                </p>

                <form
                  onSubmit={
                    editingOlympiad
                      ? handleUpdateOlympiad
                      : handleCreateOlympiad
                  }
                >
                  <div className="form-row">
                    <div className="form-group">
                      <label>Title</label>
                      <input
                        type="text"
                        value={formData.title}
                        onChange={(e) =>
                          setFormData({ ...formData, title: e.target.value })
                        }
                        placeholder="e.g., Math Olympiad 2025"
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>Subject</label>
                      <select
                        value={formData.subject}
                        onChange={(e) =>
                          setFormData({ ...formData, subject: e.target.value })
                        }
                        required
                      >
                        <option value="Mathematics">Mathematics</option>
                        <option value="English">English</option>
                        <option value="Science">Science</option>
                        <option value="Physics">Physics</option>
                        <option value="Chemistry">Chemistry</option>
                      </select>
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group" style={{ width: "100%" }}>
                      <label>Description</label>
                      <textarea
                        value={formData.description}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            description: e.target.value,
                          })
                        }
                        placeholder="Enter olympiad description..."
                        rows="3"
                        required
                      />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group" style={{ width: "100%" }}>
                      <label>Olympiad Logo</label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            olympiadLogo: e.target.files[0] || null,
                          })
                        }
                        className="file-input"
                      />
                      {formData.olympiadLogo && (
                        <div
                          className="file-preview"
                          style={{ marginTop: "12px" }}
                        >
                          <img
                            src={URL.createObjectURL(formData.olympiadLogo)}
                            alt="Logo preview"
                            style={{
                              maxWidth: "200px",
                              maxHeight: "200px",
                              borderRadius: "8px",
                              border: "2px solid var(--border)",
                              objectFit: "cover",
                            }}
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Duration (minutes)</label>
                      <input
                        type="number"
                        value={formData.duration}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            duration: Number(e.target.value) || 60,
                          })
                        }
                        required
                        min="1"
                        placeholder="60"
                      />
                      <small style={{ color: "#888", fontSize: "12px" }}>
                        Will be converted to seconds ({(Number(formData.duration) || 60) * 60}s)
                      </small>
                    </div>
                    <div className="form-group">
                      <label>Status</label>
                      <select
                        value={formData.status}
                        onChange={(e) =>
                          setFormData({ ...formData, status: e.target.value })
                        }
                        required
                      >
                        <option value="draft">Draft</option>
                        <option value="published">Published (Visible)</option>
                        <option value="unpublished">
                          Unpublished (Unvisible)
                        </option>
                      </select>
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Start Time</label>
                      <input
                        type="datetime-local"
                        value={formData.startTime}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            startTime: e.target.value,
                          })
                        }
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>End Time</label>
                      <input
                        type="datetime-local"
                        value={formData.endTime}
                        onChange={(e) =>
                          setFormData({ ...formData, endTime: e.target.value })
                        }
                        required
                      />
                    </div>
                  </div>

                  <div className="form-actions">
                    <button
                      type="button"
                      className="button-secondary"
                      onClick={() => setCurrentStep(1)}
                    >
                      ← Back
                    </button>
                    <button
                      type="button"
                      className="button-secondary"
                      onClick={handleCancel}
                    >
                      Cancel
                    </button>
                    {editingOlympiad ? (
                      <>
                        <button
                          type="button"
                          className="button-secondary"
                          onClick={async () => {
                            // Save current changes before navigating
                            const formatDateTime = (dateTimeLocal) => {
                              if (!dateTimeLocal) return "";
                              return new Date(dateTimeLocal).toISOString();
                            };

                            try {
                              const olympiadData = {
                                title: formData.title,
                                description: formData.description,
                                type: formData.type,
                                subject: formData.subject,
                                startTime: formatDateTime(formData.startTime),
                                endTime: formatDateTime(formData.endTime),
                                duration: (Number(formData.duration) || 60) * 60,
                                status: formData.status,
                              };
                              await adminAPI.updateOlympiad(
                                editingOlympiad,
                                olympiadData
                              );
                              // Load questions for step 3
                              const questionsResponse =
                                await adminAPI.getQuestions(editingOlympiad);
                              setQuestions(questionsResponse.data || []);
                              setCreatedOlympiadId(editingOlympiad);
                              setCurrentStep(3);
                            } catch (error) {
                              setNotification({
                                message:
                                  error.response?.data?.message ||
                                  "Failed to save changes",
                                type: "error",
                              });
                            }
                          }}
                        >
                          Next: Questions →
                        </button>
                        <button type="submit" className="button-primary">
                          Update Olympiad
                        </button>
                      </>
                    ) : (
                      <>
                        <button type="submit" className="button-primary">
                          Create & Add Questions
                        </button>
                      </>
                    )}
                  </div>
                </form>
              </div>
            )}

            {/* Step 3: Add Questions */}
            {currentStep === 3 && (
              <QuestionFormStep
                olympiadId={createdOlympiadId}
                olympiadType={formData.type}
                questions={questions}
                onAddQuestion={handleAddQuestion}
                onUpdateQuestion={handleUpdateQuestion}
                onDeleteQuestion={handleDeleteQuestion}
                onFinish={handleFinish}
                onBack={() => setCurrentStep(2)}
              />
            )}
          </div>
        )}

        <div className="admin-olympiads">
          {getFilteredOlympiads.map((olympiad) => {
            // Get logo URL - handle both relative and absolute URLs
            // Check multiple possible field names for logo
            const logoField =
              olympiad.olympiadLogo ||
              olympiad.logo ||
              olympiad.photo ||
              olympiad.image;

            const getLogoUrl = (logo) => {
              if (!logo) return null;
              // If it's already a full URL (starts with http), return as is
              if (logo.startsWith("http://") || logo.startsWith("https://")) {
                return logo;
              }
              // If it starts with /api, it's already correct for proxy
              if (logo.startsWith("/api")) {
                return logo;
              }
              // Otherwise, prepend /api if in dev mode, or construct full URL
              const API_BASE_URL =
                import.meta.env.VITE_API_URL ||
                "https://global-olimpiad-serverf-bek.vercel.app";
              return logo.startsWith("/")
                ? `${API_BASE_URL}${logo}`
                : `${API_BASE_URL}/${logo}`;
            };

            const logoUrl = getLogoUrl(logoField);

            return (
              <div key={olympiad._id} className="admin-olympiad-card card">
                <div className="olympiad-card-header">
                  <div className="olympiad-logo-container">
                    {logoUrl ? (
                      <img
                        src={logoUrl}
                        alt={`${olympiad.title} logo`}
                        className="olympiad-logo"
                        onError={(e) => {
                          // Show placeholder if image fails to load
                          e.target.style.display = "none";
                          const container = e.target.parentElement;
                          if (
                            container &&
                            !container.querySelector(".logo-placeholder")
                          ) {
                            const placeholder = document.createElement("div");
                            placeholder.className = "logo-placeholder";
                            placeholder.textContent = "📋";
                            container.appendChild(placeholder);
                          }
                        }}
                      />
                    ) : (
                      <div className="logo-placeholder">📋</div>
                    )}
                  </div>
                  <div className="olympiad-info">
                    <div className="olympiad-title-row">
                      <h3>{olympiad.title}</h3>
                      {getStatusBadge(olympiad.status || "draft")}
                    </div>
                    <div className="olympiad-meta">
                      <span>{olympiad.subject}</span>
                      <span>•</span>
                      <span>{olympiad.type}</span>
                      <span>•</span>
                      <span>{formatDate(olympiad.startTime)}</span>
                    </div>
                  </div>
                </div>
                <div className="olympiad-actions">
                  <button
                    className="button-secondary"
                    onClick={() => handleToggleStatus(olympiad)}
                    title={
                      olympiad.status === "published"
                        ? "Make Unvisible"
                        : "Make Visible"
                    }
                  >
                    {olympiad.status === "published" ? "🔒 Hide" : "👁️ Show"}
                  </button>
                  <button
                    className="button-secondary"
                    onClick={() => handleEdit(olympiad)}
                  >
                    Edit
                  </button>
                  <button
                    className="button-secondary"
                    onClick={() => handleManageQuestions(olympiad)}
                  >
                    Questions
                  </button>
                  <button
                    className="button-secondary"
                    onClick={() => handleDuplicate(olympiad)}
                    title="Duplicate Olympiad"
                  >
                    Duplicate
                  </button>
                  <button
                    className="button-danger"
                    onClick={() => handleDelete(olympiad._id)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Question Manager Modal */}
      {showQuestionManager && selectedOlympiad && (
        <QuestionManager
          olympiad={selectedOlympiad}
          onClose={() => {
            setShowQuestionManager(false);
            setSelectedOlympiad(null);
            fetchOlympiads();
          }}
        />
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

// Question Manager Component
const QuestionManager = ({ olympiad, onClose }) => {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [notification, setNotification] = useState(null);
  const [editingQuestionId, setEditingQuestionId] = useState(null);
  const [questionForm, setQuestionForm] = useState({
    question: "",
    type: olympiad.type === "test" ? "multiple-choice" : "essay",
    options: ["", "", "", ""],
    correctAnswer: "",
    points: 10,
  });

  useEffect(() => {
    fetchQuestions();
  }, [olympiad._id]);

  const fetchQuestions = async () => {
    try {
      const response = await adminAPI.getQuestions(olympiad._id);
      setQuestions(response.data || []);
    } catch (error) {
      setNotification({ message: "Failed to load questions", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const resetQuestionForm = () => {
    setQuestionForm({
      question: "",
      type: olympiad.type === "test" ? "multiple-choice" : "essay",
      options: ["", "", "", ""],
      correctAnswer: "",
      points: 10,
    });
  };

  const handleAddQuestion = async (e) => {
    e.preventDefault();

    const isEditing = Boolean(editingQuestionId);
    const normalizedCorrectAnswer = questionForm.correctAnswer;

    try {
      if (olympiad.type === "test") {
        if (!questionForm.question || !questionForm.correctAnswer) {
          setNotification({
            message: "Please fill all required fields",
            type: "error",
          });
          return;
        }
        const validOptions = (Array.isArray(questionForm.options) ? questionForm.options : []).filter(
          (opt) => opt && String(opt).trim() !== ""
        );
        if (validOptions.length < 2) {
          setNotification({
            message: "Please provide at least 2 options",
            type: "error",
          });
          return;
        }

        const payload = {
          question: questionForm.question,
          type: "multiple-choice",
          options: validOptions,
          correctAnswer: normalizedCorrectAnswer,
          points: Number(questionForm.points) || 10,
        };

        if (isEditing) {
          await adminAPI.updateQuestion(editingQuestionId, payload);
        } else {
          await adminAPI.addQuestion({
            olympiadId: olympiad._id,
            ...payload,
            order: (Array.isArray(questions) ? questions.length : 0) + 1,
          });
        }
      } else {
        if (!questionForm.question) {
          setNotification({
            message: "Please enter a question",
            type: "error",
          });
          return;
        }

        const payload = {
          question: questionForm.question,
          type: "essay",
          points: Number(questionForm.points) || 10,
        };

        if (isEditing) {
          await adminAPI.updateQuestion(editingQuestionId, payload);
        } else {
          await adminAPI.addQuestion({
            olympiadId: olympiad._id,
            ...payload,
            order: (Array.isArray(questions) ? questions.length : 0) + 1,
          });
        }
      }

      setNotification({
        message: isEditing ? "Question updated successfully" : "Question added successfully",
        type: "success",
      });
      resetQuestionForm();
      setEditingQuestionId(null);
      setShowAddForm(false);
      fetchQuestions();
    } catch (error) {
      setNotification({
        message: error.response?.data?.message || "Failed to add question",
        type: "error",
      });
    }
  };

  const handleEditQuestion = (question) => {
    const normalizedOptions = Array.isArray(question?.options)
      ? question.options
      : [];
    const paddedOptions = [...normalizedOptions];
    while (paddedOptions.length < 4) {
      paddedOptions.push("");
    }

    setQuestionForm({
      question: question?.question || "",
      type: question?.type === "multiple-choice" ? "multiple-choice" : "essay",
      options: paddedOptions,
      correctAnswer: question?.correctAnswer || "",
      points: Number(question?.points) || 10,
    });
    setEditingQuestionId(question?._id || null);
    setShowAddForm(true);
  };

  const handleCancelEdit = () => {
    setEditingQuestionId(null);
    resetQuestionForm();
    setShowAddForm(false);
  };

  const handleDeleteQuestion = async (questionId) => {
    if (!window.confirm("Delete this question?")) return;
    try {
      await adminAPI.deleteQuestion(questionId);
      setNotification({ message: "Question deleted", type: "success" });
      fetchQuestions();
    } catch (error) {
      setNotification({
        message: error.response?.data?.message || "Failed to delete question",
        type: "error",
      });
    }
  };

  const handleOptionChange = (index, value) => {
    const newOptions = [...questionForm.options];
    newOptions[index] = value;
    setQuestionForm({ ...questionForm, options: newOptions });
  };

  if (loading) {
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
          <div className="loading-spinner"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content question-manager"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h2>Manage Questions - {olympiad.title}</h2>
          <button className="modal-close" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="modal-body">
          <div className="questions-header">
            <h3>Questions ({Array.isArray(questions) ? questions.length : 0})</h3>
            <button
              className="button-primary"
              onClick={() => {
                if (showAddForm) {
                  handleCancelEdit();
                } else {
                  setShowAddForm(true);
                }
              }}
            >
              {showAddForm ? "Cancel" : "+ Add Question"}
            </button>
          </div>

          {showAddForm && (
            <form onSubmit={handleAddQuestion} className="question-form card">
              <div className="form-group">
                <label>Question</label>
                <textarea
                  value={questionForm.question}
                  onChange={(e) =>
                    setQuestionForm({
                      ...questionForm,
                      question: e.target.value,
                    })
                  }
                  placeholder="Enter your question..."
                  rows="3"
                  required
                />
              </div>

              {olympiad.type === "test" && (
                <div className="form-group">
                  <label>Options</label>
                  {(questionForm.options || []).map((option, index) => (
                    <div key={index} className="option-input-row">
                      <span className="option-label">
                        {String.fromCharCode(65 + index)}.
                      </span>
                      <input
                        type="text"
                        value={option}
                        onChange={(e) =>
                          handleOptionChange(index, e.target.value)
                        }
                        placeholder={`Option ${String.fromCharCode(
                          65 + index
                        )}`}
                        className="option-input"
                      />
                      <input
                        type="radio"
                        name="correctAnswer"
                        value={option}
                        checked={questionForm.correctAnswer === option}
                        onChange={(e) =>
                          setQuestionForm({
                            ...questionForm,
                            correctAnswer: e.target.value,
                          })
                        }
                        disabled={!option.trim()}
                      />
                      <label className="radio-label">Correct</label>
                    </div>
                  ))}
                </div>
              )}

              <div className="form-row">
                <div className="form-group">
                  <label>Points</label>
                  <input
                    type="number"
                    value={questionForm.points}
                    onChange={(e) =>
                      setQuestionForm({
                        ...questionForm,
                        points: Number(e.target.value) || 10,
                      })
                    }
                    min="1"
                    required
                  />
                </div>
              </div>

              <button type="submit" className="button-primary">
                {editingQuestionId ? "Update Question" : "Add Question"}
              </button>
            </form>
          )}

          <div className="questions-list">
            {!Array.isArray(questions) || questions.length === 0 ? (
              <div className="empty-state">
                <p>No questions yet. Add your first question!</p>
              </div>
            ) : (
              (Array.isArray(questions) ? questions : []).map((q, index) => (
                <div key={q?._id || index} className="question-item card">
                  <div className="question-header">
                    <span className="question-number">Q{index + 1}</span>
                    <span className="question-points">{Number(q?.points) || 0} pts</span>
                  </div>
                  <p className="question-text">{q?.question || "No question text"}</p>
                  {q?.type === "multiple-choice" && Array.isArray(q?.options) && q.options.length > 0 && (
                    <div className="question-options">
                      {q.options.map((opt, optIndex) => (
                        <div
                          key={optIndex}
                          className={`option ${
                            opt === q.correctAnswer ? "correct" : ""
                          }`}
                        >
                          {String.fromCharCode(65 + optIndex)}. {opt}
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="form-actions" style={{ justifyContent: "flex-end" }}>
                    <button
                      type="button"
                      className="button-secondary"
                      onClick={() => handleEditQuestion(q)}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      className="button-danger"
                      onClick={() => handleDeleteQuestion(q?._id)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))
            )}
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
    </div>
  );
};

export default AdminPanel;
