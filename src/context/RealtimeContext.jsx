import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { useAuth } from './AuthContext';
import chatService from '../services/chatService';
import notificationService from '../services/notificationService';

const RealtimeContext = createContext(null);
const POLL_INTERVAL = 3000;
const CHANNEL_NAME = 'unifind-account-sync';

function capBadge(value) {
  return value > 99 ? '99+' : String(value);
}

export function RealtimeProvider({ children }) {
  const { user } = useAuth();
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState(0);
  const [conversations, setConversations] = useState([]);
  const runningRef = useRef(false);
  const requestVersionRef = useRef(0);
  const userId = user?.id;

  const refreshCounts = useCallback(async () => {
    if (!userId || runningRef.current || document.visibilityState === 'hidden') return;
    const requestUserId = userId;
    const requestVersion = requestVersionRef.current;
    runningRef.current = true;
    try {
      const [chatRows, notificationRows] = await Promise.all([
        chatService.getConversationsForUser(userId),
        notificationService.getByUser(userId),
      ]);
      if (
        requestVersion !== requestVersionRef.current ||
        String(requestUserId) !== String(userId)
      ) return;
      setConversations(chatRows);
      setUnreadMessagesCount(chatRows.reduce((total, row) => total + Number(row.unreadCount || 0), 0));
      setUnreadNotificationsCount(notificationRows.filter(row => !row.read && row.type !== 'chat_message').length);
    } catch {
      // Giữ số gần nhất khi mất mạng; lần reconnect/focus kế tiếp sẽ đồng bộ lại từ backend.
    } finally {
      runningRef.current = false;
    }
  }, [userId]);

  useEffect(() => {
    requestVersionRef.current += 1;
    setUnreadMessagesCount(0);
    setUnreadNotificationsCount(0);
    setConversations([]);
    runningRef.current = false;
    if (!userId) return undefined;

    const channel = typeof BroadcastChannel !== 'undefined'
      ? new BroadcastChannel(CHANNEL_NAME)
      : null;
    const sync = () => refreshCounts();
    const handleVisible = () => {
      if (document.visibilityState === 'visible') sync();
    };
    const handleLocalChange = () => {
      sync();
      channel?.postMessage({ type: 'refresh', userId });
    };
    const handleChannel = event => {
      if (event.data?.type === 'refresh' && String(event.data.userId) === String(userId)) sync();
    };

    refreshCounts();
    const timer = window.setInterval(refreshCounts, POLL_INTERVAL);
    window.addEventListener('online', sync);
    window.addEventListener('focus', sync);
    window.addEventListener('unifind:data-changed', handleLocalChange);
    document.addEventListener('visibilitychange', handleVisible);
    if (channel) channel.addEventListener('message', handleChannel);

    return () => {
      requestVersionRef.current += 1;
      window.clearInterval(timer);
      window.removeEventListener('online', sync);
      window.removeEventListener('focus', sync);
      window.removeEventListener('unifind:data-changed', handleLocalChange);
      document.removeEventListener('visibilitychange', handleVisible);
      if (channel) {
        channel.removeEventListener('message', handleChannel);
        channel.close();
      }
    };
  }, [refreshCounts, userId]);

  return (
    <RealtimeContext.Provider value={{
      unreadMessagesCount,
      unreadNotificationsCount,
      // Giữ alias cũ để không làm thay đổi các layout đang hoạt động.
      unreadMessages: unreadMessagesCount,
      unreadNotifications: unreadNotificationsCount,
      unreadMessagesLabel: capBadge(unreadMessagesCount),
      unreadNotificationsLabel: capBadge(unreadNotificationsCount),
      conversations,
      refreshCounts,
    }}>
      {children}
    </RealtimeContext.Provider>
  );
}

export function useRealtime() {
  const context = useContext(RealtimeContext);
  if (!context) throw new Error('useRealtime must be used within RealtimeProvider');
  return context;
}
