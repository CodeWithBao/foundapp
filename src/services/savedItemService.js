import apiClient from './apiClient';
import { normalizeItem } from './itemService';

// Real authenticated API only: no demo fallback or browser bookmark migration.
export default {
  async list({ page = 1, limit = 20, type = 'ALL', status = 'ALL', search = '' } = {}) {
    const result = await apiClient.get(`/saved-items?${new URLSearchParams({ page, limit, type, status, search })}`);
    return { ...result, items: result.items.map(row => ({ ...row, item: row.available ? normalizeItem(row.item) : undefined })) };
  },
  status: ids => apiClient.get(`/saved-items/status?${new URLSearchParams({ ids: ids.join(',') })}`),
  set: (id, saved) => saved ? apiClient.put(`/saved-items/${id}`) : apiClient.delete(`/saved-items/${id}`),
};
