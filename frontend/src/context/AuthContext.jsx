import { createContext, useContext, useState, useEffect } from "react";
import { authAPI } from "../api/auth";

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in on app start
    const token = localStorage.getItem("token");
    const userData = localStorage.getItem("user");

    if (token && userData) {
      try {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
      } catch (error) {
        console.error("Error parsing user data:", error);
        localStorage.removeItem("token");
        localStorage.removeItem("user");
      }
    }
    setLoading(false);
  }, []);

  // Helper functions for user roles and status
  const isAdmin = () => user?.role === "admin";
  const isHost = () => user?.role === "host" || user?.isHost;
  const isCustomer = () => user?.role === "customer" || (!user?.role && user);
  const isVerified = () => user?.verification?.status === "verified";
  const isActive = () => user?.status === "active";

  const login = async (credentials) => {
    try {
      console.log("AuthContext: Attempting login with:", {
        email: credentials.email,
      });
      const response = await authAPI.login(credentials);
      console.log("AuthContext: Login response:", response);

      if (!response) {
        console.error("AuthContext: No response from server");
        return {
          success: false,
          error: "No response from server",
        };
      }

      // The API returns token and user at the root level, not in a data object
      const { token, user: userData } = response;

      if (!token || !userData) {
        console.error("AuthContext: Missing authentication data", {
          token: !!token,
          userData: !!userData,
        });
        return {
          success: false,
          error: "Missing authentication data",
        };
      }

      console.log("AuthContext: Storing token and user data");
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(userData));
      setUser(userData);

      console.log("AuthContext: Login successful");
      return { success: true, data: response };
    } catch (error) {
      console.error("AuthContext: Login error:", error);
      console.error("AuthContext: Full error response:", error.response?.data);
      return {
        success: false,
        error: error.response?.data?.message || error.message || "Login failed",
        details: error.response?.data?.details || null,
      };
    }
  };

  const register = async (userData) => {
    try {
      const response = await authAPI.register(userData);
      // The API returns token and user at the root level, not in a data object
      const { token, user: newUser } = response;

      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(newUser));
      setUser(newUser);

      return { success: true, data: response };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || "Registration failed",
      };
    }
  };

  const logout = () => {
    authAPI.logout();
    setUser(null);
  };

  const updateProfile = async (profileData) => {
    try {
      const response = await authAPI.updateProfile(profileData);

      if (!response) {
        return {
          success: false,
          error: "No response from server",
        };
      }

      // Update local user data
      const updatedUser = { ...user, ...response.user };
      localStorage.setItem("user", JSON.stringify(updatedUser));
      setUser(updatedUser);

      return { success: true, data: response };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || "Profile update failed",
      };
    }
  };

  const changePassword = async (passwordData) => {
    try {
      const response = await authAPI.changePassword(passwordData);
      return { success: true, data: response };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || "Password change failed",
      };
    }
  };

  // Refresh user profile from server
  const refreshProfile = async () => {
    try {
      const response = await authAPI.getProfile();
      if (response && response.user) {
        localStorage.setItem("user", JSON.stringify(response.user));
        setUser(response.user);
        return { success: true, data: response.user };
      }
      return { success: false, error: "Failed to refresh profile" };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || "Failed to refresh profile",
      };
    }
  };

  // Host-specific functions
  const becomeHost = async (hostData) => {
    try {
      const response = await authAPI.updateProfile({
        ...hostData,
        role: "host",
        isHost: true,
      });

      if (response && response.user) {
        localStorage.setItem("user", JSON.stringify(response.user));
        setUser(response.user);
        return { success: true, data: response };
      }
      return { success: false, error: "Failed to become host" };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || "Failed to become host",
      };
    }
  };

  const requestVerification = async (verificationData) => {
    try {
      const response = await authAPI.requestVerification(verificationData);

      // Refresh user profile to get updated verification status
      await refreshProfile();

      return { success: true, data: response };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || "Verification request failed",
      };
    }
  };

  // Get wallet balance for hosts
  const getWalletBalance = () => {
    if (!user || !isHost()) return 0;
    return user.hostProfile?.walletBalance || 0;
  };

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    updateProfile,
    changePassword,
    refreshProfile,
    becomeHost,
    requestVerification,
    getWalletBalance,
    isAdmin,
    isHost,
    isCustomer,
    isVerified,
    isActive,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
