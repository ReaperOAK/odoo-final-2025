import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { getHosts, updateHostVerification, suspendHost } from "../api/hosts";
import HostVerification from "../components/HostVerification";
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  EyeIcon,
  CheckIcon,
  XMarkIcon,
  ExclamationTriangleIcon,
  UserGroupIcon,
  CheckBadgeIcon,
  ClockIcon,
  NoSymbolIcon,
} from "@heroicons/react/24/outline";
import toast from "react-hot-toast";

export default function AdminHosts() {
  const [hosts, setHosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [verificationFilter, setVerificationFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [selectedHost, setSelectedHost] = useState(null);
  const [showHostModal, setShowHostModal] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    verified: 0,
    pending: 0,
    suspended: 0,
  });

  const { isAdmin } = useAuth();

  useEffect(() => {
    if (!isAdmin()) {
      window.location.href = "/";
      return;
    }
    fetchHosts();
  }, [isAdmin]);

  const fetchHosts = async () => {
    try {
      setLoading(true);
      const response = await getHosts();
      setHosts(response.data.hosts);
      calculateStats(response.data.hosts);
      setError(null);
    } catch (err) {
      console.error("Error fetching hosts:", err);
      setError("Failed to load hosts");
      toast.error("Failed to load hosts");
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (hostsData) => {
    const stats = {
      total: hostsData.length,
      verified: hostsData.filter((h) => h.isVerified).length,
      pending: hostsData.filter((h) => h.verificationStatus === "pending")
        .length,
      suspended: hostsData.filter((h) => h.status === "suspended").length,
    };
    setStats(stats);
  };

  const handleVerificationUpdate = async (hostId, status, reason = "") => {
    try {
      await updateHostVerification(hostId, { status, reason });

      setHosts((prev) =>
        prev.map((host) =>
          host._id === hostId
            ? {
                ...host,
                verificationStatus: status,
                isVerified: status === "approved",
                verificationReason: reason,
              }
            : host
        )
      );

      toast.success(`Host verification ${status} successfully`);
      setShowHostModal(false);
    } catch (err) {
      console.error("Error updating host verification:", err);
      toast.error("Failed to update host verification");
    }
  };

  const handleSuspendHost = async (hostId, reason) => {
    if (!window.confirm("Are you sure you want to suspend this host?")) {
      return;
    }

    try {
      await suspendHost(hostId, { reason });

      setHosts((prev) =>
        prev.map((host) =>
          host._id === hostId
            ? { ...host, status: "suspended", suspensionReason: reason }
            : host
        )
      );

      toast.success("Host suspended successfully");
      setShowHostModal(false);
    } catch (err) {
      console.error("Error suspending host:", err);
      toast.error("Failed to suspend host");
    }
  };

  const getFilteredHosts = () => {
    let filtered = hosts;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (host) =>
          host.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          host.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          host.location?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((host) => host.status === statusFilter);
    }

    // Verification filter
    if (verificationFilter !== "all") {
      if (verificationFilter === "verified") {
        filtered = filtered.filter((host) => host.isVerified);
      } else if (verificationFilter === "pending") {
        filtered = filtered.filter(
          (host) => host.verificationStatus === "pending"
        );
      } else if (verificationFilter === "rejected") {
        filtered = filtered.filter(
          (host) => host.verificationStatus === "rejected"
        );
      }
    }

    // Sort
    return filtered.sort((a, b) => {
      switch (sortBy) {
        case "newest":
          return new Date(b.createdAt) - new Date(a.createdAt);
        case "oldest":
          return new Date(a.createdAt) - new Date(b.createdAt);
        case "name":
          return a.name.localeCompare(b.name);
        case "listings":
          return (b.listingsCount || 0) - (a.listingsCount || 0);
        case "revenue":
          return (b.totalRevenue || 0) - (a.totalRevenue || 0);
        default:
          return 0;
      }
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800";
      case "suspended":
        return "bg-red-100 text-red-800";
      case "inactive":
        return "bg-gray-100 text-gray-800";
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
              onClick={fetchHosts}
              className="bg-brand text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  const filteredHosts = getFilteredHosts();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Host Management</h1>
          <p className="mt-2 text-gray-600">
            Manage host verification and monitoring
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <UserGroupIcon className="h-8 w-8 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Hosts</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.total}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CheckBadgeIcon className="h-8 w-8 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Verified</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.verified}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ClockIcon className="h-8 w-8 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.pending}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <NoSymbolIcon className="h-8 w-8 text-red-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Suspended</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.suspended}
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
                    placeholder="Search hosts..."
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
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="suspended">Suspended</option>
                </select>

                <select
                  value={verificationFilter}
                  onChange={(e) => setVerificationFilter(e.target.value)}
                  className="block border-gray-300 rounded-md shadow-sm focus:ring-brand focus:border-brand"
                >
                  <option value="all">All Verification</option>
                  <option value="verified">Verified</option>
                  <option value="pending">Pending</option>
                  <option value="rejected">Rejected</option>
                </select>

                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="block border-gray-300 rounded-md shadow-sm focus:ring-brand focus:border-brand"
                >
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                  <option value="name">Name A-Z</option>
                  <option value="listings">Most Listings</option>
                  <option value="revenue">Highest Revenue</option>
                </select>
              </div>
            </div>
          </div>

          <div className="px-6 py-3 bg-gray-50">
            <p className="text-sm text-gray-600">
              Showing {filteredHosts.length} of {hosts.length} hosts
            </p>
          </div>
        </div>

        {/* Hosts Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Host
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Verification
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Listings
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Revenue
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Joined
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredHosts.map((host) => (
                  <tr key={host._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          {host.profileImage ? (
                            <img
                              className="h-10 w-10 rounded-full object-cover"
                              src={host.profileImage}
                              alt=""
                            />
                          ) : (
                            <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                              <span className="text-sm font-medium text-gray-700">
                                {host.name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {host.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {host.email}
                          </div>
                          {host.location && (
                            <div className="text-xs text-gray-400">
                              {host.location}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(
                          host.status
                        )}`}
                      >
                        {host.status?.charAt(0).toUpperCase() +
                          host.status?.slice(1) || "Active"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <HostVerification host={host} size="small" />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {host.listingsCount || 0}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ₹{(host.totalRevenue || 0).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(host.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => {
                          setSelectedHost(host);
                          setShowHostModal(true);
                        }}
                        className="text-brand hover:text-blue-700 mr-3"
                      >
                        <EyeIcon className="w-4 h-4" />
                      </button>

                      {host.verificationStatus === "pending" && (
                        <>
                          <button
                            onClick={() =>
                              handleVerificationUpdate(host._id, "approved")
                            }
                            className="text-green-600 hover:text-green-700 mr-3"
                            title="Approve Verification"
                          >
                            <CheckIcon className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() =>
                              handleVerificationUpdate(
                                host._id,
                                "rejected",
                                "Did not meet verification requirements"
                              )
                            }
                            className="text-red-600 hover:text-red-700 mr-3"
                            title="Reject Verification"
                          >
                            <XMarkIcon className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredHosts.length === 0 && (
            <div className="text-center py-12">
              <UserGroupIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">
                No hosts found
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                No hosts match your current filters.
              </p>
            </div>
          )}
        </div>

        {/* Host Detail Modal */}
        {showHostModal && selectedHost && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-2xl shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">
                    Host Details
                  </h3>
                  <button
                    onClick={() => setShowHostModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <XMarkIcon className="w-6 h-6" />
                  </button>
                </div>

                <div className="space-y-4">
                  {/* Host Info */}
                  <div className="flex items-center space-x-4">
                    {selectedHost.profileImage ? (
                      <img
                        className="h-16 w-16 rounded-full object-cover"
                        src={selectedHost.profileImage}
                        alt=""
                      />
                    ) : (
                      <div className="h-16 w-16 rounded-full bg-gray-300 flex items-center justify-center">
                        <span className="text-lg font-medium text-gray-700">
                          {selectedHost.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                    <div>
                      <h4 className="text-lg font-medium text-gray-900">
                        {selectedHost.name}
                      </h4>
                      <p className="text-gray-600">{selectedHost.email}</p>
                      {selectedHost.phone && (
                        <p className="text-gray-600">{selectedHost.phone}</p>
                      )}
                    </div>
                  </div>

                  {/* Bio */}
                  {selectedHost.bio && (
                    <div>
                      <h5 className="font-medium text-gray-900 mb-2">About</h5>
                      <p className="text-gray-600">{selectedHost.bio}</p>
                    </div>
                  )}

                  {/* Verification */}
                  <div>
                    <h5 className="font-medium text-gray-900 mb-2">
                      Verification Status
                    </h5>
                    <HostVerification host={selectedHost} />
                    {selectedHost.verificationReason && (
                      <p className="mt-2 text-sm text-gray-600">
                        Reason: {selectedHost.verificationReason}
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex justify-end space-x-3 pt-4 border-t">
                    {selectedHost.verificationStatus === "pending" && (
                      <>
                        <button
                          onClick={() =>
                            handleVerificationUpdate(
                              selectedHost._id,
                              "approved"
                            )
                          }
                          className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
                        >
                          Approve Verification
                        </button>
                        <button
                          onClick={() =>
                            handleVerificationUpdate(
                              selectedHost._id,
                              "rejected",
                              "Did not meet verification requirements"
                            )
                          }
                          className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700"
                        >
                          Reject Verification
                        </button>
                      </>
                    )}

                    {selectedHost.status !== "suspended" && (
                      <button
                        onClick={() =>
                          handleSuspendHost(
                            selectedHost._id,
                            "Violation of terms"
                          )
                        }
                        className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700"
                      >
                        Suspend Host
                      </button>
                    )}

                    <button
                      onClick={() => setShowHostModal(false)}
                      className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
