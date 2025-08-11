import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  MapPinIcon,
  StarIcon,
  ArrowLeftIcon,
  PhotoIcon,
} from "@heroicons/react/24/outline";
import { listingsAPI } from "../api/listings";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";

const ListingDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [listing, setListing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

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
                  className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors duration-200 font-semibold"
                  onClick={() =>
                    toast.success(
                      "Booking functionality will be implemented next!"
                    )
                  }
                >
                  Book Now
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ListingDetail;
