import { API_BASE_URL } from "./constants";

// Utility to test API connection
export const testAPIConnection = async () => {
  try {
    // Use API_BASE_URL from constants for consistency
    const apiUrl = `${API_BASE_URL}/health`;

    const response = await fetch(apiUrl);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      message: "Connection failed",
    };
  }
};
