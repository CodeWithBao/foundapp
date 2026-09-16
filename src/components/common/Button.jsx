import { Loader2 } from 'lucide-react';

const variants = {
  primary: 'btn-primary',
  secondary: 'btn-secondary',
  ghost: 'btn-ghost',
  danger: 'bg-dntu-danger text-white hover:bg-red-700 active:bg-red-800 focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200',
  outline: 'border border-cream-300 text-text-dark bg-white hover:bg-cream-100 focus:outline-none focus:ring-2 focus:ring-burgundy-400 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200',
};

const sizes = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-6 py-2.5 text-sm',
  lg: 'px-8 py-3 text-base',
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
  // btn-primary/btn-secondary/btn-ghost already include px/py, override only for non-css-class variants
  const sizeClass = ['danger', 'outline'].includes(variant) ? sizes[size] : (size !== 'md' ? sizes[size] : '');

  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-card font-medium ${base} ${sizeClass} ${className}`}
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
