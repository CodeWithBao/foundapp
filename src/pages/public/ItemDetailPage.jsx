
import { useState, useEffect, useCallback } from 'react';
import {
  useParams,
  useNavigate,
  Link,
  useLocation,
  useNavigationType,
} from 'react-router-dom';

import {
  Home,
  ArrowLeft,
  MapPin,
  Calendar,
  Eye,
  Phone,
  Mail,
  Share2,
  ShieldAlert,
  ChevronRight,
  Bookmark,
  Send,
  MessageCircle,
  Smartphone,
  Sparkles,
  FileText,
  Star,
  Heart,
  ExternalLink,
  Building2,
  Lock,
} from 'lucide-react';

import itemService from '../../services/itemService';
import claimService from '../../services/claimService';
import { useAuth } from '../../context/AuthContext';

import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import Textarea from '../../components/common/Textarea';
import ReportModal from '../../components/common/ReportModal';
import Avatar from '../../components/common/Avatar';
import ItemCard from '../../components/common/ItemCard';
import CategoryIcon from '../../components/common/CategoryIcon';
import LoadingSkeleton from '../../components/common/LoadingSkeleton';
import ItemChatModal from '../../components/chat/ItemChatModal';
import ItemGallery from '../../components/item/ItemGallery';

import {
  formatDate,
  formatRelative,
  getItemOwnerId,
  isSameEntityId,
} from '../../utils';

import scrollRestorationService from '../../services/scrollRestorationService';
import { toast } from 'sonner';
import {
  getCampusLocationUrl,
  getCanonicalLocation,
} from '../../data/locations';

/* =========================================================
   HELPER FUNCTIONS
========================================================= */

const getEntityId = (value) => {
  if (value === null || value === undefined) return '';

  if (typeof value === 'object') {
    return String(value.id ?? value.ID ?? value._id ?? '');
  }

  return String(value);
};

const getImageUrl = (image) => {
  if (!image) return '';

  if (typeof image === 'string') {
    return image;
  }

  return image.image_url || image.imageUrl || image.url || '';
};

const getItemImages = (item) => {
  if (!Array.isArray(item?.images)) return [];

  return item.images
    .map(getImageUrl)
    .filter(Boolean);
};

const getCategoryName = (item) => {
  if (!item) return 'Vật phẩm';

  if (typeof item.category === 'object' && item.category !== null) {
    return item.category.name || 'Vật phẩm';
  }

  return item.categoryName || item.category || 'Vật phẩm';
};

const getLocationName = (item) => {
  if (!item) return 'Chưa cập nhật';

  if (typeof item.location === 'object' && item.location !== null) {
    return item.location.name || 'Chưa cập nhật';
  }

  return item.locationName || item.location || 'Chưa cập nhật';
};

const getItemType = (item) => {
  return String(item?.type || '').toUpperCase();
};

const getItemStatus = (item) => {
  return String(item?.status || '').toUpperCase();
};

const getStatusLabel = (item) => {
  const type = getItemType(item);
  const status = getItemStatus(item);

  if (status === 'RETURNED') return 'Đã trả lại';
  if (status === 'CLOSED') return 'Đã đóng';
  if (status === 'FOUND' || type === 'FOUND') return 'Nhặt được';
  if (status === 'LOST' || type === 'LOST') return 'Đang tìm';

  return 'Chưa xác định';
};

const getStatusClass = (item) => {
  const status = getItemStatus(item);

  if (status === 'RETURNED' || status === 'CLOSED') {
    return 'bg-gray-100 text-gray-600';
  }

  if (getItemType(item) === 'FOUND' || status === 'FOUND') {
    return 'bg-[#E8F5E9] text-[#2E7D32]';
  }

  return 'bg-[#FFEBEE] text-[#C62828]';
};

const getStorageLocation = (item) => {
  return (
    item?.current_storage_location ||
    item?.currentStorageLocation ||
    item?.storageLocation ||
    ''
  );
};

const getCustodyStatus = (item) => {
  return String(
    item?.custody_status ||
    item?.custodyStatus ||
    ''
  ).toUpperCase();
};

const getIsOfficeKept = (item) => {
  const custodyStatus = getCustodyStatus(item);
  const storageLocation = getStorageLocation(item);

  return (
    Boolean(storageLocation) ||
    custodyStatus === 'STAFF' ||
    custodyStatus === 'OFFICE' ||
    custodyStatus === 'STAFF_KEPT' ||
    custodyStatus === 'HANDED_OVER'
  );
};

const getBookmarkKey = (userId, itemId) => {
  return `unifind_bookmarks_${getEntityId(userId)}_${getEntityId(itemId)}`;
};

const getInitialBookmark = (userId, itemId) => {
  if (!userId || !itemId) return false;

  try {
    const saved = JSON.parse(
      localStorage.getItem(getBookmarkKey(userId, itemId)) || '[]'
    );

    return Array.isArray(saved) && saved.includes(getEntityId(itemId));
  } catch {
    return false;
  }
};

/* =========================================================
   COMPONENT
========================================================= */

export default function ItemDetailPage() {
  const { id } = useParams();

  const navigate = useNavigate();
  const location = useLocation();
  const navType = useNavigationType();

  const { user, loading: authLoading } = useAuth();

  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);

  const [similarItems, setSimilarItems] = useState([]);

  const [showContact, setShowContact] = useState(false);
  const [contactLoading, setContactLoading] = useState(false);
  const [fullContact, setFullContact] = useState(null);
  const [contactError, setContactError] = useState('');

  const [showReportModal, setShowReportModal] = useState(false);
  const [showChatModal, setShowChatModal] = useState(false);

  const [isSaved, setIsSaved] = useState(false);

  const [showClaimModal, setShowClaimModal] = useState(false);
  const [claimReason, setClaimReason] = useState('');
  const [claimEvidence, setClaimEvidence] = useState('');
  const [claimImage, setClaimImage] = useState('');
  const [submittingClaim, setSubmittingClaim] = useState(false);

  /* =========================================================
     LOAD ITEM
  ========================================================= */

  const loadItemData = useCallback(async () => {
    setLoading(true);

    setShowContact(false);
    setFullContact(null);
    setContactError('');
    setContactLoading(false);

    try {
      const data = await itemService.getItemById(id);

      if (!data) {
        throw new Error('Không tìm thấy vật phẩm.');
      }

      setItem(data);

      const category = getCategoryName(data);

      const response = await itemService.getItems({
        category,
        page: 1,
        limit: 20,
      });

      const allItems = Array.isArray(response)
        ? response
        : response?.items || [];

      const currentId = getEntityId(data.id ?? data.ID ?? data._id);

      const filtered = allItems.filter((otherItem) => {
        const otherId = getEntityId(
          otherItem.id ?? otherItem.ID ?? otherItem._id
        );

        return (
          otherId &&
          otherId !== currentId &&
          getItemStatus(otherItem) !== 'CLOSED'
        );
      });

      setSimilarItems(filtered.slice(0, 4));
    } catch (error) {
      console.error('Load item detail error:', error);

      toast.error(
        error.message || 'Không thể tải thông tin vật phẩm.'
      );

      navigate('/search');
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => {
    loadItemData();
  }, [loadItemData, navType]);

  /* =========================================================
     SCROLL RESTORATION
  ========================================================= */

  useEffect(() => {
    if (loading || navType !== 'POP') return;

    const snapshot = scrollRestorationService.getSnapshot(
      `/items/${id}`
    );

    if (!snapshot) return;

    scrollRestorationService.restorePosition({
      itemId: snapshot.itemId,
      cardTop: snapshot.cardTop,
      scrollY: snapshot.scrollY,

      onComplete: () => {
        scrollRestorationService.consumeSnapshot();
      },
    });
  }, [loading, id, navType]);

  /* =========================================================
     REPORTER
  ========================================================= */

  const getReporterInfo = useCallback(() => {
    if (!item) return null;

    const owner = item.user || item.owner || {};

    const ownerId =
      owner.id ??
      owner.ID ??
      owner._id ??
      getItemOwnerId(item);

    const ownerName =
      owner.name ||
      owner.full_name ||
      owner.fullName ||
      item.contactName ||
      'Người dùng DNTU';

    return {
      id: ownerId,
      name: ownerName,
      avatar:
        owner.avatar_url ||
        owner.avatarUrl ||
        owner.avatar ||
        '',
      role: owner.role || '',
      faculty: owner.faculty || '',
    };
  }, [item]);

  /* =========================================================
     OWNER PERMISSION
  ========================================================= */

  const ownerId = item ? getItemOwnerId(item) : '';

  const isMyPost =
    Boolean(user) &&
    !authLoading &&
    isSameEntityId(user.id, ownerId);

  /* =========================================================
     CLAIM ITEM
  ========================================================= */

  const handleClaimSubmit = async () => {
    if (!user) {
      toast.error('Vui lòng đăng nhập để gửi yêu cầu nhận đồ.');

      navigate('/login', {
        state: {
          from: {
            pathname: `/items/${id}`,
          },
        },
      });

      return;
    }

    if (!claimReason.trim()) {
      toast.error('Vui lòng nhập lý do nhận đồ.');
      return;
    }

    if (!claimEvidence.trim()) {
      toast.error(
        'Vui lòng cung cấp đặc điểm nhận dạng hoặc bằng chứng xác minh.'
      );

      return;
    }

    if (!item?.id) {
      toast.error('Không xác định được vật phẩm.');
      return;
    }

    setSubmittingClaim(true);

    try {
      const evidences = claimImage.trim()
        ? [claimImage.trim()]
        : [];

      /*
       * claimService.js expects:
       * itemId
       * reason
       * secretDetails
       * evidences
       *
       * claimantId and claimantName are not required.
       * Backend gets claimant from JWT.
       */
      await claimService.createClaim({
        itemId: item.id,
        reason: claimReason.trim(),
        secretDetails: claimEvidence.trim(),
        evidences,
      });

      toast.success(
        'Yêu cầu nhận đồ đã được gửi thành công.'
      );

      setShowClaimModal(false);
      setClaimReason('');
      setClaimEvidence('');
      setClaimImage('');
    } catch (error) {
      console.error('Create claim error:', error);

      toast.error(
        error.message || 'Không thể gửi yêu cầu nhận đồ.'
      );
    } finally {
      setSubmittingClaim(false);
    }
  };

  /* =========================================================
     CONTACT
  ========================================================= */

  const handleToggleContact = useCallback(async () => {
    if (showContact) {
      setShowContact(false);
      setContactError('');
      return;
    }

    if (authLoading || contactLoading) return;

    if (!user) {
      toast.error('Vui lòng đăng nhập để xem thông tin liên hệ.');

      navigate('/login', {
        state: {
          from: {
            pathname: location.pathname,
            search: location.search,
            hash: location.hash,
            state: {
              ...location.state,
              resumeAction: 'revealContact',
            },
          },
          resumeAction: 'revealContact',
        },
      });

      return;
    }

    setContactLoading(true);
    setContactError('');

    try {
      const contact = await itemService.getItemContact(id);

      const phone = String(contact?.phone || '').trim();
      const email = String(contact?.email || '').trim();

      if (!phone && !email) {
        throw new Error(
          'Người đăng chưa cung cấp thông tin liên hệ.'
        );
      }

      setFullContact({
        phone,
        email,
      });

      setShowContact(true);
    } catch (error) {
      const message =
        error.message || 'Không thể tải thông tin liên hệ.';

      setFullContact(null);
      setShowContact(false);
      setContactError(message);

      toast.error(message);
    } finally {
      setContactLoading(false);
    }
  }, [
    authLoading,
    contactLoading,
    id,
    location,
    navigate,
    showContact,
    user,
  ]);

  /* =========================================================
     RESUME ACTION AFTER LOGIN
  ========================================================= */

  useEffect(() => {
    const resumeAction = location.state?.resumeAction;

    if (
      loading ||
      authLoading ||
      !['contact', 'revealContact'].includes(resumeAction)
    ) {
      return;
    }

    if (!user) {
      navigate('/login', {
        replace: true,
        state: {
          from: {
            pathname: location.pathname,
            search: location.search,
            hash: location.hash,
            state: {
              ...location.state,
              resumeAction,
            },
          },
          resumeAction,
        },
      });

      return;
    }

    if (
      resumeAction === 'contact' &&
      !isMyPost &&
      ownerId
    ) {
      setShowChatModal(true);
    }

    if (resumeAction === 'revealContact') {
      void handleToggleContact();
    }

    navigate(
      `${location.pathname}${location.search}${location.hash}`,
      {
        replace: true,
        state: {
          ...location.state,
          resumeAction: null,
        },
      }
    );
  }, [
    authLoading,
    handleToggleContact,
    isMyPost,
    loading,
    location,
    navigate,
    ownerId,
    user,
  ]);

  /* =========================================================
     BOOKMARK
  ========================================================= */

  useEffect(() => {
    if (!item?.id || !user?.id) {
      setIsSaved(false);
      return;
    }

    setIsSaved(
      getInitialBookmark(user.id, item.id)
    );
  }, [item?.id, user?.id]);

  const handleToggleSave = () => {
    if (!user) {
      toast.error('Vui lòng đăng nhập để lưu bài đăng.');

      navigate('/login', {
        state: {
          from: {
            pathname: `/items/${id}`,
          },
        },
      });

      return;
    }

    if (!item?.id) return;

    const key = getBookmarkKey(user.id, item.id);

    try {
      const current = JSON.parse(
        localStorage.getItem(key) || '[]'
      );

      const list = Array.isArray(current) ? current : [];

      const itemId = getEntityId(item.id);

      const exists = list.includes(itemId);

      const next = exists
        ? list.filter((savedId) => savedId !== itemId)
        : [...list, itemId];

      localStorage.setItem(key, JSON.stringify(next));

      setIsSaved(!exists);

      toast.success(
        exists
          ? 'Đã bỏ lưu bài đăng.'
          : 'Đã lưu bài đăng vào mục yêu thích.'
      );
    } catch (error) {
      console.error('Bookmark error:', error);

      toast.error('Không thể lưu bài đăng.');
    }
  };

  /* =========================================================
     SHARE
  ========================================================= */

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(
        window.location.href
      );

      toast.success('Đã sao chép liên kết.');
    } catch {
      toast.error('Không thể sao chép liên kết.');
    }
  };

  /* =========================================================
     BACK
  ========================================================= */

  const handleBack = () => {
    const historyIndex = window.history.state?.idx;

    if (
      typeof historyIndex === 'number' &&
      historyIndex > 0
    ) {
      navigate(-1);
      return;
    }

    const snapshot =
      scrollRestorationService.getLastSnapshot();

    navigate(
      location.state?.returnPath ||
        snapshot?.fullPath ||
        '/search'
    );
  };

  /* =========================================================
     SIMILAR ITEM
  ========================================================= */

  const handleSimilarItemClick = (similarItem, event) => {
    const similarId =
      similarItem.id ??
      similarItem.ID ??
      similarItem._id;

    if (!similarId) return;

    const cardElement =
      document.getElementById(`item-card-${similarId}`) ||
      event?.currentTarget;

    const cardTop = cardElement
      ? cardElement.getBoundingClientRect().top
      : null;

    scrollRestorationService.saveSnapshot({
      path: `/items/${id}`,
      fullPath:
        window.location.pathname +
        window.location.search,
      scrollY:
        window.scrollY ||
        document.documentElement.scrollTop ||
        0,
      itemId: similarId,
      cardTop,
    });

    navigate(`/items/${similarId}`, {
      state: {
        from: 'detail',
        returnPath: `/items/${id}`,
        itemId: similarId,
      },
    });
  };

  /* =========================================================
     CHAT
  ========================================================= */

  const handleOpenChat = () => {
    if (authLoading) return;

    if (!user) {
      toast.error(
        'Vui lòng đăng nhập để trao đổi tin nhắn riêng.'
      );

      navigate('/login', {
        state: {
          from: {
            pathname: `/items/${id}`,
            state: {
              resumeAction: 'contact',
            },
          },
          resumeAction: 'contact',
        },
      });

      return;
    }

    if (isMyPost) {
      toast.info('Đây là bài đăng của bạn.');
      return;
    }

    setShowChatModal(true);
  };

  const handleManagePost = () => {
    navigate(
      `/my-posts?edit=${encodeURIComponent(item.id)}`
    );
  };

  /* =========================================================
     LOADING
  ========================================================= */

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 bg-[#F8F6F3] min-h-screen">
        <LoadingSkeleton type="detail" count={4} />
      </div>
    );
  }

  if (!item) return null;

  /* =========================================================
     ITEM DATA
  ========================================================= */

  const reporter = getReporterInfo() || {
    id: ownerId,
    name: 'Người dùng DNTU',
    avatar: '',
    role: '',
  };

  const isFound =
    getItemType(item) === 'FOUND' ||
    getItemStatus(item) === 'FOUND';

  const isReturned =
    getItemStatus(item) === 'RETURNED';

  const isClosed =
    getItemStatus(item) === 'CLOSED';

  const isOfficeKept = getIsOfficeKept(item);

  const galleryImages = getItemImages(item);

  const categoryText = getCategoryName(item);

  const locationText = getLocationName(item);

  const campusLocation = getCanonicalLocation({
    ...(typeof item.location === 'object'
      ? item.location
      : {}),
    id: item.location_id || item.locationId,
    name: locationText,
  });

  const campusUrl =
    getCampusLocationUrl(campusLocation || locationText);

  const campusPhoto =
    campusLocation?.image_url ||
    '/campus/places/aerial.webp';

  const itemId = getEntityId(
    item.id ?? item.ID ?? item._id
  );

  const itemDate = item.date || item.createdAt;

  const storageLocation = getStorageLocation(item);

  const distinctFeatures =
    item.distinct_features ||
    item.distinctFeatures ||
    '';

  const custodyStatus = getCustodyStatus(item);

  const isClaimable =
    isFound &&
    !isReturned &&
    !isClosed;

  const canContact =
    !authLoading &&
    !isMyPost &&
    !isOfficeKept &&
    !isReturned &&
    !isClosed;

  const canReportFound =
    !isMyPost &&
    !isFound &&
    !isReturned &&
    !isClosed;

  const canManage =
    isMyPost;

  const views =
    typeof item.views === 'number'
      ? item.views
      : null;

  /* =========================================================
     RENDER
  ========================================================= */

  return (
    <div className="bg-[#F8F6F3] min-h-screen pb-20 font-sans">

      {/* BREADCRUMB */}

      <div className="bg-white border-b border-[#E8E2DD]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-wrap items-center justify-between gap-3 text-xs sm:text-sm">

          <nav className="flex items-center gap-2 text-gray-600">
            <Link
              to="/"
              className="hover:text-[#741216] transition-colors flex items-center"
            >
              <Home className="w-4 h-4" />
            </Link>

            <span className="text-gray-300">›</span>

            <Link
              to="/search"
              className="hover:text-[#741216] transition-colors"
            >
              Tìm đồ thất lạc
            </Link>

            <span className="text-gray-300">›</span>

            <span className="text-[#741216] font-semibold truncate max-w-xs sm:max-w-md">
              {item.title}
            </span>
          </nav>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleBack}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-700 hover:text-[#741216] transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Quay lại danh sách</span>
            </button>

            <button
              type="button"
              onClick={handleShare}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-gray-700 hover:text-[#741216] text-xs font-semibold transition-colors shadow-2xs"
            >
              <Share2 className="w-3.5 h-3.5 text-[#741216]" />
              <span>Chia sẻ</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">

        {/* MAIN GRID */}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

          {/* GALLERY */}

          <div className="min-w-0 space-y-3 lg:col-span-5">
            <ItemGallery
              key={itemId}
              images={galleryImages}
              itemId={itemId}
              title={item.title}
              category={categoryText}
              isFound={isFound}
            />
          </div>

          {/* ITEM INFO */}

          <div className="lg:col-span-4 space-y-5">

            <div>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-[#FFEBEE] text-[#C62828] border border-[#FFCDD2]">
                <CategoryIcon
                  category={categoryText}
                  className="w-3.5 h-3.5"
                />
                <span>{categoryText}</span>
              </span>
            </div>

            <div>
              <h1 className="text-2xl sm:text-3xl font-serif font-black text-[#741216] tracking-tight leading-snug">
                {item.title}
              </h1>

              <p className="text-xs sm:text-sm text-gray-600 mt-1 leading-relaxed">
                {item.description
                  ? item.description.slice(0, 120)
                  : 'Người đăng chưa cung cấp mô tả.'}
              </p>
            </div>

            {/* STATUS */}

            <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-xs text-gray-500 py-1 border-b border-gray-200">

              <span
                className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold ${getStatusClass(item)}`}
              >
                {getStatusLabel(item)}
              </span>

              <span>
                Mã bài đăng:{' '}
                <strong className="font-mono text-gray-700">
                  #{itemId || '—'}
                </strong>
              </span>

              {views !== null && (
                <span className="flex items-center gap-1 font-mono">
                  <Eye className="w-3.5 h-3.5 text-gray-400" />
                  <span>{views} lượt xem</span>
                </span>
              )}
            </div>

            {/* ATTRIBUTES */}

            <div className="grid grid-cols-1 min-[420px]:grid-cols-2 gap-4 py-2 text-xs">

              {/* DATE */}

              <div className="flex items-start gap-2.5">
                <div className="p-1.5 rounded-lg bg-red-50 text-[#741216] shrink-0 mt-0.5">
                  <Calendar className="w-4 h-4" />
                </div>

                <div>
                  <span className="text-gray-400 block text-[11px]">
                    Thời gian {isFound ? 'nhặt được' : 'thất lạc'}
                  </span>

                  <strong className="text-gray-800 font-bold block">
                    {itemDate ? formatDate(itemDate) : 'Chưa cập nhật'}
                  </strong>

                  {item.createdAt && (
                    <span className="text-[11px] text-gray-500">
                      ({formatRelative(item.createdAt)})
                    </span>
                  )}
                </div>
              </div>

              {/* LOCATION */}

              <div className="flex items-start gap-2.5">
                <div className="p-1.5 rounded-lg bg-red-50 text-[#741216] shrink-0 mt-0.5">
                  <MapPin className="w-4 h-4" />
                </div>

                <div>
                  <span className="text-gray-400 block text-[11px]">
                    Địa điểm {isFound ? 'nhặt được' : 'thất lạc'}
                  </span>

                  <Link
                    to={campusUrl}
                    className="text-gray-800 hover:text-[#741216] font-bold inline-flex items-center gap-1 group"
                  >
                    <span>
                      {campusLocation?.name || locationText}
                    </span>

                    <ExternalLink className="w-3 h-3 opacity-60 group-hover:opacity-100" />
                  </Link>

                  <span className="text-[11px] text-gray-500">
                    DNTU
                  </span>
                </div>
              </div>

              {/* BRAND */}

              <div className="flex items-start gap-2.5">
                <div className="p-1.5 rounded-lg bg-red-50 text-[#741216] shrink-0 mt-0.5">
                  <Smartphone className="w-4 h-4" />
                </div>

                <div>
                  <span className="text-gray-400 block text-[11px]">
                    Hãng / thương hiệu
                  </span>

                  <strong className="text-gray-800 font-bold block">
                    {item.brand || 'Chưa cập nhật'}
                  </strong>
                </div>
              </div>

              {/* COLOR */}

              <div className="flex items-start gap-2.5">
                <div className="p-1.5 rounded-lg bg-red-50 text-[#741216] shrink-0 mt-0.5">
                  <Sparkles className="w-4 h-4" />
                </div>

                <div>
                  <span className="text-gray-400 block text-[11px]">
                    Màu sắc
                  </span>

                  <strong className="text-gray-800 font-bold block">
                    {item.color || 'Chưa cập nhật'}
                  </strong>
                </div>
              </div>

              {/* DISTINCT FEATURES */}

              <div className="flex items-start gap-2.5">
                <div className="p-1.5 rounded-lg bg-red-50 text-[#741216] shrink-0 mt-0.5">
                  <FileText className="w-4 h-4" />
                </div>

                <div>
                  <span className="text-gray-400 block text-[11px]">
                    Đặc điểm nhận dạng
                  </span>

                  <strong className="text-gray-800 font-bold block">
                    {distinctFeatures || 'Chưa cập nhật'}
                  </strong>
                </div>
              </div>

              {/* CUSTODY */}

              <div className="flex items-start gap-2.5">
                <div className="p-1.5 rounded-lg bg-red-50 text-[#741216] shrink-0 mt-0.5">
                  <Building2 className="w-4 h-4" />
                </div>

                <div>
                  <span className="text-gray-400 block text-[11px]">
                    Nơi giữ vật phẩm
                  </span>

                  <strong className="text-gray-800 font-bold block">
                    {storageLocation || 'Chưa cập nhật'}
                  </strong>

                  <span className="text-[11px] text-gray-500">
                    {custodyStatus || 'Chưa xác định trạng thái lưu giữ'}
                  </span>
                </div>
              </div>

            </div>
          </div>

          {/* POSTER & ACTIONS */}

          <div className="lg:col-span-3 space-y-4">

            <div className="bg-white rounded-2xl border border-[#E8E2DD] p-5 shadow-2xs space-y-4">

              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">
                Người đăng
              </span>

              <div className="flex items-center gap-3">
                <Avatar
                  name={reporter.name}
                  src={reporter.avatar}
                  size="lg"
                />

                <div>
                  <h4 className="font-bold text-gray-900 text-sm leading-tight">
                    {reporter.name}
                  </h4>

                  {reporter.role && (
                    <div className="mt-1">
                      <span className="inline-block bg-[#741216] text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                        {reporter.role}
                      </span>
                    </div>
                  )}

                  {!reporter.role && (
                    <span className="text-[11px] text-gray-400 block mt-1">
                      Thông tin vai trò chưa cập nhật
                    </span>
                  )}
                </div>
              </div>

              {/* ACTIONS */}

              <div className="space-y-2.5 pt-1">

                {authLoading ? (
                  <button
                    type="button"
                    disabled
                    className="w-full bg-gray-100 text-gray-500 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 cursor-wait"
                  >
                    Đang xác định quyền...
                  </button>
                ) : canManage ? (
                  <button
                    type="button"
                    onClick={handleManagePost}
                    className="w-full bg-[#741216] text-white py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-[#8e171c] transition shadow-xs"
                  >
                    <FileText className="w-4 h-4 shrink-0" />
                    <span>Quản lý bài đăng</span>
                  </button>
                ) : isOfficeKept ? (
                  <div className="p-3 bg-[#FAF0F1] rounded-xl border border-red-100 text-xs space-y-2">
                    <div className="flex items-center gap-2 text-[#741216] font-bold">
                      <Building2 className="w-4 h-4 shrink-0" />
                      <span>Lưu giữ tại văn phòng</span>
                    </div>

                    <p className="text-gray-600 text-[11px] leading-relaxed">
                      Vị trí:{' '}
                      <strong className="text-gray-900">
                        {storageLocation || 'Văn phòng Lost & Found DNTU'}
                      </strong>
                    </p>

                    <p className="text-gray-500 text-[11px]">
                      Vui lòng gửi yêu cầu nhận lại để được xác minh.
                    </p>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={handleOpenChat}
                    className="w-full bg-[#741216] text-white py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-[#8e171c] transition shadow-xs whitespace-nowrap"
                  >
                    <MessageCircle className="w-4 h-4 shrink-0" />

                    <span>
                      {isReturned
                        ? 'Xem trao đổi'
                        : isFound
                        ? 'Chat với người đang giữ đồ'
                        : 'Chat riêng với người đăng'}
                    </span>
                  </button>
                )}

                {/* CONTACT */}

                {canContact && (
                  <Button
                    type="button"
                    onClick={handleToggleContact}
                    loading={contactLoading}
                    loadingText="Đang tải liên hệ…"
                    icon={Lock}
                    variant="outline"
                    size="sm"
                    className="min-h-11 w-full"
                  >
                    <span>
                      {showContact
                        ? 'Ẩn thông tin liên hệ'
                        : 'Xem thông tin liên hệ'}
                    </span>
                  </Button>
                )}

                {contactError && !showContact && canContact && (
                  <p
                    role="alert"
                    className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700"
                  >
                    {contactError}
                  </p>
                )}

                {/* CONTACT INFO */}

                {showContact && fullContact && canContact && (
                  <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 text-xs space-y-2 animate-fadeIn">

                    {fullContact.phone && (
                      <div className="flex min-w-0 items-center gap-2 text-gray-700">
                        <Phone className="h-3.5 w-3.5 shrink-0 text-[#741216]" />

                        <span className="min-w-0">
                          SĐT:{' '}
                          <a
                            className="break-all font-bold text-[#741216] hover:underline"
                            href={`tel:${fullContact.phone.replace(/[^\d+]/g, '')}`}
                          >
                            {fullContact.phone}
                          </a>
                        </span>
                      </div>
                    )}

                    {fullContact.email && (
                      <div className="flex min-w-0 items-center gap-2 text-gray-700">
                        <Mail className="h-3.5 w-3.5 shrink-0 text-[#741216]" />

                        <span className="min-w-0">
                          Email:{' '}
                          <a
                            className="break-all font-bold text-[#741216] hover:underline"
                            href={`mailto:${fullContact.email}`}
                          >
                            {fullContact.email}
                          </a>
                        </span>
                      </div>
                    )}

                    <p className="text-[10px] text-gray-500 italic pt-1 border-t border-gray-200">
                      Khuyến nghị trao đổi qua hệ thống UniFind để bảo đảm an toàn.
                    </p>
                  </div>
                )}

                {/* CLAIM */}

                {!isMyPost && isClaimable && (
                  <button
                    type="button"
                    onClick={() => setShowClaimModal(true)}
                    className="w-full bg-[#FAF0F1] hover:bg-[#F5E2E4] text-[#741216] py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Gửi yêu cầu nhận lại</span>
                  </button>
                )}

                {/* FOUND REPORT */}

                {canReportFound && (
                  <div className="w-full p-3 rounded-xl border border-amber-200 bg-amber-50">
                    <p className="text-xs text-amber-800 leading-relaxed">
                      Bạn đã tìm thấy vật phẩm này? Hãy liên hệ người đăng qua chat để trao đổi.
                    </p>

                    <button
                      type="button"
                      onClick={handleOpenChat}
                      className="mt-2 w-full bg-amber-500 hover:bg-amber-600 text-white py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      <span>Liên hệ người đăng</span>
                    </button>
                  </div>
                )}

                {/* BOOKMARK */}

                <button
                  type="button"
                  onClick={handleToggleSave}
                  className={`w-full py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition border ${
                    isSaved
                      ? 'bg-red-50 border-red-200 text-[#741216]'
                      : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <Bookmark
                    className={`w-3.5 h-3.5 ${
                      isSaved ? 'fill-current' : ''
                    }`}
                  />

                  <span>
                    {isSaved
                      ? 'Đã lưu bài đăng'
                      : 'Lưu bài đăng'}
                  </span>
                </button>

              </div>

              {/* SAFETY */}

              <div className="pt-3 border-t border-gray-100 flex items-start gap-2.5 text-xs text-gray-600">
                <ShieldAlert className="w-4 h-4 text-[#741216] shrink-0 mt-0.5" />

                <div className="space-y-1">
                  <strong className="text-gray-900 block font-bold">
                    An toàn là trên hết
                  </strong>

                  <p className="text-[11px] text-gray-500 leading-relaxed">
                    Không chia sẻ thông tin cá nhân nhạy cảm.
                  </p>

                  <Link
                    to="/guidelines"
                    className="inline-block text-[11px] font-bold text-[#741216] hover:underline"
                  >
                    Xem hướng dẫn an toàn →
                  </Link>
                </div>
              </div>

            </div>
          </div>

        </div>

        {/* DESCRIPTION & LOCATION */}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">

          {/* DESCRIPTION */}

          <div className="bg-white rounded-2xl border border-[#E8E2DD] p-6 shadow-2xs flex flex-col justify-between relative overflow-hidden">

            <div>
              <div className="flex items-center gap-2 pb-3 mb-3 border-b border-gray-100">
                <FileText className="w-4 h-4 text-[#741216]" />

                <h3 className="font-bold text-gray-900 text-base">
                  Mô tả chi tiết
                </h3>
              </div>

              <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">
                {item.description || 'Người đăng chưa cung cấp mô tả chi tiết.'}
              </p>
            </div>

            {distinctFeatures && (
              <div className="pt-5">
                <span className="text-xs font-bold text-gray-500 block mb-1">
                  Đặc điểm nhận dạng
                </span>

                <p className="text-sm text-gray-700 whitespace-pre-line">
                  {distinctFeatures}
                </p>
              </div>
            )}

          </div>

          {/* LOCATION */}

          <div className="bg-white rounded-2xl border border-[#E8E2DD] p-6 shadow-2xs space-y-4">

            <div className="flex items-center justify-between pb-3 border-b border-gray-100">

              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-[#741216]" />

                <h3 className="font-bold text-gray-900 text-base">
                  Vị trí {isFound ? 'nhặt được' : 'thất lạc'}
                </h3>
              </div>

              <Link
                to={campusUrl}
                className="text-xs font-bold text-[#741216] hover:underline flex items-center gap-1"
              >
                <span>Xem trên bản đồ</span>
                <ExternalLink className="w-3 h-3" />
              </Link>

            </div>

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">

              <div className="sm:col-span-8 bg-[#FAF8F5] border border-gray-200 rounded-xl p-4 flex items-center gap-3">

                <div className="w-10 h-10 rounded-full bg-red-100 text-[#741216] flex items-center justify-center shrink-0">
                  <MapPin className="w-5 h-5" />
                </div>

                <div>
                  <Link
                    to={campusUrl}
                    className="text-sm font-bold text-gray-900 hover:text-[#741216] inline-flex items-center gap-1"
                  >
                    {campusLocation?.name || locationText}

                    <ExternalLink className="w-3 h-3" />
                  </Link>

                  <span className="text-xs text-gray-500 block">
                    DNTU
                  </span>
                </div>

              </div>

              <div className="sm:col-span-4 h-24 rounded-xl overflow-hidden border border-gray-200 shadow-2xs">
                <img
                  src={campusPhoto}
                  alt={campusLocation?.name || 'DNTU Campus'}
                  className="w-full h-full object-cover"
                  onError={(event) => {
                    event.currentTarget.style.display = 'none';
                  }}
                />
              </div>

            </div>

          </div>

        </div>

        {/* RELATED ITEMS */}

        <div className="pt-4 space-y-4">

          <div className="flex items-center justify-between">

            <div className="flex items-center gap-2">
              <Heart className="w-4 h-4 text-[#741216]" />

              <h2 className="text-lg font-bold text-gray-900">
                Có thể bạn cũng quan tâm
              </h2>
            </div>

            <Link
              to="/search"
              className="text-xs font-bold text-[#741216] hover:underline flex items-center gap-1"
            >
              <span>Xem thêm</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>

          </div>

          {similarItems.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">

              {similarItems.slice(0, 4).map((similarItem) => {
                const similarId =
                  similarItem.id ??
                  similarItem.ID ??
                  similarItem._id;

                return (
                  <ItemCard
                    key={getEntityId(similarId)}
                    item={similarItem}
                    onClick={handleSimilarItemClick}
                  />
                );
              })}

            </div>
          ) : (
            <div className="bg-white border border-[#E8E2DD] rounded-2xl p-6 text-sm text-gray-500">
              Chưa có vật phẩm tương tự.
            </div>
          )}

        </div>

      </div>

      {/* CLAIM MODAL */}

      <Modal
        isOpen={showClaimModal}
        onClose={() => {
          if (!submittingClaim) {
            setShowClaimModal(false);
          }
        }}
        title="Gửi yêu cầu nhận lại vật phẩm"
      >

        <div className="space-y-4 pt-1">

          <div className="p-3 bg-red-50 border border-red-100 rounded-xl flex items-center gap-3">

            <div className="w-12 h-12 rounded-lg bg-red-100 shrink-0 overflow-hidden flex items-center justify-center">

              {galleryImages.length > 0 ? (
                <img
                  src={galleryImages[0]}
                  alt=""
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-[#741216]">
                  <CategoryIcon
                    category={categoryText}
                    className="w-6 h-6"
                  />
                </div>
              )}

            </div>

            <div>
              <h4 className="font-semibold text-sm text-gray-900 truncate max-w-xs">
                {item.title}
              </h4>

              <p className="text-xs text-gray-500">
                {categoryText} • {locationText}
              </p>
            </div>

          </div>

          <Textarea
            label="Lý do nhận đồ *"
            placeholder="Giải thích vì sao bạn là chủ sở hữu của vật phẩm này..."
            value={claimReason}
            onChange={(event) => setClaimReason(event.target.value)}
            rows={3}
            required
          />

          <Textarea
            label="Bằng chứng / Đặc điểm nhận dạng *"
            placeholder="Nhập đặc điểm riêng mà chỉ chủ sở hữu biết..."
            value={claimEvidence}
            onChange={(event) => setClaimEvidence(event.target.value)}
            rows={3}
            required
          />

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Link ảnh minh chứng (không bắt buộc)
            </label>

            <input
              type="url"
              placeholder="https://..."
              value={claimImage}
              onChange={(event) => setClaimImage(event.target.value)}
              className="w-full px-3 py-2 text-xs border border-gray-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#741216]"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-gray-100">

            <Button
              variant="ghost"
              disabled={submittingClaim}
              onClick={() => setShowClaimModal(false)}
            >
              Hủy bỏ
            </Button>

            <Button
              onClick={handleClaimSubmit}
              loading={submittingClaim}
              className="bg-[#741216] hover:bg-[#8e171c] text-white"
            >
              Gửi yêu cầu
            </Button>

          </div>

        </div>

      </Modal>

      {/* REPORT POST */}

      <ReportModal
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        postId={item.id}
        postTitle={item.title}
      />

      {/* CHAT */}

      <ItemChatModal
        isOpen={showChatModal}
        onClose={() => setShowChatModal(false)}
        item={item}
        currentUser={user}
        recipientUser={{
          id: ownerId,
          name: reporter.name || 'Người dùng DNTU',
          avatar: reporter.avatar || '',
          role: reporter.role || '',
        }}
      />

    </div>
  );
}
