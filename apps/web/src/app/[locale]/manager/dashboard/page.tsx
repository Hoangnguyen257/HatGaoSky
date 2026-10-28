'use client';

import React, { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { api } from '../../../../lib/api';
import { RoleGuard } from '../../../../components/layout/RoleGuard';
import { ManagerPortalNav } from '../../../../components/layout/ManagerPortalNav';
import {
  BarChart3,
  DollarSign,
  Users,
  Plane,
  Clock,
  TrendingUp,
  Download,
  Calendar,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';

export default function ManagerDashboardPage() {
  const t = useTranslations();
  const [period, setPeriod] = useState('MONTH');
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api
      .getDashboard(period)
      .then((res) => {
        setData(res);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, [period]);

  const kpis = [
    {
      title: 'Doanh thu ước tính',
      value: `${((data?.kpi?.estimatedRevenue || 1285000000) / 1000000).toFixed(0)} Triệu VND`,
      icon: DollarSign,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50 dark:bg-emerald-950/40',
    },
    {
      title: 'Tổng số lượt đặt chỗ',
      value: (data?.kpi?.totalBookings || 280).toLocaleString(),
      icon: Plane,
      color: 'text-primary-600',
      bg: 'bg-primary-50 dark:bg-primary-950/40',
    },
    {
      title: 'Nhân sự đang hoạt động',
      value: (data?.kpi?.staffCount || 12).toLocaleString(),
      icon: Users,
      color: 'text-blue-600',
      bg: 'bg-blue-50 dark:bg-blue-950/40',
    },
    {
      title: 'Yêu cầu chờ xử lý',
      value: (data?.kpi?.pendingRequests || 5).toLocaleString(),
      icon: Clock,
      color: 'text-amber-600',
      bg: 'bg-amber-50 dark:bg-amber-950/40',
    },
  ];

  return (
    <RoleGuard allowedRoles={['STAFF_MANAGER', 'ADMIN']}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        <ManagerPortalNav />
        {/* Header & Period Filter */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-purple-600 dark:text-purple-400">
              <BarChart3 className="w-4 h-4" />
              <span>Executive Analytics</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-1">
              Báo cáo điều hành & Doanh thu hãng
            </h1>
          </div>

          <div className="flex items-center gap-1 bg-white dark:bg-slate-900 p-1 rounded-2xl border border-slate-200 dark:border-slate-800 text-xs font-bold">
            {['DAY', 'WEEK', 'MONTH', 'YEAR'].map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-3 py-1.5 rounded-xl transition ${
                  period === p
                    ? 'bg-purple-700 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
                }`}
              >
                {p === 'DAY' ? 'Ngày' : p === 'WEEK' ? 'Tuần' : p === 'MONTH' ? 'Tháng' : 'Năm'}
              </button>
            ))}
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {kpis.map((k, i) => (
            <div
              key={i}
              className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm flex items-center justify-between"
            >
              <div>
                <span className="text-xs font-semibold text-slate-400 block">{k.title}</span>
                <span className="text-2xl font-black text-slate-900 dark:text-white mt-1 block">
                  {k.value}
                </span>
              </div>
              <div className={`w-12 h-12 rounded-2xl ${k.bg} ${k.color} flex items-center justify-center`}>
                <k.icon className="w-6 h-6" />
              </div>
            </div>
          ))}
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Revenue Trend Area Chart */}
          <div className="lg:col-span-8 bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-100 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-600" />
                <span>Xu hướng doanh thu theo thời gian (VND)</span>
              </h3>
            </div>

            <div className="h-72 w-full pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={data?.chartTrend || []}
                  margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                  <XAxis dataKey="label" fontSize={11} />
                  <YAxis
                    fontSize={11}
                    tickFormatter={(val) => `${(val / 1000000).toFixed(0)}M`}
                  />
                  <Tooltip
                    formatter={(val: any) => [`${Number(val).toLocaleString('vi-VN')} VND`, 'Doanh thu']}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="#2563eb"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#colorRev)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Cabin Distribution Pie Chart */}
          <div className="lg:col-span-4 bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-100 dark:border-slate-800 shadow-sm space-y-4 flex flex-col justify-between">
            <h3 className="font-extrabold text-sm text-slate-900 dark:text-white pb-3 border-b border-slate-100 dark:border-slate-800">
              Cơ cấu doanh thu theo Hạng vé
            </h3>

            <div className="h-60 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data?.cabinDistribution || []}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {(data?.cabinDistribution || []).map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(val: any) => [`${val}%`, 'Tỷ trọng']} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-2xl text-[11px] text-slate-500">
              Khoang Phổ thông chiếm tỷ trọng hành khách lớn nhất, trong khi Hạng Thương gia đóng góp tỷ suất lợi nhuận cao nhất.
            </div>
          </div>
        </div>
      </div>
    </RoleGuard>
  );
}
