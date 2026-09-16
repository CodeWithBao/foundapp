import { ITEM_STATUS_CONFIG, CLAIM_STATUS_CONFIG } from '../../constants';

const variantClasses = {
  default: 'bg-cream-200 text-warm-gray-600',
  success: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  warning: 'bg-yellow-50 text-yellow-700 border border-yellow-200',
  danger: 'bg-red-50 text-red-700 border border-red-200',
  info: 'bg-blue-50 text-blue-700 border border-blue-200',
  burgundy: 'bg-burgundy-100 text-burgundy-700 border border-burgundy-200',
};

export default function Badge({ children, variant = 'default', className = '' }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${variantClasses[variant] || variantClasses.default} ${className}`}>
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
  return <Badge variant={variant}>{config.label}</Badge>;
}

const typeBadgeClass = {
  LOST: 'badge-lost',
  FOUND: 'badge-found',
  RETURNED: 'badge-returned',
};

export function ItemTypeBadge({ type }) {
  const cls = typeBadgeClass[type] || 'badge-found';
  const label = ITEM_STATUS_CONFIG[type]?.label || type;
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${cls}`}>
      {label}
    </span>
  );
}
