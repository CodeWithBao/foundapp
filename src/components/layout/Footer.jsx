import { Link } from 'react-router-dom';
import { MapPin, Phone, Mail, Globe } from 'lucide-react';
import DNTULogo from '../common/DNTULogo';

export default function Footer() {
  return (
    <footer className="bg-burgundy-900 text-white pt-12 pb-20 md:pb-8 border-t border-burgundy-800">
      <div className="page-container">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Col 1: Brand */}
          <div className="space-y-4">
            <div className="bg-white/10 p-2 rounded-lg inline-block backdrop-blur-sm border border-white/10">
              <DNTULogo size="md" light={true} />
            </div>
            <p className="text-cream-200 text-sm leading-relaxed">
              Hệ thống quản lý và tìm kiếm đồ thất lạc Trường Đại học Công nghệ Đồng Nai (DNTU). Giúp kết nối và hỗ trợ sinh viên nhanh chóng.
            </p>
          </div>

          {/* Col 2: Liên kết nhanh */}
          <div>
            <h4 className="font-semibold text-champagne-400 mb-4 text-sm uppercase tracking-wider">
              Liên kết nhanh
            </h4>
            <ul className="space-y-2 text-sm text-cream-200">
              <li>
                <Link to="/" className="hover:text-champagne-400 transition-colors">
                  Trang chủ
                </Link>
              </li>
              <li>
                <Link to="/search" className="hover:text-champagne-400 transition-colors">
                  Tìm kiếm đồ thất lạc
                </Link>
              </li>
              <li>
                <Link to="/report-lost" className="hover:text-champagne-400 transition-colors">
                  Báo mất đồ
                </Link>
              </li>
              <li>
                <Link to="/report-found" className="hover:text-champagne-400 transition-colors">
                  Báo nhặt được đồ
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 3: Hỗ trợ */}
          <div>
            <h4 className="font-semibold text-champagne-400 mb-4 text-sm uppercase tracking-wider">
              Hỗ trợ & Hướng dẫn
            </h4>
            <ul className="space-y-2 text-sm text-cream-200">
              <li>
                <span className="hover:text-champagne-400 cursor-pointer transition-colors">
                  Quy trình nhận lại đồ
                </span>
              </li>
              <li>
                <span className="hover:text-champagne-400 cursor-pointer transition-colors">
                  Quy định xác minh
                </span>
              </li>
              <li>
                <span className="hover:text-champagne-400 cursor-pointer transition-colors">
                  Câu hỏi thường gặp (FAQ)
                </span>
              </li>
              <li>
                <span className="hover:text-champagne-400 cursor-pointer transition-colors">
                  Chính sách bảo mật
                </span>
              </li>
            </ul>
          </div>

          {/* Col 4: Liên hệ */}
          <div>
            <h4 className="font-semibold text-champagne-400 mb-4 text-sm uppercase tracking-wider">
              Liên hệ
            </h4>
            <ul className="space-y-2.5 text-sm text-cream-200">
              <li className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-champagne-400 shrink-0 mt-0.5" />
                <span>Khu phố 5, P. Trảng Dài, TP. Biên Hòa, Đồng Nai</span>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-champagne-400 shrink-0" />
                <span>(0251) 3996 579</span>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-champagne-400 shrink-0" />
                <span>unifind@dntu.edu.vn</span>
              </li>
              <li className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-champagne-400 shrink-0" />
                <span>dntu.edu.vn</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom footer */}
        <div className="pt-6 border-t border-burgundy-800 flex flex-col md:flex-row items-center justify-between text-xs text-cream-300 gap-2">
          <p>© 2026 UniFind DNTU - Trường Đại học Công nghệ Đồng Nai. All rights reserved.</p>
          <p className="text-champagne-400/80">UniFind là sản phẩm được phát triển nhằm phục vụ mục đích nghiên cứu và học tập và không đại diện cho nền tảng chính thức của nhà trường.</p>
        </div>
      </div>
    </footer>
  );
}
