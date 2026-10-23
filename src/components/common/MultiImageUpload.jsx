import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  AlertCircle,
  Camera,
  Check,
  ChevronLeft,
  ChevronRight,
  FileImage,
  GripVertical,
  Images,
  Loader2,
  Plus,
  RotateCcw,
  SwitchCamera,
  UploadCloud,
  X,
  Zap,
  ZapOff,
} from 'lucide-react';
import {
  createSelectedImage,
  IMAGE_ACCEPT,
  imageFileKey,
  MAX_IMAGES,
  normalizeImageOrder,
  validateImageFile,
} from '../../utils/selectedImages';

const focusableSelector = [
  'button:not([disabled])',
  'input:not([disabled])',
  '[href]',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

function useOverlayAccessibility(isOpen, containerRef, onClose) {
  useEffect(() => {
    if (!isOpen) return undefined;
    const previousFocus = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const focusFirst = window.setTimeout(() => {
      containerRef.current?.querySelector(focusableSelector)?.focus();
    }, 0);
    const onKeyDown = event => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key !== 'Tab' || !containerRef.current) return;
      const focusable = [...containerRef.current.querySelectorAll(focusableSelector)];
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => {
      window.clearTimeout(focusFirst);
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previousOverflow;
      if (previousFocus instanceof HTMLElement) previousFocus.focus();
    };
  }, [containerRef, isOpen, onClose]);
}

function SourcePicker({ open, onClose, onCamera, onGallery, onFile }) {
  const panelRef = useRef(null);
  const pointerStart = useRef(null);
  const [dragOffset, setDragOffset] = useState(0);
  useOverlayAccessibility(open, panelRef, onClose);

  if (!open) return null;
  const options = [
    { label: 'Camera', description: 'Chụp liên tiếp tối đa 8 ảnh', icon: Camera, action: onCamera },
    { label: 'Ảnh', description: 'Chọn nhiều ảnh từ thư viện', icon: Images, action: onGallery },
    { label: 'Tệp', description: 'Chọn ảnh từ ứng dụng Tệp', icon: FileImage, action: onFile },
  ];

  return createPortal(
    <div
      className="fixed inset-0 z-[1000] flex items-end justify-center bg-black/45 p-3 backdrop-blur-[2px] sm:items-center sm:p-6"
      role="presentation"
      onMouseDown={event => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="image-source-title"
        className="ios-glass-sheet w-full max-w-md overflow-hidden text-white transition-transform duration-200 motion-reduce:transition-none"
        style={{ transform: `translateY(${dragOffset}px)` }}
        onPointerDown={event => {
          if (event.pointerType !== 'mouse') pointerStart.current = event.clientY;
        }}
        onPointerMove={event => {
          if (pointerStart.current !== null) setDragOffset(Math.max(0, event.clientY - pointerStart.current));
        }}
        onPointerUp={() => {
          if (dragOffset > 90) onClose();
          pointerStart.current = null;
          setDragOffset(0);
        }}
      >
        <div className="pb-[max(16px,env(safe-area-inset-bottom))]">
          <div className="flex justify-center py-3 sm:hidden" aria-hidden="true">
            <span className="h-1.5 w-12 rounded-full bg-white/35" />
          </div>
          <div className="flex items-start justify-between px-5 pb-3 pt-1 sm:pt-5">
            <div>
              <h2 id="image-source-title" className="text-lg font-semibold">Thêm hình ảnh</h2>
              <p className="mt-1 text-xs text-white/65">Ảnh chỉ được tải lên khi bạn gửi bài.</p>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Đóng menu chọn nguồn ảnh"
              className="flex h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-white/10 text-white transition-colors hover:bg-white/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              <X className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>
          <div className="grid gap-2 px-3 sm:grid-cols-3 sm:px-4 sm:pb-4">
            {options.map(({ label, description, icon: Icon, action }) => (
              <button
                key={label}
                type="button"
                onClick={action}
                className="flex min-h-[72px] items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.08] px-4 py-3 text-left transition-colors hover:bg-white/[0.16] focus:outline-none focus-visible:ring-2 focus-visible:ring-white sm:min-h-[132px] sm:flex-col sm:justify-center sm:text-center"
              >
                <span className="flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-full border border-white/15 bg-white/10 shadow-inner">
                  <Icon className="h-6 w-6" aria-hidden="true" />
                </span>
                <span>
                  <span className="block text-sm font-semibold">{label}</span>
                  <span className="mt-0.5 block text-xs leading-4 text-white/60 sm:hidden">{description}</span>
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}

function CameraOverlay({ open, existingCount, onClose, onUsePhotos, onFallback, onGallery }) {
  const panelRef = useRef(null);
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const shotsRef = useRef([]);
  const acceptedShotsRef = useRef(false);
  const [shots, setShots] = useState([]);
  const [facingMode, setFacingMode] = useState('environment');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [flash, setFlash] = useState(false);
  const [torchSupported, setTorchSupported] = useState(false);
  const [torchOn, setTorchOn] = useState(false);

  useEffect(() => {
    shotsRef.current = shots;
  }, [shots]);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach(track => track.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setTorchSupported(false);
    setTorchOn(false);
  }, []);

  const discardAndClose = useCallback(() => {
    stopCamera();
    setShots(current => {
      current.forEach(shot => URL.revokeObjectURL(shot.previewUrl));
      return [];
    });
    setError('');
    onClose();
  }, [onClose, stopCamera]);

  useOverlayAccessibility(open, panelRef, discardAndClose);

  const startCamera = useCallback(async mode => {
    acceptedShotsRef.current = false;
    stopCamera();
    setLoading(true);
    setError('');
    if (!navigator.mediaDevices?.getUserMedia) {
      setLoading(false);
      setError('Trình duyệt không hỗ trợ xem trước camera. Bạn có thể dùng camera hệ thống.');
      return;
    }
    try {
      let stream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: mode }, width: { ideal: 1920 }, height: { ideal: 1440 } },
          audio: false,
        });
      } catch (firstError) {
        if (firstError?.name === 'NotAllowedError' || firstError?.name === 'SecurityError') throw firstError;
        stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      }
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => {});
      }
      const track = stream.getVideoTracks()[0];
      const capabilities = track?.getCapabilities?.();
      setTorchSupported(Boolean(capabilities?.torch));
    } catch (cameraError) {
      const denied = cameraError?.name === 'NotAllowedError' || cameraError?.name === 'SecurityError';
      setError(denied
        ? 'Quyền camera đã bị từ chối. Hãy cấp quyền trong trình duyệt hoặc chọn ảnh từ thư viện.'
        : 'Không thể mở camera trên thiết bị này. Bạn có thể chuyển sang thư viện hoặc camera hệ thống.');
    } finally {
      setLoading(false);
    }
  }, [stopCamera]);

  useEffect(() => {
    const startTimer = open
      ? window.setTimeout(() => startCamera(facingMode), 0)
      : null;
    return () => {
      if (startTimer !== null) window.clearTimeout(startTimer);
      stopCamera();
    };
  }, [open, facingMode, startCamera, stopCamera]);

  useEffect(() => () => {
    if (!acceptedShotsRef.current) {
      shotsRef.current.forEach(shot => URL.revokeObjectURL(shot.previewUrl));
    }
  }, []);

  if (!open) return null;

  const capture = () => {
    const video = videoRef.current;
    if (!video?.videoWidth || existingCount + shots.length >= MAX_IMAGES) return;
    const sourceWidth = video.videoWidth;
    const sourceHeight = video.videoHeight;
    const targetRatio = 4 / 3;
    let sx = 0;
    let sy = 0;
    let sw = sourceWidth;
    let sh = sourceHeight;
    if (sourceWidth / sourceHeight > targetRatio) {
      sw = sourceHeight * targetRatio;
      sx = (sourceWidth - sw) / 2;
    } else {
      sh = sourceWidth / targetRatio;
      sy = (sourceHeight - sh) / 2;
    }
    const canvas = document.createElement('canvas');
    canvas.width = 1600;
    canvas.height = 1200;
    canvas.getContext('2d').drawImage(video, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);
    canvas.toBlob(blob => {
      if (!blob) return;
      const file = new File([blob], `camera-${Date.now()}.jpg`, { type: 'image/jpeg', lastModified: Date.now() });
      setShots(current => [...current, createSelectedImage(file, 'camera', existingCount + current.length)]);
      setFlash(true);
      window.setTimeout(() => setFlash(false), 130);
    }, 'image/jpeg', 0.88);
  };

  const retake = () => {
    setShots(current => {
      const last = current[current.length - 1];
      if (!last) return current;
      URL.revokeObjectURL(last.previewUrl);
      return current.slice(0, -1);
    });
  };

  const usePhotos = () => {
    if (!shots.length) return;
    acceptedShotsRef.current = true;
    stopCamera();
    onUsePhotos(shots);
    setShots([]);
    setError('');
    onClose();
  };

  const toggleTorch = async () => {
    const track = streamRef.current?.getVideoTracks?.()[0];
    if (!track || !torchSupported) return;
    const next = !torchOn;
    try {
      await track.applyConstraints({ advanced: [{ torch: next }] });
      setTorchOn(next);
    } catch {
      setError('Thiết bị không thể thay đổi đèn pin ở chế độ hiện tại.');
    }
  };

  return createPortal(
    <div ref={panelRef} className="fixed inset-0 z-[1100] h-[100dvh] w-full overflow-hidden bg-black text-white" role="dialog" aria-modal="true" aria-label="Máy ảnh">
      <video ref={videoRef} autoPlay muted playsInline className="absolute inset-0 h-full w-full object-cover" />
      <div className="absolute inset-0 bg-gradient-to-b from-black/65 via-transparent to-black/75" aria-hidden="true" />
      {flash && <div className="pointer-events-none absolute inset-0 z-30 bg-white" aria-hidden="true" />}

      <div className="absolute inset-x-0 top-0 z-20 flex items-center justify-between px-4 pb-4 pt-[max(16px,env(safe-area-inset-top))]">
        <button type="button" onClick={discardAndClose} aria-label="Đóng camera" className="camera-glass-button">
          <ChevronLeft className="h-6 w-6" aria-hidden="true" />
        </button>
        <span className="rounded-full border border-white/15 bg-black/40 px-4 py-2 text-sm font-semibold backdrop-blur-xl">
          {existingCount + shots.length}/{MAX_IMAGES} ảnh
        </span>
        <button
          type="button"
          onClick={() => setFacingMode(mode => mode === 'environment' ? 'user' : 'environment')}
          aria-label="Chuyển camera trước hoặc sau"
          className="camera-glass-button"
        >
          <SwitchCamera className="h-5 w-5" aria-hidden="true" />
        </button>
      </div>

      <div className="pointer-events-none absolute left-1/2 top-1/2 aspect-[4/3] w-[min(92vw,calc(100dvh*0.68))] -translate-x-1/2 -translate-y-1/2 rounded-3xl border border-white/25 shadow-[0_0_0_9999px_rgba(0,0,0,0.12)]" aria-hidden="true" />

      {(loading || error) && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/65 px-6">
          {loading ? (
            <div className="text-center"><Loader2 className="mx-auto h-9 w-9 animate-spin motion-reduce:animate-none" /><p className="mt-3 text-sm">Đang mở camera…</p></div>
          ) : (
            <div className="max-w-sm rounded-3xl border border-white/15 bg-white/10 p-6 text-center backdrop-blur-2xl">
              <AlertCircle className="mx-auto h-8 w-8 text-amber-300" aria-hidden="true" />
              <p className="mt-3 text-sm leading-6">{error}</p>
              <div className="mt-5 grid gap-2">
                <button type="button" onClick={onFallback} className="min-h-12 rounded-2xl bg-white px-4 text-sm font-semibold text-black focus:outline-none focus-visible:ring-2 focus-visible:ring-[#AD222B]">Mở camera hệ thống</button>
                <button type="button" onClick={() => { discardAndClose(); onGallery(); }} className="min-h-12 rounded-2xl border border-white/20 bg-white/10 px-4 text-sm font-semibold focus:outline-none focus-visible:ring-2 focus-visible:ring-white">Chọn từ thư viện</button>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="absolute inset-x-0 bottom-0 z-20 px-4 pb-[max(18px,env(safe-area-inset-bottom))]">
        {shots.length > 0 && (
          <div className="mx-auto mb-4 flex max-w-xl gap-2 overflow-x-auto rounded-2xl border border-white/10 bg-black/35 p-2 backdrop-blur-xl">
            {shots.map((shot, index) => (
              <div key={shot.id} className="relative h-14 w-[74px] shrink-0 overflow-hidden rounded-xl border border-white/25">
                <img src={shot.previewUrl} alt={`Ảnh vừa chụp ${index + 1}`} className="h-full w-full object-cover" />
              </div>
            ))}
          </div>
        )}
        <div className="mx-auto grid max-w-xl grid-cols-3 items-center">
          <div className="flex justify-start">
            {shots.length > 0 && (
              <button type="button" onClick={retake} className="camera-glass-button w-auto gap-2 px-3" aria-label="Chụp lại ảnh gần nhất">
                <RotateCcw className="h-5 w-5" aria-hidden="true" /><span className="text-xs font-semibold">Chụp lại</span>
              </button>
            )}
          </div>
          <button
            type="button"
            onClick={capture}
            disabled={loading || Boolean(error) || existingCount + shots.length >= MAX_IMAGES}
            aria-label="Chụp ảnh"
            className="mx-auto flex h-[76px] w-[76px] items-center justify-center rounded-full border-4 border-white bg-white/20 shadow-2xl transition-colors hover:bg-white/35 focus:outline-none focus-visible:ring-4 focus-visible:ring-[#AD222B] disabled:opacity-40"
          >
            <span className="h-14 w-14 rounded-full bg-white" aria-hidden="true" />
          </button>
          <div className="flex justify-end gap-2">
            {torchSupported && (
              <button type="button" onClick={toggleTorch} aria-label={torchOn ? 'Tắt đèn pin' : 'Bật đèn pin'} aria-pressed={torchOn} className="camera-glass-button">
                {torchOn ? <ZapOff className="h-5 w-5" aria-hidden="true" /> : <Zap className="h-5 w-5" aria-hidden="true" />}
              </button>
            )}
            {shots.length > 0 && (
              <button type="button" onClick={usePhotos} className="camera-glass-button w-auto gap-2 px-3" aria-label={`Dùng ${shots.length} ảnh đã chụp`}>
                <Check className="h-5 w-5" aria-hidden="true" /><span className="text-xs font-semibold">Dùng ảnh</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}

function Lightbox({ images, activeIndex, onChange, onClose }) {
  const panelRef = useRef(null);
  useOverlayAccessibility(activeIndex !== null, panelRef, onClose);
  if (activeIndex === null || !images[activeIndex]) return null;
  const active = images[activeIndex];
  const move = direction => onChange((activeIndex + direction + images.length) % images.length);
  return createPortal(
    <div ref={panelRef} className="fixed inset-0 z-[1050] flex h-[100dvh] items-center justify-center bg-black/90 p-4 pb-[max(16px,env(safe-area-inset-bottom))] pt-[max(16px,env(safe-area-inset-top))]" role="dialog" aria-modal="true" aria-label={`Xem ảnh ${activeIndex + 1} trên ${images.length}`}>
      <button type="button" onClick={onClose} aria-label="Đóng xem ảnh" className="camera-glass-button absolute right-4 top-[max(16px,env(safe-area-inset-top))] z-10"><X className="h-5 w-5" aria-hidden="true" /></button>
      {images.length > 1 && <button type="button" onClick={() => move(-1)} aria-label="Xem ảnh trước" className="camera-glass-button absolute left-3 sm:left-6"><ChevronLeft className="h-6 w-6" aria-hidden="true" /></button>}
      <img src={active.previewUrl} alt={`Ảnh vật phẩm ${activeIndex + 1}`} className="max-h-[86dvh] max-w-[88vw] rounded-2xl object-contain shadow-2xl" />
      {images.length > 1 && <button type="button" onClick={() => move(1)} aria-label="Xem ảnh tiếp theo" className="camera-glass-button absolute right-3 sm:right-6"><ChevronRight className="h-6 w-6" aria-hidden="true" /></button>}
      <span className="absolute bottom-[max(20px,env(safe-area-inset-bottom))] rounded-full bg-black/60 px-4 py-2 text-sm text-white backdrop-blur-xl">{activeIndex + 1}/{images.length}</span>
    </div>,
    document.body,
  );
}

export default function MultiImageUpload({ value = [], onChange, label = 'Hình ảnh vật phẩm', onRemoveUploaded, onRetryImage }) {
  const images = useMemo(() => normalizeImageOrder(value), [value]);
  const galleryInputRef = useRef(null);
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);
  const [sourceOpen, setSourceOpen] = useState(false);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [selectionErrors, setSelectionErrors] = useState([]);
  const [lightboxIndex, setLightboxIndex] = useState(null);
  const dragIndex = useRef(null);

  const emit = next => onChange(normalizeImageOrder(next));

  const addFiles = (fileList, source) => {
    const incoming = [...(fileList || [])];
    if (!incoming.length) return;
    const keys = new Set(images.map(image => image.fileKey || imageFileKey(image.file)));
    const next = [...images];
    const errors = [];
    for (const file of incoming) {
      const validationError = validateImageFile(file);
      if (validationError) {
        errors.push(validationError);
        continue;
      }
      const key = imageFileKey(file);
      if (keys.has(key)) {
        errors.push(`${file.name}: ảnh này đã được chọn.`);
        continue;
      }
      if (next.length >= MAX_IMAGES) {
        errors.push(`${file.name}: đã đạt giới hạn ${MAX_IMAGES} ảnh.`);
        continue;
      }
      keys.add(key);
      next.push(createSelectedImage(file, source, next.length));
    }
    setSelectionErrors(errors);
    if (next.length !== images.length) emit(next);
  };

  const removeImage = image => {
    URL.revokeObjectURL(image.previewUrl);
    if (image.uploadedUrl) onRemoveUploaded?.(image.uploadedUrl);
    emit(images.filter(current => current.id !== image.id));
  };

  const moveImage = (from, to) => {
    if (to < 0 || to >= images.length || from === to) return;
    const next = [...images];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    emit(next.map((image, order) => ({ ...image, order, isCover: order === 0 })));
  };

  const setCover = index => {
    const next = images.map((image, imageIndex) => ({ ...image, isCover: imageIndex === index }));
    emit(next);
  };

  const openCamera = () => {
    setSourceOpen(false);
    if (!navigator.mediaDevices?.getUserMedia) {
      cameraInputRef.current?.click();
      return;
    }
    setCameraOpen(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <label className="block text-sm font-semibold text-[#1C2530]">{label}</label>
          <p className="mt-1 text-xs text-[#5B6574]">Tối đa {MAX_IMAGES} ảnh, 10 MB/ảnh. JPG, PNG, WebP; HEIC/HEIF sẽ được chuyển đổi khi thiết bị hỗ trợ.</p>
        </div>
        <span className="rounded-full bg-[#F2EFE9] px-3 py-1.5 text-xs font-semibold text-[#5B6574]">{images.length}/{MAX_IMAGES} ảnh</span>
      </div>

      {selectionErrors.length > 0 && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700" role="alert">
          <div className="flex items-start gap-2"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" /><div>{selectionErrors.map(error => <p key={error}>{error}</p>)}</div></div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
        {images.map((image, index) => (
          <article
            key={image.id}
            draggable
            onDragStart={() => { dragIndex.current = index; }}
            onDragOver={event => event.preventDefault()}
            onDrop={() => { if (dragIndex.current !== null) moveImage(dragIndex.current, index); dragIndex.current = null; }}
            className="image-preview-card group"
          >
            <button type="button" onClick={() => setLightboxIndex(index)} className="block h-full w-full focus:outline-none focus-visible:ring-4 focus-visible:ring-[#AD222B]" aria-label={`Xem lớn ảnh ${index + 1}`}>
              <img src={image.previewUrl} alt={`Ảnh vật phẩm ${index + 1}`} className="h-full w-full object-cover" />
            </button>
            <div className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between bg-gradient-to-b from-black/65 to-transparent p-2 text-white">
              <div className="flex items-center gap-1.5">
                <span className="flex h-7 min-w-7 items-center justify-center rounded-full bg-black/55 px-2 text-xs font-bold backdrop-blur-md">{index + 1}</span>
                {image.isCover && <span className="rounded-full bg-[#AD222B] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide">Ảnh bìa</span>}
              </div>
              <GripVertical className="h-5 w-5 opacity-70" aria-hidden="true" />
            </div>
            <button type="button" onClick={() => removeImage(image)} className="image-remove-button absolute right-2 top-2 z-10 flex items-center justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-white" aria-label={`Xóa ảnh ${index + 1}`}>
              <X className="h-4 w-4" aria-hidden="true" />
            </button>

            {(image.status === 'compressing' || image.status === 'uploading') && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 px-3 text-center text-white backdrop-blur-sm" role="status">
                <Loader2 className="h-6 w-6 animate-spin motion-reduce:animate-none" aria-hidden="true" />
                <span className="mt-2 text-xs font-semibold">{image.status === 'compressing' ? 'Đang xử lý…' : `Đang tải ${image.progress}%`}</span>
                <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-white/25"><div className="h-full rounded-full bg-white transition-[width]" style={{ width: `${image.progress}%` }} /></div>
              </div>
            )}
            {image.status === 'success' && <span className="absolute bottom-2 right-2 flex h-8 w-8 items-center justify-center rounded-full bg-emerald-600 text-white shadow-lg" aria-label="Đã tải ảnh"><Check className="h-4 w-4" aria-hidden="true" /></span>}
            {image.status === 'error' && (
              <div className="absolute inset-x-2 bottom-2 rounded-xl bg-red-700/95 p-2 text-[11px] leading-4 text-white shadow-lg backdrop-blur-md" role="alert">
                <p className="line-clamp-2">{image.error}</p>
                {onRetryImage && <button type="button" onClick={() => onRetryImage(image.id)} className="mt-1 min-h-8 rounded-lg bg-white px-2 font-semibold text-red-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-white">Thử lại</button>}
              </div>
            )}
            {image.status === 'uncertain' && (
              <div className="absolute inset-x-2 bottom-2 rounded-xl border border-amber-200 bg-amber-900/95 p-2 text-[11px] leading-4 text-white shadow-lg backdrop-blur-md" role="alert">
                <p>{image.error}</p>
              </div>
            )}

            <div className="absolute inset-x-2 bottom-2 flex items-center justify-between gap-1 opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100">
              <div className="flex gap-1">
                <button type="button" onClick={() => moveImage(index, index - 1)} disabled={index === 0} className="camera-glass-button !h-9 !w-9 disabled:opacity-30" aria-label={`Di chuyển ảnh ${index + 1} sang trái`}><ChevronLeft className="h-4 w-4" aria-hidden="true" /></button>
                <button type="button" onClick={() => moveImage(index, index + 1)} disabled={index === images.length - 1} className="camera-glass-button !h-9 !w-9 disabled:opacity-30" aria-label={`Di chuyển ảnh ${index + 1} sang phải`}><ChevronRight className="h-4 w-4" aria-hidden="true" /></button>
              </div>
              {!image.isCover && <button type="button" onClick={() => setCover(index)} className="min-h-9 rounded-full border border-white/20 bg-black/65 px-2.5 text-[10px] font-semibold text-white backdrop-blur-md focus:outline-none focus-visible:ring-2 focus-visible:ring-white">Đặt ảnh bìa</button>}
            </div>
          </article>
        ))}

        {images.length < MAX_IMAGES && (
          <button
            type="button"
            onClick={() => setSourceOpen(true)}
            className="flex aspect-[4/3] min-h-[120px] flex-col items-center justify-center rounded-[20px] border-2 border-dashed border-[#AD222B]/30 bg-[#FAF8F2] p-4 text-[#AD222B] transition-colors hover:border-[#AD222B] hover:bg-red-50/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#AD222B] focus-visible:ring-offset-2"
          >
            <span className="flex h-[52px] w-[52px] items-center justify-center rounded-full bg-[#AD222B] text-white shadow-lg"><Plus className="h-6 w-6" aria-hidden="true" /></span>
            <span className="mt-3 text-sm font-semibold">{images.length ? 'Thêm ảnh' : '+ Thêm hình ảnh'}</span>
          </button>
        )}
      </div>

      {images.length === 0 && (
        <div className="flex items-start gap-3 rounded-xl border border-[#E0E2E6] bg-[#FAF8F2]/60 p-4 text-xs text-[#5B6574]">
          <UploadCloud className="h-5 w-5 shrink-0 text-[#AD222B]" aria-hidden="true" />
          <p>Chưa có ảnh nào. Bạn có thể chụp liên tiếp hoặc chọn nhiều ảnh; hệ thống không tự mở camera và không tải ảnh trước khi gửi bài.</p>
        </div>
      )}

      <input ref={galleryInputRef} className="sr-only" type="file" accept={IMAGE_ACCEPT} multiple onChange={event => { addFiles(event.target.files, 'gallery'); event.target.value = ''; }} />
      <input ref={fileInputRef} className="sr-only" type="file" accept={IMAGE_ACCEPT} multiple onChange={event => { addFiles(event.target.files, 'file'); event.target.value = ''; }} />
      <input ref={cameraInputRef} className="sr-only" type="file" accept="image/*" capture="environment" onChange={event => { addFiles(event.target.files, 'camera'); event.target.value = ''; setCameraOpen(false); }} />

      <SourcePicker
        open={sourceOpen}
        onClose={() => setSourceOpen(false)}
        onCamera={openCamera}
        onGallery={() => { setSourceOpen(false); galleryInputRef.current?.click(); }}
        onFile={() => { setSourceOpen(false); fileInputRef.current?.click(); }}
      />
      <CameraOverlay
        open={cameraOpen}
        existingCount={images.length}
        onClose={() => setCameraOpen(false)}
        onFallback={() => { setCameraOpen(false); cameraInputRef.current?.click(); }}
        onGallery={() => window.setTimeout(() => galleryInputRef.current?.click(), 0)}
        onUsePhotos={shots => emit([...images, ...shots])}
      />
      <Lightbox images={images} activeIndex={lightboxIndex} onChange={setLightboxIndex} onClose={() => setLightboxIndex(null)} />
    </div>
  );
}
