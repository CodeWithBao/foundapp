import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Link, useOutletContext, useSearchParams } from 'react-router-dom';
import { createPortal } from 'react-dom';
import { ArrowDown, ArrowLeft, Check, CheckCheck, Copy, Forward, Image as ImageIcon, Info, Loader2, MessageCircle, MoreVertical, Reply, Search, Send, Undo2, X } from 'lucide-react';
import { ITEM_STATUS_CONFIG } from '../../constants';
import { toast } from 'sonner';
import { useAuth } from '../../context/AuthContext';
import chatService from '../../services/chatService';
import Avatar from '../../components/common/Avatar';
import Modal from '../../components/common/Modal';
import './MessagesPage.css';
import LoadingSkeleton from '../../components/common/LoadingSkeleton';
import { useRealtime } from '../../context/RealtimeContext';

const POLL_INTERVAL = 5000;
const MESSAGE_BATCH_SIZE = 30;

function createClientMessageId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `chat-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function mergeMessages(serverMessages = [], localMessages = []) {
  const serverIds = new Set(serverMessages.map(message => String(message.id)));
  const matchedServerIndexes = new Set();
  const transient = localMessages.filter(message => {
    if (!['sending', 'failed', 'uncertain'].includes(message.deliveryStatus)) return false;
    if (serverIds.has(String(message.id))) return false;
    if (message.clientId && serverMessages.some(row => row.clientId === message.clientId)) return false;
    if (message.deliveryStatus === 'failed') return true;

    const localTime = new Date(message.createdAt).getTime();
    const matchIndex = serverMessages.findIndex((serverMessage, index) => {
      if (matchedServerIndexes.has(index)) return false;
      if (serverMessage.clientId || message.clientId) return false;
      const serverTime = new Date(serverMessage.createdAt).getTime();
      return String(serverMessage.senderId) === String(message.senderId)
        && String(serverMessage.text || '') === String(message.text || '')
        && String(serverMessage.image || '') === String(message.image || '')
        && Number.isFinite(localTime)
        && Number.isFinite(serverTime)
        && Math.abs(serverTime - localTime) <= 60000;
    });

    if (matchIndex >= 0) {
      matchedServerIndexes.add(matchIndex);
      return false;
    }
    return true;
  });

  return [...serverMessages, ...transient].sort((a, b) =>
    new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
}

function messageTime(value) {
  if (!value) return '';
  return new Intl.DateTimeFormat('vi-VN', { hour: '2-digit', minute: '2-digit' }).format(new Date(value));
}

function conversationTime(value) {
  if (!value) return '';
  const date = new Date(value);
  const elapsedMinutes = Math.max(0, Math.floor((Date.now() - date.getTime()) / 60000));
  if (elapsedMinutes < 1) return 'Vừa xong';
  if (elapsedMinutes < 60) return `${elapsedMinutes} phút trước`;
  if (elapsedMinutes < 1440) return `${Math.floor(elapsedMinutes / 60)} giờ trước`;
  if (elapsedMinutes < 10080) return `${Math.floor(elapsedMinutes / 1440)} ngày trước`;
  return new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit' }).format(date);
}

export default function MessagesPage() {
  const { user } = useAuth();
  const { assistantOpen = false, isMobile = false } = useOutletContext() || {};
  const { conversations: realtimeConversations } = useRealtime();
  const [searchParams, setSearchParams] = useSearchParams();
  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [query, setQuery] = useState('');
  // FRONTEND UI ONLY
  const [showArchived, setShowArchived] = useState(false);
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [infoOpen, setInfoOpen] = useState(false);
  const [desktopList, setDesktopList] = useState(() => window.matchMedia('(min-width: 1024px)').matches);
  const [dockedInfo, setDockedInfo] = useState(() => window.matchMedia('(min-width: 1440px)').matches);
  // FRONTEND UI ONLY: transient drawers never survive a breakpoint or reload.
  useEffect(() => {
    const listMedia = window.matchMedia('(min-width: 1024px)');
    const infoMedia = window.matchMedia('(min-width: 1440px)');
    const update = () => { setDesktopList(listMedia.matches); setDockedInfo(infoMedia.matches); setDrawerOpen(false); };
    listMedia.addEventListener('change', update);
    infoMedia.addEventListener('change', update);
    return () => { listMedia.removeEventListener('change', update); infoMedia.removeEventListener('change', update); };
  }, []);
  const [replyMessage, setReplyMessage] = useState(null);
  // FRONTEND UI ONLY: one anchored message menu, rendered outside scrolling containers.
  const [messageMenu, setMessageMenu] = useState(null);
  const messageMenuRef = useRef(null);
  const closeMessageMenu = useCallback((restoreFocus = false) => {
    setMessageMenu(current => {
      if (restoreFocus && current?.trigger?.isConnected) current.trigger.focus();
      return null;
    });
  }, []);

  useLayoutEffect(() => {
    if (!messageMenu) return undefined;
    const menu = messageMenuRef.current;
    const update = () => {
      if (!messageMenu.trigger.isConnected) { closeMessageMenu(); return; }
      const anchor = messageMenu.trigger.getBoundingClientRect();
      const viewport = window.visualViewport;
      const left = viewport?.offsetLeft || 0;
      const top = viewport?.offsetTop || 0;
      const width = viewport?.width || window.innerWidth;
      const height = viewport?.height || window.innerHeight;
      const bounds = menu.getBoundingClientRect();
      menu.style.left = `${Math.max(left + 8, Math.min(anchor.left, left + width - bounds.width - 8))}px`;
      const below = anchor.bottom + 6;
      menu.style.top = `${Math.max(top + 8, Math.min(below + bounds.height <= top + height - 8 ? below : anchor.top - bounds.height - 6, top + height - bounds.height - 8))}px`;
    };
    update();
    menu.querySelector('button:not(:disabled)')?.focus();
    const outside = event => {
      if (!menu.contains(event.target) && !messageMenu.trigger.contains(event.target)) closeMessageMenu();
    };
    const keyboard = event => {
      if (event.key === 'Escape') { event.preventDefault(); closeMessageMenu(true); }
      if (event.key === 'Tab') closeMessageMenu();
      if (['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) {
        event.preventDefault();
        const controls = [...menu.querySelectorAll('button:not(:disabled)')];
        const index = controls.indexOf(document.activeElement);
        const next = event.key === 'Home' ? 0 : event.key === 'End' ? controls.length - 1 : (index + (event.key === 'ArrowDown' ? 1 : -1) + controls.length) % controls.length;
        controls[next]?.focus();
      }
    };
    document.addEventListener('pointerdown', outside);
    document.addEventListener('keydown', keyboard);
    window.addEventListener('resize', update);
    window.addEventListener('scroll', update, true);
    window.visualViewport?.addEventListener('resize', update);
    window.visualViewport?.addEventListener('scroll', update);
    return () => {
      document.removeEventListener('pointerdown', outside);
      document.removeEventListener('keydown', keyboard);
      window.removeEventListener('resize', update);
      window.removeEventListener('scroll', update, true);
      window.visualViewport?.removeEventListener('resize', update);
      window.visualViewport?.removeEventListener('scroll', update);
    };
  }, [messageMenu, closeMessageMenu]);
  const [actionDialog, setActionDialog] = useState(null);
  const [reportReason, setReportReason] = useState('');
  const [actionError, setActionError] = useState('');
  const selectedIdRef = useRef(null);
  const activeSequenceRef = useRef(0);
  const messageRevisionRef = useRef(0);
  const [conversationActionBusy, setConversationActionBusy] = useState(false);
  const [inputText, setInputText] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeLoading, setActiveLoading] = useState(false);
  const [activeError, setActiveError] = useState('');
  const [connectionState, setConnectionState] = useState('connected');
  const [showNewMessages, setShowNewMessages] = useState(false);
  const [visibleMessageCount, setVisibleMessageCount] = useState(MESSAGE_BATCH_SIZE);
  const fileInputRef = useRef(null);
  const composerInputRef = useRef(null);
  const composerRef = useRef(null);
  const messagesViewportRef = useRef(null);
  const prependAnchorRef = useRef(null);
  const nearBottomRef = useRef(true);
  const previousMessageIdsRef = useRef(new Set());
  const activeUserIdRef = useRef(user?.id);
  const listRequestRunningRef = useRef(false);
  const selectedId = searchParams.get('conversation');
  selectedIdRef.current = selectedId;

  useEffect(() => {
    activeSequenceRef.current += 1;
    nearBottomRef.current = true;
    previousMessageIdsRef.current = new Set();
    setInputText('');
    setSelectedImage(null);
    setReplyMessage(null);
    setMessageMenu(null);
    setActionDialog(null);
    setDrawerOpen(false);
    setShowNewMessages(false);
    setInfoOpen(false);
  }, [selectedId]);

  useEffect(() => {
    if (!drawerOpen && !actionDialog && !infoOpen) return undefined;
    const previous = document.activeElement;
    const modalInfo = infoOpen && !dockedInfo;
    const trapFocus = Boolean(actionDialog || drawerOpen || modalInfo);
    const container = actionDialog ? document.querySelector('[data-chat-dialog]')?.closest('[role="dialog"]') : drawerOpen ? document.querySelector('[data-chat-sidebar]') : document.querySelector('[data-chat-info]');
    const controls = () => [...(container?.querySelectorAll('button:not(:disabled), input, textarea, select, a[href], summary') || [])].filter(element => element.getClientRects().length);
    controls()[0]?.focus();
    const onKeyDown = event => {
      if (event.key === 'Escape' && !conversationActionBusy) { if (actionDialog) setActionDialog(null); else { setDrawerOpen(false); setInfoOpen(false); } }
      if (event.key === 'Tab' && trapFocus) {
        const elements = controls();
        const first = elements[0]; const last = elements.at(-1);
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => { document.removeEventListener('keydown', onKeyDown); if (previous?.isConnected) previous.focus(); };
  }, [drawerOpen, infoOpen, dockedInfo, actionDialog, conversationActionBusy]);

  const refreshList = useCallback(async ({ silent = false } = {}) => {
    if (!user?.id || listRequestRunningRef.current) return;
    listRequestRunningRef.current = true;
    const requestUserId = user.id;
    try {
      if (!silent) setLoading(true);
      const rows = await chatService.getConversationsForUser(requestUserId);
      if (String(activeUserIdRef.current) === String(requestUserId)) setConversations(rows);
      setConnectionState('connected');
    } catch (err) {
      if (!silent) toast.error(err.message || 'Không thể tải danh sách trò chuyện.');
      else setConnectionState('reconnecting');
    } finally {
      listRequestRunningRef.current = false;
      if (!silent) setLoading(false);
    }
  }, [user?.id]);

  const refreshActive = useCallback(async ({ silent = false } = {}) => {
    if (!selectedId || !user?.id) {
      setActiveConversation(null);
      return;
    }
    const sequence = ++activeSequenceRef.current;
    const revision = messageRevisionRef.current;
    const requestUserId = user.id;
    const isCurrent = () => sequence === activeSequenceRef.current && String(selectedIdRef.current) === String(selectedId) && String(activeUserIdRef.current) === String(requestUserId);
    try {
      if (!silent) setActiveLoading(true);
      if (!silent) setActiveError('');
      const conversation = await chatService.getConversationById(selectedId);
      if (!isCurrent() || revision !== messageRevisionRef.current) return;
      if (!nearBottomRef.current && previousMessageIdsRef.current.size > 0) {
        const appendedCount = (conversation.messages || []).filter(message => !previousMessageIdsRef.current.has(String(message.id))).length;
        if (appendedCount) setVisibleMessageCount(count => count + appendedCount);
      }
      const newIncoming = (conversation.messages || []).some(message =>
        !previousMessageIdsRef.current.has(String(message.id)) && String(message.senderId) !== String(user.id));
      setActiveConversation(previous => ({
        ...conversation,
        messages: mergeMessages(conversation.messages || [], previous?.id === conversation.id ? previous.messages : []),
      }));
      setConnectionState('connected');
      previousMessageIdsRef.current = new Set((conversation.messages || []).map(message => String(message.id)));
      const canMarkRead = document.visibilityState === 'visible' && nearBottomRef.current;
      if (canMarkRead && (conversation.unreadCount > 0 || conversation.manualUnread)) await chatService.markAsRead(conversation.id, user.id);
      if (!isCurrent()) return;
      if (newIncoming && !nearBottomRef.current) setShowNewMessages(true);
      setConversations(prev => prev.map(row => String(row.id) === String(conversation.id)
        ? { ...row, ...conversation, messages: row.messages, unreadCount: canMarkRead ? 0 : conversation.unreadCount }
        : row));
    } catch (err) {
      if (!isCurrent()) return;
      if (!silent) {
        const message = err.message || 'Không thể tải cuộc trò chuyện.';
        setActiveError(message);
        toast.error(message);
      }
      else setConnectionState('reconnecting');
    } finally {
      if (isCurrent()) setActiveLoading(false);
    }
  }, [selectedId, user?.id]);

  useEffect(() => {
    activeUserIdRef.current = user?.id;
    setConversations([]);
    setActiveConversation(null);
    previousMessageIdsRef.current = new Set();
    nearBottomRef.current = true;
    setShowNewMessages(false);
    refreshList();
  }, [refreshList, user?.id]);

  useEffect(() => {
    if (realtimeConversations.length) refreshList({ silent: true });
  }, [realtimeConversations, refreshList]);

  useEffect(() => {
    refreshActive();
  }, [refreshActive]);

  useEffect(() => {
    setVisibleMessageCount(MESSAGE_BATCH_SIZE);
    prependAnchorRef.current = null;
  }, [activeConversation?.id]);

  useLayoutEffect(() => {
    const anchor = prependAnchorRef.current;
    const viewport = messagesViewportRef.current;
    if (!anchor || !viewport) return;
    viewport.scrollTop = anchor.scrollTop + (viewport.scrollHeight - anchor.scrollHeight);
    prependAnchorRef.current = null;
  }, [visibleMessageCount]);

  useLayoutEffect(() => {
    const composer = composerRef.current;
    if (!composer) return undefined;

    const root = document.documentElement;
    let frame = 0;
    const updateComposerTop = () => {
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(() => {
        root.style.setProperty('--messages-composer-top', `${composer.getBoundingClientRect().top}px`);
      });
    };
    const resizeObserver = new ResizeObserver(updateComposerTop);

    updateComposerTop();
    resizeObserver.observe(composer);
    window.addEventListener('resize', updateComposerTop, { passive: true });
    window.visualViewport?.addEventListener('resize', updateComposerTop, { passive: true });
    window.visualViewport?.addEventListener('scroll', updateComposerTop, { passive: true });

    return () => {
      window.cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      window.removeEventListener('resize', updateComposerTop);
      window.visualViewport?.removeEventListener('resize', updateComposerTop);
      window.visualViewport?.removeEventListener('scroll', updateComposerTop);
      root.style.removeProperty('--messages-composer-top');
    };
  }, [activeConversation?.id, activeLoading, assistantOpen, isMobile]);

  useEffect(() => {
    const timer = window.setInterval(async () => {
      await refreshList({ silent: true });
      if (selectedId) await refreshActive({ silent: true });
    }, POLL_INTERVAL);
    return () => window.clearInterval(timer);
  }, [refreshActive, refreshList, selectedId]);

  useEffect(() => {
    if (!nearBottomRef.current) return undefined;
    const frame = window.requestAnimationFrame(() => {
      const viewport = messagesViewportRef.current;
      if (!viewport) return;
      viewport.scrollTo({
        top: viewport.scrollHeight,
        behavior: activeLoading ? 'auto' : 'smooth',
      });
      setShowNewMessages(false);
    });
    return () => window.cancelAnimationFrame(frame);
  }, [activeConversation?.id, activeConversation?.messages?.length, activeLoading]);

  const allMessages = activeConversation?.messages || [];
  const visibleMessages = allMessages.slice(-visibleMessageCount);
  const hasOlderMessages = visibleMessageCount < allMessages.length;

  const loadOlderMessages = () => {
    const viewport = messagesViewportRef.current;
    if (!viewport || !hasOlderMessages || prependAnchorRef.current) return;
    prependAnchorRef.current = {
      scrollHeight: viewport.scrollHeight,
      scrollTop: viewport.scrollTop,
    };
    setVisibleMessageCount(count => Math.min(count + MESSAGE_BATCH_SIZE, allMessages.length));
  };

  const handleMessagesScroll = () => {
    const viewport = messagesViewportRef.current;
    if (!viewport) return;
    if (viewport.scrollTop <= 32) loadOlderMessages();
    const distance = viewport.scrollHeight - viewport.scrollTop - viewport.clientHeight;
    const wasNearBottom = nearBottomRef.current;
    nearBottomRef.current = distance < 96;
    if (!wasNearBottom && nearBottomRef.current && activeConversation?.id && document.visibilityState === 'visible') {
      chatService.markAsRead(activeConversation.id, user.id).then(() => {
        setConversations(prev => prev.map(row => String(row.id) === String(activeConversation.id)
          ? { ...row, unreadCount: 0 }
          : row));
      }).catch(() => {});
      setShowNewMessages(false);
    }
  };

  const scrollToLatest = () => {
    const viewport = messagesViewportRef.current;
    if (!viewport) return;
    viewport.scrollTo({ top: viewport.scrollHeight, behavior: 'smooth' });
    nearBottomRef.current = true;
    setShowNewMessages(false);
  };

  const filteredConversations = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    const visible = conversations.filter(row => Boolean(row.archived) === showArchived && (!unreadOnly || row.unreadCount > 0 || row.manualUnread));
    if (!normalized) return visible;
    return visible.filter(row => [
      row.recipient?.name,
      row.itemTitle,
      row.lastMessage?.text,
    ].some(value => String(value || '').toLowerCase().includes(normalized)));
  }, [conversations, query, showArchived, unreadOnly]);

  const openConversation = conversation => {
    previousMessageIdsRef.current = new Set();
    nearBottomRef.current = true;
    setShowNewMessages(false);
    setActiveConversation(null);
    setDrawerOpen(false);
    setSearchParams({ conversation: String(conversation.id) });
  };

  const closeMobileConversation = () => {
    setInfoOpen(false);
    if (desktopList) { setSidebarCollapsed(false); setDrawerOpen(false); }
    else setDrawerOpen(true);
  };

  const handleImagePick = event => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Chỉ hỗ trợ tệp hình ảnh.');
      return;
    }
    if (file.size > 3 * 1024 * 1024) {
      toast.error('Kích thước ảnh tối đa 3MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setSelectedImage(reader.result);
    reader.readAsDataURL(file);
    event.target.value = '';
  };

  const deliverMessage = async pendingMessage => {
    if (!activeConversation) return;
    const conversationId = activeConversation.id;
    try {
      const { message } = await chatService.sendMessage({
        conversationId: activeConversation.id,
        itemId: activeConversation.itemId,
        sender: user,
        recipientId: activeConversation.recipient.id,
        text: pendingMessage.text,
        image: pendingMessage.image,
        clientMessageId: pendingMessage.clientId,
        replyToId: pendingMessage.replyToId,
      });
      messageRevisionRef.current += 1;
      setActiveConversation(prev => String(prev?.id) !== String(conversationId) ? prev : ({
        ...prev,
        messages: (prev.messages || []).map(current => current.clientId === pendingMessage.clientId
          ? { ...message, clientId: pendingMessage.clientId, deliveryStatus: 'sent' }
          : current).filter((current, index, rows) => rows.findIndex(candidate => String(candidate.id) === String(current.id)) === index),
        lastMessage: message,
        lastMessageAt: message.createdAt,
      }));
      await refreshList({ silent: true });
    } catch (err) {
      const deliveryStatus = err.isUncertain ? 'uncertain' : 'failed';
      setActiveConversation(prev => String(prev?.id) !== String(conversationId) ? prev : ({
        ...prev,
        messages: (prev?.messages || []).map(current => current.clientId === pendingMessage.clientId
          ? { ...current, deliveryStatus, deliveryError: err.message || 'Không thể gửi tin nhắn.' }
          : current),
      }));
      if (err.isUncertain) setConnectionState('reconnecting');
    }
  };

  const handleSend = event => {
    event.preventDefault();
    if (!activeConversation || (!inputText.trim() && !selectedImage)) return;
    const clientId = createClientMessageId();
    const pendingMessage = {
      id: `pending-${clientId}`,
      clientId,
      senderId: user.id,
      senderName: user.name,
      senderAvatar: user.avatar || user.avatar_url,
      text: inputText.trim(),
      image: selectedImage,
      read: false,
      createdAt: new Date().toISOString(),
      deliveryStatus: 'sending',
      replyToId: replyMessage?.id || null,
    };
    setReplyMessage(null);
    nearBottomRef.current = true;
    setActiveConversation(prev => ({
      ...prev,
      messages: [...(prev.messages || []), pendingMessage],
    }));
    setInputText('');
    if (composerInputRef.current) composerInputRef.current.style.height = 'auto';
    setSelectedImage(null);
    deliverMessage(pendingMessage);
  };

  const retryMessage = message => {
    setActiveConversation(prev => ({
      ...prev,
      messages: (prev.messages || []).map(current => current.clientId === message.clientId
        ? { ...current, deliveryStatus: 'sending', deliveryError: '' }
        : current),
    }));
    deliverMessage({ ...message, deliveryStatus: 'sending', deliveryError: '' });
  };

  const handleConversationAction = async action => {
    if (!activeConversation || conversationActionBusy) return;
    const conversation = activeConversation;
    setConversationActionBusy(true);
    try {
      if (action === 'pin' || action === 'unread' || action === 'block' || action === 'report') {
        if (action === 'pin') await chatService.setPinned(conversation.id, !conversation.pinned);
        if (action === 'unread') {
          activeSequenceRef.current += 1;
          selectedIdRef.current = null;
          setSearchParams({});
          setActiveConversation(null);
          await chatService.setUnread(conversation.id, true);
        }
        if (action === 'block') await chatService.setBlocked(conversation.id, !conversation.blockedByMe);
        if (action === 'report') await chatService.reportConversation(conversation.id, reportReason.trim());
        if (action === 'unread') { setSearchParams({}); setActiveConversation(null); }
        else await refreshActive({ silent: true });
        await refreshList({ silent: true });
        setActionDialog(null);
        toast.success('Đã cập nhật cuộc trò chuyện.');
        return;
      }
      if (action === 'delete') await chatService.deleteConversation(conversation.id);
      else await chatService.setArchived(conversation.id, !conversation.archived);
      setActionDialog(null);
      setConversations(rows => action === 'delete'
        ? rows.filter(row => String(row.id) !== String(conversation.id))
        : rows.map(row => String(row.id) === String(conversation.id) ? { ...row, archived: !conversation.archived } : row));
      setSearchParams({});
      setActiveConversation(null);
      toast.success(action === 'delete' ? 'Đã xoá lịch sử phía bạn.' : conversation.archived ? 'Đã bỏ lưu trữ.' : 'Đã lưu trữ cuộc trò chuyện.');
      await refreshList({ silent: true });
    } catch (err) {
      toast.error(err.message || 'Không thể cập nhật cuộc trò chuyện.');
    } finally {
      setConversationActionBusy(false);
    }
  };

  const runMessageAction = async (action, message, targetId) => {
    if (conversationActionBusy || !activeConversation) return;
    setConversationActionBusy(true);
    setActionError('');
    try {
      if (action === 'recall') await chatService.recallMessage(activeConversation.id, message.id);
      else await chatService.forwardMessage(targetId, activeConversation.id, message.id, createClientMessageId());
      setActionDialog(null);
      await refreshActive({ silent: true });
      await refreshList({ silent: true });
      toast.success(action === 'recall' ? 'Đã thu hồi tin nhắn.' : 'Đã chuyển tiếp tin nhắn.');
    } catch (error) { setActionError(error.message || 'Thao tác thất bại.'); }
    finally { setConversationActionBusy(false); }
  };

  const isReadOnly = activeConversation?.itemStatus === 'RETURNED' || activeConversation?.itemStatus === 'CLOSED';
  const menuMessage = messageMenu && allMessages.find(row => row.id === messageMenu.message.id);
  const menuMessageAvailable = menuMessage && !menuMessage.recalledAt && (!menuMessage.deliveryStatus || menuMessage.deliveryStatus === 'sent');

  return (
    <div className={`messages-page ${selectedId ? 'messages-page--active' : ''} h-full min-h-0 overflow-hidden bg-[#F8F6F3] py-3 sm:py-4`}>
      <div className="chat-workspace flex h-full min-h-0 flex-col">
        <button type="button" onClick={() => { if (window.matchMedia('(min-width: 1024px)').matches) { setSidebarCollapsed(value => !value); setDrawerOpen(false); } else setDrawerOpen(true); }} className="chat-list-toggle mb-2 min-h-11 self-start rounded-lg border bg-white px-3 text-sm font-semibold" aria-expanded={!sidebarCollapsed || drawerOpen}>Danh sách trò chuyện</button>
        <div className={`messages-layout chat-v2-layout ${sidebarCollapsed ? 'chat-v2-collapsed' : ''} ${drawerOpen && !desktopList ? 'chat-v2-drawer-open' : ''} ${infoOpen && activeConversation ? 'chat-v2-info-open' : ''} grid min-h-0 flex-1 grid-cols-1 overflow-hidden rounded-2xl border border-[#E5DED8] bg-white shadow-sm`}>
          {drawerOpen && !desktopList && <button type="button" className="chat-v2-scrim" onClick={() => setDrawerOpen(false)} aria-label="Đóng danh sách trò chuyện" />}
          {infoOpen && activeConversation && !dockedInfo && <button type="button" className="chat-info-scrim" onClick={() => setInfoOpen(false)} aria-label="Đóng thông tin cuộc trò chuyện" />}
          <aside data-chat-sidebar role={drawerOpen ? 'dialog' : undefined} aria-modal={drawerOpen ? true : undefined} aria-label="Danh sách trò chuyện" className={`${selectedId ? 'hidden md:flex' : 'flex'} min-h-0 min-w-0 flex-col overflow-hidden border-r border-[#E5DED8] bg-white`}>
            <div className="chat-sidebar-heading flex shrink-0 items-center justify-between gap-2"><h1>Chat</h1><button type="button" className="min-h-11 px-2 text-sm" aria-label="Thu gọn danh sách trò chuyện" onClick={() => { setSidebarCollapsed(true); setDrawerOpen(false); }}><MoreVertical aria-hidden="true" /></button></div>
            <div className="shrink-0 border-b border-[#E5DED8] p-4">
              <label className="flex items-center gap-2 rounded-xl border border-[#DED7D0] bg-[#FAF8F5] px-3 py-2.5 focus-within:border-[#8F1822] focus-within:ring-2 focus-within:ring-[#8F1822]/10">
                <Search className="w-4 h-4 text-gray-400" aria-hidden="true" />
                <input
                  value={query}
                  onChange={event => setQuery(event.target.value)}
                  className="min-w-0 flex-1 bg-transparent text-sm outline-none"
                  placeholder="Tìm người hoặc vật phẩm..."
                  aria-label="Tìm cuộc trò chuyện"
                />
              </label>
              <div className="mt-3 flex gap-2" role="group" aria-label="Loại cuộc trò chuyện">
                {['Tất cả', 'Chưa đọc', 'Đã lưu trữ'].map((label, index) => (
                  <button key={label} type="button" aria-pressed={index === 2 ? showArchived : !showArchived && unreadOnly === (index === 1)} onClick={() => { setShowArchived(index === 2); setUnreadOnly(index === 1); }} className="chat-filter min-h-11 rounded-full px-3 text-sm font-semibold">{label}</button>
                ))}
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
              {loading ? (
                <LoadingSkeleton type="conversation" count={6} className="p-3" />
              ) : filteredConversations.length === 0 ? (
                <div className="p-8 text-center text-sm text-gray-500">
                  <MessageCircle className="w-10 h-10 mx-auto mb-3 text-gray-300" />
                  Chưa có cuộc trò chuyện. Mở một bài đăng và chọn nút chat để bắt đầu.
                </div>
              ) : filteredConversations.map(conversation => (
                <button
                  key={conversation.id}
                  type="button"
                  onClick={() => openConversation(conversation)}
                  className={`w-full p-4 flex gap-3 text-left border-b border-gray-100 transition-colors ${String(selectedId) === String(conversation.id) ? 'bg-red-50/80' : 'hover:bg-[#FAF8F5]'}`}
                >
                  <span className="chat-list-avatar"><Avatar name={conversation.recipient?.name} src={conversation.recipient?.avatar} size="lg" /><span className="chat-list-item"><ImageIcon aria-hidden="true" />{conversation.itemImage && <img src={conversation.itemImage} alt="" onError={event => { event.currentTarget.hidden = true; }} />}</span></span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold text-sm text-gray-900 truncate">{conversation.recipient?.name}</span>
                      <span className="text-[11px] text-gray-400 shrink-0">{conversationTime(conversation.lastMessageAt)}</span>
                    </div>
                    <p className="mt-0.5 text-xs font-medium text-[#8F1822] truncate">{conversation.itemTitle}</p>
                    <div className="mt-1 flex items-center justify-between gap-2">
                      <p className="text-xs text-gray-500 truncate">{conversation.lastMessage?.text || (conversation.lastMessage?.image ? '[Hình ảnh]' : 'Chưa có tin nhắn')}</p>
                      {conversation.pinned && <span className="text-xs text-[#8F1822]">Ghim</span>}
                      {(conversation.unreadCount > 0 || conversation.manualUnread) && (
                        <span aria-label="Chưa đọc" className="min-w-5 h-5 px-1 rounded-full bg-[#8F1822] text-white text-[10px] font-bold flex items-center justify-center">{conversation.unreadCount || '•'}</span>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </aside>

          <section className={`${selectedId ? 'flex' : 'hidden md:flex'} chat-panel min-h-0 min-w-0 flex-col overflow-hidden bg-[#FAF9F6]`}>
            {activeLoading ? (
              <LoadingSkeleton type="messages" count={6} className="flex-1" />
            ) : activeError ? (
              <div className="h-full flex flex-col items-center justify-center p-8 text-center text-gray-500" role="alert">
                <MessageCircle className="w-12 h-12 text-gray-300 mb-4" />
                <h2 className="font-bold text-gray-800">Không thể tải cuộc trò chuyện</h2>
                <p className="mt-1 max-w-sm text-sm">{activeError}</p>
                <button type="button" onClick={() => refreshActive()} className="mt-4 min-h-11 rounded-xl bg-[#8F1822] px-4 text-sm font-semibold text-white">
                  Thử tải lại
                </button>
              </div>
            ) : !activeConversation ? (
              <div className="h-full flex flex-col items-center justify-center p-8 text-center text-gray-500">
                <MessageCircle className="w-14 h-14 text-gray-300 mb-4" />
                <h2 className="font-bold text-gray-800">Chọn một cuộc trò chuyện</h2>
                <p className="mt-1 text-sm">Tin nhắn giữa hai người dùng sẽ được đồng bộ qua tài khoản UniFind.</p>
              </div>
            ) : (
              <>
                <div className={`chat-context-card ${isReadOnly ? 'chat-context-card--closed' : ''}`}>
                <header className="chat-header px-3 sm:px-5 py-2.5 sm:py-3 bg-white border-b border-[#E5DED8] flex items-center gap-2 sm:gap-3 shrink-0">
                  <button type="button" onClick={closeMobileConversation} className="w-11 h-11 -ml-2 shrink-0 rounded-lg hover:bg-gray-100 flex items-center justify-center" aria-label="Mở danh sách trò chuyện" aria-expanded={drawerOpen}>
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                  <Avatar name={activeConversation.recipient?.name} src={activeConversation.recipient?.avatar} size="md" />
                  <div className="min-w-0 flex-1">
                    <h2 className="font-bold text-sm sm:text-base text-gray-900 truncate">{activeConversation.recipient?.name}</h2>
                    <p className="text-xs text-gray-500">
                      {connectionState === 'reconnecting' ? 'Mất kết nối · đang thử lại…' : 'Trao đổi về bài đăng trên UniFind'}
                    </p>
                  </div>
                  <button type="button" className="chat-info-toggle" aria-label="Thông tin cuộc trò chuyện" aria-expanded={infoOpen} onClick={() => { setDrawerOpen(false); setInfoOpen(value => !value); }}><Info aria-hidden="true" /></button>
                  <details className="relative shrink-0">
                    <summary className="flex min-h-11 cursor-pointer items-center rounded-lg px-2 text-sm font-semibold text-[#8F1822]" aria-label="Tuỳ chọn cuộc trò chuyện"><MoreVertical className="h-5 w-5" aria-hidden="true" /></summary>
                    <div className="absolute right-0 top-full z-30 w-52 rounded-xl border border-gray-200 bg-white p-1 shadow-lg">
                      <button type="button" disabled={conversationActionBusy} onClick={() => handleConversationAction('archive')} className="min-h-11 w-full rounded-lg px-3 text-left text-sm hover:bg-gray-100 disabled:opacity-50">{activeConversation.archived ? 'Bỏ lưu trữ' : 'Lưu trữ đoạn chat'}</button>
                      <button type="button" disabled={conversationActionBusy} onClick={() => handleConversationAction('pin')} className="min-h-11 w-full px-3 text-left text-sm">{activeConversation.pinned ? 'Bỏ ghim' : 'Ghim cuộc trò chuyện'}</button>
                      <button type="button" disabled={conversationActionBusy} onClick={() => handleConversationAction('unread')} className="min-h-11 w-full px-3 text-left text-sm">Đánh dấu chưa đọc</button>
                      <button type="button" disabled={conversationActionBusy} onClick={() => { setReportReason(''); setActionDialog({ type: 'report' }); }} className="min-h-11 w-full px-3 text-left text-sm">Báo cáo</button>
                      <button type="button" disabled={conversationActionBusy} onClick={() => setActionDialog({ type: 'block' })} className="min-h-11 w-full px-3 text-left text-sm">{activeConversation.blockedByMe ? 'Bỏ chặn' : 'Chặn người dùng'}</button>
                      <button type="button" disabled={conversationActionBusy} onClick={() => setActionDialog({ type: 'delete' })} className="min-h-11 w-full rounded-lg px-3 text-left text-sm text-red-700 hover:bg-red-50 disabled:opacity-50">Xoá đoạn chat phía tôi</button>
                    </div>
                  </details>
                </header>

                <Link to={`/items/${activeConversation.itemId}`} className="chat-item-card" aria-label={`Xem bài đăng: ${activeConversation.itemTitle}`}>
                  <span className="chat-item-thumbnail">
                    <ImageIcon aria-hidden="true" />
                    {activeConversation.itemImage && <img key={activeConversation.itemImage} src={activeConversation.itemImage} alt="" onError={event => { event.currentTarget.hidden = true; }} />}
                  </span>
                  <span className="chat-item-content">
                    <span className="chat-item-caption">Bài đăng trong cuộc trò chuyện</span>
                    <strong title={activeConversation.itemTitle}>{activeConversation.itemTitle}</strong>
                    <span className="chat-item-status">{ITEM_STATUS_CONFIG[activeConversation.itemStatus]?.label || 'Chưa có trạng thái'}</span>
                  </span>
                  <span className="chat-item-link">Xem bài <span aria-hidden="true">↗</span></span>
                </Link>
                </div>

                <div className="chat-security-warning shrink-0 border-b border-amber-200 bg-amber-50 px-4 py-2 text-center text-[11px] text-amber-900">
                  Không chia sẻ OTP, mật khẩu hay chuyển tiền. Hẹn gặp nơi đông người.
                </div>

                <div ref={messagesViewportRef} onScroll={handleMessagesScroll} className="chat-messages relative min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain p-3 sm:p-5">
                  {hasOlderMessages && (
                    <button type="button" onClick={loadOlderMessages} className="mx-auto flex min-h-10 items-center rounded-full border border-[#DED7D0] bg-white px-3 text-xs font-semibold text-[#8F1822] shadow-sm">
                      Tải tin nhắn cũ hơn
                    </button>
                  )}
                  {allMessages.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-sm text-gray-400 text-center px-8">Chưa có tin nhắn trong cuộc trò chuyện này.</div>
                  ) : visibleMessages.map((message, index) => {
                    const isMe = String(message.senderId) === String(user.id);
                    const day = new Date(message.createdAt).toLocaleDateString('vi-VN');
                    const showDay = index === 0 || day !== new Date(visibleMessages[index - 1].createdAt).toLocaleDateString('vi-VN');
                    return (
                      <div key={message.clientId || message.id} className="chat-message-group">
                      {showDay && <div className="chat-date-separator"><span>{day}</span></div>}
                      <div className={`chat-message-row ${isMe ? 'chat-message-row--sent' : ''}`}>
                        <button type="button" className="chat-message-trigger" aria-label="Thao tác tin nhắn" aria-haspopup="menu" aria-expanded={messageMenu?.message.id === message.id} aria-controls={messageMenu?.message.id === message.id ? 'chat-message-menu' : undefined} onClick={event => {
                          const trigger = event.currentTarget;
                          document.querySelector('.chat-header details[open]')?.removeAttribute('open');
                          setMessageMenu(current => current?.message.id === message.id ? null : { message, trigger });
                        }}><MoreVertical size={20} aria-hidden="true" /></button>
                        <div className="chat-message-content">
                        <div className={`chat-message-bubble rounded-2xl px-3.5 py-2.5 shadow-sm ${isMe ? 'bg-[#8F1822] text-white rounded-br-sm' : 'bg-white text-gray-800 border border-gray-200 rounded-bl-sm'}`}>
                          {message.replyToId && <p className="mb-2 border-l-2 pl-2 text-xs opacity-80">Trả lời: {allMessages.find(row => String(row.id) === String(message.replyToId))?.text || 'Tin nhắn đính kèm'}</p>}
                          {message.recalledAt ? <p className="text-sm italic opacity-80">Tin nhắn đã thu hồi</p> : <>
                            {message.text && <p className="chat-user-content text-sm">{message.text}</p>}
                            {message.image && <button type="button" className="block max-w-full" onClick={() => setActionDialog({ type: 'image', message })} aria-label="Phóng to ảnh đính kèm"><img onLoad={() => { if (nearBottomRef.current) scrollToLatest(); }} src={message.image} alt="Ảnh đính kèm" className="mt-2 h-auto max-h-64 max-w-full rounded-xl object-contain" /></button>}
                          </>}
                        </div>
                          <div className="chat-message-meta mt-1 flex items-center justify-end gap-1 text-[11px] text-gray-500">
                            <span>{messageTime(message.createdAt)}</span>
                            {isMe && message.deliveryStatus === 'sending' && <><Loader2 className="h-3 w-3 animate-spin motion-reduce:animate-none" aria-hidden="true" /><span>Đang gửi</span></>}
                            {isMe && message.deliveryStatus === 'failed' && <span className="font-semibold text-amber-200">Gửi lỗi</span>}
                            {isMe && message.deliveryStatus === 'uncertain' && <span className="font-semibold text-amber-200">Đang xác minh</span>}
                            {isMe && (!message.deliveryStatus || message.deliveryStatus === 'sent') && (message.read
                              ? <><CheckCheck className="w-3 h-3 text-[#8F1822]" aria-hidden="true" /><span>Đã xem</span></>
                              : <><Check className="w-3 h-3" aria-hidden="true" /><span>Đã gửi</span></>)}
                          </div>
                          {message.deliveryStatus === 'failed' && (
                            <button type="button" onClick={() => retryMessage(message)} className="mt-2 text-xs font-semibold underline underline-offset-2">
                              Thử gửi lại
                            </button>
                          )}
                          {message.deliveryStatus === 'uncertain' && <p className="mt-2 text-[11px] text-gray-600">Không tự gửi lại để tránh trùng tin.</p>}
                        </div>

                      </div>
                      </div>
                    );
                  })}
                  {showNewMessages && (
                    <button type="button" onClick={scrollToLatest} className="sticky bottom-2 left-1/2 -translate-x-1/2 inline-flex items-center gap-2 rounded-full bg-[#8F1822] px-3.5 py-2 text-xs font-semibold text-white shadow-lg">
                      <ArrowDown className="w-4 h-4" /> Tin nhắn mới
                    </button>
                  )}
                </div>

                {selectedImage && (
                  <div className="px-3 sm:px-4 py-2 bg-white border-t flex min-w-0 items-center gap-3 shrink-0">
                    <img src={selectedImage} alt="Ảnh chuẩn bị gửi" className="w-12 h-12 object-cover rounded-lg" />
                    <span className="min-w-0 text-xs text-gray-500 flex-1 break-words">Ảnh đã sẵn sàng gửi</span>
                    <button type="button" onClick={() => setSelectedImage(null)} className="p-2" aria-label="Bỏ ảnh"><X className="w-4 h-4" /></button>
                  </div>
                )}

                {/* FRONTEND UI ONLY: suggestions fill the draft; never send automatically. */}
                {!isReadOnly && !activeConversation.blocked && <div className="chat-quick-replies" aria-label="Gợi ý trả lời">{['Vật phẩm này còn không bạn?', 'Mình có thể nhận lại ở đâu?', 'Cảm ơn bạn đã giúp đỡ!'].map(text => <button key={text} type="button" onClick={() => { setInputText(text); composerInputRef.current?.focus(); }}>{text}</button>)}</div>}
                <footer
                  ref={composerRef}
                  data-main-chat-composer
                  className={`${assistantOpen && isMobile ? 'hidden' : 'block'} chat-composer shrink-0 border-t border-[#E5DED8] bg-white px-2.5 pb-[max(0.625rem,env(safe-area-inset-bottom))] pt-2 sm:p-3`}
                >
                  {replyMessage && <div className="mb-2 flex items-center gap-2 rounded-lg border p-2 text-sm"><p className="min-w-0 flex-1 break-words">Trả lời: {replyMessage.text || 'Hình ảnh'}</p><button type="button" className="min-h-11 px-2" onClick={() => setReplyMessage(null)} aria-label="Huỷ trả lời"><X className="h-4 w-4" /></button></div>}
                  {isReadOnly || activeConversation.blocked ? (
                    <div className="rounded-xl bg-gray-100 p-3 text-center text-xs font-medium text-gray-500">
                      {activeConversation.blocked ? 'Cuộc trò chuyện đang bị chặn.' : 'Vật phẩm đã đóng hoặc trao trả; cuộc trò chuyện ở chế độ chỉ đọc.'}
                    </div>
                  ) : (
                    <>
                      <p className="chat-typing-status text-[11px] text-gray-500" aria-live="polite">
                        {inputText.trim() ? 'Bạn đang nhập…' : ''}
                      </p>
                      <form onSubmit={handleSend} className="flex min-w-0 items-end gap-1.5 sm:gap-2">
                        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImagePick} />
                        <button type="button" onClick={() => fileInputRef.current?.click()} className="w-11 h-11 shrink-0 rounded-xl flex items-center justify-center text-gray-500 hover:text-[#8F1822] hover:bg-red-50" aria-label="Đính kèm ảnh">
                          <ImageIcon className="w-5 h-5" /><span>Hình ảnh</span>
                        </button>
                        <textarea
                          ref={composerInputRef}
                          value={inputText}
                          onChange={event => {
                            setInputText(event.target.value);
                            event.currentTarget.style.height = 'auto';
                            event.currentTarget.style.height = `${Math.min(event.currentTarget.scrollHeight, 112)}px`;
                          }}
                          onKeyDown={event => {
                            if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
                              event.preventDefault();
                              handleSend(event);
                            }
                          }}
                          rows={1}
                          maxLength={2000}
                          className="min-w-0 min-h-11 max-h-28 flex-1 resize-none overflow-y-auto rounded-xl border border-gray-200 bg-gray-50 px-3 sm:px-3.5 py-3 text-sm outline-none focus:border-[#8F1822] focus:ring-2 focus:ring-[#8F1822]/10"
                          placeholder="Nhập tin nhắn..."
                          aria-label="Nội dung tin nhắn. Nhấn Enter để gửi, Shift và Enter để xuống dòng"
                        />
                        <button type="submit" disabled={!inputText.trim() && !selectedImage} className="w-11 h-11 shrink-0 rounded-xl bg-[#8F1822] text-white flex items-center justify-center disabled:opacity-40" aria-label="Gửi tin nhắn">
                          <Send className="w-4 h-4" />
                        </button>
                      </form>
                    </>
                  )}
                </footer>
              </>
            )}
          </section>
          {infoOpen && activeConversation && <aside data-chat-info role={dockedInfo ? undefined : 'dialog'} aria-modal={dockedInfo ? undefined : true} aria-label="Thông tin cuộc trò chuyện" className="chat-info-panel">
            <div className="chat-info-heading"><h2>Thông tin cuộc trò chuyện</h2><button type="button" aria-label="Đóng thông tin" onClick={() => setInfoOpen(false)}><X aria-hidden="true" /></button></div>
            <div className="chat-info-profile"><Avatar name={activeConversation.recipient?.name} src={activeConversation.recipient?.avatar} size="lg" /><h3>{activeConversation.recipient?.name}</h3><p>Người tham gia cuộc trò chuyện</p></div>
            <div className="chat-info-section"><h3>Hình ảnh đã chia sẻ</h3>{allMessages.some(message => message.image && !message.recalledAt) ? <div className="chat-info-media">{allMessages.filter(message => message.image && !message.recalledAt).map(message => <button key={message.id} type="button" aria-label="Phóng to ảnh đã chia sẻ" onClick={() => setActionDialog({ type: 'image', message })}><img src={message.image} alt="Ảnh đã chia sẻ" /></button>)}</div> : <p>Chưa có hình ảnh được chia sẻ.</p>}</div>
            <div className="chat-info-section"><h3>Bài đăng liên quan</h3><Link to={`/items/${activeConversation.itemId}`} className="chat-item-card"><span className="chat-item-thumbnail"><ImageIcon aria-hidden="true" />{activeConversation.itemImage && <img src={activeConversation.itemImage} alt="" onError={event => { event.currentTarget.hidden = true; }} />}</span><span className="chat-item-content"><strong>{activeConversation.itemTitle}</strong><span className="chat-item-status">{ITEM_STATUS_CONFIG[activeConversation.itemStatus]?.label || 'Chưa có trạng thái'}</span></span><span className="chat-item-link">Xem bài ↗</span></Link></div>
            <div className="chat-info-actions"><button type="button" disabled={conversationActionBusy} onClick={() => { setReportReason(''); setActionDialog({ type: 'report' }); }}>Báo cáo cuộc trò chuyện</button><button type="button" disabled={conversationActionBusy} onClick={() => setActionDialog({ type: 'block' })}>{activeConversation.blockedByMe ? 'Bỏ chặn người dùng' : 'Chặn người dùng'}</button><button type="button" disabled={conversationActionBusy} onClick={() => handleConversationAction('archive')}>{activeConversation.archived ? 'Bỏ lưu trữ cuộc trò chuyện' : 'Ẩn cuộc trò chuyện (lưu trữ)'}</button></div>
          </aside>}
        </div>
      </div>
      {messageMenu && createPortal(
        <div ref={messageMenuRef} id="chat-message-menu" className="chat-message-menu" role="menu" aria-label="Thao tác tin nhắn">
          <button type="button" role="menuitem" disabled={!menuMessageAvailable || isReadOnly || activeConversation?.blocked || conversationActionBusy} onClick={() => { closeMessageMenu(); setReplyMessage(menuMessage); composerInputRef.current?.focus(); }}><Reply aria-hidden="true" />Trả lời</button>
          <button type="button" role="menuitem" disabled={!menuMessageAvailable || !menuMessage?.text || conversationActionBusy} onClick={async () => { closeMessageMenu(true); try { await navigator.clipboard.writeText(menuMessage.text); toast.success('Đã sao chép tin nhắn.'); } catch { toast.error('Không thể sao chép. Vui lòng kiểm tra quyền clipboard.'); } }}><Copy aria-hidden="true" />Sao chép</button>
          <button type="button" role="menuitem" disabled={!menuMessageAvailable || conversationActionBusy || !conversations.some(row => !row.blocked && !['CLOSED', 'RETURNED'].includes(row.itemStatus))} onClick={() => { closeMessageMenu(true); setActionError(''); setActionDialog({ type: 'forward', message: menuMessage }); }}><Forward aria-hidden="true" />Chuyển tiếp</button>
          <button type="button" role="menuitem" className="chat-menu-recall" disabled={!menuMessageAvailable || String(menuMessage?.senderId) !== String(user.id) || conversationActionBusy} onClick={() => { closeMessageMenu(true); setActionError(''); setActionDialog({ type: 'recall', message: menuMessage }); }}><Undo2 aria-hidden="true" />Thu hồi</button>
        </div>, document.body)}
      {createPortal(<Modal isOpen={Boolean(actionDialog)} onClose={() => setActionDialog(null)} closeDisabled={conversationActionBusy} title={{ forward: 'Chuyển tiếp tin nhắn', recall: 'Thu hồi tin nhắn', report: 'Báo cáo cuộc trò chuyện', block: activeConversation?.blockedByMe ? 'Bỏ chặn người dùng' : 'Chặn người dùng', delete: 'Xoá lịch sử phía bạn' }[actionDialog?.type] || 'Xác nhận'}>
                          <div data-chat-dialog>
                            {actionDialog?.type === 'image' && <img src={actionDialog.message.image} alt="Ảnh đính kèm phóng to" className="max-h-[70dvh] w-full object-contain" />}
                            {actionError && <p role="alert" className="mb-3 text-sm text-red-700">{actionError}</p>}
                            {actionDialog?.type === 'forward' ? <div className="space-y-2">{conversations.filter(row => !row.blocked && row.itemStatus !== 'CLOSED' && row.itemStatus !== 'RETURNED').map(row => <button key={row.id} type="button" disabled={conversationActionBusy} className="min-h-11 w-full rounded-lg border p-3 text-left text-sm disabled:opacity-50" onClick={() => runMessageAction('forward', actionDialog.message, row.id)}>{row.recipient?.name} · {row.itemTitle}</button>)}</div> : <>
                              {actionDialog?.type !== 'image' && <p className="mb-3 text-sm">{actionDialog?.type === 'delete' ? 'Chỉ xoá lịch sử phía bạn. Người còn lại vẫn giữ bản của họ. Không thể khôi phục.' : actionDialog?.type === 'recall' ? 'Nội dung tin nhắn sẽ được thu hồi với cả hai người.' : 'Xác nhận thao tác với cuộc trò chuyện này.'}</p>}
                              {actionDialog?.type === 'report' && <label className="block text-sm">Lý do báo cáo<textarea value={reportReason} onChange={event => setReportReason(event.target.value)} maxLength={2000} className="mt-2 min-h-28 w-full rounded-lg border p-3" /></label>}
                              {actionDialog?.type !== 'image' && <button type="button" disabled={conversationActionBusy || (actionDialog?.type === 'report' && !reportReason.trim())} onClick={() => actionDialog?.type === 'recall' ? runMessageAction('recall', actionDialog.message) : handleConversationAction(actionDialog.type)} className="mt-3 min-h-11 rounded-lg bg-[#8F1822] px-4 text-sm font-semibold text-white disabled:opacity-50">{conversationActionBusy ? 'Đang xử lý…' : 'Xác nhận'}</button>}
                            </>}
                          </div>
                        </Modal>, document.body)}
    </div>
  );
}
