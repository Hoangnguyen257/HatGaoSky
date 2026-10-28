'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useTranslations, useLocale } from 'next-intl';
import { useAuth } from '../../../../context/AuthContext';
import { api } from '../../../../lib/api';
import {
  Plane,
  Clock,
  Luggage,
  ShieldCheck,
  ChevronRight,
  ArrowLeft,
  Sparkles,
  Award,
} from 'lucide-react';

export default function FlightDetailPage() {
  const params = useParams();
  const id = params?.id as string;
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();
  const { user } = useAuth();

  const [flight, setFlight] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    api
      .getFlightDetail(id)
      .then((data) => {
        setFlight(data);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, [id]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <div className="w-10 h-10 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-xs text-slate-500 font-medium">{t('common.loading')}</p>
      </div>
    );
  }

  if (!flight) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center space-y-4">
        <h2 className="text-xl font-bold text-slate-800 dark:text-white">Không tìm thấy chuyến bay</h2>
        <Link href={`/${locale}`} className="text-primary-600 font-bold text-xs hover:underline">
          Quay lại trang chủ
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div>
        <Link
          href={`/${locale}`}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-primary-700 mb-3"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Quay lại
        </Link>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white flex items-center gap-3">
          <span>Chuyến bay {flight.flightNumber}</span>
          <span className="text-xs font-bold px-3 py-1 bg-primary-100 text-primary-800 rounded-full">
            {flight.aircraft?.model}
          </span>
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          {flight.originAirport?.city} ({flight.originAirport?.code}) ➔ {flight.destinationAirport?.city} ({flight.destinationAirport?.code})
        </p>
      </div>

      {/* Itinerary Schedule Card */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-100 dark:border-slate-800 shadow-premium space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-6 pb-6 border-b border-slate-100 dark:border-slate-800">
          <div>
            <span className="text-xs text-slate-400 block">Khởi hành</span>
            <div className="text-3xl font-black text-slate-900 dark:text-white">
              {new Date(flight.departureTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
            </div>
            <div className="text-xs font-bold text-slate-700 dark:text-slate-300 mt-1">
              {flight.originAirport?.name} ({flight.originAirport?.terminal || 'Nhà ga T1'})
            </div>
          </div>

          <div className="text-center">
            <span className="text-xs font-bold text-slate-400 flex items-center gap-1 justify-center">
              <Clock className="w-3.5 h-3.5" /> {flight.durationMinutes} phút
            </span>
            <div className="w-36 h-0.5 bg-slate-200 dark:bg-slate-700 my-2 relative">
              <Plane className="w-4 h-4 text-primary-600 absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2" />
            </div>
            <span className="text-[10px] font-bold text-emerald-600">Bay thẳng trực tiếp</span>
          </div>

          <div className="text-right">
            <span className="text-xs text-slate-400 block">Hạ cánh</span>
            <div className="text-3xl font-black text-slate-900 dark:text-white">
              {new Date(flight.arrivalTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
            </div>
            <div className="text-xs font-bold text-slate-700 dark:text-slate-300 mt-1">
              {flight.destinationAirport?.name} ({flight.destinationAirport?.terminal || 'Nhà ga T1'})
            </div>
          </div>
        </div>

        {/* Fares & Policies */}
        <div className="space-y-4">
          <h3 className="font-bold text-sm text-slate-900 dark:text-white">
            Các hạng vé có sẵn & Chính sách hành lý
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {flight.fares?.map((fare: any) => (
              <div
                key={fare.id}
                className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 space-y-3"
              >
                <div className="flex justify-between items-center">
                  <span className="text-xs font-extrabold text-primary-900 dark:text-gold-400 uppercase">
                    Hạng {fare.cabinClass}
                  </span>
                  <span className="text-[11px] text-slate-400">
                    còn {fare.availableSeats} ghế
                  </span>
                </div>

                <div className="text-2xl font-black text-slate-900 dark:text-white">
                  {fare.basePrice.toLocaleString('vi-VN')} <span className="text-xs font-normal text-slate-500">VND</span>
                </div>

                <div className="space-y-1 text-xs text-slate-600 dark:text-slate-300 pt-2 border-t border-slate-200 dark:border-slate-700">
                  <div className="flex items-center gap-1.5">
                    <Luggage className="w-3.5 h-3.5 text-primary-600" />
                    <span>Hành lý: {fare.baggageAllowanceKg}kg ký gửi + {fare.cabinBaggageKg}kg xách tay</span>
                  </div>
                  <div>• Phí đổi vé: {fare.changeFee?.toLocaleString()} VND</div>
                  <div>• Phí hoàn vé: {fare.refundFee?.toLocaleString()} VND</div>
                </div>

                <button
                  onClick={() => {
                    const bookingTarget = `/${locale}/booking?outboundFlightId=${flight.id}&cabinClass=${fare.cabinClass}&passengers=1`;
                    if (!user) {
                      router.push(`/${locale}/auth/login?redirect=${encodeURIComponent(bookingTarget)}`);
                      return;
                    }
                    router.push(bookingTarget);
                  }}
                  className="w-full mt-3 py-2.5 bg-primary-900 hover:bg-primary-800 text-white font-bold text-xs rounded-xl shadow-sm transition flex items-center justify-center gap-1.5"
                >
                  <span>Đặt vé hạng {fare.cabinClass}</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
