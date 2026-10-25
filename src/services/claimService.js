import { STORAGE_KEYS, CLAIM_STATUS } from '../constants';
import storageService from './storageService';
import apiClient, { withFallback } from './apiClient';

const delay = (ms = 300) => new Promise(r => setTimeout(r, ms));

const addAuditLog = (userId, description, entity, entityId, action) => {
  const logs = storageService.get(STORAGE_KEYS.AUDIT_LOGS) || [];
  const users = storageService.get(STORAGE_KEYS.USERS) || [];
  const user = users.find(u => u.id === userId);
  logs.push({
    id: 'AL' + String(logs.length + 1).padStart(3, '0'),
    userId, userName: user?.name || 'Unknown', action, entity, entityId, description,
    ip: '192.168.1.' + Math.floor(Math.random() * 254 + 1),
    createdAt: new Date().toISOString(),
  });
  storageService.set(STORAGE_KEYS.AUDIT_LOGS, logs);
};

const addNotification = (userId, title, message, type, relatedId) => {
  const notifications = storageService.get(STORAGE_KEYS.NOTIFICATIONS) || [];
  notifications.unshift({
    id: 'N' + String(notifications.length + 1).padStart(3, '0'),
    userId, title, message, type, relatedId, read: false,
    createdAt: new Date().toISOString(),
  });
  storageService.set(STORAGE_KEYS.NOTIFICATIONS, notifications);
};

const claimService = {
  async getClaims(filters = {}) {
    return withFallback(
      async () => {
        const queryParams = new URLSearchParams();
        if (filters.status && filters.status !== 'all') queryParams.append('status', filters.status);
        if (filters.claimantId) queryParams.append('claimant_id', filters.claimantId);
        if (filters.itemId) queryParams.append('item_id', filters.itemId);

        const qs = queryParams.toString();
        const res = await apiClient.get(`/claims${qs ? '?' + qs : ''}`);
        return Array.isArray(res) ? res : res.claims || [];
      },
      async () => {
        await delay();
        let claims = storageService.get(STORAGE_KEYS.CLAIMS) || [];
        if (filters.status && filters.status !== 'all') {
          claims = claims.filter(c => c.status === filters.status);
        }
        if (filters.claimantId) {
          claims = claims.filter(c => c.claimantId === filters.claimantId);
        }
        if (filters.itemId) {
          claims = claims.filter(c => c.itemId === filters.itemId);
        }
        return claims.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      }
    );
  },

  async getClaimById(id) {
    return withFallback(
      async () => {
        return await apiClient.get(`/claims/${id}`);
      },
      async () => {
        await delay();
        const claims = storageService.get(STORAGE_KEYS.CLAIMS) || [];
        const claim = claims.find(c => c.id === id);
        if (!claim) throw new Error('Không tìm thấy yêu cầu');
        return claim;
      }
    );
  },

  async createClaim(data) {
    return withFallback(
      async () => {
        return await apiClient.post('/claims', {
          item_id: data.itemId,
          reason: data.reason,
          secret_details: data.secretDetails,
          evidences: data.evidences || [],
        });
      },
      async () => {
        await delay(400);
        const claims = storageService.get(STORAGE_KEYS.CLAIMS) || [];
        const items = storageService.get(STORAGE_KEYS.ITEMS) || [];
        const item = items.find(i => i.id === data.itemId);

        // BR03: cannot claim own item
        if (item && item.userId === data.claimantId) {
          throw new Error('Bạn không thể yêu cầu nhận lại vật phẩm do chính bạn đăng.');
        }
        // BR04: cannot claim returned item
        if (item && item.status === 'RETURNED') {
          throw new Error('Vật phẩm này đã được trả lại.');
        }
        // BR05: only one approved claim at a time
        const existingApproved = claims.find(c => c.itemId === data.itemId &&
          [CLAIM_STATUS.APPROVED, CLAIM_STATUS.READY_FOR_HANDOVER].includes(c.status));
        if (existingApproved) {
          throw new Error('Vật phẩm này đã có yêu cầu được chấp nhận.');
        }

        const id = 'C' + String(claims.length + 1).padStart(3, '0');
        const newClaim = {
          id, ...data, status: CLAIM_STATUS.PENDING,
          createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
        };
        claims.push(newClaim);
        storageService.set(STORAGE_KEYS.CLAIMS, claims);

        addAuditLog(data.claimantId, `User submitted claim for "${item?.title}"`, 'Claim', id, 'CREATE');
        addNotification(data.claimantId, 'Yêu cầu đã gửi', `Yêu cầu nhận lại "${item?.title}" đã được gửi thành công.`, 'claim_submitted', id);
        
        // Notify staff
        const users = storageService.get(STORAGE_KEYS.USERS) || [];
        users.filter(u => u.role === 'STAFF' || u.role === 'ADMIN').forEach(staff => {
          addNotification(staff.id, 'Yêu cầu mới', `Có yêu cầu nhận đồ mới cho "${item?.title}".`, 'new_claim', id);
        });

        return newClaim;
      }
    );
  },

  async reviewClaim(claimId, staffId, note) {
    return withFallback(
      async () => {
        return await apiClient.put(`/claims/${claimId}/review`, { note: note || '' });
      },
      async () => {
        await delay();
        const claims = storageService.get(STORAGE_KEYS.CLAIMS) || [];
        const idx = claims.findIndex(c => c.id === claimId);
        if (idx === -1) throw new Error('Không tìm thấy yêu cầu');
        claims[idx] = { ...claims[idx], status: CLAIM_STATUS.UNDER_REVIEW, reviewedBy: staffId, updatedAt: new Date().toISOString() };
        storageService.set(STORAGE_KEYS.CLAIMS, claims);

        addNotification(claims[idx].claimantId, 'Đang xác minh', `Yêu cầu của bạn đang được xác minh bởi nhân viên.`, 'claim_update', claimId);
        addAuditLog(staffId, `Staff started reviewing claim #${claimId}`, 'Claim', claimId, 'REVIEW');
        return claims[idx];
      }
    );
  },

  async approveClaim(claimId, staffId, note, evidenceImage = '') {
    return withFallback(
      async () => {
        return await apiClient.put(`/claims/${claimId}/approve`, { note: note || 'Đã xác minh.', evidence_image: evidenceImage });
      },
      async () => {
        await delay();
        const claims = storageService.get(STORAGE_KEYS.CLAIMS) || [];
        const idx = claims.findIndex(c => c.id === claimId);
        if (idx === -1) throw new Error('Không tìm thấy yêu cầu');
        claims[idx] = {
          ...claims[idx],
          status: CLAIM_STATUS.APPROVED,
          reviewedBy: staffId,
          reviewNote: note || 'Đã xác minh.',
          evidenceImage: evidenceImage || claims[idx].evidenceImage || '',
          updatedAt: new Date().toISOString()
        };
        storageService.set(STORAGE_KEYS.CLAIMS, claims);

        const items = storageService.get(STORAGE_KEYS.ITEMS) || [];
        const item = items.find(i => i.id === claims[idx].itemId);

        addNotification(claims[idx].claimantId, 'Yêu cầu được chấp nhận', `Yêu cầu nhận lại "${item?.title}" đã được chấp nhận.`, 'claim_approved', claimId);
        addAuditLog(staffId, `Staff approved claim #${claimId}`, 'Claim', claimId, 'APPROVE');
        return claims[idx];
      }
    );
  },

  async rejectClaim(claimId, staffId, reason) {
    return withFallback(
      async () => {
        return await apiClient.put(`/claims/${claimId}/reject`, { note: reason });
      },
      async () => {
        await delay();
        const claims = storageService.get(STORAGE_KEYS.CLAIMS) || [];
        const idx = claims.findIndex(c => c.id === claimId);
        if (idx === -1) throw new Error('Không tìm thấy yêu cầu');
        claims[idx] = { ...claims[idx], status: CLAIM_STATUS.REJECTED, reviewedBy: staffId, reviewNote: reason, updatedAt: new Date().toISOString() };
        storageService.set(STORAGE_KEYS.CLAIMS, claims);

        const items = storageService.get(STORAGE_KEYS.ITEMS) || [];
        const item = items.find(i => i.id === claims[idx].itemId);

        addNotification(claims[idx].claimantId, 'Yêu cầu bị từ chối', `Yêu cầu nhận lại "${item?.title}" đã bị từ chối. Lý do: ${reason}`, 'claim_rejected', claimId);
        addAuditLog(staffId, `Staff rejected claim #${claimId}`, 'Claim', claimId, 'REJECT');
        return claims[idx];
      }
    );
  },

  async setReadyForHandover(claimId, staffId) {
    return withFallback(
      async () => {
        return await apiClient.put(`/claims/${claimId}/ready`, {});
      },
      async () => {
        await delay();
        const claims = storageService.get(STORAGE_KEYS.CLAIMS) || [];
        const idx = claims.findIndex(c => c.id === claimId);
        if (idx === -1) throw new Error('Không tìm thấy yêu cầu');
        claims[idx] = { ...claims[idx], status: CLAIM_STATUS.READY_FOR_HANDOVER, updatedAt: new Date().toISOString() };
        storageService.set(STORAGE_KEYS.CLAIMS, claims);

        const items = storageService.get(STORAGE_KEYS.ITEMS) || [];
        const item = items.find(i => i.id === claims[idx].itemId);

        addNotification(claims[idx].claimantId, 'Chờ bàn giao', `"${item?.title}" đã sẵn sàng để bàn giao. Vui lòng đến Bộ phận Lost & Found.`, 'ready_handover', claimId);
        return claims[idx];
      }
    );
  },

  async completeHandover(claimId, handoverData) {
    return withFallback(
      async () => {
        return await apiClient.post(`/claims/${claimId}/handover`, {
          date: handoverData.date || new Date().toISOString(),
          notes: handoverData.notes || '',
          evidence_image: handoverData.evidenceImage || handoverData.handoverImage || ''
        });
      },
      async () => {
        await delay(400);
        const claims = storageService.get(STORAGE_KEYS.CLAIMS) || [];
        const idx = claims.findIndex(c => c.id === claimId);
        if (idx === -1) throw new Error('Không tìm thấy yêu cầu');

        // BR07
        if (![CLAIM_STATUS.APPROVED, CLAIM_STATUS.READY_FOR_HANDOVER].includes(claims[idx].status)) {
          throw new Error('Chỉ có thể bàn giao claim đã được chấp nhận.');
        }

        const evidenceImage = handoverData.evidenceImage || handoverData.handoverImage || claims[idx].evidenceImage || '';

        // Update claim
        claims[idx] = {
          ...claims[idx],
          status: CLAIM_STATUS.COMPLETED,
          handoverImage: evidenceImage,
          evidenceImage: evidenceImage,
          updatedAt: new Date().toISOString()
        };
        storageService.set(STORAGE_KEYS.CLAIMS, claims);

        // Update item → RETURNED (BR08)
        const items = storageService.get(STORAGE_KEYS.ITEMS) || [];
        const itemIdx = items.findIndex(i => i.id === claims[idx].itemId);
        if (itemIdx !== -1) {
          items[itemIdx] = { ...items[itemIdx], status: 'RETURNED' };
          storageService.set(STORAGE_KEYS.ITEMS, items);
        }

        // Create handover record
        const handovers = storageService.get(STORAGE_KEYS.HANDOVERS) || [];
        const hId = 'H' + String(handovers.length + 1).padStart(3, '0');
        const record = {
          id: hId, claimId, itemId: claims[idx].itemId,
          receiverId: claims[idx].claimantId,
          staffId: handoverData.staffId,
          date: handoverData.date || new Date().toISOString(),
          notes: handoverData.notes || '',
          evidenceImage: evidenceImage,
          createdAt: new Date().toISOString(),
        };
        handovers.push(record);
        storageService.set(STORAGE_KEYS.HANDOVERS, handovers);

        const item = items.find(i => i.id === claims[idx].itemId);
        addNotification(claims[idx].claimantId, 'Đã bàn giao', `"${item?.title}" đã được bàn giao thành công.`, 'handover_complete', claimId);
        addAuditLog(handoverData.staffId, `Staff completed handover #${hId}`, 'Handover', hId, 'HANDOVER');

        return record;
      }
    );
  },

  async getHandovers() {
    return withFallback(
      async () => {
        const res = await apiClient.get('/claims/handovers');
        return Array.isArray(res) ? res : res.handovers || [];
      },
      async () => {
        await delay();
        return (storageService.get(STORAGE_KEYS.HANDOVERS) || []).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      }
    );
  },
};

export default claimService;
