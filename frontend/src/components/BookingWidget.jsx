const BookingWidget = ({ product, onBook }) => {
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold mb-4">Book this item</h3>
      <p className="text-gray-600">Booking widget - To be implemented with date picker and availability check</p>
      <button 
        onClick={onBook}
        className="btn-primary w-full mt-4"
      >
        Book Now
      </button>
    </div>
  )
}

export default BookingWidget
