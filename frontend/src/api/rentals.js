import api from './api';

export const rentalsAPI = {
  // Check availability
  checkAvailability: async (productId, startISO, endISO, quantity = 1) => {
    const response = await api.post('/rentals/check-availability', {
      productId,
      startTime: startISO,
      endTime: endISO,
      qty: quantity
    });
    console.log("Check Availability Response:", response.data);
    return response.data.data; // backend "data" object
  },

  // Calculate price
  calculatePrice: async (productId, startISO, endISO) => {
    const response = await api.post('/rentals/calculate-price', {
      productId,
      startTime: startISO,
      endTime: endISO
    });
    return response.data.data; // backend "data" object
  },

  // Create rental
  createRental: async (rentalData) => {
    const response = await api.post('/rentals/create', {
      productId: rentalData.product || rentalData.productId,
      startTime: rentalData.startDate,
      endTime: rentalData.endDate,
      qty: rentalData.quantity || 1
    });
    return response.data;
  },

  getMyRentals: async (params = {}) => {
    const response = await api.get('/rentals', { params: { ...params, mine: true } });
    return response.data;
  },

  getAllRentals: async (params = {}) => {
    const response = await api.get('/rentals', { params });
    return response.data;
  },

  getRental: async (id) => {
    const response = await api.get(`/rentals/${id}`);
    return response.data;
  },

  updateRentalStatus: async (id, status) => {
    const response = await api.patch(`/rentals/${id}/status`, { status });
    return response.data;
  },

  getRentalStats: async () => {
    const response = await api.get('/rentals/stats');
    return response.data;
  },

  cancelRental: async (id) => {
    const response = await api.patch(`/rentals/${id}/status`, { status: 'cancelled' });
    return response.data;
  }
};
