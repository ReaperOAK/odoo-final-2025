import { useState } from "react";
import { Link } from "react-router-dom";
import {
  HeartIcon,
  StarIcon,
  MapPinIcon,
  UserIcon,
  ShieldCheckIcon,
  ClockIcon,
  CurrencyDollarIcon,
} from "@heroicons/react/24/outline";
import { HeartIcon as HeartIconSolid } from "@heroicons/react/24/solid";
import { format } from "date-fns";
import clsx from "clsx";

const ListingCard = ({
  listing,
  onFavorite,
  isFavorited = false,
  showHost = true,
  size = "medium", // small, medium, large
}) => {
  const [isImageLoaded, setIsImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  if (!listing) return null;

  const {
    _id,
    title,
    description,
    images,
    category,
    basePrice,
    unitType,
    location,
    totalQuantity,
    ownerId,
    status,
    averageRating,
    totalReviews,
    createdAt,
  } = listing;

  const host = ownerId || {};
  const primaryImage = images && images.length > 0 ? images[0] : null;

  const handleFavoriteClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (onFavorite) {
      onFavorite(_id);
    }
  };

  const getPriceText = () => {
    const price = Number(basePrice).toLocaleString("en-IN", {
      style: "currency",
      currency: "INR",
    });
    const unitText =
      unitType === "hour" ? "hr" : unitType === "day" ? "day" : "week";
    return `${price}/${unitText}`;
  };

  const getAvailabilityText = () => {
    if (status === "disabled") return "Unavailable";
    if (totalQuantity === 0) return "Out of stock";
    if (totalQuantity === 1) return "1 available";
    return `${totalQuantity} available`;
  };

  const getAvailabilityColor = () => {
    if (status === "disabled") return "text-red-600";
    if (totalQuantity === 0) return "text-red-600";
    if (totalQuantity <= 2) return "text-orange-600";
    return "text-green-600";
  };

  const cardSizeClasses = {
    small: "w-full max-w-sm",
    medium: "w-full max-w-md",
    large: "w-full max-w-lg",
  };

  const imageSizeClasses = {
    small: "h-48",
    medium: "h-56",
    large: "h-64",
  };

  return (
    <div
      className={clsx(
        "bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden group",
        cardSizeClasses[size]
      )}
    >
      <Link to={`/listings/${_id}`} className="block">
        {/* Image Section */}
        <div
          className={clsx("relative overflow-hidden", imageSizeClasses[size])}
        >
          {primaryImage ? (
            <>
              <img
                src={primaryImage}
                alt={title}
                className={clsx(
                  "w-full h-full object-cover transition-transform duration-300 group-hover:scale-105",
                  isImageLoaded ? "opacity-100" : "opacity-0"
                )}
                onLoad={() => setIsImageLoaded(true)}
                onError={() => setImageError(true)}
              />
              {!isImageLoaded && !imageError && (
                <div className="absolute inset-0 bg-gray-200 animate-pulse flex items-center justify-center">
                  <div className="text-gray-400">Loading...</div>
                </div>
              )}
              {imageError && (
                <div className="absolute inset-0 bg-gray-100 flex items-center justify-center">
                  <div className="text-center text-gray-400">
                    <div className="w-16 h-16 bg-gray-200 rounded-lg mx-auto mb-2"></div>
                    <p className="text-sm">No image</p>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="w-full h-full bg-gray-100 flex items-center justify-center">
              <div className="text-center text-gray-400">
                <div className="w-16 h-16 bg-gray-200 rounded-lg mx-auto mb-2"></div>
                <p className="text-sm">No image</p>
              </div>
            </div>
          )}

          {/* Favorite Button */}
          <button
            onClick={handleFavoriteClick}
            className="absolute top-3 right-3 p-2 bg-white/80 backdrop-blur-sm rounded-full hover:bg-white transition-colors duration-200 shadow-sm"
          >
            {isFavorited ? (
              <HeartIconSolid className="w-5 h-5 text-red-500" />
            ) : (
              <HeartIcon className="w-5 h-5 text-gray-600 hover:text-red-500" />
            )}
          </button>

          {/* Category Badge */}
          {category && (
            <div className="absolute top-3 left-3 px-3 py-1 bg-primary-600 text-white text-sm font-medium rounded-full">
              {category}
            </div>
          )}

          {/* Status Badge */}
          <div className="absolute bottom-3 left-3 px-2 py-1 bg-white/90 backdrop-blur-sm rounded-md">
            <span
              className={clsx("text-sm font-medium", getAvailabilityColor())}
            >
              {getAvailabilityText()}
            </span>
          </div>
        </div>

        {/* Content Section */}
        <div className="p-4">
          {/* Title and Description */}
          <div className="mb-3">
            <h3 className="text-lg font-semibold text-gray-900 line-clamp-1 mb-1">
              {title}
            </h3>
            {description && (
              <p className="text-gray-600 text-sm line-clamp-2">
                {description}
              </p>
            )}
          </div>

          {/* Host Information */}
          {showHost && host && (
            <div className="flex items-center mb-3 pb-3 border-b border-gray-100">
              <div className="flex items-center space-x-2">
                {host.profileImage ? (
                  <img
                    src={host.profileImage}
                    alt={host.name || host.displayName}
                    className="w-8 h-8 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                    <UserIcon className="w-4 h-4 text-gray-400" />
                  </div>
                )}
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {host.name || host.displayName || "Host"}
                  </p>
                  <div className="flex items-center space-x-1">
                    {host.verified && (
                      <ShieldCheckIcon className="w-3 h-3 text-green-500" />
                    )}
                    {averageRating && (
                      <>
                        <StarIcon className="w-3 h-3 text-yellow-400 fill-current" />
                        <span className="text-xs text-gray-600">
                          {averageRating.toFixed(1)}
                          {totalReviews && ` (${totalReviews})`}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Location and Details */}
          <div className="flex items-center justify-between mb-3">
            {location && (
              <div className="flex items-center text-gray-600">
                <MapPinIcon className="w-4 h-4 mr-1" />
                <span className="text-sm truncate">
                  {typeof location === 'string' ? location : `${location.city}, ${location.state}`}
                </span>
              </div>
            )}
            {createdAt && (
              <div className="flex items-center text-gray-500">
                <ClockIcon className="w-4 h-4 mr-1" />
                <span className="text-xs">
                  {format(new Date(createdAt), "MMM yyyy")}
                </span>
              </div>
            )}
          </div>

          {/* Pricing */}
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <CurrencyDollarIcon className="w-5 h-5 text-green-600 mr-1" />
              <span className="text-xl font-bold text-gray-900">
                {getPriceText()}
              </span>
            </div>

            <button className="px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 transition-colors duration-200">
              Book Now
            </button>
          </div>
        </div>
      </Link>
    </div>
  );
};

export default ListingCard;
