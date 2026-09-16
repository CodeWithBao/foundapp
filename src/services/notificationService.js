import { STORAGE_KEYS } from '../constants';
import storageService from './storageService';
import apiClient, { withFallback } from './apiClient';

const delay = (ms = 300) => new Promise(r => setTimeout(r, ms));

const notificationService = {
  async getByUser(userId) {
    return withFallback(
      async () => {
        const res = await apiClient.get('/notifications');
        return Array.isArray(res) ? res : res.notifications || [];
      },
      async () => {
        await delay(200);
        const notifications = storageService.get(STORAGE_KEYS.NOTIFICATIONS) || [];
        return notifications.filter(n => n.userId === userId).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      }
    );
  },

  async getUnreadCount(userId) {
    return withFallback(
      async () => {
        const notifications = await this.getByUser(userId);
        return notifications.filter(n => !n.read).length;
      },
      async () => {
        const notifications = storageService.get(STORAGE_KEYS.NOTIFICATIONS) || [];
        return notifications.filter(n => n.userId === userId && !n.read).length;
      }
    );
  },

  async markAsRead(notifId) {
    return withFallback(
      async () => {
        return await apiClient.put(`/notifications/${notifId}/read`, {});
      },
      async () => {
        await delay(200);
        const notifications = storageService.get(STORAGE_KEYS.NOTIFICATIONS) || [];
        const idx = notifications.findIndex(n => n.id === notifId);
        if (idx !== -1) {
          notifications[idx].read = true;
          storageService.set(STORAGE_KEYS.NOTIFICATIONS, notifications);
        }
      }
    );
  },

  async markAllAsRead(userId) {
    return withFallback(
      async () => {
        return await apiClient.put('/notifications/read-all', {});
      },
      async () => {
        await delay(200);
        const notifications = storageService.get(STORAGE_KEYS.NOTIFICATIONS) || [];
        notifications.forEach(n => { if (n.userId === userId) n.read = true; });
        storageService.set(STORAGE_KEYS.NOTIFICATIONS, notifications);
      }
    );
  },

  async addNotification(userId, title, message, type, relatedId) {
    const notifications = storageService.get(STORAGE_KEYS.NOTIFICATIONS) || [];
    const notif = {
      id: 'N' + String(notifications.length + 1).padStart(3, '0'),
      userId, title, message, type, relatedId, read: false,
      createdAt: new Date().toISOString(),
    };
    notifications.unshift(notif);
    storageService.set(STORAGE_KEYS.NOTIFICATIONS, notifications);
    return notif;
  },
};

export default notificationService;
