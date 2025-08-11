import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { updateHostProfile, getHostStats } from "../api/hosts";
import HostVerification from "../components/HostVerification";
import ImageUpload from "../components/ImageUpload";
import {
  UserIcon,
  EnvelopeIcon,
  PhoneIcon,
  MapPinIcon,
  CalendarIcon,
  StarIcon,
  ChartBarIcon,
  BanknotesIcon,
  HomeIcon,
  PhotoIcon,
  CheckBadgeIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";
import toast from "react-hot-toast";

export default function HostProfile() {
  const [profile, setProfile] = useState({
    name: "",
    email: "",
    phone: "",
    location: "",
    bio: "",
    profileImage: "",
    languages: [],
    responseTime: "",
    hostSince: "",
  });
  const [stats, setStats] = useState({
    totalListings: 0,
    totalBookings: 0,
    totalRevenue: 0,
    averageRating: 0,
    responseRate: 0,
    totalReviews: 0,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("profile");

  const { user, updateUser, isHost } = useAuth();

  useEffect(() => {
    if (!isHost()) {
      window.location.href = "/";
      return;
    }

    // Initialize profile with user data
    setProfile({
      name: user.name || "",
      email: user.email || "",
      phone: user.phone || "",
      location: user.location || "",
      bio: user.bio || "",
      profileImage: user.profileImage || "",
      languages: user.languages || [],
      responseTime: user.responseTime || "",
      hostSince: user.hostSince || user.createdAt,
    });

    fetchHostStats();
    setLoading(false);
  }, [user, isHost]);

  const fetchHostStats = async () => {
    try {
      const response = await getHostStats();
      setStats(response.data);
    } catch (err) {
      console.error("Error fetching host stats:", err);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProfile((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleLanguageToggle = (language) => {
    setProfile((prev) => ({
      ...prev,
      languages: prev.languages.includes(language)
        ? prev.languages.filter((l) => l !== language)
        : [...prev.languages, language],
    }));
  };

  const handleImageUpload = (imageUrl) => {
    setProfile((prev) => ({
      ...prev,
      profileImage: imageUrl,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      const response = await updateHostProfile(profile);
      updateUser(response.data.user);
      toast.success("Profile updated successfully!");
      setError(null);
    } catch (err) {
      console.error("Error updating profile:", err);
      setError(err.response?.data?.message || "Failed to update profile");
      toast.error("Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const commonLanguages = [
    "English",
    "Hindi",
    "Bengali",
    "Telugu",
    "Marathi",
    "Tamil",
    "Gujarati",
    "Urdu",
    "Kannada",
    "Malayalam",
    "Punjabi",
    "Spanish",
    "French",
    "German",
    "Chinese",
    "Japanese",
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Host Profile</h1>
          <p className="mt-2 text-gray-600">
            Manage your host profile and view your statistics
          </p>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8 px-6">
              <button
                onClick={() => setActiveTab("profile")}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === "profile"
                    ? "border-brand text-brand"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                Profile Information
              </button>
              <button
                onClick={() => setActiveTab("stats")}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === "stats"
                    ? "border-brand text-brand"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                Host Statistics
              </button>
            </nav>
          </div>

          {/* Profile Tab */}
          {activeTab === "profile" && (
            <div className="p-6">
              {error && (
                <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
                  <div className="flex">
                    <ExclamationTriangleIcon className="h-5 w-5 text-red-400" />
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-red-800">
                        Error
                      </h3>
                      <div className="mt-2 text-sm text-red-700">{error}</div>
                    </div>
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Profile Image */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Profile Picture
                  </label>
                  <div className="flex items-center space-x-6">
                    <div className="relative">
                      {profile.profileImage ? (
                        <img
                          src={profile.profileImage}
                          alt="Profile"
                          className="w-24 h-24 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center">
                          <UserIcon className="w-12 h-12 text-gray-400" />
                        </div>
                      )}
                    </div>
                    <ImageUpload
                      onImageUpload={handleImageUpload}
                      accept="image/*"
                      maxSize={5}
                      className="text-sm"
                    >
                      Change Photo
                    </ImageUpload>
                  </div>
                </div>

                {/* Basic Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label
                      htmlFor="name"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Full Name *
                    </label>
                    <div className="mt-1 relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <UserIcon className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="text"
                        id="name"
                        name="name"
                        required
                        value={profile.name}
                        onChange={handleInputChange}
                        className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-brand focus:border-brand"
                      />
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="email"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Email Address *
                    </label>
                    <div className="mt-1 relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <EnvelopeIcon className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        required
                        value={profile.email}
                        onChange={handleInputChange}
                        className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-brand focus:border-brand"
                      />
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="phone"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Phone Number
                    </label>
                    <div className="mt-1 relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <PhoneIcon className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="tel"
                        id="phone"
                        name="phone"
                        value={profile.phone}
                        onChange={handleInputChange}
                        className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-brand focus:border-brand"
                      />
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="location"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Location
                    </label>
                    <div className="mt-1 relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <MapPinIcon className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="text"
                        id="location"
                        name="location"
                        value={profile.location}
                        onChange={handleInputChange}
                        className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-brand focus:border-brand"
                        placeholder="e.g., Mumbai, Maharashtra"
                      />
                    </div>
                  </div>
                </div>

                {/* Bio */}
                <div>
                  <label
                    htmlFor="bio"
                    className="block text-sm font-medium text-gray-700"
                  >
                    About You
                  </label>
                  <div className="mt-1">
                    <textarea
                      id="bio"
                      name="bio"
                      rows={4}
                      value={profile.bio}
                      onChange={handleInputChange}
                      className="block w-full border border-gray-300 rounded-md focus:ring-brand focus:border-brand"
                      placeholder="Tell guests about yourself, your hosting experience, and what makes your place special..."
                    />
                  </div>
                  <p className="mt-2 text-sm text-gray-500">
                    A great bio helps guests feel more comfortable booking with
                    you.
                  </p>
                </div>

                {/* Languages */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Languages You Speak
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {commonLanguages.map((language) => (
                      <label key={language} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={profile.languages.includes(language)}
                          onChange={() => handleLanguageToggle(language)}
                          className="h-4 w-4 text-brand focus:ring-brand border-gray-300 rounded"
                        />
                        <span className="ml-2 text-sm text-gray-700">
                          {language}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Response Time */}
                <div>
                  <label
                    htmlFor="responseTime"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Typical Response Time
                  </label>
                  <div className="mt-1">
                    <select
                      id="responseTime"
                      name="responseTime"
                      value={profile.responseTime}
                      onChange={handleInputChange}
                      className="block w-full border border-gray-300 rounded-md focus:ring-brand focus:border-brand"
                    >
                      <option value="">Select response time</option>
                      <option value="within an hour">Within an hour</option>
                      <option value="within a few hours">
                        Within a few hours
                      </option>
                      <option value="within a day">Within a day</option>
                      <option value="a few days or more">
                        A few days or more
                      </option>
                    </select>
                  </div>
                </div>

                {/* Host Verification Status */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-sm font-medium text-gray-900 mb-3">
                    Verification Status
                  </h3>
                  <HostVerification host={user} showRequestButton={true} />
                </div>

                {/* Submit Button */}
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={saving}
                    className="bg-brand text-white px-6 py-2 rounded-md font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand disabled:opacity-50"
                  >
                    {saving ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Stats Tab */}
          {activeTab === "stats" && (
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg p-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <HomeIcon className="h-8 w-8 text-blue-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-blue-900">
                        Total Listings
                      </p>
                      <p className="text-2xl font-bold text-blue-900">
                        {stats.totalListings}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-lg p-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <CalendarIcon className="h-8 w-8 text-green-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-green-900">
                        Total Bookings
                      </p>
                      <p className="text-2xl font-bold text-green-900">
                        {stats.totalBookings}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-yellow-50 to-yellow-100 rounded-lg p-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <BanknotesIcon className="h-8 w-8 text-yellow-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-yellow-900">
                        Total Revenue
                      </p>
                      <p className="text-2xl font-bold text-yellow-900">
                        ₹{stats.totalRevenue.toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg p-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <StarIcon className="h-8 w-8 text-purple-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-purple-900">
                        Average Rating
                      </p>
                      <p className="text-2xl font-bold text-purple-900">
                        {stats.averageRating
                          ? `${stats.averageRating.toFixed(1)} ⭐`
                          : "No ratings"}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-indigo-50 to-indigo-100 rounded-lg p-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <ChartBarIcon className="h-8 w-8 text-indigo-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-indigo-900">
                        Response Rate
                      </p>
                      <p className="text-2xl font-bold text-indigo-900">
                        {stats.responseRate
                          ? `${stats.responseRate}%`
                          : "No data"}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-pink-50 to-pink-100 rounded-lg p-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <CheckBadgeIcon className="h-8 w-8 text-pink-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-pink-900">
                        Total Reviews
                      </p>
                      <p className="text-2xl font-bold text-pink-900">
                        {stats.totalReviews}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Host Since */}
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <div className="flex items-center">
                  <CalendarIcon className="h-6 w-6 text-gray-400 mr-3" />
                  <div>
                    <p className="text-sm text-gray-600">Host since</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {new Date(profile.hostSince).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                      })}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
