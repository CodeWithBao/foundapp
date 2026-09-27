import { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  FileText, ShieldCheck, SearchCheck, CheckCircle2, 
  ChevronDown, AlertTriangle, Eye, HelpCircle, ArrowRight
} from 'lucide-react';

export default function GuidePage() {
  const [openFaq, setOpenFaq] = useState(null);

  const steps = [
    {
      num: '01',
      title: 'Bước 1: Trình báo thông tin',
      subtitle: 'Tạo bài đăng chi tiết trên hệ thống UniFind DNTU',
      desc: 'Điền đầy đủ các thông tin chi tiết như tên vật phẩm, danh mục, thời gian, vị trí thất lạc/nhặt được kèm theo hình ảnh minh họa để cộng đồng dễ dàng nhận diện.',
      icon: FileText,
      color: 'bg-accent-tint text-accent ring-1 ring-accent-border',
      badge: 'bg-accent text-white',
    },
    {
      num: '02',
      title: 'Bước 2: Cung cấp bằng chứng sở hữu',
      subtitle: 'Xác thực quyền sở hữu với dữ liệu ẩn',
      desc: 'Người nhận đồ gửi yêu cầu kèm theo lý do, bằng chứng hoặc các đặc điểm nhận dạng ẩn (mật mã, giấy tờ bên trong, vết trầy xước đặc trưng) chỉ có chủ sở hữu mới biết.',
      icon: ShieldCheck,
      color: 'bg-gold-tint text-gold-hover ring-1 ring-gold-border',
      badge: 'bg-gold text-white',
    },
    {
      num: '03',
      title: 'Bước 3: Đối chiếu & Phê duyệt',
      subtitle: 'Cán bộ nhà trường tiến hành duyệt thông tin',
      desc: 'Hệ thống tự động gợi ý trùng khớp và Cán bộ quản lý DNTU đối chiếu cẩn thận bằng chứng nhằm đảm bảo trao trả đúng chủ nhân hợp pháp.',
      icon: SearchCheck,
      color: 'bg-blue-50 text-blue-700 ring-1 ring-blue-200',
      badge: 'bg-blue-700 text-white',
    },
    {
      num: '04',
      title: 'Bước 4: Nhận lại & Ký biên bản',
      subtitle: 'Bàn giao trực tiếp và hoàn tất thủ tục',
      desc: 'Đến văn phòng nhà trường hoặc điểm hẹn bàn giao để kiểm tra tài sản, ký xác nhận biên bản trao trả và nhận lại đồ vật an toàn.',
      icon: CheckCircle2,
      color: 'bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200',
      badge: 'bg-emerald-700 text-white',
    },
  ];

  const faqs = [
    {
      q: 'Tôi bị mất thẻ sinh viên hoặc giấy tờ cá nhân thì làm thế nào?',
      a: 'Bạn nên sử dụng tính năng "Báo mất đồ" và chọn danh mục "Thẻ & Giấy tờ". Hãy nhập chính xác Họ tên và Mã số sinh viên (MSSV) để hệ thống tự động đối chiếu khi có người nhặt được báo về.'
    },
    {
      q: 'Quy trình bàn giao đồ nhặt được diễn ra như thế nào?',
      a: 'Khi bạn nhặt được vật phẩm, hãy "Báo nhặt được" trên hệ thống hoặc mang gửi trực tiếp tới Văn phòng Quản lý Sinh viên / Phòng Bảo vệ DNTU. Cán bộ nhà trường sẽ niêm phong và cập nhật trạng thái lưu giữ.'
    },
    {
      q: 'Làm sao để đảm bảo đồ của tôi không bị người khác nhận nhầm?',
      a: 'Hệ thống yêu cầu bằng chứng xác minh đặc biệt (ví dụ: mật khẩu mở khóa thiết bị, số sê-ri, chi tiết ẩn bên trong ví/túi). Cán bộ DNTU sẽ chỉ phê duyệt trao trả khi thông tin đối chiếu trùng khớp 100%.'
    },
    {
      q: 'Sử dụng hệ thống UniFind DNTU có tốn phí không?',
      a: 'Hoàn toàn miễn phí. Đây là nền tảng phi lợi nhuận dành riêng cho cán bộ, giảng viên và sinh viên Trường Đại học Công nghệ Đồng Nai nhằm xây dựng văn hóa học đường trung thực và văn minh.'
    }
  ];

  const toggleFaq = (idx) => {
    setOpenFaq(openFaq === idx ? null : idx);
  };

  return (
    <div className="bg-[#FAF8F2] min-h-screen py-12 pb-24">
      <div className="page-container max-w-5xl space-y-12">
        
        {/* Header Section */}
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <span className="label-micro text-accent font-bold">TRUNG TÂM HỖ TRỢ & HƯỚNG DẪN DNTU</span>
          <h1 className="page-title text-3xl sm:text-4xl">
            Quy trình & Hướng dẫn sử dụng
          </h1>
          <p className="section-copy text-sm sm:text-base">
            Các bước đơn giản để tìm lại tài sản hoặc trao trả đồ vật thất lạc an toàn, nhanh chóng và bảo mật trong cộng đồng DNTU.
          </p>
        </div>

        {/* 4 Process Step Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
          {steps.map((step) => {
            const IconComponent = step.icon;
            return (
              <div 
                key={step.num}
                className="surface p-6 sm:p-7 hover:-translate-y-1 hover:border-accent-border hover:shadow-card-hover transition-all flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${step.color}`}>
                      <IconComponent className="w-6 h-6" />
                    </div>
                    <span className={`px-3 py-1 rounded-full font-mono font-bold text-xs ${step.badge}`}>
                      {step.num}
                    </span>
                  </div>

                  <h3 className="font-serif font-bold text-lg sm:text-xl text-ink mb-1 group-hover:text-accent transition-colors">
                    {step.title}
                  </h3>
                  <p className="label-micro text-ink-muted mb-3 font-semibold normal-case text-xs">
                    {step.subtitle}
                  </p>
                  <p className="text-ink-slate text-sm leading-relaxed">
                    {step.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Regulations & Contact info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="surface p-6 sm:p-7 space-y-4">
            <div className="flex items-center gap-2 text-accent font-serif font-bold text-lg border-b border-hairline/80 pb-3">
              <ShieldCheck className="w-5 h-5 text-accent" />
              Quy định nhận lại đồ thất lạc
            </div>
            <ul className="space-y-3 text-xs sm:text-sm text-ink-slate leading-relaxed">
              <li className="flex items-start gap-2.5">
                <span className="text-accent font-bold mt-0.5">•</span>
                Xuất trình Thẻ sinh viên DNTU / Thẻ cán bộ hoặc CCCD khi đến làm thủ tục nhận đồ.
              </li>
              <li className="flex items-start gap-2.5">
                <span className="text-accent font-bold mt-0.5">•</span>
                Cung cấp chính xác các đặc điểm riêng biệt của tài sản (mã PIN, serial number, chi tiết đồ vật).
              </li>
              <li className="flex items-start gap-2.5">
                <span className="text-accent font-bold mt-0.5">•</span>
                Ký biên bản bàn giao lưu giữ tại văn phòng nhà trường để hoàn tất hồ sơ.
              </li>
              <li className="flex items-start gap-2.5">
                <span className="text-accent font-bold mt-0.5">•</span>
                Tài sản không có người nhận sau thời hạn quy chế sẽ được xử lý theo quy định của nhà trường.
              </li>
            </ul>
          </div>

          <div className="surface p-6 sm:p-7 space-y-4">
            <div className="flex items-center gap-2 text-gold-hover font-serif font-bold text-lg border-b border-hairline/80 pb-3">
              <HelpCircle className="w-5 h-5 text-gold-hover" />
              Thông tin hỗ trợ DNTU UniFind
            </div>
            <div className="space-y-3 text-xs sm:text-sm text-ink-slate leading-relaxed">
              <p>📍 <strong>Văn phòng tiếp nhận:</strong> Phòng Công tác Sinh viên / Ban Quản lý Tòa nhà DNTU.</p>
              <p>☎️ <strong>Hotline hỗ trợ:</strong> (0251) 3996 579 - Hotline 24/7: 0251 3 999 888</p>
              <p>✉️ <strong>Email chính thức:</strong> unifind@dntu.edu.vn</p>
              <p>🕒 <strong>Giờ làm việc trực tiếp:</strong> Thứ Hai – Thứ Bảy (07:30 – 17:00)</p>
            </div>
          </div>
        </div>

        {/* FAQ Accordion Section */}
        <div className="surface p-6 sm:p-8 space-y-6">
          <div className="flex items-center gap-3 border-b border-hairline/80 pb-4">
            <HelpCircle className="w-6 h-6 text-accent" />
            <div>
              <span className="label-micro text-accent font-bold">GIẢI ĐÁP THẮC MẮC</span>
              <h2 className="section-title text-xl sm:text-2xl mt-0.5">
                Câu hỏi thường gặp (FAQ)
              </h2>
            </div>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, idx) => (
              <div
                key={idx}
                className="border border-hairline rounded-xl overflow-hidden transition-colors"
              >
                <button
                  type="button"
                  onClick={() => toggleFaq(idx)}
                  className="w-full text-left p-4 bg-paper-soft hover:bg-paper-panel font-semibold text-ink text-sm sm:text-base flex items-center justify-between gap-4 transition-colors"
                >
                  <span>{faq.q}</span>
                  <ChevronDown className={`w-5 h-5 text-ink-muted shrink-0 transition-transform duration-200 ${openFaq === idx ? 'rotate-180 text-accent' : ''}`} />
                </button>
                {openFaq === idx && (
                  <div className="p-4 bg-white text-sm text-ink-slate border-t border-hairline leading-relaxed">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Call to Action Banner */}
        <div className="bg-gradient-to-r from-[#741216] to-[#AD222B] rounded-2xl p-8 text-white shadow-landing-lg flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
          <div className="space-y-2">
            <h3 className="text-2xl font-serif font-bold text-white">Bạn đang cần tìm hoặc vừa nhặt được đồ?</h3>
            <p className="text-white/85 text-sm max-w-xl">
              Tạo bài đăng ngay trên hệ thống để nhận được sự hỗ trợ nhanh nhất từ cộng đồng DNTU.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 shrink-0">
            <Link 
              to="/report-lost" 
              className="px-6 py-3 bg-white text-accent hover:bg-paper-soft font-bold rounded-xl text-sm transition-all shadow-sm flex items-center justify-center gap-2"
            >
              <AlertTriangle className="w-4 h-4 text-accent" /> Báo mất đồ
            </Link>
            <Link 
              to="/report-found" 
              className="px-6 py-3 bg-gold hover:bg-gold-hover text-white font-bold rounded-xl text-sm transition-all shadow-sm flex items-center justify-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4 text-white" /> Báo nhặt được
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}
