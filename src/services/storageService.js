import { STORAGE_KEYS } from '../constants';
import { mockUsers } from '../data/users';
import { mockItems } from '../data/items';
import { mockClaims } from '../data/claims';
import { mockCategories } from '../data/categories';
import { mockLocations } from '../data/locations';
import { mockNotifications } from '../data/notifications';
import { mockHandovers } from '../data/handoverRecords';
import { mockAuditLogs } from '../data/auditLogs';

const storageService = {
  get(key) {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : null;
    } catch { return null; }
  },

  set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) { console.error('Storage error:', e); }
  },

  remove(key) {
    localStorage.removeItem(key);
  },

  isInitialized() {
    return localStorage.getItem(STORAGE_KEYS.INITIALIZED) === 'true';
  },

  seed() {
    this.set(STORAGE_KEYS.USERS, mockUsers);
    this.set(STORAGE_KEYS.ITEMS, mockItems);
    this.set(STORAGE_KEYS.CLAIMS, mockClaims);
    this.set(STORAGE_KEYS.CATEGORIES, mockCategories);
    this.set(STORAGE_KEYS.LOCATIONS, mockLocations);
    this.set(STORAGE_KEYS.NOTIFICATIONS, mockNotifications);
    this.set(STORAGE_KEYS.HANDOVERS, mockHandovers);
    this.set(STORAGE_KEYS.AUDIT_LOGS, mockAuditLogs);
    localStorage.setItem(STORAGE_KEYS.INITIALIZED, 'true');
  },

  init() {
    if (!this.isInitialized()) {
      this.seed();
    }
  },

  reset() {
    Object.values(STORAGE_KEYS).forEach(key => localStorage.removeItem(key));
    this.seed();
  },
};

export default storageService;
