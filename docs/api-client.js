/**
 * Centralized API Client for RIDENDINE
 * Provides consistent API calling with auth, error handling, and timeouts
 */

(function() {
  'use strict';

  const DEFAULT_TIMEOUT = 30000; // 30 seconds
  const API_BASE_URL = window.API_BASE_URL || window.__RIDENDINE_CONFIG__?.apiBaseUrl || '';

  /**
   * Enhanced API fetch with timeout, auth, and error handling
   * @param {string} endpoint - API endpoint (e.g., '/api/auth/login')
   * @param {object} options - Fetch options
   * @param {number} options.timeout - Request timeout in ms (default: 30000)
   * @returns {Promise<{ok: boolean, status: number, data: any}>}
   */
  window.apiClient = async function(endpoint, options = {}) {
    const {
      timeout = DEFAULT_TIMEOUT,
      headers = {},
      ...fetchOptions
    } = options;

    // Ensure endpoint starts with /
    if (!endpoint.startsWith('/')) {
      endpoint = '/' + endpoint;
    }

    // Construct full URL
    const url = API_BASE_URL ? `${API_BASE_URL}${endpoint}` : endpoint;

    // Get auth token if available
    const authToken = localStorage.getItem('auth_token');

    // Default headers
    const defaultHeaders = {
      'Content-Type': 'application/json',
      ...(authToken ? { 'Authorization': `Bearer ${authToken}` } : {}),
      ...headers
    };

    // Merge options
    const finalOptions = {
      credentials: API_BASE_URL ? 'include' : 'same-origin',
      ...fetchOptions,
      headers: defaultHeaders
    };

    // Handle body serialization
    if (finalOptions.body && typeof finalOptions.body === 'object' && !(finalOptions.body instanceof FormData)) {
      finalOptions.body = JSON.stringify(finalOptions.body);
    }

    // Create abort controller for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        ...finalOptions,
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      // Parse JSON response if content-type is json
      const contentType = response.headers.get('content-type');
      let data = null;
      
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        data = await response.text();
      }

      // Check for auth errors
      if (response.status === 401) {
        // Clear auth tokens
        localStorage.removeItem('auth_token');
        localStorage.removeItem('auth_user');
        
        // Only redirect if not already on a login page
        if (!window.location.pathname.endsWith('/login') && 
            !window.location.pathname.endsWith('/login.html')) {
          const errorData = typeof data === 'object' ? data : {};
          const redirect = errorData.error?.redirect || '/admin/login';
          window.location.href = redirect;
        }
      }

      return {
        ok: response.ok,
        status: response.status,
        data: data
      };
    } catch (error) {
      clearTimeout(timeoutId);

      if (error.name === 'AbortError') {
        throw new Error('Request timeout - please check your connection and try again');
      }

      console.error('[API Client] Request failed:', error);
      throw error;
    }
  };

  /**
   * Convenience methods for common HTTP verbs
   */
  window.apiClient.get = function(endpoint, options = {}) {
    return window.apiClient(endpoint, { ...options, method: 'GET' });
  };

  window.apiClient.post = function(endpoint, body, options = {}) {
    return window.apiClient(endpoint, { ...options, method: 'POST', body });
  };

  window.apiClient.put = function(endpoint, body, options = {}) {
    return window.apiClient(endpoint, { ...options, method: 'PUT', body });
  };

  window.apiClient.patch = function(endpoint, body, options = {}) {
    return window.apiClient(endpoint, { ...options, method: 'PATCH', body });
  };

  window.apiClient.delete = function(endpoint, options = {}) {
    return window.apiClient(endpoint, { ...options, method: 'DELETE' });
  };

  console.log('[API Client] Initialized with base URL:', API_BASE_URL || '(same-origin)');
})();
