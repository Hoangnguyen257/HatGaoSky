'use client';

import React, { useState, useEffect } from 'react';
import { api } from '../../../../lib/api';
import { useAuth } from '../../../../context/AuthContext';
import { RoleGuard } from '../../../../components/layout/RoleGuard';
import { AdminNav } from '../../../../components/layout/AdminNav';
import {
  ShieldCheck,
  PlusCircle,
  Trash2,
  CheckCircle2,
  AlertCircle,
  X,
  Lock,
  Mail,
  User,
} from 'lucide-react';

export default function AdminAccountsPage() {
  const { user: currentAdmin } = useAuth();
  const [admins, setAdmins] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Create admin modal
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [fullName, setFullName] = useState('Pho Quan Tri Vien 2');
  const [email, setEmail] = useState('admin2@vietsky.vn');
  const [password, setPassword] = useState('Admin@654321');
  const [phone, setPhone] = useState('0909998888');

  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const loadAdmins = async () => {
    setLoading(true);
    try {
      const data = await api.getAdmins();
      setAdmins(data);
      setLoading(false);
    } catch {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdmins();
  }, []);

  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    try {
      await api.createAdmin({ fullName, email, password, phone });
      setMessage({ type: 'success', text: `Tạo tài khoản Quản trị viên ${email} thành công!` });
      setCreateModalOpen(false);
      loadAdmins();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Lỗi tạo admin' });
    }
  };

  const handleRemoveAdmin = async (id: string) => {
    if (confirm('Quý khách có chắc chắn muốn xóa tài khoản Quản trị viên này?')) {
      try {
        await api.removeAdmin(id);
        setMessage({ type: 'success', text: 'Đã xóa tài khoản Quản trị viên!' });
        loadAdmins();
      } catch (err: any) {
        setMessage({ type: 'error', text: err.message || 'Không thể xóa Quản trị viên' });
      }
    }
  };

  return (
    <RoleGuard allowedRoles={['ADMIN']}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
        <AdminNav />
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-600 dark:text-emerald-400">
              <ShieldCheck className="w-4 h-4" />
              <span>Root Security</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-1">
              Quản lý tài khoản Quản trị viên (Admin)
            </h1>
          </div>

          <button
            onClick={() => setCreateModalOpen(true)}
            className="px-4 py-2 bg-primary-900 hover:bg-primary-800 text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-2 transition"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Thêm Quản trị viên mới</span>
          </button>
        </div>

        {/* Security Rule Notice */}
        <div className="p-4 bg-blue-50/70 dark:bg-blue-950/30 rounded-2xl border border-blue-200 dark:border-blue-900 text-xs text-blue-900 dark:text-blue-200 space-y-1">
          <span className="font-bold flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5 text-blue-600" /> Cơ chế bảo vệ hệ thống:
          </span>
          <p className="text-slate-600 dark:text-slate-400">
            1. Quản trị viên không thể tự xóa tài khoản của chính mình.<br />
            2. Không thể xóa Quản trị viên cuối cùng còn lại của hệ thống nhằm đảm bảo luôn có người quản trị.
          </p>
        </div>

        {message && (
          <div
            className={`p-4 rounded-2xl flex items-center gap-3 text-xs font-bold ${
              message.type === 'success'
                ? 'bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 text-emerald-800'
                : 'bg-red-50 dark:bg-red-950/40 border border-red-200 text-red-700'
            }`}
          >
            {message.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-emerald-600" />
            ) : (
              <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-600" />
            )}
            <span>{message.text}</span>
          </div>
        )}

        {/* Admins Table */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 text-slate-500 font-semibold">
                <tr>
                  <th className="p-4">Quản trị viên</th>
                  <th className="p-4">Số điện thoại</th>
                  <th className="p-4">Trạng thái</th>
                  <th className="p-4">Ngày tạo</th>
                  <th className="p-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {admins.map((a) => {
                  const isSelf = a.id === currentAdmin?.id;
                  const isLastAdmin = admins.length <= 1;
                  const canDelete = !isSelf && !isLastAdmin;

                  return (
                    <tr key={a.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                      <td className="p-4">
                        <div className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                          <span>{a.fullName}</span>
                          {isSelf && (
                            <span className="px-2 py-0.5 rounded-full bg-gold-100 text-gold-900 font-bold text-[10px]">
                              Tài khoản của bạn
                            </span>
                          )}
                        </div>
                        <div className="text-slate-400 text-[11px]">{a.email}</div>
                      </td>
                      <td className="p-4 text-slate-600 dark:text-slate-400">{a.phone || '—'}</td>
                      <td className="p-4">
                        <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                          {a.status}
                        </span>
                      </td>
                      <td className="p-4 text-slate-500">
                        {new Date(a.createdAt).toLocaleDateString('vi-VN')}
                      </td>
                      <td className="p-4 text-right">
                        <button
                          disabled={!canDelete}
                          onClick={() => handleRemoveAdmin(a.id)}
                          title={
                            isSelf
                              ? 'Không thể tự xóa tài khoản của chính mình'
                              : isLastAdmin
                              ? 'Không thể xóa Admin cuối cùng'
                              : 'Xóa tài khoản Admin'
                          }
                          className={`p-2 rounded-xl transition ${
                            canDelete
                              ? 'text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40'
                              : 'text-slate-300 dark:text-slate-700 cursor-not-allowed'
                          }`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Create Modal */}
        {createModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in">
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4 text-xs">
              <div className="flex justify-between items-center border-b pb-3">
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-600" />
                  <span>Thêm tài khoản Quản trị viên mới</span>
                </h3>
                <button onClick={() => setCreateModalOpen(false)}>
                  <X className="w-5 h-5 text-slate-400" />
                </button>
              </div>

              <form onSubmit={handleCreateAdmin} className="space-y-3">
                <div>
                  <label className="font-semibold text-slate-600 block mb-1">Họ và tên *</label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border rounded-xl p-2.5 font-bold"
                    required
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-600 block mb-1">Email quản trị *</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border rounded-xl p-2.5 font-bold"
                    required
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-600 block mb-1">Mật khẩu *</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border rounded-xl p-2.5 font-bold"
                    required
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-600 block mb-1">Số điện thoại</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border rounded-xl p-2.5 font-bold"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t">
                  <button
                    type="button"
                    onClick={() => setCreateModalOpen(false)}
                    className="px-4 py-2 rounded-xl bg-slate-100 font-bold"
                  >
                    Hủy bỏ
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-primary-900 text-white font-bold"
                  >
                    Tạo tài khoản Admin
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </RoleGuard>
  );
}
