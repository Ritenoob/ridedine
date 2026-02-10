/**
 * RideNDine Environment Banner
 * Displays API base URL and demo mode status for debugging
 */

(function() {
  'use strict';

  // Shared environment detection
  const IS_GITHUB_PAGES = window.location.hostname.endsWith('.github.io');

  // Create and inject the banner
  function createEnvironmentBanner() {
    const banner = document.createElement('div');
    banner.id = 'env-banner';
    banner.style.cssText = `
      position: fixed;
      top: 10px;
      right: 10px;
      background: rgba(0, 0, 0, 0.85);
      color: #fff;
      padding: 8px 12px;
      border-radius: 6px;
      font-size: 12px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      z-index: 9999;
      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
      max-width: 300px;
      transition: opacity 0.3s ease;
    `;
    
    // Add content
    const content = document.createElement('div');
    content.style.cssText = 'display: flex; flex-direction: column; gap: 4px;';
    
    // API Status row
    const apiRow = document.createElement('div');
    apiRow.style.cssText = 'display: flex; align-items: center; gap: 6px;';
    
    const apiLabel = document.createElement('span');
    apiLabel.textContent = '🌐 API:';
    apiLabel.style.opacity = '0.7';
    
    const apiValue = document.createElement('span');
    apiValue.id = 'env-banner-api';
    apiValue.style.fontWeight = 'bold';
    
    apiRow.appendChild(apiLabel);
    apiRow.appendChild(apiValue);
    content.appendChild(apiRow);
    
    // Demo Mode row
    const demoRow = document.createElement('div');
    demoRow.id = 'env-banner-demo-row';
    demoRow.style.cssText = 'display: none; align-items: center; gap: 6px;';
    
    const demoLabel = document.createElement('span');
    demoLabel.textContent = '🚧 Demo Mode:';
    demoLabel.style.opacity = '0.7';
    
    const demoValue = document.createElement('span');
    demoValue.id = 'env-banner-demo';
    demoValue.style.fontWeight = 'bold';
    demoValue.style.color = '#ffd700';
    demoValue.textContent = 'ON';
    
    demoRow.appendChild(demoLabel);
    demoRow.appendChild(demoValue);
    content.appendChild(demoRow);
    
    banner.appendChild(content);
    
    // Make it slightly transparent on hover for less obstruction
    banner.addEventListener('mouseenter', () => {
      banner.style.opacity = '0.5';
    });
    banner.addEventListener('mouseleave', () => {
      banner.style.opacity = '1';
    });
    
    return banner;
  }

  // Update banner content
  async function updateBanner() {
    const envInfo = window.getEnvInfo();
    const apiElement = document.getElementById('env-banner-api');
    const demoRow = document.getElementById('env-banner-demo-row');
    
    if (apiElement) {
      apiElement.textContent = envInfo.apiDomain;
      
      // Color code based on environment
      if (envInfo.apiDomain === 'same-origin') {
        apiElement.style.color = '#90EE90'; // Light green
      } else if (envInfo.isLocalhost) {
        apiElement.style.color = '#87CEEB'; // Sky blue
      } else {
        apiElement.style.color = '#FFD700'; // Gold (cross-origin)
      }
    }
    
    // Check demo mode
    try {
      const isDemoMode = await window.checkDemoMode();
      if (isDemoMode && demoRow) {
        demoRow.style.display = 'flex';
      }
    } catch (e) {
      // Demo mode check failed, hide row
      if (demoRow) {
        demoRow.style.display = 'none';
      }
    }
  }

  // Initialize banner when DOM is ready
  document.addEventListener('DOMContentLoaded', async function() {
    // Only show in development or when there's a query param override
    const urlParams = new URLSearchParams(window.location.search);
    const showBanner = urlParams.has('api') || 
                       window.location.hostname === 'localhost' || 
                       window.location.hostname === '127.0.0.1' ||
                       window.location.hostname.includes('dev') ||
                       window.location.hostname.includes('staging');
    
    // Always show on GitHub Pages to help users debug
    if (showBanner || IS_GITHUB_PAGES) {
      const banner = createEnvironmentBanner();
      document.body.appendChild(banner);
      await updateBanner();
    }
  });

})();
