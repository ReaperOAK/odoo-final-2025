import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import ProductCard from "../components/ProductCard";
import { productsAPI } from "../api/products";
import {
  ChevronRightIcon,
  ClockIcon,
  ShieldCheckIcon,
  CurrencyDollarIcon,
} from "@heroicons/react/24/outline";

export default function Home() {
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFeaturedProducts();
  }, []);

  const fetchFeaturedProducts = async () => {
    try {
      const response = await productsAPI.getProducts({ limit: 6 });
      console.log("Featured products response:", response);
      setFeaturedProducts(response.data || []);
    } catch (error) {
      console.error("Failed to fetch featured products:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-brand-50 via-white to-blue-50 pt-16 pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
              Equipment Rental
              <span className="text-brand block">Made Simple</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed">
              Access professional equipment for your projects instantly. From
              cameras to laptops, find everything you need with transparent
              pricing and real-time availability.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/products"
                className="inline-flex items-center bg-brand text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                Browse Products
                <ChevronRightIcon className="w-5 h-5 ml-2" />
              </Link>
              <Link
                to="/register"
                className="inline-flex items-center border-2 border-brand text-brand px-8 py-4 rounded-lg text-lg font-semibold hover:bg-brand hover:text-white transition-all duration-200"
              >
                Get Started Free
              </Link>
            </div>
          </div>

          {/* Demo Credentials */}
          <div className="mt-12 max-w-2xl mx-auto">
            <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 border shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                Demo Credentials
              </h3>
              <div className="grid md:grid-cols-2 gap-4 text-sm">
                <div className="bg-blue-50 p-3 rounded-lg">
                  <p className="font-medium text-blue-900">Admin Account</p>
                  <p className="text-blue-700">admin@demo.com</p>
                  <p className="text-blue-700">p@ssw0rd</p>
                </div>
                <div className="bg-green-50 p-3 rounded-lg">
                  <p className="font-medium text-green-900">User Account</p>
                  <p className="text-green-700">user@demo.com</p>
                  <p className="text-green-700">p@ssw0rd</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Why Choose RentEasy?
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Professional equipment rental with modern technology and
              exceptional service
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center group">
              <div className="bg-gradient-to-br from-brand-50 to-blue-100 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-200">
                <ClockIcon className="w-10 h-10 text-brand" />
              </div>
              <h3 className="text-xl font-semibold mb-3 text-gray-900">
                Instant Availability
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Real-time availability checking prevents double bookings and
                ensures smooth rental process
              </p>
            </div>

            <div className="text-center group">
              <div className="bg-gradient-to-br from-green-50 to-emerald-100 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-200">
                <CurrencyDollarIcon className="w-10 h-10 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold mb-3 text-gray-900">
                Transparent Pricing
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Clear hourly, daily, and weekly rates with automatic discounts
                and no hidden fees
              </p>
            </div>

            <div className="text-center group">
              <div className="bg-gradient-to-br from-purple-50 to-violet-100 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-200">
                <ShieldCheckIcon className="w-10 h-10 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold mb-3 text-gray-900">
                Secure & Reliable
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Professional equipment with full insurance coverage and 24/7
                customer support
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Products Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Featured Equipment
            </h2>
            <p className="text-xl text-gray-600">
              Popular items available for immediate rental
            </p>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[...Array(6)].map((_, i) => (
                <div
                  key={i}
                  className="bg-white rounded-xl shadow-sm p-6 animate-pulse"
                >
                  <div className="w-full h-48 bg-gray-200 rounded-lg mb-4"></div>
                  <div className="h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded mb-4 w-2/3"></div>
                  <div className="h-10 bg-gray-200 rounded"></div>
                </div>
              ))}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
                {featuredProducts.map((product) => (
                  <ProductCard key={product._id} product={product} />
                ))}
              </div>

              <div className="text-center">
                <Link
                  to="/products"
                  className="inline-flex items-center bg-brand text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                >
                  View All Products
                  <ChevronRightIcon className="w-5 h-5 ml-2" />
                </Link>
              </div>
            </>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-brand">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Ready to Get Started?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Join thousands of satisfied customers who trust RentEasy for their
            equipment needs
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/register"
              className="inline-flex items-center bg-white text-brand px-8 py-3 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
            >
              Create Account
            </Link>
            <Link
              to="/products"
              className="inline-flex items-center border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-brand transition-colors"
            >
              Browse Equipment
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
