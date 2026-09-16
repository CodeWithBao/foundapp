import { STORAGE_KEYS } from '../constants';
import storageService from './storageService';
import apiClient, { withFallback } from './apiClient';

const delay = (ms = 300) => new Promise(r => setTimeout(r, ms));

function calculateMatchScore(lostItem, foundItem) {
  let score = 0;
  // Category match +40
  if (lostItem.category === foundItem.category) score += 40;
  // Location match +25
  if (lostItem.location === foundItem.location) score += 25;
  // Date proximity +20 (within 7 days)
  const lostDate = new Date(lostItem.date);
  const foundDate = new Date(foundItem.date);
  const daysDiff = Math.abs((lostDate - foundDate) / (1000 * 60 * 60 * 24));
  if (daysDiff <= 1) score += 20;
  else if (daysDiff <= 3) score += 15;
  else if (daysDiff <= 7) score += 10;
  else if (daysDiff <= 14) score += 5;
  // Title/keyword similarity +15
  const lostWords = lostItem.title.toLowerCase().split(/\s+/);
  const foundWords = foundItem.title.toLowerCase().split(/\s+/);
  const commonWords = lostWords.filter(w => w.length > 2 && foundWords.some(fw => fw.includes(w) || w.includes(fw)));
  if (commonWords.length > 0) score += Math.min(15, commonWords.length * 5);
  // Color match bonus
  if (lostItem.color && foundItem.color && lostItem.color.toLowerCase() === foundItem.color.toLowerCase()) score += 5;
  // Brand match bonus
  if (lostItem.brand && foundItem.brand && lostItem.brand.toLowerCase() === foundItem.brand.toLowerCase()) score += 5;
  
  return Math.min(100, score);
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
            if (score >= 60) {
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
          .filter(m => m.score >= 40)
          .sort((a, b) => b.score - a.score);
      }
    );
  },

  calculateMatchScore,
};

export default matchingService;
