import { STORAGE_KEYS } from '../constants';
import storageService from './storageService';
import apiClient, { withFallback } from './apiClient';
import { normalizeItem } from './itemService';
import { compareImageFingerprints } from '../utils/imageFingerprint';

const delay = (ms = 300) => new Promise(resolve => setTimeout(resolve, ms));
const MATCH_THRESHOLD = 35;

const normalizeText = value => String(value || '')
  .normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D')
  .toLowerCase().trim();

const tokens = value => {
  const stopWords = new Set(['toi', 'bi', 'mat', 'nhat', 'duoc', 'do', 'mot', 'cai', 'tai', 'o', 'va', 'co', 'la']);
  return new Set(normalizeText(value).split(/[^a-z0-9]+/).filter(word => word.length >= 2 && !stopWords.has(word)));
};

const textSimilarity = (left, right) => {
  const a = tokens(left);
  const b = tokens(right);
  if (!a.size || !b.size) return 0;
  let common = 0;
  a.forEach(word => { if (b.has(word)) common += 1; });
  return (2 * common) / (a.size + b.size);
};

const exactMeaningful = (left, right) => {
  const a = normalizeText(left);
  const b = normalizeText(right);
  return Boolean(a && b && (a === b || a.includes(b) || b.includes(a)));
};

const dateScore = (left, right) => {
  const a = new Date(left);
  const b = new Date(right);
  if (Number.isNaN(a.getTime()) || Number.isNaN(b.getTime())) return 0;
  const days = Math.abs(a - b) / 86400000;
  if (days <= 1) return 10;
  if (days <= 3) return 8;
  if (days <= 7) return 5;
  if (days <= 14) return 2;
  return 0;
};

const itemText = item => [item.title, item.description, item.distinctFeatures || item.distinct_features || item.feature, item.color, item.brand].filter(Boolean).join(' ');
const itemCategory = item => item.category_id ?? item.categoryId ?? item.category;
const itemLocation = item => item.location_id ?? item.locationId ?? item.location;
const round1 = value => Math.round(value * 10) / 10;

export function calculateMatch(lostItem, foundItem) {
  const breakdown = { category: 0, text: 0, image: 0, location: 0, date: 0, color: 0, brand: 0, total: 0 };
  const reasons = [];

  if (String(itemCategory(lostItem)) === String(itemCategory(foundItem))) {
    breakdown.category = 20;
    reasons.push('Cùng danh mục vật phẩm');
  }
  const contentSimilarity = textSimilarity(itemText(lostItem), itemText(foundItem));
  breakdown.text = round1(contentSimilarity * 25);
  if (contentSimilarity >= 0.55) reasons.push('Tên, mô tả và đặc điểm nhận dạng rất giống');
  else if (contentSimilarity >= 0.25) reasons.push('Có nhiều từ khóa mô tả trùng nhau');

  const imageSimilarity = compareImageFingerprints(
    lostItem.imageFingerprint || lostItem.image_fingerprint,
    foundItem.imageFingerprint || foundItem.image_fingerprint,
  );
  breakdown.image = round1(imageSimilarity * 25);
  if (imageSimilarity >= 0.82) reasons.push('Hình ảnh có độ tương đồng cao');
  else if (imageSimilarity >= 0.62) reasons.push('Hình ảnh có nét tương đồng');

  if (String(itemLocation(lostItem)) === String(itemLocation(foundItem))) {
    breakdown.location = 10;
    reasons.push('Cùng khu vực trong trường');
  }
  breakdown.date = dateScore(lostItem.date, foundItem.date);
  if (breakdown.date >= 7) reasons.push('Thời điểm mất và nhặt được gần nhau');
  if (exactMeaningful(lostItem.color, foundItem.color)) { breakdown.color = 5; reasons.push('Màu sắc trùng khớp'); }
  if (exactMeaningful(lostItem.brand, foundItem.brand)) { breakdown.brand = 5; reasons.push('Thương hiệu trùng khớp'); }

  breakdown.total = round1(Math.min(100, Object.entries(breakdown).filter(([key]) => key !== 'total').reduce((sum, [, value]) => sum + value, 0)));
  return { score: breakdown.total, breakdown, reasons };
}

export const calculateMatchScore = (lostItem, foundItem) => calculateMatch(lostItem, foundItem).score;

function normalizeMatch(raw) {
  let lost = raw.lostItem || raw.lost_item;
  let found = raw.foundItem || raw.found_item;
  const target = raw.target_item || raw.targetItem;
  const candidate = raw.candidate_item || raw.candidateItem;
  if ((!lost || !found) && target && candidate) {
    lost = target.type === 'LOST' ? target : candidate;
    found = target.type === 'FOUND' ? target : candidate;
  }
  return {
    matchId: raw.matchId || raw.match_id || raw.id || `${lost?.id || 'lost'}-${found?.id || 'found'}`,
    lostItem: normalizeItem(lost),
    foundItem: normalizeItem(found),
    score: Number(raw.score || 0),
    reasons: raw.reasons || [],
    breakdown: raw.breakdown || {},
    matchedAt: raw.matchedAt || raw.matched_at,
  };
}

const matchingService = {
  async getMatchesForUser(userId) {
    return withFallback(
      async () => {
        const response = await apiClient.get('/matches/user');
        const list = Array.isArray(response) ? response : response.matches || [];
        return list.map(normalizeMatch).filter(match => match.lostItem && match.foundItem).sort((a, b) => b.score - a.score);
      },
      async () => {
        await delay(350);
        const items = storageService.get(STORAGE_KEYS.ITEMS) || [];
        const lostItems = items.filter(item => String(item.userId || item.user_id) === String(userId) && item.type === 'LOST' && item.status === 'LOST');
        const foundItems = items.filter(item => item.type === 'FOUND' && item.status === 'FOUND' && !item.isHidden && !item.is_hidden);
        return lostItems.flatMap(lost => foundItems.map(found => ({ lostItem: lost, foundItem: found, ...calculateMatch(lost, found) })))
          .filter(match => match.score >= MATCH_THRESHOLD)
          .map(normalizeMatch)
          .sort((a, b) => b.score - a.score);
      },
    );
  },

  async getMatchesForItem(itemId) {
    return withFallback(
      async () => {
        const response = await apiClient.get(`/matches/item/${itemId}`);
        const list = Array.isArray(response) ? response : response.matches || [];
        return list.map(normalizeMatch).filter(match => match.lostItem && match.foundItem).sort((a, b) => b.score - a.score);
      },
      async () => {
        await delay(300);
        const items = storageService.get(STORAGE_KEYS.ITEMS) || [];
        const item = items.find(candidate => String(candidate.id) === String(itemId));
        if (!item) return [];
        const candidates = items.filter(candidate => candidate.type !== item.type && ['LOST', 'FOUND'].includes(candidate.status));
        return candidates.map(candidate => {
          const lost = item.type === 'LOST' ? item : candidate;
          const found = item.type === 'FOUND' ? item : candidate;
          return normalizeMatch({ lostItem: lost, foundItem: found, ...calculateMatch(lost, found) });
        }).filter(match => match.score >= MATCH_THRESHOLD).sort((a, b) => b.score - a.score);
      },
    );
  },

  calculateMatchScore,
};

export default matchingService;
