import { Link } from 'react-router-dom';
import {
  MapPin, Phone, Mail, Globe, ArrowUp, GraduationCap,
  Clock, ShieldCheck, Heart, Sparkles, Building2
} from 'lucide-react';
import DNTULogo from '../common/DNTULogo';

export default function Footer() {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="relative -mt-px overflow-hidden bg-gradient-to-b from-[#4A0D10] via-[#37070A] to-[#200305] text-white pt-14 pb-8 border-t border-[#8F1822]/80 font-sans">
      {/* Background Watermark from DNTU Asset Kit */}
      <div
        className="pointer-events-none absolute right-0 bottom-0 top-0 w-full sm:w-2/3 lg:w-1/2 opacity-[0.06] bg-no-repeat bg-right-bottom mix-blend-screen"
        style={{
          backgroundImage: `url(/DNTU_Web_Asset_Kit/watermarks/dntu-campus-lineart-white.svg)`,
          backgroundSize: 'contain',
        }}
      />

      <div className="page-container relative z-10">
        {/* Top Quick Action Banner */}
        <div className="bg-white/[0.06] backdrop-blur-md rounded-2xl border border-white/10 p-5 sm:p-6 mb-12 flex flex-col md:flex-row items-center justify-between gap-5 shadow-landing-sm">
          <div className="flex items-center gap-4 text-center md:text-left">
            <div className="w-12 h-12 rounded-xl bg-amber-400/20 border border-amber-400/30 flex items-center justify-center shrink-0 text-amber-300">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-lg sm:text-xl text-white tracking-tight">
                Bạn vừa làm rơi đồ hoặc nhặt được tài sản trong trường?
              </h3>
              <p className="text-xs sm:text-sm text-white/75 mt-0.5">
                Hãy đăng thông tin ngay để cộng đồng sinh viên DNTU hỗ trợ kết nối và trao trả nhanh nhất.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 shrink-0 w-full md:w-auto">
            <Link
              to="/report-lost"
              className="flex-1 md:flex-initial text-center px-4 py-2.5 bg-white text-[#741216] hover:bg-amber-50 font-bold text-xs sm:text-sm rounded-xl transition-all shadow-sm active:scale-95"
            >
              Báo mất đồ
            </Link>
            <Link
              to="/report-found"
              className="flex-1 md:flex-initial text-center px-4 py-2.5 bg-amber-400 text-[#37070A] hover:bg-amber-300 font-bold text-xs sm:text-sm rounded-xl transition-all shadow-sm active:scale-95"
            >
              Báo nhặt được
            </Link>
          </div>
        </div>

        {/* Main Columns Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 lg:gap-10 pb-10 border-b border-white/10">
          {/* Col 1: Brand Info (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="flex items-center gap-3">
              <img
                src="/DNTU_Web_Asset_Kit/branding/dntu-symbol-white.png"
                alt="DNTU Logo"
                className="w-12 h-12 object-contain shrink-0 filter drop-shadow-sm"
              />
              <div>
                <span className="font-serif font-bold text-lg text-white tracking-tight leading-tight block">
                  UNIFIND <span className="text-amber-400 font-sans font-black">DNTU</span>
                </span>
                <span className="text-xs font-semibold uppercase tracking-wider text-amber-300/90 block">
                  Trường Đại học Công nghệ Đồng Nai
                </span>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-white/75 leading-relaxed pr-2">
              Nền tảng hỗ trợ sinh viên, giảng viên và cán bộ viên chức DNTU trong việc tìm kiếm, xác minh và trao trả tài sản thất lạc trong khuôn viên trường học.
            </p>

            <div className="space-y-2 text-xs text-white/80 pt-1">
              <div className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <span>Đường Nguyễn Khuyến, KP5, P. Trảng Dài, TP. Biên Hòa, Tỉnh Đồng Nai</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Hotline: 0251 3 999 888 • Phòng Tiếp Nhận Đồ Thất Lạc</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-amber-400 shrink-0" />
                <a href="mailto:unifind@dntu.edu.vn" className="hover:text-amber-300 transition-colors">
                  unifind@dntu.edu.vn
                </a>
              </div>
            </div>
          </div>

          {/* Col 2: Liên kết nhanh (2 cols) */}
          <div className="lg:col-span-2">
            <h4 className="font-bold text-white text-xs uppercase tracking-wider mb-4 flex items-center gap-1.5 text-amber-300">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
              Liên kết nhanh
            </h4>
            <ul className="space-y-2.5 text-xs text-white/75">
              <li>
                <Link to="/" className="hover:text-amber-300 transition-colors">Trang chủ</Link>
              </li>
              <li>
                <Link to="/search" className="hover:text-amber-300 transition-colors">Tìm kiếm vật phẩm</Link>
              </li>
              <li>
                <Link to="/report-lost" className="hover:text-amber-300 transition-colors">Đăng tin báo mất</Link>
              </li>
              <li>
                <Link to="/report-found" className="hover:text-amber-300 transition-colors">Báo nhặt được đồ</Link>
              </li>
              <li>
                <Link to="/guide" className="hover:text-amber-300 transition-colors">Hướng dẫn sử dụng</Link>
              </li>
            </ul>
          </div>

          {/* Col 3: Trung tâm tiếp nhận (3 cols) */}
          <div className="lg:col-span-3">
            <h4 className="font-bold text-white text-xs uppercase tracking-wider mb-4 flex items-center gap-1.5 text-amber-300">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
              Điểm tiếp nhận trực tiếp
            </h4>
            <div className="space-y-3 text-xs text-white/75">
              <div className="bg-white/[0.04] p-3 rounded-xl border border-white/5 space-y-1">
                <p className="font-semibold text-white">Văn phòng Đoàn TN - Hội Sinh viên</p>
                <p className="text-white/60">Tòa nhà Trung tâm DNTU • Bàn trực hỗ trợ đồ thất lạc</p>
              </div>
              <div className="flex items-center gap-2 text-white/70">
                <Clock className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Thứ 2 - Thứ 7: 07:30 - 17:00</span>
              </div>
              <div className="flex items-center gap-2 text-white/70">
                <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Quy trình xác minh bảo mật sinh viên</span>
              </div>
            </div>
          </div>

          {/* Col 4: Kết nối & Mascot (2 cols) */}
          <div className="lg:col-span-2">
            <h4 className="font-bold text-white text-xs uppercase tracking-wider mb-4 flex items-center gap-1.5 text-amber-300">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
              Kết nối với DNTU
            </h4>
            <div className="flex items-center gap-2.5 mb-4">
              <a
                href="https://facebook.com/dntu.edu.vn"
                target="_blank"
                rel="noreferrer"
                className="w-8 h-8 rounded-lg bg-white/10 hover:bg-amber-400 hover:text-[#37070A] flex items-center justify-center transition-all text-white font-bold text-xs"
                aria-label="Facebook"
              >
                f
              </a>
              <a
                href="https://youtube.com"
                target="_blank"
                rel="noreferrer"
                className="w-8 h-8 rounded-lg bg-white/10 hover:bg-amber-400 hover:text-[#37070A] flex items-center justify-center transition-all text-white font-bold text-xs"
                aria-label="YouTube"
              >
                ▶
              </a>
              <a
                href="https://tiktok.com"
                target="_blank"
                rel="noreferrer"
                className="w-8 h-8 rounded-lg bg-white/10 hover:bg-amber-400 hover:text-[#37070A] flex items-center justify-center transition-all text-white font-bold text-xs"
                aria-label="TikTok"
              >
                ♪
              </a>
              <a
                href="https://dntu.edu.vn"
                target="_blank"
                rel="noreferrer"
                className="w-8 h-8 rounded-lg bg-white/10 hover:bg-amber-400 hover:text-[#37070A] flex items-center justify-center transition-all text-white"
                aria-label="Website DNTU"
              >
                <Globe className="w-4 h-4" />
              </a>
            </div>

            {/* Mascot & Motto */}
            <div className="flex items-center gap-3 bg-white/[0.04] p-2.5 rounded-xl border border-white/5">
              <img
                src="/mascot/found.png"
                alt="UniFind Mascot"
                className="w-10 h-10 object-contain shrink-0"
                onError={(e) => { e.currentTarget.style.display = 'none'; }}
              />
              <p className="font-serif italic text-[11px] text-amber-200/90 leading-tight">
                “Tri thức – Sáng tạo – Hội nhập”
              </p>
            </div>
          </div>
        </div>

        {/* EDUCATIONAL DISCLAIMER BOX (Sản phẩm học tập phi thương mại) */}
        <div className="my-8 bg-white/[0.04] hover:bg-white/[0.06] transition-colors rounded-2xl border border-amber-400/20 p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center gap-3.5 sm:gap-4.5">
          <div className="w-10 h-10 rounded-xl bg-amber-400/15 border border-amber-400/30 flex items-center justify-center shrink-0 text-amber-300">
            <GraduationCap className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-md border border-amber-400/20">
                Thông báo bản quyền & Mục đích dự án
              </span>
            </div>
            <p className="text-xs sm:text-[13px] text-white/85 leading-relaxed mt-1">
              <strong className="text-white font-semibold">Lưu ý quan trọng:</strong> Đây là sản phẩm học tập phục vụ mục đích nghiên cứu, học thuật và rèn luyện kỹ năng của sinh viên Trường Đại học Công nghệ Đồng Nai (DNTU). Website hoạt động <span className="text-amber-300 font-semibold underline decoration-amber-400/50 underline-offset-2">hoàn toàn phi thương mại</span> và <strong className="text-white">không có bất kỳ mục đích nào khác</strong>. Mọi hình ảnh và tài sản thương hiệu thuộc về Trường ĐH Công nghệ Đồng Nai.
            </p>
          </div>
        </div>

        {/* Bottom Bar: Copyright & Back to Top */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-white/60">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-center sm:text-left">
            <p>© {new Date().getFullYear()} Trường Đại học Công nghệ Đồng Nai (DNTU).</p>
            <span className="hidden sm:inline text-white/30">•</span>
            <p className="text-white/70">UniFind DNTU — Nền tảng kết nối tìm kiếm đồ thất lạc</p>
          </div>

          <div className="flex items-center gap-4">
            <Link to="/guide" className="hover:text-white transition-colors">
              Quy định sử dụng
            </Link>
            <span className="text-white/20">|</span>
            <button
              onClick={scrollToTop}
              className="inline-flex items-center gap-1.5 text-amber-300/90 hover:text-amber-200 transition-colors py-1 px-2.5 rounded-lg hover:bg-white/10"
              aria-label="Về đầu trang"
            >
              <span>Về đầu trang</span>
              <ArrowUp className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}
