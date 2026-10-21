import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Clock, FileCheck, CheckCircle, Package, ArrowRight,
  CheckSquare, History, Calendar, Eye
} from 'lucide-react';
import claimService from '../../services/claimService';
import itemService from '../../services/itemService';
import userService from '../../services/userService';
import { CLAIM_STATUS } from '../../constants';
import { StatusBadge } from '../../components/common/Badge';
import LoadingSkeleton from '../../components/common/LoadingSkeleton';
import EmptyState from '../../components/common/EmptyState';
import { formatRelative, formatDate } from '../../utils';

export default function StaffDashboard() {
  const [stats, setStats] = useState({
    pending: 0,
    todayNew: 0,
    todayProcessed: 0,
    itemsInStorage: 0,
  });
  const [reviewList, setReviewList] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [allClaims, allItems, allUsers] = await Promise.all([
        claimService.getClaims(),
        itemService.getItems(),
        userService.getUsers(),
      ]);

      const itemsMap = new Map(allItems.map(i => [i.id, i]));
      const usersMap = new Map(allUsers.map(u => [u.id, u]));

      const todayStr = new Date().toISOString().split('T')[0];

      const pendingClaims = allClaims.filter(c => c.status === CLAIM_STATUS.PENDING);
      const todayClaims = allClaims.filter(c => c.createdAt && c.createdAt.startsWith(todayStr));
      const processedClaims = allClaims.filter(
        c => [CLAIM_STATUS.APPROVED, CLAIM_STATUS.REJECTED, CLAIM_STATUS.COMPLETED, CLAIM_STATUS.READY_FOR_HANDOVER].includes(c.status)
      );
      const storageItems = allItems.filter(i => i.status === 'FOUND');

      setStats({
        pending: pendingClaims.length,
        todayNew: todayClaims.length,
        todayProcessed: processedClaims.length,
        itemsInStorage: storageItems.length,
      });

      // 5-10 latest pending or under review claims
      const needsReview = allClaims
        .filter(c => [CLAIM_STATUS.PENDING, CLAIM_STATUS.UNDER_REVIEW].includes(c.status))
        .slice(0, 8)
        .map(c => {
          const item = itemsMap.get(c.itemId);
          const claimant = usersMap.get(c.claimantId);
          // Format display ID like #CLM-001 or use c.id
          const idStr = String(c.id || '');
          const formattedId = idStr.startsWith('C') && !idStr.startsWith('CLM')
            ? `#CLM-${idStr.replace('C', '').padStart(3, '0')}`
            : `#${c.id}`;

          return {
            ...c,
            displayId: formattedId,
            itemTitle: item?.title || 'Vật phẩm thất lạc',
            itemImage: item?.images?.[0] || 'https://placehold.co/100x100?text=No+Image',
            claimantName: claimant?.fullName || claimant?.name || c.claimantName || 'Sinh viên',
            claimantStudentId: claimant?.studentId || claimant?.employeeId || '',
          };
        });

      setReviewList(needsReview);
    } catch (err) {
      console.error('Error loading staff dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Banner / Header Card */}
      <div className="surface p-6 sm:px-7 sm:py-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <span className="label-micro text-[#AD222B]">Cán bộ nghiệp vụ</span>
            <span className="px-2.5 py-0.5 text-[10px] font-mono font-bold rounded-full bg-red-50 text-[#AD222B] border border-red-200/80 uppercase">
              Lost &amp; Found DNTU
            </span>
          </div>
          <h1 className="page-title text-2xl sm:text-3xl text-[#1C2530] mt-1">Tổng quan Bàn làm việc Cán bộ</h1>
          <p className="text-xs sm:text-sm text-[#5B6574] mt-1">
            Hệ thống tiếp nhận, thẩm định và bàn giao tài sản sinh viên Trường Đại học Công nghệ Đồng Nai
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Link
            to="/staff/claims"
            className="btn-primary text-xs px-4 py-2.5 inline-flex items-center gap-2"
          >
            <CheckSquare className="w-4 h-4" />
            Duyệt yêu cầu ngay
          </Link>
        </div>
      </div>

      {/* 4 Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Card 1: 25 Yêu cầu đang chờ (Pending) */}
        <div className="surface p-5 flex items-center justify-between hover:shadow-card-hover transition-all">
          <div>
            <p className="label-micro text-[#8C95A3] mb-1">
              Yêu cầu đang chờ
            </p>
            <p className="text-3xl font-serif font-bold text-amber-700">
              {loading ? '...' : stats.pending}
            </p>
            <p className="text-xs text-[#5B6574] font-mono mt-1">Chờ nhân viên thẩm định</p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center border border-amber-200/80 shrink-0">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        {/* Card 2: 18 Yêu cầu mới hôm nay */}
        <div className="surface p-5 flex items-center justify-between hover:shadow-card-hover transition-all">
          <div>
            <p className="label-micro text-[#8C95A3] mb-1">
              Yêu cầu mới hôm nay
            </p>
            <p className="text-3xl font-serif font-bold text-blue-700">
              {loading ? '...' : stats.todayNew}
            </p>
            <p className="text-xs text-[#5B6574] font-mono mt-1">Gửi trong vòng 24h qua</p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center border border-blue-200/80 shrink-0">
            <Calendar className="w-5 h-5" />
          </div>
        </div>

        {/* Card 3: 32 Đã xử lý hôm nay */}
        <div className="surface p-5 flex items-center justify-between hover:shadow-card-hover transition-all">
          <div>
            <p className="label-micro text-[#8C95A3] mb-1">
              Đã xử lý hôm nay
            </p>
            <p className="text-3xl font-serif font-bold text-emerald-700">
              {loading ? '...' : stats.todayProcessed}
            </p>
            <p className="text-xs text-[#5B6574] font-mono mt-1">Đã duyệt / Từ chối / Giao</p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-200/80 shrink-0">
            <FileCheck className="w-5 h-5" />
          </div>
        </div>

        {/* Card 4: 12 Vật phẩm lưu giữ */}
        <div className="surface p-5 flex items-center justify-between hover:shadow-card-hover transition-all">
          <div>
            <p className="label-micro text-[#8C95A3] mb-1">
              Vật phẩm lưu giữ
            </p>
            <p className="text-3xl font-serif font-bold text-[#AD222B]">
              {loading ? '...' : stats.itemsInStorage}
            </p>
            <p className="text-xs text-[#5B6574] font-mono mt-1">Đang tại kho Lost &amp; Found</p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-red-50 text-[#AD222B] flex items-center justify-center border border-red-200/80 shrink-0">
            <Package className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Quick Action Navigation */}
      <div className="surface p-4 sm:px-5 flex flex-wrap items-center gap-3">
        <span className="label-micro text-[#8C95A3] mr-1">
          Truy cập nhanh:
        </span>
        <Link
          to="/staff/claims?status=PENDING"
          className="inline-flex items-center gap-2 h-9 px-3.5 rounded-lg bg-[#FAF8F2] hover:bg-red-50 text-[#1C2530] text-xs font-mono font-semibold border border-[#E0E2E6] transition-colors"
        >
          <Clock className="w-4 h-4 text-amber-700" />
          Chờ duyệt ({stats.pending})
        </Link>
        <Link
          to="/staff/items"
          className="inline-flex items-center gap-2 h-9 px-3.5 rounded-lg bg-[#FAF8F2] hover:bg-red-50 text-[#1C2530] text-xs font-mono font-semibold border border-[#E0E2E6] transition-colors"
        >
          <Package className="w-4 h-4 text-[#AD222B]" />
          Kho lưu giữ ({stats.itemsInStorage})
        </Link>
        <Link
          to="/staff/handovers"
          className="inline-flex items-center gap-2 h-9 px-3.5 rounded-lg bg-[#FAF8F2] hover:bg-red-50 text-[#1C2530] text-xs font-mono font-semibold border border-[#E0E2E6] transition-colors"
        >
          <History className="w-4 h-4 text-emerald-700" />
          Nhật ký bàn giao
        </Link>
      </div>

      {/* Bảng "Yêu cầu cần duyệt" */}
      <div className="surface overflow-hidden">
        <div className="p-5 sm:px-6 border-b border-[#E0E2E6] flex items-center justify-between">
          <div>
            <h2 className="font-serif font-semibold text-lg text-[#1C2530] flex items-center gap-2">
              <CheckSquare className="w-5 h-5 text-[#AD222B]" />
              Yêu cầu cần duyệt mới nhất
            </h2>
            <p className="text-xs text-[#5B6574] mt-0.5">
              Danh sách các yêu cầu nhận đồ vừa được gửi lên hệ thống
            </p>
          </div>
          <Link
            to="/staff/claims"
            className="text-xs text-[#AD222B] hover:text-[#8A1A22] font-mono font-bold inline-flex items-center gap-1"
          >
            Xem toàn bộ <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {loading ? (
          <div className="p-6">
            <LoadingSkeleton count={4} />
          </div>
        ) : reviewList.length === 0 ? (
          <div className="p-8 text-center">
            <EmptyState
              icon={CheckCircle}
              title="Không có yêu cầu nào chờ duyệt"
              description="Tất cả các yêu cầu nhận đồ hiện tại đã được thẩm định xong."
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead className="bg-[#FAF8F2] border-b border-[#E0E2E6] text-[#5B6574] font-mono font-semibold text-xs uppercase">
                <tr>
                  <th className="py-3 px-5">Mã YC</th>
                  <th className="py-3 px-5">Vật phẩm</th>
                  <th className="py-3 px-5">Người yêu cầu</th>
                  <th className="py-3 px-5">Ngày gửi</th>
                  <th className="py-3 px-5">Trạng thái</th>
                  <th className="py-3 px-5 text-right">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E0E2E6]">
                {reviewList.map((claim) => (
                  <tr key={claim.id} className="hover:bg-[#FAF8F2]/60 transition-colors h-[60px]">
                    <td className="py-3 px-5 font-mono font-bold text-[#AD222B] text-xs">
                      {claim.displayId}
                    </td>
                    <td className="py-3 px-5">
                      <div className="flex items-center gap-3">
                        <img
                          src={claim.itemImage}
                          alt={claim.itemTitle}
                          className="w-10 h-10 rounded-lg object-cover border border-[#E0E2E6] shrink-0 bg-[#FAF8F2]"
                        />
                        <div>
                          <p className="font-semibold text-[#1C2530] line-clamp-1">
                            {claim.itemTitle}
                          </p>
                          <p className="text-[11px] font-mono text-[#8C95A3]">ID: {claim.itemId}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-5">
                      <div>
                        <p className="font-medium text-[#1C2530]">{claim.claimantName}</p>
                        {claim.claimantStudentId && (
                          <p className="text-xs font-mono text-[#5B6574]">MSSV: {claim.claimantStudentId}</p>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-5 text-[#5B6574] font-mono text-xs whitespace-nowrap">
                      {formatDate(claim.createdAt)}
                    </td>
                    <td className="py-3 px-5 whitespace-nowrap">
                      <StatusBadge status={claim.status} type="claim" />
                    </td>
                    <td className="py-3 px-5 text-right whitespace-nowrap">
                      <Link
                        to={`/staff/claims/${claim.id}`}
                        className="btn-primary text-xs px-3.5 py-1.5 inline-flex items-center gap-1.5"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        Xem xét
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
