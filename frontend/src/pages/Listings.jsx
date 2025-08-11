import { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  MagnifyingGlassIcon,
  AdjustmentsHorizontalIcon,
  MapPinIcon,
  FunnelIcon,
  XMarkIcon,
  StarIcon,
} from "@heroicons/react/24/outline";
import { listingsAPI } from "../api/listings";
import ListingCard from "../components/ListingCard";
import { useInView } from "react-intersection-observer";
import toast from "react-hot-toast";
import clsx from "clsx";

const Listings = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const [favorites, setFavorites] = useState(new Set());

  // Filter states
  const [filters, setFilters] = useState({
    query: searchParams.get("q") || "",
    category: searchParams.get("category") || "",
    location: searchParams.get("location") || "",
    minPrice: searchParams.get("minPrice") || "",
    maxPrice: searchParams.get("maxPrice") || "",
    unitType: searchParams.get("unitType") || "",
    sortBy: searchParams.get("sortBy") || "newest",
    verifiedOnly: searchParams.get("verifiedOnly") === "true",
  });

  // Infinite scroll trigger
  const { ref: loadMoreRef, inView } = useInView({
    threshold: 0,
    rootMargin: "100px",
  });

  const categories = [
    { value: "electronics", label: "Electronics" },
    { value: "furniture", label: "Furniture" },
    { value: "appliances", label: "Appliances" },
    { value: "tools", label: "Tools" },
    { value: "sports", label: "Sports" },
    { value: "books", label: "Books" },
    { value: "clothing", label: "Clothing" },
    { value: "vehicles", label: "Vehicles" },
    { value: "other", label: "Other" },
  ];

  const sortOptions = [
    { value: "newest", label: "Most Recent" },
    { value: "price", label: "Price: Low to High" },
    { value: "rating", label: "Highest Rated" },
    { value: "popular", label: "Most Popular" },
  ];

  useEffect(() => {
    loadListings(true);
  }, [filters]);

  useEffect(() => {
    if (inView && hasMore && !loading) {
      loadListings(false);
    }
  }, [inView, hasMore, loading]);

  const loadListings = async (reset = false) => {
    try {
      setLoading(true);

      const currentPage = reset ? 1 : page;
      const params = {
        ...filters,
        page: currentPage,
        limit: 12,
      };

      // Clean up empty parameters
      Object.keys(params).forEach((key) => {
        if (
          params[key] === "" ||
          params[key] === null ||
          params[key] === undefined
        ) {
          delete params[key];
        }
      });

      const response = await listingsAPI.getListings(params);

      if (response.success) {
        const {
          listings: newListings,
          pagination,
        } = response.data;

        if (reset) {
          setListings(newListings);
          setPage(2);
        } else {
          setListings((prev) => [...prev, ...newListings]);
          setPage((prev) => prev + 1);
        }

        setHasMore(pagination.hasNext);
      } else {
        throw new Error(response.message || "Failed to load listings");
      }
    } catch (error) {
      console.error("Error loading listings:", error);
      toast.error("Failed to load listings");
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);

    // Update URL params
    const newSearchParams = new URLSearchParams();
    Object.entries(newFilters).forEach(([k, v]) => {
      if (v) {
        newSearchParams.set(k, v);
      }
    });
    setSearchParams(newSearchParams);

    setPage(1);
  };

  const clearFilters = () => {
    const clearedFilters = {
      query: "",
      category: "",
      location: "",
      minPrice: "",
      maxPrice: "",
      unitType: "",
      sortBy: "newest",
      verifiedOnly: false,
    };
    setFilters(clearedFilters);
    setSearchParams({});
    setPage(1);
  };

  const toggleFavorite = (listingId) => {
    setFavorites((prev) => {
      const newFavorites = new Set(prev);
      if (newFavorites.has(listingId)) {
        newFavorites.delete(listingId);
        toast.success("Removed from favorites");
      } else {
        newFavorites.add(listingId);
        toast.success("Added to favorites");
      }
      return newFavorites;
    });
  };

  const hasActiveFilters = Object.values(filters).some(
    (value) => value !== "" && value !== "newest" && value !== false
  );

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Browse Listings
        </h1>
        <p className="text-gray-600">
          Discover amazing items from verified hosts in your area
        </p>
      </div>

      {/* Search and Filters Bar */}
      <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
        <div className="flex flex-col lg:flex-row lg:items-center space-y-4 lg:space-y-0 lg:space-x-4">
          {/* Search Input */}
          <div className="flex-1">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search for items..."
                value={filters.query}
                onChange={(e) => handleFilterChange("query", e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Location Filter */}
          <div className="lg:w-48">
            <div className="relative">
              <MapPinIcon className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Location"
                value={filters.location}
                onChange={(e) => handleFilterChange("location", e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Sort Dropdown */}
          <div className="lg:w-48">
            <select
              value={filters.sortBy}
              onChange={(e) => handleFilterChange("sortBy", e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              {sortOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Filter Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={clsx(
              "inline-flex items-center px-4 py-3 border border-gray-300 rounded-lg transition-colors duration-200",
              showFilters
                ? "bg-primary-50 border-primary-300 text-primary-700"
                : "bg-white text-gray-700 hover:bg-gray-50"
            )}
          >
            <AdjustmentsHorizontalIcon className="w-5 h-5 mr-2" />
            Filters
            {hasActiveFilters && (
              <span className="ml-2 bg-primary-600 text-white text-xs px-2 py-1 rounded-full">
                {
                  Object.values(filters).filter(
                    (v) => v !== "" && v !== "newest" && v !== false
                  ).length
                }
              </span>
            )}
          </button>
        </div>

        {/* Expanded Filters */}
        {showFilters && (
          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Category Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category
                </label>
                <select
                  value={filters.category}
                  onChange={(e) =>
                    handleFilterChange("category", e.target.value)
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="">All Categories</option>
                  {categories.map((category) => (
                    <option key={category.value} value={category.value}>
                      {category.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Price Range */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Min Price
                </label>
                <input
                  type="number"
                  placeholder="₹0"
                  value={filters.minPrice}
                  onChange={(e) =>
                    handleFilterChange("minPrice", e.target.value)
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Max Price
                </label>
                <input
                  type="number"
                  placeholder="₹10000"
                  value={filters.maxPrice}
                  onChange={(e) =>
                    handleFilterChange("maxPrice", e.target.value)
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>

              {/* Unit Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Pricing Unit
                </label>
                <select
                  value={filters.unitType}
                  onChange={(e) =>
                    handleFilterChange("unitType", e.target.value)
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="">All Units</option>
                  <option value="hour">Per Hour</option>
                  <option value="day">Per Day</option>
                  <option value="week">Per Week</option>
                </select>
              </div>
            </div>

            {/* Additional Filters */}
            <div className="mt-4 flex items-center space-x-6">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={filters.verifiedOnly}
                  onChange={(e) =>
                    handleFilterChange("verifiedOnly", e.target.checked)
                  }
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-700">
                  Verified hosts only
                </span>
              </label>
            </div>

            {/* Clear Filters */}
            {hasActiveFilters && (
              <div className="mt-4 flex justify-end">
                <button
                  onClick={clearFilters}
                  className="inline-flex items-center px-3 py-2 text-sm text-gray-600 hover:text-gray-900"
                >
                  <XMarkIcon className="w-4 h-4 mr-1" />
                  Clear all filters
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Results Summary */}
      <div className="flex items-center justify-between mb-6">
        <p className="text-gray-600">
          {loading && listings.length === 0
            ? "Loading listings..."
            : `Showing ${listings.length} listings`}
        </p>

        {hasActiveFilters && (
          <div className="flex items-center space-x-2">
            <FunnelIcon className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-600">Filters active</span>
          </div>
        )}
      </div>

      {/* Listings Grid */}
      {listings.length > 0 ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
            {listings.map((listing) => (
              <ListingCard
                key={listing._id}
                listing={listing}
                onFavorite={toggleFavorite}
                isFavorited={favorites.has(listing._id)}
                size="medium"
              />
            ))}
          </div>

          {/* Load More Trigger */}
          {hasMore && (
            <div ref={loadMoreRef} className="flex justify-center py-8">
              {loading ? (
                <div className="flex items-center space-x-2 text-gray-500">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary-600"></div>
                  <span>Loading more listings...</span>
                </div>
              ) : (
                <button
                  onClick={() => loadListings(false)}
                  className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors duration-200"
                >
                  Load More
                </button>
              )}
            </div>
          )}

          {!hasMore && listings.length > 0 && (
            <div className="text-center py-8">
              <p className="text-gray-500">You've seen all listings</p>
            </div>
          )}
        </>
      ) : (
        // Empty State
        <div className="text-center py-16">
          {loading ? (
            <div className="space-y-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
              <p className="text-gray-500">Loading listings...</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center">
                <MagnifyingGlassIcon className="w-12 h-12 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900">
                No listings found
              </h3>
              <p className="text-gray-500 max-w-md mx-auto">
                {hasActiveFilters
                  ? "Try adjusting your filters or search terms to find what you're looking for."
                  : "Be the first to create a listing in this area!"}
              </p>
              {hasActiveFilters ? (
                <button
                  onClick={clearFilters}
                  className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors duration-200"
                >
                  Clear Filters
                </button>
              ) : (
                <Link
                  to="/listings/create"
                  className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors duration-200"
                >
                  Create Listing
                </Link>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Listings;
