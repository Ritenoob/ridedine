/**
 * Bottom Navigation Bar Component
 * Modern delivery app navigation pattern
 */

(function() {
  'use strict';

  // Initialize bottom nav when DOM is ready
  function initBottomNav() {
    // Check if we should show bottom nav (only on certain pages)
    const showNavPaths = ['/marketplace', '/customer', '/chefs', '/cart', '/cook/', '/order-tracking', '/offers', '/account'];
    const currentPath = window.location.pathname;
    
    const shouldShow = showNavPaths.some(path => {
      if (path.endsWith('/')) {
        return currentPath.includes(path);
      }
      return currentPath === path || currentPath.startsWith(path);
    });

    if (!shouldShow) {
      const existingNav = document.getElementById('bottom-nav');
      if (existingNav) {
        existingNav.remove();
      }
      return;
    }

    // Create bottom nav if it doesn't exist
    let bottomNav = document.getElementById('bottom-nav');
    if (!bottomNav) {
      bottomNav = document.createElement('div');
      bottomNav.id = 'bottom-nav';
      bottomNav.className = 'bottom-nav';
      document.body.appendChild(bottomNav);
    }

    // Render bottom nav content
    renderBottomNav(bottomNav, currentPath);
  }

  function renderBottomNav(container, currentPath) {
    const navItems = [
      {
        id: 'home',
        label: 'Home',
        icon: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
          <polyline points="9 22 9 12 15 12 15 22"></polyline>
        </svg>`,
        path: '/marketplace',
        active: currentPath === '/marketplace' || currentPath === '/customer' || currentPath === '/'
      },
      {
        id: 'services',
        label: 'Services',
        icon: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="3" y="3" width="7" height="7"></rect>
          <rect x="14" y="3" width="7" height="7"></rect>
          <rect x="14" y="14" width="7" height="7"></rect>
          <rect x="3" y="14" width="7" height="7"></rect>
        </svg>`,
        path: '/services',
        active: currentPath === '/services',
        comingSoon: true
      },
      {
        id: 'activity',
        label: 'Activity',
        icon: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
        </svg>`,
        path: '/order-tracking',
        active: currentPath === '/order-tracking' || currentPath.startsWith('/order/')
      },
      {
        id: 'offers',
        label: 'Offers',
        icon: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="8" r="6"></circle>
          <path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11"></path>
        </svg>`,
        path: '/offers',
        active: currentPath === '/offers'
      },
      {
        id: 'account',
        label: 'Account',
        icon: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path>
          <circle cx="12" cy="7" r="4"></circle>
        </svg>`,
        path: '/account',
        active: currentPath === '/account'
      }
    ];

    const html = navItems.map(item => `
      <button 
        class="bottom-nav__item ${item.active ? 'active' : ''}" 
        onclick="navigateTo('${item.path}')"
        ${item.comingSoon ? 'disabled title="Coming Soon"' : ''}
      >
        <div class="bottom-nav__icon">${item.icon}</div>
        <div class="bottom-nav__label">
          ${item.label}
          ${item.comingSoon ? '<span class="bottom-nav__badge">Soon</span>' : ''}
        </div>
      </button>
    `).join('');

    container.innerHTML = html;
  }

  // Re-initialize when route changes
  if (window.Router) {
    window.Router.afterEach(() => {
      initBottomNav();
    });
  }

  // Initial render
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initBottomNav);
  } else {
    initBottomNav();
  }

  // Export for manual refresh if needed
  window.refreshBottomNav = initBottomNav;
})();
