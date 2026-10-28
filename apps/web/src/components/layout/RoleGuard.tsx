'use client';

import React from 'react';
import Link from 'next/link';
import { useLocale } from 'next-intl';
import { useAuth, UserRole } from '../../context/AuthContext';
import { ShieldAlert, ArrowLeft, LogIn, UserPlus } from 'lucide-react';

interface RoleGuardProps {
  allowedRoles: UserRole[];
  children: React.ReactNode;
}

export const RoleGuard: React.FC<RoleGuardProps> = ({ allowedRoles, children }) => {
  const { user, role, isLoading, openLoginModal, openRegisterModal } = useAuth();
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
    const isGuest = !user || role === 'GUEST';

    const texts = {
      vi: {
        loginRequired: 'Yêu cầu đăng nhập',
        guestDesc: 'Vui lòng đăng nhập hoặc đăng ký hội viên Lotus Club để sử dụng tính năng này.',
        loginBtn: 'Đăng nhập',
        registerBtn: 'Đăng ký hội viên',
        accessDenied: 'Truy cập bị từ chối',
        deniedDesc: 'Tài khoản của bạn không có quyền truy cập vào trang này.',
        backHome: 'Quay lại Trang chủ'
      },
      en: {
        loginRequired: 'Sign In Required',
        guestDesc: 'Please sign in or join Lotus Club membership to access this page.',
        loginBtn: 'Sign In',
        registerBtn: 'Join Membership',
        accessDenied: 'Access Denied',
        deniedDesc: 'Your account does not have permission to view this page.',
        backHome: 'Back to Home'
      },
      zh: {
        loginRequired: '需要登录',
        guestDesc: '请先登录或加入 Lotus Club 会员以访问此页面。',
        loginBtn: '登录',
        registerBtn: '加入会员',
        accessDenied: '拒绝访问',
        deniedDesc: '您的账户没有权限访问此页面。',
        backHome: '返回首页'
      }
    };
    const tRole = texts[locale as 'vi' | 'en' | 'zh'] || texts.en;

    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4 py-16">
        <div className="max-w-md w-full bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 p-8 text-center">
          <div className="w-16 h-16 bg-primary-100 dark:bg-primary-950/50 text-primary-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <ShieldAlert className="w-8 h-8" />
          </div>

          {isGuest ? (
            <>
              <h1 className="text-2xl font-black text-slate-900 dark:text-white mb-2">
                {tRole.loginRequired}
              </h1>
              <p className="text-sm text-slate-600 dark:text-slate-300 mb-6 leading-relaxed">
                {tRole.guestDesc}
              </p>
              <div className="flex flex-col gap-3 mb-6">
                <button
                  type="button"
                  onClick={() => openLoginModal()}
                  className="w-full inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-primary-700 hover:bg-primary-800 text-white font-semibold text-sm transition shadow-md"
                >
                  <LogIn className="w-4 h-4" /> {tRole.loginBtn}
                </button>
                <button
                  type="button"
                  onClick={() => openRegisterModal()}
                  className="w-full inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gold-500 hover:bg-gold-600 text-primary-950 font-bold text-sm transition shadow-sm"
                >
                  <UserPlus className="w-4 h-4" /> {tRole.registerBtn}
                </button>
              </div>
            </>
          ) : (
            <>
              <h1 className="text-2xl font-black text-slate-900 dark:text-white mb-2">
                {tRole.accessDenied}
              </h1>
              <p className="text-sm text-slate-600 dark:text-slate-300 mb-6 leading-relaxed">
                {tRole.deniedDesc}
              </p>
            </>
          )}

          <Link
            href={`/${locale}`}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-white font-semibold text-sm transition"
          >
            <ArrowLeft className="w-4 h-4" /> {tRole.backHome}
          </Link>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
