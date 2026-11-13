import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bookmark } from 'lucide-react';
import { useSavedItems } from '../../context/SavedItemsContext';
import savedItemService from '../../services/savedItemService';
import ItemCard from '../../components/common/ItemCard';
import SaveItemButton from '../../components/common/SaveItemButton';
import Pagination from '../../components/common/Pagination';

const LIMIT = 20;
export default function SavedItemsPage() {
  const navigate = useNavigate();
  const { identity, revision, valid } = useSavedItems();
  const [query, setQuery] = useState({ search: '', type: 'ALL', status: 'ALL', page: 1 });
  const [draft, setDraft] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    setResult(null);
    savedItemService.list({ ...query, limit: LIMIT }).then(data => {
      if (!active || !valid()) return;
      const lastPage = Math.max(1, Math.ceil(data.total / LIMIT));
      if (query.page > lastPage) {
        setQuery(previous => ({ ...previous, page: lastPage }));
        return;
      }
      setResult(data);
    }).catch(err => {
      if (active && valid()) setError(err.message || 'Không thể tải tin đã lưu.');
    }).finally(() => { if (active && valid()) setLoading(false); });
    return () => { active = false; };
  }, [query, identity, revision, retry, valid]);
  const update = (key, value) => setQuery(previous => ({ ...previous, [key]: value, page: 1 }));
  const inputClass = 'w-full min-w-0 rounded-xl border border-hairline bg-white px-3 py-2.5 text-sm text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent';
  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-10 min-w-0">
      <h1 className="flex items-center gap-2 text-2xl font-bold text-ink"><Bookmark aria-hidden="true" className="w-6 h-6 text-accent" />Tin đã lưu</h1>
      <p className="text-sm text-ink-muted mt-2">Các bài đăng bạn đã lưu để xem lại.</p>
      <form className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)_auto] gap-3 my-6 items-end" onSubmit={event => {
        event.preventDefault();
        if (new TextEncoder().encode(draft.trim()).length > 200) {
          setError('Từ khóa tìm kiếm tối đa 200 byte UTF-8. Vui lòng rút ngắn từ khóa.');
          return;
        }
        update('search', draft.trim());
      }}>
        <label className="min-w-0 text-sm font-medium text-ink-soft">Tìm kiếm<input type="search" value={draft} onChange={event => setDraft(event.target.value)} className={`${inputClass} mt-1`} placeholder="Tiêu đề, mô tả, thương hiệu, màu sắc" /></label>
        <label className="min-w-0 text-sm font-medium text-ink-soft">Loại tin<select value={query.type} onChange={event => update('type', event.target.value)} className={`${inputClass} mt-1`}><option value="ALL">Tất cả loại tin</option><option value="LOST">Đánh mất</option><option value="FOUND">Nhặt được</option></select></label>
        <label className="min-w-0 text-sm font-medium text-ink-soft">Trạng thái<select value={query.status} onChange={event => update('status', event.target.value)} className={`${inputClass} mt-1`}><option value="ALL">Tất cả trạng thái</option><option value="LOST">Đánh mất</option><option value="FOUND">Nhặt được</option><option value="RETURNED">Đã trả lại</option><option value="CLOSED">Đã đóng</option></select></label>
        <button type="submit" className="rounded-xl bg-accent text-white font-semibold text-sm px-5 py-2.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2">Tìm kiếm</button>
      </form>
      {loading ? <div role="status" className="py-12 text-center text-ink-muted">Đang tải tin đã lưu…</div> : error ? <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-5 text-accent"><p className="break-words">{error}</p><button type="button" className="mt-3 underline font-semibold focus-visible:outline focus-visible:outline-2" onClick={() => setRetry(n => n + 1)}>Thử lại</button></div> : result?.items.length ? <>
        <p role="status" className="mb-4 text-sm text-ink-muted">{result.total} tin đã lưu</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
          {result.items.map(row => row.available ? <ItemCard key={row.item_id} item={row.item} onClick={(item, event, options) => navigate(`/items/${item.id}`, { state: { from: '/saved-items', ...(options?.resumeAction ? { resumeAction: options.resumeAction } : {}) } })} /> : <article key={row.item_id} className="rounded-2xl bg-white border border-hairline p-5 flex flex-col gap-4 min-w-0"><h2 className="font-semibold text-ink">Tin không còn khả dụng</h2><p className="text-sm text-ink-muted">Bài đăng này hiện không thể xem. Bạn vẫn có thể bỏ lưu.</p><div className="mt-auto"><SaveItemButton itemId={row.item_id} variant="detail" unavailable /></div></article>)}
        </div>
        <Pagination current={query.page} total={result.total} perPage={LIMIT} onPageChange={page => setQuery(previous => ({ ...previous, page: Math.min(1000000, Math.max(1, page)) }))} />
      </> : <div role="status" className="rounded-2xl border border-hairline bg-white py-12 px-5 text-center"><h2 className="font-semibold text-ink">{query.search || query.type !== 'ALL' || query.status !== 'ALL' ? 'Không có tin phù hợp' : 'Bạn chưa lưu tin nào'}</h2><p className="mt-2 text-sm text-ink-muted">Nhấn biểu tượng lưu trên bài đăng để xem lại tại đây.</p></div>}
    </main>
  );
}
