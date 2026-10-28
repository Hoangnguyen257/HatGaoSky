'use client';

import React, { useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { api } from '../../../../lib/api';
import { useAuth } from '../../../../context/AuthContext';
import { RoleGuard } from '../../../../components/layout/RoleGuard';
import { CustomerNav } from '../../../../components/layout/CustomerNav';
import { User, Mail, Phone, Lock, ShieldCheck, CheckCircle2, AlertCircle } from 'lucide-react';

export default function ProfilePage() {
  const t = useTranslations();
  const locale = useLocale();
  const { user, refreshProfile } = useAuth();

  const [fullName, setFullName] = useState(user?.fullName || 'Nguyen Van An');
  const [phone, setPhone] = useState(user?.phone || '0988889999');
  const [address, setAddress] = useState(user?.address || 'Quận 1, TP. Hồ Chí Minh');

  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // GDPR State
  const [gdprSuccess, setGdprSuccess] = useState(false);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    setSuccess(null);
    setError(null);

    try {
      await api.updateUser(user.id, { fullName, phone, address });
      setSuccess('Cập nhật thông tin thành công!');
      refreshProfile();
      setSaving(false);
    } catch (err: any) {
      setError(err.message || 'Cập nhật thất bại');
      setSaving(false);
    }
  };

  const handleGdprRequest = async () => {
    if (confirm('Quý khách có chắc chắn muốn yêu cầu ẩn danh dữ liệu cá nhân theo tiêu chuẩn GDPR? Các dữ liệu giao dịch vé máy bay sẽ được giữ lại theo quy định pháp lý nhưng toàn bộ thông tin cá nhân sẽ bị xóa.')) {
      try {
        await api.anonymizeMe();
        setGdprSuccess(true);
        refreshProfile();
      } catch (err: any) {
        setError(err.message || 'Yêu cầu không thành công');
      }
    }
  };

  return (
    <RoleGuard allowedRoles={['CUSTOMER', 'STAFF', 'STAFF_MANAGER', 'ADMIN']}>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        <CustomerNav />
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
            {t('nav.profile')}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Quản lý thông tin tài khoản cá nhân và quyền riêng tư dữ liệu
          </p>
        </div>

        {success && (
          <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-2xl flex items-center gap-3 text-xs text-emerald-800 dark:text-emerald-200 font-bold">
            <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-emerald-600" />
            <span>{success}</span>
          </div>
        )}

        {error && (
          <div className="p-4 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-2xl flex items-center gap-3 text-xs text-red-700 dark:text-red-300">
            <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-600" />
            <span>{error}</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* User Card */}
          <div className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm text-center space-y-4">
            <div className="w-20 h-20 rounded-full bg-primary-900 text-gold-400 flex items-center justify-center text-2xl font-black mx-auto shadow-md">
              {user?.fullName?.charAt(0) || 'U'}
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
                {user?.fullName}
              </h3>
              <span className="text-xs text-slate-500 block">{user?.email}</span>
              <span className="inline-block mt-2 px-3 py-1 rounded-full bg-primary-50 dark:bg-primary-950 text-primary-800 dark:text-primary-300 text-[11px] font-bold">
                Vai trò: {user?.role}
              </span>
            </div>
          </div>

          {/* Edit Form */}
          <div className="md:col-span-2 bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-100 dark:border-slate-800 shadow-sm space-y-6">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white pb-3 border-b border-slate-100 dark:border-slate-800">
              Cập nhật thông tin liên hệ
            </h3>

            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-500 block mb-1">Họ và tên</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-500 block mb-1">Số điện thoại</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-500 block mb-1">Địa chỉ</label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2.5 bg-primary-900 hover:bg-primary-800 text-white font-bold text-xs rounded-xl shadow-md transition"
              >
                {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
              </button>
            </form>

            {/* GDPR Anonymization Request */}
            <div className="pt-6 border-t border-slate-100 dark:border-slate-800 space-y-2">
              <h4 className="font-bold text-xs text-red-600">Quyền riêng tư GDPR (Yêu cầu xóa dữ liệu)</h4>
              <p className="text-[11px] text-slate-500">
                Quý khách có quyền yêu cầu ẩn danh toàn bộ dữ liệu cá nhân (tên, email, số điện thoại, hộ chiếu).
              </p>
              {gdprSuccess ? (
                <p className="text-xs text-emerald-600 font-bold">✓ Dữ liệu cá nhân đã được ẩn danh thành công.</p>
              ) : (
                <button
                  type="button"
                  onClick={handleGdprRequest}
                  className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-700 rounded-xl text-xs font-bold transition"
                >
                  Yêu cầu ẩn danh dữ liệu cá nhân (GDPR)
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </RoleGuard>
  );
}
