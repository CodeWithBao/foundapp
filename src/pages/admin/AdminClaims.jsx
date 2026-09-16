import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Search, ClipboardList, Eye, User, Calendar, ExternalLink } from 'lucide-react';
import claimService from '../../services/claimService';
import itemService from '../../services/itemService';
import { StatusBadge } from '../../components/common/Badge';
import Select from '../../components/common/Select';
import Pagination from '../../components/common/Pagination';
import EmptyState from '../../components/common/EmptyState';
import { Modal } from '../../components/common/Modal';
import { formatDate, formatDateTime } from '../../utils';
import { toast } from 'sonner';

export default function AdminClaims() {
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [detailClaim, setDetailClaim] = useState(null);
  const perPage = 10;

  useEffect(() => {
    loadClaims();
  }, [statusFilter]);

  const loadClaims = async () => {
    setLoading(true);
    try {
      const [claimData, itemData] = await Promise.all([
        claimService.getClaims({ status: statusFilter }),
        itemService.getItems()
      ]);
      const itemMap = {};
      itemData.forEach(i => { itemMap[i.id] = i; });
      setClaims(claimData.map(c => ({ ...c, item: itemMap[c.itemId] })));
    } catch (err) {
      toast.error(err.message || 'Lỗi khi tải danh sách yêu cầu');
    } finally {
      setLoading(false);
    }
  };

  const filtered = useMemo(() => {
    if (!search.trim()) return claims;
    const s = search.toLowerCase();
    return claims.filter(
      c =>
        c.id?.toLowerCase().includes(s) ||
        c.item?.title?.toLowerCase().includes(s) ||
        c.claimantName?.toLowerCase().includes(s) ||
        c.claimantEmail?.toLowerCase().includes(s) ||
        c.claimantStudentId?.toLowerCase().includes(s)
    );
  }, [claims, search]);

  const totalPages = Math.ceil(filtered.length / perPage) || 1;
  const paginated = useMemo(() => {
    return filtered.slice((page - 1) * perPage, page * perPage);
  }, [filtered, page, perPage]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-dark flex items-center gap-2">
            <ClipboardList className="w-6 h-6 text-burgundy-800" />
            Quản lý yêu cầu nhận lại đồ
          </h1>
          <p className="text-sm text-warm-gray-500">
            Giám sát toàn bộ yêu cầu nhận lại vật phẩm thất lạc trên hệ thống UniFind
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold px-3 py-1.5 bg-cream-200 text-warm-gray-700 rounded-full border border-cream-300">
            Tổng cộng: {claims.length} yêu cầu
          </span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="card p-4 flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-warm-gray-400" />
          <input
            type="text"
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            placeholder="Tìm theo mã (CL0XX), tên vật phẩm, người yêu cầu, email, MSSV..."
            className="w-full pl-10 pr-4 py-2 bg-cream-100 border border-cream-300 rounded-button text-sm text-text-dark placeholder-warm-gray-400 focus:outline-none focus:ring-2 focus:ring-burgundy-500/20 focus:border-burgundy-700 transition-colors"
          />
        </div>
        <div className="w-full sm:w-56">
          <Select
            options={[
              { value: 'all', label: 'Tất cả trạng thái' },
              { value: 'PENDING', label: 'Chờ xử lý' },
              { value: 'UNDER_REVIEW', label: 'Đang xem xét' },
              { value: 'APPROVED', label: 'Đã duyệt' },
              { value: 'READY_FOR_HANDOVER', label: 'Chờ bàn giao' },
              { value: 'COMPLETED', label: 'Đã bàn giao' },
              { value: 'REJECTED', label: 'Từ chối' },
            ]}
            value={statusFilter}
            onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
          />
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-warm-gray-600">
            <thead className="bg-cream-200 text-warm-gray-700 uppercase text-xs font-semibold">
              <tr>
                <th className="px-6 py-3.5">Mã yêu cầu</th>
                <th className="px-6 py-3.5">Vật phẩm liên quan</th>
                <th className="px-6 py-3.5">Người yêu cầu</th>
                <th className="px-6 py-3.5">Trạng thái</th>
                <th className="px-6 py-3.5">Thời gian gửi</th>
                <th className="px-6 py-3.5 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cream-300">
              {loading ? (
                [1, 2, 3, 4, 5].map(i => (
                  <tr key={i}>
                    <td colSpan={6} className="px-6 py-4">
                      <div className="h-6 bg-cream-200 rounded animate-pulse" />
                    </td>
                  </tr>
                ))
              ) : paginated.length > 0 ? (
                paginated.map(claim => (
                  <tr key={claim.id} className="hover:bg-cream-100 transition-colors">
                    <td className="px-6 py-4 font-mono text-xs font-bold text-burgundy-900 whitespace-nowrap">
                      {claim.id}
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3 max-w-xs">
                        {claim.item?.images?.[0] ? (
                          <img
                            src={claim.item.images[0]}
                            alt={claim.item.title}
                            className="w-10 h-10 rounded-md object-cover border border-cream-300 shrink-0"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-md bg-cream-200 flex items-center justify-center shrink-0 text-warm-gray-400">
                            <ClipboardList className="w-5 h-5" />
                          </div>
                        )}
                        <div className="truncate">
                          <div className="font-semibold text-text-dark truncate">
                            {claim.item?.title || claim.itemId}
                          </div>
                          <div className="text-xs text-warm-gray-400">
                            Mã đồ: {claim.itemId}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="font-medium text-text-dark flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-warm-gray-400" />
                          {claim.claimantName}
                        </div>
                        {claim.claimantEmail && (
                          <div className="text-xs text-warm-gray-400">{claim.claimantEmail}</div>
                        )}
                      </div>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      <StatusBadge status={claim.status} type="claim" />
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap text-xs text-warm-gray-500 font-mono">
                      {formatDate(claim.createdAt)}
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setDetailClaim(claim)}
                          className="p-1.5 rounded text-warm-gray-600 hover:text-burgundy-800 hover:bg-cream-200 transition-colors"
                          title="Xem chi tiết yêu cầu"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {claim.itemId && (
                          <Link
                            to={`/items/${claim.itemId}`}
                            className="p-1.5 rounded text-warm-gray-400 hover:text-burgundy-800 hover:bg-cream-200 transition-colors"
                            title="Xem bài đăng gốc"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </Link>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <EmptyState icon={ClipboardList} title="Không tìm thấy yêu cầu nhận lại nào" />
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-cream-300 flex justify-end">
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              onPageChange={setPage}
            />
          </div>
        )}
      </div>

      {/* Claim Detail Modal */}
      <Modal
        isOpen={!!detailClaim}
        onClose={() => setDetailClaim(null)}
        title={`Chi tiết yêu cầu nhận lại #${detailClaim?.id}`}
        size="md"
      >
        {detailClaim && (
          <div className="space-y-4 text-sm">
            <div className="p-3 bg-cream-100 rounded-card border border-cream-300 flex items-center justify-between">
              <div>
                <span className="text-xs text-warm-gray-500">Trạng thái hiện tại:</span>
                <div className="mt-1">
                  <StatusBadge status={detailClaim.status} type="claim" />
                </div>
              </div>
              <div className="text-right">
                <span className="text-xs text-warm-gray-500">Ngày gửi:</span>
                <p className="font-mono text-xs text-text-dark mt-0.5">
                  {formatDateTime(detailClaim.createdAt)}
                </p>
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-text-dark mb-1">Vật phẩm yêu cầu:</h4>
              <p className="text-warm-gray-700 font-medium">
                {detailClaim.item?.title || detailClaim.itemId}
              </p>
              {detailClaim.item?.location && (
                <p className="text-xs text-warm-gray-500">Địa điểm: {detailClaim.item.location}</p>
              )}
            </div>

            <div>
              <h4 className="font-semibold text-text-dark mb-1">Thông tin người yêu cầu:</h4>
              <div className="grid grid-cols-2 gap-2 text-xs bg-cream-100 p-3 rounded-card">
                <div>
                  <span className="text-warm-gray-500">Họ tên:</span>
                  <p className="font-medium text-text-dark">{detailClaim.claimantName}</p>
                </div>
                <div>
                  <span className="text-warm-gray-500">MSSV / Mã NV:</span>
                  <p className="font-medium text-text-dark">{detailClaim.claimantStudentId || '—'}</p>
                </div>
                <div>
                  <span className="text-warm-gray-500">Email:</span>
                  <p className="font-medium text-text-dark">{detailClaim.claimantEmail || '—'}</p>
                </div>
                <div>
                  <span className="text-warm-gray-500">Điện thoại:</span>
                  <p className="font-medium text-text-dark">{detailClaim.claimantPhone || '—'}</p>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-text-dark mb-1">Bằng chứng / Mô tả xác nhận sở hữu:</h4>
              <div className="p-3 bg-cream-100 rounded-card text-warm-gray-700 text-xs whitespace-pre-wrap leading-relaxed">
                {detailClaim.description || detailClaim.proof || 'Không có mô tả chi tiết kèm theo.'}
              </div>
            </div>

            {detailClaim.proofImage && (
              <div>
                <h4 className="font-semibold text-text-dark mb-1">Ảnh minh chứng:</h4>
                <img
                  src={detailClaim.proofImage}
                  alt="Minh chứng"
                  className="w-full max-h-48 object-cover rounded-card border border-cream-300"
                />
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
