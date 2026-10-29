'use client';

import React, { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { api } from '../../lib/api';
import { Clock, ShieldCheck, AlertCircle, Sparkles } from 'lucide-react';

interface SeatMapProps {
  flightId: string;
  cabinClass: string;
  requiredSeatsCount: number;
  sessionId: string;
  onSeatsSelected: (seats: string[], seatDetails?: { seatNumber: string; cabinClass: string }[]) => void;
  initialSelectedSeats?: string[];
}

export const SeatMap: React.FC<SeatMapProps> = ({
  flightId,
  cabinClass,
  requiredSeatsCount,
  sessionId,
  onSeatsSelected,
  initialSelectedSeats = [],
}) => {
  const t = useTranslations();
  const [seatData, setSeatData] = useState<any | null>(null);
  const [selectedSeats, setSelectedSeats] = useState<string[]>(initialSelectedSeats);
  const [holdTtlSeconds, setHoldTtlSeconds] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadSeats = (isRetry = false) => {
    setLoading(true);
    setError(null);
    api
      .getFlightSeats(flightId)
      .then((data) => {
        setSeatData(data);
        setLoading(false);
      })
      .catch((err) => {
        if (!isRetry) {
          // Automatic 1x silent retry after 1s in case server was in transient warmup
          setTimeout(() => loadSeats(true), 1200);
          return;
        }
        setError(err.message || 'Không thể tải sơ đồ chỗ ngồi');
        setLoading(false);
      });
  };

  // Fetch seats on mount
  useEffect(() => {
    if (flightId) {
      loadSeats();
    }
  }, [flightId]);

  // Hold Countdown timer
  useEffect(() => {
    if (holdTtlSeconds === null || holdTtlSeconds <= 0) return;
    const interval = setInterval(() => {
      setHoldTtlSeconds((prev) => (prev && prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [holdTtlSeconds]);

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const holdTimeoutRef = React.useRef<any>(null);

  const handleSeatClick = (seat: any) => {
    if (seat.status === 'BOOKED') return;
    if (seat.status === 'HELD' && seat.heldBySessionId !== sessionId) return;

    let newSelected: string[];
    if (selectedSeats.includes(seat.seatNumber)) {
      newSelected = selectedSeats.filter((s) => s !== seat.seatNumber);
    } else {
      if (selectedSeats.length >= requiredSeatsCount) {
        // Keep most recently chosen seats up to requiredSeatsCount
        newSelected = [...selectedSeats.slice(1), seat.seatNumber];
      } else {
        newSelected = [...selectedSeats, seat.seatNumber];
      }
    }

    // 1. Optimistically update local state & parent callback immediately (0ms delay, instantaneous price update)
    setSelectedSeats(newSelected);
    const allSeats: any[] = seatData?.seats || [];
    const newSelectedDetails = newSelected.map((num) => {
      const found = allSeats.find((s: any) => s.seatNumber === num);
      const cabin = (num === seat.seatNumber ? seat.cabinClass : found?.cabinClass) || 'ECONOMY';
      return {
        seatNumber: num,
        cabinClass: cabin as string,
      };
    });
    onSeatsSelected(newSelected, newSelectedDetails);

    // 2. Debounce server hold call by 300ms so rapid clicking never floods SQLite with overlapping transactions
    if (holdTimeoutRef.current) {
      clearTimeout(holdTimeoutRef.current);
    }

    holdTimeoutRef.current = setTimeout(async () => {
      if (newSelected.length > 0) {
        try {
          const holdRes = await api.holdSeats({
            flightId,
            seatNumbers: newSelected,
            sessionId,
          });
          if (holdRes?.ttlSeconds) {
            setHoldTtlSeconds(holdRes.ttlSeconds);
          }
          setError(null);
        } catch (e: any) {
          console.warn('Hold seats notice:', e.message);
        }
      } else {
        api.releaseSeats({ flightId, seatNumbers: selectedSeats, sessionId }).catch(() => {});
      }
    }, 300);
  };

  if (loading) {
    return (
      <div className="p-8 text-center bg-slate-50 dark:bg-slate-800/40 rounded-2xl">
        <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-xs text-slate-500 font-medium">{t('common.loading')}</p>
      </div>
    );
  }

  if (error && !seatData) {
    return (
      <div className="p-6 bg-red-50 dark:bg-red-950/40 rounded-2xl border border-red-200 dark:border-red-800 text-center space-y-3">
        <AlertCircle className="w-6 h-6 text-red-600 mx-auto" />
        <p className="text-xs text-red-700 dark:text-red-300 font-semibold">{error}</p>
        <button
          type="button"
          onClick={() => loadSeats(true)}
          className="px-4 py-2 bg-primary-900 hover:bg-primary-800 text-white text-xs font-bold rounded-xl shadow-sm transition cursor-pointer"
        >
          {t('search.retryNow') || 'Thử lại ngay'}
        </button>
      </div>
    );
  }

  const seatsList: any[] = seatData?.seats || [];
  const businessSeats = seatsList.filter((s) => s.cabinClass === 'BUSINESS');
  const economySeats = seatsList.filter((s) => s.cabinClass === 'ECONOMY');

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-100 dark:border-slate-800 shadow-premium">
      {/* Header and Countdown */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span>{t('booking.seatMapTitle')}</span>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-primary-100 dark:bg-primary-950/60 text-primary-800 dark:text-primary-300">
              {seatData?.flightNumber} · {seatData?.aircraftModel}
            </span>
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Vui lòng chọn <strong>{requiredSeatsCount}</strong> ghế cho hành khách của bạn.
          </p>
        </div>

        {holdTtlSeconds !== null && holdTtlSeconds > 0 && (
          <div className="flex items-center gap-2 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 px-3.5 py-1.5 rounded-xl text-amber-800 dark:text-amber-300 text-xs font-bold animate-pulse">
            <Clock className="w-4 h-4 text-amber-600" />
            <span>Thời gian giữ ghế: {formatTimer(holdTtlSeconds)}</span>
          </div>
        )}
      </div>

      {/* Seat Legend */}
      <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 mb-8 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl text-xs font-medium">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-white dark:bg-slate-700 border-2 border-slate-300 dark:border-slate-600" />
          <span>{t('booking.seatAvailable')}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-primary-600 border-2 border-primary-700 text-white flex items-center justify-center text-[10px] font-bold">
            ✓
          </div>
          <span>{t('booking.selectedSeat')}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-amber-200 dark:bg-amber-900/50 border-2 border-amber-400" />
          <span>{t('booking.seatHeld')}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-slate-200 dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-700 opacity-60" />
          <span>{t('booking.seatBooked')}</span>
        </div>
      </div>

      {/* Aircraft Fuselage Layout */}
      <div className="max-w-md mx-auto bg-slate-100 dark:bg-slate-800/30 rounded-t-full p-6 pt-12 border-2 border-dashed border-slate-200 dark:border-slate-700 relative">
        {/* Cockpit Indicator */}
        <div className="w-20 h-6 bg-slate-300 dark:bg-slate-700 rounded-t-full mx-auto mb-8 flex items-center justify-center text-[10px] uppercase tracking-widest text-slate-600 dark:text-slate-400 font-bold">
          Mũi tàu bay
        </div>

        {/* Business Cabin Section */}
        {businessSeats.length > 0 && (
          <div className="mb-8 pb-6 border-b border-slate-200 dark:border-slate-700">
            <div className="text-center text-xs font-bold text-gold-600 dark:text-gold-400 mb-4 flex items-center justify-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" /> Khoang Thương gia (Business Class)
            </div>
            <div className="grid grid-cols-4 gap-2.5 max-w-[260px] mx-auto">
              {businessSeats.map((s) => {
                const isSelected = selectedSeats.includes(s.seatNumber);
                const isBooked = s.status === 'BOOKED';
                const isHeld = s.status === 'HELD' && s.heldBySessionId !== sessionId;

                return (
                  <button
                    key={s.id}
                    type="button"
                    disabled={isBooked || isHeld}
                    onClick={() => handleSeatClick(s)}
                    aria-label={`Seat ${s.seatNumber} Business Class, status: ${s.status}`}
                    className={`h-11 rounded-xl text-xs font-bold flex flex-col items-center justify-center transition ${
                      isSelected
                        ? 'bg-primary-600 text-white ring-2 ring-primary-400 shadow-md scale-105'
                        : isBooked
                        ? 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed opacity-50'
                        : isHeld
                        ? 'bg-amber-200 text-amber-800 cursor-not-allowed'
                        : 'bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200 hover:border-gold-500 border border-slate-300 dark:border-slate-600 shadow-sm'
                    }`}
                  >
                    <span>{s.seatNumber}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Economy Cabin Section */}
        <div>
          <div className="text-center text-xs font-bold text-primary-700 dark:text-primary-400 mb-4">
            Khoang Phổ thông (Economy Class)
          </div>
          <div className="grid grid-cols-6 gap-1.5 max-w-[320px] mx-auto">
            {economySeats.map((s, idx) => {
              const isSelected = selectedSeats.includes(s.seatNumber);
              const isBooked = s.status === 'BOOKED';
              const isHeld = s.status === 'HELD' && s.heldBySessionId !== sessionId;
              const isAisle = s.col === 'C'; // Space aisle

              return (
                <React.Fragment key={s.id}>
                  <button
                    type="button"
                    disabled={isBooked || isHeld}
                    onClick={() => handleSeatClick(s)}
                    aria-label={`Seat ${s.seatNumber} Economy Class, status: ${s.status}`}
                    className={`h-9 rounded-lg text-[11px] font-bold flex flex-col items-center justify-center transition ${
                      isSelected
                        ? 'bg-primary-600 text-white ring-2 ring-primary-400 shadow-md scale-105'
                        : isBooked
                        ? 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed opacity-40'
                        : isHeld
                        ? 'bg-amber-200 text-amber-800 cursor-not-allowed'
                        : 'bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200 hover:border-primary-500 border border-slate-300 dark:border-slate-600 shadow-sm'
                    }`}
                  >
                    <span>{s.seatNumber}</span>
                  </button>
                  {isAisle && <div className="w-2" aria-hidden="true" />}
                </React.Fragment>
              );
            })}
          </div>
        </div>

        {/* Tail indicator */}
        <div className="text-center text-[10px] text-slate-400 uppercase tracking-widest mt-8 font-bold">
          Đuôi tàu bay
        </div>
      </div>

      {/* Selected summary */}
      <div className="mt-8 p-4 bg-primary-50/70 dark:bg-slate-800 rounded-2xl flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 text-primary-900 dark:text-primary-300">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>
            Đã chọn: <strong className="text-sm font-black">{selectedSeats.length > 0 ? selectedSeats.join(', ') : 'Chưa chọn'}</strong> (Yêu cầu: {requiredSeatsCount} ghế)
          </span>
        </div>
        <p className="text-slate-500">
          {t('booking.seatHoldNotice')}
        </p>
      </div>
    </div>
  );
};
