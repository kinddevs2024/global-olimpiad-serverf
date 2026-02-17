import { API_BASE_URL } from "./constants";

// Helper to get full image URL (handle relative paths from API)
export const getImageUrl = (url) => {
  if (!url) return '';
  // If it's already a full URL, return as-is
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) {
    return url;
  }
  if (url.startsWith('/api/')) {
    return url;
  }

  const apiBase = typeof API_BASE_URL === "string" && API_BASE_URL.trim()
    ? API_BASE_URL.replace(/\/$/, "")
    : "https://global-olimpiad-serverf-bek.vercel.app";

  // If it starts with /, construct full URL using the API base domain
  if (url.startsWith('/')) {
    return `${apiBase}${url}`;
  }
  // Otherwise return as-is (might be a relative path)
  return url;
};

export const formatTime = (seconds) => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    return `${hours.toString().padStart(2, "0")}:${minutes
      .toString()
      .padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  }
  return `${minutes.toString().padStart(2, "0")}:${secs
    .toString()
    .padStart(2, "0")}`;
};

export const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export const getTimeRemaining = (endTime) => {
  const now = new Date().getTime();
  const end = new Date(endTime).getTime();
  const difference = Math.floor((end - now) / 1000);
  return Math.max(0, difference);
};

// Calculate remaining time based on duration and start time
export const getTimeRemainingFromDuration = (duration, startTime) => {
  if (!startTime || !duration) return 0;

  const now = new Date().getTime();
  const start = new Date(startTime).getTime();
  const elapsed = Math.floor((now - start) / 1000); // elapsed time in seconds
  const remaining = duration - elapsed; // duration is in seconds

  return Math.max(0, remaining);
};

export const isOlympiadActive = (startTime, endTime) => {
  const now = new Date().getTime();
  const start = new Date(startTime).getTime();
  const end = new Date(endTime).getTime();
  return now >= start && now <= end;
};

export const isOlympiadUpcoming = (startTime) => {
  const now = new Date().getTime();
  const start = new Date(startTime).getTime();
  return now < start;
};

export const isOlympiadEnded = (endTime) => {
  const now = new Date().getTime();
  const end = new Date(endTime).getTime();
  return now > end;
};

export const getToken = () => {
  return localStorage.getItem("token");
};

export const setToken = (token) => {
  localStorage.setItem("token", token);
};

export const removeToken = () => {
  localStorage.removeItem("token");
};

export const getUserId = () => {
  const user = localStorage.getItem("user");
  return user ? JSON.parse(user)._id : null;
};

export const setUser = (user) => {
  localStorage.setItem("user", JSON.stringify(user));
};

export const getUser = () => {
  const user = localStorage.getItem("user");
  return user ? JSON.parse(user) : null;
};

export const removeUser = () => {
  localStorage.removeItem("user");
};

// Sanitize string for use in filenames (remove special characters, replace spaces with dashes)
export const sanitizeForFilename = (str) => {
  if (!str) return "";
  return str
    .toString()
    .trim()
    .replace(/[^a-z0-9\s-]/gi, "") // Remove special characters
    .replace(/\s+/g, "-") // Replace spaces with dashes
    .replace(/-+/g, "-") // Replace multiple dashes with single dash
    .toLowerCase()
    .substring(0, 50); // Limit length
};

// Format date and time for filename (YYYY-MM-DD_HH-MM-SS)
export const formatDateTimeForFilename = (date = new Date()) => {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const hours = String(d.getHours()).padStart(2, "0");
  const minutes = String(d.getMinutes()).padStart(2, "0");
  const seconds = String(d.getSeconds()).padStart(2, "0");
  return `${year}-${month}-${day}_${hours}-${minutes}-${seconds}`;
};

// Format date only for filename (YYYY-MM-DD)
export const formatDateForFilename = (date = new Date()) => {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

// Generate video filename: {userId}_{date}_{olympiad-name}_{type}.webm
export const generateVideoFilename = (
  userId,
  olympiadTitle,
  type,
  date = new Date()
) => {
  const dateOnly = formatDateForFilename(date);
  const sanitizedTitle = sanitizeForFilename(olympiadTitle);
  const sanitizedUserId = String(userId).replace(/[^a-z0-9-_]/gi, ""); // Sanitize userId
  return `${sanitizedUserId}_${dateOnly}_${sanitizedTitle}_${type}.webm`;
};

// Generate exit screenshot filename: {olympiad-name}_{date}_{time}_exit-{type}.jpg
export const generateExitScreenshotFilename = (
  olympiadTitle,
  type,
  date = new Date()
) => {
  const sanitizedTitle = sanitizeForFilename(olympiadTitle);
  const dateTime = formatDateTimeForFilename(date);
  return `${sanitizedTitle}_${dateTime}_exit-${type}.jpg`;
};

// Check if user profile is complete (for students)
export const isProfileComplete = (user) => {
  if (!user) return false;

  // Required fields for students
  const requiredFields = [
    "name",
    "firstName",
    "secondName",
    "email",
    "tel",
    "address",
    "schoolName",
    "schoolId",
    "dateBorn",
    "gender",
  ];

  // Check if all required fields are filled
  const missingFields = requiredFields.filter((field) => {
    const value = user[field];
    return !value || (typeof value === "string" && value.trim() === "");
  });

  return missingFields.length === 0;
};

// Get missing profile fields
export const getMissingProfileFields = (user) => {
  if (!user) return [];

  const requiredFields = [
    { key: "name", label: "Full Name" },
    { key: "firstName", label: "First Name" },
    { key: "secondName", label: "Last Name" },
    { key: "email", label: "Email" },
    { key: "tel", label: "Phone Number" },
    { key: "address", label: "Address" },
    { key: "schoolName", label: "School Name" },
    { key: "schoolId", label: "School ID" },
    { key: "dateBorn", label: "Date of Birth" },
    { key: "gender", label: "Gender" },
  ];

  return requiredFields
    .filter((field) => {
      const value = user[field.key];
      return !value || (typeof value === "string" && value.trim() === "");
    })
    .map((field) => field.label);
};
