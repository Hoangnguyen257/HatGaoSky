'use client';

import React, { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { api } from '../../../../lib/api';
import { RoleGuard } from '../../../../components/layout/RoleGuard';
import {
  Plane,
  PlusCircle,
  AlertTriangle,
  Clock,
  Trash2,
  Ban,
  CheckCircle2,
  RefreshCw,
  X,
  AlertCircle,
} from 'lucide-react';

export default function StaffFlightsPage() {
  const t = useTranslations();
  const [flights, setFlights] = useState<any[]>([]);
  const [airports, setAirports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Create flight modal
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [flightNumber, setFlightNumber] = useState('VSK-208');
  const [originAirportId, setOriginAirportId] = useState('');
  const [destinationAirportId, setDestinationAirportId] = useState('');
  const [depTime, setDepTime] = useState('2026-11-01T08:00');
  const [arrTime, setArrTime] = useState('2026-11-01T10:15');
  const [durationMinutes, setDurationMinutes] = useState(135);
  const [economyPrice, setEconomyPrice] = useState(1500000);
  const [businessPrice, setBusinessPrice] = useState(4200000);

  // Disable flight modal
  const [disableModalOpen, setDisableModalOpen] = useState(false);
  const [selectedFlightId, setSelectedFlightId] = useState<string | null>(null);
  const [disableReason, setDisableReason] = useState('Kế hoạch điều hành khai thác thay đổi');

  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const loadFlights = async () => {
    setLoading(true);
    try {
      const [fData, apData] = await Promise.all([api.getAllFlights(), api.getAirports()]);
      setFlights(fData);
      setAirports(apData);
      if (apData.length >= 2) {
        setOriginAirportId(apData[0].id);
        setDestinationAirportId(apData[1].id);
      }
      setLoading(false);
    } catch {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFlights();
  }, []);

  const handleCreateFlight = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    try {
      // Use existing aircraft ID from first flight or default
      const aircraftId = flights[0]?.aircraftId || 'dreamliner';

      await api.createFlight({
        flightNumber,
        aircraftId,
        originAirportId,
        destinationAirportId,
        departureTime: new Date(depTime).toISOString(),
        arrivalTime: new Date(arrTime).toISOString(),
        durationMinutes,
        fares: [
          { cabinClass: 'ECONOMY', basePrice: economyPrice, availableSeats: 150 },
          { cabinClass: 'BUSINESS', basePrice: businessPrice, availableSeats: 20 },
        ],
      });

      setMessage({ type: 'success', text: `Tạo thành công chuyến bay ${flightNumber}!` });
      setCreateModalOpen(false);
      loadFlights();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Lỗi tạo chuyến bay' });
    }
  };

  const handleDisableFlight = async () => {
    if (!selectedFlightId) return;
    setMessage(null);

    try {
      await api.disableFlight(selectedFlightId, disableReason);
      setMessage({
        type: 'success',
        text: 'Vô hiệu hóa chuyến bay thành công. Hệ thống đã tự động gửi email thông báo hủy đến tất cả hành khách!',
      });
      setDisableModalOpen(false);
      loadFlights();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Không thể vô hiệu hóa' });
      setDisableModalOpen(false);
    }
  };

  return (
    <RoleGuard allowedRoles={['STAFF', 'STAFF_MANAGER', 'ADMIN']}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
        {/* Title & Add Button */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-primary-700 dark:text-primary-400">
              <Plane className="w-4 h-4" />
              <span>Operations Portal</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-1">
              Quản lý chuyến bay & Lịch bay
            </h1>
          </div>

          <button
            onClick={() => setCreateModalOpen(true)}
            className="px-4 py-2 bg-primary-900 hover:bg-primary-800 text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-2 transition"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Thêm chuyến bay mới</span>
          </button>
        </div>

        {/* Status message */}
        {message && (
          <div
            className={`p-4 rounded-2xl flex items-center gap-3 text-xs font-bold ${
              message.type === 'success'
                ? 'bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
                : 'bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300'
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

        {/* Flights Table */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 text-slate-500 font-semibold">
                <tr>
                  <th className="p-4">Số hiệu</th>
                  <th className="p-4">Tàu bay</th>
                  <th className="p-4">Hành trình</th>
                  <th className="p-4">Khởi hành</th>
                  <th className="p-4">Đến nơi</th>
                  <th className="p-4">Trạng thái</th>
                  <th className="p-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {flights.map((f) => (
                  <tr key={f.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                    <td className="p-4 font-black text-primary-900 dark:text-white">
                      {f.flightNumber}
                    </td>
                    <td className="p-4 text-slate-600 dark:text-slate-300">
                      {f.aircraft?.model}
                    </td>
                    <td className="p-4 font-bold text-slate-800 dark:text-slate-200">
                      {f.originAirport?.code} ➔ {f.destinationAirport?.code}
                    </td>
                    <td className="p-4 text-slate-600 dark:text-slate-300">
                      {new Date(f.departureTime).toLocaleString('vi-VN')}
                    </td>
                    <td className="p-4 text-slate-600 dark:text-slate-300">
                      {new Date(f.arrivalTime).toLocaleString('vi-VN')}
                    </td>
                    <td className="p-4">
                      <span
                        className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] ${
                          f.isDisabled
                            ? 'bg-red-100 text-red-800'
                            : f.status === 'SCHEDULED'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {f.isDisabled ? 'ĐÃ HỦY' : f.status}
                      </span>
                    </td>
                    <td className="p-4 text-right space-x-2">
                      {!f.isDisabled && (
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedFlightId(f.id);
                            setDisableModalOpen(true);
                          }}
                          className="px-2.5 py-1 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg font-bold text-[11px] transition"
                        >
                          Hủy bay
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal: Create Flight */}
        {createModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in">
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 max-w-xl w-full border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
              <div className="flex justify-between items-center border-b pb-3">
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Plane className="w-5 h-5 text-primary-600" />
                  <span>Tạo chuyến bay mới (Kiểm tra xung đột máy bay)</span>
                </h3>
                <button onClick={() => setCreateModalOpen(false)}>
                  <X className="w-5 h-5 text-slate-400" />
                </button>
              </div>

              <form onSubmit={handleCreateFlight} className="space-y-4 text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-semibold text-slate-600 dark:text-slate-300 block mb-1">
                      Số hiệu chuyến bay *
                    </label>
                    <input
                      type="text"
                      value={flightNumber}
                      onChange={(e) => setFlightNumber(e.target.value.toUpperCase())}
                      className="w-full bg-slate-50 dark:bg-slate-800 border rounded-xl p-2.5 font-bold uppercase"
                      required
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-slate-600 dark:text-slate-300 block mb-1">
                      Thời lượng bay (phút)
                    </label>
                    <input
                      type="number"
                      value={durationMinutes}
                      onChange={(e) => setDurationMinutes(Number(e.target.value))}
                      className="w-full bg-slate-50 dark:bg-slate-800 border rounded-xl p-2.5 font-bold"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-semibold text-slate-600 dark:text-slate-300 block mb-1">
                      Sân bay đi *
                    </label>
                    <select
                      value={originAirportId}
                      onChange={(e) => setOriginAirportId(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800 border rounded-xl p-2.5 font-bold"
                    >
                      {airports.map((ap) => (
                        <option key={ap.id} value={ap.id}>
                          {ap.city} ({ap.code})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="font-semibold text-slate-600 dark:text-slate-300 block mb-1">
                      Sân bay đến *
                    </label>
                    <select
                      value={destinationAirportId}
                      onChange={(e) => setDestinationAirportId(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800 border rounded-xl p-2.5 font-bold"
                    >
                      {airports.map((ap) => (
                        <option key={ap.id} value={ap.id}>
                          {ap.city} ({ap.code})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-semibold text-slate-600 dark:text-slate-300 block mb-1">
                      Thời gian cất cánh *
                    </label>
                    <input
                      type="datetime-local"
                      value={depTime}
                      onChange={(e) => setDepTime(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800 border rounded-xl p-2.5 font-bold"
                      required
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-slate-600 dark:text-slate-300 block mb-1">
                      Thời gian hạ cánh *
                    </label>
                    <input
                      type="datetime-local"
                      value={arrTime}
                      onChange={(e) => setArrTime(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800 border rounded-xl p-2.5 font-bold"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-semibold text-slate-600 dark:text-slate-300 block mb-1">
                      Giá vé Economy (VND)
                    </label>
                    <input
                      type="number"
                      step={50000}
                      value={economyPrice}
                      onChange={(e) => setEconomyPrice(Number(e.target.value))}
                      className="w-full bg-slate-50 dark:bg-slate-800 border rounded-xl p-2.5 font-bold"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-slate-600 dark:text-slate-300 block mb-1">
                      Giá vé Business (VND)
                    </label>
                    <input
                      type="number"
                      step={100000}
                      value={businessPrice}
                      onChange={(e) => setBusinessPrice(Number(e.target.value))}
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
                    Tạo chuyến bay
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Disable Flight */}
        {disableModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in">
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4 text-xs">
              <h3 className="text-base font-bold text-red-600 flex items-center gap-2">
                <Ban className="w-5 h-5" />
                <span>Hủy / Vô hiệu hóa chuyến bay</span>
              </h3>
              <p className="text-slate-600 dark:text-slate-300">
                Khi thực hiện, chuyến bay sẽ bị hủy và hệ thống sẽ tự động gửi email thông báo hủy vé đến toàn bộ hành khách đã mua vé.
              </p>
              <div>
                <label className="font-semibold text-slate-500 block mb-1">Lý do hủy bay</label>
                <textarea
                  value={disableReason}
                  onChange={(e) => setDisableReason(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border rounded-xl p-2.5 h-20"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={() => setDisableModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 font-bold"
                >
                  Hủy bỏ
                </button>
                <button
                  onClick={handleDisableFlight}
                  className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold"
                >
                  Xác nhận hủy chuyến bay
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </RoleGuard>
  );
}
