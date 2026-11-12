import { Loader2 } from 'lucide-react';

const variants = {
  primary: 'btn-primary',
  secondary: 'btn-secondary',
  ghost: 'btn-ghost',
  danger: 'bg-accent text-white hover:bg-burgundy-700 active:bg-burgundy-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-accent/30 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200',
  outline: 'border border-hairline text-ink bg-white hover:bg-paper-panel hover:border-hairline-strong shadow-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200',
  gold: 'bg-gold text-white hover:bg-gold-hover active:brightness-95 shadow-sm focus:outline-none focus:ring-2 focus:ring-gold/30 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200',
};

const sizes = {
  sm: 'px-3 py-1.5 text-xs rounded-[8px]',
  md: 'px-5 py-2.5 text-sm rounded-card',
  lg: 'px-7 py-3 text-base rounded-card',
};

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  loadingText,
  disabled = false,
  className = '',
  icon: Icon,
  ...props
}) {
  const base = variants[variant] || variants.primary;
  const sizeClass = ['danger', 'outline', 'gold'].includes(variant) ? sizes[size] : (size !== 'md' ? sizes[size] : '');

  return (
    <button
      className={`relative inline-flex items-center justify-center gap-2 font-semibold tracking-wide ${base} ${sizeClass} ${className}`}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      <span className={`inline-flex items-center justify-center gap-2 ${loading ? 'invisible' : ''}`} aria-hidden={loading || undefined}>
        {Icon ? <Icon className="w-4 h-4 shrink-0" aria-hidden="true" /> : null}
        {children}
      </span>
      {loading && (
        <span className="absolute inset-0 flex items-center justify-center gap-2 px-2" role="status" aria-label={loadingText || 'Đang xử lý'}>
          <Loader2 className="w-4 h-4 shrink-0 animate-spin motion-reduce:animate-none" aria-hidden="true" />
          {loadingText && <span className="text-xs leading-tight">{loadingText}</span>}
        </span>
      )}
    </button>
  );
}
