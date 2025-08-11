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

  // Logout (client-side only)
  logout: () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
  }
}
