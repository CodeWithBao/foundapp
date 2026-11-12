import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import authService from '../services/authService';
import { ROLES } from '../constants';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const revision = useRef(0);

  useEffect(() => {
    let active = true;
    const version = revision.current;
    authService.restoreSession().then(u => {
      if (active && version === revision.current) setUser(u);
    }).catch(() => {
      if (active && version === revision.current) { authService.logout(); setUser(null); }
    }).finally(() => {
      if (active && version === revision.current) setLoading(false);
    });

    const handleInvalidAuthentication = () => {
      revision.current++;
      authService.logout();
      setUser(null);
      setLoading(false);
    };
    window.addEventListener('unifind:authentication-invalid', handleInvalidAuthentication);
    return () => { active = false; window.removeEventListener('unifind:authentication-invalid', handleInvalidAuthentication); };
  }, []);

  const login = useCallback(async (email, password) => {
    const version = ++revision.current;
    const u = await authService.login(email, password);
    if (version !== revision.current) throw new Error('Authentication superseded');
    setUser(u);
    setLoading(false);
    return u;
  }, []);

  const googleLogin = useCallback(async (idToken) => {
    const version = ++revision.current;
    const u = await authService.googleLogin(idToken);
    if (version !== revision.current) throw new Error('Authentication superseded');
    setUser(u);
    setLoading(false);
    return u;
  }, []);

  const register = useCallback(async (data) => {
    const version = ++revision.current;
    const u = await authService.register(data);
    if (version !== revision.current) throw new Error('Authentication superseded');
    setUser(u);
    setLoading(false);
    return u;
  }, []);

  const logout = useCallback(() => {
    revision.current++;
    authService.logout();
    setUser(null);
    setLoading(false);
  }, []);

  const updateProfile = useCallback(async (data) => {
    if (!user) return;
    const version = revision.current;
    const updated = await authService.updateProfile(user.id, data);
    if (version === revision.current) setUser(updated);
    return updated;
  }, [user]);

  const isAdmin = user?.role === ROLES.ADMIN;
  const isStaff = user?.role === ROLES.STAFF;
  const isUser = user?.role === ROLES.USER;

  return (
    <AuthContext.Provider value={{ user, loading, login, googleLogin, register, logout, updateProfile, isAdmin, isStaff, isUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
