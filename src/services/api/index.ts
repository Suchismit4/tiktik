/**
 * API Service
 * 
 * Provides methods to interact with the backend API.
 * Centralizes API calls and error handling.
 */

// Base URL for API calls
const API_BASE_URL = 'http://192.168.1.10:3000/api';

/**
 * Process video URLs to use streaming endpoints when available
 * @param {any} post - Post object with video data
 * @returns {any} Post object with processed streaming URLs
 */
function processVideoUrls(post: any): any {
  if (!post) return post;

  // Create a copy to avoid mutating the original
  const processedPost = { ...post };

  // Check if the video URL is a streaming endpoint (starts with /api/stream/)
  if (post.uri && post.uri.startsWith('/api/stream/')) {
    // Already a streaming URL, convert to full URL
    processedPost.uri = `${API_BASE_URL.replace('/api', '')}${post.uri}`;
    processedPost.streamingUrl = processedPost.uri;
    processedPost.fallbackUrl = post.fallback_url || post.original_url || null;
  } else if (post.uri) {
    // External URL, check if streaming version exists and set up fallback
    processedPost.streamingUrl = null; // Will be checked dynamically
    processedPost.fallbackUrl = post.uri;
    processedPost.uri = post.uri; // Keep original for now
  }

  // Process thumbnail URLs similarly
  if (post.thumbnail_url && post.thumbnail_url.startsWith('/api/stream/')) {
    processedPost.thumbnail_url = `${API_BASE_URL.replace('/api', '')}${post.thumbnail_url}`;
  }

  return processedPost;
}

/**
 * Check if a streaming URL is available for a video
 * @param {string} videoId - Video ID or filename
 * @returns {Promise<string|null>} Streaming URL if available, null otherwise
 */
async function checkStreamingAvailability(videoId: string): Promise<string | null> {
  try {
    const streamingUrl = `${API_BASE_URL}/stream/video/${videoId}`;
    console.log(`Checking streaming availability for: ${streamingUrl}`);
    const response = await fetch(streamingUrl, { method: 'HEAD' });
    console.log(`Streaming check result for ${videoId}: ${response.status} ${response.ok ? 'OK' : 'FAILED'}`);
    return response.ok ? streamingUrl : null;
  } catch (error) {
    console.log(`Streaming check failed for ${videoId}:`, error);
    return null;
  }
}

/**
 * Get the best available video URL (streaming first, then fallback)
 * @param {any} post - Post object with video data
 * @returns {Promise<string>} Best available video URL
 */
export async function getBestVideoUrl(post: any): Promise<string> {
  console.log(`Getting best video URL for post ${post.id}:`, post.uri);
  
  // If we already have a streaming URL, use it
  if (post.streamingUrl) {
    console.log(`Using existing streaming URL: ${post.streamingUrl}`);
    return post.streamingUrl;
  }

  // If we have a video ID or can extract one, try streaming
  if (post.id) {
    const streamingUrl = await checkStreamingAvailability(post.id.toString());
    if (streamingUrl) {
      console.log(`Found streaming URL for ID ${post.id}: ${streamingUrl}`);
      return streamingUrl;
    }
  }

  // Extract potential filename from original URL for streaming check
  if (post.uri && !post.uri.startsWith('http')) {
    const streamingUrl = await checkStreamingAvailability(post.uri);
    if (streamingUrl) {
      console.log(`Found streaming URL for filename: ${streamingUrl}`);
      return streamingUrl;
    }
  }

  // Fall back to original URL
  console.log(`Using fallback URL: ${post.fallbackUrl || post.uri}`);
  return post.fallbackUrl || post.uri;
}

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
   * Get all posts with streaming URL processing
   * @returns {Promise<any>} Posts data with processed streaming URLs
   */
  getPosts: async () => {
    const posts = await fetchWithErrorHandling('/posts');
    return posts.map(processVideoUrls);
  },

  /**
   * Get a post by ID with streaming URL processing
   * @param {string|number} id - Post ID
   * @returns {Promise<any>} Post data with processed streaming URLs
   */
  getPost: async (id: string | number) => {
    const post = await fetchWithErrorHandling(`/posts/${id}`);
    return processVideoUrls(post);
  },

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