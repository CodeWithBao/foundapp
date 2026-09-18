const rawBase = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || '/api/v1';
const BASE_URL = (typeof rawBase === 'string' && rawBase.startsWith('http')) ? '/api/v1' : rawBase;
const DEFAULT_TIMEOUT = 5000;

export async function apiFetch(endpoint, options = {}) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), options.timeout || DEFAULT_TIMEOUT);

  let token = localStorage.getItem('token');
  if (!token) {
    try {
      const currentUser = JSON.parse(localStorage.getItem('unifind_current_user') || '{}');
      token = currentUser?.token;
    } catch {
      token = null;
    }
  }

  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      ...options,
      headers,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      const error = new Error(data.message || data.error || `HTTP Error ${response.status}`);
      error.status = response.status;
      error.code = data.error;
      if (response.status >= 500) {
        error.isServerError = true;
        error.isNetworkError = true;
      }
      throw error;
    }

    const data = await response.json();
    return data.data !== undefined ? data.data : data;
  } catch (err) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') {
      const timeoutErr = new Error('Network timeout');
      timeoutErr.isNetworkError = true;
      throw timeoutErr;
    }
    if (
      err.message === 'Failed to fetch' ||
      err.message?.includes('NetworkError') ||
      err.message?.includes('fetch') ||
      err.isServerError
    ) {
      err.isNetworkError = true;
    }
    throw err;
  }
}

export async function withFallback(apiFn, fallbackFn) {
  try {
    return await apiFn();
  } catch (err) {
    // Production must use the real online API/database and must never silently
    // switch to browser mock data when the backend is unavailable.
    if (import.meta.env.PROD) {
      throw err;
    }
    if (
      err.isNetworkError ||
      err.isServerError ||
      err.name === 'AbortError' ||
      err.message === 'Failed to fetch' ||
      err.message?.includes('Network') ||
      err.message?.includes('fetch')
    ) {
      console.warn('Backend unavailable, falling back to mock storageService:', err.message);
      return await fallbackFn();
    }
    throw err;
  }
}

export const apiClient = {
  get: (url, opts) => apiFetch(url, { ...opts, method: 'GET' }),
  post: (url, body, opts) => apiFetch(url, { ...opts, method: 'POST', body: JSON.stringify(body) }),
  put: (url, body, opts) => apiFetch(url, { ...opts, method: 'PUT', body: JSON.stringify(body) }),
  delete: (url, opts) => apiFetch(url, { ...opts, method: 'DELETE' }),
};

export default apiClient;
