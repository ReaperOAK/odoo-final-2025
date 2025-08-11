import api from "./api";

export const ordersAPI = {
  // Create new order
  createOrder: async (orderData) => {
    try {
      const response = await api.post('/api/orders', orderData);
      return response.data;
    } catch (error) {
      console.error("Error creating order:", error);
      throw error;
    }
  },

  // Get order by ID
  getOrder: async (orderId) => {
    try {
      const response = await api.get(`/api/orders/${orderId}`);
      return response.data;
    } catch (error) {
      console.error("Error fetching order:", error);
      throw error;
    }
  },

  // Get user's orders (renter perspective)
  getMyOrders: async (params = {}) => {
    try {
      const queryParams = new URLSearchParams();
      if (params.status) queryParams.append('status', params.status);
      if (params.page) queryParams.append('page', params.page);
      if (params.limit) queryParams.append('limit', params.limit);

      const queryString = queryParams.toString();
      const url = queryString ? `/api/orders/my?${queryString}` : '/api/orders/my';

      const response = await api.get(url);
      return response.data;
    } catch (error) {
      console.error("Error fetching my orders:", error);
      throw error;
    }
  },

  // Get orders for host (host perspective)
  getHostOrders: async (params = {}) => {
    try {
      const queryParams = new URLSearchParams();
      if (params.status) queryParams.append('status', params.status);
      if (params.listingId) queryParams.append('listingId', params.listingId);
      if (params.page) queryParams.append('page', params.page);
      if (params.limit) queryParams.append('limit', params.limit);

      const queryString = queryParams.toString();
      const url = queryString ? `/api/orders/host?${queryString}` : '/api/orders/host';

      const response = await api.get(url);
      return response.data;
    } catch (error) {
      console.error("Error fetching host orders:", error);
      throw error;
    }
  },

  // Update order status (host/admin)
  updateOrderStatus: async (orderId, status, notes = '') => {
    try {
      const response = await api.patch(`/api/orders/${orderId}/status`, {
        status,
        notes
      });
      return response.data;
    } catch (error) {
      console.error("Error updating order status:", error);
      throw error;
    }
  },

  // Mark order as picked up
  markPickup: async (orderId, notes = '') => {
    try {
      const response = await api.post(`/api/orders/${orderId}/pickup`, {
        notes
      });
      return response.data;
    } catch (error) {
      console.error("Error marking pickup:", error);
      throw error;
    }
  },

  // Mark order as returned
  markReturn: async (orderId, returnData) => {
    try {
      const response = await api.post(`/api/orders/${orderId}/return`, returnData);
      return response.data;
    } catch (error) {
      console.error("Error marking return:", error);
      throw error;
    }
  },

  // Cancel order
  cancelOrder: async (orderId, reason = '') => {
    try {
      const response = await api.post(`/api/orders/${orderId}/cancel`, {
        reason
      });
      return response.data;
    } catch (error) {
      console.error("Error cancelling order:", error);
      throw error;
    }
  },

  // Initiate dispute
  initiateDispute: async (orderId, disputeData) => {
    try {
      const response = await api.post(`/api/orders/${orderId}/dispute`, disputeData);
      return response.data;
    } catch (error) {
      console.error("Error initiating dispute:", error);
      throw error;
    }
  },

  // Add order message/communication
  addOrderMessage: async (orderId, message) => {
    try {
      const response = await api.post(`/api/orders/${orderId}/messages`, {
        message
      });
      return response.data;
    } catch (error) {
      console.error("Error adding order message:", error);
      throw error;
    }
  },

  // Get order messages
  getOrderMessages: async (orderId) => {
    try {
      const response = await api.get(`/api/orders/${orderId}/messages`);
      return response.data;
    } catch (error) {
      console.error("Error fetching order messages:", error);
      throw error;
    }
  },

  // Get order analytics (admin)
  getOrderAnalytics: async (params = {}) => {
    try {
      const queryParams = new URLSearchParams();
      if (params.startDate) queryParams.append('startDate', params.startDate);
      if (params.endDate) queryParams.append('endDate', params.endDate);
      if (params.hostId) queryParams.append('hostId', params.hostId);

      const queryString = queryParams.toString();
      const url = queryString ? `/api/orders/analytics?${queryString}` : '/api/orders/analytics';

      const response = await api.get(url);
      return response.data;
    } catch (error) {
      console.error("Error fetching order analytics:", error);
      throw error;
    }
  },

  // Request refund
  requestRefund: async (orderId, refundData) => {
    try {
      const response = await api.post(`/api/orders/${orderId}/refund`, refundData);
      return response.data;
    } catch (error) {
      console.error("Error requesting refund:", error);
      throw error;
    }
  },

  // Process refund (admin)
  processRefund: async (orderId, refundData) => {
    try {
      const response = await api.post(`/api/orders/${orderId}/process-refund`, refundData);
      return response.data;
    } catch (error) {
      console.error("Error processing refund:", error);
      throw error;
    }
  },

  // Calculate order pricing
  calculatePricing: async (orderData) => {
    try {
      const response = await api.post('/api/orders/calculate', orderData);
      return response.data;
    } catch (error) {
      console.error("Error calculating pricing:", error);
      throw error;
    }
  },

  // Check for order conflicts
  checkConflicts: async (orderData) => {
    try {
      const response = await api.post('/api/orders/check-conflicts', orderData);
      return response.data;
    } catch (error) {
      console.error("Error checking conflicts:", error);
      throw error;
    }
  }
};

// Export individual functions for convenience
export const getOrders = ordersAPI.getOrders;
export const getOrder = ordersAPI.getOrder;
export const createOrder = ordersAPI.createOrder;
export const updateOrder = ordersAPI.updateOrder;
export const cancelOrder = ordersAPI.cancelOrder;
export const confirmOrder = ordersAPI.confirmOrder;
export const markPickup = ordersAPI.markPickup;
export const markReturn = ordersAPI.markReturn;
export const uploadReturnProof = ordersAPI.uploadReturnProof;
export const getOrderHistory = ordersAPI.getOrderHistory;
export const getHostOrders = ordersAPI.getHostOrders;
export const checkConflicts = ordersAPI.checkConflicts;

export default ordersAPI;
