'use client';

import React, { useState, useEffect } from 'react';
import { api } from '../../../../lib/api';
import { RoleGuard } from '../../../../components/layout/RoleGuard';
import { Users, Briefcase, Activity, CheckCircle2, Clock } from 'lucide-react';

export default function ManagerStaffPage() {
  const [staffList, setStaffList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .getStaffDetails()
      .then((data) => {
        setStaffList(data);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, []);

  return (
    <RoleGuard allowedRoles={['STAFF_MANAGER', 'ADMIN']}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-purple-600 dark:text-purple-400">
            <Briefcase className="w-4 h-4" />
            <span>Staff Oversight</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-1">
            Danh sách & Hiệu suất Nhân viên khai thác
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Theo dõi nhật ký điều chỉnh chuyến bay, hủy vé và xử lý yêu cầu khách hàng
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {staffList.map((s) => (
            <div
              key={s.id}
              className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-100 dark:border-slate-800 shadow-sm space-y-4"
            >
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 font-bold flex items-center justify-center text-sm">
                    {s.fullName.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-slate-900 dark:text-white">{s.fullName}</h3>
                    <p className="text-xs text-slate-400">{s.email}</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">ĐT: {s.phone || '—'}</p>
                  </div>
                </div>

                <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                  {s.status}
                </span>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl flex justify-between items-center text-xs">
                <span className="font-medium text-slate-500">Số tác vụ đã xử lý:</span>
                <strong className="text-purple-700 dark:text-purple-400 font-black text-sm">
                  {s.actionsCount} tác vụ
                </strong>
              </div>

              {/* Recent Logs */}
              <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                  Hoạt động gần nhất:
                </span>
                {s.recentLogs?.length === 0 ? (
                  <p className="text-slate-400 text-[11px] italic">Chưa có ghi nhận hoạt động gần đây.</p>
                ) : (
                  s.recentLogs?.slice(0, 3).map((log: any) => (
                    <div key={log.id} className="p-2 rounded-lg bg-slate-50/50 flex justify-between items-center text-[11px]">
                      <span className="font-bold text-slate-700 dark:text-slate-300">{log.action}: {log.reason}</span>
                      <span className="text-slate-400 text-[10px]">{new Date(log.createdAt).toLocaleDateString('vi-VN')}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </RoleGuard>
  );
}
