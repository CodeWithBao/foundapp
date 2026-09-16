import { useState } from 'react';
import { MapPin, Calendar, Eye } from 'lucide-react';
import { ItemTypeBadge } from './Badge';
import { formatDate } from '../../utils';

const categoryEmoji = {
  'Điện tử': '📱',
  'Sách vở': '📚',
  'Quần áo': '👕',
  'Thẻ & Giấy tờ': '🪪',
  'Phụ kiện': '👜',
  'Khác': '📦',
};

export default function ItemCard({ item, onClick }) {
  const [imgError, setImgError] = useState(false);
  const hasImage = item.images?.length > 0 && !imgError;

  return (
    <div
      className="card-hover cursor-pointer overflow-hidden group"
      onClick={() => onClick?.(item)}
    >
      {/* Image */}
      <div className="aspect-[4/3] relative overflow-hidden rounded-t-card">
        {hasImage ? (
          <img
            src={item.images[0]}
            alt={item.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-burgundy-100 to-cream-200 flex items-center justify-center">
            <span className="text-4xl">{categoryEmoji[item.category] || '📦'}</span>
          </div>
        )}
        <div className="absolute top-3 left-3">
          <ItemTypeBadge type={item.status || item.type} />
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-semibold text-text-dark text-sm line-clamp-2 mb-2 group-hover:text-burgundy-700 transition-colors">
          {item.title}
        </h3>
        <div className="space-y-1.5 text-xs text-warm-gray-500">
          {item.location && (
            <div className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">{item.locationName || item.location}</span>
            </div>
          )}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 shrink-0" />
              <span>{formatDate(item.date || item.createdAt)}</span>
            </div>
            {item.views != null && (
              <div className="flex items-center gap-1">
                <Eye className="w-3.5 h-3.5" />
                <span>{item.views}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
