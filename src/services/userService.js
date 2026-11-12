import { STORAGE_KEYS } from '../constants';
import storageService from './storageService';
import apiClient from './apiClient';
const withFallback = api => api();

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
        return (Array.isArray(res) ? res : res.users || []).filter(u =>
          (!filters.role || filters.role === 'all' || u.role.toLowerCase() === filters.role.toLowerCase()) &&
          (!filters.status || filters.status === 'all' || (u.status === 'BANNED' ? 'blocked' : u.status.toLowerCase()) === filters.status.toLowerCase()) &&
          (!filters.search || `${u.name} ${u.email}`.toLowerCase().includes(filters.search.toLowerCase()))
        ).map(u => ({ ...u, status: u.status === 'BANNED' ? 'blocked' : u.status.toLowerCase(), fullName: u.name, studentId: u.student_id, createdAt: u.created_at }));
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
        // Backend uses admin route: PUT /admin/users/:id/status
        const users = await apiClient.get('/users');
        const userList = Array.isArray(users) ? users : users.users || [];
        const user = userList.find(u => String(u.id) === String(id));
        if (!user) throw new Error('Không tìm thấy người dùng');
        const newStatus = user?.status === 'BANNED' || user?.status === 'blocked' ? 'ACTIVE' : 'BANNED';
        return await apiClient.put(`/admin/users/${id}/status`, { status: newStatus });
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
        // Backend doesn't have a dedicated role endpoint yet; use admin status endpoint
        const users = await apiClient.get('/users');
        const target = (Array.isArray(users) ? users : users.users || []).find(u => String(u.id) === String(id));
        if (!target) throw new Error('Không tìm thấy người dùng');
        return await apiClient.put(`/admin/users/${id}/status`, { status: target.status, role: newRole.toUpperCase() });
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

  async resetPassword(id) {
    return withFallback(
      async () => apiClient.put(`/admin/users/${id}/reset-password`),
      async () => {
        await delay();
        const users = storageService.get(STORAGE_KEYS.USERS) || [];
        const idx = users.findIndex(u => u.id === id);
        if (idx === -1) throw new Error('User not found');
        users[idx].password = '123456';
        storageService.set(STORAGE_KEYS.USERS, users);
        return { success: true };
      }
    );
  },
};

export default userService;
