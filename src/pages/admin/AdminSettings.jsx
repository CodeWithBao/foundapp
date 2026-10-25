import { useState } from 'react';
import { toast } from 'sonner';
import { RotateCcw, Save, Settings, ShieldAlert, Bell, Globe } from 'lucide-react';
import PageHeader from '../../components/common/PageHeader';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import { ConfirmModal } from '../../components/common/Modal';
import storageService from '../../services/storageService';

export default function AdminSettings() {
  const [settings, setSettings] = useState({
    systemName: 'UniFind DNTU',
    slogan: 'Hệ thống tìm kiếm và nhận lại đồ thất lạc Trường Đại học Đồng Nai',
    contactEmail: 'unifind@dntu.edu.vn',
    supportPhone: '0251 382 2263',
    storageRetentionDays: '30',
    requireProof: true,
  });

  const [isResetModalOpen, setIsResetModalOpen] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSettings((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSave = (e) => {
    e.preventDefault();
    toast.success('Đã lưu cài đặt hệ thống!');
  };

  const handleResetData = () => {
    storageService.reset();
    toast.success('Đã khôi phục dữ liệu mẫu ban đầu!');
    setIsResetModalOpen(false);
    setTimeout(() => {
      window.location.reload();
    }, 500);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Cài đặt hệ thống"
        subtitle="Quản lý cấu hình chung, chính sách lưu kho và hành động phát triển"
      />

      <form onSubmit={handleSave} className="space-y-6">
        {/* Cài đặt chung */}
        <div className="bg-white p-6 rounded-card border border-cream-300 shadow-card">
          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-cream-200">
            <Globe className="w-5 h-5 text-burgundy-600" />
            <h2 className="text-lg font-semibold text-text-dark">Cài đặt chung</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Tên hệ thống"
              name="systemName"
              value={settings.systemName}
              onChange={handleChange}
            />
            <Input
              label="Slogan"
              name="slogan"
              value={settings.slogan}
              onChange={handleChange}
            />
            <Input
              label="Email liên hệ"
              name="contactEmail"
              type="email"
              value={settings.contactEmail}
              onChange={handleChange}
            />
            <Input
              label="Số điện thoại hỗ trợ"
              name="supportPhone"
              value={settings.supportPhone}
              onChange={handleChange}
            />
          </div>
        </div>

        {/* Cài đặt thông báo & bàn giao */}
        <div className="bg-white p-6 rounded-card border border-cream-300 shadow-card">
          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-cream-200">
            <Bell className="w-5 h-5 text-burgundy-600" />
            <h2 className="text-lg font-semibold text-text-dark">Cài đặt thông báo & bàn giao</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
            <Input
              label="Thời gian tự động lưu kho (ngày)"
              name="storageRetentionDays"
              type="number"
              value={settings.storageRetentionDays}
              onChange={handleChange}
            />
            <div className="flex items-center gap-3 pt-6">
              <input
                type="checkbox"
                id="requireProof"
                name="requireProof"
                checked={settings.requireProof}
                onChange={handleChange}
                className="w-4 h-4 text-burgundy-600 border-cream-400 rounded focus:ring-burgundy-500"
              />
              <label htmlFor="requireProof" className="text-sm font-medium text-text-dark cursor-pointer">
                Yêu cầu minh chứng khi nhận lại đồ (Claim)
              </label>
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <Button type="submit" variant="primary" icon={Save}>
            Lưu thay đổi
          </Button>
        </div>
      </form>

      {/* Dev Action Zone */}
      <div className="bg-red-50 p-6 rounded-card border border-red-200 shadow-card">
        <div className="flex items-center gap-2 mb-2">
          <ShieldAlert className="w-5 h-5 text-dntu-danger" />
          <h2 className="text-lg font-semibold text-dntu-danger">Vùng nguy hiểm (Dev Action)</h2>
        </div>
        <p className="text-sm text-warm-gray-600 mb-4">
          Xóa toàn bộ dữ liệu hiện tại trong localStorage và khôi phục lại dữ liệu mẫu (Demo Data) ban đầu.
        </p>
        <Button
          type="button"
          variant="danger"
          icon={RotateCcw}
          onClick={() => setIsResetModalOpen(true)}
        >
          Reset Dữ liệu Mẫu (Demo Data)
        </Button>
      </div>

      <ConfirmModal
        isOpen={isResetModalOpen}
        onClose={() => setIsResetModalOpen(false)}
        onConfirm={handleResetData}
        title="Xác nhận Reset Dữ Liệu"
        message="Bạn có chắc chắn muốn xóa toàn bộ dữ liệu hiện tại và khôi phục dữ liệu mẫu ban đầu không? Thao tác này không thể hoàn tác."
        confirmText="Reset Dữ Liệu"
        cancelText="Hủy"
        variant="danger"
      />
    </div>
  );
}
