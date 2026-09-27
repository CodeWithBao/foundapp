import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link, useLocation, useNavigationType } from 'react-router-dom';
import {
  Home, ArrowLeft, MapPin, Calendar, Eye, Phone, Mail,
  Share2, ShieldAlert, CheckCircle2, ChevronLeft, ChevronRight,
  Bookmark, Send, MessageCircle, ShieldCheck, Smartphone, Sparkles,
  FileText, Star, Heart, ExternalLink, Building2, Lock, Info
} from 'lucide-react';
import itemService from '../../services/itemService';
import claimService from '../../services/claimService';
import { useAuth } from '../../context/AuthContext';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import Textarea from '../../components/common/Textarea';
import ReportModal from '../../components/common/ReportModal';
import Avatar from '../../components/common/Avatar';
import ItemCard from '../../components/common/ItemCard';
import CategoryIcon from '../../components/common/CategoryIcon';
import LoadingSkeleton from '../../components/common/LoadingSkeleton';
import ItemChatModal from '../../components/chat/ItemChatModal';
import { formatDate, formatRelative } from '../../utils';
import { STORAGE_KEYS } from '../../constants';
import storageService from '../../services/storageService';
import scrollRestorationService from '../../services/scrollRestorationService';
import { toast } from 'sonner';

export default function ItemDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const navType = useNavigationType();
  const { user } = useAuth();
  
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [similarItems, setSimilarItems] = useState([]);
  const [showContact, setShowContact] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showChatModal, setShowChatModal] = useState(false);
  
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
    if (navType !== 'POP') {
      window.scrollTo({ top: 0, behavior: 'instant' });
    }
  }, [loadItemData, navType]);

  useEffect(() => {
    if (!loading && navType === 'POP') {
      const snap = scrollRestorationService.getSnapshot(`/items/${id}`);
      if (snap) {
        scrollRestorationService.restorePosition({
          itemId: snap.itemId,
          cardTop: snap.cardTop,
          scrollY: snap.scrollY,
          onComplete: () => {
            scrollRestorationService.consumeSnapshot();
          }
        });
      }
    }
  }, [loading, id, navType]);

  const getReporterInfo = () => {
    if (!item) return null;
    const users = storageService.get(STORAGE_KEYS.USERS) || [];
    const found = users.find(u => u.id === item.userId);
    return found || {
      id: item.userId || 'author_default',
      name: item.contactName || 'Trần Minh Khoa',
      role: 'Sinh viên DNTU',
      faculty: 'Khoa Công nghệ Thông tin',
      phone: item.contactPhone || '0987 123 321',
      email: item.contactEmail || 'khoa.tran@dntu.edu.vn',
      avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&h=150&fit=crop'
    };
  };

  // Mask SĐT và Email bảo vệ quyền riêng tư
  const maskPhone = (phone) => {
    if (!phone) return '09** *** ***';
    const clean = String(phone).replace(/\s+/g, '');
    if (clean.length < 7) return clean.slice(0, 3) + ' ••• •••';
    return clean.slice(0, 4) + ' ••• ' + clean.slice(-2);
  };

  const maskEmail = (email) => {
    if (!email) return '***@dntu.edu.vn';
    const parts = String(email).split('@');
    if (parts.length < 2) return '***@dntu.edu.vn';
    const name = parts[0];
    const masked = name.length > 2 ? `${name.slice(0, 2)}***` : `${name}***`;
    return `${masked}@${parts[1]}`;
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
        evidence: claimEvidence,
        evidenceImages: claimImage ? [claimImage] : [],
      });
      toast.success('Yêu cầu nhận đồ đã được gửi! Cán bộ quản lý DNTU sẽ liên hệ xác minh.');
      setShowClaimModal(false);
      setClaimReason('');
      setClaimEvidence('');
      setClaimImage('');
    } catch (err) {
      toast.error(err.message || 'Không thể gửi yêu cầu');
    } finally {
      setSubmittingClaim(false);
    }
  };

  const handleReportFoundSubmit = () => {
    if (!foundNote.trim()) {
      toast.error('Vui lòng nhập thông tin liên hệ hoặc vị trí bạn đã tìm thấy.');
      return;
    }
    toast.success('Thông tin đã được ghi nhận. Đội ngũ quản lý sẽ kết nối với bạn và chủ sở hữu!');
    setShowFoundModal(false);
    setFoundNote('');
  };

  const handleToggleSave = () => {
    setIsSaved(!isSaved);
    toast.success(!isSaved ? 'Đã lưu bài đăng vào mục yêu thích' : 'Đã bỏ lưu bài đăng');
  };

  const handleShare = () => {
    navigator.clipboard?.writeText(window.location.href);
    toast.success('Đã sao chép liên kết vào bộ nhớ tạm!');
  };

  const handleReportViolation = () => {
    setShowReportModal(true);
  };

  const handleBack = () => {
    if ((window.history.state && window.history.state.idx > 0) || window.history.length > 1) {
      navigate(-1);
    } else {
      const snap = scrollRestorationService.getLastSnapshot();
      navigate(location.state?.returnPath || snap?.fullPath || '/search');
    }
  };

  const handleSimilarItemClick = (simItem, e) => {
    const cardEl = document.getElementById(`item-card-${simItem.id}`) || e?.currentTarget;
    const cardTop = cardEl ? cardEl.getBoundingClientRect().top : null;
    scrollRestorationService.saveSnapshot({
      path: `/items/${id}`,
      fullPath: window.location.pathname + window.location.search,
      scrollY: window.scrollY || document.documentElement.scrollTop || 0,
      itemId: simItem.id,
      cardTop,
    });
    navigate(`/items/${simItem.id}`, {
      state: {
        from: 'detail',
        returnPath: `/items/${id}`,
        itemId: simItem.id,
      }
    });
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 bg-[#F8F6F3] min-h-screen">
        <LoadingSkeleton type="card" count={2} />
      </div>
    );
  }

  if (!item) return null;

  const reporter = getReporterInfo();
  const isReturned = item.status === 'RETURNED';
  const isFound = item.type === 'FOUND' || item.status === 'FOUND';
  const hasImages = item.images && item.images.length > 0;

  // Phân quyền theo người giữ: Cá nhân giữ đồ (USER) vs Cán bộ quản lý giữ đồ (STAFF / Văn phòng Lost & Found)
  const isOfficeKept = Boolean(
    item.keepingItem === false ||
    item.storageLocation ||
    item.holderType === 'STAFF' ||
    item.status === 'HANDED_OVER'
  );
  const isMyPost = Boolean(user?.id && item.userId && (user.id === item.userId || user.id === item.user_id));

  const handleOpenChat = () => {
    if (!user) {
      toast.error('Vui lòng đăng nhập để trao đổi tin nhắn riêng.');
      navigate('/login', { state: { from: { pathname: `/items/${id}` } } });
      return;
    }
    if (isMyPost) {
      toast.info('Đây là bài đăng của bạn. Khi có người quan tâm, tin nhắn sẽ gửi đến hộp thư của bạn.');
      return;
    }
    setShowChatModal(true);
  };
  
  // Gallery images fallback array if single image
  const galleryImages = hasImages 
    ? (item.images.length >= 2 ? item.images : [
        item.images[0],
        'https://images.unsplash.com/photo-1592899677977-9c10ca588bbd?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1627123424574-724758594e93?w=800&h=600&fit=crop'
      ])
    : [];

  const categoryText = typeof item.category === 'object' && item.category !== null
    ? item.category.name || ''
    : item.category || item.categoryName || 'Vật phẩm';
  const locationText = typeof item.location === 'object' && item.location !== null
    ? item.location.name || ''
    : item.location || item.locationName || 'Khuôn viên DNTU';

  return (
    <div className="bg-[#F8F6F3] min-h-screen pb-20 font-sans">
      {/* Top Breadcrumb Navigation bar according to mockup 05_item_detail */}
      <div className="bg-white border-b border-[#E8E2DD]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-wrap items-center justify-between gap-3 text-xs sm:text-sm">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-gray-600">
            <Link to="/" className="hover:text-[#741216] transition-colors flex items-center">
              <Home className="w-4 h-4" />
            </Link>
            <span className="text-gray-300">›</span>
            <Link to="/search" className="hover:text-[#741216] transition-colors">
              Tìm đồ thất lạc
            </Link>
            <span className="text-gray-300">›</span>
            <span className="text-[#741216] font-semibold truncate max-w-xs sm:max-w-md">
              {item.title}
            </span>
          </nav>

          {/* Quick Actions */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleBack}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-700 hover:text-[#741216] transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Quay lại danh sách</span>
            </button>
            <button
              type="button"
              onClick={handleShare}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-gray-700 hover:text-[#741216] text-xs font-semibold transition-colors shadow-2xs"
            >
              <Share2 className="w-3.5 h-3.5 text-[#741216]" />
              <span>Chia sẻ</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Top 3-block layout: Gallery (Left) | Info (Center) | Poster & CTA (Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* 1. GALLERY (5 cols) */}
          <div className="lg:col-span-5 space-y-3">
            <div className="relative rounded-2xl overflow-hidden bg-white border border-[#E8E2DD] shadow-sm">
              <div className="relative aspect-[4/3] bg-gray-50 flex items-center justify-center">
                {galleryImages.length > 0 ? (
                  <img
                    src={galleryImages[selectedImage]}
                    alt={item.title}
                    className="w-full h-full object-cover transition-all duration-300"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center text-gray-400 p-8">
                    <CategoryIcon category={categoryText} className="w-12 h-12 text-[#741216] mb-2" />
                    <span className="text-xs">Không có hình ảnh</span>
                  </div>
                )}

                {/* Floating Status Badge */}
                <div className="absolute top-3 left-3 z-10">
                  {isFound ? (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-[#E8F5E9] text-[#2E7D32] border border-[#C8E6C9] shadow-sm">
                      Nhặt được
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-[#FFEBEE] text-[#C62828] border border-[#FFCDD2] shadow-sm">
                      Đã đánh mất
                    </span>
                  )}
                </div>

                {/* Gallery Navigation Arrows */}
                {galleryImages.length > 1 && (
                  <>
                    <button
                      type="button"
                      onClick={() => setSelectedImage(prev => (prev === 0 ? galleryImages.length - 1 : prev - 1))}
                      className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/90 text-gray-700 hover:text-black flex items-center justify-center shadow-md backdrop-blur-xs transition"
                      aria-label="Previous image"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedImage(prev => (prev === galleryImages.length - 1 ? 0 : prev + 1))}
                      className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/90 text-gray-700 hover:text-black flex items-center justify-center shadow-md backdrop-blur-xs transition"
                      aria-label="Next image"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </>
                )}

                {/* Image Counter Badge */}
                {galleryImages.length > 0 && (
                  <div className="absolute bottom-3 right-3 px-2.5 py-0.5 rounded-full bg-black/60 backdrop-blur-xs text-white text-[11px] font-mono">
                    {selectedImage + 1} / {galleryImages.length}
                  </div>
                )}

                {/* Handwritten slogan overlay */}
                <div className="absolute bottom-3 left-3 pointer-events-none">
                  <span className="font-['Caveat'] text-lg text-white/95 drop-shadow">
                    Nhặt được cũng là duyên ♡
                  </span>
                </div>
              </div>

              {/* Thumbnails Row */}
              {galleryImages.length > 1 && (
                <div className="grid grid-cols-6 gap-2 p-3 bg-gray-50/80 border-t border-[#E8E2DD]">
                  {galleryImages.map((img, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setSelectedImage(idx)}
                      className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                        idx === selectedImage ? 'border-[#741216] ring-1 ring-[#741216]' : 'border-transparent opacity-70 hover:opacity-100'
                      }`}
                    >
                      <img src={img} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* 2. ITEM MAIN INFORMATION (4 cols) */}
          <div className="lg:col-span-4 space-y-5">
            {/* Category micro badge */}
            <div>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-[#FFEBEE] text-[#C62828] border border-[#FFCDD2]">
                <CategoryIcon category={categoryText} className="w-3.5 h-3.5" />
                <span>{categoryText}</span>
              </span>
            </div>

            {/* Title & Subtitle */}
            <div>
              <h1 className="text-2xl sm:text-3xl font-serif font-black text-[#741216] tracking-tight leading-snug">
                {item.title}
              </h1>
              <p className="text-xs sm:text-sm text-gray-600 mt-1 leading-relaxed">
                {item.subtitle || (item.description ? item.description.slice(0, 90) + '...' : `Ghi nhận tại ${locationText}, đồ vật trong tình trạng tốt`)}
              </p>
            </div>

            {/* Status & Views Row */}
            <div className="flex items-center gap-3 text-xs text-gray-500 py-1 border-b border-gray-200">
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-[#E8F5E9] text-[#2E7D32]">
                {isFound ? 'Nhặt được' : 'Đang tìm'}
              </span>
              <span>Mã bài đăng: <strong className="font-mono text-gray-700">#{item.id}</strong></span>
              <span className="flex items-center gap-1 font-mono">
                <Eye className="w-3.5 h-3.5 text-gray-400" />
                <span>{item.views || 256} lượt xem</span>
              </span>
            </div>

            {/* 6 Key Attributes Grid according to mockup */}
            <div className="grid grid-cols-2 gap-4 py-2 text-xs">
              {/* 1. Time */}
              <div className="flex items-start gap-2.5">
                <div className="p-1.5 rounded-lg bg-red-50 text-[#741216] shrink-0 mt-0.5">
                  <Calendar className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-gray-400 block text-[11px]">Thời gian {isFound ? 'nhặt được' : 'thất lạc'}</span>
                  <strong className="text-gray-800 font-bold block">{formatDate(item.date || item.createdAt)}</strong>
                  <span className="text-[11px] text-gray-500">({formatRelative(item.createdAt || item.date)})</span>
                </div>
              </div>

              {/* 2. Location */}
              <div className="flex items-start gap-2.5">
                <div className="p-1.5 rounded-lg bg-red-50 text-[#741216] shrink-0 mt-0.5">
                  <MapPin className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-gray-400 block text-[11px]">Địa điểm {isFound ? 'nhặt được' : 'thất lạc'}</span>
                  <strong className="text-gray-800 font-bold block">{locationText}</strong>
                  <span className="text-[11px] text-gray-500">Trường ĐH Công nghệ Đồng Nai</span>
                </div>
              </div>

              {/* 3. Condition */}
              <div className="flex items-start gap-2.5">
                <div className="p-1.5 rounded-lg bg-red-50 text-[#741216] shrink-0 mt-0.5">
                  <Smartphone className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-gray-400 block text-[11px]">Tình trạng</span>
                  <strong className="text-gray-800 font-bold block">{item.condition || 'Hoạt động tốt'}</strong>
                  <span className="text-[11px] text-gray-500">{item.brand ? `Hãng: ${item.brand}` : 'Ít trầy xước'}</span>
                </div>
              </div>

              {/* 4. Identification details */}
              <div className="flex items-start gap-2.5">
                <div className="p-1.5 rounded-lg bg-red-50 text-[#741216] shrink-0 mt-0.5">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-gray-400 block text-[11px]">Đặc điểm nhận dạng</span>
                  <strong className="text-gray-800 font-bold block">{item.color || 'Màu sắc đặc trưng'}</strong>
                  <span className="text-[11px] text-gray-500 truncate block max-w-[130px]">{item.distinguishing || 'Có dán sticker/ốp'}</span>
                </div>
              </div>

              {/* 5. Accessories */}
              <div className="flex items-start gap-2.5">
                <div className="p-1.5 rounded-lg bg-red-50 text-[#741216] shrink-0 mt-0.5">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-gray-400 block text-[11px]">Phụ kiện đi kèm</span>
                  <strong className="text-gray-800 font-bold block">Ốp lưng / bao da</strong>
                  <span className="text-[11px] text-gray-500">Không kèm bộ sạc</span>
                </div>
              </div>

              {/* 6. Campus Area */}
              <div className="flex items-start gap-2.5">
                <div className="p-1.5 rounded-lg bg-red-50 text-[#741216] shrink-0 mt-0.5">
                  <Star className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-gray-400 block text-[11px]">Khu vực</span>
                  <strong className="text-gray-800 font-bold block">{locationText}</strong>
                  <span className="text-[11px] text-gray-500">DNTU - Biên Hòa, Đồng Nai</span>
                </div>
              </div>
            </div>
          </div>

          {/* 3. POSTER PROFILE & ACTION CTA (3 cols) */}
          <div className="lg:col-span-3 space-y-4">
            <div className="bg-white rounded-2xl border border-[#E8E2DD] p-5 shadow-2xs space-y-4">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">Người đăng</span>
              
              <div className="flex items-center gap-3">
                <Avatar name={reporter.name} src={reporter.avatar} size="lg" />
                <div>
                  <h4 className="font-bold text-gray-900 text-sm leading-tight">{reporter.name}</h4>
                  <div className="mt-1">
                    <span className="inline-block bg-[#741216] text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                      {reporter.role || 'Sinh viên DNTU'}
                    </span>
                  </div>
                  <span className="text-[11px] text-gray-400 block mt-1">Tham gia: 03/2023</span>
                </div>
              </div>

              {/* Poster Verification & Post stats */}
              <div className="flex items-center justify-between text-xs py-2 border-y border-gray-100 text-gray-600">
                <div className="flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-gray-400" />
                  <span>12 bài đăng</span>
                </div>
                <div className="flex items-center gap-1 text-emerald-600 font-semibold">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Đã xác thực</span>
                </div>
              </div>

              {/* CTA Action Buttons */}
              <div className="space-y-2.5 pt-1">
                {/* 1. Phân quyền theo người giữ: Cán bộ/Văn phòng vs Cá nhân */}
                {isOfficeKept ? (
                  <div className="p-3 bg-[#FAF0F1] rounded-xl border border-red-100 text-xs space-y-2">
                    <div className="flex items-center gap-2 text-[#741216] font-bold">
                      <Building2 className="w-4 h-4 shrink-0" />
                      <span>Lưu giữ tại Văn phòng Lost & Found DNTU</span>
                    </div>
                    <p className="text-gray-600 text-[11px] leading-relaxed">
                      Vị trí: <strong className="text-gray-900">{item.storageLocation || 'Văn phòng Tiếp nhận Lost & Found DNTU'}</strong> (Phòng A102 - Tòa A).
                    </p>
                    <p className="text-gray-500 text-[11px]">
                      Vui lòng mang Thẻ SV/CCCD và bấm <strong>Gửi yêu cầu nhận lại</strong> bên dưới để cán bộ phụ trách hỗ trợ đối chiếu và bàn giao.
                    </p>
                  </div>
                ) : (
                  /* Đồ do cá nhân giữ -> Nút Chat riêng với người giữ đồ */
                  <button
                    type="button"
                    onClick={handleOpenChat}
                    className="w-full bg-[#741216] text-white py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-[#8e171c] transition shadow-xs whitespace-nowrap"
                  >
                    <MessageCircle className="w-4 h-4 shrink-0" />
                    <span>
                      {isReturned
                        ? 'Xem trao đổi (Chỉ đọc)'
                        : isFound
                        ? 'Chat với người đang giữ đồ'
                        : 'Chat riêng với người đăng bài'}
                    </span>
                  </button>
                )}

                {/* 2. Nút xem thông tin liên hệ bảo mật (chỉ cho cá nhân) */}
                {!isOfficeKept && (
                  <button
                    type="button"
                    onClick={() => setShowContact(!showContact)}
                    className="w-full py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition border border-gray-200 text-gray-700 hover:bg-gray-50"
                  >
                    <Lock className="w-3.5 h-3.5 text-gray-400" />
                    <span>{showContact ? 'Ẩn thông tin liên hệ' : 'Xem thông tin liên hệ (Đã bảo vệ)'}</span>
                  </button>
                )}

                {/* Show contact information if toggled */}
                {showContact && !isOfficeKept && (
                  <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 text-xs space-y-2 animate-fadeIn">
                    <div className="flex items-center gap-2 text-gray-700">
                      <Phone className="w-3.5 h-3.5 text-[#741216]" />
                      <span>SĐT: <strong className="text-gray-900">{maskPhone(reporter.phone)}</strong></span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-700">
                      <Mail className="w-3.5 h-3.5 text-[#741216]" />
                      <span>Email: <strong className="text-gray-900">{maskEmail(reporter.email)}</strong></span>
                    </div>
                    <p className="text-[10px] text-gray-500 italic pt-1 border-t border-gray-200">
                      🛡️ Nhằm phòng ngừa giả mạo, khuyến nghị trao đổi qua hệ thống Chat UniFind để bảo đảm an toàn.
                    </p>
                  </div>
                )}

                {/* 3. Claim Request Button (for FOUND) or Found Report (for LOST) */}
                {isFound ? (
                  <button
                    type="button"
                    onClick={() => setShowClaimModal(true)}
                    className="w-full bg-[#FAF0F1] hover:bg-[#F5E2E4] text-[#741216] py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Gửi yêu cầu nhận lại</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowFoundModal(true)}
                    className="w-full bg-amber-500 hover:bg-amber-600 text-white py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition shadow-xs"
                  >
                    <span>Tôi đã tìm thấy vật này</span>
                  </button>
                )}

                {/* 4. Bookmark button */}
                <button
                  type="button"
                  onClick={handleToggleSave}
                  className={`w-full py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition border ${
                    isSaved
                      ? 'bg-red-50 border-red-200 text-[#741216]'
                      : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <Bookmark className={`w-3.5 h-3.5 ${isSaved ? 'fill-current' : ''}`} />
                  <span>{isSaved ? 'Đã lưu bài đăng' : 'Lưu bài đăng'}</span>
                </button>
              </div>

              {/* Safety notice box */}
              <div className="pt-3 border-t border-gray-100 flex items-start gap-2.5 text-xs text-gray-600">
                <ShieldAlert className="w-4 h-4 text-[#741216] shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <strong className="text-gray-900 block font-bold">An toàn là trên hết</strong>
                  <p className="text-[11px] text-gray-500 leading-relaxed">
                    Chỉ liên hệ qua hệ thống UniFind. Tuyệt đối không chia sẻ thông tin cá nhân nhạy cảm.
                  </p>
                  <Link to="/guidelines" className="inline-block text-[11px] font-bold text-[#741216] hover:underline">
                    Xem hướng dẫn an toàn →
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Middle Section: Detailed Description & Map Location side by side */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
          
          {/* Detailed Description Card */}
          <div className="bg-white rounded-2xl border border-[#E8E2DD] p-6 shadow-2xs flex flex-col justify-between relative overflow-hidden">
            <div>
              <div className="flex items-center gap-2 pb-3 mb-3 border-b border-gray-100">
                <FileText className="w-4 h-4 text-[#741216]" />
                <h3 className="font-bold text-gray-900 text-base">Mô tả chi tiết</h3>
              </div>
              <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">
                {item.description || 
                  `Mình nhặt được chiếc ${item.title} tại ${locationText} vào khoảng ${formatDate(item.date || item.createdAt)}. Đồ vật còn nguyên vẹn, đang được hỗ trợ giữ gìn cẩn thận. Mình đăng lên đây để tìm lại cho bạn chủ nhân. Nếu bạn là người đánh mất hoặc biết ai đang tìm, vui lòng liên hệ để xác minh và nhận lại. Cảm ơn!`}
              </p>
            </div>

            {/* Handwritten script on bottom right of description */}
            <div className="pt-6 text-right">
              <span className="font-['Caveat'] text-2xl text-[#741216] leading-none">
                Mất đồ nhưng lòng tốt vẫn còn đây ♡
              </span>
            </div>
          </div>

          {/* Location Map Preview Card */}
          <div className="bg-white rounded-2xl border border-[#E8E2DD] p-6 shadow-2xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-[#741216]" />
                <h3 className="font-bold text-gray-900 text-base">Vị trí {isFound ? 'nhặt được' : 'thất lạc'}</h3>
              </div>
              <Link to="/map" className="text-xs font-bold text-[#741216] hover:underline flex items-center gap-1">
                <span>Xem trên bản đồ</span>
                <ExternalLink className="w-3 h-3" />
              </Link>
            </div>

            {/* Map visual and photo illustration container */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
              <div className="sm:col-span-8 bg-[#FAF8F5] border border-gray-200 rounded-xl p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-red-100 text-[#741216] flex items-center justify-center shrink-0">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <strong className="text-sm text-gray-900 block">{locationText}</strong>
                  <span className="text-xs text-gray-500">DNTU - Trảng Bom, TP. Biên Hòa, Đồng Nai</span>
                </div>
              </div>

              {/* Campus Photo */}
              <div className="sm:col-span-4 h-24 rounded-xl overflow-hidden border border-gray-200 shadow-2xs">
                <img
                  src="/DNTU_Web_Asset_Kit/asset/26_classroom_building_a.jpg"
                  alt="DNTU Campus"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Section: Related Items & Promo Banner */}
        <div className="pt-4 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Heart className="w-4 h-4 text-[#741216]" />
              <h2 className="text-lg font-bold text-gray-900">Có thể bạn cũng quan tâm</h2>
            </div>
            <Link to="/search" className="text-xs font-bold text-[#741216] hover:underline flex items-center gap-1">
              <span>Xem thêm</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-5">
            {similarItems.slice(0, 4).map(simItem => (
              <ItemCard
                key={simItem.id}
                item={simItem}
                onClick={handleSimilarItemClick}
              />
            ))}

            {/* Promo banner on right matching mockup */}
            <div className="relative rounded-2xl overflow-hidden bg-[#741216] text-white p-5 flex flex-col justify-between shadow-sm min-h-[220px]">
              <div 
                className="absolute inset-0 bg-cover bg-center opacity-30 mix-blend-overlay"
                style={{ backgroundImage: `url('/DNTU_Web_Asset_Kit/asset/01_event_entertainment_center.jpg')` }}
              />
              <div className="relative z-10 space-y-2">
                <h3 className="font-serif font-bold text-lg leading-snug">
                  Cùng nhau tạo nên một DNTU tử tế hơn
                </h3>
                <button
                  type="button"
                  onClick={() => navigate('/report-lost')}
                  className="inline-flex items-center px-4 py-2 rounded-xl bg-white text-[#741216] font-bold text-xs hover:bg-gray-100 transition shadow-sm mt-2"
                >
                  Đăng tin ngay →
                </button>
              </div>

              <div className="relative z-10 text-right pt-4">
                <span className="font-['Caveat'] text-2xl text-white/95 leading-none">
                  Kết nối<br />Lan tỏa tử tế ♡
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CLAIM MODAL */}
      <Modal 
        isOpen={showClaimModal} 
        onClose={() => setShowClaimModal(false)} 
        title="Gửi yêu cầu nhận lại vật phẩm"
      >
        <div className="space-y-4 pt-1">
          <div className="p-3 bg-red-50 border border-red-100 rounded-xl flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-red-100 shrink-0 overflow-hidden flex items-center justify-center">
              {hasImages ? (
                <img src={item.images[0]} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-[#741216]">
                  <CategoryIcon category={categoryText} className="w-6 h-6" />
                </div>
              )}
            </div>
            <div>
              <h4 className="font-semibold text-sm text-gray-900 truncate max-w-xs">{item.title}</h4>
              <p className="text-xs text-gray-500">{categoryText} • {locationText}</p>
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
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Link ảnh minh chứng hoặc chứng minh sở hữu (không bắt buộc)
            </label>
            <input
              type="url"
              placeholder="https://..."
              value={claimImage}
              onChange={e => setClaimImage(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-gray-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#741216]"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-gray-100">
            <Button variant="ghost" onClick={() => setShowClaimModal(false)}>
              Hủy bỏ
            </Button>
            <Button 
              onClick={handleClaimSubmit} 
              loading={submittingClaim}
              className="bg-[#741216] hover:bg-[#8e171c] text-white"
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
          <p className="text-sm text-gray-600">
            Cảm ơn tinh thần tốt đẹp của bạn! Hãy cung cấp thông tin vị trí hoặc cách thức liên hệ để hỗ trợ người đăng tìm lại tài sản.
          </p>
          <Textarea 
            label="Thông tin liên hệ / Vị trí nhặt được *"
            placeholder="Nhập vị trí bạn đang giữ vật phẩm hoặc số điện thoại để trao đổi..."
            value={foundNote}
            onChange={e => setFoundNote(e.target.value)}
            rows={4}
          />
          <div className="flex justify-end gap-3 pt-3 border-t border-gray-100">
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

      {/* DIRECT ITEM CHAT MODAL */}
      <ItemChatModal
        isOpen={showChatModal}
        onClose={() => setShowChatModal(false)}
        item={item}
        recipientUser={{
          id: reporter.id || item.userId || 'author_default',
          name: reporter.name || 'Người dùng DNTU',
          avatar: reporter.avatar || '',
          role: reporter.role || (isOfficeKept ? 'Cán bộ Lost & Found DNTU' : 'Sinh viên DNTU')
        }}
      />
    </div>
  );
}
