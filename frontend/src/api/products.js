import api from './api'

export const productsAPI = {
  // Get all products
  getProducts: async (params = {}) => {
    const response = await api.get('/products', { params })
    return response.data
  },

  // Get single product
  getProduct: async (id) => {
    const response = await api.get(`/products/${id}`)
    return response.data
  },

  // Create product (admin only)
  createProduct: async (productData) => {
    const response = await api.post('/products', productData)
    return response.data
  },

  // Update product (admin only)
  updateProduct: async (id, productData) => {
    const response = await api.patch(`/products/${id}`, productData)
    return response.data
  },

  // Delete product (admin only)
  deleteProduct: async (id) => {
    const response = await api.delete(`/products/${id}`)
    return response.data
  }
}
