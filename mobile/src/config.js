const API_URL = process.env.EXPO_PUBLIC_API_URL;

function isConfigured() {
  return !!API_URL && API_URL.length > 0;
}

export { API_URL, isConfigured };
