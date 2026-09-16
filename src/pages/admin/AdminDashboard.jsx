import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Package, Users, Clock, Eye, ArrowUpRight, ShieldCheck, AlertCircle, RefreshCw } from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';
import adminService from '../../services/adminService';
import StatCard from '../../components/common/StatCard';
import Badge from '../../components/common/Badge';
import { formatDateTime } from '../../utils';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [monthlyData, setMonthlyData] = useState([]);
  const [recentLogs, setRecentLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [s, m, logs] = await Promise.all([
          adminService.getStats(),
          adminService.getMonthlyStats(),
          adminService.getAuditLogs()
        ]);
        setStats(s);
        setMonthlyData(m && m.length ? m.slice(-6) : [
          { month: 'T4', lost: 18, found: 24 },
          { month: 'T5', lost: 25, found: 30 },
          { month: 'T6', lost: 20, found: 28 },
          { month: 'T7', lost: 15, found: 22 },
          { month: 'T8', lost: 28, found: 35 },
          { month: 'T9', lost: 22, found: 29 },
        ]);
        setRecentLogs(logs ? logs.slice(0, 5) : []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const donutData = [
    { name: 'Đã hoàn trả', value: 87, color: '#26965C' },
    { name: 'Đang xử lý', value: 10, color: '#D8B26A' },
    { name: 'Từ chối', value: 3, color: '#8F1725' },
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-text-dark">Tổng quan hệ thống Admin</h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-28 bg-cream-200 rounded-card animate-pulse" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-80 bg-cream-200 rounded-card animate-pulse" />
          <div className="h-80 bg-cream-200 rounded-card animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-dark">Tổng quan hệ thống</h1>
          <p className="text-sm text-warm-gray-500">Báo cáo hoạt động & chỉ số vận hành DNTU UniFind</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 text-xs font-semibold rounded-full border border-emerald-200">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            Hệ thống hoạt động tốt
          </span>
        </div>
      </div>

      {/* Top 4 Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Tổng bài đăng"
          value={stats?.totalItems || 128}
          icon={Package}
          color="burgundy"
          trend={12}
        />
        <StatCard
          title="Người dùng"
          value={stats?.totalUsers || 86}
          icon={Users}
          color="green"
          trend={8}
        />
        <StatCard
          title="Đang xử lý"
          value={stats?.pendingClaims || 24}
          icon={Clock}
          color="gold"
        />
        <StatCard
          title="Lượt truy cập"
          value="2,540"
          icon={Eye}
          color="blue"
          trend={24}
        />
      </div>

      {/* Grid 2 Biểu đồ (Recharts) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart 1: Lượt bài đăng theo ngày / tháng */}
        <div className="lg:col-span-2 card p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-text-dark">Lượt bài đăng gần đây</h3>
              <p className="text-xs text-warm-gray-500">Thống kê so sánh bài báo mất vs báo nhặt được</p>
            </div>
            <span className="text-xs font-medium text-warm-gray-500 bg-cream-200 px-2.5 py-1 rounded-md">6 tháng qua</span>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E6E1DA" />
                <XAxis dataKey="month" stroke="#7C746E" fontSize={12} />
                <YAxis stroke="#7C746E" fontSize={12} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#FFF', borderRadius: '8px', border: '1px solid #E6E1DA' }}
                />
                <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                <Line
                  type="monotone"
                  dataKey="lost"
                  name="Báo mất"
                  stroke="#8F1725"
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: '#8F1725' }}
                  activeDot={{ r: 6 }}
                />
                <Line
                  type="monotone"
                  dataKey="found"
                  name="Báo nhặt được"
                  stroke="#D8B26A"
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: '#D8B26A' }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Tỷ lệ xử lý Donut PieChart */}
        <div className="card p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-text-dark">Tỷ lệ xử lý</h3>
            <span className="text-xs font-semibold text-burgundy-700 bg-burgundy-50 px-2.5 py-1 rounded-md">
              Hiệu suất 87%
            </span>
          </div>

          <div className="relative h-60 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={donutData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={85}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {donutData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(val) => [`${val}%`, 'Tỷ lệ']} />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-3xl font-extrabold text-burgundy-900">87%</span>
              <span className="text-xs text-warm-gray-500">Thành công</span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 pt-2 border-t border-cream-300 text-center">
            {donutData.map(d => (
              <div key={d.name}>
                <div className="flex items-center justify-center gap-1">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: d.color }} />
                  <span className="text-xs font-medium text-warm-gray-600">{d.name}</span>
                </div>
                <p className="text-sm font-bold text-text-dark mt-0.5">{d.value}%</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Audit Activity Table */}
      <div className="card overflow-hidden">
        <div className="px-6 py-4 border-b border-cream-300 flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-text-dark">Nhật ký hoạt động mới nhất</h3>
            <p className="text-xs text-warm-gray-500">Các thao tác gần đây của người dùng & quản trị viên</p>
          </div>
          <Link
            to="/admin/audit-logs"
            className="text-xs font-semibold text-burgundy-700 hover:text-burgundy-800 flex items-center gap-1"
          >
            Xem tất cả <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-warm-gray-600">
            <thead className="bg-cream-200 text-warm-gray-700 uppercase font-medium">
              <tr>
                <th className="px-6 py-3">Thời gian</th>
                <th className="px-6 py-3">Người thực hiện</th>
                <th className="px-6 py-3">Hành động</th>
                <th className="px-6 py-3">Đối tượng</th>
                <th className="px-6 py-3">Mô tả</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cream-300">
              {recentLogs.length > 0 ? (
                recentLogs.map((log) => {
                  let badgeVariant = 'default';
                  if (log.action === 'CREATE') badgeVariant = 'success';
                  if (log.action === 'UPDATE') badgeVariant = 'info';
                  if (log.action === 'DELETE') badgeVariant = 'danger';
                  if (log.action === 'APPROVE') badgeVariant = 'success';
                  if (log.action === 'REJECT') badgeVariant = 'warning';
                  if (log.action === 'HANDOVER') badgeVariant = 'burgundy';

                  return (
                    <tr key={log.id} className="hover:bg-cream-100 transition-colors">
                      <td className="px-6 py-3.5 font-mono text-warm-gray-500 whitespace-nowrap">
                        {formatDateTime(log.createdAt)}
                      </td>
                      <td className="px-6 py-3.5 font-medium text-text-dark whitespace-nowrap">
                        {log.userName}
                      </td>
                      <td className="px-6 py-3.5 whitespace-nowrap">
                        <Badge variant={badgeVariant}>{log.action}</Badge>
                      </td>
                      <td className="px-6 py-3.5 font-mono text-warm-gray-500 whitespace-nowrap">
                        {log.entity} ({log.entityId})
                      </td>
                      <td className="px-6 py-3.5 text-warm-gray-700 max-w-xs truncate">
                        {log.description}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-warm-gray-400">
                    Chưa có nhật ký hoạt động nào.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
