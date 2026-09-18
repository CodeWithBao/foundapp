import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, MapPin, Calendar, Tag, Eye, Clock, Phone, Mail,
  Share2, ShieldAlert, CheckCircle2, Info
} from 'lucide-react';
import itemService from '../../services/itemService';
import claimService from '../../services/claimService';
import { useAuth } from '../../context/AuthContext';
import { ItemTypeBadge, StatusBadge } from '../../components/common/Badge';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import Textarea from '../../components/common/Textarea';
import ReportModal from '../../components/common/ReportModal';
import Avatar from '../../components/common/Avatar';
import ItemCard from '../../components/common/ItemCard';
import LoadingSkeleton from '../../components/common/LoadingSkeleton';
import { formatDate, formatRelative } from '../../utils';
import { STORAGE_KEYS } from '../../constants';
import storageService from '../../services/storageService';
import { toast } from 'sonner';

const categoryEmoji = {
  'Điện tử': '📱',
  'Sách vở': '📚',
  'Quần áo': '👕',
  'Thẻ & Giấy tờ': '🪪',
  'Phụ kiện': '👜',
  'Khác': '📦',
};

export default function ItemDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [similarItems, setSimilarItems] = useState([]);
  const [showContact, setShowContact] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  
  // Bookmark state
  const [isSaved, setIsSaved] = useState(false);

  // Claim Modal states
  const [showClaimModal, setShowClaimModal] = useState(false);
  const [claimReason, setClaimReason] = useState('');
  const [claimEvidence, setClaimEvidence] = useState('');
  const [claimImage, setClaimImage] = useState('');
  const [submittingClaim, setSubmittingClaim] = useState(false);

  // Found Report Modal states (for LOST items)
  const [showFoundModal, setShowFoundModal] = useState(false);
  const [foundNote, setFoundNote] = useState('');

  const loadItemData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await itemService.getItemById(id);
      setItem(data);

      // Load similar items in same category
      const allItems = await itemService.getItems({ category: data.category });
      const filtered = allItems.filter(i => i.id !== data.id).slice(0, 4);
      setSimilarItems(filtered);
    } catch (err) {
      toast.error(err.message || 'Không thể tải thông tin vật phẩm');
      navigate('/search');
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => {
    loadItemData();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [loadItemData]);

  const getReporterInfo = () => {
    if (!item) return null;
    const users = storageService.get(STORAGE_KEYS.USERS) || [];
    return users.find(u => u.id === item.userId);
  };

  const handleClaimSubmit = async () => {
    if (!user) {
      toast.error('Vui lòng đăng nhập để gửi yêu cầu nhận đồ.');
      navigate('/login', { state: { from: { pathname: `/items/${id}` } } });
      return;
    }
    if (!claimReason.trim()) {
      toast.error('Vui lòng nhập lý do nhận đồ.');
      return;
    }
    if (!claimEvidence.trim()) {
      toast.error('Vui lòng cung cấp đặc điểm nhận dạng / bằng chứng xác minh.');
      return;
    }

    setSubmittingClaim(true);
    try {
      await claimService.createClaim({
        itemId: item.id,
        claimantId: user.id,
        claimantName: user.name,
        reason: claimReason,
        message: claimReason,
        evidence: claimEvidence,
      });
      toast.success('Gửi yêu cầu nhận đồ thành công! Cán bộ quản lý sẽ kiểm tra và liên hệ với bạn.');
      setShowClaimModal(false);
      setClaimReason('');
      setClaimEvidence('');
    } catch (err) {
      toast.error(err.message || 'Gửi yêu cầu thất bại');
    } finally {
      setSubmittingClaim(false);
    }
  };

  const handleReportFoundSubmit = () => {
    if (!user) {
      toast.error('Vui lòng đăng nhập để gửi thông báo.');
      navigate('/login', { state: { from: { pathname: `/items/${id}` } } });
      return;
    }
    if (!foundNote.trim()) {
      toast.error('Vui lòng nhập chi tiết thông tin bạn biết.');
      return;
    }
    toast.success('Cảm ơn bạn! Thông tin hỗ trợ đã được gửi tới người đăng bài.');
    setShowFoundModal(false);
    setFoundNote('');
  };

  const handleToggleSave = () => {
    setIsSaved(!isSaved);
    toast.success(!isSaved ? 'Đã lưu bài đăng vào danh sách yêu thích!' : 'Đã bỏ lưu bài đăng.');
  };

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      toast.success('Đã sao chép liên kết vào bộ nhớ tạm!');
    } else {
      toast.info('Vui lòng chia sẻ đường dẫn URL trên thanh trình duyệt.');
    }
  };

  const handleReportViolation = () => {
    if (!user) {
      toast.error('Vui lòng đăng nhập để báo cáo bài viết');
      navigate('/login');
      return;
    }
    setShowReportModal(true);
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 bg-cream-50 min-h-screen">
        <LoadingSkeleton type="card" count={2} />
      </div>
    );
  }

  if (!item) return null;

  const reporter = getReporterInfo();
  const isOwner = user && user.id === item.userId;
  const isReturned = item.status === 'RETURNED';
  const hasImages = item.images && item.images.length > 0;
  const categoryText = typeof item.category === 'object' && item.category !== null
    ? item.category.name || ''
    : item.category || item.categoryName || '';
  const locationText = typeof item.location === 'object' && item.location !== null
    ? item.location.name || ''
    : item.location || item.locationName || '';

  return (
    <div className="bg-cream-50 min-h-screen pb-16">
      {/* Top Navigation */}
      <div className="bg-white border-b border-warm-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <button 
            onClick={() => navigate('/search')} 
            className="inline-flex items-center gap-2 text-sm font-medium text-warm-gray-600 hover:text-burgundy-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Quay lại kết quả tìm kiếm
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* LEFT COLUMN: Gallery & Extra Details (7 cols desktop) */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Image Gallery */}
            <div className="bg-white rounded-2xl border border-warm-gray-200 overflow-hidden shadow-sm">
              <div className="relative aspect-[4/3] bg-warm-gray-100 flex items-center justify-center">
                {hasImages ? (
                  <img
                    src={item.images[selectedImage]}
                    alt={item.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center text-warm-gray-400">
                    <span className="text-6xl mb-2">{categoryEmoji[categoryText] || '📦'}</span>
                    <span className="text-sm font-medium">Không có hình ảnh đính kèm</span>
                  </div>
                )}

                <div className="absolute top-4 left-4 flex gap-2">
                  <ItemTypeBadge type={item.type} />
                  <StatusBadge status={item.status} />
                </div>
              </div>

              {/* Thumbnails */}
              {hasImages && item.images.length > 1 && (
                <div className="flex gap-3 p-4 bg-warm-gray-50 border-t border-warm-gray-200 overflow-x-auto">
                  {item.images.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedImage(idx)}
                      className={`relative w-20 h-20 rounded-xl overflow-hidden border-2 transition-all shrink-0 ${idx === selectedImage ? 'border-burgundy-600 scale-105 shadow-sm' : 'border-transparent opacity-70 hover:opacity-100'}`}
                    >
                      <img src={img} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Description Card */}
            <div className="bg-white rounded-2xl border border-warm-gray-200 p-6 shadow-sm">
              <h3 className="text-lg font-serif font-bold text-gray-900 mb-3 border-b border-warm-gray-100 pb-3">
                Mô tả chi tiết
              </h3>
              <p className="text-warm-gray-700 text-sm md:text-base leading-relaxed whitespace-pre-line">
                {item.description || 'Không có thông tin mô tả bổ sung.'}
              </p>

              {/* Attribute Tags */}
              <div className="mt-6 pt-4 border-t border-warm-gray-100 flex flex-wrap gap-2">
                {item.color && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-warm-gray-100 text-warm-gray-700 text-xs font-medium">
                    <span className="w-2.5 h-2.5 rounded-full border border-warm-gray-300" style={{ backgroundColor: item.color }} />
                    Màu sắc: {item.color}
                  </span>
                )}
                {item.brand && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-warm-gray-100 text-warm-gray-700 text-xs font-medium">
                    <Tag className="w-3.5 h-3.5 text-warm-gray-500" />
                    Thương hiệu: {item.brand}
                  </span>
                )}
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-warm-gray-100 text-warm-gray-700 text-xs font-medium">
                  Danh mục: {categoryText}
                </span>
              </div>
            </div>

            {/* Location & Holding Info Card */}
            <div className="bg-white rounded-2xl border border-warm-gray-200 p-6 shadow-sm">
              <h3 className="text-lg font-serif font-bold text-gray-900 mb-3 border-b border-warm-gray-100 pb-3 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-burgundy-600" />
                Địa điểm & Nơi lưu giữ
              </h3>
              <div className="space-y-2 text-sm text-warm-gray-700">
                <p><strong>Vị trí ghi nhận:</strong> {item.locationName || locationText}</p>
                {item.holdingLocation && (
                  <p className="text-burgundy-800 bg-burgundy-50 p-3 rounded-xl border border-burgundy-100 mt-2">
                    📍 <strong>Nơi đang lưu giữ hiện tại:</strong> {item.holdingLocation}
                  </p>
                )}
                <p className="text-xs text-warm-gray-500 pt-1">
                  * Vui lòng mang theo thẻ sinh viên / CCCD khi đến làm thủ tục nhận lại vật phẩm tại văn phòng nhà trường.
                </p>
              </div>
            </div>

          </div>

          {/* RIGHT COLUMN: Item Main Info & Action Cards (5 cols desktop) */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* Title & Core Metadata Card */}
            <div className="bg-white rounded-2xl border border-warm-gray-200 p-6 shadow-sm space-y-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <ItemTypeBadge type={item.type} />
                  <span className="text-xs text-warm-gray-400">Mã: #{item.id}</span>
                </div>
                <h1 className="text-2xl font-serif font-bold text-gray-900 leading-snug">
                  {item.title}
                </h1>
              </div>

              <div className="grid grid-cols-2 gap-4 py-3 border-y border-warm-gray-100 text-xs md:text-sm">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-warm-gray-500">
                    <MapPin className="w-4 h-4 shrink-0 text-burgundy-600" />
                    <span className="truncate">{locationText}</span>
                  </div>
                  <div className="flex items-center gap-2 text-warm-gray-500">
                    <Calendar className="w-4 h-4 shrink-0 text-burgundy-600" />
                    <span>{formatDate(item.date)}</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-warm-gray-500">
                    <Eye className="w-4 h-4 shrink-0 text-burgundy-600" />
                    <span>{item.views || 0} lượt xem</span>
                  </div>
                  <div className="flex items-center gap-2 text-warm-gray-500">
                    <Clock className="w-4 h-4 shrink-0 text-burgundy-600" />
                    <span>{formatRelative(item.createdAt)}</span>
                  </div>
                </div>
              </div>

              {/* Primary Action Buttons */}
              <div className="pt-2 space-y-3">
                {isReturned ? (
                  <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-center flex items-center justify-center gap-2 font-medium">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    Vật phẩm đã hoàn tất trao trả
                  </div>
                ) : isOwner ? (
                  <div className="p-4 bg-burgundy-50 border border-burgundy-200 rounded-xl text-burgundy-800 text-center flex items-center justify-center gap-2 font-medium text-sm">
                    <Info className="w-5 h-5 text-burgundy-600" />
                    Đây là bài đăng của bạn
                  </div>
                ) : item.type === 'FOUND' ? (
                  <Button
                    onClick={() => setShowClaimModal(true)}
                    className="w-full bg-burgundy-600 hover:bg-burgundy-700 text-white py-3 rounded-xl font-medium shadow-sm transition-all"
                  >
                    Gửi yêu cầu nhận lại
                  </Button>
                ) : (
                  <Button
                    onClick={() => setShowFoundModal(true)}
                    className="w-full bg-amber-600 hover:bg-amber-700 text-white py-3 rounded-xl font-medium shadow-sm transition-all"
                  >
                    Tôi đã tìm thấy vật này
                  </Button>
                )}

                {/* Secondary Action Buttons */}
                <div className="flex gap-2 pt-1">
                  <button
                    onClick={handleToggleSave}
                    className={`flex-1 py-2.5 px-3 border rounded-xl text-xs font-medium flex items-center justify-center gap-1.5 transition-colors ${isSaved ? 'bg-burgundy-50 border-burgundy-200 text-burgundy-700 font-semibold' : 'border-warm-gray-200 text-warm-gray-700 hover:bg-warm-gray-50'}`}
                  >
                    {isSaved ? '★ Đã lưu bài đăng' : '☆ Lưu bài đăng'}
                  </button>
                  <button
                    onClick={handleShare}
                    className="flex-1 py-2.5 px-3 border border-warm-gray-200 rounded-xl text-warm-gray-700 hover:bg-warm-gray-50 text-xs font-medium flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Share2 className="w-3.5 h-3.5" /> Chia sẻ
                  </button>
                  <button
                    onClick={handleReportViolation}
                    className="py-2.5 px-3 border border-warm-gray-200 rounded-xl text-warm-gray-500 hover:text-red-600 hover:bg-red-50 text-xs font-medium flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <ShieldAlert className="w-3.5 h-3.5" /> Báo cáo
                  </button>
                </div>
              </div>
            </div>

            {/* Reporter Profile Card */}
            {reporter && (
              <div className="bg-white rounded-2xl border border-warm-gray-200 p-6 shadow-sm space-y-4">
                <h3 className="text-sm font-semibold text-warm-gray-400 uppercase tracking-wider">
                  Thông tin người đăng
                </h3>
                <div className="flex items-center gap-3">
                  <Avatar name={reporter.name} src={reporter.avatar} size="lg" />
                  <div>
                    <h4 className="font-semibold text-gray-900">{reporter.name}</h4>
                    <p className="text-xs text-warm-gray-500">
                      {reporter.role === 'STAFF' ? 'Cán bộ / Nhân viên DNTU' : reporter.faculty || 'Sinh viên DNTU'}
                    </p>
                  </div>
                </div>

                <div className="pt-2">
                  {!showContact ? (
                    <button 
                      onClick={() => setShowContact(true)}
                      className="w-full py-2.5 bg-burgundy-50 hover:bg-burgundy-100 text-burgundy-700 text-xs font-medium rounded-xl border border-burgundy-100 flex items-center justify-center gap-2 transition-colors"
                    >
                      <Phone className="w-3.5 h-3.5" /> Hiển thị thông tin liên hệ
                    </button>
                  ) : (
                    <div className="p-3 bg-warm-gray-50 rounded-xl space-y-2 border border-warm-gray-200 text-xs">
                      {reporter.phone && (
                        <div className="flex items-center gap-2 text-warm-gray-700">
                          <Phone className="w-3.5 h-3.5 text-burgundy-600 shrink-0" />
                          <span>SĐT: <strong>{reporter.phone}</strong></span>
                        </div>
                      )}
                      <div className="flex items-center gap-2 text-warm-gray-700">
                        <Mail className="w-3.5 h-3.5 text-burgundy-600 shrink-0" />
                        <span>Email: <strong>{reporter.email}</strong></span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Verification Warning Card */}
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 text-amber-900 text-xs space-y-2">
              <div className="flex items-center gap-2 font-semibold text-amber-800 text-sm">
                <Info className="w-4 h-4 shrink-0" /> Quy trình xác minh an toàn
              </div>
              <p className="leading-relaxed">
                Để bảo vệ quyền lợi chính chủ, UniFind DNTU sẽ đối chiếu kỹ lưỡng thông tin nhận dạng trước khi trao trả tài sản.
              </p>
            </div>

          </div>
        </div>

        {/* POTENTIAL MATCHES & SIMILAR ITEMS SECTION */}
        {similarItems.length > 0 && (
          <div className="mt-16 pt-10 border-t border-warm-gray-200 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-serif font-bold text-gray-900">
                  Vật phẩm đối chiếu tiềm năng & cùng danh mục
                </h2>
                <p className="text-xs text-warm-gray-500 mt-1">
                  Hệ thống tự động lọc các bài đăng liên quan để hỗ trợ tìm kiếm nhanh hơn
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
              {similarItems.map(simItem => (
                <ItemCard 
                  key={simItem.id} 
                  item={simItem} 
                  onClick={() => navigate(`/items/${simItem.id}`)} 
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* CLAIM MODAL */}
      <Modal 
        isOpen={showClaimModal} 
        onClose={() => setShowClaimModal(false)} 
        title="Gửi yêu cầu nhận lại vật phẩm"
      >
        <div className="space-y-4 pt-1">
          <div className="p-3 bg-burgundy-50 border border-burgundy-100 rounded-xl flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-burgundy-100 shrink-0 overflow-hidden flex items-center justify-center">
              {hasImages ? (
                <img src={item.images[0]} alt="" className="w-full h-full object-cover" />
              ) : (
                <span className="text-xl">{categoryEmoji[categoryText] || '📦'}</span>
              )}
            </div>
            <div>
              <h4 className="font-semibold text-sm text-gray-900 truncate max-w-xs">{item.title}</h4>
              <p className="text-xs text-warm-gray-500">{categoryText} • {locationText}</p>
            </div>
          </div>

          <Textarea 
            label="Lý do nhận đồ *"
            placeholder="Giải thích vì sao bạn là chủ sở hữu của vật phẩm này..."
            value={claimReason}
            onChange={e => setClaimReason(e.target.value)}
            rows={3}
            required
          />

          <Textarea
            label="Bằng chứng / Đặc điểm nhận dạng chỉ chủ sở hữu biết *"
            placeholder="Ví dụ: Mật khẩu màn hình, vết xước ở góc dưới, nội dung tin nhắn trong máy, hình nền, số sê-ri..."
            value={claimEvidence}
            onChange={e => setClaimEvidence(e.target.value)}
            rows={3}
            required
          />

          <div>
            <label className="block text-xs font-medium text-warm-gray-700 mb-1">
              Link ảnh minh chứng hoặc chứng minh sở hữu (không bắt buộc)
            </label>
            <input
              type="url"
              placeholder="https://..."
              value={claimImage}
              onChange={e => setClaimImage(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-warm-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-burgundy-500"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-warm-gray-100">
            <Button variant="ghost" onClick={() => setShowClaimModal(false)}>
              Hủy bỏ
            </Button>
            <Button 
              onClick={handleClaimSubmit} 
              loading={submittingClaim}
              className="bg-burgundy-600 hover:bg-burgundy-700 text-white"
            >
              Gửi yêu cầu
            </Button>
          </div>
        </div>
      </Modal>

      {/* REPORT FOUND MODAL (For LOST items) */}
      <Modal
        isOpen={showFoundModal}
        onClose={() => setShowFoundModal(false)}
        title="Thông báo bạn đã tìm thấy vật này"
      >
        <div className="space-y-4 pt-1">
          <p className="text-sm text-warm-gray-600">
            Cảm ơn tinh thần tốt đẹp của bạn! Hãy cung cấp thông tin vị trí hoặc cách thức liên hệ để hỗ trợ người đăng tìm lại tài sản.
          </p>
          <Textarea 
            label="Thông tin liên hệ / Vị trí nhặt được *"
            placeholder="Nhập vị trí bạn đang giữ vật phẩm hoặc số điện thoại để trao đổi..."
            value={foundNote}
            onChange={e => setFoundNote(e.target.value)}
            rows={4}
          />
          <div className="flex justify-end gap-3 pt-3 border-t border-warm-gray-100">
            <Button variant="ghost" onClick={() => setShowFoundModal(false)}>
              Hủy
            </Button>
            <Button 
              onClick={handleReportFoundSubmit}
              className="bg-amber-600 hover:bg-amber-700 text-white"
            >
              Gửi thông tin
            </Button>
          </div>
        </div>
      </Modal>

      {/* REPORT POST MODAL */}
      <ReportModal
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        postId={item.id}
        postTitle={item.title}
      />

    </div>
  );
}
