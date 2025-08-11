import api from "./api";

export const hostsAPI = {
  // Get host dashboard data
  getHostDashboard: async () => {
    try {
      const response = await api.get('/host/dashboard');
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
      if (params.period) queryParams.append('period', params.period);
      if (params.startDate) queryParams.append('startDate', params.startDate);
      if (params.endDate) queryParams.append('endDate', params.endDate);

      const queryString = queryParams.toString();
      const url = queryString ? `/host/analytics?${queryString}` : '/host/analytics';

      const response = await api.get(url);
      return response.data;
    } catch (error) {
      console.error("Error fetching host analytics:", error);
      throw error;
    }
  },

  // Get host earnings
  getHostEarnings: async (params = {}) => {
    try {
      const queryParams = new URLSearchParams();
      if (params.period) queryParams.append('period', params.period);
      if (params.year) queryParams.append('year', params.year);
      if (params.month) queryParams.append('month', params.month);

      const queryString = queryParams.toString();
      const url = queryString ? `/host/earnings?${queryString}` : '/host/earnings';

      const response = await api.get(url);
      return response.data;
    } catch (error) {
      console.error("Error fetching host earnings:", error);
      throw error;
    }
  },

  // Get host listings performance
  getHostListings: async () => {
    try {
      const response = await api.get('/host/listings');
      return response.data;
    } catch (error) {
      console.error("Error fetching host listings:", error);
      throw error;
    }
  },

  // Get upcoming events/bookings
  getUpcomingEvents: async () => {
    try {
      const response = await api.get('/host/upcoming');
      return response.data;
    } catch (error) {
      console.error("Error fetching upcoming events:", error);
      throw error;
    }
  },

  // Get host profile (for display purposes)
  getHostProfile: async (hostId = null) => {
    try {
      // If hostId is provided, get specific host profile (public view)
      // If not provided, get current user's host profile
      const url = hostId ? `/auth/profile?hostId=${hostId}` : '/auth/profile';
      const response = await api.get(url);
      return response.data;
    } catch (error) {
      console.error("Error fetching host profile:", error);
      throw error;
    }
  },

  // Update host settings (part of user profile)
  updateHostSettings: async (hostData) => {
    try {
      const response = await api.patch('/auth/profile', hostData);
      return response.data;
    } catch (error) {
      console.error("Error updating host settings:", error);
      throw error;
    }
  },

  // Request verification documents
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
      if (verificationData.documents && verificationData.documents.length > 0) {
        verificationData.documents.forEach((doc) => {
          formData.append('documents', doc);
        });
      }

      const response = await api.post('/auth/verify', formData, {
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

  // Get verification status (part of user profile)
  getVerificationStatus: async () => {
    try {
      const response = await api.get('/auth/profile');
      return response.data.verification || { status: 'pending' };
    } catch (error) {
      console.error("Error fetching verification status:", error);
      throw error;
    }
  }
};

export default hostsAPI;
