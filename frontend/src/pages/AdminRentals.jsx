import { useState, useEffect } from "react";
import { rentalsAPI } from "../api/rentals";
import StatusChip from "../components/StatusChip";
import { format } from "date-fns";
import {
  CalendarIcon,
  CurrencyDollarIcon,
  UserIcon,
  ClockIcon,
  PhotoIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
} from "@heroicons/react/24/outline";

export default function AdminRentals() {
  const [rentals, setRentals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("-createdAt");

  useEffect(() => {
    fetchRentals();
  }, [statusFilter, sortBy]);

  const fetchRentals = async () => {
    try {
      setLoading(true);
      const params = {
        limit: 100,
        sort: sortBy,
      };
      if (statusFilter !== "all") {
        params.status = statusFilter;
      }

      const response = await rentalsAPI.getAllRentals(params);
      setRentals(response.data?.rentals || []);
    } catch (error) {
      console.error("Failed to fetch rentals:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (rentalId, newStatus) => {
    try {
      await rentalsAPI.updateRentalStatus(rentalId, newStatus);
      await fetchRentals(); // Refresh the list
    } catch (error) {
      console.error("Failed to update rental status:", error);
      alert("Failed to update rental status. Please try again.");
    }
  };

  const filteredRentals = rentals.filter((rental) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      rental.user?.name?.toLowerCase().includes(searchLower) ||
      rental.user?.email?.toLowerCase().includes(searchLower) ||
      rental.product?.name?.toLowerCase().includes(searchLower)
    );
  });

  const getStatusCounts = () => {
    return {
      all: rentals.length,
      confirmed: rentals.filter((r) => r.status === "confirmed").length,
      picked_up: rentals.filter((r) => r.status === "picked_up").length,
      returned: rentals.filter((r) => r.status === "returned").length,
      cancelled: rentals.filter((r) => r.status === "cancelled").length,
    };
  };

  const statusCounts = getStatusCounts();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-48 mb-8"></div>
            <div className="space-y-6">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="bg-white rounded-xl shadow-sm p-6">
                  <div className="flex items-start space-x-4">
                    <div className="w-16 h-16 bg-gray-200 rounded-lg"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/4"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Manage Rentals
          </h1>
          <p className="text-gray-600">
            Monitor and manage all rental bookings
          </p>
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search rentals..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-2 focus:ring-brand focus:border-brand"
              />
            </div>

            <div className="flex items-center gap-4">
              {/* Sort */}
              <div className="flex items-center">
                <FunnelIcon className="h-5 w-5 text-gray-400 mr-2" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-brand focus:border-brand"
                >
                  <option value="-createdAt">Newest First</option>
                  <option value="createdAt">Oldest First</option>
                  <option value="startDate">Start Date</option>
                  <option value="-totalPrice">Highest Value</option>
                  <option value="totalPrice">Lowest Value</option>
                </select>
              </div>
            </div>
          </div>

          {/* Status Filter Tabs */}
          <div className="mt-4 flex flex-wrap gap-2">
            {[
              { key: "all", label: "All Rentals", count: statusCounts.all },
              {
                key: "confirmed",
                label: "Confirmed",
                count: statusCounts.confirmed,
              },
              {
                key: "picked_up",
                label: "Active",
                count: statusCounts.picked_up,
              },
              {
                key: "returned",
                label: "Completed",
                count: statusCounts.returned,
              },
              {
                key: "cancelled",
                label: "Cancelled",
                count: statusCounts.cancelled,
              },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setStatusFilter(tab.key)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  statusFilter === tab.key
                    ? "bg-brand text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {tab.label} ({tab.count})
              </button>
            ))}
          </div>
        </div>

        {/* Rentals List */}
        {filteredRentals.length > 0 ? (
          <div className="space-y-6">
            {filteredRentals.map((rental) => (
              <RentalAdminCard
                key={rental._id}
                rental={rental}
                onStatusUpdate={handleStatusUpdate}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="w-24 h-24 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
              <CalendarIcon className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchTerm
                ? "No rentals found"
                : statusFilter === "all"
                ? "No rentals yet"
                : `No ${statusFilter} rentals`}
            </h3>
            <p className="text-gray-600">
              {searchTerm
                ? `No results for "${searchTerm}"`
                : statusFilter === "all"
                ? "Rental bookings will appear here as customers make reservations"
                : `No ${statusFilter} rentals at the moment`}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function RentalAdminCard({ rental, onStatusUpdate }) {
  const product = rental.product;
  const user = rental.user;

  const statusOptions = [
    { value: "confirmed", label: "Confirmed" },
    { value: "picked_up", label: "Picked Up" },
    { value: "returned", label: "Returned" },
    { value: "cancelled", label: "Cancelled" },
  ];

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="p-6">
        <div className="flex items-start space-x-4">
          {/* Product Image */}
          <div className="flex-shrink-0">
            <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden">
              {product?.images?.[0] ? (
                <img
                  src={product.images[0]}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <PhotoIcon className="w-6 h-6 text-gray-400" />
                </div>
              )}
            </div>
          </div>

          {/* Rental Details */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">
                  {product?.name || "Product not found"}
                </h3>
                <div className="flex items-center text-sm text-gray-600 mb-2">
                  <UserIcon className="w-4 h-4 mr-1" />
                  <span>
                    {user?.name || "Unknown User"} ({user?.email || "No email"})
                  </span>
                </div>
                <StatusChip status={rental.status} />
              </div>

              <div className="text-right">
                <div className="text-2xl font-bold text-brand">
                  ${rental.totalPrice}
                </div>
                <div className="text-sm text-gray-500">Total Value</div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm mb-4">
              <div className="flex items-center text-gray-600">
                <CalendarIcon className="w-4 h-4 mr-2" />
                <div>
                  <div className="font-medium">Start Date</div>
                  <div>
                    {format(new Date(rental.startDate), "MMM dd, yyyy HH:mm")}
                  </div>
                </div>
              </div>

              <div className="flex items-center text-gray-600">
                <ClockIcon className="w-4 h-4 mr-2" />
                <div>
                  <div className="font-medium">End Date</div>
                  <div>
                    {format(new Date(rental.endDate), "MMM dd, yyyy HH:mm")}
                  </div>
                </div>
              </div>

              <div className="flex items-center text-gray-600">
                <CurrencyDollarIcon className="w-4 h-4 mr-2" />
                <div>
                  <div className="font-medium">Duration</div>
                  <div>
                    {Math.ceil(
                      (new Date(rental.endDate) - new Date(rental.startDate)) /
                        (1000 * 60 * 60 * 24)
                    )}{" "}
                    day(s)
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-4 border-t">
              <div className="text-xs text-gray-500">
                Booked on {format(new Date(rental.createdAt), "MMM dd, yyyy")}
              </div>

              <div className="flex items-center space-x-3">
                <label className="text-sm font-medium text-gray-700">
                  Status:
                </label>
                <select
                  value={rental.status}
                  onChange={(e) => onStatusUpdate(rental._id, e.target.value)}
                  className="text-sm border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-brand focus:border-brand"
                >
                  {statusOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
