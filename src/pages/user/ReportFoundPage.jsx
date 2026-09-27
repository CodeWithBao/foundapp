import { useRef, useState } from 'react';
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
  const submittingRef = useRef(false);
  const submitRequestId = useRef(null);

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
    // Chặn double-click trước khi bắt đầu request; request id giúp backend
    // nhận diện cùng một lần gửi nếu client retry hoặc có nhiều tab/request.
    if (submittingRef.current) return;
    if (!validateStep(4)) return;
    submitRequestId.current ||= crypto.randomUUID();
    submittingRef.current = true;
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
        clientRequestId: submitRequestId.current,
      });
      toast.success('Gửi báo cáo nhặt được đồ thành công!');
      navigate('/my-posts');
    } catch (err) {
      submittingRef.current = false;
      submitRequestId.current = null;
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
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-10">
      <button
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-2 text-xs font-mono font-medium text-[#5B6574] hover:text-[#AD222B] mb-5 transition-colors group"
      >
        <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" /> Quay lại trang trước
      </button>

      <PageHeader
        title="Khai báo vật phẩm nhặt được"
        subtitle="Vui lòng cung cấp chi tiết thông tin giúp chủ nhân sớm tìm lại tài sản."
      />

      <div className="flex flex-col lg:flex-row gap-8 mt-8">
        {/* Left: Progress Steps */}
        <div className="w-full lg:w-72 shrink-0">
          <div className="surface p-6 sticky top-24 space-y-5">
            <div>
              <span className="label-micro text-[#AD222B]">Quy trình 4 bước</span>
              <h3 className="font-serif font-semibold text-lg text-[#1C2530] mt-0.5">
                Tiến trình báo cáo
              </h3>
            </div>

            <div className="space-y-4 pt-2">
              {STEPS.map((step, idx) => {
                const Icon = step.icon;
                const isActive = currentStep === step.id;
                const isCompleted = currentStep > step.id;
                return (
                  <div key={step.id} className="relative flex items-start gap-3.5">
                    <div className="flex flex-col items-center">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 text-xs font-mono font-bold transition-all duration-200 ${
                          isActive
                            ? 'bg-[#AD222B] text-white ring-4 ring-[#AD222B]/15 shadow-sm'
                            : isCompleted
                            ? 'bg-[#1C2530] text-[#FAF8F2]'
                            : 'bg-[#F2EFE9] text-[#8C95A3] border border-[#E0E2E6]'
                        }`}
                      >
                        {isCompleted ? <CheckCircle2 className="w-4 h-4 text-[#E4C87F]" /> : <Icon className="w-4 h-4" />}
                      </div>
                      {idx !== STEPS.length - 1 && (
                        <div
                          className={`w-0.5 h-7 my-1 transition-colors ${
                            isCompleted ? 'bg-[#1C2530]' : 'bg-[#E0E2E6]'
                          }`}
                        />
                      )}
                    </div>
                    <div className="pt-0.5">
                      <p className={`text-[11px] font-mono uppercase tracking-wider ${isActive ? 'text-[#AD222B] font-bold' : 'text-[#8C95A3]'}`}>
                        Bước {step.id}
                      </p>
                      <p className={`text-sm font-medium ${isActive ? 'text-[#1C2530] font-semibold' : isCompleted ? 'text-[#1C2530]' : 'text-[#8C95A3]'}`}>
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
          <div className="surface overflow-hidden">
            <div className="p-6 sm:p-8">
              {/* Step 1: Thông tin cơ bản + Lựa chọn giữ/giao */}
              {currentStep === 1 && (
                <div className="space-y-6 animate-fadeIn">
                  <div className="border-b border-[#E0E2E6] pb-4">
                    <span className="label-micro text-[#AD222B]">Bước 1 / 4</span>
                    <h3 className="font-serif font-semibold text-xl text-[#1C2530] mt-0.5">Thông tin cơ bản</h3>
                    <p className="text-xs text-[#5B6574] mt-0.5">Thông tin tên đồ vật, thời gian nhặt và vị trí lưu giữ hiện tại</p>
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
                    <label className="label-micro text-[#5B6574]">
                      Tình trạng bảo quản hiện tại *
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div
                        onClick={() => update('holdingStatus', 'self')}
                        className={`border rounded-xl p-4 cursor-pointer flex items-start gap-3 transition-all ${
                          form.holdingStatus === 'self'
                            ? 'border-[#AD222B] bg-red-50/50 text-[#1C2530] ring-2 ring-[#AD222B]/20 shadow-sm'
                            : 'border-[#E0E2E6] bg-[#FAF8F2]/50 hover:bg-[#FAF8F2]'
                        }`}
                      >
                        <UserCheck className={`w-5 h-5 mt-0.5 shrink-0 ${form.holdingStatus === 'self' ? 'text-[#AD222B]' : 'text-[#8C95A3]'}`} />
                        <div>
                          <p className="text-sm font-semibold text-[#1C2530]">Tôi đang giữ vật phẩm</p>
                          <p className="text-xs text-[#5B6574] mt-0.5">Sẽ bảo quản và tự liên hệ giao trả cho chủ nhân</p>
                        </div>
                      </div>

                      <div
                        onClick={() => update('holdingStatus', 'handed_over')}
                        className={`border rounded-xl p-4 cursor-pointer flex items-start gap-3 transition-all ${
                          form.holdingStatus === 'handed_over'
                            ? 'border-[#AD222B] bg-red-50/50 text-[#1C2530] ring-2 ring-[#AD222B]/20 shadow-sm'
                            : 'border-[#E0E2E6] bg-[#FAF8F2]/50 hover:bg-[#FAF8F2]'
                        }`}
                      >
                        <ShieldCheck className={`w-5 h-5 mt-0.5 shrink-0 ${form.holdingStatus === 'handed_over' ? 'text-[#AD222B]' : 'text-[#8C95A3]'}`} />
                        <div>
                          <p className="text-sm font-semibold text-[#1C2530]">Tôi đã giao cho Phòng ban / Bảo vệ</p>
                          <p className="text-xs text-[#5B6574] mt-0.5">Đã bàn giao tại phòng chức năng hoặc bảo vệ trường</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {form.holdingStatus === 'handed_over' && (
                    <div className="p-4 bg-[#FAF8F2] rounded-xl border border-[#E0E2E6] space-y-3">
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
                <div className="space-y-6 animate-fadeIn">
                  <div className="border-b border-[#E0E2E6] pb-4">
                    <span className="label-micro text-[#AD222B]">Bước 2 / 4</span>
                    <h3 className="font-serif font-semibold text-xl text-[#1C2530] mt-0.5">Mô tả chi tiết</h3>
                    <p className="text-xs text-[#5B6574] mt-0.5">Màu sắc, thương hiệu và các điểm nổi bật của món đồ</p>
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
                <div className="space-y-6 animate-fadeIn">
                  <div className="border-b border-[#E0E2E6] pb-4">
                    <span className="label-micro text-[#AD222B]">Bước 3 / 4</span>
                    <h3 className="font-serif font-semibold text-xl text-[#1C2530] mt-0.5">Hình ảnh vật phẩm</h3>
                    <p className="text-xs text-[#5B6574] mt-0.5">Chụp ảnh thực tế từ camera hoặc tải tệp ảnh để đăng bài</p>
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
                <div className="space-y-6 animate-fadeIn">
                  <div className="border-b border-[#E0E2E6] pb-4">
                    <span className="label-micro text-[#AD222B]">Bước 4 / 4</span>
                    <h3 className="font-serif font-semibold text-xl text-[#1C2530] mt-0.5">Xác nhận & Gửi thông tin</h3>
                    <p className="text-xs text-[#5B6574] mt-0.5">Rà soát thông tin khai báo trước khi đăng tải</p>
                  </div>

                  <div className="bg-[#FAF8F2] rounded-xl p-5 border border-[#E0E2E6] text-sm">
                    <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
                      <div>
                        <dt className="label-micro text-[#8C95A3]">Tên vật phẩm</dt>
                        <dd className="font-semibold text-[#1C2530] mt-0.5">{form.title}</dd>
                      </div>
                      <div>
                        <dt className="label-micro text-[#8C95A3]">Danh mục</dt>
                        <dd className="font-semibold text-[#1C2530] mt-0.5">{form.category}</dd>
                      </div>
                      <div>
                        <dt className="label-micro text-[#8C95A3]">Ngày nhặt được</dt>
                        <dd className="font-mono text-xs font-semibold text-[#1C2530] mt-0.5">{form.date}</dd>
                      </div>
                      <div>
                        <dt className="label-micro text-[#8C95A3]">Địa điểm nhặt</dt>
                        <dd className="font-semibold text-[#1C2530] mt-0.5">{form.location}</dd>
                      </div>
                      <div>
                        <dt className="label-micro text-[#8C95A3]">Tình trạng giữ đồ</dt>
                        <dd className="font-semibold text-[#AD222B] mt-0.5">
                          {form.holdingStatus === 'self' ? 'Tự bảo quản' : form.storageLocation}
                        </dd>
                      </div>
                      <div>
                        <dt className="label-micro text-[#8C95A3]">Đặc điểm nhận dạng</dt>
                        <dd className="font-semibold text-[#1C2530] mt-0.5">{form.feature}</dd>
                      </div>
                      {form.description && (
                        <div className="sm:col-span-2 border-t border-[#E0E2E6] pt-3">
                          <dt className="label-micro text-[#8C95A3]">Mô tả thêm</dt>
                          <dd className="text-[#5B6574] mt-0.5">{form.description}</dd>
                        </div>
                      )}
                    </dl>
                  </div>

                  <label className="flex items-start gap-3 p-4 border border-[#E0E2E6] rounded-xl bg-[#FAF8F2]/60 cursor-pointer hover:bg-[#FAF8F2] transition-colors">
                    <input
                      type="checkbox"
                      className="mt-1 w-4 h-4 text-[#AD222B] rounded border-[#E0E2E6] focus:ring-[#AD222B]"
                      checked={form.confirmTruth}
                      onChange={e => update('confirmTruth', e.target.checked)}
                    />
                    <div className="flex-1 text-xs">
                      <span className="font-semibold text-[#1C2530] block text-sm">Tôi cam kết thông tin đã khai báo là hoàn toàn trung thực</span>
                      <span className="text-[#5B6574]">Tôi có nghĩa vụ bảo quản hoặc bàn giao theo đúng nơi đã báo.</span>
                    </div>
                  </label>
                  {errors.confirmTruth && <p className="text-xs text-red-600 font-medium">{errors.confirmTruth}</p>}
                </div>
              )}
            </div>

            {/* Navigation buttons */}
            <div className="px-6 sm:px-8 py-4 bg-[#F2EFE9] border-t border-[#E0E2E6] flex justify-between items-center">
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
