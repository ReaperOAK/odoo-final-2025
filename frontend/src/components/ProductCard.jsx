const ProductCard = ({ product, onClick }) => {
  return (
    <div 
      className="bg-white rounded-lg shadow-md overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
      onClick={onClick}
    >
      <div className="aspect-w-16 aspect-h-9">
        <img 
          src={product.images?.[0] || 'https://via.placeholder.com/400x300?text=No+Image'} 
          alt={product.name}
          className="w-full h-48 object-cover"
        />
      </div>
      <div className="p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">{product.name}</h3>
        <p className="text-gray-600 text-sm mb-3 line-clamp-2">{product.description}</p>
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-500">Stock: {product.stock}</span>
          <span className="text-brand font-semibold">
            From ${product.pricing?.[0]?.rate || 0}/{product.pricing?.[0]?.unit || 'day'}
          </span>
        </div>
      </div>
    </div>
  )
}

export default ProductCard
