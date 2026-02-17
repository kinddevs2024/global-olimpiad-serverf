import { createContext, useContext, useState, useEffect } from "react";
import { authAPI } from "../services/api";
import {
  getToken,
  setToken,
  removeToken,
  getUser,
  setUser,
  removeUser,
} from "../utils/helpers";

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUserState] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showCookieConsent, setShowCookieConsent] = useState(false);

  // Check cookie consent status from user object
  const checkCookieConsent = (userData) => {
    // If user.cookies is null, show modal
    return userData?.cookies !== null && userData?.cookies !== undefined;
  };

  useEffect(() => {
    const initAuth = async () => {
      const token = getToken();
      const savedUser = getUser();

      if (token && savedUser) {
        try {
          const response = await authAPI.getMe();
          const userData = response.data;

          // Ensure devices array exists
          if (!userData.devices) {
            userData.devices = [];
          }

          setUserState(userData);
          setUser(userData);
          setIsAuthenticated(true);

          // Check if user has given cookie consent (cookies field is null)
          if (!checkCookieConsent(userData)) {
            setShowCookieConsent(true);
          }
        } catch (error) {
          removeToken();
          removeUser();
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (email, password) => {
    try {
      const response = await authAPI.login({
        email,
        password,
      });
      const { token } = response.data;

      setToken(token);

      // Fetch updated user data with devices and cookies from /me endpoint
      try {
        const meResponse = await authAPI.getMe();
        const userData = meResponse.data;

        // Ensure devices array exists
        if (!userData.devices) {
          userData.devices = [];
        }

        setUser(userData);
        setUserState(userData);
        setIsAuthenticated(true);

        // Check if user has given cookie consent (cookies field is null)
        if (!checkCookieConsent(userData)) {
          setShowCookieConsent(true);
        }
      } catch (meError) {
        console.error("Error fetching user data after login:", meError);
        // Fallback to user data from login response if /me fails
        const { user } = response.data;
        if (!user.devices) {
          user.devices = [];
        }
        setUser(user);
        setUserState(user);
        setIsAuthenticated(true);

        if (!checkCookieConsent(user)) {
          setShowCookieConsent(true);
        }
      }

      return { success: true };
    } catch (error) {
      console.error("Login error:", error);
      const passwordResetRequired =
        error.response?.data?.passwordResetRequired === true;
      const emailVerificationRequired =
        error.response?.data?.emailVerificationRequired === true;
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        (error.code === "ERR_NETWORK"
          ? "Connection failed. Please try again."
          : "Login failed");
      return {
        success: false,
        error: errorMessage,
        passwordResetRequired,
        emailVerificationRequired,
      };
    }
  };

  const register = async (userData) => {
    try {
      const response = await authAPI.register({
        ...userData,
      });
      const { token, emailVerificationRequired, message } = response.data || {};

      if (emailVerificationRequired) {
        return { success: true, emailVerificationRequired, message };
      }

      if (!token) {
        return {
          success: false,
          error: message || "Registration failed",
        };
      }

      setToken(token);

      // Fetch updated user data with devices and cookies from /me endpoint
      try {
        const meResponse = await authAPI.getMe();
        const userDataFromMe = meResponse.data;

        // Ensure devices array exists
        if (!userDataFromMe.devices) {
          userDataFromMe.devices = [];
        }

        setUser(userDataFromMe);
        setUserState(userDataFromMe);
        setIsAuthenticated(true);

        // Check if user has given cookie consent (cookies field is null)
        if (!checkCookieConsent(userDataFromMe)) {
          setShowCookieConsent(true);
        }
      } catch (meError) {
        console.error("Error fetching user data after registration:", meError);
        // Fallback to user data from register response if /me fails
        const { user } = response.data;
        if (!user.devices) {
          user.devices = [];
        }
        setUser(user);
        setUserState(user);
        setIsAuthenticated(true);

        if (!checkCookieConsent(user)) {
          setShowCookieConsent(true);
        }
      }

      return { success: true };
    } catch (error) {
      console.error("Registration error:", error);
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        (error.code === "ERR_NETWORK"
          ? "Connection failed. Please try again."
          : "Registration failed");
      return {
        success: false,
        error: errorMessage,
      };
    }
  };

  const loginWithGoogle = async (googleToken) => {
    try {
      const response = await authAPI.loginWithGoogle({
        token: googleToken,
      });
      const { token } = response.data;

      setToken(token);

      // Fetch updated user data with devices and cookies from /me endpoint
      try {
        const meResponse = await authAPI.getMe();
        const userData = meResponse.data;

        // Ensure devices array exists
        if (!userData.devices) {
          userData.devices = [];
        }

        setUser(userData);
        setUserState(userData);
        setIsAuthenticated(true);

        // Check if user has given cookie consent (cookies field is null)
        if (!checkCookieConsent(userData)) {
          setShowCookieConsent(true);
        }

        return { success: true, user: userData };
      } catch (meError) {
        console.error("Error fetching user data after Google login:", meError);
        // Fallback to user data from Google login response if /me fails
        const { user } = response.data;
        if (!user.devices) {
          user.devices = [];
        }
        setUser(user);
        setUserState(user);
        setIsAuthenticated(true);

        if (!checkCookieConsent(user)) {
          setShowCookieConsent(true);
        }

        return { success: true, user };
      }
    } catch (error) {
      console.error("Google login error:", error);
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        (error.code === "ERR_NETWORK"
          ? "Connection failed. Please try again."
          : "Google login failed");
      return {
        success: false,
        error: errorMessage,
      };
    }
  };

  const logout = () => {
    removeToken();
    removeUser();
    setUserState(null);
    setIsAuthenticated(false);
  };

  const updateUser = (userData) => {
    setUserState(userData);
    setUser(userData);
  };

  const completeAuth = (token, userData) => {
    if (token) {
      setToken(token);
    }

    if (userData) {
      const normalizedUser = { ...userData };
      if (!normalizedUser.devices) {
        normalizedUser.devices = [];
      }
      setUserState(normalizedUser);
      setUser(normalizedUser);
      setIsAuthenticated(true);

      if (!checkCookieConsent(normalizedUser)) {
        setShowCookieConsent(true);
      }
    }
  };

  // Balance/coins: derive from user, refresh from API
  const balance = typeof user?.coins === "number" ? user.coins : 0;

  const refreshBalance = async () => {
    if (!isAuthenticated) return;
    try {
      const res = await authAPI.getBalance();
      if (res.data?.success && typeof res.data.coins === "number") {
        setUserState((prev) => {
          const updated = prev ? { ...prev, coins: res.data.coins } : null;
          if (updated) setUser(updated);
          return updated;
        });
        return res.data.coins;
      }
    } catch (err) {
      console.warn("Refresh balance failed:", err);
    }
    return null;
  };

  const handleCookieConsent = async (consent) => {
    try {
      // Send consent to backend
      await authAPI.updateCookieConsent({
        consent,
      });

      // Fetch updated user data with devices and cookies from /me endpoint
      try {
        const meResponse = await authAPI.getMe();
        const userData = meResponse.data;

        // Ensure devices array exists
        if (!userData.devices) {
          userData.devices = [];
        }

        setUserState(userData);
        setUser(userData);
      } catch (meError) {
        console.error(
          "Error fetching user data after cookie consent:",
          meError
        );
        // Fallback: update user object with new cookies value
        const updatedUser = { ...user, cookies: consent };
        setUserState(updatedUser);
        setUser(updatedUser);
      }

      // Hide the modal
      setShowCookieConsent(false);
    } catch (error) {
      console.error("Error updating cookie consent:", error);
      // Still update user object and hide modal even if backend call fails
      const updatedUser = { ...user, cookies: consent };
      setUserState(updatedUser);
      setUser(updatedUser);
      setShowCookieConsent(false);
    }
  };

  const value = {
    user,
    loading,
    isAuthenticated,
    login,
    register,
    loginWithGoogle,
    logout,
    setUser: updateUser,
    completeAuth,
    showCookieConsent,
    handleCookieConsent,
    balance,
    refreshBalance,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
