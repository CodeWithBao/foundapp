import { useState } from 'react';
import { Modal } from './Modal';
import Button from './Button';
import Textarea from './Textarea';
import reportService from '../../services/reportService';
import { toast } from 'sonner';

const REPORT_REASONS = [
  'Nội dung sai sự thật',
  'Nội dung không phù hợp',
  'Bài đăng trùng lặp',
  'Có dấu hiệu lừa đảo',
  'Spam',
  'Lý do khác',
];

export default function ReportModal({ isOpen, onClose, postId, postTitle }) {
  const [reason, setReason] = useState(REPORT_REASONS[0]);
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (reason === 'Lý do khác' && !description.trim()) {
      toast.error('Vui lòng nhập nội dung chi tiết lý do báo cáo');
      return;
    }

    setSubmitting(true);
    try {
      await reportService.createReport({
        postId,
        reason,
        description: description.trim(),
      });
      toast.success('Báo cáo đã được gửi đến quản trị viên.');
      onClose();
      // Reset form
      setReason(REPORT_REASONS[0]);
      setDescription('');
    } catch (err) {
      toast.error(err.message || 'Lỗi khi gửi báo cáo');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Báo cáo bài đăng"
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {postTitle && (
          <div className="p-3 bg-cream-100 rounded-lg border border-cream-300 text-xs text-warm-gray-600 font-medium">
            Bài viết: <span className="text-burgundy-900 font-bold">{postTitle}</span>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-text-dark mb-2">
            Chọn lý do báo cáo <span className="text-red-500">*</span>
          </label>
          <div className="space-y-2">
            {REPORT_REASONS.map((item) => (
              <label
                key={item}
                className={`flex items-center gap-3 p-3 rounded-button border cursor-pointer transition-colors ${
                  reason === item
                    ? 'border-burgundy-600 bg-burgundy-50/50 text-burgundy-900 font-medium'
                    : 'border-cream-300 hover:bg-cream-100 text-warm-gray-700'
                }`}
              >
                <input
                  type="radio"
                  name="reportReason"
                  value={item}
                  checked={reason === item}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-4 h-4 text-burgundy-700 focus:ring-burgundy-500"
                />
                <span className="text-sm">{item}</span>
              </label>
            ))}
          </div>
        </div>

        {reason === 'Lý do khác' && (
          <Textarea
            label="Nội dung chi tiết"
            required
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Vui lòng cung cấp thêm chi tiết để ban quản trị xem xét..."
            rows={3}
          />
        )}

        <div className="flex justify-end gap-3 pt-4 border-t border-cream-200">
          <Button variant="ghost" type="button" onClick={onClose} disabled={submitting}>
            Hủy
          </Button>
          <Button type="submit" loading={submitting} variant="danger">
            Gửi báo cáo
          </Button>
        </div>
      </form>
    </Modal>
  );
}
