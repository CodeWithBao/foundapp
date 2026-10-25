import { useState, useEffect, useMemo } from 'react';
import { Search, Shield, ShieldOff, Lock, Unlock, UserCheck, ShieldAlert, Filter, UserCog, KeyRound } from 'lucide-react';
import userService from '../../services/userService';
import itemService from '../../services/itemService';
import Select from '../../components/common/Select';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import Pagination from '../../components/common/Pagination';
import Avatar from '../../components/common/Avatar';
import { ConfirmModal } from '../../components/common/Modal';
import { formatDate } from '../../utils';
import { toast } from 'sonner';

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [actionUser, setActionUser] = useState(null);
  const [resetPasswordUser, setResetPasswordUser] = useState(null);
  const [changingRoleUser, setChangingRoleUser] = useState(null);
  const perPage = 10;

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [uData, iData] = await Promise.all([
        userService.getUsers(),
        itemService.getItems()
      ]);
      setUsers(uData);
      setItems(iData);
    } catch (err) {
      toast.error(err.message || 'Lỗi khi tải dữ liệu người dùng');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleBlock = async () => {
    if (!actionUser) return;
    try {
      await userService.toggleBlock(actionUser.id);
      const isCurrentlyBlocked = actionUser.status === 'blocked';
      setUsers(prev =>
        prev.map(u => (u.id === actionUser.id ? { ...u, status: isCurrentlyBlocked ? 'active' : 'blocked' } : u))
      );
      toast.success(isCurrentlyBlocked ? `Đã mở khóa cho tài khoản ${actionUser.name}` : `Đã khóa tài khoản ${actionUser.name}`);
    } catch (err) {
      toast.error(err.message || 'Không thể cập nhật trạng thái');
    } finally {
      setActionUser(null);
    }
  };

  const handleChangeRole = async (userId, newRole) => {
    try {
      await userService.changeRole(userId, newRole);
      setUsers(prev =>
        prev.map(u => (u.id === userId ? { ...u, role: newRole } : u))
      );
      toast.success(`Đã cập nhật vai trò thành công sang ${newRole}`);
      setChangingRoleUser(null);
    } catch (err) {
      toast.error(err.message || 'Lỗi khi đổi vai trò');
    }
  };

  const handleResetPassword = async () => {
    if (!resetPasswordUser) return;
    try {
      await userService.resetPassword(resetPasswordUser.id);
      toast.success(`Đã đặt mật khẩu của ${resetPasswordUser.name} về mặc định 123456`);
    } catch (err) {
      toast.error(err.message || 'Không thể đặt lại mật khẩu');
    } finally {
      setResetPasswordUser(null);
    }
  };

  // Map post counts per user
  const userPostCounts = useMemo(() => {
    const counts = {};
    items.forEach(item => {
      if (item.userId) {
        counts[item.userId] = (counts[item.userId] || 0) + 1;
      }
    });
    return counts;
  }, [items]);

  const filtered = useMemo(() => {
    return users.filter(u => {
      if (roleFilter !== 'all' && u.role !== roleFilter) return false;
      if (statusFilter !== 'all' && u.status !== statusFilter) return false;
      if (search.trim()) {
        const s = search.toLowerCase();
        const matchName = u.name?.toLowerCase().includes(s);
        const matchEmail = u.email?.toLowerCase().includes(s);
        const matchStudentId = u.studentId?.toLowerCase().includes(s);
        if (!matchName && !matchEmail && !matchStudentId) return false;
      }
      return true;
    });
  }, [users, roleFilter, search]);

  const totalPages = Math.ceil(filtered.length / perPage) || 1;
  const paginated = useMemo(() => {
    return filtered.slice((page - 1) * perPage, page * perPage);
  }, [filtered, page, perPage]);

  const roleBadge = (role) => {
    switch (role) {
      case 'ADMIN':
        return <Badge variant="burgundy">Quản trị viên</Badge>;
      case 'STAFF':
        return <Badge variant="info">Nhân viên DNTU</Badge>;
      case 'USER':
      default:
        return <Badge variant="default">Sinh viên / Người dùng</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-dark">Quản lý người dùng</h1>
          <p className="text-sm text-warm-gray-500">Quản trị tài khoản sinh viên, cán bộ giảng viên và phân quyền hệ thống</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold px-3 py-1.5 bg-cream-200 text-warm-gray-700 rounded-full border border-cream-300">
            Tổng cộng: {users.length} tài khoản
          </span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="card p-4 flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-warm-gray-400" />
          <input
            type="text"
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            placeholder="Tìm theo tên, email, MSSV / Mã cán bộ..."
            className="w-full pl-10 pr-4 py-2 bg-cream-100 border border-cream-300 rounded-button text-sm text-text-dark placeholder-warm-gray-400 focus:outline-none focus:ring-2 focus:ring-burgundy-500/20 focus:border-burgundy-700 transition-colors"
          />
        </div>
        <div className="w-full sm:w-44">
          <Select
            options={[
              { value: 'all', label: 'Tất cả vai trò' },
              { value: 'USER', label: 'Sinh viên / User' },
              { value: 'STAFF', label: 'Nhân viên / Staff' },
              { value: 'ADMIN', label: 'Quản trị viên / Admin' },
            ]}
            value={roleFilter}
            onChange={e => { setRoleFilter(e.target.value); setPage(1); }}
          />
        </div>
        <div className="w-full sm:w-44">
          <Select
            options={[
              { value: 'all', label: 'Tất cả trạng thái' },
              { value: 'active', label: 'Hoạt động' },
              { value: 'blocked', label: 'Bị khóa' },
            ]}
            value={statusFilter}
            onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
          />
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-warm-gray-600">
            <thead className="bg-cream-200 text-warm-gray-700 uppercase text-xs font-semibold">
              <tr>
                <th className="px-6 py-3.5">Họ tên</th>
                <th className="px-6 py-3.5">MSSV / Mã NV</th>
                <th className="px-6 py-3.5">Email</th>
                <th className="px-6 py-3.5">Vai trò</th>
                <th className="px-6 py-3.5 text-center">Số bài đăng</th>
                <th className="px-6 py-3.5">Ngày tham gia</th>
                <th className="px-6 py-3.5">Trạng thái</th>
                <th className="px-6 py-3.5 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cream-300">
              {loading ? (
                [1, 2, 3, 4, 5].map(i => (
                  <tr key={i}>
                    <td colSpan={8} className="px-6 py-4">
                      <div className="h-6 bg-cream-200 rounded animate-pulse" />
                    </td>
                  </tr>
                ))
              ) : paginated.length > 0 ? (
                paginated.map(user => {
                  const isBlocked = user.status === 'blocked';
                  const postCount = userPostCounts[user.id] || 0;

                  return (
                    <tr key={user.id} className="hover:bg-cream-100 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <Avatar name={user.name} src={user.avatar} size="sm" />
                          <div>
                            <div className="font-semibold text-text-dark">{user.name}</div>
                            {user.faculty && (
                              <div className="text-xs text-warm-gray-400">{user.faculty}</div>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap font-mono text-xs text-warm-gray-700 font-medium">
                        {user.studentId || '—'}
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap text-xs text-warm-gray-600 font-mono">
                        {user.email}
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          {roleBadge(user.role)}
                        </div>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span className="inline-flex items-center justify-center px-2 py-0.5 text-xs font-bold rounded-full bg-cream-200 text-warm-gray-700">
                          {postCount}
                        </span>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap text-xs text-warm-gray-500 font-mono">
                        {formatDate(user.createdAt)}
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap">
                        {isBlocked ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-50 text-red-700 border border-red-200">
                            <Lock className="w-3 h-3" /> Bị khóa
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <UserCheck className="w-3 h-3" /> Hoạt động
                          </span>
                        )}
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-2">
                          {/* Change role select dropdown */}
                          <select
                            value={user.role}
                            onChange={e => handleChangeRole(user.id, e.target.value)}
                            aria-label={`Thay đổi vai trò cho ${user.name}`}
                            className="text-xs font-medium bg-white border border-cream-300 rounded px-2 py-1 text-text-dark hover:border-burgundy-500 focus:outline-none focus:ring-1 focus:ring-burgundy-500 transition-colors"
                          >
                            <option value="USER">USER</option>
                            <option value="STAFF">STAFF</option>
                            <option value="ADMIN">ADMIN</option>
                          </select>

                          {/* Lock / Unlock button */}
                          <button
                            onClick={() => setResetPasswordUser(user)}
                            className="p-1.5 rounded text-amber-700 hover:bg-amber-100 transition-colors"
                            title="Đặt lại mật khẩu về mặc định"
                            aria-label={`Đặt lại mật khẩu cho ${user.name}`}
                          >
                            <KeyRound className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => setActionUser(user)}
                            className={`p-1.5 rounded transition-colors ${
                              isBlocked
                                ? 'text-emerald-700 hover:bg-emerald-100'
                                : 'text-red-700 hover:bg-red-100'
                            }`}
                            title={isBlocked ? 'Mở khóa tài khoản' : 'Khóa tài khoản'}
                          >
                            {isBlocked ? (
                              <Unlock className="w-4 h-4" />
                            ) : (
                              <Lock className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-warm-gray-400">
                    Không tìm thấy người dùng phù hợp.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-cream-300 flex justify-end">
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              onPageChange={setPage}
            />
          </div>
        )}
      </div>

      {/* Confirmation Modal for Lock / Unlock */}
      <ConfirmModal
        isOpen={!!actionUser}
        onClose={() => setActionUser(null)}
        onConfirm={handleToggleBlock}
        title={actionUser?.status === 'blocked' ? 'Mở khóa tài khoản' : 'Khóa tài khoản người dùng'}
        message={
          actionUser?.status === 'blocked'
            ? `Bạn có chắc chắn muốn mở khóa tài khoản "${actionUser?.name}" (${actionUser?.email}) không? Người này sẽ có thể đăng nhập lại.`
            : `Bạn có chắc chắn muốn khóa tài khoản "${actionUser?.name}" (${actionUser?.email}) không? Người này sẽ bị chặn đăng nhập.`
        }
        confirmText={actionUser?.status === 'blocked' ? 'Mở khóa ngay' : 'Khóa tài khoản'}
        variant={actionUser?.status === 'blocked' ? 'primary' : 'danger'}
      />

      <ConfirmModal
        isOpen={!!resetPasswordUser}
        onClose={() => setResetPasswordUser(null)}
        onConfirm={handleResetPassword}
        title="Đặt lại mật khẩu"
        message={`Đặt mật khẩu của "${resetPasswordUser?.name}" (${resetPasswordUser?.email}) về mật khẩu mặc định 123456? Hãy yêu cầu người dùng đổi mật khẩu sau khi đăng nhập.`}
        confirmText="Đặt lại mật khẩu"
        variant="danger"
      />
    </div>
  );
}
