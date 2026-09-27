import React, { useState, useRef, useEffect, useCallback } from 'react';
import { X, ZoomIn, ZoomOut, Move, RotateCw, Check } from 'lucide-react';
import Button from './Button';

/**
 * AvatarCropModal: Cho phép căn chỉnh ảnh trong khung tròn (kéo chuột/chạm hoặc phím mũi tên)
 * Xuất ảnh 1:1 theo đúng khung tròn để lưu làm avatar.
 */
export default function AvatarCropModal({
  isOpen,
  imageSrc,
  onClose,
  onSave,
  title = 'Chọn ảnh đại diện',
}) {
  const [zoom, setZoom] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [description, setDescription] = useState('');
  const [imgNaturalSize, setImgNaturalSize] = useState({ width: 0, height: 0 });
  const [isLoaded, setIsLoaded] = useState(false);

  const containerRef = useRef(null);
  const imgRef = useRef(null);

  // Kích thước khung tròn hiển thị
  const CROP_DIAMETER = 260; // px
  const OUTPUT_SIZE = 512; // px chất lượng cao

  const handleImageLoad = (e) => {
    const { naturalWidth, naturalHeight } = e.target;
    setImgNaturalSize({ width: naturalWidth, height: naturalHeight });
    setIsLoaded(true);
    setPosition({ x: 0, y: 0 });
    setZoom(1);
  };

  // Tính scale cơ sở để ảnh luôn phủ kín hoặc vừa khít khung tròn
  const getBaseScale = useCallback(() => {
    if (!imgNaturalSize.width || !imgNaturalSize.height) return 1;
    return Math.max(
      CROP_DIAMETER / imgNaturalSize.width,
      CROP_DIAMETER / imgNaturalSize.height
    );
  }, [imgNaturalSize.width, imgNaturalSize.height]);

  // Giới hạn vùng di chuyển ảnh để không để lộ khoảng trống trong vòng tròn
  const clampPosition = useCallback((newX, newY, currentZoom = zoom) => {
    if (!imgNaturalSize.width || !imgNaturalSize.height) return { x: newX, y: newY };
    
    const baseScale = getBaseScale();
    const currentW = imgNaturalSize.width * baseScale * currentZoom;
    const currentH = imgNaturalSize.height * baseScale * currentZoom;

    // Bán kính giới hạn di chuyển
    const maxOffsetX = Math.max(0, (currentW - CROP_DIAMETER) / 2);
    const maxOffsetY = Math.max(0, (currentH - CROP_DIAMETER) / 2);

    return {
      x: Math.min(maxOffsetX, Math.max(-maxOffsetX, newX)),
      y: Math.min(maxOffsetY, Math.max(-maxOffsetY, newY)),
    };
  }, [imgNaturalSize, zoom, getBaseScale]);

  // Xử lý zoom
  const handleZoomChange = useCallback((newZoom) => {
    const clampedZoom = Math.min(3, Math.max(1, newZoom));
    setZoom(clampedZoom);
    setPosition((prev) => clampPosition(prev.x, prev.y, clampedZoom));
  }, [clampPosition]);

  // Lắng nghe lăn chuột để zoom mượt mà
  useEffect(() => {
    const container = containerRef.current;
    if (!isOpen || !container) return;

    const handleWheelEvent = (e) => {
      e.preventDefault();
      const delta = e.deltaY < 0 ? 0.08 : -0.08;
      setZoom((prevZoom) => {
        const nextZoom = Math.min(3, Math.max(1, prevZoom + delta));
        setPosition((prevPos) => clampPosition(prevPos.x, prevPos.y, nextZoom));
        return nextZoom;
      });
    };

    container.addEventListener('wheel', handleWheelEvent, { passive: false });
    return () => container.removeEventListener('wheel', handleWheelEvent);
  }, [isOpen, clampPosition]);

  // Xử lý kéo thả bằng chuột / touch
  const handlePointerDown = (e) => {
    setIsDragging(true);
    const clientX = e.clientX ?? e.touches?.[0]?.clientX ?? 0;
    const clientY = e.clientY ?? e.touches?.[0]?.clientY ?? 0;
    setDragStart({
      x: clientX - position.x,
      y: clientY - position.y,
    });
  };

  const handlePointerMove = (e) => {
    if (!isDragging) return;
    const clientX = e.clientX ?? e.touches?.[0]?.clientX ?? 0;
    const clientY = e.clientY ?? e.touches?.[0]?.clientY ?? 0;
    const nextX = clientX - dragStart.x;
    const nextY = clientY - dragStart.y;
    setPosition(clampPosition(nextX, nextY));
  };

  const handlePointerUp = () => {
    setIsDragging(false);
  };

  // Điều khiển bằng phím mũi tên (Arrow keys)
  const handleKeyDown = useCallback((e) => {
    if (!isOpen) return;
    const STEP = e.shiftKey ? 15 : 5;
    let dx = 0;
    let dy = 0;

    if (e.key === 'ArrowUp') dy = -STEP;
    else if (e.key === 'ArrowDown') dy = STEP;
    else if (e.key === 'ArrowLeft') dx = -STEP;
    else if (e.key === 'ArrowRight') dx = STEP;
    else return;

    e.preventDefault();
    setPosition((prev) => clampPosition(prev.x + dx, prev.y + dy));
  }, [isOpen, clampPosition]);

  useEffect(() => {
    if (!isOpen) return;
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleKeyDown]);

  // Xuất ảnh ra Canvas và lưu
  const handleConfirmCrop = () => {
    if (!imgRef.current || !isLoaded) return;

    try {
      const canvas = document.createElement('canvas');
      canvas.width = OUTPUT_SIZE;
      canvas.height = OUTPUT_SIZE;
      const ctx = canvas.getContext('2d');

      if (!ctx) return;

      const baseScale = getBaseScale();
      const scaleMultiplier = baseScale * zoom;
      const ratio = OUTPUT_SIZE / CROP_DIAMETER;

      // Làm mịn hình ảnh chất lượng cao
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      // Nền trắng
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, OUTPUT_SIZE, OUTPUT_SIZE);

      // Dịch chuyển tâm canvas tới tâm khung tròn và vẽ
      ctx.save();
      ctx.translate(OUTPUT_SIZE / 2, OUTPUT_SIZE / 2);
      ctx.translate(position.x * ratio, position.y * ratio);
      ctx.scale(scaleMultiplier * ratio, scaleMultiplier * ratio);

      ctx.drawImage(
        imgRef.current,
        -imgNaturalSize.width / 2,
        -imgNaturalSize.height / 2,
        imgNaturalSize.width,
        imgNaturalSize.height
      );
      ctx.restore();

      const croppedDataUrl = canvas.toDataURL('image/jpeg', 0.94);
      onSave(croppedDataUrl, description);
      onClose();
    } catch (err) {
      console.error('Lỗi cắt ảnh:', err);
    }
  };

  if (!isOpen) return null;

  const baseScale = getBaseScale();
  const renderedWidth = imgNaturalSize.width * baseScale * zoom;
  const renderedHeight = imgNaturalSize.height * baseScale * zoom;

  return (
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-sm animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="avatar-crop-title"
    >
      <div
        className="w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden border border-stone-200 flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-100">
          <h3 id="avatar-crop-title" className="text-lg font-bold text-stone-900 tracking-tight">
            {title}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-full flex items-center justify-center text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors"
            aria-label="Đóng"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Crop Area Container */}
        <div className="p-4 sm:p-6 bg-stone-50 flex flex-col items-center">
          {/* Main Visual Viewport */}
          <div
            ref={containerRef}
            className="w-full h-80 sm:h-88 bg-stone-950 rounded-2xl relative overflow-hidden flex items-center justify-center select-none shadow-inner cursor-grab active:cursor-grabbing touch-none"
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerUp}
          >
            {/* The Image */}
            {imageSrc && (
              <img
                ref={imgRef}
                src={imageSrc}
                alt="Crop preview"
                onLoad={handleImageLoad}
                draggable={false}
                className="absolute max-w-none pointer-events-none transition-transform duration-75 will-change-transform"
                style={{
                  width: `${renderedWidth}px`,
                  height: `${renderedHeight}px`,
                  left: '50%',
                  top: '50%',
                  transform: `translate(calc(-50% + ${position.x}px), calc(-50% + ${position.y}px))`,
                }}
              />
            )}

            {/* Circular Crop Overlay Mask */}
            <div
              className="absolute pointer-events-none rounded-full border-2 border-white shadow-[0_0_0_9999px_rgba(0,0,0,0.65)]"
              style={{
                width: `${CROP_DIAMETER}px`,
                height: `${CROP_DIAMETER}px`,
                left: '50%',
                top: '50%',
                transform: 'translate(-50%, -50%)',
              }}
            >
              {/* Subtle inner circular guide lines */}
              <div className="w-full h-full rounded-full border border-white/20" />
            </div>

            {/* Drag guide indicator icon when idle */}
            {!isDragging && (
              <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-md text-white/90 text-xs px-2.5 py-1 rounded-full flex items-center gap-1.5 pointer-events-none shadow-sm">
                <Move className="w-3.5 h-3.5" />
                <span>Kéo để căn</span>
              </div>
            )}
          </div>

          {/* Guide text under image */}
          <p className="text-xs text-stone-500 mt-2.5 flex items-center gap-1.5 font-medium text-center">
            <Move className="w-3.5 h-3.5 text-stone-400 shrink-0" />
            <span>Kéo hoặc dùng phím mũi tên để căn chỉnh vị trí</span>
          </p>

          {/* Zoom Slider */}
          <div className="w-full max-w-xs flex items-center gap-3 mt-4 px-2">
            <button
              type="button"
              onClick={() => handleZoomChange(zoom - 0.1)}
              disabled={zoom <= 1}
              className="p-1.5 text-stone-500 hover:text-stone-800 disabled:opacity-30 disabled:cursor-not-allowed rounded-lg hover:bg-stone-200 transition-colors"
              title="Thu nhỏ"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <input
              type="range"
              min="1"
              max="3"
              step="0.02"
              value={zoom}
              onChange={(e) => handleZoomChange(parseFloat(e.target.value))}
              className="flex-1 accent-[#981B1E] h-1.5 bg-stone-200 rounded-lg cursor-pointer"
              aria-label="Độ thu phóng"
            />
            <button
              type="button"
              onClick={() => handleZoomChange(zoom + 0.1)}
              disabled={zoom >= 3}
              className="p-1.5 text-stone-500 hover:text-stone-800 disabled:opacity-30 disabled:cursor-not-allowed rounded-lg hover:bg-stone-200 transition-colors"
              title="Phóng to"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => {
                setZoom(1);
                setPosition({ x: 0, y: 0 });
              }}
              className="p-1.5 text-stone-400 hover:text-stone-700 rounded-lg hover:bg-stone-200 transition-colors ml-1"
              title="Đặt lại vị trí"
            >
              <RotateCw className="w-4 h-4" />
            </button>
          </div>

          {/* Description field (as shown in Facebook/social avatar modal) */}
          <div className="w-full mt-4">
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Mô tả..."
              className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-stone-200 bg-white placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-[#981B1E]/30 focus:border-[#981B1E] resize-none"
            />
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-stone-100 bg-white">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
          >
            Hủy
          </Button>
          <Button
            type="button"
            variant="primary"
            onClick={handleConfirmCrop}
            icon={Check}
            className="bg-[#981B1E] hover:bg-[#741216] text-white shadow-sm"
          >
            Lưu
          </Button>
        </div>
      </div>
    </div>
  );
}
