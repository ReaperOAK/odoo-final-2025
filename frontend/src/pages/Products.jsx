import { useState, useEffect } from "react";
import ProductCard from "../components/ProductCard";
import { productsAPI } from "../api/products";
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  Squares2X2Icon,
  ListBulletIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  SparklesIcon,
  AdjustmentsHorizontalIcon,
} from "@heroicons/react/24/outline";

export default function Products() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("name");
  const [viewMode, setViewMode] = useState("grid"); // grid or list
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchProducts();
  }, [searchTerm, sortBy, currentPage]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const params = {
        page: currentPage,
        limit: 12,
        search: searchTerm,
        sort: sortBy,
      };

      const response = await productsAPI.getProducts(params);
      setProducts(response.data || []);
      setTotalPages(response.pagination?.pages || 1);
    } catch (error) {
      console.error("Failed to fetch products:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1); // Reset to first page on search
  };

  const handleSortChange = (e) => {
    setSortBy(e.target.value);
    setCurrentPage(1);
  };

  const renderPagination = () => {
    if (totalPages <= 1) return null;

    const pages = [];
    const maxVisiblePages = 5;
    const startPage = Math.max(
      1,
      currentPage - Math.floor(maxVisiblePages / 2)
    );
    const endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    // Show first page if we're not starting from it
    if (startPage > 1) {
      pages.push(
        <button
          key={1}
          onClick={() => setCurrentPage(1)}
          className="px-3 py-2 mx-1 rounded-xl text-sm font-medium bg-white text-gray-700 border border-gray-200 hover:bg-gray-50 hover:border-brand transition-all duration-200"
        >
          1
        </button>
      );
      if (startPage > 2) {
        pages.push(
          <span key="ellipsis1" className="px-2 text-gray-400">
            ...
          </span>
        );
      }
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(
        <button
          key={i}
          onClick={() => setCurrentPage(i)}
          className={`px-4 py-2 mx-1 rounded-xl text-sm font-medium transition-all duration-200 ${
            i === currentPage
              ? "bg-brand text-white shadow-lg scale-105"
              : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50 hover:border-brand hover:scale-105"
          }`}
        >
          {i}
        </button>
      );
    }

    // Show last page if we're not ending with it
    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        pages.push(
          <span key="ellipsis2" className="px-2 text-gray-400">
            ...
          </span>
        );
      }
      pages.push(
        <button
          key={totalPages}
          onClick={() => setCurrentPage(totalPages)}
          className="px-3 py-2 mx-1 rounded-xl text-sm font-medium bg-white text-gray-700 border border-gray-200 hover:bg-gray-50 hover:border-brand transition-all duration-200"
        >
          {totalPages}
        </button>
      );
    }

    return (
      <div className="flex flex-col sm:flex-row justify-center items-center mt-16 gap-4">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className="group inline-flex items-center px-4 py-2 rounded-xl text-sm font-medium bg-white text-gray-700 border border-gray-200 hover:bg-gray-50 hover:border-brand disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
          >
            <ChevronLeftIcon className="w-4 h-4 mr-1 group-hover:-translate-x-0.5 transition-transform" />
            Previous
          </button>
          
          <div className="hidden sm:flex items-center">
            {pages}
          </div>
          
          <button
            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
            className="group inline-flex items-center px-4 py-2 rounded-xl text-sm font-medium bg-white text-gray-700 border border-gray-200 hover:bg-gray-50 hover:border-brand disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
          >
            Next
            <ChevronRightIcon className="w-4 h-4 ml-1 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>
        
        {/* Mobile page indicator */}
        <div className="sm:hidden text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
          Page {currentPage} of {totalPages}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30">
      {/* Hero Header */}
      <div className="bg-gradient-to-br from-brand via-blue-700 to-indigo-800 relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl -translate-y-48 translate-x-48"></div>
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-white/5 rounded-full blur-3xl translate-y-40 -translate-x-40"></div>
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
          <div className="text-center">
            <div className="inline-flex items-center bg-white/10 backdrop-blur-sm text-white px-4 py-2 rounded-full text-sm font-medium mb-6 border border-white/20">
              <SparklesIcon className="w-4 h-4 mr-2" />
              Professional Equipment Catalog
            </div>
            
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4 leading-tight">
              Browse Equipment
            </h1>
            <p className="text-lg sm:text-xl text-blue-100 max-w-2xl mx-auto">
              Find the perfect equipment for your project with real-time availability
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
        {/* Enhanced Filters and Search */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200/50 p-6 lg:p-8 mb-8 lg:mb-12">
          <div className="flex flex-col space-y-6">
            {/* Search Bar */}
            <div className="relative max-w-2xl mx-auto w-full">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search for cameras, laptops, microphones..."
                value={searchTerm}
                onChange={handleSearch}
                className="block w-full pl-12 pr-4 py-4 border border-gray-200 rounded-xl leading-5 bg-white/70 backdrop-blur-sm placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-2 focus:ring-brand focus:border-brand transition-all duration-200 text-lg"
              />
            </div>

            {/* Controls Row */}
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              {/* Sort Controls */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <div className="flex items-center bg-gray-50 rounded-xl p-1">
                  <AdjustmentsHorizontalIcon className="h-5 w-5 text-gray-500 mr-3 ml-2" />
                  <select
                    value={sortBy}
                    onChange={handleSortChange}
                    className="bg-transparent border-none focus:ring-0 focus:outline-none text-gray-700 font-medium pr-8 py-2"
                  >
                    <option value="name">Name A-Z</option>
                    <option value="-name">Name Z-A</option>
                    <option value="pricing.rate">Price: Low to High</option>
                    <option value="-pricing.rate">Price: High to Low</option>
                    <option value="-stock">Stock: High to Low</option>
                  </select>
                </div>
                
                {/* Results Count */}
                {!loading && (
                  <div className="text-gray-600 text-sm bg-gray-100 px-3 py-2 rounded-lg">
                    {products.length > 0 ? (
                      <>Showing {products.length} of {totalPages * 12} products</>
                    ) : (
                      "No products found"
                    )}
                  </div>
                )}
              </div>

              {/* View Mode Toggle */}
              <div className="flex items-center bg-gray-100 rounded-xl p-1">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`flex items-center px-4 py-2 rounded-lg transition-all duration-200 ${
                    viewMode === "grid"
                      ? "bg-brand text-white shadow-md"
                      : "text-gray-600 hover:text-gray-900 hover:bg-white"
                  }`}
                >
                  <Squares2X2Icon className="h-4 w-4 mr-2" />
                  Grid
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={`flex items-center px-4 py-2 rounded-lg transition-all duration-200 ${
                    viewMode === "list"
                      ? "bg-brand text-white shadow-md"
                      : "text-gray-600 hover:text-gray-900 hover:bg-white"
                  }`}
                >
                  <ListBulletIcon className="h-4 w-4 mr-2" />
                  List
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Products Grid/List */}
        {loading ? (
          <div className="relative">
            {/* Loading header */}
            <div className="flex items-center justify-between mb-8">
              <div className="h-6 bg-gradient-to-r from-gray-200 to-gray-300 rounded-lg w-32 animate-pulse"></div>
              <div className="h-6 bg-gradient-to-r from-gray-200 to-gray-300 rounded-lg w-24 animate-pulse"></div>
            </div>
            
            <div
              className={`grid gap-6 lg:gap-8 ${
                viewMode === "grid"
                  ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
                  : "grid-cols-1"
              }`}
            >
              {[...Array(12)].map((_, i) => (
                <div
                  key={i}
                  className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-200/50 p-6 animate-pulse"
                >
                  <div className="w-full h-48 sm:h-56 bg-gradient-to-br from-gray-200 via-gray-300 to-gray-200 rounded-xl mb-6"></div>
                  <div className="space-y-3">
                    <div className="h-6 bg-gradient-to-r from-gray-200 to-gray-300 rounded-lg"></div>
                    <div className="h-4 bg-gradient-to-r from-gray-200 to-gray-300 rounded w-2/3"></div>
                    <div className="h-12 bg-gradient-to-r from-gray-200 to-gray-300 rounded-xl"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : products.length > 0 ? (
          <>
            {/* Products Header */}
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-xl font-semibold text-gray-900">
                Available Equipment
              </h2>
              <div className="flex items-center text-sm text-gray-600">
                <div className="w-2 h-2 bg-green-400 rounded-full mr-2"></div>
                {products.length} items found
              </div>
            </div>
            
            <div
              className={`grid gap-6 lg:gap-8 ${
                viewMode === "grid"
                  ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
                  : "grid-cols-1"
              }`}
            >
              {products.map((product) => (
                <div 
                  key={product._id} 
                  className="group transform hover:scale-105 transition-all duration-300 hover:z-10"
                >
                  <ProductCard product={product} />
                </div>
              ))}
            </div>
            {renderPagination()}
          </>
        ) : (
          <div className="text-center py-20">
            <div className="relative mx-auto mb-8">
              <div className="w-32 h-32 mx-auto bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center">
                <MagnifyingGlassIcon className="w-16 h-16 text-gray-400" />
              </div>
              <div className="absolute -top-2 -right-2 w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                <div className="w-3 h-3 bg-orange-400 rounded-full"></div>
              </div>
            </div>
            
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              No products found
            </h3>
            <p className="text-lg text-gray-600 mb-8 max-w-md mx-auto">
              {searchTerm
                ? `No results found for "${searchTerm}". Try adjusting your search terms.`
                : "No products are available at the moment. Please check back later."}
            </p>
            
            {searchTerm && (
              <button
                onClick={() => {
                  setSearchTerm("");
                  setCurrentPage(1);
                }}
                className="inline-flex items-center bg-brand text-white px-6 py-3 rounded-xl font-semibold hover:bg-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-105"
              >
                Clear search and browse all
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
