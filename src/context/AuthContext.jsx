import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import authService from '../services/authService';
import { ROLES } from '../constants';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const u = authService.getCurrentUser();
    if (u) setUser(u);
    setLoading(false);
  }, []);

  const login = useCallback(async (email, password) => {
    const u = await authService.login(email, password);
    setUser(u);
    return u;
  }, []);

  const googleLogin = useCallback(async (idToken) => {
    const u = await authService.googleLogin(idToken);
    setUser(u);
    return u;
  }, []);

  const register = useCallback(async (data) => {
    const u = await authService.register(data);
    setUser(u);
    return u;
  }, []);

  const logout = useCallback(() => {
    authService.logout();
    setUser(null);
  }, []);

  const updateProfile = useCallback(async (data) => {
    if (!user) return;
    const updated = await authService.updateProfile(user.id, data);
    setUser(updated);
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
