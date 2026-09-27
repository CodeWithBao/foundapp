import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, User, IdCard, CheckSquare, Square } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import DNTULogo from '../../components/common/DNTULogo';
import { toast } from 'sonner';

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ 
    name: '', 
    studentId: '', 
    email: '', 
    password: '', 
    confirmPassword: '',
    agreeTerms: false 
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Vui lòng nhập họ và tên';
    if (!form.studentId.trim()) e.studentId = 'Vui lòng nhập mã số sinh viên';
    if (!form.email.trim()) {
      e.email = 'Vui lòng nhập email trường (@dntu.edu.vn)';
    } else if (!form.email.endsWith('@dntu.edu.vn')) {
      e.email = 'Email phải có đuôi @dntu.edu.vn';
    }
    if (!form.password) {
      e.password = 'Vui lòng nhập mật khẩu';
    } else if (form.password.length < 6) {
      e.password = 'Mật khẩu phải có ít nhất 6 ký tự';
    }
    if (form.password !== form.confirmPassword) {
      e.confirmPassword = 'Mật khẩu xác nhận không khớp';
    }
    if (!form.agreeTerms) {
      e.agreeTerms = 'Bạn cần đồng ý với Điều khoản sử dụng';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      await register({
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
        studentId: form.studentId.trim(),
      });
      toast.success('Đăng ký tài khoản thành công! Thả ga kết nối UniFind DNTU.');
      navigate('/');
    } catch (err) {
      setErrors({ email: err.message || 'Đăng ký thất bại. Vui lòng thử lại.' });
      toast.error(err.message || 'Đăng ký thất bại');
    } finally { 
      setLoading(false); 
    }
  };

  const setField = (key, val) => {
    setForm(prev => ({ ...prev, [key]: val }));
    if (errors[key]) {
      setErrors(prev => ({ ...prev, [key]: null }));
    }
  };

  return (
    <div className="min-h-screen flex bg-[#FAF8F2]">
      {/* LEFT COLUMN - Visual Panel with DNTU Campus background */}
      <div
        className="hidden lg:flex lg:w-1/2 text-white p-12 lg:p-16 flex-col justify-between relative overflow-hidden"
        style={{
          backgroundImage: `linear-gradient(145deg, rgba(20, 26, 31, 0.94) 0%, rgba(138, 26, 34, 0.88) 55%, rgba(173, 34, 43, 0.82) 100%), url(/DNTU_Web_Asset_Kit/asset/campus_colorful_building.jpg)`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#FAF8F2_1px,transparent_1px)] [background-size:20px_20px] pointer-events-none" />
        
        <div className="relative z-10">
          <div className="mb-12">
            <DNTULogo size="lg" light={true} />
          </div>
          
          <div className="mt-14 space-y-6 max-w-lg">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-[#E4C87F] text-[11px] font-mono font-semibold uppercase tracking-wider">
              <span className="w-1.5 h-1.5 rounded-full bg-[#E4C87F] animate-ping" />
              Cộng Đồng Sinh Viên DNTU
            </div>
            <h2 className="text-4xl lg:text-5xl font-serif font-semibold leading-[1.15] text-white tracking-tight">
              Học tập · Trải nghiệm<br />
              <span className="italic text-[#E4C87F] font-normal">Trưởng thành cùng DNTU</span>
            </h2>
            <p className="text-white/85 text-sm lg:text-base leading-relaxed border-l-2 border-[#B9882E] pl-4 font-normal">
              Tham gia UniFind DNTU để xây dựng môi trường học tập văn minh, hỗ trợ bạn bè tìm lại tài sản và lan tỏa những thông điệp tích cực.
            </p>
          </div>
        </div>

        <div className="relative z-10 border-t border-white/15 pt-6 text-white/70 text-xs flex justify-between items-center font-mono">
          <p>© 2026 UniFind DNTU · All rights reserved</p>
          <p className="font-serif italic text-[#E4C87F]">Trường Đại học Công nghệ Đồng Nai</p>
        </div>
      </div>

      {/* RIGHT COLUMN - Form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12 lg:p-16">
        <div className="w-full max-w-md space-y-6">
          <div className="text-center sm:text-left">
            <div className="flex justify-center sm:justify-start mb-5">
              <DNTULogo size="lg" />
            </div>
            <span className="label-micro text-[#AD222B]">Đăng ký thành viên</span>
            <h1 className="page-title text-3xl font-serif text-[#1C2530] mt-1">Tạo tài khoản</h1>
            <p className="text-[#5B6574] text-sm mt-1.5">Tham gia cộng đồng UniFind DNTU ngay hôm nay</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 surface p-6 sm:p-7">
            <Input 
              label="Họ và tên *" 
              value={form.name} 
              onChange={e => setField('name', e.target.value)} 
              error={errors.name} 
              placeholder="Nguyễn Văn An" 
              icon={User}
            />

            <Input 
              label="Mã số sinh viên (MSSV) *" 
              value={form.studentId} 
              onChange={e => setField('studentId', e.target.value)} 
              error={errors.studentId} 
              placeholder="SV20210001" 
              icon={IdCard}
            />

            <Input 
              label="Email DNTU (@dntu.edu.vn) *" 
              type="email" 
              value={form.email} 
              onChange={e => setField('email', e.target.value)} 
              error={errors.email} 
              placeholder="user@dntu.edu.vn" 
              icon={Mail}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input 
                label="Mật khẩu *" 
                type="password" 
                value={form.password} 
                onChange={e => setField('password', e.target.value)} 
                error={errors.password} 
                placeholder="Tối thiểu 6 ký tự" 
                icon={Lock}
              />

              <Input 
                label="Xác nhận mật khẩu *" 
                type="password" 
                value={form.confirmPassword} 
                onChange={e => setField('confirmPassword', e.target.value)} 
                error={errors.confirmPassword} 
                placeholder="Nhập lại mật khẩu" 
                icon={Lock}
              />
            </div>

            <div className="pt-2">
              <label 
                className="flex items-start gap-2.5 cursor-pointer text-xs sm:text-sm text-[#5B6574] select-none"
                onClick={() => setField('agreeTerms', !form.agreeTerms)}
              >
                <button type="button" className="mt-0.5 shrink-0 text-[#AD222B] focus:outline-none">
                  {form.agreeTerms ? (
                    <CheckSquare className="w-4 h-4 text-[#AD222B]" />
                  ) : (
                    <Square className="w-4 h-4 text-[#8C95A3]" />
                  )}
                </button>
                <span>
                  Tôi đồng ý với <a href="#" onClick={e => { e.stopPropagation(); e.preventDefault(); toast.info('Điều khoản sử dụng của UniFind DNTU'); }} className="text-[#AD222B] font-medium hover:underline">Điều khoản sử dụng</a> và <a href="#" onClick={e => { e.stopPropagation(); e.preventDefault(); toast.info('Chính sách bảo mật của UniFind DNTU'); }} className="text-[#AD222B] font-medium hover:underline">Chính sách bảo mật</a>.
                </span>
              </label>
              {errors.agreeTerms && (
                <p className="mt-1 text-xs text-red-500">{errors.agreeTerms}</p>
              )}
            </div>

            <Button 
              type="submit" 
              loading={loading} 
              className="btn-primary w-full py-3 mt-2"
            >
              Tạo tài khoản DNTU
            </Button>
          </form>

          <p className="text-center text-sm text-[#5B6574]">
            Đã có tài khoản?{' '}
            <Link to="/login" className="text-[#AD222B] hover:text-[#8A1A22] font-semibold underline underline-offset-4">
              Đăng nhập ngay
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
