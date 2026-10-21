import apiClient, { withFallback } from './apiClient';
import { STORAGE_KEYS } from '../constants';
import storageService from './storageService';
import notificationService from './notificationService';

const delay = (ms = 120) => new Promise(resolve => setTimeout(resolve, ms));

function normalizeMessage(message = {}) {
  return {
    ...message,
    conversationId: message.conversationId ?? message.conversation_id,
    senderId: message.senderId ?? message.sender_id,
    senderName: message.senderName ?? message.sender_name ?? message.sender?.name ?? 'Người dùng DNTU',
    senderAvatar: message.senderAvatar ?? message.sender_avatar ?? message.sender?.avatar_url ?? message.sender?.avatar ?? null,
    image: message.image ?? message.image_url ?? null,
    createdAt: message.createdAt ?? message.created_at,
    read: message.read ?? Boolean(message.read_at),
  };
}

function normalizeConversation(conversation = {}) {
  const messages = Array.isArray(conversation.messages)
    ? conversation.messages.map(normalizeMessage)
    : [];
  return {
    ...conversation,
    itemId: conversation.itemId ?? conversation.item_id,
    itemTitle: conversation.itemTitle ?? conversation.item_title ?? 'Vật phẩm',
    itemImage: conversation.itemImage ?? conversation.item_image ?? null,
    itemType: conversation.itemType ?? conversation.item_type,
    itemStatus: conversation.itemStatus ?? conversation.item_status,
    itemLocation: conversation.itemLocation ?? conversation.item_location ?? '',
    blockedByMe: conversation.blockedByMe ?? conversation.blocked_by_me ?? false,
    unreadCount: conversation.unreadCount ?? conversation.unread_count ?? 0,
    lastMessageAt: conversation.lastMessageAt ?? conversation.last_message_at ?? conversation.updated_at,
    lastMessage: conversation.lastMessage || conversation.last_message
      ? normalizeMessage(conversation.lastMessage || conversation.last_message)
      : (messages.at(-1) || null),
    createdAt: conversation.createdAt ?? conversation.created_at,
    updatedAt: conversation.updatedAt ?? conversation.updated_at,
    messages,
  };
}

const localChat = {
  getChats() {
    const chats = storageService.get(STORAGE_KEYS.CHATS);
    return Array.isArray(chats) ? chats : [];
  },
  saveChats(chats) {
    storageService.set(STORAGE_KEYS.CHATS, chats);
  },
  makeId(itemId, userA, userB) {
    const sorted = [String(userA), String(userB)].sort();
    return `chat_${itemId}_${sorted[0]}_${sorted[1]}`;
  },
  async getOrCreate(itemId, currentUser, recipient, itemData = {}) {
    await delay();
    if (!currentUser?.id || !recipient?.id) {
      throw new Error('Thiếu thông tin người gửi hoặc người nhận. Vui lòng tải lại trang.');
    }
    const chats = this.getChats();
    const id = this.makeId(itemId, currentUser.id, recipient.id);
    let conversation = chats.find(row => row.id === id);
    if (!conversation) {
      conversation = {
        id,
        itemId: String(itemId),
        itemTitle: itemData.title || 'Vật phẩm',
        itemImage: itemData.images?.[0] || null,
        itemType: itemData.type,
        itemStatus: itemData.status,
        itemLocation: typeof itemData.location === 'object' ? itemData.location?.name : itemData.location,
        recipient,
        participants: [String(currentUser.id), String(recipient.id)],
        messages: [],
        blocked: false,
        blockedByMe: false,
        updatedAt: new Date().toISOString(),
      };
      chats.unshift(conversation);
      this.saveChats(chats);
    }
    return normalizeConversation(conversation);
  },
};

export const chatService = {
  async getConversation(itemId, currentUserId, recipientId, itemData = {}) {
    if (!currentUserId || !recipientId) {
      throw new Error('Không xác định được người gửi hoặc người nhận.');
    }
    return withFallback(
      async () => normalizeConversation(await apiClient.post('/chats', {
        item_id: Number(itemId),
        recipient_id: Number(recipientId),
      })),
      async () => localChat.getOrCreate(
        itemId,
        { id: currentUserId },
        { id: recipientId },
        itemData,
      ),
    );
  },

  async getConversationById(conversationId) {
    return withFallback(
      async () => normalizeConversation(await apiClient.get(`/chats/${conversationId}`)),
      async () => {
        await delay();
        const conversation = localChat.getChats().find(row => String(row.id) === String(conversationId));
        if (!conversation) throw new Error('Không tìm thấy cuộc trò chuyện');
        return normalizeConversation(conversation);
      },
    );
  },

  async getConversationsForUser(userId) {
    return withFallback(
      async () => {
        const rows = await apiClient.get('/chats');
        return (Array.isArray(rows) ? rows : []).map(normalizeConversation);
      },
      async () => {
        await delay();
        return localChat.getChats()
          .filter(row => row.participants?.map(String).includes(String(userId)))
          .map(normalizeConversation)
          .sort((a, b) => new Date(b.lastMessageAt || 0) - new Date(a.lastMessageAt || 0));
      },
    );
  },

  async sendMessage({ conversationId, itemId, sender, recipientId, text, image = null, itemData = {} }) {
    if (!text?.trim() && !image) throw new Error('Nội dung tin nhắn hoặc hình ảnh không được để trống');
    if (!sender?.id || !recipientId) throw new Error('Không xác định được người gửi hoặc người nhận. Vui lòng tải lại trang.');
    return withFallback(
      async () => {
        let activeConversationId = conversationId;
        if (!activeConversationId) {
          const conversation = await this.getConversation(itemId, sender.id, recipientId, itemData);
          activeConversationId = conversation.id;
        }
        const message = normalizeMessage(await apiClient.post(`/chats/${activeConversationId}/messages`, {
          text: text?.trim() || '',
          image_url: image || '',
        }, { timeout: 12000 }));
        return { message, conversationId: activeConversationId };
      },
      async () => {
        const conversation = await localChat.getOrCreate(itemId, sender, { id: recipientId }, itemData);
        const chats = localChat.getChats();
        const stored = chats.find(row => String(row.id) === String(conversation.id));
        if (!stored) throw new Error('Không thể khởi tạo cuộc trò chuyện. Vui lòng thử lại.');
        const message = normalizeMessage({
          id: `msg_${Date.now()}`,
          senderId: String(sender.id),
          senderName: sender.name || sender.fullName || 'Người dùng DNTU',
          senderAvatar: sender.avatar || sender.avatar_url || null,
          text: text?.trim() || '',
          image,
          read: false,
          createdAt: new Date().toISOString(),
        });
        stored.messages.push(message);
        stored.updatedAt = message.createdAt;
        localChat.saveChats(chats);
        try {
          await notificationService.addNotification(recipientId, `Tin nhắn mới từ ${message.senderName}`, message.text || '[Hình ảnh]', 'chat_message', itemId);
        } catch {
          // Thông báo local không làm gián đoạn gửi tin nhắn.
        }
        return { message, conversationId: stored.id };
      },
    );
  },

  async markAsRead(conversationId, currentUserId) {
    return withFallback(
      async () => apiClient.put(`/chats/${conversationId}/read`, {}),
      async () => {
        const chats = localChat.getChats();
        const conversation = chats.find(row => String(row.id) === String(conversationId));
        conversation?.messages?.forEach(message => {
          if (String(message.senderId) !== String(currentUserId)) message.read = true;
        });
        localChat.saveChats(chats);
      },
    );
  },

  async setBlocked(conversationId, blocked) {
    return withFallback(
      async () => apiClient.put(`/chats/${conversationId}/block`, { blocked }),
      async () => {
        const chats = localChat.getChats();
        const conversation = chats.find(row => String(row.id) === String(conversationId));
        if (conversation) {
          conversation.blocked = blocked;
          conversation.blockedByMe = blocked;
          localChat.saveChats(chats);
        }
      },
    );
  },
};

export default chatService;
