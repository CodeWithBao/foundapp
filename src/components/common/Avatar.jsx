import { getInitials } from '../../utils';

const sizeMap = {
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-12 h-12 text-base',
  xl: 'w-16 h-16 text-lg',
};

export default function Avatar({ name, src, size = 'md', className = '' }) {
  const s = sizeMap[size] || sizeMap.md;

  if (src) {
    return (
      <img
        src={src}
        alt={name || ''}
        className={`${s} rounded-full object-cover ${className}`}
      />
    );
  }

  return (
    <div className={`${s} rounded-full bg-burgundy-100 text-burgundy-700 font-semibold flex items-center justify-center ${className}`}>
      {getInitials(name)}
    </div>
  );
}
