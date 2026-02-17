// Use direct server API by default (single-server deployment)
export const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  "https://global-olimpiad-serverf-bek.vercel.app";

const resolveSocketUrl = () => {
  const envSocketUrl = import.meta.env.VITE_SOCKET_URL;
  if (envSocketUrl) return envSocketUrl;
  if (import.meta.env.DEV) return "http://localhost:3000";

  if (typeof API_BASE_URL === "string" && API_BASE_URL.startsWith("http")) {
    try {
      return new URL(API_BASE_URL).origin;
    } catch {
      // Ignore invalid API base URL and fall back to current origin.
    }
  }

  const envApiUrl = import.meta.env.VITE_API_URL;
  if (envApiUrl) {
    try {
      return new URL(envApiUrl).origin;
    } catch {
      // Ignore invalid URL and fall back to current origin.
    }
  }

  if (typeof window !== "undefined" && window.location?.origin) {
    return window.location.origin;
  }

  return "";
};

export const SOCKET_URL = resolveSocketUrl();

export const USER_ROLES = {
  STUDENT: "student",
  ADMIN: "admin",
  OWNER: "owner",
  RESOLTER: "resolter", // Can edit and set results of essays and view all results
  SCHOOL_ADMIN: "school_admin", // School administrator
  SCHOOL_TEACHER: "school_teacher", // School teacher - can view results and real-time captures from their school
  CHECKER: "checker", // Can verify and reject student portfolios
  UNIVERSITY: "university", // University dashboard access for viewing student portfolios
};

export const OLYMPIAD_TYPES = {
  TEST: "test",
  ESSAY: "essay",
  MIXED: "mixed", // Both test and essay questions
};

export const QUESTION_TYPES = {
  MULTIPLE_CHOICE: "multiple-choice",
  ESSAY: "essay",
};

export const SUBJECTS = {
  MATH: "math",
  ENGLISH: "english",
  SCIENCE: "science",
  PHYSICS: "physics",
  CHEMISTRY: "chemistry",
};

export const OLYMPIAD_STATUS = {
  DRAFT: "draft",
  PUBLISHED: "published",
  UNPUBLISHED: "unpublished",
  ACTIVE: "active",
  COMPLETED: "completed",
};

// Proctoring capture intervals
export const CAMERA_CAPTURE_INTERVAL = 1000; // 1 second - capture combined frame
export const BATCH_UPLOAD_INTERVAL = 10000; // 10 seconds - upload accumulated images

// Video output resolution (720p)
export const VIDEO_WIDTH = 1280;
export const VIDEO_HEIGHT = 720;

export const TIMER_WARNING_THRESHOLD = 300; // 5 minutes in seconds
export const TIMER_DANGER_THRESHOLD = 60; // 1 minute in seconds

// Google OAuth Configuration
export const GOOGLE_CLIENT_ID =
  import.meta.env.VITE_GOOGLE_CLIENT_ID ||
  "780692716304-p2k6rmk2gtlrhrrf1ltncl986b1hqgrf.apps.googleusercontent.com";
