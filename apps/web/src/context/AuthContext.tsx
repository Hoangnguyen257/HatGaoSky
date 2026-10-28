'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { api, getStoredUser, setStoredUser, setAuthToken, removeAuthToken } from '../lib/api';

export type UserRole = 'GUEST' | 'CUSTOMER' | 'STAFF' | 'STAFF_MANAGER' | 'ADMIN';

export interface User {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  phone?: string;
  address?: string;
  customerProfile?: any;
  loyaltyAccount?: any;
}

interface AuthContextType {
  user: User | null;
  role: UserRole;
  token: string | null;
  login: (email: string, password: string) => Promise<any>;
  verifyMfa: (mfaSessionToken: string, code: string) => Promise<any>;
  logout: () => void;
  switchRoleDemo: (role: UserRole) => Promise<void>;
  refreshProfile: () => Promise<void>;
  isLoading: boolean;
  isLoginModalOpen: boolean;
  openLoginModal: () => void;
  closeLoginModal: () => void;
  isRegisterModalOpen: boolean;
  registerModalOrigin: { x: number; y: number } | null;
  openRegisterModal: (coords?: { x: number; y: number }) => void;
  closeRegisterModal: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState<boolean>(false);
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState<boolean>(false);
  const [registerModalOrigin, setRegisterModalOrigin] = useState<{ x: number; y: number } | null>(null);

  const openLoginModal = () => {
    setIsRegisterModalOpen(false);
    setIsLoginModalOpen(true);
  };
  const closeLoginModal = () => setIsLoginModalOpen(false);

  const openRegisterModal = (coords?: { x: number; y: number }) => {
    setIsLoginModalOpen(false);
    setRegisterModalOrigin(coords || null);
    setIsRegisterModalOpen(true);
  };
  const closeRegisterModal = () => setIsRegisterModalOpen(false);

  useEffect(() => {
    const storedUser = getStoredUser();
    if (storedUser) {
      setUser(storedUser);
      setToken(localStorage.getItem('vietsky_token'));
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    const res = await api.login({ email, password });
    if (res.requiresMfa) {
      return res; // Prompt MFA OTP dialog
    }
    setAuthToken(res.accessToken);
    setStoredUser(res.user);
    setUser(res.user);
    setToken(res.accessToken);
    setIsLoginModalOpen(false);
    return res;
  };

  const verifyMfa = async (mfaSessionToken: string, code: string) => {
    const res = await api.verifyMfa({ mfaSessionToken, code });
    setAuthToken(res.accessToken);
    setStoredUser(res.user);
    setUser(res.user);
    setToken(res.accessToken);
    setIsLoginModalOpen(false);
    return res;
  };

  const logout = () => {
    removeAuthToken();
    setUser(null);
    setToken(null);
  };

  const refreshProfile = async () => {
    try {
      const profile = await api.getMe();
      setUser(profile);
      setStoredUser(profile);
    } catch {
      // Ignored if expired
    }
  };

  const switchRoleDemo = async (targetRole: UserRole) => {
    if (targetRole === 'GUEST') {
      logout();
      return;
    }

    const demoCreds: Record<string, { email: string; pass: string }> = {
      CUSTOMER: { email: 'customer@vietsky.vn', pass: 'Customer@123456' },
      STAFF: { email: 'staff@vietsky.vn', pass: 'Staff@123456' },
      STAFF_MANAGER: { email: 'manager@vietsky.vn', pass: 'Manager@123456' },
      ADMIN: { email: 'admin@vietsky.vn', pass: 'Admin@123456' },
    };

    const target = demoCreds[targetRole];
    if (target) {
      try {
        const loginRes = await api.login({ email: target.email, password: target.pass });
        if (loginRes.requiresMfa) {
          // Auto-verify with demo MFA code '123456'
          const mfaRes = await api.verifyMfa({
            mfaSessionToken: loginRes.mfaSessionToken,
            code: '123456',
          });
          setAuthToken(mfaRes.accessToken);
          setStoredUser(mfaRes.user);
          setUser(mfaRes.user);
          setToken(mfaRes.accessToken);
        } else {
          setAuthToken(loginRes.accessToken);
          setStoredUser(loginRes.user);
          setUser(loginRes.user);
          setToken(loginRes.accessToken);
        }
      } catch (e) {
        console.error('Role switcher error:', e);
      }
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role: user ? user.role : 'GUEST',
        token,
        login,
        verifyMfa,
        logout,
        switchRoleDemo,
        refreshProfile,
        isLoading,
        isLoginModalOpen,
        openLoginModal,
        closeLoginModal,
        isRegisterModalOpen,
        registerModalOrigin,
        openRegisterModal,
        closeRegisterModal,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
};
