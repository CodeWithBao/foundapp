import { useEffect } from 'react';
import { X } from 'lucide-react';
import Button from './Button';

const sizeMap = {
  sm: 'max-w-sm',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
};

export function Modal({ isOpen, onClose, title, children, size = 'md' }) {
  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-3 sm:p-4" style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}>
      <div className="fixed inset-0 bg-ink/60 backdrop-blur-sm transition-opacity" onClick={onClose} />
      <div className={`relative bg-white rounded-card-lg shadow-landing-lg border border-hairline w-full ${sizeMap[size]} animate-scaleIn max-h-[calc(100dvh-1.5rem)] sm:max-h-[90dvh] flex flex-col overflow-hidden`}>
        <div className="flex min-w-0 items-center justify-between gap-3 px-4 py-3 sm:px-6 sm:py-4 border-b border-hairline/80 bg-paper-soft">
          <h2 className="min-w-0 text-base sm:text-lg font-serif font-bold text-ink break-words">{title}</h2>
          <button onClick={onClose} className="shrink-0 p-2 rounded-lg text-ink-muted hover:bg-paper-panel hover:text-ink transition-colors" aria-label="Đóng hộp thoại">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="min-h-0 overflow-y-auto overscroll-contain px-4 py-4 sm:px-6 sm:py-5">{children}</div>
      </div>
    </div>
  );
}

export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title = 'Xác nhận',
  message,
  confirmText = 'Xác nhận',
  cancelText = 'Hủy',
  variant = 'danger',
}) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm">
      <p className="text-warm-gray-500 mb-6">{message}</p>
      <div className="flex justify-end gap-3">
        <Button variant="ghost" onClick={onClose}>{cancelText}</Button>
        <Button variant={variant === 'danger' ? 'danger' : 'primary'} onClick={onConfirm}>{confirmText}</Button>
      </div>
    </Modal>
  );
}

export default Modal;
