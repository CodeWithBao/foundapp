import { Search } from 'lucide-react';

export default function SearchBar({
  value,
  onChange,
  onSearch,
  placeholder = 'Tìm kiếm...',
  className = '',
  size = 'md',
}) {
  const isLg = size === 'lg';

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && onSearch) onSearch(value);
  };

  return (
    <div className={`relative flex items-center ${className}`}>
      <Search className={`absolute left-3 text-warm-gray-400 pointer-events-none ${isLg ? 'w-5 h-5 left-4' : 'w-4 h-4'}`} />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className={`input-field ${isLg ? 'pl-12 py-4 px-6 text-lg rounded-card-lg' : 'pl-10'} ${onSearch ? 'pr-24' : ''}`}
      />
      {onSearch && (
        <button
          onClick={() => onSearch(value)}
          className="absolute right-2 btn-primary py-2 px-4 text-sm rounded-lg"
        >
          Tìm
        </button>
      )}
    </div>
  );
}
