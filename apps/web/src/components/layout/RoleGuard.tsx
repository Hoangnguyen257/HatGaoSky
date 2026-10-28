'use client';

import React from 'react';
import Link from 'next/link';
import { useLocale } from 'next-intl';
import { useAuth, UserRole } from '../../context/AuthContext';
import { ShieldAlert, ArrowLeft, KeyRound } from 'lucide-react';

interface RoleGuardProps {
  allowedRoles: UserRole[];
  children: React.ReactNode;
}

export const RoleGuard: React.FC<RoleGuardProps> = ({ allowedRoles, children }) => {
  const { role, switchRoleDemo, isLoading } = useAuth();
  const locale = useLocale();

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const isAllowed = allowedRoles.includes(role);

  if (!isAllowed) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4 py-16">
        <div className="max-w-md w-full bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-red-200 dark:border-red-900/50 p-8 text-center">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-950/50 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white mb-2">403 Forbidden</h1>
          <h2 className="text-base font-bold text-red-600 mb-3">Truy cập bị từ chối / Access Denied</h2>
          <p className="text-sm text-slate-600 dark:text-slate-300 mb-6 leading-relaxed">
            Vai trò hiện tại của bạn là <strong className="text-primary-700 dark:text-primary-400 font-bold">{role}</strong>. Trang này chỉ dành cho vai trò: <strong className="font-semibold text-slate-800 dark:text-slate-100">{allowedRoles.join(', ')}</strong>.
          </p>

          <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700 mb-6 text-left text-xs space-y-2">
            <p className="font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
              <KeyRound className="w-3.5 h-3.5 text-gold-500" /> Chuyển nhanh vai trò để kiểm thử:
            </p>
            <div className="flex flex-wrap gap-2 pt-1">
              {allowedRoles.map((r) => (
                <button
                  key={r}
                  onClick={() => switchRoleDemo(r)}
                  className="px-2.5 py-1 bg-primary-900 hover:bg-primary-800 text-white rounded font-medium text-xs transition"
                >
                  Đăng nhập vai trò {r}
                </button>
              ))}
            </div>
          </div>

          <Link
            href={`/${locale}`}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-white font-semibold text-sm transition"
          >
            <ArrowLeft className="w-4 h-4" /> Quay lại Trang chủ
          </Link>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
