export default function LoadingSkeleton({ type = 'card', count = 3 }) {
  const items = Array.from({ length: count }, (_, i) => i);

  if (type === 'table') {
    return (
      <div className="space-y-3">
        {items.map((i) => (
          <div key={i} className="flex gap-4 animate-pulse">
            <div className="h-4 bg-cream-200 rounded w-1/4" />
            <div className="h-4 bg-cream-200 rounded w-1/3" />
            <div className="h-4 bg-cream-200 rounded w-1/6" />
            <div className="h-4 bg-cream-200 rounded w-1/6" />
          </div>
        ))}
      </div>
    );
  }

  if (type === 'list') {
    return (
      <div className="space-y-3">
        {items.map((i) => (
          <div key={i} className="flex items-center gap-4 p-4 bg-white rounded-card border border-cream-300 animate-pulse">
            <div className="w-10 h-10 bg-cream-200 rounded-full shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-cream-200 rounded w-2/3" />
              <div className="h-3 bg-cream-200 rounded w-1/2" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (type === 'detail') {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-64 bg-cream-200 rounded-card" />
        <div className="space-y-3">
          <div className="h-6 bg-cream-200 rounded w-1/2" />
          <div className="h-4 bg-cream-200 rounded w-full" />
          <div className="h-4 bg-cream-200 rounded w-3/4" />
        </div>
      </div>
    );
  }

  // card
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {items.map((i) => (
        <div key={i} className="bg-white rounded-card border border-cream-300 overflow-hidden animate-pulse">
          <div className="h-40 bg-cream-200" />
          <div className="p-4 space-y-3">
            <div className="h-4 bg-cream-200 rounded w-3/4" />
            <div className="h-3 bg-cream-200 rounded w-1/2" />
            <div className="h-3 bg-cream-200 rounded w-1/3" />
          </div>
        </div>
      ))}
    </div>
  );
}
