import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  MapPinIcon,
  StarIcon,
  ArrowLeftIcon,
  PhotoIcon,
  CalendarIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { listingsAPI } from "../api/listings";
import { ordersAPI } from "../api/orders";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";

const ListingDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [listing, setListing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  
  // Booking modal state
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [bookingData, setBookingData] = useState({
    startDate: '',
    endDate: '',
    quantity: 1
  });
  const [bookingLoading, setBookingLoading] = useState(false);

  useEffect(() => {
    loadListing();
  }, [id]);

  const loadListing = async () => {
    try {
      setLoading(true);
      console.log("Starting to load listing with ID:", id);
      const response = await listingsAPI.getListing(id);
      console.log("Full API response:", response);

      if (response.success) {
        console.log("API response data:", response.data);
        console.log("Listing from response:", response.data.listing);
        setListing(response.data.listing);
        console.log("Listing set in state");

        if (response.data.availability) {
          console.log("Backend availability:", response.data.availability);
        }
        if (response.data.pricing) {
          console.log("Backend pricing:", response.data.pricing);
        }
      } else {
        console.log("API response failed:", response);
        throw new Error(response.message || "Listing not found");
      }
    } catch (error) {
      console.error("Error loading listing:", error);
      toast.error("Failed to load listing");
      navigate("/listings");
    } finally {
      console.log("Setting loading to false");
      setLoading(false);
    }
  };

  const nextImage = () => {
    if (listing?.images && listing.images.length > 0) {
      setCurrentImageIndex((prev) => (prev + 1) % listing.images.length);
    }
  };

  const prevImage = () => {
    if (listing?.images && listing.images.length > 0) {
      setCurrentImageIndex((prev) =>
        prev === 0 ? listing.images.length - 1 : prev - 1
      );
    }
  };

  // Booking functions
  const getTomorrowDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  };

  const openBookingModal = () => {
    if (!user) {
      toast.error("Please login to book this item");
      navigate("/login");
      return;
    }
    setShowBookingModal(true);
  };

  const closeBookingModal = () => {
    setShowBookingModal(false);
    setBookingData({
      startDate: '',
      endDate: '',
      quantity: 1
    });
  };

  const calculateDuration = () => {
    if (!bookingData.startDate || !bookingData.endDate) return 0;
    const start = new Date(bookingData.startDate);
    const end = new Date(bookingData.endDate);
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays || 1;
  };

  const calculateTotal = () => {
    const duration = calculateDuration();
    const basePrice = Number(listing?.basePrice || 0);
    const quantity = Number(bookingData.quantity);
    return duration * basePrice * quantity;
  };

  const handleBooking = async () => {
    if (!bookingData.startDate || !bookingData.endDate) {
      toast.error("Please select start and end dates");
      return;
    }

    if (new Date(bookingData.startDate) >= new Date(bookingData.endDate)) {
      toast.error("End date must be after start date");
      return;
    }

    if (bookingData.quantity < 1) {
      toast.error("Quantity must be at least 1");
      return;
    }

    try {
      setBookingLoading(true);
      
      const duration = calculateDuration();
      const unitPrice = Number(listing.basePrice);
      const subtotal = calculateTotal();
      const depositAmount = listing.depositType === 'percentage' 
        ? (subtotal * Number(listing.depositValue)) / 100
        : Number(listing.depositValue || 0);

      const orderData = {
        lineItems: [{
          listingId: listing._id,
          quantity: Number(bookingData.quantity),
          startDate: bookingData.startDate,
          endDate: bookingData.endDate,
          unitPrice: unitPrice,
          duration: duration,
          subtotal: subtotal,
          depositAmount: depositAmount
        }],
        paymentMode: 'razorpay',
        metadata: {
          source: 'listing_detail_page'
        }
      };

      console.log("Creating order with data:", orderData);
      const response = await ordersAPI.createOrder(orderData);
      
      if (response.success) {
        toast.success("Booking created successfully!");
        closeBookingModal();
        // Navigate to My Bookings page to see the new booking
        navigate("/my-bookings");
      } else {
        toast.error(response.message || "Failed to create booking");
      }
    } catch (error) {
      console.error("Booking error:", error);
      toast.error("Failed to create booking. Please try again.");
    } finally {
      setBookingLoading(false);
    }
  };

  console.log("Component render - loading:", loading, "listing:", listing);

  if (loading) {
    console.log("Showing loading state");
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
    console.log("Listing is null/undefined, showing not found page");
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

  console.log("Rendering listing detail for:", listing?.title);

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
          {/* Title Section */}
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {String(listing.title || "No Title")}
            </h1>
            <div className="flex items-center space-x-4 text-gray-600">
              <div className="flex items-center">
                <MapPinIcon className="w-5 h-5 mr-1" />
                <span>
                  {typeof listing.location === "object"
                    ? `${listing.location?.city || ""}, ${
                        listing.location?.state || ""
                      }`
                    : String(listing.location || "Location not specified")}
                </span>
              </div>
              {listing.ratings?.average > 0 && (
                <div className="flex items-center">
                  <StarIcon className="w-5 h-5 mr-1 text-yellow-400 fill-current" />
                  <span>{Number(listing.ratings.average).toFixed(1)}</span>
                  <span className="ml-1">
                    ({Number(listing.ratings.count)} reviews)
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Debug Info */}
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <h2 className="text-xl font-semibold mb-2 text-blue-800">
              ✅ Listing Detail is Working!
            </h2>
            <div className="text-sm text-blue-700 space-y-1">
              <p>
                <strong>Listing ID:</strong> {String(listing._id || "N/A")}
              </p>
              <p>
                <strong>Title:</strong> {String(listing.title || "N/A")}
              </p>
              <p>
                <strong>Has Images:</strong> {hasImages ? "Yes" : "No"} (
                {Number(listing.images?.length || 0)} images)
              </p>
              <p>
                <strong>Base Price:</strong> ₹
                {Number(listing.basePrice || 0).toLocaleString()}
              </p>
              <p>
                <strong>Category:</strong>{" "}
                {String(listing.category || "Not specified")}
              </p>
              <p>
                <strong>Status:</strong> {String(listing.status || "Unknown")}
              </p>
              <p>
                <strong>Available Quantity:</strong>{" "}
                {Number(listing.availableQuantity || 0)} units
              </p>
            </div>
          </div>

          {/* Images section */}
          {hasImages ? (
            <div className="space-y-4">
              <div className="relative aspect-video bg-gray-100 rounded-lg overflow-hidden">
                <img
                  src={listing.images[currentImageIndex]}
                  alt={String(listing.title || "Listing image")}
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
                <div className="absolute bottom-4 right-4 bg-black/50 text-white px-3 py-1 rounded-full text-sm">
                  {currentImageIndex + 1} / {listing.images.length}
                </div>
              </div>
            </div>
          ) : (
            <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center">
              <div className="text-center text-gray-400">
                <PhotoIcon className="w-16 h-16 mx-auto mb-2" />
                <p>No images available</p>
              </div>
            </div>
          )}

          {/* Description */}
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <h3 className="text-xl font-semibold mb-4">Description</h3>
            <p className="text-gray-700 leading-relaxed">
              {String(listing.description || "No description available")}
            </p>
          </div>
        </div>

        {/* Right Column - Booking Widget */}
        <div className="space-y-6">
          <div className="bg-white border border-gray-200 rounded-lg p-6 sticky top-8">
            <div className="mb-4">
              <div className="text-2xl font-bold text-gray-900">
                ₹{Number(listing.basePrice || 0).toLocaleString()}/day
              </div>
              <p className="text-gray-600">
                {String(listing.unitType || "per unit")}
              </p>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-gray-600">Category:</span>
                  <div className="font-medium">
                    {String(listing.category || "N/A")}
                  </div>
                </div>
                <div>
                  <span className="text-gray-600">Available:</span>
                  <div className="font-medium">
                    {Number(listing.availableQuantity || 0)} units
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-200">
                <h4 className="font-semibold mb-2">Features</h4>
                {listing.features && listing.features.length > 0 ? (
                  <ul className="text-sm text-gray-600 space-y-1">
                    {listing.features.map((feature, index) => (
                      <li key={index} className="flex items-center">
                        <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                        {String(feature)}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-gray-500">No features listed</p>
                )}
              </div>

              <div className="pt-4 border-t border-gray-200">
                <button
                  className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors duration-200 font-semibold disabled:opacity-50"
                  onClick={openBookingModal}
                  disabled={!listing?.isAvailable || listing?.availableQuantity === 0}
                >
                  {listing?.isAvailable && listing?.availableQuantity > 0 
                    ? "Book Now" 
                    : "Currently Unavailable"
                  }
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Booking Modal */}
      {showBookingModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Book This Item</h3>
              <button
                onClick={closeBookingModal}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4">
              {/* Listing Info */}
              <div className="flex items-start space-x-3 p-4 bg-gray-50 rounded-lg">
                {listing?.images?.[0] && (
                  <img
                    src={listing.images[0]}
                    alt={String(listing.title)}
                    className="w-16 h-16 object-cover rounded-lg"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-gray-900 truncate">
                    {String(listing?.title || 'N/A')}
                  </h4>
                  <p className="text-sm text-gray-600">
                    ₹{Number(listing?.basePrice || 0).toLocaleString()}/day
                  </p>
                  <p className="text-xs text-gray-500">
                    {Number(listing?.availableQuantity || 0)} available
                  </p>
                </div>
              </div>

              {/* Date Selection */}
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={bookingData.startDate}
                    onChange={(e) => setBookingData(prev => ({ ...prev, startDate: e.target.value }))}
                    min={getTomorrowDate()}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={bookingData.endDate}
                    onChange={(e) => setBookingData(prev => ({ ...prev, endDate: e.target.value }))}
                    min={bookingData.startDate || getTomorrowDate()}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Quantity
                  </label>
                  <input
                    type="number"
                    value={bookingData.quantity}
                    onChange={(e) => setBookingData(prev => ({ ...prev, quantity: Math.max(1, parseInt(e.target.value) || 1) }))}
                    min="1"
                    max={listing?.availableQuantity || 1}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Pricing Summary */}
              {bookingData.startDate && bookingData.endDate && (
                <div className="bg-blue-50 p-4 rounded-lg space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Duration:</span>
                    <span>{calculateDuration()} days</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Price per day:</span>
                    <span>₹{Number(listing?.basePrice || 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Quantity:</span>
                    <span>{bookingData.quantity}</span>
                  </div>
                  <div className="flex justify-between text-sm border-t border-blue-200 pt-2">
                    <span>Subtotal:</span>
                    <span>₹{calculateTotal().toLocaleString()}</span>
                  </div>
                  {listing?.depositValue > 0 && (
                    <div className="flex justify-between text-sm text-blue-700">
                      <span>Security Deposit:</span>
                      <span>
                        ₹{(
                          listing.depositType === 'percentage'
                            ? (calculateTotal() * Number(listing.depositValue)) / 100
                            : Number(listing.depositValue)
                        ).toLocaleString()}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between font-semibold text-base border-t border-blue-200 pt-2">
                    <span>Total:</span>
                    <span>₹{(calculateTotal() + (
                      listing?.depositType === 'percentage'
                        ? (calculateTotal() * Number(listing?.depositValue || 0)) / 100
                        : Number(listing?.depositValue || 0)
                    )).toLocaleString()}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex space-x-3 p-6 border-t border-gray-200">
              <button
                onClick={closeBookingModal}
                className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleBooking}
                disabled={!bookingData.startDate || !bookingData.endDate || bookingLoading}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {bookingLoading ? "Creating..." : "Confirm Booking"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ListingDetail;
