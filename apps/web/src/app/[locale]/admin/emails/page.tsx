'use client';

import React, { useState, useEffect } from 'react';
import { api } from '../../../../lib/api';
import { RoleGuard } from '../../../../components/layout/RoleGuard';
import { Mail, Search, Eye, X, Send } from 'lucide-react';

export default function AdminEmailsPage() {
  const [emails, setEmails] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [previewEmail, setPreviewEmail] = useState<any | null>(null);

  const loadEmails = async () => {
    setLoading(true);
    try {
      const data = await api.getSentEmails({ search: searchTerm || undefined });
      setEmails(data);
      setLoading(false);
    } catch {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEmails();
  }, []);

  return (
    <RoleGuard allowedRoles={['ADMIN']}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-600 dark:text-emerald-400">
            <Mail className="w-4 h-4" />
            <span>Dispatched Communications</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-1">
            Hòm thư hệ thống đã gửi (Sent Emails Log)
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Xem toàn bộ email thông báo vé, mã PNR, xác thực tài khoản và cảnh báo đổi giờ bay
          </p>
        </div>

        {/* Search */}
        <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-2 max-w-md w-full">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm theo email hoặc tiêu đề..."
              className="w-full bg-slate-50 dark:bg-slate-800 border rounded-xl px-3 py-2 font-medium"
            />
            <button
              onClick={loadEmails}
              className="px-4 py-2 bg-primary-900 text-white font-bold rounded-xl whitespace-nowrap"
            >
              Tìm kiếm
            </button>
          </div>
        </div>

        {/* Emails Table */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 text-slate-500 font-semibold">
                <tr>
                  <th className="p-4">Người nhận</th>
                  <th className="p-4">Tiêu đề thư</th>
                  <th className="p-4">Mẫu template</th>
                  <th className="p-4">Thời gian gửi</th>
                  <th className="p-4 text-right">Xem nội dung</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {emails.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                    <td className="p-4 font-bold text-slate-900 dark:text-white">
                      {m.recipientEmail}
                    </td>
                    <td className="p-4 text-slate-700 dark:text-slate-300 font-medium">
                      {m.subject}
                    </td>
                    <td className="p-4">
                      <span className="px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 font-bold text-[10px]">
                        {m.template}
                      </span>
                    </td>
                    <td className="p-4 text-slate-500">
                      {new Date(m.sentAt).toLocaleString('vi-VN')}
                    </td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() => setPreviewEmail(m)}
                        className="px-3 py-1 bg-primary-50 dark:bg-slate-800 hover:bg-primary-100 text-primary-800 dark:text-primary-300 rounded-lg font-bold text-xs flex items-center gap-1.5 ml-auto"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Xem thư</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Email Preview Modal */}
        {previewEmail && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in">
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 max-w-2xl w-full border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4 max-h-[85vh] flex flex-col">
              <div className="flex justify-between items-start border-b pb-3">
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    {previewEmail.subject}
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Gửi tới: <strong>{previewEmail.recipientEmail}</strong> · Lúc: {new Date(previewEmail.sentAt).toLocaleString('vi-VN')}
                  </p>
                </div>
                <button onClick={() => setPreviewEmail(null)}>
                  <X className="w-5 h-5 text-slate-400" />
                </button>
              </div>

              <div
                className="p-6 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-700 flex-1 overflow-y-auto text-xs prose dark:prose-invert max-w-none"
                dangerouslySetInnerHTML={{ __html: previewEmail.contentHtml }}
              />
            </div>
          </div>
        )}
      </div>
    </RoleGuard>
  );
}
