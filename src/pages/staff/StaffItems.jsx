import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, Package, Eye, Filter, MapPin, Building, Tag, CheckCircle2, Clock } from 'lucide-react';
import itemService from '../../services/itemService';
import userService from '../../services/userService';
import { StatusBadge, ItemTypeBadge } from '../../components/common/Badge';
import Select from '../../components/common/Select';
import Pagination from '../../components/common/Pagination';
import EmptyState from '../../components/common/EmptyState';
import LoadingSkeleton from '../../components/common/LoadingSkeleton';
import { formatDate } from '../../utils';
import { mockLocations } from '../../data/locations';

export default function StaffItems() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('FOUND'); // Default to storage items
  const [locationFilter, setLocationFilter] = useState('all');
  const [page, setPage] = useState(1);
  const perPage = 10;

  useEffect(() => {
    loadItems();
  }, [statusFilter]);

  const loadItems = async () => {
    setLoading(true);
    try {
      const [itemsData, usersData] = await Promise.all([
        itemService.getItems({
          status: statusFilter === 'all' ? undefined : statusFilter,
        }),
        userService.getUsers(),
      ]);

      const usersMap = new Map(usersData.map(u => [u.id, u]));

      const enriched = itemsData.map(item => {
        const author = usersMap.get(item.userId);
        return {
          ...item,
          authorName: author?.fullName || author?.name || item.contactName || 'Người gửi / Nhân viên',
          authorRole: author?.role === 'STAFF' ? 'Nhân viên kho' : 'Sinh viên',
        };
      });

      setItems(enriched);
    } catch (err) {
      console.error('Failed to load items:', err);
    } finally {
      setLoading(false);
    }
  };

  // Filter items
  const filtered = items.filter(i => {
    const matchesLocation =
      locationFilter === 'all'
        ? true
        : (i.location && i.location.toLowerCase().includes(locationFilter.toLowerCase()));

    const q = search.trim().toLowerCase();
    const matchesSearch =
      !q ||
      i.title.toLowerCase().includes(q) ||
      i.id.toLowerCase().includes(q) ||
      (i.category && i.category.toLowerCase().includes(q)) ||
      (i.authorName && i.authorName.toLowerCase().includes(q)) ||
      (i.location && i.location.toLowerCase().includes(q));

    return matchesLocation && matchesSearch;
  });

  const totalPages = Math.ceil(filtered.length / perPage) || 1;
  const paginated = filtered.slice((page - 1) * perPage, page * perPage);

  // Storage metrics
  const inStorageCount = items.filter(i => i.status === 'FOUND').length;
  const returnedCount = items.filter(i => i.status === 'RETURNED').length;

  return (
    <div className="space-y-6 pb-10">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-[#E5E7EB] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2.5">
            <Package className="w-6 h-6 text-[#88171B]" />
            Quản lý Kho lưu giữ vật phẩm Lost &amp; Found
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Kiểm kê và theo dõi vị trí các tài sản đang lưu trữ tại các kho / phòng tiếp nhận DNTU
          </p>
        </div>

        {/* Quick counter chips */}
        <div className="flex items-center gap-3">
          <div className="px-4 py-2 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-semibold text-emerald-800 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Đang lưu kho: <span className="text-base font-bold">{inStorageCount}</span>
          </div>
          <div className="px-4 py-2 bg-blue-50 border border-blue-200 rounded-xl text-xs font-semibold text-blue-800 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-blue-600" />
            Đã hoàn trả: <span className="text-base font-bold">{returnedCount}</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-[#E5E7EB] shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={e => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Tìm theo mã đồ (#P...), tên tài sản, danh mục, người giao nộp..."
            className="w-full pl-10 pr-4 py-2.5 border border-[#E5E7EB] rounded-xl text-sm focus:outline-none focus:border-[#88171B] focus:ring-1 focus:ring-[#88171B] bg-slate-50/50 text-slate-900 transition-colors"
          />
        </div>

        <div className="flex flex-wrap sm:flex-nowrap w-full md:w-auto gap-3">
          {/* Filter theo trạng thái lưu kho */}
          <Select
            options={[
              { value: 'all', label: 'Tất cả trạng thái' },
              { value: 'FOUND', label: '📦 Đang lưu kho (FOUND)' },
              { value: 'RETURNED', label: '🤝 Đã trao trả (RETURNED)' },
              { value: 'LOST', label: '🔍 Tin báo mất (LOST)' },
              { value: 'CLOSED', label: '📁 Đã đóng (CLOSED)' },
            ]}
            value={statusFilter}
            onChange={e => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="w-full sm:w-52"
          />

          {/* Filter theo khu vực lưu giữ */}
          <Select
            options={[
              { value: 'all', label: 'Tất cả khu vực lưu giữ' },
              { value: 'Nhà A', label: 'Văn phòng Nhà A' },
              { value: 'Thư viện', label: 'Kho Thư viện' },
              { value: 'Phòng Bảo vệ', label: 'Phòng Bảo vệ cổng' },
              { value: 'Nhà B', label: 'Nhà B' },
              { value: 'Nhà C', label: 'Nhà C' },
              { value: 'Ký túc xá', label: 'Ban QL Ký túc xá' },
              { value: 'Căng tin', label: 'Khu Căng tin' },
            ]}
            value={locationFilter}
            onChange={e => {
              setLocationFilter(e.target.value);
              setPage(1);
            }}
            className="w-full sm:w-56"
          />
        </div>
      </div>

      {/* Main Inventory Table */}
      <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-6">
            <LoadingSkeleton count={5} />
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-10">
            <EmptyState
              icon={Package}
              title="Không có vật phẩm nào trong kho khớp bộ lọc"
              description="Thử đổi bộ lọc trạng thái lưu kho hoặc khu vực lưu giữ."
            />
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead className="bg-[#FAFAFA] border-b border-[#F3F4F6] text-slate-500 font-semibold text-xs uppercase tracking-wider">
                  <tr>
                    <th className="py-4 px-4">Mã tài sản</th>
                    <th className="py-4 px-4">Vật phẩm lưu kho</th>
                    <th className="py-4 px-4">Danh mục</th>
                    <th className="py-4 px-4">Khu vực lưu giữ</th>
                    <th className="py-4 px-4">Người tiếp nhận / bàn giao</th>
                    <th className="py-4 px-4">Ngày lưu kho</th>
                    <th className="py-4 px-4">Trạng thái kho</th>
                    <th className="py-4 px-4 text-right">Chi tiết</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F3F4F6]">
                  {paginated.map(item => (
                    <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-4 px-4 font-mono font-bold text-[#88171B] text-xs">
                        #{item.id}
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={item.images?.[0] || 'https://placehold.co/100x100?text=No+Image'}
                            alt={item.title}
                            className="w-11 h-11 rounded-lg object-cover border border-slate-200 shrink-0"
                          />
                          <div>
                            <span className="font-semibold text-slate-900 line-clamp-1 max-w-[200px]" title={item.title}>
                              {item.title}
                            </span>
                            <span className="text-xs text-slate-500 block mt-0.5">
                              {item.type === 'FOUND' ? 'Nhặt được' : 'Báo mất'}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-700 bg-slate-100 px-2 py-1 rounded-md">
                          <Tag className="w-3 h-3 text-slate-400" />
                          {item.category}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-slate-700">
                        <div className="flex items-center gap-1.5 text-xs font-medium">
                          <MapPin className="w-3.5 h-3.5 text-[#88171B] shrink-0" />
                          <span className="max-w-[160px] truncate" title={item.location}>
                            {item.location}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-slate-900">
                        <div>
                          <p className="font-medium text-xs text-slate-900">{item.authorName}</p>
                          <span className="text-[11px] text-slate-400">{item.authorRole}</span>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-slate-500 text-xs whitespace-nowrap">
                        {formatDate(item.date || item.createdAt)}
                      </td>
                      <td className="py-4 px-4 whitespace-nowrap">
                        <StatusBadge status={item.status} type="item" />
                      </td>
                      <td className="py-4 px-4 text-right whitespace-nowrap">
                        <Link
                          to={`/items/${item.id}`}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-[#88171B] text-xs font-semibold border border-slate-200 transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          Xem bài
                        </Link>
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
                  currentPage={page}
                  totalPages={totalPages}
                  onPageChange={setPage}
                />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
