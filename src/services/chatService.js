import apiClient from './apiClient';
import { isSameEntityId } from '../utils';


function notifyDataChanged() {
  if (typeof window !== 'undefined') window.dispatchEvent(new Event('unifind:data-changed'));
}

function normalizeMessage(message = {}) {
  return {
    ...message,
    clientId: message.clientId ?? message.client_message_id ?? null,
    replyToId: message.replyToId ?? message.reply_to_id ?? null,
    recalledAt: message.recalledAt ?? message.recalled_at ?? null,
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
    manualUnread: conversation.manualUnread ?? conversation.manual_unread ?? false,
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

export const chatService = {
  async getConversation(itemId, currentUserId, recipientId) {
    if (!currentUserId || !recipientId) {
      throw new Error('Không xác định được người gửi hoặc người nhận.');
    }
    if (isSameEntityId(currentUserId, recipientId)) {
      throw new Error('Bạn không thể tạo cuộc trò chuyện với chính mình.');
    }
    return normalizeConversation(await apiClient.post('/chats', {
      item_id: Number(itemId),
      recipient_id: Number(recipientId),
    }));
  },

  async getConversationById(conversationId) {
    return normalizeConversation(await apiClient.get('/chats/' + conversationId));
  },

  async getConversationsForUser(userId) {
    if (!userId) throw new Error('Bạn cần đăng nhập để xem trò chuyện.');
    const rows = await apiClient.get('/chats');
    return (Array.isArray(rows) ? rows : []).map(normalizeConversation);
  },

  async sendMessage({ conversationId, itemId, sender, recipientId, text, image = null, itemData = {}, clientMessageId, replyToId }) {
    if (!text?.trim() && !image) throw new Error('Nội dung tin nhắn hoặc hình ảnh không được để trống');
    if (!sender?.id || !recipientId) throw new Error('Không xác định được người gửi hoặc người nhận. Vui lòng tải lại trang.');
    if (isSameEntityId(sender.id, recipientId)) throw new Error('Bạn không thể gửi tin nhắn cho chính mình.');
    let activeConversationId = conversationId;
    if (!activeConversationId) {
      const conversation = await this.getConversation(itemId, sender.id, recipientId, itemData);
      activeConversationId = conversation.id;
    }
    const message = normalizeMessage(await apiClient.post(`/chats/${activeConversationId}/messages`, {
      text: text?.trim() || '',
      image_url: image || '',
      client_message_id: clientMessageId || '',
      reply_to_id: replyToId || null,
    }, { timeout: 12000 }));
    notifyDataChanged();
    return { message, conversationId: activeConversationId };
  },

  async markAsRead(conversationId) {
    const result = await apiClient.put('/chats/' + conversationId + '/read', {});
    notifyDataChanged();
    return result;
  },

  async setPinned(conversationId, pinned) {
    await apiClient.put(`/chats/${conversationId}/pin`, { pinned });
    notifyDataChanged();
  },

  async setUnread(conversationId, unread) {
    await apiClient.put(`/chats/${conversationId}/unread`, { unread });
    notifyDataChanged();
  },

  async recallMessage(conversationId, messageId) {
    await apiClient.post(`/chats/${conversationId}/messages/${messageId}/recall`, {});
    notifyDataChanged();
  },

  async forwardMessage(conversationId, sourceConversationId, messageId, clientMessageId) {
    const message = normalizeMessage(await apiClient.post(`/chats/${conversationId}/forward`, {
      source_conversation_id: Number(sourceConversationId), message_id: Number(messageId), client_message_id: clientMessageId,
    }));
    notifyDataChanged();
    return message;
  },

  async reportConversation(conversationId, reason) {
    return apiClient.post(`/chats/${conversationId}/report`, { reason });
  },

  async setArchived(conversationId, archived) {
    await apiClient.put(`/chats/${conversationId}/archive`, { archived });
    notifyDataChanged();
  },

  async deleteConversation(conversationId) {
    await apiClient.delete(`/chats/${conversationId}`);
    notifyDataChanged();
  },

  async setBlocked(conversationId, blocked) {
    const result = await apiClient.put('/chats/' + conversationId + '/block', { blocked });
    notifyDataChanged();
    return result;
  },
};

export default chatService;
