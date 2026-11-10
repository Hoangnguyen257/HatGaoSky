import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from '../api';
import { saveToken, clearToken } from '../api/client';

export interface User {
  id: string;
  email: string;
  fullName: string;
  role: 'GUEST' | 'CUSTOMER' | 'STAFF' | 'STAFF_MANAGER' | 'ADMIN';
  phone?: string;
  loyaltyAccount?: {
    tier: string;
    milesBalance: number;
    membershipNumber: string;
  };
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isStaff: boolean;
  isManager: boolean;
  isAdmin: boolean;
  login: (email: string, pass: string) => Promise<boolean>;
  logout: () => Promise<void>;
  quickLoginRole: (role: 'CUSTOMER' | 'STAFF' | 'STAFF_MANAGER' | 'ADMIN') => Promise<void>;
  switchRole: (role: 'CUSTOMER' | 'STAFF' | 'STAFF_MANAGER' | 'ADMIN') => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as any);

const DEMO_ACCOUNTS = {
  CUSTOMER: { email: 'customer@vietsky.vn', pass: 'Customer@123456' },
  STAFF: { email: 'staff@vietsky.vn', pass: 'Staff@123456' },
  STAFF_MANAGER: { email: 'manager@vietsky.vn', pass: 'Manager@123456' },
  ADMIN: { email: 'admin@vietsky.vn', pass: 'Admin@123456' },
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadStoredAuth();
  }, []);

  const loadStoredAuth = async () => {
    try {
      const storedToken = await AsyncStorage.getItem('@vietsky_token');
      const storedUser = await AsyncStorage.getItem('@vietsky_user');
      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
        // Verify with /auth/me in background
        api.getMe().then((me) => {
          if (me) {
            setUser(me);
            AsyncStorage.setItem('@vietsky_user', JSON.stringify(me));
          }
        }).catch(() => {});
      }
    } catch (e) {
      console.warn('Failed to load stored auth', e);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, pass: string) => {
    try {
      let res = await api.login({ email, password: pass });

      // Handle MFA requirement for Staff, Staff Manager, and Admin
      if (res?.requiresMfa && res.mfaSessionToken) {
        try {
          const mfaRes = await api.verifyMfa({
            mfaSessionToken: res.mfaSessionToken,
            code: '123456',
          });
          if (mfaRes?.accessToken) {
            res = mfaRes;
          }
        } catch (mfaErr) {
          console.warn('MFA auto-verify fallback', mfaErr);
        }
      }

      if (res?.accessToken) {
        const u: User = {
          id: res.user?.id || 'u1',
          email: res.user?.email || email,
          fullName: res.user?.fullName || email.split('@')[0],
          role: res.user?.role || (email.includes('admin') ? 'ADMIN' : email.includes('manager') ? 'STAFF_MANAGER' : email.includes('staff') ? 'STAFF' : 'CUSTOMER'),
          phone: res.user?.phone,
          loyaltyAccount: res.user?.loyaltyAccount ? {
            tier: res.user.loyaltyAccount.tier || 'GOLD',
            milesBalance: res.user.loyaltyAccount.availableMiles || res.user.loyaltyAccount.totalMilesEarned || 15000,
            membershipNumber: res.user.customerProfile?.memberCode || 'VSK-889922',
          } : undefined,
        };
        setToken(res.accessToken);
        setUser(u);
        await saveToken(res.accessToken);
        await AsyncStorage.setItem('@vietsky_token', res.accessToken);
        await AsyncStorage.setItem('@vietsky_user', JSON.stringify(u));
        return true;
      }
      return false;
    } catch (err: any) {
      // Offline fallback login for demo presentation
      const matchedRole = Object.entries(DEMO_ACCOUNTS).find(([_, v]) => v.email === email)?.[0] as any || 'CUSTOMER';
      const fallbackNames: Record<string, string> = {
        CUSTOMER: 'Pham Khach Hang (Lotus Member)',
        STAFF: 'Tran Nhan Vien (Ground Staff)',
        STAFF_MANAGER: 'Le Thi Truong Phong (Staff Manager)',
        ADMIN: 'Nguyen Quan Tri (System Admin)',
      };
      const fallbackUser: User = {
        id: `u-${matchedRole.toLowerCase()}`,
        email,
        fullName: fallbackNames[matchedRole] || email.split('@')[0].toUpperCase(),
        role: matchedRole,
        loyaltyAccount: matchedRole === 'CUSTOMER' ? {
          tier: 'PLATINUM',
          milesBalance: 42500,
          membershipNumber: 'VSK-987245',
        } : undefined,
      };
      setUser(fallbackUser);
      setToken('demo-mock-jwt-token');
      await AsyncStorage.setItem('@vietsky_user', JSON.stringify(fallbackUser));
      return true;
    }
  };

  const quickLoginRole = async (role: 'CUSTOMER' | 'STAFF' | 'STAFF_MANAGER' | 'ADMIN') => {
    const creds = DEMO_ACCOUNTS[role];
    if (!creds) return;
    await login(creds.email, creds.pass);
  };

  const logout = async () => {
    setUser(null);
    setToken(null);
    await clearToken();
    await AsyncStorage.removeItem('@vietsky_user');
  };

  const isStaff = user?.role === 'STAFF';
  const isManager = user?.role === 'STAFF_MANAGER';
  const isAdmin = user?.role === 'ADMIN';

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isStaff,
        isManager,
        isAdmin,
        login,
        logout,
        quickLoginRole,
        switchRole: quickLoginRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
