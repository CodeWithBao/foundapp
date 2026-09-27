import { useState } from 'react';
import { MapPin, Clock, Eye, Heart, ArrowUpRight } from 'lucide-react';
import CategoryIcon from './CategoryIcon';
import { formatDate } from '../../utils';

export default function ItemCard({ item, onClick }) {
  const [imgError, setImgError] = useState(false);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(item.likes || Math.floor((item.views || 30) / 4) + 2);
  const hasImage = item.images?.length > 0 && typeof item.images[0] === 'string' && !imgError;
  
  const locationText = typeof item.location === 'object' && item.location !== null
    ? item.location.name
    : (item.locationName || (typeof item.location === 'string' ? item.location : ''));
  const categoryText = typeof item.category === 'object' && item.category !== null
    ? item.category.name
    : (typeof item.category === 'string' ? item.category : '');

  const isFound = item.type === 'FOUND' || item.status === 'FOUND';

  const handleLike = (e) => {
    e.stopPropagation();
    setLiked(!liked);
    setLikeCount(prev => liked ? prev - 1 : prev + 1);
  };

  return (
    <article
      id={`item-card-${item.id}`}
      data-item-id={item.id}
      className="project-card cursor-pointer group rounded-2xl bg-white border border-[#E8E2DD] hover:border-[#FECDCA] hover:shadow-card-hover transition-all duration-300 flex flex-col overflow-hidden text-left"
      onClick={(e) => onClick?.(item, e)}
      tabIndex={0}
      role="button"
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick?.(item, e);
        }
      }}
    >
      {/* Cover Image */}
      <div className="project-cover relative aspect-[16/11] overflow-hidden bg-gradient-to-br from-[#F8F6F3] to-[#F1ECE6]">
        {hasImage ? (
          <img
            src={item.images[0]}
            alt={item.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
            onError={() => setImgError(true)}
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-2 p-4 text-center">
            <div className="w-12 h-12 rounded-xl bg-accent-tint text-accent flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-sm">
              <CategoryIcon category={categoryText} className="w-6 h-6" />
            </div>
            <span className="text-[11px] font-semibold text-ink-muted uppercase tracking-wider">{categoryText || 'Vật phẩm'}</span>
          </div>
        )}
        
        {/* Floating status pill according to mockup 04_search */}
        <div className="absolute top-2.5 left-2.5 z-10">
          {isFound ? (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#E8F5E9] text-[#2E7D32] border border-[#C8E6C9] shadow-sm">
              Đã nhặt được
            </span>
          ) : (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#FFEBEE] text-[#C62828] border border-[#FFCDD2] shadow-sm">
              Đã đánh mất
            </span>
          )}
        </div>

        {/* Hover Arrow Overlay */}
        <div className="absolute top-2.5 right-2.5 w-7 h-7 rounded-full bg-white/95 backdrop-blur-sm text-ink opacity-0 translate-y-1 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-200 flex items-center justify-center shadow-md">
          <ArrowUpRight className="w-3.5 h-3.5 text-accent" />
        </div>
      </div>

      {/* Card Body */}
      <div className="flex-1 flex flex-col p-3.5 sm:p-4">
        <h3 className="font-bold text-ink text-[15px] sm:text-[16px] leading-snug line-clamp-1 mb-2 group-hover:text-accent transition-colors duration-200">
          {item.title}
        </h3>

        {/* Meta Info: Time & Location */}
        <div className="space-y-1 text-[12px] text-ink-slate mb-2">
          <div className="flex items-center gap-1.5 text-ink-muted">
            <Clock className="w-3.5 h-3.5 shrink-0 text-gray-400" />
            <span>{formatDate(item.date || item.createdAt)}</span>
          </div>
          {locationText && (
            <div className="flex items-center gap-1.5 text-ink-slate truncate">
              <MapPin className="w-3.5 h-3.5 shrink-0 text-[#981B1E]" />
              <span className="truncate">{locationText}</span>
            </div>
          )}
        </div>

        {/* Short Description */}
        {item.description && (
          <p className="text-[12px] text-gray-500 line-clamp-2 mb-3 leading-relaxed">
            {item.description}
          </p>
        )}

        {/* Card Footer matching mockup */}
        <div className="mt-auto pt-3 border-t border-hairline flex flex-col gap-2.5">
          {/* Row 1: Like & Views */}
          <div className="flex items-center justify-between text-xs text-ink-muted">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleLike}
                className={`flex items-center gap-1.5 hover:text-red-500 transition-colors ${liked ? 'text-red-500 font-semibold' : ''}`}
                title="Lượt thích"
              >
                <Heart className={`w-3.5 h-3.5 ${liked ? 'fill-current text-red-500' : ''}`} />
                <span className="tabular-nums text-xs font-medium">{likeCount}</span>
              </button>
              <div className="flex items-center gap-1.5" title="Lượt xem">
                <Eye className="w-3.5 h-3.5 text-gray-400" />
                <span className="tabular-nums text-xs font-medium">{item.views != null ? item.views : 45}</span>
              </div>
            </div>
          </div>

          {/* Row 2: Action button full width */}
          {isFound ? (
            <span className="w-full inline-flex items-center justify-center px-3 py-2 rounded-xl text-xs sm:text-[13px] font-semibold bg-[#741216] text-white group-hover:bg-[#8b161b] transition shadow-xs text-center select-none">
              Xem chi tiết →
            </span>
          ) : (
            <span className="w-full inline-flex items-center justify-center px-3 py-2 rounded-xl text-xs sm:text-[13px] font-semibold border border-[#741216] text-[#741216] bg-[#FAF8F5] group-hover:bg-[#FAF0F1] transition shadow-xs text-center select-none">
              Liên hệ người đăng
            </span>
          )}
        </div>
      </div>
    </article>
  );
}


