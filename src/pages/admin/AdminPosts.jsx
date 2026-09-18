import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Search, Package, Trash2, Eye, Filter, Calendar, User, Ban, CheckCircle } from 'lucide-react';
import itemService from '../../services/itemService';
import { StatusBadge, ItemTypeBadge } from '../../components/common/Badge';
import Select from '../../components/common/Select';
import Button from '../../components/common/Button';
import Pagination from '../../components/common/Pagination';
import EmptyState from '../../components/common/EmptyState';
import { ConfirmModal } from '../../components/common/Modal';
import { formatDate } from '../../utils';
import { toast } from 'sonner';

export default function AdminPosts() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [deleteItemObj, setDeleteItemObj] = useState(null);
  const perPage = 10;

  useEffect(() => {
    loadItems();
  }, [typeFilter, statusFilter]);

  const loadItems = async () => {
    setLoading(true);
    try {
      const data = await itemService.getItems({ type: typeFilter, status: statusFilter });
      setItems(data);
    } catch (err) {
      toast.error(err.message || 'Lỗi khi tải danh sách bài đăng');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteItemObj) return;
    try {
      await itemService.deleteItem(deleteItemObj.id);
      setItems(prev => prev.filter(i => i.id !== deleteItemObj.id));
      toast.success(`Đã xóa thành công bài đăng ${deleteItemObj.id}`);
    } catch (err) {
      toast.error(err.message || 'Không thể xóa bài đăng');
    } finally {
      setDeleteItemObj(null);
    }
  };

  const handleToggleStatus = async (item) => {
    try {
      const newStatus = item.status === 'RETURNED' ? (item.type || 'LOST') : 'RETURNED';
      await itemService.updateItem(item.id, { status: newStatus });
      setItems(prev => prev.map(i => i.id === item.id ? { ...i, status: newStatus } : i));
      toast.success(newStatus === 'RETURNED' ? `Đã đóng/khóa bài ${item.id}` : `Đã mở lại bài ${item.id}`);
    } catch (err) {
      toast.error(err.message || 'Không thể cập nhật trạng thái');
    }
  };

  const filtered = useMemo(() => {
    if (!search.trim()) return items;
    const s = search.toLowerCase();
    return items.filter(
      i =>
        String(i.id || '').toLowerCase().includes(s) ||
        i.title?.toLowerCase().includes(s) ||
        i.userName?.toLowerCase().includes(s) ||
        i.category?.toLowerCase().includes(s) ||
        i.location?.toLowerCase().includes(s)
    );
  }, [items, search]);

  const totalPages = Math.ceil(filtered.length / perPage) || 1;
  const paginated = useMemo(() => {
    return filtered.slice((page - 1) * perPage, page * perPage);
  }, [filtered, page, perPage]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-dark">Quản lý bài đăng toàn hệ thống</h1>
          <p className="text-sm text-warm-gray-500">
            Giám sát, tìm kiếm và quản lý tất cả bài báo mất & báo nhặt trên DNTU UniFind
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold px-3 py-1.5 bg-cream-200 text-warm-gray-700 rounded-full border border-cream-300">
            Tổng: {items.length} bài đăng
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
            placeholder="Tìm theo mã (P0XX), tên vật phẩm, người đăng..."
            className="w-full pl-10 pr-4 py-2 bg-cream-100 border border-cream-300 rounded-button text-sm text-text-dark placeholder-warm-gray-400 focus:outline-none focus:ring-2 focus:ring-burgundy-500/20 focus:border-burgundy-700 transition-colors"
          />
        </div>
        <div className="w-full sm:w-44">
          <Select
            options={[
              { value: 'all', label: 'Tất cả loại bài' },
              { value: 'LOST', label: 'Báo mất đồ' },
              { value: 'FOUND', label: 'Nhặt được đồ' },
            ]}
            value={typeFilter}
            onChange={e => { setTypeFilter(e.target.value); setPage(1); }}
          />
        </div>
        <div className="w-full sm:w-48">
          <Select
            options={[
              { value: 'all', label: 'Tất cả trạng thái' },
              { value: 'LOST', label: 'Đang thất lạc' },
              { value: 'FOUND', label: 'Nhặt được' },
              { value: 'RETURNED', label: 'Đã hoàn trả' },
              { value: 'CLOSED', label: 'Đã đóng' },
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
                <th className="px-6 py-3.5">Mã bài</th>
                <th className="px-6 py-3.5">Tên vật phẩm</th>
                <th className="px-6 py-3.5">Loại bài</th>
                <th className="px-6 py-3.5">Người đăng</th>
                <th className="px-6 py-3.5">Trạng thái</th>
                <th className="px-6 py-3.5">Ngày đăng</th>
                <th className="px-6 py-3.5 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cream-300">
              {loading ? (
                [1, 2, 3, 4, 5].map(i => (
                  <tr key={i}>
                    <td colSpan={7} className="px-6 py-4">
                      <div className="h-6 bg-cream-200 rounded animate-pulse" />
                    </td>
                  </tr>
                ))
              ) : paginated.length > 0 ? (
                paginated.map(item => (
                  <tr key={item.id} className="hover:bg-cream-100 transition-colors">
                    <td className="px-6 py-4 font-mono text-xs font-bold text-burgundy-900 whitespace-nowrap">
                      {item.id}
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3 max-w-xs">
                        {item.images?.[0] ? (
                          <img
                            src={item.images[0]}
                            alt={item.title}
                            className="w-10 h-10 rounded-md object-cover border border-cream-300 shrink-0"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-md bg-cream-200 flex items-center justify-center shrink-0 text-warm-gray-400">
                            <Package className="w-5 h-5" />
                          </div>
                        )}
                        <div className="truncate">
                          <div className="font-semibold text-text-dark truncate" title={item.title}>
                            {item.title}
                          </div>
                          <div className="text-xs text-warm-gray-400 truncate">
                            {item.category || 'Vật phẩm'} • {item.location || 'DNTU'}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      <ItemTypeBadge type={item.type} />
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-text-dark font-medium text-xs flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-warm-gray-400" />
                        {item.userName || 'Ẩn danh'}
                      </div>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      <StatusBadge status={item.status} />
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap text-xs text-warm-gray-500 font-mono">
                      {formatDate(item.createdAt || item.date)}
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          to={`/items/${item.id}`}
                          className="p-1.5 rounded text-warm-gray-500 hover:text-burgundy-800 hover:bg-cream-200 transition-colors"
                          title="Xem chi tiết"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => handleToggleStatus(item)}
                          className={`p-1.5 rounded transition-colors ${
                            item.status === 'RETURNED'
                              ? 'text-emerald-700 hover:bg-emerald-50'
                              : 'text-amber-700 hover:bg-amber-50'
                          }`}
                          title={item.status === 'RETURNED' ? 'Mở lại bài đăng' : 'Đóng / Khóa bài đăng'}
                        >
                          {item.status === 'RETURNED' ? <CheckCircle className="w-4 h-4" /> : <Ban className="w-4 h-4" />}
                        </button>
                        <button
                          onClick={() => setDeleteItemObj(item)}
                          className="p-1.5 rounded text-red-600 hover:bg-red-50 transition-colors"
                          title="Xóa bài đăng"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <EmptyState icon={Package} title="Không tìm thấy bài đăng nào" />
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

      {/* Confirm Delete Modal */}
      <ConfirmModal
        isOpen={!!deleteItemObj}
        onClose={() => setDeleteItemObj(null)}
        onConfirm={handleDeleteConfirm}
        title="Xác nhận xóa bài đăng"
        message={`Bạn có chắc chắn muốn xóa bài đăng mã "${deleteItemObj?.id}" - "${deleteItemObj?.title}" không? Thao tác này không thể hoàn tác.`}
        confirmText="Xóa vĩnh viễn"
        variant="danger"
      />
    </div>
  );
}
