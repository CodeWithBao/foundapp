import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, AlertTriangle, HelpCircle, CheckCircle, TrendingUp, Package, MapPin, Building2, GraduationCap } from 'lucide-react';
import ItemCard from '../../components/common/ItemCard';
import LoadingSkeleton from '../../components/common/LoadingSkeleton';
import itemService from '../../services/itemService';

export default function HomePage() {
  const [items, setItems] = useState([]);
  const [returnedItems, setReturnedItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [stats, setStats] = useState({ total: 0, returned: 0, lost: 0, found: 0 });
  const navigate = useNavigate();

  useEffect(() => {
    Promise.all([
      itemService.getRecentItems(8),
      itemService.getItems({ status: 'RETURNED' }),
      itemService.getItems({}),
    ]).then(([recent, returned, all]) => {
      setItems(recent);
      setReturnedItems(returned.slice(0, 4));
      setStats({
        total: all.length,
        returned: all.filter(i => i.status === 'RETURNED').length,
        lost: all.filter(i => i.status === 'LOST').length,
        found: all.filter(i => i.status === 'FOUND').length,
      });
      setLoading(false);
    });
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
  };

  return (
    <div className="unifind-home bg-[#fbfaf8] min-h-screen">
      {/* Hero Section */}
      <section
        className="unifind-hero relative min-h-[520px] md:min-h-[600px] flex flex-col justify-center px-4 sm:px-6 overflow-hidden"
        style={{
          backgroundImage: `linear-gradient(90deg, rgba(55,8,13,.92) 0%, rgba(75,12,18,.78) 48%, rgba(55,8,13,.46) 100%), url(/DNTU_Web_Asset_Kit/backgrounds/dntu-campus-clean-1600.webp)`,
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      >
        <div className="page-container w-full relative z-10"><div className="max-w-4xl">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/15 mb-7">
            <span className="w-2 h-2 rounded-full bg-champagne-400 animate-pulse" />
            <span className="text-cream-100 text-sm font-semibold tracking-wide">UNIFIND DNTU - Nền tảng tìm đồ thất lạc</span>
          </div>

          <h1 className="text-[2.6rem] sm:text-5xl lg:text-[3.6rem] xl:text-[4rem] font-sans font-extrabold text-white mb-6 drop-shadow-md leading-[1.08] tracking-[-0.035em] text-balance">
            Cùng nhau xây dựng một <span className="text-champagne-300 font-sans">DNTU</span> tốt đẹp hơn
          </h1>
          <p className="text-lg md:text-xl text-cream-100 mb-9 max-w-2xl leading-relaxed drop-shadow-sm">
            Tìm lại những đồ vật quan trọng, lan tỏa những giá trị tốt đẹp trong cộng đồng DNTU.
          </p>
          
          {/* Search Bar */}
          <form onSubmit={handleSearch} className="max-w-3xl relative flex rounded-2xl overflow-hidden bg-white border border-white/80 shadow-[0_18px_50px_rgba(30,5,10,.22)]">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-warm-gray-400" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Tìm kiếm vật phẩm (ví dụ: điện thoại, thẻ sinh viên, ví tiền...)"
              className="w-full pl-11 pr-4 py-4 md:py-5 text-text-dark focus:outline-none text-base md:text-lg placeholder:text-warm-gray-400"
            />
            <button
              type="submit"
              className="px-7 md:px-10 bg-burgundy-600 hover:bg-burgundy-700 text-white font-medium transition-colors shrink-0 flex items-center justify-center text-base md:text-lg shadow-sm"
            >
              Tìm kiếm
            </button>
          </form>
        </div></div>
      </section>

      {/* Quick Action Cards */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-12 md:-mt-16 relative z-10">
        <div className="grid md:grid-cols-2 gap-5 md:gap-6">
          <Link
            to="/report-lost"
            className="minimal-action-card flex items-center gap-5 p-6 md:p-8 bg-white border border-[#eadfda] rounded-2xl transition-all group"
          >
            <div className="w-16 h-16 rounded-2xl bg-burgundy-50 border border-burgundy-100 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-8 h-8 text-burgundy-700" />
            </div>
            <div>
              <h3 className="font-bold text-text-dark text-xl md:text-2xl group-hover:text-burgundy-600 transition-colors">Báo mất đồ</h3>
              <p className="text-base leading-relaxed text-warm-gray-500">Tạo bài đăng về vật phẩm bị mất để mọi người hỗ trợ tìm kiếm</p>
            </div>
          </Link>
          
          <Link
            to="/report-found"
            className="minimal-action-card flex items-center gap-5 p-6 md:p-8 bg-white border border-[#eadfda] rounded-2xl transition-all group"
          >
            <div className="w-16 h-16 rounded-2xl bg-[#fbf5e8] border border-[#ecdfc1] flex items-center justify-center shrink-0">
              <HelpCircle className="w-8 h-8 text-champagne-600" />
            </div>
            <div>
              <h3 className="font-bold text-text-dark text-xl md:text-2xl group-hover:text-champagne-600 transition-colors">Báo nhặt được</h3>
              <p className="text-base leading-relaxed text-warm-gray-500">Thông báo vật phẩm bạn nhặt được để trao trả đúng chủ nhân</p>
            </div>
          </Link>
        </div>
      </section>

      {/* Recent Items */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl md:text-4xl font-sans font-extrabold tracking-tight text-gray-900">Vật phẩm mới nhất</h2>
            <p className="text-warm-gray-500 text-base md:text-lg mt-2">Các vật phẩm mới được đăng gần đây trong cộng đồng DNTU</p>
          </div>
          <Link to="/search" className="text-burgundy-600 hover:text-burgundy-800 font-semibold text-base flex items-center gap-1 group shrink-0">
            Xem tất cả <span className="group-hover:translate-x-1 transition-transform">→</span>
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-7">
            <LoadingSkeleton type="card" count={4} />
          </div>
        ) : items.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-7">
            {items.map(item => (
              <ItemCard 
                key={item.id} 
                item={item} 
                onClick={(item) => navigate(`/items/${item.id}`)} 
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-white rounded-xl border border-dashed border-gray-200">
            <p className="text-warm-gray-500">Chưa có vật phẩm nào được đăng.</p>
          </div>
        )}
      </section>

      {/* Returned Items */}
      {returnedItems.length > 0 && (
        <section className="bg-white border-y border-[#eee7e2] py-16 md:py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <h2 className="text-3xl md:text-4xl font-sans font-extrabold tracking-tight text-gray-900">Vật phẩm đã được trao trả</h2>
                  <p className="text-warm-gray-500 text-base md:text-lg mt-1">Những câu chuyện thành công - đồ vật đã tìm về đúng chủ nhân 🎉</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-7">
              {returnedItems.map(item => (
                <div key={item.id} className="relative">
                  <ItemCard 
                    item={item} 
                    onClick={(item) => navigate(`/items/${item.id}`)} 
                  />
                  <div className="absolute top-3 right-3 bg-green-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow">
                    ĐÃ TRẢ
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Campus / Stats Section */}
      <section className="py-16 md:py-24 bg-[#4d0b13] text-white relative overflow-hidden">
        {/* Decorative */}
        <div className="absolute inset-0 opacity-5 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:20px_20px] pointer-events-none" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-12">
            <span className="inline-block px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-sm text-cream-100 text-sm font-semibold tracking-wide border border-white/10 mb-4">
              Không gian DNTU
            </span>
            <h2 className="text-3xl md:text-4xl font-sans font-extrabold tracking-tight text-white mb-3">
              Thống kê hoạt động <span className="text-champagne-300">UniFind</span>
            </h2>
            <p className="text-cream-100/80 text-base max-w-2xl mx-auto">
              Cùng nhìn lại hành trình kết nối cộng đồng, giúp sinh viên DNTU tìm lại những đồ vật quan trọng
            </p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            <div className="minimal-stat-card rounded-2xl p-7 md:p-8 border border-white/15 text-center">
              <Package className="w-8 h-8 text-champagne-400 mx-auto mb-3" />
              <p className="text-3xl md:text-4xl font-bold text-white">{stats.total}</p>
              <p className="text-cream-200/80 text-base mt-2">Tổng bài đăng</p>
            </div>
            <div className="minimal-stat-card rounded-2xl p-7 md:p-8 border border-white/15 text-center">
              <AlertTriangle className="w-8 h-8 text-red-300 mx-auto mb-3" />
              <p className="text-3xl md:text-4xl font-bold text-white">{stats.lost}</p>
              <p className="text-cream-200/80 text-base mt-2">Đang tìm kiếm</p>
            </div>
            <div className="minimal-stat-card rounded-2xl p-7 md:p-8 border border-white/15 text-center">
              <HelpCircle className="w-8 h-8 text-amber-300 mx-auto mb-3" />
              <p className="text-3xl md:text-4xl font-bold text-white">{stats.found}</p>
              <p className="text-cream-200/80 text-base mt-2">Đã nhặt được</p>
            </div>
            <div className="minimal-stat-card rounded-2xl p-7 md:p-8 border border-white/15 text-center">
              <CheckCircle className="w-8 h-8 text-green-300 mx-auto mb-3" />
              <p className="text-3xl md:text-4xl font-bold text-white">{stats.returned}</p>
              <p className="text-cream-200/80 text-base mt-2">Đã trao trả</p>
            </div>
          </div>

          {/* Campus Locations Preview */}
          <div className="mt-10 grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { icon: Building2, name: 'Thư viện' },
              { icon: GraduationCap, name: 'Giảng đường' },
              { icon: MapPin, name: 'Căng tin' },
              { icon: TrendingUp, name: 'Sân thể thao' },
            ].map(loc => (
              <div key={loc.name} className="flex items-center gap-2.5 bg-white/5 rounded-lg px-4 py-3 border border-white/10">
                <loc.icon className="w-4 h-4 text-champagne-400 shrink-0" />
                <span className="text-base text-cream-100">{loc.name}</span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
