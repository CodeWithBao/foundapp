import { STORAGE_KEYS } from '../constants';
import storageService from './storageService';
import apiClient, { withFallback } from './apiClient';

const delay = (ms = 300) => new Promise(r => setTimeout(r, ms));

const userService = {
  async getUsers(filters = {}) {
    return withFallback(
      async () => {
        const queryParams = new URLSearchParams();
        if (filters.role && filters.role !== 'all') queryParams.append('role', filters.role);
        if (filters.status && filters.status !== 'all') queryParams.append('status', filters.status);
        if (filters.search) queryParams.append('search', filters.search);

        const qs = queryParams.toString();
        const res = await apiClient.get(`/users${qs ? '?' + qs : ''}`);
        return Array.isArray(res) ? res : res.users || [];
      },
      async () => {
        await delay();
        let users = storageService.get(STORAGE_KEYS.USERS) || [];
        if (filters.role && filters.role !== 'all') users = users.filter(u => u.role === filters.role);
        if (filters.status && filters.status !== 'all') users = users.filter(u => u.status === filters.status);
        if (filters.search) {
          const s = filters.search.toLowerCase();
          users = users.filter(u => u.name.toLowerCase().includes(s) || u.email.toLowerCase().includes(s));
        }
        return users.map(({ password, ...u }) => u);
      }
    );
  },

  async getUserById(id) {
    return withFallback(
      async () => {
        return await apiClient.get(`/users/${id}`);
      },
      async () => {
        await delay();
        const users = storageService.get(STORAGE_KEYS.USERS) || [];
        const user = users.find(u => u.id === id);
        if (!user) throw new Error('User not found');
        const { password, ...safeUser } = user;
        return safeUser;
      }
    );
  },

  async updateUser(id, data) {
    return withFallback(
      async () => {
        return await apiClient.put(`/users/${id}`, data);
      },
      async () => {
        await delay();
        const users = storageService.get(STORAGE_KEYS.USERS) || [];
        const idx = users.findIndex(u => u.id === id);
        if (idx === -1) throw new Error('User not found');
        users[idx] = { ...users[idx], ...data };
        storageService.set(STORAGE_KEYS.USERS, users);
        return users[idx];
      }
    );
  },

  async toggleBlock(id) {
    return withFallback(
      async () => {
        return await apiClient.put(`/users/${id}/block`, {});
      },
      async () => {
        await delay();
        const users = storageService.get(STORAGE_KEYS.USERS) || [];
        const idx = users.findIndex(u => u.id === id);
        if (idx === -1) throw new Error('User not found');
        users[idx].status = users[idx].status === 'blocked' ? 'active' : 'blocked';
        storageService.set(STORAGE_KEYS.USERS, users);
        return users[idx];
      }
    );
  },

  async changeRole(id, newRole) {
    return withFallback(
      async () => {
        return await apiClient.put(`/users/${id}/role`, { role: newRole });
      },
      async () => {
        await delay();
        const users = storageService.get(STORAGE_KEYS.USERS) || [];
        const idx = users.findIndex(u => u.id === id);
        if (idx === -1) throw new Error('User not found');
        users[idx].role = newRole;
        storageService.set(STORAGE_KEYS.USERS, users);
        return users[idx];
      }
    );
  },
};

export default userService;
