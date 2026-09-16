import { useState, useRef, useEffect } from 'react';
import { Camera, Upload, Link as LinkIcon, RefreshCw, Trash2, Check, AlertCircle } from 'lucide-react';
import Button from './Button';

export default function ImageUploadCamera({ value, onChange, label = 'Hình ảnh vật phẩm' }) {
  const [activeTab, setActiveTab] = useState('camera'); // 'camera' | 'file' | 'url'
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [urlInput, setUrlInput] = useState('');
  
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
      const constraints = {
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setIsCameraActive(true);
    } catch (err) {
      console.error('Camera error:', err);
      setCameraError('Không thể kết nối Camera. Vui lòng cho phép quyền truy cập camera hoặc chọn tải ảnh lên.');
      setIsCameraActive(false);
    }
  };

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
      alert('Vui lòng chọn file hình ảnh hợp lệ (JPG, PNG...)');
      return;
    }

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
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="bg-white/90 hover:bg-white text-gray-800"
                onClick={handleRemoveImage}
              >
                <RefreshCw className="w-4 h-4 mr-1.5" /> Chụp lại / Đổi ảnh
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
            <span>Đã có hình ảnh chụp/tải lên thành công</span>
          </div>
        </div>
      ) : (
        <div className="border rounded-2xl p-4 bg-gray-50/50 space-y-4">
          {/* Method selector tabs */}
          <div className="flex items-center gap-2 p-1 bg-gray-200/70 rounded-xl text-xs sm:text-sm font-medium">
            <button
              type="button"
              onClick={() => handleTabChange('camera')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg transition-all ${
                activeTab === 'camera' ? 'bg-white text-burgundy-700 shadow-sm font-semibold' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Camera className="w-4 h-4" />
              <span>Chụp ảnh trực tiếp</span>
            </button>
            <button
              type="button"
              onClick={() => handleTabChange('file')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg transition-all ${
                activeTab === 'file' ? 'bg-white text-burgundy-700 shadow-sm font-semibold' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Upload className="w-4 h-4" />
              <span>Tải file từ máy</span>
            </button>
            <button
              type="button"
              onClick={() => handleTabChange('url')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg transition-all ${
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

                  <div className="flex items-center justify-center gap-3">
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
              <div className="flex gap-2">
                <input
                  type="url"
                  placeholder="https://example.com/hinh-anh-vat-pham.jpg"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  className="flex-1 px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-burgundy-500 focus:outline-none"
                />
                <Button type="submit" className="bg-burgundy-600 hover:bg-burgundy-700 text-white shrink-0">
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
