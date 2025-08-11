import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  PlusIcon,
  ChartBarIcon,
  ClockIcon,
  EyeIcon,
  CalendarIcon,
  CurrencyDollarIcon,
  ListBulletIcon,
  UserGroupIcon,
  BuildingStorefrontIcon,
  BanknotesIcon,
  ArrowUpIcon,
  ExclamationTriangleIcon
} from "@heroicons/react/24/outline";
import { useAuth } from "../context/AuthContext";
import { hostsAPI } from "../api/hosts";
import { listingsAPI } from "../api/listings";
import { ordersAPI } from "../api/orders";
import { payoutsAPI } from "../api/payouts";
import Calendar from "../components/Calendar";
import WalletBalance from "../components/WalletBalance";
import HostVerification from "../components/HostVerification";
import ListingCard from "../components/ListingCard";
import StatusChip from "../components/StatusChip";
import toast from "react-hot-toast";
import { format, startOfMonth, endOfMonth } from "date-fns";

const HostDashboard = () => {
  const { user, isHost, isVerified } = useAuth();
  const [dashboardData, setDashboardData] = useState(null);
  const [recentListings, setRecentListings] = useState([]);
  const [upcomingBookings, setUpcomingBookings] = useState([]);
  const [calendarEvents, setCalendarEvents] = useState([]);
  const [earnings, setEarnings] = useState(null);
  const [availableBalance, setAvailableBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    if (isHost()) {
      loadDashboardData();
    }
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);

      // Load dashboard overview data
      const [dashboardRes, listingsRes, ordersRes] = await Promise.all([
        hostsAPI.getHostDashboard(),
        listingsAPI.getMyListings(),
        ordersAPI.getHostOrders({ limit: 5 }),
      ]);

      if (dashboardRes.success) {
        setDashboardData(dashboardRes.data);
      }

      if (listingsRes.success) {
        setRecentListings(listingsRes.data.listings.slice(0, 4));
      }

      if (ordersRes.success) {
        setUpcomingBookings(ordersRes.data.orders);

        // Transform orders to calendar events
        const events = ordersRes.data.orders.map((order) => ({
          id: order._id,
          title: `${order.listingTitle || "Booking"}`,
          start: order.startDate,
          end: order.endDate,
          type: order.status,
          status: order.status,
          customerName: order.renterName,
          amount: order.totalAmount,
          orderId: order._id,
          listingId: order.listingId,
        }));

        setCalendarEvents(events);
      }
    } catch (error) {
      console.error("Error loading dashboard data:", error);
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  const handleCalendarEventClick = (eventInfo) => {
    const orderId = eventInfo.eventData.orderId;
    // Navigate to order details or show modal
    console.log("Order clicked:", orderId);
  };

  const getStatusColor = (status) => {
    const colors = {
      confirmed: "text-green-600 bg-green-100",
      pending: "text-yellow-600 bg-yellow-100",
      in_progress: "text-blue-600 bg-blue-100",
      completed: "text-gray-600 bg-gray-100",
      cancelled: "text-red-600 bg-red-100",
    };
    return colors[status] || "text-gray-600 bg-gray-100";
  };

  if (!isHost()) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
          <h2 className="text-xl font-semibold text-yellow-800 mb-2">
            Host Access Required
          </h2>
          <p className="text-yellow-700 mb-4">
            You need to be a verified host to access this dashboard.
          </p>
          <Link
            to="/become-host"
            className="inline-flex items-center px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors duration-200"
          >
            <PlusIcon className="w-5 h-5 mr-2" />
            Become a Host
          </Link>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
          <div className="h-96 bg-gray-200 rounded-lg"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Host Dashboard
          </h1>
          <p className="text-gray-600">
            Welcome back, {user?.name || user?.hostProfile?.displayName}!
          </p>
        </div>

        <div className="flex items-center space-x-4 mt-4 md:mt-0">
          <HostVerification host={user} />
          <Link
            to="/listings/create"
            className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors duration-200"
          >
            <PlusIcon className="w-5 h-5 mr-2" />
            Add Listing
          </Link>
        </div>
      </div>

      {/* Verification Alert */}
      {!isVerifiedHost() && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <ClockIcon className="w-5 h-5 text-blue-600 mt-0.5" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">
                Complete Your Verification
              </h3>
              <p className="text-sm text-blue-700 mt-1">
                Get verified to unlock all host features and build trust with
                renters.
              </p>
              <Link
                to="/host/verification"
                className="inline-flex items-center mt-2 text-sm font-medium text-blue-600 hover:text-blue-500"
              >
                Complete verification →
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 mb-8">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: "overview", name: "Overview", icon: ChartBarIcon },
            { id: "calendar", name: "Calendar", icon: CalendarIcon },
            { id: "listings", name: "My Listings", icon: ListBulletIcon },
            { id: "bookings", name: "Bookings", icon: UserGroupIcon },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? "border-primary-500 text-primary-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              <tab.icon className="w-5 h-5 mr-2" />
              {tab.name}
            </button>
          ))}
        </nav>
      </div>

      {/* Overview Tab */}
      {activeTab === "overview" && (
        <>
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <CurrencyDollarIcon className="w-6 h-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-600">Total Earnings</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    ₹{dashboardData?.totalEarnings?.toLocaleString() || "0"}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <ListBulletIcon className="w-6 h-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-600">Active Listings</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {dashboardData?.activeListings || 0}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <UserGroupIcon className="w-6 h-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-600">Total Bookings</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {dashboardData?.totalBookings || 0}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="flex items-center">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <ChartBarIcon className="w-6 h-6 text-yellow-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-600">Rating</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {dashboardData?.averageRating?.toFixed(1) || "0.0"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Wallet and Quick Actions */}
            <div className="lg:col-span-1 space-y-6">
              <WalletBalance
                balance={user?.walletBalance || 0}
                pendingAmount={dashboardData?.pendingEarnings || 0}
                totalEarnings={dashboardData?.totalEarnings || 0}
              />
            </div>

            {/* Recent Listings and Bookings */}
            <div className="lg:col-span-2 space-y-6">
              {/* Recent Listings */}
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Recent Listings
                  </h3>
                  <Link
                    to="/host/listings"
                    className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                  >
                    View all →
                  </Link>
                </div>

                {recentListings.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {recentListings.map((listing) => (
                      <ListingCard
                        key={listing._id}
                        listing={listing}
                        size="small"
                        showHost={false}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-500 mb-4">No listings yet</p>
                    <Link
                      to="/listings/create"
                      className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors duration-200"
                    >
                      <PlusIcon className="w-5 h-5 mr-2" />
                      Create Your First Listing
                    </Link>
                  </div>
                )}
              </div>

              {/* Upcoming Bookings */}
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Upcoming Bookings
                  </h3>
                  <Link
                    to="/host/bookings"
                    className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                  >
                    View all →
                  </Link>
                </div>

                {upcomingBookings.length > 0 ? (
                  <div className="space-y-3">
                    {upcomingBookings.map((booking) => (
                      <div
                        key={booking._id}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                      >
                        <div>
                          <p className="font-medium text-gray-900">
                            {booking.listingTitle}
                          </p>
                          <p className="text-sm text-gray-600">
                            {booking.renterName} •{" "}
                            {format(new Date(booking.startDate), "MMM dd")} -{" "}
                            {format(new Date(booking.endDate), "MMM dd")}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-gray-900">
                            ₹{booking.totalAmount?.toLocaleString()}
                          </p>
                          <span
                            className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(
                              booking.status
                            )}`}
                          >
                            {booking.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-500">No upcoming bookings</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}

      {/* Calendar Tab */}
      {activeTab === "calendar" && (
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">
            Booking Calendar
          </h3>
          <Calendar
            events={calendarEvents}
            onEventClick={handleCalendarEventClick}
            height="600px"
          />
        </div>
      )}

      {/* Other tabs content would go here */}
      {activeTab === "listings" && (
        <div className="text-center py-12">
          <p className="text-gray-500">
            Listings management content coming soon...
          </p>
        </div>
      )}

      {activeTab === "bookings" && (
        <div className="text-center py-12">
          <p className="text-gray-500">
            Bookings management content coming soon...
          </p>
        </div>
      )}
    </div>
  );
};

export default HostDashboard;
