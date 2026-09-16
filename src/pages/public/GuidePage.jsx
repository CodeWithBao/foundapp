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
      num: 1,
      title: 'Bước 1: Đăng bài',
      subtitle: 'Đăng thông tin vật phẩm bị mất hoặc nhặt được trên hệ thống.',
      desc: 'Điền đầy đủ các thông tin chi tiết như tiêu đề, danh mục, địa điểm, thời gian và hình ảnh minh họa để cộng đồng dễ dàng nhận biết.',
      icon: FileText,
      color: 'bg-burgundy-50 text-burgundy-700 border-burgundy-200',
      badge: 'bg-burgundy-600 text-white',
    },
    {
      num: 2,
      title: 'Bước 2: Cung cấp thông tin',
      subtitle: 'Xác minh quyền sở hữu thông qua bằng chứng cụ thể.',
      desc: 'Người nhận đồ gửi yêu cầu kèm theo lý do, bằng chứng hoặc các đặc điểm nhận dạng ẩn chỉ có chủ sở hữu mới biết.',
      icon: ShieldCheck,
      color: 'bg-amber-50 text-amber-700 border-amber-200',
      badge: 'bg-amber-600 text-white',
    },
    {
      num: 3,
      title: 'Bước 3: Đối chiếu & Chờ xác minh',
      subtitle: 'Cán bộ nhà trường / Ban quản trị tiến hành duyệt thông tin.',
      desc: 'Hệ thống tự động gợi ý trùng khớp và Cán bộ quản lý DNTU đối chiếu bằng chứng nhằm đảm bảo trao trả đúng chủ nhân.',
      icon: SearchCheck,
      color: 'bg-purple-50 text-purple-700 border-purple-200',
      badge: 'bg-purple-600 text-white',
    },
    {
      num: 4,
      title: 'Bước 4: Nhận lại đồ',
      subtitle: 'Bàn giao trực tiếp và hoàn tất thủ tục.',
      desc: 'Đến văn phòng nhà trường hoặc điểm hẹn bàn giao để kiểm tra tài sản, ký xác nhận biên bản và nhận lại đồ an toàn.',
      icon: CheckCircle2,
      color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      badge: 'bg-emerald-600 text-white',
    },
  ];

  const faqs = [
    {
      q: 'Tôi bị mất thẻ sinh viên hoặc giấy tờ cá nhân thì làm thế nào?',
      a: 'Bạn nên sử dụng tính năng "Báo mất đồ" và chọn danh mục "Thẻ & Giấy tờ". Hãy nhập chính xác Họ tên và MSSV để hệ thống tự động đối chiếu khi có người nhặt được báo về.'
    },
    {
      q: 'Quy trình bàn giao đồ nhặt được diễn ra như thế nào?',
      a: 'Khi bạn nhặt được vật phẩm, hãy "Báo nhặt được" hoặc gửi trực tiếp tới Văn phòng Ban Quản lý / Phòng Công tác Sinh viên DNTU. Cán bộ nhà trường sẽ niêm phong và cập nhật trạng thái lưu giữ.'
    },
    {
      q: 'Làm sao để đảm bảo đồ của tôi không bị người khác nhận nhầm?',
      a: 'Hệ thống yêu cầu bằng chứng xác minh đặc biệt (ví dụ: mật khẩu mở khóa, số sê-ri, chi tiết ẩn bên trong ví/túi). Cán bộ DNTU sẽ chỉ phê duyệt trao trả khi thông tin đối chiếu chính xác 100%.'
    },
    {
      q: 'Sử dụng hệ thống UniFind DNTU có tốn phí không?',
      a: 'Hoàn toàn miễn phí. Đây là nền tảng phi lợi nhuận dành riêng cho cán bộ, giảng viên và sinh viên Trường Đại học Công nghệ Đồng Nai nhằm hỗ trợ cộng đồng.'
    }
  ];

  const toggleFaq = (idx) => {
    setOpenFaq(openFaq === idx ? null : idx);
  };

  return (
    <div className="bg-cream-50 min-h-screen py-12 pb-20">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 space-y-12">
        
        {/* Header */}
        <div className="text-center space-y-4 max-w-3xl mx-auto">
          <span className="inline-block px-3.5 py-1.5 rounded-full bg-burgundy-50 border border-burgundy-100 text-burgundy-700 text-xs font-semibold tracking-wide uppercase">
            Trung tâm hỗ trợ UniFind DNTU
          </span>
          <h1 className="text-3xl md:text-4xl font-serif font-bold text-gray-900">
            Hướng dẫn sử dụng UniFind DNTU
          </h1>
          <p className="text-warm-gray-600 text-base md:text-lg">
            Các bước đơn giản để tìm lại hoặc trả lại vật phẩm thất lạc nhanh chóng, an toàn và minh bạch.
          </p>
        </div>

        {/* 4 Process Step Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
          {steps.map((step) => {
            const IconComponent = step.icon;
            return (
              <div 
                key={step.num}
                className="bg-white rounded-2xl border border-warm-gray-200 p-6 shadow-sm hover:shadow-md transition-all relative overflow-hidden flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center border ${step.color}`}>
                      <IconComponent className="w-6 h-6" />
                    </div>
                    <span className={`w-8 h-8 rounded-full font-serif font-bold text-sm flex items-center justify-center ${step.badge}`}>
                      0{step.num}
                    </span>
                  </div>

                  <h3 className="text-xl font-serif font-bold text-gray-900 mb-1 group-hover:text-burgundy-700 transition-colors">
                    {step.title}
                  </h3>
                  <p className="text-xs font-medium text-warm-gray-500 mb-3">
                    {step.subtitle}
                  </p>
                  <p className="text-sm text-warm-gray-600 leading-relaxed">
                    {step.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Quy định & Hỗ trợ Lost & Found */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl border border-warm-gray-200 p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-2 text-burgundy-700 font-serif font-bold text-lg border-b border-warm-gray-100 pb-3">
              <ShieldCheck className="w-5 h-5 text-burgundy-600" />
              Quy định nhận lại đồ thất lạc
            </div>
            <ul className="space-y-2.5 text-xs md:text-sm text-warm-gray-600 leading-relaxed">
              <li className="flex items-start gap-2">
                <span className="text-burgundy-600 font-bold">•</span>
                Xuất trình Thẻ sinh viên / Thẻ cán bộ hoặc CCCD/CMND khi nhận đồ.
              </li>
              <li className="flex items-start gap-2">
                <span className="text-burgundy-600 font-bold">•</span>
                Mô tả chính xác các đặc điểm riêng biệt (mã mở khóa, số seri, chi tiết bên trong).
              </li>
              <li className="flex items-start gap-2">
                <span className="text-burgundy-600 font-bold">•</span>
                Ký biên bản bàn giao lưu giữ tại văn phòng nhà trường.
              </li>
              <li className="flex items-start gap-2">
                <span className="text-burgundy-600 font-bold">•</span>
                Đồ vật không có người nhận sau thời hạn quy định sẽ được xử lý theo quy chế của trường.
              </li>
            </ul>
          </div>

          <div className="bg-white rounded-2xl border border-warm-gray-200 p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-2 text-burgundy-700 font-serif font-bold text-lg border-b border-warm-gray-100 pb-3">
              <HelpCircle className="w-5 h-5 text-burgundy-600" />
              Thông tin liên hệ Lost & Found DNTU
            </div>
            <div className="space-y-2.5 text-xs md:text-sm text-warm-gray-600 leading-relaxed">
              <p>📍 <strong>Địa chỉ:</strong> Văn phòng Công tác Sinh viên / Phòng Bảo vệ DNTU, Cơ sở Trảng Bom, Đồng Nai.</p>
              <p>☎️ <strong>Hotline hỗ trợ:</strong> (0251) 3996 999 - Ext: 102</p>
              <p>✉️ <strong>Email:</strong> lostandfound@dntu.edu.vn</p>
              <p>🕒 <strong>Giờ làm việc:</strong> Thứ Hai – Thứ Bảy (07:30 – 17:00)</p>
            </div>
          </div>
        </div>

        {/* FAQ Accordion Section */}
        <div className="bg-white rounded-2xl border border-warm-gray-200 p-6 md:p-8 shadow-sm space-y-6">
          <div className="flex items-center gap-3 border-b border-warm-gray-100 pb-4">
            <HelpCircle className="w-6 h-6 text-burgundy-600" />
            <h2 className="text-xl md:text-2xl font-serif font-bold text-gray-900">
              Câu hỏi thường gặp (FAQ)
            </h2>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, idx) => (
              <div
                key={idx}
                className="border border-warm-gray-200 rounded-xl overflow-hidden transition-colors"
              >
                <button
                  type="button"
                  onClick={() => toggleFaq(idx)}
                  className="w-full text-left p-4 bg-warm-gray-50/50 hover:bg-warm-gray-100/60 font-medium text-gray-900 text-sm md:text-base flex items-center justify-between gap-4 transition-colors"
                >
                  <span>{faq.q}</span>
                  <ChevronDown className={`w-5 h-5 text-warm-gray-400 shrink-0 transition-transform duration-200 ${openFaq === idx ? 'rotate-180 text-burgundy-600' : ''}`} />
                </button>
                {openFaq === idx && (
                  <div className="p-4 bg-white text-sm text-warm-gray-600 border-t border-warm-gray-200 leading-relaxed">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Slogan Banner */}
        <div className="text-center py-4 px-6 bg-burgundy-50 border border-burgundy-100 rounded-2xl">
          <p className="text-burgundy-800 font-serif italic text-base md:text-lg">
            “Cùng nhau xây dựng một môi trường học đường an toàn, văn minh và nhân ái.”
          </p>
        </div>

        {/* Call to Action Bar */}
        <div className="bg-gradient-to-r from-[#6F101B] to-[#8F1725] rounded-2xl p-8 text-white shadow-lg flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
          <div className="space-y-2">
            <h3 className="text-2xl font-serif font-bold">Bạn đã sẵn sàng sử dụng UniFind DNTU?</h3>
            <p className="text-cream-100 text-sm max-w-xl">
              Đừng ngần ngại tạo bài đăng nếu bạn đang thất lạc đồ vật hoặc nhặt được đồ của người khác.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 shrink-0">
            <Link 
              to="/report-lost" 
              className="px-6 py-3 bg-white text-burgundy-800 hover:bg-cream-100 font-medium rounded-xl text-sm transition-colors flex items-center justify-center gap-2"
            >
              <AlertTriangle className="w-4 h-4 text-burgundy-600" /> Báo mất đồ
            </Link>
            <Link 
              to="/report-found" 
              className="px-6 py-3 bg-amber-500 hover:bg-amber-400 text-gray-900 font-medium rounded-xl text-sm transition-colors flex items-center justify-center gap-2"
            >
              <Eye className="w-4 h-4" /> Báo nhặt được
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}
