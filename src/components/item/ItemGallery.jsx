import { useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, ImageOff } from 'lucide-react';
import CategoryIcon from '../common/CategoryIcon';

const SWIPE_THRESHOLD = 45;

export default function ItemGallery({ images = [], itemId, title, category, isFound }) {
  const galleryImages = images.filter(Boolean);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [failedImages, setFailedImages] = useState(() => new Set());
  const thumbnailStripRef = useRef(null);
  const thumbnailRefs = useRef([]);
  const touchStartRef = useRef(null);

  const safeSelectedIndex = Math.min(selectedIndex, Math.max(0, galleryImages.length - 1));
  const selectedImage = galleryImages[safeSelectedIndex];
  const selectedImageFailed = failedImages.has(selectedImage);

  useEffect(() => {
    const strip = thumbnailStripRef.current;
    const selectedThumbnail = thumbnailRefs.current[safeSelectedIndex];
    if (!strip || !selectedThumbnail) return;

    const stripRect = strip.getBoundingClientRect();
    const thumbnailRect = selectedThumbnail.getBoundingClientRect();
    if (thumbnailRect.left < stripRect.left || thumbnailRect.right > stripRect.right) {
      const left = selectedThumbnail.offsetLeft - (strip.clientWidth - selectedThumbnail.offsetWidth) / 2;
      const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      strip.scrollTo({ left: Math.max(0, left), behavior: reduceMotion ? 'auto' : 'smooth' });
    }
  }, [safeSelectedIndex]);

  const selectPrevious = () => {
    setSelectedIndex(current => current === 0 ? galleryImages.length - 1 : current - 1);
  };

  const selectNext = () => {
    setSelectedIndex(current => current === galleryImages.length - 1 ? 0 : current + 1);
  };

  const handleImageError = imageUrl => {
    setFailedImages(current => {
      const next = new Set(current);
      next.add(imageUrl);
      return next;
    });
  };

  const handleTouchStart = event => {
    const touch = event.touches[0];
    touchStartRef.current = { x: touch.clientX, y: touch.clientY };
  };

  const handleTouchEnd = event => {
    if (!touchStartRef.current || galleryImages.length < 2) return;
    const touch = event.changedTouches[0];
    const deltaX = touch.clientX - touchStartRef.current.x;
    const deltaY = touch.clientY - touchStartRef.current.y;
    touchStartRef.current = null;

    if (Math.abs(deltaX) < SWIPE_THRESHOLD || Math.abs(deltaX) <= Math.abs(deltaY) * 1.2) return;
    if (deltaX > 0) selectPrevious();
    else selectNext();
  };

  return (
    <div data-item-gallery className="min-w-0 max-w-full overflow-hidden rounded-2xl border border-[#E8E2DD] bg-white shadow-sm">
      <div
        data-gallery-main
        className="relative flex aspect-[4/3] min-w-0 items-center justify-center bg-[#F2EFE9] touch-pan-y"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={() => { touchStartRef.current = null; }}
      >
        {selectedImage && !selectedImageFailed ? (
          <img
            key={selectedImage}
            src={selectedImage}
            alt={`${title} - ảnh ${safeSelectedIndex + 1}`}
            className="h-full w-full max-w-full object-contain"
            onError={() => handleImageError(selectedImage)}
          />
        ) : (
          <div className="flex flex-col items-center justify-center p-8 text-center text-gray-500">
            {selectedImageFailed ? (
              <ImageOff className="mb-2 h-12 w-12 text-[#741216]" aria-hidden="true" />
            ) : (
              <CategoryIcon category={category} className="mb-2 h-12 w-12 text-[#741216]" />
            )}
            <span className="text-xs">
              {selectedImageFailed ? 'Không thể tải hình ảnh này' : 'Không có hình ảnh'}
            </span>
          </div>
        )}

        <div className="absolute left-3 top-3 z-10">
          <span className={`inline-flex whitespace-nowrap rounded-full border px-3 py-1 text-xs font-bold shadow-sm ${
            isFound
              ? 'border-[#C8E6C9] bg-[#E8F5E9] text-[#2E7D32]'
              : 'border-[#FFCDD2] bg-[#FFEBEE] text-[#C62828]'
          }`}>
            {isFound ? 'Nhặt được' : 'Đã đánh mất'}
          </span>
        </div>

        {galleryImages.length > 1 && (
          <>
            <button
              type="button"
              onClick={selectPrevious}
              className="absolute left-2 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-gray-700 shadow-md backdrop-blur-xs transition hover:text-black focus:outline-none focus:ring-2 focus:ring-[#741216] focus:ring-offset-2 sm:left-3"
              aria-label="Xem ảnh trước"
            >
              <ChevronLeft className="h-5 w-5" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={selectNext}
              className="absolute right-2 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-gray-700 shadow-md backdrop-blur-xs transition hover:text-black focus:outline-none focus:ring-2 focus:ring-[#741216] focus:ring-offset-2 sm:right-3"
              aria-label="Xem ảnh tiếp theo"
            >
              <ChevronRight className="h-5 w-5" aria-hidden="true" />
            </button>
          </>
        )}

        {galleryImages.length > 0 && (
          <div data-gallery-counter className="absolute bottom-3 right-3 rounded-full bg-black/65 px-2.5 py-1 font-mono text-[11px] text-white backdrop-blur-xs">
            {safeSelectedIndex + 1} / {galleryImages.length}
          </div>
        )}
      </div>

      {galleryImages.length > 1 && (
        <div
          ref={thumbnailStripRef}
          data-thumbnail-strip
          className="flex min-w-0 max-w-full gap-2 overflow-x-auto overscroll-x-contain border-t border-[#E8E2DD] bg-gray-50/80 p-3 [scrollbar-width:thin]"
          aria-label="Danh sách ảnh thu nhỏ"
        >
          {galleryImages.map((image, index) => (
            <button
              key={`${itemId}-${index}-${image}`}
              ref={node => { thumbnailRefs.current[index] = node; }}
              type="button"
              onClick={() => setSelectedIndex(index)}
              className={`relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border-2 bg-[#F2EFE9] transition md:h-20 md:w-20 ${
                index === safeSelectedIndex
                  ? 'border-[#AD222B] ring-1 ring-[#AD222B]'
                  : 'border-transparent opacity-75 hover:opacity-100'
              }`}
              aria-label={`Xem ảnh ${index + 1}`}
              aria-current={index === safeSelectedIndex ? 'true' : undefined}
            >
              {failedImages.has(image) ? (
                <ImageOff className="absolute inset-0 m-auto h-5 w-5 text-gray-500" aria-hidden="true" />
              ) : (
                <img
                  src={image}
                  alt=""
                  className="h-full w-full object-cover"
                  onError={() => handleImageError(image)}
                />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
