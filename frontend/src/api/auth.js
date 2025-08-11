import api from './api'

export const authAPI = {
  // Register new user
  register: async (userData) => {
    const response = await api.post('/auth/register', userData)
    return response.data
  },

  // Login user
  login: async (credentials) => {
    const response = await api.post('/auth/login', credentials)
    return response.data
  },

  // Get user profile
  getProfile: async () => {
    const response = await api.get('/auth/profile')
    return response.data
  },

  // Update user profile
  updateProfile: async (profileData) => {
    const response = await api.put('/auth/profile', profileData)
    return response.data
  },

  // Change password
  changePassword: async (passwordData) => {
    const response = await api.post('/auth/change-password', passwordData)
    return response.data
  },

  // Logout (server-side)
  logoutServer: async () => {
    const response = await api.post('/auth/logout')
    return response.data
  },

  // Logout (client-side only)
  logout: () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
  },

  // P2P Marketplace Host Features
  // Update host profile
  updateHostProfile: async (hostProfileData) => {
    const response = await api.patch('/auth/host-profile', hostProfileData)
    return response.data
  },

  // Request host verification
  requestVerification: async (verificationData) => {
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

    const response = await api.post('/auth/request-verification', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return response.data
  },

  // Get verification status
  getVerificationStatus: async () => {
    const response = await api.get('/auth/verification-status')
    return response.data
  },

  // Refresh user profile (get latest data)
  refreshProfile: async () => {
    const response = await api.get('/auth/profile')
    return response.data
  },

  // Enable host mode
  enableHostMode: async (hostData) => {
    const response = await api.post('/auth/enable-host', hostData)
    return response.data
  },

  // Disable host mode
  disableHostMode: async () => {
    const response = await api.post('/auth/disable-host')
    return response.data
  },

  // Forgot password
  forgotPassword: async (email) => {
    const response = await api.post('/auth/forgot-password', { email })
    return response.data
  },

  // Reset password
  resetPassword: async (resetData) => {
    const response = await api.post('/auth/reset-password', resetData)
    return response.data
  },

  // Verify email
  verifyEmail: async (token) => {
    const response = await api.post('/auth/verify-email', { token })
    return response.data
  },

  // Resend verification email
  resendVerificationEmail: async () => {
    const response = await api.post('/auth/resend-verification')
    return response.data
  },

  // Update user preferences
  updatePreferences: async (preferences) => {
    const response = await api.patch('/auth/preferences', preferences)
    return response.data
  },

  // Delete account
  deleteAccount: async (password) => {
    const response = await api.delete('/auth/account', {
      data: { password }
    })
    return response.data
  }
}
