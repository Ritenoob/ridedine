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
      await loadPage('/pages/landing.html', 'RIDENDINE | Delivery Sales Tracking Dashboard');
    }, { title: 'RIDENDINE | Delivery Sales Tracking Dashboard' });

    // Customer routes
    router.addRoute('/customer', async () => {
      await loadPage('/pages/customer/index.html', 'Customer Portal | RIDENDINE');
    }, { title: 'Customer Portal | RIDENDINE' });

    // Marketplace - new home cooks browse page
    router.addRoute('/marketplace', async () => {
      await loadPage('/pages/marketplace.html', 'Home Cooks Marketplace | RIDENDINE');
    }, { title: 'Home Cooks Marketplace | RIDENDINE' });

    // Cook profile detail page
    router.addRoute('/cook/:cookSlug', async (params) => {
      await loadPage('/pages/cook-detail.html', 'Cook Profile | RIDENDINE', params);
    }, { title: 'Cook Profile | RIDENDINE' });

    router.addRoute('/chefs', async () => {
      await loadPage('/pages/customer/chefs.html', 'Browse Chefs | RIDENDINE');
    }, { title: 'Browse Chefs | RIDENDINE' });

    router.addRoute('/chefs/:chefSlug', async (params) => {
      await loadPage('/pages/customer/chef-detail.html', `${params.chefSlug} | RIDENDINE`, params);
    }, { title: 'Chef Menu | RIDENDINE' });

    router.addRoute('/cart', async () => {
      await loadPage('/pages/customer/cart.html', 'Cart | RIDENDINE');
    }, { title: 'Cart | RIDENDINE' });

    router.addRoute('/checkout', async () => {
      await loadPage('/pages/customer/checkout.html', 'Checkout | RIDENDINE');
    }, { title: 'Checkout | RIDENDINE' });

    router.addRoute('/checkout/success', async () => {
      await loadPage('/pages/customer/checkout-success.html', 'Order Confirmed | RIDENDINE');
    }, { title: 'Order Confirmed | RIDENDINE' });

    router.addRoute('/checkout/cancel', async () => {
      await loadPage('/pages/customer/checkout-cancel.html', 'Checkout Cancelled | RIDENDINE');
    }, { title: 'Checkout Cancelled | RIDENDINE' });

    // Customer order tracking - general search page
    router.addRoute('/order-tracking', async () => {
      await loadPage('/pages/customer/order-tracking.html', 'Track Order | RIDENDINE');
    }, { title: 'Track Order | RIDENDINE' });

    // Customer order tracking (redacted, public) - specific order
    router.addRoute('/order/:orderId', async (params) => {
      await loadPage('/pages/customer/order-tracking.html', 'Track Order | RIDENDINE', params);
    }, { title: 'Track Order | RIDENDINE' });

    // Legal pages
    router.addRoute('/legal/terms', async () => {
      await loadPage('/legal/terms.html', 'Terms of Service | RIDENDINE');
    }, { title: 'Terms of Service | RIDENDINE' });

    router.addRoute('/legal/privacy', async () => {
      await loadPage('/legal/privacy.html', 'Privacy Policy | RIDENDINE');
    }, { title: 'Privacy Policy | RIDENDINE' });

    // =========================================================================
    // ADMIN ROUTES (Require Admin Authentication)
    // =========================================================================

    router.addRoute('/admin/login', async () => {
      await loadPage('/pages/admin/login.html', 'Admin Login | RIDENDINE');
    }, { title: 'Admin Login | RIDENDINE' });

    router.addRoute('/admin', async () => {
      await loadPage('/pages/admin/dashboard.html', 'Admin Dashboard | RIDENDINE');
    }, { requiresAuth: true, allowedRoles: ['admin'], title: 'Admin Dashboard | RIDENDINE' });

    router.addRoute('/admin/customers', async () => {
      await loadPage('/pages/admin/customers.html', 'Customers | RIDENDINE Admin');
    }, { requiresAuth: true, allowedRoles: ['admin'], title: 'Customers | RIDENDINE Admin' });

    router.addRoute('/admin/drivers', async () => {
      await loadPage('/pages/admin/drivers.html', 'Drivers | RIDENDINE Admin');
    }, { requiresAuth: true, allowedRoles: ['admin'], title: 'Drivers | RIDENDINE Admin' });

    router.addRoute('/admin/operations', async () => {
      await loadPage('/pages/admin/operations.html', 'Operations | RIDENDINE Admin');
    }, { requiresAuth: true, allowedRoles: ['admin'], title: 'Operations | RIDENDINE Admin' });

    router.addRoute('/admin/payouts', async () => {
      await loadPage('/pages/admin/payouts.html', 'Payouts | RIDENDINE Admin');
    }, { requiresAuth: true, allowedRoles: ['admin'], title: 'Payouts | RIDENDINE Admin' });

    router.addRoute('/admin/disputes', async () => {
      await loadPage('/pages/admin/disputes.html', 'Disputes | RIDENDINE Admin');
    }, { requiresAuth: true, allowedRoles: ['admin'], title: 'Disputes | RIDENDINE Admin' });

    router.addRoute('/admin/legal/terms', async () => {
      await loadPage('/pages/admin/legal/terms.html', 'Terms of Service | RIDENDINE Admin');
    }, { requiresAuth: true, allowedRoles: ['admin'], title: 'Terms of Service | RIDENDINE Admin' });

    router.addRoute('/admin/legal/privacy', async () => {
      await loadPage('/pages/admin/legal/privacy.html', 'Privacy Policy | RIDENDINE Admin');
    }, { requiresAuth: true, allowedRoles: ['admin'], title: 'Privacy Policy | RIDENDINE Admin' });

    router.addRoute('/admin/live-map', async () => {
      await loadPage('/pages/admin/live-map.html', 'Live Map | RIDENDINE Admin');
    }, { requiresAuth: true, allowedRoles: ['admin'], title: 'Live Map | RIDENDINE Admin' });

    router.addRoute('/admin/driver-simulator', async () => {
      await loadPage('/pages/admin/driver-simulator.html', 'Driver Simulator | RIDENDINE Admin');
    }, { requiresAuth: true, allowedRoles: ['admin'], title: 'Driver Simulator | RIDENDINE Admin' });

    router.addRoute('/admin/integrations', async () => {
      await loadPage('/pages/admin/integrations.html', 'Integrations | RIDENDINE Admin');
    }, { requiresAuth: true, allowedRoles: ['admin'], title: 'Integrations | RIDENDINE Admin' });

    // =========================================================================
    // CHEF PORTAL ROUTES (Require Chef Authentication)
    // =========================================================================

    router.addRoute('/chef-portal/login', async () => {
      await loadPage('/pages/chef-portal/login.html', 'Chef Login | RIDENDINE');
    }, { title: 'Chef Login | RIDENDINE' });

    router.addRoute('/chef-portal/dashboard', async () => {
      await loadPage('/pages/chef-portal/dashboard.html', 'Chef Dashboard | RIDENDINE');
    }, { requiresAuth: true, allowedRoles: ['chef'], title: 'Chef Dashboard | RIDENDINE' });

    router.addRoute('/chef-portal/orders', async () => {
      await loadPage('/pages/chef-portal/orders.html', 'Orders | RIDENDINE Chef Portal');
    }, { requiresAuth: true, allowedRoles: ['chef'], title: 'Orders | RIDENDINE Chef Portal' });

    router.addRoute('/chef-portal/menu', async () => {
      await loadPage('/pages/chef-portal/menu.html', 'Menu | RIDENDINE Chef Portal');
    }, { requiresAuth: true, allowedRoles: ['chef'], title: 'Menu | RIDENDINE Chef Portal' });

    // =========================================================================
    // DRIVER APP ROUTES (Require Driver Authentication)
    // =========================================================================

    router.addRoute('/driver/login', async () => {
      await loadPage('/pages/driver/login.html', 'Driver Login | RIDENDINE');
    }, { title: 'Driver Login | RIDENDINE' });

    router.addRoute('/driver', async () => {
      await loadPage('/pages/driver/dashboard.html', 'Driver Dashboard | RIDENDINE');
    }, { requiresAuth: true, allowedRoles: ['driver'], title: 'Driver Dashboard | RIDENDINE' });

    router.addRoute('/driver/jobs', async () => {
      await loadPage('/pages/driver/jobs.html', 'Available Jobs | RIDENDINE Driver');
    }, { requiresAuth: true, allowedRoles: ['driver'], title: 'Available Jobs | RIDENDINE Driver' });

    router.addRoute('/driver/navigation/:jobId', async (params) => {
      await loadPage('/pages/driver/navigation.html', 'Navigation | RIDENDINE Driver', params);
    }, { requiresAuth: true, allowedRoles: ['driver'], title: 'Navigation | RIDENDINE Driver' });

    router.addRoute('/driver/pod/:jobId', async (params) => {
      await loadPage('/pages/driver/proof-of-delivery.html', 'Proof of Delivery | RIDENDINE Driver', params);
    }, { requiresAuth: true, allowedRoles: ['driver'], title: 'Proof of Delivery | RIDENDINE Driver' });

    // =========================================================================
    // 404 FALLBACK
    // =========================================================================

    router.addRoute('*', async () => {
      await loadPage('/pages/404.html', '404 Not Found | RIDENDINE');
    }, { title: '404 Not Found | RIDENDINE' });

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

    // Show loading spinner
    if (window.showLoading) {
      window.showLoading();
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
    } finally {
      // Always hide loading spinner
      if (window.hideLoading) {
        window.hideLoading();
      }
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
