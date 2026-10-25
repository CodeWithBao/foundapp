import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Flag, Search, Filter, Eye, CheckCircle2, XCircle, EyeOff, Trash2, RotateCcw,
  Clock, AlertTriangle, MessageSquare, User, Tag, ExternalLink
} from 'lucide-react';
import reportService from '../../services/reportService';
import Button from '../../components/common/Button';
import Select from '../../components/common/Select';
import { Modal, ConfirmModal } from '../../components/common/Modal';
import Pagination from '../../components/common/Pagination';
import EmptyState from '../../components/common/EmptyState';
import Textarea from '../../components/common/Textarea';
import { toast } from 'sonner';
import { formatDate } from '../../utils';

const STATUS_OPTIONS = [
  { value: 'all', label: 'Tất cả trạng thái' },
  { value: 'PENDING', label: 'Chờ xử lý' },
  { value: 'REVIEWING', label: 'Đang xem xét' },
  { value: 'RESOLVED', label: 'Đã xử lý' },
  { value: 'REJECTED', label: 'Đã từ chối' },
];

const REASON_OPTIONS = [
  { value: 'all', label: 'Tất cả lý do' },
  { value: 'Nội dung sai sự thật', label: 'Nội dung sai sự thật' },
  { value: 'Nội dung không phù hợp', label: 'Nội dung không phù hợp' },
  { value: 'Bài đăng trùng lặp', label: 'Bài đăng trùng lặp' },
  { value: 'Có dấu hiệu lừa đảo', label: 'Có dấu hiệu lừa đảo' },
  { value: 'Spam', label: 'Spam' },
  { value: 'Lý do khác', label: 'Lý do khác' },
];

const TIME_FILTER_OPTIONS = [
  { value: 'all', label: 'Tất cả thời gian' },
  { value: 'today', label: 'Hôm nay' },
  { value: 'week', label: '7 ngày qua' },
  { value: 'month', label: '30 ngày qua' },
];

export default function AdminReports() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [reasonFilter, setReasonFilter] = useState('all');
  const [timeFilter, setTimeFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const perPage = 10;

  // Modals state
  const [detailReport, setDetailReport] = useState(null);
  const [actionModal, setActionModal] = useState(null); // { type: 'NOTE'|'HIDE'|'DELETE'|'REJECT'|'REVIEWING', report }
  const [actionNote, setActionNote] = useState('');
  const [deleteConfirmReport, setDeleteConfirmReport] = useState(null);

  useEffect(() => {
    loadReports();
  }, [statusFilter, reasonFilter]);

  const loadReports = async () => {
    setLoading(true);
    try {
      const res = await reportService.getAdminReports({
        status: statusFilter,
        reason: reasonFilter,
      });
      setReports(res.reports || []);
    } catch (err) {
      toast.error(err.message || 'Không thể tải danh sách báo cáo');
    } finally {
      setLoading(false);
    }
  };

  const filteredReports = useMemo(() => {
    return reports.filter((r) => {
      const itemTitle = r.item?.title || r.item?.name || '';
      const reporterName = r.reporter?.name || '';
      const s = search.toLowerCase();
      const matchesSearch =
        !search ||
        itemTitle.toLowerCase().includes(s) ||
        reporterName.toLowerCase().includes(s) ||
        String(r.post_id || r.postId).includes(s) ||
        String(r.id).includes(s);

      let matchesTime = true;
      if (timeFilter !== 'all' && r.created_at) {
        const createdDate = new Date(r.created_at);
        const now = new Date();
        if (timeFilter === 'today') {
          matchesTime = createdDate.toDateString() === now.toDateString();
        } else if (timeFilter === 'week') {
          const diffDays = (now - createdDate) / (1000 * 3600 * 24);
          matchesTime = diffDays <= 7;
        } else if (timeFilter === 'month') {
          const diffDays = (now - createdDate) / (1000 * 3600 * 24);
          matchesTime = diffDays <= 30;
        }
      }

      return matchesSearch && matchesTime;
    });
  }, [reports, search, timeFilter]);

  const totalPages = Math.ceil(filteredReports.length / perPage) || 1;
  const paginatedReports = useMemo(() => {
    return filteredReports.slice((page - 1) * perPage, page * perPage);
  }, [filteredReports, page, perPage]);

  // Handle Mark Reviewing
  const handleMarkReviewing = async (rep) => {
    try {
      await reportService.updateReportStatus(rep.id, 'REVIEWING', 'Đang được quản trị viên xem xét');
      toast.success('Đã cập nhật báo cáo thành: Đang xem xét');
      loadReports();
    } catch (err) {
      toast.error(err.message || 'Lỗi khi cập nhật trạng thái');
    }
  };

  // Handle Reject Report
  const handleRejectReport = async () => {
    if (!actionModal?.report) return;
    try {
      await reportService.updateReportStatus(
        actionModal.report.id,
        'REJECTED',
        actionNote || 'Báo cáo không chính xác hoặc không vi phạm tiêu chuẩn cộng đồng'
      );
      toast.success('Đã từ chối báo cáo');
      setActionModal(null);
      setActionNote('');
      loadReports();
    } catch (err) {
      toast.error(err.message || 'Lỗi khi từ chối báo cáo');
    }
  };

  // Handle Toggle Hide Post
  const handleToggleHide = async (rep, isHidden) => {
    try {
      await reportService.toggleHidePost(rep.id, isHidden, actionNote || 'Vi phạm tiêu chuẩn cộng đồng');
      toast.success(isHidden ? 'Đã ẩn bài đăng vi phạm' : 'Đã khôi phục bài đăng');
      setActionModal(null);
      setActionNote('');
      loadReports();
    } catch (err) {
      toast.error(err.message || 'Lỗi khi thực hiện thao tác');
    }
  };

  // Handle Delete Post
  const handleDeletePostConfirm = async () => {
    if (!deleteConfirmReport) return;
    try {
      await reportService.deletePost(deleteConfirmReport.id);
      toast.success('Đã xóa bài đăng vi phạm thành công');
      setDeleteConfirmReport(null);
      loadReports();
    } catch (err) {
      toast.error(err.message || 'Lỗi khi xóa bài đăng');
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'PENDING':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
            <Clock className="w-3 h-3" /> Chờ xử lý
          </span>
        );
      case 'REVIEWING':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
            <AlertTriangle className="w-3 h-3" /> Đang xem xét
          </span>
        );
      case 'RESOLVED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3" /> Đã xử lý
          </span>
        );
      case 'REJECTED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600 border border-gray-300">
            <XCircle className="w-3 h-3" /> Đã từ chối
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-dark">Quản lý báo cáo bài đăng</h1>
          <p className="text-sm text-warm-gray-500">
            Xem xét và xử lý các báo cáo vi phạm bài viết từ người dùng
          </p>
        </div>
      </div>

      {/* FILTERS & SEARCH */}
      <div className="card p-4 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-warm-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Tìm tên bài, mã bài, người báo cáo..."
              className="w-full pl-10 pr-4 py-2 bg-cream-100 border border-cream-300 rounded-button text-sm text-text-dark placeholder-warm-gray-400 focus:outline-none focus:ring-2 focus:ring-burgundy-500/20"
            />
          </div>

          <Select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            options={STATUS_OPTIONS}
          />

          <Select
            value={reasonFilter}
            onChange={(e) => {
              setReasonFilter(e.target.value);
              setPage(1);
            }}
            options={REASON_OPTIONS}
          />

          <Select
            value={timeFilter}
            onChange={(e) => {
              setTimeFilter(e.target.value);
              setPage(1);
            }}
            options={TIME_FILTER_OPTIONS}
          />
        </div>
      </div>

      {/* REPORTS TABLE */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-warm-gray-600">
            <thead className="bg-cream-200 text-warm-gray-700 uppercase text-xs font-semibold">
              <tr>
                <th className="px-4 py-3.5">Bài đăng bị báo cáo</th>
                <th className="px-4 py-3.5">Người đăng bài</th>
                <th className="px-4 py-3.5">Người báo cáo</th>
                <th className="px-4 py-3.5">Lý do & Chi tiết</th>
                <th className="px-4 py-3.5 text-center">Số lượt BC</th>
                <th className="px-4 py-3.5 text-center">Trạng thái</th>
                <th className="px-4 py-3.5 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cream-300">
              {loading ? (
                [1, 2, 3].map((i) => (
                  <tr key={i}>
                    <td colSpan={7} className="px-6 py-4">
                      <div className="h-6 bg-cream-200 rounded animate-pulse" />
                    </td>
                  </tr>
                ))
              ) : paginatedReports.length > 0 ? (
                paginatedReports.map((rep) => {
                  const postId = rep.post_id || rep.postId;
                  const item = rep.item || {};
                  const reporter = rep.reporter || {};
                  const isHidden = item.is_hidden || item.isHidden;
                  const imageSrc = item.images && item.images.length > 0 ? (typeof item.images[0] === 'string' ? item.images[0] : item.images[0].image_url) : null;

                  return (
                    <tr key={rep.id} className="hover:bg-cream-100 transition-colors">
                      {/* BÀI ĐĂNG */}
                      <td className="px-4 py-4 min-w-[220px]">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-lg bg-cream-200 overflow-hidden shrink-0 flex items-center justify-center text-lg border border-cream-300">
                            {imageSrc ? (
                              <img src={imageSrc} alt="" className="w-full h-full object-cover" />
                            ) : (
                              '📦'
                            )}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5 font-bold text-text-dark line-clamp-1">
                              {item.title || `Bài viết #${postId}`}
                              {isHidden && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-100 text-red-700 font-medium shrink-0">
                                  Đã ẩn
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 mt-0.5 text-xs text-warm-gray-400">
                              <span className="font-mono">#ITEM-{postId}</span>
                              <Link
                                to={`/items/${postId}`}
                                target="_blank"
                                className="text-burgundy-700 hover:underline flex items-center gap-0.5"
                                title="Xem chi tiết bài viết"
                              >
                                Xem bài <ExternalLink className="w-3 h-3" />
                              </Link>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* NGƯỜI ĐĂNG BÀI */}
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="font-medium text-text-dark text-xs">
                          {item.user?.name || item.userName || 'Ẩn danh'}
                        </div>
                        <div className="text-[11px] text-warm-gray-400">
                          {item.user?.email || 'N/A'}
                        </div>
                      </td>

                      {/* NGƯỜI BÁO CÁO */}
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="font-medium text-text-dark text-xs">
                          {reporter.name || 'Người dùng'}
                        </div>
                        <div className="text-[11px] text-warm-gray-400">
                          {formatDate(rep.created_at)}
                        </div>
                      </td>

                      {/* LÝ DO & CHI TIẾT */}
                      <td className="px-4 py-4 min-w-[200px]">
                        <div className="font-semibold text-xs text-burgundy-900">
                          {rep.reason}
                        </div>
                        {rep.description && (
                          <div className="text-xs text-warm-gray-500 line-clamp-2 mt-0.5 italic">
                            "{rep.description}"
                          </div>
                        )}
                      </td>

                      {/* TỔNG SỐ LƯỢT BC */}
                      <td className="px-4 py-4 text-center">
                        <span className="inline-flex items-center justify-center px-2.5 py-1 text-xs font-extrabold rounded-full bg-red-50 text-red-700 border border-red-200">
                          {rep.post_total_reports || 1}
                        </span>
                      </td>

                      {/* TRẠNG THÁI */}
                      <td className="px-4 py-4 text-center whitespace-nowrap">
                        {getStatusBadge(rep.status)}
                      </td>

                      {/* THAO TÁC */}
                      <td className="px-4 py-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setDetailReport(rep)}
                            className="p-1.5 rounded text-warm-gray-600 hover:bg-cream-200 transition-colors"
                            title="Xem đầy đủ báo cáo"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {rep.status === 'PENDING' && (
                            <button
                              onClick={() => handleMarkReviewing(rep)}
                              className="p-1.5 rounded text-blue-600 hover:bg-blue-50 transition-colors"
                              title="Đánh dấu đang xem xét"
                            >
                              <AlertTriangle className="w-4 h-4" />
                            </button>
                          )}

                          {rep.status !== 'REJECTED' && (
                            <button
                              onClick={() => {
                                setActionModal({ type: 'REJECT', report: rep });
                                setActionNote('');
                              }}
                              className="p-1.5 rounded text-gray-500 hover:bg-gray-100 transition-colors"
                              title="Từ chối báo cáo"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          )}

                          {!isHidden ? (
                            <button
                              onClick={() => {
                                setActionModal({ type: 'HIDE', report: rep });
                                setActionNote('');
                              }}
                              className="p-1.5 rounded text-amber-600 hover:bg-amber-50 transition-colors"
                              title="Ẩn bài đăng vi phạm"
                            >
                              <EyeOff className="w-4 h-4" />
                            </button>
                          ) : (
                            <button
                              onClick={() => handleToggleHide(rep, false)}
                              className="p-1.5 rounded text-emerald-600 hover:bg-emerald-50 transition-colors"
                              title="Khôi phục bài đăng"
                            >
                              <RotateCcw className="w-4 h-4" />
                            </button>
                          )}

                          <button
                            onClick={() => setDeleteConfirmReport(rep)}
                            className="p-1.5 rounded text-red-600 hover:bg-red-50 transition-colors"
                            title="Xóa bài đăng"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <EmptyState icon={Flag} title="Không tìm thấy báo cáo nào" />
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="p-4 border-t border-cream-300 flex justify-end">
            <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
          </div>
        )}
      </div>

      {/* DETAIL MODAL */}
      {detailReport && (
        <Modal
          isOpen={!!detailReport}
          onClose={() => setDetailReport(null)}
          title="Chi tiết báo cáo vi phạm"
          size="lg"
        >
          <div className="space-y-4 text-sm">
            <div className="p-4 bg-cream-100 rounded-xl border border-cream-300 space-y-2">
              <div className="flex justify-between items-center">
                <span className="font-bold text-burgundy-900 text-base">
                  {detailReport.item?.title || `Bài viết #${detailReport.post_id || detailReport.postId}`}
                </span>
                {getStatusBadge(detailReport.status)}
              </div>
              <p className="text-xs text-warm-gray-600">
                {detailReport.item?.description || 'Không có nội dung mô tả bài viết'}
              </p>
              <div className="pt-2 flex items-center justify-between text-xs text-warm-gray-500 border-t border-cream-200">
                <span>Người đăng bài: <strong>{detailReport.item?.user?.name || 'Ẩn danh'}</strong></span>
                <Link
                  to={`/items/${detailReport.post_id || detailReport.postId}`}
                  target="_blank"
                  className="text-burgundy-700 hover:underline flex items-center gap-1 font-semibold"
                >
                  Xem bài viết gốc <ExternalLink className="w-3 h-3" />
                </Link>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-cream-50 rounded-lg border border-cream-200">
                <div className="text-xs font-semibold text-warm-gray-500 uppercase">Người báo cáo</div>
                <div className="font-bold text-text-dark mt-1">{detailReport.reporter?.name || 'Người dùng'}</div>
                <div className="text-xs text-warm-gray-500">{detailReport.reporter?.email || ''}</div>
              </div>
              <div className="p-3 bg-cream-50 rounded-lg border border-cream-200">
                <div className="text-xs font-semibold text-warm-gray-500 uppercase">Tổng số lượt báo cáo bài viết</div>
                <div className="font-extrabold text-red-600 text-lg mt-0.5">{detailReport.post_total_reports || 1} lượt</div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="text-xs font-semibold text-warm-gray-500 uppercase">Lý do báo cáo</div>
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-900 font-medium">
                {detailReport.reason}
              </div>
              {detailReport.description && (
                <div className="p-3 bg-cream-100 rounded-lg text-warm-gray-700 italic border border-cream-200">
                  "{detailReport.description}"
                </div>
              )}
            </div>

            {detailReport.admin_note && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-blue-900 text-xs">
                <strong>Ghi chú xử lý của Admin:</strong> {detailReport.admin_note}
              </div>
            )}

            <div className="flex justify-end pt-3 border-t border-cream-200">
              <Button variant="ghost" onClick={() => setDetailReport(null)}>
                Đóng
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* ACTION REJECT / HIDE MODAL */}
      {actionModal && (
        <Modal
          isOpen={!!actionModal}
          onClose={() => setActionModal(null)}
          title={actionModal.type === 'REJECT' ? 'Từ chối báo cáo' : 'Ẩn bài đăng vi phạm'}
          size="md"
        >
          <div className="space-y-4">
            <p className="text-sm text-warm-gray-600">
              {actionModal.type === 'REJECT'
                ? 'Nhập ghi chú lý do từ chối báo cáo này:'
                : 'Nhập lý do ẩn bài đăng vi phạm:'}
            </p>
            <Textarea
              label="Ghi chú xử lý"
              value={actionNote}
              onChange={(e) => setActionNote(e.target.value)}
              placeholder="Nhập ghi chú..."
              rows={3}
            />
            <div className="flex justify-end gap-3 pt-3 border-t border-cream-200">
              <Button variant="ghost" onClick={() => setActionModal(null)}>
                Hủy
              </Button>
              {actionModal.type === 'REJECT' ? (
                <Button onClick={handleRejectReport} variant="secondary">
                  Xác nhận từ chối
                </Button>
              ) : (
                <Button onClick={() => handleToggleHide(actionModal.report, true)} variant="danger">
                  Xác nhận ẩn bài
                </Button>
              )}
            </div>
          </div>
        </Modal>
      )}

      {/* CONFIRM DELETE MODAL */}
      <ConfirmModal
        isOpen={!!deleteConfirmReport}
        onClose={() => setDeleteConfirmReport(null)}
        onConfirm={handleDeletePostConfirm}
        title="Xác nhận xóa bài đăng"
        message="Bạn có chắc chắn muốn xóa bài đăng này không? Thao tác này không thể hoàn tác và bài viết sẽ bị xoá khỏi hệ thống."
        confirmText="Xóa bài đăng"
        variant="danger"
      />
    </div>
  );
}
