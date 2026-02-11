(function () {
  // Configuration for RideNDine API backend
  // Set to empty string for same-origin deployment or localhost
  // Set to backend URL for GitHub Pages deployment with separate backend
  
  const hostname = window.location.hostname;
  const isGitHubPages = hostname.endsWith('.github.io');
  const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1';
  
  let apiBaseUrl = '';
  
  if (isGitHubPages) {
    // For GitHub Pages, use Render backend
    apiBaseUrl = 'https://ridendine-demo.onrender.com';
    console.log("[RideNDine] Running on GitHub Pages, using Render backend");
  } else if (isLocalhost) {
    // For localhost, check if backend is running on different port
    // Default to localhost:3000 for development
    apiBaseUrl = ''; // Same origin for now
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
