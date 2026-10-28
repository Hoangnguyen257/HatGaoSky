'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { X, Check, Plane, Luggage, RefreshCw, XCircle } from 'lucide-react';

interface CompareModalProps {
  flights: any[];
  isOpen: boolean;
  onClose: () => void;
  onSelectFlight: (flight: any, cabinClass: string) => void;
}

export const CompareModal: React.FC<CompareModalProps> = ({
  flights,
  isOpen,
  onClose,
  onSelectFlight,
}) => {
  const t = useTranslations();
  if (!isOpen || flights.length === 0) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-5xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Plane className="w-5 h-5 text-primary-600" />
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Bảng so sánh chi tiết các chuyến bay Hạt Gạo Sky ({flights.length}/3)
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content / Comparison Table */}
        <div className="p-6 overflow-x-auto flex-1">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800">
                <th className="p-3 font-semibold text-slate-400 uppercase tracking-wider w-44">
                  Tiêu chí so sánh
                </th>
                {flights.map((f) => (
                  <th key={f.id} className="p-3 text-sm font-bold text-slate-900 dark:text-white">
                    <div className="text-primary-700 dark:text-primary-400">{f.flightNumber}</div>
                    <div className="text-[11px] font-normal text-slate-500">{f.aircraft?.model}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {/* Hành trình */}
              <tr>
                <td className="p-3 font-semibold text-slate-600 dark:text-slate-300">Hành trình</td>
                {flights.map((f) => (
                  <td key={f.id} className="p-3 font-bold text-slate-800 dark:text-slate-100">
                    {f.originAirport?.city} ({f.originAirport?.code}) ➔ {f.destinationAirport?.city} ({f.destinationAirport?.code})
                  </td>
                ))}
              </tr>

              {/* Giờ khởi hành & đến */}
              <tr>
                <td className="p-3 font-semibold text-slate-600 dark:text-slate-300">Giờ cất cánh - hạ cánh</td>
                {flights.map((f) => (
                  <td key={f.id} className="p-3">
                    <strong className="text-sm text-slate-900 dark:text-white">
                      {new Date(f.departureTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                    </strong>{' '}
                    ➔{' '}
                    <strong className="text-sm text-slate-900 dark:text-white">
                      {new Date(f.arrivalTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                    </strong>
                    <div className="text-slate-400 text-[10px]">Thời gian bay: {f.durationMinutes} phút</div>
                  </td>
                ))}
              </tr>

              {/* Hạng Phổ thông (Economy) */}
              <tr className="bg-slate-50/60 dark:bg-slate-800/30">
                <td className="p-3 font-semibold text-primary-700 dark:text-primary-400">
                  Giá vé Phổ thông (Economy)
                </td>
                {flights.map((f) => {
                  const fare = f.fares?.find((fa: any) => fa.cabinClass === 'ECONOMY');
                  return (
                    <td key={f.id} className="p-3">
                      {fare ? (
                        <div>
                          <div className="text-sm font-extrabold text-slate-900 dark:text-white">
                            {fare.basePrice.toLocaleString('vi-VN')} VND
                          </div>
                          <div className="text-[10px] text-slate-500">
                            {fare.baggageAllowanceKg}kg ký gửi · {fare.availableSeats} ghế trống
                          </div>
                          <button
                            onClick={() => {
                              onSelectFlight(f, 'ECONOMY');
                              onClose();
                            }}
                            className="mt-2 px-3 py-1 bg-primary-900 text-white rounded-lg text-[11px] font-bold"
                          >
                            Chọn Economy
                          </button>
                        </div>
                      ) : (
                        <span className="text-slate-400">Không có sẵn</span>
                      )}
                    </td>
                  );
                })}
              </tr>

              {/* Hạng Thương gia (Business) */}
              <tr className="bg-purple-50/40 dark:bg-purple-950/20">
                <td className="p-3 font-semibold text-purple-700 dark:text-purple-400">
                  Giá vé Thương gia (Business)
                </td>
                {flights.map((f) => {
                  const fare = f.fares?.find((fa: any) => fa.cabinClass === 'BUSINESS');
                  return (
                    <td key={f.id} className="p-3">
                      {fare ? (
                        <div>
                          <div className="text-sm font-extrabold text-purple-900 dark:text-purple-200">
                            {fare.basePrice.toLocaleString('vi-VN')} VND
                          </div>
                          <div className="text-[10px] text-slate-500">
                            {fare.baggageAllowanceKg}kg ký gửi · Phòng chờ Lotus Lounge
                          </div>
                          <button
                            onClick={() => {
                              onSelectFlight(f, 'BUSINESS');
                              onClose();
                            }}
                            className="mt-2 px-3 py-1 bg-purple-700 text-white rounded-lg text-[11px] font-bold"
                          >
                            Chọn Business
                          </button>
                        </div>
                      ) : (
                        <span className="text-slate-400">Không có sẵn</span>
                      )}
                    </td>
                  );
                })}
              </tr>

              {/* Điều kiện hoàn vé & đổi vé */}
              <tr>
                <td className="p-3 font-semibold text-slate-600 dark:text-slate-300">Điều kiện đổi / hoàn vé</td>
                {flights.map((f) => (
                  <td key={f.id} className="p-3 space-y-1 text-[11px] text-slate-600 dark:text-slate-300">
                    <div>• Phí đổi vé: 200.000 VND + chênh lệch giá (nếu có)</div>
                    <div>• Phí hoàn vé: 300.000 VND / vé trước giờ bay</div>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
