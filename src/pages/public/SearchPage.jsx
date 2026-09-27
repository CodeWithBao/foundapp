import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useSearchParams, useNavigate, useNavigationType } from 'react-router-dom';
import {
  Search, SlidersHorizontal, PackageSearch, LayoutGrid, List,
  RotateCcw, ChevronLeft, ChevronRight, X
} from 'lucide-react';
import itemService from '../../services/itemService';
import { STORAGE_KEYS } from '../../constants';
import storageService from '../../services/storageService';
import scrollRestorationService from '../../services/scrollRestorationService';
import ItemCard from '../../components/common/ItemCard';
import CategoryIcon from '../../components/common/CategoryIcon';
import EmptyState from '../../components/common/EmptyState';
import LoadingSkeleton from '../../components/common/LoadingSkeleton';
import { useDebounce } from '../../hooks';

const POPULAR_SEARCH_TAGS = [
  'iPhone', 'Ví', 'Thẻ sinh viên', 'AirPods', 'Balo', 'Chìa khóa', 'Laptop', 'Mũ bảo hiểm', 'Sổ tay'
];

const SIDEBAR_CATEGORIES = [
  { name: 'Điện thoại', alias: ['Điện thoại', 'iPhone', 'Samsung'] },
  { name: 'Ví, bóp', alias: ['Ví / Bóp', 'Ví da', 'Bóp'] },
  { name: 'Thẻ sinh viên', alias: ['Thẻ sinh viên', 'Thẻ'] },
  { name: 'Chìa khóa', alias: ['Chìa khóa', 'Chìa khóa xe'] },
  { name: 'Tai nghe', alias: ['Tai nghe', 'AirPods', 'Headphone'] },
  { name: 'Laptop', alias: ['Laptop', 'Máy tính'] },
  { name: 'Balo, túi xách', alias: ['Balo / Túi xách', 'Balo', 'Túi xách'] },
  { name: 'Đồng hồ, trang sức', alias: ['Đồng hồ', 'Trang sức'] },
  { name: 'Sách vở, giấy tờ', alias: ['Sách / Tài liệu', 'Sách vở', 'Tài liệu'] },
  { name: 'Khác', alias: ['Khác', 'Bình nước', 'Kính', 'Quần áo', 'Thiết bị điện tử'] }
];

export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const navType = useNavigationType();

  // Khôi phục snapshot khi quay lại từ nút Back / POP
  const initialSnapshot = useMemo(() => {
    return navType === 'POP' ? scrollRestorationService.getSnapshot('/search') : null;
  }, [navType]);
  
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState(initialSnapshot?.extra?.viewMode || 'grid'); // 'grid' | 'list'
  
  const initialPage = initialSnapshot?.extra?.page || parseInt(searchParams.get('page')) || 1;
  const [page, setPage] = useState(initialPage);
  const [perPage, setPerPage] = useState(initialSnapshot?.extra?.perPage || 12);
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  const [filters, setFilters] = useState(() => {
    if (initialSnapshot?.extra?.filters) {
      return initialSnapshot.extra.filters;
    }
    return {
      search: searchParams.get('q') || '',
      type: searchParams.get('type') || 'all',
      category: searchParams.get('category') || 'all',
      location: searchParams.get('location') || 'all',
      timeRange: searchParams.get('time') || 'all',
      sort: searchParams.get('sort') || 'newest',
    };
  });

  const debouncedSearch = useDebounce(filters.search, 300);

  const locations = useMemo(() => {
    return storageService.get(STORAGE_KEYS.LOCATIONS) || [
      { name: 'Khu giảng đường A' },
      { name: 'Khu giảng đường B' },
      { name: 'Thư viện DNTU' },
      { name: 'Căng tin sinh viên' },
      { name: 'Nhà thi đấu' },
      { name: 'Bãi xe sinh viên' },
      { name: 'Khu tự học' },
      { name: 'Khu ký túc xá' }
    ];
  }, []);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const data = await itemService.getItems({
        ...filters,
        search: debouncedSearch,
      });
      setItems(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, filters.type, filters.category, filters.location, filters.sort]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  // Sync to URL query parameters
  useEffect(() => {
    const params = {};
    if (debouncedSearch) params.q = debouncedSearch;
    if (filters.type !== 'all') params.type = filters.type;
    if (filters.category !== 'all') params.category = filters.category;
    if (filters.location !== 'all') params.location = filters.location;
    if (filters.timeRange !== 'all') params.time = filters.timeRange;
    if (filters.sort !== 'newest') params.sort = filters.sort;
    if (page > 1) params.page = page.toString();
    setSearchParams(params, { replace: true });
  }, [debouncedSearch, filters.type, filters.category, filters.location, filters.timeRange, filters.sort, page, setSearchParams]);

  // Ngăn reset trang về 1 khi trang vừa mount (giữ đúng trang phân trang khi quay lại)
  const isFirstFilterRun = useRef(true);
  useEffect(() => {
    if (isFirstFilterRun.current) {
      isFirstFilterRun.current = false;
      return;
    }
    setPage(1);
  }, [debouncedSearch, filters.type, filters.category, filters.location, filters.timeRange, filters.sort]);

  const shouldRestoreRef = useRef(navType === 'POP');

  // Yêu cầu 5: Nếu chủ động vào danh sách / tìm kiếm mới (PUSH), bắt đầu ở đầu trang
  useEffect(() => {
    if (navType !== 'POP') {
      scrollRestorationService.clearSnapshot();
      window.scrollTo({ top: 0, behavior: 'instant' });
    }
  }, [navType]);

  // Yêu cầu 1, 2, 4: Sau khi dữ liệu tải xong, đưa bài vừa xem trở lại đúng vị trí trên màn hình
  useEffect(() => {
    if (!loading && shouldRestoreRef.current) {
      const snapshot = scrollRestorationService.getSnapshot('/search');
      if (snapshot) {
        scrollRestorationService.restorePosition({
          itemId: snapshot.itemId,
          cardTop: snapshot.cardTop,
          scrollY: snapshot.scrollY,
          onComplete: () => {
            scrollRestorationService.consumeSnapshot();
            shouldRestoreRef.current = false;
          }
        });
      } else {
        shouldRestoreRef.current = false;
      }
    }
  }, [loading]);

  // Lưu vị trí cuộn và ID bài viết trước khi mở trang chi tiết
  const handleItemClick = (item, e) => {
    const cardEl = document.getElementById(`item-card-${item.id}`) || e?.currentTarget;
    const cardTop = cardEl ? cardEl.getBoundingClientRect().top : null;
    scrollRestorationService.saveSnapshot({
      path: '/search',
      fullPath: window.location.pathname + window.location.search,
      scrollY: window.scrollY || document.documentElement.scrollTop || 0,
      itemId: item.id,
      cardTop,
      extra: {
        page,
        perPage,
        viewMode,
        filters,
      }
    });
    navigate(`/items/${item.id}`, {
      state: {
        from: window.location.pathname + window.location.search,
        itemId: item.id,
        scrollY: window.scrollY || document.documentElement.scrollTop || 0,
      }
    });
  };

  const updateFilter = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      type: 'all',
      category: 'all',
      location: 'all',
      timeRange: 'all',
      sort: 'newest'
    });
    setPage(1);
  };

  // Filter items in frontend to ensure quick filtering
  const filteredItems = useMemo(() => {
    return items.filter(item => {
      // Type filter
      if (filters.type !== 'all') {
        const itemType = item.type || item.status;
        if (filters.type === 'FOUND' && itemType !== 'FOUND') return false;
        if (filters.type === 'LOST' && itemType !== 'LOST') return false;
      }

      // Category filter
      if (filters.category !== 'all') {
        const matchCat = SIDEBAR_CATEGORIES.find(c => c.name === filters.category);
        const itemCat = typeof item.category === 'object' ? item.category?.name : (item.categoryName || item.category || '');
        if (matchCat) {
          const matched = matchCat.alias.some(a => itemCat.toLowerCase().includes(a.toLowerCase())) ||
                          itemCat.toLowerCase().includes(matchCat.name.toLowerCase());
          if (!matched) return false;
        } else if (!itemCat.toLowerCase().includes(filters.category.toLowerCase())) {
          return false;
        }
      }

      // Location filter
      if (filters.location !== 'all') {
        const itemLoc = typeof item.location === 'object' ? item.location?.name : (item.locationName || item.location || '');
        if (!itemLoc.toLowerCase().includes(filters.location.toLowerCase())) {
          return false;
        }
      }

      // Time range filter
      if (filters.timeRange !== 'all') {
        const itemDate = new Date(item.date || item.createdAt);
        const now = new Date();
        const diffHours = (now - itemDate) / (1000 * 60 * 60);
        if (filters.timeRange === '24h' && diffHours > 24) return false;
        if (filters.timeRange === '7d' && diffHours > 24 * 7) return false;
        if (filters.timeRange === '30d' && diffHours > 24 * 30) return false;
      }

      // Fast in-memory search filter
      if (filters.search && filters.search.trim()) {
        const q = filters.search.trim().toLowerCase();
        const title = (item.title || '').toLowerCase();
        const desc = (item.description || '').toLowerCase();
        const cat = (typeof item.category === 'object' ? item.category?.name : (item.categoryName || item.category || '')).toLowerCase();
        const loc = (typeof item.location === 'object' ? item.location?.name : (item.locationName || item.location || '')).toLowerCase();
        if (!title.includes(q) && !desc.includes(q) && !cat.includes(q) && !loc.includes(q)) {
          return false;
        }
      }

      return true;
    });
  }, [items, filters]);

  // Statistics for Status checkboxes
  const totalCount = items.length;
  const foundCount = items.filter(i => (i.type || i.status) === 'FOUND').length;
  const lostCount = items.filter(i => (i.type || i.status) === 'LOST').length;

  // Pagination calculation
  const totalPages = Math.max(1, Math.ceil(filteredItems.length / perPage));
  const paginatedItems = filteredItems.slice((page - 1) * perPage, page * perPage);

  return (
    <div className="min-h-screen bg-[#F8F6F3] pb-16 font-sans">
      {/* Hero Banner Area according to mockup 04_search.png */}
      <section className="relative overflow-hidden bg-[#3F0A0D] text-white border-b border-[#E8E2DD]">
        {/* Background photo of DNTU campus entrance & monument */}
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-45 mix-blend-luminosity scale-105"
          style={{ backgroundImage: `url('/DNTU_Web_Asset_Kit/asset/campus_colorful_building.jpg')` }}
        />
        {/* Gradient backdrop */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#FAF8F5] via-[#FAF8F5]/90 to-transparent" />
        
        <div className="relative page-container py-10 md:py-14">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
            <div className="lg:col-span-8 space-y-4">
              <span className="inline-block text-[11px] sm:text-xs font-bold uppercase tracking-widest text-[#741216]">
                CÙNG NHAU TẠO NÊN MỘT DNTU TỐT ĐẸP HƠN
              </span>
              
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-serif font-black text-[#741216] tracking-tight leading-tight">
                Tìm kiếm đồ thất lạc tại DNTU
              </h1>
              
              <p className="text-sm sm:text-base text-gray-700 max-w-2xl leading-relaxed">
                Hàng nghìn đồ vật đang chờ được trả về. Hãy tìm và kết nối để lan tỏa những giá trị tốt đẹp!
              </p>

              {/* Big Pill Search Input */}
              <div className="pt-2">
                <form
                  onSubmit={e => { e.preventDefault(); fetchItems(); }}
                  className="bg-white rounded-full p-1.5 pl-4 sm:pl-6 shadow-md border border-gray-200/90 flex items-center max-w-2xl focus-within:ring-2 focus-within:ring-[#981B1E]/20 focus-within:border-[#981B1E] transition-all"
                >
                  <Search className="w-5 h-5 text-gray-400 mr-2.5 sm:mr-3 shrink-0" />
                  <input
                    type="text"
                    value={filters.search}
                    onChange={e => updateFilter('search', e.target.value)}
                    placeholder="Tìm kiếm đồ thất lạc (ví, thẻ SV, điện thoại...)"
                    className="flex-1 min-w-0 bg-transparent border-none text-sm sm:text-base text-gray-900 placeholder:text-gray-400 focus:outline-none"
                  />
                  {filters.search && (
                    <button
                      type="button"
                      onClick={() => updateFilter('search', '')}
                      className="p-1 text-gray-400 hover:text-gray-600 transition-colors mr-1 sm:mr-2"
                      aria-label="Xóa nội dung tìm kiếm"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    type="submit"
                    className="bg-[#741216] text-white px-4 sm:px-7 py-2 sm:py-2.5 rounded-full font-semibold text-xs sm:text-sm hover:bg-[#8e171c] transition-colors shadow-sm shrink-0"
                  >
                    Tìm kiếm
                  </button>
                </form>
              </div>

              {/* Popular tags row */}
              <div className="flex flex-wrap items-center gap-2 pt-2 text-xs text-gray-700">
                <span className="font-medium text-gray-800">Từ khóa phổ biến:</span>
                {POPULAR_SEARCH_TAGS.map(tag => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => updateFilter('search', tag)}
                    className="px-3 py-1 bg-white/90 hover:bg-white text-gray-700 hover:text-[#741216] rounded-full border border-gray-200 shadow-2xs transition-colors"
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>

            {/* Right side handwritten slogan over campus background */}
            <div className="hidden lg:flex lg:col-span-4 flex-col items-end justify-center self-end pr-4 pb-2">
              <span className="font-['Caveat'] text-2xl xl:text-3xl text-white drop-shadow-md text-right leading-snug">
                Một cộng đồng tử tế<br />luôn tìm thấy nhau ♡
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content Area: Sidebar + Results */}
      <div className="page-container py-8">
        {/* Mobile Filter Toggle */}
        <div className="lg:hidden mb-4 flex items-center justify-between">
          <button
            type="button"
            onClick={() => setShowMobileFilters(!showMobileFilters)}
            className="flex items-center gap-2 px-4 py-2 bg-white rounded-xl border border-gray-200 text-sm font-semibold text-gray-800 shadow-2xs"
          >
            <SlidersHorizontal className="w-4 h-4 text-[#741216]" />
            <span>Bộ lọc tìm kiếm</span>
          </button>
          <span className="text-xs text-gray-500 font-mono">
            {filteredItems.length} kết quả
          </span>
        </div>

        <div className="flex flex-col lg:flex-row gap-6 xl:gap-8 items-start">
          {/* Left Sidebar: Filter Panel */}
          <aside className={`w-full lg:w-[260px] xl:w-[280px] shrink-0 bg-white rounded-2xl border border-[#E8E2DD] p-5 shadow-2xs space-y-6 ${showMobileFilters ? 'block' : 'hidden lg:block'}`}>
            {/* Header: Title & Reset */}
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-[#741216]" />
                <h3 className="font-bold text-gray-900 text-[15px]">Bộ lọc tìm kiếm</h3>
              </div>
              <button
                type="button"
                onClick={clearFilters}
                className="text-xs font-semibold text-[#741216] hover:underline"
              >
                Đặt lại
              </button>
            </div>

            {/* Section 1: Danh mục */}
            <div>
              <h4 className="font-bold text-sm text-gray-800 mb-2.5">Danh mục</h4>
              <select
                value={filters.category}
                onChange={e => updateFilter('category', e.target.value)}
                className="w-full text-xs sm:text-sm bg-[#FAF8F5] border border-gray-200 rounded-xl px-3 py-2 text-gray-800 focus:outline-none focus:ring-1 focus:ring-[#741216] mb-3"
              >
                <option value="all">Tất cả danh mục</option>
                {SIDEBAR_CATEGORIES.map(cat => (
                  <option key={cat.name} value={cat.name}>{cat.name}</option>
                ))}
              </select>

              {/* Vertical Category clickable list with icons matching mockup */}
              <div className="space-y-1">
                {SIDEBAR_CATEGORIES.map(cat => {
                  const isActive = filters.category === cat.name;
                  return (
                    <button
                      key={cat.name}
                      type="button"
                      onClick={() => updateFilter('category', isActive ? 'all' : cat.name)}
                      className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs transition-colors text-left ${
                        isActive 
                          ? 'bg-red-50 text-[#741216] font-bold border-l-2 border-[#741216]' 
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                      }`}
                    >
                      <CategoryIcon category={cat.name} className={`w-4 h-4 shrink-0 ${isActive ? 'text-[#741216]' : 'text-gray-400'}`} />
                      <span className="truncate">{cat.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Section 2: Trạng thái */}
            <div className="pt-2 border-t border-gray-100">
              <h4 className="font-bold text-sm text-gray-800 mb-2.5">Trạng thái</h4>
              <div className="space-y-2">
                <label className="flex items-center justify-between text-xs text-gray-700 cursor-pointer hover:text-gray-900">
                  <div className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="item_type"
                      checked={filters.type === 'all'}
                      onChange={() => updateFilter('type', 'all')}
                      className="accent-[#741216] rounded"
                    />
                    <span>Tất cả</span>
                  </div>
                  <span className="text-[11px] text-gray-400 font-mono">{totalCount}</span>
                </label>

                <label className="flex items-center justify-between text-xs text-gray-700 cursor-pointer hover:text-gray-900">
                  <div className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="item_type"
                      checked={filters.type === 'FOUND'}
                      onChange={() => updateFilter('type', 'FOUND')}
                      className="accent-[#741216] rounded"
                    />
                    <span>Đã nhặt được</span>
                  </div>
                  <span className="text-[11px] text-gray-400 font-mono">{foundCount}</span>
                </label>

                <label className="flex items-center justify-between text-xs text-gray-700 cursor-pointer hover:text-gray-900">
                  <div className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="item_type"
                      checked={filters.type === 'LOST'}
                      onChange={() => updateFilter('type', 'LOST')}
                      className="accent-[#741216] rounded"
                    />
                    <span>Đã đánh mất</span>
                  </div>
                  <span className="text-[11px] text-gray-400 font-mono">{lostCount}</span>
                </label>
              </div>
            </div>

            {/* Section 3: Địa điểm */}
            <div className="pt-2 border-t border-gray-100">
              <h4 className="font-bold text-sm text-gray-800 mb-2.5">Địa điểm</h4>
              <select
                value={filters.location}
                onChange={e => updateFilter('location', e.target.value)}
                className="w-full text-xs sm:text-sm bg-[#FAF8F5] border border-gray-200 rounded-xl px-3 py-2 text-gray-800 focus:outline-none focus:ring-1 focus:ring-[#741216]"
              >
                <option value="all">Tất cả địa điểm</option>
                {locations.map((loc, idx) => (
                  <option key={idx} value={loc.name}>{loc.name}</option>
                ))}
              </select>
            </div>

            {/* Section 4: Thời gian */}
            <div className="pt-2 border-t border-gray-100">
              <h4 className="font-bold text-sm text-gray-800 mb-2.5">Thời gian</h4>
              <select
                value={filters.timeRange}
                onChange={e => updateFilter('timeRange', e.target.value)}
                className="w-full text-xs sm:text-sm bg-[#FAF8F5] border border-gray-200 rounded-xl px-3 py-2 text-gray-800 focus:outline-none focus:ring-1 focus:ring-[#741216]"
              >
                <option value="all">Tất cả thời gian</option>
                <option value="24h">24 giờ qua</option>
                <option value="7d">7 ngày qua</option>
                <option value="30d">30 ngày qua</option>
              </select>
            </div>

            {/* Apply Button */}
            <button
              type="button"
              onClick={fetchItems}
              className="w-full bg-[#741216] text-white py-2.5 rounded-xl font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 hover:bg-[#8b161b] transition shadow-xs"
            >
              <Search className="w-4 h-4" />
              <span>Áp dụng bộ lọc</span>
            </button>
          </aside>

          {/* Right Area: Results Grid */}
          <main className="flex-1 min-w-0 space-y-6 w-full">
            {/* Header: Title, count, sorting & layout toggle */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-gray-200">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Kết quả tìm kiếm</h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  Hiển thị {filteredItems.length === 0 ? 0 : (page - 1) * perPage + 1} - {Math.min(page * perPage, filteredItems.length)} trong {filteredItems.length} kết quả
                </p>
              </div>

              <div className="flex items-center gap-3 self-end sm:self-auto">
                <div className="flex items-center gap-2 text-xs text-gray-600">
                  <span>Sắp xếp theo:</span>
                  <select
                    value={filters.sort}
                    onChange={e => updateFilter('sort', e.target.value)}
                    className="bg-white border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs text-gray-800 focus:outline-none focus:ring-1 focus:ring-[#741216]"
                  >
                    <option value="newest">Mới nhất</option>
                    <option value="oldest">Cũ nhất</option>
                    <option value="views">Xem nhiều nhất</option>
                  </select>
                </div>

                {/* View switcher buttons */}
                <div className="flex items-center border border-gray-200 rounded-lg p-0.5 bg-white">
                  <button
                    type="button"
                    onClick={() => setViewMode('grid')}
                    className={`p-1.5 rounded-md transition-colors ${
                      viewMode === 'grid' ? 'bg-[#741216] text-white' : 'text-gray-400 hover:text-gray-700'
                    }`}
                    aria-label="Lưới"
                  >
                    <LayoutGrid className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode('list')}
                    className={`p-1.5 rounded-md transition-colors ${
                      viewMode === 'list' ? 'bg-[#741216] text-white' : 'text-gray-400 hover:text-gray-700'
                    }`}
                    aria-label="Danh sách"
                  >
                    <List className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Results Grid / List */}
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-5">
                <LoadingSkeleton type="card" count={8} />
              </div>
            ) : filteredItems.length === 0 ? (
              <EmptyState
                icon={PackageSearch}
                title="Không tìm thấy vật phẩm phù hợp"
                description="Hãy thử thay đổi từ khóa, chọn lại danh mục hoặc xóa bộ lọc để tìm lại."
                action="Xóa toàn bộ bộ lọc"
                onAction={clearFilters}
              />
            ) : (
              <div className={viewMode === 'list' ? 'space-y-4' : 'grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-5'}>
                {paginatedItems.map(item => (
                  <ItemCard
                    key={item.id}
                    item={item}
                    onClick={handleItemClick}
                  />
                ))}
              </div>
            )}

            {/* Pagination Controls */}
            {filteredItems.length > 0 && (
              <div className="pt-6 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-4">
                {/* Page Number Buttons */}
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    disabled={page <= 1}
                    onClick={() => {
                      setPage(p => Math.max(1, p - 1));
                      window.scrollTo({ top: 400, behavior: 'smooth' });
                    }}
                    className="w-8 h-8 rounded-lg border border-gray-200 bg-white text-gray-600 flex items-center justify-center hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed text-sm"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>

                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => {
                    const isActive = p === page;
                    return (
                      <button
                        key={p}
                        type="button"
                        onClick={() => {
                          setPage(p);
                          window.scrollTo({ top: 400, behavior: 'smooth' });
                        }}
                        className={`w-8 h-8 rounded-lg text-xs font-semibold transition-colors ${
                          isActive
                            ? 'bg-[#741216] text-white shadow-xs'
                            : 'border border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        {p}
                      </button>
                    );
                  })}

                  <button
                    type="button"
                    disabled={page >= totalPages}
                    onClick={() => {
                      setPage(p => Math.min(totalPages, p + 1));
                      window.scrollTo({ top: 400, behavior: 'smooth' });
                    }}
                    className="w-8 h-8 rounded-lg border border-gray-200 bg-white text-gray-600 flex items-center justify-center hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed text-sm"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>

                {/* Per Page selector */}
                <div className="flex items-center gap-2 text-xs text-gray-600">
                  <span>Hiển thị</span>
                  <select
                    value={perPage}
                    onChange={e => {
                      setPerPage(Number(e.target.value));
                      setPage(1);
                    }}
                    className="bg-white border border-gray-200 rounded-lg px-2 py-1 text-xs text-gray-800 focus:outline-none"
                  >
                    <option value={12}>12</option>
                    <option value={24}>24</option>
                    <option value={48}>48</option>
                  </select>
                  <span>kết quả/trang</span>
                </div>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
