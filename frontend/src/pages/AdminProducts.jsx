import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { productsAPI } from "../api/products";
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  PhotoIcon,
  CubeIcon,
} from "@heroicons/react/24/outline";

export default function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await productsAPI.getProducts({ limit: 100 });
      setProducts(response.data || []);
    } catch (error) {
      console.error("Failed to fetch products:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProduct = async (productId) => {
    if (!confirm("Are you sure you want to delete this product?")) return;

    try {
      await productsAPI.deleteProduct(productId);
      await fetchProducts(); // Refresh the list
    } catch (error) {
      console.error("Failed to delete product:", error);
      alert("Failed to delete product. Please try again.");
    }
  };

  const filteredProducts = products.filter(
    (product) =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-48 mb-8"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-white rounded-xl shadow-sm p-6">
                  <div className="w-full h-48 bg-gray-200 rounded-lg mb-4"></div>
                  <div className="h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded mb-4 w-2/3"></div>
                  <div className="h-10 bg-gray-200 rounded"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Manage Products
            </h1>
            <p className="text-gray-600">
              Add, edit, and manage your rental inventory
            </p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="mt-4 sm:mt-0 inline-flex items-center bg-brand text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            <PlusIcon className="w-5 h-5 mr-2" />
            Add Product
          </button>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand focus:border-brand"
              />
            </div>
            <div className="text-sm text-gray-600">
              {filteredProducts.length} of {products.length} products
            </div>
          </div>
        </div>

        {/* Products Grid */}
        {filteredProducts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProducts.map((product) => (
              <ProductAdminCard
                key={product._id}
                product={product}
                onDelete={handleDeleteProduct}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="w-24 h-24 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
              <CubeIcon className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchTerm ? "No products found" : "No products yet"}
            </h3>
            <p className="text-gray-600 mb-4">
              {searchTerm
                ? `No results for "${searchTerm}"`
                : "Get started by adding your first product to the inventory"}
            </p>
            {!searchTerm && (
              <button
                onClick={() => setShowAddModal(true)}
                className="inline-flex items-center bg-brand text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                <PlusIcon className="w-5 h-5 mr-2" />
                Add First Product
              </button>
            )}
          </div>
        )}

        {/* Add Product Modal - Placeholder */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Add New Product
              </h3>
              <p className="text-gray-600 mb-4">
                Product creation form would go here. For this demo, please use
                the backend API directly or seeded data.
              </p>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-brand text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ProductAdminCard({ product, onDelete }) {
  const primaryImage = product.images?.[0] || null;
  const basePrice = product.pricing?.[0]?.rate || 0;
  const priceUnit = product.pricing?.[0]?.unit || "day";

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Product Image */}
      <div className="relative h-48 bg-gray-100">
        {primaryImage ? (
          <img
            src={primaryImage}
            alt={product.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <PhotoIcon className="w-12 h-12 text-gray-400" />
          </div>
        )}

        {/* Stock Badge */}
        <div className="absolute top-3 right-3">
          <div
            className={`px-2 py-1 rounded-full text-xs font-medium ${
              product.stock > 5
                ? "bg-green-100 text-green-800"
                : product.stock > 0
                ? "bg-yellow-100 text-yellow-800"
                : "bg-red-100 text-red-800"
            }`}
          >
            {product.stock} in stock
          </div>
        </div>
      </div>

      {/* Product Details */}
      <div className="p-6">
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-1 line-clamp-1">
            {product.name}
          </h3>
          <p className="text-gray-600 text-sm line-clamp-2">
            {product.description}
          </p>
        </div>

        <div className="flex items-center justify-between mb-4">
          <div className="text-2xl font-bold text-brand">
            ${basePrice}
            <span className="text-sm text-gray-500 font-normal">
              /{priceUnit}
            </span>
          </div>
          <div className="flex items-center text-sm text-gray-500">
            <CubeIcon className="w-4 h-4 mr-1" />
            {product.stock} available
          </div>
        </div>

        {/* Actions */}
        <div className="flex space-x-2">
          <Link
            to={`/products/${product._id}`}
            className="flex-1 text-center bg-gray-100 text-gray-700 py-2 px-3 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
          >
            View
          </Link>
          <button
            onClick={() =>
              alert("Edit functionality would be implemented here")
            }
            className="flex items-center justify-center bg-brand text-white p-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <PencilIcon className="w-4 h-4" />
          </button>
          <button
            onClick={() => onDelete(product._id)}
            className="flex items-center justify-center bg-red-600 text-white p-2 rounded-lg hover:bg-red-700 transition-colors"
          >
            <TrashIcon className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
