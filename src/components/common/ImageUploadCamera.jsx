import { useState, useRef, useEffect } from 'react';
import { Camera, Upload, Link as LinkIcon, RefreshCw, Trash2, Check, AlertCircle } from 'lucide-react';
import Button from './Button';

export default function ImageUploadCamera({ value, onChange, label = 'Hình ảnh vật phẩm', saved = false }) {
  const [activeTab, setActiveTab] = useState('camera'); // 'camera' | 'file' | 'url'
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [urlInput, setUrlInput] = useState('');
  const [selectionError, setSelectionError] = useState('');
  
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  // Stop camera stream when unmounted or tab changes
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  };

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const startCamera = async () => {
    setCameraError('');
    try {
      stopCamera();
      let stream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: 'environment' },
            width: { ideal: 1280 },
            height: { ideal: 720 }
          }
        });
      } catch {
        // Fallback for laptops/desktops without rear camera
        stream = await navigator.mediaDevices.getUserMedia({ video: true });
      }
      streamRef.current = stream;
      setIsCameraActive(true);
    } catch (err) {
      console.error('Camera error:', err);
      setCameraError('Không thể kết nối Camera. Vui lòng cho phép quyền truy cập camera trong trình duyệt hoặc tải tệp ảnh lên.');
      setIsCameraActive(false);
    }
  };

  // Attach stream to video element whenever camera turns active
  useEffect(() => {
    if (isCameraActive && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
      videoRef.current.play().catch(err => console.error('Video play error:', err));
    }
  }, [isCameraActive]);

  const capturePhoto = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
    onChange(dataUrl);
    stopCamera();
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setSelectionError('Vui lòng chọn file hình ảnh hợp lệ (JPG, PNG, WEBP).');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setSelectionError('Kích thước ảnh tối đa 10MB.');
      return;
    }

    setSelectionError('');
    const reader = new FileReader();
    reader.onload = (event) => {
      onChange(event.target.result);
    };
    reader.readAsDataURL(file);
  };

  const handleUrlSubmit = (e) => {
    e.preventDefault();
    if (urlInput.trim()) {
      onChange(urlInput.trim());
    }
  };

  const handleRemoveImage = () => {
    onChange('');
    setUrlInput('');
    stopCamera();
  };

  const handleRetakePhoto = () => {
    onChange('');
    setUrlInput('');
    setActiveTab('camera');
  };

  useEffect(() => {
    if (!value && activeTab === 'camera') {
      startCamera();
    }
  }, [value, activeTab]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (tab !== 'camera') {
      stopCamera();
    }
  };

  return (
    <div className="space-y-4">
      {label && <label className="block text-sm font-semibold text-gray-900">{label}</label>}

      {/* If Image already exists / captured */}
      {value ? (
        <div className="space-y-3">
          <div className="relative rounded-2xl overflow-hidden border border-gray-200 bg-black max-w-md mx-auto aspect-video shadow-md group">
            <img src={value} alt="Chụp vật phẩm" className="w-full h-full object-contain" />
            <div className="absolute inset-x-0 bottom-0 bg-black/55 p-3 flex flex-wrap items-center justify-center gap-2 opacity-100 transition-opacity sm:inset-0 sm:bg-black/40 sm:p-0 sm:opacity-0 sm:group-hover:opacity-100">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="bg-white/90 hover:bg-white text-gray-800"
                onClick={handleRetakePhoto}
              >
                <RefreshCw className="w-4 h-4 mr-1.5" /> Chụp lại
              </Button>
              <Button
                type="button"
                variant="danger"
                size="sm"
                onClick={handleRemoveImage}
              >
                <Trash2 className="w-4 h-4 mr-1.5" /> Xóa
              </Button>
            </div>
          </div>
          <div className="flex items-center justify-center gap-2 text-xs text-green-700 bg-green-50 py-2 px-3 rounded-lg border border-green-200">
            <Check className="w-4 h-4 text-green-600 shrink-0" />
            <span>{saved ? 'Ảnh đã được lưu cùng bài đăng' : 'Ảnh đã được chọn, sẽ lưu khi bạn gửi bài đăng'}</span>
          </div>
        </div>
      ) : (
        <div className="border rounded-2xl p-3 sm:p-4 bg-gray-50/50 space-y-4">
          {/* Method selector tabs */}
          {selectionError && (
            <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-xs leading-relaxed text-red-700">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{selectionError}</span>
            </div>
          )}
          <div className="grid grid-cols-1 min-[430px]:grid-cols-3 items-stretch gap-1.5 p-1 bg-gray-200/70 rounded-xl text-xs sm:text-sm font-medium">
            <button
              type="button"
              onClick={() => handleTabChange('camera')}
              className={`min-h-11 min-w-0 flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg transition-all ${
                activeTab === 'camera' ? 'bg-white text-burgundy-700 shadow-sm font-semibold' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Camera className="w-4 h-4" />
              <span>Chụp ảnh trực tiếp</span>
            </button>
            <button
              type="button"
              onClick={() => handleTabChange('file')}
              className={`min-h-11 min-w-0 flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg transition-all ${
                activeTab === 'file' ? 'bg-white text-burgundy-700 shadow-sm font-semibold' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Upload className="w-4 h-4" />
              <span>Tải file từ máy</span>
            </button>
            <button
              type="button"
              onClick={() => handleTabChange('url')}
              className={`min-h-11 min-w-0 flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg transition-all ${
                activeTab === 'url' ? 'bg-white text-burgundy-700 shadow-sm font-semibold' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <LinkIcon className="w-4 h-4" />
              <span>Nhập Link URL</span>
            </button>
          </div>

          {/* TAB 1: CAMERA CAPTURE */}
          {activeTab === 'camera' && (
            <div className="space-y-4">
              {!isCameraActive ? (
                <div className="border-2 border-dashed border-burgundy-200 rounded-xl p-6 sm:p-8 text-center bg-white flex flex-col items-center justify-center">
                  <div className="w-14 h-14 bg-burgundy-50 text-burgundy-700 rounded-full flex items-center justify-center mb-3">
                    <Camera className="w-7 h-7" />
                  </div>
                  <h4 className="text-base font-bold text-gray-900">Chụp ảnh vật phẩm nhặt được</h4>
                  <p className="text-xs text-gray-500 mt-1 max-w-xs mx-auto">
                    Sử dụng Camera của thiết bị hoặc điện thoại để chụp ngay món đồ
                  </p>

                  {cameraError && (
                    <div className="mt-3 flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 text-left w-full max-w-sm">
                      <AlertCircle className="w-4 h-4 shrink-0 text-red-500 mt-0.5" />
                      <span>{cameraError}</span>
                    </div>
                  )}

                  <Button
                    type="button"
                    onClick={startCamera}
                    className="mt-4 bg-burgundy-600 hover:bg-burgundy-700 text-white shadow-sm flex items-center gap-2"
                  >
                    <Camera className="w-4 h-4" /> Bật Camera & Chụp
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="relative rounded-2xl overflow-hidden bg-black max-w-md mx-auto aspect-video shadow-lg">
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-3 left-3 bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full animate-pulse flex items-center gap-1">
                      <span className="w-1.5 h-1.5 bg-white rounded-full"></span> LIVE CAMERA
                    </div>
                  </div>

                  <div className="flex flex-col items-stretch justify-center gap-2 min-[390px]:flex-row min-[390px]:items-center min-[390px]:gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={stopCamera}
                      className="text-gray-600"
                    >
                      Tắt Camera
                    </Button>
                    <Button
                      type="button"
                      onClick={capturePhoto}
                      className="bg-burgundy-600 hover:bg-burgundy-700 text-white font-semibold px-6 shadow-md flex items-center gap-2"
                    >
                      <Camera className="w-5 h-5" /> Chụp ngay
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: FILE UPLOAD / MOBILE CAMERA INPUT */}
          {activeTab === 'file' && (
            <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 sm:p-8 text-center bg-white flex flex-col items-center justify-center relative hover:bg-gray-50 transition-colors">
              <input
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleFileUpload}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              />
              <div className="w-12 h-12 bg-gray-100 text-gray-500 rounded-full flex items-center justify-center mb-3">
                <Upload className="w-6 h-6" />
              </div>
              <p className="text-sm font-semibold text-gray-900">Bấm vào đây để chọn ảnh hoặc chụp ảnh từ điện thoại</p>
              <p className="text-xs text-gray-500 mt-1">Hỗ trợ JPG, PNG, WEBP (Tối đa 10MB)</p>
            </div>
          )}

          {/* TAB 3: URL INPUT */}
          {activeTab === 'url' && (
            <form onSubmit={handleUrlSubmit} className="space-y-3 bg-white p-4 rounded-xl border border-gray-200">
              <label className="block text-xs font-medium text-gray-700">Đường dẫn hình ảnh (URL)</label>
               <div className="flex min-w-0 flex-col gap-2 min-[430px]:flex-row">
                <input
                  type="url"
                  placeholder="https://example.com/hinh-anh-vat-pham.jpg"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  className="min-w-0 flex-1 px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-burgundy-500 focus:outline-none"
                />
                <Button type="submit" className="w-full bg-burgundy-600 hover:bg-burgundy-700 text-white shrink-0 min-[430px]:w-auto">
                  Xác nhận URL
                </Button>
              </div>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
