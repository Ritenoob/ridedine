// Simple client-side router for RideNDine
class Router {
  constructor() {
    this.routes = new Map();
    this.currentRoute = null;
    this.beforeEachHooks = [];
    
    // Listen to popstate (browser back/forward)
    window.addEventListener('popstate', () => {
      this.navigate(window.location.pathname, false);
    });
  }

  // Register a route
  addRoute(path, handler, options = {}) {
    this.routes.set(path, {
      handler,
      requiresAuth: options.requiresAuth || false,
      allowedRoles: options.allowedRoles || [],
      title: options.title || 'RideNDine'
    });
  }

  // Add before navigation hook
  beforeEach(hook) {
    this.beforeEachHooks.push(hook);
  }

  // Navigate to a path
  async navigate(path, pushState = true) {
    // Run before hooks
    for (const hook of this.beforeEachHooks) {
      const result = await hook(path, this.currentRoute);
      if (result === false) {
        return; // Navigation cancelled
      }
    }

    // Match route
    let matchedRoute = null;
    let params = {};

    for (const [routePath, routeConfig] of this.routes.entries()) {
      const match = this.matchPath(routePath, path);
      if (match) {
        matchedRoute = routeConfig;
        params = match.params;
        break;
      }
    }

    // If no match, try 404
    if (!matchedRoute) {
      matchedRoute = this.routes.get('*') || this.routes.get('/404');
      if (!matchedRoute) {
        console.error('No route found for:', path);
        return;
      }
    }

    // Check authentication
    if (matchedRoute.requiresAuth) {
      const session = await window.AuthClient.checkSession();
      if (!session.authenticated) {
        // Redirect to login based on role
        const loginPath = this.getLoginPath(path);
        window.location.href = loginPath;
        return;
      }

      // Check role
      if (matchedRoute.allowedRoles.length > 0) {
        if (!matchedRoute.allowedRoles.includes(session.role)) {
          alert('Access denied: insufficient permissions');
          return;
        }
      }
    }

    // Update history
    if (pushState && path !== window.location.pathname) {
      window.history.pushState({}, '', path);
    }

    // Update title
    document.title = matchedRoute.title;

    // Execute handler
    this.currentRoute = path;
    await matchedRoute.handler(params);
  }

  // Match a route path with params
  matchPath(routePath, actualPath) {
    // Exact match
    if (routePath === actualPath) {
      return { params: {} };
    }

    // Wildcard match
    if (routePath === '*') {
      return { params: {} };
    }

    // Param match (e.g., /order/:orderId)
    const routeParts = routePath.split('/');
    const actualParts = actualPath.split('/');

    if (routeParts.length !== actualParts.length) {
      return null;
    }

    const params = {};
    for (let i = 0; i < routeParts.length; i++) {
      if (routeParts[i].startsWith(':')) {
        const paramName = routeParts[i].slice(1);
        params[paramName] = actualParts[i];
      } else if (routeParts[i] !== actualParts[i]) {
        return null;
      }
    }

    return { params };
  }

  // Get login path based on target route
  getLoginPath(targetPath) {
    if (targetPath.startsWith('/admin')) {
      return '/admin/login';
    } else if (targetPath.startsWith('/chef-portal')) {
      return '/chef-portal/login';
    } else if (targetPath.startsWith('/driver')) {
      return '/driver/login';
    }
    return '/admin/login';
  }

  // Start the router
  start() {
    const path = window.location.pathname;
    this.navigate(path, false);
  }
}

// Export global router instance
window.Router = new Router();
