import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Package, CheckCircle2, XCircle, MapPin, Check, ExternalLink } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import claimService from '../../services/claimService';
import { CLAIM_STATUS_CONFIG, STORAGE_KEYS } from '../../constants';
import storageService from '../../services/storageService';
import EmptyState from '../../components/common/EmptyState';
import Tabs from '../../components/common/Tabs';
import PageHeader from '../../components/common/PageHeader';
import { StatusBadge } from '../../components/common/Badge';
import { formatRelative } from '../../utils';
import { toast } from 'sonner';
import Button from '../../components/common/Button';

// PENDING → UNDER_REVIEW → APPROVED → READY_FOR_HANDOVER → COMPLETED
const TIMELINE_STEPS = [
  { id: 'PENDING', label: 'Tạo yêu cầu' },
  { id: 'UNDER_REVIEW', label: 'Đang xem xét' },
  { id: 'APPROVED', label: 'Đã duyệt' },
  { id: 'READY_FOR_HANDOVER', label: 'Chờ bàn giao' },
  { id: 'COMPLETED', label: 'Hoàn tất' },
];

export default function MyClaimsPage() {
  const { user } = useAuth();
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    if (user?.id) loadClaims();
  }, [user?.id]);

  const loadClaims = async () => {
    setLoading(true);
    try {
      const data = await claimService.getClaims({ claimantId: user.id });
      const items = storageService.get(STORAGE_KEYS.ITEMS) || [];
      const enriched = data.map(c => ({
        ...c,
        item: items.find(i => i.id === c.itemId),
      }));
      setClaims(enriched);
    } catch (err) {
      toast.error(err.message || 'Không thể tải danh sách yêu cầu');
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { key: 'all', label: 'Tất cả' },
    { key: 'pending', label: 'Chờ xử lý' },
    { key: 'approved', label: 'Đã duyệt' },
    { key: 'rejected', label: 'Bị từ chối' },
  ];

  const filteredClaims = claims.filter(c => {
    if (activeTab === 'pending') return ['PENDING', 'UNDER_REVIEW'].includes(c.status);
    if (activeTab === 'approved') return ['APPROVED', 'READY_FOR_HANDOVER', 'COMPLETED', 'RETURNED', 'HANDOVER_COMPLETED'].includes(c.status);
    if (activeTab === 'rejected') return c.status === 'REJECTED';
    return true;
  });

  const getStepIndex = (status) => {
    if (status === 'REJECTED') return -1;
    if (status === 'PENDING') return 0;
    if (status === 'UNDER_REVIEW') return 1;
    if (status === 'APPROVED') return 2;
    if (status === 'READY_FOR_HANDOVER') return 3;
    if (status === 'COMPLETED' || status === 'RETURNED' || status === 'HANDOVER_COMPLETED') return 4;
    return 0; // default
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-10">
      <PageHeader
        title="Yêu cầu nhận lại vật phẩm"
        subtitle="Theo dõi tiến trình xét duyệt và nhận lại tài sản bạn đã yêu cầu."
      />

      <div className="mb-6">
        <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="surface p-6 animate-pulse h-36" />
          ))}
        </div>
      ) : filteredClaims.length === 0 ? (
        <div className="surface p-8 text-center">
          <EmptyState
            icon={Package}
            title="Chưa có yêu cầu nào"
            description="Hiện tại không có yêu cầu nhận lại đồ nào trong mục này."
          />
        </div>
      ) : (
        <div className="space-y-6">
          {filteredClaims.map(claim => {
            const currentStepIdx = getStepIndex(claim.status);
            const isRejected = claim.status === 'REJECTED';
            const isReadyForHandover = claim.status === 'READY_FOR_HANDOVER' || claim.status === 'APPROVED';
            
            return (
              <div key={claim.id} className="surface hover:shadow-card-hover transition-all duration-200 overflow-hidden">
                {/* Card Header */}
                <div className="p-5 border-b border-[#E0E2E6] bg-[#FAF8F2]/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-4 min-w-0">
                    <img
                      src={claim.item?.images?.[0] || 'https://placehold.co/100x100/png?text=Item'}
                      alt={claim.item?.title || 'Vật phẩm'}
                      className="w-14 h-14 rounded-xl object-cover border border-[#E0E2E6] bg-white shrink-0 shadow-xs"
                      onError={e => { e.target.src = 'https://placehold.co/100x100/png?text=Item'; }}
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-mono font-bold text-[#AD222B] bg-red-50 border border-red-200/80 px-2 py-0.5 rounded uppercase">
                          Mã YC: {claim.id}
                        </span>
                        <span className="text-xs font-mono text-[#8C95A3]">• {formatRelative(claim.createdAt)}</span>
                      </div>
                      <Link to={`/items/${claim.itemId}`} className="font-semibold text-[#1C2530] hover:text-[#AD222B] text-base truncate block transition-colors">
                        {claim.item?.title || `Vật phẩm ID: ${claim.itemId}`}
                      </Link>
                    </div>
                  </div>
                  <div className="shrink-0 flex items-center justify-end w-full sm:w-auto">
                     <StatusBadge status={claim.status} type="claim" />
                  </div>
                </div>

                {/* Card Body - Timeline & Details */}
                <div className="p-5 space-y-6">
                  {/* Timeline (Desktop horizontal, Mobile vertical) */}
                  {!isRejected ? (
                    <div className="py-4 px-5 bg-white rounded-xl border border-[#E0E2E6] shadow-xs">
                      <p className="label-micro text-[#AD222B] mb-5">Tiến trình xử lý yêu cầu</p>
                      
                      {/* Desktop Timeline */}
                      <div className="hidden md:flex items-center justify-between relative px-2">
                        {/* Background Bar */}
                        <div className="absolute top-3.5 left-6 right-6 h-0.5 bg-[#E0E2E6] rounded-full" />
                        {/* Active Progress Bar */}
                        <div 
                          className="absolute top-3.5 left-6 h-0.5 bg-[#AD222B] rounded-full transition-all duration-700 ease-out" 
                          style={{ width: `calc(${(currentStepIdx / (TIMELINE_STEPS.length - 1)) * 100}% - 48px)` }}
                        />

                        {TIMELINE_STEPS.map((step, idx) => {
                          const isDone = idx < currentStepIdx;
                          const isCurrent = idx === currentStepIdx;
                          
                          return (
                            <div key={step.id} className="flex flex-col items-center relative z-10">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-mono font-bold text-xs transition-all duration-300 ${
                                isDone 
                                  ? 'bg-[#1C2530] text-[#E4C87F] shadow-xs' 
                                  : isCurrent 
                                  ? 'bg-[#AD222B] text-white ring-4 ring-red-100 shadow-sm'
                                  : 'bg-[#F2EFE9] text-[#8C95A3] border border-[#E0E2E6]'
                              }`}>
                                {isDone ? <Check className="w-4 h-4" /> : idx + 1}
                              </div>
                              <span className={`text-xs mt-2 font-medium ${
                                isCurrent ? 'text-[#AD222B] font-bold' : isDone ? 'text-[#1C2530]' : 'text-[#8C95A3]'
                              }`}>
                                {step.label}
                              </span>
                            </div>
                          );
                        })}
                      </div>

                      {/* Mobile Timeline */}
                      <div className="md:hidden space-y-3 pt-1">
                        {TIMELINE_STEPS.map((step, idx) => {
                          const isDone = idx < currentStepIdx;
                          const isCurrent = idx === currentStepIdx;

                          return (
                            <div key={step.id} className="flex items-center gap-3">
                              <div className={`w-6 h-6 rounded-full flex items-center justify-center font-mono font-bold text-[10px] shrink-0 ${
                                isDone 
                                  ? 'bg-[#1C2530] text-[#E4C87F]' 
                                  : isCurrent 
                                  ? 'bg-[#AD222B] text-white ring-2 ring-red-100'
                                  : 'bg-[#F2EFE9] text-[#8C95A3]'
                              }`}>
                                {isDone ? <Check className="w-3 h-3" /> : idx + 1}
                              </div>
                              <span className={`text-xs ${
                                isCurrent ? 'text-[#AD222B] font-bold' : isDone ? 'text-[#1C2530]' : 'text-[#8C95A3]'
                              }`}>
                                {step.label}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 bg-red-50/70 border border-red-200/80 rounded-xl flex items-start gap-3">
                      <XCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                      <div className="text-xs">
                        <p className="font-semibold text-red-900">Yêu cầu nhận lại bị từ chối</p>
                        <p className="text-red-700 mt-0.5">
                          Lý do: {claim.adminNote || 'Thông tin mô tả nhận dạng chưa trùng khớp với vật phẩm thực tế hoặc người nhặt đã xác nhận không phải.'}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Ready for Handover Alert Box */}
                  {isReadyForHandover && !isRejected && (
                    <div className="p-4 bg-emerald-50/70 border border-emerald-200/80 rounded-xl flex items-start gap-3 shadow-xs">
                      <MapPin className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                      <div className="text-emerald-900 space-y-1 text-xs sm:text-sm">
                        <p className="font-bold text-emerald-800">Yêu cầu đã được phê duyệt!</p>
                        <p className="text-emerald-700">Vui lòng mang theo <strong className="font-bold">Thẻ Sinh Viên / CCCD</strong> đến <strong className="font-bold">Phòng Bảo vệ (Cổng chính)</strong> hoặc <strong className="font-bold">Phòng Công tác Sinh viên (Tòa A)</strong> để đối chiếu trực tiếp và nhận lại tài sản của bạn.</p>
                      </div>
                    </div>
                  )}

                  {/* Claim Details (Reason / Proof) */}
                  <div className="bg-[#FAF8F2] rounded-xl p-4 border border-[#E0E2E6] space-y-4 text-xs sm:text-sm">
                    <div>
                      <p className="label-micro text-[#8C95A3] mb-1">Nội dung khai báo của bạn</p>
                      <p className="text-[#1C2530] font-medium leading-relaxed bg-white p-3 rounded-lg border border-[#E0E2E6]">
                        {claim.reason || claim.message || "Không có nội dung mô tả."}
                      </p>
                    </div>

                    {claim.proofImage && (
                      <div>
                        <p className="label-micro text-[#8C95A3] mb-1">Hình ảnh đính kèm</p>
                        <img 
                          src={claim.proofImage} 
                          alt="Bằng chứng" 
                          className="w-32 h-32 object-cover rounded-xl border border-[#E0E2E6]"
                        />
                      </div>
                    )}

                    {claim.reviewNote && (
                      <div className="bg-amber-50/80 border border-amber-200/80 rounded-xl p-3 text-amber-900 mt-2">
                        <p className="label-micro text-amber-800 mb-1">Ghi chú từ Ban Quản lý / Bảo vệ:</p>
                        <p className="font-medium text-xs sm:text-sm">{claim.reviewNote}</p>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex justify-end pt-2">
                    <Link to={`/items/${claim.itemId}`}>
                      <Button variant="outline" size="sm" className="bg-white">
                        <ExternalLink className="w-4 h-4 mr-1.5" /> Xem chi tiết bài đăng
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
