import { ITEM_STATUS_CONFIG, CLAIM_STATUS_CONFIG } from '../../constants';

const variantClasses = {
  default: 'bg-paper-panel text-ink-soft border border-hairline',
  success: 'bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200/80',
  warning: 'bg-amber-50 text-amber-900 ring-1 ring-amber-200/80',
  danger: 'bg-red-50 text-accent ring-1 ring-accent-border/80',
  info: 'bg-blue-50 text-blue-800 ring-1 ring-blue-200/80',
  burgundy: 'bg-accent-tint text-accent ring-1 ring-accent-border',
  gold: 'bg-gold-tint text-gold-hover ring-1 ring-gold-border',
  teal: 'bg-teal-50 text-teal-800 ring-1 ring-teal-200/80',
};

const dotClasses = {
  default: 'bg-warm-gray-400',
  success: 'bg-emerald-600 shadow-[0_0_0_2px_rgba(16,185,129,0.2)]',
  warning: 'bg-amber-500 shadow-[0_0_0_2px_rgba(245,158,11,0.2)]',
  danger: 'bg-accent shadow-[0_0_0_2px_rgba(173,34,43,0.2)]',
  info: 'bg-blue-600 shadow-[0_0_0_2px_rgba(37,99,235,0.2)]',
  burgundy: 'bg-accent shadow-[0_0_0_2px_rgba(173,34,43,0.2)]',
  gold: 'bg-gold shadow-[0_0_0_2px_rgba(185,136,46,0.2)]',
  teal: 'bg-teal-600 shadow-[0_0_0_2px_rgba(13,148,136,0.2)]',
};

export default function Badge({ children, variant = 'default', showDot = false, className = '' }) {
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold tracking-wide ${variantClasses[variant] || variantClasses.default} ${className}`}>
      {showDot && <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotClasses[variant] || dotClasses.default}`} />}
      {children}
    </span>
  );
}

const statusColorMap = {
  yellow: 'warning',
  blue: 'info',
  green: 'success',
  red: 'danger',
  purple: 'info',
  gray: 'default',
};

export function StatusBadge({ status, type = 'item' }) {
  const config = type === 'claim' ? CLAIM_STATUS_CONFIG[status] : ITEM_STATUS_CONFIG[status];
  if (!config) return null;
  const variant = statusColorMap[config.color] || 'default';
  return <Badge variant={variant} showDot={true}>{config.label}</Badge>;
}

const typeBadgeClass = {
  LOST: { cls: 'project-status project-status--lost', dot: 'status-dot-lost' },
  FOUND: { cls: 'project-status project-status--found', dot: 'status-dot-found' },
  RETURNED: { cls: 'project-status project-status--returned', dot: 'status-dot-returned' },
};

export function ItemTypeBadge({ type, showDot = true }) {
  const badgeConfig = typeBadgeClass[type] || typeBadgeClass.FOUND;
  const label = ITEM_STATUS_CONFIG[type]?.label || type;
  return (
    <span className={badgeConfig.cls}>
      {showDot && <span className={`status-dot ${badgeConfig.dot}`} />}
      <span>{label}</span>
    </span>
  );
}
