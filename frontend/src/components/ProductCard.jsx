import { Link } from 'react-router-dom'
import { CalendarIcon, CubeIcon } from '@heroicons/react/24/outline'

export default function ProductCard({ product }) {
  const primaryImage = product.images?.[0] || 'https://via.placeholder.com/400x300?text=No+Image'
  const basePrice = product.pricing?.[0]?.rate || 0
  const priceUnit = product.pricing?.[0]?.unit || 'day'

  return (
    <div className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden group">
      <div className="relative overflow-hidden">
        <img 
          src={primaryImage} 
          alt={product.name}
          className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
        />
        <div className="absolute top-3 right-3">
          <div className="bg-white/90 backdrop-blur-sm px-2 py-1 rounded-full">
            <span className="text-xs font-medium text-gray-600 flex items-center">
              <CubeIcon className="w-3 h-3 mr-1" />
              {product.stock} available
            </span>
          </div>
        </div>
      </div>
      
      <div className="p-6">
        <div className="mb-3">
          <h3 className="text-lg font-semibold text-gray-900 mb-1 line-clamp-1">
            {product.name}
          </h3>
          <p className="text-gray-600 text-sm line-clamp-2 leading-relaxed">
            {product.description}
          </p>
        </div>

        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center text-sm text-gray-500">
            <CalendarIcon className="w-4 h-4 mr-1" />
            <span>Per {priceUnit}</span>
          </div>
          <div className="text-right">
            <span className="text-2xl font-bold text-brand">
              ${basePrice}
            </span>
            <span className="text-sm text-gray-500">/{priceUnit}</span>
          </div>
        </div>

        <Link 
          to={`/products/${product._id}`}
          className="block w-full bg-brand text-white text-center py-3 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors duration-200"
        >
          View Details
        </Link>
      </div>
    </div>
  )
}
