import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Eye, EyeOff, Lock, Mail, ShieldAlert, User, ShieldCheck, CheckCircle2 } from 'lucide-react';
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
  const [successMessage, setSuccessMessage] = useState('');
  const googleBtnRef = useRef(null);

  const handleAuthSuccess = (user) => {
    setSuccessMessage(`Đăng nhập thành công. Xin chào, ${user.name}!`);
    setTimeout(() => {
      if (from) {
        navigate(from, { replace: true });
      } else if (user.role === ROLES.ADMIN) {
        navigate('/admin');
      } else if (user.role === ROLES.STAFF) {
        navigate('/staff');
      } else {
        navigate('/');
      }
    }, 700);
  };

  const handleGoogleCallback = async (response) => {
    if (!response?.credential) return;
    setLoading(true);
    setError('');
    setSuccessMessage('');
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
    setSuccessMessage('');
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
    <div className="min-h-screen flex bg-[#FAF8F2]">
      {/* LEFT COLUMN - Split Screen Visual Panel */}
      <div
        className="hidden lg:flex lg:w-1/2 text-white p-12 lg:p-16 flex-col justify-between relative overflow-hidden"
        style={{
          backgroundImage: `linear-gradient(145deg, rgba(20, 26, 31, 0.94) 0%, rgba(138, 26, 34, 0.88) 55%, rgba(173, 34, 43, 0.82) 100%), url(/DNTU_Web_Asset_Kit/asset/03_why_dntu_campus.jpg)`,
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
              Cổng Thông Tin Học Đường DNTU
            </div>
            <h2 className="text-4xl lg:text-5xl font-serif font-semibold leading-[1.15] text-white tracking-tight">
              Tri thức kết nối,<br />
              <span className="italic text-[#E4C87F] font-normal">Lan tỏa niềm tin</span>
            </h2>
            <blockquote className="text-white/85 text-sm lg:text-base leading-relaxed border-l-2 border-[#B9882E] pl-4 font-normal">
              "Tìm lại những điều quan trọng, kết nối cộng đồng DNTU với sự trung thực, trách nhiệm và nhân ái."
            </blockquote>
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
            <span className="label-micro text-[#AD222B]">UniFind Portal</span>
            <h1 className="page-title text-3xl font-serif text-[#1C2530] mt-1">Đăng nhập</h1>
            <p className="text-[#5B6574] text-sm mt-1.5">Chào mừng bạn trở lại với UniFind DNTU</p>
          </div>

          {error && (
            <div className="bg-red-50/90 border border-red-200 text-red-700 text-sm p-3.5 rounded-xl flex items-center gap-2.5 animate-fadeIn">
              <ShieldAlert className="w-5 h-5 text-red-500 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {successMessage && (
            <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50/90 p-4 text-sm text-emerald-800 shadow-sm animate-fadeIn">
              <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />
              <span>{successMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 surface p-6 sm:p-7">
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
                className="absolute right-3 top-[38px] text-[#8C95A3] hover:text-[#1C2530] transition-colors"
                tabIndex={-1}
              >
                {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            <div className="flex items-center justify-between text-xs sm:text-sm pt-1">
              <label className="flex items-center gap-2 cursor-pointer text-[#5B6574]">
                <input 
                  type="checkbox" 
                  checked={rememberMe} 
                  onChange={e => setRememberMe(e.target.checked)}
                  className="rounded border-[#E0E2E6] text-[#AD222B] focus:ring-[#AD222B]" 
                />
                <span>Ghi nhớ đăng nhập</span>
              </label>
              <a href="#" onClick={(e) => { e.preventDefault(); toast.info('Vui lòng liên hệ Phòng Công tác Sinh viên hoặc Cán bộ quản trị để lấy lại mật khẩu.'); }} className="text-[#AD222B] hover:text-[#8A1A22] font-medium">
                Quên mật khẩu?
              </a>
            </div>

            <Button type="submit" loading={loading} className="btn-primary w-full py-3">
              Đăng nhập DNTU
            </Button>

            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-[#E0E2E6]"></div>
              </div>
              <div className="relative flex justify-center text-[11px] uppercase font-mono tracking-wider">
                <span className="bg-[#FAF8F2] px-3 text-[#8C95A3]">Hoặc</span>
              </div>
            </div>

            {isGoogleConfigured ? (
              <div ref={googleBtnRef} className="w-full flex justify-center min-h-[44px]"></div>
            ) : (
              <div className="w-full text-center p-3 border border-amber-300/80 bg-amber-50/70 text-amber-900 rounded-xl text-xs leading-relaxed font-mono">
                <strong>Chưa cấu hình Google Client ID:</strong> Vui lòng điền <code>VITE_GOOGLE_CLIENT_ID</code> trong <code>.env</code>
              </div>
            )}
          </form>

          {/* Quick Login Chips (Demo accounts) */}
          <div className="surface p-4 space-y-2.5">
            <p className="label-micro text-[#8C95A3]">
              Tài khoản trải nghiệm nhanh (Demo)
            </p>
            <div className="grid grid-cols-3 gap-2">
              <button 
                type="button"
                onClick={() => handleQuickLogin('user@dntu.edu.vn', 'Sinh viên')}
                className="p-2.5 bg-red-50/60 border border-red-200/70 hover:bg-red-100/70 rounded-xl text-xs font-medium text-[#AD222B] flex flex-col items-center justify-center gap-1 transition-all hover:-translate-y-0.5"
              >
                <User className="w-4 h-4 text-[#AD222B]" />
                <span className="font-semibold">Sinh viên</span>
              </button>

              <button 
                type="button"
                onClick={() => handleQuickLogin('staff@dntu.edu.vn', 'Nhân viên')}
                className="p-2.5 bg-amber-50/60 border border-amber-200/70 hover:bg-amber-100/70 rounded-xl text-xs font-medium text-amber-800 flex flex-col items-center justify-center gap-1 transition-all hover:-translate-y-0.5"
              >
                <ShieldCheck className="w-4 h-4 text-amber-700" />
                <span className="font-semibold">Cán bộ</span>
              </button>

              <button 
                type="button"
                onClick={() => handleQuickLogin('admin@dntu.edu.vn', 'Admin')}
                className="p-2.5 bg-purple-50/60 border border-purple-200/70 hover:bg-purple-100/70 rounded-xl text-xs font-medium text-purple-800 flex flex-col items-center justify-center gap-1 transition-all hover:-translate-y-0.5"
              >
                <ShieldAlert className="w-4 h-4 text-purple-700" />
                <span className="font-semibold">Quản trị</span>
              </button>
            </div>
          </div>

          <p className="text-center text-sm text-[#5B6574]">
            Chưa có tài khoản?{' '}
            <Link to="/register" className="text-[#AD222B] hover:text-[#8A1A22] font-semibold underline underline-offset-4">
              Đăng ký ngay
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
