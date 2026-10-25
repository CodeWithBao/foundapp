import storageService from './storageService';

const STORAGE_KEY = 'unifind_support_tickets';

const INITIAL_MOCK_TICKETS = [
  {
    id: 'TK-842109',
    userId: 2,
    userName: 'Nguyễn Văn An',
    userEmail: 'an.nv@dntu.edu.vn',
    userRole: 'user',
    topic: 'Xác minh nhận đồ',
    status: 'OPEN',
    unreadByStaff: true,
    unreadByAdmin: true,
    unreadByUser: false,
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
    messages: [
      {
        id: 1,
        sender: 'user',
        senderName: 'Nguyễn Văn An',
        text: 'Chào ban quản trị, em cần hỗ trợ xác minh nhận lại CCCD và thẻ SV làm rơi ở sảnh tòa G chiều hôm qua ạ.',
        time: new Date(Date.now() - 3600000 * 2).toISOString(),
      },
      {
        id: 2,
        sender: 'system',
        senderName: 'Cú DNTU Bot',
        text: 'Ticket đã được tạo và chuyển tới chuyên viên trực hỗ trợ DNTU.',
        time: new Date(Date.now() - 3600000 * 2 + 1000).toISOString(),
      },
      {
        id: 3,
        sender: 'user',
        senderName: 'Nguyễn Văn An',
        text: 'Mã số sinh viên của em là 21100234, em đã gửi giấy tờ minh chứng trong claim #CLM-01.',
        time: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
      },
    ],
  },
  {
    id: 'TK-761234',
    userId: 3,
    userName: 'Trần Thị Mai',
    userEmail: 'mai.tt@dntu.edu.vn',
    userRole: 'user',
    topic: 'Khiếu nại hồ sơ thất lạc',
    status: 'IN_PROGRESS',
    unreadByStaff: false,
    unreadByAdmin: false,
    unreadByUser: false,
    createdAt: new Date(Date.now() - 3600000 * 8).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 1).toISOString(),
    messages: [
      {
        id: 1,
        sender: 'user',
        senderName: 'Trần Thị Mai',
        text: 'Em muốn khiếu nại về yêu cầu nhận tai nghe Sony WH-1000XM4 bị từ chối ạ.',
        time: new Date(Date.now() - 3600000 * 8).toISOString(),
      },
      {
        id: 2,
        sender: 'staff',
        senderName: 'Nhân viên trực DNTU',
        text: 'Chào Mai, nhân viên đang rà soát lại số seri và ảnh chụp bạn đính kèm, sẽ phản hồi trong 30 phút nữa nhé.',
        time: new Date(Date.now() - 3600000 * 1).toISOString(),
      },
    ],
  },
];

const dispatchTicketUpdate = (ticketId, action = 'update') => {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('unifind:tickets_updated', {
        detail: { ticketId, action, timestamp: Date.now() },
      })
    );
  }
};

const ticketService = {
  // Lấy tất cả tickets
  getTickets(filters = {}) {
    let tickets = storageService.get(STORAGE_KEY);
    if (!tickets || !Array.isArray(tickets)) {
      tickets = INITIAL_MOCK_TICKETS;
      storageService.set(STORAGE_KEY, tickets);
    }

    let result = [...tickets];

    if (filters.status && filters.status !== 'all') {
      result = result.filter((t) => t.status === filters.status);
    }

    if (filters.search && filters.search.trim()) {
      const q = filters.search.toLowerCase().trim();
      result = result.filter(
        (t) =>
          t.id.toLowerCase().includes(q) ||
          (t.userName && t.userName.toLowerCase().includes(q)) ||
          (t.userEmail && t.userEmail.toLowerCase().includes(q)) ||
          (t.topic && t.topic.toLowerCase().includes(q)) ||
          (t.messages && t.messages.some((m) => m.text && m.text.toLowerCase().includes(q)))
      );
    }

    // Sắp xếp cập nhật mới nhất lên đầu
    result.sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt));

    return result;
  },

  // Lấy chi tiết ticket theo ID
  getTicketById(ticketId) {
    if (!ticketId) return null;
    const tickets = this.getTickets();
    return tickets.find((t) => String(t.id) === String(ticketId)) || null;
  },

  // Lấy ticket đang mở của user hiện tại
  getUserActiveTicket(userId) {
    const tickets = this.getTickets();
    return tickets.find(
      (t) =>
        String(t.userId) === String(userId) &&
        (t.status === 'OPEN' || t.status === 'IN_PROGRESS')
    ) || null;
  },

  // Tự động tạo ticket mới cho user khi yêu cầu chat nhân viên
  createTicket({ userId, userName, userEmail, userRole, topic, initialMessage }) {
    const tickets = this.getTickets();
    const newId = `TK-${Math.floor(100000 + Math.random() * 900000)}`;
    const now = new Date().toISOString();

    const messages = [
      {
        id: 1,
        sender: 'system',
        senderName: 'Cú DNTU Bot',
        text: `Đã kết nối phiên hỗ trợ trực tiếp. Chủ đề: "${topic || 'Hỗ trợ chung'}" (Mã Ticket #${newId}).`,
        time: now,
      },
    ];

    if (initialMessage && initialMessage.trim()) {
      messages.push({
        id: 2,
        sender: 'user',
        senderName: userName || 'Sinh viên',
        text: initialMessage.trim(),
        time: now,
      });
    }

    const newTicket = {
      id: newId,
      userId: userId || 'guest',
      userName: userName || 'Sinh viên DNTU',
      userEmail: userEmail || 'student@dntu.edu.vn',
      userRole: userRole || 'user',
      topic: topic || 'Hỗ trợ trực tiếp từ nhân viên',
      status: 'OPEN',
      unreadByStaff: true,
      unreadByAdmin: true,
      unreadByUser: false,
      createdAt: now,
      updatedAt: now,
      messages,
    };

    tickets.unshift(newTicket);
    storageService.set(STORAGE_KEY, tickets);
    dispatchTicketUpdate(newId, 'create');
    return newTicket;
  },

  // Gửi tin nhắn vào ticket (từ User hoặc Admin)
  addMessage(ticketId, { sender = 'user', senderName = 'Người dùng', text = '' }) {
    if (!ticketId || !text.trim()) return null;
    const tickets = this.getTickets();
    const index = tickets.findIndex((t) => String(t.id) === String(ticketId));
    if (index === -1) return null;

    const now = new Date().toISOString();
    const target = { ...tickets[index] };

    const newMsg = {
      id: Date.now(),
      sender, // 'user' | 'admin' | 'staff' | 'system'
      senderName,
      text: text.trim(),
      time: now,
    };

    target.messages = [...(target.messages || []), newMsg];
    target.updatedAt = now;

    // Đánh dấu cờ chưa đọc
    if (sender === 'user') {
      target.unreadByStaff = true;
      target.unreadByAdmin = true;
      target.unreadByUser = false;
    } else if (sender === 'admin' || sender === 'staff') {
      target.unreadByStaff = false;
      target.unreadByAdmin = false;
      target.unreadByUser = true;
      if (target.status === 'OPEN') {
        target.status = 'IN_PROGRESS';
      }
    }

    tickets[index] = target;
    storageService.set(STORAGE_KEY, tickets);
    dispatchTicketUpdate(ticketId, 'new_message');
    return target;
  },

  // Đổi trạng thái ticket (OPEN | IN_PROGRESS | RESOLVED | CLOSED)
  updateStatus(ticketId, newStatus) {
    const tickets = this.getTickets();
    const index = tickets.findIndex((t) => String(t.id) === String(ticketId));
    if (index === -1) return null;

    const now = new Date().toISOString();
    tickets[index] = {
      ...tickets[index],
      status: newStatus,
      updatedAt: now,
    };

    // Thêm tin nhắn hệ thống ghi nhận đổi trạng thái
    const statusText =
      newStatus === 'RESOLVED'
        ? 'Vấn đề đã được nhân viên đánh dấu Đã giải quyết.'
        : newStatus === 'CLOSED'
        ? 'Phiên hỗ trợ đã đóng.'
        : `Trạng thái ticket chuyển thành: ${newStatus}`;

    tickets[index].messages = [
      ...(tickets[index].messages || []),
      {
        id: Date.now(),
        sender: 'system',
        senderName: 'Hệ thống UniFind',
        text: statusText,
        time: now,
      },
    ];

    storageService.set(STORAGE_KEY, tickets);
    dispatchTicketUpdate(ticketId, 'status_change');
    return tickets[index];
  },

  // Đánh dấu đã đọc
  markAsRead(ticketId, viewer = 'staff') {
    const tickets = this.getTickets();
    const index = tickets.findIndex((t) => String(t.id) === String(ticketId));
    if (index === -1) return;

    if (viewer === 'admin' || viewer === 'staff') {
      tickets[index].unreadByStaff = false;
      tickets[index].unreadByAdmin = false;
    } else {
      tickets[index].unreadByUser = false;
    }

    storageService.set(STORAGE_KEY, tickets);
    dispatchTicketUpdate(ticketId, 'mark_read');
  },

  // Đếm ticket chưa đọc cho staff badge
  getUnreadCountForStaff() {
    const tickets = this.getTickets();
    return tickets.filter((t) => (t.unreadByStaff ?? t.unreadByAdmin) && t.status !== 'CLOSED').length;
  },

  // Đếm ticket chưa đọc cho admin badge (tương thích ngược)
  getUnreadCountForAdmin() {
    return this.getUnreadCountForStaff();
  },

  // Lắng nghe thay đổi realtime
  subscribe(callback) {
    if (typeof window === 'undefined') return () => {};

    const handleCustomEvent = (e) => {
      callback(e.detail);
    };

    const handleStorage = (e) => {
      if (e.key === STORAGE_KEY) {
        callback({ action: 'storage_sync', timestamp: Date.now() });
      }
    };

    window.addEventListener('unifind:tickets_updated', handleCustomEvent);
    window.addEventListener('storage', handleStorage);

    return () => {
      window.removeEventListener('unifind:tickets_updated', handleCustomEvent);
      window.removeEventListener('storage', handleStorage);
    };
  },
};

export default ticketService;
