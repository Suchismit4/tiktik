/**
 * API Service
 * 
 * Provides methods to interact with the backend API.
 * Centralizes API calls and error handling.
 */

// Base URL for API calls
const API_BASE_URL = 'http://fun-walleye-sharing.ngrok-free.app/api';

/**
 * Generic fetch helper with error handling
 * 
 * @param {string} endpoint - API endpoint to call
 * @param {Object} options - Fetch options
 * @returns {Promise<any>} Response data
 */
async function fetchWithErrorHandling(endpoint: string, options: RequestInit = {}): Promise<any> {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
      },
      ...options,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      throw new Error(
        errorData?.message || `API error: ${response.status} ${response.statusText}`
      );
    }

    return await response.json();
  } catch (error) {
    console.error('API request failed:', error);
    throw error;
  }
}

/**
 * Posts API Service
 * Methods for interacting with posts endpoints
 */
export const postsApi = {
  /**
   * Get all posts
   * @returns {Promise<any>} Posts data
   */
  getPosts: () => fetchWithErrorHandling('/posts'),

  /**
   * Get a post by ID
   * @param {string|number} id - Post ID
   * @returns {Promise<any>} Post data
   */
  getPost: (id: string | number) => fetchWithErrorHandling(`/posts/${id}`),

  /**
   * Create a new post
   * @param {object} data - Post data
   * @returns {Promise<any>} Created post
   */
  createPost: (data: any) => fetchWithErrorHandling('/posts', {
    method: 'POST',
    body: JSON.stringify(data),
  }),

  /**
   * Update a post
   * @param {string|number} id - Post ID
   * @param {object} data - Updated post data
   * @returns {Promise<any>} Updated post
   */
  updatePost: (id: string | number, data: any) => fetchWithErrorHandling(`/posts/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),

  /**
   * Delete a post
   * @param {string|number} id - Post ID
   * @returns {Promise<any>} Deletion result
   */
  deletePost: (id: string | number) => fetchWithErrorHandling(`/posts/${id}`, {
    method: 'DELETE',
  }),
};

/**
 * Users API Service
 * Methods for interacting with users endpoints
 */
export const usersApi = {
  /**
   * Get all users
   * @returns {Promise<any>} Users data
   */
  getUsers: () => fetchWithErrorHandling('/users'),

  /**
   * Get a user by ID
   * @param {string|number} id - User ID
   * @returns {Promise<any>} User data
   */
  getUser: (id: string | number) => fetchWithErrorHandling(`/users/${id}`),

  /**
   * Create a new user
   * @param {object} data - User data
   * @returns {Promise<any>} Created user
   */
  createUser: (data: any) => fetchWithErrorHandling('/users', {
    method: 'POST',
    body: JSON.stringify(data),
  }),

  /**
   * Update a user
   * @param {string|number} id - User ID
   * @param {object} data - Updated user data
   * @returns {Promise<any>} Updated user
   */
  updateUser: (id: string | number, data: any) => fetchWithErrorHandling(`/users/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),

  /**
   * Delete a user
   * @param {string|number} id - User ID
   * @returns {Promise<any>} Deletion result
   */
  deleteUser: (id: string | number) => fetchWithErrorHandling(`/users/${id}`, {
    method: 'DELETE',
  }),
};

/**
 * Analytics API Service
 * Methods for sending analytics data to the backend
 */
export const analyticsApi = {
  /**
   * Log user activity
   * @param {object} data - Activity data
   * @returns {Promise<any>} Log result
   */
  logActivity: (data: any) => fetchWithErrorHandling('/analytics/activity', {
    method: 'POST',
    body: JSON.stringify(data),
  }),

  /**
   * Submit survey responses
   * @param {object} data - Survey response data
   * @returns {Promise<any>} Submission result
   */
  submitSurvey: (data: any) => fetchWithErrorHandling('/analytics/survey', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
}; 