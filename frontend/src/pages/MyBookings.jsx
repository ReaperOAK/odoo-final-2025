import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { rentalsAPI } from "../api/rentals";
import StatusChip from "../components/StatusChip";
import { format } from "date-fns";
import {
  CalendarIcon,
  CurrencyDollarIcon,
  ClockIcon,
  PhotoIcon,
} from "@heroicons/react/24/outline";

export default function MyBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all"); // all, confirmed, picked_up, returned, cancelled

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const response = await rentalsAPI.getMyRentals();
      setBookings(response.data?.rentals || []);
    } catch (error) {
      console.error("Failed to fetch bookings:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelBooking = async (bookingId) => {
    if (!confirm("Are you sure you want to cancel this booking?")) return;

    try {
      await rentalsAPI.cancelRental(bookingId);
      await fetchBookings(); // Refresh the list
    } catch (error) {
      console.error("Failed to cancel booking:", error);
      alert("Failed to cancel booking. Please try again.");
    }
  };

  const filteredBookings = bookings.filter((booking) => {
    if (filter === "all") return true;
    return booking.status === filter;
  });

  const getStatusCounts = () => {
    return {
      all: bookings.length,
      confirmed: bookings.filter((b) => b.status === "confirmed").length,
      picked_up: bookings.filter((b) => b.status === "picked_up").length,
      returned: bookings.filter((b) => b.status === "returned").length,
      cancelled: bookings.filter((b) => b.status === "cancelled").length,
    };
  };

  const statusCounts = getStatusCounts();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-48 mb-8"></div>
            <div className="grid gap-6">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="bg-white rounded-xl shadow-sm p-6">
                  <div className="flex items-start space-x-4">
                    <div className="w-24 h-24 bg-gray-200 rounded-lg"></div>
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My Bookings</h1>
          <p className="text-gray-600">Manage your equipment rentals</p>
        </div>

        {/* Filter Tabs */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <div className="flex flex-wrap gap-2">
            {[
              { key: "all", label: "All Bookings", count: statusCounts.all },
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
                onClick={() => setFilter(tab.key)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filter === tab.key
                    ? "bg-brand text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {tab.label} ({tab.count})
              </button>
            ))}
          </div>
        </div>

        {/* Bookings List */}
        {filteredBookings.length > 0 ? (
          <div className="space-y-6">
            {filteredBookings.map((booking) => (
              <BookingCard
                key={booking._id}
                booking={booking}
                onCancel={handleCancelBooking}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="w-24 h-24 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
              <CalendarIcon className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {filter === "all" ? "No bookings yet" : `No ${filter} bookings`}
            </h3>
            <p className="text-gray-600 mb-4">
              {filter === "all"
                ? "You haven't made any equipment rentals yet."
                : `You don't have any ${filter} bookings at the moment.`}
            </p>
            {filter === "all" && (
              <Link
                to="/products"
                className="inline-flex items-center bg-brand text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                Browse Equipment
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function BookingCard({ booking, onCancel }) {
  const product = booking.product;
  const canCancel =
    booking.status === "confirmed" && new Date(booking.startDate) > new Date();

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="p-6">
        <div className="flex items-start space-x-4">
          {/* Product Image */}
          <div className="flex-shrink-0">
            <div className="w-24 h-24 bg-gray-100 rounded-lg overflow-hidden">
              {product?.images?.[0] ? (
                <img
                  src={product.images[0]}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <PhotoIcon className="w-8 h-8 text-gray-400" />
                </div>
              )}
            </div>
          </div>

          {/* Booking Details */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">
                  {product?.name || "Product not found"}
                </h3>
                <StatusChip status={booking.status} />
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-brand">
                  ₹{booking.totalPrice}
                </div>
                <div className="text-sm text-gray-500">Total Cost</div>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="flex items-center text-gray-600">
                <CalendarIcon className="w-4 h-4 mr-2" />
                <div>
                  <div className="font-medium">Start Date</div>
                  <div>
                    {format(new Date(booking.startDate), "MMM dd, yyyy HH:mm")}
                  </div>
                </div>
              </div>

              <div className="flex items-center text-gray-600">
                <ClockIcon className="w-4 h-4 mr-2" />
                <div>
                  <div className="font-medium">End Date</div>
                  <div>
                    {format(new Date(booking.endDate), "MMM dd, yyyy HH:mm")}
                  </div>
                </div>
              </div>

              <div className="flex items-center text-gray-600">
                <CurrencyDollarIcon className="w-4 h-4 mr-2" />
                <div>
                  <div className="font-medium">Duration</div>
                  <div>
                    {Math.ceil(
                      (new Date(booking.endDate) -
                        new Date(booking.startDate)) /
                        (1000 * 60 * 60 * 24)
                    )}{" "}
                    day(s)
                  </div>
                </div>
              </div>
            </div>

            {/* Additional Info */}
            {booking.notes && (
              <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-700">{booking.notes}</p>
              </div>
            )}

            {/* Actions */}
            <div className="mt-4 flex items-center justify-between">
              <div className="text-xs text-gray-500">
                Booked on {format(new Date(booking.createdAt), "MMM dd, yyyy")}
              </div>

              <div className="flex space-x-3">
                {product && (
                  <Link
                    to={`/products/${product._id}`}
                    className="text-brand hover:text-blue-700 text-sm font-medium"
                  >
                    View Product
                  </Link>
                )}

                {canCancel && (
                  <button
                    onClick={() => onCancel(booking._id)}
                    className="text-red-600 hover:text-red-700 text-sm font-medium"
                  >
                    Cancel Booking
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
