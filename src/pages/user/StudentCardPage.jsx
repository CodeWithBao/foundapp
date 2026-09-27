import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft, Printer, CreditCard, ShieldCheck, CheckCircle2,
  QrCode, User, Download, Sparkles, Building2, School
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import Button from '../../components/common/Button';

export default function StudentCardPage() {
  const { user } = useAuth();
  const cardRef = useRef(null);
  const [cardOrientation, setCardOrientation] = useState('HORIZONTAL'); // HORIZONTAL, VERTICAL

  // Extract or infer student details
  const studentName = (user?.name || user?.fullName || 'Nguyễn Văn An').toUpperCase();
  const studentId = user?.studentId || user?.mssv || '2310123456';
  const faculty = user?.faculty || 'Công nghệ thông tin';
  const academicYear = user?.academicYear || '2023 - 2027';
  const dob = '12/06/2005';

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-[#F8F6F3] py-8 md:py-12 px-4 sm:px-6 flex flex-col items-center justify-start">
      {/* Top Header Navigation */}
      <div className="w-full max-w-2xl mb-6 flex items-center justify-between print:hidden">
        <Link
          to="/profile"
          className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-stone-700 bg-white rounded-2xl border border-stone-200 hover:bg-stone-50 transition-colors shadow-xs"
        >
          <ArrowLeft className="w-4 h-4 text-[#981B1E]" />
          Quay lại hồ sơ
        </Link>

        <div className="flex items-center gap-2">
          {/* Orientation switch */}
          <div className="flex items-center bg-white p-1 rounded-2xl border border-stone-200 shadow-xs text-xs font-semibold">
            <button
              type="button"
              onClick={() => setCardOrientation('HORIZONTAL')}
              className={`px-3 py-1.5 rounded-xl transition-colors ${
                cardOrientation === 'HORIZONTAL'
                  ? 'bg-[#981B1E] text-white shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Thẻ ngang (Mockup)
            </button>
            <button
              type="button"
              onClick={() => setCardOrientation('VERTICAL')}
              className={`px-3 py-1.5 rounded-xl transition-colors ${
                cardOrientation === 'VERTICAL'
                  ? 'bg-[#981B1E] text-white shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Thẻ dọc (Thẻ đeo)
            </button>
          </div>

          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#981B1E] hover:bg-[#741216] rounded-2xl transition-colors shadow-xs"
          >
            <Printer className="w-4 h-4" />
            In thẻ
          </button>
        </div>
      </div>

      {/* Page Title Header */}
      <div className="text-center mb-8 print:hidden">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-50 text-[#981B1E] border border-red-200 text-xs font-semibold mb-2">
          <CreditCard className="w-3.5 h-3.5" />
          Xác thực điện tử UniFind DNTU
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900 tracking-tight">
          Thẻ Sinh Viên Kỹ Thuật Số
        </h1>
        <p className="text-xs sm:text-sm text-stone-500 mt-1 max-w-md mx-auto">
          Trường Đại học Công nghệ Đồng Nai &middot; Dong Nai Technology University
        </p>
      </div>

      {/* CARD RENDER AREA */}
      <div className="w-full max-w-2xl flex flex-col items-center">
        {cardOrientation === 'HORIZONTAL' ? (
          /* HORIZONTAL DIGITAL CARD (Mockup 07_student_portal.png) */
          <div
            ref={cardRef}
            className="relative w-full rounded-3xl overflow-hidden border border-[#E8E4DC] shadow-xl bg-[#FFFDF9] select-none transition-all duration-300 print:shadow-none print:border-stone-400"
          >
            {/* SVG Decorative Burgundy Curves */}
            <svg
              className="absolute inset-0 w-full h-full pointer-events-none"
              viewBox="0 0 650 360"
              preserveAspectRatio="none"
              fill="none"
            >
              <path
                d="M 0 0 L 360 0 C 310 140 160 160 0 170 Z"
                fill="#741216"
              />
              <path
                d="M 0 0 L 340 0 C 300 130 150 150 0 160 Z"
                fill="#981B1E"
              />
              <path
                d="M 650 360 L 220 360 C 260 290 420 280 650 250 Z"
                fill="#741216"
              />
              <path
                d="M 650 360 L 240 360 C 280 295 430 285 650 258 Z"
                fill="#981B1E"
              />
            </svg>

            <div className="relative z-10 p-6 sm:p-8 flex flex-col justify-between min-h-[320px] sm:min-h-[360px]">
              {/* Card Header Top */}
              <div className="flex items-start justify-between">
                {/* Left: DNTU School branding inside the top curve */}
                <div className="flex items-center gap-3 text-white max-w-[280px]">
                  <img
                    src="/DNTU_Web_Asset_Kit/branding/dntu-symbol-white.png"
                    alt="DNTU Logo"
                    className="w-12 h-12 object-contain drop-shadow"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                  <div>
                    <div className="text-xs font-semibold tracking-wider text-white/90 uppercase leading-none">
                      TRƯỜNG ĐẠI HỌC
                    </div>
                    <div className="text-sm sm:text-base font-extrabold tracking-wide text-white uppercase mt-0.5">
                      CÔNG NGHỆ ĐỒNG NAI
                    </div>
                  </div>
                </div>

                {/* Right: Card Title */}
                <div className="text-right">
                  <div className="text-base sm:text-lg font-black text-[#981B1E] uppercase tracking-wide">
                    THẺ SINH VIÊN
                  </div>
                  <div className="text-xs font-bold text-stone-500 uppercase tracking-widest">
                    STUDENT CARD
                  </div>
                </div>
              </div>

              {/* Card Body: Photo, Info, QR Code */}
              <div className="my-4 flex flex-col sm:flex-row items-center sm:items-start justify-between gap-5">
                {/* Student Photo */}
                <div className="shrink-0">
                  <div className="w-28 h-36 sm:w-32 sm:h-40 rounded-2xl overflow-hidden border-2 border-white shadow-md bg-stone-200">
                    {user?.avatar ? (
                      <img
                        src={user.avatar}
                        alt={studentName}
                        className="w-full h-full object-cover"
                        onError={(e) => { e.currentTarget.src = '/mascot/found.png'; }}
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-b from-stone-200 to-stone-300 flex items-center justify-center text-stone-500">
                        <User className="w-16 h-16 text-stone-400" />
                      </div>
                    )}
                  </div>
                </div>

                {/* Student Info */}
                <div className="flex-1 space-y-2 text-center sm:text-left">
                  <h3 className="text-lg sm:text-xl font-black text-[#981B1E] uppercase tracking-tight">
                    {studentName}
                  </h3>
                  <div className="grid grid-cols-2 gap-x-2 gap-y-1.5 text-xs sm:text-sm">
                    <span className="text-stone-500 font-medium">MSSV:</span>
                    <span className="font-bold text-stone-800 font-mono">{studentId}</span>

                    <span className="text-stone-500 font-medium">Niên khóa:</span>
                    <span className="font-semibold text-stone-800">{academicYear}</span>

                    <span className="text-stone-500 font-medium">Khoa:</span>
                    <span className="font-semibold text-stone-800">{faculty}</span>

                    <span className="text-stone-500 font-medium">Ngày sinh:</span>
                    <span className="font-semibold text-stone-800">{dob}</span>
                  </div>
                </div>

                {/* QR Code & Barcode */}
                <div className="shrink-0 flex flex-col items-center justify-center p-3 rounded-2xl bg-white border border-stone-200 shadow-xs">
                  <svg className="w-24 h-24 text-stone-800" viewBox="0 0 100 100" fill="currentColor">
                    <rect x="0" y="0" width="30" height="30" rx="3" />
                    <rect x="5" y="5" width="20" height="20" fill="white" rx="2" />
                    <rect x="10" y="10" width="10" height="10" rx="1" />
                    <rect x="70" y="0" width="30" height="30" rx="3" />
                    <rect x="75" y="5" width="20" height="20" fill="white" rx="2" />
                    <rect x="80" y="10" width="10" height="10" rx="1" />
                    <rect x="0" y="70" width="30" height="30" rx="3" />
                    <rect x="5" y="75" width="20" height="20" fill="white" rx="2" />
                    <rect x="10" y="80" width="10" height="10" rx="1" />
                    <rect x="36" y="8" width="8" height="8" />
                    <rect x="48" y="14" width="8" height="8" />
                    <rect x="36" y="26" width="8" height="8" />
                    <rect x="12" y="44" width="8" height="8" />
                    <rect x="28" y="40" width="8" height="8" />
                    <rect x="42" y="42" width="16" height="16" />
                    <rect x="66" y="44" width="8" height="8" />
                    <rect x="82" y="40" width="8" height="8" />
                    <rect x="40" y="70" width="8" height="8" />
                    <rect x="56" y="66" width="8" height="8" />
                    <rect x="48" y="82" width="8" height="8" />
                    <rect x="72" y="76" width="16" height="8" />
                    <rect x="80" y="88" width="12" height="8" />
                  </svg>
                  <div className="w-28 h-6 flex items-center justify-between mt-1 px-1">
                    {[2, 1, 3, 1, 2, 4, 1, 2, 1, 3, 2, 1, 3, 1, 2, 1, 4, 1, 2].map((w, idx) => (
                      <div key={idx} className="h-full bg-stone-900" style={{ width: `${w * 1.3}px` }} />
                    ))}
                  </div>
                  <span className="text-[10px] font-mono text-stone-600 font-semibold tracking-wider mt-0.5">
                    {studentId}
                  </span>
                </div>
              </div>

              {/* Card Footer Slogans inside curves */}
              <div className="flex items-end justify-between pt-1">
                <span className="font-['Caveat',cursive] text-sm sm:text-base text-stone-600">
                  Kiến tạo giá trị cho một tương lai tốt đẹp hơn
                </span>
                <span className="text-[11px] sm:text-xs font-bold text-white uppercase tracking-wider">
                  DNTU VĂN MINH - NGHĨA TÌNH - TỬ TẾ
                </span>
              </div>
            </div>
          </div>
        ) : (
          /* VERTICAL LANYARD CARD */
          <div
            ref={cardRef}
            className="w-[340px] sm:w-[370px] bg-white rounded-3xl shadow-xl overflow-hidden border border-stone-200 select-none relative flex flex-col transition-all duration-300 print:shadow-none"
          >
            {/* Top red header */}
            <div
              className="bg-[#981B1E] text-white pt-6 pb-16 px-4 text-center relative"
              style={{ clipPath: 'polygon(0 0, 100% 0, 100% 86%, 50% 100%, 0 86%)' }}
            >
              <div className="flex items-center justify-center gap-2 mb-2">
                <img
                  src="/DNTU_Web_Asset_Kit/branding/dntu-symbol-white.png"
                  alt="DNTU Logo"
                  className="w-8 h-8 object-contain drop-shadow"
                  onError={(e) => { e.currentTarget.style.display = 'none'; }}
                />
                <span className="text-xs font-bold uppercase tracking-wider">
                  ĐẠI HỌC CÔNG NGHỆ ĐỒNG NAI
                </span>
              </div>
              <h2 className="text-xl font-black uppercase tracking-wider">
                THẺ SINH VIÊN
              </h2>
            </div>

            {/* Content body */}
            <div className="bg-white -mt-12 pt-0 pb-6 px-6 flex flex-col items-center text-center relative z-10">
              <div className="w-32 h-32 rounded-full border-4 border-white shadow-md overflow-hidden bg-stone-100 mb-4">
                {user?.avatar ? (
                  <img src={user.avatar} alt={studentName} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-stone-200">
                    <User className="w-16 h-16 text-stone-400" />
                  </div>
                )}
              </div>

              <h3 className="text-lg font-bold text-stone-900 uppercase">
                {studentName}
              </h3>
              <p className="text-xs text-stone-500 font-mono mt-0.5">
                MSSV: <span className="font-bold text-stone-800">{studentId}</span>
              </p>
              <p className="text-xs text-stone-500 mt-0.5">
                Khoa: <span className="font-semibold text-stone-700">{faculty}</span>
              </p>
              <p className="text-xs text-stone-500 mt-0.5">
                Niên khóa: <span className="font-semibold text-stone-700">{academicYear}</span>
              </p>

              {/* Barcode */}
              <div className="w-full px-4 pt-4 flex flex-col items-center justify-center">
                <div className="w-full max-w-[240px] h-10 flex items-center justify-between">
                  {[2, 1, 3, 1, 2, 4, 1, 2, 1, 3, 2, 1, 3, 1, 2, 1, 4, 1, 2, 2, 1, 3, 1, 2, 4].map((w, idx) => (
                    <div key={idx} className="h-full bg-stone-900" style={{ width: `${w * 1.2}px` }} />
                  ))}
                </div>
                <span className="text-[10px] font-mono text-stone-600 font-semibold mt-1">
                  {studentId}
                </span>
              </div>
            </div>

            {/* Bottom Strip */}
            <div className="w-full h-2.5 bg-[#981B1E]" />
          </div>
        )}

        {/* Verification Guarantee Footer */}
        <div className="mt-8 text-center max-w-md text-xs text-stone-500 flex items-center justify-center gap-2 print:hidden">
          <ShieldCheck className="w-4 h-4 text-[#981B1E] shrink-0" />
          <span>Hệ thống nhận diện & xác thực sinh viên Trường Đại học Công nghệ Đồng Nai</span>
        </div>
      </div>
    </div>
  );
}
