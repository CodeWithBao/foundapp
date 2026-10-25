import { apiClient, withFallback } from './apiClient';
import storageService from './storageService';

const REPORT_STORAGE_KEY = 'unifind_reports';

const delay = (ms = 200) => new Promise(resolve => setTimeout(resolve, ms));

const reportService = {
  // User creates a report
  async createReport({ postId, reason, description }) {
    return withFallback(
      async () => {
        return await apiClient.post('/reports', {
          post_id: Number(postId),
          reason,
          description,
        });
      },
      async () => {
        await delay();
        const user = storageService.get('unifind_user') || { id: 99, name: 'Người dùng' };
        const reports = storageService.get(REPORT_STORAGE_KEY) || [];
        
        // Check if user already reported this post
        const existing = reports.find(r => String(r.post_id || r.postId) === String(postId) && String(r.reporter_id || r.reporterId) === String(user.id));
        if (existing) {
          throw new Error('Bạn đã báo cáo bài đăng này rồi');
        }

        // Get post details for mock display
        const items = storageService.get('unifind_items') || [];
        const item = items.find(i => String(i.id) === String(postId)) || null;

        const newReport = {
          id: Date.now(),
          post_id: Number(postId),
          reporter_id: user.id,
          reason,
          description,
          status: 'PENDING',
          admin_note: '',
          created_at: new Date().toISOString(),
          item,
          reporter: user,
          post_total_reports: reports.filter(r => String(r.post_id || r.postId) === String(postId)).length + 1
        };

        reports.unshift(newReport);
        storageService.set(REPORT_STORAGE_KEY, reports);
        return newReport;
      }
    );
  },

  // Admin gets all reports
  async getAdminReports(filters = {}) {
    return withFallback(
      async () => {
        const queryParams = new URLSearchParams();
        if (filters.status && filters.status !== 'all') queryParams.append('status', filters.status);
        if (filters.reason && filters.reason !== 'all') queryParams.append('reason', filters.reason);
        if (filters.page) queryParams.append('page', filters.page);
        if (filters.limit) queryParams.append('limit', filters.limit);

        const qs = queryParams.toString();
        const res = await apiClient.get(`/admin/reports${qs ? '?' + qs : ''}`);
        return res;
      },
      async () => {
        await delay();
        let reports = storageService.get(REPORT_STORAGE_KEY) || [];
        const items = storageService.get('unifind_items') || [];
        const users = storageService.get('unifind_users') || [];

        // Enrich items & reporters
        reports = reports.map(r => {
          const item = items.find(i => String(i.id) === String(r.post_id || r.postId)) || r.item || null;
          const reporter = users.find(u => String(u.id) === String(r.reporter_id || r.reporterId)) || r.reporter || { name: 'Vô danh' };
          const postTotal = reports.filter(sub => String(sub.post_id || sub.postId) === String(r.post_id || r.postId)).length;
          return {
            ...r,
            item,
            reporter,
            post_total_reports: postTotal
          };
        });

        if (filters.status && filters.status !== 'all') {
          reports = reports.filter(r => r.status === filters.status);
        }
        if (filters.reason && filters.reason !== 'all') {
          reports = reports.filter(r => r.reason === filters.reason);
        }

        return {
          reports,
          total: reports.length,
          page: filters.page || 1,
          limit: filters.limit || 20,
        };
      }
    );
  },

  // Admin updates report status
  async updateReportStatus(reportId, status, adminNote = '') {
    return withFallback(
      async () => {
        return await apiClient.put(`/admin/reports/${reportId}/status`, {
          status,
          admin_note: adminNote,
        });
      },
      async () => {
        await delay();
        const reports = storageService.get(REPORT_STORAGE_KEY) || [];
        const idx = reports.findIndex(r => String(r.id) === String(reportId));
        if (idx !== -1) {
          reports[idx].status = status;
          reports[idx].admin_note = adminNote;
          reports[idx].handled_at = new Date().toISOString();
          storageService.set(REPORT_STORAGE_KEY, reports);
        }
        return { success: true };
      }
    );
  },

  // Admin hides/unhides post
  async toggleHidePost(reportId, isHidden, reason = '') {
    return withFallback(
      async () => {
        return await apiClient.put(`/admin/reports/${reportId}/hide`, {
          is_hidden: isHidden,
          reason,
        });
      },
      async () => {
        await delay();
        const reports = storageService.get(REPORT_STORAGE_KEY) || [];
        const repIdx = reports.findIndex(r => String(r.id) === String(reportId));
        if (repIdx !== -1) {
          reports[repIdx].status = 'RESOLVED';
          reports[repIdx].admin_note = isHidden ? `Đã ẩn bài đăng: ${reason}` : 'Đã khôi phục bài đăng';
          reports[repIdx].handled_at = new Date().toISOString();
          storageService.set(REPORT_STORAGE_KEY, reports);

          const items = storageService.get('unifind_items') || [];
          const itemIdx = items.findIndex(i => String(i.id) === String(reports[repIdx].post_id || reports[repIdx].postId));
          if (itemIdx !== -1) {
            items[itemIdx].is_hidden = isHidden;
            items[itemIdx].isHidden = isHidden;
            storageService.set('unifind_items', items);
          }
        }
        return { success: true };
      }
    );
  },

  // Admin deletes post
  async deletePost(reportId) {
    return withFallback(
      async () => {
        return await apiClient.delete(`/admin/reports/${reportId}/post`);
      },
      async () => {
        await delay();
        const reports = storageService.get(REPORT_STORAGE_KEY) || [];
        const repIdx = reports.findIndex(r => String(r.id) === String(reportId));
        if (repIdx !== -1) {
          const postId = reports[repIdx].post_id || reports[repIdx].postId;
          reports[repIdx].status = 'RESOLVED';
          reports[repIdx].admin_note = 'Đã xóa bài đăng vi phạm';
          reports[repIdx].handled_at = new Date().toISOString();
          storageService.set(REPORT_STORAGE_KEY, reports);

          const items = storageService.get('unifind_items') || [];
          const filteredItems = items.filter(i => String(i.id) !== String(postId));
          storageService.set('unifind_items', filteredItems);
        }
        return { success: true };
      }
    );
  }
};

export default reportService;
