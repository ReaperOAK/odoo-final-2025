import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  MapPinIcon,
  StarIcon,
  ShieldCheckIcon,
  ClockIcon,
  CurrencyDollarIcon,
  UserIcon,
  CalendarIcon,
  PhotoIcon,
  ArrowLeftIcon,
  HeartIcon,
  ShareIcon,
  FlagIcon,
} from "@heroicons/react/24/outline";
import { HeartIcon as HeartIconSolid } from "@heroicons/react/24/solid";
import { listingsAPI } from "../api/listings";
import { ordersAPI } from "../api/orders";
import { useAuth } from "../context/AuthContext";
import DateRangePicker from "../components/DateRangePicker";
import RazorpayCheckout from "../components/RazorpayCheckout";
import HostVerification from "../components/HostVerification";
import toast from "react-hot-toast";
import { format, differenceInDays, differenceInHours, addDays } from "date-fns";
import clsx from "clsx";

const ListingDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [listing, setListing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedDates, setSelectedDates] = useState({
    start: null,
    end: null,
  });
  const [quantity, setQuantity] = useState(1);
  const [isBooking, setIsBooking] = useState(false);
  const [pricing, setPricing] = useState(null);
  const [availability, setAvailability] = useState(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isFavorited, setIsFavorited] = useState(false);
  const [showAllImages, setShowAllImages] = useState(false);

  useEffect(() => {
    loadListing();
  }, [id]);

  useEffect(() => {
    if (selectedDates.start && selectedDates.end && listing) {
      calculatePricing();
      checkAvailability();
    }
  }, [selectedDates, quantity, listing]);

  const loadListing = async () => {
    try {
      setLoading(true);
      const response = await listingsAPI.getListing(id);

      if (response.success) {
        setListing(response.data);
      } else {
        throw new Error(response.message || "Listing not found");
      }
    } catch (error) {
      console.error("Error loading listing:", error);
      toast.error("Failed to load listing");
      navigate("/listings");
    } finally {
      setLoading(false);
    }
  };

  const calculatePricing = async () => {
    if (!selectedDates.start || !selectedDates.end || !listing) return;

    try {
      const orderData = {
        listingId: listing._id,
        startDate: selectedDates.start,
        endDate: selectedDates.end,
        quantity,
      };

      const response = await ordersAPI.calculatePricing(orderData);

      if (response.success) {
        setPricing(response.data);
      }
    } catch (error) {
      console.error("Error calculating pricing:", error);
    }
  };

  const checkAvailability = async () => {
    if (!selectedDates.start || !selectedDates.end || !listing) return;

    try {
      const response = await listingsAPI.checkAvailability(listing._id, {
        start: selectedDates.start.toISOString(),
        end: selectedDates.end.toISOString(),
        qty: quantity,
      });

      setAvailability(response.data);
    } catch (error) {
      console.error("Error checking availability:", error);
      setAvailability({
        available: false,
        message: "Unable to check availability",
      });
    }
  };

  const handleBooking = async () => {
    if (!user) {
      toast.error("Please login to book this item");
      navigate("/login");
      return;
    }

    if (!selectedDates.start || !selectedDates.end) {
      toast.error("Please select booking dates");
      return;
    }

    if (!availability?.available) {
      toast.error("This item is not available for selected dates");
      return;
    }

    setIsBooking(true);

    try {
      // Create order
      const orderData = {
        listingId: listing._id,
        startDate: selectedDates.start,
        endDate: selectedDates.end,
        quantity,
      };

      const response = await ordersAPI.createOrder(orderData);

      if (response.success) {
        const order = response.data;

        // Proceed to payment
        const paymentData = {
          orderId: order._id,
          amount: order.totalAmount,
          currency: "INR",
        };

        // For demo purposes, we'll use mock payment
        handlePaymentSuccess({
          orderId: order._id,
          paymentId: `mock_${Date.now()}`,
          amount: order.totalAmount,
        });
      } else {
        throw new Error(response.message || "Failed to create booking");
      }
    } catch (error) {
      console.error("Error creating booking:", error);
      toast.error(error.message || "Failed to create booking");
    } finally {
      setIsBooking(false);
    }
  };

  const handlePaymentSuccess = (paymentData) => {
    toast.success("Booking confirmed successfully!");
    navigate("/my-bookings");
  };

  const handlePaymentFailure = (error) => {
    toast.error("Payment failed. Please try again.");
    setIsBooking(false);
  };

  const toggleFavorite = () => {
    setIsFavorited(!isFavorited);
    toast.success(
      isFavorited ? "Removed from favorites" : "Added to favorites"
    );
  };

  const shareListing = () => {
    if (navigator.share) {
      navigator.share({
        title: listing.title,
        text: listing.description,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success("Link copied to clipboard");
    }
  };

  const getTimePeriod = () => {
    if (!selectedDates.start || !selectedDates.end) return 0;

    if (listing.unitType === "hour") {
      return differenceInHours(selectedDates.end, selectedDates.start);
    } else if (listing.unitType === "week") {
      return Math.ceil(
        differenceInDays(selectedDates.end, selectedDates.start) / 7
      );
    } else {
      return differenceInDays(selectedDates.end, selectedDates.start);
    }
  };

  const nextImage = () => {
    if (listing.images.length > 0) {
      setCurrentImageIndex((prev) => (prev + 1) % listing.images.length);
    }
  };

  const prevImage = () => {
    if (listing.images.length > 0) {
      setCurrentImageIndex((prev) =>
        prev === 0 ? listing.images.length - 1 : prev - 1
      );
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="h-96 bg-gray-200 rounded-lg"></div>
            <div className="space-y-4">
              <div className="h-8 bg-gray-200 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              <div className="h-32 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          Listing not found
        </h2>
        <p className="text-gray-600 mb-8">
          The listing you're looking for doesn't exist or has been removed.
        </p>
        <Link
          to="/listings"
          className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors duration-200"
        >
          <ArrowLeftIcon className="w-5 h-5 mr-2" />
          Back to Listings
        </Link>
      </div>
    );
  }

  const host = listing.ownerId || {};
  const hasImages = listing.images && listing.images.length > 0;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Back Button */}
      <button
        onClick={() => navigate(-1)}
        className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-6 transition-colors duration-200"
      >
        <ArrowLeftIcon className="w-5 h-5 mr-2" />
        Back
      </button>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Images and Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Images */}
          {hasImages ? (
            <div className="space-y-4">
              {/* Main Image */}
              <div className="relative aspect-video bg-gray-100 rounded-lg overflow-hidden">
                <img
                  src={listing.images[currentImageIndex]}
                  alt={listing.title}
                  className="w-full h-full object-cover"
                />

                {listing.images.length > 1 && (
                  <>
                    <button
                      onClick={prevImage}
                      className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white/80 backdrop-blur-sm p-2 rounded-full hover:bg-white transition-colors duration-200"
                    >
                      <ArrowLeftIcon className="w-5 h-5" />
                    </button>
                    <button
                      onClick={nextImage}
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white/80 backdrop-blur-sm p-2 rounded-full hover:bg-white transition-colors duration-200"
                    >
                      <ArrowLeftIcon className="w-5 h-5 transform rotate-180" />
                    </button>
                  </>
                )}

                {/* Image Counter */}
                <div className="absolute bottom-4 right-4 bg-black/50 text-white px-3 py-1 rounded-full text-sm">
                  {currentImageIndex + 1} / {listing.images.length}
                </div>

                {/* View All Images Button */}
                {listing.images.length > 1 && (
                  <button
                    onClick={() => setShowAllImages(true)}
                    className="absolute bottom-4 left-4 bg-white text-gray-900 px-3 py-1 rounded-full text-sm hover:bg-gray-100 transition-colors duration-200"
                  >
                    <PhotoIcon className="w-4 h-4 inline mr-1" />
                    View all {listing.images.length} photos
                  </button>
                )}
              </div>

              {/* Thumbnail Grid */}
              {listing.images.length > 1 && (
                <div className="grid grid-cols-5 gap-2">
                  {listing.images.slice(0, 5).map((image, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentImageIndex(index)}
                      className={clsx(
                        "aspect-square rounded-lg overflow-hidden border-2 transition-all duration-200",
                        currentImageIndex === index
                          ? "border-primary-500 ring-2 ring-primary-200"
                          : "border-gray-200 hover:border-gray-300"
                      )}
                    >
                      <img
                        src={image}
                        alt={`${listing.title} ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center">
              <div className="text-center text-gray-400">
                <PhotoIcon className="w-16 h-16 mx-auto mb-2" />
                <p>No images available</p>
              </div>
            </div>
          )}

          {/* Listing Details */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  {listing.title}
                </h1>
                <div className="flex items-center space-x-4 text-sm text-gray-600">
                  <div className="flex items-center">
                    <MapPinIcon className="w-4 h-4 mr-1" />
                    {listing.location}
                  </div>
                  {listing.averageRating && (
                    <div className="flex items-center">
                      <StarIcon className="w-4 h-4 mr-1 text-yellow-400 fill-current" />
                      {listing.averageRating.toFixed(1)}
                      {listing.totalReviews &&
                        ` (${listing.totalReviews} reviews)`}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={toggleFavorite}
                  className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                >
                  {isFavorited ? (
                    <HeartIconSolid className="w-5 h-5 text-red-500" />
                  ) : (
                    <HeartIcon className="w-5 h-5 text-gray-600" />
                  )}
                </button>
                <button
                  onClick={shareListing}
                  className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                >
                  <ShareIcon className="w-5 h-5 text-gray-600" />
                </button>
              </div>
            </div>

            {/* Host Info */}
            <div className="flex items-center space-x-3 mb-6 p-4 bg-gray-50 rounded-lg">
              {host.profileImage ? (
                <img
                  src={host.profileImage}
                  alt={host.name || host.displayName}
                  className="w-12 h-12 rounded-full object-cover"
                />
              ) : (
                <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                  <UserIcon className="w-6 h-6 text-gray-400" />
                </div>
              )}
              <div className="flex-1">
                <h3 className="font-medium text-gray-900">
                  Hosted by {host.name || host.displayName || "Host"}
                </h3>
                <div className="flex items-center space-x-2 mt-1">
                  <HostVerification host={host} size="small" />
                  {host.averageRating && (
                    <div className="flex items-center text-sm text-gray-600">
                      <StarIcon className="w-3 h-3 mr-1 text-yellow-400 fill-current" />
                      {host.averageRating.toFixed(1)}
                    </div>
                  )}
                </div>
              </div>
              <Link
                to={`/hosts/${host._id}`}
                className="text-primary-600 hover:text-primary-700 text-sm font-medium"
              >
                View Profile
              </Link>
            </div>

            {/* Description */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                Description
              </h3>
              <p className="text-gray-700 whitespace-pre-wrap">
                {listing.description}
              </p>
            </div>

            {/* Features */}
            {listing.features && listing.features.length > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  Features
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {listing.features.map((feature, index) => (
                    <div
                      key={index}
                      className="flex items-center space-x-2 text-sm text-gray-700"
                    >
                      <div className="w-2 h-2 bg-primary-600 rounded-full"></div>
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Policies */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                Booking Policies
              </h3>
              <div className="space-y-2 text-sm text-gray-700">
                {listing.policies?.cancellationPolicy && (
                  <div className="flex items-center space-x-2">
                    <ClockIcon className="w-4 h-4 text-gray-400" />
                    <span>
                      Cancellation: {listing.policies.cancellationPolicy}
                    </span>
                  </div>
                )}
                {listing.policies?.minimumBookingPeriod && (
                  <div className="flex items-center space-x-2">
                    <CalendarIcon className="w-4 h-4 text-gray-400" />
                    <span>
                      Minimum booking: {listing.policies.minimumBookingPeriod}{" "}
                      {listing.unitType}
                      {listing.policies.minimumBookingPeriod > 1 ? "s" : ""}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Booking Widget */}
        <div className="lg:col-span-1">
          <div className="sticky top-8 bg-white rounded-lg shadow-lg border p-6">
            {/* Pricing */}
            <div className="mb-6">
              <div className="flex items-baseline space-x-2">
                <span className="text-3xl font-bold text-gray-900">
                  ₹{listing.basePrice.toLocaleString()}
                </span>
                <span className="text-gray-600">/ {listing.unitType}</span>
              </div>
              {listing.totalQuantity && (
                <p className="text-sm text-gray-600 mt-1">
                  {listing.totalQuantity} available
                </p>
              )}
            </div>

            {/* Date Selection */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Dates
              </label>
              <DateRangePicker
                startDate={selectedDates.start}
                endDate={selectedDates.end}
                onDatesChange={setSelectedDates}
                minDate={addDays(new Date(), 1)}
                unitType={listing.unitType}
              />
            </div>

            {/* Quantity Selection */}
            {listing.totalQuantity > 1 && (
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Quantity
                </label>
                <select
                  value={quantity}
                  onChange={(e) => setQuantity(parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  {[...Array(Math.min(listing.totalQuantity, 10))].map(
                    (_, i) => (
                      <option key={i + 1} value={i + 1}>
                        {i + 1}
                      </option>
                    )
                  )}
                </select>
              </div>
            )}

            {/* Availability Status */}
            {selectedDates.start && selectedDates.end && (
              <div className="mb-6">
                {availability === null ? (
                  <div className="flex items-center space-x-2 text-gray-600">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-600"></div>
                    <span className="text-sm">Checking availability...</span>
                  </div>
                ) : availability.available ? (
                  <div className="flex items-center space-x-2 text-green-600">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm font-medium">
                      Available for selected dates
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2 text-red-600">
                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                    <span className="text-sm font-medium">
                      {availability.message || "Not available"}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Pricing Breakdown */}
            {pricing && selectedDates.start && selectedDates.end && (
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-3">
                  Price Breakdown
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>
                      ₹{listing.basePrice} × {getTimePeriod()}{" "}
                      {listing.unitType}
                      {getTimePeriod() > 1 ? "s" : ""}
                      {quantity > 1 && ` × ${quantity}`}
                    </span>
                    <span>₹{pricing.subtotal?.toLocaleString()}</span>
                  </div>
                  {pricing.platformFee && (
                    <div className="flex justify-between">
                      <span>Platform fee</span>
                      <span>₹{pricing.platformFee.toLocaleString()}</span>
                    </div>
                  )}
                  {pricing.depositAmount && (
                    <div className="flex justify-between text-orange-600">
                      <span>Security deposit</span>
                      <span>₹{pricing.depositAmount.toLocaleString()}</span>
                    </div>
                  )}
                  <div className="border-t border-gray-200 pt-2 flex justify-between font-medium">
                    <span>Total</span>
                    <span>₹{pricing.totalAmount?.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Booking Button */}
            {user?.id === host._id ? (
              <button
                disabled
                className="w-full py-3 bg-gray-100 text-gray-500 rounded-lg font-medium cursor-not-allowed"
              >
                This is your listing
              </button>
            ) : (
              <RazorpayCheckout
                orderData={
                  pricing
                    ? {
                        orderId: null, // Will be created during booking
                        amount: pricing.totalAmount,
                        currency: "INR",
                      }
                    : null
                }
                onSuccess={handlePaymentSuccess}
                onFailure={handlePaymentFailure}
                disabled={
                  !selectedDates.start ||
                  !selectedDates.end ||
                  !availability?.available ||
                  isBooking
                }
                buttonText={isBooking ? "Booking..." : "Book Now"}
                className="w-full"
                mockMode={true} // For demo
              />
            )}

            {/* Contact Host */}
            <button className="w-full mt-3 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors duration-200">
              Contact Host
            </button>

            {/* Report */}
            <button className="w-full mt-2 py-2 text-gray-500 text-sm hover:text-gray-700 transition-colors duration-200 flex items-center justify-center">
              <FlagIcon className="w-4 h-4 mr-1" />
              Report this listing
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ListingDetail;
