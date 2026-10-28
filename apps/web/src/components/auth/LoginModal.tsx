'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useTranslations, useLocale } from 'next-intl';
import { useAuth } from '../../context/AuthContext';
import {
  Plane,
  Lock,
  Mail,
  AlertCircle,
  ShieldCheck,
  X,
  FastForward,
  RotateCcw,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';
import { AirplaneTowAnimation } from './AirplaneTowAnimation';

export const LoginModal: React.FC = () => {
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { isLoginModalOpen, closeLoginModal, openRegisterModal, login, verifyMfa } = useAuth();

  const [email, setEmail] = useState('customer@vietsky.vn');
  const [password, setPassword] = useState('Customer@123456');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // MFA OTP Modal state for Staff/Manager/Admin
  const [mfaRequired, setMfaRequired] = useState(false);
  const [mfaSessionToken, setMfaSessionToken] = useState('');
  const [otpCode, setOtpCode] = useState('123456');
  const [mfaError, setMfaError] = useState<string | null>(null);

  // Animation states
  const [animKey, setAnimKey] = useState(0);
  const [isLanded, setIsLanded] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Trigger animation cycle when modal opens
  useEffect(() => {
    if (isLoginModalOpen) {
      document.body.style.overflow = 'hidden';
      setIsLanded(false);
      setError(null);
      setMfaRequired(false);
      setMfaError(null);
      setAnimKey((prev) => prev + 1);

      // Animation runs for 2.2s before settling into static interactive state
      const timer = setTimeout(() => {
        setIsLanded(true);
      }, 2200);

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          closeLoginModal();
        }
      };
      window.addEventListener('keydown', handleKeyDown);

      return () => {
        document.body.style.overflow = '';
        clearTimeout(timer);
        window.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [isLoginModalOpen, closeLoginModal]);

  const handleSkipAnimation = () => {
    setIsLanded(true);
  };

  const handleReplayAnimation = () => {
    setIsLanded(false);
    setAnimKey((prev) => prev + 1);
    setTimeout(() => {
      setIsLanded(true);
    }, 2200);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await login(email, password);
      if (res?.requiresMfa) {
        setMfaSessionToken(res.mfaSessionToken);
        setMfaRequired(true);
        setLoading(false);
        return;
      }
      closeLoginModal();

      const redirectTarget = searchParams.get('redirect');
      if (redirectTarget) {
        router.push(redirectTarget);
        return;
      }

      // If user logged in while on an auth page, redirect appropriately
      if (pathname.includes('/auth/')) {
        const targetRole = res?.user?.role;
        if (targetRole === 'ADMIN') {
          router.push(`/${locale}/admin/users`);
        } else if (targetRole === 'STAFF_MANAGER') {
          router.push(`/${locale}/manager/dashboard`);
        } else if (targetRole === 'STAFF') {
          router.push(`/${locale}/staff/flights`);
        } else {
          router.push(`/${locale}`);
        }
      }
    } catch (err: any) {
      setError(err.message || 'Đăng nhập không thành công');
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setMfaError(null);
    setLoading(true);

    try {
      const res = await verifyMfa(mfaSessionToken, otpCode);
      setMfaRequired(false);
      closeLoginModal();

      const redirectTarget = searchParams.get('redirect');
      if (redirectTarget) {
        router.push(redirectTarget);
        return;
      }

      // If user logged in while on an auth page, redirect appropriately
      if (pathname.includes('/auth/')) {
        const targetRole = res?.user?.role;
        if (targetRole === 'ADMIN') {
          router.push(`/${locale}/admin/users`);
        } else if (targetRole === 'STAFF_MANAGER') {
          router.push(`/${locale}/manager/dashboard`);
        } else if (targetRole === 'STAFF') {
          router.push(`/${locale}/staff/flights`);
        } else {
          router.push(`/${locale}`);
        }
      }
    } catch (err: any) {
      setMfaError(err.message || 'Mã OTP không chính xác. Mặc định là: 123456');
      setLoading(false);
    }
  };

  const fillCredential = (em: string, pass: string) => {
    setEmail(em);
    setPassword(pass);
    if (!isLanded) setIsLanded(true);
  };

  if (!isLoginModalOpen || !mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 overflow-y-auto overflow-x-hidden select-none">
      {/* Dimmed Backdrop - covers entire viewport */}
      <div
        className="fixed inset-0 bg-slate-950/80 backdrop-blur-md transition-opacity duration-300 z-0"
        onClick={closeLoginModal}
      />

      {/* Animation Stage / Convoy Container */}
      <div
        key={animKey}
        className={`relative z-10 w-full max-w-md my-auto ${
          !isLanded ? 'animate-plane-convoy' : ''
        }`}
      >
        {/* Airplane & Towing Cables Animation */}
        <AirplaneTowAnimation isLanded={isLanded} />

        {/* ========================================================
            3. THE LOGIN FORM CARD
            ======================================================== */}
        <div
          className={`relative bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200/90 dark:border-slate-800 shadow-2xl transition-all max-h-[92vh] overflow-y-auto ${
            !isLanded ? 'animate-card-deliver' : 'scale-100'
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Top Control Bar (Close & Replay / Skip) */}
          <div className="absolute top-4 right-4 flex items-center gap-2 z-30">
            {isLanded ? (
              <button
                type="button"
                onClick={handleReplayAnimation}
                title="Xem lại hiệu ứng máy bay kéo"
                className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-gold-500 transition"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSkipAnimation}
                className="flex items-center gap-1 text-[11px] font-semibold text-gold-600 dark:text-gold-400 bg-gold-50 dark:bg-gold-950/40 px-2.5 py-1 rounded-full border border-gold-300 dark:border-gold-700/50 hover:bg-gold-100 transition shadow-sm"
              >
                <FastForward className="w-3.5 h-3.5" />
                <span>Bỏ qua</span>
              </button>
            )}

            <button
              type="button"
              onClick={closeLoginModal}
              className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition"
              aria-label="Đóng"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Header Branding */}
          <div className="text-center space-y-2 mb-6">
            <div className="relative inline-block">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary-900 via-primary-800 to-primary-700 text-gold-400 flex items-center justify-center mx-auto shadow-lg shadow-primary-900/20 border border-gold-400/30">
                <Plane className="w-7 h-7 transform -rotate-45" />
              </div>
              <div className="absolute -top-1 -right-1 bg-gold-400 text-primary-950 p-1 rounded-full shadow">
                <Sparkles className="w-2.5 h-2.5" />
              </div>
            </div>

            <div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                {t('nav.login')} Hạt Gạo Sky
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Chào mừng Quý khách đến với Cổng dịch vụ hàng không
              </p>
            </div>
          </div>

          {/* Error Notice */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-xl flex items-center gap-2 text-xs text-red-700 dark:text-red-300 animate-in fade-in">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Standard Login Form */}
          {!mfaRequired ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Địa chỉ Email <span className="text-red-500 font-bold">*</span>
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onFocus={() => !isLanded && setIsLanded(true)}
                    onInvalid={(e) => {
                      const target = e.target as HTMLInputElement;
                      if (target.validity.valueMissing) {
                        target.setCustomValidity('Vui lòng nhập địa chỉ email');
                      } else if (target.validity.typeMismatch) {
                        target.setCustomValidity('Vui lòng nhập địa chỉ email hợp lệ (ví dụ: name@example.com)');
                      } else {
                        target.setCustomValidity('');
                      }
                    }}
                    onInput={(e) => (e.target as HTMLInputElement).setCustomValidity('')}
                    className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl pl-9 pr-3 py-2.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-primary-500 transition"
                    placeholder="name@hatgaosky.vn"
                    required
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Mật khẩu <span className="text-red-500 font-bold">*</span>
                  </label>
                  <Link
                    href={`/${locale}/auth/forgot-password`}
                    onClick={closeLoginModal}
                    className="text-[11px] text-primary-600 dark:text-primary-400 font-semibold hover:underline"
                  >
                    Quên mật khẩu?
                  </Link>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onFocus={() => !isLanded && setIsLanded(true)}
                    onInvalid={(e) => {
                      const target = e.target as HTMLInputElement;
                      target.setCustomValidity(target.validity.valueMissing ? 'Vui lòng nhập mật khẩu' : '');
                    }}
                    onInput={(e) => (e.target as HTMLInputElement).setCustomValidity('')}
                    className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl pl-9 pr-3 py-2.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-primary-500 transition"
                    placeholder="••••••••"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-gradient-to-r from-primary-900 via-primary-800 to-primary-900 hover:from-primary-800 hover:to-primary-700 text-white font-bold text-xs rounded-xl shadow-lg shadow-primary-950/20 hover:shadow-xl transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70"
              >
                {loading ? (
                  <span>Đang cất cánh xác thực...</span>
                ) : (
                  <>
                    <Plane className="w-4 h-4 transform -rotate-45 text-gold-400" />
                    <span>Đăng nhập ngay</span>
                  </>
                )}
              </button>
            </form>
          ) : (
            /* MFA Verification Step inside Modal */
            <div className="space-y-4">
              <div className="text-center space-y-1 p-3 bg-purple-50 dark:bg-purple-950/30 rounded-2xl border border-purple-200 dark:border-purple-800">
                <div className="w-10 h-10 bg-purple-100 text-purple-700 rounded-xl flex items-center justify-center mx-auto mb-1">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Xác thực 2 bước (MFA)
                </h3>
                <p className="text-[11px] text-slate-500">
                  Tài khoản nội bộ yêu cầu OTP. Mã demo: <strong className="text-purple-600">123456</strong>
                </p>
              </div>

              {mfaError && (
                <p className="text-xs text-red-600 font-bold text-center">{mfaError}</p>
              )}

              <form onSubmit={handleVerifyOtp} className="space-y-4">
                <input
                  type="text"
                  maxLength={6}
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value)}
                  className="w-full text-center text-2xl tracking-widest font-mono font-bold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-2.5 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="123456"
                  required
                />

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 bg-purple-700 hover:bg-purple-600 text-white font-bold text-xs rounded-xl shadow-md transition"
                >
                  {loading ? 'Đang xác nhận...' : 'Xác nhận OTP & Vào hệ thống'}
                </button>
              </form>
            </div>
          )}

          {/* 1-Click Demo Accounts */}
          <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800 space-y-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Tài khoản mẫu (1-Click Demo):
            </span>
            <div className="grid grid-cols-2 gap-1.5 text-[11px]">
              <button
                type="button"
                onClick={() => fillCredential('customer@vietsky.vn', 'Customer@123456')}
                className="p-1.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg text-left hover:border-primary-500 hover:bg-primary-50/50 dark:hover:bg-slate-700 transition font-medium flex items-center justify-between"
              >
                <span>Hội viên</span>
                <span className="text-[9px] text-primary-600 font-bold">Lotus</span>
              </button>
              <button
                type="button"
                onClick={() => fillCredential('staff@vietsky.vn', 'Staff@123456')}
                className="p-1.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg text-left hover:border-primary-500 hover:bg-primary-50/50 dark:hover:bg-slate-700 transition font-medium flex items-center justify-between"
              >
                <span>Nhân viên</span>
                <span className="text-[9px] text-blue-600 font-bold">Staff</span>
              </button>
              <button
                type="button"
                onClick={() => fillCredential('manager@vietsky.vn', 'Manager@123456')}
                className="p-1.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg text-left hover:border-primary-500 hover:bg-primary-50/50 dark:hover:bg-slate-700 transition font-medium flex items-center justify-between"
              >
                <span>Trưởng phòng</span>
                <span className="text-[9px] text-purple-600 font-bold">Manager</span>
              </button>
              <button
                type="button"
                onClick={() => fillCredential('admin@vietsky.vn', 'Admin@123456')}
                className="p-1.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg text-left hover:border-primary-500 hover:bg-primary-50/50 dark:hover:bg-slate-700 transition font-medium flex items-center justify-between"
              >
                <span>Quản trị viên</span>
                <span className="text-[9px] text-emerald-600 font-bold">Admin</span>
              </button>
            </div>
          </div>

          {/* Footer Note & Registration link */}
          <div className="text-center text-xs text-slate-500 dark:text-slate-400 mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
            Chưa có tài khoản?{' '}
            <button
              type="button"
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                closeLoginModal();
                openRegisterModal({
                  x: rect.left + rect.width / 2,
                  y: rect.top + rect.height / 2,
                });
              }}
              className="font-bold text-primary-600 dark:text-gold-400 hover:underline cursor-pointer"
            >
              Đăng ký hội viên ngay
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};
