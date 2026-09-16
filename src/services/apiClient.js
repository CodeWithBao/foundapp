const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api/v1';
const DEFAULT_TIMEOUT = 3000;

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
      if (response.status >= 500) {
        const error = new Error(`Server Error (${response.status})`);
        error.isServerError = true;
        error.isNetworkError = true;
        throw error;
      }
      const data = await response.json().catch(() => ({}));
      throw new Error(data.message || data.error || `HTTP Error ${response.status}`);
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
