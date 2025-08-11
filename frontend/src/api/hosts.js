import api from "./api";

export const hostsAPI = {
  // Get host profile
  getHostProfile: async (hostId) => {
    try {
      const response = await api.get(`/api/hosts/${hostId}`);
      return response.data;
    } catch (error) {
      console.error("Error fetching host profile:", error);
      throw error;
    }
  },

  // Update host profile
  updateHostProfile: async (hostData) => {
    try {
      const response = await api.patch('/api/hosts/profile', hostData);
      return response.data;
    } catch (error) {
      console.error("Error updating host profile:", error);
      throw error;
    }
  },

  // Get all hosts (admin/public)
  getHosts: async (params = {}) => {
    try {
      const queryParams = new URLSearchParams();
      if (params.verified) queryParams.append('verified', params.verified);
      if (params.location) queryParams.append('location', params.location);
      if (params.page) queryParams.append('page', params.page);
      if (params.limit) queryParams.append('limit', params.limit);
      if (params.search) queryParams.append('search', params.search);

      const queryString = queryParams.toString();
      const url = queryString ? `/api/hosts?${queryString}` : '/api/hosts';

      const response = await api.get(url);
      return response.data;
    } catch (error) {
      console.error("Error fetching hosts:", error);
      throw error;
    }
  },

  // Request host verification
  requestVerification: async (verificationData) => {
    try {
      const formData = new FormData();

      // Add text fields
      Object.keys(verificationData).forEach(key => {
        if (key !== 'documents' && verificationData[key] !== undefined) {
          formData.append(key, verificationData[key]);
        }
      });

      // Add documents
      if (verificationData.documents) {
        verificationData.documents.forEach((doc, index) => {
          formData.append(`documents`, doc);
        });
      }

      const response = await api.post('/api/hosts/verify', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      console.error("Error requesting verification:", error);
      throw error;
    }
  },

  // Get verification status
  getVerificationStatus: async () => {
    try {
      const response = await api.get('/api/hosts/verification-status');
      return response.data;
    } catch (error) {
      console.error("Error fetching verification status:", error);
      throw error;
    }
  },

  // Get host dashboard data
  getHostDashboard: async () => {
    try {
      const response = await api.get('/api/hosts/dashboard');
      return response.data;
    } catch (error) {
      console.error("Error fetching host dashboard:", error);
      throw error;
    }
  },

  // Get host analytics
  getHostAnalytics: async (params = {}) => {
    try {
      const queryParams = new URLSearchParams();
      if (params.startDate) queryParams.append('startDate', params.startDate);
      if (params.endDate) queryParams.append('endDate', params.endDate);
      if (params.listingId) queryParams.append('listingId', params.listingId);

      const queryString = queryParams.toString();
      const url = queryString ? `/api/hosts/analytics?${queryString}` : '/api/hosts/analytics';

      const response = await api.get(url);
      return response.data;
    } catch (error) {
      console.error("Error fetching host analytics:", error);
      throw error;
    }
  },

  // Get host reviews
  getHostReviews: async (hostId, params = {}) => {
    try {
      const queryParams = new URLSearchParams();
      if (params.page) queryParams.append('page', params.page);
      if (params.limit) queryParams.append('limit', params.limit);

      const queryString = queryParams.toString();
      const url = queryString ? `/api/hosts/${hostId}/reviews?${queryString}` : `/api/hosts/${hostId}/reviews`;

      const response = await api.get(url);
      return response.data;
    } catch (error) {
      console.error("Error fetching host reviews:", error);
      throw error;
    }
  },

  // Update host availability
  updateAvailability: async (availabilityData) => {
    try {
      const response = await api.patch('/api/hosts/availability', availabilityData);
      return response.data;
    } catch (error) {
      console.error("Error updating availability:", error);
      throw error;
    }
  },

  // Get host calendar
  getHostCalendar: async (params = {}) => {
    try {
      const queryParams = new URLSearchParams();
      if (params.startDate) queryParams.append('startDate', params.startDate);
      if (params.endDate) queryParams.append('endDate', params.endDate);
      if (params.listingId) queryParams.append('listingId', params.listingId);

      const queryString = queryParams.toString();
      const url = queryString ? `/api/hosts/calendar?${queryString}` : '/api/hosts/calendar';

      const response = await api.get(url);
      return response.data;
    } catch (error) {
      console.error("Error fetching host calendar:", error);
      throw error;
    }
  },

  // Upload host documents
  uploadDocuments: async (documents) => {
    try {
      const formData = new FormData();
      documents.forEach((doc, index) => {
        formData.append(`documents`, doc);
      });

      const response = await api.post('/api/hosts/documents', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      console.error("Error uploading documents:", error);
      throw error;
    }
  },

  // Delete host document
  deleteDocument: async (documentId) => {
    try {
      const response = await api.delete(`/api/hosts/documents/${documentId}`);
      return response.data;
    } catch (error) {
      console.error("Error deleting document:", error);
      throw error;
    }
  },

  // Update host settings
  updateSettings: async (settings) => {
    try {
      const response = await api.patch('/api/hosts/settings', settings);
      return response.data;
    } catch (error) {
      console.error("Error updating host settings:", error);
      throw error;
    }
  },

  // Get host settings
  getSettings: async () => {
    try {
      const response = await api.get('/api/hosts/settings');
      return response.data;
    } catch (error) {
      console.error("Error fetching host settings:", error);
      throw error;
    }
  },

  // Deactivate host account
  deactivateAccount: async (reason) => {
    try {
      const response = await api.post('/api/hosts/deactivate', { reason });
      return response.data;
    } catch (error) {
      console.error("Error deactivating account:", error);
      throw error;
    }
  },

  // Reactivate host account
  reactivateAccount: async () => {
    try {
      const response = await api.post('/api/hosts/reactivate');
      return response.data;
    } catch (error) {
      console.error("Error reactivating account:", error);
      throw error;
    }
  },

  // Report host performance metrics
  getPerformanceMetrics: async (params = {}) => {
    try {
      const queryParams = new URLSearchParams();
      if (params.period) queryParams.append('period', params.period);
      if (params.startDate) queryParams.append('startDate', params.startDate);
      if (params.endDate) queryParams.append('endDate', params.endDate);

      const queryString = queryParams.toString();
      const url = queryString ? `/api/hosts/performance?${queryString}` : '/api/hosts/performance';

      const response = await api.get(url);
      return response.data;
    } catch (error) {
      console.error("Error fetching performance metrics:", error);
      throw error;
    }
  }
};

// Export individual functions for convenience
export const getHostProfile = hostsAPI.getHostProfile;
export const updateHostProfile = hostsAPI.updateHostProfile;
export const requestVerification = hostsAPI.requestVerification;
export const getVerificationStatus = hostsAPI.getVerificationStatus;
export const getHostDashboard = hostsAPI.getHostDashboard;
export const getHostAnalytics = hostsAPI.getHostAnalytics;
export const getHostStats = hostsAPI.getHostAnalytics; // Alias for stats
export const getHostWallet = hostsAPI.getHostWallet;
export const withdrawFunds = hostsAPI.withdrawFunds;
export const getWithdrawalHistory = hostsAPI.getWithdrawalHistory;
export const updatePayoutSettings = hostsAPI.updatePayoutSettings;
export const getHosts = hostsAPI.getHosts;
export const updateHostVerification = hostsAPI.updateHostVerification;
export const suspendHost = hostsAPI.suspendHost;
export const getPerformanceMetrics = hostsAPI.getPerformanceMetrics;

export default hostsAPI;
