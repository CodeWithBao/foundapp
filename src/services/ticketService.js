import apiClient from './apiClient';

const notify = (ticketId, action) => window.dispatchEvent(new CustomEvent('unifind:tickets_updated', { detail: { ticketId, action } }));
const path = id => `/tickets/${encodeURIComponent(id)}`;
const ticketService = {
  async getTickets(filters = {}) {
    const tickets = await apiClient.get('/tickets');
    const q = filters.search?.trim().toLowerCase();
    return tickets.filter(t => (!filters.status || filters.status === 'all' || t.status === filters.status)
      && (!q || [t.id, t.userName, t.userEmail, t.topic, ...t.messages.map(m => m.text)].some(v => v?.toLowerCase().includes(q))));
  },
  getTicketById(id) { return apiClient.get(path(id)); },
  async getUserActiveTicket(userId) {
    const tickets = await this.getTickets();
    return tickets.find(t => String(t.userId) === String(userId) && ['OPEN', 'IN_PROGRESS'].includes(t.status)) || null;
  },
  async createTicket({ topic, initialMessage }) {
    const ticket = await apiClient.post('/tickets', { topic, initialMessage });
    notify(ticket.id, 'create');
    return ticket;
  },
  async addMessage(id, { text }) {
    const ticket = await apiClient.post(`${path(id)}/messages`, { text });
    notify(id, 'new_message');
    return ticket;
  },
  async updateStatus(id, status) {
    const ticket = await apiClient.put(`${path(id)}/status`, { status });
    notify(id, 'status');
    return ticket;
  },
  async markAsRead(id) { await apiClient.put(`${path(id)}/read`, {}); },
  async getUnreadCountForStaff() { return (await this.getTickets()).filter(t => t.unreadByStaff).length; },
  async getUnreadCountForAdmin() { return (await this.getTickets()).filter(t => t.unreadByAdmin).length; },
  subscribe(callback) {
    const listener = event => callback(event.detail);
    window.addEventListener('unifind:tickets_updated', listener);
    const timer = setInterval(() => callback({ action: 'poll' }), 15000);
    return () => { window.removeEventListener('unifind:tickets_updated', listener); clearInterval(timer); };
  },
};
export default ticketService;
