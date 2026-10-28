'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useLocale } from 'next-intl';
import { api } from '../../../../lib/api';
import { RoleGuard } from '../../../../components/layout/RoleGuard';
import { CustomerNav } from '../../../../components/layout/CustomerNav';
import { Plane, Calendar, ArrowRight, ShieldCheck, Clock, Ticket } from 'lucide-react';

export default function CustomerBookingsPage() {
  const locale = useLocale();
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .getMyBookings()
      .then((data) => {
        setBookings(data);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, []);

  return (
    <RoleGuard allowedRoles={['CUSTOMER', 'STAFF', 'STAFF_MANAGER', 'ADMIN']}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
        <CustomerNav />
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
            Chuyến bay của tôi (My Bookings)
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Xem lịch sử tất cả các chuyến bay đã đặt cùng Hạt Gạo Sky
          </p>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[1, 2].map((n) => (
              <div key={n} className="h-32 rounded-3xl skeleton-shimmer" />
            ))}
          </div>
        ) : bookings.length === 0 ? (
          <div className="p-12 bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 text-center space-y-4">
            <Plane className="w-12 h-12 text-slate-300 mx-auto" />
            <h3 className="font-bold text-base text-slate-800 dark:text-white">
              Quý khách chưa có chuyến bay nào
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Hãy đặt vé ngay hôm nay để nhận ưu đãi giá gốc và tích dặm thưởng Lotus Club!
            </p>
            <Link
              href={`/${locale}`}
              className="inline-block px-6 py-2.5 bg-primary-900 hover:bg-primary-800 text-white font-bold text-xs rounded-xl shadow-md transition"
            >
              Tìm chuyến bay ngay
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {bookings.map((b) => {
              const ticket = b.tickets?.[0];
              const flight = ticket?.flight;

              return (
                <div
                  key={b.id}
                  className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-premium transition flex flex-wrap items-center justify-between gap-6"
                >
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <span className="text-xl font-black text-primary-900 dark:text-gold-400">
                        {b.pnr}
                      </span>
                      <span
                        className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] ${
                          b.status === 'CONFIRMED'
                            ? 'bg-emerald-100 text-emerald-800'
                            : b.status === 'CANCELLED'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {b.status}
                      </span>
                    </div>

                    <div className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                      <span>{flight?.originAirport?.city} ({flight?.originAirport?.code})</span>
                      <span>➔</span>
                      <span>{flight?.destinationAirport?.city} ({flight?.destinationAirport?.code})</span>
                    </div>

                    <p className="text-xs text-slate-500">
                      Khởi hành: <strong>{flight ? new Date(flight.departureTime).toLocaleString('vi-VN') : '—'}</strong> · {b.tickets?.length} vé ({ticket?.cabinClass})
                    </p>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <span className="text-xs text-slate-400 block">Tổng tiền</span>
                      <strong className="text-base font-black text-slate-900 dark:text-white">
                        {b.totalAmount?.toLocaleString('vi-VN')} VND
                      </strong>
                    </div>

                    <Link
                      href={`/${locale}/manage-booking?pnr=${b.pnr}&email=${b.customerEmail}`}
                      className="px-4 py-2 bg-primary-900 hover:bg-primary-800 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-sm transition"
                    >
                      <Ticket className="w-3.5 h-3.5 text-gold-400" />
                      <span>Xem thẻ lên tàu bay</span>
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </RoleGuard>
  );
}
