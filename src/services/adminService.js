import { STORAGE_KEYS } from '../constants';
import storageService from './storageService';
import apiClient, { withFallback } from './apiClient';

const delay = (ms = 300) => new Promise(r => setTimeout(r, ms));

const adminService = {
  async getStats() {
    return withFallback(
      async () => {
        const data = await apiClient.get('/admin/stats');
        return {
          totalItems: (data.total_lost_items || 0) + (data.total_found_items || 0),
          totalUsers: data.total_users || 0,
          pendingClaims: data.total_pending_claims || 0,
          totalHandovers: data.total_returned_items || 0,
          lostItems: data.total_lost_items || 0,
          foundItems: data.total_found_items || 0,
          returnedItems: data.total_returned_items || 0,
        };
      },
      async () => {
        await delay();
        const items = storageService.get(STORAGE_KEYS.ITEMS) || [];
        const users = storageService.get(STORAGE_KEYS.USERS) || [];
        const claims = storageService.get(STORAGE_KEYS.CLAIMS) || [];
        const handovers = storageService.get(STORAGE_KEYS.HANDOVERS) || [];
        return {
          totalItems: items.length,
          totalUsers: users.length,
          pendingClaims: claims.filter(c => ['PENDING', 'UNDER_REVIEW'].includes(c.status)).length,
          totalHandovers: handovers.length,
          lostItems: items.filter(i => i.status === 'LOST').length,
          foundItems: items.filter(i => i.status === 'FOUND').length,
          returnedItems: items.filter(i => i.status === 'RETURNED').length,
        };
      }
    );
  },

  async getMonthlyStats() {
    return withFallback(
      async () => {
        return await apiClient.get('/admin/stats/monthly');
      },
      async () => {
        await delay();
        const items = storageService.get(STORAGE_KEYS.ITEMS) || [];
        const months = ['T1','T2','T3','T4','T5','T6','T7','T8','T9','T10','T11','T12'];
        return months.map((m, idx) => {
          const monthItems = items.filter(i => {
            const d = new Date(i.createdAt);
            return d.getMonth() === idx;
          });
          return {
            month: m,
            lost: monthItems.filter(i => i.type === 'LOST').length,
            found: monthItems.filter(i => i.type === 'FOUND').length,
          };
        });
      }
    );
  },

  async getCategories() {
    return withFallback(
      async () => {
        const res = await apiClient.get('/categories');
        return Array.isArray(res) ? res : res.categories || [];
      },
      async () => {
        await delay();
        return storageService.get(STORAGE_KEYS.CATEGORIES) || [];
      }
    );
  },

  async addCategory(data) {
    return withFallback(
      async () => {
        return await apiClient.post('/categories', data);
      },
      async () => {
        await delay();
        const cats = storageService.get(STORAGE_KEYS.CATEGORIES) || [];
        const newCat = { id: 'CAT' + String(cats.length + 1).padStart(2, '0'), ...data, count: 0 };
        cats.push(newCat);
        storageService.set(STORAGE_KEYS.CATEGORIES, cats);
        return newCat;
      }
    );
  },

  async updateCategory(id, data) {
    return withFallback(
      async () => {
        return await apiClient.put(`/categories/${id}`, data);
      },
      async () => {
        await delay();
        const cats = storageService.get(STORAGE_KEYS.CATEGORIES) || [];
        const idx = cats.findIndex(c => c.id === id);
        if (idx === -1) throw new Error('Category not found');
        cats[idx] = { ...cats[idx], ...data };
        storageService.set(STORAGE_KEYS.CATEGORIES, cats);
        return cats[idx];
      }
    );
  },

  async deleteCategory(id) {
    return withFallback(
      async () => {
        return await apiClient.delete(`/categories/${id}`);
      },
      async () => {
        await delay();
        let cats = storageService.get(STORAGE_KEYS.CATEGORIES) || [];
        cats = cats.filter(c => c.id !== id);
        storageService.set(STORAGE_KEYS.CATEGORIES, cats);
      }
    );
  },

  async getLocations() {
    return withFallback(
      async () => {
        const res = await apiClient.get('/locations');
        return Array.isArray(res) ? res : res.locations || [];
      },
      async () => {
        await delay();
        return storageService.get(STORAGE_KEYS.LOCATIONS) || [];
      }
    );
  },

  async addLocation(data) {
    return withFallback(
      async () => {
        return await apiClient.post('/locations', data);
      },
      async () => {
        await delay();
        const locs = storageService.get(STORAGE_KEYS.LOCATIONS) || [];
        const newLoc = { id: 'LOC' + String(locs.length + 1).padStart(2, '0'), ...data, count: 0 };
        locs.push(newLoc);
        storageService.set(STORAGE_KEYS.LOCATIONS, locs);
        return newLoc;
      }
    );
  },

  async updateLocation(id, data) {
    return withFallback(
      async () => {
        return await apiClient.put(`/locations/${id}`, data);
      },
      async () => {
        await delay();
        const locs = storageService.get(STORAGE_KEYS.LOCATIONS) || [];
        const idx = locs.findIndex(l => l.id === id);
        if (idx === -1) throw new Error('Location not found');
        locs[idx] = { ...locs[idx], ...data };
        storageService.set(STORAGE_KEYS.LOCATIONS, locs);
        return locs[idx];
      }
    );
  },

  async deleteLocation(id) {
    return withFallback(
      async () => {
        return await apiClient.delete(`/locations/${id}`);
      },
      async () => {
        await delay();
        let locs = storageService.get(STORAGE_KEYS.LOCATIONS) || [];
        locs = locs.filter(l => l.id !== id);
        storageService.set(STORAGE_KEYS.LOCATIONS, locs);
      }
    );
  },

  async getAuditLogs(filters = {}) {
    return withFallback(
      async () => {
        const queryParams = new URLSearchParams();
        if (filters.action && filters.action !== 'all') queryParams.append('action', filters.action);
        if (filters.search) queryParams.append('search', filters.search);
        const qs = queryParams.toString();
        const res = await apiClient.get(`/admin/audit-logs${qs ? '?' + qs : ''}`);
        return Array.isArray(res) ? res : res.logs || [];
      },
      async () => {
        await delay();
        let logs = storageService.get(STORAGE_KEYS.AUDIT_LOGS) || [];
        if (filters.action && filters.action !== 'all') logs = logs.filter(l => l.action === filters.action);
        if (filters.search) {
          const s = filters.search.toLowerCase();
          logs = logs.filter(l => l.description.toLowerCase().includes(s) || l.userName.toLowerCase().includes(s));
        }
        return logs.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      }
    );
  },
};

export default adminService;
