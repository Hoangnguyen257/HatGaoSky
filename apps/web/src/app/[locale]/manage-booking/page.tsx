'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { api } from '../../../lib/api';
import { BoardingPassCard } from '../../../components/public/BoardingPassCard';
import {
  Search,
  Plane,
  AlertCircle,
  Luggage,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  ArrowUpRight,
  RefreshCw,
  PlusCircle,
} from 'lucide-react';

export default function ManageBookingPage() {
  const t = useTranslations();
  const searchParams = useSearchParams();

  const [pnr, setPnr] = useState(searchParams.get('pnr') || '');
  const [email, setEmail] = useState(searchParams.get('email') || '');
  const [phone, setPhone] = useState('');

  const [booking, setBooking] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Modals state
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('Thay đổi lịch trình cá nhân');
  const [baggageModalOpen, setBaggageModalOpen] = useState(false);
  const [baggageWeight, setBaggageWeight] = useState(15);
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);
  const [targetCabin, setTargetCabin] = useState('BUSINESS');
  const [targetSeat, setTargetSeat] = useState('2A');

  const handleLookup = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!pnr.trim()) return;

    setLoading(true);
    setError(null);
    setActionSuccess(null);

    try {
      const data = await api.lookupBooking({
        pnr: pnr.trim().toUpperCase(),
        email: email.trim() || undefined,
        phone: phone.trim() || undefined,
      });
      setBooking(data);
      setLoading(false);
    } catch (err: any) {
      setError(err.message || 'Không tìm thấy thông tin đặt chỗ');
      setBooking(null);
      setLoading(false);
    }
  };

  useEffect(() => {
    if (pnr && (email || phone)) {
      handleLookup();
    }
  }, []);

  // Cancel Booking
  const handleCancelBooking = async () => {
    if (!booking) return;
    try {
      const res = await api.cancelBooking(booking.pnr, { reason: cancelReason });
      setActionSuccess(`Hủy vé thành công. Số tiền hoàn lại: ${res.refundAmount?.toLocaleString('vi-VN')} VND.`);
      setCancelModalOpen(false);
      handleLookup();
    } catch (err: any) {
      setError(err.message || 'Không thể hủy vé');
      setCancelModalOpen(false);
    }
  };

  // Add Baggage
  const handleAddBaggage = async () => {
    if (!booking) return;
    try {
      const res = await api.addBaggage(booking.pnr, { weightKg: baggageWeight });
      setActionSuccess(`Đã mua thêm thành công ${baggageWeight}kg hành lý ký gửi!`);
      setBaggageModalOpen(false);
      handleLookup();
    } catch (err: any) {
      setError(err.message || 'Không thể thêm hành lý');
      setBaggageModalOpen(false);
    }
  };

  // Upgrade Cabin
  const handleUpgradeCabin = async () => {
    if (!booking) return;
    try {
      const res = await api.upgradeCabin(booking.pnr, {
        targetCabinClass: targetCabin,
        newSeatNumber: targetSeat,
      });
      setActionSuccess(`Nâng hạng thành công lên ${targetCabin} (Ghế ${targetSeat})!`);
      setUpgradeModalOpen(false);
      handleLookup();
    } catch (err: any) {
      setError(err.message || 'Không thể nâng hạng ghế');
      setUpgradeModalOpen(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto space-y-2">
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
          {t('manage.title')}
        </h1>
        <p className="text-xs sm:text-sm text-slate-500">{t('manage.subtitle')}</p>
      </div>

      {/* Lookup Form */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-100 dark:border-slate-800 shadow-premium max-w-2xl mx-auto">
        <form onSubmit={handleLookup} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                {t('manage.lookupPnr')} <span className="text-red-500 font-bold">*</span>
              </label>
              <input
                type="text"
                value={pnr}
                onChange={(e) => setPnr(e.target.value.toUpperCase())}
                placeholder="VD: VSK89A"
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold uppercase focus:outline-none"
                required
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                {t('manage.lookupEmail')} *
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="customer@vietsky.vn"
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-primary-900 hover:bg-primary-800 text-white font-bold text-xs rounded-xl shadow-md flex items-center justify-center gap-2 transition"
          >
            {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            <span>{t('manage.searchReservation')}</span>
          </button>
        </form>
      </div>

      {/* Messages */}
      {actionSuccess && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-2xl flex items-center gap-3 text-xs text-emerald-800 dark:text-emerald-200 font-bold max-w-2xl mx-auto">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-emerald-600" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-2xl flex items-center gap-3 text-xs text-red-700 dark:text-red-300 max-w-2xl mx-auto">
          <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-600" />
          <span>{error}</span>
        </div>
      )}

      {/* Booking Details Card */}
      {booking && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-100 dark:border-slate-800 shadow-premium space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div>
              <span className="text-xs text-slate-400 font-semibold uppercase">Mã đặt chỗ (PNR)</span>
              <div className="text-3xl font-black text-primary-900 dark:text-gold-400 tracking-wider">
                {booking.pnr}
              </div>
            </div>

            <div className="text-right">
              <span className="text-xs text-slate-400 font-semibold block">Trạng thái vé</span>
              <span
                className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${
                  booking.status === 'CONFIRMED'
                    ? 'bg-emerald-100 text-emerald-800'
                    : booking.status === 'CANCELLED'
                    ? 'bg-red-100 text-red-800'
                    : 'bg-amber-100 text-amber-800'
                }`}
              >
                {booking.status === 'CANCELLED' ? 'ĐÃ HỦY & HOÀN TIỀN' : booking.status}
              </span>
            </div>
          </div>

          {/* Cancellation & Refund Alert Banner */}
          {booking.status === 'CANCELLED' && (
            <div className="p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-rose-800 dark:text-rose-200">
              <div className="flex items-center gap-2.5">
                <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />
                <div>
                  <span className="font-extrabold block">ĐẶT CHỖ ĐÃ ĐƯỢC HỦY & HOÀN TIỀN THÀNH CÔNG</span>
                  <span className="text-[11px] text-rose-600 dark:text-rose-300">
                    Toàn bộ chỗ ngồi của mã đặt chỗ này đã được hoàn trả về trạng thái <strong>Chưa đặt (Available)</strong> trên hệ thống bay.
                  </span>
                </div>
              </div>
              {booking.cancelReason && (
                <span className="px-3 py-1 bg-white dark:bg-slate-800 rounded-xl border border-rose-200 text-rose-700 dark:text-rose-300 font-semibold text-[11px]">
                  Lý do: {booking.cancelReason}
                </span>
              )}
            </div>
          )}

          {/* Action buttons toolbar */}
          {booking.status !== 'CANCELLED' && (
            <div className="flex flex-wrap gap-3 pt-2">
              <button
                onClick={() => setBaggageModalOpen(true)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition"
              >
                <PlusCircle className="w-4 h-4 text-primary-600" />
                <span>{t('manage.addBaggage')}</span>
              </button>

              <button
                onClick={() => setUpgradeModalOpen(true)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition"
              >
                <ArrowUpRight className="w-4 h-4 text-purple-600" />
                <span>{t('manage.upgradeClass')}</span>
              </button>

              <button
                onClick={() => setCancelModalOpen(true)}
                className="px-4 py-2 bg-red-50 hover:bg-red-100 dark:bg-red-950/40 text-red-600 rounded-xl text-xs font-bold flex items-center gap-1.5 transition ml-auto"
              >
                <XCircle className="w-4 h-4 text-red-600" />
                <span>{t('manage.cancelTicket')}</span>
              </button>
            </div>
          )}

          {/* Tickets & Boarding Passes Information */}
          <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                {t('manage.ticketDetails')} ({booking.tickets?.length || 0} vé)
              </h3>
              <span className="text-xs text-slate-500 font-medium">
                Xuất trình thẻ lên tàu bay điện tử hoặc in vé tại quầy làm thủ tục
              </span>
            </div>

            <div className="space-y-6">
              {booking.tickets?.map((tkt: any, idx: number) => (
                <BoardingPassCard
                  key={tkt.id || idx}
                  ticket={tkt}
                  pnr={booking.pnr}
                  bookingStatus={booking.status}
                  customerEmail={booking.customerEmail}
                  passengerFallback={
                    tkt.passenger ||
                    booking.passengers?.find((p: any) => p.id === tkt.passengerId) ||
                    booking.passengers?.[idx] ||
                    booking.passengers?.[0]
                  }
                />
              ))}
            </div>
          </div>

          {/* Payment & Refund Summary */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center text-xs">
            <div>
              <span className="text-slate-500">{t('manage.totalAmount')}: </span>
              <strong className="text-slate-900 dark:text-white font-bold">
                {booking.totalAmount?.toLocaleString('vi-VN')} VND
              </strong>
            </div>
            <div>
              <span className="text-slate-500">{t('manage.paidAmount')}: </span>
              <strong className="text-emerald-600 font-bold">
                {booking.paidAmount?.toLocaleString('vi-VN')} VND
              </strong>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Cancel Booking */}
      {cancelModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-red-600 flex items-center gap-2">
              <XCircle className="w-5 h-5" />
              <span>{t('manage.cancelConfirm')}</span>
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-300">
              {t('manage.cancellationFeeNotice')}
            </p>
            <div>
              <label className="text-xs font-semibold text-slate-500 block mb-1">
                {t('manage.cancelReason')}
              </label>
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-xs font-medium focus:outline-none h-20"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setCancelModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold"
              >
                Hủy bỏ
              </button>
              <button
                onClick={handleCancelBooking}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold"
              >
                Xác nhận hủy & Hoàn tiền
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Add Checked Baggage */}
      {baggageModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Luggage className="w-5 h-5 text-primary-600" />
              <span>Mua thêm hành lý ký gửi</span>
            </h3>
            <p className="text-xs text-slate-500">
              Chọn mức trọng lượng hành lý ký gửi bổ sung (tối đa 40kg).
            </p>
            <div className="grid grid-cols-3 gap-2 text-xs">
              {[
                { kg: 10, price: '180.000' },
                { kg: 15, price: '250.000' },
                { kg: 20, price: '320.000' },
              ].map((b) => (
                <button
                  key={b.kg}
                  type="button"
                  onClick={() => setBaggageWeight(b.kg)}
                  className={`p-3 rounded-xl border text-center ${
                    baggageWeight === b.kg
                      ? 'border-primary-600 bg-primary-50 dark:bg-slate-800 font-bold'
                      : 'border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <div>+{b.kg}kg</div>
                  <div className="text-[10px] text-primary-600 font-bold">{b.price} đ</div>
                </button>
              ))}
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setBaggageModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold"
              >
                Hủy bỏ
              </button>
              <button
                onClick={handleAddBaggage}
                className="px-4 py-2 rounded-xl bg-primary-900 hover:bg-primary-800 text-white text-xs font-bold"
              >
                Xác nhận mua
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Upgrade Cabin */}
      {upgradeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-purple-700 dark:text-purple-400 flex items-center gap-2">
              <Sparkles className="w-5 h-5" />
              <span>Nâng hạng ghế Thương gia / Hạng Nhất</span>
            </h3>
            <div className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-500 block mb-1">Hạng vé nâng lên</label>
                <select
                  value={targetCabin}
                  onChange={(e) => setTargetCabin(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 font-bold"
                >
                  <option value="BUSINESS">Thương gia (Business Class)</option>
                  <option value="FIRST">Hạng Nhất (First Class)</option>
                </select>
              </div>
              <div>
                <label className="font-semibold text-slate-500 block mb-1">Ghế mới mong muốn</label>
                <input
                  type="text"
                  value={targetSeat}
                  onChange={(e) => setTargetSeat(e.target.value.toUpperCase())}
                  placeholder="VD: 2A"
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 font-bold uppercase"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setUpgradeModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold"
              >
                Hủy bỏ
              </button>
              <button
                onClick={handleUpgradeCabin}
                className="px-4 py-2 rounded-xl bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold"
              >
                Xác nhận nâng hạng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
