/**
 * RideNDine Layout System
 * Manages shared layouts for different roles and views
 */

(function() {
  'use strict';

  // Global app configuration
  window.AppConfig = {
    demoMode: false,
    currentRole: null,
    currentUser: null
  };

  // Layout Manager
  window.LayoutManager = {
    
    /**
     * Render the complete layout for a given role and view
     * @param {Object} options - Layout options
     * @param {string} options.role - User role (admin, chef, driver, customer, public)
     * @param {string} options.viewContent - HTML content to inject
     * @param {string} options.currentPath - Current route path
     */
    render(options) {
      const { role, viewContent, currentPath } = options;
      const container = document.getElementById('app');
      
      if (!container) {
        console.error('App container not found');
        return;
      }
      
      let layoutHTML = '';
      
      // Choose layout based on role
      switch (role) {
        case 'admin':
          layoutHTML = this.renderAdminLayout(viewContent, currentPath);
          break;
        case 'chef':
          layoutHTML = this.renderChefLayout(viewContent, currentPath);
          break;
        case 'driver':
          layoutHTML = this.renderDriverLayout(viewContent, currentPath);
          break;
        case 'customer':
          layoutHTML = this.renderCustomerLayout(viewContent, currentPath);
          break;
        default:
          layoutHTML = this.renderPublicLayout(viewContent, currentPath);
      }
      
      container.innerHTML = layoutHTML;
      
      // Attach event listeners
      this.attachEventListeners();
    },
    
    /**
     * Render Admin Layout (sidebar navigation)
     */
    renderAdminLayout(content, currentPath) {
      return `
        ${this.renderTopBar('admin', currentPath)}
        <div class="admin-layout">
          ${this.renderAdminSidebar(currentPath)}
          <main class="admin-main">
            ${content}
          </main>
        </div>
      `;
    },
    
    /**
     * Render Chef Layout (sidebar navigation)
     */
    renderChefLayout(content, currentPath) {
      return `
        ${this.renderTopBar('chef', currentPath)}
        <div class="chef-layout">
          ${this.renderChefSidebar(currentPath)}
          <main class="chef-main">
            ${content}
          </main>
        </div>
      `;
    },
    
    /**
     * Render Driver Layout (bottom navigation for mobile-first)
     */
    renderDriverLayout(content, currentPath) {
      return `
        ${this.renderTopBar('driver', currentPath)}
        <main class="driver-main">
          ${content}
        </main>
        ${this.renderDriverBottomNav(currentPath)}
      `;
    },
    
    /**
     * Render Customer Layout (storefront style)
     */
    renderCustomerLayout(content, currentPath) {
      return `
        ${this.renderTopBar('customer', currentPath)}
        <main class="customer-main">
          ${content}
        </main>
      `;
    },
    
    /**
     * Render Public Layout (minimal, for landing pages)
     */
    renderPublicLayout(content, currentPath) {
      return `
        ${this.renderTopBar('public', currentPath)}
        <main class="public-main">
          ${content}
        </main>
      `;
    },
    
    /**
     * Render Top Bar (shared across all layouts)
     */
    renderTopBar(role, currentPath) {
      const isDemoMode = window.AppConfig.demoMode;
      
      return `
        <header class="app-header">
          <div class="app-header__brand">
            <a href="/" onclick="event.preventDefault(); navigateTo('/'); return false;">
              <span class="app-logo">🍽️ RIDE N DINE</span>
            </a>
          </div>
          
          ${isDemoMode ? this.renderDemoBanner() : ''}
          
          <div class="app-header__actions">
            ${isDemoMode ? this.renderRoleSwitcher(role) : ''}
            ${role !== 'public' ? this.renderLogoutButton() : ''}
          </div>
        </header>
      `;
    },
    
    /**
     * Render Demo Mode Banner
     */
    renderDemoBanner() {
      return `
        <div class="demo-banner">
          <span class="demo-banner__icon">🎮</span>
          <span class="demo-banner__text">DEMO MODE</span>
        </div>
      `;
    },
    
    /**
     * Render Role Switcher (Demo Mode only)
     */
    renderRoleSwitcher(currentRole) {
      const roles = [
        { id: 'customer', label: 'Customer', icon: '👤' },
        { id: 'admin', label: 'Admin', icon: '🔐' },
        { id: 'chef', label: 'Chef', icon: '👨‍🍳' },
        { id: 'driver', label: 'Driver', icon: '🚗' }
      ];
      
      return `
        <div class="role-switcher">
          <label class="role-switcher__label">Switch Role:</label>
          <select id="roleSwitcher" class="role-switcher__select">
            ${roles.map(role => `
              <option value="${role.id}" ${role.id === currentRole ? 'selected' : ''}>
                ${role.icon} ${role.label}
              </option>
            `).join('')}
          </select>
        </div>
      `;
    },
    
    /**
     * Render Logout Button
     */
    renderLogoutButton() {
      return `
        <button id="logoutBtn" class="button button--outline button--sm">
          Logout
        </button>
      `;
    },
    
    /**
     * Render Admin Sidebar
     */
    renderAdminSidebar(currentPath) {
      const navItems = [
        { path: '/admin', label: 'Dashboard', icon: '📊' },
        { path: '/admin/customers', label: 'Customers', icon: '👥' },
        { path: '/admin/drivers', label: 'Drivers', icon: '🚗' },
        { path: '/admin/operations', label: 'Operations', icon: '📦' },
        { path: '/admin/payouts', label: 'Payouts', icon: '💰' },
        { path: '/admin/disputes', label: 'Disputes', icon: '⚠️' },
        { path: '/admin/integrations', label: 'Integrations', icon: '🔌' },
        { path: '/admin/live-map', label: 'Live Map', icon: '🗺️' },
        { path: '/admin/driver-simulator', label: 'Simulator', icon: '🎮' }
      ];
      
      return `
        <aside class="sidebar sidebar--admin">
          <nav class="sidebar__nav">
            ${navItems.map(item => `
              <a 
                href="${item.path}" 
                class="sidebar__link ${currentPath === item.path ? 'sidebar__link--active' : ''}"
                onclick="event.preventDefault(); navigateTo('${item.path}'); return false;"
              >
                <span class="sidebar__icon">${item.icon}</span>
                <span class="sidebar__label">${item.label}</span>
              </a>
            `).join('')}
          </nav>
        </aside>
      `;
    },
    
    /**
     * Render Chef Sidebar
     */
    renderChefSidebar(currentPath) {
      const navItems = [
        { path: '/chef-portal/dashboard', label: 'Dashboard', icon: '📊' },
        { path: '/chef-portal/orders', label: 'Orders', icon: '📋' },
        { path: '/chef-portal/menu', label: 'Menu', icon: '📖' }
      ];
      
      return `
        <aside class="sidebar sidebar--chef">
          <nav class="sidebar__nav">
            ${navItems.map(item => `
              <a 
                href="${item.path}" 
                class="sidebar__link ${currentPath === item.path ? 'sidebar__link--active' : ''}"
                onclick="event.preventDefault(); navigateTo('${item.path}'); return false;"
              >
                <span class="sidebar__icon">${item.icon}</span>
                <span class="sidebar__label">${item.label}</span>
              </a>
            `).join('')}
          </nav>
        </aside>
      `;
    },
    
    /**
     * Render Driver Bottom Navigation
     */
    renderDriverBottomNav(currentPath) {
      const navItems = [
        { path: '/driver', label: 'Dashboard', icon: '🏠' },
        { path: '/driver/jobs', label: 'Jobs', icon: '📦' }
      ];
      
      return `
        <nav class="bottom-nav">
          ${navItems.map(item => `
            <a 
              href="${item.path}" 
              class="bottom-nav__link ${currentPath === item.path ? 'bottom-nav__link--active' : ''}"
              onclick="event.preventDefault(); navigateTo('${item.path}'); return false;"
            >
              <span class="bottom-nav__icon">${item.icon}</span>
              <span class="bottom-nav__label">${item.label}</span>
            </a>
          `).join('')}
        </nav>
      `;
    },
    
    /**
     * Attach event listeners to layout elements
     */
    attachEventListeners() {
      // Role switcher
      const roleSwitcher = document.getElementById('roleSwitcher');
      if (roleSwitcher) {
        roleSwitcher.addEventListener('change', async (e) => {
          const newRole = e.target.value;
          await this.switchRole(newRole);
        });
      }
      
      // Logout button
      const logoutBtn = document.getElementById('logoutBtn');
      if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
          await this.logout();
        });
      }
    },
    
    /**
     * Switch user role (Demo Mode only)
     */
    async switchRole(role) {
      try {
        const response = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ role })
        });
        
        const data = await response.json();
        
        if (data.success) {
          window.AppConfig.currentRole = role;
          navigateTo(data.redirect);
        } else {
          alert('Failed to switch role: ' + (data.error || 'Unknown error'));
        }
      } catch (error) {
        console.error('Role switch error:', error);
        alert('Failed to switch role. Please try again.');
      }
    },
    
    /**
     * Logout user
     */
    async logout() {
      try {
        const response = await fetch('/api/auth/logout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        });
        
        const data = await response.json();
        
        if (data.success) {
          window.AppConfig.currentRole = null;
          window.AppConfig.currentUser = null;
          navigateTo(data.redirect || '/');
        }
      } catch (error) {
        console.error('Logout error:', error);
        navigateTo('/');
      }
    }
  };
  
  /**
   * Initialize app configuration
   */
  async function initializeAppConfig() {
    try {
      // Fetch config from server
      const configResponse = await fetch('/api/config');
      const config = await configResponse.json();
      window.AppConfig.demoMode = config.demoMode;
      
      // Check session
      if (window.AuthClient) {
        const session = await window.AuthClient.checkSession();
        if (session.authenticated) {
          window.AppConfig.currentRole = session.role;
          window.AppConfig.currentUser = session.userId;
        }
      }
    } catch (error) {
      console.error('Failed to initialize app config:', error);
    }
  }
  
  // Auto-initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeAppConfig);
  } else {
    initializeAppConfig();
  }
  
})();
