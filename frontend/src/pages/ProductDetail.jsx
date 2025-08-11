import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { productsAPI } from "../api/products";
import { rentalsAPI } from "../api/rentals";
import BookingWidget from "../components/BookingWidget";
import {
  ArrowLeftIcon,
  StarIcon,
  CheckIcon,
  CubeIcon,
  ClockIcon,
} from "@heroicons/react/24/outline";

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [bookingSuccess, setBookingSuccess] = useState(false);

  useEffect(() => {
    if (id) {
      fetchProduct();
    }
  }, [id]);

  const fetchProduct = async () => {
    try {
      setLoading(true);
      const response = await productsAPI.getProduct(id);
      setProduct(response.data);
    } catch (error) {
      console.error("Failed to fetch product:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleBooking = async (bookingData) => {
    try {
      await rentalsAPI.createRental({
        product: bookingData.productId,
        startDate: bookingData.startDate,
        endDate: bookingData.endDate,
        quantity: bookingData.quantity,
        totalPrice: bookingData.totalPrice,
      });

      setBookingSuccess(true);

      // Redirect to bookings page after success
      setTimeout(() => {
        navigate("/my-bookings");
      }, 2000);
    } catch (error) {
      console.error("Booking failed:", error);
      alert("Booking failed. Please try again.");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-32 mb-8"></div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              <div>
                <div className="w-full h-96 bg-gray-200 rounded-xl mb-4"></div>
                <div className="flex space-x-2">
                  {[...Array(4)].map((_, i) => (
                    <div
                      key={i}
                      className="w-20 h-20 bg-gray-200 rounded-lg"
                    ></div>
                  ))}
                </div>
              </div>
              <div className="space-y-4">
                <div className="h-8 bg-gray-200 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                <div className="h-20 bg-gray-200 rounded"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Product not found
          </h2>
          <Link to="/products" className="text-brand hover:text-blue-700">
            ← Back to products
          </Link>
        </div>
      </div>
    );
  }

  const images =
    product.images && product.images.length > 0
      ? product.images
      : ["https://via.placeholder.com/600x400?text=No+Image"];
  const basePrice = product.pricing?.[0]?.rate || 0;
  const priceUnit = product.pricing?.[0]?.unit || "day";

  if (bookingSuccess) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center bg-white p-8 rounded-xl shadow-lg max-w-md">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckIcon className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Booking Confirmed!
          </h2>
          <p className="text-gray-600 mb-4">
            Your rental request has been submitted successfully. You'll be
            redirected to your bookings page.
          </p>
          <div className="animate-spin w-6 h-6 border-2 border-brand border-t-transparent rounded-full mx-auto"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <nav className="mb-8">
          <Link
            to="/products"
            className="inline-flex items-center text-brand hover:text-blue-700 font-medium"
          >
            <ArrowLeftIcon className="w-4 h-4 mr-2" />
            Back to Products
          </Link>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Product Images */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="aspect-w-16 aspect-h-10">
                <img
                  src={images[selectedImage]}
                  alt={product.name}
                  className="w-full h-96 object-cover"
                />
              </div>

              {images.length > 1 && (
                <div className="p-4 border-t">
                  <div className="flex space-x-2 overflow-x-auto">
                    {images.map((image, index) => (
                      <button
                        key={index}
                        onClick={() => setSelectedImage(index)}
                        className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-colors ${
                          selectedImage === index
                            ? "border-brand"
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                      >
                        <img
                          src={image}
                          alt={`${product.name} ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Product Info */}
            <div className="bg-white rounded-xl shadow-sm p-8 mt-6">
              <div className="mb-6">
                <h1 className="text-3xl font-bold text-gray-900 mb-4">
                  {product.name}
                </h1>

                <div className="flex items-center space-x-6 mb-4">
                  <div className="flex items-center">
                    <CubeIcon className="w-5 h-5 text-gray-400 mr-2" />
                    <span className="text-sm text-gray-600">
                      <span className="font-medium">{product.stock}</span>{" "}
                      available
                    </span>
                  </div>

                  <div className="flex items-center">
                    <ClockIcon className="w-5 h-5 text-gray-400 mr-2" />
                    <span className="text-sm text-gray-600">
                      Per {priceUnit} rental
                    </span>
                  </div>

                  <div className="flex items-center">
                    <StarIcon className="w-5 h-5 text-yellow-400 mr-1" />
                    <span className="text-sm text-gray-600">
                      4.8 (124 reviews)
                    </span>
                  </div>
                </div>

                <div className="mb-6">
                  <span className="text-4xl font-bold text-brand">
                    ₹{basePrice}
                  </span>
                  <span className="text-xl text-gray-600">/{priceUnit}</span>
                </div>
              </div>

              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  Description
                </h3>
                <p className="text-gray-600 leading-relaxed mb-6">
                  {product.description}
                </p>

                {/* Features */}
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  Features
                </h3>
                <ul className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600">
                  <li className="flex items-center">
                    <CheckIcon className="w-4 h-4 text-green-500 mr-2" />
                    Professional grade equipment
                  </li>
                  <li className="flex items-center">
                    <CheckIcon className="w-4 h-4 text-green-500 mr-2" />
                    24/7 customer support
                  </li>
                  <li className="flex items-center">
                    <CheckIcon className="w-4 h-4 text-green-500 mr-2" />
                    Free delivery & pickup
                  </li>
                  <li className="flex items-center">
                    <CheckIcon className="w-4 h-4 text-green-500 mr-2" />
                    Full insurance coverage
                  </li>
                  <li className="flex items-center">
                    <CheckIcon className="w-4 h-4 text-green-500 mr-2" />
                    Instant availability check
                  </li>
                  <li className="flex items-center">
                    <CheckIcon className="w-4 h-4 text-green-500 mr-2" />
                    Flexible rental periods
                  </li>
                </ul>
              </div>

              {/* Pricing Tiers */}
              {product.pricing && product.pricing.length > 1 && (
                <div className="border-t pt-6 mt-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">
                    Pricing Options
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {product.pricing.map((price, index) => (
                      <div
                        key={index}
                        className="border rounded-lg p-4 text-center"
                      >
                        <div className="text-2xl font-bold text-brand">
                          ₹{price.rate}
                        </div>
                        <div className="text-sm text-gray-600 capitalize">
                          per {price.unit}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Booking Widget */}
          <div className="lg:col-span-1">
            <BookingWidget product={product} onBook={handleBooking} />
          </div>
        </div>
      </div>
    </div>
  );
}
