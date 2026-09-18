import { STORAGE_KEYS } from '../constants';
import storageService from './storageService';
import { getImageForCategory } from '../data/items';
import apiClient, { withFallback } from './apiClient';

const delay = (ms = 300) => new Promise(r => setTimeout(r, ms));

export function normalizeItem(item) {
  if (!item || typeof item !== 'object') return item;
  const locationName = typeof item.location === 'object' && item.location !== null
    ? item.location.name
    : (item.locationName || item.location || '');
  const categoryName = typeof item.category === 'object' && item.category !== null
    ? item.category.name
    : (item.categoryName || item.category || '');
  
  let images = [];
  if (Array.isArray(item.images)) {
    images = item.images.map(img => typeof img === 'object' && img !== null ? (img.image_url || img.imageUrl || '') : img).filter(Boolean);
  } else if (typeof item.images === 'string' && item.images.trim()) {
    try {
      const parsed = JSON.parse(item.images);
      images = Array.isArray(parsed) ? parsed : [item.images];
    } catch {
      images = [item.images];
    }
  }

  return {
    ...item,
    location: locationName,
    locationName: locationName,
    category: categoryName,
    categoryName: categoryName,
    images: images,
    createdAt: item.createdAt || item.created_at,
    updatedAt: item.updatedAt || item.updated_at,
  };
}

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
        const rawList = Array.isArray(res) ? res : (res.items || []);
        return rawList.map(normalizeItem);
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

        return items.map(normalizeItem);
      }
    );
  },

  async getItemById(id) {
    return withFallback(
      async () => {
        const res = await apiClient.get(`/items/${id}`);
        return normalizeItem(res);
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
        return normalizeItem(item);
      }
    );
  },

  async createItem(data) {
    return withFallback(
      async () => {
        // Resolve category_id and location_id
        let categoryId = Number(data.category_id || data.categoryId) || 0;
        let locationId = Number(data.location_id || data.locationId) || 0;

        if (!categoryId || !locationId) {
          const [catsRes, locsRes] = await Promise.all([
            apiClient.get('/categories').catch(() => []),
            apiClient.get('/locations').catch(() => []),
          ]);
          const cats = Array.isArray(catsRes) ? catsRes : catsRes?.categories || [];
          const locs = Array.isArray(locsRes) ? locsRes : locsRes?.locations || [];

          if (!categoryId && data.category) {
            const found = cats.find(c => c.name === data.category || c.id === data.category || String(c.id) === String(data.category));
            categoryId = found?.id ? Number(found.id) : (cats[0]?.id ? Number(cats[0].id) : 1);
          }
          if (!locationId && data.location) {
            const found = locs.find(l => l.name === data.location || l.id === data.location || String(l.id) === String(data.location));
            locationId = found?.id ? Number(found.id) : (locs[0]?.id ? Number(locs[0].id) : 1);
          }
        }

        const apiPayload = {
          title: data.title,
          type: data.type || 'LOST',
          category_id: categoryId || 1,
          location_id: locationId || 1,
          date: data.date || '',
          time: data.time || '',
          description: data.description || '',
          color: data.color || '',
          brand: data.brand || '',
          distinct_features: data.distinct_features || data.feature || '',
          current_storage_location: data.current_storage_location || data.storageLocation || '',
          custody_status: data.custody_status || data.holdingStatus || '',
          images: data.images || []
        };

        return normalizeItem(await apiClient.post('/items', apiPayload));
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
        const apiPayload = {
          ...(data.title !== undefined && { title: data.title }),
          ...(data.category_id !== undefined && { category_id: Number(data.category_id) }),
          ...(data.location_id !== undefined && { location_id: Number(data.location_id) }),
          ...(data.date !== undefined && { date: data.date }),
          ...(data.time !== undefined && { time: data.time }),
          ...(data.description !== undefined && { description: data.description }),
          ...(data.color !== undefined && { color: data.color }),
          ...(data.brand !== undefined && { brand: data.brand }),
          ...(data.distinct_features !== undefined ? { distinct_features: data.distinct_features } : (data.feature !== undefined ? { distinct_features: data.feature } : {})),
          ...(data.current_storage_location !== undefined ? { current_storage_location: data.current_storage_location } : (data.storageLocation !== undefined ? { current_storage_location: data.storageLocation } : {})),
          ...(data.custody_status !== undefined ? { custody_status: data.custody_status } : (data.holdingStatus !== undefined ? { custody_status: data.holdingStatus } : {})),
          ...(data.status !== undefined && { status: data.status }),
          ...(data.images !== undefined && { images: data.images }),
        };
        return normalizeItem(await apiClient.put(`/items/${id}`, apiPayload));
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
        const list = Array.isArray(res) ? res : res.items || [];
        return list.map(normalizeItem);
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
        return list.map(normalizeItem).slice(0, limit);
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
