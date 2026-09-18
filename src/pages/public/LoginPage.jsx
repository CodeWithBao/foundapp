import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Eye, EyeOff, Lock, Mail, ShieldAlert, User, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import DNTULogo from '../../components/common/DNTULogo';
import { toast } from 'sonner';
import { ROLES, STORAGE_KEYS } from '../../constants';
import storageService from '../../services/storageService';

export default function LoginPage() {
  const { login, googleLogin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname;

  const [accountInput, setAccountInput] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const googleBtnRef = useRef(null);

  const handleAuthSuccess = (user) => {
    toast.success(`Đăng nhập thành công. Xin chào, ${user.name}!`);
    if (from) {
      navigate(from, { replace: true });
    } else if (user.role === ROLES.ADMIN) {
      navigate('/admin');
    } else if (user.role === ROLES.STAFF) {
      navigate('/staff');
    } else {
      navigate('/');
    }
  };

  const handleGoogleCallback = async (response) => {
    if (!response?.credential) return;
    setLoading(true);
    setError('');
    try {
      const user = await googleLogin(response.credential);
      handleAuthSuccess(user);
    } catch (err) {
      if (err.status === 409 || err.code === 'ACCOUNT_ALREADY_EXISTS' || err.message?.includes('ACCOUNT_ALREADY_EXISTS')) {
        const msg = 'Tài khoản email này đã được đăng ký bằng mật khẩu. Vui lòng đăng nhập bằng Email và Mật khẩu.';
        setError(msg);
        toast.error(msg);
      } else {
        const msg = err.message || 'Đăng nhập bằng Google thất bại.';
        setError(msg);
        toast.error(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  const isGoogleConfigured = import.meta.env.VITE_GOOGLE_CLIENT_ID && import.meta.env.VITE_GOOGLE_CLIENT_ID !== '1081395892804-demo.apps.googleusercontent.com';

  useEffect(() => {
    const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '1081395892804-demo.apps.googleusercontent.com';
    if (isGoogleConfigured && window.google?.accounts?.id && googleBtnRef.current) {
      try {
        window.google.accounts.id.disableAutoSelect();
        window.google.accounts.id.initialize({
          client_id: googleClientId,
          callback: handleGoogleCallback,
          auto_select: false,
          cancel_on_tap_outside: true,
        });
        window.google.accounts.id.renderButton(googleBtnRef.current, {
          theme: 'outline',
          size: 'large',
          width: '100%',
          text: 'signin_with',
          locale: 'vi',
          ux_mode: 'popup',
        });
      } catch (err) {
        console.warn('Google Identity initialization failed:', err);
      }
    }
  }, []);

  const handleLoginSubmit = async (emailToLogin, passwordToLogin) => {
    setLoading(true);
    setError('');
    try {
      let targetEmail = emailToLogin.trim();
      if (!targetEmail.includes('@')) {
        const users = storageService.get(STORAGE_KEYS.USERS) || [];
        const found = users.find(u => u.studentId?.toLowerCase() === targetEmail.toLowerCase());
        if (found) {
          targetEmail = found.email;
        }
      }

      const user = await login(targetEmail, passwordToLogin);
      handleAuthSuccess(user);
    } catch (err) {
      const msg = err.message || 'Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin.';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!accountInput || !password) {
      setError('Vui lòng nhập đầy đủ Email/MSSV và mật khẩu');
      return;
    }
    handleLoginSubmit(accountInput, password);
  };

  const handleQuickLogin = (email, roleName) => {
    setAccountInput(email);
    setPassword('123456');
    toast.info(`Đang đăng nhập nhanh bằng tài khoản ${roleName}...`);
    handleLoginSubmit(email, '123456');
  };

  const handleGoogleBtnClick = () => {
    if (window.google?.accounts?.id) {
      window.google.accounts.id.prompt();
    } else {
      const token = prompt('Nhập Google ID Token để thử nghiệm đăng nhập (hoặc bấm OK để tiếp tục):');
      if (token) {
        handleGoogleCallback({ credential: token });
      }
    }
  };

  return (
    <div className="min-h-screen flex bg-cream-50">
      {/* LEFT COLUMN - Split Screen Visual Panel */}
      <div
        className="hidden lg:flex lg:w-1/2 text-white p-12 flex-col justify-between relative overflow-hidden"
        style={{
          backgroundImage: `linear-gradient(to bottom right, rgba(92, 13, 17, 0.92), rgba(116, 18, 22, 0.88), rgba(152, 27, 30, 0.85)), url(/DNTU_Web_Asset_Kit/backgrounds/dntu-campus-clean-1280.webp)`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />
        
        <div className="relative z-10">
          <div className="mb-12">
            <DNTULogo size="lg" light={true} />
          </div>
          
          <div className="mt-16 space-y-4">
            <span className="inline-block px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-sm text-cream-100 text-xs font-medium tracking-wide border border-white/10">
              Vì một môi trường học đường an toàn & văn minh
            </span>
            <h2 className="text-4xl lg:text-5xl font-serif font-bold leading-tight text-white drop-shadow-sm">
              Tri thức<br />
              <span className="italic text-champagne-300">Kiến tạo tương lai</span>
            </h2>
            <blockquote className="text-cream-100/90 text-base max-w-md pt-2 italic border-l-2 border-[#C9A458] pl-4">
              "Tìm lại những điều quan trọng, kết nối cộng đồng DNTU với sự trung thực, trách nhiệm và nhân ái."
            </blockquote>
          </div>
        </div>

        <div className="relative z-10 border-t border-white/15 pt-6 text-cream-200/70 text-xs flex justify-between items-center">
          <p>© 2026 UniFind DNTU. All rights reserved.</p>
          <p className="font-serif italic text-[#C9A458]">Trường Đại học Công nghệ Đồng Nai</p>
        </div>
      </div>

      {/* RIGHT COLUMN - Form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12 lg:w-1/2">
        <div className="w-full max-w-md space-y-6">
          <div className="text-center sm:text-left">
            <div className="flex justify-center sm:justify-start mb-4">
              <DNTULogo size="lg" />
            </div>
            <h1 className="text-2xl md:text-3xl font-serif font-bold text-gray-900">Đăng nhập</h1>
            <p className="text-warm-gray-500 text-sm mt-1">Chào mừng bạn trở lại với UniFind DNTU</p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm p-3.5 rounded-xl flex items-center gap-2.5">
              <ShieldAlert className="w-5 h-5 text-red-500 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input 
              label="Email hoặc Mã số sinh viên (MSSV)" 
              type="text" 
              value={accountInput} 
              onChange={e => setAccountInput(e.target.value)} 
              placeholder="user@dntu.edu.vn hoặc SV20210001"
              icon={Mail}
              required
            />

            <div className="relative">
              <Input 
                label="Mật khẩu" 
                type={showPw ? 'text' : 'password'} 
                value={password} 
                onChange={e => setPassword(e.target.value)} 
                placeholder="••••••••" 
                icon={Lock}
                required
              />
              <button 
                type="button" 
                onClick={() => setShowPw(!showPw)}
                className="absolute right-3 top-[38px] text-warm-gray-400 hover:text-warm-gray-600 transition-colors"
                tabIndex={-1}
              >
                {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            <div className="flex items-center justify-between text-sm pt-1">
              <label className="flex items-center gap-2 cursor-pointer text-warm-gray-600">
                <input 
                  type="checkbox" 
                  checked={rememberMe} 
                  onChange={e => setRememberMe(e.target.checked)}
                  className="rounded border-warm-gray-300 text-[#AB1F24] focus:ring-[#AB1F24]" 
                />
                <span>Ghi nhớ đăng nhập</span>
              </label>
              <a href="#" onClick={(e) => { e.preventDefault(); toast.info('Vui lòng liên hệ Phòng Công tác Sinh viên hoặc Cán bộ quản trị để lấy lại mật khẩu.'); }} className="text-[#AB1F24] hover:text-[#74131A] font-medium text-xs">
                Quên mật khẩu?
              </a>
            </div>

            <Button type="submit" loading={loading} className="w-full bg-[#AB1F24] hover:bg-[#74131A] text-white py-3 rounded-xl font-medium shadow-sm transition-all">
              Đăng nhập DNTU
            </Button>

            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-warm-gray-200"></div>
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-cream-50 px-2 text-warm-gray-500">Hoặc</span>
              </div>
            </div>

            {isGoogleConfigured ? (
              <div ref={googleBtnRef} className="w-full flex justify-center min-h-[44px]"></div>
            ) : (
              <div className="w-full text-center p-3 border border-amber-300 bg-amber-50 text-amber-800 rounded-xl text-xs leading-relaxed">
                <strong>Chưa cấu hình Google Client ID:</strong> Vui lòng điền <code>VITE_GOOGLE_CLIENT_ID</code> hợp lệ vào file <code>.env</code> để kích hoạt đăng nhập Google.
              </div>
            )}
          </form>

          {/* Quick Login Chips (Demo accounts) */}
          <div className="pt-4 border-t border-warm-gray-200">
            <p className="text-xs font-semibold text-warm-gray-400 uppercase tracking-wider mb-2.5">
              Đăng nhập nhanh Demo
            </p>
            <div className="grid grid-cols-3 gap-2">
              <button 
                type="button"
                onClick={() => handleQuickLogin('user@dntu.edu.vn', 'Sinh viên')}
                className="px-2.5 py-2 bg-burgundy-50 border border-burgundy-100 hover:bg-burgundy-100 rounded-lg text-xs font-medium text-[#AB1F24] flex flex-col items-center justify-center gap-1 transition-colors"
              >
                <User className="w-3.5 h-3.5 text-[#AB1F24]" />
                <span>Sinh viên</span>
              </button>

              <button 
                type="button"
                onClick={() => handleQuickLogin('staff@dntu.edu.vn', 'Nhân viên')}
                className="px-2.5 py-2 bg-amber-50 border border-amber-100 hover:bg-amber-100 rounded-lg text-xs font-medium text-amber-700 flex flex-col items-center justify-center gap-1 transition-colors"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
                <span>Cán bộ / Staff</span>
              </button>

              <button 
                type="button"
                onClick={() => handleQuickLogin('admin@dntu.edu.vn', 'Admin')}
                className="px-2.5 py-2 bg-purple-50 border border-purple-100 hover:bg-purple-100 rounded-lg text-xs font-medium text-purple-700 flex flex-col items-center justify-center gap-1 transition-colors"
              >
                <ShieldAlert className="w-3.5 h-3.5 text-purple-600" />
                <span>Quản trị viên</span>
              </button>
            </div>
          </div>

          <p className="text-center text-sm text-warm-gray-500 pt-2">
            Chưa có tài khoản?{' '}
            <Link to="/register" className="text-[#AB1F24] hover:text-[#74131A] font-semibold underline underline-offset-2">
              Đăng ký ngay
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
