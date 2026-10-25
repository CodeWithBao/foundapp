import { Package } from 'lucide-react';
import Button from './Button';

export default function EmptyState({
  icon: Icon = Package,
  title = 'Không có dữ liệu',
  description,
  action,
  onAction,
}) {
  return (
    <div className="surface flex flex-col items-center justify-center py-16 px-6 text-center border border-dashed border-hairline-strong/60 my-6">
      <div className="w-16 h-16 rounded-2xl bg-paper-panel border border-hairline flex items-center justify-center mb-4 text-ink-muted">
        <Icon className="w-8 h-8 text-ink-muted/80" />
      </div>
      <h3 className="font-serif font-bold text-lg text-ink mb-1.5">{title}</h3>
      {description && <p className="text-ink-slate text-sm max-w-md mb-5 leading-relaxed">{description}</p>}
      {action && onAction && (
        <Button variant="primary" size="sm" onClick={onAction}>{action}</Button>
      )}
    </div>
  );
}
