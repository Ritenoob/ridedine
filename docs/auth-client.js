// Authentication client for RideNDine
class AuthClient {
  constructor() {
    this.session = null;
    this.apiBaseUrl = this.detectApiBaseUrl();
  }

  // Detect API base URL
  // For GitHub Pages (static hosting), API is not available
  // For local development, API is at same origin
  detectApiBaseUrl() {
    // Use config if available
    if (window.RideNDineConfig && window.RideNDineConfig.apiBaseUrl !== undefined) {
      return window.RideNDineConfig.apiBaseUrl;
    }
    
    // Fallback detection
    const hostname = window.location.hostname;
    
    // GitHub Pages deployment - no backend API available
    if (hostname.endsWith('.github.io') || hostname === 'github.io') {
      console.info('GitHub Pages deployment detected - backend API not available');
      return null;
    }
    
    // Local development or custom domain with backend
    return window.location.origin;
  }

  // Check current session
  async checkSession() {
    // If no API available (GitHub Pages), return unauthenticated session in demo mode
    if (!this.apiBaseUrl) {
      console.info('No backend API - returning demo mode session');
      this.session = {
        authenticated: false,
        demoMode: true,
        role: null
      };
      return this.session;
    }

    try {
      const response = await fetch(`${this.apiBaseUrl}/api/auth/session`);
      const data = await response.json();
      this.session = data;
      return data;
    } catch (error) {
      console.error('Session check failed:', error);
      // Return demo mode session on error
      this.session = {
        authenticated: false,
        demoMode: true,
        role: null
      };
      return this.session;
    }
  }

  // Login
  async login(password, role) {
    // If no API available, show message to user
    if (!this.apiBaseUrl) {
      throw new Error('Backend API not available. This is a static demo deployment. To use authentication features, deploy the backend server.');
    }

    try {
      const response = await fetch(`${this.apiBaseUrl}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ password, role })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Login failed');
      }

      this.session = data;
      return data;
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  }

  // Logout
  async logout() {
    // If no API available, just clear local session
    if (!this.apiBaseUrl) {
      this.session = null;
      return { success: true };
    }

    try {
      const response = await fetch(`${this.apiBaseUrl}/api/auth/logout`, {
        method: 'POST'
      });

      const data = await response.json();
      this.session = null;
      return data;
    } catch (error) {
      console.error('Logout failed:', error);
      throw error;
    }
  }

  // Check if user is authenticated
  isAuthenticated() {
    return this.session && this.session.authenticated;
  }

  // Get current role
  getRole() {
    return this.session?.role || null;
  }

  // Check if user has role
  hasRole(role) {
    return this.session?.role === role;
  }

  // Check if backend API is available
  hasBackend() {
    return this.apiBaseUrl !== null;
  }

  // Get API base URL (for making API calls)
  getApiBaseUrl() {
    return this.apiBaseUrl || '';
  }
}

// Export global auth client instance
window.AuthClient = new AuthClient();
