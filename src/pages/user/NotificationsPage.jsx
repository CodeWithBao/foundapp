import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, CheckCheck, Sparkles, Hand, PackageCheck, AlertCircle, Info, ChevronRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import notificationService from '../../services/notificationService';
import EmptyState from '../../components/common/EmptyState';
import Button from '../../components/common/Button';
import Tabs from '../../components/common/Tabs';
import PageHeader from '../../components/common/PageHeader';
import { formatRelative } from '../../utils';
import { toast } from 'sonner';

export default function NotificationsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    if (user?.id) loadNotifications();
  }, [user?.id]);

  const loadNotifications = async () => {
    setLoading(true);
    try {
      const data = await notificationService.getByUser(user.id);
      setNotifications(data || []);
    } catch (err) {
      toast.error(err.message || 'Lỗi khi tải thông báo');
    } finally {
      setLoading(false);
    }
  };

  const handleNotificationClick = async (notification) => {
    try {
      if (!notification.read) {
        await notificationService.markAsRead(notification.id);
        setNotifications(prev => prev.map(n => n.id === notification.id ? { ...n, read: true } : n));
      }

      // Navigate to destination based on type or relatedId
      if (notification.type?.includes('match')) {
        navigate('/matches');
      } else if (notification.type?.includes('claim') || notification.type?.includes('handover')) {
        navigate('/my-claims');
      } else if (notification.relatedId) {
        navigate(`/items/${notification.relatedId}`);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationService.markAllAsRead(user.id);
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      toast.success('Đã đánh dấu tất cả thông báo là đã đọc');
    } catch (err) {
      toast.error('Lỗi khi cập nhật trạng thái đã đọc');
    }
  };

  const tabs = [
    { key: 'all', label: `Tất cả (${notifications.length})` },
    { key: 'unread', label: `Chưa đọc (${notifications.filter(n => !n.read).length})` },
  ];

  const filtered = notifications.filter(n => {
    if (activeTab === 'unread') return !n.read;
    return true;
  });

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'match_found':
        return <Sparkles className="w-5 h-5 text-champagne-500" />;
      case 'claim_submitted':
      case 'new_claim':
        return <Hand className="w-5 h-5 text-blue-600" />;
      case 'claim_approved':
      case 'ready_handover':
      case 'handover_complete':
        return <PackageCheck className="w-5 h-5 text-emerald-600" />;
      case 'claim_rejected':
        return <AlertCircle className="w-5 h-5 text-dntu-danger" />;
      default:
        return <Info className="w-5 h-5 text-burgundy-700" />;
    }
  };

  const getIconBg = (type) => {
    switch (type) {
      case 'match_found':
        return 'bg-amber-100 border border-amber-200';
      case 'claim_submitted':
      case 'new_claim':
        return 'bg-blue-100 border border-blue-200';
      case 'claim_approved':
      case 'ready_handover':
      case 'handover_complete':
        return 'bg-emerald-100 border border-emerald-200';
      case 'claim_rejected':
        return 'bg-red-100 border border-red-200';
      default:
        return 'bg-burgundy-100 border border-burgundy-200';
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-burgundy-900">Thông báo</h1>
          <p className="text-sm text-warm-gray-500 mt-1">
            Cập nhật tức thì các biến động về bài đăng, yêu cầu xác minh và kết quả trùng khớp.
          </p>
        </div>
        {unreadCount > 0 && (
          <Button
            variant="secondary"
            size="sm"
            onClick={handleMarkAllRead}
            className="whitespace-nowrap shadow-xs"
          >
            <CheckCheck className="w-4 h-4 mr-1.5 text-burgundy-700" /> Đánh dấu tất cả đã đọc
          </Button>
        )}
      </div>

      <div className="mb-6">
        <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="card p-4 animate-pulse h-20" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Bell}
          title="Không có thông báo nào"
          description={activeTab === 'unread' ? 'Bạn không có thông báo chưa đọc nào.' : 'Hiện tại chưa có thông báo mới.'}
        />
      ) : (
        <div className="space-y-3">
          {filtered.map(n => (
            <div
              key={n.id}
              onClick={() => handleNotificationClick(n)}
              className={`card p-4 cursor-pointer transition-all duration-200 hover:shadow-card-hover flex items-start gap-4 ${
                !n.read
                  ? 'border-l-4 border-l-burgundy-600 bg-burgundy-50/20'
                  : 'hover:bg-cream-50/60'
              }`}
            >
              {/* Icon */}
              <div className={`w-10 h-10 rounded-card flex items-center justify-center shrink-0 ${getIconBg(n.type)}`}>
                {getNotificationIcon(n.type)}
              </div>

              {/* Text content */}
              <div className="flex-1 min-w-0 pt-0.5">
                <div className="flex items-center justify-between gap-2">
                  <h4 className={`text-sm ${!n.read ? 'font-bold text-burgundy-900' : 'font-semibold text-text-dark'}`}>
                    {n.title}
                  </h4>
                  <span className="text-xs text-warm-gray-400 shrink-0 font-medium">
                    {formatRelative(n.createdAt)}
                  </span>
                </div>
                <p className="text-sm text-warm-gray-600 mt-1 leading-relaxed">
                  {n.message}
                </p>
              </div>

              {/* Status indicator / Arrow */}
              <div className="shrink-0 flex items-center self-center pl-2 text-warm-gray-400">
                {!n.read ? (
                  <span className="w-2.5 h-2.5 bg-burgundy-600 rounded-full" />
                ) : (
                  <ChevronRight className="w-4 h-4 opacity-50" />
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
