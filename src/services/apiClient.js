const rawBase = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || '/api/v1';
const BASE_URL = (typeof rawBase === 'string' && rawBase.startsWith('http')) ? '/api/v1' : rawBase;
const DEFAULT_TIMEOUT = 5000;

export function getAuthToken() {
  let token = localStorage.getItem('token');
  if (!token) {
    try {
      const currentUser = JSON.parse(localStorage.getItem('unifind_current_user') || '{}');
      token = currentUser?.token;
    } catch {
      token = null;
    }
  }
  return token;
}

export async function apiFetch(endpoint, options = {}) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), options.timeout || DEFAULT_TIMEOUT);
  const method = String(options.method || 'GET').toUpperCase();
  const isMutation = !['GET', 'HEAD', 'OPTIONS'].includes(method);

  const token = getAuthToken();

  const isFormData = typeof FormData !== 'undefined' && options.body instanceof FormData;

  const headers = {
    ...(!isFormData ? { 'Content-Type': 'application/json' } : {}),
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
      error.method = method;
      error.endpoint = endpoint;
      error.retryAfter = response.headers.get('Retry-After');
      if (response.status >= 500) {
        error.isServerError = true;
        error.isNetworkError = true;
        error.isUncertain = isMutation;
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
      timeoutErr.isTimeout = true;
      timeoutErr.isUncertain = isMutation;
      timeoutErr.method = method;
      timeoutErr.endpoint = endpoint;
      throw timeoutErr;
    }
    if (
      err.message === 'Failed to fetch' ||
      err.message?.includes('NetworkError') ||
      err.message?.includes('fetch') ||
      err.isServerError
    ) {
      err.isNetworkError = true;
      if (isMutation) err.isUncertain = true;
    }
    err.method ||= method;
    err.endpoint ||= endpoint;
    throw err;
  }
}

export function apiUpload(endpoint, formData, { onProgress, timeout = 60000 } = {}) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    let requestSent = false;
    xhr.open('POST', `${BASE_URL}${endpoint}`);
    xhr.timeout = timeout;
    const token = getAuthToken();
    if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`);

    xhr.upload.onprogress = event => {
      if (event.lengthComputable && onProgress) {
        onProgress(Math.round((event.loaded / event.total) * 100));
      }
    };
    xhr.onload = () => {
      let payload = {};
      try {
        payload = JSON.parse(xhr.responseText || '{}');
      } catch {
        payload = {};
      }
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(payload.data !== undefined ? payload.data : payload);
        return;
      }
      const error = new Error(payload.message || payload.error || `HTTP Error ${xhr.status}`);
      error.status = xhr.status;
      error.method = 'POST';
      error.endpoint = endpoint;
      error.isUncertain = xhr.status >= 500;
      reject(error);
    };
    xhr.onerror = () => {
      const error = new Error('Không thể kết nối máy chủ để tải ảnh');
      error.isNetworkError = true;
      error.isUncertain = requestSent;
      error.method = 'POST';
      error.endpoint = endpoint;
      reject(error);
    };
    xhr.ontimeout = () => {
      const error = new Error('Tải ảnh quá thời gian cho phép');
      error.isNetworkError = true;
      error.isTimeout = true;
      error.isUncertain = requestSent;
      error.method = 'POST';
      error.endpoint = endpoint;
      reject(error);
    };
    xhr.onabort = () => reject(new Error('Đã hủy tải ảnh'));
    requestSent = true;
    xhr.send(formData);
  });
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
  upload: apiUpload,
};

export default apiClient;
