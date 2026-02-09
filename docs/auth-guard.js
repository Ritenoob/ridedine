// Auth guard for protected pages
// Include this script in any page that requires authentication
// Usage: Add <script src="/auth-guard.js" data-required-role="admin"></script>

(async function() {
  // Get the script tag to read data attributes
  const scriptTag = document.currentScript;
  const requiredRole = scriptTag?.dataset?.requiredRole || null;
  const redirectUrl = scriptTag?.dataset?.redirectUrl || null;

  try {
    // Load auth client if not already loaded
    if (!window.AuthClient) {
      await loadScript('/auth-client.js');
    }

    // Check session
    const session = await window.AuthClient.checkSession();

    // If demo mode, allow access
    if (session.demoMode) {
      console.log('🔓 Demo mode enabled - bypassing authentication');
      showDemoBanner();
      return;
    }

    // Check if authenticated
    if (!session.authenticated) {
      console.log('🔒 Not authenticated - redirecting to login');
      redirectToLogin(requiredRole, redirectUrl);
      return;
    }

    // Check role if specified
    if (requiredRole && session.role !== requiredRole) {
      alert(`Access denied: This page requires ${requiredRole} role`);
      window.location.href = '/';
      return;
    }

    console.log(`✅ Authenticated as ${session.role}`);
    showLogoutButton(session);

  } catch (error) {
    console.error('Auth guard error:', error);
    redirectToLogin(requiredRole, redirectUrl);
  }
})();

function loadScript(src) {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = src;
    script.onload = resolve;
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

function redirectToLogin(role, customUrl) {
  if (customUrl) {
    window.location.href = customUrl;
    return;
  }

  const loginPaths = {
    'admin': '/admin/login.html',
    'chef': '/apps/chef-portal/pages/chef-login.html',
    'driver': '/apps/driver-app/pages/driver-login.html'
  };

  const loginPath = loginPaths[role] || '/admin/login.html';
  window.location.href = loginPath;
}

function showDemoBanner() {
  const banner = document.createElement('div');
  banner.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    background: linear-gradient(90deg, #f093fb 0%, #f5576c 100%);
    color: white;
    padding: 12px 20px;
    text-align: center;
    font-weight: 600;
    z-index: 9999;
    box-shadow: 0 2px 8px rgba(0,0,0,0.2);
  `;
  banner.innerHTML = '🔓 DEMO MODE - Authentication Bypassed';
  document.body.prepend(banner);
  document.body.style.paddingTop = '48px';
}

function showLogoutButton(session) {
  // Check if logout button already exists
  if (document.getElementById('auth-logout-btn')) return;

  const logoutBtn = document.createElement('button');
  logoutBtn.id = 'auth-logout-btn';
  logoutBtn.style.cssText = `
    position: fixed;
    top: 16px;
    right: 16px;
    background: #e53e3e;
    color: white;
    padding: 10px 20px;
    border: none;
    border-radius: 8px;
    font-weight: 600;
    cursor: pointer;
    z-index: 9998;
    box-shadow: 0 2px 8px rgba(0,0,0,0.2);
    transition: all 0.2s;
  `;
  logoutBtn.innerHTML = `Logout (${session.role})`;
  logoutBtn.onmouseover = () => {
    logoutBtn.style.background = '#c53030';
    logoutBtn.style.transform = 'scale(1.05)';
  };
  logoutBtn.onmouseout = () => {
    logoutBtn.style.background = '#e53e3e';
    logoutBtn.style.transform = 'scale(1)';
  };
  logoutBtn.onclick = async () => {
    try {
      await window.AuthClient.logout();
      window.location.href = '/';
    } catch (error) {
      console.error('Logout failed:', error);
      window.location.href = '/';
    }
  };
  document.body.appendChild(logoutBtn);
}
