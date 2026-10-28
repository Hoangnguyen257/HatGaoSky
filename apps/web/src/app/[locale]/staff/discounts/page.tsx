'use client';

import React, { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { api } from '../../../../lib/api';
import { RoleGuard } from '../../../../components/layout/RoleGuard';
import { StaffNav } from '../../../../components/layout/StaffNav';
import { Tag, PlusCircle, Trash2, CheckCircle2, AlertCircle, X } from 'lucide-react';

export default function StaffDiscountsPage() {
  const [discounts, setDiscounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [code, setCode] = useState('AUTUMN2026');
  const [description, setDescription] = useState('Giảm giá 15% mùa thu');
  const [discountType, setDiscountType] = useState('PERCENTAGE');
  const [value, setValue] = useState(15);
  const [minBookingAmount, setMinBookingAmount] = useState(1000000);
  const [maxDiscountAmount, setMaxDiscountAmount] = useState(300000);
  const [startDate, setStartDate] = useState('2026-09-01T00:00');
  const [endDate, setEndDate] = useState('2026-11-30T23:59');

  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const loadDiscounts = async () => {
    setLoading(true);
    try {
      const data = await api.getAllDiscounts();
      setDiscounts(data);
      setLoading(false);
    } catch {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDiscounts();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    try {
      await api.createDiscount({
        code,
        description,
        discountType,
        value,
        minBookingAmount,
        maxDiscountAmount,
        startDate: new Date(startDate).toISOString(),
        endDate: new Date(endDate).toISOString(),
      });
      setMessage({ type: 'success', text: `Tạo thành công mã khuyến mãi ${code}!` });
      setCreateModalOpen(false);
      loadDiscounts();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Lỗi tạo mã' });
    }
  };

  const handleRemove = async (id: string, usedCount: number) => {
    if (usedCount > 0) {
      alert(`Không thể xóa mã khuyến mãi đã được sử dụng (${usedCount} lượt) theo quy tắc nghiệp vụ.`);
      return;
    }

    if (confirm('Quý khách có chắc chắn muốn xóa mã khuyến mãi này?')) {
      try {
        await api.removeDiscount(id);
        setMessage({ type: 'success', text: 'Xóa mã khuyến mãi thành công!' });
        loadDiscounts();
      } catch (err: any) {
        setMessage({ type: 'error', text: err.message || 'Không thể xóa' });
      }
    }
  };

  return (
    <RoleGuard allowedRoles={['STAFF', 'STAFF_MANAGER', 'ADMIN']}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
        <StaffNav />
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-primary-700 dark:text-primary-400">
              <Tag className="w-4 h-4" />
              <span>Operations Portal</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-1">
              Quản lý mã khuyến mãi & Chiết khấu
            </h1>
          </div>

          <button
            onClick={() => setCreateModalOpen(true)}
            className="px-4 py-2 bg-primary-900 hover:bg-primary-800 text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-2 transition"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Thêm mã mới</span>
          </button>
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

        {/* Table */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 text-slate-500 font-semibold">
                <tr>
                  <th className="p-4">Mã code</th>
                  <th className="p-4">Mô tả</th>
                  <th className="p-4">Giá trị giảm</th>
                  <th className="p-4">Đơn tối thiểu</th>
                  <th className="p-4">Thời hạn</th>
                  <th className="p-4">Đã dùng / Giới hạn</th>
                  <th className="p-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {discounts.map((d) => (
                  <tr key={d.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                    <td className="p-4 font-mono font-black text-primary-900 dark:text-gold-400">
                      {d.code}
                    </td>
                    <td className="p-4 text-slate-700 dark:text-slate-300 max-w-xs truncate">
                      {d.description}
                    </td>
                    <td className="p-4 font-bold text-emerald-600">
                      {d.discountType === 'PERCENTAGE' ? `${d.value}%` : `${d.value.toLocaleString()} đ`}
                    </td>
                    <td className="p-4 text-slate-600 dark:text-slate-400">
                      {d.minBookingAmount?.toLocaleString()} đ
                    </td>
                    <td className="p-4 text-slate-500 text-[11px]">
                      {new Date(d.startDate).toLocaleDateString('vi-VN')} ➔ {new Date(d.endDate).toLocaleDateString('vi-VN')}
                    </td>
                    <td className="p-4 font-semibold text-slate-800 dark:text-slate-200">
                      {d.usedCount} / {d.usageLimit}
                    </td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() => handleRemove(d.id, d.usedCount)}
                        title="Xóa mã (Chỉ áp dụng khi chưa sử dụng)"
                        className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
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
                  <Tag className="w-5 h-5 text-primary-600" />
                  <span>Tạo mã khuyến mãi mới</span>
                </h3>
                <button onClick={() => setCreateModalOpen(false)}>
                  <X className="w-5 h-5 text-slate-400" />
                </button>
              </div>

              <form onSubmit={handleCreate} className="space-y-3">
                <div>
                  <label className="font-semibold text-slate-600 block mb-1">Mã Code (In hoa) *</label>
                  <input
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    className="w-full bg-slate-50 dark:bg-slate-800 border rounded-xl p-2.5 font-mono font-bold uppercase"
                    required
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-600 block mb-1">Mô tả ưu đãi *</label>
                  <input
                    type="text"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border rounded-xl p-2.5 font-bold"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-semibold text-slate-600 block mb-1">Loại giảm</label>
                    <select
                      value={discountType}
                      onChange={(e) => setDiscountType(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800 border rounded-xl p-2.5 font-bold"
                    >
                      <option value="PERCENTAGE">Phần trăm (%)</option>
                      <option value="FIXED">Số tiền cố định (VND)</option>
                    </select>
                  </div>
                  <div>
                    <label className="font-semibold text-slate-600 block mb-1">Giá trị giảm *</label>
                    <input
                      type="number"
                      value={value}
                      onChange={(e) => setValue(Number(e.target.value))}
                      className="w-full bg-slate-50 dark:bg-slate-800 border rounded-xl p-2.5 font-bold"
                      required
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-semibold text-slate-600 block mb-1">Ngày bắt đầu</label>
                    <input
                      type="datetime-local"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800 border rounded-xl p-2.5 font-bold"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-slate-600 block mb-1">Ngày kết thúc</label>
                    <input
                      type="datetime-local"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800 border rounded-xl p-2.5 font-bold"
                    />
                  </div>
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
                    Tạo mã khuyến mãi
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
