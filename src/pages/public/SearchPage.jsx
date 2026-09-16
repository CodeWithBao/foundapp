import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Search, X, SlidersHorizontal, PackageSearch } from 'lucide-react';
import itemService from '../../services/itemService';
import { STORAGE_KEYS } from '../../constants';
import storageService from '../../services/storageService';
import ItemCard from '../../components/common/ItemCard';
import Pagination from '../../components/common/Pagination';
import EmptyState from '../../components/common/EmptyState';
import Select from '../../components/common/Select';
import Button from '../../components/common/Button';
import LoadingSkeleton from '../../components/common/LoadingSkeleton';
import { useDebounce } from '../../hooks';

export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Using page from URL or default to 1
  const initialPage = parseInt(searchParams.get('page')) || 1;
  const [page, setPage] = useState(initialPage);
  
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const perPage = 12;

  const [filters, setFilters] = useState({
    search: searchParams.get('q') || '',
    type: searchParams.get('type') || 'all',
    category: searchParams.get('category') || 'all',
    location: searchParams.get('location') || 'all',
    sort: searchParams.get('sort') || 'newest',
  });

  const debouncedSearch = useDebounce(filters.search, 400);

  const categories = storageService.get(STORAGE_KEYS.CATEGORIES) || [];
  const locations = storageService.get(STORAGE_KEYS.LOCATIONS) || [];

  const categoryOptions = [{ value: 'all', label: 'Tất cả danh mục' }, ...categories.map(c => ({ value: c.name, label: c.name }))];
  const locationOptions = [{ value: 'all', label: 'Tất cả địa điểm' }, ...locations.map(l => ({ value: l.name, label: l.name }))];
  const sortOptions = [
    { value: 'newest', label: 'Mới nhất' },
    { value: 'oldest', label: 'Cũ nhất' },
    { value: 'views', label: 'Xem nhiều nhất' },
  ];

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

  // Sync filters to URL
  useEffect(() => {
    const params = {};
    if (debouncedSearch) params.q = debouncedSearch;
    if (filters.type !== 'all') params.type = filters.type;
    if (filters.category !== 'all') params.category = filters.category;
    if (filters.location !== 'all') params.location = filters.location;
    if (filters.sort !== 'newest') params.sort = filters.sort;
    if (page > 1) params.page = page.toString();
    setSearchParams(params, { replace: true });
  }, [debouncedSearch, filters.type, filters.category, filters.location, filters.sort, page, setSearchParams]);

  // Reset page to 1 when filters change (except page)
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, filters.type, filters.category, filters.location, filters.sort]);

  const updateFilter = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({ search: '', type: 'all', category: 'all', location: 'all', sort: 'newest' });
    setPage(1);
  };

  const activeFilterCount = [filters.type, filters.category, filters.location].filter(v => v !== 'all').length;
  const paginatedItems = items.slice((page - 1) * perPage, page * perPage);

  return (
    <div className="bg-cream-50 min-h-screen pb-12">
      {/* Header Area */}
      <div className="bg-white border-b border-warm-gray-200 sticky top-[64px] z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <h1 className="text-2xl md:text-3xl font-serif font-bold text-gray-900 flex items-center gap-2">
              <PackageSearch className="w-8 h-8 text-burgundy-600" />
              Tìm kiếm vật phẩm
            </h1>
          </div>

          {/* Large Search Bar & Filters */}
          <div className="space-y-4">
            <form onSubmit={e => { e.preventDefault(); fetchItems(); }} className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-warm-gray-400" />
                <input
                  type="text"
                  value={filters.search}
                  onChange={e => updateFilter('search', e.target.value)}
                  placeholder="Tìm theo tên, mô tả, đặc điểm nhận dạng..."
                  className="w-full pl-12 pr-10 py-3.5 bg-white border border-warm-gray-200 rounded-xl text-gray-900 placeholder-warm-gray-400 focus:outline-none focus:ring-2 focus:ring-burgundy-500 focus:border-transparent transition-all shadow-sm text-base"
                />
                {filters.search && (
                  <button type="button" onClick={() => updateFilter('search', '')} className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 hover:bg-warm-gray-100 rounded-full transition-colors">
                    <X className="w-4 h-4 text-warm-gray-500" />
                  </button>
                )}
              </div>
              <button
                type="submit"
                className="px-6 py-3.5 bg-burgundy-600 hover:bg-burgundy-700 text-white font-medium rounded-xl transition-colors shadow-sm flex items-center gap-2 shrink-0"
              >
                <Search className="w-4 h-4" />
                <span className="hidden sm:inline">Tìm kiếm</span>
              </button>
              <button
                type="button"
                onClick={() => setShowMobileFilters(!showMobileFilters)}
                className={`md:hidden flex items-center justify-center w-12 border rounded-xl transition-colors ${showMobileFilters ? 'bg-burgundy-50 border-burgundy-200 text-burgundy-700' : 'bg-white border-warm-gray-200 text-gray-700'}`}
              >
                <SlidersHorizontal className="w-5 h-5" />
                {activeFilterCount > 0 && (
                  <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-burgundy-500 rounded-full" />
                )}
              </button>
            </form>

            {/* Desktop Filters / Toggleable Mobile Filters */}
            <div className={`${showMobileFilters ? 'block' : 'hidden'} md:block bg-warm-gray-50/50 md:bg-transparent p-4 md:p-0 rounded-xl md:rounded-none border md:border-none border-warm-gray-200`}>
              <div className="flex flex-col md:flex-row gap-3 md:items-center">
                
                {/* Type Filter Pills */}
                <div className="flex p-1 bg-warm-gray-100/80 rounded-xl shrink-0 overflow-x-auto hide-scrollbar border border-warm-gray-200/60">
                  {[
                    { id: 'all', label: 'Tất cả' },
                    { id: 'LOST', label: 'Đã mất' },
                    { id: 'FOUND', label: 'Đã nhặt được' }
                  ].map(t => (
                    <button
                      key={t.id}
                      onClick={() => updateFilter('type', t.id)}
                      className={`px-4 py-2 text-sm font-medium rounded-lg whitespace-nowrap transition-all ${filters.type === t.id ? 'bg-white text-burgundy-800 shadow-sm font-semibold' : 'text-warm-gray-600 hover:text-gray-900 hover:bg-white/50'}`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>

                <div className="h-8 w-px bg-warm-gray-200 hidden md:block mx-1"></div>

                {/* Dropdown Filters */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 flex-1">
                  <Select 
                    options={categoryOptions} 
                    value={filters.category} 
                    onChange={e => updateFilter('category', e.target.value)} 
                    className="w-full"
                  />
                  <Select 
                    options={locationOptions} 
                    value={filters.location} 
                    onChange={e => updateFilter('location', e.target.value)}
                    className="w-full" 
                  />
                  <Select 
                    options={sortOptions} 
                    value={filters.sort} 
                    onChange={e => updateFilter('sort', e.target.value)} 
                    className="w-full"
                  />
                </div>

                {activeFilterCount > 0 && (
                  <Button variant="ghost" onClick={clearFilters} className="shrink-0 text-burgundy-600 hover:bg-burgundy-50">
                    Xóa lọc
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Results Info */}
        <div className="mb-6 flex items-center text-sm text-warm-gray-600">
          {!loading && (
            <span>
              Tìm thấy <strong className="text-gray-900 font-semibold">{items.length}</strong> kết quả
              {debouncedSearch && <span> cho từ khóa "<strong className="text-gray-900">{debouncedSearch}</strong>"</span>}
            </span>
          )}
        </div>

        {/* Results Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
            <LoadingSkeleton type="card" count={8} />
          </div>
        ) : items.length === 0 ? (
          <EmptyState
            icon={PackageSearch}
            title="Không tìm thấy vật phẩm nào"
            description="Thử thay đổi từ khóa tìm kiếm hoặc xóa bớt các bộ lọc."
            action="Xóa bộ lọc"
            onAction={clearFilters}
          />
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
              {paginatedItems.map(item => (
                <ItemCard 
                  key={item.id} 
                  item={item} 
                  onClick={() => navigate(`/items/${item.id}`)} 
                />
              ))}
            </div>
            
            {items.length > perPage && (
              <div className="mt-8 flex justify-center">
                <Pagination 
                  current={page} 
                  total={items.length} 
                  perPage={perPage} 
                  onPageChange={(p) => {
                    setPage(p);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }} 
                />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
