/**
 * RideNDine API Base URL Detection & Fetch Utilities
 * 
 * Provides automatic API base URL detection with the following priority:
 * 1. Query string override: ?api=https://...
 * 2. Config file: window.__RIDENDINE_CONFIG__.apiBaseUrl
 * 3. localStorage override: API_BASE_URL
 * 4. Default same-origin: '' (so /api/... works when frontend and backend are same-origin)
 */

(function() {
  'use strict';

  let cachedApiBase = null;
  let cachedDemoMode = null;

  /**
   * Detect and return the API base URL
   * @returns {string} API base URL (without trailing slash)
   */
  function detectApiBaseUrl() {
    if (cachedApiBase !== null) {
      return cachedApiBase;
    }

    let apiBase = '';

    // Priority 1: Query string override (?api=https://...)
    const urlParams = new URLSearchParams(window.location.search);
    const queryApi = urlParams.get('api');
    if (queryApi) {
      // Validate it starts with http
      if (queryApi.startsWith('http://') || queryApi.startsWith('https://')) {
        apiBase = queryApi;
        console.info('[API Base] Using query string override:', apiBase);
        cachedApiBase = apiBase.replace(/\/$/, ''); // Remove trailing slash
        return cachedApiBase;
      } else {
        console.warn('[API Base] Invalid query string API (must start with http):', queryApi);
      }
    }

    // Priority 2: Config file (window.__RIDENDINE_CONFIG__.apiBaseUrl)
    if (window.__RIDENDINE_CONFIG__ && window.__RIDENDINE_CONFIG__.apiBaseUrl) {
      apiBase = window.__RIDENDINE_CONFIG__.apiBaseUrl;
      console.info('[API Base] Using config file:', apiBase);
      cachedApiBase = apiBase.replace(/\/$/, '');
      return cachedApiBase;
    }

    // Priority 3: localStorage override
    try {
      const localStorageApi = localStorage.getItem('API_BASE_URL');
      if (localStorageApi) {
        apiBase = localStorageApi;
        console.info('[API Base] Using localStorage override:', apiBase);
        cachedApiBase = apiBase.replace(/\/$/, '');
        return cachedApiBase;
      }
    } catch (e) {
      // localStorage might not be available
      console.warn('[API Base] localStorage not available:', e);
    }

    // Priority 4: Default same-origin (empty string)
    // This allows fetch('/api/...') to work when frontend and backend are served together
    apiBase = '';
    console.info('[API Base] Using same-origin default (empty string)');
    cachedApiBase = apiBase;
    return cachedApiBase;
  }

  /**
   * Get the API base URL
   * @returns {string} API base URL (without trailing slash)
   */
  window.getApiBaseUrl = function() {
    return detectApiBaseUrl();
  };

  /**
   * Fetch wrapper that automatically uses the correct API base URL
   * @param {string} path - API path (e.g., '/api/auth/session')
   * @param {Object} options - Fetch options
   * @returns {Promise<Response>} Fetch response
   */
  window.apiFetch = async function(path, options = {}) {
    const base = detectApiBaseUrl();
    const url = `${base}${path}`;

    // Always include credentials for cookie-based auth
    // The CORS configuration on the backend will handle cross-origin cookies
    const fetchOptions = {
      ...options,
      credentials: 'include'
    };

    // Set default headers if not provided
    if (!fetchOptions.headers) {
      fetchOptions.headers = {};
    }

    // Ensure Content-Type is set for POST/PUT/PATCH requests with body
    if (fetchOptions.body && typeof fetchOptions.body === 'object' && !(fetchOptions.body instanceof FormData)) {
      // Check if Content-Type header is already set
      const hasContentType = fetchOptions.headers instanceof Headers 
        ? fetchOptions.headers.has('Content-Type')
        : fetchOptions.headers['Content-Type'];
      
      if (!hasContentType) {
        if (fetchOptions.headers instanceof Headers) {
          fetchOptions.headers.set('Content-Type', 'application/json');
        } else {
          fetchOptions.headers['Content-Type'] = 'application/json';
        }
      }
      // Stringify body if it's an object (not already a string)
      if (typeof fetchOptions.body !== 'string') {
        fetchOptions.body = JSON.stringify(fetchOptions.body);
      }
    }

    return fetch(url, fetchOptions);
  };

  /**
   * Check if demo mode is enabled (from backend /api/config)
   * @returns {Promise<boolean>} Whether demo mode is enabled
   */
  window.checkDemoMode = async function() {
    if (cachedDemoMode !== null) {
      return cachedDemoMode;
    }

    try {
      const response = await window.apiFetch('/api/config');
      if (response.ok) {
        const data = await response.json();
        cachedDemoMode = data.demoMode || false;
        return cachedDemoMode;
      }
    } catch (e) {
      console.warn('[API Base] Failed to check demo mode:', e);
    }

    cachedDemoMode = false;
    return cachedDemoMode;
  };

  /**
   * Get environment info for display
   * @returns {Object} Environment information
   */
  window.getEnvInfo = function() {
    const apiBase = detectApiBaseUrl();
    const isGitHubPages = window.location.hostname.endsWith('.github.io');
    const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    
    let apiDomain = 'same-origin';
    if (apiBase) {
      try {
        const url = new URL(apiBase);
        apiDomain = url.hostname;
      } catch (e) {
        apiDomain = apiBase;
      }
    }

    return {
      apiBase,
      apiDomain,
      isGitHubPages,
      isLocalhost,
      isCrossOrigin: apiBase !== ''
    };
  };

  // Initialize on load
  document.addEventListener('DOMContentLoaded', function() {
    const envInfo = window.getEnvInfo();
    console.info('[API Base] Environment:', envInfo);
  });

})();

