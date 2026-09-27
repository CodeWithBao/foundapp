import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, Image as ImageIcon, MapPin, FileText, CheckSquare, Send } from 'lucide-react';
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

export default function ReportLostPage() {
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
      if (!form.date) e.date = 'Vui lòng chọn ngày mất';
      if (!form.location) e.location = 'Vui lòng chọn địa điểm mất';
    }
    if (step === 2) {
      if (!form.feature.trim()) e.feature = 'Vui lòng nhập đặc điểm nhận dạng';
    }
    if (step === 4) {
      if (!form.confirmTruth) e.confirmTruth = 'Vui lòng đánh dấu cam kết thông tin chính xác';
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
        color: form.color.trim(),
        brand: form.brand.trim(),
        feature: form.feature.trim(),
        description: form.description.trim(),
        images: form.imageUrl ? [form.imageUrl] : [],
        type: 'LOST',
        status: 'LOST',
        userId: user.id,
        userName: user.name,
        clientRequestId: submitRequestId.current,
      });
      toast.success('Gửi báo cáo mất đồ thành công!');
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
    setForm(prev => ({ ...prev, [key]: val }));
    if (errors[key]) setErrors(prev => ({ ...prev, [key]: undefined }));
  };

  const categoryOptions = [
    { value: '', label: '-- Chọn danh mục vật phẩm --' },
    ...categories.map(c => ({ value: c.name, label: c.name }))
  ];
  const locationOptions = [
    { value: '', label: '-- Chọn địa điểm nghi ngờ đánh mất --' },
    ...locations.map(l => ({ value: l.name, label: l.name }))
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
        title="Khai báo thông tin vật phẩm bị mất"
        subtitle="Cung cấp chi tiết thông tin giúp hệ thống tự động đối chiếu với danh sách nhặt được."
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
              {/* Step 1: Thông tin cơ bản */}
              {currentStep === 1 && (
                <div className="space-y-6 animate-fadeIn">
                  <div className="border-b border-[#E0E2E6] pb-4">
                    <span className="label-micro text-[#AD222B]">Bước 1 / 4</span>
                    <h3 className="font-serif font-semibold text-xl text-[#1C2530] mt-0.5">Thông tin cơ bản</h3>
                    <p className="text-xs text-[#5B6574] mt-0.5">Nhập tên vật phẩm, thời gian và địa điểm bị mất</p>
                  </div>

                  <Input
                    label="Tên vật phẩm *"
                    placeholder="Ví dụ: Ví da nam màu đen, Thẻ sinh viên DNTU..."
                    value={form.title}
                    onChange={e => update('title', e.target.value)}
                    error={errors.title}
                  />

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <Select
                      label="Danh mục vật phẩm *"
                      options={categoryOptions}
                      value={form.category}
                      onChange={e => update('category', e.target.value)}
                      error={errors.category}
                    />
                    <Input
                      label="Ngày mất *"
                      type="date"
                      value={form.date}
                      onChange={e => update('date', e.target.value)}
                      error={errors.date}
                      max={new Date().toISOString().split('T')[0]}
                    />
                  </div>

                  <Select
                    label="Địa điểm đánh mất (nghi ngờ) *"
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
                    <p className="text-xs text-[#5B6574] mt-0.5">Các đặc điểm giúp phân biệt chính xác vật phẩm của bạn</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <Input
                      label="Màu sắc"
                      placeholder="VD: Đen, Đỏ đô, Bạc..."
                      value={form.color}
                      onChange={e => update('color', e.target.value)}
                    />
                    <Input
                      label="Thương hiệu / Nhãn hiệu"
                      placeholder="VD: Casio, Apple, Samsung, Nike..."
                      value={form.brand}
                      onChange={e => update('brand', e.target.value)}
                    />
                  </div>

                  <Input
                    label="Đặc điểm nhận dạng nổi bật *"
                    placeholder="VD: Có vết xước ở góc trái, móc khóa gấu bông màu đỏ, tem tên..."
                    value={form.feature}
                    onChange={e => update('feature', e.target.value)}
                    error={errors.feature}
                  />

                  <Textarea
                    label="Mô tả hoàn cảnh mất (Tùy chọn)"
                    placeholder="Nhập thêm hoàn cảnh hoặc chi tiết thông tin nếu có..."
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
                    <h3 className="font-serif font-semibold text-xl text-[#1C2530] mt-0.5">Hình ảnh minh họa</h3>
                    <p className="text-xs text-[#5B6574] mt-0.5">Tải ảnh mẫu hoặc ảnh cũ của món đồ để tăng tỉ lệ nhận diện</p>
                  </div>

                  <ImageUploadCamera
                    value={form.imageUrl}
                    onChange={(val) => update('imageUrl', val)}
                    label="Hình ảnh vật phẩm"
                  />
                </div>
              )}

              {/* Step 4: Xác nhận & Gửi */}
              {currentStep === 4 && (
                <div className="space-y-6 animate-fadeIn">
                  <div className="border-b border-[#E0E2E6] pb-4">
                    <span className="label-micro text-[#AD222B]">Bước 4 / 4</span>
                    <h3 className="font-serif font-semibold text-xl text-[#1C2530] mt-0.5">Xác nhận & Gửi báo cáo</h3>
                    <p className="text-xs text-[#5B6574] mt-0.5">Kiểm tra lại toàn bộ thông tin trước khi gửi lên hệ thống</p>
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
                        <dt className="label-micro text-[#8C95A3]">Ngày mất</dt>
                        <dd className="font-mono text-xs font-semibold text-[#1C2530] mt-0.5">{form.date}</dd>
                      </div>
                      <div>
                        <dt className="label-micro text-[#8C95A3]">Địa điểm mất</dt>
                        <dd className="font-semibold text-[#1C2530] mt-0.5">{form.location}</dd>
                      </div>
                      {form.color && (
                        <div>
                          <dt className="label-micro text-[#8C95A3]">Màu sắc</dt>
                          <dd className="font-semibold text-[#1C2530] mt-0.5">{form.color}</dd>
                        </div>
                      )}
                      {form.brand && (
                        <div>
                          <dt className="label-micro text-[#8C95A3]">Thương hiệu</dt>
                          <dd className="font-semibold text-[#1C2530] mt-0.5">{form.brand}</dd>
                        </div>
                      )}
                      <div className="sm:col-span-2 border-t border-[#E0E2E6] pt-3">
                        <dt className="label-micro text-[#8C95A3]">Đặc điểm nhận dạng</dt>
                        <dd className="font-medium text-[#1C2530] mt-0.5">{form.feature}</dd>
                      </div>
                      {form.description && (
                        <div className="sm:col-span-2">
                          <dt className="label-micro text-[#8C95A3]">Mô tả hoàn cảnh</dt>
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
                      <span className="text-[#5B6574]">Mọi hành vi khai báo gian dối sẽ bị xử lý theo quy định của Nhà trường DNTU.</span>
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
