import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { adminAPI } from "../api/admin";
import { formatPrice } from "../utils/formatters";
import {
  MagnifyingGlassIcon,
  BanknotesIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  CurrencyRupeeIcon,
  CalendarIcon,
  UserIcon,
  DocumentTextIcon,
} from "@heroicons/react/24/outline";
import toast from "react-hot-toast";

export default function AdminPayouts() {
  const [payouts, setPayouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [processing, setProcessing] = useState({});
  const [selectedPayout, setSelectedPayout] = useState(null);
  const [showPayoutModal, setShowPayoutModal] = useState(false);
  const [stats, setStats] = useState({
    pending: { count: 0, amount: 0 },
    processed: { count: 0, amount: 0 },
    failed: { count: 0, amount: 0 },
    total: { count: 0, amount: 0 },
  });

  const { isAdmin } = useAuth();

  useEffect(() => {
    if (!isAdmin()) {
      window.location.href = "/";
      return;
    }
    fetchPayouts();
  }, [isAdmin]);

  const fetchPayouts = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getAllPayouts();
      const payoutsData = response.payouts || response.data?.payouts || [];
      setPayouts(payoutsData);
      calculateStats(payoutsData);
      setError(null);
    } catch (err) {
      console.error("Error fetching payouts:", err);
      setError("Failed to load payouts");
      toast.error("Failed to load payouts");
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (payoutsData) => {
    const stats = {
      pending: { count: 0, amount: 0 },
      processed: { count: 0, amount: 0 },
      failed: { count: 0, amount: 0 },
      total: { count: payoutsData.length, amount: 0 },
    };

    payoutsData.forEach((payout) => {
      const amount = payout.amount || 0;
      stats.total.amount += amount;

      if (payout.status === "pending") {
        stats.pending.count++;
        stats.pending.amount += amount;
      } else if (payout.status === "processed") {
        stats.processed.count++;
        stats.processed.amount += amount;
      } else if (payout.status === "failed") {
        stats.failed.count++;
        stats.failed.amount += amount;
      }
    });

    setStats(stats);
  };

  const handleProcessPayout = async (payoutId, action) => {
    if (!window.confirm(`Are you sure you want to ${action} this payout?`)) {
      return;
    }

    setProcessing((prev) => ({ ...prev, [payoutId]: true }));

    try {
      if (action === "approve") {
        await adminAPI.processPayout(payoutId, { notes: "Approved by admin" });
      } else if (action === "reject") {
        await adminAPI.rejectPayout(payoutId, "Rejected by admin");
      }

      setPayouts((prev) =>
        prev.map((payout) =>
          payout._id === payoutId
            ? {
                ...payout,
                status: action === "approve" ? "processed" : "failed",
                processedAt: new Date().toISOString(),
              }
            : payout
        )
      );

      toast.success(`Payout ${action}d successfully`);
      setShowPayoutModal(false);
    } catch (err) {
      console.error(`Error ${action}ing payout:`, err);
      toast.error(`Failed to ${action} payout`);
    } finally {
      setProcessing((prev) => ({ ...prev, [payoutId]: false }));
    }
  };

  const getFilteredPayouts = () => {
    let filtered = payouts;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (payout) =>
          payout.host?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          payout.host?.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          payout.transactionId?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((payout) => payout.status === statusFilter);
    }

    // Sort
    return filtered.sort((a, b) => {
      switch (sortBy) {
        case "newest":
          return new Date(b.createdAt) - new Date(a.createdAt);
        case "oldest":
          return new Date(a.createdAt) - new Date(b.createdAt);
        case "amount-high":
          return b.amount - a.amount;
        case "amount-low":
          return a.amount - b.amount;
        case "host":
          return a.host?.name.localeCompare(b.host?.name);
        default:
          return 0;
      }
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "processed":
        return "bg-green-100 text-green-800";
      case "failed":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "pending":
        return <ClockIcon className="w-4 h-4" />;
      case "processed":
        return <CheckCircleIcon className="w-4 h-4" />;
      case "failed":
        return <XCircleIcon className="w-4 h-4" />;
      default:
        return <ClockIcon className="w-4 h-4" />;
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
              onClick={fetchPayouts}
              className="bg-brand text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  const filteredPayouts = getFilteredPayouts();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Payout Management
          </h1>
          <p className="mt-2 text-gray-600">Manage host payouts and earnings</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ClockIcon className="h-8 w-8 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.pending.count}
                </p>
                <p className="text-sm text-yellow-600">
                  ₹{stats.pending.amount.toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CheckCircleIcon className="h-8 w-8 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Processed</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.processed.count}
                </p>
                <p className="text-sm text-green-600">
                  ₹{stats.processed.amount.toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <XCircleIcon className="h-8 w-8 text-red-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Failed</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.failed.count}
                </p>
                <p className="text-sm text-red-600">
                  ₹{stats.failed.amount.toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <BanknotesIcon className="h-8 w-8 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.total.count}
                </p>
                <p className="text-sm text-blue-600">
                  ₹{stats.total.amount.toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
              <div className="flex-1 max-w-lg">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    placeholder="Search payouts..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-brand focus:border-brand"
                  />
                </div>
              </div>

              <div className="flex flex-wrap gap-4">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="block border-gray-300 rounded-md shadow-sm focus:ring-brand focus:border-brand"
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="processed">Processed</option>
                  <option value="failed">Failed</option>
                </select>

                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="block border-gray-300 rounded-md shadow-sm focus:ring-brand focus:border-brand"
                >
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                  <option value="amount-high">Amount: High to Low</option>
                  <option value="amount-low">Amount: Low to High</option>
                  <option value="host">Host Name A-Z</option>
                </select>
              </div>
            </div>
          </div>

          <div className="px-6 py-3 bg-gray-50">
            <p className="text-sm text-gray-600">
              Showing {filteredPayouts.length} of {payouts.length} payouts
            </p>
          </div>
        </div>

        {/* Payouts Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Host
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Period
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredPayouts.map((payout) => (
                  <tr key={payout._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          {payout.host?.profileImage ? (
                            <img
                              className="h-10 w-10 rounded-full object-cover"
                              src={payout.host.profileImage}
                              alt=""
                            />
                          ) : (
                            <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                              <UserIcon className="h-6 w-6 text-gray-600" />
                            </div>
                          )}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {payout.host?.name || "Unknown Host"}
                          </div>
                          <div className="text-sm text-gray-500">
                            {payout.host?.email || "No email"}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {formatPrice(payout.amount)}
                      </div>
                      <div className="text-sm text-gray-500">
                        {payout.bookingsCount || 0} bookings
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                          payout.status
                        )}`}
                      >
                        {getStatusIcon(payout.status)}
                        <span className="ml-1">
                          {payout.status.charAt(0).toUpperCase() +
                            payout.status.slice(1)}
                        </span>
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div>
                        {new Date(payout.periodStart).toLocaleDateString()} -
                      </div>
                      <div>
                        {new Date(payout.periodEnd).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(payout.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => {
                          setSelectedPayout(payout);
                          setShowPayoutModal(true);
                        }}
                        className="text-brand hover:text-blue-700 mr-3"
                      >
                        View
                      </button>

                      {payout.status === "pending" && (
                        <div className="inline-flex space-x-2">
                          <button
                            onClick={() =>
                              handleProcessPayout(payout._id, "approve")
                            }
                            disabled={processing[payout._id]}
                            className="text-green-600 hover:text-green-700 disabled:opacity-50"
                          >
                            {processing[payout._id]
                              ? "Processing..."
                              : "Approve"}
                          </button>
                          <button
                            onClick={() =>
                              handleProcessPayout(payout._id, "reject")
                            }
                            disabled={processing[payout._id]}
                            className="text-red-600 hover:text-red-700 disabled:opacity-50"
                          >
                            Reject
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredPayouts.length === 0 && (
            <div className="text-center py-12">
              <BanknotesIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">
                No payouts found
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                No payouts match your current filters.
              </p>
            </div>
          )}
        </div>

        {/* Payout Detail Modal */}
        {showPayoutModal && selectedPayout && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-2xl shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">
                    Payout Details
                  </h3>
                  <button
                    onClick={() => setShowPayoutModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <svg
                      className="w-6 h-6"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>

                <div className="space-y-6">
                  {/* Host Info */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-3">
                      Host Information
                    </h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-600">Name</p>
                        <p className="font-medium">
                          {selectedPayout.host?.name}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Email</p>
                        <p className="font-medium">
                          {selectedPayout.host?.email}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Payout Details */}
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <p className="text-sm text-gray-600">Amount</p>
                      <p className="text-xl font-bold text-gray-900">
                        {formatPrice(selectedPayout.amount)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Status</p>
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                          selectedPayout.status
                        )}`}
                      >
                        {getStatusIcon(selectedPayout.status)}
                        <span className="ml-1">
                          {selectedPayout.status.charAt(0).toUpperCase() +
                            selectedPayout.status.slice(1)}
                        </span>
                      </span>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Period</p>
                      <p className="font-medium">
                        {new Date(
                          selectedPayout.periodStart
                        ).toLocaleDateString()}{" "}
                        -{" "}
                        {new Date(
                          selectedPayout.periodEnd
                        ).toLocaleDateString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Bookings</p>
                      <p className="font-medium">
                        {selectedPayout.bookingsCount || 0}
                      </p>
                    </div>
                  </div>

                  {/* Transaction Details */}
                  {selectedPayout.transactionId && (
                    <div>
                      <p className="text-sm text-gray-600">Transaction ID</p>
                      <p className="font-medium font-mono text-sm">
                        {selectedPayout.transactionId}
                      </p>
                    </div>
                  )}

                  {/* Actions */}
                  {selectedPayout.status === "pending" && (
                    <div className="flex justify-end space-x-3 pt-4 border-t">
                      <button
                        onClick={() =>
                          handleProcessPayout(selectedPayout._id, "approve")
                        }
                        disabled={processing[selectedPayout._id]}
                        className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:opacity-50"
                      >
                        {processing[selectedPayout._id]
                          ? "Processing..."
                          : "Approve Payout"}
                      </button>
                      <button
                        onClick={() =>
                          handleProcessPayout(selectedPayout._id, "reject")
                        }
                        disabled={processing[selectedPayout._id]}
                        className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 disabled:opacity-50"
                      >
                        Reject Payout
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
