import { useState, useEffect, useMemo } from 'react';
import { Plus, Edit2, Trash2, Tag, Search, LayoutGrid } from 'lucide-react';
import adminService from '../../services/adminService';
import itemService from '../../services/itemService';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import { Modal, ConfirmModal } from '../../components/common/Modal';
import Pagination from '../../components/common/Pagination';
import EmptyState from '../../components/common/EmptyState';
import { toast } from 'sonner';

export default function AdminCategories() {
  const [categories, setCategories] = useState([]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const perPage = 10;

  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [form, setForm] = useState({ name: '', icon: '📦' });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [cats, posts] = await Promise.all([
        adminService.getCategories(),
        itemService.getItems()
      ]);
      setCategories(cats);
      setItems(posts);
    } catch (err) {
      toast.error(err.message || 'Lỗi khi tải dữ liệu');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!form.name.trim()) {
      toast.error('Vui lòng nhập tên danh mục');
      return;
    }
    if (!form.icon.trim()) {
      toast.error('Vui lòng nhập emoji icon');
      return;
    }
    
    try {
      if (editItem) {
        await adminService.updateCategory(editItem.id, form);
        toast.success(`Đã cập nhật danh mục ${form.name}`);
      } else {
        await adminService.addCategory(form);
        toast.success(`Đã thêm danh mục mới ${form.name}`);
      }
      setShowModal(false);
      setEditItem(null);
      setForm({ name: '', icon: '📦' });
      loadData();
    } catch (err) {
      toast.error(err.message || 'Có lỗi xảy ra');
    }
  };

  const handleEdit = (cat) => {
    setEditItem(cat);
    setForm({ name: cat.name, icon: cat.icon || '📦' });
    setShowModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteId) return;
    try {
      await adminService.deleteCategory(deleteId);
      toast.success('Đã xóa danh mục thành công');
      loadData();
    } catch (err) {
      toast.error(err.message || 'Không thể xóa danh mục');
    } finally {
      setDeleteId(null);
    }
  };

  // Map category to number of items
  const catItemCounts = useMemo(() => {
    const counts = {};
    items.forEach(item => {
      if (item.category) {
        // match by name because items.category is storing name currently
        counts[item.category] = (counts[item.category] || 0) + 1;
      }
    });
    return counts;
  }, [items]);

  const filtered = useMemo(() => {
    if (!search.trim()) return categories;
    const s = search.toLowerCase();
    return categories.filter(c =>
      c.id?.toLowerCase().includes(s) ||
      c.name?.toLowerCase().includes(s)
    );
  }, [categories, search]);

  const totalPages = Math.ceil(filtered.length / perPage) || 1;
  const paginated = useMemo(() => {
    return filtered.slice((page - 1) * perPage, page * perPage);
  }, [filtered, page, perPage]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-dark">Quản lý danh mục</h1>
          <p className="text-sm text-warm-gray-500">
            Thêm, sửa, xóa các loại vật phẩm để phân loại bài đăng
          </p>
        </div>
        <Button
          onClick={() => {
            setEditItem(null);
            setForm({ name: '', icon: '📦' });
            setShowModal(true);
          }}
          className="shrink-0"
        >
          <Plus className="w-4 h-4 mr-2" />
          Thêm danh mục
        </Button>
      </div>

      <div className="card p-4 flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-warm-gray-400" />
          <input
            type="text"
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            placeholder="Tìm theo mã hoặc tên danh mục..."
            className="w-full pl-10 pr-4 py-2 bg-cream-100 border border-cream-300 rounded-button text-sm text-text-dark placeholder-warm-gray-400 focus:outline-none focus:ring-2 focus:ring-burgundy-500/20 focus:border-burgundy-700 transition-colors"
          />
        </div>
        <div className="flex items-center gap-2 px-3 text-sm text-warm-gray-500 border border-cream-300 bg-cream-100 rounded-button shrink-0">
          <LayoutGrid className="w-4 h-4" />
          {filtered.length} Danh mục
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-warm-gray-600">
            <thead className="bg-cream-200 text-warm-gray-700 uppercase text-xs font-semibold">
              <tr>
                <th className="px-6 py-3.5">Mã DM</th>
                <th className="px-6 py-3.5 text-center">Icon</th>
                <th className="px-6 py-3.5">Tên danh mục</th>
                <th className="px-6 py-3.5 text-center">Số bài đăng</th>
                <th className="px-6 py-3.5 text-center">Trạng thái</th>
                <th className="px-6 py-3.5 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cream-300">
              {loading ? (
                [1, 2, 3, 4].map(i => (
                  <tr key={i}>
                    <td colSpan={6} className="px-6 py-4">
                      <div className="h-6 bg-cream-200 rounded animate-pulse" />
                    </td>
                  </tr>
                ))
              ) : paginated.length > 0 ? (
                paginated.map(cat => {
                  const count = catItemCounts[cat.name] || 0;
                  return (
                    <tr key={cat.id} className="hover:bg-cream-100 transition-colors">
                      <td className="px-6 py-4 font-mono text-xs font-bold text-burgundy-900 whitespace-nowrap">
                        {cat.id}
                      </td>
                      <td className="px-6 py-4 text-center text-xl">
                        {cat.icon || '📦'}
                      </td>
                      <td className="px-6 py-4 font-semibold text-text-dark whitespace-nowrap">
                        {cat.name}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="inline-flex items-center justify-center px-2 py-0.5 text-xs font-bold rounded-full bg-cream-200 text-warm-gray-700">
                          {count}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                          Hoạt động
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleEdit(cat)}
                            className="p-1.5 rounded text-blue-600 hover:bg-blue-50 transition-colors"
                            title="Sửa danh mục"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeleteId(cat.id)}
                            className="p-1.5 rounded text-red-600 hover:bg-red-50 transition-colors"
                            title="Xóa danh mục"
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
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <EmptyState icon={Tag} title="Không tìm thấy danh mục" />
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
        title={editItem ? 'Sửa danh mục' : 'Thêm danh mục mới'}
        size="sm"
      >
        <div className="space-y-4">
          <Input
            label="Tên danh mục"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="Nhập tên, VD: Chìa khóa"
            autoFocus
          />
          <Input
            label="Emoji Icon"
            value={form.icon}
            onChange={(e) => setForm({ ...form, icon: e.target.value })}
            placeholder="Nhập một emoji, VD: 🔑"
            maxLength={2}
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
        message="Bạn có chắc chắn muốn xóa danh mục này? Các bài đăng thuộc danh mục này vẫn sẽ giữ nguyên nhưng tên danh mục cũ sẽ không thể tìm thấy trong bộ lọc."
        confirmText="Xóa danh mục"
        variant="danger"
      />
    </div>
  );
}
