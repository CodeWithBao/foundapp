import { STORAGE_KEYS } from '../constants';
import storageService from './storageService';
import { getImageForCategory } from '../data/items';
import apiClient, { withFallback } from './apiClient';

const delay = (ms = 300) => new Promise(r => setTimeout(r, ms));

const itemService = {
  async getItems(filters = {}) {
    return withFallback(
      async () => {
        const queryParams = new URLSearchParams();
        if (filters.status && filters.status !== 'all') queryParams.append('status', filters.status);
        if (filters.type && filters.type !== 'all') queryParams.append('type', filters.type);
        if (filters.category && filters.category !== 'all') queryParams.append('category', filters.category);
        if (filters.location && filters.location !== 'all') queryParams.append('location', filters.location);
        if (filters.search) queryParams.append('search', filters.search);
        if (filters.page) queryParams.append('page', filters.page);
        if (filters.limit) queryParams.append('limit', filters.limit);

        const queryString = queryParams.toString();
        const res = await apiClient.get(`/items${queryString ? '?' + queryString : ''}`);
        return Array.isArray(res) ? res : res.items || [];
      },
      async () => {
        await delay();
        let items = storageService.get(STORAGE_KEYS.ITEMS) || [];
        
        if (filters.status && filters.status !== 'all') {
          items = items.filter(i => i.status === filters.status);
        }
        if (filters.type && filters.type !== 'all') {
          items = items.filter(i => i.type === filters.type);
        }
        if (filters.category && filters.category !== 'all') {
          items = items.filter(i => i.category === filters.category);
        }
        if (filters.location && filters.location !== 'all') {
          items = items.filter(i => i.location === filters.location);
        }
        if (filters.search) {
          const s = filters.search.toLowerCase();
          items = items.filter(i =>
            i.title.toLowerCase().includes(s) ||
            i.description?.toLowerCase().includes(s) ||
            i.category?.toLowerCase().includes(s) ||
            i.location?.toLowerCase().includes(s)
          );
        }
        if (filters.dateFrom) {
          items = items.filter(i => i.date >= filters.dateFrom);
        }
        if (filters.dateTo) {
          items = items.filter(i => i.date <= filters.dateTo);
        }
        if (filters.excludeReturned) {
          items = items.filter(i => i.status !== 'RETURNED');
        }

        // Sort
        const sort = filters.sort || 'newest';
        if (sort === 'newest') items.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        else if (sort === 'oldest') items.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
        else if (sort === 'views') items.sort((a, b) => (b.views || 0) - (a.views || 0));

        return items;
      }
    );
  },

  async getItemById(id) {
    return withFallback(
      async () => {
        return await apiClient.get(`/items/${id}`);
      },
      async () => {
        await delay();
        const items = storageService.get(STORAGE_KEYS.ITEMS) || [];
        const item = items.find(i => i.id === id);
        if (!item) throw new Error('Không tìm thấy vật phẩm');
        // Increment views
        item.views = (item.views || 0) + 1;
        const idx = items.findIndex(i => i.id === id);
        items[idx] = item;
        storageService.set(STORAGE_KEYS.ITEMS, items);
        return item;
      }
    );
  },

  async createItem(data) {
    return withFallback(
      async () => {
        return await apiClient.post('/items', data);
      },
      async () => {
        await delay(400);
        const items = storageService.get(STORAGE_KEYS.ITEMS) || [];
        const id = 'P' + String(items.length + 1).padStart(3, '0');
        const newItem = {
          id,
          ...data,
          status: data.type,
          images: data.images?.length ? data.images : [getImageForCategory(data.category)],
          views: 0,
          createdAt: new Date().toISOString(),
        };
        items.push(newItem);
        storageService.set(STORAGE_KEYS.ITEMS, items);
        // Audit log
        this._addAuditLog(data.userId, `User created ${data.type} Report "${data.title}"`, 'Item', id, 'CREATE');
        return newItem;
      }
    );
  },

  async updateItem(id, data) {
    return withFallback(
      async () => {
        return await apiClient.put(`/items/${id}`, data);
      },
      async () => {
        await delay();
        const items = storageService.get(STORAGE_KEYS.ITEMS) || [];
        const idx = items.findIndex(i => i.id === id);
        if (idx === -1) throw new Error('Không tìm thấy vật phẩm');
        items[idx] = { ...items[idx], ...data, updatedAt: new Date().toISOString() };
        storageService.set(STORAGE_KEYS.ITEMS, items);
        return items[idx];
      }
    );
  },

  async deleteItem(id) {
    return withFallback(
      async () => {
        return await apiClient.delete(`/items/${id}`);
      },
      async () => {
        await delay();
        let items = storageService.get(STORAGE_KEYS.ITEMS) || [];
        items = items.filter(i => i.id !== id);
        storageService.set(STORAGE_KEYS.ITEMS, items);
      }
    );
  },

  async getItemsByUser(userId) {
    return withFallback(
      async () => {
        const res = await apiClient.get('/items/user/me');
        return Array.isArray(res) ? res : res.items || [];
      },
      async () => {
        await delay();
        const items = storageService.get(STORAGE_KEYS.ITEMS) || [];
        return items.filter(i => i.userId === userId).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      }
    );
  },

  async getRecentItems(limit = 8) {
    return withFallback(
      async () => {
        const res = await apiClient.get(`/items?limit=${limit}`);
        const list = Array.isArray(res) ? res : res.items || [];
        return list.slice(0, limit);
      },
      async () => {
        const items = storageService.get(STORAGE_KEYS.ITEMS) || [];
        return items
          .filter(i => i.status !== 'RETURNED')
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
          .slice(0, limit);
      }
    );
  },

  _addAuditLog(userId, description, entity, entityId, action) {
    const logs = storageService.get(STORAGE_KEYS.AUDIT_LOGS) || [];
    const users = storageService.get(STORAGE_KEYS.USERS) || [];
    const user = users.find(u => u.id === userId);
    logs.push({
      id: 'AL' + String(logs.length + 1).padStart(3, '0'),
      userId,
      userName: user?.name || 'Unknown',
      action,
      entity,
      entityId,
      description,
      ip: '192.168.1.' + Math.floor(Math.random() * 254 + 1),
      createdAt: new Date().toISOString(),
    });
    storageService.set(STORAGE_KEYS.AUDIT_LOGS, logs);
  },
};

export default itemService;
