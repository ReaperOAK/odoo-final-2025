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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Please log in to view your profile
          </h2>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Account Settings</h1>
          <p className="text-gray-600 mt-2">
            Manage your account information and security settings
          </p>
        </div>

        {/* User Info Card */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-brand rounded-full flex items-center justify-center">
              <UserIcon className="w-8 h-8 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">{user.name}</h2>
              <p className="text-gray-600">{user.email}</p>
              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium mt-1 ${
                user.role === 'admin' 
                  ? 'bg-purple-100 text-purple-800' 
                  : 'bg-blue-100 text-blue-800'
              }`}>
                {user.role === 'admin' ? 'Administrator' : 'Customer'}
              </span>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-sm">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              <button
                onClick={() => setActiveTab("profile")}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === "profile"
                    ? "border-brand text-brand"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                <PencilIcon className="w-4 h-4 inline-block mr-2" />
                Profile Information
              </button>
              <button
                onClick={() => setActiveTab("password")}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === "password"
                    ? "border-brand text-brand"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                <KeyIcon className="w-4 h-4 inline-block mr-2" />
                Change Password
              </button>
            </nav>
          </div>

          <div className="p-6">
            {activeTab === "profile" && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Update Profile Information
                </h3>
                
                {profileSuccess && (
                  <div className="mb-4 bg-green-50 border border-green-200 rounded-md p-4">
                    <div className="flex">
                      <CheckIcon className="w-5 h-5 text-green-400 mr-2" />
                      <p className="text-sm text-green-800">{profileSuccess}</p>
                    </div>
                  </div>
                )}

                {profileError && (
                  <div className="mb-4 bg-red-50 border border-red-200 rounded-md p-4">
                    <p className="text-sm text-red-800">{profileError}</p>
                  </div>
                )}

                <form onSubmit={handleProfileSubmit} className="space-y-6">
                  <div>
                    <label
                      htmlFor="name"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Full Name
                    </label>
                    <div className="mt-1 relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <UserIcon className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        id="name"
                        name="name"
                        type="text"
                        required
                        className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-2 focus:ring-brand focus:border-brand"
                        placeholder="Enter your full name"
                        value={profileData.name}
                        onChange={handleProfileChange}
                      />
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="email"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Email Address
                    </label>
                    <div className="mt-1 relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <EnvelopeIcon className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        id="email"
                        name="email"
                        type="email"
                        required
                        className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-2 focus:ring-brand focus:border-brand"
                        placeholder="Enter your email"
                        value={profileData.email}
                        onChange={handleProfileChange}
                      />
                    </div>
                  </div>

                  <div>
                    <button
                      type="submit"
                      disabled={profileLoading}
                      className="w-full bg-brand text-white py-3 px-4 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                    >
                      {profileLoading ? (
                        <div className="flex items-center justify-center">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Updating...
                        </div>
                      ) : (
                        "Update Profile"
                      )}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {activeTab === "password" && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Change Password
                </h3>
                
                {passwordSuccess && (
                  <div className="mb-4 bg-green-50 border border-green-200 rounded-md p-4">
                    <div className="flex">
                      <CheckIcon className="w-5 h-5 text-green-400 mr-2" />
                      <p className="text-sm text-green-800">{passwordSuccess}</p>
                    </div>
                  </div>
                )}

                {passwordError && (
                  <div className="mb-4 bg-red-50 border border-red-200 rounded-md p-4">
                    <p className="text-sm text-red-800">{passwordError}</p>
                  </div>
                )}

                <form onSubmit={handlePasswordSubmit} className="space-y-6">
                  <div>
                    <label
                      htmlFor="currentPassword"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Current Password
                    </label>
                    <div className="mt-1 relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <LockClosedIcon className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        id="currentPassword"
                        name="currentPassword"
                        type={showPasswords.current ? "text" : "password"}
                        required
                        className="block w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-2 focus:ring-brand focus:border-brand"
                        placeholder="Enter current password"
                        value={passwordData.currentPassword}
                        onChange={handlePasswordChange}
                      />
                      <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                        <button
                          type="button"
                          className="text-gray-400 hover:text-gray-600"
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
                      className="block text-sm font-medium text-gray-700"
                    >
                      New Password
                    </label>
                    <div className="mt-1 relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <LockClosedIcon className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        id="newPassword"
                        name="newPassword"
                        type={showPasswords.new ? "text" : "password"}
                        required
                        className="block w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-2 focus:ring-brand focus:border-brand"
                        placeholder="Enter new password"
                        value={passwordData.newPassword}
                        onChange={handlePasswordChange}
                      />
                      <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                        <button
                          type="button"
                          className="text-gray-400 hover:text-gray-600"
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
                      className="block text-sm font-medium text-gray-700"
                    >
                      Confirm New Password
                    </label>
                    <div className="mt-1 relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <LockClosedIcon className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        id="confirmPassword"
                        name="confirmPassword"
                        type={showPasswords.confirm ? "text" : "password"}
                        required
                        className="block w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-2 focus:ring-brand focus:border-brand"
                        placeholder="Confirm new password"
                        value={passwordData.confirmPassword}
                        onChange={handlePasswordChange}
                      />
                      <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                        <button
                          type="button"
                          className="text-gray-400 hover:text-gray-600"
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

                  {/* Password Requirements */}
                  {(passwordData.newPassword || passwordData.confirmPassword) && (
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h4 className="text-sm font-medium text-gray-900 mb-2">
                        Password requirements:
                      </h4>
                      <ul className="space-y-1">
                        {passwordRequirements.map((req, index) => (
                          <li key={index} className="flex items-center text-sm">
                            <CheckIcon
                              className={`h-4 w-4 mr-2 ${
                                req.met ? "text-green-500" : "text-gray-300"
                              }`}
                            />
                            <span
                              className={req.met ? "text-green-700" : "text-gray-500"}
                            >
                              {req.label}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div>
                    <button
                      type="submit"
                      disabled={
                        passwordLoading || !passwordRequirements.every((req) => req.met)
                      }
                      className="w-full bg-brand text-white py-3 px-4 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                    >
                      {passwordLoading ? (
                        <div className="flex items-center justify-center">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Changing Password...
                        </div>
                      ) : (
                        "Change Password"
                      )}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
