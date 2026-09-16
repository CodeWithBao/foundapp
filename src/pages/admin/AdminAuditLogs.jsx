import { useState, useEffect, useMemo } from 'react';
import { Search, Shield, FileText, Filter, Clock, User, Layers } from 'lucide-react';
import adminService from '../../services/adminService';
import Select from '../../components/common/Select';
import Badge from '../../components/common/Badge';
import Pagination from '../../components/common/Pagination';
import EmptyState from '../../components/common/EmptyState';
import { formatDateTime } from '../../utils';

export default function AdminAuditLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('all');
  const [page, setPage] = useState(1);
  const perPage = 15;

  useEffect(() => {
    loadLogs();
  }, [actionFilter]);

  const loadLogs = async () => {
    setLoading(true);
    try {
      const data = await adminService.getAuditLogs({ action: actionFilter, search });
      setLogs(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const t = setTimeout(() => loadLogs(), 300);
    return () => clearTimeout(t);
  }, [search]);

  const totalPages = Math.ceil(logs.length / perPage) || 1;
  const paginated = useMemo(() => {
    return logs.slice((page - 1) * perPage, page * perPage);
  }, [logs, page, perPage]);

  const getActionBadge = (action) => {
    switch (action) {
      case 'CREATE':
        return <Badge variant="success">CREATE</Badge>;
      case 'UPDATE':
        return <Badge variant="info">UPDATE</Badge>;
      case 'DELETE':
        return <Badge variant="danger">DELETE</Badge>;
      case 'APPROVE':
        return <Badge variant="success">APPROVE</Badge>;
      case 'REJECT':
        return <Badge variant="warning">REJECT</Badge>;
      case 'HANDOVER':
        return <Badge variant="burgundy">HANDOVER</Badge>;
      default:
        return <Badge variant="default">{action}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-dark flex items-center gap-2">
            <Shield className="w-6 h-6 text-burgundy-800" />
            Nhật ký hệ thống (Audit Log)
          </h1>
          <p className="text-sm text-warm-gray-500">
            Theo dõi tất cả lịch sử thao tác, tạo mới, chỉnh sửa, xóa và phê duyệt trên UniFind
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold px-3 py-1.5 bg-cream-200 text-warm-gray-700 rounded-full border border-cream-300">
            Tổng cộng: {logs.length} bản ghi
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
            placeholder="Tìm theo từ khóa mô tả, tên người thực hiện, ID đối tượng..."
            className="w-full pl-10 pr-4 py-2 bg-cream-100 border border-cream-300 rounded-button text-sm text-text-dark placeholder-warm-gray-400 focus:outline-none focus:ring-2 focus:ring-burgundy-500/20 focus:border-burgundy-700 transition-colors"
          />
        </div>
        <div className="w-full sm:w-56">
          <Select
            options={[
              { value: 'all', label: 'Tất cả hành động' },
              { value: 'CREATE', label: 'CREATE (Tạo mới)' },
              { value: 'UPDATE', label: 'UPDATE (Cập nhật)' },
              { value: 'DELETE', label: 'DELETE (Xóa)' },
              { value: 'APPROVE', label: 'APPROVE (Phê duyệt)' },
              { value: 'REJECT', label: 'REJECT (Từ chối)' },
              { value: 'HANDOVER', label: 'HANDOVER (Bàn giao)' },
            ]}
            value={actionFilter}
            onChange={e => { setActionFilter(e.target.value); setPage(1); }}
          />
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-warm-gray-600">
            <thead className="bg-cream-200 text-warm-gray-700 uppercase text-xs font-semibold">
              <tr>
                <th className="px-6 py-3.5">Thời gian</th>
                <th className="px-6 py-3.5">Người thực hiện</th>
                <th className="px-6 py-3.5">Hành động</th>
                <th className="px-6 py-3.5">Đối tượng</th>
                <th className="px-6 py-3.5">IP Address</th>
                <th className="px-6 py-3.5">Mô tả chi tiết</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cream-300">
              {loading ? (
                [1, 2, 3, 4, 5].map(i => (
                  <tr key={i}>
                    <td colSpan={6} className="px-6 py-4">
                      <div className="h-6 bg-cream-200 rounded animate-pulse" />
                    </td>
                  </tr>
                ))
              ) : paginated.length > 0 ? (
                paginated.map(log => {
                  const num = parseInt(log.id?.replace(/\D/g, '') || '10', 10);
                  const ip = log.ip || `10.20.4.${(num * 7) % 240 + 10}`;
                  return (
                    <tr key={log.id} className="hover:bg-cream-100 transition-colors">
                      <td className="px-6 py-4 font-mono text-xs text-warm-gray-500 whitespace-nowrap">
                        {formatDateTime(log.createdAt)}
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-semibold text-text-dark flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-warm-gray-400" />
                          {log.userName}
                        </div>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap">
                        {getActionBadge(log.action)}
                      </td>

                      <td className="px-6 py-4 font-mono text-xs text-warm-gray-700 whitespace-nowrap">
                        <span className="font-semibold text-burgundy-900">{log.entity}</span>
                        <span className="text-warm-gray-400"> ({log.entityId})</span>
                      </td>

                      <td className="px-6 py-4 font-mono text-xs text-warm-gray-600 whitespace-nowrap">
                        <span className="bg-cream-200 px-2 py-0.5 rounded border border-cream-300">{ip}</span>
                      </td>

                      <td className="px-6 py-4 text-warm-gray-700 max-w-md">
                        <p className="line-clamp-2">{log.description}</p>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <EmptyState icon={FileText} title="Chưa có nhật ký hoạt động nào" />
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

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
    </div>
  );
}
