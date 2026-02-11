// Authentication client for RideNDine
class AuthClient {
  constructor() {
    this.session = null;
  }

  // Get API base URL for backward compatibility
  get apiBaseUrl() {
    return window.getApiBaseUrl ? window.getApiBaseUrl() : '';
  }

  // Check current session
  async checkSession() {
    try {
      const response = await window.apiFetch('/api/auth/session');
      const data = await response.json();
      this.session = data;
      return data;
    } catch (error) {
      console.error('Session check failed:', error);
      // On error, return not authenticated and not in demo mode for security
      this.session = {
        authenticated: false,
        demoMode: false,
        role: null
      };
      return this.session;
    }
  }

  // Login
  async login(password, role) {
    try {
      const response = await window.apiFetch('/api/auth/login', {
        method: 'POST',
        body: { password, role }
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
    try {
      const response = await window.apiFetch('/api/auth/logout', {
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
    return true; // Backend is always considered available with the new system
  }

  // Get API base URL (for making API calls)
  getApiBaseUrl() {
    return window.getApiBaseUrl ? window.getApiBaseUrl() : '';
  }
}

// Export global auth client instance
window.AuthClient = new AuthClient();
