(function () {
  const url = "https://ridendine-demo.onrender.com";
  window.__RIDENDINE_CONFIG__ = { apiBaseUrl: url };

  // ALSO set the key many builds use
  try { localStorage.setItem("API_BASE_URL", url); } catch (e) {}

  console.log("[RideNDine] API_BASE_URL set to:", url);
})();
