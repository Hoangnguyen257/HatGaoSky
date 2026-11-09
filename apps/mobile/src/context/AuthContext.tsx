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
      const res = await api.login({ email, password: pass });
      if (res?.accessToken) {
        const u = res.user || {
          id: 'u1',
          email,
          fullName: res.user?.fullName || 'Hội viên Hạt Gạo Sky',
          role: res.user?.role || 'CUSTOMER',
        };
        setToken(res.accessToken);
        setUser(u);
        await saveToken(res.accessToken);
        await AsyncStorage.setItem('@vietsky_user', JSON.stringify(u));
        return true;
      }
      return false;
    } catch (err: any) {
      // Offline fallback login for demo presentation
      const matchedRole = Object.entries(DEMO_ACCOUNTS).find(([_, v]) => v.email === email)?.[0] as any || 'CUSTOMER';
      const fallbackUser: User = {
        id: 'u-demo',
        email,
        fullName: email.split('@')[0].toUpperCase() + ' (Demo)',
        role: matchedRole,
        loyaltyAccount: {
          tier: 'GOLD',
          milesBalance: 12500,
          membershipNumber: 'VSK-889922',
        },
      };
      setUser(fallbackUser);
      setToken('demo-mock-jwt-token');
      return true;
    }
  };

  const quickLoginRole = async (role: 'CUSTOMER' | 'STAFF' | 'STAFF_MANAGER' | 'ADMIN') => {
    const creds = DEMO_ACCOUNTS[role];
    if (!creds) return;
    // Show loading state by clearing user first so UI shows transition
    const success = await login(creds.email, creds.pass);
    if (!success) {
      // Fallback: set local user so UI still updates
      const fallback: User = {
        id: `u-${role.toLowerCase()}`,
        email: creds.email,
        fullName: role === 'CUSTOMER' ? 'Khách Hàng Demo'
                : role === 'STAFF' ? 'Nhân Viên Demo'
                : role === 'STAFF_MANAGER' ? 'Quản Lý Demo'
                : 'Quản Trị Demo',
        role,
        loyaltyAccount: role === 'CUSTOMER' ? {
          tier: 'GOLD',
          milesBalance: 15000,
          membershipNumber: 'VSK-DEMO01',
        } : undefined,
      };
      setUser(fallback);
      await saveToken('demo-jwt-' + role.toLowerCase());
      await AsyncStorage.setItem('@vietsky_user', JSON.stringify(fallback));
    }
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
