import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CheckSquare, Search, Eye, Filter, CheckCircle, XCircle } from 'lucide-react';
import claimService from '../../services/claimService';
import itemService from '../../services/itemService';
import userService from '../../services/userService';
import { CLAIM_STATUS } from '../../constants';
import { StatusBadge } from '../../components/common/Badge';
import EmptyState from '../../components/common/EmptyState';
import Pagination from '../../components/common/Pagination';
import LoadingSkeleton from '../../components/common/LoadingSkeleton';
import { formatRelative, formatDate } from '../../utils';
import { toast } from 'sonner';

const FILTER_TABS = [
  { id: 'all', label: 'Tất cả' },
  { id: CLAIM_STATUS.PENDING, label: 'Chờ duyệt' },
  { id: CLAIM_STATUS.UNDER_REVIEW, label: 'Đang xem xét' },
  { id: CLAIM_STATUS.APPROVED, label: 'Đã duyệt' },
  { id: CLAIM_STATUS.READY_FOR_HANDOVER, label: 'Chờ bàn giao' },
  { id: CLAIM_STATUS.COMPLETED, label: 'Đã bàn giao' },
  { id: CLAIM_STATUS.REJECTED, label: 'Từ chối' },
];

export default function StaffClaims() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialStatus = searchParams.get('status') || 'all';

  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(initialStatus);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  useEffect(() => {
    loadClaims();
  }, []);

  useEffect(() => {
    const statusParam = searchParams.get('status');
    if (statusParam && statusParam !== activeTab) {
      setActiveTab(statusParam);
    }
  }, [searchParams]);

  const loadClaims = async () => {
    setLoading(true);
    try {
      const [claimsData, itemsData, usersData] = await Promise.all([
        claimService.getClaims(),
        itemService.getItems(),
        userService.getUsers(),
      ]);

      const itemsMap = new Map(itemsData.map(i => [i.id, i]));
      const usersMap = new Map(usersData.map(u => [u.id, u]));

      const enriched = claimsData.map(c => {
        const item = itemsMap.get(c.itemId);
        const claimant = usersMap.get(c.claimantId);
        
        const idStr = String(c.id || '');
        const formattedId = idStr.startsWith('C') && !idStr.startsWith('CLM')
          ? `#CLM-${idStr.replace('C', '').padStart(3, '0')}`
          : `#${c.id}`;

        return {
          ...c,
          displayId: formattedId,
          item,
          itemTitle: item?.title || 'Vật phẩm thất lạc',
          itemImage: item?.images?.[0] || 'https://placehold.co/100x100?text=No+Image',
          claimantName: claimant?.fullName || claimant?.name || c.claimantName || 'Sinh viên',
          claimantStudentId: claimant?.studentId || claimant?.employeeId || '',
        };
      });

      setClaims(enriched);
    } catch (err) {
      console.error('Failed to load claims:', err);
      toast.error('Lỗi khi tải danh sách yêu cầu');
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    setCurrentPage(1);
    if (tabId === 'all') {
      searchParams.delete('status');
      setSearchParams(searchParams);
    } else {
      setSearchParams({ status: tabId });
    }
  };

  // Filtering
  const filteredClaims = claims.filter(c => {
    const matchesTab = activeTab === 'all' ? true : c.status === activeTab;
    const q = searchQuery.trim().toLowerCase();
    if (!q) return matchesTab;

    const matchesSearch =
      c.displayId.toLowerCase().includes(q) ||
      c.itemTitle.toLowerCase().includes(q) ||
      c.claimantName.toLowerCase().includes(q) ||
      c.claimantStudentId.toLowerCase().includes(q);

    return matchesTab && matchesSearch;
  });

  const totalPages = Math.ceil(filteredClaims.length / pageSize) || 1;
  const paginatedClaims = filteredClaims.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div className="space-y-6 pb-10">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-[#E5E7EB] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <CheckSquare className="w-6 h-6 text-[#88171B]" />
            Quản lý Yêu cầu nhận đồ (Claims)
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Theo dõi, thẩm định và tiến hành các thủ tục bàn giao tài sản cho sinh viên / giảng viên
          </p>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-xs p-4 space-y-4">
        {/* Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-[#F3F4F6] scrollbar-hide">
          {FILTER_TABS.map(tab => {
            const count = tab.id === 'all'
              ? claims.length
              : claims.filter(c => c.status === tab.id).length;

            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`whitespace-nowrap px-4 py-2 text-sm font-semibold rounded-xl transition-colors flex items-center gap-2 border ${
                  isActive
                    ? 'bg-[#88171B]/5 border-[#88171B]/20 text-[#88171B]'
                    : 'bg-transparent border-transparent text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                    isActive ? 'bg-[#88171B] text-white' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search Input */}
        <div className="relative max-w-lg">
          <Search className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Tìm theo mã claim (#CLM...), tên vật phẩm, MSSV..."
            className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-[#E5E7EB] focus:outline-none focus:border-[#88171B] focus:ring-1 focus:ring-[#88171B] bg-slate-50/50 text-sm text-slate-900 transition-colors"
          />
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-6">
            <LoadingSkeleton count={5} />
          </div>
        ) : filteredClaims.length === 0 ? (
          <div className="p-10">
            <EmptyState
              icon={CheckSquare}
              title="Không tìm thấy yêu cầu nào"
              description="Thử thay đổi bộ lọc trạng thái hoặc từ khóa tìm kiếm."
            />
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead className="bg-[#FAFAFA] border-b border-[#F3F4F6] text-slate-500 font-semibold text-xs uppercase tracking-wider">
                  <tr>
                    <th className="py-4 px-5">Mã Claim</th>
                    <th className="py-4 px-5">Vật phẩm</th>
                    <th className="py-4 px-5">Người yêu cầu</th>
                    <th className="py-4 px-5">Ngày gửi</th>
                    <th className="py-4 px-5">Trạng thái</th>
                    <th className="py-4 px-5 text-right">Hành động</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F3F4F6]">
                  {paginatedClaims.map(claim => (
                    <tr key={claim.id} className="hover:bg-slate-50 transition-colors group">
                      <td className="py-4 px-5 font-mono font-bold text-[#88171B] text-xs">
                        {claim.displayId}
                      </td>
                      <td className="py-4 px-5">
                        <div className="flex items-center gap-3">
                          <img
                            src={claim.itemImage}
                            alt={claim.itemTitle}
                            className="w-10 h-10 rounded-lg object-cover border border-slate-200 shrink-0"
                          />
                          <div>
                            <p className="font-semibold text-slate-900 line-clamp-1 max-w-[200px]" title={claim.itemTitle}>
                              {claim.itemTitle}
                            </p>
                            <p className="text-xs text-slate-500">
                              Mã đồ: {claim.itemId}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-5">
                        <div>
                          <p className="font-medium text-slate-900">{claim.claimantName}</p>
                          {claim.claimantStudentId && (
                            <p className="text-xs text-slate-500 font-mono mt-0.5">MSSV: {claim.claimantStudentId}</p>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-5 text-slate-500 text-xs">
                        {formatDate(claim.createdAt)}
                      </td>
                      <td className="py-4 px-5">
                        <StatusBadge status={claim.status} type="claim" />
                      </td>
                      <td className="py-4 px-5 text-right">
                        {claim.status === CLAIM_STATUS.PENDING || claim.status === CLAIM_STATUS.UNDER_REVIEW ? (
                          <Link
                            to={`/staff/claims/${claim.id}`}
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#981B1E] hover:bg-[#88171B] text-white text-xs font-semibold shadow-sm transition-colors"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            Xem xét
                          </Link>
                        ) : (
                          <Link
                            to={`/staff/claims/${claim.id}`}
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-[#88171B] text-xs font-semibold border border-slate-200 transition-colors"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            Chi tiết
                          </Link>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="p-4 border-t border-[#F3F4F6]">
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
