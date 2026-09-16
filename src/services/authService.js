import { STORAGE_KEYS } from '../constants';
import storageService from './storageService';
import apiClient, { withFallback } from './apiClient';

const delay = (ms = 300) => new Promise(r => setTimeout(r, ms));

const authService = {
  async login(email, password) {
    return withFallback(
      async () => {
        const data = await apiClient.post('/auth/login', { email, password });
        if (data.token) {
          localStorage.setItem('token', data.token);
        }
        const user = data.user || data;
        storageService.set(STORAGE_KEYS.CURRENT_USER, user);
        return user;
      },
      async () => {
        await delay();
        const users = storageService.get(STORAGE_KEYS.USERS) || [];
        const user = users.find(u => u.email === email && u.password === password);
        if (!user) throw new Error('Email hoặc mật khẩu không đúng');
        if (user.status === 'blocked') throw new Error('Tài khoản đã bị khóa');
        const { password: _, ...safeUser } = user;
        storageService.set(STORAGE_KEYS.CURRENT_USER, safeUser);
        return safeUser;
      }
    );
  },

  async register(data) {
    return withFallback(
      async () => {
        const res = await apiClient.post('/auth/register', data);
        if (res.token) {
          localStorage.setItem('token', res.token);
        }
        const user = res.user || res;
        storageService.set(STORAGE_KEYS.CURRENT_USER, user);
        return user;
      },
      async () => {
        await delay();
        const users = storageService.get(STORAGE_KEYS.USERS) || [];
        if (users.find(u => u.email === data.email)) throw new Error('Email đã tồn tại');
        const newUser = {
          id: 'U' + String(users.length + 1).padStart(3, '0'),
          name: data.name,
          email: data.email,
          password: data.password,
          role: 'USER',
          phone: data.phone || '',
          studentId: data.studentId || '',
          avatar: null,
          status: 'active',
          createdAt: new Date().toISOString(),
        };
        users.push(newUser);
        storageService.set(STORAGE_KEYS.USERS, users);
        const { password: _, ...safeUser } = newUser;
        storageService.set(STORAGE_KEYS.CURRENT_USER, safeUser);
        return safeUser;
      }
    );
  },

  logout() {
    localStorage.removeItem('token');
    storageService.remove(STORAGE_KEYS.CURRENT_USER);
  },

  getCurrentUser() {
    return storageService.get(STORAGE_KEYS.CURRENT_USER);
  },

  async updateProfile(userId, data) {
    return withFallback(
      async () => {
        const user = await apiClient.put('/users/profile', data);
        storageService.set(STORAGE_KEYS.CURRENT_USER, user);
        return user;
      },
      async () => {
        await delay();
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
};

export default authService;
