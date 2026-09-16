import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, Image as ImageIcon, MapPin, FileText, CheckSquare, ShieldCheck, UserCheck, Send } from 'lucide-react';
import ImageUploadCamera from '../../components/common/ImageUploadCamera';
import { useAuth } from '../../context/AuthContext';
import itemService from '../../services/itemService';
import { STORAGE_KEYS } from '../../constants';
import storageService from '../../services/storageService';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import Textarea from '../../components/common/Textarea';
import PageHeader from '../../components/common/PageHeader';
import { toast } from 'sonner';

const STEPS = [
  { id: 1, title: 'Thông tin cơ bản', icon: MapPin },
  { id: 2, title: 'Mô tả chi tiết', icon: FileText },
  { id: 3, title: 'Hình ảnh', icon: ImageIcon },
  { id: 4, title: 'Xác nhận & Gửi', icon: CheckSquare },
];

export default function ReportFoundPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const categories = storageService.get(STORAGE_KEYS.CATEGORIES) || [];
  const locations = storageService.get(STORAGE_KEYS.LOCATIONS) || [];

  const [currentStep, setCurrentStep] = useState(1);
  const [form, setForm] = useState({
    title: '',
    category: '',
    date: new Date().toISOString().split('T')[0],
    location: '',
    holdingStatus: 'self', // 'self' | 'handed_over'
    storageLocation: 'Người nhặt đang giữ',
    color: '',
    brand: '',
    feature: '',
    description: '',
    imageUrl: '',
    confirmTruth: false,
  });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const validateStep = (step) => {
    const e = {};
    if (step === 1) {
      if (!form.title.trim()) e.title = 'Vui lòng nhập tên vật phẩm';
      if (!form.category) e.category = 'Vui lòng chọn danh mục';
      if (!form.date) e.date = 'Vui lòng chọn ngày nhặt được';
      if (!form.location) e.location = 'Vui lòng chọn địa điểm nhặt';
      if (form.holdingStatus === 'handed_over' && !form.storageLocation.trim()) {
        e.storageLocation = 'Vui lòng chọn hoặc nhập nơi đã giao nộp';
      }
    }
    if (step === 2) {
      if (!form.feature.trim()) e.feature = 'Vui lòng nhập đặc điểm nhận dạng';
    }
    if (step === 4) {
      if (!form.confirmTruth) e.confirmTruth = 'Vui lòng đánh dấu cam kết thông tin';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) setCurrentStep(p => p + 1);
  };
  const handlePrev = () => setCurrentStep(p => p - 1);

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!validateStep(4)) return;
    setSubmitting(true);
    try {
      await itemService.createItem({
        title: form.title.trim(),
        category: form.category,
        date: form.date,
        location: form.location,
        holdingStatus: form.holdingStatus,
        storageLocation: form.holdingStatus === 'self' ? 'Người nhặt đang giữ' : form.storageLocation,
        color: form.color.trim(),
        brand: form.brand.trim(),
        feature: form.feature.trim(),
        description: form.description.trim(),
        images: form.imageUrl ? [form.imageUrl] : [],
        type: 'FOUND',
        status: 'FOUND',
        userId: user.id,
        userName: user.name,
      });
      toast.success('Gửi báo cáo nhặt được đồ thành công!');
      navigate('/my-posts');
    } catch (err) {
      toast.error(err.message || 'Có lỗi xảy ra khi tạo báo cáo');
    } finally {
      setSubmitting(false);
    }
  };

  const update = (key, val) => {
    setForm(prev => {
      const next = { ...prev, [key]: val };
      if (key === 'holdingStatus') {
        next.storageLocation = val === 'self' ? 'Người nhặt đang giữ' : 'Phòng Bảo vệ (Cổng chính)';
      }
      return next;
    });
    if (errors[key]) setErrors(prev => ({ ...prev, [key]: undefined }));
  };

  const categoryOptions = [
    { value: '', label: '-- Chọn danh mục vật phẩm --' },
    ...categories.map(c => ({ value: c.name, label: c.name }))
  ];
  const locationOptions = [
    { value: '', label: '-- Chọn địa điểm nhặt được --' },
    ...locations.map(l => ({ value: l.name, label: l.name }))
  ];
  const handoverPlaceOptions = [
    { value: 'Phòng Bảo vệ (Cổng chính)', label: 'Phòng Bảo vệ (Cổng chính)' },
    { value: 'Phòng Công tác Sinh viên (Tòa A)', label: 'Phòng Công tác Sinh viên (Tòa A)' },
    { value: 'Văn phòng Đoàn - Hội (Tòa B)', label: 'Văn phòng Đoàn - Hội (Tòa B)' },
    { value: 'Khác', label: 'Nơi khác' },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <button
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-warm-gray-600 hover:text-burgundy-700 mb-4 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Quay lại
      </button>

      <PageHeader
        title="Khai báo vật phẩm nhặt được"
        subtitle="Vui lòng cung cấp chi tiết thông tin giúp chủ nhân sớm tìm lại tài sản."
      />

      <div className="flex flex-col md:flex-row gap-8 mt-6">
        {/* Left: Progress Steps */}
        <div className="w-full md:w-64 shrink-0">
          <div className="bg-white rounded-card border border-cream-300 p-6 shadow-card sticky top-24">
            <h3 className="text-sm font-bold uppercase tracking-wider text-burgundy-700 mb-5">
              Tiến trình báo cáo
            </h3>
            <div className="space-y-6">
              {STEPS.map((step, idx) => {
                const Icon = step.icon;
                const isActive = currentStep === step.id;
                const isCompleted = currentStep > step.id;
                return (
                  <div key={step.id} className="flex items-start gap-3">
                    <div className="flex flex-col items-center">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-bold transition-all duration-200 ${
                          isActive
                            ? 'bg-burgundy-600 text-white ring-4 ring-burgundy-100 shadow-sm'
                            : isCompleted
                            ? 'bg-burgundy-700 text-white'
                            : 'bg-cream-200 text-warm-gray-500 border border-cream-300'
                        }`}
                      >
                        {isCompleted ? <CheckCircle2 className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
                      </div>
                      {idx !== STEPS.length - 1 && (
                        <div
                          className={`w-0.5 h-8 my-1 transition-colors ${
                            isCompleted ? 'bg-burgundy-600' : 'bg-cream-200'
                          }`}
                        />
                      )}
                    </div>
                    <div className="pt-1">
                      <p className={`text-xs uppercase font-bold tracking-wider ${isActive ? 'text-burgundy-700' : 'text-warm-gray-400'}`}>
                        Bước {step.id}
                      </p>
                      <p className={`text-sm font-semibold ${isActive || isCompleted ? 'text-text-dark' : 'text-warm-gray-500'}`}>
                        {step.title}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right: Step Content Form */}
        <div className="flex-1">
          <div className="bg-white rounded-card border border-cream-300 shadow-card overflow-hidden">
            <div className="p-6 sm:p-8">
              {/* Step 1: Thông tin cơ bản + Lựa chọn giữ/giao */}
              {currentStep === 1 && (
                <div className="space-y-5 animate-in fade-in duration-200">
                  <div className="border-b border-cream-200 pb-4 mb-2">
                    <h3 className="text-lg font-bold text-burgundy-900">Bước 1: Thông tin cơ bản</h3>
                    <p className="text-xs text-warm-gray-500">Thông tin tên đồ vật, thời gian nhặt và vị trí lưu giữ hiện tại</p>
                  </div>

                  <Input
                    label="Tên vật phẩm nhặt được *"
                    placeholder="VD: Balo xám, Chùm chìa khóa Honda..."
                    value={form.title}
                    onChange={e => update('title', e.target.value)}
                    error={errors.title}
                  />

                  {/* Lựa chọn giữ / giao */}
                  <div className="space-y-2">
                    <label className="text-xs font-semibold uppercase tracking-wider text-warm-gray-600">
                      Tình trạng bảo quản hiện tại *
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div
                        onClick={() => update('holdingStatus', 'self')}
                        className={`border rounded-card p-4 cursor-pointer flex items-start gap-3 transition-all ${
                          form.holdingStatus === 'self'
                            ? 'border-burgundy-600 bg-burgundy-50/50 text-burgundy-900 ring-2 ring-burgundy-400/30'
                            : 'border-cream-300 hover:bg-cream-50'
                        }`}
                      >
                        <UserCheck className={`w-5 h-5 mt-0.5 shrink-0 ${form.holdingStatus === 'self' ? 'text-burgundy-600' : 'text-warm-gray-400'}`} />
                        <div>
                          <p className="text-sm font-bold">Tôi đang giữ vật phẩm</p>
                          <p className="text-xs text-warm-gray-500 mt-0.5">Sẽ bảo quản và tự liên hệ giao trả cho chủ nhân</p>
                        </div>
                      </div>

                      <div
                        onClick={() => update('holdingStatus', 'handed_over')}
                        className={`border rounded-card p-4 cursor-pointer flex items-start gap-3 transition-all ${
                          form.holdingStatus === 'handed_over'
                            ? 'border-burgundy-600 bg-burgundy-50/50 text-burgundy-900 ring-2 ring-burgundy-400/30'
                            : 'border-cream-300 hover:bg-cream-50'
                        }`}
                      >
                        <ShieldCheck className={`w-5 h-5 mt-0.5 shrink-0 ${form.holdingStatus === 'handed_over' ? 'text-burgundy-600' : 'text-warm-gray-400'}`} />
                        <div>
                          <p className="text-sm font-bold">Tôi đã giao cho Lost & Found / Bảo vệ</p>
                          <p className="text-xs text-warm-gray-500 mt-0.5">Đã bàn giao tại phòng chức năng hoặc bảo vệ trường</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {form.holdingStatus === 'handed_over' && (
                    <div className="p-4 bg-cream-50 rounded-card border border-cream-300 space-y-3">
                      <Select
                        label="Địa điểm đã bàn giao *"
                        options={handoverPlaceOptions}
                        value={form.storageLocation}
                        onChange={e => update('storageLocation', e.target.value)}
                        error={errors.storageLocation}
                      />
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <Select
                      label="Danh mục vật phẩm *"
                      options={categoryOptions}
                      value={form.category}
                      onChange={e => update('category', e.target.value)}
                      error={errors.category}
                    />
                    <Input
                      label="Ngày nhặt được *"
                      type="date"
                      value={form.date}
                      onChange={e => update('date', e.target.value)}
                      error={errors.date}
                      max={new Date().toISOString().split('T')[0]}
                    />
                  </div>

                  <Select
                    label="Địa điểm nhặt được *"
                    options={locationOptions}
                    value={form.location}
                    onChange={e => update('location', e.target.value)}
                    error={errors.location}
                  />
                </div>
              )}

              {/* Step 2: Mô tả chi tiết */}
              {currentStep === 2 && (
                <div className="space-y-5 animate-in fade-in duration-200">
                  <div className="border-b border-cream-200 pb-4 mb-2">
                    <h3 className="text-lg font-bold text-burgundy-900">Bước 2: Mô tả chi tiết</h3>
                    <p className="text-xs text-warm-gray-500">Màu sắc, thương hiệu và các điểm nổi bật của món đồ</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <Input
                      label="Màu sắc"
                      placeholder="VD: Xanh dương, Trắng..."
                      value={form.color}
                      onChange={e => update('color', e.target.value)}
                    />
                    <Input
                      label="Thương hiệu"
                      placeholder="VD: Sony, Uniqlo..."
                      value={form.brand}
                      onChange={e => update('brand', e.target.value)}
                    />
                  </div>

                  <Input
                    label="Đặc điểm nhận dạng nổi bật *"
                    placeholder="VD: Vỏ bọc màu đỏ, có dán sticker chú mèo..."
                    value={form.feature}
                    onChange={e => update('feature', e.target.value)}
                    error={errors.feature}
                  />

                  <Textarea
                    label="Mô tả chi tiết hơn (Tùy chọn)"
                    placeholder="Chi tiết hoàn cảnh nhặt, vị trí chính xác..."
                    value={form.description}
                    onChange={e => update('description', e.target.value)}
                    rows={4}
                  />
                </div>
              )}

              {/* Step 3: Hình ảnh */}
              {currentStep === 3 && (
                <div className="space-y-5 animate-in fade-in duration-200">
                  <div className="border-b border-cream-200 pb-4 mb-2">
                    <h3 className="text-lg font-bold text-burgundy-900">Bước 3: Hình ảnh vật phẩm (Tùy chọn)</h3>
                    <p className="text-xs text-warm-gray-500">Chụp ảnh thực tế từ camera hoặc tải tệp ảnh để đăng bài</p>
                  </div>

                  <ImageUploadCamera
                    value={form.imageUrl}
                    onChange={(val) => update('imageUrl', val)}
                    label="Hình ảnh vật phẩm nhặt được"
                  />
                </div>
              )}

              {/* Step 4: Xác nhận & Gửi */}
              {currentStep === 4 && (
                <div className="space-y-6 animate-in fade-in duration-200">
                  <div className="border-b border-cream-200 pb-4 mb-2">
                    <h3 className="text-lg font-bold text-burgundy-900">Bước 4: Xác nhận & Gửi thông tin</h3>
                    <p className="text-xs text-warm-gray-500">Rà soát thông tin khai báo trước khi đăng tải</p>
                  </div>

                  <div className="bg-cream-50 rounded-card p-5 border border-cream-300 text-sm">
                    <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
                      <div>
                        <dt className="text-xs text-warm-gray-500 uppercase font-medium">Tên vật phẩm</dt>
                        <dd className="font-semibold text-text-dark mt-0.5">{form.title}</dd>
                      </div>
                      <div>
                        <dt className="text-xs text-warm-gray-500 uppercase font-medium">Danh mục</dt>
                        <dd className="font-semibold text-text-dark mt-0.5">{form.category}</dd>
                      </div>
                      <div>
                        <dt className="text-xs text-warm-gray-500 uppercase font-medium">Ngày nhặt được</dt>
                        <dd className="font-semibold text-text-dark mt-0.5">{form.date}</dd>
                      </div>
                      <div>
                        <dt className="text-xs text-warm-gray-500 uppercase font-medium">Địa điểm nhặt</dt>
                        <dd className="font-semibold text-text-dark mt-0.5">{form.location}</dd>
                      </div>
                      <div>
                        <dt className="text-xs text-warm-gray-500 uppercase font-medium">Tình trạng giữ đồ</dt>
                        <dd className="font-semibold text-burgundy-700 mt-0.5">
                          {form.holdingStatus === 'self' ? 'Tự bảo quản' : form.storageLocation}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-xs text-warm-gray-500 uppercase font-medium">Đặc điểm nhận dạng</dt>
                        <dd className="font-semibold text-text-dark mt-0.5">{form.feature}</dd>
                      </div>
                      {form.description && (
                        <div className="sm:col-span-2 border-t border-cream-200 pt-3">
                          <dt className="text-xs text-warm-gray-500 uppercase font-medium">Mô tả thêm</dt>
                          <dd className="text-warm-gray-600 mt-0.5">{form.description}</dd>
                        </div>
                      )}
                    </dl>
                  </div>

                  <label className="flex items-start gap-3 p-4 border border-cream-300 rounded-card bg-cream-50/50 cursor-pointer hover:bg-cream-100 transition-colors">
                    <input
                      type="checkbox"
                      className="mt-1 w-4 h-4 text-burgundy-600 rounded border-cream-300 focus:ring-burgundy-500"
                      checked={form.confirmTruth}
                      onChange={e => update('confirmTruth', e.target.checked)}
                    />
                    <div className="flex-1 text-xs">
                      <span className="font-bold text-text-dark block text-sm">Tôi cam kết thông tin đã khai báo là hoàn toàn trung thực</span>
                      <span className="text-warm-gray-500">Tôi có nghĩa vụ bảo quản hoặc bàn giao theo đúng nơi đã báo.</span>
                    </div>
                  </label>
                  {errors.confirmTruth && <p className="text-xs text-dntu-danger font-medium">{errors.confirmTruth}</p>}
                </div>
              )}
            </div>

            {/* Navigation buttons */}
            <div className="px-6 py-4 bg-cream-100 border-t border-cream-300 flex justify-between items-center">
              {currentStep > 1 ? (
                <Button variant="secondary" onClick={handlePrev} size="sm">
                  Quay lại
                </Button>
              ) : (
                <Button variant="ghost" onClick={() => navigate(-1)} size="sm">
                  Hủy bỏ
                </Button>
              )}

              {currentStep < 4 ? (
                <Button onClick={handleNext} className="btn-primary" size="sm">
                  Tiếp theo
                </Button>
              ) : (
                <Button onClick={handleSubmit} loading={submitting} className="btn-primary" size="sm">
                  <Send className="w-4 h-4 mr-1.5" /> Gửi báo cáo
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
