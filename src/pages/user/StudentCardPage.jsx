import { useRef } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Printer, CreditCard, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function StudentCardPage() {
  const { user } = useAuth();
  const cardRef = useRef(null);

  // Extract or infer student details
  const studentName = (user?.fullName || user?.name || 'TRẦN DUY VƯƠNG').toUpperCase();
  const studentId = user?.studentId || user?.mssv || '2024060258';

  // Infer academic year if not provided
  const getAcademicYear = () => {
    if (user?.academicYear) return user.academicYear;
    if (user?.nienKhoa) return user.nienKhoa;
    const match = String(studentId).match(/(20\d{2})/);
    if (match) {
      const startYear = parseInt(match[1], 10);
      return `${startYear}-${startYear + 4}`;
    }
    return '2024-2028';
  };

  const academicYear = getAcademicYear();

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#F8F6F3] py-8 px-4 flex flex-col items-center justify-start">
      {/* Top Header Navigation */}
      <div className="w-full max-w-md mb-6 flex items-center justify-between">
        <Link
          to="/profile"
          className="inline-flex items-center gap-2 px-3.5 py-2 text-sm font-medium text-warm-gray-700 bg-white rounded-lg border border-cream-300 hover:bg-cream-100 transition-colors shadow-sm"
        >
          <ArrowLeft className="w-4 h-4 text-burgundy-700" />
          Quay lại hồ sơ
        </Link>

        <button
          onClick={handlePrint}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium text-burgundy-800 bg-white rounded-lg border border-burgundy-200 hover:bg-burgundy-50 transition-colors shadow-sm"
        >
          <Printer className="w-4 h-4 text-burgundy-700" />
          In thẻ
        </button>
      </div>

      {/* Page Title */}
      <div className="text-center mb-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-burgundy-100 text-burgundy-800 text-xs font-semibold mb-2">
          <CreditCard className="w-3.5 h-3.5" />
          THẺ SINH VIÊN DNTU
        </div>
        <h1 className="text-2xl font-bold text-gray-900 font-serif">Thẻ Sinh Viên</h1>
        <p className="text-sm text-gray-600 mt-1">
          Thông tin sinh viên Trường Đại học Công nghệ Đồng Nai
        </p>
      </div>

      {/* DNTU STUDENT CARD CONTAINER */}
      <div className="relative print:m-0 print:shadow-none">
        <div
          ref={cardRef}
          className="w-[340px] sm:w-[370px] bg-white rounded-[22px] shadow-2xl overflow-hidden border border-gray-200/90 relative flex flex-col select-none transition-all duration-300"
          style={{ fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}
        >
          {/* LEFT BLUE ACCENT */}
          <div className="absolute left-0 top-[46%] -translate-y-1/2 w-3.5 h-16 bg-[#0060DF] rounded-r-xl z-20 shadow-sm" />

          {/* RIGHT BLUE ACCENT */}
          <div className="absolute right-0 top-[46%] -translate-y-1/2 w-3.5 h-16 bg-[#0060DF] rounded-l-xl z-20 shadow-sm" />

          {/* TOP RED SECTION WITH V-SHAPE CUT */}
          <div
            className="bg-[#DE1B22] text-white pt-6 pb-20 px-4 text-center relative z-0"
            style={{
              clipPath: 'polygon(0 0, 100% 0, 100% 86%, 50% 100%, 0 86%)',
            }}
          >
            {/* DNTU Logo Top Left */}
            <div className="absolute top-5 left-5 flex flex-col items-center">
              <img
                src="/DNTU_Web_Asset_Kit/branding/dntu-symbol-white.png"
                alt="DNTU Logo"
                className="w-10 h-10 object-contain drop-shadow"
                onError={(e) => {
                  e.target.style.display = 'none';
                  const fb = e.target.nextSibling;
                  if (fb) fb.style.display = 'block';
                }}
              />
              <svg
                className="w-9 h-9 text-white hidden"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
              </svg>
              <span className="text-[10px] font-black tracking-widest text-white mt-0.5">DNTU</span>
            </div>

            {/* Title Texts */}
            <div className="pl-10 pr-2">
              <h2 className="text-[14px] sm:text-[15px] font-bold tracking-wide leading-tight uppercase text-white/95">
                TRƯỜNG ĐẠI HỌC
              </h2>
              <h3 className="text-[15px] sm:text-[16px] font-extrabold tracking-wide leading-tight uppercase text-white">
                CÔNG NGHỆ ĐỒNG NAI
              </h3>
              <div className="mt-3">
                <span className="text-[24px] sm:text-[26px] font-black tracking-wider uppercase text-white font-sans drop-shadow-sm">
                  THẺ SINH VIÊN
                </span>
              </div>
            </div>
          </div>

          {/* LOWER WHITE SECTION */}
          <div className="bg-white pt-0 pb-3 px-5 flex flex-col items-center text-center relative z-10">
            {/* CIRCULAR AVATAR OVERLAPPING V-POINT */}
            <div className="relative -mt-20 mb-4 z-30">
              <div className="w-36 h-36 sm:w-40 sm:h-40 rounded-full border-[6px] border-white shadow-md overflow-hidden bg-[#E5E7EB] flex items-center justify-center">
                {user?.avatar ? (
                  <img
                    src={user.avatar}
                    alt={studentName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-[#E5E7EB] flex items-center justify-center">
                    <svg
                      className="w-28 h-28 text-[#9CA3AF] mt-3"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                    </svg>
                  </div>
                )}
              </div>
            </div>

            {/* DETAILS */}
            <div className="w-full space-y-1.5 mb-5 z-10">
              {/* Full Name */}
              <h4 className="text-xl sm:text-[23px] font-extrabold text-black tracking-tight leading-snug">
                {studentName}
              </h4>

              {/* Student ID */}
              <p className="text-[17px] text-gray-900 pt-0.5">
                Mã số: <span className="font-bold">{studentId}</span>
              </p>

              {/* Academic Year */}
              <p className="text-[17px] text-gray-900">
                Niên khóa: <span className="font-normal">{academicYear}</span>
              </p>
            </div>

            {/* BARCODE */}
            <div className="w-full px-2 pt-1 flex flex-col items-center justify-center mb-4 z-10">
              <div className="w-full max-w-[270px] h-12 flex items-center justify-between px-1">
                {[
                  2, 1, 3, 1, 2, 4, 1, 2, 1, 3, 2, 1, 4, 1, 2, 3, 1, 2, 1, 3,
                  1, 4, 2, 1, 3, 1, 2, 1, 4, 2, 1, 3, 1, 2, 4, 1, 2, 3, 1, 2
                ].map((width, idx) => (
                  <div
                    key={idx}
                    className="h-full bg-black rounded-[0.5px]"
                    style={{ width: `${width * 1.5}px` }}
                  />
                ))}
              </div>
            </div>

            {/* BOTTOM RED ROUNDED STRIP */}
            <div className="w-full h-3 bg-[#DE1B22] rounded-b-[22px] absolute bottom-0 left-0" />
          </div>
        </div>
      </div>

      {/* Footer Info */}
      <div className="mt-6 text-center max-w-sm text-xs text-warm-gray-500 flex items-center justify-center gap-1.5">
        <ShieldCheck className="w-4 h-4 text-burgundy-600 shrink-0" />
        <span>Hệ thống nhận diện sinh viên Trường Đại học Công nghệ Đồng Nai</span>
      </div>
    </div>
  );
}
