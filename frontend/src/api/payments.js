import api from "./api";

export const paymentsAPI = {
  // Create Razorpay order
  createRazorpayOrder: async (orderData) => {
    try {
      const response = await api.post('/payments/create-order', orderData);
      return response.data;
    } catch (error) {
      console.error("Error creating Razorpay order:", error);
      throw error;
    }
  },

  // Verify payment
  verifyPayment: async (paymentData) => {
    try {
      const response = await api.post('/payments/verify', paymentData);
      return response.data;
    } catch (error) {
      console.error("Error verifying payment:", error);
      throw error;
    }
  },

  // Process payment (mock mode)
  processMockPayment: async (orderData) => {
    try {
      const response = await api.post('/payments/mock', orderData);
      return response.data;
    } catch (error) {
      console.error("Error processing mock payment:", error);
      throw error;
    }
  },

  // Get payment status
  getPaymentStatus: async (paymentId) => {
    try {
      const response = await api.get(`/payments/${paymentId}/status`);
      return response.data;
    } catch (error) {
      console.error("Error fetching payment status:", error);
      throw error;
    }
  },

  // Get payment details
  getPaymentDetails: async (paymentId) => {
    try {
      const response = await api.get(`/payments/${paymentId}`);
      return response.data;
    } catch (error) {
      console.error("Error fetching payment details:", error);
      throw error;
    }
  },

  // Get payment history
  getPaymentHistory: async (params = {}) => {
    try {
      const queryParams = new URLSearchParams();
      if (params.orderId) queryParams.append('orderId', params.orderId);
      if (params.startDate) queryParams.append('startDate', params.startDate);
      if (params.endDate) queryParams.append('endDate', params.endDate);
      if (params.status) queryParams.append('status', params.status);
      if (params.page) queryParams.append('page', params.page);
      if (params.limit) queryParams.append('limit', params.limit);

      const queryString = queryParams.toString();
      const url = queryString ? `/api/payments?${queryString}` : '/api/payments';

      const response = await api.get(url);
      return response.data;
    } catch (error) {
      console.error("Error fetching payment history:", error);
      throw error;
    }
  },

  // Process refund
  processRefund: async (paymentId, refundData) => {
    try {
      const response = await api.post(`/api/payments/${paymentId}/refund`, refundData);
      return response.data;
    } catch (error) {
      console.error("Error processing refund:", error);
      throw error;
    }
  },

  // Get refund status
  getRefundStatus: async (refundId) => {
    try {
      const response = await api.get(`/api/payments/refunds/${refundId}`);
      return response.data;
    } catch (error) {
      console.error("Error fetching refund status:", error);
      throw error;
    }
  },

  // Capture payment (for partial payments)
  capturePayment: async (paymentId, amount) => {
    try {
      const response = await api.post(`/api/payments/${paymentId}/capture`, {
        amount
      });
      return response.data;
    } catch (error) {
      console.error("Error capturing payment:", error);
      throw error;
    }
  },

  // Get host earnings
  getHostEarnings: async (params = {}) => {
    try {
      const queryParams = new URLSearchParams();
      if (params.startDate) queryParams.append('startDate', params.startDate);
      if (params.endDate) queryParams.append('endDate', params.endDate);
      if (params.listingId) queryParams.append('listingId', params.listingId);

      const queryString = queryParams.toString();
      const url = queryString ? `/api/payments/host-earnings?${queryString}` : '/api/payments/host-earnings';

      const response = await api.get(url);
      return response.data;
    } catch (error) {
      console.error("Error fetching host earnings:", error);
      throw error;
    }
  },

  // Request payout
  requestPayout: async (payoutData) => {
    try {
      const response = await api.post('/api/payments/payout-request', payoutData);
      return response.data;
    } catch (error) {
      console.error("Error requesting payout:", error);
      throw error;
    }
  },

  // Get payout history
  getPayoutHistory: async (params = {}) => {
    try {
      const queryParams = new URLSearchParams();
      if (params.status) queryParams.append('status', params.status);
      if (params.page) queryParams.append('page', params.page);
      if (params.limit) queryParams.append('limit', params.limit);

      const queryString = queryParams.toString();
      const url = queryString ? `/api/payments/payouts?${queryString}` : '/api/payments/payouts';

      const response = await api.get(url);
      return response.data;
    } catch (error) {
      console.error("Error fetching payout history:", error);
      throw error;
    }
  },

  // Get wallet balance
  getWalletBalance: async () => {
    try {
      const response = await api.get('/api/payments/wallet/balance');
      return response.data;
    } catch (error) {
      console.error("Error fetching wallet balance:", error);
      throw error;
    }
  },

  // Get wallet transactions
  getWalletTransactions: async (params = {}) => {
    try {
      const queryParams = new URLSearchParams();
      if (params.type) queryParams.append('type', params.type);
      if (params.startDate) queryParams.append('startDate', params.startDate);
      if (params.endDate) queryParams.append('endDate', params.endDate);
      if (params.page) queryParams.append('page', params.page);
      if (params.limit) queryParams.append('limit', params.limit);

      const queryString = queryParams.toString();
      const url = queryString ? `/api/payments/wallet/transactions?${queryString}` : '/api/payments/wallet/transactions';

      const response = await api.get(url);
      return response.data;
    } catch (error) {
      console.error("Error fetching wallet transactions:", error);
      throw error;
    }
  },

  // Get platform fees breakdown
  getPlatformFeesBreakdown: async (orderData) => {
    try {
      const response = await api.post('/api/payments/fees-breakdown', orderData);
      return response.data;
    } catch (error) {
      console.error("Error fetching platform fees breakdown:", error);
      throw error;
    }
  }
};

// Export individual functions for convenience
export const createPayment = paymentsAPI.createPayment;
export const verifyPayment = paymentsAPI.verifyPayment;
export const refundPayment = paymentsAPI.refundPayment;
export const getPaymentHistory = paymentsAPI.getPaymentHistory;
export const getPaymentStatus = paymentsAPI.getPaymentStatus;
export const capturePayment = paymentsAPI.capturePayment;
export const getHostEarnings = paymentsAPI.getHostEarnings;
export const processPayouts = paymentsAPI.processPayouts;
export const getPayouts = paymentsAPI.getPayouts;
export const processPayout = paymentsAPI.processPayout;
export const getPendingPayouts = paymentsAPI.getPendingPayouts;
export const getWalletBalance = paymentsAPI.getWalletBalance;
export const addFundsToWallet = paymentsAPI.addFundsToWallet;
export const getWalletTransactions = paymentsAPI.getWalletTransactions;
export const getPlatformFeesBreakdown = paymentsAPI.getPlatformFeesBreakdown;

export default paymentsAPI;
