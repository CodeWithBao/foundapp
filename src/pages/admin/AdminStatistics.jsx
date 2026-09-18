import { useState, useEffect } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
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
import claimService from '../../services/claimService';
import itemService from '../../services/itemService';
import { BarChart3, PieChart as PieChartIcon, TrendingUp, MapPin, Tag } from 'lucide-react';

const DNTU_PALETTE = ['#8F1725', '#D8B26A', '#26965C', '#527BA8', '#7C746E', '#A84350', '#E5C88F', '#46B379'];

export default function AdminStatistics() {
  const [monthlyData, setMonthlyData] = useState([]);
  const [claimStatusData, setClaimStatusData] = useState([]);
  const [categoryData, setCategoryData] = useState([]);
  const [locationData, setLocationData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [monthly, items, claims] = await Promise.all([
          adminService.getMonthlyStats().catch(() => []),
          itemService.getItems().catch(() => []),
          claimService.getClaims ? claimService.getClaims().catch(() => []) : Promise.resolve([])
        ]);

        let dynamicMonthly = [];
        if (items && items.length > 0) {
          const now = new Date();
          for (let i = 5; i >= 0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const monthLabel = `Tháng ${d.getMonth() + 1}`;
            const year = d.getFullYear();
            const month = d.getMonth();

            const countLost = items.filter(item => {
              const itemDate = new Date(item.createdAt || item.created_at);
              return itemDate.getFullYear() === year && itemDate.getMonth() === month && (item.type === 'LOST' || item.type === 'lost');
            }).length;

            const countFound = items.filter(item => {
              const itemDate = new Date(item.createdAt || item.created_at);
              return itemDate.getFullYear() === year && itemDate.getMonth() === month && (item.type === 'FOUND' || item.type === 'found');
            }).length;

            dynamicMonthly.push({ month: monthLabel, lost: countLost, found: countFound });
          }
        } else {
          dynamicMonthly = [
            { month: 'Tháng 1', lost: 0, found: 0 },
            { month: 'Tháng 2', lost: 0, found: 0 },
            { month: 'Tháng 3', lost: 0, found: 0 },
            { month: 'Tháng 4', lost: 0, found: 0 },
            { month: 'Tháng 5', lost: 0, found: 0 },
            { month: 'Tháng 6', lost: 0, found: 0 },
          ];
        }

        setMonthlyData(monthly && monthly.length > 0 && monthly[0].lost !== undefined ? monthly : dynamicMonthly);

        // 1. Claim status distribution
        const statusMap = { PENDING: 0, UNDER_REVIEW: 0, APPROVED: 0, REJECTED: 0, READY_FOR_HANDOVER: 0, COMPLETED: 0 };
        (claims || []).forEach(c => {
          if (c.status) statusMap[c.status] = (statusMap[c.status] || 0) + 1;
        });

        const statusLabels = {
          PENDING: 'Chờ xử lý',
          UNDER_REVIEW: 'Đang xem xét',
          APPROVED: 'Đã duyệt',
          REJECTED: 'Từ chối',
          READY_FOR_HANDOVER: 'Chờ bàn giao',
          COMPLETED: 'Hoàn tất bàn giao'
        };
        const statusColors = {
          COMPLETED: '#26965C',
          APPROVED: '#26965C',
          READY_FOR_HANDOVER: '#527BA8',
          UNDER_REVIEW: '#D8B26A',
          PENDING: '#7C746E',
          REJECTED: '#8F1725'
        };

        const claimFormatted = Object.entries(statusMap)
          .filter(([_, count]) => count > 0)
          .map(([key, value]) => ({
            name: statusLabels[key] || key,
            value,
            color: statusColors[key] || '#7C746E'
          }));

        setClaimStatusData(claimFormatted.length ? claimFormatted : [
          { name: 'Chưa có yêu cầu', value: 1, color: '#E6E1DA' }
        ]);

        // 2. Category distribution
        const catMap = {};
        (items || []).forEach(i => {
          const catName = i.category?.name || i.category || 'Khác';
          catMap[catName] = (catMap[catName] || 0) + 1;
        });
        const catSorted = Object.entries(catMap)
          .map(([name, value]) => ({ name, value }))
          .sort((a, b) => b.value - a.value)
          .slice(0, 7);

        setCategoryData(catSorted);

        // 3. Location distribution
        const locMap = {};
        (items || []).forEach(i => {
          const locName = i.location?.name || i.location || 'Khác';
          locMap[locName] = (locMap[locName] || 0) + 1;
        });
        const locSorted = Object.entries(locMap)
          .map(([name, value]) => ({ name, value }))
          .sort((a, b) => b.value - a.value)
          .slice(0, 6);

        setLocationData(locSorted);

      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-text-dark">Báo cáo Thống kê Chuyên sâu</h1>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-80 bg-cream-200 rounded-card animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text-dark flex items-center gap-2">
          <BarChart3 className="w-6 h-6 text-burgundy-800" />
          Báo cáo & Thống kê Chuyên sâu
        </h1>
        <p className="text-sm text-warm-gray-500">
          Phân tích dữ liệu thất lạc, xu hướng theo tháng, phân bố danh mục và điểm nóng vị trí DNTU
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 1. Monthly Trends Bar Chart */}
        <div className="card p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-text-dark flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-burgundy-800" />
                1. Bài đăng Báo mất & Nhặt được theo tháng
              </h3>
              <p className="text-xs text-warm-gray-500">So sánh số lượng tin báo mất vs tin nhặt được</p>
            </div>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E6E1DA" />
                <XAxis dataKey="month" stroke="#7C746E" fontSize={12} />
                <YAxis stroke="#7C746E" fontSize={12} />
                <Tooltip contentStyle={{ backgroundColor: '#FFF', borderRadius: '8px', border: '1px solid #E6E1DA' }} />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                <Bar dataKey="lost" name="Báo mất đồ" fill="#8F1725" radius={[4, 4, 0, 0]} />
                <Bar dataKey="found" name="Báo nhặt được" fill="#D8B26A" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 2. Claim Status Distribution Donut Chart */}
        <div className="card p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-text-dark flex items-center gap-2">
                <PieChartIcon className="w-4 h-4 text-emerald-700" />
                2. Phân bố Trạng thái Yêu cầu (Claims)
              </h3>
              <p className="text-xs text-warm-gray-500">Tỷ lệ tiến độ xác minh & nhận lại đồ</p>
            </div>
          </div>
          <div className="h-72 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={claimStatusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={65}
                  outerRadius={95}
                  paddingAngle={4}
                  dataKey="value"
                  label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                  labelLine={false}
                >
                  {claimStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color || DNTU_PALETTE[index % DNTU_PALETTE.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`${value} yêu cầu`, 'Số lượng']} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 3. Category Distribution Bar Chart */}
        <div className="card p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-text-dark flex items-center gap-2">
                <Tag className="w-4 h-4 text-amber-700" />
                3. Thống kê theo Loại vật phẩm thất lạc
              </h3>
              <p className="text-xs text-warm-gray-500">Top các đồ dùng hay bị rơi/quên nhất</p>
            </div>
          </div>
          <div className="h-72">
            {categoryData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E6E1DA" />
                  <XAxis dataKey="name" stroke="#7C746E" fontSize={11} interval={0} />
                  <YAxis stroke="#7C746E" fontSize={12} />
                  <Tooltip contentStyle={{ backgroundColor: '#FFF', borderRadius: '8px', border: '1px solid #E6E1DA' }} />
                  <Bar dataKey="value" name="Số bài đăng" radius={[4, 4, 0, 0]}>
                    {categoryData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={DNTU_PALETTE[index % DNTU_PALETTE.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-warm-gray-400 text-sm">
                Chưa có dữ liệu danh mục
              </div>
            )}
          </div>
        </div>

        {/* 4. Top Location Horizontal Bar Chart */}
        <div className="card p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-text-dark flex items-center gap-2">
                <MapPin className="w-4 h-4 text-blue-700" />
                4. Khu vực hay làm rơi đồ nhất DNTU
              </h3>
              <p className="text-xs text-warm-gray-500">Địa điểm ghi nhận tần suất thất lạc cao</p>
            </div>
          </div>
          <div className="h-72">
            {locationData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={locationData} layout="vertical" margin={{ top: 10, right: 20, left: 20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E6E1DA" />
                  <XAxis type="number" stroke="#7C746E" fontSize={12} />
                  <YAxis dataKey="name" type="category" stroke="#7C746E" fontSize={11} width={110} />
                  <Tooltip contentStyle={{ backgroundColor: '#FFF', borderRadius: '8px', border: '1px solid #E6E1DA' }} />
                  <Bar dataKey="value" name="Lượt ghi nhận" fill="#527BA8" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-warm-gray-400 text-sm">
                Chưa có dữ liệu địa điểm
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
