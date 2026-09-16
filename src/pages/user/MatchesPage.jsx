import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, MapPin, Calendar, Tag, ArrowRight, Hand, ArrowLeftRight, ExternalLink } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import matchingService from '../../services/matchingService';
import claimService from '../../services/claimService';
import EmptyState from '../../components/common/EmptyState';
import Modal from '../../components/common/Modal';
import Textarea from '../../components/common/Textarea';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import LoadingSkeleton from '../../components/common/LoadingSkeleton';
import PageHeader from '../../components/common/PageHeader';
import { formatDate } from '../../utils';
import { toast } from 'sonner';

export default function MatchesPage() {
  const { user } = useAuth();
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);

  // Claim modal state
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [claimReason, setClaimReason] = useState('');
  const [proofImage, setProofImage] = useState('');
  const [submittingClaim, setSubmittingClaim] = useState(false);

  useEffect(() => {
    if (user?.id) loadMatches();
  }, [user?.id]);

  const loadMatches = async () => {
    setLoading(true);
    try {
      const data = await matchingService.getMatchesForUser(user.id);
      setMatches(data || []);
    } catch (err) {
      toast.error(err.message || 'Lỗi tải dữ liệu đối chiếu vật phẩm');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenClaimModal = (match) => {
    setSelectedMatch(match);
    setClaimReason('');
    setProofImage('');
  };

  const handleSendClaim = async (e) => {
    e.preventDefault();
    if (!claimReason.trim()) {
      toast.error('Vui lòng nhập lý do / bằng chứng sở hữu');
      return;
    }
    setSubmittingClaim(true);
    try {
      const itemToClaim = selectedMatch.foundItem;
      await claimService.createClaim({
        itemId: itemToClaim.id,
        claimantId: user.id,
        claimantName: user.name,
        reason: claimReason,
        proofImage: proofImage || undefined,
      });
      toast.success('Đã gửi yêu cầu nhận lại đồ thành công!');
      setSelectedMatch(null);
    } catch (err) {
      toast.error(err.message || 'Không thể gửi yêu cầu');
    } finally {
      setSubmittingClaim(false);
    }
  };

  const getScoreTheme = (score) => {
    if (score >= 80) {
      return {
        badge: 'bg-emerald-100 text-emerald-800 border-emerald-300',
        bar: 'bg-emerald-500',
        text: 'text-emerald-700',
        label: 'Rất cao',
      };
    }
    if (score >= 60) {
      return {
        badge: 'bg-amber-100 text-amber-800 border-amber-300',
        bar: 'bg-amber-500',
        text: 'text-amber-700',
        label: 'Khá cao',
      };
    }
    return {
      badge: 'bg-rose-100 text-rose-800 border-rose-300',
      bar: 'bg-rose-500',
      text: 'text-rose-700',
      label: 'Trung bình',
    };
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <PageHeader
        title="Đối chiếu & Gợi ý trùng khớp"
        subtitle="Hệ thống tự động so sánh thông tin các đồ bị mất của bạn với danh sách đồ nhặt được."
      />

      {loading ? (
        <div className="space-y-4 mt-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="card p-6 animate-pulse h-40" />
          ))}
        </div>
      ) : matches.length === 0 ? (
        <div className="mt-6">
          <EmptyState
            icon={Sparkles}
            title="Chưa phát hiện trùng khớp nào"
            description="Hệ thống chưa tìm thấy bài báo nhặt được nào khớp thông tin với bài báo mất của bạn. Vui lòng kiểm tra lại sau."
          />
        </div>
      ) : (
        <div className="space-y-6 mt-6">
          {matches.map((m, idx) => {
            const lost = m.lostItem;
            const found = m.foundItem;
            const score = m.score || 0;
            const theme = getScoreTheme(score);

            return (
              <div key={idx} className="card p-6 hover:shadow-card-hover transition-all duration-200">
                {/* Header score & Progress bar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 mb-4 border-b border-cream-200">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-champagne-500" />
                    <span className="font-bold text-text-dark text-sm">Độ tương đồng thuật toán</span>
                    <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold border ${theme.badge}`}>
                      {score}% ({theme.label})
                    </span>
                  </div>

                  {/* Score Progress Bar */}
                  <div className="flex items-center gap-3 w-full sm:w-64">
                    <div className="w-full bg-cream-200 rounded-full h-2.5 overflow-hidden">
                      <div
                        className={`h-2.5 rounded-full transition-all duration-500 ${theme.bar}`}
                        style={{ width: `${Math.min(100, Math.max(0, score))}%` }}
                      />
                    </div>
                    <span className={`text-xs font-bold ${theme.text} w-8 text-right`}>{score}%</span>
                  </div>
                </div>

                {/* 2 Items comparison: Lost ↔ Found */}
                <div className="grid grid-cols-1 md:grid-cols-11 gap-4 items-center">
                  {/* Lost Item Side */}
                  <div className="md:col-span-5 bg-cream-50 p-4 rounded-card border border-cream-200">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[11px] uppercase font-bold text-dntu-danger bg-red-100 px-2 py-0.5 rounded">
                        Đồ bạn đã báo mất
                      </span>
                      <span className="text-xs text-warm-gray-400">{formatDate(lost?.date)}</span>
                    </div>

                    <div className="flex items-start gap-3">
                      <img
                        src={lost?.images?.[0] || 'https://placehold.co/100x100/png?text=Lost'}
                        alt={lost?.title}
                        className="w-16 h-16 rounded-lg object-cover border border-cream-300 shrink-0 bg-white"
                        onError={e => { e.target.src = 'https://placehold.co/100x100/png?text=Lost'; }}
                      />
                      <div className="min-w-0 flex-1">
                        <h4 className="font-bold text-text-dark text-sm truncate">{lost?.title}</h4>
                        <p className="text-xs text-warm-gray-500 mt-1 flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-burgundy-600" /> {lost?.location}
                        </p>
                        <p className="text-xs text-warm-gray-500 mt-0.5 flex items-center gap-1">
                          <Tag className="w-3 h-3 text-burgundy-600" /> {lost?.category}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Middle Arrow Divider */}
                  <div className="md:col-span-1 flex items-center justify-center my-2 md:my-0">
                    <div className="w-10 h-10 rounded-full bg-cream-200 border border-cream-300 flex items-center justify-center text-burgundy-700 shadow-xs">
                      <ArrowLeftRight className="w-5 h-5" />
                    </div>
                  </div>

                  {/* Found Item Side */}
                  <div className="md:col-span-5 bg-emerald-50/50 p-4 rounded-card border border-emerald-200">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[11px] uppercase font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
                        Đồ nhặt được có khả năng khớp
                      </span>
                      <span className="text-xs text-warm-gray-400">{formatDate(found?.date)}</span>
                    </div>

                    <div className="flex items-start gap-3">
                      <img
                        src={found?.images?.[0] || 'https://placehold.co/100x100/png?text=Found'}
                        alt={found?.title}
                        className="w-16 h-16 rounded-lg object-cover border border-emerald-200 shrink-0 bg-white"
                        onError={e => { e.target.src = 'https://placehold.co/100x100/png?text=Found'; }}
                      />
                      <div className="min-w-0 flex-1">
                        <h4 className="font-bold text-text-dark text-sm truncate">{found?.title}</h4>
                        <p className="text-xs text-warm-gray-500 mt-1 flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-emerald-600" /> {found?.location}
                        </p>
                        <p className="text-xs text-warm-gray-500 mt-0.5 flex items-center gap-1">
                          <Tag className="w-3 h-3 text-emerald-600" /> {found?.category}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer Action buttons */}
                <div className="flex items-center justify-end gap-3 pt-4 mt-4 border-t border-cream-200">
                  <Link to={`/items/${found?.id}`}>
                    <Button variant="secondary" size="sm">
                      <ExternalLink className="w-3.5 h-3.5 mr-1" /> Xem chi tiết
                    </Button>
                  </Link>
                  <Button
                    size="sm"
                    onClick={() => handleOpenClaimModal(m)}
                    className="btn-primary"
                  >
                    <Hand className="w-3.5 h-3.5 mr-1" /> Gửi yêu cầu nhận lại
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Claim Request Modal */}
      {selectedMatch && (
        <Modal
          isOpen={!!selectedMatch}
          onClose={() => setSelectedMatch(null)}
          title="Gửi yêu cầu nhận lại vật phẩm"
        >
          <form onSubmit={handleSendClaim} className="space-y-4 pt-2">
            <div className="p-3 bg-cream-50 rounded-card border border-cream-300 text-xs text-warm-gray-600">
              Bạn đang gửi yêu cầu xác minh nhận lại: <strong className="text-text-dark font-bold">{selectedMatch.foundItem?.title}</strong>
            </div>

            <Textarea
              label="Bằng chứng sở hữu / Mô tả chi tiết *"
              placeholder="Vui lòng nêu chi tiết các đặc điểm nhận dạng bảo mật (vết xước, hình nền, mật khẩu, nội dung bên trong...) để Ban quản lý xác minh..."
              value={claimReason}
              onChange={e => setClaimReason(e.target.value)}
              rows={4}
              required
            />

            <Input
              label="URL Hình ảnh bằng chứng sở hữu (Tùy chọn)"
              placeholder="https://example.com/bang-chung.jpg"
              value={proofImage}
              onChange={e => setProofImage(e.target.value)}
            />

            <div className="flex justify-end gap-3 pt-4 border-t border-cream-200">
              <Button type="button" variant="ghost" onClick={() => setSelectedMatch(null)}>
                Hủy bỏ
              </Button>
              <Button type="submit" loading={submittingClaim} className="btn-primary">
                Gửi yêu cầu
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
