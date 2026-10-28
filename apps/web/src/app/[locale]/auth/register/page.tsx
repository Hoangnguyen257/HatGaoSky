'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTranslations, useLocale } from 'next-intl';
import { useAuth } from '../../../../context/AuthContext';
import { api } from '../../../../lib/api';
import { Plane, Lock, Mail, User, Phone, CheckCircle2, AlertCircle, ArrowRight } from 'lucide-react';

export default function RegisterPage() {
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get('redirect');
  const { user } = useAuth();

  // If already logged in, redirect away from register page
  useEffect(() => {
    if (user) {
      if (redirectUrl) {
        router.push(redirectUrl);
      } else {
        router.push(`/${locale}`);
      }
    }
  }, [user, router, locale, redirectUrl]);

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreedTerms, setAgreedTerms] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successResult, setSuccessResult] = useState<any | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!fullName.trim()) {
      setError('Vui lòng nhập họ và tên');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setError('Vui lòng nhập địa chỉ email hợp lệ');
      return;
    }
    if (!phone.trim()) {
      setError('Vui lòng nhập số điện thoại');
      return;
    }
    if (phone.trim().length < 9) {
      setError('Số điện thoại không hợp lệ (tối thiểu 9 số)');
      return;
    }
    if (!password) {
      setError('Vui lòng nhập mật khẩu');
      return;
    }
    if (password.length < 6) {
      setError('Mật khẩu phải có tối thiểu 6 ký tự');
      return;
    }
    if (!confirmPassword) {
      setError('Vui lòng xác nhận mật khẩu');
      return;
    }
    if (password !== confirmPassword) {
      setError('Mật khẩu xác nhận không khớp');
      return;
    }
    if (!agreedTerms) {
      setError('Vui lòng xác nhận đồng ý với Điều khoản dịch vụ và Chính sách hội viên');
      return;
    }

    setLoading(true);
    try {
      const res = await api.register({
        fullName,
        email,
        phone,
        password,
      });
      setSuccessResult(res);
      setLoading(false);
    } catch (err: any) {
      setError(err.message || 'Đăng ký không thành công');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-100 dark:border-slate-800 shadow-premium space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary-900 to-primary-700 text-gold-400 flex items-center justify-center mx-auto shadow-md">
            <Plane className="w-6 h-6 transform -rotate-45" />
          </div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">
            Bắt đầu hành trình của bạn
          </h1>
          <p className="text-xs text-slate-500">
            Đăng ký hội viên để khám phá những hành trình mới cùng Hạt Gạo Sky
          </p>
        </div>

        {error && (
          <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-xl flex items-center gap-2 text-xs text-red-700 dark:text-red-300">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {successResult ? (
          <div className="p-6 bg-emerald-50 dark:bg-emerald-950/40 rounded-2xl border border-emerald-200 dark:border-emerald-800 text-center space-y-3">
            <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
            <h3 className="font-bold text-sm text-emerald-900 dark:text-emerald-200">
              Đăng ký tài khoản thành công!
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-300">
              Mã hội viên của bạn: <strong>{successResult.memberCode}</strong>.
            </p>
            <p className="text-xs text-slate-500">
              Hệ thống đã gửi email xác thực kích hoạt tài khoản. Bạn có thể nhấn vào liên kết bên dưới để kích hoạt ngay:
            </p>
            <div className="pt-2">
              <Link
                href={`/${locale}/auth/verify-email?token=${successResult.verificationToken}`}
                className="inline-block px-4 py-2 bg-primary-900 hover:bg-primary-800 text-white rounded-xl text-xs font-bold transition"
              >
                Kích hoạt tài khoản ngay
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Họ và tên đầy đủ <span className="text-red-500 font-bold">*</span>
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  onInvalid={(e) => {
                    const target = e.target as HTMLInputElement;
                    target.setCustomValidity(target.validity.valueMissing ? 'Vui lòng nhập họ và tên' : '');
                  }}
                  onInput={(e) => (e.target as HTMLInputElement).setCustomValidity('')}
                  placeholder="Nguyễn Văn An"
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-9 pr-3 py-2.5 text-xs font-semibold focus:outline-none"
                  required
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Email nhận vé & thông báo <span className="text-red-500 font-bold">*</span>
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
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
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Số điện thoại liên hệ <span className="text-red-500 font-bold">*</span>
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  onInvalid={(e) => {
                    const target = e.target as HTMLInputElement;
                    target.setCustomValidity(target.validity.valueMissing ? 'Vui lòng nhập số điện thoại' : '');
                  }}
                  onInput={(e) => (e.target as HTMLInputElement).setCustomValidity('')}
                  placeholder="0912345678"
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-9 pr-3 py-2.5 text-xs font-semibold focus:outline-none"
                  required
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Mật khẩu (≥ 6 ký tự) <span className="text-red-500 font-bold">*</span>
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onInvalid={(e) => {
                    const target = e.target as HTMLInputElement;
                    if (target.validity.valueMissing) {
                      target.setCustomValidity('Vui lòng nhập mật khẩu');
                    } else if (target.validity.tooShort) {
                      target.setCustomValidity('Mật khẩu phải có tối thiểu 6 ký tự');
                    } else {
                      target.setCustomValidity('');
                    }
                  }}
                  onInput={(e) => (e.target as HTMLInputElement).setCustomValidity('')}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-9 pr-3 py-2.5 text-xs font-semibold focus:outline-none"
                  required
                  minLength={6}
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Xác nhận mật khẩu <span className="text-red-500 font-bold">*</span>
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  onInvalid={(e) => {
                    const target = e.target as HTMLInputElement;
                    target.setCustomValidity(target.validity.valueMissing ? 'Vui lòng xác nhận mật khẩu' : '');
                  }}
                  onInput={(e) => (e.target as HTMLInputElement).setCustomValidity('')}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-9 pr-3 py-2.5 text-xs font-semibold focus:outline-none"
                  required
                />
              </div>
            </div>

            <div className="pt-1">
              <label className="flex items-start gap-2.5 cursor-pointer text-xs text-slate-600 dark:text-slate-300">
                <input
                  type="checkbox"
                  checked={agreedTerms}
                  onInvalid={(e) => {
                    const target = e.target as HTMLInputElement;
                    target.setCustomValidity(target.validity.valueMissing ? 'Vui lòng đồng ý với điều khoản dịch vụ và chính sách hội viên' : '');
                  }}
                  onChange={(e) => {
                    (e.target as HTMLInputElement).setCustomValidity('');
                    setAgreedTerms(e.target.checked);
                  }}
                  className="mt-0.5 w-4 h-4 rounded text-primary-600 focus:ring-primary-500 cursor-pointer"
                  required
                />
                <span>
                  Tôi đồng ý với{' '}
                  <span className="font-bold text-primary-600 dark:text-gold-400">Điều khoản dịch vụ</span>{' '}
                  và <span className="font-bold text-primary-600 dark:text-gold-400">Chính sách hội viên Lotus Club</span> của Hạt Gạo Sky. <span className="text-red-500 font-bold">*</span>
                </span>
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-primary-900 hover:bg-primary-800 text-white font-bold text-xs rounded-xl shadow-md transition cursor-pointer"
            >
              {loading ? 'Đang đăng ký...' : 'Tạo tài khoản Hội viên'}
            </button>
          </form>
        )}

        <div className="text-center text-xs text-slate-500">
          Đã có tài khoản?{' '}
          <Link
            href={`/${locale}/auth/login${redirectUrl ? `?redirect=${encodeURIComponent(redirectUrl)}` : ''}`}
            className="font-bold text-primary-600 hover:underline"
          >
            Đăng nhập ngay
          </Link>
        </div>
      </div>
    </div>
  );
}
