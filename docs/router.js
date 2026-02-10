// Simple client-side router for RideNDine
class Router {
  constructor() {
    this.routes = new Map();
    this.currentRoute = null;
    this.beforeEachHooks = [];
    
    // Detect base path for GitHub Pages deployment
    // Empty for local dev, '/ridendine-demo' for GitHub Pages
    this.basePath = this.detectBasePath();
    
    // Listen to popstate (browser back/forward)
    window.addEventListener('popstate', () => {
      this.navigate(window.location.pathname, false);
    });
  }

  // Detect the base path based on the current hostname
  detectBasePath() {
    const hostname = window.location.hostname;
    const pathname = window.location.pathname;
    
    // GitHub Pages deployment - only match exact GitHub Pages domain pattern
    // Matches: username.github.io or org.github.io
    // Does NOT match: evil.com/github.io or github.io.evil.com
    if (hostname.endsWith('.github.io') || hostname === 'github.io') {
      // For GitHub Pages, the first path segment is the repo name
      // e.g., /ridendine-demo/customer -> base path is /ridendine-demo
      const pathSegments = pathname.split('/').filter(segment => segment.length > 0);
      
      // If we have at least one segment and it's not a file (doesn't end in .html)
      if (pathSegments.length > 0 && !pathSegments[0].endsWith('.html')) {
        return '/' + pathSegments[0];
      }
      
      // If pathname is just /index.html or /, no base path needed
      return '';
    }
    
    // Local development or custom domain
    return '';
  }

  // Remove base path from a pathname
  stripBasePath(pathname) {
    if (this.basePath && pathname.startsWith(this.basePath)) {
      return pathname.substring(this.basePath.length) || '/';
    }
    return pathname;
  }

  // Add base path to a pathname
  addBasePath(pathname) {
    if (this.basePath && !pathname.startsWith(this.basePath)) {
      return this.basePath + pathname;
    }
    return pathname;
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
    // Strip base path for route matching
    let cleanPath = this.stripBasePath(path);
    
    // Normalize path - remove trailing slash unless it's root
    if (cleanPath !== '/' && cleanPath.endsWith('/')) {
      cleanPath = cleanPath.slice(0, -1);
    }
    
    // Run before hooks
    for (const hook of this.beforeEachHooks) {
      const result = await hook(cleanPath, this.currentRoute);
      if (result === false) {
        return; // Navigation cancelled
      }
    }

    // Match route
    let matchedRoute = null;
    let params = {};

    for (const [routePath, routeConfig] of this.routes.entries()) {
      const match = this.matchPath(routePath, cleanPath);
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
      // Add timeout protection for slow/mobile connections
      let session;
      try {
        session = await Promise.race([
          window.AuthClient.checkSession(),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Session check timeout')), 5000)
          )
        ]);
      } catch (error) {
        console.warn('Session check failed or timed out:', error);
        session = { authenticated: false };
      }
      
      if (!session.authenticated) {
        // Redirect to login based on role
        const loginPath = this.getLoginPath(cleanPath);
        window.location.href = this.addBasePath(loginPath);
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

    // Update history with full path (including base path)
    const fullPath = this.addBasePath(cleanPath);
    if (pushState && fullPath !== window.location.pathname) {
      window.history.pushState({}, '', fullPath);
    }

    // Update title
    document.title = matchedRoute.title;

    // Execute handler
    this.currentRoute = cleanPath;
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
    // Check if we were redirected from 404.html
    const redirectPath = sessionStorage.getItem('redirectPath');
    if (redirectPath) {
      sessionStorage.removeItem('redirectPath');
      this.navigate(redirectPath, true);
    } else {
      const path = window.location.pathname;
      this.navigate(path, false);
    }
  }
}

// Export global router instance
window.Router = new Router();
