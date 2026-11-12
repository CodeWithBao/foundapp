import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { portalPath } from './portalPaths';

export function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <div className="flex items-center justify-center min-h-screen" role="status" aria-live="polite"><div className="animate-spin motion-reduce:animate-none w-8 h-8 border-4 border-burgundy-700 border-t-transparent rounded-full" aria-hidden="true" /><span className="sr-only">Đang xác minh phiên đăng nhập</span></div>;
  if (!user) return <Navigate to="/login" replace state={{ from: location }} />;
  return children;
}

export function RoleRoute({ children, roles = [] }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <div className="flex items-center justify-center min-h-screen" role="status" aria-live="polite"><div className="animate-spin motion-reduce:animate-none w-8 h-8 border-4 border-burgundy-700 border-t-transparent rounded-full" aria-hidden="true" /><span className="sr-only">Đang xác minh quyền truy cập</span></div>;
  if (!user) return <Navigate to="/login" replace state={{ from: location }} />;
  const currentPath = `${location.pathname}${location.search}${location.hash}`;
  const target = portalPath(user.role, currentPath);
  if (target !== currentPath) return <Navigate to={target} replace state={location.state} />;
  if (roles.length > 0 && !roles.includes(user.role)) {
    return <Navigate to="/403" replace />;
  }
  return children;
}
