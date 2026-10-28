'use client';

import React, { useState, useEffect } from 'react';
import { api } from '../../../../lib/api';
import { useAuth } from '../../../../context/AuthContext';
import { RoleGuard } from '../../../../components/layout/RoleGuard';
import {
  Users,
  Search,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Ban,
  Trash2,
  RefreshCw,
  Edit,
  X,
} from 'lucide-react';

export default function AdminUsersPage() {
  const { user: currentAdmin } = useAuth();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Edit User Modal
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPhone, setEditPhone] = useState('');

  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const data = await api.getUsers({
        role: roleFilter || undefined,
        status: statusFilter || undefined,
        search: searchTerm || undefined,
      });
      setUsers(data);
      setLoading(false);
    } catch {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, [roleFilter, statusFilter]);

  const handleToggleStatus = async (id: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'ACTIVE' ? 'DISABLED' : 'ACTIVE';
    try {
      await api.toggleUserStatus(id, nextStatus);
      setMessage({ type: 'success', text: `Đã đổi trạng thái người dùng thành ${nextStatus}` });
      loadUsers();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Không thể đổi trạng thái' });
    }
  };

  const handleDeleteUser = async (id: string) => {
    if (confirm('Quý khách có chắc chắn muốn xóa (soft delete) tài khoản người dùng này?')) {
      try {
        await api.deleteUser(id);
        setMessage({ type: 'success', text: 'Xóa tài khoản thành công!' });
        loadUsers();
      } catch (err: any) {
        setMessage({ type: 'error', text: err.message || 'Không thể xóa' });
      }
    }
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;

    try {
      await api.updateUser(selectedUser.id, {
        fullName: editName,
        email: editEmail,
        phone: editPhone,
      });
      setMessage({ type: 'success', text: 'Cập nhật tài khoản thành công!' });
      setEditModalOpen(false);
      loadUsers();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Lỗi cập nhật' });
    }
  };

  return (
    <RoleGuard allowedRoles={['ADMIN']}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-600 dark:text-emerald-400">
            <Users className="w-4 h-4" />
            <span>Admin Portal</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-1">
            Quản lý tài khoản người dùng (RBAC)
          </h1>
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

        {/* Filters */}
        <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex flex-wrap items-center justify-between gap-4 text-xs">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-slate-500">Vai trò:</span>
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="bg-slate-50 dark:bg-slate-800 border rounded-xl px-3 py-1.5 font-bold"
              >
                <option value="">Tất cả vai trò</option>
                <option value="CUSTOMER">Customer (Khách hàng)</option>
                <option value="STAFF">Staff (Nhân viên)</option>
                <option value="STAFF_MANAGER">Staff Manager (Trưởng phòng)</option>
                <option value="ADMIN">Admin (Quản trị viên)</option>
              </select>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-slate-500">Trạng thái:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-slate-50 dark:bg-slate-800 border rounded-xl px-3 py-1.5 font-bold"
              >
                <option value="">Tất cả</option>
                <option value="ACTIVE">ACTIVE</option>
                <option value="INACTIVE">INACTIVE</option>
                <option value="DISABLED">DISABLED</option>
                <option value="DELETED">DELETED</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm theo tên hoặc email..."
              className="bg-slate-50 dark:bg-slate-800 border rounded-xl px-3 py-1.5 font-medium"
            />
            <button
              onClick={loadUsers}
              className="px-4 py-1.5 bg-primary-900 text-white font-bold rounded-xl"
            >
              Tìm
            </button>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 text-slate-500 font-semibold">
                <tr>
                  <th className="p-4">Người dùng</th>
                  <th className="p-4">Vai trò (Role)</th>
                  <th className="p-4">Số điện thoại</th>
                  <th className="p-4">Trạng thái</th>
                  <th className="p-4">Ngày đăng ký</th>
                  <th className="p-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                    <td className="p-4">
                      <div className="font-bold text-slate-900 dark:text-white">{u.fullName}</div>
                      <div className="text-slate-400 text-[11px]">{u.email}</div>
                    </td>
                    <td className="p-4">
                      <span className="font-bold text-primary-800 dark:text-primary-300">
                        {u.role}
                      </span>
                    </td>
                    <td className="p-4 text-slate-600 dark:text-slate-400">{u.phone || '—'}</td>
                    <td className="p-4">
                      <span
                        className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] ${
                          u.status === 'ACTIVE'
                            ? 'bg-emerald-100 text-emerald-800'
                            : u.status === 'DISABLED'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {u.status}
                      </span>
                    </td>
                    <td className="p-4 text-slate-500">
                      {new Date(u.createdAt).toLocaleDateString('vi-VN')}
                    </td>
                    <td className="p-4 text-right space-x-1">
                      <button
                        onClick={() => {
                          setSelectedUser(u);
                          setEditName(u.fullName);
                          setEditEmail(u.email);
                          setEditPhone(u.phone || '');
                          setEditModalOpen(true);
                        }}
                        className="p-1.5 hover:bg-slate-100 text-slate-600 rounded-lg"
                        title="Chỉnh sửa"
                      >
                        <Edit className="w-4 h-4" />
                      </button>

                      {u.status !== 'DELETED' && (
                        <button
                          onClick={() => handleToggleStatus(u.id, u.status)}
                          className={`p-1.5 rounded-lg ${
                            u.status === 'ACTIVE'
                              ? 'text-amber-600 hover:bg-amber-50'
                              : 'text-emerald-600 hover:bg-emerald-50'
                          }`}
                          title={u.status === 'ACTIVE' ? 'Khóa tài khoản' : 'Mở khóa'}
                        >
                          <Ban className="w-4 h-4" />
                        </button>
                      )}

                      {u.status !== 'DELETED' && u.id !== currentAdmin?.id && (
                        <button
                          onClick={() => handleDeleteUser(u.id)}
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg"
                          title="Xóa mềm"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Edit User Modal */}
        {editModalOpen && selectedUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in">
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4 text-xs">
              <div className="flex justify-between items-center border-b pb-3">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Chỉnh sửa người dùng: {selectedUser.fullName}
                </h3>
                <button onClick={() => setEditModalOpen(false)}>
                  <X className="w-5 h-5 text-slate-400" />
                </button>
              </div>

              <form onSubmit={handleSaveUser} className="space-y-3">
                <div>
                  <label className="font-semibold text-slate-600 block mb-1">Họ và tên *</label>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border rounded-xl p-2.5 font-bold"
                    required
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-600 block mb-1">Email *</label>
                  <input
                    type="email"
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border rounded-xl p-2.5 font-bold"
                    required
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-600 block mb-1">Số điện thoại</label>
                  <input
                    type="text"
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border rounded-xl p-2.5 font-bold"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t">
                  <button
                    type="button"
                    onClick={() => setEditModalOpen(false)}
                    className="px-4 py-2 rounded-xl bg-slate-100 font-bold"
                  >
                    Hủy bỏ
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-primary-900 text-white font-bold"
                  >
                    Lưu thông tin
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
