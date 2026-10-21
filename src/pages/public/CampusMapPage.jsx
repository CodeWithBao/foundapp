import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Search,
  X,
  ChevronRight,
  ExternalLink,
  Compass,
  Layers,
  ArrowRight,
  Sparkles,
  ChevronDown,
  ChevronUp,
  ArrowLeft,
  Camera,
  Maximize2,
  ChevronLeft,
  Minimize2
} from 'lucide-react';
import adminService from '../../services/adminService';
import itemService from '../../services/itemService';
import { getCampusPlaces, parseLocationPhotos, resolveLocationMapKey } from '../../data/locations';

export default function CampusMapPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const placeParam = searchParams.get('place');

  const frame = useRef(null);
  const listRef = useRef(null);
  const mapWorkspaceRef = useRef(null);

  const [locations, setLocations] = useState([]);
  const [items, setItems] = useState([]);
  const [error, setError] = useState('');
  const [selectedPlaceId, setSelectedPlaceId] = useState(() => resolveLocationMapKey(placeParam) || null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all'); // 'all' | 'study' | 'life'
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [expandedDesc, setExpandedDesc] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Lightbox xem ảnh lớn
  const [lightboxIndex, setLightboxIndex] = useState(null); // index trong photoList
  const [mainImageError, setMainImageError] = useState(false);

  // Tải danh mục địa điểm và đồ vật thực tế từ API / Database
  useEffect(() => {
    let live = true;
    Promise.all([adminService.getLocations(), itemService.getMapItems()])
      .then(([locs, posts]) => {
        if (live) {
          setLocations(Array.isArray(locs) ? locs : []);
          setItems(Array.isArray(posts) ? posts : []);
        }
      })
      .catch(err => {
        if (live) setError(err.message || 'Không tải được dữ liệu địa điểm');
      });
    return () => {
      live = false;
    };
  }, []);

  useEffect(() => {
    const handleFullscreenChange = () => setIsFullscreen(document.fullscreenElement === mapWorkspaceRef.current);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const handlePageBack = () => {
    if (window.history.state?.idx > 0 || window.history.length > 1) navigate(-1);
    else navigate('/');
  };

  const handleToggleFullscreen = async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await mapWorkspaceRef.current?.requestFullscreen();
    } catch {
      setError('Trình duyệt không thể mở chế độ toàn màn hình.');
    }
  };

  // Map các địa điểm động từ API theo map_key
  const dynamicLocationMap = useMemo(() => {
    const map = {};
    locations.forEach(loc => {
      const key = resolveLocationMapKey(loc);
      if (key) {
        map[key] = loc;
      }
    });
    return map;
  }, [locations]);

  // Hợp nhất dữ liệu động vào danh sách địa điểm
  const mergedPlaces = useMemo(() => {
    return getCampusPlaces().map(place => {
      const dyn = dynamicLocationMap[place.id];
      const fallbackPhotos = parseLocationPhotos(place.photos);
      const dynamicPhotos = parseLocationPhotos(dyn?.photos);
      const parsedPhotos = dynamicPhotos.length > 0 ? dynamicPhotos : fallbackPhotos;

      let coverPhoto = null;
      if (parsedPhotos.length > 0) {
        const coverObj = parsedPhotos.find(p => p.is_cover) || parsedPhotos[0];
        coverPhoto = coverObj?.url || null;
      } else if (dyn?.image_url || place.image_url) {
        coverPhoto = dyn?.image_url || place.image_url;
      }

      return {
        ...place,
        name: place.name,
        desc: dyn?.description || place.desc,
        photos: parsedPhotos,
        coverPhoto: coverPhoto,
        hasCustomData: Boolean(dyn)
      };
    });
  }, [dynamicLocationMap]);

  // Gom nhóm đồ vật thực tế theo mã bản đồ
  const mapData = useMemo(() => {
    const groups = {};
    const assignedItemIds = new Set();

    locations.forEach(loc => {
      const mapKey = resolveLocationMapKey(loc);
      if (!mapKey) return;

      const locItems = items.filter(item => {
        if (!['LOST', 'FOUND'].includes(item.type) || ['RETURNED', 'CLOSED'].includes(item.status)) {
          return false;
        }
        const itemLocId = item.location_id || item.locationId;
        const itemLoc = item.location?.name || item.location || '';
        const match =
          (itemLocId && String(itemLocId) === String(loc.id)) ||
          (itemLoc &&
            (itemLoc.toLowerCase() === (loc.name || '').toLowerCase() ||
              itemLoc.toLowerCase() === (loc.code || '').toLowerCase()));
        if (match) assignedItemIds.add(item.id);
        return match;
      });

      (groups[mapKey] ||= []).push({
        image_url: loc.image_url || '',
        items: locItems.map(item => ({
          id: item.id,
          type: item.type,
          title: item.title,
          created_at: item.created_at || item.createdAt
        }))
      });
    });

    // Fallback cho items text tự do
    items.forEach(item => {
      if (assignedItemIds.has(item.id)) return;
      if (!['LOST', 'FOUND'].includes(item.type) || ['RETURNED', 'CLOSED'].includes(item.status)) return;
      const mapKey = resolveLocationMapKey(item.location?.name || item.location || item.locationName || item.locationDetails);

      if (mapKey) {
        if (!groups[mapKey]) groups[mapKey] = [{ image_url: '', items: [] }];
        groups[mapKey][0].items.push({
          id: item.id,
          type: item.type,
          title: item.title,
          created_at: item.created_at || item.createdAt
        });
        assignedItemIds.add(item.id);
      }
    });

    return groups;
  }, [locations, items]);

  // Gửi dữ liệu gom nhóm vào iframe
  const sendMapData = () => {
    frame.current?.contentWindow?.postMessage(
      { type: 'UNIFIND_MAP_DATA', places: mapData },
      window.location.origin
    );
  };

  // Đồng bộ chọn địa điểm (hỗ trợ Browser Back / URL Param)
  const handleSelectPlace = (id, pushHistory = true) => {
    if (!id) {
      handleBackToList();
      return;
    }

    setSelectedPlaceId(id);
    setExpandedDesc(false);
    setMainImageError(false);

    if (pushHistory) {
      setSearchParams(
        prev => {
          const next = new URLSearchParams(prev);
          next.set('place', id);
          return next;
        },
        { replace: false }
      );
    }

    frame.current?.contentWindow?.postMessage(
      { type: 'FOCUS_PLACE', id },
      window.location.origin
    );
  };

  // Nút quay lại: "← Danh sách địa điểm"
  const handleBackToList = () => {
    setSelectedPlaceId(null);
    setExpandedDesc(false);
    setLightboxIndex(null);

    setSearchParams(
      prev => {
        const next = new URLSearchParams(prev);
        next.delete('place');
        return next;
      },
      { replace: false }
    );

    // Bỏ chọn marker mà không reload hoặc reset pan/zoom bản đồ
    frame.current?.contentWindow?.postMessage(
      { type: 'DESELECT_PLACE' },
      window.location.origin
    );

    // Trên thiết bị mobile: tự động mở lại drawer danh sách địa điểm
    if (window.innerWidth < 1024) {
      setMobileDrawerOpen(true);
    }
  };

  // Lắng nghe thay đổi của URL param `place` (khi người dùng bấm Back / Forward trên trình duyệt)
  useEffect(() => {
    if (placeParam) {
      const normalizedPlaceParam = resolveLocationMapKey(placeParam);
      if (normalizedPlaceParam && normalizedPlaceParam !== selectedPlaceId) {
        setSelectedPlaceId(normalizedPlaceParam);
        setExpandedDesc(false);
        setMainImageError(false);
        frame.current?.contentWindow?.postMessage(
            { type: 'FOCUS_PLACE', id: normalizedPlaceParam },
          window.location.origin
        );
      }
    } else if (selectedPlaceId) {
      setSelectedPlaceId(null);
      setExpandedDesc(false);
      frame.current?.contentWindow?.postMessage(
        { type: 'DESELECT_PLACE' },
        window.location.origin
      );
    }
  }, [placeParam]);

  // Nhận message từ iframe (khi người dùng click marker 3D trên bản đồ)
  useEffect(() => {
    const onMessage = event => {
      if (event.origin !== window.location.origin || event.source !== frame.current?.contentWindow) return;
      if (event.data?.type === 'UNIFIND_MAP_READY') {
        sendMapData();
        if (selectedPlaceId) {
          frame.current?.contentWindow?.postMessage(
            { type: 'FOCUS_PLACE', id: selectedPlaceId },
            window.location.origin
          );
        }
      } else if (event.data?.type === 'UNIFIND_PLACE_CLICKED') {
        let clickedId = event.data.id;
        if (clickedId === 'GATE_IN' || clickedId === 'GATE_OUT') clickedId = 'GATE';
        handleSelectPlace(clickedId, true);

        // Cuộn item trong list bên trái vào tầm nhìn
        const targetEl = document.getElementById(`place-item-${clickedId}`);
        if (targetEl) {
          targetEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
      }
    };
    window.addEventListener('message', onMessage);
    sendMapData();
    return () => window.removeEventListener('message', onMessage);
  }, [mapData, selectedPlaceId]);

  // Lọc danh sách địa điểm theo tìm kiếm và tab
  const filteredPlaces = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return mergedPlaces.filter(p => {
      const matchType = filterType === 'all' || p.type === filterType;
      const matchQuery =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.desc.toLowerCase().includes(q) ||
        p.categoryName.toLowerCase().includes(q);
      return matchType && matchQuery;
    });
  }, [mergedPlaces, searchQuery, filterType]);

  // Địa điểm đang được chọn chi tiết
  const selectedPlace = useMemo(() => {
    return mergedPlaces.find(p => p.id === selectedPlaceId) || null;
  }, [mergedPlaces, selectedPlaceId]);

  // Danh sách toàn bộ ảnh thực tế của địa điểm đang chọn
  const activePhotos = useMemo(() => {
    if (!selectedPlace) return [];
    if (selectedPlace.photos && selectedPlace.photos.length > 0) {
      return selectedPlace.photos;
    }
    if (selectedPlace.coverPhoto) {
      return [{ id: 'cover', url: selectedPlace.coverPhoto, caption: selectedPlace.name, is_cover: true }];
    }
    return [];
  }, [selectedPlace]);

  // Ảnh đại diện chính đang hiển thị
  const currentCoverPhoto = useMemo(() => {
    if (!selectedPlace) return null;
    if (activePhotos.length > 0) {
      const cover = activePhotos.find(p => p.is_cover);
      return cover || activePhotos[0];
    }
    return null;
  }, [selectedPlace, activePhotos]);

  // Danh sách các ảnh phụ (các ảnh khác ảnh đại diện)
  const extraPhotos = useMemo(() => {
    if (activePhotos.length <= 1) return [];
    if (!currentCoverPhoto) return activePhotos;
    return activePhotos.filter(p => p !== currentCoverPhoto);
  }, [activePhotos, currentCoverPhoto]);

  // Danh sách vật phẩm tại địa điểm đang chọn
  const selectedPlaceItems = useMemo(() => {
    if (!selectedPlaceId) return [];
    return (mapData[selectedPlaceId] || []).flatMap(g => g.items || []);
  }, [selectedPlaceId, mapData]);

  const selectedFoundCount = useMemo(() => {
    return selectedPlaceItems.filter(i => i.type === 'FOUND').length;
  }, [selectedPlaceItems]);

  const selectedLostCount = useMemo(() => {
    return selectedPlaceItems.filter(i => i.type === 'LOST').length;
  }, [selectedPlaceItems]);

  // Tổng quan số liệu toàn campus
  const totalStats = useMemo(() => {
    let found = 0;
    let lost = 0;
    Object.values(mapData).forEach(groupList => {
      groupList.forEach(g => {
        (g.items || []).forEach(item => {
          if (item.type === 'FOUND') found++;
          if (item.type === 'LOST') lost++;
        });
      });
    });
    return { found, lost, total: found + lost };
  }, [mapData]);

  return (
    <div ref={mapWorkspaceRef} className="campus-map-page flex flex-col h-[calc(100vh-7rem)] min-h-[580px] bg-slate-50 overflow-hidden">
      {/* 1. Header tinh gọn */}
      <div className="flex items-center justify-between px-3 py-2 sm:px-6 bg-white border-b border-hairline shrink-0 z-20">
        <div className="flex items-center gap-2.5 min-w-0">
          <button
            type="button"
            onClick={handlePageBack}
            className="inline-flex w-9 h-9 items-center justify-center rounded-lg border border-hairline bg-white text-warm-gray-600 hover:text-[#8F1822] hover:bg-burgundy-50 transition-colors shrink-0"
            aria-label="Quay về trang trước"
            title="Quay về trang trước"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-burgundy-50 text-burgundy-700">
            <Compass className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-bold text-text-dark leading-none">
                Bản đồ Campus DNTU
              </h1>
              <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-champagne-100 text-champagne-800">
                Mô phỏng 3D
              </span>
            </div>
            <p className="text-[12px] text-warm-gray-600 line-clamp-1">
              Khám phá khuôn viên & tra cứu đồ vật nhặt được/thất lạc theo vị trí thực tế
            </p>
          </div>
        </div>

        {/* Thống kê nhanh và nút mở Drawer Mobile */}
        <div className="flex items-center gap-2 sm:gap-4">
          <button
            type="button"
            onClick={handleToggleFullscreen}
            className="inline-flex w-9 h-9 items-center justify-center rounded-lg border border-hairline bg-white text-warm-gray-600 hover:text-[#8F1822] hover:bg-burgundy-50 transition-colors shrink-0"
            aria-label={isFullscreen ? 'Thoát toàn màn hình' : 'Mở toàn màn hình'}
            title={isFullscreen ? 'Thoát toàn màn hình' : 'Mở toàn màn hình'}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
          <div className="hidden md:flex items-center gap-3 text-xs">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              {totalStats.found} đồ nhặt được
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-50 text-rose-700 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
              {totalStats.lost} tin báo mất
            </span>
          </div>

          {/* Toggle mở danh sách địa điểm trên Mobile */}
          <button
            type="button"
            onClick={() => setMobileDrawerOpen(prev => !prev)}
            className="lg:hidden inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-[#8F1822] text-white hover:bg-[#72131b] transition-colors"
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Địa điểm ({filteredPlaces.length})</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 text-xs px-4 py-1.5 border-b border-red-200">
          Lưu ý: {error}
        </div>
      )}

      {/* 2. Main Workspace: Sidebar + Bản đồ iframe + Panel chi tiết bên phải */}
      <div className="flex-1 flex relative overflow-hidden">
        {/* THANH BÊN TRÁI: Tìm kiếm, lọc và danh sách địa điểm */}
        <aside
          className={`
            fixed inset-y-[7.5rem] left-0 z-30 w-80 sm:w-84 bg-white border-r border-hairline flex flex-col shadow-lg transition-transform duration-300 lg:static lg:translate-x-0 lg:shadow-none lg:z-10
            ${mobileDrawerOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          `}
        >
          {/* Ô tìm kiếm nhanh */}
          <div className="p-3 border-b border-hairline bg-white">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-warm-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Tìm tòa nhà, sân bãi, tiện ích..."
                className="w-full pl-9 pr-8 py-2 text-xs sm:text-sm bg-warm-gray-50 border border-warm-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8F1822] focus:border-transparent transition-all"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-warm-gray-400 hover:text-warm-gray-600 p-0.5"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Filter tags */}
            <div className="flex items-center gap-1.5 mt-2.5">
              {[
                { id: 'all', label: 'Tất cả' },
                { id: 'study', label: 'Giảng đường' },
                { id: 'life', label: 'Tiện ích' }
              ].map(tab => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setFilterType(tab.id)}
                  className={`
                    px-2.5 py-1 text-[11px] font-semibold rounded-md transition-colors
                    ${filterType === tab.id
                      ? 'bg-[#8F1822] text-white'
                      : 'bg-warm-gray-100 text-warm-gray-600 hover:bg-warm-gray-200'
                    }
                  `}
                >
                  {tab.label}
                </button>
              ))}
              <span className="ml-auto text-[11px] text-warm-gray-400 font-medium">
                {filteredPlaces.length} điểm
              </span>
            </div>
          </div>

          {/* Danh sách các địa điểm */}
          <div ref={listRef} className="flex-1 overflow-y-auto divide-y divide-hairline">
            {filteredPlaces.length === 0 ? (
              <div className="p-6 text-center text-xs text-warm-gray-500">
                Không tìm thấy địa điểm phù hợp với "{searchQuery}"
              </div>
            ) : (
              filteredPlaces.map(place => {
                const isSelected = selectedPlaceId === place.id;
                const placeItems = (mapData[place.id] || []).flatMap(g => g.items || []);
                const foundCount = placeItems.filter(i => i.type === 'FOUND').length;
                const lostCount = placeItems.filter(i => i.type === 'LOST').length;

                return (
                  <button
                    key={place.id}
                    id={`place-item-${place.id}`}
                    type="button"
                    onClick={() => {
                      handleSelectPlace(place.id, true);
                      setMobileDrawerOpen(false);
                    }}
                    className={`
                      w-full text-left p-3 flex items-center gap-3 transition-colors relative group
                      ${isSelected ? 'bg-burgundy-50/70 border-l-4 border-l-[#8F1822]' : 'hover:bg-warm-gray-50/80'}
                    `}
                  >
                    <div
                      className={`
                        w-9 h-9 rounded-lg flex items-center justify-center font-bold text-xs shrink-0
                        ${isSelected ? 'bg-[#8F1822] text-white shadow-sm' : 'bg-warm-gray-100 text-warm-gray-700 group-hover:bg-warm-gray-200'}
                      `}
                    >
                      {place.badge}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <h4 className={`text-xs sm:text-sm font-semibold truncate ${isSelected ? 'text-[#8F1822]' : 'text-text-dark'}`}>
                          {place.name}
                        </h4>
                        <ChevronRight className={`w-3.5 h-3.5 text-warm-gray-400 transition-transform ${isSelected ? 'translate-x-0.5 text-[#8F1822]' : ''}`} />
                      </div>

                      <div className="flex items-center gap-2 mt-0.5 text-[11px]">
                        <span className="text-warm-gray-600 truncate">{place.categoryName}</span>
                        {(foundCount > 0 || lostCount > 0) ? (
                          <span className="inline-flex items-center gap-1 font-semibold text-rose-600 ml-auto shrink-0">
                            {foundCount > 0 && <span className="text-emerald-700">{foundCount} nhặt</span>}
                            {foundCount > 0 && lostCount > 0 && <span>·</span>}
                            {lostCount > 0 && <span className="text-rose-700">{lostCount} mất</span>}
                          </span>
                        ) : (
                          <span className="text-warm-gray-400 text-[10px] ml-auto shrink-0">Chưa có tin</span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {/* Nút đóng drawer trên mobile */}
          <div className="p-2 border-t border-hairline lg:hidden">
            <button
              type="button"
              onClick={() => setMobileDrawerOpen(false)}
              className="w-full py-2 text-xs font-semibold rounded-lg bg-warm-gray-100 text-warm-gray-700 hover:bg-warm-gray-200"
            >
              Đóng danh sách
            </button>
          </div>
        </aside>

        {/* Backdrop cho mobile drawer */}
        {mobileDrawerOpen && (
          <div
            className="fixed inset-0 bg-black/40 z-20 lg:hidden"
            onClick={() => setMobileDrawerOpen(false)}
          />
        )}

        {/* TRUNG TÂM: Bản đồ Campus 3D */}
        <div className="flex-1 relative w-full h-full bg-[#e9f2f3] overflow-hidden">
          <iframe
            ref={frame}
            title="Bản đồ campus DNTU 3D"
            src="/campus/map?embed=true"
            onLoad={sendMapData}
            className="w-full h-full border-0 block"
          />

          {/* Hint nhỏ chỉ dẫn thao tác góc dưới trái của bản đồ */}
          <div className="absolute left-3 bottom-3 z-10 hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/90 backdrop-blur-sm border border-hairline shadow-sm text-[11px] text-warm-gray-600">
            <Sparkles className="w-3.5 h-3.5 text-[#8F1822]" />
            <span>Kéo chuột để xoay di chuyển · Cuộn để thu phóng · Bấm marker để xem chi tiết</span>
          </div>

          {/* Mobile Quick Action Pill nếu chưa mở drawer */}
          {!selectedPlace && (
            <div className="absolute bottom-4 inset-x-0 flex justify-center lg:hidden z-10 px-4">
              <button
                type="button"
                onClick={() => setMobileDrawerOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-[#8F1822] text-white font-semibold text-xs shadow-lg active:scale-95 transition-transform"
              >
                <Layers className="w-4 h-4" />
                  <span>Xem danh sách {mergedPlaces.length} địa điểm & tin nhặt được</span>
              </button>
            </div>
          )}
        </div>

        {/* PANEL CHI TIẾT (Desktop Slide-over cạnh phải / Mobile Bottom Sheet) */}
        {selectedPlace && (
          <div
            className={`
              fixed lg:absolute z-30 bg-white border-hairline shadow-2xl flex flex-col transition-all duration-300
              /* Desktop: Cạnh phải */
              lg:inset-y-0 lg:right-0 lg:w-96 lg:border-l lg:shadow-xl
              /* Mobile: Bottom-sheet */
              inset-x-0 bottom-0 max-h-[85vh] rounded-t-2xl border-t lg:rounded-none
            `}
          >
            {/* Header Panel: Chứa nút "← Danh sách địa điểm" ở vị trí ưu tiên đầu tiên */}
            <div className="p-3 sm:p-3.5 border-b border-hairline bg-white sticky top-0 z-10">
              {/* Nút điều hướng chính: ← Danh sách địa điểm */}
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-hairline/60">
                <button
                  type="button"
                  onClick={handleBackToList}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-[#8F1822] bg-burgundy-50 hover:bg-burgundy-100 rounded-lg transition-colors border border-burgundy-100 shadow-2xs group"
                >
                  <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-0.5" />
                  <span>Danh sách địa điểm</span>
                </button>

                {/* Dấu × đóng nhanh */}
                <button
                  type="button"
                  onClick={handleBackToList}
                  className="w-7 h-7 rounded-full flex items-center justify-center text-warm-gray-400 hover:text-warm-gray-700 hover:bg-warm-gray-100 transition-colors"
                  aria-label="Đóng chi tiết"
                  title="Đóng chi tiết"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Tên địa điểm & Phân loại */}
              <div className="flex items-center gap-2.5">
                <span className="w-8 h-8 rounded-lg bg-burgundy-100 text-[#8F1822] flex items-center justify-center font-bold text-xs shrink-0">
                  {selectedPlace.badge}
                </span>
                <div className="min-w-0">
                  <h3 className="text-sm sm:text-base font-bold text-text-dark truncate">
                    {selectedPlace.name}
                  </h3>
                  <span className="text-[11px] text-warm-gray-500 font-medium">
                    {selectedPlace.categoryName}
                  </span>
                </div>
              </div>
            </div>

            {/* Nội dung chi tiết */}
            <div className="flex-1 overflow-y-auto p-3.5 sm:p-4 space-y-4">
              {/* Ảnh thực tế nạp động từ API/Admin */}
              {currentCoverPhoto && !mainImageError ? (
                <div className="relative rounded-xl overflow-hidden bg-warm-gray-100 border border-warm-gray-200 group">
                  <img
                    src={currentCoverPhoto.url}
                    alt={currentCoverPhoto.caption || selectedPlace.name}
                    onError={() => setMainImageError(true)}
                    className="w-full h-44 object-cover object-center cursor-pointer transition-transform duration-300 group-hover:scale-102"
                    loading="lazy"
                    onClick={() => {
                      const idx = activePhotos.indexOf(currentCoverPhoto);
                      setLightboxIndex(idx >= 0 ? idx : 0);
                    }}
                  />
                  <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-black/60 backdrop-blur-xs text-[10px] font-medium text-white flex items-center gap-1">
                    <span>{currentCoverPhoto.caption || 'Ảnh đại diện thực tế'}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const idx = activePhotos.indexOf(currentCoverPhoto);
                      setLightboxIndex(idx >= 0 ? idx : 0);
                    }}
                    className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/50 hover:bg-black/70 text-white backdrop-blur-xs transition-colors"
                    title="Xem ảnh lớn"
                  >
                    <Maximize2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                /* Fallback trạng thái chưa có ảnh thực tế */
                <div className="h-36 rounded-xl border border-dashed border-warm-gray-300 bg-warm-gray-50 flex flex-col items-center justify-center p-4 text-center">
                  <div className="w-10 h-10 rounded-full bg-warm-gray-100 flex items-center justify-center text-warm-gray-400 mb-2">
                    <Camera className="w-5 h-5" />
                  </div>
                  <p className="text-xs font-semibold text-warm-gray-600">
                    Chưa có ảnh thực tế
                  </p>
                  <p className="text-[11px] text-warm-gray-400 mt-0.5">
                    Hình ảnh đang được ban quản lý cập nhật từ hệ thống Admin
                  </p>
                </div>
              )}

              {/* Dải ảnh phụ: Thumbnails nhỏ + Bấm mở Lightbox */}
              {extraPhotos.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-xs font-bold text-text-dark uppercase tracking-wider">
                      Góc chụp khác ({extraPhotos.length})
                    </h4>
                    <span className="text-[11px] text-warm-gray-400">Bấm để phóng to</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {extraPhotos.map((photo, pIdx) => {
                      const globalIdx = activePhotos.indexOf(photo);
                      return (
                        <button
                          key={photo.id || pIdx}
                          type="button"
                          onClick={() => setLightboxIndex(globalIdx >= 0 ? globalIdx : pIdx)}
                          className="group relative rounded-lg overflow-hidden border border-warm-gray-200 text-left bg-warm-gray-100 hover:border-[#8F1822] focus:outline-none transition-all block"
                        >
                          <img
                            src={photo.url}
                            alt={photo.caption || `Ảnh ${pIdx + 1}`}
                            className="w-full h-16 object-cover group-hover:scale-105 transition-transform"
                            loading="lazy"
                            onError={e => {
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                          <div className="p-1 bg-white text-[10px] text-warm-gray-700 truncate font-medium">
                            {photo.caption || `Ảnh ${pIdx + 1}`}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Mô tả địa điểm có nút xem thêm */}
              <div className="bg-warm-gray-50/70 p-3 rounded-xl border border-hairline text-xs text-warm-gray-700 leading-relaxed">
                <p className={expandedDesc ? '' : 'line-clamp-2'}>
                  {selectedPlace.desc}
                </p>
                {selectedPlace.desc.length > 90 && (
                  <button
                    type="button"
                    onClick={() => setExpandedDesc(prev => !prev)}
                    className="mt-1.5 text-[11px] font-semibold text-[#8F1822] hover:underline inline-flex items-center gap-1"
                  >
                    {expandedDesc ? (
                      <>Thu gọn <ChevronUp className="w-3 h-3" /></>
                    ) : (
                      <>Xem thêm mô tả <ChevronDown className="w-3 h-3" /></>
                    )}
                  </button>
                )}
              </div>

              {/* Thống kê đồ vật tại địa điểm này */}
              <div className="grid grid-cols-2 gap-2">
                <div className="p-2.5 rounded-xl bg-emerald-50/80 border border-emerald-100 flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs shrink-0">
                    {selectedFoundCount}
                  </div>
                  <div className="min-w-0">
                    <div className="text-[11px] font-bold text-emerald-800">Đã nhặt được</div>
                    <div className="text-[10px] text-emerald-600">Đang chờ nhận</div>
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-rose-50/80 border border-rose-100 flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center font-bold text-xs shrink-0">
                    {selectedLostCount}
                  </div>
                  <div className="min-w-0">
                    <div className="text-[11px] font-bold text-rose-800">Báo thất lạc</div>
                    <div className="text-[10px] text-rose-600">Đang tìm kiếm</div>
                  </div>
                </div>
              </div>

              {/* Danh sách vật phẩm thực tế đang kết nối */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-bold text-text-dark uppercase tracking-wider">
                    Vật phẩm tại đây ({selectedPlaceItems.length})
                  </h4>
                  {selectedPlaceItems.length > 0 && (
                    <span className="text-[11px] text-warm-gray-500">Gần nhất</span>
                  )}
                </div>

                {selectedPlaceItems.length === 0 ? (
                  <div className="p-3 text-center rounded-xl border border-dashed border-warm-gray-200 text-xs text-warm-gray-500">
                    Hiện chưa có tin nhặt được hoặc báo mất nào tại {selectedPlace.name}.
                  </div>
                ) : (
                  <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                    {selectedPlaceItems.slice(0, 8).map(item => (
                      <Link
                        key={item.id}
                        to={`/items/${item.id}`}
                        className="p-2 rounded-lg border border-hairline hover:border-[#8F1822] hover:bg-burgundy-50/40 transition-colors flex items-center justify-between gap-2 group block"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span
                            className={`
                              px-1.5 py-0.5 rounded text-[10px] font-bold shrink-0
                              ${item.type === 'FOUND' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}
                            `}
                          >
                            {item.type === 'FOUND' ? 'Nhặt' : 'Mất'}
                          </span>
                          <span className="text-xs font-medium text-text-dark group-hover:text-[#8F1822] truncate">
                            {item.title}
                          </span>
                        </div>
                        <ExternalLink className="w-3.5 h-3.5 text-warm-gray-400 group-hover:text-[#8F1822] shrink-0" />
                      </Link>
                    ))}
                    {selectedPlaceItems.length > 8 && (
                      <p className="text-[11px] text-warm-gray-500 text-center pt-1">
                        + {selectedPlaceItems.length - 8} vật phẩm khác
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Footer Panel: Nút chuyển hướng tra cứu trên UniFind */}
            <div className="p-3 sm:p-3.5 border-t border-hairline bg-warm-gray-50 shrink-0">
              <button
                type="button"
                onClick={() => {
                  navigate(`/search?location=${encodeURIComponent(selectedPlace.name)}`);
                }}
                className="w-full py-2.5 px-3 rounded-xl bg-[#8F1822] text-white text-xs sm:text-sm font-semibold hover:bg-[#72131b] transition-colors flex items-center justify-center gap-2 shadow-sm"
              >
                <span>Xem tất cả đồ vật tại {selectedPlace.name}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 3. Modal Lightbox Xem Ảnh Lớn */}
      {lightboxIndex !== null && activePhotos[lightboxIndex] && (
        <div
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex flex-col justify-between p-4"
          onClick={() => setLightboxIndex(null)}
        >
          {/* Header Lightbox */}
          <div className="flex items-center justify-between text-white pb-2" onClick={e => e.stopPropagation()}>
            <div>
              <span className="text-xs text-white/70">
                {selectedPlace?.name} · Ảnh {lightboxIndex + 1} / {activePhotos.length}
              </span>
              <p className="text-sm font-semibold text-white">
                {activePhotos[lightboxIndex].caption || selectedPlace?.name}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setLightboxIndex(null)}
              className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
              aria-label="Đóng ảnh"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Main Photo Center */}
          <div
            className="flex-1 flex items-center justify-center relative my-auto overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            {activePhotos.length > 1 && (
              <button
                type="button"
                onClick={() => setLightboxIndex(prev => (prev > 0 ? prev - 1 : activePhotos.length - 1))}
                className="absolute left-2 sm:left-4 z-10 p-2 sm:p-3 rounded-full bg-black/40 hover:bg-black/70 text-white transition-colors"
                aria-label="Ảnh trước"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
            )}

            <img
              src={activePhotos[lightboxIndex].url}
              alt={activePhotos[lightboxIndex].caption || 'Ảnh lớn'}
              className="max-h-[75vh] max-w-[90vw] object-contain rounded-lg shadow-2xl"
            />

            {activePhotos.length > 1 && (
              <button
                type="button"
                onClick={() => setLightboxIndex(prev => (prev < activePhotos.length - 1 ? prev + 1 : 0))}
                className="absolute right-2 sm:right-4 z-10 p-2 sm:p-3 rounded-full bg-black/40 hover:bg-black/70 text-white transition-colors"
                aria-label="Ảnh kế tiếp"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            )}
          </div>

          {/* Footer Lightbox Thumbnails */}
          {activePhotos.length > 1 && (
            <div
              className="flex items-center justify-center gap-2 pt-2 overflow-x-auto"
              onClick={e => e.stopPropagation()}
            >
              {activePhotos.map((p, idx) => (
                <button
                  key={p.id || idx}
                  type="button"
                  onClick={() => setLightboxIndex(idx)}
                  className={`
                    w-12 h-12 rounded-lg overflow-hidden border-2 transition-all shrink-0
                    ${lightboxIndex === idx ? 'border-[#8F1822] scale-105' : 'border-white/20 opacity-60 hover:opacity-100'}
                  `}
                >
                  <img src={p.url} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
