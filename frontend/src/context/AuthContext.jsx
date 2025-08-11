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
        setUser(JSON.parse(userData));
      } catch (error) {
        console.error("Error parsing user data:", error);
        localStorage.removeItem("token");
        localStorage.removeItem("user");
      }
    }
    setLoading(false);
  }, []);

  const login = async (credentials) => {
    try {
      const response = await authAPI.login(credentials);

      if (!response) {
        return {
          success: false,
          error: "No response from server",
        };
      }

      // The API returns token and user at the root level, not in a data object
      const { token, user: userData } = response;

      if (!token || !userData) {
        return {
          success: false,
          error: "Missing authentication data",
        };
      }

      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(userData));
      setUser(userData);

      return { success: true, data: response };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || error.message || "Login failed",
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
          error: "No response from server"
        };
      }

      // Update user data in context and localStorage
      const updatedUser = { ...user, ...profileData };
      setUser(updatedUser);
      localStorage.setItem("user", JSON.stringify(updatedUser));

      return { success: true, data: response };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || error.message || "Update failed",
      };
    }
  };

  const changePassword = async (passwordData) => {
    try {
      const response = await authAPI.changePassword(passwordData);
      
      if (!response) {
        return {
          success: false,
          error: "No response from server"
        };
      }

      return { success: true, data: response };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || error.message || "Password change failed",
      };
    }
  };

  const isAdmin = () => {
    return user?.role === "admin";
  };

  const value = {
    user,
    login,
    register,
    logout,
    updateProfile,
    changePassword,
    isAdmin,
    loading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
