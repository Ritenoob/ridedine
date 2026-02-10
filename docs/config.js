/**
 * RideNDine Configuration
 * This file contains configuration for the frontend application
 */

(function() {
  'use strict';

  // Global configuration object
  window.RideNDineConfig = {
    // API Base URL
    // - Leave empty for same-origin API (local development)
    // - Set to your deployed backend URL for production (e.g., 'https://ridendine-api.railway.app')
    // - Set to null to disable backend (static demo mode)
    apiBaseUrl: '',
    
    // Feature flags
    features: {
      // Enable demo mode features (bypass auth, mock data)
      demoMode: false,
      
      // Enable offline mode (all API calls return mock data)
      offlineMode: false,
    },
    
    // Environment detection
    env: {
      // Detect if running on GitHub Pages
      isGitHubPages: window.location.hostname.endsWith('.github.io'),
      
      // Detect if running on localhost
      isLocalhost: window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1',
      
      // Detect if running in development mode
      isDevelopment: window.location.hostname === 'localhost' || 
                     window.location.hostname === '127.0.0.1' || 
                     window.location.hostname.includes('dev') ||
                     window.location.hostname.includes('staging'),
    }
  };

  // Auto-detect API base URL if not explicitly set
  if (window.RideNDineConfig.apiBaseUrl === '') {
    if (window.RideNDineConfig.env.isGitHubPages) {
      // GitHub Pages - no backend by default
      window.RideNDineConfig.apiBaseUrl = null;
      console.info('GitHub Pages detected - backend API disabled by default');
      console.info('To enable backend, set RideNDineConfig.apiBaseUrl to your deployed backend URL in config.js');
    } else {
      // Same origin (local dev or custom domain with backend)
      window.RideNDineConfig.apiBaseUrl = window.location.origin;
    }
  }

  console.info('RideNDine Config:', window.RideNDineConfig);
})();
