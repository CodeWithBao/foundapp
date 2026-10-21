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
  disabled = false,
  className = '',
  icon: Icon,
  ...props
}) {
  const base = variants[variant] || variants.primary;
  const sizeClass = ['danger', 'outline', 'gold'].includes(variant) ? sizes[size] : (size !== 'md' ? sizes[size] : '');

  return (
    <button
      className={`inline-flex items-center justify-center gap-2 font-semibold tracking-wide ${base} ${sizeClass} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : Icon ? (
        <Icon className="w-4 h-4" />
      ) : null}
      {children}
    </button>
  );
}
