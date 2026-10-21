import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function Pagination({ current, total, perPage, onPageChange }) {
  const totalPages = Math.ceil(total / perPage);
  if (totalPages <= 1) return null;

  const pages = [];
  const delta = 1;
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || (i >= current - delta && i <= current + delta)) {
      pages.push(i);
    } else if (pages[pages.length - 1] !== '...') {
      pages.push('...');
    }
  }

  return (
    <div className="flex items-center justify-center gap-1.5 mt-8">
      <button
        onClick={() => onPageChange(current - 1)}
        disabled={current <= 1}
        className="p-2 rounded-xl text-ink-soft bg-white border border-hairline hover:bg-paper-panel disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm"
        aria-label="Previous Page"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>
      {pages.map((p, i) =>
        p === '...' ? (
          <span key={`dots-${i}`} className="px-2 text-ink-muted text-sm font-mono">...</span>
        ) : (
          <button
            key={p}
            onClick={() => onPageChange(p)}
            className={`min-w-[38px] h-9 rounded-xl text-sm font-semibold transition-all font-mono tabular-nums shadow-sm ${
              p === current
                ? 'bg-accent text-white shadow-sm'
                : 'bg-white text-ink-soft border border-hairline hover:bg-paper-panel hover:text-ink'
            }`}
          >
            {p}
          </button>
        )
      )}
      <button
        onClick={() => onPageChange(current + 1)}
        disabled={current >= totalPages}
        className="p-2 rounded-xl text-ink-soft bg-white border border-hairline hover:bg-paper-panel disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm"
        aria-label="Next Page"
      >
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
}
