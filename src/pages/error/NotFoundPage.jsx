import { Link } from 'react-router-dom';
import { Home, FileQuestion } from 'lucide-react';
import Button from '../../components/common/Button';

export default function NotFoundPage() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-12">
      <div className="text-center max-w-md mx-auto">
        <div className="w-24 h-24 bg-burgundy-50 text-burgundy-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-card">
          <FileQuestion className="w-12 h-12" />
        </div>
        <h1 className="text-6xl font-extrabold text-burgundy-600 tracking-tight">404</h1>
        <h2 className="text-2xl font-bold text-text-dark mt-2">404 - Trang không tồn tại</h2>
        <p className="text-warm-gray-500 mt-3 text-sm">
          Trang bạn đang tìm kiếm không tồn tại, đã bị xóa hoặc đường dẫn bị thay đổi.
        </p>
        <div className="mt-8 flex justify-center">
          <Link to="/">
            <Button variant="primary" icon={Home}>
              Về trang chủ
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
