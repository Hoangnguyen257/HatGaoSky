'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { Plane, Clock, Luggage, CheckCircle2, ChevronRight, ShieldCheck } from 'lucide-react';

interface FlightCardProps {
  flight: any;
  onSelectFare: (flight: any, cabinClass: string, fare: any) => void;
  isComparing: boolean;
  onToggleCompare: (flight: any) => void;
}

export const FlightCard: React.FC<FlightCardProps> = ({
  flight,
  onSelectFare,
  isComparing,
  onToggleCompare,
}) => {
  const t = useTranslations();

  const depTime = new Date(flight.departureTime);
  const arrTime = new Date(flight.arrivalTime);

  const formatHours = (d: Date) =>
    d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });

  const formatDuration = (mins: number) => {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return `${h}g ${m > 0 ? `${m}p` : ''}`;
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-sm hover:shadow-premium transition">
      {/* Top Bar: Flight Number, Aircraft & Compare Button */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5 pb-4 border-b border-slate-100 dark:border-slate-800 text-xs">
        <div className="flex items-center gap-2.5">
          <span className="font-extrabold text-sm text-primary-900 dark:text-white bg-primary-50 dark:bg-primary-950/60 px-2.5 py-1 rounded-lg">
            {flight.flightNumber}
          </span>
          <span className="text-slate-400 font-medium">·</span>
          <span className="font-medium text-slate-600 dark:text-slate-300">
            {flight.aircraft?.model || 'Boeing 787-9'}
          </span>
          <span className="text-emerald-700 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded text-[11px] font-bold">
            {t('search.directNonStop')}
          </span>
        </div>

        <button
          type="button"
          onClick={() => onToggleCompare(flight)}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition border ${
            isComparing
              ? 'bg-gold-500 text-slate-900 border-gold-600 shadow-sm'
              : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-gold-500'
          }`}
        >
          <CheckCircle2 className={`w-3.5 h-3.5 ${isComparing ? 'text-slate-900' : 'text-slate-400'}`} />
          <span>{isComparing ? t('search.compared') : t('search.addToCompare')}</span>
        </button>
      </div>

      {/* Center: Itinerary Times & Timeline */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center mb-6">
        {/* Timeline */}
        <div className="lg:col-span-5 flex items-center justify-between gap-3">
          {/* Departure */}
          <div>
            <div className="text-2xl font-black text-slate-900 dark:text-white">
              {formatHours(depTime)}
            </div>
            <div className="text-sm font-bold text-slate-800 dark:text-slate-200">
              {flight.originAirport?.code}
            </div>
            <div className="text-xs text-slate-500">{flight.originAirport?.city}</div>
          </div>

          {/* Line & Plane */}
          <div className="flex-1 px-4 flex flex-col items-center">
            <span className="text-[11px] font-semibold text-slate-400 mb-1">
              {formatDuration(flight.durationMinutes)}
            </span>
            <div className="w-full flex items-center">
              <div className="h-0.5 w-full bg-slate-200 dark:bg-slate-700 relative">
                <Plane className="w-4 h-4 text-primary-600 absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2" />
              </div>
            </div>
            <span className="text-[10px] text-emerald-600 font-semibold mt-1">
              {t('search.onTime')}
            </span>
          </div>

          {/* Arrival */}
          <div className="text-right">
            <div className="text-2xl font-black text-slate-900 dark:text-white">
              {formatHours(arrTime)}
            </div>
            <div className="text-sm font-bold text-slate-800 dark:text-slate-200">
              {flight.destinationAirport?.code}
            </div>
            <div className="text-xs text-slate-500">{flight.destinationAirport?.city}</div>
          </div>
        </div>

        {/* Fares Matrix */}
        <div className="lg:col-span-7 grid grid-cols-2 sm:grid-cols-3 gap-2.5">
          {flight.fares?.map((fare: any) => {
            const isFirst = fare.cabinClass === 'FIRST';
            const isBusiness = fare.cabinClass === 'BUSINESS';

            return (
              <div
                key={fare.id}
                className={`p-3 rounded-2xl border transition flex flex-col justify-between ${
                  isBusiness
                    ? 'border-purple-200 dark:border-purple-900 bg-purple-50/40 dark:bg-purple-950/20'
                    : isFirst
                    ? 'border-gold-300 dark:border-gold-900 bg-gold-50/40 dark:bg-gold-950/20'
                    : 'border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/40 hover:border-primary-400'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span
                      className={`text-[11px] font-extrabold uppercase tracking-wider ${
                        isBusiness
                          ? 'text-purple-700 dark:text-purple-400'
                          : isFirst
                          ? 'text-gold-700 dark:text-gold-400'
                          : 'text-primary-700 dark:text-primary-400'
                      }`}
                    >
                      {fare.cabinClass}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {t('search.seatsCount', { count: fare.availableSeats })}
                    </span>
                  </div>
                  <div className="text-sm font-black text-slate-900 dark:text-white">
                    {fare.basePrice.toLocaleString('vi-VN')}{' '}
                    <span className="text-[10px] font-normal text-slate-500">VND</span>
                  </div>
                  <div className="flex items-center gap-1 text-[10px] text-slate-500 mt-1">
                    <Luggage className="w-3 h-3 text-slate-400" />
                    <span>
                      {t('search.baggageDesc', {
                        checked: fare.baggageAllowanceKg,
                        carry: fare.cabinBaggageKg,
                      })}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => onSelectFare(flight, fare.cabinClass, fare)}
                  className={`mt-3 w-full py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer ${
                    isBusiness
                      ? 'bg-purple-700 hover:bg-purple-800 text-white shadow-sm'
                      : isFirst
                      ? 'bg-gold-500 hover:bg-gold-600 text-slate-900 shadow-sm'
                      : 'bg-primary-900 hover:bg-primary-800 text-white'
                  }`}
                >
                  <span>{t('search.selectFareBtn')}</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
