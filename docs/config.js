(function () {
  // Configuration for RideNDine API backend
  // Set to empty string for same-origin deployment or localhost
  // Set to backend URL for GitHub Pages deployment with separate backend
  
  const hostname = window.location.hostname;
  const isGitHubPages = hostname.endsWith('.github.io');
  const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1';
  
  let apiBaseUrl = '';
  
  if (isGitHubPages) {
    // For GitHub Pages, use local demo mode (no backend required)
    // This allows the app to work standalone on GitHub Pages
    apiBaseUrl = '';
    window.__RIDENDINE_DEMO_MODE__ = true;
    console.log("[RideNDine] Running in standalone demo mode on GitHub Pages");
  } else if (isLocalhost) {
    // For localhost, assume backend is running on same origin
    apiBaseUrl = '';
    console.log("[RideNDine] Running on localhost, using same-origin backend");
  } else {
    // For custom domain deployment, configure backend URL here if needed
    apiBaseUrl = '';
  }
  
  window.__RIDENDINE_CONFIG__ = { apiBaseUrl };
  
  // Also set in localStorage for compatibility with older code
  try { 
    if (apiBaseUrl) {
      localStorage.setItem("API_BASE_URL", apiBaseUrl);
    } else {
      localStorage.removeItem("API_BASE_URL");
    }
  } catch (e) {
    console.warn("[RideNDine] localStorage not available:", e);
  }
  
  console.log("[RideNDine] API Base URL:", apiBaseUrl || '(same-origin)');
})();
