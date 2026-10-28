'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useTranslations, useLocale } from 'next-intl';
import { useAuth } from '../../../context/AuthContext';
import { api } from '../../../lib/api';
import { FlightCard } from '../../../components/public/FlightCard';
import { CompareModal } from '../../../components/public/CompareModal';
import {
  Filter,
  ArrowUpDown,
  Plane,
  AlertCircle,
  SlidersHorizontal,
  RefreshCw,
  Sparkles,
  Check,
  ChevronRight,
} from 'lucide-react';

export default function SearchResultsPage() {
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();

  const origin = searchParams.get('origin') || 'SGN';
  const destination = searchParams.get('destination') || 'HAN';
  const getTomorrowStr = () => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  };
  const departureDate = searchParams.get('departureDate') || getTomorrowStr();
  const returnDate = searchParams.get('returnDate') || null;
  const passengers = Number(searchParams.get('passengers') || '1');
  const cabinClass = searchParams.get('cabinClass') || 'ECONOMY';

  // Filters state
  const [minPrice, setMinPrice] = useState<number>(500000);
  const [maxPrice, setMaxPrice] = useState<number>(10000000);
  const [timeOfDay, setTimeOfDay] = useState<string>('');
  const [sortBy, setSortBy] = useState<string>('PRICE_ASC');

  // Comparison State (up to 3 flights)
  const [compareList, setCompareList] = useState<any[]>([]);
  const [compareModalOpen, setCompareModalOpen] = useState(false);

  // Data & loading state
  const [loading, setLoading] = useState(true);
  const [searchResult, setSearchResult] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchResults = () => {
    setLoading(true);
    setError(null);

    api
      .searchFlights({
        origin,
        destination,
        departureDate,
        returnDate: returnDate || undefined,
        passengers,
        cabinClass,
        minPrice,
        maxPrice,
        timeOfDay: timeOfDay || undefined,
        sortBy,
      })
      .then((data) => {
        setSearchResult(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || 'Không thể tìm chuyến bay');
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchResults();
  }, [origin, destination, departureDate, returnDate, passengers, cabinClass, timeOfDay, sortBy]);

  const handleToggleCompare = (flight: any) => {
    if (compareList.some((f) => f.id === flight.id)) {
      setCompareList(compareList.filter((f) => f.id !== flight.id));
    } else {
      if (compareList.length >= 3) {
        alert('Quý khách chỉ có thể so sánh tối đa 3 chuyến bay cùng lúc.');
        return;
      }
      setCompareList([...compareList, flight]);
    }
  };

  const { user } = useAuth();

  const handleSelectFare = (flight: any, selectedCabin: string, fare?: any) => {
    // Navigate to booking wizard with flight and cabin info
    const q = new URLSearchParams({
      outboundFlightId: flight.id,
      cabinClass: selectedCabin,
      passengers: String(passengers),
    });

    if (returnDate && searchResult?.returnFlights?.length > 0) {
      q.append('returnFlightId', searchResult.returnFlights[0].id);
    }

    const bookingTarget = `/${locale}/booking?${q.toString()}`;

    // Yêu cầu đăng nhập trước khi tiến hành đặt vé
    if (!user) {
      router.push(`/${locale}/auth/login?redirect=${encodeURIComponent(bookingTarget)}`);
      return;
    }

    router.push(bookingTarget);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Route Summary Header */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-100 dark:border-slate-800 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-bold text-primary-700 dark:text-primary-400">
            <Plane className="w-4 h-4" />
            <span>{t('search.directFleet')}</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <span>{origin}</span>
            <span className="text-slate-400">➔</span>
            <span>{destination}</span>
            {returnDate && (
              <>
                <span className="text-slate-300">|</span>
                <span className="text-base text-slate-500 font-semibold">{t('search.roundTripBadge')}</span>
              </>
            )}
          </h1>
          <p className="text-xs text-slate-500">
            {t('search.departurePrefix')}: <strong>{departureDate}</strong> {returnDate ? `· ${t('search.returnPrefix')}: ${returnDate}` : ''} · {t('search.seatsCount', { count: passengers })} · {t('search.cabinClass')}: {cabinClass}
          </p>
        </div>

        <button
          onClick={() => router.push(`/${locale}`)}
          className="px-4 py-2 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 transition cursor-pointer"
        >
          {t('search.changeSearch')}
        </button>
      </div>

      {/* Main Grid: Filters Sidebar + Flight Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar Filters */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-100 dark:border-slate-800 shadow-sm space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h2 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-primary-600" />
                <span>{t('search.filters')}</span>
              </h2>
              <button
                type="button"
                onClick={() => {
                  setTimeOfDay('');
                  setSortBy('PRICE_ASC');
                  setMinPrice(500000);
                  setMaxPrice(10000000);
                  fetchResults();
                }}
                className="text-[11px] font-semibold text-primary-600 hover:underline cursor-pointer"
              >
                {t('search.resetFilter')}
              </button>
            </div>

            {/* Sort by */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-200 block">
                {t('search.sortBy')}
              </label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none"
              >
                <option value="PRICE_ASC">{t('search.priceAsc')}</option>
                <option value="PRICE_DESC">{t('search.priceDesc')}</option>
                <option value="DURATION_ASC">{t('search.durationAsc')}</option>
                <option value="DEPARTURE_ASC">{t('search.departureAsc')}</option>
              </select>
            </div>

            {/* Time of Day */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-200 block">
                {t('search.timeOfDay')}
              </label>
              <div className="space-y-1.5 text-xs">
                {[
                  { value: '', label: t('search.allTimes') },
                  { value: 'MORNING', label: t('search.morning') },
                  { value: 'AFTERNOON', label: t('search.afternoon') },
                  { value: 'EVENING', label: t('search.evening') },
                ].map((item) => (
                  <label
                    key={item.value}
                    className="flex items-center gap-2 p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
                  >
                    <input
                      type="radio"
                      name="timeOfDay"
                      checked={timeOfDay === item.value}
                      onChange={() => setTimeOfDay(item.value)}
                      className="text-primary-600 focus:ring-primary-500"
                    />
                    <span className="text-slate-700 dark:text-slate-300 font-medium">
                      {item.label}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Price Range Slider */}
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-200">
                <span>{t('search.priceRange')}</span>
                <span className="text-primary-700 dark:text-primary-400 font-black">
                  {maxPrice.toLocaleString('vi-VN')} VND
                </span>
              </div>
              <input
                type="range"
                min={500000}
                max={15000000}
                step={200000}
                value={maxPrice}
                onChange={(e) => setMaxPrice(Number(e.target.value))}
                className="w-full accent-primary-600"
              />
              <button
                type="button"
                onClick={fetchResults}
                className="w-full py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-primary-50 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-bold transition cursor-pointer"
              >
                {t('search.applyPrice')}
              </button>
            </div>

            {/* Direct flight policy reminder */}
            <div className="p-3 bg-blue-50/60 dark:bg-blue-950/30 rounded-2xl border border-blue-100 dark:border-blue-900 text-[11px] text-blue-900 dark:text-blue-200 space-y-1">
              <span className="font-bold flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-gold-500" /> {t('search.directFleet')}
              </span>
              <p className="text-slate-600 dark:text-slate-400">
                {t('search.directFleetDesc')}
              </p>
            </div>
          </div>
        </div>

        {/* Flight Cards Column */}
        <div className="lg:col-span-3 space-y-4">
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((n) => (
                <div
                  key={n}
                  className="h-44 rounded-3xl skeleton-shimmer border border-slate-200 dark:border-slate-800"
                />
              ))}
            </div>
          ) : error ? (
            <div className="bg-red-50 dark:bg-red-950/40 rounded-3xl p-8 border border-red-200 dark:border-red-800 text-center space-y-3">
              <AlertCircle className="w-8 h-8 text-red-600 mx-auto" />
              <h3 className="text-base font-bold text-red-800 dark:text-red-200">
                {error === 'Failed to fetch'
                  ? t('search.serverConnectError')
                  : error}
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                {t('search.reconnectNotice')}
              </p>
              <button
                type="button"
                onClick={fetchResults}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary-900 hover:bg-primary-800 text-white text-xs font-bold rounded-xl shadow-md transition cursor-pointer"
              >
                <span>{t('search.retryNow')}</span>
              </button>
            </div>
          ) : searchResult?.outboundFlights?.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-12 border border-slate-100 dark:border-slate-800 text-center shadow-sm space-y-4">
              <Plane className="w-12 h-12 text-slate-300 mx-auto" />
              <h3 className="text-lg font-bold text-slate-800 dark:text-white">
                {t('search.noFlightsFound')}
              </h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                {t('search.noFlightsAdvice')}
              </p>
              <button
                onClick={() => router.push(`/${locale}`)}
                className="px-6 py-2.5 rounded-xl bg-primary-900 hover:bg-primary-800 text-white font-bold text-xs cursor-pointer"
              >
                {t('search.backHomeSelectDate')}
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Outbound Flights Section */}
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
                  <span>
                    {t('search.outboundTitle', { count: searchResult.outboundFlights.length })}
                  </span>
                </div>
                {searchResult.outboundFlights.map((flight: any) => (
                  <FlightCard
                    key={flight.id}
                    flight={flight}
                    onSelectFare={handleSelectFare}
                    isComparing={compareList.some((f) => f.id === flight.id)}
                    onToggleCompare={handleToggleCompare}
                  />
                ))}
              </div>

              {/* Return Flights Section (if round-trip) */}
              {searchResult.isRoundTrip && searchResult.returnFlights?.length > 0 && (
                <div className="space-y-3 pt-6 border-t border-slate-200 dark:border-slate-800">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
                    <span>
                      {t('search.returnTitle', {
                        origin: destination,
                        destination: origin,
                        count: searchResult.returnFlights.length,
                      })}
                    </span>
                  </div>
                  {searchResult.returnFlights.map((flight: any) => (
                    <FlightCard
                      key={flight.id}
                      flight={flight}
                      onSelectFare={handleSelectFare}
                      isComparing={compareList.some((f) => f.id === flight.id)}
                      onToggleCompare={handleToggleCompare}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Floating Compare Tray at Bottom */}
      {compareList.length > 0 && (
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-40 bg-slate-900/95 dark:bg-white/95 text-white dark:text-slate-900 px-6 py-3.5 rounded-full shadow-2xl backdrop-blur-md flex items-center gap-4 border border-white/20 animate-in slide-in-from-bottom">
          <div className="flex items-center gap-2 text-xs font-bold">
            <span className="w-5 h-5 rounded-full bg-gold-500 text-slate-900 flex items-center justify-center text-[10px]">
              {compareList.length}
            </span>
            <span>{t('search.compareTray', { count: compareList.length })}</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setCompareModalOpen(true)}
              className="px-4 py-1.5 rounded-full bg-gold-500 hover:bg-gold-600 text-slate-950 font-bold text-xs shadow-md transition"
            >
              {t('search.compareNow')}
            </button>
            <button
              onClick={() => setCompareList([])}
              className="p-1 rounded-full hover:bg-white/10 dark:hover:bg-slate-200 text-slate-400 text-xs"
              title={t('search.clearCompare')}
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Side-by-side comparison modal */}
      <CompareModal
        flights={compareList}
        isOpen={compareModalOpen}
        onClose={() => setCompareModalOpen(false)}
        onSelectFlight={handleSelectFare}
      />
    </div>
  );
}
