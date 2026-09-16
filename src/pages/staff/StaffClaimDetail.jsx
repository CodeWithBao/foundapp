import { useState, useEffect } from 'react';
import { useParams, useNavigate, useOutletContext } from 'react-router-dom';
import {
  ArrowLeft, User, Package, Clock, CheckCircle, XCircle,
  Truck, FileText, AlertTriangle, Info, MapPin, Calendar,
  ShieldCheck, Image as ImageIcon, Phone, Mail, Award, Maximize2,
  Lock, Eye, ClipboardCheck, X
} from 'lucide-react';
import claimService from '../../services/claimService';
import itemService from '../../services/itemService';
import userService from '../../services/userService';
import { useAuth } from '../../context/AuthContext';
import { CLAIM_STATUS, CLAIM_STATUS_CONFIG } from '../../constants';
import Button from '../../components/common/Button';
import Textarea from '../../components/common/Textarea';
import { Modal } from '../../components/common/Modal';
import { StatusBadge } from '../../components/common/Badge';
import Avatar from '../../components/common/Avatar';
import ImageUploadCamera from '../../components/common/ImageUploadCamera';
import { formatDate, formatDateTime } from '../../utils';
import { toast } from 'sonner';

export default function StaffClaimDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const outletContext = useOutletContext() || {};
  const sidebarOpen = outletContext.sidebarOpen ?? true;
  
  const [claim, setClaim] = useState(null);
  const [item, setItem] = useState(null);
  const [claimant, setClaimant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Modals state
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  const [approveModalOpen, setApproveModalOpen] = useState(false);
  const [approveChecklist, setApproveChecklist] = useState(['Đặc điểm vật phẩm trùng khớp']);
  const [otherNote, setOtherNote] = useState('');
  const [previewImage, setPreviewImage] = useState(null);

  const checklistOptions = [
    'Đặc điểm vật phẩm trùng khớp',
    'Thông tin mô tả bí mật trùng khớp',
    'Hình ảnh / bằng chứng sở hữu hợp lệ',
    'Giấy tờ liên quan trùng khớp',
    'Thời gian và địa điểm hợp lý',
    'Đã xác minh trực tiếp với người nhận',
    'Khác'
  ];

  const handleChecklistToggle = (option) => {
    setApproveChecklist(prev =>
      prev.includes(option) ? prev.filter(item => item !== option) : [...prev, option]
    );
  };

  const [handoverModalOpen, setHandoverModalOpen] = useState(false);
  const [handoverNote, setHandoverNote] = useState('');
  const [evidenceImage, setEvidenceImage] = useState('');

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    setLoading(true);
    try {
      const c = await claimService.getClaimById(id);
      setClaim(c);
      
      const allItems = await itemService.getItems();
      const foundItem = allItems.find(i => i.id === c.itemId);
      setItem(foundItem);

      const allUsers = await userService.getUsers();
      const foundClaimant = allUsers.find(u => u.id === c.claimantId);
      setClaimant(foundClaimant);
    } catch (err) {
      toast.error(err.message || 'Không tìm thấy yêu cầu');
      navigate('/staff/claims');
    } finally {
      setLoading(false);
    }
  };

  const handleStartReview = async () => {
    setActionLoading(true);
    try {
      await claimService.reviewClaim(id, user.id);
      toast.success('Đã bắt đầu quy trình xem xét yêu cầu');
      await loadData();
    } catch (err) {
      toast.error(err.message || 'Có lỗi xảy ra');
    } finally {
      setActionLoading(false);
    }
  };

  const handleApprove = async () => {
    if (approveChecklist.length === 0) {
      toast.error('Vui lòng chọn ít nhất 1 nội dung đã xác minh');
      return;
    }
    if (approveChecklist.includes('Khác') && !otherNote.trim()) {
      toast.error('Vui lòng nhập ghi chú chi tiết cho lựa chọn "Khác"');
      return;
    }

    const compiledNotes = approveChecklist
      .map(item => item === 'Khác' ? `Ghi chú khác: ${otherNote.trim()}` : item)
      .join('; ');

    setActionLoading(true);
    try {
      await claimService.approveClaim(id, user.id, compiledNotes);
      toast.success('Yêu cầu đã được phê duyệt thành công. Hệ thống đã gửi thông báo đến sinh viên.');
      setApproveModalOpen(false);
      await loadData();
    } catch (err) {
      toast.error(err.message || 'Không thể phê duyệt yêu cầu');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) {
      toast.error('Vui lòng nhập lý do từ chối');
      return;
    }
    setActionLoading(true);
    try {
      await claimService.rejectClaim(id, user.id, rejectReason);
      toast.success('Đã từ chối yêu cầu và gửi lý do cho sinh viên.');
      setRejectModalOpen(false);
      await loadData();
    } catch (err) {
      toast.error(err.message || 'Không thể từ chối yêu cầu');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReadyForHandover = async () => {
    setActionLoading(true);
    try {
      await claimService.setReadyForHandover(id, user.id);
      toast.success('Đã chuyển sang trạng thái Sẵn sàng bàn giao!');
      await loadData();
    } catch (err) {
      toast.error(err.message || 'Có lỗi xảy ra');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCompleteHandover = async () => {
    if (!evidenceImage) {
      toast.error('Vui lòng cung cấp hình ảnh bằng chứng sinh viên nhận đồ');
      return;
    }

    setActionLoading(true);
    try {
      await claimService.completeHandover(id, {
        staffId: user.id,
        notes: handoverNote,
        date: new Date().toISOString(),
        evidenceImage
      });
      toast.success('Bàn giao tài sản thành công! Hồ sơ đã được lưu trữ.');
      setHandoverModalOpen(false);
      await loadData();
    } catch (err) {
      toast.error(err.message || 'Có lỗi khi ghi nhận bàn giao');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-6 w-36 bg-cream-200 rounded"></div>
        <div className="h-10 w-1/3 bg-cream-200 rounded"></div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-96 bg-cream-200 rounded-card"></div>
          <div className="h-96 bg-cream-200 rounded-card"></div>
        </div>
      </div>
    );
  }

  if (!claim) return null;

  const displayId = claim.id.startsWith('C') && !claim.id.startsWith('CLM')
    ? `#CLM-${claim.id.replace('C', '').padStart(3, '0')}`
    : claim.id.startsWith('CLM') ? `#${claim.id}` : `#CLM-${claim.id}`;

  const itemDisplayId = item?.id ? (item.id.startsWith('P') ? item.id : `P${String(item.id).padStart(3, '0')}`) : 'P005';

  return (
    <div className="space-y-4 pb-32">
      {/* Top Navigation / Back Row */}
      <div className="h-[46px] flex items-center">
        <button
          onClick={() => navigate('/staff/claims')}
          className="inline-flex items-center gap-2 text-sm font-medium text-[#344054] hover:text-[#981B1E] transition-colors group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span>Quay lại danh sách yêu cầu</span>
        </button>
      </div>

      {/* Header Title Card */}
      <div className="bg-white rounded-[14px] p-5 border border-[#E8E2DD] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl sm:text-[26px] font-bold text-slate-900 tracking-tight leading-tight">
              Thẩm định Yêu cầu
            </h1>
            <span className="font-mono font-bold text-[#981B1E] text-sm px-2.5 py-1 bg-[#FBEDEE] border border-[#F0CDD0] rounded-[7px]">
              {displayId}
            </span>
          </div>
          <p className="text-xs text-slate-500 flex items-center gap-1.5 pt-1">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <span>Ngày gửi yêu cầu:</span>
            <span className="font-medium text-slate-700">{formatDateTime(claim.createdAt || '2026-09-14T17:00:00')}</span>
          </p>
        </div>

        <div>
          {claim.status === CLAIM_STATUS.UNDER_REVIEW ? (
            <span className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-[10px] text-sm font-semibold bg-[#EFF6FF] text-[#1D4ED8] border border-[#BFDBFE]">
              <Eye className="w-4 h-4" />
              <span>Đang xem xét</span>
            </span>
          ) : (
            <StatusBadge status={claim.status} type="claim" />
          )}
        </div>
      </div>

      {/* 2-Column Main Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-[0.85fr_1.15fr] gap-6 items-start">
        
        {/* CỘT TRÁI (42%): Thông tin vật phẩm gốc */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-xs overflow-hidden">
            
            {/* Card Header */}
            <div className="px-5 py-4 border-b border-[#F3F4F6] bg-[#FAFAFA] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-[#88171B]/10 text-[#88171B] flex items-center justify-center">
                  <Package className="w-4 h-4" />
                </div>
                <h2 className="font-bold text-slate-800 text-base">Thông tin vật phẩm gốc</h2>
              </div>
              <span className="text-xs font-mono font-semibold bg-slate-100 text-slate-700 px-2.5 py-1 rounded-md border border-slate-200">
                {itemDisplayId}
              </span>
            </div>

            {/* Card Content */}
            <div className="p-5 space-y-5">
              {/* Product Image */}
              <div className="relative group rounded-xl overflow-hidden border border-slate-200 bg-slate-50">
                <img
                  src={item?.images?.[0] || 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=600&auto=format&fit=crop&q=80'}
                  alt={item?.title || 'iPhone 14 Pro Max'}
                  className="w-full h-64 object-cover object-center group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute top-3 left-3">
                  <span className="px-3 py-1 text-xs font-semibold rounded-full bg-slate-900/80 text-white backdrop-blur-md shadow-xs">
                    {item?.type === 'FOUND' ? 'Vật phẩm nhặt được' : 'Vật phẩm mất'}
                  </span>
                </div>
                <button
                  onClick={() => setPreviewImage(item?.images?.[0] || 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=1200&auto=format&fit=crop&q=80')}
                  className="absolute bottom-3 right-3 w-9 h-9 rounded-full bg-white/90 text-slate-700 hover:text-black flex items-center justify-center shadow-md backdrop-blur-xs transition-transform hover:scale-110"
                  title="Phóng to ảnh"
                >
                  <Maximize2 className="w-4 h-4" />
                </button>
              </div>

              {/* Title & Description */}
              <div className="space-y-1.5">
                <h3 className="text-xl font-bold text-slate-900 leading-snug">
                  {item?.title || 'iPhone 14 Pro Max'}
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  {item?.description || 'Màu tím (Deep Purple), bản 256GB, có ốp lưng MagSafe trong suốt viền đen, dán cường lực bị nứt góc phải.'}
                </p>
              </div>

              {/* Info Detail Grid */}
              <div className="pt-4 border-t border-slate-100 space-y-3 text-sm">
                <div className="flex items-center justify-between py-0.5">
                  <span className="text-slate-500 flex items-center gap-2">
                    <Award className="w-4 h-4 text-slate-400" />
                    <span>Danh mục:</span>
                  </span>
                  <span className="font-semibold text-slate-800">{item?.category || 'Điện thoại'}</span>
                </div>

                <div className="flex items-center justify-between py-0.5">
                  <span className="text-slate-500 flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-slate-400" />
                    <span>Nơi tiếp nhận / nhặt được:</span>
                  </span>
                  <span className="font-semibold text-slate-800 text-right max-w-[220px] truncate">
                    {item?.location || 'Giảng đường B'}
                  </span>
                </div>

                <div className="flex items-center justify-between py-0.5">
                  <span className="text-slate-500 flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-slate-400" />
                    <span>Ngày tiếp nhận:</span>
                  </span>
                  <span className="font-semibold text-slate-800">
                    {formatDate(item?.date || item?.createdAt || '2026-09-08')}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* CỘT PHẢI (58%): Người yêu cầu + Đối soát bằng chứng */}
        <div className="space-y-6">
          
          {/* CARD 1: Thông tin người yêu cầu */}
          <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-xs overflow-hidden">
            <div className="px-5 py-4 border-b border-[#F3F4F6] bg-[#FAFAFA] flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-[#88171B]/10 text-[#88171B] flex items-center justify-center">
                <User className="w-4 h-4" />
              </div>
              <h2 className="font-bold text-slate-800 text-base">Thông tin người yêu cầu</h2>
            </div>
            
            <div className="p-5">
              <div className="flex items-start gap-4">
                <Avatar
                  name={claimant?.fullName || claimant?.name || claim.claimantName || 'Trương Quốc Bảo'}
                  src={claimant?.avatar}
                  size="lg"
                  className="w-14 h-14 ring-2 ring-slate-100"
                />
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-bold text-slate-900 truncate">
                    {claimant?.fullName || claimant?.name || claim.claimantName || 'Trương Quốc Bảo'}
                  </h3>
                  
                  <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2.5 text-sm">
                    <div className="flex items-center gap-2 text-slate-600">
                      <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                      <span className="truncate">{claimant?.email || 'bao.truong@dntu.edu.vn'}</span>
                    </div>

                    <div className="flex items-center gap-2 text-slate-600">
                      <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                        MSSV:
                      </span>
                      <span className="font-mono font-semibold text-slate-800">{claimant?.studentId || 'SV20210600'}</span>
                    </div>

                    <div className="flex items-center gap-2 text-slate-600">
                      <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                      <span className="font-mono">{claimant?.phone || '0967788990'}</span>
                    </div>

                    <div className="flex items-center gap-2 text-slate-600">
                      <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                        Khoa:
                      </span>
                      <span className="font-medium text-slate-800 truncate">{claimant?.faculty || 'Công nghệ thông tin'}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* CARD 2: Thông tin đối soát & Bằng chứng */}
          <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-xs overflow-hidden">
            
            {/* Header với Lock Security Badge */}
            <div className="px-5 py-4 border-b border-[#F3F4F6] bg-[#FAFAFA] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-[#88171B]/10 text-[#88171B] flex items-center justify-center">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <h2 className="font-bold text-slate-800 text-base">Thông tin đối soát &amp; Bằng chứng</h2>
              </div>
              
              <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-800 bg-[#FFF9E8] border border-[#F1D58A] px-2.5 py-1 rounded-full shadow-2xs">
                <Lock className="w-3 h-3 text-amber-700" />
                <span>Dữ liệu bảo mật</span>
              </span>
            </div>

            <div className="p-5 space-y-5">
              
              {/* SECTION 1: Lý do xác nhận */}
              <div className="space-y-2">
                <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-500">
                  <FileText className="w-4 h-4 text-slate-400" />
                  <span>Lý do xác nhận / Hoàn cảnh đánh rơi</span>
                </label>
                <div className="p-4 bg-[#FAFAFA] rounded-xl border border-[#D8DEE8] text-sm text-slate-800 leading-relaxed">
                  {claim.message || 'Hôm qua em có học ca 2 tại phòng B.302, sau khi ra về em để quên điện thoại ở góc bàn số 3 dãy thứ 2 từ trên xuống.'}
                </div>
              </div>

              {/* SECTION 2: Đặc điểm bí mật */}
              <div className="space-y-2">
                <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-amber-800">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  <span>Đặc điểm chỉ chủ sở hữu biết</span>
                </label>
                <div className="p-4 bg-[#FFF9E8] rounded-xl border border-[#F1D58A] text-sm text-slate-800 leading-relaxed font-medium">
                  {claim.evidence || 'Hình nền khóa là ảnh mèo màu vàng xám. Mật khẩu 6 số kết thúc bằng 88. Trong khe ốp lưng có 1 tờ tiền 200.000đ gấp đôi.'}
                </div>
              </div>

              {/* SECTION 3: Bằng chứng hình ảnh */}
              <div className="space-y-2">
                <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-500">
                  <ImageIcon className="w-4 h-4 text-slate-400" />
                  <span>Bằng chứng kèm theo (Ảnh chụp / Hóa đơn / Thẻ SV)</span>
                </label>

                {claim.proofImages && claim.proofImages.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {claim.proofImages.map((imgUrl, idx) => (
                      <button
                        key={idx}
                        onClick={() => setPreviewImage(imgUrl)}
                        className="group relative rounded-xl overflow-hidden border border-slate-200 aspect-video bg-slate-50 block text-left"
                      >
                        <img
                          src={imgUrl}
                          alt={`Bằng chứng ${idx + 1}`}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                        <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                          <Maximize2 className="w-5 h-5" />
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="p-5 bg-slate-50 rounded-xl border border-dashed border-slate-300 text-center text-xs text-slate-500 space-y-1">
                    <p className="font-semibold text-slate-600">Chưa có ảnh bằng chứng đính kèm</p>
                    <p>Sinh viên không tải lên hình ảnh hóa đơn hoặc thẻ SV. Kiểm tra qua đối soát đặc điểm riêng và giấy tờ trực tiếp.</p>
                  </div>
                )}
              </div>

              {/* Bằng chứng bàn giao nếu đã hoàn thành */}
              {(claim.evidenceImage || claim.handoverImage) && (
                <div className="pt-4 border-t border-slate-100 space-y-2">
                  <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-emerald-700">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span>Bằng chứng sinh viên đã nhận đồ</span>
                  </label>
                  <button
                    onClick={() => setPreviewImage(claim.evidenceImage || claim.handoverImage)}
                    className="block relative rounded-xl overflow-hidden border border-emerald-200 aspect-video max-w-sm bg-emerald-50 text-left group"
                  >
                    <img
                      src={claim.evidenceImage || claim.handoverImage}
                      alt="Bằng chứng nhận đồ"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* STICKY BOTTOM ACTION BAR */}
      <div className={`fixed bottom-0 right-0 h-[76px] bg-white/95 backdrop-blur-md border-t border-[#E8E2DD] px-6 shadow-[0_-4px_20px_rgba(0,0,0,0.08)] z-40 transition-all duration-300 ${sidebarOpen ? 'lg:left-[240px]' : 'left-0'}`}>
        <div className="max-w-[1440px] mx-auto h-full flex flex-col sm:flex-row items-center justify-between gap-4">
          
          {/* Status Indicator */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 shrink-0 border border-slate-200">
              <ClipboardCheck className="w-5 h-5 text-[#88171B]" />
            </div>
            <div>
              <div className="text-xs uppercase font-bold tracking-wider text-slate-500 flex items-center gap-1.5">
                <span>TRẠNG THÁI:</span>
                <span className="font-extrabold text-blue-700">
                  {claim.status === CLAIM_STATUS.UNDER_REVIEW ? 'Đang xem xét' : (CLAIM_STATUS_CONFIG[claim.status]?.label || claim.status)}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Vui lòng kiểm tra kỹ thông tin trước khi đưa ra quyết định.
              </p>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="flex flex-wrap items-center justify-end gap-3 w-full sm:w-auto">
            {claim.status === CLAIM_STATUS.PENDING && (
              <Button
                variant="primary"
                className="w-full sm:w-auto bg-[#88171B] hover:bg-[#741216] text-white px-6 py-2.5 font-bold shadow-sm"
                loading={actionLoading}
                onClick={handleStartReview}
                icon={Eye}
              >
                Bắt đầu thẩm định
              </Button>
            )}

            {claim.status === CLAIM_STATUS.UNDER_REVIEW && (
              <>
                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={() => setRejectModalOpen(true)}
                  className="w-full sm:w-auto h-12 inline-flex items-center justify-center gap-2 px-5 rounded-xl border border-[#DC4B4B] text-[#C92F2F] bg-white hover:bg-red-50 font-bold text-sm transition-all shadow-2xs"
                >
                  <XCircle className="w-4 h-4 text-[#DC4B4B]" />
                  <span>Từ chối yêu cầu</span>
                </button>

                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={() => setApproveModalOpen(true)}
                  className="w-full sm:w-auto h-12 inline-flex items-center justify-center gap-2 px-6 rounded-xl text-white bg-[#981B1E] hover:bg-[#741216] font-bold text-sm transition-all shadow-sm"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>Duyệt yêu cầu</span>
                </button>
              </>
            )}

            {claim.status === CLAIM_STATUS.APPROVED && (
              <Button
                variant="primary"
                className="w-full sm:w-auto bg-purple-700 hover:bg-purple-800 text-white px-6 py-2.5 font-bold"
                loading={actionLoading}
                onClick={handleReadyForHandover}
                icon={Truck}
              >
                Sẵn sàng bàn giao
              </Button>
            )}

            {claim.status === CLAIM_STATUS.READY_FOR_HANDOVER && (
              <Button
                variant="primary"
                className="w-full sm:w-auto bg-emerald-700 hover:bg-emerald-800 text-white px-6 py-2.5 font-bold"
                onClick={() => setHandoverModalOpen(true)}
                icon={CheckCircle}
                disabled={actionLoading}
              >
                Xác nhận bàn giao &amp; Chụp ảnh
              </Button>
            )}

            {claim.status === CLAIM_STATUS.COMPLETED && (
              <div className="px-4 py-2 bg-emerald-50 text-emerald-800 rounded-xl border border-emerald-200 flex items-center gap-2 font-bold text-sm">
                <CheckCircle className="w-5 h-5 text-emerald-600" />
                Vật phẩm đã bàn giao thành công
              </div>
            )}
            
            {claim.status === CLAIM_STATUS.REJECTED && (
              <div className="px-4 py-2 bg-red-50 text-red-800 rounded-xl border border-red-200 flex items-center gap-2 font-bold text-sm">
                <XCircle className="w-5 h-5 text-red-600" />
                Yêu cầu đã bị từ chối
              </div>
            )}
          </div>
        </div>
      </div>

      {/* MODAL LIGHTBOX IMAGE PREVIEW */}
      {previewImage && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-xs"
          onClick={() => setPreviewImage(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh] overflow-hidden rounded-2xl">
            <img src={previewImage} alt="Phóng to" className="w-full h-full object-contain" />
            <button
              onClick={() => setPreviewImage(null)}
              className="absolute top-4 right-4 w-10 h-10 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/90"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>
      )}

      {/* MODAL 1: TỪ CHỐI */}
      <Modal isOpen={rejectModalOpen} onClose={() => setRejectModalOpen(false)} title="Từ chối yêu cầu nhận đồ">
        <div className="space-y-4">
          <p className="text-sm text-warm-gray-600">
            Vui lòng nhập lý do từ chối. Thông báo và lý do này sẽ được gửi trực tiếp đến tài khoản người yêu cầu.
          </p>
          <Textarea
            placeholder="Nhập lý do từ chối cụ thể (ví dụ: thông tin đặc điểm không trùng khớp, không có giấy tờ xác thực)..."
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            rows={4}
            autoFocus
          />
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="ghost" onClick={() => setRejectModalOpen(false)}>Hủy</Button>
            <Button variant="danger" loading={actionLoading} onClick={handleReject}>Xác nhận từ chối</Button>
          </div>
        </div>
      </Modal>

      {/* MODAL 2: PHÊ DUYỆT */}
      <Modal isOpen={approveModalOpen} onClose={() => setApproveModalOpen(false)} title="Phê duyệt yêu cầu nhận đồ">
        <div className="space-y-4 max-h-[75vh] overflow-y-auto px-1 py-1">
          <p className="text-sm text-warm-gray-600">
            Xác nhận rằng thông tin người gửi cung cấp trùng khớp với tài sản.
          </p>

          <div>
            <label className="block text-sm font-semibold text-text-dark mb-2.5">
              Nội dung đã xác minh <span className="text-red-500">*</span>
            </label>
            <div className="space-y-2.5 bg-cream-50 p-4 rounded-xl border border-cream-200">
              {checklistOptions.map(option => {
                const checked = approveChecklist.includes(option);
                return (
                  <label key={option} className="flex items-center gap-2.5 text-sm text-text-dark cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => handleChecklistToggle(option)}
                      className="w-4 h-4 rounded text-burgundy-700 focus:ring-burgundy-500 border-cream-400"
                    />
                    <span className={checked ? 'font-semibold text-burgundy-900' : 'text-warm-gray-700'}>
                      {option}
                    </span>
                  </label>
                );
              })}
            </div>
          </div>

          {approveChecklist.includes('Khác') && (
            <div className="space-y-1.5 animate-fadeIn">
              <label className="block text-xs font-semibold text-warm-gray-600">
                Ghi chú chi tiết cho mục Khác <span className="text-red-500">*</span>
              </label>
              <Textarea
                placeholder="Nhập ghi chú khác..."
                value={otherNote}
                onChange={(e) => setOtherNote(e.target.value)}
                rows={3}
                autoFocus
              />
            </div>
          )}

          <div className="flex justify-end gap-3 pt-3 border-t border-cream-200">
            <Button variant="ghost" onClick={() => setApproveModalOpen(false)}>Hủy</Button>
            <Button variant="primary" loading={actionLoading} onClick={handleApprove}>Xác nhận duyệt</Button>
          </div>
        </div>
      </Modal>

      {/* MODAL 3: BÀN GIAO */}
      <Modal isOpen={handoverModalOpen} onClose={() => setHandoverModalOpen(false)} title="Biên bản bàn giao tài sản">
        <div className="space-y-4 max-h-[80vh] overflow-y-auto px-1 py-1">
          <div className="p-3.5 bg-emerald-50 text-emerald-800 text-sm rounded-xl border border-emerald-200">
            Xác nhận bàn giao tài sản: <strong>{item?.title}</strong> cho <strong>{claimant?.fullName || claimant?.name || claim.claimantName}</strong> (MSSV: {claimant?.studentId || 'Chưa cập nhật'}).
          </div>
          
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-text-dark">
              Hình ảnh bằng chứng sinh viên nhận đồ <span className="text-red-500">*</span>
            </label>
            <ImageUploadCamera
              value={evidenceImage}
              onChange={setEvidenceImage}
              label="Chụp / Tải ảnh sinh viên và thẻ sinh viên khi nhận đồ"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-semibold text-text-dark">Ghi chú bàn giao</label>
            <Textarea
              placeholder="Ví dụ: Đã đối chiếu CCCD và thẻ sinh viên khớp với thông tin. Sinh viên đã nhận đồ trực tiếp."
              value={handoverNote}
              onChange={(e) => setHandoverNote(e.target.value)}
              rows={3}
            />
          </div>
          
          <div className="flex justify-end gap-3 pt-2 border-t border-cream-200 sticky bottom-0 bg-white p-2 -mx-1">
            <Button variant="ghost" onClick={() => setHandoverModalOpen(false)}>Hủy</Button>
            <Button
              variant="primary"
              className="bg-emerald-700 hover:bg-emerald-800"
              loading={actionLoading}
              onClick={handleCompleteHandover}
            >
              Hoàn tất bàn giao
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
