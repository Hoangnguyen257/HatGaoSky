'use client';

import React, { useState, useEffect } from 'react';
import { api } from '../../../../lib/api';
import { RoleGuard } from '../../../../components/layout/RoleGuard';
import { AdminNav } from '../../../../components/layout/AdminNav';
import { Settings, Save, CheckCircle2, AlertCircle } from 'lucide-react';

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const data = await api.getSettings();
      setSettings(data);
      setLoading(false);
    } catch {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const handleUpdate = async (key: string, value: string) => {
    setSavingKey(key);
    setMessage(null);
    try {
      await api.updateSetting({ key, value });
      setMessage(`Cập nhật tham số ${key} thành công!`);
      setSavingKey(null);
      loadSettings();
    } catch (err: any) {
      setMessage(`Lỗi: ${err.message}`);
      setSavingKey(null);
    }
  };

  return (
    <RoleGuard allowedRoles={['ADMIN']}>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
        <AdminNav />
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-600 dark:text-emerald-400">
            <Settings className="w-4 h-4" />
            <span>Configuration</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-1">
            Cấu hình tham số hệ thống
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Thiết lập thời gian phiên làm việc, TTL giữ chỗ ghế và chính sách an ninh
          </p>
        </div>

        {message && (
          <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-2xl flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{message}</span>
          </div>
        )}

        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-100 dark:border-slate-800 shadow-sm space-y-6">
          <div className="divide-y divide-slate-100 dark:divide-slate-800 space-y-4">
            {settings.map((s) => (
              <div key={s.id} className="pt-4 first:pt-0 flex flex-wrap items-center justify-between gap-4 text-xs">
                <div className="space-y-1 max-w-md">
                  <strong className="text-slate-900 dark:text-white font-mono block">{s.key}</strong>
                  <p className="text-slate-500">{s.description}</p>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    defaultValue={s.value}
                    id={`input-${s.key}`}
                    className="bg-slate-50 dark:bg-slate-800 border rounded-xl px-3 py-1.5 font-bold w-36 text-center"
                  />
                  <button
                    onClick={() => {
                      const input = document.getElementById(`input-${s.key}`) as HTMLInputElement;
                      if (input) handleUpdate(s.key, input.value);
                    }}
                    disabled={savingKey === s.key}
                    className="px-3.5 py-1.5 bg-primary-900 hover:bg-primary-800 text-white font-bold rounded-xl shadow-sm flex items-center gap-1"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Lưu</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </RoleGuard>
  );
}
