import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Trash2, Eye, MapPin, Calendar, Tag, CheckCircle2, Edit3, Save } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import itemService from '../../services/itemService';
import { StatusBadge } from '../../components/common/Badge';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import Textarea from '../../components/common/Textarea';
import EmptyState from '../../components/common/EmptyState';
import Modal, { ConfirmModal } from '../../components/common/Modal';
import Tabs from '../../components/common/Tabs';
import PageHeader from '../../components/common/PageHeader';
import { STORAGE_KEYS } from '../../constants';
import storageService from '../../services/storageService';
import { formatDate } from '../../utils';
import { toast } from 'sonner';

export default function MyPostsPage() {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState(null);
  const [closeItem, setCloseItem] = useState(null);
  const [editItem, setEditItem] = useState(null);
  const [editForm, setEditForm] = useState({ title: '', location: '', category: '', feature: '', description: '' });
  const [updating, setUpdating] = useState(false);
  const [activeTab, setActiveTab] = useState('LOST');

  const categories = storageService.get(STORAGE_KEYS.CATEGORIES) || [];
  const locations = storageService.get(STORAGE_KEYS.LOCATIONS) || [];

  useEffect(() => {
    if (user?.id) loadItems();
  }, [user?.id]);

  const loadItems = async () => {
    setLoading(true);
    try {
      const data = await itemService.getItemsByUser(user.id);
      setItems(data || []);
    } catch (err) {
      toast.error(err.message || 'Lỗi khi tải bài đăng');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      await itemService.deleteItem(deleteId);
      setItems(prev => prev.filter(i => i.id !== deleteId));
      toast.success('Đã xóa bài đăng thành công');
    } catch (err) {
      toast.error(err.message || 'Không thể xóa bài');
    } finally {
      setDeleteId(null);
    }
  };

  const handleClosePost = async () => {
    if (!closeItem) return;
    try {
      const nextStatus = closeItem.type === 'LOST' ? 'RETURNED' : 'CLOSED';
      await itemService.updateItem(closeItem.id, { status: nextStatus });
      setItems(prev => prev.map(i => i.id === closeItem.id ? { ...i, status: nextStatus } : i));
      toast.success('Đã đóng bài đăng thành công');
    } catch (err) {
      toast.error(err.message || 'Lỗi cập nhật');
    } finally {
      setCloseItem(null);
    }
  };

  const handleOpenEdit = (item) => {
    setEditItem(item);
    setEditForm({
      title: item.title || '',
      location: item.location || '',
      category: item.category || '',
      feature: item.feature || '',
      description: item.description || '',
    });
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editForm.title.trim()) {
      toast.error('Tên vật phẩm không được để trống');
      return;
    }
    setUpdating(true);
    try {
      const updated = await itemService.updateItem(editItem.id, editForm);
      setItems(prev => prev.map(i => i.id === editItem.id ? { ...i, ...updated } : i));
      toast.success('Cập nhật bài đăng thành công');
      setEditItem(null);
    } catch (err) {
      toast.error(err.message || 'Lỗi khi lưu bài đăng');
    } finally {
      setUpdating(false);
    }
  };

  const tabs = [
    { key: 'LOST', label: `Đồ đã mất (${items.filter(i => i.type === 'LOST').length})` },
    { key: 'FOUND', label: `Đồ nhặt được (${items.filter(i => i.type === 'FOUND').length})` },
  ];

  const filtered = items.filter(i => i.type === activeTab);

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-burgundy-900">Quản lý bài đăng của tôi</h1>
          <p className="text-sm text-warm-gray-500 mt-1">Theo dõi tiến độ, chỉnh sửa hoặc đóng các tin báo đồ bạn đã đăng.</p>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/report-lost">
            <Button size="sm" className="btn-primary shadow-sm">
              <Plus className="w-4 h-4 mr-1" /> Báo mất đồ
            </Button>
          </Link>
          <Link to="/report-found">
            <Button size="sm" variant="secondary" className="shadow-sm">
              <Plus className="w-4 h-4 mr-1" /> Báo nhặt được
            </Button>
          </Link>
        </div>
      </div>

      <div className="mb-6">
        <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="card p-5 animate-pulse h-32" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          title={`Chưa có bài ${activeTab === 'LOST' ? 'báo mất' : 'báo nhặt được'}`}
          description="Bạn chưa tạo bài đăng nào trong danh mục này. Hãy tạo bài đăng để cộng đồng DNTU UniFind cùng hỗ trợ."
        />
      ) : (
        <div className="space-y-4">
          {filtered.map(item => {
            const isClosed = ['RETURNED', 'CLOSED'].includes(item.status);

            return (
              <div key={item.id} className="card p-5 hover:shadow-card-hover transition-all duration-200">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-4 min-w-0 flex-1">
                    <img
                      src={item.images?.[0] || 'https://placehold.co/120x120/png?text=Item'}
                      alt={item.title}
                      className="w-20 h-20 rounded-card object-cover border border-cream-300 shrink-0 bg-white shadow-xs"
                      onError={e => { e.target.src = 'https://placehold.co/120x120/png?text=Item'; }}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <StatusBadge status={item.status} />
                        <span className="text-xs text-warm-gray-400 font-medium">
                          • Ngày đăng: {formatDate(item.createdAt || item.date)}
                        </span>
                        <span className="text-xs text-warm-gray-500 bg-cream-200 px-2 py-0.5 rounded-full flex items-center gap-1 font-medium">
                          <Eye className="w-3 h-3 text-warm-gray-600" /> {item.views || 0} lượt xem
                        </span>
                      </div>
                      
                      <Link to={`/items/${item.id}`} className="font-bold text-text-dark hover:text-burgundy-700 text-base truncate block transition-colors">
                        {item.title}
                      </Link>

                      <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-xs text-warm-gray-500">
                        <span className="flex items-center gap-1"><Tag className="w-3.5 h-3.5 text-burgundy-600" />{item.category}</span>
                        <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5 text-burgundy-600" />{item.location}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions: Chỉnh sửa, Đóng bài, Xóa, Xem chi tiết */}
                  <div className="flex items-center gap-2 w-full sm:w-auto justify-end border-t sm:border-t-0 pt-3 sm:pt-0 border-cream-200">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleOpenEdit(item)}
                      className="text-warm-gray-600 hover:text-burgundy-700"
                    >
                      <Edit3 className="w-4 h-4 mr-1" /> Sửa
                    </Button>

                    {!isClosed && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setCloseItem(item)}
                        className="text-emerald-700 border-emerald-300 hover:bg-emerald-50 whitespace-nowrap"
                      >
                        <CheckCircle2 className="w-4 h-4 mr-1.5" />
                        {item.type === 'LOST' ? 'Đã tìm thấy' : 'Đã trả lại'}
                      </Button>
                    )}

                    <Link to={`/items/${item.id}`}>
                      <Button size="sm" variant="ghost" className="text-warm-gray-600 hover:text-burgundy-700">
                        <Eye className="w-4 h-4" />
                      </Button>
                    </Link>

                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-dntu-danger hover:bg-red-50"
                      onClick={() => setDeleteId(item.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Edit Post Modal */}
      {editItem && (
        <Modal
          isOpen={!!editItem}
          onClose={() => setEditItem(null)}
          title="Chỉnh sửa bài đăng"
        >
          <form onSubmit={handleSaveEdit} className="space-y-4 pt-2">
            <Input
              label="Tên vật phẩm *"
              value={editForm.title}
              onChange={e => setEditForm(p => ({ ...p, title: e.target.value }))}
              required
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Select
                label="Danh mục *"
                options={[{ value: '', label: '-- Chọn danh mục --' }, ...categories.map(c => ({ value: c.name, label: c.name }))]}
                value={editForm.category}
                onChange={e => setEditForm(p => ({ ...p, category: e.target.value }))}
              />
              <Select
                label="Địa điểm *"
                options={[{ value: '', label: '-- Chọn địa điểm --' }, ...locations.map(l => ({ value: l.name, label: l.name }))]}
                value={editForm.location}
                onChange={e => setEditForm(p => ({ ...p, location: e.target.value }))}
              />
            </div>

            <Input
              label="Đặc điểm nhận dạng"
              value={editForm.feature}
              onChange={e => setEditForm(p => ({ ...p, feature: e.target.value }))}
            />

            <Textarea
              label="Mô tả chi tiết"
              value={editForm.description}
              onChange={e => setEditForm(p => ({ ...p, description: e.target.value }))}
              rows={3}
            />

            <div className="flex justify-end gap-3 pt-4 border-t border-cream-200">
              <Button type="button" variant="ghost" onClick={() => setEditItem(null)}>
                Hủy bỏ
              </Button>
              <Button type="submit" loading={updating} className="btn-primary">
                <Save className="w-4 h-4 mr-1.5" /> Lưu thay đổi
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Close/Resolve Confirm Modal */}
      <ConfirmModal
        isOpen={!!closeItem}
        onClose={() => setCloseItem(null)}
        onConfirm={handleClosePost}
        title="Đóng bài đăng"
        message={
          closeItem?.type === 'LOST'
            ? 'Bạn đã tìm lại được món đồ này? Bài đăng sẽ chuyển sang trạng thái "Đã tìm thấy/Đã trả" và đóng lại.'
            : 'Bạn đã trao trả món đồ này cho người đánh mất hoặc bộ phận hỗ trợ? Bài đăng sẽ hoàn tất.'
        }
        confirmText="Xác nhận đóng bài"
      />

      {/* Delete Confirm Modal */}
      <ConfirmModal
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Xóa bài đăng"
        message="Bạn có chắc chắn muốn xóa vĩnh viễn bài đăng này? Mọi dữ liệu liên quan sẽ không thể khôi phục."
        confirmText="Xóa vĩnh viễn"
        variant="danger"
      />
    </div>
  );
}
