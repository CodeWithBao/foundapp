import { useState, useEffect, useMemo } from 'react';
import {
  Plus, Edit2, Trash2, MapPin, Search, Building2,
  Image as ImageIcon, Star, ArrowUp, ArrowDown, Upload, X, Check
} from 'lucide-react';
import { Link } from 'react-router-dom';
import adminService from '../../services/adminService';
import itemService from '../../services/itemService';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import { Modal, ConfirmModal } from '../../components/common/Modal';
import Pagination from '../../components/common/Pagination';
import EmptyState from '../../components/common/EmptyState';
import { toast } from 'sonner';

const MAP_POINTS = [
  ['A', 'Tòa A (Khu hành chính)'],
  ['B', 'Tòa B (Giảng đường & Lab)'],
  ['C', 'Thư viện / Tòa C'],
  ['D', 'Ký túc xá DNTU (Tòa D)'],
  ['E', 'Khu thể thao E'],
  ['F', 'Tòa F'],
  ['G', 'Tòa G'],
  ['R', 'Viện Nghiên cứu & Tuyển sinh (IRAS)'],
  ['EVENT', 'Sân khấu & Quảng trường sự kiện'],
  ['PARKING', 'Bãi đỗ ô tô & Khách'],
  ['SPORT', 'Sân thể thao Pickleball & Tennis'],
  ['POOL', 'Hồ bơi campus'],
  ['PARK', 'Công viên sáng tạo sinh thái'],
  ['GATE', 'Cổng chính DNTU'],
  ['GATE_IN', 'Lối vào cổng chính'],
  ['GATE_OUT', 'Lối ra cổng chính'],
  ['GATE_SPORT', 'Cổng cạnh khu thể thao'],
  ['GATE2', 'Cổng phụ khu thể thao']
];

const emptyForm = () => ({
  name: '',
  code: '',
  building: '',
  map_key: '',
  description: '',
  image_url: '',
  photos: '[]',
  is_active: true
});

async function shrinkPhoto(file) {
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
    throw new Error('Chỉ nhận ảnh JPG, PNG hoặc WebP');
  }
  const img = await createImageBitmap(file);
  const canvas = document.createElement('canvas');
  const ratio = Math.min(1, 1200 / Math.max(img.width, img.height));
  canvas.width = Math.max(1, Math.round(img.width * ratio));
  canvas.height = Math.max(1, Math.round(img.height * ratio));
  canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
  img.close();
  const data = canvas.toDataURL('image/jpeg', 0.75);
  if (data.length > 900000) {
    throw new Error('Ảnh quá lớn (>900KB); vui lòng chọn ảnh có độ phân giải vừa phải hơn');
  }
  return data;
}

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
  const [form, setForm] = useState(emptyForm);

  // Danh sách ảnh của modal
  const [photoList, setPhotoList] = useState([]);
  const [customUrlInput, setCustomUrlInput] = useState('');
  const [showUrlInput, setShowUrlInput] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [locs, posts] = await Promise.all([
        adminService.getLocations(),
        itemService.getMapItems()
      ]);
      setLocations(Array.isArray(locs) ? locs : []);
      setItems(Array.isArray(posts) ? posts : []);
    } catch (err) {
      toast.error(err.message || 'Lỗi khi tải dữ liệu địa điểm');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (loc) => {
    setEditItem(loc);
    let initialPhotos = [];
    if (loc.photos) {
      try {
        const parsed = typeof loc.photos === 'string' ? JSON.parse(loc.photos) : loc.photos;
        if (Array.isArray(parsed)) {
          initialPhotos = parsed;
        }
      } catch (e) {
        console.warn('Lỗi đọc photos JSON:', e);
      }
    }

    if (initialPhotos.length === 0 && loc.image_url) {
      initialPhotos = [
        {
          id: 'photo_default',
          url: loc.image_url,
          caption: 'Ảnh đại diện hiện tại',
          is_cover: true
        }
      ];
    }

    // Đảm bảo có ít nhất 1 ảnh làm cover nếu list không rỗng
    if (initialPhotos.length > 0 && !initialPhotos.some(p => p.is_cover)) {
      initialPhotos[0].is_cover = true;
    }

    setPhotoList(initialPhotos);
    setForm({
      ...emptyForm(),
      ...loc,
      code: loc.code || String(loc.id),
      photos: JSON.stringify(initialPhotos)
    });
    setShowUrlInput(false);
    setCustomUrlInput('');
    setShowModal(true);
  };

  const handleOpenCreate = () => {
    setEditItem(null);
    setPhotoList([]);
    setForm(emptyForm());
    setShowUrlInput(false);
    setCustomUrlInput('');
    setShowModal(true);
  };

  const handleAddPhotoFromFile = async (file) => {
    if (!file) return;
    try {
      const base64 = await shrinkPhoto(file);
      const newPhoto = {
        id: `photo_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        url: base64,
        caption: '',
        is_cover: photoList.length === 0
      };
      const updated = [...photoList, newPhoto];
      setPhotoList(updated);
      toast.success('Đã thêm ảnh mới');
    } catch (err) {
      toast.error(err.message || 'Không thể tải ảnh này');
    }
  };

  const handleAddPhotoFromUrl = () => {
    const trimmed = customUrlInput.trim();
    if (!trimmed) return;
    const newPhoto = {
      id: `photo_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      url: trimmed,
      caption: '',
      is_cover: photoList.length === 0
    };
    setPhotoList(prev => [...prev, newPhoto]);
    setCustomUrlInput('');
    setShowUrlInput(false);
    toast.success('Đã thêm ảnh từ liên kết');
  };

  const handleSetCoverPhoto = (index) => {
    setPhotoList(prev =>
      prev.map((photo, i) => ({
        ...photo,
        is_cover: i === index
      }))
    );
    toast.success('Đã chọn làm ảnh đại diện');
  };

  const handleRemovePhoto = (index) => {
    setPhotoList(prev => {
      const next = prev.filter((_, i) => i !== index);
      if (next.length > 0 && !next.some(p => p.is_cover)) {
        next[0].is_cover = true;
      }
      return next;
    });
  };

  const handleMovePhoto = (index, direction) => {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= photoList.length) return;
    setPhotoList(prev => {
      const copy = [...prev];
      const temp = copy[index];
      copy[index] = copy[targetIndex];
      copy[targetIndex] = temp;
      return copy;
    });
  };

  const handleCaptionChange = (index, text) => {
    setPhotoList(prev =>
      prev.map((photo, i) => (i === index ? { ...photo, caption: text } : photo))
    );
  };

  const handleSubmit = async () => {
    if (!form.name.trim()) {
      toast.error('Vui lòng nhập tên địa điểm');
      return;
    }
    if (!form.code.trim()) {
      toast.error('Vui lòng nhập mã địa điểm');
      return;
    }

    const coverPhoto = photoList.find(p => p.is_cover) || photoList[0];
    const payload = {
      ...form,
      image_url: coverPhoto ? coverPhoto.url : '',
      photos: JSON.stringify(photoList)
    };

    try {
      if (editItem) {
        await adminService.updateLocation(editItem.id, payload);
        toast.success(`Đã cập nhật địa điểm ${form.name}`);
      } else {
        await adminService.addLocation(payload);
        toast.success(`Đã thêm địa điểm mới ${form.name}`);
      }
      setShowModal(false);
      setEditItem(null);
      setForm(emptyForm());
      setPhotoList([]);
      loadData();
    } catch (err) {
      toast.error(err.message || 'Có lỗi xảy ra khi lưu địa điểm');
    }
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

  const locItemCounts = useMemo(() => {
    const counts = {};
    items.forEach(item => {
      if (!['RETURNED', 'CLOSED'].includes(item.status) && (item.location_id || item.location)) {
        const key = item.location_id || item.location;
        counts[key] = (counts[key] || 0) + 1;
      }
    });
    return counts;
  }, [items]);

  const filtered = useMemo(() => {
    return locations.filter(loc => {
      const q = search.toLowerCase().trim();
      if (!q) return true;
      return (
        loc.name?.toLowerCase().includes(q) ||
        loc.code?.toLowerCase().includes(q) ||
        loc.building?.toLowerCase().includes(q) ||
        loc.map_key?.toLowerCase().includes(q)
      );
    });
  }, [locations, search]);

  const totalPages = Math.ceil(filtered.length / perPage) || 1;
  const paginated = useMemo(() => {
    const start = (page - 1) * perPage;
    return filtered.slice(start, start + perPage);
  }, [filtered, page]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-dark">Quản lý địa điểm campus DNTU</h1>
          <p className="text-sm text-warm-gray-500">
            Quản lý tên, mã địa điểm, điểm trên bản đồ 3D và album ảnh thực tế từng vị trí
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            to="/campus/"
            className="text-sm font-semibold text-burgundy-800 hover:text-burgundy-900 bg-burgundy-50 px-3 py-2 rounded-lg transition-colors border border-burgundy-100"
          >
            Xem bản đồ campus ↗
          </Link>
          <Button onClick={handleOpenCreate} className="shrink-0">
            <Plus className="w-4 h-4 mr-2" />
            Thêm địa điểm
          </Button>
        </div>
      </div>

      <div className="card p-4 flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-warm-gray-400" />
          <input
            type="text"
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            placeholder="Tìm theo tên, mã (TOA_A, SAN_PICKLEBALL), tòa nhà hoặc điểm 3D..."
            className="w-full pl-10 pr-4 py-2 bg-cream-100 border border-cream-300 rounded-button text-sm text-text-dark placeholder-warm-gray-400 focus:outline-none focus:ring-2 focus:ring-burgundy-500/20 focus:border-burgundy-700 transition-colors"
          />
        </div>
        <div className="flex items-center gap-2 px-3 text-sm text-warm-gray-600 border border-cream-300 bg-cream-100 rounded-button shrink-0 font-medium">
          <Building2 className="w-4 h-4 text-burgundy-700" />
          {filtered.length} địa điểm
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-warm-gray-600">
            <thead className="bg-cream-200 text-warm-gray-700 uppercase text-xs font-semibold">
              <tr>
                <th className="px-6 py-3.5">Ảnh thực tế</th>
                <th className="px-6 py-3.5">Tên địa điểm</th>
                <th className="px-6 py-3.5">Mã / Tòa nhà</th>
                <th className="px-6 py-3.5">Điểm bản đồ 3D</th>
                <th className="px-6 py-3.5 text-center">Đồ thất lạc</th>
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
                paginated.map(loc => {
                  const postCount = locItemCounts[loc.id] || locItemCounts[loc.name] || 0;

                  // Parse photos count
                  let photosCount = 0;
                  try {
                    if (loc.photos) {
                      const p = typeof loc.photos === 'string' ? JSON.parse(loc.photos) : loc.photos;
                      if (Array.isArray(p)) photosCount = p.length;
                    }
                  } catch {
                    photosCount = loc.image_url ? 1 : 0;
                  }
                  if (photosCount === 0 && loc.image_url) photosCount = 1;

                  return (
                    <tr key={loc.id} className="hover:bg-cream-100 transition-colors">
                      <td className="px-6 py-3.5 whitespace-nowrap">
                        <div className="relative inline-block">
                          {loc.image_url ? (
                            <img
                              src={loc.image_url}
                              alt={loc.name}
                              onError={(e) => { e.currentTarget.style.display = 'none'; }}
                              className="w-14 h-11 rounded-lg object-cover border border-cream-300 shadow-xs"
                            />
                          ) : (
                            <div className="w-14 h-11 rounded-lg bg-cream-200 flex flex-col items-center justify-center text-warm-gray-400 border border-cream-300">
                              <ImageIcon className="w-4 h-4" />
                              <span className="text-[10px] mt-0.5">Trống</span>
                            </div>
                          )}
                          {photosCount > 1 && (
                            <span className="absolute -bottom-1 -right-1.5 px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-burgundy-900 text-white shadow-xs">
                              +{photosCount - 1}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-semibold text-text-dark">{loc.name}</div>
                        {loc.description && (
                          <p className="text-xs text-warm-gray-400 truncate max-w-xs">{loc.description}</p>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col gap-1 items-start">
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-mono font-bold bg-burgundy-50 text-burgundy-900 border border-burgundy-200">
                            {loc.code || loc.id}
                          </span>
                          {loc.building && (
                            <span className="text-xs text-warm-gray-500 font-medium">
                              Tòa: {loc.building}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {loc.map_key ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                            <MapPin className="w-3 h-3 text-emerald-600" />
                            {loc.map_key}
                          </span>
                        ) : (
                          <span className="text-xs text-warm-gray-400 italic">Chưa gắn</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`inline-flex items-center justify-center px-2.5 py-0.5 text-xs font-bold rounded-full ${
                          postCount > 0 ? 'bg-burgundy-100 text-burgundy-800' : 'bg-cream-200 text-warm-gray-500'
                        }`}>
                          {postCount}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleEdit(loc)}
                            className="p-1.5 rounded text-blue-600 hover:bg-blue-50 transition-colors"
                            title="Sửa địa điểm & quản lý ảnh"
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
                  <td colSpan={6} className="px-6 py-12 text-center">
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
        title={editItem ? `Sửa địa điểm: ${editItem.name}` : 'Thêm địa điểm campus mới'}
        size="lg"
      >
        <div className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Tên địa điểm"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="VD: Sân thể thao Pickleball & Tennis"
              autoFocus
            />
            <Input
              label="Mã địa điểm (Code duy nhất)"
              value={form.code}
              onChange={e => setForm({ ...form, code: e.target.value.trim().toUpperCase().replace(/\s+/g, '_') })}
              placeholder="VD: SAN_PICKLEBALL"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Tòa nhà / Khu vực (Ký hiệu)"
              value={form.building}
              onChange={(e) => setForm({ ...form, building: e.target.value })}
              placeholder="VD: SPORT hoặc GĐ-A"
            />
            <label className="block text-sm font-medium text-text-dark">
              Điểm trên bản đồ 3D
              <select
                className="mt-1.5 w-full rounded-lg border border-cream-300 p-2 text-sm bg-white text-text-dark focus:outline-none focus:ring-2 focus:ring-burgundy-500/20 focus:border-burgundy-700"
                value={form.map_key}
                onChange={e => setForm({ ...form, map_key: e.target.value })}
              >
                <option value="">Chưa gắn lên bản đồ</option>
                {MAP_POINTS.map(([key, title]) => (
                  <option key={key} value={key}>{title} ({key})</option>
                ))}
              </select>
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-dark mb-1">
              Mô tả ngắn về địa điểm
            </label>
            <textarea
              rows={2}
              value={form.description || ''}
              onChange={e => setForm({ ...form, description: e.target.value })}
              placeholder="Mô tả chức năng, các tầng hoặc chỉ dẫn di chuyển..."
              className="w-full rounded-lg border border-cream-300 p-2.5 text-sm text-text-dark bg-white focus:outline-none focus:ring-2 focus:ring-burgundy-500/20 focus:border-burgundy-700"
            />
          </div>

          {/* QUẢN LÝ ALBUM ẢNH THỰC TẾ */}
          <div className="border border-cream-300 rounded-xl p-4 bg-cream-50/50 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-bold text-text-dark flex items-center gap-1.5">
                  <ImageIcon className="w-4 h-4 text-burgundy-800" />
                  Album ảnh thực tế ({photoList.length} ảnh)
                </h3>
                <p className="text-xs text-warm-gray-500">
                  Chọn 1 ảnh làm đại diện (hiển thị trước), thêm mô tả góc chụp và sắp xếp thứ tự
                </p>
              </div>
              <div className="flex items-center gap-2">
                <label className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-burgundy-900 text-white rounded-lg text-xs font-semibold cursor-pointer hover:bg-burgundy-800 transition-colors shadow-xs">
                  <Upload className="w-3.5 h-3.5" />
                  Tải ảnh từ máy
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={e => {
                      const file = e.target.files?.[0];
                      if (file) handleAddPhotoFromFile(file);
                      e.target.value = '';
                    }}
                  />
                </label>
                <button
                  type="button"
                  onClick={() => setShowUrlInput(!showUrlInput)}
                  className="px-2.5 py-1.5 bg-white border border-cream-300 text-warm-gray-700 rounded-lg text-xs font-medium hover:bg-cream-100 transition-colors"
                >
                  {showUrlInput ? 'Ẩn link' : '+ Thêm URL'}
                </button>
              </div>
            </div>

            {showUrlInput && (
              <div className="flex items-center gap-2 bg-white p-2.5 rounded-lg border border-cream-300">
                <input
                  type="url"
                  placeholder="Dán đường dẫn ảnh: /campus/places/b-sports.webp hoặc https://..."
                  value={customUrlInput}
                  onChange={e => setCustomUrlInput(e.target.value)}
                  className="flex-1 text-xs border border-cream-200 rounded p-1.5 focus:outline-none focus:border-burgundy-700"
                />
                <button
                  type="button"
                  onClick={handleAddPhotoFromUrl}
                  className="px-3 py-1.5 bg-burgundy-800 text-white rounded text-xs font-semibold hover:bg-burgundy-900"
                >
                  Thêm
                </button>
              </div>
            )}

            {photoList.length === 0 ? (
              <div className="text-center py-6 border-2 border-dashed border-cream-300 rounded-lg bg-white/70">
                <ImageIcon className="w-8 h-8 text-warm-gray-300 mx-auto mb-1.5" />
                <p className="text-xs text-warm-gray-500 font-medium">Chưa có ảnh thực tế nào cho địa điểm này</p>
                <p className="text-[11px] text-warm-gray-400 mt-0.5">Nhấn "Tải ảnh từ máy" hoặc "Thêm URL" để bổ sung</p>
              </div>
            ) : (
              <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                {photoList.map((photo, idx) => (
                  <div
                    key={photo.id || idx}
                    className={`flex items-center gap-3 p-2.5 rounded-lg border transition-all ${
                      photo.is_cover
                        ? 'bg-amber-50/60 border-amber-300 shadow-xs'
                        : 'bg-white border-cream-200 hover:border-cream-300'
                    }`}
                  >
                    {/* Thumbnail */}
                    <div className="relative shrink-0 w-20 h-14 rounded-md overflow-hidden bg-cream-100 border border-cream-200">
                      <img
                        src={photo.url}
                        alt={photo.caption || 'Ảnh địa điểm'}
                        onError={(e) => { e.currentTarget.src = '/campus/places/aerial.webp'; }}
                        className="w-full h-full object-cover"
                      />
                      {photo.is_cover && (
                        <div className="absolute top-0.5 left-0.5 bg-amber-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow-xs flex items-center gap-0.5">
                          <Star className="w-2.5 h-2.5 fill-current" />
                          Chính
                        </div>
                      )}
                    </div>

                    {/* Caption Input */}
                    <div className="flex-1 min-w-0">
                      <input
                        type="text"
                        value={photo.caption || ''}
                        onChange={e => handleCaptionChange(idx, e.target.value)}
                        placeholder="Mô tả ảnh (VD: Mặt tiền, Sân thi đấu, Lối vào...)"
                        className="w-full text-xs border border-cream-200 rounded px-2 py-1 bg-white focus:outline-none focus:border-burgundy-700"
                      />
                      <div className="text-[11px] text-warm-gray-400 mt-1 truncate">
                        {photo.url.startsWith('data:') ? 'Ảnh tải lên từ máy tính' : photo.url}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleSetCoverPhoto(idx)}
                        disabled={photo.is_cover}
                        title={photo.is_cover ? 'Đang là ảnh đại diện' : 'Đặt làm ảnh đại diện'}
                        className={`p-1.5 rounded text-xs transition-colors ${
                          photo.is_cover
                            ? 'text-amber-600 bg-amber-100 cursor-default'
                            : 'text-warm-gray-400 hover:text-amber-600 hover:bg-amber-50'
                        }`}
                      >
                        <Star className={`w-4 h-4 ${photo.is_cover ? 'fill-current' : ''}`} />
                      </button>

                      <div className="flex flex-col">
                        <button
                          type="button"
                          disabled={idx === 0}
                          onClick={() => handleMovePhoto(idx, -1)}
                          className="p-0.5 text-warm-gray-400 hover:text-warm-gray-800 disabled:opacity-20"
                          title="Di chuyển lên"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          disabled={idx === photoList.length - 1}
                          onClick={() => handleMovePhoto(idx, 1)}
                          className="p-0.5 text-warm-gray-400 hover:text-warm-gray-800 disabled:opacity-20"
                          title="Di chuyển xuống"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemovePhoto(idx)}
                        className="p-1.5 rounded text-red-500 hover:bg-red-50 transition-colors ml-1"
                        title="Xóa ảnh"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-cream-200">
            <Button variant="ghost" onClick={() => setShowModal(false)}>
              Hủy
            </Button>
            <Button onClick={handleSubmit}>
              {editItem ? 'Lưu thay đổi' : 'Thêm địa điểm'}
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
