'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations, useLocale } from 'next-intl';
import { api } from '../../lib/api';
import {
  PlaneTakeoff,
  PlaneLanding,
  Calendar,
  Users,
  ArrowLeftRight,
  Search,
  Sparkles,
  AlertCircle,
} from 'lucide-react';

export const SearchWidget: React.FC = () => {
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();

  const [airports, setAirports] = useState<any[]>([]);
  const [isRoundTrip, setIsRoundTrip] = useState(true);
  const [origin, setOrigin] = useState('SGN');
  const [destination, setDestination] = useState('HAN');

  // Default dates: tomorrow and 3 days from tomorrow
  const getTomorrowStr = () => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  };

  const getReturnStr = () => {
    const d = new Date();
    d.setDate(d.getDate() + 4);
    return d.toISOString().split('T')[0];
  };

  const [departureDate, setDepartureDate] = useState(getTomorrowStr());
  const [returnDate, setReturnDate] = useState(getReturnStr());
  const [passengers, setPassengers] = useState(1);
  const [cabinClass, setCabinClass] = useState('ECONOMY');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    api
      .getAirports()
      .then((data) => setAirports(data))
      .catch(() => {
        // Fallback default list
        setAirports([
          { code: 'SGN', city: 'Hồ Chí Minh', name: 'Tân Sơn Nhất' },
          { code: 'HAN', city: 'Hà Nội', name: 'Nội Bài' },
          { code: 'DAD', city: 'Đà Nẵng', name: 'Đà Nẵng' },
          { code: 'CXR', city: 'Nha Trang', name: 'Cam Ranh' },
          { code: 'PQC', city: 'Phú Quốc', name: 'Phú Quốc' },
          { code: 'BKK', city: 'Bangkok', name: 'Suvarnabhumi' },
          { code: 'SIN', city: 'Singapore', name: 'Changi' },
          { code: 'ICN', city: 'Seoul', name: 'Incheon' },
          { code: 'NRT', city: 'Tokyo', name: 'Narita' },
        ]);
      });
  }, []);

  const handleSwapAirports = () => {
    const temp = origin;
    setOrigin(destination);
    setDestination(temp);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (origin === destination) {
      setErrorMessage(t('search.sameOriginDest'));
      return;
    }

    const todayStr = new Date().toISOString().split('T')[0];
    if (departureDate < todayStr) {
      setErrorMessage(t('search.pastDeparture'));
      return;
    }

    if (isRoundTrip && returnDate < departureDate) {
      setErrorMessage(t('search.invalidReturn'));
      return;
    }

    if (passengers < 1) {
      setErrorMessage(t('search.minPassengers'));
      return;
    }

    const q = new URLSearchParams({
      origin,
      destination,
      departureDate,
      passengers: String(passengers),
      cabinClass,
    });

    if (isRoundTrip && returnDate) {
      q.append('returnDate', returnDate);
    }

    router.push(`/${locale}/search?${q.toString()}`);
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-premium p-6 sm:p-8 border border-slate-100 dark:border-slate-800 transition">
      {/* Trip Type Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6 border-b border-slate-100 dark:border-slate-800 pb-4">
        <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
          <button
            type="button"
            onClick={() => setIsRoundTrip(true)}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition ${
              isRoundTrip
                ? 'bg-primary-900 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-300 hover:text-primary-900'
            }`}
          >
            {t('search.roundTrip')}
          </button>
          <button
            type="button"
            onClick={() => setIsRoundTrip(false)}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition ${
              !isRoundTrip
                ? 'bg-primary-900 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-300 hover:text-primary-900'
            }`}
          >
            {t('search.oneWay')}
          </button>
        </div>

        {/* Cabin Class Selection */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 font-medium hidden sm:inline">
            {t('search.cabinClass')}:
          </span>
          <select
            value={cabinClass}
            onChange={(e) => setCabinClass(e.target.value)}
            className="bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-semibold px-3 py-2 rounded-xl border-none focus:ring-2 focus:ring-primary-600"
          >
            <option value="ECONOMY">{t('search.economy')}</option>
            <option value="BUSINESS">{t('search.business')}</option>
            <option value="FIRST">{t('search.first')}</option>
          </select>
        </div>
      </div>

      {/* Error alert */}
      {errorMessage && (
        <div className="mb-6 p-3.5 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-xl flex items-center gap-2.5 text-xs text-red-700 dark:text-red-300">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Main Search Inputs Form */}
      <form onSubmit={handleSearch} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Origin & Destination with Swap button */}
          <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-2 relative">
            {/* Origin */}
            <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700">
              <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                {t('search.origin')}
              </label>
              <div className="flex items-center gap-2">
                <PlaneTakeoff className="w-5 h-5 text-primary-600 flex-shrink-0" />
                <select
                  value={origin}
                  onChange={(e) => setOrigin(e.target.value)}
                  className="w-full bg-transparent font-bold text-slate-900 dark:text-white text-sm focus:outline-none cursor-pointer"
                >
                  {airports.map((ap) => (
                    <option key={ap.code} value={ap.code}>
                      {ap.city} ({ap.code}) — {ap.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Swap Button */}
            <button
              type="button"
              onClick={handleSwapAirports}
              aria-label="Swap departure and arrival airports"
              className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-white dark:bg-slate-700 shadow-md border border-slate-200 dark:border-slate-600 flex items-center justify-center text-primary-700 hover:rotate-180 transition-transform duration-300 hidden sm:flex"
            >
              <ArrowLeftRight className="w-3.5 h-3.5" />
            </button>

            {/* Destination */}
            <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700">
              <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                {t('search.destination')}
              </label>
              <div className="flex items-center gap-2">
                <PlaneLanding className="w-5 h-5 text-gold-500 flex-shrink-0" />
                <select
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  className="w-full bg-transparent font-bold text-slate-900 dark:text-white text-sm focus:outline-none cursor-pointer"
                >
                  {airports.map((ap) => (
                    <option key={ap.code} value={ap.code}>
                      {ap.city} ({ap.code}) — {ap.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Departure Date */}
          <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700">
            <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
              {t('search.departureDate')}
            </label>
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary-600 flex-shrink-0" />
              <input
                type="date"
                value={departureDate}
                min={new Date().toISOString().split('T')[0]}
                onChange={(e) => setDepartureDate(e.target.value)}
                className="w-full bg-transparent font-bold text-slate-900 dark:text-white text-sm focus:outline-none cursor-pointer"
              />
            </div>
          </div>

          {/* Return Date or Passengers */}
          {isRoundTrip ? (
            <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700">
              <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                {t('search.returnDate')}
              </label>
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-gold-500 flex-shrink-0" />
                <input
                  type="date"
                  value={returnDate}
                  min={departureDate}
                  onChange={(e) => setReturnDate(e.target.value)}
                  className="w-full bg-transparent font-bold text-slate-900 dark:text-white text-sm focus:outline-none cursor-pointer"
                />
              </div>
            </div>
          ) : (
            <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700">
              <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                {t('search.passengers')}
              </label>
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-primary-600 flex-shrink-0" />
                <select
                  value={passengers}
                  onChange={(e) => setPassengers(Number(e.target.value))}
                  className="w-full bg-transparent font-bold text-slate-900 dark:text-white text-sm focus:outline-none cursor-pointer"
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                    <option key={num} value={num}>
                      {num} {t('search.passengers').toLowerCase()}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Row 2: Passengers (when round trip) and Submit Button */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
          {isRoundTrip && (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700">
                <Users className="w-4 h-4 text-primary-600" />
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  {t('search.passengers')}:
                </span>
                <select
                  value={passengers}
                  onChange={(e) => setPassengers(Number(e.target.value))}
                  className="bg-transparent font-bold text-slate-900 dark:text-white text-xs focus:outline-none cursor-pointer"
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                    <option key={num} value={num}>
                      {num} {t('search.passengers').toLowerCase()}
                    </option>
                  ))}
                </select>
              </div>
              <span className="text-xs text-slate-400 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-gold-500" /> {t('search.directPricingNote')}
              </span>
            </div>
          )}

          <div className="ml-auto w-full sm:w-auto">
            <button
              type="submit"
              className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-primary-900 to-primary-700 hover:from-primary-800 hover:to-primary-600 text-white font-bold text-sm shadow-lg hover:shadow-glow flex items-center justify-center gap-2.5 transition transform hover:-translate-y-0.5"
            >
              <Search className="w-4 h-4" />
              <span>{t('search.searchButton')}</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};
