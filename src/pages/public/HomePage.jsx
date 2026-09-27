import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useNavigationType } from 'react-router-dom';
import {
  Search, Send, Package, Users, FileText, ShieldCheck, Heart,
  MapPin, ArrowRight, ChevronRight, CheckCircle2, AlertTriangle, HelpCircle, X
} from 'lucide-react';
import ItemCard from '../../components/common/ItemCard';
import CategoryIcon from '../../components/common/CategoryIcon';
import LoadingSkeleton from '../../components/common/LoadingSkeleton';
import itemService from '../../services/itemService';
import scrollRestorationService from '../../services/scrollRestorationService';

export default function HomePage() {
  const [items, setItems] = useState([]);
  const [activeTab, setActiveTab] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [stats, setStats] = useState({ total: 0, returned: 0, lost: 0, found: 0 });
  const navigate = useNavigate();
  const navType = useNavigationType();
  const shouldRestoreRef = useRef(false);

  useEffect(() => {
    if (navType === 'POP') {
      const snap = scrollRestorationService.getSnapshot('/');
      if (snap) {
        shouldRestoreRef.current = true;
        if (snap.extra?.activeTab) {
          setActiveTab(snap.extra.activeTab);
        }
      }
    } else {
      scrollRestorationService.clearSnapshot();
      window.scrollTo({ top: 0, behavior: 'instant' });
    }
  }, [navType]);

  useEffect(() => {
    Promise.all([
      itemService.getRecentItems(12),
      itemService.getItems({ status: 'RETURNED' }),
      itemService.getItems({}),
    ]).then(([recent, returned, all]) => {
      setItems(recent);
      setStats({
        total: all.length,
        returned: all.filter(i => i.status === 'RETURNED').length,
        lost: all.filter(i => i.status === 'LOST').length,
        found: all.filter(i => i.status === 'FOUND').length,
      });
      setLoading(false);
    }).catch(err => {
      console.error(err);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (!loading && shouldRestoreRef.current) {
      const snap = scrollRestorationService.getSnapshot('/');
      if (snap) {
        scrollRestorationService.restorePosition({
          itemId: snap.itemId,
          cardTop: snap.cardTop,
          scrollY: snap.scrollY,
          onComplete: () => {
            scrollRestorationService.consumeSnapshot();
            shouldRestoreRef.current = false;
          }
        });
      } else {
        shouldRestoreRef.current = false;
      }
    }
  }, [loading, items]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
  };

  const handleItemClick = (item, e) => {
    const cardEl = document.getElementById(`item-card-${item.id}`) || e?.currentTarget;
    const cardTop = cardEl ? cardEl.getBoundingClientRect().top : null;
    scrollRestorationService.saveSnapshot({
      path: '/',
      fullPath: '/',
      scrollY: window.scrollY || document.documentElement.scrollTop || 0,
      itemId: item.id,
      cardTop,
      extra: {
        activeTab,
      }
    });

    navigate(`/items/${item.id}`, {
      state: {
        from: 'home',
        returnPath: '/',
        itemId: item.id,
      }
    });
  };

  const featuredCategories = [
    { name: 'Điện thoại', query: 'Điện thoại' },
    { name: 'Ví, bóp', query: 'Ví / Bóp' },
    { name: 'Thẻ sinh viên', query: 'Thẻ sinh viên' },
    { name: 'Chìa khóa', query: 'Chìa khóa' },
    { name: 'Tai nghe', query: 'Tai nghe' },
    { name: 'Laptop', query: 'Laptop' },
    { name: 'Khác', query: 'Khác' },
  ];

  const filteredItems = items.filter(item => {
    if (activeTab === 'ALL') return true;
    return (item.status || item.type) === activeTab;
  });

  return (
    <div className="bg-[#F8F6F3] min-h-screen">
      {/* Hero Section matching 01_home.png */}
      <section
        className="relative min-h-[520px] md:min-h-[580px] lg:min-h-[620px] flex items-center px-4 sm:px-6 lg:px-10 overflow-hidden"
        style={{
          backgroundImage: `url(/DNTU_Web_Asset_Kit/asset/campus_colorful_building.jpg)`,
          backgroundSize: 'cover',
          backgroundPosition: 'right center',
        }}
      >
        {/* Responsive Gradient overlay for legibility */}
        <div 
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'linear-gradient(90deg, rgba(255,255,255,0.98) 0%, rgba(255,255,255,0.94) 45%, rgba(255,255,255,0.4) 70%, rgba(255,255,255,0.05) 100%)'
          }}
        />

        <div className="page-container relative z-10 py-12 md:py-16 w-full">
          <div className="max-w-2xl lg:max-w-3xl">
            {/* Small caps badge */}
            <p className="text-xs sm:text-[13px] tracking-widest font-bold text-accent uppercase mb-2">
              CÙNG NHAU TẠO NÊN MỘT DNTU TỐT ĐẸP HƠN
            </p>

            {/* Editorial Serif Heading */}
            <h1 className="text-3xl sm:text-4xl lg:text-[46px] font-serif font-extrabold text-[#741216] leading-[1.18] tracking-tight mb-3">
              Tìm lại những giá trị<br />
              Kết nối cộng đồng DNTU
            </h1>
            
            <p className="text-ink-slate text-sm sm:text-base mb-7 max-w-xl leading-relaxed">
              UniFind DNTU là nền tảng hỗ trợ sinh viên, giảng viên và cán bộ trong việc tìm kiếm và trao trả đồ thất lạc tại Trường Đại học Công nghệ Đồng Nai.
            </p>
            
            {/* Hero Search Bar */}
            <form
              onSubmit={handleSearch}
              className="relative flex items-center bg-white rounded-full p-1.5 pl-4 sm:pl-5 shadow-landing-md border border-hairline/80 max-w-xl mb-6 focus-within:ring-2 focus-within:ring-[#981B1E]/20 focus-within:border-[#981B1E] transition-all"
            >
              <Search className="w-5 h-5 text-ink-muted mr-2.5 sm:mr-3 shrink-0 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Bạn đang tìm kiếm gì? (ví dụ: điện thoại, ví, thẻ sinh viên...)"
                className="flex-1 min-w-0 py-2 sm:py-2.5 pr-2 text-ink text-sm sm:text-base placeholder:text-ink-muted focus:outline-none bg-transparent"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="p-1 text-ink-muted hover:text-ink mr-2 transition-colors"
                  aria-label="Xóa từ khóa"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
              <button
                type="submit"
                className="bg-[#981B1E] hover:bg-[#741216] text-white px-5 sm:px-7 py-2 sm:py-2.5 rounded-full font-bold text-xs sm:text-sm shrink-0 transition-colors shadow-sm active:scale-95"
              >
                Tìm kiếm
              </button>
            </form>

            {/* 2 Big CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 max-w-xl">
              {/* Button 1: Báo mất đồ */}
              <Link
                to="/report-lost"
                className="flex-1 flex items-center gap-3.5 bg-[#981B1E] hover:bg-[#741216] text-white px-5 py-3.5 rounded-2xl shadow-landing-sm hover:shadow-card-hover transition-all duration-200 group"
              >
                <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <Send className="w-5 h-5 text-white" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-bold text-base leading-tight">Báo mất đồ</h3>
                  <p className="text-xs text-white/80 mt-0.5 truncate">Đăng thông tin đồ bị mất</p>
                </div>
              </Link>

              {/* Button 2: Báo nhặt được */}
              <Link
                to="/report-found"
                className="flex-1 flex items-center gap-3.5 bg-white hover:bg-paper-panel border-2 border-[#981B1E] text-[#981B1E] px-5 py-3.5 rounded-2xl shadow-landing-sm hover:shadow-card-hover transition-all duration-200 group"
              >
                <div className="w-10 h-10 rounded-xl bg-accent-tint flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <Package className="w-5 h-5 text-[#981B1E]" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-bold text-base leading-tight">Báo nhặt được</h3>
                  <p className="text-xs text-ink-muted mt-0.5 truncate">Giúp trả lại người đánh mất</p>
                </div>
              </Link>
            </div>
          </div>
        </div>

        {/* Handwriting slogan watermark at bottom right */}
        <div className="hidden lg:block absolute bottom-5 right-8 text-white font-script text-2xl xl:text-3xl drop-shadow-md select-none transform rotate-[-2deg] pointer-events-none">
          Một cộng đồng tử tế luôn tìm thấy nhau ♡
        </div>
      </section>

      {/* Stats Ribbon Bar matching 01_home.png */}
      <section className="bg-white border-y border-hairline py-5 px-4 sm:px-6">
        <div className="page-container flex flex-wrap items-center justify-between gap-6">
          <div className="flex flex-wrap items-center gap-8 sm:gap-12 flex-1">
            {/* Stat 1 */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-accent-tint text-accent flex items-center justify-center shrink-0">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <p className="font-serif font-bold text-xl text-ink leading-tight">2.500+</p>
                <p className="text-xs text-ink-muted">Thành viên cộng đồng</p>
              </div>
            </div>

            {/* Stat 2 */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-accent-tint text-accent flex items-center justify-center shrink-0">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <p className="font-serif font-bold text-xl text-ink leading-tight">430+</p>
                <p className="text-xs text-ink-muted">Tin đăng đã được xử lý</p>
              </div>
            </div>

            {/* Stat 3 */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-accent-tint text-accent flex items-center justify-center shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <p className="font-serif font-bold text-xl text-ink leading-tight">92%</p>
                <p className="text-xs text-ink-muted">Tỷ lệ tìm lại thành công</p>
              </div>
            </div>

            {/* Stat 4: Vì một DNTU */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-accent-tint text-accent flex items-center justify-center shrink-0">
                <Heart className="w-5 h-5" />
              </div>
              <div>
                <p className="font-bold text-sm text-accent leading-tight">Vì một DNTU</p>
                <p className="text-xs text-ink-muted">Văn minh – Nghĩa tình – Tử tế</p>
              </div>
            </div>
          </div>

          {/* Quote on right */}
          <div className="hidden xl:flex items-center pl-6 border-l border-hairline max-w-xs text-xs text-ink-slate italic">
            “Những điều nhỏ bé có thể tạo nên những thay đổi lớn.”
            <span className="font-bold text-ink not-italic ml-2">— DNTU</span>
          </div>
        </div>
      </section>

      {/* Main 2-Column Content Section matching 01_home.png */}
      <section className="page-container py-10 md:py-14">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10">
          
          {/* LEFT COLUMN: Categories + Recent Items (8 cols) */}
          <div className="lg:col-span-8 space-y-10">
            {/* Section: Tìm kiếm theo danh mục */}
            <div>
              <h2 className="font-serif font-bold text-xl text-ink mb-4">Tìm kiếm theo danh mục</h2>
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-7 gap-3">
                {featuredCategories.map((cat) => (
                  <button
                    key={cat.name}
                    onClick={() => navigate(`/search?category=${encodeURIComponent(cat.query)}`)}
                    className="flex flex-col items-center justify-center p-3 rounded-2xl bg-white border border-hairline hover:border-accent hover:shadow-card hover:-translate-y-0.5 transition-all text-center group cursor-pointer"
                  >
                    <div className="w-10 h-10 rounded-xl bg-paper-panel flex items-center justify-center text-accent group-hover:bg-accent group-hover:text-white transition-colors mb-2">
                      <CategoryIcon category={cat.name} className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-semibold text-ink group-hover:text-accent transition-colors leading-tight">
                      {cat.name}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Section: Tin đăng mới nhất */}
            <div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
                <div className="flex items-center gap-3">
                  <h2 className="font-serif font-bold text-xl text-ink">Tin đăng mới nhất</h2>
                  {/* Filter tabs */}
                  <div className="flex items-center gap-1.5">
                    {[
                      { key: 'ALL', label: 'Tất cả' },
                      { key: 'LOST', label: 'Đồ bị mất' },
                      { key: 'FOUND', label: 'Đồ nhặt được' },
                    ].map(tab => (
                      <button
                        key={tab.key}
                        onClick={() => setActiveTab(tab.key)}
                        className={`px-3.5 py-1 text-xs rounded-full font-semibold transition-all ${
                          activeTab === tab.key
                            ? 'bg-[#981B1E] text-white shadow-xs'
                            : 'bg-paper-panel text-ink-slate hover:text-ink'
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>
                </div>

                <Link
                  to="/search"
                  className="inline-flex items-center gap-1 text-xs font-bold text-accent hover:text-burgundy-800 transition-colors"
                >
                  <span>Xem thêm</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              {/* Grid of items */}
              {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <LoadingSkeleton type="card" count={4} />
                </div>
              ) : filteredItems.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {filteredItems.slice(0, 4).map(item => (
                    <ItemCard
                      key={item.id}
                      item={item}
                      onClick={handleItemClick}
                    />
                  ))}
                </div>
              ) : (
                <div className="bg-white rounded-2xl p-10 text-center border border-hairline">
                  <Package className="w-10 h-10 text-ink-muted mx-auto mb-2" />
                  <p className="text-ink-slate font-medium text-sm">Chưa có bài đăng nào trong mục này.</p>
                </div>
              )}
            </div>
          </div>

          {/* RIGHT COLUMN: Feature Promo Banners (4 cols) */}
          <div className="lg:col-span-4 space-y-6">
            {/* Banner 1: Thẻ sinh viên DNTU */}
            <div className="relative rounded-2xl overflow-hidden bg-white border border-hairline shadow-card group">
              <div className="relative h-44 overflow-hidden bg-paper-panel">
                <img
                  src="/DNTU_Web_Asset_Kit/asset/students_group_study.png"
                  alt="Sinh viên DNTU"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                {/* Floating student card badge */}
                <div className="absolute bottom-3 right-3 bg-white/95 backdrop-blur-xs px-2.5 py-1 rounded-md shadow-sm border border-hairline text-[10px] font-bold text-accent">
                  DNTU THẺ SINH VIÊN
                </div>
              </div>
              <div className="p-5">
                <h3 className="font-bold text-lg text-accent leading-tight">Thẻ sinh viên DNTU</h3>
                <p className="text-xs text-ink-muted mt-1 mb-4">Đánh rơi thẻ? Hãy để UniFind giúp bạn!</p>
                <Link
                  to="/student-card"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#981B1E] hover:bg-[#741216] text-white text-xs font-bold transition-colors shadow-xs"
                >
                  <span>Tìm hiểu thêm</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>

            {/* Banner 2: Bản đồ campus DNTU */}
            <div className="relative rounded-2xl overflow-hidden bg-white border border-hairline shadow-card group">
              <div className="p-5 border-b border-hairline flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-accent-tint text-accent flex items-center justify-center shrink-0">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-ink leading-tight">Bản đồ campus DNTU</h3>
                  <p className="text-xs text-ink-muted mt-1">Xem vị trí các khu vực thường gặp đồ thất lạc</p>
                </div>
              </div>
              <div className="relative h-36 overflow-hidden">
                <img
                  src="/DNTU_Web_Asset_Kit/asset/26_classroom_building_a.jpg"
                  alt="Khuôn viên DNTU Giảng đường A"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-black/20" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Link
                    to="/search"
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#981B1E] hover:bg-[#741216] text-white text-xs font-bold transition-colors shadow-md"
                  >
                    <span>Xem bản đồ</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            </div>

            {/* Quick Link */}
            <div className="text-right">
              <Link
                to="/guide"
                className="inline-flex items-center gap-1 text-xs font-bold text-ink-muted hover:text-accent transition-colors"
              >
                <span>Tìm hiểu chi tiết</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

        </div>
      </section>

      {/* Section: Cách thức hoạt động matching 01_home.png */}
      <section className="bg-white border-t border-hairline py-12 md:py-16">
        <div className="page-container">
          <div className="flex items-center justify-between gap-4 mb-8">
            <h2 className="font-serif font-bold text-2xl text-ink">Cách thức hoạt động</h2>
            <Link
              to="/guide"
              className="inline-flex items-center gap-1 text-xs font-bold text-accent hover:text-burgundy-800 transition-colors"
            >
              <span>Tìm hiểu chi tiết</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 relative">
            {/* Step 1 */}
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-accent-tint text-accent flex items-center justify-center shrink-0 shadow-2xs font-bold text-base">
                <FileText className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-sm text-ink mb-1">1. Đăng thông tin</h3>
                <p className="text-xs text-ink-muted leading-relaxed">
                  Báo mất đồ hoặc báo nhặt được với mô tả chi tiết và hình ảnh
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-accent-tint text-accent flex items-center justify-center shrink-0 shadow-2xs font-bold text-base">
                <Users className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-sm text-ink mb-1">2. Cộng đồng hỗ trợ</h3>
                <p className="text-xs text-ink-muted leading-relaxed">
                  Mọi người cùng tìm kiếm, chia sẻ thông tin
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-accent-tint text-accent flex items-center justify-center shrink-0 shadow-2xs font-bold text-base">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-sm text-ink mb-1">3. Kết nối & xác minh</h3>
                <p className="text-xs text-ink-muted leading-relaxed">
                  Liên hệ, xác minh thông tin an toàn dưới sự hỗ trợ của DNTU
                </p>
              </div>
            </div>

            {/* Step 4 */}
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-accent-tint text-accent flex items-center justify-center shrink-0 shadow-2xs font-bold text-base">
                <Heart className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-sm text-ink mb-1">4. Tìm lại niềm vui</h3>
                <p className="text-xs text-ink-muted leading-relaxed">
                  Trao trả tận tay – lan tỏa những giá trị tốt đẹp
                </p>
              </div>
            </div>
          </div>

          {/* Slogan note beside step flow */}
          <div className="mt-8 pt-6 border-t border-hairline flex items-center justify-between">
            <span className="text-xs text-ink-muted">Quy trình xử lý chuẩn hóa & an toàn cho sinh viên DNTU</span>
            <span className="font-script text-accent text-xl lg:text-2xl select-none">
              Tử tế là nét đẹp của DNTU ♡
            </span>
          </div>
        </div>
      </section>
    </div>
  );
}
