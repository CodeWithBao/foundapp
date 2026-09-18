import { useState, useEffect, useMemo } from 'react';
import { Plus, Edit2, Trash2, MapPin, Search, Building2 } from 'lucide-react';
import adminService from '../../services/adminService';
import itemService from '../../services/itemService';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import { Modal, ConfirmModal } from '../../components/common/Modal';
import Pagination from '../../components/common/Pagination';
import EmptyState from '../../components/common/EmptyState';
import { toast } from 'sonner';

export default function AdminLocations() {
  const [locations, setLocations] = useState([]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const perPage = 10;

  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [form, setForm] = useState({ name: '', building: '' });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [locs, posts] = await Promise.all([
        adminService.getLocations(),
        itemService.getItems()
      ]);
      setLocations(locs);
      setItems(posts);
    } catch (err) {
      toast.error(err.message || 'Lỗi khi tải dữ liệu địa điểm');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!form.name.trim()) {
      toast.error('Vui lòng nhập tên địa điểm');
      return;
    }
    try {
      if (editItem) {
        await adminService.updateLocation(editItem.id, form);
        toast.success(`Đã cập nhật địa điểm ${form.name}`);
      } else {
        await adminService.addLocation(form);
        toast.success(`Đã thêm địa điểm mới ${form.name}`);
      }
      setShowModal(false);
      setEditItem(null);
      setForm({ name: '', building: '' });
      loadData();
    } catch (err) {
      toast.error(err.message || 'Có lỗi xảy ra');
    }
  };

  const handleEdit = (loc) => {
    setEditItem(loc);
    setForm({ name: loc.name, building: loc.building || '' });
    setShowModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteId) return;
    try {
      await adminService.deleteLocation(deleteId);
      toast.success('Đã xóa địa điểm thành công');
      loadData();
    } catch (err) {
      toast.error(err.message || 'Không thể xóa địa điểm');
    } finally {
      setDeleteId(null);
    }
  };

  // Map location to number of posts
  const locItemCounts = useMemo(() => {
    const counts = {};
    items.forEach(item => {
      if (item.location) {
        counts[item.location] = (counts[item.location] || 0) + 1;
      }
    });
    return counts;
  }, [items]);

  const filtered = useMemo(() => {
    if (!search.trim()) return locations;
    const s = search.toLowerCase();
    return locations.filter(l =>
      String(l.id || '').toLowerCase().includes(s) ||
      l.name?.toLowerCase().includes(s) ||
      l.building?.toLowerCase().includes(s)
    );
  }, [locations, search]);

  const totalPages = Math.ceil(filtered.length / perPage) || 1;
  const paginated = useMemo(() => {
    return filtered.slice((page - 1) * perPage, page * perPage);
  }, [filtered, page, perPage]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-dark">Quản lý địa điểm campus DNTU</h1>
          <p className="text-sm text-warm-gray-500">
            Danh sách tòa nhà, phòng học, khu vực chức năng trong khuôn viên trường
          </p>
        </div>
        <Button
          onClick={() => {
            setEditItem(null);
            setForm({ name: '', building: '' });
            setShowModal(true);
          }}
          className="shrink-0"
        >
          <Plus className="w-4 h-4 mr-2" />
          Thêm địa điểm
        </Button>
      </div>

      <div className="card p-4 flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-warm-gray-400" />
          <input
            type="text"
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            placeholder="Tìm theo mã, tên địa điểm hoặc tòa nhà..."
            className="w-full pl-10 pr-4 py-2 bg-cream-100 border border-cream-300 rounded-button text-sm text-text-dark placeholder-warm-gray-400 focus:outline-none focus:ring-2 focus:ring-burgundy-500/20 focus:border-burgundy-700 transition-colors"
          />
        </div>
        <div className="flex items-center gap-2 px-3 text-sm text-warm-gray-500 border border-cream-300 bg-cream-100 rounded-button shrink-0">
          <Building2 className="w-4 h-4" />
          {filtered.length} Khu vực
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-warm-gray-600">
            <thead className="bg-cream-200 text-warm-gray-700 uppercase text-xs font-semibold">
              <tr>
                <th className="px-6 py-3.5">Mã</th>
                <th className="px-6 py-3.5">Tên địa điểm</th>
                <th className="px-6 py-3.5">Tòa nhà / Khu vực</th>
                <th className="px-6 py-3.5 text-center">Số bài đăng liên quan</th>
                <th className="px-6 py-3.5 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cream-300">
              {loading ? (
                [1, 2, 3, 4].map(i => (
                  <tr key={i}>
                    <td colSpan={5} className="px-6 py-4">
                      <div className="h-6 bg-cream-200 rounded animate-pulse" />
                    </td>
                  </tr>
                ))
              ) : paginated.length > 0 ? (
                paginated.map(loc => {
                  const postCount = locItemCounts[loc.name] || 0;
                  return (
                    <tr key={loc.id} className="hover:bg-cream-100 transition-colors">
                      <td className="px-6 py-4 font-mono text-xs font-bold text-burgundy-900 whitespace-nowrap">
                        {loc.id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded bg-burgundy-100 text-burgundy-800 flex items-center justify-center shrink-0">
                            <MapPin className="w-3.5 h-3.5" />
                          </div>
                          <span className="font-semibold text-text-dark">{loc.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-mono font-medium bg-cream-200 text-warm-gray-700 border border-cream-300">
                          {loc.building || '—'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="inline-flex items-center justify-center px-2 py-0.5 text-xs font-bold rounded-full bg-cream-200 text-warm-gray-700">
                          {postCount}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleEdit(loc)}
                            className="p-1.5 rounded text-blue-600 hover:bg-blue-50 transition-colors"
                            title="Sửa địa điểm"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeleteId(loc.id)}
                            className="p-1.5 rounded text-red-600 hover:bg-red-50 transition-colors"
                            title="Xóa địa điểm"
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
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <EmptyState icon={MapPin} title="Không tìm thấy địa điểm nào" />
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

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

      <Modal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setEditItem(null);
        }}
        title={editItem ? 'Sửa địa điểm campus' : 'Thêm địa điểm campus mới'}
        size="sm"
      >
        <div className="space-y-4">
          <Input
            label="Tên địa điểm"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="VD: Giảng đường A"
            autoFocus
          />
          <Input
            label="Tòa nhà / Khu vực (Ký hiệu)"
            value={form.building}
            onChange={(e) => setForm({ ...form, building: e.target.value })}
            placeholder="VD: GĐ-A"
          />

          <div className="flex justify-end gap-3 pt-4 border-t border-cream-200 mt-2">
            <Button variant="ghost" onClick={() => setShowModal(false)}>
              Hủy
            </Button>
            <Button onClick={handleSubmit}>
              {editItem ? 'Cập nhật' : 'Thêm mới'}
            </Button>
          </div>
        </div>
      </Modal>

      <ConfirmModal
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDeleteConfirm}
        title="Xác nhận xóa"
        message="Bạn có chắc chắn muốn xóa địa điểm này? Các bài đăng cũ gắn với địa điểm này vẫn sẽ giữ nguyên."
        confirmText="Xóa địa điểm"
        variant="danger"
      />
    </div>
  );
}
