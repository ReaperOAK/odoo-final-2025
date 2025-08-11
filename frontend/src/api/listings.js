import api from "./api";

export const listingsAPI = {
  // Get all listings with optional filters
  getListings: async (params = {}) => {
    try {
      const queryParams = new URLSearchParams();

      if (params.from) queryParams.append('from', params.from);
      if (params.to) queryParams.append('to', params.to);
      if (params.query) queryParams.append('search', params.query); // Changed from 'query' to 'search'
      if (params.category) queryParams.append('category', params.category);
      if (params.location) queryParams.append('city', params.location); // Changed from 'location' to 'city'
      if (params.minPrice) queryParams.append('minPrice', params.minPrice);
      if (params.maxPrice) queryParams.append('maxPrice', params.maxPrice);
      if (params.unitType) queryParams.append('unitType', params.unitType);
      if (params.sortBy) queryParams.append('sortBy', params.sortBy);
      if (params.verifiedOnly) queryParams.append('verifiedOnly', params.verifiedOnly);
      if (params.hostId) queryParams.append('lenderId', params.hostId); // Changed from 'hostId' to 'lenderId'
      if (params.page) queryParams.append('page', params.page);
      if (params.limit) queryParams.append('limit', params.limit);

      const queryString = queryParams.toString();
      const url = queryString ? `/listings?${queryString}` : '/listings';

      const response = await api.get(url);
      return response.data;
    } catch (error) {
      console.error("Error fetching listings:", error);
      throw error;
    }
  },

  // Get single listing by ID
  getListing: async (id) => {
    try {
      const response = await api.get(`/listings/${id}`);
      return response.data;
    } catch (error) {
      console.error("Error fetching listing:", error);
      throw error;
    }
  },

  // Check availability for specific listing
  checkAvailability: async (listingId, params) => {
    try {
      const queryParams = new URLSearchParams();
      if (params.start) queryParams.append('start', params.start);
      if (params.end) queryParams.append('end', params.end);
      if (params.qty) queryParams.append('qty', params.qty);

      const response = await api.get(`/listings/${listingId}/availability?${queryParams.toString()}`);
      return response.data;
    } catch (error) {
      console.error("Error checking availability:", error);
      throw error;
    }
  },

  // Create new listing (host only)
  createListing: async (listingData) => {
    try {
      const response = await api.post('/listings', listingData);
      return response.data;
    } catch (error) {
      console.error("Error creating listing:", error);
      throw error;
    }
  },

  // Update listing (host only)
  updateListing: async (id, listingData) => {
    try {
      const response = await api.put(`/listings/${id}`, listingData);
      return response.data;
    } catch (error) {
      console.error("Error updating listing:", error);
      throw error;
    }
  },

  // Delete listing (host only)
  deleteListing: async (id) => {
    try {
      const response = await api.delete(`/listings/${id}`);
      return response.data;
    } catch (error) {
      console.error("Error deleting listing:", error);
      throw error;
    }
  },

  // Get host's listings
  getHostListings: async (hostId = null) => {
    try {
      const url = hostId ? `/listings?hostId=${hostId}` : '/listings/my';
      const response = await api.get(url);
      return response.data;
    } catch (error) {
      console.error("Error fetching host listings:", error);
      throw error;
    }
  },

  // Toggle listing status
  toggleListingStatus: async (id, status) => {
    try {
      const response = await api.patch(`/listings/${id}/status`, { status });
      return response.data;
    } catch (error) {
      console.error("Error toggling listing status:", error);
      throw error;
    }
  },

  // Upload listing images
  uploadListingImages: async (listingId, images) => {
    try {
      const formData = new FormData();
      images.forEach((image) => {
        formData.append('images', image);
      });

      const response = await api.post(`/listings/${listingId}/images`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      console.error("Error uploading listing images:", error);
      throw error;
    }
  },

  // Delete listing image
  deleteListingImage: async (listingId, imageId) => {
    try {
      const response = await api.delete(`/listings/${listingId}/images/${imageId}`);
      return response.data;
    } catch (error) {
      console.error("Error deleting listing image:", error);
      throw error;
    }
  },

  // Get listing analytics
  getListingAnalytics: async (listingId) => {
    try {
      const response = await api.get(`/listings/${listingId}/analytics`);
      return response.data;
    } catch (error) {
      console.error("Error fetching listing analytics:", error);
      throw error;
    }
  },

  // Search listings with advanced filters
  searchListings: async (searchParams) => {
    try {
      const response = await api.post('/listings/search', searchParams);
      return response.data;
    } catch (error) {
      console.error("Error searching listings:", error);
      throw error;
    }
  },

  // Get featured listings
  getFeaturedListings: async () => {
    try {
      const response = await api.get('/listings/featured');
      return response.data;
    } catch (error) {
      console.error("Error fetching featured listings:", error);
      throw error;
    }
  },

  // Get listings by category
  getListingsByCategory: async (category) => {
    try {
      const response = await api.get(`/listings/category/${category}`);
      return response.data;
    } catch (error) {
      console.error("Error fetching listings by category:", error);
      throw error;
    }
  }
};

// Export individual functions for convenience
export const getListings = listingsAPI.getListings;
export const getListing = listingsAPI.getListing;
export const checkAvailability = listingsAPI.checkAvailability;
export const createListing = listingsAPI.createListing;
export const updateListing = listingsAPI.updateListing;
export const deleteListing = listingsAPI.deleteListing;
export const uploadListingImages = listingsAPI.uploadListingImages;
export const deleteListingImage = listingsAPI.deleteListingImage;
export const toggleListingStatus = listingsAPI.toggleListingStatus;
export const getHostListings = listingsAPI.getHostListings;
export const getListingAnalytics = listingsAPI.getListingAnalytics;
export const searchListings = listingsAPI.searchListings;
export const getFeaturedListings = listingsAPI.getFeaturedListings;
export const getListingsByCategory = listingsAPI.getListingsByCategory;

export default listingsAPI;
