/*
  AGU TRADING connection configuration.
  Set API_BASE_URL to your secure backend URL after deploying it.
  Example: https://agu-trading-api.example.com
  Never put the Twelve Data secret in this file.
*/
window.AGU_CONFIG = {
  API_BASE_URL: localStorage.getItem("aguApiBaseUrl") || "",
  DEMO_FALLBACK: true,
  REFRESH_MS: 60000
};
