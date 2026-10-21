export const mockLocations = [
  {
    id: 'LOC01',
    name: 'Nhà A (Khu hành chính)',
    code: 'TOA_A',
    building: 'A',
    map_key: 'A',
    description: 'Tòa nhà điều hành trung tâm, phòng ban hiệu bộ, phòng đào tạo và tiếp sinh viên.',
    image_url: '/campus/places/a-main-entrance.webp',
    photos: JSON.stringify([
      { id: '1', url: '/campus/places/a-main-entrance.webp', caption: 'Lối vào chính Tòa A', is_cover: true },
      { id: '2', url: '/campus/places/a-main-front.webp', caption: 'Mặt tiền Tòa A', is_cover: false },
      { id: '3', url: '/campus/places/a-overhead.webp', caption: 'Toàn cảnh Tòa A nhìn từ trên cao', is_cover: false }
    ]),
    is_active: true
  },
  {
    id: 'LOC02',
    name: 'Nhà B (Giảng đường & Lab)',
    code: 'TOA_B',
    building: 'B',
    map_key: 'B',
    description: 'Giảng đường đa năng, các phòng máy tính, phòng thí nghiệm chuyên ngành kỹ thuật.',
    image_url: '/campus/places/a-library-b-courts.webp',
    photos: JSON.stringify([
      { id: '1', url: '/campus/places/a-library-b-courts.webp', caption: 'Khu vực Tòa B và sân thể thao liền kề', is_cover: true }
    ]),
    is_active: true
  },
  {
    id: 'LOC03',
    name: 'Thư viện trung tâm (Tòa C)',
    code: 'THU_VIEN',
    building: 'C',
    map_key: 'C',
    description: 'Thư viện số 4 tầng, không gian tự học hiện đại, kho tài liệu học liệu và phòng hội thảo.',
    image_url: '/campus/places/library-front.webp',
    photos: JSON.stringify([
      { id: '1', url: '/campus/places/library-front.webp', caption: 'Mặt trước Thư viện Trung tâm', is_cover: true },
      { id: '2', url: '/campus/places/a-library-paths-stage.webp', caption: 'Lối đi kết nối Tòa A - Thư viện', is_cover: false }
    ]),
    is_active: true
  },
  {
    id: 'LOC04',
    name: 'Ký túc xá DNTU (Tòa D)',
    code: 'KTX_D',
    building: 'D',
    map_key: 'D',
    description: 'Ký túc xá sinh viên nội trú đầy đủ tiện nghi, an ninh 24/7 và khuôn viên yên tĩnh.',
    image_url: '/campus/tour/dorm.webp',
    photos: JSON.stringify([
      { id: '1', url: '/campus/tour/dorm.webp', caption: 'Khuôn viên Ký túc xá DNTU', is_cover: true }
    ]),
    is_active: true
  },
  {
    id: 'LOC05',
    name: 'Khu thể thao phức hợp E',
    code: 'KHU_THE_THAO_E',
    building: 'E',
    map_key: 'E',
    description: 'Nhà thi đấu thể thao đa năng, sân tập bóng rổ, cầu lông và các câu lạc bộ thể chất.',
    image_url: '/campus/places/e-sports.webp',
    photos: JSON.stringify([
      { id: '1', url: '/campus/places/e-sports.webp', caption: 'Khu tập luyện thể thao E', is_cover: true },
      { id: '2', url: '/campus/places/e-f-g-aerial.webp', caption: 'Cụm công trình thể thao E-F-G', is_cover: false }
    ]),
    is_active: true
  },
  {
    id: 'LOC06',
    name: 'Tòa nhà giảng đường F',
    code: 'TOA_F',
    building: 'F',
    map_key: 'F',
    description: 'Hệ thống giảng đường hiện đại, phòng sinh hoạt khoa và studio thực hành.',
    image_url: '/campus/places/fg-overhead.webp',
    photos: JSON.stringify([
      { id: '1', url: '/campus/places/fg-overhead.webp', caption: 'Tòa F nhìn từ góc cao', is_cover: true }
    ]),
    is_active: true
  },
  {
    id: 'LOC07',
    name: 'Tòa nhà công nghệ G',
    code: 'TOA_G',
    building: 'G',
    map_key: 'G',
    description: 'Khu thực hành công nghệ ô tô, cơ khí tự động hóa và trung tâm nghiên cứu ứng dụng.',
    image_url: '/campus/places/fg-overhead.webp',
    photos: JSON.stringify([
      { id: '1', url: '/campus/places/fg-overhead.webp', caption: 'Khu liên hợp Tòa F và Tòa G', is_cover: true }
    ]),
    is_active: true
  },
  {
    id: 'LOC08',
    name: 'Viện Nghiên cứu & Tuyển sinh (IRAS)',
    code: 'IRAS_R',
    building: 'R',
    map_key: 'R',
    description: 'Trung tâm nghiên cứu ứng dụng, viện đào tạo quốc tế và trung tâm tư vấn tuyển sinh.',
    image_url: '/campus/places/iras-admissions-position.webp',
    photos: JSON.stringify([
      { id: '1', url: '/campus/places/iras-admissions-position.webp', caption: 'Trung tâm tư vấn tuyển sinh IRAS', is_cover: true },
      { id: '2', url: '/campus/places/research-front.webp', caption: 'Viện Nghiên cứu ứng dụng DNTU', is_cover: false }
    ]),
    is_active: true
  },
  {
    id: 'LOC09',
    name: 'Sân khấu & Quảng trường sự kiện',
    code: 'SAN_KHAU_EVENT',
    building: 'EVENT',
    map_key: 'EVENT',
    description: 'Không gian ngoài trời tổ chức lễ khai giảng, ngày hội văn hóa, ca nhạc và sự kiện lớn.',
    image_url: '/campus/places/event-stage.webp',
    photos: JSON.stringify([
      { id: '1', url: '/campus/places/event-stage.webp', caption: 'Khu vực sân khấu trung tâm sự kiện', is_cover: true },
      { id: '2', url: '/campus/places/event-canopy.webp', caption: 'Mái che và khán đài sự kiện', is_cover: false },
      { id: '3', url: '/campus/places/event-front-lawn.webp', caption: 'Khu vực bãi cỏ phía trước sự kiện', is_cover: false }
    ]),
    is_active: true
  },
  {
    id: 'LOC10',
    name: 'Bãi đỗ xe ô tô & Khách',
    code: 'BAI_XE_OTO',
    building: 'PARKING',
    map_key: 'PARKING',
    description: 'Bãi xe ô tô rộng rãi, có bóng mát cây xanh, camera giám sát và trạm bảo vệ.',
    image_url: '/campus/places/car-park-a.webp',
    photos: JSON.stringify([
      { id: '1', url: '/campus/places/car-park-a.webp', caption: 'Bãi đỗ ô tô cạnh tòa A', is_cover: true },
      { id: '2', url: '/campus/places/car-park-event-view.webp', caption: 'Lối vào bãi xe từ khu sự kiện', is_cover: false }
    ]),
    is_active: true
  },
  {
    id: 'LOC11',
    name: 'Sân thể thao Pickleball & Tennis',
    code: 'SAN_PICKLEBALL',
    building: 'SPORT',
    map_key: 'SPORT',
    description: 'Cụm sân thể thao ngoài trời hiện đại tiêu chuẩn thi đấu, sân pickleball, tennis và bóng chuyền.',
    image_url: '/campus/places/b-sports.webp',
    photos: JSON.stringify([
      { id: '1', url: '/campus/places/b-sports.webp', caption: 'Toàn cảnh cụm sân thể thao Pickleball', is_cover: true },
      { id: '2', url: '/campus/places/aerial.webp', caption: 'Góc nhìn toàn cảnh thể thao từ trên cao', is_cover: false }
    ]),
    is_active: true
  },
  {
    id: 'LOC12',
    name: 'Hồ bơi campus DNTU',
    code: 'HO_BOI',
    building: 'POOL',
    map_key: 'POOL',
    description: 'Hồ bơi sinh viên đạt chuẩn huấn luyện kỹ năng bơi lội, hoạt động thể thao nước.',
    image_url: '/campus/places/flycam-labeled.webp',
    photos: JSON.stringify([
      { id: '1', url: '/campus/places/flycam-labeled.webp', caption: 'Vị trí hồ bơi trong khuôn viên DNTU', is_cover: true }
    ]),
    is_active: true
  },
  {
    id: 'LOC13',
    name: 'Công viên sáng tạo sinh thái',
    code: 'CONG_VIEN_SANG_TAO',
    building: 'PARK',
    map_key: 'PARK',
    description: 'Không gian xanh thư giãn, ghế đá ven hồ, vườn cây sinh thái và chòi nghỉ cho sinh viên.',
    image_url: '/campus/places/park.webp',
    photos: JSON.stringify([
      { id: '1', url: '/campus/places/park.webp', caption: 'Công viên cây xanh mát mẻ', is_cover: true },
      { id: '2', url: '/campus/places/park-gazebo.webp', caption: 'Chòi vọng cảnh và khu thư giãn', is_cover: false }
    ]),
    is_active: true
  },
  {
    id: 'LOC14',
    name: 'Cổng chính DNTU',
    code: 'CONG_CHINH',
    building: 'GATE',
    map_key: 'GATE',
    description: 'Cổng chính trường Đại học Công nghệ Đồng Nai, có bốt an ninh và kiểm soát thẻ xe.',
    image_url: '/campus/places/main-gate.webp',
    photos: JSON.stringify([
      { id: '1', url: '/campus/places/main-gate.webp', caption: 'Cổng chính DNTU mặt tiền đường Nguyễn Khuyến', is_cover: true },
      { id: '2', url: '/campus/places/flycam-detail-gate.webp', caption: 'Chi tiết luồng xe cổng chính từ trên cao', is_cover: false }
    ]),
    is_active: true
  },
  {
    id: 'LOC15',
    name: 'Cổng phụ phía dưới',
    code: 'CONG_PHU_PHIA_DUOI',
    building: 'GATE2',
    map_key: 'GATE2',
    description: 'Cổng phụ phía dưới, nằm giữa Tòa F và khu thể thao E, kết nối trục đường nội khu.',
    image_url: '/campus/places/side-gate.webp',
    photos: JSON.stringify([
      { id: '1', url: '/campus/places/side-gate.webp', caption: 'Cổng phụ phía dưới khuôn viên', is_cover: true }
    ]),
    is_active: true
  },
  {
    id: 'LOC16',
    name: 'Cổng vào khu thể thao',
    code: 'CONG_KHU_THE_THAO',
    building: 'GATE_SPORT',
    map_key: 'GATE_SPORT',
    description: 'Lối vào cạnh Viện IRAS và cụm sân thể thao ngoài trời, thuận tiện đến sân Pickleball và hồ bơi.',
    image_url: '/campus/places/side-gate.webp',
    photos: JSON.stringify([
      { id: '1', url: '/campus/places/side-gate.webp', caption: 'Cổng vào cạnh khu thể thao', is_cover: true }
    ]),
    is_active: true
  }
];

const CAMPUS_META = {
  A: { type: 'study', categoryName: 'Giảng đường trung tâm', badge: 'A' },
  B: { type: 'study', categoryName: 'Giảng đường & Lab', badge: 'B' },
  C: { type: 'study', categoryName: 'Thư viện & Tự học', badge: 'C' },
  D: { type: 'life', categoryName: 'Ký túc xá sinh viên', badge: 'D' },
  E: { type: 'life', categoryName: 'Thể thao & Giữ xe', badge: '⚽' },
  F: { type: 'study', categoryName: 'Công nghệ & Thực hành', badge: 'F' },
  G: { type: 'study', categoryName: 'Giảng đường đa năng', badge: 'G' },
  R: { type: 'life', categoryName: 'Viện nghiên cứu & Tuyển sinh', badge: 'R' },
  EVENT: { type: 'life', categoryName: 'Sân ngoài trời', badge: '🎪' },
  PARKING: { type: 'life', categoryName: 'Bãi đỗ xe', badge: '🅿️' },
  SPORT: { type: 'life', categoryName: 'Sân thể thao', badge: '🎾' },
  POOL: { type: 'life', categoryName: 'Tiện ích thể thao', badge: '🏊' },
  PARK: { type: 'life', categoryName: 'Không gian xanh', badge: '🌳' },
  GATE: { type: 'life', categoryName: 'Cổng ra vào', badge: '🏛️' },
  GATE2: { type: 'life', categoryName: 'Cổng phụ', badge: '🚪' },
  GATE_SPORT: { type: 'life', categoryName: 'Cổng phụ', badge: '🚪' },
};

const LEGACY_CODE_TO_MAP = {
  NHA_A: 'A',
  NHA_B: 'B',
  NHA_C: 'C',
  THU_VIEN: 'C',
  SAN_THE_THAO: 'E',
  BAI_XE: 'PARKING',
  KY_TUC_XA: 'D',
  HOI_TRUONG: 'EVENT',
  GIANG_DUONG_A: 'A',
  GIANG_DUONG_B: 'B',
  GIANG_DUONG_C: 'C',
  PHONG_LAB: 'B',
  CANG_TIN: 'A',
  PHONG_TU_HOC: 'C',
  CONG_PHU: 'GATE2',
};

const BUILDING_TO_MAP = {
  A: 'A', 'GĐ-A': 'A', CT: 'A',
  B: 'B', 'GĐ-B': 'B', LAB: 'B',
  C: 'C', 'GĐ-C': 'C', TV: 'C', PTH: 'C',
  D: 'D', KTX: 'D', E: 'E', STT: 'E', F: 'F', G: 'G', R: 'R',
  HT: 'EVENT', EVENT: 'EVENT', BX: 'PARKING', PARKING: 'PARKING',
  SPORT: 'SPORT', POOL: 'POOL', PARK: 'PARK', GATE: 'GATE',
  GATE2: 'GATE2', GATE_SPORT: 'GATE_SPORT',
};

function normalizeLocationText(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[^a-zA-Z0-9]+/g, ' ')
    .trim()
    .toLowerCase();
}

function hasPhotos(raw) {
  return parseLocationPhotos(raw).some(photo => photo?.url);
}

export function parseLocationPhotos(raw) {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw.filter(photo => photo?.url);
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter(photo => photo?.url) : [];
  } catch {
    return [];
  }
}

export function resolveLocationMapKey(locationLike) {
  if (!locationLike) return null;

  if (typeof locationLike === 'object') {
    const explicitKey = String(locationLike.map_key || locationLike.mapKey || '').toUpperCase();
    if (CAMPUS_META[explicitKey]) return explicitKey;

    const code = String(locationLike.code || '').toUpperCase();
    if (LEGACY_CODE_TO_MAP[code]) return LEGACY_CODE_TO_MAP[code];

    const building = String(locationLike.building || '').trim().toUpperCase();
    if (BUILDING_TO_MAP[building]) return BUILDING_TO_MAP[building];

    const idMatch = mockLocations.find(location => String(location.id) === String(locationLike.id || locationLike.location_id || locationLike.locationId));
    if (idMatch) return idMatch.map_key;

    return resolveLocationMapKey(locationLike.name || locationLike.locationName || locationLike.location);
  }

  const normalized = normalizeLocationText(locationLike);
  if (!normalized) return null;

  const exact = mockLocations.find(location => [location.name, location.code, location.building, location.map_key]
    .some(value => normalizeLocationText(value) === normalized));
  if (exact) return exact.map_key;

  if (normalized.includes('cong vao khu the thao') || normalized.includes('cong canh khu the thao')) return 'GATE_SPORT';
  if (normalized.includes('cong phu') || normalized.includes('cong phia duoi')) return 'GATE2';
  if (normalized.includes('cong')) return 'GATE';
  if (normalized.includes('pickleball') || normalized.includes('tennis')) return 'SPORT';
  if (normalized.includes('ho boi')) return 'POOL';
  if (normalized.includes('cong vien')) return 'PARK';
  if (normalized.includes('bai xe') || normalized.includes('giu xe') || normalized.includes('do xe')) return 'PARKING';
  if (normalized.includes('hoi truong') || normalized.includes('su kien') || normalized.includes('san khau')) return 'EVENT';
  if (normalized.includes('ky tuc xa') || normalized.includes('ktx')) return 'D';
  if (normalized.includes('iras') || normalized.includes('tuyen sinh') || normalized.includes('vien nghien cuu')) return 'R';
  if (normalized.includes('toa g') || normalized.includes('nha g') || normalized.includes('giang duong g')) return 'G';
  if (normalized.includes('toa f') || normalized.includes('nha f') || normalized.includes('giang duong f')) return 'F';
  if (normalized.includes('toa c') || normalized.includes('nha c') || normalized.includes('giang duong c') || normalized.includes('thu vien') || normalized.includes('tu hoc')) return 'C';
  if (normalized.includes('toa b') || normalized.includes('nha b') || normalized.includes('giang duong b') || normalized.includes('phong lab') || normalized === 'lab') return 'B';
  if (normalized.includes('toa a') || normalized.includes('nha a') || normalized.includes('giang duong a') || normalized.includes('cang tin')) return 'A';
  if (normalized.includes('the thao') || normalized.includes('san bong') || normalized.includes('bong da') || normalized.includes('bong ro')) return 'E';

  return null;
}

export function getCanonicalLocation(locationLike) {
  const mapKey = resolveLocationMapKey(locationLike);
  return mockLocations.find(location => location.map_key === mapKey) || null;
}

export function getCampusLocationUrl(locationLike) {
  const mapKey = resolveLocationMapKey(locationLike);
  return mapKey ? `/campus/?place=${encodeURIComponent(mapKey)}` : '/campus/';
}

export function mergeCanonicalLocations(apiLocations = []) {
  const dynamicByMapKey = new Map();
  const unmatched = [];

  (Array.isArray(apiLocations) ? apiLocations : []).forEach(location => {
    const mapKey = resolveLocationMapKey(location);
    if (mapKey && CAMPUS_META[mapKey]) dynamicByMapKey.set(mapKey, location);
    else unmatched.push(location);
  });

  const canonical = mockLocations.map(location => {
    const dynamic = dynamicByMapKey.get(location.map_key);
    if (!dynamic) return { ...location };
    return {
      ...location,
      ...dynamic,
      name: location.name,
      code: location.code,
      building: location.building,
      map_key: location.map_key,
      description: dynamic.description || location.description,
      image_url: dynamic.image_url || location.image_url,
      photos: hasPhotos(dynamic.photos) ? dynamic.photos : location.photos,
      is_active: dynamic.is_active ?? location.is_active,
    };
  });

  return [...canonical, ...unmatched];
}

export function getCampusPlaces(apiLocations = []) {
  return mergeCanonicalLocations(apiLocations).map(location => ({
    ...location,
    id: location.map_key || resolveLocationMapKey(location),
    desc: location.description || '',
    ...(CAMPUS_META[location.map_key] || { type: 'life', categoryName: 'Địa điểm DNTU', badge: '📍' }),
  })).filter(location => location.id);
}
