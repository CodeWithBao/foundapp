import { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Camera, Upload, Video, X, Trash2, ChevronLeft, Ellipsis, SwitchCamera, Check, ImagePlus } from 'lucide-react';
import apiClient from '../../services/apiClient';
import { createSelectedImage, prepareImageFile, validateImageFile, MAX_IMAGES, IMAGE_ACCEPT } from '../../utils/selectedImages';
import './HandoverModal.css';

// FRONTEND UI ONLY: media selection and accessible dialog lifecycle.
export default function HandoverModal({ isOpen, onClose, onSubmit, recipientName, recipientCode, staffName, itemTitle }) {
  return isOpen ? <HandoverDialog {...{ onClose, onSubmit, recipientName, recipientCode, staffName, itemTitle }} /> : null;
}

function HandoverDialog({ onClose, onSubmit, recipientName, recipientCode, staffName, itemTitle }) {
  const titleId = useId();
  const dialog = useRef(null);
  const video = useRef(null);
  const imagesRef = useRef([]);
  const alive = useRef(true);
  const busyRef = useRef(false);
  const closeRef = useRef(onClose);
  useEffect(() => { closeRef.current = onClose; }, [onClose]);
  const [tab, setTab] = useState('camera');
  const [cameraAttempt, setCameraAttempt] = useState(0);
  const [cameraReady, setCameraReady] = useState(false);
  const [facingMode, setFacingMode] = useState('environment');
  const [capturing, setCapturing] = useState(false);
  const capturePending = useRef(false);
  const [cameraError, setCameraError] = useState('');
  const [images, setImages] = useState([]);
  const [preview, setPreview] = useState(null);
  const [notes, setNotes] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState('');
  const [date] = useState(() => new Date());
  // FRONTEND UI ONLY: camera actions disclosure and keyboard focus.
  const [cameraMenuOpen, setCameraMenuOpen] = useState(false);
  const cameraMenu = useRef(null);
  const cameraMenuTrigger = useRef(null);
  const cameraMenuId = useId();

  useEffect(() => {
    if (!cameraMenuOpen) return;
    cameraMenu.current?.querySelector('button:not(:disabled)')?.focus();
    const dismiss = event => {
      if (!cameraMenu.current?.contains(event.target) && !cameraMenuTrigger.current?.contains(event.target)) setCameraMenuOpen(false);
    };
    const keydown = event => {
      if (event.key === 'Escape') {
        event.preventDefault();
        event.stopImmediatePropagation();
        setCameraMenuOpen(false);
        cameraMenuTrigger.current?.focus();
      }
    };
    document.addEventListener('pointerdown', dismiss);
    document.addEventListener('focusin', dismiss);
    document.addEventListener('keydown', keydown, true);
    return () => {
      document.removeEventListener('pointerdown', dismiss);
      document.removeEventListener('focusin', dismiss);
      document.removeEventListener('keydown', keydown, true);
    };
  }, [cameraMenuOpen]);

  useEffect(() => {
    alive.current = true;
    const previous = document.activeElement;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    dialog.current.focus();
    const focusables = () => [...dialog.current.querySelectorAll('button:not(:disabled), input:not(:disabled), textarea:not(:disabled), [tabindex="0"]')].filter(el => el.getClientRects().length);
    const keydown = event => {
      if (event.key === 'Escape') {
        event.preventDefault();
        if (!busyRef.current) closeRef.current();
      }
      if (event.key === 'Tab') {
        const elements = focusables();
        const first = elements[0];
        const last = elements[elements.length - 1];
        if (!first) { event.preventDefault(); dialog.current.focus(); }
        else if (event.shiftKey && (document.activeElement === first || document.activeElement === dialog.current)) { event.preventDefault(); last.focus(); }
        else if (!event.shiftKey && (document.activeElement === last || document.activeElement === dialog.current)) { event.preventDefault(); first.focus(); }
      }
    };
    const containFocus = event => {
      if (dialog.current && !dialog.current.contains(event.target)) dialog.current.focus();
    };
    document.addEventListener('keydown', keydown);
    document.addEventListener('focusin', containFocus);
    return () => {
      alive.current = false;
      document.removeEventListener('keydown', keydown);
      document.removeEventListener('focusin', containFocus);
      document.body.style.overflow = overflow;
      imagesRef.current.forEach(image => URL.revokeObjectURL(image.previewUrl));
      if (previous?.isConnected) previous.focus();
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    let stream;
    if (tab === 'camera') {
      (async () => {
        try {
          if (!navigator.mediaDevices?.getUserMedia) throw new Error('Camera không khả dụng');
          stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: facingMode }, width: { ideal: 1920 }, height: { ideal: 1080 } }, audio: false });
          if (cancelled) { stream.getTracks().forEach(track => track.stop()); return; }
          video.current.srcObject = stream;
          await video.current.play();
          if (!cancelled) setCameraReady(true);
        } catch {
          stream?.getTracks().forEach(track => track.stop());
          if (!cancelled) setCameraError('Không thể mở camera. Hãy cấp quyền camera hoặc chuyển sang Tải ảnh.');
        }
      })();
    }
    return () => {
      cancelled = true;
      stream?.getTracks().forEach(track => track.stop());
    };
  }, [tab, cameraAttempt, facingMode]);

  const changeTab = next => {
    setCameraMenuOpen(false);
    setCameraReady(false); setCameraError(''); setTab(next);
    if (tab === 'camera' && next !== 'camera') requestAnimationFrame(() => document.getElementById(`${titleId}-${next}`)?.focus());
  };
  const updateImages = next => { imagesRef.current = next; setImages(next); };
  const addFiles = files => {
    const next = [...imagesRef.current];
    const errors = [];
    for (const file of files) {
      const invalid = validateImageFile(file);
      if (invalid) { errors.push(invalid); continue; }
      if (next.length >= MAX_IMAGES) { errors.push(`Tối đa ${MAX_IMAGES} ảnh.`); break; }
      next.push(createSelectedImage(file, tab, next.length));
    }
    updateImages(next);
    setError(errors.join(' '));
  };
  const capture = () => {
    if (capturePending.current || imagesRef.current.length >= MAX_IMAGES) return;
    const element = video.current;
    if (!element?.videoWidth || !cameraReady) { setError('Camera chưa sẵn sàng, vui lòng thử lại.'); return; }
    const canvas = document.createElement('canvas');
    canvas.width = element.videoWidth;
    canvas.height = element.videoHeight;
    canvas.getContext('2d').drawImage(element, 0, 0);
    capturePending.current = true;
    setCapturing(true);
    canvas.toBlob(blob => {
      capturePending.current = false;
      if (!alive.current) return;
      setCapturing(false);
      if (blob) addFiles([new File([blob], `ban-giao-${Date.now()}.jpg`, { type: 'image/jpeg' })]);
      else setError('Không thể chụp ảnh. Vui lòng thử lại.');
    }, 'image/jpeg', 0.9);
  };
  const remove = image => {
    if (preview === image.previewUrl) setPreview(null);
    URL.revokeObjectURL(image.previewUrl);
    updateImages(imagesRef.current.filter(entry => entry.id !== image.id));
  };
  const submit = async event => {
    event.preventDefault();
    if (busyRef.current) return;
    setError('');
    if (!imagesRef.current.length) { setError('Vui lòng chụp hoặc tải ít nhất một ảnh bằng chứng.'); return; }
    let link = videoUrl.trim();
    if (link) {
      try { const parsed = new URL(link); if (!['https:', 'http:'].includes(parsed.protocol)) throw new Error(); link = parsed.href; }
      catch { setError('Liên kết video phải là URL http hoặc https hợp lệ.'); return; }
    }
    busyRef.current = true;
    setBusy(true);
    try {
      const urls = [];
      for (const [index, image] of imagesRef.current.entries()) {
        setProgress(`Đang tải ảnh ${index + 1}/${imagesRef.current.length}…`);
        if (!image.uploadedUrl) {
          const file = await prepareImageFile(image);
          const body = new FormData();
          body.append('image', file, file.name);
          const result = await apiClient.upload('/uploads', body);
          if (!/^\/api\/v1\/uploads\/[a-f0-9]{32}$/i.test(result?.url || '')) throw new Error('Máy chủ không trả về ảnh bằng chứng hợp lệ.');
          image.uploadedUrl = result.url;
        }
        urls.push(image.uploadedUrl);
      }
      setProgress('Đang lưu biên bản…');
      await onSubmit({ evidenceImages: urls, notes: [notes.trim(), link ? `Liên kết video (ghi chú): ${link}` : ''].filter(Boolean).join('\n'), recipientName: recipientName || '', recipientStudentId: recipientCode || '' });
    } catch (err) {
      if (alive.current) setError(err.isUncertain ? 'Chưa xác định được kết quả lưu. Hãy đóng và tải lại hồ sơ để kiểm tra trước khi gửi lại.' : err.message || 'Không thể lưu biên bản. Vui lòng thử lại.');
    } finally {
      busyRef.current = false;
      if (alive.current) { setBusy(false); setProgress(''); }
    }
  };

  return createPortal(
    <div className="handover-overlay">
      <section ref={dialog} className={`handover-dialog${tab === 'camera' ? ' handover-camera-active' : ''}`} role="dialog" aria-modal="true" aria-labelledby={titleId} tabIndex={-1}>
        <header className="handover-header"><h2 id={titleId}>Biên bản Xác nhận bàn giao tài sản</h2><button type="button" aria-label="Đóng biên bản" disabled={busy} onClick={onClose}><X size={20} /></button></header>
        <form onSubmit={submit} className="handover-body" aria-busy={busy}>
          <p className="handover-intro">Xác nhận trao trả tài sản và lưu bằng chứng bàn giao tại UniFind DNTU.</p>
          <p className="handover-item">{itemTitle || 'Chưa có thông tin tài sản'}</p>
          <dl className="handover-summary">{[['Người nhận', recipientName], ['MSSV / Mã nhân viên', recipientCode], ['Nhân viên thực hiện', staffName], ['Ngày bàn giao', date.toLocaleString('vi-VN')]].map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value || 'Chưa cập nhật'}</dd></div>)}</dl>
          <fieldset disabled={busy}>
            <legend>Bằng chứng bàn giao <span aria-hidden="true">*</span></legend>
            <div className="handover-tabs" role="tablist" aria-label="Nguồn bằng chứng">{[['camera', Camera, 'Camera'], ['file', Upload, 'Tải ảnh'], ['video', Video, 'Link video']].map(([key, Icon, label], index) => <button type="button" key={key} role="tab" id={`${titleId}-${key}`} aria-controls={`${titleId}-panel`} aria-selected={tab === key} tabIndex={tab === key ? 0 : -1} onClick={() => changeTab(key)} onKeyDown={event => { if (['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) { event.preventDefault(); const keys = ['camera', 'file', 'video']; const next = event.key === 'Home' ? 0 : event.key === 'End' ? 2 : (index + (event.key === 'ArrowRight' ? 1 : 2)) % 3; changeTab(keys[next]); document.getElementById(`${titleId}-${keys[next]}`)?.focus(); } }}><Icon size={17} aria-hidden="true" />{label}</button>)}</div>
            <div className="handover-panel" role="tabpanel" id={`${titleId}-panel`} aria-labelledby={`${titleId}-${tab}`}>
              {tab === 'camera' && <div className="handover-camera-shell">
                <div className="handover-camera">
                  <video ref={video} autoPlay muted playsInline aria-label="Xem trước camera bàn giao" />
                  <div className="handover-camera-top"><span><Camera size={16} aria-hidden="true" />Bằng chứng bàn giao</span><span className="handover-camera-badge" role="status">{images.length}/{MAX_IMAGES} ảnh</span></div>
                  {!cameraReady && <div className="handover-camera-message" role={cameraError ? 'alert' : 'status'}><Camera size={32} aria-hidden="true" /><p>{cameraError || 'Đang kết nối camera…'}</p>{cameraError && <><button type="button" onClick={() => { setCameraError(''); setCameraReady(false); setCameraAttempt(value => value + 1); }}>Thử lại camera</button><button type="button" onClick={() => changeTab('file')}><Upload size={18} aria-hidden="true" />Chọn ảnh từ thiết bị</button></>}</div>}
                  <div className="handover-camera-bottom">
                    {!!images.length && <div className="handover-camera-images" role="group" aria-label="Ảnh đã chụp · Xóa ảnh sai để chụp lại">{images.map((image, index) => <div key={image.id} className="handover-camera-image"><img src={image.previewUrl} alt={`Ảnh đã chọn ${index + 1}`} /><button type="button" className="handover-camera-remove" aria-label={`Xóa ảnh bằng chứng ${index + 1} trong camera`} onClick={() => remove(image)}><X size={24} strokeWidth={3} aria-hidden="true" /></button></div>)}</div>}
                    <div className="handover-camera-meta"><button type="button" className="handover-camera-thumbnail" aria-label="Xem ảnh đã chọn" onClick={() => changeTab('file')}>{images.length ? <img src={images[images.length - 1].previewUrl} alt="Ảnh vừa chọn" /> : <ImagePlus size={22} aria-hidden="true" />}</button><p role="status">{images.length >= MAX_IMAGES ? 'Đã đủ 8 ảnh' : 'Chụp rõ tài sản và bàn giao'}<small>Ảnh được lưu riêng tư · Tối đa {MAX_IMAGES} ảnh</small></p><button type="button" className="handover-camera-done" onClick={() => changeTab('file')}><Check size={18} aria-hidden="true" />Xong</button></div>
                    {error && <p className="handover-camera-feedback" role="alert">{error}</p>}
                    <div className="handover-camera-controls">
                      <button type="button" className="handover-camera-round" aria-label="Quay lại biên bản" onClick={() => changeTab('file')}><ChevronLeft size={26} aria-hidden="true" /></button>
                      <button type="button" className="handover-shutter" aria-label="Chụp ảnh" disabled={!cameraReady || capturing || images.length >= MAX_IMAGES} onClick={capture}><span className="handover-sr-only">Chụp ảnh</span></button>
                      <div className="handover-camera-actions">
                        <button ref={cameraMenuTrigger} type="button" className="handover-camera-round" aria-label="Tùy chọn camera" aria-expanded={cameraMenuOpen} aria-controls={cameraMenuOpen ? cameraMenuId : undefined} onClick={() => setCameraMenuOpen(value => !value)}><Ellipsis size={26} aria-hidden="true" /></button>
                        {cameraMenuOpen && <div ref={cameraMenu} id={cameraMenuId} className="handover-camera-menu" role="group" aria-label="Hành động camera">
                          <button type="button" aria-label="Đổi camera trước hoặc sau" disabled={!cameraReady || capturing} onClick={() => { setCameraMenuOpen(false); cameraMenuTrigger.current?.focus(); setCameraReady(false); setCameraError(''); setFacingMode(value => value === 'environment' ? 'user' : 'environment'); }}><SwitchCamera size={18} aria-hidden="true" />Đổi camera trước / sau</button>
                          <button type="button" onClick={() => changeTab('file')}><Check size={18} aria-hidden="true" />Xong · Quay lại biên bản</button>
                        </div>}
                      </div>
                    </div>
                    <p className="handover-camera-caption">{capturing ? 'Đang chụp…' : 'ẢNH BÀN GIAO'}</p>
                  </div>
                </div>
              </div>}
              {tab === 'file' && <label className="handover-upload">Chọn nhiều ảnh bằng chứng<input type="file" multiple accept={IMAGE_ACCEPT} onChange={event => { addFiles([...event.target.files]); event.target.value = ''; }} /><span>JPG, PNG, WebP, HEIC/HEIF; tối đa 10 MB/ảnh, {MAX_IMAGES} ảnh. HEIC cần thiết bị hỗ trợ chuyển đổi.</span></label>}
              {tab === 'video' && <label className="handover-label">Liên kết video<input type="url" value={videoUrl} onChange={event => setVideoUrl(event.target.value)} placeholder="https://…" /><span>Chỉ lưu liên kết trong ghi chú, không tải video lên và không thay thế ảnh bắt buộc.</span></label>}
            </div>
            <p className="handover-count">Đã chọn {images.length}/{MAX_IMAGES} ảnh · Có thể thêm ảnh từ camera hoặc tệp.</p>
            <div className="handover-images">{images.map((image, index) => <div key={image.id}><button type="button" aria-label={`Xem ảnh bằng chứng ${index + 1}`} onClick={() => setPreview(preview === image.previewUrl ? null : image.previewUrl)}><img src={image.previewUrl} alt={`Bằng chứng ${index + 1}`} /></button><button type="button" className="handover-remove" aria-label={`Xóa ảnh bằng chứng ${index + 1}`} onClick={() => remove(image)}><Trash2 size={16} /></button></div>)}</div>
            {preview && <div className="handover-preview"><img src={preview} alt="Ảnh bằng chứng phóng to" /><button type="button" onClick={() => setPreview(null)}>Đóng xem ảnh</button></div>}
            <label className="handover-label">Ghi chú bàn giao<textarea rows={3} value={notes} onChange={event => setNotes(event.target.value)} placeholder="Tình trạng tài sản, giấy tờ đã đối chiếu…" /></label>
          </fieldset>
          {error && <p className="handover-error" role="alert">{error}</p>}
          <p role="status" className="handover-count">{progress}</p>
          <footer className="handover-footer"><button type="button" disabled={busy} onClick={onClose}>Hủy</button><button type="submit" className="handover-confirm" disabled={busy}>{busy ? 'Đang xử lý…' : 'Xác nhận bàn giao'}</button></footer>
        </form>
      </section>
    </div>, document.body);
}
