import { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import { Plus, Trash2, Eye, MapPin, Tag, CheckCircle2, Edit3, Save } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import itemService from '../../services/itemService';
import adminService from '../../services/adminService';
import { StatusBadge } from '../../components/common/Badge';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import Textarea from '../../components/common/Textarea';
import EmptyState from '../../components/common/EmptyState';
import LoadingSkeleton from '../../components/common/LoadingSkeleton';
import Modal, { ConfirmModal } from '../../components/common/Modal';
import Tabs from '../../components/common/Tabs';
import { formatDate, isSameEntityId } from '../../utils';
import { toast } from 'sonner';

export default function MyPostsPage() {
  const { user } = useAuth();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const processedEditIdRef = useRef(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState(null);
  const [closeItem, setCloseItem] = useState(null);
  const [editItem, setEditItem] = useState(null);
  const [editForm, setEditForm] = useState({ title: '', location: '', category: '', feature: '', description: '' });
  const [updating, setUpdating] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [closing, setClosing] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const [closeError, setCloseError] = useState('');
  const [activeTab, setActiveTab] = useState(() => location.state?.createdItemType === 'FOUND' ? 'FOUND' : 'LOST');

  const [categories, setCategories] = useState([]);
  const [locations, setLocations] = useState([]);

  useEffect(() => {
    if (user?.id) loadItems();
  }, [user?.id]);

  useEffect(() => {
    let live = true;
    Promise.all([
      adminService.getCategories(),
      adminService.getLocations(),
    ]).then(([categoryRows, locationRows]) => {
      if (!live) return;
      setCategories(categoryRows || []);
      setLocations(locationRows || []);
    }).catch(() => {});
    return () => { live = false; };
  }, []);

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
    if (!deleteId || deleting) return;
    setDeleting(true);
    setDeleteError('');
    try {
      await itemService.deleteItem(deleteId);
      setItems(prev => prev.filter(i => i.id !== deleteId));
      toast.success('Đã xóa bài đăng thành công');
      setDeleteId(null);
    } catch (err) {
      const message = err.isUncertain
        ? 'Chưa xác minh được bài đã xóa hay chưa. Vui lòng giữ hộp thoại và thử kiểm tra lại.'
        : err.message || 'Không thể xóa bài';
      setDeleteError(message);
      toast.error(message);
    } finally {
      setDeleting(false);
    }
  };

  const handleClosePost = async () => {
    if (!closeItem || closing) return;
    setClosing(true);
    setCloseError('');
    try {
      const nextStatus = closeItem.type === 'LOST' ? 'RETURNED' : 'CLOSED';
      await itemService.updateItem(closeItem.id, { status: nextStatus });
      setItems(prev => prev.map(i => i.id === closeItem.id ? { ...i, status: nextStatus } : i));
      toast.success('Đã đóng bài đăng thành công');
      setCloseItem(null);
    } catch (err) {
      const message = err.isUncertain
        ? 'Chưa xác minh được trạng thái bài đăng. Dữ liệu hiện tại vẫn được giữ nguyên.'
        : err.message || 'Lỗi cập nhật';
      setCloseError(message);
      toast.error(message);
    } finally {
      setClosing(false);
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

  useEffect(() => {
    const editId = searchParams.get('edit');
    if (loading || !editId || processedEditIdRef.current === editId) return;
    const targetItem = items.find(item => isSameEntityId(item.id, editId));
    if (!targetItem) return;
    processedEditIdRef.current = editId;
    setActiveTab(targetItem.type);
    handleOpenEdit(targetItem);
  }, [items, loading, searchParams]);

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
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <span className="label-micro text-[#AD222B]">Hồ sơ cá nhân</span>
          <h1 className="page-title text-3xl font-serif text-[#1C2530] mt-0.5">Quản lý bài đăng của tôi</h1>
          <p className="text-sm text-[#5B6574] mt-1">Theo dõi tiến độ, chỉnh sửa hoặc hoàn tất các tin báo đồ bạn đã đăng.</p>
        </div>
        <div className="grid w-full grid-cols-1 gap-3 min-[360px]:grid-cols-2 sm:flex sm:w-auto sm:items-center">
          <Link to="/report-lost" className="min-w-0">
            <Button size="sm" className="btn-primary min-h-11 w-full shadow-xs sm:w-auto">
              <Plus className="w-4 h-4 mr-1.5" /> Báo mất đồ
            </Button>
          </Link>
          <Link to="/report-found" className="min-w-0">
            <Button size="sm" variant="secondary" className="min-h-11 w-full shadow-xs sm:w-auto">
              <Plus className="w-4 h-4 mr-1.5" /> Báo nhặt được
            </Button>
          </Link>
        </div>
      </div>

      <div className="mb-6">
        <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />
      </div>

      {loading ? (
        <LoadingSkeleton type="list" count={3} />
      ) : filtered.length === 0 ? (
        <div className="surface p-8 text-center">
          <EmptyState
            title={`Chưa có bài ${activeTab === 'LOST' ? 'báo mất' : 'báo nhặt được'}`}
            description="Bạn chưa tạo bài đăng nào trong danh mục này. Hãy tạo bài đăng để cộng đồng DNTU UniFind cùng hỗ trợ."
          />
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map(item => {
            const isClosed = ['RETURNED', 'CLOSED'].includes(item.status);

            return (
              <article key={item.id} className="surface min-w-0 p-4 transition-all duration-200 hover:shadow-card-hover sm:p-5">
                <div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-[5rem_minmax(0,1fr)] lg:grid-cols-[5rem_minmax(0,1fr)_auto] lg:items-center">
                  <img
                    src={item.images?.[0] || 'https://placehold.co/640x400/png?text=Item'}
                    alt={item.title}
                    className="aspect-[16/10] h-auto w-full max-w-full rounded-xl border border-[#E0E2E6] bg-[#FAF8F2] object-cover shadow-xs sm:aspect-square sm:h-20 sm:w-20"
                    onError={e => { e.target.src = 'https://placehold.co/640x400/png?text=Item'; }}
                  />

                  <div className="min-w-0">
                    <div className="mb-2 flex min-w-0 flex-wrap items-center gap-2">
                      <StatusBadge status={item.status} />
                      <span className="whitespace-nowrap text-[11px] font-mono text-[#8C95A3]">
                        {formatDate(item.createdAt || item.date)}
                      </span>
                      <span className="inline-flex items-center gap-1 whitespace-nowrap rounded-full border border-[#E0E2E6] bg-[#FAF8F2] px-2 py-0.5 text-[11px] font-mono text-[#5B6574]">
                        <Eye className="h-3 w-3 shrink-0 text-[#8C95A3]" /> {item.views || 0}
                      </span>
                    </div>

                    <Link to={`/items/${item.id}`} className="block min-w-0 break-words text-base font-semibold leading-snug text-[#1C2530] transition-colors hover:text-[#AD222B] sm:truncate">
                      {item.title}
                    </Link>

                    <div className="mt-2 grid min-w-0 grid-cols-1 gap-1.5 text-xs text-[#5B6574] min-[430px]:grid-cols-2">
                      <span className="flex min-w-0 items-start gap-1.5">
                        <Tag className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#AD222B]" />
                        <span className="min-w-0 break-words">{item.category}</span>
                      </span>
                      <span className="flex min-w-0 items-start gap-1.5">
                        <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#AD222B]" />
                        <span className="min-w-0 break-words">{item.location}</span>
                      </span>
                    </div>
                  </div>

                  {/* Actions: Chỉnh sửa, Đóng bài, Xóa, Xem chi tiết */}
                  <div className="grid w-full min-w-0 grid-cols-2 gap-2 border-t border-[#E0E2E6] pt-3 min-[430px]:grid-cols-4 sm:col-span-2 lg:col-span-1 lg:flex lg:w-auto lg:items-center lg:justify-end lg:border-t-0 lg:pt-0">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleOpenEdit(item)}
                      className="min-h-11 w-full text-[#5B6574] hover:text-[#AD222B] lg:w-auto"
                    >
                      <Edit3 className="w-4 h-4 mr-1" /> Sửa
                    </Button>

                    {!isClosed && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setCloseItem(item)}
                        className="min-h-11 w-full whitespace-nowrap border-emerald-300 text-xs font-medium text-emerald-700 hover:bg-emerald-50 lg:w-auto"
                      >
                        <CheckCircle2 className="w-4 h-4 mr-1.5" />
                        {item.type === 'LOST' ? 'Đã tìm thấy' : 'Đã trả lại'}
                      </Button>
                    )}

                    <Link to={`/items/${item.id}`} className="min-w-0">
                      <Button size="sm" variant="ghost" className="min-h-11 w-full text-[#5B6574] hover:text-[#AD222B] lg:w-auto" aria-label={`Xem bài ${item.title}`}>
                        <Eye className="w-4 h-4" /> <span className="lg:sr-only">Xem</span>
                      </Button>
                    </Link>

                    <Button
                      size="sm"
                      variant="ghost"
                      className="min-h-11 w-full text-red-600 hover:bg-red-50 lg:w-auto"
                      onClick={() => setDeleteId(item.id)}
                      aria-label={`Xóa bài ${item.title}`}
                    >
                      <Trash2 className="w-4 h-4" /> <span className="lg:sr-only">Xóa</span>
                    </Button>
                  </div>
                </div>
              </article>
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
          closeDisabled={updating}
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
              <Button type="button" variant="ghost" onClick={() => setEditItem(null)} disabled={updating}>
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
        loading={closing}
        loadingText="Đang cập nhật…"
        error={closeError}
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
        loading={deleting}
        loadingText="Đang xóa…"
        error={deleteError}
      />
    </div>
  );
}
