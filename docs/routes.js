// RideNDine Route Configuration and Initialization
// This file registers all application routes with the Router

(function() {
  'use strict';

  // Wait for DOM and Router to be ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeRoutes);
  } else {
    initializeRoutes();
  }

  function initializeRoutes() {
    if (!window.Router) {
      console.error('Router not loaded');
      return;
    }

    const router = window.Router;

    // =========================================================================
    // PUBLIC ROUTES (No Authentication Required)
    // =========================================================================

    // Landing page
    router.addRoute('/', async () => {
      await loadPage('/pages/landing.html', 'RideNDine | Home Chef Delivery');
    }, { title: 'RideNDine | Home Chef Delivery' });

    // Customer routes
    router.addRoute('/customer', async () => {
      await loadPage('/pages/customer/index.html', 'Customer | RideNDine');
    }, { title: 'Customer | RideNDine' });

    router.addRoute('/chefs', async () => {
      await loadPage('/pages/customer/chefs.html', 'Browse Chefs | RideNDine');
    }, { title: 'Browse Chefs | RideNDine' });

    router.addRoute('/chefs/:chefSlug', async (params) => {
      await loadPage('/pages/customer/chef-detail.html', `${params.chefSlug} | RideNDine`, params);
    }, { title: 'Chef Menu | RideNDine' });

    router.addRoute('/cart', async () => {
      await loadPage('/pages/customer/cart.html', 'Cart | RideNDine');
    }, { title: 'Cart | RideNDine' });

    router.addRoute('/checkout', async () => {
      await loadPage('/pages/customer/checkout.html', 'Checkout | RideNDine');
    }, { title: 'Checkout | RideNDine' });

    router.addRoute('/checkout/success', async () => {
      await loadPage('/pages/customer/checkout-success.html', 'Order Confirmed | RideNDine');
    }, { title: 'Order Confirmed | RideNDine' });

    router.addRoute('/checkout/cancel', async () => {
      await loadPage('/pages/customer/checkout-cancel.html', 'Checkout Cancelled | RideNDine');
    }, { title: 'Checkout Cancelled | RideNDine' });

    // Customer order tracking (redacted, public)
    router.addRoute('/order/:orderId', async (params) => {
      await loadPage('/pages/customer/order-tracking.html', 'Track Order | RideNDine', params);
    }, { title: 'Track Order | RideNDine' });

    // =========================================================================
    // ADMIN ROUTES (Require Admin Authentication)
    // =========================================================================

    router.addRoute('/admin/login', async () => {
      await loadPage('/pages/admin/login.html', 'Admin Login | RideNDine');
    }, { title: 'Admin Login | RideNDine' });

    router.addRoute('/admin', async () => {
      await loadPage('/pages/admin/dashboard.html', 'Admin Dashboard | RideNDine');
    }, { requiresAuth: true, allowedRoles: ['admin'], title: 'Admin Dashboard | RideNDine' });

    router.addRoute('/admin/customers', async () => {
      await loadPage('/pages/admin/customers.html', 'Customers | Admin');
    }, { requiresAuth: true, allowedRoles: ['admin'], title: 'Customers | Admin' });

    router.addRoute('/admin/drivers', async () => {
      await loadPage('/pages/admin/drivers.html', 'Drivers | Admin');
    }, { requiresAuth: true, allowedRoles: ['admin'], title: 'Drivers | Admin' });

    router.addRoute('/admin/operations', async () => {
      await loadPage('/pages/admin/operations.html', 'Operations | Admin');
    }, { requiresAuth: true, allowedRoles: ['admin'], title: 'Operations | Admin' });

    router.addRoute('/admin/payouts', async () => {
      await loadPage('/pages/admin/payouts.html', 'Payouts | Admin');
    }, { requiresAuth: true, allowedRoles: ['admin'], title: 'Payouts | Admin' });

    router.addRoute('/admin/disputes', async () => {
      await loadPage('/pages/admin/disputes.html', 'Disputes | Admin');
    }, { requiresAuth: true, allowedRoles: ['admin'], title: 'Disputes | Admin' });

    router.addRoute('/admin/legal/terms', async () => {
      await loadPage('/pages/admin/legal/terms.html', 'Terms of Service | Admin');
    }, { requiresAuth: true, allowedRoles: ['admin'], title: 'Terms of Service | Admin' });

    router.addRoute('/admin/legal/privacy', async () => {
      await loadPage('/pages/admin/legal/privacy.html', 'Privacy Policy | Admin');
    }, { requiresAuth: true, allowedRoles: ['admin'], title: 'Privacy Policy | Admin' });

    router.addRoute('/admin/live-map', async () => {
      await loadPage('/pages/admin/live-map.html', 'Live Map | Admin');
    }, { requiresAuth: true, allowedRoles: ['admin'], title: 'Live Map | Admin' });

    router.addRoute('/admin/driver-simulator', async () => {
      await loadPage('/pages/admin/driver-simulator.html', 'Driver Simulator | Admin');
    }, { requiresAuth: true, allowedRoles: ['admin'], title: 'Driver Simulator | Admin' });

    router.addRoute('/admin/integrations', async () => {
      await loadPage('/pages/admin/integrations.html', 'Integrations | Admin');
    }, { requiresAuth: true, allowedRoles: ['admin'], title: 'Integrations | Admin' });

    // =========================================================================
    // CHEF PORTAL ROUTES (Require Chef Authentication)
    // =========================================================================

    router.addRoute('/chef-portal/login', async () => {
      await loadPage('/pages/chef-portal/login.html', 'Chef Login | RideNDine');
    }, { title: 'Chef Login | RideNDine' });

    router.addRoute('/chef-portal/dashboard', async () => {
      await loadPage('/pages/chef-portal/dashboard.html', 'Chef Dashboard | RideNDine');
    }, { requiresAuth: true, allowedRoles: ['chef'], title: 'Chef Dashboard | RideNDine' });

    router.addRoute('/chef-portal/orders', async () => {
      await loadPage('/pages/chef-portal/orders.html', 'Orders | Chef Portal');
    }, { requiresAuth: true, allowedRoles: ['chef'], title: 'Orders | Chef Portal' });

    router.addRoute('/chef-portal/menu', async () => {
      await loadPage('/pages/chef-portal/menu.html', 'Menu | Chef Portal');
    }, { requiresAuth: true, allowedRoles: ['chef'], title: 'Menu | Chef Portal' });

    // =========================================================================
    // DRIVER APP ROUTES (Require Driver Authentication)
    // =========================================================================

    router.addRoute('/driver/login', async () => {
      await loadPage('/pages/driver/login.html', 'Driver Login | RideNDine');
    }, { title: 'Driver Login | RideNDine' });

    router.addRoute('/driver', async () => {
      await loadPage('/pages/driver/dashboard.html', 'Driver Dashboard | RideNDine');
    }, { requiresAuth: true, allowedRoles: ['driver'], title: 'Driver Dashboard | RideNDine' });

    router.addRoute('/driver/jobs', async () => {
      await loadPage('/pages/driver/jobs.html', 'Available Jobs | Driver');
    }, { requiresAuth: true, allowedRoles: ['driver'], title: 'Available Jobs | Driver' });

    router.addRoute('/driver/navigation/:jobId', async (params) => {
      await loadPage('/pages/driver/navigation.html', 'Navigation | Driver', params);
    }, { requiresAuth: true, allowedRoles: ['driver'], title: 'Navigation | Driver' });

    router.addRoute('/driver/pod/:jobId', async (params) => {
      await loadPage('/pages/driver/proof-of-delivery.html', 'Proof of Delivery | Driver', params);
    }, { requiresAuth: true, allowedRoles: ['driver'], title: 'Proof of Delivery | Driver' });

    // =========================================================================
    // 404 FALLBACK
    // =========================================================================

    router.addRoute('*', async () => {
      await loadPage('/pages/404.html', '404 Not Found | RideNDine');
    }, { title: '404 Not Found | RideNDine' });

    // Start the router
    router.start();
  }

  // Helper function to load page content
  async function loadPage(path, title, params = {}) {
    const appContainer = document.getElementById('app');
    if (!appContainer) {
      console.error('App container not found');
      return;
    }

    try {
      // Add base path to fetch URL if needed
      const router = window.Router;
      const fetchPath = router.basePath ? router.basePath + path : path;
      
      const response = await fetch(fetchPath);
      if (!response.ok) {
        throw new Error(`Failed to load page: ${response.status}`);
      }
      
      let html = await response.text();
      
      // Replace params in HTML if any
      Object.keys(params).forEach(key => {
        const regex = new RegExp(`{{${key}}}`, 'g');
        html = html.replace(regex, params[key]);
      });
      
      // Determine role based on current session
      let role = 'public';
      const currentPath = router.currentRoute || '/';
      
      if (window.AuthClient && window.AuthClient.session) {
        const session = window.AuthClient.session;
        if (session.authenticated && session.role) {
          role = session.role;
        }
      }
      
      // Determine role from path if not authenticated (for layout purposes)
      if (role === 'public') {
        if (currentPath.startsWith('/admin')) {
          role = 'admin';
        } else if (currentPath.startsWith('/chef-portal')) {
          role = 'chef';
        } else if (currentPath.startsWith('/driver')) {
          role = 'driver';
        } else if (currentPath.startsWith('/customer') || currentPath.startsWith('/chefs') || currentPath.startsWith('/cart') || currentPath.startsWith('/checkout')) {
          role = 'customer';
        }
      }
      
      // Use LayoutManager to render with appropriate layout
      if (window.LayoutManager && role !== 'public') {
        window.LayoutManager.render({
          role: role,
          viewContent: html,
          currentPath: currentPath
        });
      } else {
        // For public/unauthenticated pages, inject directly
        appContainer.innerHTML = html;
      }
      
      // Execute any scripts in the loaded content
      const scripts = appContainer.querySelectorAll('script');
      scripts.forEach(oldScript => {
        const newScript = document.createElement('script');
        Array.from(oldScript.attributes).forEach(attr => {
          newScript.setAttribute(attr.name, attr.value);
        });
        newScript.textContent = oldScript.textContent;
        oldScript.parentNode.replaceChild(newScript, oldScript);
      });
      
      // Scroll to top
      window.scrollTo(0, 0);
      
    } catch (error) {
      console.error('Error loading page:', error);
      const router = window.Router;
      appContainer.innerHTML = `
        <div style="padding: 2rem; text-align: center;">
          <h1>Error Loading Page</h1>
          <p>${error.message}</p>
          <a href="#" onclick="event.preventDefault(); window.navigateTo('/'); return false;" class="button button--primary">Go Home</a>
        </div>
      `;
    }
  }

  // Helper for programmatic navigation
  window.navigateTo = function(path) {
    window.Router.navigate(path);
  };

  // Helper for navigation with query params
  window.navigateToWithParams = function(path, params) {
    const queryString = new URLSearchParams(params).toString();
    const fullPath = queryString ? `${path}?${queryString}` : path;
    window.Router.navigate(fullPath);
  };

})();
