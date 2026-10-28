'use client';

import React, { useState } from 'react';
import { api } from '../../../../lib/api';
import { RoleGuard } from '../../../../components/layout/RoleGuard';
import { FileDown, FileSpreadsheet, FileText, CheckCircle2, Clock, AlertCircle } from 'lucide-react';

export default function ManagerExportPage() {
  const [reportType, setReportType] = useState('REVENUE');
  const [format, setFormat] = useState('EXCEL');
  const [startDate, setStartDate] = useState('2026-01-01');
  const [endDate, setEndDate] = useState('2026-12-31');

  // Export Job State Machine: IDLE -> SELECTING -> SUBMITTED -> PROCESSING -> GENERATING -> READY | ERROR
  const [jobState, setJobState] = useState<'IDLE' | 'PROCESSING' | 'READY' | 'ERROR'>('IDLE');
  const [downloadContent, setDownloadContent] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleStartExport = async (e: React.FormEvent) => {
    e.preventDefault();
    setJobState('PROCESSING');
    setErrorMessage(null);

    try {
      const res = await api.createExportJob({
        reportType,
        format,
        startDate,
        endDate,
      });

      setDownloadContent(res.downloadContent);
      setJobState('READY');

      // Trigger automatic browser download
      const blob = new Blob([res.downloadContent], {
        type: format === 'EXCEL' ? 'text/csv;charset=utf-8;' : 'text/plain;charset=utf-8;',
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `vietsky_${reportType.toLowerCase()}_${Date.now()}.${format === 'EXCEL' ? 'csv' : 'txt'}`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err: any) {
      setErrorMessage(err.message || 'Lỗi xử lý file xuất báo cáo');
      setJobState('ERROR');
    }
  };

  return (
    <RoleGuard allowedRoles={['STAFF_MANAGER', 'ADMIN']}>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-purple-600 dark:text-purple-400">
            <FileDown className="w-4 h-4" />
            <span>Export Engine</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-1">
            Xuất báo cáo điều hành (Excel & PDF)
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Tạo và tải về tự động các báo cáo định dạng Excel (CSV) hoặc tài liệu PDF
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-100 dark:border-slate-800 shadow-premium space-y-6">
          <form onSubmit={handleStartExport} className="space-y-6">
            {/* Report Type */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                Loại báo cáo cần trích xuất
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                {[
                  { value: 'REVENUE', label: 'Báo cáo Doanh thu & Dòng tiền' },
                  { value: 'BOOKINGS', label: 'Báo cáo Chi tiết Vé & Đặt chỗ' },
                  { value: 'STAFF_PERFORMANCE', label: 'Báo cáo Hiệu suất Nhân viên' },
                ].map((item) => (
                  <button
                    key={item.value}
                    type="button"
                    onClick={() => setReportType(item.value)}
                    className={`p-3.5 rounded-2xl border text-left font-bold transition ${
                      reportType === item.value
                        ? 'border-purple-600 bg-purple-50 dark:bg-slate-800 text-purple-900 dark:text-purple-300 ring-2 ring-purple-500'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Format: EXCEL vs PDF */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                Định dạng file xuất
              </label>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <button
                  type="button"
                  onClick={() => setFormat('EXCEL')}
                  className={`p-3.5 rounded-2xl border flex items-center gap-3 font-bold transition ${
                    format === 'EXCEL'
                      ? 'border-emerald-600 bg-emerald-50 dark:bg-slate-800 text-emerald-900 dark:text-emerald-300 ring-2 ring-emerald-500'
                      : 'border-slate-200 dark:border-slate-700 text-slate-600'
                  }`}
                >
                  <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
                  <span>Microsoft Excel / CSV (.csv)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setFormat('PDF')}
                  className={`p-3.5 rounded-2xl border flex items-center gap-3 font-bold transition ${
                    format === 'PDF'
                      ? 'border-red-600 bg-red-50 dark:bg-slate-800 text-red-900 dark:text-red-300 ring-2 ring-red-500'
                      : 'border-slate-200 dark:border-slate-700 text-slate-600'
                  }`}
                >
                  <FileText className="w-5 h-5 text-red-600" />
                  <span>Adobe PDF (.pdf / .txt)</span>
                </button>
              </div>
            </div>

            {/* Date Range */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="font-semibold text-slate-500 block mb-1">Khoảng thời gian: Từ ngày</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border rounded-xl px-3 py-2 font-bold"
                />
              </div>
              <div>
                <label className="font-semibold text-slate-500 block mb-1">Khoảng thời gian: Đến ngày</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border rounded-xl px-3 py-2 font-bold"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={jobState === 'PROCESSING'}
              className="w-full py-3.5 bg-purple-700 hover:bg-purple-800 text-white font-extrabold text-xs rounded-xl shadow-md transition flex items-center justify-center gap-2"
            >
              <FileDown className="w-4 h-4" />
              <span>{jobState === 'PROCESSING' ? 'Đang tạo báo cáo...' : 'Tạo và Tải báo cáo về máy'}</span>
            </button>
          </form>

          {/* Export State Machine Status Feedback */}
          {jobState === 'PROCESSING' && (
            <div className="p-4 bg-purple-50 dark:bg-purple-950/40 rounded-2xl flex items-center gap-3 text-xs text-purple-900 dark:text-purple-300 font-bold animate-pulse">
              <Clock className="w-4 h-4 text-purple-600" />
              <span>Trạng thái: SUBMITTED ➔ GENERATING... Đang tổng hợp dữ liệu giao dịch.</span>
            </div>
          )}

          {jobState === 'READY' && (
            <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 rounded-2xl flex items-center gap-3 text-xs text-emerald-800 dark:text-emerald-200 font-bold">
              <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-emerald-600" />
              <span>Trạng thái: READY! File báo cáo đã được tự động tải xuống thành công.</span>
            </div>
          )}

          {jobState === 'ERROR' && (
            <div className="p-4 bg-red-50 rounded-2xl flex items-center gap-3 text-xs text-red-700 font-bold">
              <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-600" />
              <span>{errorMessage}</span>
            </div>
          )}
        </div>
      </div>
    </RoleGuard>
  );
}
