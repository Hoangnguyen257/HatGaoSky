'use client';

import React, { useState, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { api } from '../../lib/api';
import {
  Plane,
  Clock,
  Luggage,
  QrCode,
  Printer,
  Copy,
  Check,
  Calendar,
  MapPin,
  User,
  ShieldCheck,
  Sparkles,
  Ticket,
  AlertTriangle,
  Mail,
  Send,
} from 'lucide-react';

export interface BoardingPassProps {
  ticket: {
    id?: string;
    ticketNumber: string;
    cabinClass: string;
    status: string;
    price?: number;
    seat?: {
      seatNumber: string;
      row?: number;
      col?: string;
      cabinClass?: string;
    };
    passenger?: {
      firstName: string;
      lastName: string;
      passportNumber?: string;
      passengerType: string;
      nationality?: string;
      dateOfBirth?: string | Date;
    };
    flight: {
      flightNumber: string;
      departureTime: string | Date;
      arrivalTime: string | Date;
      durationMinutes?: number;
      originAirport?: {
        code: string;
        name: string;
        city: string;
        terminal?: string;
      };
      destinationAirport?: {
        code: string;
        name: string;
        city: string;
        terminal?: string;
      };
      aircraft?: {
        model: string;
        registrationNumber?: string;
      };
    };
  };
  pnr: string;
  bookingStatus?: string;
  customerEmail?: string;
  passengerFallback?: any;
}

// Generate deterministic SVG Barcode bars from ticket number and PNR
function generateBarcodePattern(seedString: string, count: number = 95): { width: number; isBar: boolean }[] {
  let hash = 0;
  for (let i = 0; i < seedString.length; i++) {
    hash = (hash << 5) - hash + seedString.charCodeAt(i);
    hash |= 0;
  }
  const bars: { width: number; isBar: boolean }[] = [];
  let currentIsBar = true;
  for (let i = 0; i < count; i++) {
    const pseudoRand = Math.abs(Math.sin(hash + i * 9.17) * 10000);
    const width = (Math.floor(pseudoRand) % 3) + 1.2;
    bars.push({ width, isBar: currentIsBar });
    currentIsBar = (Math.floor(pseudoRand * 3) % 4) === 0 ? currentIsBar : !currentIsBar;
  }
  return bars;
}

// Generate realistic deterministic 2D QR matrix (25x25)
function generateQrMatrix(seedString: string): boolean[][] {
  const size = 25;
  const matrix: boolean[][] = Array.from({ length: size }, () => Array(size).fill(false));

  const drawFinderPattern = (startR: number, startC: number) => {
    for (let r = 0; r < 7; r++) {
      for (let c = 0; c < 7; c++) {
        if (
          r === 0 || r === 6 || c === 0 || c === 6 ||
          (r >= 2 && r <= 4 && c >= 2 && c <= 4)
        ) {
          matrix[startR + r][startC + c] = true;
        }
      }
    }
  };

  drawFinderPattern(0, 0);
  drawFinderPattern(0, size - 7);
  drawFinderPattern(size - 7, 0);

  for (let i = 8; i < size - 8; i++) {
    matrix[6][i] = i % 2 === 0;
    matrix[i][6] = i % 2 === 0;
  }

  let hash = 0;
  for (let i = 0; i < seedString.length; i++) {
    hash = (hash << 5) - hash + seedString.charCodeAt(i);
    hash |= 0;
  }

  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      const inTopLeft = r < 8 && c < 8;
      const inTopRight = r < 8 && c >= size - 8;
      const inBottomLeft = r >= size - 8 && c < 8;
      const inTiming = r === 6 || c === 6;

      if (!inTopLeft && !inTopRight && !inBottomLeft && !inTiming) {
        const rand = Math.abs(Math.sin(hash + r * 31 + c * 17) * 10000);
        matrix[r][c] = (Math.floor(rand) % 2) === 1;
      }
    }
  }

  return matrix;
}

export const BoardingPassCard: React.FC<BoardingPassProps> = ({
  ticket,
  pnr,
  bookingStatus = 'CONFIRMED',
  customerEmail,
  passengerFallback,
}) => {
  const t = useTranslations('boardingPass');
  const [copied, setCopied] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [targetEmail, setTargetEmail] = useState(customerEmail || '');
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [emailSuccess, setEmailSuccess] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);

  // Passenger resolution
  const pax = ticket.passenger || passengerFallback || {};
  const firstName = pax.firstName || 'HÀNH KHÁCH';
  const lastName = pax.lastName || 'QUÝ KHÁCH';
  const fullNameIata = `${lastName.toUpperCase()} / ${firstName.toUpperCase()} ${
    pax.passengerType === 'ADULT' ? 'MR/MS' : pax.passengerType === 'CHILD' ? 'CHD' : 'INF'
  }`;
  const passportNumber = pax.passportNumber || 'N/A';

  // Flight & dates
  const flight = ticket.flight || ({} as any);
  const origin = flight.originAirport || { code: 'SGN', city: 'Hồ Chí Minh', name: 'Tân Sơn Nhất', terminal: 'T1' };
  const destination = flight.destinationAirport || { code: 'HAN', city: 'Hà Nội', name: 'Nội Bài', terminal: 'T1' };
  const aircraft = flight.aircraft || { model: 'Airbus A321neo', registrationNumber: 'VN-A321' };

  const depDate = flight.departureTime ? new Date(flight.departureTime) : new Date();
  const arrDate = flight.arrivalTime ? new Date(flight.arrivalTime) : new Date(depDate.getTime() + 2 * 3600 * 1000);

  // Boarding time is 40 minutes prior to departure
  const boardingDate = new Date(depDate.getTime() - 40 * 60 * 1000);

  const formatTime = (d: Date) =>
    d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', hour12: false });

  const formatDate = (d: Date) => {
    return d.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).toUpperCase();
  };

  const formatDuration = (mins?: number) => {
    const total = mins || Math.round((arrDate.getTime() - depDate.getTime()) / (60 * 1000));
    const h = Math.floor(total / 60);
    const m = total % 60;
    return `${h}g ${m > 0 ? `${m}p` : ''}`;
  };

  // Deterministic gate: Gate 01 - Gate 18
  const gateNumber = useMemo(() => {
    const seed = (flight.flightNumber || 'VSK100') + (ticket.seat?.seatNumber || '12A');
    let hash = 0;
    for (let i = 0; i < seed.length; i++) hash += seed.charCodeAt(i);
    const num = (hash % 16) + 1;
    return num < 10 ? `0${num}` : `${num}`;
  }, [flight.flightNumber, ticket.seat?.seatNumber]);

  // Boarding zone & baggage allowance
  const cabinClass = (ticket.cabinClass || 'ECONOMY').toUpperCase();
  const isBusiness = cabinClass === 'BUSINESS';
  const isFirst = cabinClass === 'FIRST';
  const isCancelled = bookingStatus === 'CANCELLED' || ticket.status === 'CANCELLED';

  const zone = isFirst ? 'ZONE 1' : isBusiness ? 'ZONE 1' : (ticket.seat?.row || 17) <= 15 ? 'ZONE 2' : 'ZONE 3';
  const baggageAllowance = isFirst
    ? '40kg Ký gửi + 18kg Xách tay'
    : isBusiness
    ? '32kg Ký gửi + 14kg Xách tay'
    : '23kg Ký gửi + 12kg Xách tay';

  // IATA BCBP string
  const bcbpString = useMemo(() => {
    const cleanFlight = (flight.flightNumber || 'VSK102').replace(/\D/g, '').padStart(4, '0');
    const dayOfYear = Math.floor(
      (depDate.getTime() - new Date(depDate.getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24)
    );
    const classCode = isFirst ? 'F' : isBusiness ? 'C' : 'Y';
    const seatCode = (ticket.seat?.seatNumber || '17C').padStart(4, '0');
    return `M1${lastName.toUpperCase()}/${firstName.toUpperCase()}  E${pnr.padEnd(7)} ${origin.code}${destination.code}VSK ${cleanFlight} ${dayOfYear}${classCode}${seatCode}0001 147`;
  }, [flight.flightNumber, depDate, isFirst, isBusiness, ticket.seat?.seatNumber, lastName, firstName, pnr, origin.code, destination.code]);

  const barcodeBars = useMemo(() => generateBarcodePattern(ticket.ticketNumber + pnr), [ticket.ticketNumber, pnr]);
  const qrMatrix = useMemo(() => generateQrMatrix(ticket.ticketNumber + pnr), [ticket.ticketNumber, pnr]);

  const handleCopyTicket = () => {
    navigator.clipboard.writeText(
      `HẠT GẠO SKY BOARDING PASS\nPNR: ${pnr}\nVé: ${ticket.ticketNumber}\nHành khách: ${fullNameIata}\nChuyến bay: ${flight.flightNumber} (${origin.code} ➔ ${destination.code})\nKhởi hành: ${formatTime(depDate)} ngày ${formatDate(depDate)}\nGhế: ${ticket.seat?.seatNumber || 'Chưa gán'}\nCửa: Gate ${gateNumber}`
    );
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetEmail.trim() || !targetEmail.includes('@')) {
      setEmailError('Vui lòng nhập địa chỉ email hợp lệ');
      return;
    }
    setIsSendingEmail(true);
    setEmailError(null);
    setEmailSuccess(null);
    try {
      const res = await api.sendTicketEmail(pnr, targetEmail.trim());
      setEmailSuccess(res.message || `Đã gửi vé thành công đến ${targetEmail}!`);
      setTimeout(() => {
        setShowEmailModal(false);
        setEmailSuccess(null);
      }, 3000);
    } catch (err: any) {
      setEmailError(err.message || 'Không thể gửi email lúc này');
    } finally {
      setIsSendingEmail(false);
    }
  };

  return (
    <div className="w-full my-6 font-sans">
      {/* Action Bar (Top) */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3 px-1 print:hidden">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
            {t('title')}
          </span>
          <span className="text-[11px] font-mono bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded-md font-semibold">
            {ticket.ticketNumber}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleCopyTicket}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
            title="Sao chép toàn bộ thông tin vé"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? t('copied') : t('copyInfo')}</span>
          </button>

          <button
            type="button"
            onClick={() => setShowEmailModal(true)}
            className="px-3.5 py-1.5 bg-primary-50 hover:bg-primary-100 dark:bg-slate-800 text-primary-900 dark:text-primary-300 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer border border-primary-200 dark:border-slate-700 shadow-sm"
            title="Gửi vé máy bay điện tử và thẻ lên tàu bay qua email thật"
          >
            <Mail className="w-3.5 h-3.5 text-primary-600" />
            <span>{t('sendEmail')}</span>
          </button>

          <button
            type="button"
            onClick={() => setShowQrModal(true)}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
            title="Mở mã QR kiểm tra an ninh sân bay"
          >
            <QrCode className="w-3.5 h-3.5 text-primary-600" />
            <span>Mã QR</span>
          </button>

          <button
            type="button"
            onClick={handlePrint}
            className="px-4 py-1.5 bg-primary-900 hover:bg-primary-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition cursor-pointer"
            title="In thẻ lên máy bay hoặc lưu thành file PDF"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>{t('printPass')}</span>
          </button>
        </div>
      </div>

      {/* HORIZONTAL BOARDING PASS WRAPPER WITH HORIZONTAL SCROLL FOR MOBILE */}
      <div className="overflow-x-auto pb-2">
        <div
          id={`boarding-pass-${ticket.ticketNumber}`}
          className="boarding-pass-container min-w-[880px] w-full bg-white text-slate-900 rounded-3xl border border-slate-200 shadow-xl overflow-hidden print:shadow-none print:border-2 print:border-black print:rounded-none print:min-w-0"
        >
          {/* Top Airline Header Ribbon (Full Horizontal Width) */}
          <div className={`px-6 py-3.5 flex items-center justify-between gap-4 text-white ${
            isFirst
              ? 'bg-gradient-to-r from-purple-950 via-purple-900 to-amber-700'
              : isBusiness
              ? 'bg-gradient-to-r from-slate-950 via-primary-950 to-gold-800'
              : 'bg-gradient-to-r from-primary-950 via-primary-900 to-primary-800'
          }`}>
            {/* Brand Logo & Name */}
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gold-500/20 border border-gold-400/40 flex items-center justify-center flex-shrink-0">
                <span className="text-lg">🪷</span>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-black text-base tracking-wider text-gold-400">
                    {t('airlineName')}
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-slate-300/80 px-2 py-0.5 rounded-full bg-white/10">
                    {t('nationalCarrier')}
                  </span>
                </div>
                <p className="text-[10px] text-slate-300 font-medium">
                  {t('title').toUpperCase()} · IATA RESOLUTION 792 COMPLIANT
                </p>
              </div>
            </div>

            {/* Cabin Class & Status Badges */}
            <div className="flex items-center gap-3">
              <div className={`px-3 py-1 rounded-xl text-xs font-black tracking-wide uppercase border ${
                isFirst
                  ? 'bg-amber-400 text-slate-950 border-amber-300 shadow-sm'
                  : isBusiness
                  ? 'bg-gold-500 text-slate-950 border-gold-400 shadow-sm'
                  : 'bg-primary-800 text-primary-100 border-primary-600'
              }`}>
                {cabinClass === 'FIRST' ? t('first') : cabinClass === 'BUSINESS' ? t('business') : t('economy')}
              </div>

              <div className={`px-3 py-1 rounded-xl border text-xs font-bold uppercase ${
                isCancelled
                  ? 'bg-rose-500/30 border-rose-400 text-rose-200'
                  : 'bg-emerald-500/20 border-emerald-400/40 text-emerald-300'
              }`}>
                {isCancelled ? 'ĐÃ HỦY VÉ / CANCELLED' : (ticket.status || 'ISSUED')}
              </div>

              <div className="px-3 py-1 rounded-xl bg-white/15 border border-white/20 text-white font-mono text-xs font-black tracking-wider">
                PNR: {pnr}
              </div>
            </div>
          </div>

          {/* CARD BODY: STRICT 2-PANEL HORIZONTAL ROW LAYOUT */}
          <div className="flex flex-row items-stretch bg-white relative">
            {/* LEFT PANEL: MAIN BOARDING PASS (72% WIDTH) */}
            <div className="flex-1 p-6 space-y-4 min-w-0">
              {/* Cancellation Notice Banner */}
              {isCancelled && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center justify-between text-xs text-rose-800 font-bold">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                    <span>VÉ ĐÃ HOÀN / HỦY — Chỗ ngồi ({ticket.seat?.seatNumber}) đã được trả về trạng thái "Chưa đặt" trên sơ đồ chỗ ngồi của chuyến bay.</span>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-rose-200 text-rose-900 text-[10px] uppercase font-black flex-shrink-0 ml-2">
                    RELEASED
                  </span>
                </div>
              )}
              {/* Row 1: Passenger Name, ID, ETKT & Aircraft */}
              <div className="flex items-start justify-between gap-4 pb-3 border-b border-slate-100">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    {t('passenger')} / PASSENGER NAME
                  </span>
                  <span className="text-xl font-black text-primary-950 tracking-wide font-mono block">
                    {fullNameIata}
                  </span>
                  <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                    <span>{t('idPassport')}: <strong className="text-slate-800 font-mono">{passportNumber}</strong></span>
                    <span>·</span>
                    <span>{t('ticketNumber')}: <strong className="text-slate-800 font-mono">{ticket.ticketNumber}</strong></span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    {t('pnr')}
                  </span>
                  <span className="text-2xl font-black text-primary-900 tracking-widest font-mono">
                    {pnr}
                  </span>
                  <span className="text-[11px] text-slate-400 block font-medium">
                    Tàu bay: <strong className="text-slate-700">{aircraft.model} ({aircraft.registrationNumber || 'VN-A321'})</strong>
                  </span>
                </div>
              </div>

              {/* Row 2: Flight Route Visual (SGN ➔ HAN) */}
              <div className="grid grid-cols-7 gap-3 items-center bg-slate-50 rounded-2xl p-4 border border-slate-100">
                {/* Origin Airport */}
                <div className="col-span-3 text-left">
                  <span className="text-3xl font-black text-slate-900 tracking-tight font-mono block">
                    {origin.code}
                  </span>
                  <span className="text-sm font-bold text-slate-800 block">
                    {origin.city}
                  </span>
                  <span className="text-xs text-slate-500 block truncate" title={origin.name}>
                    {origin.name} (Nhà ga {origin.terminal || 'T1'})
                  </span>
                  <div className="mt-1.5 inline-flex items-center gap-1.5 bg-primary-100/60 text-primary-900 px-2.5 py-0.5 rounded-lg text-xs font-bold">
                    <Clock className="w-3.5 h-3.5 text-primary-700" />
                    <span>Khởi hành: {formatTime(depDate)}</span>
                  </div>
                </div>

                {/* Trajectory Plane Icon */}
                <div className="col-span-1 flex flex-col items-center justify-center">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    {formatDuration(flight.durationMinutes)}
                  </span>
                  <div className="w-full flex items-center justify-center relative">
                    <div className="w-full border-t-2 border-dashed border-slate-300" />
                    <div className="absolute w-7 h-7 rounded-full bg-primary-900 text-gold-400 flex items-center justify-center shadow-sm">
                      <Plane className="w-3.5 h-3.5 rotate-90" />
                    </div>
                  </div>
                  <span className="text-[10px] text-emerald-700 font-bold bg-emerald-100/70 px-2 py-0.5 rounded-full mt-1.5">
                    {t('directFlight')}
                  </span>
                </div>

                {/* Destination Airport */}
                <div className="col-span-3 text-right">
                  <span className="text-3xl font-black text-slate-900 tracking-tight font-mono block">
                    {destination.code}
                  </span>
                  <span className="text-sm font-bold text-slate-800 block">
                    {destination.city}
                  </span>
                  <span className="text-xs text-slate-500 block truncate" title={destination.name}>
                    {destination.name} (Nhà ga {destination.terminal || 'T1'})
                  </span>
                  <div className="mt-1.5 inline-flex items-center gap-1.5 bg-slate-200/70 text-slate-800 px-2.5 py-0.5 rounded-lg text-xs font-bold">
                    <Clock className="w-3.5 h-3.5 text-slate-600" />
                    <span>Hạ cánh: {formatTime(arrDate)}</span>
                  </div>
                </div>
              </div>

              {/* Row 3: Boarding Key Specs (5 Columns Side-by-Side) */}
              <div className="grid grid-cols-5 gap-2.5">
                {/* Flight */}
                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    {t('flight')}
                  </span>
                  <span className="text-sm font-black text-primary-900 font-mono block mt-0.5">
                    {flight.flightNumber || 'VSK-102'}
                  </span>
                </div>

                {/* Date */}
                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    {t('date')}
                  </span>
                  <span className="text-xs font-extrabold text-slate-800 block mt-0.5">
                    {formatDate(depDate)}
                  </span>
                </div>

                {/* Boarding Time (Golden Highlight) */}
                <div className="p-2.5 bg-amber-50 rounded-xl border border-amber-200">
                  <span className="text-[10px] font-extrabold text-amber-900 uppercase tracking-wider block flex items-center gap-1">
                    <Clock className="w-3 h-3 text-amber-700" />
                    {t('boardingTime')}
                  </span>
                  <span className="text-base font-black text-amber-950 font-mono block mt-0.5">
                    {formatTime(boardingDate)}
                  </span>
                </div>

                {/* Gate */}
                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    {t('gate')}
                  </span>
                  <span className="text-sm font-black text-primary-950 font-mono block mt-0.5">
                    Gate {gateNumber}
                  </span>
                </div>

                {/* Seat (Prominent) */}
                <div className={`p-2.5 rounded-xl shadow-md text-center ${
                  isCancelled
                    ? 'bg-rose-950 text-white border border-rose-800'
                    : 'bg-primary-950 text-white border border-primary-900'
                }`}>
                  <span className={`text-[10px] font-bold uppercase tracking-wider block ${
                    isCancelled ? 'text-rose-300' : 'text-gold-400'
                  }`}>
                    {t('seat')} {isCancelled ? '(ĐÃ TRẢ)' : ''}
                  </span>
                  <span className={`font-black font-mono block mt-0.5 ${
                    isCancelled ? 'text-xs text-rose-200 py-1' : 'text-lg text-white'
                  }`}>
                    {isCancelled ? 'CHƯA ĐẶT' : (ticket.seat?.seatNumber || 'N/A')}
                  </span>
                </div>
              </div>

              {/* Row 4: Gate Close Warning & Baggage Allowance */}
              <div className="flex items-center justify-between gap-3 px-3 py-2 bg-slate-100/70 rounded-xl text-xs text-slate-600">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                  <span className="font-bold text-slate-800">
                    {t('gateCloses')} (Lúc {formatTime(new Date(depDate.getTime() - 15 * 60 * 1000))})
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1 font-semibold">
                    <Luggage className="w-3.5 h-3.5 text-primary-700" />
                    <span>{baggageAllowance}</span>
                  </span>
                  <span>·</span>
                  <span className="font-bold text-primary-900 bg-primary-100/70 px-2 py-0.5 rounded">
                    {zone}
                  </span>
                </div>
              </div>

              {/* Row 5: Horizontal IATA Vector Barcode (PDF417 Simulation) */}
              <div className="p-2.5 bg-white border border-slate-200 rounded-xl flex flex-col items-center justify-center space-y-1">
                <svg
                  className="w-full h-10 max-h-10 overflow-hidden"
                  viewBox="0 0 380 40"
                  preserveAspectRatio="none"
                >
                  {barcodeBars.map((bar, idx) => {
                    const x = idx * 4;
                    return bar.isBar ? (
                      <rect
                        key={idx}
                        x={x}
                        y="0"
                        width={bar.width}
                        height="40"
                        fill="#0f172a"
                      />
                    ) : null;
                  })}
                </svg>

                <div className="text-[9px] font-mono tracking-widest text-slate-500 text-center uppercase select-all font-semibold">
                  {bcbpString}
                </div>
              </div>
            </div>

            {/* VERTICAL PERFORATED TEAR-OFF LINE SEPARATOR */}
            <div className="relative w-0 flex-shrink-0 border-r-2 border-dashed border-slate-300 dark:border-slate-700">
              {/* Top semi-circle punch cutout */}
              <div className="absolute -top-3.5 -left-3 w-6 h-6 bg-slate-100 dark:bg-slate-900 rounded-full border border-slate-300 dark:border-slate-700 z-20 print:border-black" />
              {/* Bottom semi-circle punch cutout */}
              <div className="absolute -bottom-3.5 -left-3 w-6 h-6 bg-slate-100 dark:bg-slate-900 rounded-full border border-slate-300 dark:border-slate-700 z-20 print:border-black" />
            </div>

            {/* RIGHT PANEL: PASSENGER COUPON (CUỐNG VÉ HÀNH KHÁCH - 280px FIXED WIDTH) */}
            <div className="w-[280px] flex-shrink-0 p-5 bg-slate-50/80 flex flex-col justify-between space-y-4">
              {/* Stub Top Header */}
              <div>
                <div className="flex items-center justify-between pb-2.5 border-b border-slate-200">
                  <div>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
                      {t('passengerStub')}
                    </span>
                    <span className="font-extrabold text-xs text-primary-900">
                      HẠT GẠO SKY
                    </span>
                  </div>
                  <span className="text-xs font-mono font-black text-slate-800 bg-white px-2 py-0.5 rounded border border-slate-200">
                    {pnr}
                  </span>
                </div>

                {/* Stub Details */}
                <div className="space-y-2 pt-2.5 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase block font-semibold">
                      {t('passenger')}
                    </span>
                    <strong className="text-slate-900 font-mono text-xs block truncate" title={fullNameIata}>
                      {fullNameIata}
                    </strong>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase block font-semibold">
                        {t('flight')}
                      </span>
                      <strong className="text-primary-900 font-mono text-xs block">
                        {flight.flightNumber || 'VSK-102'}
                      </strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase block font-semibold">
                        {t('date')}
                      </span>
                      <strong className="text-slate-800 text-xs block">
                        {formatDate(depDate)}
                      </strong>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase block font-semibold">
                        Chặng bay
                      </span>
                      <strong className="text-slate-900 font-mono text-xs block">
                        {origin.code} ➔ {destination.code}
                      </strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase block font-semibold">
                        {t('boardingTime')}
                      </span>
                      <strong className="text-amber-800 font-mono text-xs block">
                        {formatTime(boardingDate)}
                      </strong>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-200">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase block font-semibold">
                        {t('gate')}
                      </span>
                      <strong className="text-slate-900 font-mono text-xs block">
                        {gateNumber}
                      </strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase block font-semibold">
                        {t('seat')}
                      </span>
                      <strong className={`font-mono block font-black ${
                        isCancelled ? 'text-xs text-rose-600' : 'text-sm text-primary-950'
                      }`}>
                        {isCancelled ? 'TRẢ CHỖ' : (ticket.seat?.seatNumber || 'N/A')}
                      </strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase block font-semibold">
                        {t('class')}
                      </span>
                      <strong className="text-slate-800 text-xs block">
                        {cabinClass[0]}
                      </strong>
                    </div>
                  </div>
                </div>
              </div>

              {/* 2D QR Code Square at Bottom of Stub */}
              <div className="flex flex-col items-center justify-center p-2.5 bg-white rounded-2xl border border-slate-200 shadow-sm text-center">
                <div
                  onClick={() => setShowQrModal(true)}
                  className="cursor-pointer group relative p-1 bg-white rounded-lg transition hover:scale-105"
                  title="Bấm để phóng to mã QR quét cửa"
                >
                  <svg
                    className="w-20 h-20"
                    viewBox="0 0 25 25"
                    shapeRendering="crispEdges"
                  >
                    {qrMatrix.map((row, r) =>
                      row.map((isFilled, c) =>
                        isFilled ? (
                          <rect
                            key={`${r}-${c}`}
                            x={c}
                            y={r}
                            width={1}
                            height={1}
                            fill="#0f172a"
                          />
                        ) : null
                      )
                    )}
                  </svg>

                  <div className="absolute inset-0 bg-primary-900/10 rounded-lg opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-[10px] font-bold text-primary-950">
                    Phóng to
                  </div>
                </div>

                <span className="text-[9px] text-slate-400 font-medium mt-1">
                  {t('scanQrNotice')}
                </span>
              </div>
            </div>
          </div>

          {/* Bottom Safety & E-Ticket Footer (Full Horizontal Width) */}
          <div className="px-6 py-2 bg-slate-100 border-t border-slate-200 flex items-center justify-between text-[10px] text-slate-500 font-medium">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
              <span>Thẻ lên tàu bay điện tử hợp lệ theo tiêu chuẩn Cục Hàng không Việt Nam (CAAV).</span>
            </div>
            <div className="flex items-center gap-3">
              <span>ETKT: <strong>{ticket.ticketNumber}</strong></span>
              <span>·</span>
              <span>PNR: <strong>{pnr}</strong></span>
            </div>
          </div>
        </div>
      </div>

      {/* QR Code Zoom Modal */}
      {showQrModal && (
        <div
          onClick={() => setShowQrModal(false)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl p-6 sm:p-8 max-w-sm w-full text-center space-y-4 shadow-2xl border border-slate-100"
          >
            <div className="w-12 h-12 rounded-2xl bg-primary-100 text-primary-900 flex items-center justify-center mx-auto">
              <QrCode className="w-6 h-6" />
            </div>

            <div>
              <h3 className="text-lg font-black text-slate-900">
                Mã QR Thẻ lên tàu bay
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Xuất trình mã này tại cửa an ninh sân bay và cửa ra máy bay (Gate {gateNumber})
              </p>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 inline-block">
              <svg
                className="w-48 h-48 mx-auto"
                viewBox="0 0 25 25"
                shapeRendering="crispEdges"
              >
                {qrMatrix.map((row, r) =>
                  row.map((isFilled, c) =>
                    isFilled ? (
                      <rect
                        key={`${r}-${c}`}
                        x={c}
                        y={r}
                        width={1}
                        height={1}
                        fill="#0f172a"
                      />
                    ) : null
                  )
                )}
              </svg>
            </div>

            <div className="text-xs font-mono font-bold text-slate-700 bg-slate-100 p-2 rounded-xl">
              PNR: {pnr} · GHẾ: {ticket.seat?.seatNumber || '17C'}
            </div>

            <button
              type="button"
              onClick={() => setShowQrModal(false)}
              className="w-full py-2.5 rounded-xl bg-slate-900 text-white font-bold text-xs cursor-pointer"
            >
              Đóng
            </button>
          </div>
        </div>
      )}

      {/* Send Email Modal */}
      {showEmailModal && (
        <div
          onClick={() => setShowEmailModal(false)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-7 max-w-md w-full text-left space-y-4 shadow-2xl border border-slate-200 dark:border-slate-800"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-primary-100 dark:bg-primary-950/60 text-primary-900 dark:text-primary-300 flex items-center justify-center flex-shrink-0">
                <Mail className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  {t('sendEmailTitle')}
                </h3>
                <p className="text-xs text-slate-500">
                  {t('sendEmailDesc')}
                </p>
              </div>
            </div>

            {emailSuccess && (
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs text-emerald-800 dark:text-emerald-200 font-bold flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>{emailSuccess}</span>
              </div>
            )}

            {emailError && (
              <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-xl text-xs text-red-700 dark:text-red-300 font-bold flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0" />
                <span>{emailError}</span>
              </div>
            )}

            <form onSubmit={handleSendEmail} className="space-y-4 pt-1">
              <div>
                <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  {t('recipientEmail')} <span className="text-red-500 font-bold">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={targetEmail}
                  onChange={(e) => setTargetEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs font-semibold focus:outline-none"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Vé sẽ được gửi định dạng HTML Thẻ lên tàu bay điện tử kèm đầy đủ mã vạch IATA.
                </span>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowEmailModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 transition cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSendingEmail}
                  className="px-5 py-2 rounded-xl bg-primary-900 hover:bg-primary-800 text-white text-xs font-bold shadow-md transition flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isSendingEmail ? t('sending') : t('sendNow')}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
