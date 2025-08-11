import api from './api';

// Legacy Rentals API for backward compatibility with traditional rental system
// This maps to the new P2P marketplace APIs for seamless migration
export const rentalsAPI = {
  // Check availability (maps to listings availability)
  checkAvailability: async (productId, startISO, endISO, quantity = 1) => {
    try {
      // Map to new listings availability API
      const response = await api.get(`/listings/${productId}/availability`, {
        params: {
          start: startISO,
          end: endISO,
          qty: quantity
        }
      });
      return response.data;
    } catch (error) {
      console.error("Error checking availability:", error);
      throw error;
    }
  },

  // Calculate price (maps to orders price calculation)
  calculatePrice: async (productId, startISO, endISO, quantity = 1) => {
    try {
      const response = await api.post('/orders/calculate-price', {
        listingId: productId,
        startTime: startISO,
        endTime: endISO,
        qty: quantity
      });
      return response.data;
    } catch (error) {
      console.error("Error calculating price:", error);
      throw error;
    }
  },

  // Create rental (maps to order creation)
  createRental: async (rentalData) => {
    try {
      const response = await api.post('/orders', {
        listingId: rentalData.product || rentalData.productId,
        startTime: rentalData.startDate,
        endTime: rentalData.endDate,
        qty: rentalData.quantity || 1,
        notes: rentalData.notes || ''
      });
      return response.data;
    } catch (error) {
      console.error("Error creating rental:", error);
      throw error;
    }
  },

  // Get user's rentals (maps to user's orders)
  getMyRentals: async (params = {}) => {
    try {
      const response = await api.get('/orders/my', { params });
      return response.data;
    } catch (error) {
      console.error("Error fetching my rentals:", error);
      throw error;
    }
  },

  // Get all rentals (admin only - maps to all orders)
  getAllRentals: async (params = {}) => {
    try {
      const response = await api.get('/admin/orders', { params });
      return response.data;
    } catch (error) {
      console.error("Error fetching all rentals:", error);
      throw error;
    }
  },

  // Get specific rental (maps to order details)
  getRental: async (id) => {
    try {
      const response = await api.get(`/orders/${id}`);
      return response.data;
    } catch (error) {
      console.error("Error fetching rental:", error);
      throw error;
    }
  },

  // Update rental status (maps to order status update)
  updateRentalStatus: async (id, status, notes = '') => {
    try {
      const response = await api.patch(`/orders/${id}/status`, {
        status,
        notes
      });
      return response.data;
    } catch (error) {
      console.error("Error updating rental status:", error);
      throw error;
    }
  },

  // Mark as picked up
  markPickup: async (id, notes = '') => {
    try {
      const response = await api.post(`/orders/${id}/pickup`, { notes });
      return response.data;
    } catch (error) {
      console.error("Error marking pickup:", error);
      throw error;
    }
  },

  // Mark as returned
  markReturn: async (id, returnData) => {
    try {
      const response = await api.post(`/orders/${id}/return`, returnData);
      return response.data;
    } catch (error) {
      console.error("Error marking return:", error);
      throw error;
    }
  }
};

export default rentalsAPI;
