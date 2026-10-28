'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useLocale } from 'next-intl';
import { api } from '../../../../lib/api';
import { Mail, CheckCircle2, AlertCircle, ArrowLeft } from 'lucide-react';

export default function ForgotPasswordPage() {
  const locale = useLocale();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await api.forgotPassword({ email });
      setResult(res);
      setLoading(false);
    } catch (err: any) {
      setError(err.message || 'Không thể gửi yêu cầu');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[75vh] flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-100 dark:border-slate-800 shadow-premium space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">
            Quên mật khẩu?
          </h1>
          <p className="text-xs text-slate-500">
            Nhập email tài khoản để nhận liên kết đặt lại mật khẩu mới
          </p>
        </div>

        {error && (
          <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-xl flex items-center gap-2 text-xs text-red-700 dark:text-red-300">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {result ? (
          <div className="p-6 bg-emerald-50 dark:bg-emerald-950/40 rounded-2xl border border-emerald-200 dark:border-emerald-800 text-center space-y-3">
            <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
            <h3 className="font-bold text-sm text-emerald-900 dark:text-emerald-200">
              Đã gửi yêu cầu khôi phục
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-300">{result.message}</p>
            {result.resetToken && (
              <div className="pt-2">
                <Link
                  href={`/${locale}/auth/reset-password?token=${result.resetToken}`}
                  className="inline-block px-4 py-2 bg-primary-900 text-white rounded-xl text-xs font-bold"
                >
                  Đặt lại mật khẩu ngay (Demo Token)
                </Link>
              </div>
            )}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Địa chỉ Email đã đăng ký
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="customer@vietsky.vn"
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
              {loading ? 'Đang gửi...' : 'Gửi liên kết khôi phục'}
            </button>
          </form>
        )}

        <div className="text-center pt-2">
          <Link
            href={`/${locale}/auth/login`}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-primary-700"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Quay lại đăng nhập
          </Link>
        </div>
      </div>
    </div>
  );
}
