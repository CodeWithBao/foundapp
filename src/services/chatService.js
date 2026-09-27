import { STORAGE_KEYS } from '../constants';
import storageService from './storageService';
import notificationService from './notificationService';

const delay = (ms = 150) => new Promise(resolve => setTimeout(resolve, ms));

const SEED_CONVERSATIONS = [
  {
    id: 'chat_P004_U001_U005',
    itemId: 'P004',
    itemTitle: 'Chìa khóa xe Honda',
    itemImage: 'https://images.unsplash.com/photo-1582139329536-e7284fece509?w=400&h=300&fit=crop',
    itemType: 'FOUND',
    itemStatus: 'FOUND',
    itemLocation: 'Bãi xe',
    holderType: 'USER',
    participants: ['U001', 'U005'],
    messages: [
      {
        id: 'msg_001',
        senderId: 'U001',
        senderName: 'Nguyễn Văn An',
        senderAvatar: null,
        text: 'Chào bạn, mình thấy bài đăng nhặt được chùm chìa khóa Honda ở bãi xe. Mình bị rơi tầm chiều qua.',
        image: null,
        createdAt: '2026-09-09T17:10:00Z',
        read: true,
      },
      {
        id: 'msg_002',
        senderId: 'U005',
        senderName: 'Lê Hoàng Long',
        senderAvatar: null,
        text: 'Chào bạn! Đúng rồi mình nhặt được gần cột B3 bãi xe máy. Chùm này có móc gấu bông nâu đúng không?',
        image: null,
        createdAt: '2026-09-09T17:15:00Z',
        read: true,
      },
      {
        id: 'msg_003',
        senderId: 'U001',
        senderName: 'Nguyễn Văn An',
        senderAvatar: null,
        text: 'Dạ đúng rồi bạn ơi, móc gấu bông nâu có khắc chữ An ở dưới đáy!',
        image: null,
        createdAt: '2026-09-09T17:18:00Z',
        read: true,
      },
      {
        id: 'msg_004',
        senderId: 'U005',
        senderName: 'Lê Hoàng Long',
        senderAvatar: null,
        text: 'Chuẩn rồi nhé! Để an toàn bạn cứ bấm nút "Gửi yêu cầu nhận lại" trên web để hệ thống ghi nhận đối soát nhé, hoặc mai tầm 9h gặp mình ở sảnh GĐ-A.',
        image: null,
        createdAt: '2026-09-09T17:22:00Z',
        read: true,
      }
    ],
    updatedAt: '2026-09-09T17:22:00Z',
    blockedBy: [],
  },
  {
    id: 'chat_P001_U004_U001',
    itemId: 'P001',
    itemTitle: 'Ví da màu đen',
    itemImage: 'https://images.unsplash.com/photo-1627123424574-724758594e93?w=400&h=300&fit=crop',
    itemType: 'LOST',
    itemStatus: 'LOST',
    itemLocation: 'Thư viện',
    holderType: 'USER',
    participants: ['U004', 'U001'],
    messages: [
      {
        id: 'msg_101',
        senderId: 'U004',
        senderName: 'Phạm Thị Dung',
        senderAvatar: null,
        text: 'Chào An, mình vừa nhặt được một chiếc ví da đen ở bàn đọc lầu 2 thư viện, có thẻ SV mang tên bạn!',
        image: null,
        createdAt: '2026-09-12T09:00:00Z',
        read: true,
      },
      {
        id: 'msg_102',
        senderId: 'U001',
        senderName: 'Nguyễn Văn An',
        senderAvatar: null,
        text: 'Ôi may quá cảm ơn bạn rất nhiều! Ví hiệu Montblanc đúng không bạn?',
        image: null,
        createdAt: '2026-09-12T09:05:00Z',
        read: true,
      }
    ],
    updatedAt: '2026-09-12T09:05:00Z',
    blockedBy: [],
  }
];

export const chatService = {
  _getChats() {
    let chats = storageService.get(STORAGE_KEYS.CHATS);
    if (!chats || !Array.isArray(chats) || chats.length === 0) {
      storageService.set(STORAGE_KEYS.CHATS, SEED_CONVERSATIONS);
      return SEED_CONVERSATIONS;
    }
    return chats;
  },

  _saveChats(chats) {
    storageService.set(STORAGE_KEYS.CHATS, chats);
  },

  _getBlockMap() {
    return storageService.get(STORAGE_KEYS.CHAT_BLOCKED) || {};
  },

  _saveBlockMap(map) {
    storageService.set(STORAGE_KEYS.CHAT_BLOCKED, map);
  },

  makeConversationId(itemId, userA, userB) {
    const sorted = [String(userA), String(userB)].sort();
    return `chat_${itemId}_${sorted[0]}_${sorted[1]}`;
  },

  async getConversation(itemId, user1Id, user2Id, itemData = {}) {
    await delay(100);
    const chats = this._getChats();
    const convId = this.makeConversationId(itemId, user1Id, user2Id);
    let conv = chats.find(c => c.id === convId);

    if (!conv) {
      conv = {
        id: convId,
        itemId: String(itemId),
        itemTitle: itemData.title || 'Vật phẩm',
        itemImage: itemData.images?.[0] || itemData.image || null,
        itemType: itemData.type || 'FOUND',
        itemStatus: itemData.status || 'FOUND',
        itemLocation: typeof itemData.location === 'object' ? itemData.location?.name : (itemData.location || ''),
        holderType: itemData.holderType || (itemData.keepingItem === false ? 'STAFF' : 'USER'),
        participants: [String(user1Id), String(user2Id)],
        messages: [],
        updatedAt: new Date().toISOString(),
        blockedBy: [],
      };
      chats.unshift(conv);
      this._saveChats(chats);
    } else {
      // Sync fresh item status if available
      if (itemData.status && conv.itemStatus !== itemData.status) {
        conv.itemStatus = itemData.status;
        this._saveChats(chats);
      }
    }

    return conv;
  },

  async getConversationsForUser(userId) {
    await delay(150);
    const chats = this._getChats();
    const uid = String(userId);
    return chats
      .filter(c => c.participants && c.participants.includes(uid))
      .sort((a, b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0));
  },

  async sendMessage({ itemId, sender, recipientId, text, image = null, itemData = {} }) {
    await delay(120);
    if (!text?.trim() && !image) {
      throw new Error('Nội dung tin nhắn hoặc hình ảnh không được để trống');
    }

    const senderId = String(sender.id);
    const targetId = String(recipientId);

    if (this.isBlocked(senderId, targetId)) {
      throw new Error('Không thể gửi tin nhắn vì cuộc trò chuyện đang bị chặn.');
    }

    const chats = this._getChats();
    const convId = this.makeConversationId(itemId, senderId, targetId);
    let conv = chats.find(c => c.id === convId);

    if (!conv) {
      conv = {
        id: convId,
        itemId: String(itemId),
        itemTitle: itemData.title || 'Vật phẩm',
        itemImage: itemData.images?.[0] || itemData.image || null,
        itemType: itemData.type || 'FOUND',
        itemStatus: itemData.status || 'FOUND',
        itemLocation: typeof itemData.location === 'object' ? itemData.location?.name : (itemData.location || ''),
        holderType: itemData.holderType || (itemData.keepingItem === false ? 'STAFF' : 'USER'),
        participants: [senderId, targetId],
        messages: [],
        updatedAt: new Date().toISOString(),
        blockedBy: [],
      };
      chats.unshift(conv);
    }

    // Check if item is already RETURNED (Read-only check)
    if (conv.itemStatus === 'RETURNED' || itemData.status === 'RETURNED') {
      throw new Error('Vật phẩm này đã được bàn giao xong. Cuộc trò chuyện đã đóng ở chế độ chỉ đọc.');
    }

    const newMessage = {
      id: 'msg_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
      senderId,
      senderName: sender.name || 'Người dùng',
      senderAvatar: sender.avatar || null,
      text: text ? text.trim() : '',
      image,
      createdAt: new Date().toISOString(),
      read: false,
    };

    conv.messages.push(newMessage);
    conv.updatedAt = newMessage.createdAt;
    this._saveChats(chats);

    // Notify recipient
    try {
      const snippet = text ? (text.length > 50 ? text.slice(0, 50) + '...' : text) : '[Đã gửi một hình ảnh]';
      await notificationService.addNotification(
        targetId,
        `Tin nhắn mới từ ${sender.name || 'Sinh viên'}`,
        `Đã nhắn: "${snippet}" về đồ vật: ${conv.itemTitle}`,
        'chat_message',
        itemId
      );
    } catch {
      // Non-fatal notification failure
    }

    return { message: newMessage, conversation: conv };
  },

  async markAsRead(conversationId, currentUserId) {
    const chats = this._getChats();
    const conv = chats.find(c => c.id === conversationId);
    if (!conv) return;

    let changed = false;
    const uid = String(currentUserId);
    conv.messages.forEach(m => {
      if (m.senderId !== uid && !m.read) {
        m.read = true;
        changed = true;
      }
    });

    if (changed) {
      this._saveChats(chats);
    }
  },

  blockUser(currentUserId, targetUserId) {
    const uid = String(currentUserId);
    const tid = String(targetUserId);
    const blockMap = this._getBlockMap();
    if (!blockMap[uid]) blockMap[uid] = [];
    if (!blockMap[uid].includes(tid)) {
      blockMap[uid].push(tid);
    }
    this._saveBlockMap(blockMap);
    return true;
  },

  unblockUser(currentUserId, targetUserId) {
    const uid = String(currentUserId);
    const tid = String(targetUserId);
    const blockMap = this._getBlockMap();
    if (blockMap[uid]) {
      blockMap[uid] = blockMap[uid].filter(id => id !== tid);
      this._saveBlockMap(blockMap);
    }
    return true;
  },

  isBlocked(user1Id, user2Id) {
    const u1 = String(user1Id);
    const u2 = String(user2Id);
    const blockMap = this._getBlockMap();
    const u1Blocked = blockMap[u1] && blockMap[u1].includes(u2);
    const u2Blocked = blockMap[u2] && blockMap[u2].includes(u1);
    return Boolean(u1Blocked || u2Blocked);
  },

  isBlockedByMe(currentUserId, targetUserId) {
    const uid = String(currentUserId);
    const tid = String(targetUserId);
    const blockMap = this._getBlockMap();
    return Boolean(blockMap[uid] && blockMap[uid].includes(tid));
  },

  reportChat({ reporterId, reportedUserId, itemId, conversationId, reason, description }) {
    const reports = storageService.get('unifind_reports') || [];
    const newReport = {
      id: Date.now(),
      post_id: Number(String(itemId).replace(/\D/g, '')) || 0,
      itemId,
      conversationId,
      reporter_id: reporterId,
      reported_user_id: reportedUserId,
      reason: reason || 'Nghi vấn lừa đảo / Tin nhắn quấy rối',
      description,
      type: 'CHAT_REPORT',
      status: 'PENDING',
      created_at: new Date().toISOString(),
    };
    reports.unshift(newReport);
    storageService.set('unifind_reports', reports);
    return newReport;
  }
};

export default chatService;
