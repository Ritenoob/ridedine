(function () {
  // Configuration for RideNDine API backend
  // Set to empty string for same-origin deployment or localhost
  // Set to backend URL for GitHub Pages deployment with separate backend
  
  const hostname = window.location.hostname;
  const isGitHubPages = hostname.endsWith('.github.io');
  const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1';
  
  let apiBaseUrl = '';
  
  if (isGitHubPages) {
    // For GitHub Pages, use Render backend
    apiBaseUrl = 'https://ridendine-demo.onrender.com';
    console.log("[RideNDine] Running on GitHub Pages, using Render backend");
  } else if (isLocalhost) {
    // For localhost, check if backend is running on different port
    // Default to localhost:3000 for development
    apiBaseUrl = ''; // Same origin for now
    console.log("[RideNDine] Running on localhost, using same-origin backend");
  } else {
    // For custom domain deployment, configure backend URL here if needed
    apiBaseUrl = '';
  }
  
  window.__RIDENDINE_CONFIG__ = { apiBaseUrl };
  window.API_BASE_URL = apiBaseUrl;
  
  // Also set in localStorage for compatibility with older code
  try { 
    if (apiBaseUrl) {
      localStorage.setItem("API_BASE_URL", apiBaseUrl);
    } else {
      localStorage.removeItem("API_BASE_URL");
    }
  } catch (e) {
    console.warn("[RideNDine] localStorage not available:", e);
  }
  
  console.log("[RideNDine] API Base URL:", apiBaseUrl || '(same-origin)');
  
  // Enhanced fetch wrapper for API calls
  window.apiFetch = async function(endpoint, options = {}) {
    // Ensure endpoint starts with /
    if (!endpoint.startsWith('/')) {
      endpoint = '/' + endpoint;
    }
    
    // Construct full URL
    const url = apiBaseUrl ? `${apiBaseUrl}${endpoint}` : endpoint;
    
    // Default options
    const defaultOptions = {
      credentials: apiBaseUrl ? 'include' : 'same-origin',
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {})
      }
    };
    
    // Merge options
    const fetchOptions = {
      ...defaultOptions,
      ...options,
      headers: {
        ...defaultOptions.headers,
        ...(options.headers || {})
      }
    };
    
    // Handle body serialization
    if (fetchOptions.body && typeof fetchOptions.body === 'object' && !(fetchOptions.body instanceof FormData)) {
      fetchOptions.body = JSON.stringify(fetchOptions.body);
    }
    
    try {
      const response = await fetch(url, fetchOptions);
      
      // Parse JSON response if content-type is json
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const data = await response.json();
        return { ok: response.ok, status: response.status, data };
      }
      
      // Return response object for non-JSON responses
      return { ok: response.ok, status: response.status, response };
    } catch (error) {
      console.error('[RideNDine] API fetch error:', error);
      throw error;
    }
  };
  
  // Check backend health
  window.checkBackendHealth = async function() {
    try {
      const result = await window.apiFetch('/api/health');
      if (result.ok) {
        console.log('[RideNDine] Backend health check: OK', result.data);
        return true;
      } else {
        console.warn('[RideNDine] Backend health check failed:', result.status);
        return false;
      }
    } catch (error) {
      console.error('[RideNDine] Backend health check error:', error);
      return false;
    }
  };
})();
