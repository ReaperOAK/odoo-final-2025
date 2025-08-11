import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import {
  UserIcon,
  EnvelopeIcon,
  LockClosedIcon,
  CheckIcon,
  EyeIcon,
  EyeSlashIcon,
  PencilIcon,
  KeyIcon,
  ShieldCheckIcon,
  CogIcon,
} from "@heroicons/react/24/outline";

export default function Profile() {
  const { user, updateProfile, changePassword } = useAuth();
  const [activeTab, setActiveTab] = useState("profile");
  
  // Profile form state
  const [profileData, setProfileData] = useState({
    name: "",
    email: "",
  });
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState("");
  const [profileError, setProfileError] = useState("");

  // Password form state
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  // Initialize profile data when user loads
  useEffect(() => {
    if (user) {
      setProfileData({
        name: user.name || "",
        email: user.email || "",
      });
    }
  }, [user]);

  const handleProfileChange = (e) => {
    setProfileData({
      ...profileData,
      [e.target.name]: e.target.value,
    });
  };

  const handlePasswordChange = (e) => {
    setPasswordData({
      ...passwordData,
      [e.target.name]: e.target.value,
    });
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setProfileLoading(true);
    setProfileError("");
    setProfileSuccess("");

    const result = await updateProfile(profileData);

    if (result.success) {
      setProfileSuccess("Profile updated successfully!");
      setTimeout(() => setProfileSuccess(""), 3000);
    } else {
      setProfileError(result.error);
    }

    setProfileLoading(false);
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPasswordLoading(true);
    setPasswordError("");
    setPasswordSuccess("");

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordError("New passwords do not match");
      setPasswordLoading(false);
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setPasswordError("New password must be at least 6 characters long");
      setPasswordLoading(false);
      return;
    }

    const result = await changePassword({
      currentPassword: passwordData.currentPassword,
      newPassword: passwordData.newPassword,
    });

    if (result.success) {
      setPasswordSuccess("Password changed successfully!");
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      setTimeout(() => setPasswordSuccess(""), 3000);
    } else {
      setPasswordError(result.error);
    }

    setPasswordLoading(false);
  };

  const togglePasswordVisibility = (field) => {
    setShowPasswords({
      ...showPasswords,
      [field]: !showPasswords[field],
    });
  };

  const passwordRequirements = [
    { label: "At least 6 characters", met: passwordData.newPassword.length >= 6 },
    {
      label: "Passwords match",
      met:
        passwordData.newPassword === passwordData.confirmPassword &&
        passwordData.confirmPassword !== "",
    },
  ];

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
        <div className="text-center bg-white rounded-2xl shadow-xl p-8 max-w-md w-full">
          <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <LockClosedIcon className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Authentication Required
          </h2>
          <p className="text-gray-600 mb-6">
            Please log in to access your profile and account settings
          </p>
          <button
            onClick={() => window.location.href = '/login'}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-6 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-200 transform hover:scale-105"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8 text-center lg:text-left">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h1 className="text-4xl lg:text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
                Account Settings
              </h1>
              <p className="text-gray-600 text-lg">
                Manage your account information and security preferences
              </p>
            </div>
            <div className="mt-4 lg:mt-0">
              <div className="inline-flex items-center px-4 py-2 bg-white rounded-full shadow-sm border border-gray-200">
                <ShieldCheckIcon className="w-5 h-5 text-green-500 mr-2" />
                <span className="text-sm font-medium text-gray-700">Secure Account</span>
              </div>
            </div>
          </div>
        </div>

        {/* User Info Card */}
        <div className="bg-white rounded-2xl shadow-xl p-6 lg:p-8 mb-8 border border-gray-100">
          <div className="flex flex-col sm:flex-row items-center sm:items-start space-y-4 sm:space-y-0 sm:space-x-6">
            <div className="relative">
              <div className="w-20 h-20 lg:w-24 lg:h-24 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                <UserIcon className="w-10 h-10 lg:w-12 lg:h-12 text-white" />
              </div>
              <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center border-4 border-white">
                <CheckIcon className="w-4 h-4 text-white" />
              </div>
            </div>
            <div className="flex-1 text-center sm:text-left">
              <h2 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-1">{user.name}</h2>
              <p className="text-gray-600 text-lg mb-3">{user.email}</p>
              <div className="flex flex-wrap justify-center sm:justify-start gap-2">
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                  user.role === 'admin' 
                    ? 'bg-gradient-to-r from-purple-100 to-purple-200 text-purple-800 border border-purple-300' 
                    : 'bg-gradient-to-r from-blue-100 to-blue-200 text-blue-800 border border-blue-300'
                }`}>
                  <CogIcon className="w-4 h-4 mr-1" />
                  {user.role === 'admin' ? 'Administrator' : 'Customer'}
                </span>
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gradient-to-r from-green-100 to-green-200 text-green-800 border border-green-300">
                  <CheckIcon className="w-4 h-4 mr-1" />
                  Verified Account
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs Container */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          {/* Tabs Navigation */}
          <div className="border-b border-gray-200 bg-gray-50">
            <nav className="flex flex-col sm:flex-row">
              <button
                onClick={() => setActiveTab("profile")}
                className={`flex-1 py-4 px-6 text-center sm:text-left font-semibold text-sm transition-all duration-200 ${
                  activeTab === "profile"
                    ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg"
                    : "text-gray-600 hover:text-gray-900 hover:bg-white"
                }`}
              >
                <PencilIcon className="w-5 h-5 inline-block mr-2" />
                Profile Information
              </button>
              <button
                onClick={() => setActiveTab("password")}
                className={`flex-1 py-4 px-6 text-center sm:text-left font-semibold text-sm transition-all duration-200 ${
                  activeTab === "password"
                    ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg"
                    : "text-gray-600 hover:text-gray-900 hover:bg-white"
                }`}
              >
                <KeyIcon className="w-5 h-5 inline-block mr-2" />
                Security Settings
              </button>
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6 lg:p-8">
            {activeTab === "profile" && (
              <div className="max-w-2xl mx-auto">
                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">
                    Update Profile Information
                  </h3>
                  <p className="text-gray-600">
                    Keep your account information up to date for the best experience
                  </p>
                </div>
                
                {profileSuccess && (
                  <div className="mb-6 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-4 transform transition-all duration-300">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                          <CheckIcon className="w-5 h-5 text-white" />
                        </div>
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-green-800">{profileSuccess}</p>
                      </div>
                    </div>
                  </div>
                )}

                {profileError && (
                  <div className="mb-6 bg-gradient-to-r from-red-50 to-pink-50 border border-red-200 rounded-xl p-4 transform transition-all duration-300">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center">
                          <span className="text-white text-sm font-bold">!</span>
                        </div>
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-red-800">{profileError}</p>
                      </div>
                    </div>
                  </div>
                )}

                <form onSubmit={handleProfileSubmit} className="space-y-6">
                  <div className="space-y-6">
                    <div>
                      <label
                        htmlFor="name"
                        className="block text-sm font-semibold text-gray-700 mb-2"
                      >
                        Full Name
                      </label>
                      <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                          <UserIcon className="h-5 w-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                        </div>
                        <input
                          id="name"
                          name="name"
                          type="text"
                          required
                          className="block w-full pl-12 pr-4 py-4 border border-gray-300 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white shadow-sm"
                          placeholder="Enter your full name"
                          value={profileData.name}
                          onChange={handleProfileChange}
                        />
                      </div>
                    </div>

                    <div>
                      <label
                        htmlFor="email"
                        className="block text-sm font-semibold text-gray-700 mb-2"
                      >
                        Email Address
                      </label>
                      <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                          <EnvelopeIcon className="h-5 w-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                        </div>
                        <input
                          id="email"
                          name="email"
                          type="email"
                          required
                          className="block w-full pl-12 pr-4 py-4 border border-gray-300 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white shadow-sm"
                          placeholder="Enter your email address"
                          value={profileData.email}
                          onChange={handleProfileChange}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="pt-4">
                    <button
                      type="submit"
                      disabled={profileLoading}
                      className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 px-6 rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105 disabled:transform-none shadow-lg"
                    >
                      {profileLoading ? (
                        <div className="flex items-center justify-center">
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                          Updating Profile...
                        </div>
                      ) : (
                        <div className="flex items-center justify-center">
                          <CheckIcon className="w-5 h-5 mr-2" />
                          Update Profile
                        </div>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {activeTab === "password" && (
              <div className="max-w-2xl mx-auto">
                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">
                    Change Password
                  </h3>
                  <p className="text-gray-600">
                    Ensure your account is using a strong, unique password
                  </p>
                </div>
                
                {passwordSuccess && (
                  <div className="mb-6 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-4 transform transition-all duration-300">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                          <CheckIcon className="w-5 h-5 text-white" />
                        </div>
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-green-800">{passwordSuccess}</p>
                      </div>
                    </div>
                  </div>
                )}

                {passwordError && (
                  <div className="mb-6 bg-gradient-to-r from-red-50 to-pink-50 border border-red-200 rounded-xl p-4 transform transition-all duration-300">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center">
                          <span className="text-white text-sm font-bold">!</span>
                        </div>
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-red-800">{passwordError}</p>
                      </div>
                    </div>
                  </div>
                )}

                <form onSubmit={handlePasswordSubmit} className="space-y-6">
                  <div className="space-y-6">
                    <div>
                      <label
                        htmlFor="currentPassword"
                        className="block text-sm font-semibold text-gray-700 mb-2"
                      >
                        Current Password
                      </label>
                      <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                          <LockClosedIcon className="h-5 w-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                        </div>
                        <input
                          id="currentPassword"
                          name="currentPassword"
                          type={showPasswords.current ? "text" : "password"}
                          required
                          className="block w-full pl-12 pr-12 py-4 border border-gray-300 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white shadow-sm"
                          placeholder="Enter your current password"
                          value={passwordData.currentPassword}
                          onChange={handlePasswordChange}
                        />
                        <div className="absolute inset-y-0 right-0 pr-4 flex items-center">
                          <button
                            type="button"
                            className="text-gray-400 hover:text-gray-600 transition-colors"
                            onClick={() => togglePasswordVisibility("current")}
                          >
                            {showPasswords.current ? (
                              <EyeSlashIcon className="h-5 w-5" />
                            ) : (
                              <EyeIcon className="h-5 w-5" />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>

                    <div>
                      <label
                        htmlFor="newPassword"
                        className="block text-sm font-semibold text-gray-700 mb-2"
                      >
                        New Password
                      </label>
                      <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                          <LockClosedIcon className="h-5 w-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                        </div>
                        <input
                          id="newPassword"
                          name="newPassword"
                          type={showPasswords.new ? "text" : "password"}
                          required
                          className="block w-full pl-12 pr-12 py-4 border border-gray-300 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white shadow-sm"
                          placeholder="Enter your new password"
                          value={passwordData.newPassword}
                          onChange={handlePasswordChange}
                        />
                        <div className="absolute inset-y-0 right-0 pr-4 flex items-center">
                          <button
                            type="button"
                            className="text-gray-400 hover:text-gray-600 transition-colors"
                            onClick={() => togglePasswordVisibility("new")}
                          >
                            {showPasswords.new ? (
                              <EyeSlashIcon className="h-5 w-5" />
                            ) : (
                              <EyeIcon className="h-5 w-5" />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>

                    <div>
                      <label
                        htmlFor="confirmPassword"
                        className="block text-sm font-semibold text-gray-700 mb-2"
                      >
                        Confirm New Password
                      </label>
                      <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                          <LockClosedIcon className="h-5 w-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                        </div>
                        <input
                          id="confirmPassword"
                          name="confirmPassword"
                          type={showPasswords.confirm ? "text" : "password"}
                          required
                          className="block w-full pl-12 pr-12 py-4 border border-gray-300 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white shadow-sm"
                          placeholder="Confirm your new password"
                          value={passwordData.confirmPassword}
                          onChange={handlePasswordChange}
                        />
                        <div className="absolute inset-y-0 right-0 pr-4 flex items-center">
                          <button
                            type="button"
                            className="text-gray-400 hover:text-gray-600 transition-colors"
                            onClick={() => togglePasswordVisibility("confirm")}
                          >
                            {showPasswords.confirm ? (
                              <EyeSlashIcon className="h-5 w-5" />
                            ) : (
                              <EyeIcon className="h-5 w-5" />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Password Requirements */}
                  {(passwordData.newPassword || passwordData.confirmPassword) && (
                    <div className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl p-6 border border-gray-200">
                      <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                        <ShieldCheckIcon className="w-5 h-5 mr-2 text-blue-500" />
                        Password Requirements
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {passwordRequirements.map((req, index) => (
                          <div key={index} className="flex items-center p-3 bg-white rounded-lg shadow-sm border border-gray-100">
                            <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center mr-3 ${
                              req.met ? "bg-green-500" : "bg-gray-300"
                            }`}>
                              <CheckIcon className="w-4 h-4 text-white" />
                            </div>
                            <span className={`text-sm font-medium ${
                              req.met ? "text-green-700" : "text-gray-500"
                            }`}>
                              {req.label}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="pt-4">
                    <button
                      type="submit"
                      disabled={
                        passwordLoading || !passwordRequirements.every((req) => req.met)
                      }
                      className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 px-6 rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105 disabled:transform-none shadow-lg"
                    >
                      {passwordLoading ? (
                        <div className="flex items-center justify-center">
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                          Updating Password...
                        </div>
                      ) : (
                        <div className="flex items-center justify-center">
                          <KeyIcon className="w-5 h-5 mr-2" />
                          Change Password
                        </div>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>

        {/* Security Notice */}
        <div className="mt-8 bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-6 border border-blue-200">
          <div className="flex items-start space-x-4">
            <div className="flex-shrink-0">
              <ShieldCheckIcon className="w-8 h-8 text-blue-500" />
            </div>
            <div>
              <h4 className="text-lg font-semibold text-gray-900 mb-2">
                Your Account Security
              </h4>
              <p className="text-gray-600 text-sm leading-relaxed">
                We take your security seriously. Your password is encrypted and we never store it in plain text. 
                If you notice any suspicious activity on your account, please change your password immediately 
                and contact our support team.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
