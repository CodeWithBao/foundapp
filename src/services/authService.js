import { STORAGE_KEYS } from '../constants';
import storageService from './storageService';
import apiClient, { withFallback, getAuthToken } from './apiClient';

const delay = (ms = 300) => new Promise(r => setTimeout(r, ms));

let sessionVersion = 0;

const authService = {
  async authenticate(endpoint, body) {
    const version = ++sessionVersion;
    const data = await apiClient.post(endpoint, body);
    if (version !== sessionVersion) throw new Error('Authentication superseded');
    if (!data.token || !data.user?.id || !data.user?.role) throw new Error('Invalid authentication response');
    localStorage.setItem('token', data.token);
    storageService.set(STORAGE_KEYS.CURRENT_USER, data.user);
    return data.user;
  },

  login(email, password) {
    return this.authenticate('/auth/login', { email, password });
  },

  googleLogin(idToken) {
    return this.authenticate('/auth/google', { credential: idToken, id_token: idToken });
  },

  register(data) {
    return this.authenticate('/auth/register', data);
  },

  async restoreSession() {
    const version = sessionVersion;
    if (!getAuthToken()) {
      storageService.remove(STORAGE_KEYS.CURRENT_USER);
      return null;
    }
    const token = getAuthToken();
    let user;
    try {
      user = await apiClient.get('/auth/me');
    } catch (error) {
      if (version !== sessionVersion || token !== getAuthToken()) return null;
      throw error;
    }
    if (version !== sessionVersion || token !== getAuthToken()) return null;
    if (!user?.id || !user?.role || ['INACTIVE', 'BANNED'].includes(user.status)) throw new Error('Invalid session user');
    storageService.set(STORAGE_KEYS.CURRENT_USER, user);
    return user;
  },

  logout() {
    sessionVersion++;
    localStorage.removeItem('token');
    storageService.remove(STORAGE_KEYS.CURRENT_USER);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('unifind:data-changed'));
    }
  },

  getCurrentUser() {
    return storageService.get(STORAGE_KEYS.CURRENT_USER);
  },

  async updateProfile(userId, data) {
    const version = sessionVersion;
    const token = getAuthToken();
    return withFallback(
      async () => {
        const user = await apiClient.put('/users/profile', data);
        if (version !== sessionVersion || token !== getAuthToken()) throw new Error('Session changed');
        storageService.set(STORAGE_KEYS.CURRENT_USER, user);
        return user;
      },
      async () => {
        await delay();
        if (version !== sessionVersion || token !== getAuthToken()) throw new Error('Session changed');
        const users = storageService.get(STORAGE_KEYS.USERS) || [];
        const idx = users.findIndex(u => u.id === userId);
        if (idx === -1) throw new Error('User not found');
        users[idx] = { ...users[idx], ...data };
        storageService.set(STORAGE_KEYS.USERS, users);
        const { password: _, ...safeUser } = users[idx];
        storageService.set(STORAGE_KEYS.CURRENT_USER, safeUser);
        return safeUser;
      }
    );
  },

  async changePassword(oldPassword, newPassword) {
    return apiClient.post('/auth/change-password', {
      old_password: oldPassword,
      new_password: newPassword,
    }, { timeout: 12000 });
  },
};

export default authService;
