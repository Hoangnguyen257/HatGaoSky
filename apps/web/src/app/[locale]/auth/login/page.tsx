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
  const registerParam = searchParams.get('register');
  const { user, login, verifyMfa, openRegisterModal } = useAuth();

  // If redirected with ?register=true, automatically launch 3D ticket register animation
  useEffect(() => {
    if (registerParam === 'true') {
      openRegisterModal();
    }
  }, [registerParam, openRegisterModal]);

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

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Pre-fill email if user just finished registering with 3D ticket modal
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const lastRegistered = localStorage.getItem('hatgaosky_registered_email');
      if (lastRegistered) {
        setEmail(lastRegistered);
        setPassword('');
      }
    }
  }, []);
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
      setMfaError(err.message || 'Mã OTP không chính xác');
    }
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
                ? t('auth.flightHeldNotice')
                : t('auth.signInDesc')}
            </p>
          </div>

          {redirectUrl && (
            <div className="p-3 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 rounded-xl flex items-center gap-2 text-xs text-blue-800 dark:text-blue-300">
              <Sparkles className="w-4 h-4 text-gold-500 flex-shrink-0" />
              <span>{t('auth.flightHeldNotice')}</span>
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
                {t('auth.emailLabel')} <span className="text-red-500 font-bold">*</span>
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
                  placeholder="name@example.com"
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-9 pr-3 py-2.5 text-xs font-semibold focus:outline-none"
                  required
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  {t('auth.passwordLabel')} <span className="text-red-500 font-bold">*</span>
                </label>
                <Link
                  href={`/${locale}/auth/forgot-password`}
                  className="text-[11px] text-primary-600 font-semibold hover:underline"
                >
                  {t('auth.forgotPassword')}
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
              className="w-full py-3 bg-primary-900 hover:bg-primary-800 text-white font-bold text-xs rounded-xl shadow-md transition cursor-pointer"
            >
              {loading ? t('auth.authenticating') : t('auth.signInBtn')}
            </button>
          </form>

          <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 text-center space-y-1.5">
            <p className="text-xs text-slate-600 dark:text-slate-300 font-medium">
              {t('auth.noAccountYet')}
            </p>
            <button
              type="button"
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                openRegisterModal({
                  x: rect.left + rect.width / 2,
                  y: rect.top + rect.height / 2,
                });
              }}
              className="inline-flex items-center gap-1.5 text-xs font-black text-primary-700 dark:text-gold-400 hover:underline cursor-pointer"
            >
              <span>{t('auth.registerMemberNow')}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
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
                {t('auth.mfaTitle')}
              </h3>
              <p className="text-xs text-slate-500">
                {t('auth.mfaDesc')}
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
                placeholder="••••••"
                required
              />

              <button
                type="submit"
                className="w-full py-2.5 bg-primary-900 text-white font-bold text-xs rounded-xl shadow-md hover:bg-primary-800 cursor-pointer"
              >
                {t('auth.confirmOtp')}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
