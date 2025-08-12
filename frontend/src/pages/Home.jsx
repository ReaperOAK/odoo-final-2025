import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { listingsAPI } from "../lib/api";
import ListingCard from "../components/listings/ListingCard";
import SearchFilters from "../components/listings/SearchFilters";
import { Search, Filter } from "lucide-react";

const Home = () => {
  const [filters, setFilters] = useState({
    search: "",
    category: "",
    priceMin: "",
    priceMax: "",
    startDate: "",
    endDate: "",
  });

  // Transform filters to match backend API expectations
  const apiFilters = {
    search: filters.search,
    category: filters.category,
    minPrice: filters.priceMin,
    maxPrice: filters.priceMax,
    from: filters.startDate,
    to: filters.endDate,
  };

  const {
    data: listingsData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["listings", apiFilters],
    queryFn: () => listingsAPI.getAll(apiFilters),
    select: (response) => response.data,
  });

  const listings = listingsData?.data?.listings || [];
  const pagination = listingsData?.data?.pagination || {};

  return (
    <div className="relative min-h-screen">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-radial from-primary-400/20 to-transparent rounded-full animate-float"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-gradient-radial from-secondary-400/20 to-transparent rounded-full animate-float" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-gradient-radial from-purple-400/10 to-transparent rounded-full animate-float" style={{ animationDelay: '2s' }}></div>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-16">
        {/* Hero Section */}
        <div className="text-center mb-16 lg:mb-20">
          <h1 className="text-4xl lg:text-6xl xl:text-7xl font-bold bg-gradient-text bg-clip-text text-transparent mb-6 animate-slideInUp">
            Rent Anything, Anytime
          </h1>
          <p className="text-xl lg:text-2xl text-gray-600 mb-12 max-w-3xl mx-auto animate-slideInUp" style={{ animationDelay: '0.2s' }}>
            Discover thousands of items available for rent in your area with our flashy marketplace
          </p>

          {/* Search Bar */}
          <div className="max-w-3xl mx-auto animate-slideInUp" style={{ animationDelay: '0.4s' }}>
            <div className="relative group">
              <Search className="absolute left-4 lg:left-6 top-1/2 transform -translate-y-1/2 text-gray-500 h-5 w-5 lg:h-6 lg:w-6 transition-colors group-hover:text-primary-500" />
              <input
                type="text"
                placeholder="Search for items to rent..."
                className="w-full pl-12 lg:pl-16 pr-6 py-4 lg:py-6 text-lg lg:text-xl glass-effect border-2 border-white/30 rounded-2xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-300 hover:shadow-lg focus:shadow-xl placeholder-gray-500"
                value={filters.search}
                onChange={(e) =>
                  setFilters({ ...filters, search: e.target.value })
                }
              />
              <div className="absolute inset-0 bg-gradient-to-r from-primary-500/10 to-secondary-500/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="animate-slideInUp" style={{ animationDelay: '0.6s' }}>
          <SearchFilters filters={filters} setFilters={setFilters} />
        </div>

        {/* Listings Grid */}
        <div className="mt-12 lg:mt-16">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 lg:gap-8">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="glass-effect rounded-2xl h-48 lg:h-56 mb-4"></div>
                  <div className="space-y-3">
                    <div className="glass-effect h-4 rounded-full"></div>
                    <div className="glass-effect h-4 rounded-full w-3/4"></div>
                    <div className="glass-effect h-6 rounded-full w-1/2"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="text-center py-16 lg:py-24">
              <div className="glass-effect rounded-2xl p-8 lg:p-12 max-w-md mx-auto">
                <p className="text-gray-600 text-lg lg:text-xl">
                  ❌ Error loading listings. Please try again.
                </p>
              </div>
            </div>
          ) : listings?.length === 0 ? (
            <div className="text-center py-16 lg:py-24">
              <div className="glass-effect rounded-2xl p-8 lg:p-12 max-w-md mx-auto">
                <p className="text-gray-600 text-lg lg:text-xl">
                  🔍 No listings found. Try adjusting your filters.
                </p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 lg:gap-8">
              {listings?.map((listing, index) => (
                <div
                  key={listing._id}
                  className="animate-slideInUp"
                  style={{ animationDelay: `${0.1 * (index % 8)}s` }}
                >
                  <ListingCard listing={listing} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Home;
