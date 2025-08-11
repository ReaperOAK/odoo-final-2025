import api from './api'

export const rentalsAPI = {
  // Check availability - using POST as per documentation
  checkAvailability: async (productId, startDate, endDate, quantity = 1) => {
    const response = await api.post('/rentals/check-availability', {
      productId,
      startTime: startDate,
      endTime: endDate,
      quantity
    })
    return response.data
  },

  // Calculate price - using POST as per documentation
  calculatePrice: async (productId, startDate, endDate) => {
    const response = await api.post('/rentals/calculate-price', {
      productId,
      startTime: startDate,
      endTime: endDate
    })
    return response.data
  },

  // Create rental/booking - using the /create endpoint as per documentation
  createRental: async (rentalData) => {
    const response = await api.post('/rentals/create', {
      productId: rentalData.product,
      startTime: rentalData.startDate,
      endTime: rentalData.endDate
    })
    return response.data
  },

  // Get user's rentals
  getMyRentals: async (params = {}) => {
    const response = await api.get('/rentals', {
      params: { ...params, mine: true }
    })
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

  // Get rental stats (admin only)
  getRentalStats: async () => {
    const response = await api.get('/rentals/stats')
    return response.data
  }
}
