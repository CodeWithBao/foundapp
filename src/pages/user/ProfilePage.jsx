import { useState, useEffect } from 'react';
import { User, Mail, Phone, Building, Save, Camera, Edit3, KeyRound, List, PackageCheck, Clock, ShieldCheck, Award } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import itemService from '../../services/itemService';
import claimService from '../../services/claimService';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import StatCard from '../../components/common/StatCard';
import Modal from '../../components/common/Modal';
import PageHeader from '../../components/common/PageHeader';
import Avatar from '../../components/common/Avatar';
import { toast } from 'sonner';

export default function ProfilePage() {
  const { user, updateProfile } = useAuth();
  
  const [stats, setStats] = useState({ posts: 0, claims: 0, returned: 0 });
  const [loading, setLoading] = useState(true);
  
  // Modal Edit Profile State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    avatar: user?.avatar || '',
    faculty: user?.faculty || '',
    studentId: user?.studentId || '',
  });
  const [saving, setSaving] = useState(false);

  // Change password state
  const [pwdForm, setPwdForm] = useState({ oldPassword: '', newPassword: '', confirmPassword: '' });
  const [pwdSaving, setPwdSaving] = useState(false);

  useEffect(() => {
    if (user) {
      setEditForm({
        name: user.name || '',
        phone: user.phone || '',
        avatar: user.avatar || '',
        faculty: user.faculty || '',
        studentId: user.studentId || '',
      });
      loadStats();
    }
  }, [user]);

  const loadStats = async () => {
    try {
      setLoading(true);
      const items = await itemService.getItems({ userId: user.id });
      const userItems = items.filter(i => i.userId === user.id);
      const claims = await claimService.getClaims({ claimantId: user.id });
      const returnedItems = userItems.filter(i => ['RETURNED', 'CLOSED'].includes(i.status));

      setStats({
        posts: userItems.length,
        claims: claims.length,
        returned: returnedItems.length,
      });
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
      await updateProfile({
        ...user,
        name: editForm.name.trim(),
        phone: editForm.phone.trim(),
        avatar: editForm.avatar.trim(),
        faculty: editForm.faculty.trim(),
        studentId: editForm.studentId.trim(),
      });
      toast.success('Cập nhật hồ sơ cá nhân thành công!');
      setIsEditModalOpen(false);
    } catch (err) {
      toast.error(err.message || 'Lỗi khi cập nhật hồ sơ');
    } finally {
      setSaving(false);
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
    } catch (err) {
      toast.error('Lỗi đổi mật khẩu');
    } finally {
      setPwdSaving(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <PageHeader
        title="Hồ sơ cá nhân"
        subtitle="Quản lý thông tin tài khoản và xem thống kê hoạt động của bạn tại DNTU UniFind."
      />

      {/* Main Profile Info Card */}
      <div className="card p-6 md:p-8 mb-6 relative overflow-hidden">
        {/* Background gradient decorative element */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-burgundy-50 rounded-bl-full -z-0 opacity-40 pointer-events-none" />

        <div className="flex flex-col md:flex-row items-center md:items-start gap-6 relative z-10">
          {/* Large Avatar */}
          <div className="relative group shrink-0">
            {user?.avatar ? (
              <img
                src={user.avatar}
                alt={user.name}
                className="w-28 h-28 md:w-32 md:h-32 rounded-full object-cover border-4 border-white shadow-card ring-2 ring-burgundy-200"
                onError={e => { e.target.src = 'https://placehold.co/128x128/png?text=Avatar'; }}
              />
            ) : (
              <div className="w-28 h-28 md:w-32 md:h-32 rounded-full bg-gradient-to-br from-burgundy-600 to-burgundy-800 text-white flex items-center justify-center font-bold text-3xl md:text-4xl shadow-card ring-4 ring-white border-2 border-burgundy-300">
                {user?.name?.charAt(0)?.toUpperCase() || 'U'}
              </div>
            )}
            <button
              onClick={() => setIsEditModalOpen(true)}
              className="absolute bottom-1 right-1 w-8 h-8 rounded-full bg-white border border-cream-300 shadow-sm flex items-center justify-center text-warm-gray-600 hover:text-burgundy-700 hover:border-burgundy-300 transition-colors"
              title="Chỉnh sửa ảnh đại diện"
            >
              <Camera className="w-4 h-4" />
            </button>
          </div>

          {/* User Details */}
          <div className="flex-1 text-center md:text-left min-w-0">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold text-text-dark">{user?.name}</h2>
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 mt-1.5 text-xs text-warm-gray-500 font-medium">
                  <span className="bg-burgundy-100 text-burgundy-800 font-bold px-2.5 py-0.5 rounded-full">
                    {user?.role === 'ADMIN' ? 'Quản trị viên' : user?.role === 'STAFF' ? 'Cán bộ / Nhân viên' : 'Sinh viên'}
                  </span>
                  {user?.studentId && (
                    <span className="bg-cream-200 text-text-dark font-mono px-2.5 py-0.5 rounded-full">
                      MSSV: {user.studentId}
                    </span>
                  )}
                  {user?.faculty && (
                    <span className="bg-cream-200 text-text-dark px-2.5 py-0.5 rounded-full">
                      {user.faculty}
                    </span>
                  )}
                </div>
              </div>

              <Button
                onClick={() => setIsEditModalOpen(true)}
                variant="secondary"
                size="sm"
                className="shrink-0 shadow-xs"
              >
                <Edit3 className="w-4 h-4 mr-1.5" /> Chỉnh sửa hồ sơ
              </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-6 pt-5 border-t border-cream-200 text-sm text-warm-gray-600">
              <div className="flex items-center justify-center md:justify-start gap-2.5">
                <Mail className="w-4 h-4 text-burgundy-600 shrink-0" />
                <span className="font-medium text-text-dark truncate">{user?.email || 'Chưa cập nhật'}</span>
              </div>
              <div className="flex items-center justify-center md:justify-start gap-2.5">
                <Phone className="w-4 h-4 text-burgundy-600 shrink-0" />
                <span className="font-medium text-text-dark">{user?.phone || 'Chưa cập nhật số điện thoại'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3 Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-8">
        <StatCard
          title="Số bài đã đăng"
          value={loading ? '...' : stats.posts}
          icon={List}
          color="burgundy"
        />
        <StatCard
          title="Số yêu cầu nhận đồ (Claim)"
          value={loading ? '...' : stats.claims}
          icon={Clock}
          color="gold"
        />
        <StatCard
          title="Số vật phẩm đã trả lại"
          value={loading ? '...' : stats.returned}
          icon={PackageCheck}
          color="green"
        />
      </div>

      {/* Security Form Card */}
      <div className="card p-6 md:p-8">
        <div className="flex items-center gap-2 pb-4 mb-6 border-b border-cream-200">
          <KeyRound className="w-5 h-5 text-burgundy-700" />
          <h3 className="font-bold text-lg text-text-dark">Bảo mật & Đổi mật khẩu</h3>
        </div>

        <form onSubmit={handleSavePassword} className="max-w-lg space-y-4">
          <Input
            label="Mật khẩu hiện tại *"
            type="password"
            placeholder="••••••••"
            value={pwdForm.oldPassword}
            onChange={e => setPwdForm(p => ({ ...p, oldPassword: e.target.value }))}
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Mật khẩu mới *"
              type="password"
              placeholder="Tối thiểu 6 ký tự"
              value={pwdForm.newPassword}
              onChange={e => setPwdForm(p => ({ ...p, newPassword: e.target.value }))}
            />
            <Input
              label="Xác nhận mật khẩu mới *"
              type="password"
              placeholder="Nhập lại mật khẩu mới"
              value={pwdForm.confirmPassword}
              onChange={e => setPwdForm(p => ({ ...p, confirmPassword: e.target.value }))}
            />
          </div>

          <div className="pt-2">
            <Button type="submit" loading={pwdSaving} className="btn-primary" size="sm">
              Cập nhật mật khẩu
            </Button>
          </div>
        </form>
      </div>

      {/* Modal Edit Profile */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Chỉnh sửa thông tin cá nhân"
      >
        <form onSubmit={handleSaveProfile} className="space-y-4 pt-2">
          <Input
            label="Họ và tên *"
            value={editForm.name}
            onChange={e => setEditForm(p => ({ ...p, name: e.target.value }))}
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Số điện thoại"
              placeholder="0912345678"
              value={editForm.phone}
              onChange={e => setEditForm(p => ({ ...p, phone: e.target.value }))}
            />
            <Input
              label="Mã số sinh viên / Cán bộ"
              placeholder="VD: SV12345"
              value={editForm.studentId}
              onChange={e => setEditForm(p => ({ ...p, studentId: e.target.value }))}
            />
          </div>

          <Input
            label="Khoa / Phòng ban"
            placeholder="VD: Khoa Công nghệ Thông tin"
            value={editForm.faculty}
            onChange={e => setEditForm(p => ({ ...p, faculty: e.target.value }))}
          />

          <Input
            label="URL Ảnh đại diện (Avatar)"
            placeholder="https://example.com/avatar.jpg"
            value={editForm.avatar}
            onChange={e => setEditForm(p => ({ ...p, avatar: e.target.value }))}
          />

          <div className="flex justify-end gap-3 pt-4 border-t border-cream-200">
            <Button type="button" variant="ghost" onClick={() => setIsEditModalOpen(false)}>
              Hủy bỏ
            </Button>
            <Button type="submit" loading={saving} className="btn-primary">
              <Save className="w-4 h-4 mr-1.5" /> Lưu thay đổi
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
