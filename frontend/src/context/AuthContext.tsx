import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { authApi, setAuthToken, clearAuthToken, AuthResponse } from '@/lib/api';
import { toast } from 'sonner';

interface User {
  id: number; email: string; full_name: string; role: string; company_id: number;
}
interface AuthState {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (payload: { email: string; password: string; full_name: string; company_name: string; country_code: string }) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthState | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('access_token');
    const storedUser = localStorage.getItem('auth_user');
    if (stored) setToken(stored);
    if (storedUser) setUser(JSON.parse(storedUser));
  }, []);

  const handleAuthSuccess = (resp: AuthResponse) => {
    setAuthToken(resp.access_token);
    setToken(resp.access_token);
    setUser(resp.user as any);
    localStorage.setItem('auth_user', JSON.stringify(resp.user));
  };

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      const resp = await authApi.login({ email, password });
      handleAuthSuccess(resp);
      toast.success('Logged in');
    } catch (e: any) {
      toast.error(e.message || 'Login failed');
      throw e;
    } finally {
      setLoading(false);
    }
  };

  const signup = async (payload: { email: string; password: string; full_name: string; company_name: string; country_code: string }) => {
    setLoading(true);
    try {
      const resp = await authApi.signup(payload);
      handleAuthSuccess(resp);
      toast.success('Account created');
    } catch (e: any) {
      toast.error(e.message || 'Signup failed');
      throw e;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    clearAuthToken();
    localStorage.removeItem('auth_user');
    setUser(null);
    setToken(null);
    toast.success('Logged out');
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
