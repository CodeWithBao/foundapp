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
    <div className="page-container py-8 md:py-12">
      <section className="relative overflow-hidden rounded-[28px] border border-burgundy-100 bg-white/90 p-6 shadow-card backdrop-blur md:p-8">
        <div className="absolute inset-y-0 right-0 hidden w-2/5 bg-[url('/DNTU_Web_Asset_Kit/backgrounds/dntu-campus-clean-960.webp')] bg-cover bg-center opacity-[.08] md:block" />
        <div className="relative max-w-3xl">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-burgundy-100 bg-burgundy-50 px-3 py-1 text-xs font-bold text-burgundy-700">
            <SearchCheck size={15} /> Đối chiếu thông minh
          </div>
          <h1 className="text-3xl font-black tracking-tight text-burgundy-950 md:text-4xl">Danh sách đồ nghi vấn trùng khớp</h1>
          <p className="mt-3 max-w-2xl leading-relaxed text-warm-gray-600">Cú DNTU so sánh ảnh, tên, mô tả, đặc điểm, danh mục, vị trí và thời gian. Điểm cao chỉ là gợi ý — nhân viên vẫn phải xác minh trước khi trả đồ.</p>
        </div>
        <div className="relative mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
          <div className="rounded-2xl bg-burgundy-950 p-4 text-white"><p className="text-2xl font-black">{matches.length}</p><p className="text-xs text-white/70">Kết quả tương tự</p></div>
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4"><p className="text-2xl font-black text-emerald-800">{highConfidence}</p><p className="text-xs text-emerald-700">Khả năng cao</p></div>
          <div className="col-span-2 rounded-2xl border border-cream-300 bg-cream-50 p-4 sm:col-span-1"><p className="text-2xl font-black text-text-dark">{lostReports.length}</p><p className="text-xs text-warm-gray-500">Hồ sơ đang đối chiếu</p></div>
        </div>
      </section>

      <div className="mt-6 flex flex-col gap-3 rounded-2xl border border-cream-300 bg-white/90 p-4 shadow-sm backdrop-blur sm:flex-row sm:items-center sm:justify-between">
        <label className="flex min-w-0 items-center gap-2 text-sm font-semibold text-text-dark">
          <Filter size={17} className="text-burgundy-700" />
          <span className="shrink-0">Lọc theo hồ sơ:</span>
          <select value={selectedLostId} onChange={event => setSelectedLostId(event.target.value)} className="min-w-0 rounded-xl border border-cream-300 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-burgundy-300">
            <option value="all">Tất cả đồ đã báo mất</option>
            {lostReports.map(item => <option key={item.id} value={String(item.id)}>{item.title}</option>)}
          </select>
        </label>
        <button onClick={loadMatches} disabled={loading} className="inline-flex items-center justify-center gap-2 rounded-xl border border-burgundy-200 px-4 py-2 text-sm font-bold text-burgundy-700 transition hover:bg-burgundy-50 disabled:opacity-50">
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} /> Quét lại
        </button>
      </div>

      {loading ? (
        <div className="mt-6 space-y-5">{[1, 2, 3].map(item => <div key={item} className="h-80 animate-pulse rounded-3xl border border-cream-300 bg-white/80" />)}</div>
      ) : visibleMatches.length === 0 ? (
        <div className="mt-6 rounded-3xl bg-white/90 p-4 backdrop-blur">
          <EmptyState icon={Sparkles} title="Chưa có món nào đủ điểm tương đồng" description="Cú DNTU vẫn đang canh. Khi có bài báo nhặt mới phù hợp, hệ thống sẽ tạo thông báo và hiện danh sách ở đây." />
        </div>
      ) : (
        <div className="mt-6 space-y-6">
          {visibleMatches.map((match, index) => {
            const theme = scoreTheme(match.score);
            const score = Math.round(match.score * 10) / 10;
            return (
              <article key={match.matchId || `${match.lostItem?.id}-${match.foundItem?.id}-${index}`} className="overflow-hidden rounded-[28px] border border-cream-300 bg-white/95 shadow-card transition hover:-translate-y-0.5 hover:shadow-card-hover">
                <header className="flex flex-col gap-4 border-b border-cream-200 bg-gradient-to-r from-cream-50 to-white p-5 md:flex-row md:items-center md:justify-between md:px-6">
                  <div className="flex items-center gap-4">
                    <div className="relative grid h-20 w-20 shrink-0 place-items-center rounded-full" style={{ background: `conic-gradient(${theme.ring} ${score * 3.6}deg, #eee7df 0deg)` }}>
                      <div className="grid h-16 w-16 place-items-center rounded-full bg-white"><strong className="text-xl text-text-dark">{score}%</strong></div>
                    </div>
                    <div>
                      <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-extrabold ${theme.badge}`}>{theme.label}</span>
                      <h2 className="mt-2 font-bold text-text-dark">Kết quả #{index + 1}</h2>
                      <p className="text-xs text-warm-gray-500">Đây là món nghi vấn, chưa phải kết luận sở hữu.</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 md:max-w-md md:justify-end">
                    {(match.reasons?.length ? match.reasons : ['Có dữ liệu tương đồng']).map(reason => <span key={reason} className="inline-flex items-center gap-1 rounded-full bg-burgundy-50 px-3 py-1 text-[11px] font-semibold text-burgundy-800"><CheckCircle2 size={13} /> {reason}</span>)}
                  </div>
                </header>

                <div className="grid gap-4 p-5 md:grid-cols-[1fr_auto_1fr] md:items-center md:p-6">
                  <ItemSnapshot item={match.lostItem} kind="lost" />
                  <div className="mx-auto grid h-11 w-11 place-items-center rounded-full border border-burgundy-100 bg-burgundy-50 text-burgundy-700"><ArrowLeftRight size={20} /></div>
                  <ItemSnapshot item={match.foundItem} kind="found" />
                </div>

                <div className="mx-5 rounded-2xl border border-cream-300 bg-cream-50/80 p-4 md:mx-6">
                  <div className="mb-3 flex items-center gap-2"><Sparkles size={16} className="text-champagne-600" /><h3 className="text-sm font-bold text-text-dark">Điểm được tính từ đâu?</h3></div>
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    {SCORE_PARTS.map(([key, label]) => {
                      const value = Number(match.breakdown?.[key] || 0);
                      return (
                        <div key={key} className="rounded-xl bg-white p-3 shadow-sm">
                          <div className="flex justify-between text-xs"><span className="text-warm-gray-500">{label}</span><strong className="text-text-dark">+{value}</strong></div>
                          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-cream-200"><div className={`h-full rounded-full ${theme.bar}`} style={{ width: `${Math.min(100, value * 4)}%` }} /></div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <footer className="mt-5 flex flex-col gap-3 border-t border-cream-200 bg-white p-5 sm:flex-row sm:items-center sm:justify-between md:px-6">
                  <p className="flex items-start gap-2 text-xs leading-relaxed text-warm-gray-500"><ShieldCheck size={17} className="shrink-0 text-burgundy-700" /> Vị trí nhặt được được hiển thị; vị trí bảo quản chi tiết và thông tin liên hệ chỉ mở sau khi nhân viên xác minh.</p>
                  <div className="flex shrink-0 gap-2">
                    <Link to={`/items/${match.foundItem?.id}`} className="inline-flex items-center gap-2 rounded-xl border border-burgundy-200 px-4 py-2 text-sm font-bold text-burgundy-700 hover:bg-burgundy-50"><ExternalLink size={15} /> Xem chi tiết</Link>
                    <button onClick={() => openClaim(match)} className="inline-flex items-center gap-2 rounded-xl bg-burgundy-700 px-4 py-2 text-sm font-bold text-white hover:bg-burgundy-800"><Hand size={15} /> Đây có thể là đồ của tôi</button>
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
            <div className="flex gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900"><ShieldCheck className="shrink-0" size={20} /><p>Không nhập mật khẩu tài khoản. Hãy mô tả đặc điểm chỉ chủ sở hữu biết: vết xước, đồ bên trong, hình nền hoặc hóa đơn.</p></div>
            <div className="flex items-center gap-3 rounded-2xl border border-cream-300 p-3">
              <img src={imageFor(selectedMatch.foundItem)} alt="Vật phẩm nghi vấn" className="h-16 w-16 rounded-xl object-cover" />
              <div><p className="text-xs text-warm-gray-500">Vật phẩm cần xác minh</p><strong>{selectedMatch.foundItem?.title}</strong></div>
            </div>
            <Textarea label="Đặc điểm bí mật / Bằng chứng sở hữu *" value={claimReason} onChange={event => setClaimReason(event.target.value)} rows={4} required />
            <Input label="URL ảnh/hóa đơn chứng minh (tùy chọn)" value={proofImage} onChange={event => setProofImage(event.target.value)} />
            <div className="flex justify-end gap-3 border-t border-cream-200 pt-4"><Button type="button" variant="ghost" onClick={() => setSelectedMatch(null)}>Hủy</Button><Button type="submit" loading={submittingClaim}>Gửi xác minh</Button></div>
          </form>
        </Modal>
      )}
    </div>
  );
}
