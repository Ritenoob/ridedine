/**
 * Bottom Tab Navigation Component
 * Food-first mobile navigation for customer experience
 */

(function() {
  'use strict';

  // Bottom navigation configuration
  const NAV_ITEMS = [
    { path: '/', icon: '🏠', label: 'Home' },
    { path: '/browse', icon: '🍽️', label: 'Browse' },
    { path: '/orders', icon: '📦', label: 'Orders' },
    { path: '/account', icon: '👤', label: 'Account' }
  ];

  /**
   * Render bottom navigation
   * @param {string} currentPath - Current active path
   * @returns {string} HTML for bottom navigation
   */
  window.renderBottomNav = function(currentPath) {
    const items = NAV_ITEMS.map(item => {
      const isActive = currentPath === item.path || 
                       (item.path !== '/' && currentPath.startsWith(item.path));
      const activeClass = isActive ? 'bottom-nav__link--active' : '';
      
      return `
        <a href="${item.path}" class="bottom-nav__link ${activeClass}" data-link>
          <span class="bottom-nav__icon">${item.icon}</span>
          <span class="bottom-nav__label">${item.label}</span>
        </a>
      `;
    }).join('');

    return `
      <nav class="bottom-nav" role="navigation" aria-label="Main navigation">
        ${items}
      </nav>
    `;
  };

  /**
   * Initialize bottom navigation
   * Call this after page load to attach the nav to the page
   */
  window.initBottomNav = function() {
    const existingNav = document.querySelector('.bottom-nav');
    if (existingNav) {
      existingNav.remove();
    }

    const nav = document.createElement('div');
    nav.innerHTML = window.renderBottomNav(window.location.pathname);
    document.body.appendChild(nav.firstElementChild);

    // Attach click handlers for SPA navigation
    document.querySelectorAll('.bottom-nav__link[data-link]').forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const path = link.getAttribute('href');
        if (window.Router) {
          window.Router.navigate(path);
        } else {
          window.location.href = path;
        }
      });
    });
  };

  /**
   * Update active state when route changes
   */
  window.updateBottomNavActive = function(currentPath) {
    document.querySelectorAll('.bottom-nav__link').forEach(link => {
      const path = link.getAttribute('href');
      const isActive = currentPath === path || 
                       (path !== '/' && currentPath.startsWith(path));
      
      if (isActive) {
        link.classList.add('bottom-nav__link--active');
      } else {
        link.classList.remove('bottom-nav__link--active');
      }
    });
  };

})();
