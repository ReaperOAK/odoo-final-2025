import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import DateRangePicker from "./DateRangePicker";
import { rentalsAPI } from "../api/rentals";
import {
  CurrencyDollarIcon,
  ClockIcon,
  ShieldCheckIcon,
} from "@heroicons/react/24/outline";

export default function BookingWidget({ product, onBook }) {
  const { user } = useAuth();
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [quantity, setQuantity] = useState(1); // NEW
  const [isAvailable, setIsAvailable] = useState(null);
  const [price, setPrice] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (startDate && endDate && product._id) {
      const timer = setTimeout(() => {
        checkAvailabilityAndPrice();
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [startDate, endDate, product._id, quantity]);

  const checkAvailabilityAndPrice = async () => {
    try {
      setLoading(true);
      setError("");

      const [availabilityRes, priceRes] = await Promise.all([
        rentalsAPI.checkAvailability(product._id, startDate, endDate, quantity),
        rentalsAPI.calculatePrice(product._id, startDate, endDate)
      ]);

      setIsAvailable(availabilityRes.data?.isAvailable);
      setPrice(priceRes.data?.data);
    } catch (err) {
      setError("Failed to check availability");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleBooking = () => {
    if (!user) {
      window.location.href = "/login";
      return;
    }
    if (!isAvailable) {
      setError("Selected dates are not available");
      return;
    }
    onBook({
      productId: product._id,
      startDate,
      endDate,
      quantity,
      totalPrice: price?.totalPrice,
    });
  };

  const canBook = startDate && endDate && isAvailable && price && user;

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 sticky top-4">
      <div className="mb-6">
        <h3 className="text-xl font-bold text-gray-900 mb-2">
          Reserve this item
        </h3>
        <div className="flex items-center text-sm text-gray-600">
          <ShieldCheckIcon className="w-4 h-4 mr-1" />
          <span>Instant booking confirmation</span>
        </div>
      </div>

      <DateRangePicker
        startDate={startDate}
        endDate={endDate}
        onStartDateChange={setStartDate}
        onEndDateChange={setEndDate}
        className="mb-6"
      />

      {/* Quantity selector */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Number of items
        </label>
        <input
          type="number"
          min="1"
          value={quantity}
          onChange={(e) => setQuantity(parseInt(e.target.value, 10) || 1)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
        />
      </div>

      {/* Availability Status */}
      {loading && startDate && endDate && (
        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center">
            <ClockIcon className="w-4 h-4 mr-2 text-gray-500 animate-spin" />
            <span className="text-sm text-gray-600">
              Checking availability...
            </span>
          </div>
        </div>
      )}

      {!loading && startDate && endDate && isAvailable !== null && (
        <div
          className={`mb-4 p-3 rounded-lg ${
            isAvailable
              ? "bg-green-50 border border-green-200"
              : "bg-red-50 border border-red-200"
          }`}
        >
          <div className="flex items-center">
            <div
              className={`w-2 h-2 rounded-full mr-2 ${
                isAvailable ? "bg-green-500" : "bg-red-500"
              }`}
            />
            <span
              className={`text-sm font-medium ${
                isAvailable ? "text-green-800" : "text-red-800"
              }`}
            >
              {isAvailable
                ? "Available for selected dates"
                : "Not available for selected dates"}
            </span>
          </div>
        </div>
      )}

      {/* Price Breakdown */}
      {price && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center mb-3">
            <CurrencyDollarIcon className="w-5 h-5 mr-2 text-gray-600" />
            <h4 className="font-semibold text-gray-900">Price Breakdown</h4>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">
                ₹{price.breakdown?.dailyRate} × {price.breakdown?.days} day
                {price.breakdown?.days > 1 ? "s" : ""}
              </span>
              <span className="font-medium">
                ₹{price.breakdown?.basePrice}
              </span>
            </div>
            {price.breakdown?.discounts > 0 && (
              <div className="flex justify-between text-green-600">
                <span>Discount</span>
                <span>-₹{price.breakdown.discounts}</span>
              </div>
            )}
            {price.breakdown?.fees > 0 && (
              <div className="flex justify-between text-gray-600">
                <span>Service fees</span>
                <span>₹{price.breakdown.fees}</span>
              </div>
            )}
            <div className="border-t pt-2 flex justify-between font-bold text-lg">
              <span>Total</span>
              <span className="text-brand">₹{price.totalPrice}</span>
            </div>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {/* Book Button */}
      {user ? (
        <button
          onClick={handleBooking}
          disabled={!canBook || loading}
          className="w-full bg-brand text-white py-3 px-4 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
        >
          {loading
            ? "Checking..."
            : canBook
            ? `Book for ₹${price?.totalPrice}`
            : "Select dates to book"}
        </button>
      ) : (
        <div className="space-y-3">
          <p className="text-sm text-gray-600 text-center">
            Please log in to make a booking
          </p>
          <a
            href="/login"
            className="block w-full bg-brand text-white py-3 px-4 rounded-lg font-semibold text-center hover:bg-blue-700 transition-colors"
          >
            Log In to Book
          </a>
        </div>
      )}

      {/* Additional Info */}
      <div className="mt-4 pt-4 border-t text-xs text-gray-500">
        <p>• Free cancellation up to 24 hours before pickup</p>
        <p>• Instant confirmation</p>
        <p>• 24/7 customer support</p>
      </div>
    </div>
  );
}
