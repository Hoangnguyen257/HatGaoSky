'use client';

import React, { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { api } from '../../../../lib/api';
import { RoleGuard } from '../../../../components/layout/RoleGuard';
import {
  FileText,
  Search,
  CheckCircle2,
  AlertCircle,
  X,
  Edit,
  History,
} from 'lucide-react';

export default function StaffBookingRequestsPage() {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Update modal
  const [updateModalOpen, setUpdateModalOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<any | null>(null);
  const [newStatus, setNewStatus] = useState('CONFIRMED');
  const [reason, setReason] = useState('Đã xác nhận kiểm tra thanh toán qua đối soát');

  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const loadRequests = async () => {
    setLoading(true);
    try {
      const data = await api.getBookingRequests({
        status: statusFilter || undefined,
        search: searchTerm || undefined,
      });
      setRequests(data);
      setLoading(false);
    } catch {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, [statusFilter]);

  const handleUpdateStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBooking) return;
    setMessage(null);

    try {
      await api.updateBookingStatus(selectedBooking.id, newStatus, reason);
      setMessage({ type: 'success', text: `Cập nhật trạng thái PNR ${selectedBooking.pnr} thành ${newStatus} thành công!` });
      setUpdateModalOpen(false);
      loadRequests();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Lỗi cập nhật' });
    }
  };

  return (
    <RoleGuard allowedRoles={['STAFF', 'STAFF_MANAGER', 'ADMIN']}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-primary-700 dark:text-primary-400">
            <FileText className="w-4 h-4" />
            <span>Operations Portal</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-1">
            Quản lý yêu cầu & Hồ sơ đặt vé
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
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-500">Lọc theo trạng thái:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-50 dark:bg-slate-800 border rounded-xl px-3 py-2 font-bold"
            >
              <option value="">Tất cả trạng thái</option>
              <option value="PENDING_PAYMENT">Chờ thanh toán (PENDING_PAYMENT)</option>
              <option value="PARTIALLY_PAID">Thanh toán 1 phần (PARTIALLY_PAID)</option>
              <option value="CONFIRMED">Đã xác nhận (CONFIRMED)</option>
              <option value="CANCELLED">Đã hủy (CANCELLED)</option>
              <option value="COMPLETED">Hoàn tất (COMPLETED)</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm theo PNR hoặc email..."
              className="bg-slate-50 dark:bg-slate-800 border rounded-xl px-3 py-2 font-medium"
            />
            <button
              onClick={loadRequests}
              className="px-4 py-2 bg-primary-900 text-white font-bold rounded-xl"
            >
              Tìm kiếm
            </button>
          </div>
        </div>

        {/* Requests Table */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 text-slate-500 font-semibold">
                <tr>
                  <th className="p-4">Mã PNR</th>
                  <th className="p-4">Khách hàng</th>
                  <th className="p-4">Hành trình</th>
                  <th className="p-4">Tổng tiền</th>
                  <th className="p-4">Đã thanh toán</th>
                  <th className="p-4">Trạng thái</th>
                  <th className="p-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {requests.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                    <td className="p-4 font-black text-primary-900 dark:text-gold-400">
                      {r.pnr}
                    </td>
                    <td className="p-4">
                      <div className="font-bold text-slate-900 dark:text-white">{r.customerName}</div>
                      <div className="text-slate-400 text-[11px]">{r.customerEmail}</div>
                    </td>
                    <td className="p-4 font-bold text-slate-700 dark:text-slate-300">
                      {r.tickets?.[0]?.flight ? `${r.tickets[0].flight.originAirport?.code} ➔ ${r.tickets[0].flight.destinationAirport?.code}` : 'Chuyến bay'}
                    </td>
                    <td className="p-4 font-black text-slate-900 dark:text-white">
                      {r.totalAmount?.toLocaleString()} VND
                    </td>
                    <td className="p-4 font-bold text-emerald-600">
                      {r.paidAmount?.toLocaleString()} VND
                    </td>
                    <td className="p-4">
                      <span
                        className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] ${
                          r.status === 'CONFIRMED'
                            ? 'bg-emerald-100 text-emerald-800'
                            : r.status === 'CANCELLED'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {r.status}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() => {
                          setSelectedBooking(r);
                          setNewStatus(r.status);
                          setUpdateModalOpen(true);
                        }}
                        className="px-3 py-1 bg-primary-50 dark:bg-slate-800 hover:bg-primary-100 text-primary-800 dark:text-primary-300 rounded-lg font-bold text-xs"
                      >
                        Cập nhật
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Update Status Modal */}
        {updateModalOpen && selectedBooking && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in">
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4 text-xs">
              <div className="flex justify-between items-center border-b pb-3">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Cập nhật trạng thái PNR: {selectedBooking.pnr}
                </h3>
                <button onClick={() => setUpdateModalOpen(false)}>
                  <X className="w-5 h-5 text-slate-400" />
                </button>
              </div>

              <form onSubmit={handleUpdateStatus} className="space-y-4">
                <div>
                  <label className="font-semibold text-slate-600 block mb-1">Trạng thái mới *</label>
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border rounded-xl p-2.5 font-bold"
                  >
                    <option value="CONFIRMED">CONFIRMED (Xác nhận & Xuất vé)</option>
                    <option value="PARTIALLY_PAID">PARTIALLY_PAID (Đã trả trước một phần)</option>
                    <option value="CANCELLED">CANCELLED (Hủy đặt chỗ)</option>
                    <option value="COMPLETED">COMPLETED (Đã hoàn tất hành trình)</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-600 block mb-1">Lý do điều chỉnh (Audit Log) *</label>
                  <textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border rounded-xl p-2.5 h-20"
                    required
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t">
                  <button
                    type="button"
                    onClick={() => setUpdateModalOpen(false)}
                    className="px-4 py-2 rounded-xl bg-slate-100 font-bold"
                  >
                    Hủy bỏ
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-primary-900 text-white font-bold"
                  >
                    Lưu trạng thái & Ghi nhật ký
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
