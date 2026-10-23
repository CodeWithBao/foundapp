const pulse = 'animate-pulse motion-reduce:animate-none';

function LoadingRegion({ children, className = '', label = 'Đang tải nội dung' }) {
  return (
    <div className={className} role="status" aria-live="polite" aria-busy="true" aria-label={label}>
      {children}
      <span className="sr-only">{label}</span>
    </div>
  );
}

export default function LoadingSkeleton({ type = 'card', count = 3, className = '' }) {
  const items = Array.from({ length: count }, (_, i) => i);

  if (type === 'table') {
    return (
      <LoadingRegion className={`space-y-3 ${className}`} label="Đang tải bảng dữ liệu">
        {items.map(i => (
          <div key={i} className={`flex gap-4 ${pulse}`}>
            <div className="h-4 bg-cream-200 rounded w-1/4" />
            <div className="h-4 bg-cream-200 rounded w-1/3" />
            <div className="h-4 bg-cream-200 rounded w-1/6" />
            <div className="h-4 bg-cream-200 rounded w-1/6" />
          </div>
        ))}
      </LoadingRegion>
    );
  }

  if (type === 'list' || type === 'conversation') {
    return (
      <LoadingRegion className={`space-y-3 ${className}`} label={type === 'conversation' ? 'Đang tải danh sách trò chuyện' : 'Đang tải danh sách'}>
        {items.map(i => (
          <div key={i} className={`flex items-center gap-4 p-4 bg-white rounded-card border border-cream-300 ${pulse}`}>
            <div className={`${type === 'conversation' ? 'w-11 h-11' : 'w-10 h-10'} bg-cream-200 rounded-full shrink-0`} />
            <div className="flex-1 min-w-0 space-y-2">
              <div className="h-4 bg-cream-200 rounded w-2/3" />
              <div className="h-3 bg-cream-200 rounded w-1/2" />
              {type === 'conversation' && <div className="h-3 bg-cream-200 rounded w-5/6" />}
            </div>
          </div>
        ))}
      </LoadingRegion>
    );
  }

  if (type === 'messages') {
    return (
      <LoadingRegion className={`space-y-4 p-4 ${className}`} label="Đang tải lịch sử trò chuyện">
        {items.map(i => (
          <div key={i} className={`flex ${i % 2 ? 'justify-end' : 'justify-start'} ${pulse}`}>
            <div className={`h-14 rounded-2xl bg-cream-200 ${i % 2 ? 'w-2/3 rounded-br-sm' : 'w-1/2 rounded-bl-sm'}`} />
          </div>
        ))}
      </LoadingRegion>
    );
  }

  if (type === 'notification') {
    return (
      <LoadingRegion className={`space-y-3 ${className}`} label="Đang tải thông báo">
        {items.map(i => (
          <div key={i} className={`flex gap-3 rounded-xl border border-cream-300 bg-white p-4 ${pulse}`}>
            <div className="h-10 w-10 shrink-0 rounded-full bg-cream-200" />
            <div className="min-w-0 flex-1 space-y-2">
              <div className="h-4 w-2/3 rounded bg-cream-200" />
              <div className="h-3 w-full rounded bg-cream-200" />
              <div className="h-3 w-1/4 rounded bg-cream-200" />
            </div>
          </div>
        ))}
      </LoadingRegion>
    );
  }

  if (type === 'profile') {
    return (
      <LoadingRegion className={`grid grid-cols-1 gap-5 lg:grid-cols-[18rem_minmax(0,1fr)] ${className}`} label="Đang tải hồ sơ tài khoản">
        <div className={`h-80 rounded-card bg-white border border-cream-300 p-6 ${pulse}`}>
          <div className="mx-auto h-24 w-24 rounded-full bg-cream-200" />
          <div className="mx-auto mt-5 h-5 w-2/3 rounded bg-cream-200" />
          <div className="mx-auto mt-3 h-3 w-1/2 rounded bg-cream-200" />
        </div>
        <div className={`space-y-5 rounded-card bg-white border border-cream-300 p-6 ${pulse}`}>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {items.slice(0, 4).map(i => <div key={i} className="h-20 rounded-xl bg-cream-200" />)}
          </div>
          <div className="h-5 w-1/3 rounded bg-cream-200" />
          <div className="h-4 w-full rounded bg-cream-200" />
          <div className="h-4 w-4/5 rounded bg-cream-200" />
        </div>
      </LoadingRegion>
    );
  }

  if (type === 'statistics') {
    return (
      <LoadingRegion className={`grid grid-cols-1 gap-5 lg:grid-cols-2 ${className}`} label="Đang tải số liệu thống kê">
        {items.map(i => <div key={i} className={`h-72 rounded-card border border-cream-300 bg-white ${pulse}`} />)}
      </LoadingRegion>
    );
  }

  if (type === 'detail') {
    return (
      <LoadingRegion className={`grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(20rem,0.9fr)] ${className}`} label="Đang tải chi tiết vật phẩm">
        <div className={`space-y-4 ${pulse}`}>
          <div className="aspect-[4/3] bg-cream-200 rounded-card" />
          <div className="grid grid-cols-4 gap-3">
            {items.slice(0, 4).map(i => <div key={i} className="aspect-square rounded-xl bg-cream-200" />)}
          </div>
        </div>
        <div className={`space-y-5 rounded-card border border-cream-300 bg-white p-5 ${pulse}`}>
          <div className="h-7 bg-cream-200 rounded w-3/4" />
          <div className="h-4 bg-cream-200 rounded w-1/2" />
          <div className="space-y-3 pt-3">
            <div className="h-4 bg-cream-200 rounded w-full" />
            <div className="h-4 bg-cream-200 rounded w-5/6" />
            <div className="h-4 bg-cream-200 rounded w-2/3" />
          </div>
          <div className="h-11 bg-cream-200 rounded-xl w-full" />
        </div>
      </LoadingRegion>
    );
  }

  return (
    <LoadingRegion className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 ${className}`} label="Đang tải bài đăng">
      {items.map(i => (
        <div key={i} className={`bg-white rounded-card border border-cream-300 overflow-hidden ${pulse}`}>
          <div className="h-40 bg-cream-200" />
          <div className="p-4 space-y-3">
            <div className="h-4 bg-cream-200 rounded w-3/4" />
            <div className="h-3 bg-cream-200 rounded w-1/2" />
            <div className="h-3 bg-cream-200 rounded w-1/3" />
          </div>
        </div>
      ))}
    </LoadingRegion>
  );
}
