'use client';

import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTranslations, useLocale } from 'next-intl';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api';
import {
  Plane,
  Lock,
  Mail,
  User,
  Phone,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  X,
  FastForward,
  RotateCcw,
  Sparkles,
  QrCode,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';

type AnimationPhase = 'launch' | 'flying' | 'zooming' | 'morphing' | 'morphed';

export const RegisterTicketModal: React.FC = () => {
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();
  const { isRegisterModalOpen, closeRegisterModal, openLoginModal, registerModalOrigin } = useAuth();

  const [mounted, setMounted] = useState(false);
  const [phase, setPhase] = useState<AnimationPhase>('launch');
  const [animKey, setAnimKey] = useState(0);

  // Form states
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreedTerms, setAgreedTerms] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successResult, setSuccessResult] = useState<any | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Continuous Seamless Sequence Orchestration
  useEffect(() => {
    if (isRegisterModalOpen) {
      document.body.style.overflow = 'hidden';
      setError(null);
      setSuccessResult(null);

      // Check prefers-reduced-motion
      const prefersReduced =
        typeof window !== 'undefined' &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches;

      if (prefersReduced) {
        setPhase('morphed');
        return;
      }

      // Step 1: Spawn at origin
      setPhase('launch');
      setAnimKey((k) => k + 1);

      // Step 2: 3D Flight & Tumble forward (50ms)
      const t1 = setTimeout(() => {
        setPhase('flying');
      }, 50);

      // Step 3: Decelerate & Zoom to Frontal 0deg (650ms)
      const t2 = setTimeout(() => {
        setPhase('zooming');
      }, 650);

      // Step 4: Continuous Morph begins (1150ms) - Ticket dissolves as Card expands smoothly
      const t3 = setTimeout(() => {
        setPhase('morphing');
      }, 1150);

      // Step 5: Fully stabilized Form state (1800ms)
      const t4 = setTimeout(() => {
        setPhase('morphed');
      }, 1800);

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          closeRegisterModal();
        }
      };
      window.addEventListener('keydown', handleKeyDown);

      return () => {
        document.body.style.overflow = '';
        clearTimeout(t1);
        clearTimeout(t2);
        clearTimeout(t3);
        clearTimeout(t4);
        window.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [isRegisterModalOpen, closeRegisterModal]);

  const handleSkipAnimation = () => {
    setPhase('morphed');
  };

  const handleReplayAnimation = () => {
    setPhase('launch');
    setAnimKey((k) => k + 1);
    setTimeout(() => setPhase('flying'), 50);
    setTimeout(() => setPhase('zooming'), 650);
    setTimeout(() => setPhase('morphing'), 1150);
    setTimeout(() => setPhase('morphed'), 1800);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!fullName.trim()) {
      setError('Vui lòng nhập họ và tên đầy đủ');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setError('Vui lòng nhập địa chỉ email hợp lệ');
      return;
    }
    if (phone.trim().length < 9) {
      setError('Số điện thoại không hợp lệ (tối thiểu 9 số)');
      return;
    }
    if (password.length < 6) {
      setError('Mật khẩu phải có tối thiểu 6 ký tự');
      return;
    }
    if (password !== confirmPassword) {
      setError('Mật khẩu xác nhận không khớp');
      return;
    }
    if (!agreedTerms) {
      setError('Vui lòng xác nhận đồng ý với Điều khoản dịch vụ và Chính sách hội viên');
      return;
    }

    setLoading(true);
    try {
      const res = await api.register({
        fullName,
        email,
        phone,
        password,
      });
      setSuccessResult(res);
      setLoading(false);
    } catch (err: any) {
      setError(err.message || 'Đăng ký không thành công');
      setLoading(false);
    }
  };

  if (!isRegisterModalOpen || !mounted) return null;

  const winW = typeof window !== 'undefined' ? window.innerWidth : 1000;
  const winH = typeof window !== 'undefined' ? window.innerHeight : 800;
  const startX = registerModalOrigin?.x ?? winW / 2;
  const startY = registerModalOrigin?.y ?? 70;
  const deltaX = startX - winW / 2;
  const deltaY = startY - winH / 2;

  const isMorphedOrMorphing = phase === 'morphing' || phase === 'morphed';
  const isFullyMorphed = phase === 'morphed';

  // Calculate dynamic 3D card transform without discontinuous jumps
  let cardTransform = 'translate3d(0, 0, 0) scale(1) rotateX(0deg) rotateY(0deg) rotateZ(0deg)';
  let cardTransition = 'transform 0.65s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.3s ease';

  if (phase === 'launch') {
    cardTransform = `translate3d(${deltaX}px, ${deltaY}px, 0px) scale(0.22) rotateX(32deg) rotateY(-28deg) rotateZ(10deg)`;
    cardTransition = 'none';
  } else if (phase === 'flying') {
    cardTransform = 'translate3d(0px, 0px, 120px) scale(1) rotateX(14deg) rotateY(-18deg) rotateZ(3deg)';
    cardTransition = 'transform 0.65s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.3s ease';
  } else if (phase === 'zooming') {
    cardTransform = 'translate3d(0px, 0px, 0px) scale(1.02) rotateX(0deg) rotateY(0deg) rotateZ(0deg)';
    cardTransition = 'transform 0.5s cubic-bezier(0.22, 1, 0.36, 1)';
  } else {
    // morphing & morphed
    cardTransform = 'translate3d(0px, 0px, 0px) scale(1) rotateX(0deg) rotateY(0deg) rotateZ(0deg)';
    cardTransition = 'transform 0.5s cubic-bezier(0.22, 1, 0.36, 1)';
  }

  return createPortal(
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 overflow-y-auto overflow-x-hidden select-none perspective-1200">
      {/* 1. Backdrop - Smooth fade in */}
      <div
        className="fixed inset-0 bg-slate-950/80 backdrop-blur-md transition-opacity duration-500 z-0"
        onClick={closeRegisterModal}
      />

      {/* 2. Button Ripple Effect at Launch Point */}
      {phase === 'launch' && (
        <div
          className="fixed pointer-events-none z-10 w-16 h-16 rounded-full bg-gold-400/40 border-2 border-gold-300 animate-button-ring -translate-x-1/2 -translate-y-1/2"
          style={{ left: `${startX}px`, top: `${startY}px` }}
        />
      )}

      {/* 3. Top Controls (Skip & Close) */}
      <div className="fixed top-5 right-5 flex items-center gap-2 z-50">
        {!isFullyMorphed ? (
          <button
            type="button"
            onClick={handleSkipAnimation}
            className="flex items-center gap-1.5 text-xs font-bold text-gold-400 bg-slate-900/80 hover:bg-slate-800 px-3 py-1.5 rounded-full border border-gold-400/40 shadow-lg backdrop-blur-sm transition cursor-pointer"
          >
            <FastForward className="w-3.5 h-3.5" />
            <span>Bỏ qua hiệu ứng</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={handleReplayAnimation}
            title="Xem lại hiệu ứng biến đổi vé 3D"
            className="p-2 rounded-full bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-gold-400 border border-slate-700/60 shadow-lg transition cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        )}

        <button
          type="button"
          onClick={closeRegisterModal}
          className="p-2 rounded-full bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/60 shadow-lg transition cursor-pointer"
          aria-label="Đóng"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* ========================================================
          4. THE SINGLE CONTINUOUS CARD SHELL (Never unmounted!)
          ======================================================== */}
      <div
        key={animKey}
        className="relative z-30 flex justify-center w-full max-w-lg my-auto"
        style={{ perspective: '1200px' }}
      >
        <div
          className="relative rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-[0_30px_70px_-15px_rgba(15,43,92,0.5)] p-0"
          style={{
            transform: cardTransform,
            transformStyle: 'preserve-3d',
            opacity: phase === 'launch' ? 0.3 : 1,
            width: isMorphedOrMorphing ? 'min(500px, 94vw)' : 'min(540px, 92vw)',
            height: isFullyMorphed ? 'auto' : isMorphedOrMorphing ? 'min(680px, 92vh)' : '224px',
            maxHeight: '92vh',
            overflowY: isFullyMorphed ? 'auto' : 'hidden',
            overflowX: 'hidden',
            transition: `${cardTransition}, width 0.65s cubic-bezier(0.22, 1, 0.36, 1), height 0.65s cubic-bezier(0.22, 1, 0.36, 1)`,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* ========================================================
              LAYER A: THE BOARDING PASS FACE (Dissolves gracefully)
              ======================================================== */}
          <div
            className="w-full absolute inset-x-0 top-0 h-[224px] flex flex-col justify-between transition-all duration-500 ease-out z-20"
            style={{
              opacity: isMorphedOrMorphing ? 0 : 1,
              transform: isMorphedOrMorphing ? 'scale(0.96) translateY(-10px)' : 'scale(1) translateY(0)',
              filter: isMorphedOrMorphing ? 'blur(4px)' : 'blur(0px)',
              pointerEvents: isMorphedOrMorphing ? 'none' : 'auto',
            }}
          >
            {/* Metallic Shimmer Sweep on Ticket Face */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden z-30">
              <div className="w-1/2 h-full bg-gradient-to-r from-transparent via-white/40 to-transparent transform -skew-x-25 animate-ticket-shimmer" />
            </div>

            {/* Ticket Header Banner */}
            <div className="bg-gradient-to-r from-primary-950 via-primary-900 to-primary-800 text-white px-6 py-3 flex items-center justify-between border-b border-gold-400/30 flex-shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-gold-400 text-primary-950 flex items-center justify-center font-bold shadow">
                  <Plane className="w-4 h-4 transform -rotate-45" />
                </div>
                <div>
                  <span className="text-sm font-black tracking-wide text-white flex items-center gap-1">
                    HẠT GẠO <span className="text-gold-400 font-bold">SKY</span>
                  </span>
                  <span className="text-[9px] text-slate-300 uppercase tracking-wider block font-semibold">
                    Boarding Pass · Thẻ lên máy bay
                  </span>
                </div>
              </div>

              <div className="text-right">
                <span className="text-[10px] font-bold text-gold-400 uppercase tracking-widest block">
                  FIRST CLASS / VIP
                </span>
                <span className="text-xs font-mono font-bold text-slate-200">
                  FLIGHT HG-888
                </span>
              </div>
            </div>

            {/* Ticket Body with Route & Perforation Stub */}
            <div className="p-4 sm:p-5 flex flex-col sm:flex-row items-stretch justify-between gap-4 relative flex-1">
              {/* Left Route Block */}
              <div className="flex-1 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">
                      Khởi hành / From
                    </span>
                    <span className="text-xl sm:text-2xl font-black text-primary-900 dark:text-white">
                      SGN
                    </span>
                    <span className="text-[10px] text-slate-500 font-medium block">
                      Hồ Chí Minh
                    </span>
                  </div>

                  <div className="flex flex-col items-center px-3">
                    <span className="text-[8px] font-bold text-gold-600 dark:text-gold-400 uppercase tracking-wider mb-0.5">
                      Direct 2g 15p
                    </span>
                    <div className="flex items-center gap-1 text-primary-600 dark:text-primary-400">
                      <div className="w-6 sm:w-10 h-0.5 bg-gradient-to-r from-primary-400 to-gold-400" />
                      <Plane className="w-3.5 h-3.5 transform rotate-90 text-gold-500" />
                      <div className="w-6 sm:w-10 h-0.5 bg-gradient-to-r from-gold-400 to-primary-400" />
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">
                      Điểm đến / To
                    </span>
                    <span className="text-xl sm:text-2xl font-black text-primary-900 dark:text-white">
                      HAN
                    </span>
                    <span className="text-[10px] text-slate-500 font-medium block">
                      Hà Nội (Nội Bài)
                    </span>
                  </div>
                </div>

                {/* Passenger & Seat details */}
                <div className="grid grid-cols-4 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-[10px]">
                  <div>
                    <span className="text-[8px] text-slate-400 font-bold uppercase block">Hành khách</span>
                    <span className="font-bold text-slate-800 dark:text-slate-100 truncate block">HỘI VIÊN MỚI</span>
                  </div>
                  <div>
                    <span className="text-[8px] text-slate-400 font-bold uppercase block">Cửa / Gate</span>
                    <span className="font-mono font-bold text-slate-800 dark:text-slate-100 block">08</span>
                  </div>
                  <div>
                    <span className="text-[8px] text-slate-400 font-bold uppercase block">Ghế / Seat</span>
                    <span className="font-mono font-bold text-gold-600 dark:text-gold-400 block">01A</span>
                  </div>
                  <div>
                    <span className="text-[8px] text-slate-400 font-bold uppercase block">Giờ bay</span>
                    <span className="font-mono font-bold text-slate-800 dark:text-slate-100 block">08:30</span>
                  </div>
                </div>
              </div>

              {/* Perforation Divider with Notches */}
              <div className="hidden sm:block relative w-0 border-r-2 border-dashed border-slate-300 dark:border-slate-700 my-[-20px]">
                <div className="absolute -top-3 -left-3 w-6 h-6 rounded-full bg-slate-950 border border-slate-800" />
                <div className="absolute -bottom-3 -left-3 w-6 h-6 rounded-full bg-slate-950 border border-slate-800" />
              </div>

              {/* Stub with QR code */}
              <div className="sm:w-28 flex sm:flex-col items-center justify-between sm:justify-center gap-1 pt-1 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-slate-800 text-center">
                <div className="w-12 h-12 p-1 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-center">
                  <QrCode className="w-10 h-10 text-primary-900 dark:text-white" />
                </div>
                <div>
                  <span className="text-[8px] font-mono text-slate-400 tracking-wider block">
                    ETKT-HG888
                  </span>
                  <span className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 block">
                    ✓ CONFIRMED
                  </span>
                </div>
              </div>
            </div>

            {/* Bottom Barcode Strip */}
            <div className="bg-slate-50 dark:bg-slate-800/60 px-6 py-1.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[9px] text-slate-400 font-mono flex-shrink-0">
              <div className="flex items-center gap-1 font-sans font-semibold text-primary-700 dark:text-primary-300">
                <Sparkles className="w-3 h-3 text-gold-500" />
                <span>Vé bay mở lối hành trình hội viên Lotus Club</span>
              </div>
              <span className="tracking-widest">||| | |||| | ||| |||| | ||</span>
            </div>
          </div>

          {/* ========================================================
              LAYER B: THE REGISTRATION FORM (Emerges smoothly inside card)
              ======================================================== */}
          <div
            className="w-full p-6 sm:p-8 space-y-5 transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] z-10"
            style={{
              opacity: isMorphedOrMorphing ? 1 : 0,
              transform: isMorphedOrMorphing ? 'translateY(0)' : 'translateY(18px)',
              pointerEvents: isMorphedOrMorphing ? 'auto' : 'none',
            }}
          >
            {/* Header Branding & Journey Title */}
            <div className={`text-center space-y-1.5 ${isMorphedOrMorphing ? 'animate-stagger-1' : 'opacity-0'}`}>
              <div className="relative inline-block">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary-900 via-primary-800 to-primary-700 text-gold-400 flex items-center justify-center mx-auto shadow-lg shadow-primary-900/20 border border-gold-400/30">
                  <Plane className="w-6 h-6 transform -rotate-45" />
                </div>
                <div className="absolute -top-1 -right-1 bg-gold-400 text-primary-950 p-0.5 rounded-full shadow">
                  <Sparkles className="w-2.5 h-2.5" />
                </div>
              </div>

              <div>
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                  Bắt đầu hành trình của bạn
                </h1>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Đăng ký hội viên để khám phá những hành trình mới cùng Hạt Gạo Sky
                </p>
              </div>
            </div>

            {/* Error Banner */}
            {error && (
              <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-xl flex items-center gap-2 text-xs text-red-700 dark:text-red-300 animate-in fade-in">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Success Celebration */}
            {successResult ? (
              <div className="p-6 bg-emerald-50 dark:bg-emerald-950/40 rounded-2xl border border-emerald-200 dark:border-emerald-800 text-center space-y-3 animate-in fade-in">
                <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
                <h3 className="font-bold text-base text-emerald-900 dark:text-emerald-200">
                  Chúc mừng Quý khách gia nhập Hạt Gạo Sky!
                </h3>
                <p className="text-xs text-emerald-700 dark:text-emerald-300">
                  Tài khoản Hội viên Lotus Club của Quý khách đã được kích hoạt thành công.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    closeRegisterModal();
                    openLoginModal();
                  }}
                  className="mt-3 px-6 py-2.5 bg-primary-900 text-white font-bold text-xs rounded-xl shadow-md hover:bg-primary-800 transition inline-flex items-center gap-2 cursor-pointer"
                >
                  <span>Đăng nhập ngay để bắt đầu bay</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            ) : (
              /* The Registration Form with Staggered Elements */
              <form onSubmit={handleSubmit} className="space-y-3.5">
                {/* Field 1: Full Name */}
                <div className={isMorphedOrMorphing ? 'animate-stagger-1' : 'opacity-0'}>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Họ và tên đầy đủ *
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Nguyễn Văn An"
                      className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl pl-9 pr-3 py-2.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-primary-500 transition"
                      required
                    />
                  </div>
                </div>

                {/* Field 2: Email */}
                <div className={isMorphedOrMorphing ? 'animate-stagger-2' : 'opacity-0'}>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Email nhận vé & thông báo *
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@example.com"
                      className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl pl-9 pr-3 py-2.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-primary-500 transition"
                      required
                    />
                  </div>
                </div>

                {/* Field 3: Phone */}
                <div className={isMorphedOrMorphing ? 'animate-stagger-3' : 'opacity-0'}>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Số điện thoại liên hệ *
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="0912345678"
                      className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl pl-9 pr-3 py-2.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-primary-500 transition"
                      required
                    />
                  </div>
                </div>

                {/* Field 4: Password & Confirm Password */}
                <div className={`grid grid-cols-1 sm:grid-cols-2 gap-3 ${isMorphedOrMorphing ? 'animate-stagger-4' : 'opacity-0'}`}>
                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                      Mật khẩu (≥ 6 ký tự) *
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                      <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl pl-9 pr-3 py-2.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-primary-500 transition"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                      Xác nhận mật khẩu *
                    </label>
                    <div className="relative">
                      <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                      <input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl pl-9 pr-3 py-2.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-primary-500 transition"
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Field 5: Terms Agreement Checkbox */}
                <div className={`pt-1 ${isMorphedOrMorphing ? 'animate-stagger-5' : 'opacity-0'}`}>
                  <label className="flex items-start gap-2.5 cursor-pointer text-xs text-slate-600 dark:text-slate-300">
                    <input
                      type="checkbox"
                      checked={agreedTerms}
                      onChange={(e) => setAgreedTerms(e.target.checked)}
                      className="mt-0.5 w-4 h-4 rounded text-primary-600 focus:ring-primary-500 cursor-pointer"
                    />
                    <span>
                      Tôi đồng ý với{' '}
                      <span className="font-bold text-primary-600 dark:text-gold-400">Điều khoản dịch vụ</span>{' '}
                      và <span className="font-bold text-primary-600 dark:text-gold-400">Chính sách hội viên Lotus Club</span> của Hạt Gạo Sky.
                    </span>
                  </label>
                </div>

                {/* Field 6: Submit Button */}
                <div className={`pt-1 ${isMorphedOrMorphing ? 'animate-stagger-6' : 'opacity-0'}`}>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 bg-gradient-to-r from-primary-900 via-primary-800 to-primary-900 hover:from-primary-800 hover:to-primary-700 text-white font-bold text-xs rounded-xl shadow-lg shadow-primary-950/20 hover:shadow-xl transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70"
                  >
                    {loading ? (
                      <span>Đang tạo tài khoản...</span>
                    ) : (
                      <>
                        <Plane className="w-4 h-4 transform -rotate-45 text-gold-400" />
                        <span>Tạo tài khoản Hội viên</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}

            {/* Switch to Login button */}
            <div className={`text-center text-xs text-slate-500 dark:text-slate-400 pt-3 border-t border-slate-100 dark:border-slate-800 ${isMorphedOrMorphing ? 'animate-stagger-6' : 'opacity-0'}`}>
              Đã có tài khoản Hội viên?{' '}
              <button
                type="button"
                onClick={() => {
                  closeRegisterModal();
                  openLoginModal();
                }}
                className="font-bold text-primary-600 dark:text-gold-400 hover:underline cursor-pointer"
              >
                Đăng nhập ngay
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};
