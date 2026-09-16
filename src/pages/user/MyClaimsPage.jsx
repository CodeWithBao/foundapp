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
    <div className="max-w-4xl mx-auto px-4 py-8">
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
            <div key={i} className="card p-6 animate-pulse h-40" />
          ))}
        </div>
      ) : filteredClaims.length === 0 ? (
        <EmptyState
          icon={Package}
          title="Chưa có yêu cầu nào"
          description="Hiện tại không có yêu cầu nhận lại đồ nào trong mục này."
        />
      ) : (
        <div className="space-y-6">
          {filteredClaims.map(claim => {
            const currentStepIdx = getStepIndex(claim.status);
            const isRejected = claim.status === 'REJECTED';
            const isReadyForHandover = claim.status === 'READY_FOR_HANDOVER' || claim.status === 'APPROVED';
            
            return (
              <div key={claim.id} className="card hover:shadow-card-hover transition-all duration-200 overflow-hidden">
                {/* Card Header */}
                <div className="p-5 border-b border-cream-200 bg-cream-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-4 min-w-0">
                    <img
                      src={claim.item?.images?.[0] || 'https://placehold.co/100x100/png?text=Item'}
                      alt={claim.item?.title || 'Vật phẩm'}
                      className="w-14 h-14 rounded-lg object-cover border border-cream-300 bg-white shrink-0"
                      onError={e => { e.target.src = 'https://placehold.co/100x100/png?text=Item'; }}
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-mono font-bold text-burgundy-700 bg-burgundy-100 px-2 py-0.5 rounded uppercase">
                          Mã YC: {claim.id}
                        </span>
                        <span className="text-xs text-warm-gray-400">• {formatRelative(claim.createdAt)}</span>
                      </div>
                      <Link to={`/items/${claim.itemId}`} className="font-bold text-text-dark hover:text-burgundy-700 text-base truncate block transition-colors">
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
                    <div className="py-4 px-5 bg-white rounded-card border border-cream-200 shadow-sm">
                      <p className="text-[11px] font-bold text-burgundy-700 uppercase tracking-wider mb-5">Tiến trình xử lý yêu cầu</p>
                      
                      {/* Desktop Timeline */}
                      <div className="hidden md:flex items-center justify-between relative px-2">
                        {/* Background Bar */}
                        <div className="absolute top-3.5 left-6 right-6 h-1 bg-cream-200 rounded-full" />
                        {/* Active Progress Bar */}
                        <div 
                          className="absolute top-3.5 left-6 h-1 bg-burgundy-600 rounded-full transition-all duration-700 ease-out" 
                          style={{ width: `calc(${(currentStepIdx / (TIMELINE_STEPS.length - 1)) * 100}% - 48px)` }}
                        />

                        {TIMELINE_STEPS.map((step, idx) => {
                          const isDone = idx < currentStepIdx;
                          const isCurrent = idx === currentStepIdx;
                          
                          return (
                            <div key={step.id} className="flex flex-col items-center relative z-10">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-all duration-300 ${
                                isDone 
                                  ? 'bg-burgundy-600 text-white shadow-sm' 
                                  : isCurrent 
                                    ? 'bg-burgundy-600 text-white ring-4 ring-burgundy-100 shadow-sm' 
                                    : 'bg-white border-2 border-cream-300 text-warm-gray-400'
                              }`}>
                                {isDone ? <Check className="w-4 h-4" /> : idx + 1}
                              </div>
                              <span className={`text-[11px] font-bold mt-2 text-center w-20 leading-tight ${
                                isCurrent ? 'text-burgundy-700' : isDone ? 'text-text-dark' : 'text-warm-gray-400'
                              }`}>
                                {step.label}
                              </span>
                            </div>
                          );
                        })}
                      </div>

                      {/* Mobile Timeline */}
                      <div className="flex md:hidden flex-col space-y-4">
                        {TIMELINE_STEPS.map((step, idx) => {
                          const isDone = idx < currentStepIdx;
                          const isCurrent = idx === currentStepIdx;
                          
                          return (
                            <div key={step.id} className="flex items-center gap-3 relative">
                              {idx !== TIMELINE_STEPS.length - 1 && (
                                <div className={`absolute top-6 left-3 w-0.5 h-6 -ml-px ${isDone ? 'bg-burgundy-600' : 'bg-cream-200'}`} />
                              )}
                              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold z-10 ${
                                isDone || isCurrent 
                                  ? 'bg-burgundy-600 text-white' 
                                  : 'bg-cream-200 text-warm-gray-500'
                              }`}>
                                {isDone ? <Check className="w-3 h-3" /> : idx + 1}
                              </div>
                              <span className={`text-xs ${
                                isCurrent ? 'font-bold text-burgundy-700' : isDone ? 'font-semibold text-text-dark' : 'font-medium text-warm-gray-400'
                              }`}>
                                {step.label}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 bg-red-50 border border-red-200 rounded-card flex items-start gap-3 text-red-800">
                      <XCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-bold text-sm">Yêu cầu bị từ chối</p>
                        <p className="text-xs mt-1">Thông tin xác minh của bạn chưa đủ chính xác hoặc có người khác đã cung cấp bằng chứng thuyết phục hơn.</p>
                      </div>
                    </div>
                  )}

                  {/* Ready for Handover Alert Box */}
                  {isReadyForHandover && !isRejected && (
                    <div className="p-5 bg-emerald-50 border border-emerald-200 rounded-card flex items-start gap-3 shadow-sm">
                      <MapPin className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" />
                      <div className="text-emerald-900 space-y-1.5 text-sm">
                        <p className="font-bold text-base text-emerald-800">Yêu cầu đã được phê duyệt!</p>
                        <p className="text-emerald-700">Vui lòng mang theo <strong className="font-bold">Thẻ Sinh Viên / CCCD</strong> đến <strong className="font-bold">Phòng Bảo vệ (Cổng chính)</strong> hoặc <strong className="font-bold">Phòng Công tác Sinh viên (Tòa A)</strong> để đối chiếu trực tiếp và nhận lại tài sản của bạn.</p>
                      </div>
                    </div>
                  )}

                  {/* Claim Details (Reason / Proof) */}
                  <div className="bg-cream-50 rounded-card p-4 border border-cream-200 space-y-4 text-sm">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider text-warm-gray-500 mb-1">Nội dung khai báo của bạn</p>
                      <p className="text-text-dark font-medium leading-relaxed bg-white p-3 rounded-card border border-cream-200">
                        {claim.reason || claim.message || "Không có nội dung mô tả."}
                      </p>
                    </div>

                    {claim.proofImage && (
                      <div>
                        <p className="text-xs font-bold uppercase tracking-wider text-warm-gray-500 mb-1">Hình ảnh đính kèm</p>
                        <img 
                          src={claim.proofImage} 
                          alt="Bằng chứng" 
                          className="w-32 h-32 object-cover rounded-card border border-cream-300"
                        />
                      </div>
                    )}

                    {claim.reviewNote && (
                      <div className="bg-amber-50 border border-amber-200 rounded-card p-3 text-amber-900 mt-2">
                        <p className="text-xs font-bold uppercase tracking-wider mb-1 text-amber-800">Ghi chú từ Ban Quản lý / Bảo vệ:</p>
                        <p className="font-medium text-sm">{claim.reviewNote}</p>
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
