import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import ProductCard from "../components/ProductCard";
import { productsAPI } from "../api/products";
import {
  ChevronRightIcon,
  ClockIcon,
  ShieldCheckIcon,
  CurrencyDollarIcon,
  SparklesIcon,
  StarIcon,
} from "@heroicons/react/24/outline";

export default function Home() {
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFeaturedProducts();
  }, []);

  const fetchFeaturedProducts = async () => {
    try {
      const data = await productsAPI.getProducts({ limit: 6 });
      setFeaturedProducts(data.products || []);
    } catch (error) {
      console.error("Failed to fetch featured products:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-brand to-indigo-700 pt-20 pb-32">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-32 w-80 h-80 bg-white/10 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-white/5 rounded-full blur-3xl"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-r from-white/5 to-transparent rounded-full blur-3xl"></div>
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="inline-flex items-center bg-white/10 backdrop-blur-sm text-white px-4 py-2 rounded-full text-sm font-medium mb-6 border border-white/20">
              <SparklesIcon className="w-4 h-4 mr-2" />
              Professional Equipment Rental Platform
            </div>
            
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-6 leading-tight">
              Equipment Rental
              <span className="block bg-gradient-to-r from-yellow-300 via-yellow-200 to-yellow-100 bg-clip-text text-transparent">
                Made Simple
              </span>
            </h1>
            
            <p className="text-lg sm:text-xl lg:text-2xl text-blue-100 mb-10 max-w-4xl mx-auto leading-relaxed">
              Access professional equipment for your projects instantly. From
              cameras to laptops, find everything you need with transparent
              pricing and real-time availability.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
              <Link
                to="/products"
                className="group inline-flex items-center bg-white text-brand px-8 py-4 rounded-xl text-lg font-semibold hover:bg-gray-50 transition-all duration-300 shadow-lg hover:shadow-2xl hover:scale-105"
              >
                Browse Products
                <ChevronRightIcon className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                to="/register"
                className="group inline-flex items-center bg-transparent border-2 border-white text-white px-8 py-4 rounded-xl text-lg font-semibold hover:bg-white hover:text-brand transition-all duration-300 backdrop-blur-sm"
              >
                Get Started Free
                <StarIcon className="w-5 h-5 ml-2 group-hover:rotate-12 transition-transform" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 lg:py-32 bg-white relative">
        {/* Subtle background pattern */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(59,130,246,0.05)_1px,transparent_0)] [background-size:20px_20px]"></div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16 lg:mb-20">
            <div className="inline-flex items-center bg-brand/5 text-brand px-4 py-2 rounded-full text-sm font-medium mb-6">
              <SparklesIcon className="w-4 h-4 mr-2" />
              Why Choose Us
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
              Why Choose RentEasy?
            </h2>
            <p className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Professional equipment rental with modern technology and
              exceptional service
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-12">
            <div className="group text-center hover:scale-105 transition-all duration-300">
              <div className="relative mb-8">
                <div className="bg-gradient-to-br from-brand-50 via-blue-50 to-blue-100 w-20 h-20 sm:w-24 sm:h-24 rounded-3xl flex items-center justify-center mx-auto group-hover:shadow-xl transition-all duration-300 group-hover:rotate-3">
                  <ClockIcon className="w-10 h-10 sm:w-12 sm:h-12 text-brand" />
                </div>
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-400 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                  <div className="w-2 h-2 bg-white rounded-full"></div>
                </div>
              </div>
              <h3 className="text-xl sm:text-2xl font-bold mb-4 text-gray-900">
                Instant Availability
              </h3>
              <p className="text-gray-600 leading-relaxed text-base sm:text-lg">
                Real-time availability checking prevents double bookings and
                ensures smooth rental process
              </p>
            </div>

            <div className="group text-center hover:scale-105 transition-all duration-300">
              <div className="relative mb-8">
                <div className="bg-gradient-to-br from-emerald-50 via-green-50 to-green-100 w-20 h-20 sm:w-24 sm:h-24 rounded-3xl flex items-center justify-center mx-auto group-hover:shadow-xl transition-all duration-300 group-hover:rotate-3">
                  <CurrencyDollarIcon className="w-10 h-10 sm:w-12 sm:h-12 text-emerald-600" />
                </div>
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                  <div className="w-2 h-2 bg-white rounded-full"></div>
                </div>
              </div>
              <h3 className="text-xl sm:text-2xl font-bold mb-4 text-gray-900">
                Transparent Pricing
              </h3>
              <p className="text-gray-600 leading-relaxed text-base sm:text-lg">
                Clear hourly, daily, and weekly rates with automatic discounts
                and no hidden fees
              </p>
            </div>

            <div className="group text-center hover:scale-105 transition-all duration-300 sm:col-span-2 lg:col-span-1">
              <div className="relative mb-8">
                <div className="bg-gradient-to-br from-violet-50 via-purple-50 to-purple-100 w-20 h-20 sm:w-24 sm:h-24 rounded-3xl flex items-center justify-center mx-auto group-hover:shadow-xl transition-all duration-300 group-hover:rotate-3">
                  <ShieldCheckIcon className="w-10 h-10 sm:w-12 sm:h-12 text-violet-600" />
                </div>
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-blue-400 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                  <div className="w-2 h-2 bg-white rounded-full"></div>
                </div>
              </div>
              <h3 className="text-xl sm:text-2xl font-bold mb-4 text-gray-900">
                Secure & Reliable
              </h3>
              <p className="text-gray-600 leading-relaxed text-base sm:text-lg">
                Professional equipment with full insurance coverage and 24/7
                customer support
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Products Section */}
      <section className="py-20 lg:py-32 bg-gradient-to-br from-gray-50 via-blue-50/30 to-indigo-50/30 relative overflow-hidden">
        {/* Background decorations */}
        <div className="absolute top-0 left-0 w-72 h-72 bg-brand/5 rounded-full blur-3xl -translate-x-36 -translate-y-36"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl translate-x-48 translate-y-48"></div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16 lg:mb-20">
            <div className="inline-flex items-center bg-brand/10 text-brand px-4 py-2 rounded-full text-sm font-medium mb-6">
              <StarIcon className="w-4 h-4 mr-2" />
              Popular Equipment
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
              Featured Equipment
            </h2>
            <p className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto">
              Popular items available for immediate rental
            </p>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
              {[...Array(6)].map((_, i) => (
                <div
                  key={i}
                  className="bg-white rounded-2xl shadow-sm p-6 animate-pulse border border-gray-100"
                >
                  <div className="w-full h-48 sm:h-56 bg-gradient-to-br from-gray-200 to-gray-300 rounded-xl mb-6"></div>
                  <div className="space-y-3">
                    <div className="h-6 bg-gradient-to-r from-gray-200 to-gray-300 rounded-lg"></div>
                    <div className="h-4 bg-gradient-to-r from-gray-200 to-gray-300 rounded w-2/3"></div>
                    <div className="h-12 bg-gradient-to-r from-gray-200 to-gray-300 rounded-lg"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 mb-16">
                {featuredProducts.map((product) => (
                  <div key={product._id} className="transform hover:scale-105 transition-all duration-300">
                    <ProductCard product={product} />
                  </div>
                ))}
              </div>

              <div className="text-center">
                <Link
                  to="/products"
                  className="group inline-flex items-center bg-brand text-white px-8 py-4 rounded-xl text-lg font-semibold hover:bg-blue-700 transition-all duration-300 shadow-lg hover:shadow-2xl hover:scale-105"
                >
                  View All Products
                  <ChevronRightIcon className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-20 lg:py-32 bg-gradient-to-br from-brand via-blue-700 to-indigo-800 overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0">
          <div className="absolute top-0 left-1/4 w-64 h-64 bg-white/5 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-white/5 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1s'}}></div>
          <div className="absolute top-1/2 left-0 w-96 h-96 bg-white/3 rounded-full blur-3xl animate-pulse" style={{animationDelay: '2s'}}></div>
        </div>
        
        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center bg-white/10 backdrop-blur-sm text-white px-4 py-2 rounded-full text-sm font-medium mb-8 border border-white/20">
            <SparklesIcon className="w-4 h-4 mr-2" />
            Join Our Community
          </div>
          
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-6 leading-tight">
            Ready to Get Started?
          </h2>
          
          <p className="text-lg sm:text-xl lg:text-2xl text-blue-100 mb-12 max-w-3xl mx-auto leading-relaxed">
            Join thousands of satisfied customers who trust RentEasy for their
            equipment needs
          </p>
          
          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            <Link
              to="/register"
              className="group inline-flex items-center bg-white text-brand px-8 py-4 rounded-xl text-lg font-semibold hover:bg-gray-50 transition-all duration-300 shadow-lg hover:shadow-2xl hover:scale-105"
            >
              Create Account
              <ChevronRightIcon className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              to="/products"
              className="group inline-flex items-center bg-transparent border-2 border-white text-white px-8 py-4 rounded-xl text-lg font-semibold hover:bg-white hover:text-brand transition-all duration-300 backdrop-blur-sm"
            >
              Browse Equipment
              <StarIcon className="w-5 h-5 ml-2 group-hover:rotate-12 transition-transform" />
            </Link>
          </div>
          
          {/* Trust indicators */}
          <div className="mt-16 pt-12 border-t border-white/20">
            <p className="text-blue-200 text-sm mb-6">Trusted by professionals worldwide</p>
            <div className="flex flex-wrap justify-center items-center gap-8 opacity-60">
              <div className="text-white/70 text-sm font-medium">1000+ Happy Customers</div>
              <div className="w-1 h-1 bg-white/50 rounded-full"></div>
              <div className="text-white/70 text-sm font-medium">24/7 Support</div>
              <div className="w-1 h-1 bg-white/50 rounded-full"></div>
              <div className="text-white/70 text-sm font-medium">Secure Platform</div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
