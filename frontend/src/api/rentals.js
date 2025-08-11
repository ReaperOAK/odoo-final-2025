import api from './api'

export const rentalsAPI = {
  // Check availability
  checkAvailability: async (data) => {
    const response = await api.post('/rentals/check-availability', data)
    return response.data
  },

  // Calculate price
  calculatePrice: async (data) => {
    const response = await api.post('/rentals/calculate-price', data)
    return response.data
  },

  // Create booking
  createBooking: async (bookingData) => {
    const response = await api.post('/rentals/create', bookingData)
    return response.data
  },

  // Get rentals
  getRentals: async (params = {}) => {
    const response = await api.get('/rentals', { params })
    return response.data
  },

  // Update rental status (admin only)
  updateRentalStatus: async (id, status) => {
    const response = await api.patch(`/rentals/${id}/status`, { status })
    return response.data
  }
}
