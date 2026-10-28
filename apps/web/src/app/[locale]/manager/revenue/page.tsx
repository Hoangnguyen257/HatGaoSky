'use client';

import React, { useState, useEffect } from 'react';
import { api } from '../../../../lib/api';
import { RoleGuard } from '../../../../components/layout/RoleGuard';
import { DollarSign, Search, Calculator, ArrowRight, Route } from 'lucide-react';

export default function ManagerRevenuePage() {
  const [startDate, setStartDate] = useState('2026-01-01');
  const [endDate, setEndDate] = useState('2026-12-31');
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);

  const calculate = async () => {
    setLoading(true);
    try {
      const res = await api.calculateRevenue({ startDate, endDate });
      setData(res);
      setLoading(false);
    } catch {
      setLoading(false);
    }
  };

  useEffect(() => {
    calculate();
  }, []);

  return (
    <RoleGuard allowedRoles={['STAFF_MANAGER', 'ADMIN']}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-purple-600 dark:text-purple-400">
            <Calculator className="w-4 h-4" />
            <span>Revenue Engine</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-1">
            Tra cứu & Tính toán doanh thu
          </h1>
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-100 dark:border-slate-800 shadow-sm flex flex-wrap items-end gap-4 text-xs">
          <div>
            <label className="font-semibold text-slate-500 block mb-1">Từ ngày</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="bg-slate-50 dark:bg-slate-800 border rounded-xl px-3 py-2 font-bold"
            />
          </div>
          <div>
            <label className="font-semibold text-slate-500 block mb-1">Đến ngày</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="bg-slate-50 dark:bg-slate-800 border rounded-xl px-3 py-2 font-bold"
            />
          </div>
          <button
            onClick={calculate}
            className="px-6 py-2.5 bg-purple-700 hover:bg-purple-800 text-white font-bold rounded-xl shadow-md transition"
          >
            {loading ? 'Đang tính toán...' : 'Tính toán doanh thu'}
          </button>
        </div>

        {/* Financial KPI Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm">
            <span className="text-xs font-semibold text-slate-400 block">Tổng doanh thu gộp (Gross)</span>
            <span className="text-2xl font-black text-slate-900 dark:text-white mt-1 block">
              {(data?.grossRevenue || 0).toLocaleString('vi-VN')} VND
            </span>
          </div>
          <div className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm">
            <span className="text-xs font-semibold text-slate-400 block">Tổng tiền hoàn vé (Refunds)</span>
            <span className="text-2xl font-black text-red-500 mt-1 block">
              {(data?.totalRefunds || 0).toLocaleString('vi-VN')} VND
            </span>
          </div>
          <div className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm">
            <span className="text-xs font-semibold text-slate-400 block">Doanh thu thuần thực nhận (Net)</span>
            <span className="text-2xl font-black text-emerald-600 mt-1 block">
              {(data?.netRevenue || 0).toLocaleString('vi-VN')} VND
            </span>
          </div>
        </div>

        {/* Breakdown by Route Table */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-100 dark:border-slate-800 shadow-sm space-y-4">
          <h3 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
            <Route className="w-4 h-4 text-purple-600" />
            <span>Phân rã doanh thu theo Tuyến bay</span>
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 text-slate-500 font-semibold">
                <tr>
                  <th className="p-3">Tuyến bay</th>
                  <th className="p-3 text-center">Số lượng vé bán</th>
                  <th className="p-3 text-right">Tổng doanh thu tuyến (VND)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {data?.routeBreakdown?.map((r: any, idx: number) => (
                  <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                    <td className="p-3 font-bold text-slate-900 dark:text-white">{r.route}</td>
                    <td className="p-3 text-center font-semibold text-slate-700 dark:text-slate-300">
                      {r.bookings}
                    </td>
                    <td className="p-3 text-right font-black text-primary-900 dark:text-gold-400">
                      {r.revenue.toLocaleString('vi-VN')} VND
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </RoleGuard>
  );
}
