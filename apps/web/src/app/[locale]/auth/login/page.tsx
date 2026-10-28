'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTranslations, useLocale } from 'next-intl';
import { useAuth } from '../../../../context/AuthContext';
import { Plane, Lock, Mail, AlertCircle, ShieldCheck, KeyRound, RotateCcw, FastForward, Sparkles, ArrowRight } from 'lucide-react';
import { AirplaneTowAnimation } from '../../../../components/auth/AirplaneTowAnimation';

export default function LoginPage() {
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get('redirect');
  const { user, login, verifyMfa } = useAuth();

  // If already logged in, redirect to intended page or role portal
  useEffect(() => {
    if (user) {
      if (redirectUrl) {
        router.push(redirectUrl);
      } else if (user.role === 'ADMIN') {
        router.push(`/${locale}/admin/users`);
      } else if (user.role === 'STAFF_MANAGER') {
        router.push(`/${locale}/manager/dashboard`);
      } else if (user.role === 'STAFF') {
        router.push(`/${locale}/staff/flights`);
      } else {
        router.push(`/${locale}`);
      }
    }
  }, [user, router, locale, redirectUrl]);

  const [email, setEmail] = useState('customer@vietsky.vn');
  const [password, setPassword] = useState('Customer@123456');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Animation states
  const [animKey, setAnimKey] = useState(0);
  const [isLanded, setIsLanded] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLanded(true);
    }, 2200);
    return () => clearTimeout(timer);
  }, [animKey]);

  const handleSkipAnimation = () => {
    setIsLanded(true);
  };

  const handleReplayAnimation = () => {
    setIsLanded(false);
    setAnimKey((prev) => prev + 1);
  };

  // MFA OTP Modal state for Staff/Manager/Admin
  const [mfaModalOpen, setMfaModalOpen] = useState(false);
  const [mfaSessionToken, setMfaSessionToken] = useState('');
  const [otpCode, setOtpCode] = useState('123456');
  const [mfaError, setMfaError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await login(email, password);
      if (res.requiresMfa) {
        setMfaSessionToken(res.mfaSessionToken);
        setMfaModalOpen(true);
        setLoading(false);
        return;
      }

      if (redirectUrl) {
        router.push(redirectUrl);
      } else {
        router.push(`/${locale}`);
      }
    } catch (err: any) {
      setError(err.message || 'Đăng nhập không thành công');
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setMfaError(null);

    try {
      await verifyMfa(mfaSessionToken, otpCode);
      setMfaModalOpen(false);
      if (redirectUrl) {
        router.push(redirectUrl);
      } else {
        router.push(`/${locale}`);
      }
    } catch (err: any) {
      setMfaError(err.message || 'Mã OTP không chính xác. Vui lòng nhập: 123456');
    }
  };

  const fillCredential = (em: string, pass: string) => {
    setEmail(em);
    setPassword(pass);
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-16 overflow-hidden relative">
      {/* Convoy Container */}
      <div
        key={animKey}
        className={`relative w-full max-w-md ${
          !isLanded ? 'animate-plane-convoy' : ''
        }`}
      >
        <AirplaneTowAnimation isLanded={isLanded} />

        <div
          className={`relative bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-100 dark:border-slate-800 shadow-premium space-y-6 transition-all ${
            !isLanded ? 'animate-card-deliver' : 'scale-100'
          }`}
        >
          {/* Top Control Bar */}
          <div className="absolute top-4 right-4 flex items-center gap-2 z-20">
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
          </div>

          <div className="text-center space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary-900 to-primary-700 text-gold-400 flex items-center justify-center mx-auto shadow-md">
              <Plane className="w-6 h-6 transform -rotate-45" />
            </div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white">
              {t('nav.login')}
            </h1>
            <p className="text-xs text-slate-500">
              {redirectUrl
                ? 'Quý khách vui lòng đăng nhập tài khoản để tiếp tục đặt vé máy bay'
                : 'Truy cập tài khoản Hội viên Lotus Club hoặc Cổng vận hành nội bộ'}
            </p>
          </div>

          {redirectUrl && (
            <div className="p-3 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 rounded-xl flex items-center gap-2 text-xs text-blue-800 dark:text-blue-300">
              <Sparkles className="w-4 h-4 text-gold-500 flex-shrink-0" />
              <span>Chuyến bay đã chọn đang được giữ. Vui lòng đăng nhập để hoàn tất đặt chỗ.</span>
            </div>
          )}

          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-xl flex items-center gap-2 text-xs text-red-700 dark:text-red-300">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

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
                  placeholder="customer@hatgaosky.vn"
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-9 pr-3 py-2.5 text-xs font-semibold focus:outline-none"
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
                  className="text-[11px] text-primary-600 font-semibold hover:underline"
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
                    if (target.validity.valueMissing) {
                      target.setCustomValidity('Vui lòng nhập mật khẩu');
                    } else {
                      target.setCustomValidity('');
                    }
                  }}
                  onInput={(e) => (e.target as HTMLInputElement).setCustomValidity('')}
                  placeholder="••••••••"
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-9 pr-3 py-2.5 text-xs font-semibold focus:outline-none"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-primary-900 hover:bg-primary-800 text-white font-bold text-xs rounded-xl shadow-md transition"
            >
              {loading ? 'Đang xác thực...' : 'Đăng nhập'}
            </button>
          </form>

          {/* Quick Demo Credentials */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-2">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Điền nhanh tài khoản Demo:
            </span>
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <button
                type="button"
                onClick={() => fillCredential('customer@vietsky.vn', 'Customer@123456')}
                className="p-1.5 bg-slate-50 dark:bg-slate-800 border rounded-lg text-left hover:border-primary-500 font-medium"
              >
                Customer (Hội viên)
              </button>
              <button
                type="button"
                onClick={() => fillCredential('staff@vietsky.vn', 'Staff@123456')}
                className="p-1.5 bg-slate-50 dark:bg-slate-800 border rounded-lg text-left hover:border-primary-500 font-medium"
              >
                Staff (Nhân viên)
              </button>
              <button
                type="button"
                onClick={() => fillCredential('manager@vietsky.vn', 'Manager@123456')}
                className="p-1.5 bg-slate-50 dark:bg-slate-800 border rounded-lg text-left hover:border-primary-500 font-medium"
              >
                Manager (Trưởng phòng)
              </button>
              <button
                type="button"
                onClick={() => fillCredential('admin@vietsky.vn', 'Admin@123456')}
                className="p-1.5 bg-slate-50 dark:bg-slate-800 border rounded-lg text-left hover:border-primary-500 font-medium"
              >
                Admin (Quản trị)
              </button>
            </div>
          </div>

          <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 text-center space-y-1.5">
            <p className="text-xs text-slate-600 dark:text-slate-300 font-medium">
              Chưa có tài khoản Hội viên Hạt Gạo Sky?
            </p>
            <Link
              href={`/${locale}/auth/register${redirectUrl ? `?redirect=${encodeURIComponent(redirectUrl)}` : ''}`}
              className="inline-flex items-center gap-1.5 text-xs font-black text-primary-700 dark:text-gold-400 hover:underline"
            >
              <span>Đăng ký hội viên ngay</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>

      {/* MFA Modal Dialog */}
      {mfaModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-sm w-full border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <div className="text-center space-y-1">
              <div className="w-12 h-12 bg-purple-100 text-purple-700 rounded-2xl flex items-center justify-center mx-auto mb-2">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Xác thực 2 bước (MFA)
              </h3>
              <p className="text-xs text-slate-500">
                Tài khoản quản trị/nhân viên yêu cầu mã xác thực OTP. Mã mặc định là: <strong className="text-purple-700">123456</strong>
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
                className="w-full text-center text-2xl tracking-widest font-mono font-bold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-2.5 focus:outline-none"
                placeholder="123456"
                required
              />

              <button
                type="submit"
                className="w-full py-2.5 bg-primary-900 text-white font-bold text-xs rounded-xl shadow-md hover:bg-primary-800"
              >
                Xác nhận OTP & Đăng nhập
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
