import api from './api'

export const rentalsAPI = {
  // Check availability
  checkAvailability: async (productId, startDate, endDate) => {
    const response = await api.get(`/rentals/availability/${productId}`, {
      params: { startDate, endDate }
    })
    return response.data
  },

  // Calculate price
  calculatePrice: async (productId, startDate, endDate) => {
    const response = await api.get(`/rentals/price/${productId}`, {
      params: { startDate, endDate }
    })
    return response.data
  },

  // Create rental/booking
  createRental: async (rentalData) => {
    const response = await api.post('/rentals', rentalData)
    return response.data
  },

  // Get user's rentals
  getMyRentals: async (params = {}) => {
    const response = await api.get('/rentals/my-rentals', { params })
    return response.data
  },

  // Get all rentals (admin only)
  getAllRentals: async (params = {}) => {
    const response = await api.get('/rentals', { params })
    return response.data
  },

  // Get single rental
  getRental: async (id) => {
    const response = await api.get(`/rentals/${id}`)
    return response.data
  },

  // Update rental status (admin only)
  updateRentalStatus: async (id, status) => {
    const response = await api.patch(`/rentals/${id}/status`, { status })
    return response.data
  },

  // Cancel rental
  cancelRental: async (id) => {
    const response = await api.patch(`/rentals/${id}/cancel`)
    return response.data
  }
}
