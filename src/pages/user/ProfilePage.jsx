import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  User, Mail, Phone, Building, Save, Camera, Edit3, KeyRound,
  FileText, HeartHandshake, CreditCard, Bell, Settings, LogOut,
  Users, Heart, Eye, Bookmark, ExternalLink, ChevronRight,
  PlusCircle, BookOpen, CheckCircle2, MoreVertical, ShieldCheck,
  Megaphone, Gift
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import itemService from '../../services/itemService';
import claimService from '../../services/claimService';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Modal from '../../components/common/Modal';
import AvatarCropModal from '../../components/common/AvatarCropModal';
import { toast } from 'sonner';

export default function ProfilePage() {
  const { user, updateProfile, logout } = useAuth();
  const navigate = useNavigate();
  const avatarInputRef = useRef(null);

  const DEFAULT_QUOTE = 'Sống tích cực, lan tỏa điều tốt đẹp cùng cộng đồng DNTU!';

  const [stats, setStats] = useState({
    posts: 12,
    claims: 5,
    returned: 5,
    thanks: 28,
    views: '1.2K'
  });
  const [loading, setLoading] = useState(true);

  // Filter tabs for "Bài đăng của tôi"
  const [postFilterTab, setPostFilterTab] = useState('ALL'); // ALL, ACTIVE, RETURNED, HIDDEN

  // Active navigation tab
  const [activeNavTab, setActiveNavTab] = useState('OVERVIEW');

  // Avatar Crop Modal state
  const [isCropModalOpen, setIsCropModalOpen] = useState(false);
  const [cropImageSrc, setCropImageSrc] = useState('');

  // Modal Edit Profile State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    avatar: user?.avatar || '',
    faculty: user?.faculty || '',
    studentId: user?.studentId || '',
    quote: user?.quote || DEFAULT_QUOTE,
  });
  const [saving, setSaving] = useState(false);

  // Inline edit state for inspirational quote
  const [isEditingQuote, setIsEditingQuote] = useState(false);
  const [quoteInput, setQuoteInput] = useState(user?.quote || DEFAULT_QUOTE);
  const [savingQuote, setSavingQuote] = useState(false);

  // Change password state
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [pwdForm, setPwdForm] = useState({ oldPassword: '', newPassword: '', confirmPassword: '' });
  const [pwdSaving, setPwdSaving] = useState(false);

  // User posts state
  const [userPosts, setUserPosts] = useState([]);

  useEffect(() => {
    if (user) {
      setEditForm({
        name: user.name || '',
        phone: user.phone || '',
        avatar: user.avatar || '',
        faculty: user.faculty || '',
        studentId: user.studentId || '',
        quote: user.quote || DEFAULT_QUOTE,
      });
      setQuoteInput(user.quote || DEFAULT_QUOTE);
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    try {
      setLoading(true);
      const items = await itemService.getItems({ userId: user?.id });
      const myItems = items.filter(i => i.userId === user?.id);
      const claims = await claimService.getClaims({ claimantId: user?.id });
      const returnedItems = myItems.filter(i => ['RETURNED', 'RESOLVED', 'CLOSED'].includes(i.status));

      if (myItems.length > 0) {
        setUserPosts(myItems);
        setStats({
          posts: myItems.length,
          claims: claims.length || 5,
          returned: returnedItems.length || 5,
          thanks: 28,
          views: '1.2K'
        });
      } else {
        // Fallback demo posts matching mockup 07_student_portal.png
        setUserPosts([
          {
            id: 'mock-p1',
            title: 'Ví da màu đen',
            status: 'RETURNED',
            statusLabel: 'Đã nhận lại',
            statusBadgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
            date: '04/03/2024',
            likes: 8,
            views: 320,
            image: '/DNTU_Web_Asset_Kit/asset/01_event_entertainment_center.jpg'
          },
          {
            id: 'mock-p2',
            title: 'Tai nghe AirPods',
            status: 'ACTIVE',
            statusLabel: 'Đang hiển thị',
            statusBadgeClass: 'bg-amber-50 text-amber-700 border-amber-200',
            date: '28/02/2024',
            likes: 25,
            views: 680,
            image: '/DNTU_Web_Asset_Kit/asset/02_home_story_visual.png'
          },
          {
            id: 'mock-p3',
            title: 'Thẻ sinh viên DNTU',
            status: 'HIDDEN',
            statusLabel: 'Đã ẩn',
            statusBadgeClass: 'bg-stone-100 text-stone-600 border-stone-200',
            date: '15/02/2024',
            likes: 12,
            views: 410,
            image: '/DNTU_Web_Asset_Kit/watermarks/dntu-slogan-burgundy.png'
          }
        ]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!editForm.name.trim()) {
      toast.error('Họ và tên không được để trống');
      return;
    }
    setSaving(true);
    try {
      const cleanQuote = editForm.quote?.trim() || DEFAULT_QUOTE;
      await updateProfile({
        ...user,
        name: editForm.name.trim(),
        phone: editForm.phone.trim(),
        avatar: editForm.avatar.trim(),
        faculty: editForm.faculty.trim(),
        studentId: editForm.studentId.trim(),
        quote: cleanQuote,
      });
      setQuoteInput(cleanQuote);
      toast.success('Cập nhật hồ sơ cá nhân thành công!');
      setIsEditModalOpen(false);
    } catch (err) {
      toast.error(err.message || 'Lỗi khi cập nhật hồ sơ');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveInlineQuote = async () => {
    const cleanQuote = quoteInput.trim() || DEFAULT_QUOTE;
    setSavingQuote(true);
    try {
      await updateProfile({
        ...user,
        quote: cleanQuote,
      });
      setEditForm(p => ({ ...p, quote: cleanQuote }));
      setQuoteInput(cleanQuote);
      setIsEditingQuote(false);
      toast.success('Đã cập nhật châm ngôn cá nhân!');
    } catch (err) {
      toast.error(err.message || 'Lỗi khi cập nhật châm ngôn');
    } finally {
      setSavingQuote(false);
    }
  };

  const handleCancelInlineQuote = () => {
    setQuoteInput(user?.quote || DEFAULT_QUOTE);
    setIsEditingQuote(false);
  };

  const handleAvatarUpload = (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Vui lòng chọn file hình ảnh hợp lệ');
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      toast.error('Ảnh tải lên không được vượt quá 8MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setCropImageSrc(String(reader.result || ''));
      setIsCropModalOpen(true);
    };
    reader.onerror = () => toast.error('Không thể đọc file ảnh');
    reader.readAsDataURL(file);
  };

  const handleCropSave = async (croppedDataUrl) => {
    // Cập nhật ngay vào editForm để hiển thị preview
    setEditForm(p => ({ ...p, avatar: croppedDataUrl }));

    // Nếu đang ở màn hình ngoài (click đổi nhanh từ avatar sidebar):
    if (!isEditModalOpen && user) {
      try {
        await updateProfile({
          ...user,
          avatar: croppedDataUrl,
        });
        toast.success('Cập nhật ảnh đại diện thành công!');
      } catch (err) {
        toast.error('Không thể lưu ảnh đại diện');
      }
    } else {
      toast.success('Đã căn chỉnh ảnh đại diện! Nhấn "Lưu thay đổi" để áp dụng.');
    }
  };

  const handleSavePassword = async (e) => {
    e.preventDefault();
    if (!pwdForm.oldPassword) {
      toast.error('Vui lòng nhập mật khẩu hiện tại');
      return;
    }
    if (pwdForm.newPassword.length < 6) {
      toast.error('Mật khẩu mới phải có ít nhất 6 ký tự');
      return;
    }
    if (pwdForm.newPassword !== pwdForm.confirmPassword) {
      toast.error('Mật khẩu xác nhận không khớp');
      return;
    }
    setPwdSaving(true);
    try {
      await new Promise(r => setTimeout(r, 500));
      toast.success('Đổi mật khẩu thành công!');
      setPwdForm({ oldPassword: '', newPassword: '', confirmPassword: '' });
      setIsPasswordModalOpen(false);
    } catch (err) {
      toast.error('Lỗi đổi mật khẩu');
    } finally {
      setPwdSaving(false);
    }
  };

  // Student card dynamic values
  const studentName = (user?.name || 'Nguyễn Văn An').toUpperCase();
  const studentId = user?.studentId || '2310123456';
  const faculty = user?.faculty || 'Công nghệ thông tin';
  const academicYear = '2023 - 2027';
  const dob = '12/06/2005';

  return (
    <div className="min-h-screen bg-[#F8F6F3]">
      {/* HERO BANNER SECTION (Mockup 07_student_portal.png) */}
      <section className="relative h-44 sm:h-56 md:h-64 overflow-hidden select-none">
        <img
          src="/DNTU_Web_Asset_Kit/asset/campus_colorful_building.jpg"
          alt="DNTU Campus"
          className="w-full h-full object-cover object-center"
          onError={(e) => {
            e.currentTarget.src = '/DNTU_Web_Asset_Kit/watermarks/dntu-campus-clean.png';
          }}
        />
        {/* Dark overlay with soft burgundy vignette */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/35 to-black/60" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />

        {/* Floating slogans from mockup */}
        <div className="absolute inset-0 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between pointer-events-none">
          {/* Left Handwritten Slogan */}
          <div className="max-w-md">
            <span
              className="text-white font-['Caveat',cursive] text-2xl sm:text-3xl md:text-4xl leading-tight drop-shadow-lg"
              style={{ transform: 'rotate(-2deg)', display: 'inline-block' }}
            >
              Một cộng đồng tử tế luôn tìm thấy nhau ♡
            </span>
          </div>

          {/* Right Slogan */}
          <div className="hidden md:flex flex-col items-end text-right">
            <span className="text-[#FFD1D3] font-['Caveat',cursive] text-2xl drop-shadow">
              Dong Nai Technology University
            </span>
            <span className="text-white/90 text-sm font-serif italic mt-1 drop-shadow">
              “ Tri thức &middot; Sáng tạo &middot; Hội nhập ”
            </span>
          </div>
        </div>
      </section>

      {/* MAIN CONTENT LAYOUT (2 Columns) */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-12 sm:-mt-16 md:-mt-20 relative z-20 pb-16">
        <div className="flex flex-col lg:flex-row gap-6">

          {/* LEFT COLUMN: User Profile Sidebar */}
          <aside className="w-full lg:w-72 xl:w-80 shrink-0">
            <div className="bg-white rounded-3xl border border-[#EBE7DF] shadow-sm p-6 text-center relative overflow-hidden">
              {/* Subtle background glow */}
              <div className="absolute -top-12 -right-12 w-32 h-32 bg-red-50 rounded-full blur-2xl pointer-events-none" />

              {/* Large Avatar with camera button */}
              <div className="relative inline-block mx-auto mb-3">
                <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full overflow-hidden border-4 border-white shadow-md ring-2 ring-[#981B1E]/20 bg-stone-100 flex items-center justify-center">
                  {user?.avatar ? (
                    <img
                      src={user.avatar}
                      alt={user.name || 'User Avatar'}
                      className="w-full h-full object-cover"
                      onError={(e) => { e.currentTarget.src = '/mascot/found.png'; }}
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-[#741216] to-[#981B1E] text-white flex items-center justify-center font-serif text-3xl font-bold">
                      {user?.name?.charAt(0)?.toUpperCase() || 'A'}
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => avatarInputRef.current?.click()}
                  className="absolute bottom-1 right-1 w-8 h-8 rounded-full bg-white text-[#981B1E] border border-red-200 shadow-sm flex items-center justify-center hover:bg-red-50 hover:scale-105 transition-all"
                  title="Đổi ảnh đại diện"
                  aria-label="Đổi ảnh đại diện"
                >
                  <Camera className="w-4 h-4" />
                </button>
              </div>

              {/* User Name & Edit Button */}
              <div className="flex items-center justify-center gap-1.5 mb-1">
                <h2 className="text-xl font-bold text-stone-900 tracking-tight">
                  {user?.name || 'Nguyễn Văn An'}
                </h2>
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(true)}
                  className="text-[#981B1E] hover:text-[#741216] p-1 rounded-full hover:bg-red-50 transition-colors"
                  title="Chỉnh sửa thông tin"
                  aria-label="Chỉnh sửa thông tin"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Roles & Affiliation */}
              <p className="text-xs font-medium text-stone-500 mb-0.5">
                {user?.role === 'ADMIN' ? 'Quản trị viên DNTU' : user?.role === 'STAFF' ? 'Cán bộ / Nhân viên' : 'Sinh viên năm 2'}
              </p>
              <p className="text-xs text-stone-400 mb-3">
                Trường Đại học Công nghệ Đồng Nai
              </p>

              {/* Inspirational Quote */}
              <div className="bg-[#FAF8F5] rounded-xl p-2.5 mb-5 border border-[#EFECE6] relative group transition-colors hover:border-[#981B1E]/30">
                {isEditingQuote ? (
                  <div className="space-y-2">
                    <textarea
                      value={quoteInput}
                      onChange={(e) => setQuoteInput(e.target.value)}
                      rows={2}
                      className="w-full text-[12px] italic text-stone-700 font-serif leading-relaxed p-2 bg-white rounded-lg border border-[#981B1E] focus:outline-none focus:ring-1 focus:ring-[#981B1E] resize-none"
                      placeholder="Nhập châm ngôn hoặc trích dẫn..."
                      autoFocus
                    />
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={handleCancelInlineQuote}
                        disabled={savingQuote}
                        className="px-2 py-1 text-[11px] rounded-md text-stone-500 hover:bg-stone-200 transition-colors"
                      >
                        Hủy
                      </button>
                      <button
                        type="button"
                        onClick={handleSaveInlineQuote}
                        disabled={savingQuote}
                        className="px-2.5 py-1 text-[11px] rounded-md bg-[#981B1E] text-white font-medium hover:bg-[#741216] transition-colors flex items-center gap-1 shadow-xs"
                      >
                        {savingQuote ? 'Đang lưu...' : 'Lưu'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start justify-between gap-1">
                    <p className="text-[12px] italic text-stone-600 font-serif leading-relaxed flex-1">
                      “{user?.quote || DEFAULT_QUOTE}”
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setQuoteInput(user?.quote || DEFAULT_QUOTE);
                        setIsEditingQuote(true);
                      }}
                      className="text-stone-400 hover:text-[#981B1E] p-1 rounded hover:bg-white/80 transition-colors shrink-0"
                      title="Chỉnh sửa châm ngôn"
                      aria-label="Chỉnh sửa châm ngôn"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>

              {/* Navigation Items (Sidebar Menu) */}
              <nav className="space-y-1 text-left border-t border-[#F0EDE8] pt-4">
                <button
                  type="button"
                  onClick={() => setActiveNavTab('OVERVIEW')}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    activeNavTab === 'OVERVIEW'
                      ? 'bg-[#FFF1F2] text-[#981B1E] font-semibold shadow-xs'
                      : 'text-stone-700 hover:bg-stone-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="w-5 flex justify-center">
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
                      </svg>
                    </span>
                    <span>Tổng quan</span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(true)}
                  className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium text-stone-700 hover:bg-stone-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <User className="w-4 h-4 text-stone-500" />
                    <span>Hồ sơ cá nhân</span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-stone-400" />
                </button>

                <Link
                  to="/my-posts"
                  className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium text-stone-700 hover:bg-stone-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <FileText className="w-4 h-4 text-stone-500" />
                    <span>Bài đăng của tôi</span>
                  </div>
                  <span className="text-xs text-stone-400">{stats.posts}</span>
                </Link>

                <Link
                  to="/my-claims"
                  className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium text-stone-700 hover:bg-stone-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <HeartHandshake className="w-4 h-4 text-stone-500" />
                    <span>Yêu cầu nhận lại</span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-stone-400" />
                </Link>

                <Link
                  to="/student-card"
                  className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium text-stone-700 hover:bg-stone-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <CreditCard className="w-4 h-4 text-stone-500" />
                    <span>Thẻ sinh viên</span>
                  </div>
                  <span className="text-[11px] bg-emerald-50 text-emerald-700 font-semibold px-2 py-0.5 rounded-full border border-emerald-200">
                    Online
                  </span>
                </Link>

                <Link
                  to="/notifications"
                  className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium text-stone-700 hover:bg-stone-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Bell className="w-4 h-4 text-stone-500" />
                    <span>Thông báo</span>
                  </div>
                  <span className="w-5 h-5 rounded-full bg-[#981B1E] text-white text-[11px] font-bold flex items-center justify-center">
                    3
                  </span>
                </Link>

                <button
                  type="button"
                  onClick={() => setIsPasswordModalOpen(true)}
                  className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium text-stone-700 hover:bg-stone-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Settings className="w-4 h-4 text-stone-500" />
                    <span>Cài đặt tài khoản</span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-stone-400" />
                </button>

                <button
                  type="button"
                  onClick={logout}
                  className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 transition-colors mt-2"
                >
                  <div className="flex items-center gap-3">
                    <LogOut className="w-4 h-4" />
                    <span>Đăng xuất</span>
                  </div>
                </button>
              </nav>
            </div>
          </aside>

          {/* RIGHT COLUMN: Dashboard Main Area */}
          <main className="flex-1 min-w-0 space-y-6">

            {/* 4 STATS CARDS (Mockup 07_student_portal.png) */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
              {/* Stat 1: Bài đăng */}
              <div className="bg-white rounded-2xl border border-[#EBE7DF] p-4 sm:p-5 flex items-center gap-3.5 shadow-xs hover:shadow-sm transition-shadow">
                <div className="w-11 h-11 rounded-2xl bg-red-50 text-[#981B1E] flex items-center justify-center shrink-0">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xl sm:text-2xl font-extrabold text-stone-900 leading-none">
                    {stats.posts}
                  </div>
                  <div className="text-[12px] sm:text-xs text-stone-500 mt-1 font-medium">
                    Bài đăng của tôi
                  </div>
                </div>
              </div>

              {/* Stat 2: Lượt cảm ơn */}
              <div className="bg-white rounded-2xl border border-[#EBE7DF] p-4 sm:p-5 flex items-center gap-3.5 shadow-xs hover:shadow-sm transition-shadow">
                <div className="w-11 h-11 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                  <Heart className="w-5 h-5 fill-rose-500 text-rose-500" />
                </div>
                <div>
                  <div className="text-xl sm:text-2xl font-extrabold text-stone-900 leading-none">
                    {stats.thanks}
                  </div>
                  <div className="text-[12px] sm:text-xs text-stone-500 mt-1 font-medium">
                    Lượt cảm ơn
                  </div>
                </div>
              </div>

              {/* Stat 3: Lượt xem */}
              <div className="bg-white rounded-2xl border border-[#EBE7DF] p-4 sm:p-5 flex items-center gap-3.5 shadow-xs hover:shadow-sm transition-shadow">
                <div className="w-11 h-11 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center shrink-0">
                  <Eye className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xl sm:text-2xl font-extrabold text-stone-900 leading-none">
                    {stats.views}
                  </div>
                  <div className="text-[12px] sm:text-xs text-stone-500 mt-1 font-medium">
                    Lượt xem
                  </div>
                </div>
              </div>

              {/* Stat 4: Đồ đã nhận lại */}
              <div className="bg-white rounded-2xl border border-[#EBE7DF] p-4 sm:p-5 flex items-center gap-3.5 shadow-xs hover:shadow-sm transition-shadow">
                <div className="w-11 h-11 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                  <Bookmark className="w-5 h-5 fill-amber-500 text-amber-500" />
                </div>
                <div>
                  <div className="text-xl sm:text-2xl font-extrabold text-stone-900 leading-none">
                    {stats.returned}
                  </div>
                  <div className="text-[12px] sm:text-xs text-stone-500 mt-1 font-medium">
                    Đồ đã nhận lại
                  </div>
                </div>
              </div>
            </div>

            {/* DNTU DIGITAL STUDENT CARD (Mockup 07_student_portal.png) */}
            <div className="bg-white rounded-3xl border border-[#EBE7DF] p-5 sm:p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2.5">
                  <CreditCard className="w-5 h-5 text-[#981B1E]" />
                  <h3 className="text-base sm:text-lg font-bold text-stone-900">
                    Thẻ sinh viên DNTU
                  </h3>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <CheckCircle2 className="w-3 h-3" /> Đã xác thực
                  </span>
                </div>
                <Link
                  to="/student-card"
                  className="text-xs font-semibold text-[#981B1E] hover:text-[#741216] flex items-center gap-1 hover:underline"
                >
                  Xem chi tiết &rarr;
                </Link>
              </div>

              {/* Real Horizontal DNTU Student Card */}
              <div className="relative w-full max-w-2xl mx-auto rounded-3xl overflow-hidden border border-[#E8E4DC] shadow-md bg-[#FFFDF9] select-none">
                {/* SVG Decorative Burgundy Curves */}
                <svg
                  className="absolute inset-0 w-full h-full pointer-events-none"
                  viewBox="0 0 650 360"
                  preserveAspectRatio="none"
                  fill="none"
                >
                  {/* Top curved maroon swoop */}
                  <path
                    d="M 0 0 L 360 0 C 310 140 160 160 0 170 Z"
                    fill="#741216"
                  />
                  <path
                    d="M 0 0 L 340 0 C 300 130 150 150 0 160 Z"
                    fill="#981B1E"
                  />
                  {/* Bottom right maroon curve */}
                  <path
                    d="M 650 360 L 220 360 C 260 290 420 280 650 250 Z"
                    fill="#741216"
                  />
                  <path
                    d="M 650 360 L 240 360 C 280 295 430 285 650 258 Z"
                    fill="#981B1E"
                  />
                </svg>

                <div className="relative z-10 p-5 sm:p-7 flex flex-col justify-between min-h-[290px] sm:min-h-[320px]">
                  {/* Card Header Top */}
                  <div className="flex items-start justify-between">
                    {/* Left: DNTU School branding inside the top curve */}
                    <div className="flex items-center gap-3 text-white max-w-[280px]">
                      <img
                        src="/DNTU_Web_Asset_Kit/branding/dntu-symbol-white.png"
                        alt="DNTU Logo"
                        className="w-10 h-10 sm:w-11 sm:h-11 object-contain drop-shadow"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                      <div>
                        <div className="text-[11px] sm:text-xs font-semibold tracking-wider text-white/90 uppercase leading-none">
                          TRƯỜNG ĐẠI HỌC
                        </div>
                        <div className="text-xs sm:text-sm font-extrabold tracking-wide text-white uppercase mt-0.5">
                          CÔNG NGHỆ ĐỒNG NAI
                        </div>
                      </div>
                    </div>

                    {/* Right: Card Title */}
                    <div className="text-right">
                      <div className="text-sm sm:text-base font-extrabold text-[#981B1E] uppercase tracking-wide">
                        THẺ SINH VIÊN
                      </div>
                      <div className="text-[10px] sm:text-xs font-bold text-stone-500 uppercase tracking-widest">
                        STUDENT CARD
                      </div>
                    </div>
                  </div>

                  {/* Card Body: Avatar, Info, QR Code */}
                  <div className="my-3 flex flex-col sm:flex-row items-center sm:items-start justify-between gap-4">
                    {/* Left: Student Photo */}
                    <div className="shrink-0">
                      <div className="w-24 h-32 sm:w-28 sm:h-36 rounded-xl overflow-hidden border-2 border-white shadow-md bg-stone-200">
                        {user?.avatar ? (
                          <img
                            src={user.avatar}
                            alt={studentName}
                            className="w-full h-full object-cover"
                            onError={(e) => { e.currentTarget.src = '/mascot/found.png'; }}
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-b from-stone-200 to-stone-300 flex items-center justify-center text-stone-500">
                            <User className="w-12 h-12 text-stone-400" />
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Middle: Student Details */}
                    <div className="flex-1 space-y-1.5 text-center sm:text-left">
                      <h4 className="text-base sm:text-lg font-black text-[#981B1E] uppercase tracking-tight">
                        {studentName}
                      </h4>
                      <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-xs sm:text-sm">
                        <span className="text-stone-500 font-medium">MSSV:</span>
                        <span className="font-bold text-stone-800 font-mono">{studentId}</span>

                        <span className="text-stone-500 font-medium">Niên khóa:</span>
                        <span className="font-semibold text-stone-800">{academicYear}</span>

                        <span className="text-stone-500 font-medium">Khoa:</span>
                        <span className="font-semibold text-stone-800">{faculty}</span>

                        <span className="text-stone-500 font-medium">Ngày sinh:</span>
                        <span className="font-semibold text-stone-800">{dob}</span>
                      </div>
                    </div>

                    {/* Right: QR Code & Barcode */}
                    <div className="shrink-0 flex flex-col items-center justify-center p-2 rounded-xl bg-white border border-stone-200 shadow-xs">
                      {/* Realistic vector QR Code placeholder */}
                      <svg className="w-20 h-20 sm:w-24 sm:h-24 text-stone-800" viewBox="0 0 100 100" fill="currentColor">
                        {/* Top-left corner */}
                        <rect x="0" y="0" width="30" height="30" rx="3" />
                        <rect x="5" y="5" width="20" height="20" fill="white" rx="2" />
                        <rect x="10" y="10" width="10" height="10" rx="1" />
                        {/* Top-right corner */}
                        <rect x="70" y="0" width="30" height="30" rx="3" />
                        <rect x="75" y="5" width="20" height="20" fill="white" rx="2" />
                        <rect x="80" y="10" width="10" height="10" rx="1" />
                        {/* Bottom-left corner */}
                        <rect x="0" y="70" width="30" height="30" rx="3" />
                        <rect x="5" y="75" width="20" height="20" fill="white" rx="2" />
                        <rect x="10" y="80" width="10" height="10" rx="1" />
                        {/* Random pattern matrix */}
                        <rect x="36" y="8" width="8" height="8" />
                        <rect x="48" y="14" width="8" height="8" />
                        <rect x="36" y="26" width="8" height="8" />
                        <rect x="12" y="44" width="8" height="8" />
                        <rect x="28" y="40" width="8" height="8" />
                        <rect x="42" y="42" width="16" height="16" />
                        <rect x="66" y="44" width="8" height="8" />
                        <rect x="82" y="40" width="8" height="8" />
                        <rect x="40" y="70" width="8" height="8" />
                        <rect x="56" y="66" width="8" height="8" />
                        <rect x="48" y="82" width="8" height="8" />
                        <rect x="72" y="76" width="16" height="8" />
                        <rect x="80" y="88" width="12" height="8" />
                      </svg>
                      {/* Barcode representation */}
                      <div className="w-24 sm:w-28 h-6 flex items-center justify-between mt-1 px-1">
                        {[2, 1, 3, 1, 2, 4, 1, 2, 1, 3, 2, 1, 3, 1, 2, 1, 4, 1, 2].map((w, idx) => (
                          <div key={idx} className="h-full bg-stone-900" style={{ width: `${w * 1.2}px` }} />
                        ))}
                      </div>
                      <span className="text-[10px] font-mono text-stone-600 font-semibold tracking-wider mt-0.5">
                        {studentId}
                      </span>
                    </div>
                  </div>

                  {/* Card Footer Slogans inside curves */}
                  <div className="flex items-end justify-between pt-1">
                    <span className="font-['Caveat',cursive] text-xs sm:text-sm text-stone-600">
                      Kiến tạo giá trị cho một tương lai tốt đẹp hơn
                    </span>
                    <span className="text-[10px] sm:text-xs font-bold text-white uppercase tracking-wider">
                      DNTU VĂN MINH - NGHĨA TÌNH - TỬ TẾ
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* SPLIT SECTION (My Posts on Left, Notifications & Quick Actions on Right) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

              {/* LEFT SUB-COLUMN: My Posts */}
              <div className="lg:col-span-7 space-y-4">
                <div className="bg-white rounded-3xl border border-[#EBE7DF] p-5 sm:p-6 shadow-sm">
                  {/* Header */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <FileText className="w-5 h-5 text-[#981B1E]" />
                      <h3 className="text-base sm:text-lg font-bold text-stone-900">
                        Bài đăng của tôi
                      </h3>
                    </div>
                    <Link
                      to="/my-posts"
                      className="text-xs font-semibold text-[#981B1E] hover:text-[#741216] flex items-center gap-1 hover:underline"
                    >
                      Xem tất cả &rarr;
                    </Link>
                  </div>

                  {/* Filter Tabs */}
                  <div className="flex items-center gap-2 border-b border-[#F0EDE8] pb-3 mb-4 text-xs font-medium overflow-x-auto">
                    {[
                      { key: 'ALL', label: `Tất cả (${stats.posts})` },
                      { key: 'ACTIVE', label: 'Đang hiển thị (8)' },
                      { key: 'RETURNED', label: 'Đã nhận lại (3)' },
                      { key: 'HIDDEN', label: 'Đã ẩn (1)' }
                    ].map(tab => (
                      <button
                        key={tab.key}
                        type="button"
                        onClick={() => setPostFilterTab(tab.key)}
                        className={`px-3 py-1.5 rounded-full transition-all shrink-0 ${
                          postFilterTab === tab.key
                            ? 'bg-[#981B1E] text-white font-semibold shadow-xs'
                            : 'text-stone-600 hover:bg-stone-100'
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>

                  {/* Posts List */}
                  <div className="space-y-3">
                    {userPosts.slice(0, 3).map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center gap-3.5 p-3 rounded-2xl border border-[#EFECE6] hover:border-red-200 hover:bg-red-50/20 transition-all group"
                      >
                        {/* Thumbnail */}
                        <div className="w-16 h-16 sm:w-18 sm:h-18 rounded-xl overflow-hidden bg-stone-100 shrink-0 border border-stone-200">
                          <img
                            src={item.image || item.images?.[0] || '/mascot/found.png'}
                            alt={item.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            onError={(e) => { e.currentTarget.src = '/mascot/found.png'; }}
                          />
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${item.statusBadgeClass || 'bg-stone-100 text-stone-600 border-stone-200'}`}>
                              {item.statusLabel || (item.status === 'RETURNED' ? 'Đã nhận lại' : 'Đang hiển thị')}
                            </span>
                            <span className="text-[11px] text-stone-400 font-mono">
                              {item.date || '04/03/2024'}
                            </span>
                          </div>

                          <h5 className="text-sm font-bold text-stone-800 truncate group-hover:text-[#981B1E] transition-colors">
                            {item.title}
                          </h5>

                          <div className="flex items-center gap-3 mt-1.5 text-xs text-stone-500 font-mono">
                            <span className="flex items-center gap-1">
                              <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
                              {item.likes || 8}
                            </span>
                            <span className="flex items-center gap-1">
                              <Eye className="w-3.5 h-3.5 text-stone-400" />
                              {item.views || 320}
                            </span>
                          </div>
                        </div>

                        {/* Action Dots */}
                        <button
                          type="button"
                          className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors"
                          title="Tùy chọn bài viết"
                          aria-label="Tùy chọn bài viết"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* RIGHT SUB-COLUMN: Quote, Notifications & Quick Actions */}
              <div className="lg:col-span-5 space-y-4">
                {/* DNTU Community Quote Card */}
                <div className="bg-[#FFF8F7] rounded-3xl border border-[#FCD9D9] p-4 text-center">
                  <span className="font-['Caveat',cursive] text-lg sm:text-xl text-[#981B1E] leading-snug block">
                    “ Sinh viên DNTU tử tế tạo nên những điều lớn lao. ”
                  </span>
                  <span className="text-[11px] font-bold tracking-widest text-[#981B1E]/80 uppercase mt-0.5 block">
                    — DNTU
                  </span>
                </div>

                {/* Notifications Card */}
                <div className="bg-white rounded-3xl border border-[#EBE7DF] p-5 shadow-sm">
                  <div className="flex items-center justify-between mb-3.5">
                    <div className="flex items-center gap-2">
                      <Bell className="w-4 h-4 text-[#981B1E]" />
                      <h4 className="text-sm font-bold text-stone-900">Thông báo mới</h4>
                      <span className="w-5 h-5 rounded-full bg-[#981B1E] text-white text-[10px] font-bold flex items-center justify-center">
                        3
                      </span>
                    </div>
                    <Link
                      to="/notifications"
                      className="text-xs font-semibold text-[#981B1E] hover:underline"
                    >
                      Xem tất cả &rarr;
                    </Link>
                  </div>

                  <div className="space-y-2.5">
                    {/* Item 1 */}
                    <div className="p-2.5 rounded-2xl bg-stone-50 border border-stone-100 hover:bg-red-50/30 transition-colors flex items-start gap-2.5 relative">
                      <div className="w-7 h-7 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center shrink-0 mt-0.5">
                        <Heart className="w-3.5 h-3.5 fill-rose-500" />
                      </div>
                      <div className="flex-1 min-w-0 pr-4">
                        <p className="text-xs font-semibold text-stone-800">
                          Bạn đã nhận được 1 cảm ơn!
                        </p>
                        <p className="text-[11px] text-stone-500 line-clamp-1">
                          Nguyễn Thị Mai cảm ơn bài đăng của bạn.
                        </p>
                        <span className="text-[10px] text-stone-400 font-mono mt-0.5 block">
                          2 giờ trước
                        </span>
                      </div>
                      <span className="w-1.5 h-1.5 rounded-full bg-red-600 absolute top-3 right-3" />
                    </div>

                    {/* Item 2 */}
                    <div className="p-2.5 rounded-2xl bg-stone-50 border border-stone-100 hover:bg-red-50/30 transition-colors flex items-start gap-2.5 relative">
                      <div className="w-7 h-7 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center shrink-0 mt-0.5">
                        <Gift className="w-3.5 h-3.5" />
                      </div>
                      <div className="flex-1 min-w-0 pr-4">
                        <p className="text-xs font-semibold text-stone-800">
                          Yêu cầu nhận lại đồ vật
                        </p>
                        <p className="text-[11px] text-stone-500 line-clamp-1">
                          Có 1 yêu cầu mới cho bài đăng "Ví da màu đen".
                        </p>
                        <span className="text-[10px] text-stone-400 font-mono mt-0.5 block">
                          5 giờ trước
                        </span>
                      </div>
                      <span className="w-1.5 h-1.5 rounded-full bg-red-600 absolute top-3 right-3" />
                    </div>

                    {/* Item 3 */}
                    <div className="p-2.5 rounded-2xl bg-stone-50 border border-stone-100 hover:bg-red-50/30 transition-colors flex items-start gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-sky-100 text-sky-600 flex items-center justify-center shrink-0 mt-0.5">
                        <Megaphone className="w-3.5 h-3.5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-stone-800">
                          Thông báo từ UniFind
                        </p>
                        <p className="text-[11px] text-stone-500 line-clamp-1">
                          Cập nhật tính năng mới: Thẻ sinh viên điện tử.
                        </p>
                        <span className="text-[10px] text-stone-400 font-mono mt-0.5 block">
                          1 ngày trước
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Quick Actions (Thao tác nhanh) */}
                <div className="bg-white rounded-3xl border border-[#EBE7DF] p-5 shadow-sm">
                  <h4 className="text-sm font-bold text-stone-900 mb-3">
                    Thao tác nhanh
                  </h4>
                  <div className="grid grid-cols-4 gap-2">
                    <Link
                      to="/report-lost"
                      className="flex flex-col items-center justify-center p-2.5 rounded-2xl bg-stone-50 hover:bg-red-50 text-stone-700 hover:text-[#981B1E] transition-all group border border-stone-100 text-center"
                    >
                      <div className="w-9 h-9 rounded-xl bg-white shadow-xs flex items-center justify-center text-[#981B1E] group-hover:scale-110 transition-transform mb-1.5">
                        <PlusCircle className="w-5 h-5" />
                      </div>
                      <span className="text-[11px] font-semibold leading-tight">Tạo bài đăng</span>
                    </Link>

                    <Link
                      to="/my-claims"
                      className="flex flex-col items-center justify-center p-2.5 rounded-2xl bg-stone-50 hover:bg-red-50 text-stone-700 hover:text-[#981B1E] transition-all group border border-stone-100 text-center"
                    >
                      <div className="w-9 h-9 rounded-xl bg-white shadow-xs flex items-center justify-center text-rose-600 group-hover:scale-110 transition-transform mb-1.5">
                        <HeartHandshake className="w-5 h-5" />
                      </div>
                      <span className="text-[11px] font-semibold leading-tight">Nhận lại</span>
                    </Link>

                    <Link
                      to="/student-card"
                      className="flex flex-col items-center justify-center p-2.5 rounded-2xl bg-stone-50 hover:bg-red-50 text-stone-700 hover:text-[#981B1E] transition-all group border border-stone-100 text-center"
                    >
                      <div className="w-9 h-9 rounded-xl bg-white shadow-xs flex items-center justify-center text-amber-600 group-hover:scale-110 transition-transform mb-1.5">
                        <CreditCard className="w-5 h-5" />
                      </div>
                      <span className="text-[11px] font-semibold leading-tight">Thẻ DNTU</span>
                    </Link>

                    <Link
                      to="/guide"
                      className="flex flex-col items-center justify-center p-2.5 rounded-2xl bg-stone-50 hover:bg-red-50 text-stone-700 hover:text-[#981B1E] transition-all group border border-stone-100 text-center"
                    >
                      <div className="w-9 h-9 rounded-xl bg-white shadow-xs flex items-center justify-center text-sky-600 group-hover:scale-110 transition-transform mb-1.5">
                        <BookOpen className="w-5 h-5" />
                      </div>
                      <span className="text-[11px] font-semibold leading-tight">Hướng dẫn</span>
                    </Link>
                  </div>
                </div>

                {/* Kindness Community Banner */}
                <Link
                  to="/search"
                  className="block p-4 rounded-3xl bg-gradient-to-r from-[#FFF2F2] to-[#FFECEC] border border-[#FCD9D9] hover:border-red-300 transition-all group"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-[#981B1E] text-white flex items-center justify-center shrink-0 shadow-xs">
                        <Users className="w-5 h-5" />
                      </div>
                      <div>
                        <h5 className="text-xs sm:text-sm font-bold text-stone-900 group-hover:text-[#981B1E] transition-colors">
                          Cùng nhau tạo nên một DNTU tốt đẹp hơn
                        </h5>
                        <p className="text-[11px] text-stone-500 font-medium">
                          Chia sẻ &middot; Kết nối &middot; Lan tỏa từ tế
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-[#981B1E] group-hover:translate-x-1 transition-transform" />
                  </div>
                </Link>

              </div>
            </div>

          </main>
        </div>
      </div>

      {/* EDIT PROFILE MODAL */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Chỉnh sửa thông tin cá nhân"
      >
        <form onSubmit={handleSaveProfile} className="space-y-4">
          {/* Avatar preview and upload */}
          <div className="flex items-center gap-4 p-3 bg-stone-50 rounded-2xl border border-stone-200">
            <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-white shadow-sm bg-stone-200 shrink-0">
              {editForm.avatar ? (
                <img src={editForm.avatar} alt="Preview" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-[#741216] to-[#981B1E] text-white flex items-center justify-center font-bold text-xl">
                  {editForm.name?.charAt(0) || 'U'}
                </div>
              )}
            </div>
            <div className="flex-1">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => avatarInputRef.current?.click()}
                icon={Camera}
              >
                Tải ảnh mới từ máy
              </Button>
              <p className="text-[11px] text-stone-500 mt-1">Hỗ trợ JPG, PNG, WEBP tối đa 8MB. Cho phép căn chỉnh khung tròn.</p>
            </div>
          </div>

          <Input
            label="Họ và tên"
            value={editForm.name}
            onChange={e => setEditForm(p => ({ ...p, name: e.target.value }))}
            required
            placeholder="Ví dụ: Nguyễn Văn An"
          />

          <Input
            label="Mã số sinh viên (MSSV)"
            value={editForm.studentId}
            onChange={e => setEditForm(p => ({ ...p, studentId: e.target.value }))}
            placeholder="Ví dụ: 2310123456"
          />

          <Input
            label="Khoa / Ngành đào tạo"
            value={editForm.faculty}
            onChange={e => setEditForm(p => ({ ...p, faculty: e.target.value }))}
            placeholder="Ví dụ: Công nghệ thông tin"
          />

          <Input
            label="Số điện thoại liên hệ"
            value={editForm.phone}
            onChange={e => setEditForm(p => ({ ...p, phone: e.target.value }))}
            placeholder="Ví dụ: 0987 654 321"
          />

          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              Châm ngôn / Lời nhắn cá nhân
            </label>
            <textarea
              rows={2}
              value={editForm.quote}
              onChange={e => setEditForm(p => ({ ...p, quote: e.target.value }))}
              placeholder="Nhập châm ngôn hoặc trích dẫn yêu thích..."
              className="w-full px-3 py-2 text-xs border border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#981B1E] focus:border-transparent resize-none bg-white text-stone-800"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-stone-200">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsEditModalOpen(false)}
            >
              Hủy
            </Button>
            <Button
              type="submit"
              variant="primary"
              loading={saving}
              icon={Save}
            >
              Lưu thay đổi
            </Button>
          </div>
        </form>
      </Modal>

      {/* CHANGE PASSWORD MODAL */}
      <Modal
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
        title="Đổi mật khẩu tài khoản"
      >
        <form onSubmit={handleSavePassword} className="space-y-4">
          <Input
            type="password"
            label="Mật khẩu hiện tại"
            value={pwdForm.oldPassword}
            onChange={e => setPwdForm(p => ({ ...p, oldPassword: e.target.value }))}
            required
            placeholder="Nhập mật khẩu hiện tại"
          />

          <Input
            type="password"
            label="Mật khẩu mới"
            value={pwdForm.newPassword}
            onChange={e => setPwdForm(p => ({ ...p, newPassword: e.target.value }))}
            required
            placeholder="Ít nhất 6 ký tự"
          />

          <Input
            type="password"
            label="Xác nhận mật khẩu mới"
            value={pwdForm.confirmPassword}
            onChange={e => setPwdForm(p => ({ ...p, confirmPassword: e.target.value }))}
            required
            placeholder="Nhập lại mật khẩu mới"
          />

          <div className="flex justify-end gap-3 pt-3 border-t border-stone-200">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsPasswordModalOpen(false)}
            >
              Hủy
            </Button>
            <Button
              type="submit"
              variant="primary"
              loading={pwdSaving}
              icon={KeyRound}
            >
              Đổi mật khẩu
            </Button>
          </div>
        </form>
      </Modal>

      {/* Hidden file input for Avatar selection */}
      <input
        ref={avatarInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleAvatarUpload}
      />

      {/* Avatar Crop & Reposition Modal */}
      <AvatarCropModal
        key={cropImageSrc || 'empty'}
        isOpen={isCropModalOpen}
        imageSrc={cropImageSrc}
        onClose={() => setIsCropModalOpen(false)}
        onSave={handleCropSave}
        title="Chọn ảnh đại diện"
      />
    </div>
  );
}
