import { Link } from 'react-router-dom';
import {
  ArrowUp,
  Building2,
  ChevronRight,
  Clock,
  ExternalLink,
  Globe,
  GraduationCap,
  Heart,
  Link2,
  Mail,
  MapPin,
  Music2,
  Phone,
  Plus,
  Search,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import DNTULogo from '../common/DNTULogo';

const quickLinks = [
  { label: 'Trang chủ', to: '/' },
  { label: 'Tìm kiếm vật phẩm', to: '/search' },
  { label: 'Đăng tin báo mất', to: '/report-lost' },
  { label: 'Báo nhặt được đồ', to: '/report-found' },
  { label: 'Hướng dẫn sử dụng', to: '/guide' },
];

const socialLinks = [
  { label: 'Facebook', href: 'https://facebook.com/dntu.edu.vn', type: 'facebook', tone: 'text-[#77A7FF]' },
  { label: 'YouTube', href: 'https://youtube.com', type: 'youtube', tone: 'text-[#FF5C62]' },
  { label: 'TikTok', href: 'https://tiktok.com', type: 'tiktok', tone: 'text-white' },
  { label: 'Website', href: 'https://dntu.edu.vn', type: 'website', tone: 'text-white' },
];

function SocialMark({ type }) {
  if (type === 'facebook') {
    return (
      <svg viewBox="0 0 24 24" className="h-7 w-7 fill-current" aria-hidden="true">
        <path d="M13.7 21v-8h2.7l.4-3h-3.1V8.1c0-.9.3-1.5 1.6-1.5H17V4a22 22 0 0 0-2.4-.1c-2.5 0-4.2 1.5-4.2 4.2V10H7.6v3h2.8v8h3.3Z" />
      </svg>
    );
  }

  if (type === 'youtube') {
    return (
      <svg viewBox="0 0 24 24" className="h-7 w-7 fill-current" aria-hidden="true">
        <path d="M21.6 7.2a2.9 2.9 0 0 0-2-2C17.8 4.7 12 4.7 12 4.7s-5.8 0-7.6.5a2.9 2.9 0 0 0-2 2A30 30 0 0 0 2 12a30 30 0 0 0 .4 4.8 2.9 2.9 0 0 0 2 2c1.8.5 7.6.5 7.6.5s5.8 0 7.6-.5a2.9 2.9 0 0 0 2-2A30 30 0 0 0 22 12a30 30 0 0 0-.4-4.8ZM10 15.2V8.8l5.3 3.2-5.3 3.2Z" />
      </svg>
    );
  }
  if (type === 'tiktok') return <Music2 className="h-7 w-7" aria-hidden="true" />;
  return <Globe className="h-7 w-7" aria-hidden="true" />;
}

export default function Footer() {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="unifind-footer relative -mt-px overflow-hidden border-t border-[#7f2027] bg-[linear-gradient(180deg,var(--footer-bg)_0%,var(--footer-bg-deep)_100%)] font-sans text-[var(--footer-white)]">
      <div
        className="pointer-events-none absolute inset-0 opacity-70"
        aria-hidden="true"
        style={{
          background:
            'radial-gradient(circle at 8% 8%, rgba(143,24,34,.24), transparent 26%), radial-gradient(circle at 84% 22%, rgba(138,31,38,.2), transparent 30%)',
        }}
      />
      <div
        className="pointer-events-none absolute bottom-0 right-0 h-[300px] w-[min(48vw,760px)] bg-contain bg-right-bottom bg-no-repeat opacity-[0.09]"
        aria-hidden="true"
        style={{ backgroundImage: 'url(/DNTU_Web_Asset_Kit/watermarks/dntu-campus-lineart-white.svg)' }}
      />
      <div
        className="pointer-events-none absolute -left-4 top-24 h-32 w-32 opacity-20"
        aria-hidden="true"
        style={{
          backgroundImage: 'radial-gradient(circle, var(--footer-gold) 1.5px, transparent 1.7px)',
          backgroundSize: '15px 15px',
        }}
      />

      <div className="relative z-10 mx-auto w-full max-w-[var(--footer-max-width)] px-5 pb-5 pt-6 sm:px-6 sm:pt-7 min-[1200px]:px-8 min-[1200px]:pt-6">
        {/* SECTION A — CTA BANNER */}
        <section className="relative overflow-hidden rounded-[18px] border border-[var(--footer-border)] bg-[linear-gradient(100deg,rgba(86,16,21,.98),rgba(70,9,13,.96))] px-5 py-5 shadow-[0_20px_60px_rgba(9,0,1,.24),inset_0_1px_0_rgba(255,255,255,.035)] sm:px-6 min-[1200px]:grid min-[1200px]:min-h-[108px] min-[1200px]:grid-cols-[minmax(0,1fr)_auto] min-[1200px]:items-center min-[1200px]:gap-6 min-[1200px]:px-6 min-[1200px]:py-4">
          <div
            className="pointer-events-none absolute right-[22%] top-1/2 hidden h-28 w-40 -translate-y-1/2 opacity-20 min-[1200px]:block"
            aria-hidden="true"
            style={{
              backgroundImage: 'radial-gradient(circle, var(--footer-gold) 1.4px, transparent 1.6px)',
              backgroundSize: '13px 13px',
              maskImage: 'linear-gradient(90deg, transparent, black, transparent)',
            }}
          />

          <div className="relative flex min-w-0 flex-col items-center gap-3 text-center sm:flex-row sm:text-left">
            <div className="grid h-14 w-14 shrink-0 place-items-center rounded-xl border border-[rgba(245,191,79,.46)] bg-[linear-gradient(145deg,rgba(245,191,79,.15),rgba(245,191,79,.04))] text-[var(--footer-gold)] shadow-[inset_0_0_20px_rgba(245,191,79,.06)] min-[1200px]:h-12 min-[1200px]:w-12">
              <Sparkles className="h-7 w-7 min-[1200px]:h-6 min-[1200px]:w-6" strokeWidth={1.8} aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <h2 className="text-balance text-xl font-extrabold leading-tight tracking-[-0.02em] text-white sm:text-[22px] min-[1200px]:text-2xl">
                Bạn vừa <span className="text-[var(--footer-gold)]">làm rơi đồ</span> hoặc{' '}
                <span className="text-[var(--footer-gold)]">nhặt được tài sản</span> trong trường?
              </h2>
              <p className="mt-1.5 text-[13px] leading-relaxed text-[var(--footer-muted)]">
                Hãy đăng thông tin ngay để cộng đồng sinh viên DNTU hỗ trợ kết nối và trao trả nhanh nhất.
              </p>
            </div>
          </div>

          <div className="relative mt-5 grid grid-cols-1 gap-2 min-[390px]:grid-cols-2 min-[1200px]:mt-0 min-[1200px]:min-w-[380px]">
            <Link
              to="/report-lost"
              className="inline-flex min-h-11 items-center justify-center gap-2.5 rounded-xl bg-white px-5 py-2.5 text-[13px] font-extrabold text-[#7d141b] shadow-[0_8px_24px_rgba(0,0,0,.16)] transition duration-200 hover:-translate-y-0.5 hover:bg-[#fffaf6] hover:shadow-[0_12px_30px_rgba(0,0,0,.22)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--footer-gold)] focus-visible:ring-offset-2 focus-visible:ring-offset-[#4b0c11]"
            >
              <Search className="h-5 w-5" strokeWidth={2.4} aria-hidden="true" />
              Báo mất đồ
            </Link>
            <Link
              to="/report-found"
              className="inline-flex min-h-11 items-center justify-center gap-2.5 rounded-xl bg-[linear-gradient(180deg,#ffd061,#f5b93f)] px-5 py-2.5 text-[13px] font-extrabold text-[#4b0b10] shadow-[0_8px_24px_rgba(20,2,3,.2)] transition duration-200 hover:-translate-y-0.5 hover:brightness-105 hover:shadow-[0_12px_30px_rgba(20,2,3,.26)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#4b0c11]"
            >
              <Plus className="h-5 w-5" strokeWidth={2.4} aria-hidden="true" />
              Báo nhặt được
            </Link>
          </div>
        </section>

        {/* SECTION B — FOUR COLUMN GRID */}
        <section className="grid grid-cols-1 gap-y-8 py-8 md:grid-cols-2 md:gap-x-8 min-[1200px]:grid-cols-[minmax(0,1.45fr)_minmax(0,.75fr)_minmax(0,1.1fr)_minmax(0,.9fr)] min-[1200px]:gap-x-6 min-[1200px]:py-7">
          <div className="min-w-0">
            <DNTULogo size="md" light />
            <p className="mt-3 max-w-[560px] text-sm leading-[1.6] text-[var(--footer-muted)] min-[1200px]:text-[13px]">
              Nền tảng hỗ trợ sinh viên, giảng viên và cán bộ viên chức DNTU trong việc tìm kiếm, xác minh và trao trả tài sản thất lạc trong khuôn viên trường học.
            </p>

            <address className="mt-3 space-y-2 text-[13px] not-italic leading-[1.55] text-[var(--footer-muted)]">
              <div className="flex items-start gap-2.5">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[var(--footer-gold)]" aria-hidden="true" />
                <span>Đường Nguyễn Khuyến, KP5, P. Trảng Dài, TP. Biên Hòa, Tỉnh Đồng Nai</span>
              </div>
              <div className="flex items-start gap-2.5">
                <Phone className="mt-0.5 h-4 w-4 shrink-0 text-[var(--footer-gold)]" aria-hidden="true" />
                <span>Hotline: 0251 3 999 888 • Phòng Tiếp Nhận Đồ Thất Lạc</span>
              </div>
              <div className="flex items-start gap-2.5">
                <Mail className="mt-0.5 h-4 w-4 shrink-0 text-[var(--footer-gold)]" aria-hidden="true" />
                <a href="mailto:unifind@dntu.edu.vn" className="transition-colors duration-200 hover:text-[var(--footer-gold)]">
                  unifind@dntu.edu.vn
                </a>
              </div>
            </address>

            <div className="mt-3 flex flex-wrap gap-2">
              {[
                { label: 'Vì cộng đồng', icon: GraduationCap },
                { label: 'An toàn', icon: Heart },
                { label: 'Minh bạch', icon: ShieldCheck },
              ].map(({ label, icon: Icon }) => (
                <span key={label} className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border border-[var(--footer-border)] bg-white/[0.035] px-3 py-1.5 text-[11px] font-semibold text-[var(--footer-white)]">
                  <Icon className="h-3.5 w-3.5 text-[var(--footer-gold)]" aria-hidden="true" />
                  {label}
                </span>
              ))}
            </div>
          </div>

          <div className="min-w-0 min-[1200px]:border-l min-[1200px]:border-[var(--footer-border)] min-[1200px]:pl-6">
            <h3 className="flex items-center gap-2.5 text-sm font-extrabold uppercase tracking-wide text-white">
              <Link2 className="h-5 w-5 text-[var(--footer-gold)]" aria-hidden="true" />
              Liên kết nhanh
            </h3>
            <nav aria-label="Liên kết nhanh cuối trang" className="mt-3">
              <ul>
                {quickLinks.map(link => (
                  <li key={link.to}>
                    <Link
                      to={link.to}
                      className="group flex min-h-9 items-center justify-between gap-3 rounded-lg py-1.5 text-[13px] font-medium text-[var(--footer-muted)] transition duration-200 hover:translate-x-1 hover:text-[var(--footer-gold)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--footer-gold)]"
                    >
                      <span>{link.label}</span>
                      <ChevronRight className="h-4 w-4 shrink-0 text-white/55 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:text-[var(--footer-gold)]" aria-hidden="true" />
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          </div>

          <div className="min-w-0 min-[1200px]:border-l min-[1200px]:border-[var(--footer-border)] min-[1200px]:pl-6">
            <h3 className="flex items-center gap-2.5 text-sm font-extrabold uppercase tracking-wide text-white">
              <MapPin className="h-5 w-5 text-[var(--footer-gold)]" aria-hidden="true" />
              Điểm tiếp nhận trực tiếp
            </h3>
            <div className="mt-3 overflow-hidden rounded-[var(--footer-radius)] border border-[var(--footer-border)] bg-[linear-gradient(180deg,rgba(89,25,30,.76),rgba(63,13,17,.72))] shadow-[inset_0_1px_0_rgba(255,255,255,.03)]">
              <div className="flex gap-3 p-3">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-white/10 bg-white/[0.08] text-[var(--footer-gold)]">
                  <Building2 className="h-5 w-5" aria-hidden="true" />
                </span>
                <div className="min-w-0">
                  <p className="text-[13px] font-bold leading-snug text-white">Văn phòng Đoàn TN – Hội Sinh viên</p>
                  <p className="mt-1 text-[11px] leading-relaxed text-[var(--footer-muted)]">Tòa nhà Trung tâm DNTU</p>
                  <p className="text-[11px] leading-relaxed text-[var(--footer-muted)]">Bàn trực hỗ trợ đồ thất lạc</p>
                </div>
              </div>
              <div className="flex items-center gap-2.5 border-t border-[var(--footer-border)] px-3 py-2.5 text-xs text-[var(--footer-muted)]">
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-md bg-white/[0.08] text-[var(--footer-gold)]">
                  <Clock className="h-4 w-4" aria-hidden="true" />
                </span>
                <span>Thứ 2 – Thứ 7: 07:30 – 17:00</span>
              </div>
              <div className="flex items-center gap-2.5 border-t border-[var(--footer-border)] px-3 py-2.5 text-xs text-[var(--footer-muted)]">
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-md bg-white/[0.08] text-[var(--footer-gold)]">
                  <ShieldCheck className="h-4 w-4" aria-hidden="true" />
                </span>
                <span>Quy trình xác minh bảo mật sinh viên</span>
              </div>
            </div>
          </div>

          <div className="min-w-0 min-[1200px]:border-l min-[1200px]:border-[var(--footer-border)] min-[1200px]:pl-6">
            <h3 className="flex items-center gap-2.5 text-sm font-extrabold uppercase tracking-wide text-white">
              <ExternalLink className="h-5 w-5 text-[var(--footer-gold)]" aria-hidden="true" />
              Kết nối với DNTU
            </h3>
            <div className="mt-3 grid grid-cols-4 gap-2">
              {socialLinks.map(link => (
                <a
                  key={link.label}
                  href={link.href}
                  target="_blank"
                  rel="noreferrer"
                  className="group flex min-w-0 flex-col items-center gap-1.5 text-center text-[10px] font-medium text-[var(--footer-muted)] transition duration-200 hover:-translate-y-1 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--footer-gold)]"
                  aria-label={link.label}
                >
                  <span className={`grid h-[42px] w-[42px] place-items-center rounded-xl border border-[var(--footer-border)] bg-white/[0.045] shadow-[inset_0_1px_0_rgba(255,255,255,.04)] transition duration-200 group-hover:border-[rgba(245,191,79,.45)] group-hover:bg-[var(--footer-card-hover)] group-hover:shadow-[0_10px_24px_rgba(0,0,0,.2)] ${link.tone}`}>
                    <SocialMark type={link.type} />
                  </span>
                  <span className="w-full truncate">{link.label}</span>
                </a>
              ))}
            </div>

            <div className="mt-3 grid grid-cols-[72px_minmax(0,1fr)] items-center gap-2 overflow-hidden rounded-[var(--footer-radius)] border border-[var(--footer-border)] bg-[linear-gradient(135deg,rgba(86,21,27,.84),rgba(54,8,12,.82))] p-2 shadow-[inset_0_1px_0_rgba(255,255,255,.03)]">
              <div className="grid h-16 w-16 place-items-center overflow-hidden rounded-full border border-[rgba(245,191,79,.25)] bg-[radial-gradient(circle,rgba(245,191,79,.16),rgba(245,191,79,.02)_70%)]">
                <img
                  src="/DNTU_Chatbot_Asset_Kit/DNTU_Chatbot_Asset_Kit/mascot/static/found.png"
                  alt="Mascot Cú DNTU"
                  className="h-[145%] w-[145%] object-contain object-center"
                />
              </div>
              <div className="min-w-0">
                <p className="text-balance font-serif text-[13px] font-bold italic leading-relaxed text-[var(--footer-gold)]">
                  “Tri thức – Sáng tạo – Hội nhập”
                </p>
                <span className="my-1.5 block h-px w-8 bg-[var(--footer-gold)]/70" aria-hidden="true" />
                <p className="text-[10px] leading-relaxed text-[var(--footer-muted)]">Đại học Công nghệ Đồng Nai</p>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION C — COPYRIGHT NOTICE */}
        <section className="rounded-[var(--footer-radius)] border border-[var(--footer-border)] bg-[linear-gradient(100deg,rgba(76,17,22,.78),rgba(55,9,13,.7))] px-4 py-3.5 shadow-[inset_0_1px_0_rgba(255,255,255,.025)]">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-[rgba(245,191,79,.22)] bg-[linear-gradient(145deg,rgba(245,191,79,.14),rgba(245,191,79,.04))] text-[var(--footer-gold)]">
              <GraduationCap className="h-5 w-5" aria-hidden="true" />
            </div>
            <div className="hidden h-12 w-px shrink-0 bg-[var(--footer-border)] sm:block" aria-hidden="true" />
            <div className="min-w-0 flex-1">
              <h3 className="text-[13px] font-extrabold uppercase tracking-wide text-[var(--footer-gold)] sm:text-sm">
                Thông báo bản quyền &amp; Mục đích dự án
              </h3>
              <p className="mt-1.5 text-xs leading-5 text-[var(--footer-muted)]">
                <strong className="font-bold text-white">Lưu ý quan trọng:</strong> Đây là sản phẩm học tập phục vụ mục đích nghiên cứu, học thuật và rèn luyện kỹ năng của sinh viên Trường Đại học Công nghệ Đồng Nai (DNTU). Website hoạt động{' '}
                <strong className="font-bold text-[var(--footer-gold)] underline decoration-[var(--footer-gold)]/55 underline-offset-4">hoàn toàn phi thương mại</strong>{' '}
                và <strong className="font-bold text-white">không có bất kỳ mục đích nào khác</strong>. Mọi hình ảnh và tài sản thương hiệu thuộc về Trường ĐH Công nghệ Đồng Nai.
              </p>
            </div>
          </div>
        </section>

        {/* SECTION D — BOTTOM BAR */}
        <section className="flex flex-col gap-3 pt-5 text-xs text-[var(--footer-muted)] min-[1200px]:flex-row min-[1200px]:items-center min-[1200px]:justify-between" aria-label="Bản quyền và thông tin pháp lý">
          <div className="flex flex-col gap-2 text-center sm:flex-row sm:flex-wrap sm:items-center sm:justify-center sm:gap-x-5 min-[1200px]:justify-start min-[1200px]:text-left">
            <p>© {new Date().getFullYear()} Trường Đại học Công nghệ Đồng Nai (DNTU).</p>
            <span className="hidden h-1 w-1 rounded-full bg-white/35 sm:block" aria-hidden="true" />
            <p>UniFind DNTU – Nền tảng kết nối tìm kiếm đồ thất lạc.</p>
          </div>

          <nav aria-label="Thông tin pháp lý cuối trang" className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 min-[1200px]:justify-end">
            <Link to="/guide" className="transition-colors duration-200 hover:text-white">Quy định sử dụng</Link>
            <span className="h-4 w-px bg-white/25" aria-hidden="true" />
            <Link to="/guide" className="transition-colors duration-200 hover:text-white">Chính sách bảo mật</Link>
            <span className="h-4 w-px bg-white/25" aria-hidden="true" />
            <button
              type="button"
              onClick={scrollToTop}
              className="inline-flex min-h-10 items-center gap-2 rounded-lg px-2 font-bold text-[var(--footer-gold)] transition duration-200 hover:bg-white/[0.06] hover:text-[#ffd975] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--footer-gold)]"
              aria-label="Về đầu trang"
            >
              Về đầu trang
              <ArrowUp className="h-4 w-4" aria-hidden="true" />
            </button>
          </nav>
        </section>
      </div>
    </footer>
  );
}
