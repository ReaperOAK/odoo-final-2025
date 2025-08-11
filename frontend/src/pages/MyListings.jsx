import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  getHostListings,
  deleteListing,
  toggleListingStatus,
} from "../api/listings";
import { formatPrice } from "../utils/formatters";
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  PhotoIcon,
  CalendarIcon,
  MapPinIcon,
  CurrencyRupeeIcon,
  ChartBarIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";
import { EyeSlashIcon } from "@heroicons/react/24/solid";
import toast from "react-hot-toast";

export default function MyListings() {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState("all"); // all, active, inactive, draft
  const [sortBy, setSortBy] = useState("newest");
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    inactive: 0,
    totalRevenue: 0,
    totalBookings: 0,
  });

  const { user, isHost } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isHost()) {
      navigate("/");
      return;
    }
    fetchListings();
  }, [isHost, navigate]);

  const fetchListings = async () => {
    try {
      setLoading(true);
      const response = await getHostListings();
      setListings(response.data.listings);
      calculateStats(response.data.listings);
      setError(null);
    } catch (err) {
      console.error("Error fetching listings:", err);
      setError("Failed to load your listings");
      toast.error("Failed to load your listings");
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (listingsData) => {
    const stats = {
      total: listingsData.length,
      active: listingsData.filter((l) => l.status === "active").length,
      inactive: listingsData.filter((l) => l.status === "inactive").length,
      totalRevenue: listingsData.reduce(
        (sum, l) => sum + (l.totalRevenue || 0),
        0
      ),
      totalBookings: listingsData.reduce(
        (sum, l) => sum + (l.totalBookings || 0),
        0
      ),
    };
    setStats(stats);
  };

  const handleToggleStatus = async (listingId, currentStatus) => {
    try {
      const newStatus = currentStatus === "active" ? "inactive" : "active";
      await toggleListingStatus(listingId, newStatus);

      setListings((prev) =>
        prev.map((listing) =>
          listing._id === listingId
            ? { ...listing, status: newStatus }
            : listing
        )
      );

      toast.success(
        `Listing ${
          newStatus === "active" ? "activated" : "deactivated"
        } successfully`
      );
    } catch (err) {
      console.error("Error toggling listing status:", err);
      toast.error("Failed to update listing status");
    }
  };

  const handleDeleteListing = async (listingId, title) => {
    if (!window.confirm(`Are you sure you want to delete "${title}"?`)) {
      return;
    }

    try {
      await deleteListing(listingId);
      setListings((prev) =>
        prev.filter((listing) => listing._id !== listingId)
      );
      toast.success("Listing deleted successfully");
    } catch (err) {
      console.error("Error deleting listing:", err);
      toast.error("Failed to delete listing");
    }
  };

  const getFilteredListings = () => {
    let filtered = listings;

    if (filter !== "all") {
      filtered = filtered.filter((listing) => listing.status === filter);
    }

    // Sort listings
    return filtered.sort((a, b) => {
      switch (sortBy) {
        case "newest":
          return new Date(b.createdAt) - new Date(a.createdAt);
        case "oldest":
          return new Date(a.createdAt) - new Date(b.createdAt);
        case "price-high":
          return b.pricePerDay - a.pricePerDay;
        case "price-low":
          return a.pricePerDay - b.pricePerDay;
        case "bookings":
          return (b.totalBookings || 0) - (a.totalBookings || 0);
        default:
          return 0;
      }
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800";
      case "inactive":
        return "bg-gray-100 text-gray-800";
      case "draft":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <ExclamationTriangleIcon className="mx-auto h-12 w-12 text-red-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Error</h3>
          <p className="mt-1 text-sm text-gray-500">{error}</p>
          <div className="mt-6">
            <button
              onClick={fetchListings}
              className="bg-brand text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  const filteredListings = getFilteredListings();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">My Listings</h1>
              <p className="mt-2 text-gray-600">Manage your rental listings</p>
            </div>
            <div className="mt-4 sm:mt-0">
              <Link
                to="/listings/create"
                className="inline-flex items-center px-4 py-2 bg-brand text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                <PlusIcon className="w-4 h-4 mr-2" />
                Add New Listing
              </Link>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ChartBarIcon className="h-8 w-8 text-brand" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">
                  Total Listings
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.total}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <EyeIcon className="h-8 w-8 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.active}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <EyeSlashIcon className="h-8 w-8 text-gray-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Inactive</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.inactive}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CalendarIcon className="h-8 w-8 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">
                  Total Bookings
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.totalBookings}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CurrencyRupeeIcon className="h-8 w-8 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">
                  Total Revenue
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  ₹{stats.totalRevenue.toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters and Sort */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
              <div className="flex space-x-4">
                <select
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  className="block border-gray-300 rounded-md shadow-sm focus:ring-brand focus:border-brand"
                >
                  <option value="all">All Listings</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="draft">Draft</option>
                </select>

                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="block border-gray-300 rounded-md shadow-sm focus:ring-brand focus:border-brand"
                >
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                  <option value="price-high">Price: High to Low</option>
                  <option value="price-low">Price: Low to High</option>
                  <option value="bookings">Most Bookings</option>
                </select>
              </div>

              <div className="text-sm text-gray-600">
                Showing {filteredListings.length} of {listings.length} listings
              </div>
            </div>
          </div>
        </div>

        {/* Listings Grid */}
        {filteredListings.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <PhotoIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-4 text-lg font-medium text-gray-900">
              {filter === "all" ? "No listings yet" : `No ${filter} listings`}
            </h3>
            <p className="mt-2 text-gray-600">
              {filter === "all"
                ? "Get started by creating your first listing."
                : `You don't have any ${filter} listings.`}
            </p>
            {filter === "all" && (
              <div className="mt-6">
                <Link
                  to="/listings/create"
                  className="inline-flex items-center px-4 py-2 bg-brand text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  <PlusIcon className="w-4 h-4 mr-2" />
                  Create Your First Listing
                </Link>
              </div>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredListings.map((listing) => (
              <div
                key={listing._id}
                className="bg-white rounded-lg shadow-md overflow-hidden"
              >
                {/* Image */}
                <div className="relative h-48">
                  {listing.images && listing.images.length > 0 ? (
                    <img
                      src={listing.images[0]}
                      alt={listing.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                      <PhotoIcon className="h-12 w-12 text-gray-400" />
                    </div>
                  )}

                  {/* Status Badge */}
                  <div className="absolute top-3 left-3">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(
                        listing.status
                      )}`}
                    >
                      {listing.status.charAt(0).toUpperCase() +
                        listing.status.slice(1)}
                    </span>
                  </div>

                  {/* Image Count */}
                  {listing.images && listing.images.length > 1 && (
                    <div className="absolute top-3 right-3 bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded">
                      {listing.images.length} photos
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                    {listing.title}
                  </h3>

                  <div className="flex items-center text-gray-600 mb-2">
                    <MapPinIcon className="h-4 w-4 mr-1" />
                    <span className="text-sm">{listing.location}</span>
                  </div>

                  <div className="flex items-center justify-between mb-4">
                    <div className="text-lg font-bold text-gray-900">
                      {formatPrice(listing.pricePerDay)}/day
                    </div>
                    <div className="text-sm text-gray-600">
                      {listing.totalBookings || 0} bookings
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-4 mb-4 pt-4 border-t border-gray-100">
                    <div>
                      <p className="text-xs text-gray-600">Revenue</p>
                      <p className="font-semibold text-green-600">
                        ₹{(listing.totalRevenue || 0).toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600">Rating</p>
                      <p className="font-semibold">
                        {listing.averageRating
                          ? `${listing.averageRating.toFixed(1)} ⭐`
                          : "No ratings"}
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex space-x-2">
                    <Link
                      to={`/listings/${listing._id}`}
                      className="flex-1 bg-gray-100 text-gray-700 px-3 py-2 rounded-md text-sm font-medium hover:bg-gray-200 transition-colors text-center"
                    >
                      <EyeIcon className="w-4 h-4 inline mr-1" />
                      View
                    </Link>

                    <Link
                      to={`/listings/${listing._id}/edit`}
                      className="flex-1 bg-blue-100 text-blue-700 px-3 py-2 rounded-md text-sm font-medium hover:bg-blue-200 transition-colors text-center"
                    >
                      <PencilIcon className="w-4 h-4 inline mr-1" />
                      Edit
                    </Link>

                    <button
                      onClick={() =>
                        handleToggleStatus(listing._id, listing.status)
                      }
                      className={`flex-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                        listing.status === "active"
                          ? "bg-red-100 text-red-700 hover:bg-red-200"
                          : "bg-green-100 text-green-700 hover:bg-green-200"
                      }`}
                    >
                      {listing.status === "active" ? "Deactivate" : "Activate"}
                    </button>

                    <button
                      onClick={() =>
                        handleDeleteListing(listing._id, listing.title)
                      }
                      className="bg-red-100 text-red-700 px-3 py-2 rounded-md text-sm font-medium hover:bg-red-200 transition-colors"
                    >
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
