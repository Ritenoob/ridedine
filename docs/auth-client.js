// Authentication client for RideNDine
class AuthClient {
  constructor() {
    this.session = null;
  }

  // Check current session
  async checkSession() {
    try {
      const response = await fetch('/api/auth/session');
      const data = await response.json();
      this.session = data;
      return data;
    } catch (error) {
      console.error('Session check failed:', error);
      return { authenticated: false };
    }
  }

  // Login
  async login(password, role) {
    try {
      const response = await fetch('/api/auth/login', {
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
    try {
      const response = await fetch('/api/auth/logout', {
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
}

// Export global auth client instance
window.AuthClient = new AuthClient();
