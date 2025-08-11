import api from "./api";

export const adminAPI = {
  // Platform Overview and Analytics
  getPlatformOverview: async () => {
    try {
      const response = await api.get('/admin/platform-overview');
      return response.data;
    } catch (error) {
      console.error("Error fetching platform overview:", error);
      throw error;
    }
  },

  // User Management
  getAllUsers: async (params = {}) => {
    try {
      const queryParams = new URLSearchParams();
      if (params.role) queryParams.append('role', params.role);
      if (params.verified) queryParams.append('verified', params.verified);
      if (params.status) queryParams.append('status', params.status);
      if (params.search) queryParams.append('search', params.search);
      if (params.page) queryParams.append('page', params.page);
      if (params.limit) queryParams.append('limit', params.limit);

      const queryString = queryParams.toString();
      const url = queryString ? `/admin/users?${queryString}` : '/admin/users';

      const response = await api.get(url);
      return response.data;
    } catch (error) {
      console.error("Error fetching users:", error);
      throw error;
    }
  },

  // Update user status (activate/deactivate/suspend)
  updateUserStatus: async (userId, status, reason = '') => {
    try {
      const response = await api.patch(`/admin/users/${userId}/status`, {
        status,
        reason
      });
      return response.data;
    } catch (error) {
      console.error("Error updating user status:", error);
      throw error;
    }
  },

  // Verify host
  verifyHost: async (userId, verificationData) => {
    try {
      const response = await api.patch(`/admin/users/${userId}/verification`, verificationData);
      return response.data;
    } catch (error) {
      console.error("Error verifying host:", error);
      throw error;
    }
  },

  // Get specific user details
  getUserDetails: async (userId) => {
    try {
      const response = await api.get(`/admin/users/${userId}`);
      return response.data;
    } catch (error) {
      console.error("Error fetching user details:", error);
      throw error;
    }
  },

  // Listing Management
  getAllListings: async (params = {}) => {
    try {
      const queryParams = new URLSearchParams();
      if (params.status) queryParams.append('status', params.status);
      if (params.hostId) queryParams.append('hostId', params.hostId);
      if (params.category) queryParams.append('category', params.category);
      if (params.search) queryParams.append('search', params.search);
      if (params.page) queryParams.append('page', params.page);
      if (params.limit) queryParams.append('limit', params.limit);

      const queryString = queryParams.toString();
      const url = queryString ? `/admin/listings?${queryString}` : '/admin/listings';

      const response = await api.get(url);
      return response.data;
    } catch (error) {
      console.error("Error fetching listings:", error);
      throw error;
    }
  },

  // Update listing status (approve/reject/suspend)
  updateListingStatus: async (listingId, status, reason = '') => {
    try {
      const response = await api.patch(`/admin/listings/${listingId}/status`, {
        status,
        reason
      });
      return response.data;
    } catch (error) {
      console.error("Error updating listing status:", error);
      throw error;
    }
  },

  // Order Management
  getAllOrders: async (params = {}) => {
    try {
      const queryParams = new URLSearchParams();
      if (params.status) queryParams.append('status', params.status);
      if (params.userId) queryParams.append('userId', params.userId);
      if (params.hostId) queryParams.append('hostId', params.hostId);
      if (params.listingId) queryParams.append('listingId', params.listingId);
      if (params.startDate) queryParams.append('startDate', params.startDate);
      if (params.endDate) queryParams.append('endDate', params.endDate);
      if (params.page) queryParams.append('page', params.page);
      if (params.limit) queryParams.append('limit', params.limit);

      const queryString = queryParams.toString();
      const url = queryString ? `/admin/orders?${queryString}` : '/admin/orders';

      const response = await api.get(url);
      return response.data;
    } catch (error) {
      console.error("Error fetching orders:", error);
      throw error;
    }
  },

  // Dispute Management
  getDisputes: async (params = {}) => {
    try {
      const queryParams = new URLSearchParams();
      if (params.status) queryParams.append('status', params.status);
      if (params.type) queryParams.append('type', params.type);
      if (params.page) queryParams.append('page', params.page);
      if (params.limit) queryParams.append('limit', params.limit);

      const queryString = queryParams.toString();
      const url = queryString ? `/admin/disputes?${queryString}` : '/admin/disputes';

      const response = await api.get(url);
      return response.data;
    } catch (error) {
      console.error("Error fetching disputes:", error);
      throw error;
    }
  },

  // Resolve dispute
  resolveDispute: async (disputeId, resolution) => {
    try {
      const response = await api.patch(`/admin/disputes/${disputeId}/resolve`, resolution);
      return response.data;
    } catch (error) {
      console.error("Error resolving dispute:", error);
      throw error;
    }
  },

  // Payment Management
  getAllPayments: async (params = {}) => {
    try {
      const queryParams = new URLSearchParams();
      if (params.status) queryParams.append('status', params.status);
      if (params.orderId) queryParams.append('orderId', params.orderId);
      if (params.userId) queryParams.append('userId', params.userId);
      if (params.startDate) queryParams.append('startDate', params.startDate);
      if (params.endDate) queryParams.append('endDate', params.endDate);
      if (params.page) queryParams.append('page', params.page);
      if (params.limit) queryParams.append('limit', params.limit);

      const queryString = queryParams.toString();
      const url = queryString ? `/admin/payments?${queryString}` : '/admin/payments';

      const response = await api.get(url);
      return response.data;
    } catch (error) {
      console.error("Error fetching payments:", error);
      throw error;
    }
  },

  // Payout Management
  getAllPayouts: async (params = {}) => {
    try {
      const queryParams = new URLSearchParams();
      if (params.status) queryParams.append('status', params.status);
      if (params.hostId) queryParams.append('hostId', params.hostId);
      if (params.startDate) queryParams.append('startDate', params.startDate);
      if (params.endDate) queryParams.append('endDate', params.endDate);
      if (params.page) queryParams.append('page', params.page);
      if (params.limit) queryParams.append('limit', params.limit);

      const queryString = queryParams.toString();
      const url = queryString ? `/admin/payouts?${queryString}` : '/admin/payouts';

      const response = await api.get(url);
      return response.data;
    } catch (error) {
      console.error("Error fetching payouts:", error);
      throw error;
    }
  },

  // Process payout
  processPayout: async (payoutId, processingData) => {
    try {
      const response = await api.patch(`/admin/payouts/${payoutId}/process`, processingData);
      return response.data;
    } catch (error) {
      console.error("Error processing payout:", error);
      throw error;
    }
  },

  // Reject payout
  rejectPayout: async (payoutId, reason) => {
    try {
      const response = await api.patch(`/admin/payouts/${payoutId}/reject`, { reason });
      return response.data;
    } catch (error) {
      console.error("Error rejecting payout:", error);
      throw error;
    }
  },

  // Platform Analytics
  getAnalytics: async (params = {}) => {
    try {
      const queryParams = new URLSearchParams();
      if (params.period) queryParams.append('period', params.period);
      if (params.startDate) queryParams.append('startDate', params.startDate);
      if (params.endDate) queryParams.append('endDate', params.endDate);
      if (params.metrics) queryParams.append('metrics', params.metrics);

      const queryString = queryParams.toString();
      const url = queryString ? `/admin/analytics?${queryString}` : '/admin/analytics';

      const response = await api.get(url);
      return response.data;
    } catch (error) {
      console.error("Error fetching analytics:", error);
      throw error;
    }
  },

  // Platform Settings
  getSettings: async () => {
    try {
      const response = await api.get('/admin/settings');
      return response.data;
    } catch (error) {
      console.error("Error fetching settings:", error);
      throw error;
    }
  },

  // Update platform settings
  updateSettings: async (settings) => {
    try {
      const response = await api.patch('/admin/settings', settings);
      return response.data;
    } catch (error) {
      console.error("Error updating settings:", error);
      throw error;
    }
  },

  // System Health
  getSystemHealth: async () => {
    try {
      const response = await api.get('/admin/health');
      return response.data;
    } catch (error) {
      console.error("Error fetching system health:", error);
      throw error;
    }
  },

  // Generate Reports
  generateReport: async (reportType, params = {}) => {
    try {
      const response = await api.post(`/admin/reports/${reportType}`, params);
      return response.data;
    } catch (error) {
      console.error("Error generating report:", error);
      throw error;
    }
  },

  // Download Report
  downloadReport: async (reportId) => {
    try {
      const response = await api.get(`/admin/reports/${reportId}/download`, {
        responseType: 'blob'
      });
      return response.data;
    } catch (error) {
      console.error("Error downloading report:", error);
      throw error;
    }
  }
};

export default adminAPI;
