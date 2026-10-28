'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useLocale } from 'next-intl';
import { api } from '../../../../lib/api';
import { CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';

export default function VerifyEmailPage() {
  const searchParams = useSearchParams();
  const locale = useLocale();
  const token = searchParams.get('token') || '';

  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) {
      setLoading(false);
      setMessage('Không tìm thấy mã xác thực');
      return;
    }

    api
      .verifyEmail({ token })
      .then((res) => {
        setSuccess(true);
        setMessage(res.message);
        setLoading(false);
      })
      .catch((err) => {
        setSuccess(false);
        setMessage(err.message || 'Mã xác thực không hợp lệ hoặc đã hết hạn');
        setLoading(false);
      });
  }, [token]);

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-100 dark:border-slate-800 shadow-premium text-center space-y-4">
        {loading ? (
          <div className="py-8">
            <RefreshCw className="w-8 h-8 text-primary-600 animate-spin mx-auto mb-3" />
            <p className="text-xs text-slate-500 font-medium">Đang kích hoạt tài khoản...</p>
          </div>
        ) : success ? (
          <div className="space-y-4">
            <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h1 className="text-xl font-black text-slate-900 dark:text-white">
              Kích hoạt tài khoản thành công!
            </h1>
            <p className="text-xs text-slate-600 dark:text-slate-300">{message}</p>
            <div className="pt-2">
              <Link
                href={`/${locale}/auth/login`}
                className="inline-block px-6 py-2.5 bg-primary-900 hover:bg-primary-800 text-white font-bold text-xs rounded-xl shadow-md transition"
              >
                Đăng nhập tài khoản
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="w-14 h-14 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto">
              <AlertCircle className="w-8 h-8" />
            </div>
            <h1 className="text-xl font-black text-slate-900 dark:text-white">
              Xác thực thất bại
            </h1>
            <p className="text-xs text-red-600">{message}</p>
            <div className="pt-2">
              <Link
                href={`/${locale}/auth/register`}
                className="inline-block px-5 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-white font-bold text-xs rounded-xl transition"
              >
                Đăng ký lại
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
