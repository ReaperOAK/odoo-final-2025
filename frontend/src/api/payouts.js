import api from "./api";

export const payoutsAPI = {
  // Get host payouts
  getHostPayouts: async (params = {}) => {
    try {
      const queryParams = new URLSearchParams();
      if (params.status) queryParams.append('status', params.status);
      if (params.startDate) queryParams.append('startDate', params.startDate);
      if (params.endDate) queryParams.append('endDate', params.endDate);
      if (params.page) queryParams.append('page', params.page);
      if (params.limit) queryParams.append('limit', params.limit);

      const queryString = queryParams.toString();
      const url = queryString ? `/payouts?${queryString}` : '/payouts';

      const response = await api.get(url);
      return response.data;
    } catch (error) {
      console.error("Error fetching host payouts:", error);
      throw error;
    }
  },

  // Request new payout
  requestPayout: async (payoutData) => {
    try {
      const response = await api.post('/payouts', payoutData);
      return response.data;
    } catch (error) {
      console.error("Error requesting payout:", error);
      throw error;
    }
  },

  // Get payout details
  getPayoutDetails: async (payoutId) => {
    try {
      const response = await api.get(`/payouts/${payoutId}`);
      return response.data;
    } catch (error) {
      console.error("Error fetching payout details:", error);
      throw error;
    }
  },

  // Cancel payout request (only if pending)
  cancelPayout: async (payoutId, reason = '') => {
    try {
      const response = await api.patch(`/payouts/${payoutId}/cancel`, { reason });
      return response.data;
    } catch (error) {
      console.error("Error canceling payout:", error);
      throw error;
    }
  },

  // Get available balance
  getAvailableBalance: async () => {
    try {
      const response = await api.get('/payouts/balance');
      return response.data;
    } catch (error) {
      console.error("Error fetching available balance:", error);
      throw error;
    }
  },

  // Get payout summary
  getPayoutSummary: async (params = {}) => {
    try {
      const queryParams = new URLSearchParams();
      if (params.period) queryParams.append('period', params.period);
      if (params.year) queryParams.append('year', params.year);
      if (params.month) queryParams.append('month', params.month);

      const queryString = queryParams.toString();
      const url = queryString ? `/payouts/summary?${queryString}` : '/payouts/summary';

      const response = await api.get(url);
      return response.data;
    } catch (error) {
      console.error("Error fetching payout summary:", error);
      throw error;
    }
  },

  // Update bank details
  updateBankDetails: async (bankDetails) => {
    try {
      const response = await api.patch('/payouts/bank-details', bankDetails);
      return response.data;
    } catch (error) {
      console.error("Error updating bank details:", error);
      throw error;
    }
  },

  // Get bank details
  getBankDetails: async () => {
    try {
      const response = await api.get('/payouts/bank-details');
      return response.data;
    } catch (error) {
      console.error("Error fetching bank details:", error);
      throw error;
    }
  },

  // Get tax information
  getTaxInfo: async (year) => {
    try {
      const response = await api.get(`/payouts/tax-info?year=${year}`);
      return response.data;
    } catch (error) {
      console.error("Error fetching tax info:", error);
      throw error;
    }
  },

  // Download payout statement
  downloadStatement: async (payoutId) => {
    try {
      const response = await api.get(`/payouts/${payoutId}/statement`, {
        responseType: 'blob'
      });
      return response.data;
    } catch (error) {
      console.error("Error downloading payout statement:", error);
      throw error;
    }
  }
};

export default payoutsAPI;
