import { STORAGE_KEYS } from '../constants';
import storageService from './storageService';
import apiClient, { withFallback } from './apiClient';
// 1. Import thuật toán đối soát mới từ file matchingEngine.js của bạn
import { calculateMatchScore as calculateNewMatchScore } from './matchingEngine.js';

const delay = (ms = 300) => new Promise(r => setTimeout(r, ms));

// 2. Sử dụng thuật toán mới từ matchingEngine.js
function calculateMatchScore(lostItem, foundItem) {
  return calculateNewMatchScore(lostItem, foundItem);
}

const matchingService = {
  async getMatchesForUser(userId) {
    return withFallback(
      async () => {
        const res = await apiClient.get('/matches/user');
        return Array.isArray(res) ? res : res.matches || [];
      },
      async () => {
        await delay(400);
        const items = storageService.get(STORAGE_KEYS.ITEMS) || [];
        const userLostItems = items.filter(i => i.userId === userId && i.type === 'LOST' && i.status === 'LOST');
        const foundItems = items.filter(i => i.type === 'FOUND' && i.status === 'FOUND');
        
        const matches = [];
        userLostItems.forEach(lost => {
          foundItems.forEach(found => {
            const score = calculateMatchScore(lost, found);
            if (score >= 40) {
              matches.push({ lostItem: lost, foundItem: found, score });
            }
          });
        });
        
        return matches.sort((a, b) => b.score - a.score);
      }
    );
  },

  async getMatchesForItem(itemId) {
    return withFallback(
      async () => {
        const res = await apiClient.get(`/matches/item/${itemId}`);
        return Array.isArray(res) ? res : res.matches || [];
      },
      async () => {
        await delay(400);
        const items = storageService.get(STORAGE_KEYS.ITEMS) || [];
        const item = items.find(i => i.id === itemId);
        if (!item) return [];
        
        const candidates = item.type === 'LOST'
          ? items.filter(i => i.type === 'FOUND' && i.status === 'FOUND')
          : items.filter(i => i.type === 'LOST' && i.status === 'LOST');
        
        return candidates
          .map(c => ({ item: c, score: calculateMatchScore(item.type === 'LOST' ? item : c, item.type === 'FOUND' ? item : c) }))
          .filter(m => m.score >= 30)
          .sort((a, b) => b.score - a.score);
      }
    );
  },

  calculateMatchScore,
};

export default matchingService;