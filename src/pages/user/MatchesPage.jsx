import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeftRight, CalendarDays, CheckCircle2, ExternalLink, Filter,
  Hand, MapPin, RefreshCw, SearchCheck, ShieldCheck, Sparkles, Tag,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import matchingService from '../../services/matchingService';
import claimService from '../../services/claimService';
import EmptyState from '../../components/common/EmptyState';
import Modal from '../../components/common/Modal';
import Textarea from '../../components/common/Textarea';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import { formatDate } from '../../utils';
import { toast } from 'sonner';

const SCORE_PARTS = [
  ['image', 'Hình ảnh'], ['text', 'Nội dung'], ['category', 'Danh mục'], ['location', 'Vị trí'],
  ['date', 'Thời gian'], ['color', 'Màu sắc'], ['brand', 'Thương hiệu'],
];

const imageFor = item => item?.images?.[0] || 'https://placehold.co/640x480/f3ede7/7c2d40?text=UniFind+DNTU';

function scoreTheme(score) {
  if (score >= 75) return { label: 'Khả năng cao', badge: 'bg-emerald-100 text-emerald-800 border-emerald-200', ring: '#059669', bar: 'bg-emerald-500' };
  if (score >= 55) return { label: 'Cần kiểm tra', badge: 'bg-amber-100 text-amber-800 border-amber-200', ring: '#d97706', bar: 'bg-amber-500' };
  return { label: 'Có điểm tương đồng', badge: 'bg-blue-100 text-blue-800 border-blue-200', ring: '#2563eb', bar: 'bg-blue-500' };
}

function ItemSnapshot({ item, kind }) {
  const found = kind === 'found';
  return (
    <article className={`overflow-hidden rounded-2xl border bg-white ${found ? 'border-emerald-200' : 'border-rose-200'}`}>
      <div className="relative aspect-[16/10] overflow-hidden bg-cream-100">
        <img src={imageFor(item)} alt={item?.title || 'Vật phẩm'} className="h-full w-full object-cover transition duration-500 hover:scale-105" onError={event => { event.currentTarget.src = 'https://placehold.co/640x480/f3ede7/7c2d40?text=UniFind+DNTU'; }} />
        <span className={`absolute left-3 top-3 rounded-full px-3 py-1 text-[11px] font-extrabold uppercase tracking-wide text-white shadow ${found ? 'bg-emerald-700' : 'bg-rose-700'}`}>
          {found ? 'Đồ nhặt được' : 'Đồ bạn báo mất'}
        </span>
      </div>
      <div className="space-y-2 p-4">
        <h3 className="line-clamp-1 font-bold text-text-dark">{item?.title}</h3>
        <p className="flex items-center gap-2 text-sm text-warm-gray-500"><MapPin size={15} className={found ? 'text-emerald-700' : 'text-rose-700'} /> {item?.location || 'Chưa rõ vị trí'}</p>
        <p className="flex items-center gap-2 text-sm text-warm-gray-500"><CalendarDays size={15} /> {formatDate(item?.date)}</p>
        <p className="flex items-center gap-2 text-sm text-warm-gray-500"><Tag size={15} /> {item?.category || 'Chưa phân loại'}</p>
      </div>
    </article>
  );
}

export default function MatchesPage() {
  const { user } = useAuth();
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedLostId, setSelectedLostId] = useState('all');
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [claimReason, setClaimReason] = useState('');
  const [proofImage, setProofImage] = useState('');
  const [submittingClaim, setSubmittingClaim] = useState(false);

  const loadMatches = async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      setMatches(await matchingService.getMatchesForUser(user.id));
    } catch (error) {
      toast.error(error.message || 'Không tải được danh sách đối chiếu');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadMatches(); }, [user?.id]);

  const lostReports = useMemo(() => {
    const unique = new Map();
    matches.forEach(match => unique.set(String(match.lostItem?.id), match.lostItem));
    return [...unique.values()];
  }, [matches]);

  const visibleMatches = selectedLostId === 'all' ? matches : matches.filter(match => String(match.lostItem?.id) === selectedLostId);
  const highConfidence = matches.filter(match => match.score >= 75).length;

  const openClaim = match => {
    setSelectedMatch(match);
    setClaimReason('');
    setProofImage('');
  };

  const submitClaim = async event => {
    event.preventDefault();
    if (!claimReason.trim()) return toast.error('Vui lòng nhập đặc điểm bí mật để nhân viên xác minh.');
    setSubmittingClaim(true);
    try {
      await claimService.createClaim({
        itemId: selectedMatch.foundItem.id,
        claimantId: user.id,
        claimantName: user.name,
        reason: claimReason.trim(),
        proofImage: proofImage || undefined,
      });
      toast.success('Đã gửi yêu cầu xác minh. Nhân viên DNTU sẽ kiểm tra trước khi bàn giao.');
      setSelectedMatch(null);
    } catch (error) {
      toast.error(error.message || 'Không gửi được yêu cầu nhận lại');
    } finally {
      setSubmittingClaim(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-10">
      <section className="relative overflow-hidden surface p-6 sm:p-8 mb-8">
        <div className="absolute inset-y-0 right-0 hidden w-2/5 bg-[url('/DNTU_Web_Asset_Kit/backgrounds/dntu-campus-clean-960.webp')] bg-cover bg-center opacity-[.06] md:block" />
        <div className="relative max-w-3xl">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-red-200/80 bg-red-50/80 px-3 py-1 text-[11px] font-mono font-semibold uppercase tracking-wider text-[#AD222B]">
            <SearchCheck size={14} /> Đối chiếu thông minh
          </div>
          <h1 className="page-title text-3xl md:text-4xl text-[#1C2530]">Danh sách đồ nghi vấn trùng khớp</h1>
          <p className="mt-2.5 max-w-2xl leading-relaxed text-sm text-[#5B6574]">Hệ thống AI tự động so sánh ảnh, tên, mô tả, đặc điểm, danh mục, vị trí và thời gian. Điểm cao là gợi ý hỗ trợ — Cán bộ DNTU sẽ tiến hành xác minh chính xác trước khi bàn giao.</p>
        </div>
        <div className="relative mt-6 grid grid-cols-2 gap-3.5 sm:grid-cols-3">
          <div className="rounded-xl bg-[#1C2530] p-4 text-[#FAF8F2] shadow-sm">
            <p className="text-2xl font-serif font-bold text-[#E4C87F]">{matches.length}</p>
            <p className="text-xs text-white/70 font-mono mt-0.5">Kết quả tương tự</p>
          </div>
          <div className="rounded-xl border border-emerald-200/80 bg-emerald-50/70 p-4">
            <p className="text-2xl font-serif font-bold text-emerald-800">{highConfidence}</p>
            <p className="text-xs text-emerald-700 font-mono mt-0.5">Khả năng cao (≥ 75%)</p>
          </div>
          <div className="col-span-2 rounded-xl border border-[#E0E2E6] bg-[#FAF8F2] p-4 sm:col-span-1">
            <p className="text-2xl font-serif font-bold text-[#1C2530]">{lostReports.length}</p>
            <p className="text-xs text-[#5B6574] font-mono mt-0.5">Hồ sơ đang đối chiếu</p>
          </div>
        </div>
      </section>

      <div className="mb-6 flex flex-col gap-3 surface p-4 sm:flex-row sm:items-center sm:justify-between">
        <label className="flex min-w-0 items-center gap-2 text-xs sm:text-sm font-medium text-[#1C2530]">
          <Filter size={16} className="text-[#AD222B]" />
          <span className="shrink-0 font-mono text-xs uppercase tracking-wider text-[#5B6574]">Lọc hồ sơ:</span>
          <select value={selectedLostId} onChange={event => setSelectedLostId(event.target.value)} className="min-w-0 rounded-lg border border-[#E0E2E6] bg-white px-3 py-1.5 text-xs sm:text-sm outline-none focus:ring-2 focus:ring-[#AD222B]/20">
            <option value="all">Tất cả đồ đã báo mất</option>
            {lostReports.map(item => <option key={item.id} value={String(item.id)}>{item.title}</option>)}
          </select>
        </label>
        <button onClick={loadMatches} disabled={loading} className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#E0E2E6] px-4 py-2 text-xs font-mono font-bold text-[#1C2530] hover:bg-[#FAF8F2] transition disabled:opacity-50">
          <RefreshCw size={14} className={loading ? 'animate-spin text-[#AD222B]' : ''} /> Quét lại dữ liệu
        </button>
      </div>

      {loading ? (
        <div className="space-y-4">{[1, 2, 3].map(item => <div key={item} className="h-64 animate-pulse rounded-2xl border border-[#E0E2E6] bg-white/70" />)}</div>
      ) : visibleMatches.length === 0 ? (
        <div className="surface p-8 text-center">
          <EmptyState icon={Sparkles} title="Chưa có món nào đủ điểm tương đồng" description="Hệ thống vẫn đang liên tục quét. Khi có bài báo nhặt mới phù hợp, hệ thống sẽ tạo thông báo và hiển thị ngay tại đây." />
        </div>
      ) : (
        <div className="space-y-6">
          {visibleMatches.map((match, index) => {
            const theme = scoreTheme(match.score);
            const score = Math.round(match.score * 10) / 10;
            return (
              <article key={match.matchId || `${match.lostItem?.id}-${match.foundItem?.id}-${index}`} className="surface overflow-hidden hover:shadow-card-hover transition-all duration-300">
                <header className="flex flex-col gap-4 border-b border-[#E0E2E6] bg-[#FAF8F2]/60 p-5 md:flex-row md:items-center md:justify-between md:px-6">
                  <div className="flex items-center gap-4">
                    <div className="relative grid h-16 w-16 shrink-0 place-items-center rounded-full" style={{ background: `conic-gradient(${theme.ring} ${score * 3.6}deg, #E0E2E6 0deg)` }}>
                      <div className="grid h-13 w-13 place-items-center rounded-full bg-white"><strong className="text-base font-mono font-bold text-[#1C2530]">{score}%</strong></div>
                    </div>
                    <div>
                      <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-[11px] font-mono font-bold uppercase tracking-wider ${theme.badge}`}>{theme.label}</span>
                      <h2 className="font-serif font-semibold text-lg text-[#1C2530] mt-1">Kết quả khớp #{index + 1}</h2>
                      <p className="text-xs text-[#5B6574]">Đây là gợi ý nghi vấn, cần xác minh trước khi bàn giao.</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 md:max-w-md md:justify-end">
                    {(match.reasons?.length ? match.reasons : ['Có dữ liệu tương đồng']).map(reason => <span key={reason} className="inline-flex items-center gap-1 rounded-full bg-red-50/80 border border-red-200/60 px-2.5 py-1 text-[11px] font-medium text-[#AD222B]"><CheckCircle2 size={12} /> {reason}</span>)}
                  </div>
                </header>

                <div className="grid gap-4 p-5 md:grid-cols-[1fr_auto_1fr] md:items-center md:p-6">
                  <ItemSnapshot item={match.lostItem} kind="lost" />
                  <div className="mx-auto grid h-10 w-10 place-items-center rounded-full border border-[#E0E2E6] bg-[#FAF8F2] text-[#AD222B] shadow-xs"><ArrowLeftRight size={18} /></div>
                  <ItemSnapshot item={match.foundItem} kind="found" />
                </div>

                <div className="mx-5 mb-5 rounded-xl border border-[#E0E2E6] bg-[#FAF8F2] p-4 md:mx-6">
                  <div className="mb-3 flex items-center gap-2"><Sparkles size={15} className="text-[#B9882E]" /><h3 className="text-xs font-mono font-bold uppercase tracking-wider text-[#1C2530]">Chi tiết điểm số thành phần</h3></div>
                  <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
                    {SCORE_PARTS.map(([key, label]) => {
                      const value = Number(match.breakdown?.[key] || 0);
                      return (
                        <div key={key} className="rounded-lg bg-white border border-[#E0E2E6] p-2.5 shadow-xs">
                          <div className="flex justify-between text-xs"><span className="text-[#5B6574]">{label}</span><strong className="font-mono text-[#1C2530]">+{value}</strong></div>
                          <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-[#E0E2E6]"><div className={`h-full rounded-full ${theme.bar}`} style={{ width: `${Math.min(100, value * 4)}%` }} /></div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <footer className="flex flex-col gap-3 border-t border-[#E0E2E6] bg-white p-5 sm:flex-row sm:items-center sm:justify-between md:px-6">
                  <p className="flex items-start gap-2 text-xs leading-relaxed text-[#5B6574]"><ShieldCheck size={16} className="shrink-0 text-[#AD222B]" /> Vị trí bảo quản và liên hệ chỉ hiển thị công khai sau khi cán bộ hoàn tất xác minh quyền sở hữu.</p>
                  <div className="flex shrink-0 gap-2">
                    <Link to={`/items/${match.foundItem?.id}`} className="btn-secondary text-xs px-3.5 py-2 inline-flex items-center gap-1.5 font-medium"><ExternalLink size={14} /> Chi tiết</Link>
                    <button onClick={() => openClaim(match)} className="btn-primary text-xs px-4 py-2 inline-flex items-center gap-1.5 font-medium"><Hand size={14} /> Nhận là đồ của tôi</button>
                  </div>
                </footer>
              </article>
            );
          })}
        </div>
      )}

      {selectedMatch && (
        <Modal isOpen onClose={() => setSelectedMatch(null)} title="Yêu cầu xác minh quyền sở hữu">
          <form onSubmit={submitClaim} className="space-y-4 pt-2">
            <div className="flex gap-3 rounded-xl border border-amber-200/80 bg-amber-50/80 p-4 text-xs leading-relaxed text-amber-900"><ShieldCheck className="shrink-0 text-amber-700" size={18} /><p>Hãy mô tả các đặc điểm nhận dạng chỉ chủ sở hữu biết (vết xước, đồ bên trong, ảnh nền, mật khẩu khóa màn hình nếu là thiết bị công nghệ...).</p></div>
            <div className="flex items-center gap-3 rounded-xl border border-[#E0E2E6] bg-[#FAF8F2] p-3">
              <img src={imageFor(selectedMatch.foundItem)} alt="Vật phẩm nghi vấn" className="h-14 w-14 rounded-lg object-cover border border-[#E0E2E6]" />
              <div><p className="label-micro text-[#8C95A3]">Vật phẩm đối chiếu</p><strong className="text-sm text-[#1C2530]">{selectedMatch.foundItem?.title}</strong></div>
            </div>
            <Textarea label="Đặc điểm bí mật / Bằng chứng sở hữu *" value={claimReason} onChange={event => setClaimReason(event.target.value)} rows={4} required placeholder="Mô tả chi tiết những đặc điểm riêng biệt của món đồ..." />
            <Input label="URL ảnh / Chứng từ liên quan (tùy chọn)" value={proofImage} onChange={event => setProofImage(event.target.value)} placeholder="https://..." />
            <div className="flex justify-end gap-3 border-t border-[#E0E2E6] pt-4"><Button type="button" variant="ghost" onClick={() => setSelectedMatch(null)}>Hủy bỏ</Button><Button type="submit" loading={submittingClaim} className="btn-primary">Gửi xác minh</Button></div>
          </form>
        </Modal>
      )}
    </div>
  );
}
