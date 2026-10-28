'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useTranslations, useLocale } from 'next-intl';
import { api } from '../../../../lib/api';
import { useAuth } from '../../../../context/AuthContext';
import { CustomerNav } from '../../../../components/layout/CustomerNav';
import {
  Sparkles,
  Award,
  Gift,
  PlusCircle,
  Clock,
  ArrowUpRight,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Copy,
  Check,
  X,
  Crown,
  Plane,
  Luggage,
  Coffee,
  Star,
  Zap,
} from 'lucide-react';

export default function LoyaltyPage() {
  const t = useTranslations();
  const locale = useLocale();
  const { user, role, refreshProfile, openLoginModal, openRegisterModal } = useAuth();
  const isGuest = !user || role === 'GUEST';

  const [account, setAccount] = useState<any | null>(null);
  const [rewards, setRewards] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Redeem modal state
  const [selectedReward, setSelectedReward] = useState<any | null>(null);
  const [redeeming, setRedeeming] = useState(false);
  const [redeemSuccess, setRedeemSuccess] = useState<{
    rewardTitle: string;
    voucherCode: string;
    milesDeducted: number;
    remainingMiles: number;
  } | null>(null);
  const [copiedVoucher, setCopiedVoucher] = useState(false);

  // Buy miles modal state
  const [buyMilesOpen, setBuyMilesOpen] = useState(false);
  const [buyMilesAmount, setBuyMilesAmount] = useState(2000);
  const [buyingMiles, setBuyingMiles] = useState(false);

  // Status message
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      if (isGuest) {
        const rewardsData = await api.getRewards();
        setRewards(rewardsData);
      } else {
        const [accData, rewardsData] = await Promise.all([
          api.getMyLoyalty(),
          api.getRewards(),
        ]);
        setAccount(accData);
        setRewards(rewardsData);
      }
      setLoading(false);
    } catch {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user, role, isGuest]);

  const handleConfirmRedeem = async () => {
    if (!selectedReward) return;
    setRedeeming(true);
    setFeedback(null);
    try {
      const res = await api.exchangeReward(selectedReward.id);
      setSelectedReward(null);
      setRedeeming(false);
      setRedeemSuccess({
        rewardTitle: selectedReward.title,
        voucherCode: res.voucherCode,
        milesDeducted: res.milesDeducted,
        remainingMiles: res.remainingMiles,
      });
      loadData();
      refreshProfile();
    } catch (err: any) {
      setRedeeming(false);
      setFeedback({
        type: 'error',
        message: err.message || 'Không thể thực hiện đổi quà thưởng',
      });
      setSelectedReward(null);
    }
  };

  const copyVoucherCode = (code: string) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(code);
      setCopiedVoucher(true);
      setTimeout(() => setCopiedVoucher(false), 2500);
    }
  };

  const handleBuyMiles = async () => {
    setBuyingMiles(true);
    setFeedback(null);
    try {
      const res = await api.buyMiles({
        milesAmount: buyMilesAmount,
        paymentMethod: 'CREDIT_CARD',
      });
      setFeedback({
        type: 'success',
        message: `Mua thành công ${buyMilesAmount.toLocaleString()} dặm thưởng! Hạng thẻ hiện tại: ${res.currentTier}.`,
      });
      setBuyMilesOpen(false);
      setBuyingMiles(false);
      loadData();
      refreshProfile();
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err.message || 'Giao dịch mua dặm thất bại',
      });
      setBuyingMiles(false);
    }
  };

  if (isGuest) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12">
        {/* HERO SECTION */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary-950 via-primary-900 to-slate-900 p-8 sm:p-12 text-white shadow-2xl border border-gold-500/30">
          <div className="absolute top-0 right-0 -mt-12 -mr-12 w-96 h-96 bg-gold-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-1/3 -mb-16 w-80 h-80 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />

          <div className="relative z-10 max-w-2xl space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-gold-500/15 border border-gold-500/30 text-gold-400 text-xs font-bold tracking-wide">
              <Sparkles className="w-4 h-4 text-gold-400" />
              <span>Hạt Gạo Sky Lotus Club · Frequent Flyer Program</span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
              Đăng ký Hội viên Lotus Club để nhận <span className="text-transparent bg-clip-text bg-gradient-to-r from-gold-300 via-gold-400 to-amber-300">vô vàn ưu đãi đặc quyền</span>
            </h1>

            <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
              Mỗi hành trình cùng Hạt Gạo Sky là một cơ hội nâng tầm trải nghiệm. Tích lũy dặm bay không giới hạn, tận hưởng dịch vụ ưu tiên tại mọi sân bay và quy đổi hàng ngàn voucher, phần quà giá trị.
            </p>

            {/* Quick Guarantees */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs">
              <div className="flex items-center gap-2 bg-white/5 backdrop-blur-sm px-3 py-2 rounded-xl border border-white/10">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span>Đăng ký miễn phí 30s</span>
              </div>
              <div className="flex items-center gap-2 bg-white/5 backdrop-blur-sm px-3 py-2 rounded-xl border border-white/10">
                <Gift className="w-4 h-4 text-gold-400 flex-shrink-0" />
                <span>Tặng 1.000 dặm chào mừng</span>
              </div>
              <div className="flex items-center gap-2 bg-white/5 backdrop-blur-sm px-3 py-2 rounded-xl border border-white/10">
                <Plane className="w-4 h-4 text-blue-400 flex-shrink-0" />
                <span>Tích dặm mọi chuyến bay</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-4 pt-4">
              <button
                type="button"
                onClick={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  openRegisterModal({ x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 });
                }}
                className="px-8 py-3.5 rounded-2xl bg-gradient-to-r from-gold-400 via-gold-500 to-amber-500 hover:from-gold-500 hover:to-amber-600 text-slate-950 font-black text-sm shadow-xl shadow-gold-500/25 flex items-center gap-2 transition cursor-pointer transform hover:-translate-y-0.5"
              >
                <Sparkles className="w-5 h-5 text-slate-950" />
                <span>Đăng ký tại đây</span>
                <ArrowRight className="w-4 h-4 text-slate-950 ml-1" />
              </button>

              <button
                type="button"
                onClick={() => openLoginModal()}
                className="px-6 py-3.5 rounded-2xl bg-white/10 hover:bg-white/15 text-white font-bold text-sm border border-white/20 backdrop-blur-sm transition cursor-pointer"
              >
                Đã có tài khoản? Đăng nhập ngay
              </button>
            </div>
          </div>
        </div>

        {/* 4 CORE PRIVILEGES */}
        <div className="space-y-6">
          <div className="text-center max-w-xl mx-auto space-y-2">
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
              Đặc quyền Vàng dành riêng cho Hội viên
            </h2>
            <p className="text-xs sm:text-sm text-slate-500">
              Khám phá những tiện ích vượt trội được thiết kế để từng chuyến bay của bạn trở nên trọn vẹn
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-md transition space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 flex items-center justify-center font-bold">
                <Star className="w-6 h-6" />
              </div>
              <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
                Tích dặm bay không giới hạn
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Nhận dặm thưởng trên mỗi dặm bay thực tế cùng Hạt Gạo Sky và khi chi tiêu tại hệ thống đối tác khách sạn, du lịch.
              </p>
            </div>

            <div className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-md transition space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 flex items-center justify-center font-bold">
                <Coffee className="w-6 h-6" />
              </div>
              <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
                Phòng chờ Lotus Lounge
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Tận hưởng không gian nghỉ dưỡng tĩnh lặng, ẩm thực Á - Âu cao cấp và quầy bar sang trọng tại Nội Bài, Tân Sơn Nhất, Đà Nẵng.
              </p>
            </div>

            <div className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-md transition space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 flex items-center justify-center font-bold">
                <Zap className="w-6 h-6" />
              </div>
              <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
                Ưu tiên SkyPriority
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Check-in quầy riêng, lối đi an ninh ưu tiên và quyền lên máy bay trước mà không phải xếp hàng chờ đợi.
              </p>
            </div>

            <div className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-md transition space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 flex items-center justify-center font-bold">
                <Luggage className="w-6 h-6" />
              </div>
              <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
                Hành lý miễn cước thêm
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Thoải mái du lịch với từ 10kg đến 20kg hành lý ký gửi miễn phí kèm thẻ hành lý gắn cờ ưu tiên nhận hành lý sớm nhất.
              </p>
            </div>
          </div>
        </div>

        {/* TIERS SHOWCASE */}
        <div className="space-y-6">
          <div className="text-center max-w-xl mx-auto space-y-2">
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
              Hệ thống 4 Hạng thẻ Hội viên
            </h2>
            <p className="text-xs sm:text-sm text-slate-500">
              Càng bay nhiều, đẳng cấp càng thăng hoa với quyền lợi lũy tiến
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Silver Tier */}
            <div className="rounded-3xl p-6 bg-gradient-to-b from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-850 border border-slate-300 dark:border-slate-700 space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-xs font-black uppercase text-slate-600 dark:text-slate-300 tracking-wider">Hội viên Bạc</span>
                <Award className="w-5 h-5 text-slate-400" />
              </div>
              <h4 className="text-xl font-black text-slate-900 dark:text-white">Silver</h4>
              <p className="text-xs text-slate-600 dark:text-slate-400">Từ 0 đến 4.999 dặm</p>
              <ul className="text-xs space-y-2 text-slate-700 dark:text-slate-300 pt-2 border-t border-slate-300/60 dark:border-slate-700">
                <li className="flex items-center gap-1.5">✓ Tích dặm bay tiêu chuẩn</li>
                <li className="flex items-center gap-1.5">✓ Ưu đãi nhân dịp sinh nhật</li>
                <li className="flex items-center gap-1.5">✓ Ưu tiên chọn chỗ ngồi tiêu chuẩn</li>
              </ul>
            </div>

            {/* Titanium Tier */}
            <div className="rounded-3xl p-6 bg-gradient-to-b from-blue-50 to-slate-100 dark:from-blue-950/30 dark:to-slate-850 border border-blue-200 dark:border-blue-900/40 space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-xs font-black uppercase text-blue-700 dark:text-blue-400 tracking-wider">Hội viên Titan</span>
                <Award className="w-5 h-5 text-blue-600" />
              </div>
              <h4 className="text-xl font-black text-slate-900 dark:text-white">Titanium</h4>
              <p className="text-xs text-slate-600 dark:text-slate-400">Từ 5.000 dặm</p>
              <ul className="text-xs space-y-2 text-slate-700 dark:text-slate-300 pt-2 border-t border-blue-200/60 dark:border-slate-700">
                <li className="flex items-center gap-1.5">✓ Cộng thêm 15% dặm thưởng</li>
                <li className="flex items-center gap-1.5">✓ Ưu tiên chọn chỗ ngồi phía trước</li>
                <li className="flex items-center gap-1.5">✓ Ưu tiên xử lý danh sách chờ</li>
              </ul>
            </div>

            {/* Gold Tier */}
            <div className="rounded-3xl p-6 bg-gradient-to-b from-amber-50 to-amber-100/50 dark:from-amber-950/30 dark:to-slate-850 border border-gold-300 dark:border-gold-700/50 space-y-4 shadow-sm">
              <div className="flex justify-between items-center">
                <span className="text-xs font-black uppercase text-amber-700 dark:text-gold-400 tracking-wider">Hội viên Vàng</span>
                <Crown className="w-5 h-5 text-gold-500" />
              </div>
              <h4 className="text-xl font-black text-slate-900 dark:text-white">Gold</h4>
              <p className="text-xs text-slate-600 dark:text-slate-400">Từ 15.000 dặm</p>
              <ul className="text-xs space-y-2 text-slate-700 dark:text-slate-300 pt-2 border-t border-amber-200 dark:border-slate-700">
                <li className="flex items-center gap-1.5 font-semibold text-gold-700 dark:text-gold-400">★ Quầy check-in SkyPriority</li>
                <li className="flex items-center gap-1.5 font-semibold text-gold-700 dark:text-gold-400">★ Tặng thêm 10kg hành lý miễn phí</li>
                <li className="flex items-center gap-1.5">✓ Cộng thêm 30% dặm thưởng</li>
              </ul>
            </div>

            {/* Platinum Tier */}
            <div className="rounded-3xl p-6 bg-gradient-to-br from-primary-950 to-slate-900 text-white border-2 border-gold-400 shadow-xl space-y-4 relative overflow-hidden">
              <div className="absolute top-0 right-0 px-3 py-1 bg-gold-500 text-slate-950 text-[10px] font-black rounded-bl-xl uppercase tracking-wider">
                Đỉnh cao
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs font-black uppercase text-gold-400 tracking-wider">Bạch Kim</span>
                <Crown className="w-5 h-5 text-gold-400" />
              </div>
              <h4 className="text-xl font-black text-white">Platinum</h4>
              <p className="text-xs text-slate-400">Từ 30.000 dặm</p>
              <ul className="text-xs space-y-2 text-slate-200 pt-2 border-t border-white/10">
                <li className="flex items-center gap-1.5 font-bold text-gold-300">★ Phòng chờ Thương gia Lotus Lounge</li>
                <li className="flex items-center gap-1.5 font-bold text-gold-300">★ Lối đi an ninh & lên tàu bay ưu tiên</li>
                <li className="flex items-center gap-1.5 font-bold text-gold-300">★ Thêm 20kg hành lý + Nâng hạng ghế</li>
              </ul>
            </div>
          </div>
        </div>

        {/* REWARDS CATALOG PREVIEW */}
        <div className="space-y-6">
          <div className="text-center max-w-xl mx-auto space-y-2">
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
              Danh mục Quà tặng & Đặc quyền Đổi thưởng
            </h2>
            <p className="text-xs sm:text-sm text-slate-500">
              Dùng dặm tích lũy để quy đổi ngay các dịch vụ bay cao cấp mà không tốn chi phí
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {rewards.map((r) => (
              <div
                key={r.id}
                className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col justify-between space-y-4"
              >
                <div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-primary-50 text-primary-800 dark:bg-primary-950/50 dark:text-primary-300 uppercase tracking-wider">
                    {r.category}
                  </span>
                  <h4 className="text-base font-extrabold text-slate-900 dark:text-white mt-2">
                    {r.title}
                  </h4>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    {r.description}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="text-base font-black text-gold-600 dark:text-gold-400">
                      {r.milesRequired.toLocaleString()}
                    </span>
                    <span className="text-xs text-slate-400 ml-1">dặm</span>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      const rect = e.currentTarget.getBoundingClientRect();
                      openRegisterModal({ x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 });
                    }}
                    className="px-4 py-2 rounded-xl bg-gold-500 hover:bg-gold-600 text-slate-950 font-bold text-xs shadow-sm transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>Đăng ký để đổi quà</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* BOTTOM CALL TO ACTION */}
        <div className="p-8 sm:p-10 rounded-3xl bg-gradient-to-r from-primary-900 via-primary-800 to-primary-950 text-white text-center space-y-4 border border-gold-500/20 shadow-xl">
          <Sparkles className="w-8 h-8 text-gold-400 mx-auto" />
          <h3 className="text-2xl sm:text-3xl font-black">
            Sẵn sàng nâng tầm hành trình cùng Hạt Gạo Sky?
          </h3>
          <p className="text-xs sm:text-sm text-slate-300 max-w-lg mx-auto leading-relaxed">
            Đăng ký Hội viên hoàn toàn miễn phí ngay hôm nay. Chỉ mất 30 giây để bắt đầu tích lũy dặm thưởng cho chuyến bay kế tiếp của bạn!
          </p>
          <div className="pt-2">
            <button
              type="button"
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                openRegisterModal({ x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 });
              }}
              className="px-8 py-3.5 rounded-2xl bg-gradient-to-r from-gold-400 to-amber-500 hover:from-gold-500 hover:to-amber-600 text-slate-950 font-black text-sm shadow-xl shadow-gold-500/30 inline-flex items-center gap-2 transition cursor-pointer transform hover:-translate-y-0.5"
            >
              <Sparkles className="w-5 h-5 text-slate-950" />
              <span>Đăng ký tại đây</span>
              <ArrowRight className="w-4 h-4 text-slate-950" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <CustomerNav />
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-gold-600 dark:text-gold-400">
              <Sparkles className="w-4 h-4" />
              <span>Hạt Gạo Sky Lotus Club Frequent Flyer</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-1">
              {t('loyalty.title')}
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setBuyMilesOpen(true)}
              className="px-4 py-2 bg-gold-500 hover:bg-gold-600 text-slate-950 font-bold text-xs rounded-xl shadow-sm flex items-center gap-1.5 transition"
            >
              <PlusCircle className="w-4 h-4" />
              <span>{t('loyalty.buyMiles')}</span>
            </button>
          </div>
        </div>

        {/* Feedback message */}
        {feedback && (
          <div
            className={`p-4 rounded-2xl flex items-center gap-3 text-xs font-bold ${
              feedback.type === 'success'
                ? 'bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
                : 'bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300'
            }`}
          >
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-emerald-600" />
            ) : (
              <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-600" />
            )}
            <span>{feedback.message}</span>
          </div>
        )}

        {/* Membership Tier Digital Card */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-5">
            <div className="rounded-3xl p-6 sm:p-8 bg-gradient-to-br from-slate-950 via-primary-950 to-primary-900 text-white shadow-2xl relative overflow-hidden border border-white/10 space-y-6">
              {/* Card Header */}
              <div className="flex justify-between items-start relative z-10">
                <div>
                  <span className="text-[10px] uppercase tracking-widest text-gold-400 font-bold block">
                    Hạt Gạo Sky Lotus Club Card
                  </span>
                  <div className="text-xl font-black mt-0.5 tracking-wide">
                    {account?.tier || 'STANDARD'} MEMBER
                  </div>
                </div>
                <Award className="w-8 h-8 text-gold-400" />
              </div>

              {/* Miles Count */}
              <div className="space-y-1 relative z-10">
                <span className="text-xs text-slate-400 block">{t('loyalty.availableMiles')}</span>
                <div className="text-4xl font-black text-gold-400">
                  {account?.availableMiles?.toLocaleString() || '0'}{' '}
                  <span className="text-sm font-normal text-white">dặm</span>
                </div>
              </div>

              {/* Card Footer */}
              <div className="pt-4 border-t border-white/10 flex justify-between items-center text-xs text-slate-300 relative z-10">
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase">Chủ thẻ</span>
                  <strong className="text-white font-bold">{user?.fullName}</strong>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 block uppercase">Mã hội viên</span>
                  <strong className="text-gold-300 font-mono font-bold">
                    {account?.memberCode || 'VSK-889900'}
                  </strong>
                </div>
              </div>
            </div>

            {/* Tier Progress */}
            <div className="mt-4 p-5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-3 text-xs">
              <div className="flex justify-between font-bold text-slate-800 dark:text-slate-200">
                <span>Tiến trình nâng hạng thẻ</span>
                <span className="text-primary-700 dark:text-primary-400">
                  {account?.totalMilesEarned?.toLocaleString()} dặm tích lũy
                </span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                <div
                  className="bg-gold-500 h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.min(100, ((account?.totalMilesEarned || 0) / 30000) * 100)}%`,
                  }}
                />
              </div>
              <p className="text-slate-500 text-[11px]">
                {account?.nextTier !== 'MAX_TIER'
                  ? t('loyalty.progressToNext', {
                      miles: account?.milesToNextTier?.toLocaleString() || 0,
                      tier: account?.nextTier || 'SILVER',
                    })
                  : 'Quý khách đang giữ hạng thẻ cao nhất (Platinum) của Hạt Gạo Sky!'}
              </p>
            </div>
          </div>

          {/* Right Column: Rewards Catalog */}
          <div className="lg:col-span-7 space-y-4">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Gift className="w-5 h-5 text-primary-600" />
              <span>{t('loyalty.catalog')}</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {rewards.map((r) => {
                const canAfford = (account?.availableMiles || 0) >= r.milesRequired;

                return (
                  <div
                    key={r.id}
                    className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col justify-between space-y-4 hover:shadow-premium transition"
                  >
                    <div className="space-y-2">
                      <span className="inline-block px-2 py-0.5 rounded-full bg-primary-50 dark:bg-slate-800 text-primary-700 dark:text-primary-300 text-[10px] font-bold uppercase">
                        {r.category}
                      </span>
                      <h4 className="font-extrabold text-xs text-slate-900 dark:text-white leading-snug">
                        {r.title}
                      </h4>
                      <p className="text-[11px] text-slate-500 leading-relaxed">
                        {r.description}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                      <div>
                        <span className="text-sm font-black text-gold-600 dark:text-gold-400">
                          {r.milesRequired.toLocaleString()}
                        </span>
                        <span className="text-[10px] text-slate-400 ml-1">dặm</span>
                      </div>

                      <button
                        type="button"
                        disabled={!canAfford}
                        onClick={() => setSelectedReward(r)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                          canAfford
                            ? 'bg-primary-900 hover:bg-primary-800 text-white shadow-sm'
                            : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                        }`}
                      >
                        {canAfford ? t('loyalty.redeemNow') : 'Chưa đủ dặm'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Miles Transaction History Table */}
            <div className="pt-6">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                <Clock className="w-4 h-4 text-slate-400" />
                <span>{t('loyalty.history')}</span>
              </h3>

              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 overflow-hidden shadow-sm">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 text-slate-500 font-semibold">
                    <tr>
                      <th className="p-3">Thời gian</th>
                      <th className="p-3">Loại giao dịch</th>
                      <th className="p-3">Nội dung</th>
                      <th className="p-3 text-right">Biến động dặm</th>
                      <th className="p-3 text-right">Số dư sau</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {account?.transactions?.map((tx: any) => (
                      <tr key={tx.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                        <td className="p-3 text-slate-500">
                          {new Date(tx.createdAt).toLocaleDateString('vi-VN')}
                        </td>
                        <td className="p-3 font-bold">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] ${
                              tx.type === 'EARN'
                                ? 'bg-emerald-50 text-emerald-700'
                                : tx.type === 'PURCHASE'
                                ? 'bg-blue-50 text-blue-700'
                                : 'bg-amber-50 text-amber-700'
                            }`}
                          >
                            {tx.type}
                          </span>
                        </td>
                        <td className="p-3 text-slate-700 dark:text-slate-300">{tx.description}</td>
                        <td className="p-3 text-right font-black">
                          <span className={tx.amount > 0 ? 'text-emerald-600' : 'text-red-500'}>
                            {tx.amount > 0 ? `+${tx.amount.toLocaleString()}` : tx.amount.toLocaleString()}
                          </span>
                        </td>
                        <td className="p-3 text-right font-bold text-slate-800 dark:text-slate-200">
                          {tx.balanceAfter.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        {/* Modal: Confirm Reward Redemption */}
        {selectedReward && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in">
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-xl bg-gold-100 dark:bg-gold-950/50 text-gold-600 flex items-center justify-center">
                    <Gift className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">
                      Xác nhận đổi quà tặng
                    </h3>
                    <p className="text-[11px] text-slate-500">Hạt Gạo Sky Lotus Club Rewards</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedReward(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-100 dark:border-slate-750 space-y-2">
                <span className="text-[10px] font-bold tracking-wider px-2 py-0.5 rounded bg-primary-100 text-primary-800 dark:bg-primary-950/50 dark:text-primary-300">
                  {selectedReward.category}
                </span>
                <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">
                  {selectedReward.title}
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {selectedReward.description}
                </p>
              </div>

              <div className="space-y-2 text-xs font-semibold">
                <div className="flex justify-between text-slate-500">
                  <span>Dặm thưởng hiện có:</span>
                  <span className="font-bold text-slate-900 dark:text-white">
                    {account?.availableMiles?.toLocaleString()} dặm
                  </span>
                </div>
                <div className="flex justify-between text-amber-600 dark:text-gold-400">
                  <span>Số dặm sẽ trừ:</span>
                  <span className="font-bold">
                    -{selectedReward.milesRequired?.toLocaleString()} dặm
                  </span>
                </div>
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-between font-bold text-slate-900 dark:text-white">
                  <span>Số dặm còn lại sau khi đổi:</span>
                  <span className="text-primary-700 dark:text-primary-400 text-sm">
                    {Math.max(0, (account?.availableMiles || 0) - selectedReward.milesRequired).toLocaleString()} dặm
                  </span>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  disabled={redeeming}
                  onClick={() => setSelectedReward(null)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl transition"
                >
                  Hủy bỏ
                </button>
                <button
                  type="button"
                  disabled={redeeming}
                  onClick={handleConfirmRedeem}
                  className="px-5 py-2.5 bg-primary-900 hover:bg-primary-800 text-white text-xs font-bold rounded-xl shadow-md transition flex items-center gap-2"
                >
                  {redeeming ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Đang xử lý đổi quà...</span>
                    </>
                  ) : (
                    <>
                      <Gift className="w-4 h-4" />
                      <span>Xác nhận đổi ngay</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal: Redeem Success Celebration */}
        {redeemSuccess && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in">
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 max-w-md w-full border border-emerald-200 dark:border-emerald-900/50 shadow-2xl text-center space-y-5">
              <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle2 className="w-9 h-9" />
              </div>

              <div>
                <span className="text-xs font-extrabold uppercase text-gold-600 dark:text-gold-400 tracking-wider">
                  Lotus Club Reward
                </span>
                <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-1">
                  Đổi quà thành công!
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Quý khách đã đổi thành công <strong>{redeemSuccess.rewardTitle}</strong>
                </p>
              </div>

              {/* Voucher Box */}
              <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border-2 border-dashed border-gold-400 dark:border-gold-600 space-y-2">
                <span className="text-[11px] font-semibold text-slate-500 block">
                  MÃ VOUCHER KÍCH HOẠT DỊCH VỤ
                </span>
                <div className="flex items-center justify-center gap-3">
                  <span className="text-xl sm:text-2xl font-black tracking-widest text-primary-900 dark:text-white select-all">
                    {redeemSuccess.voucherCode}
                  </span>
                  <button
                    type="button"
                    onClick={() => copyVoucherCode(redeemSuccess.voucherCode)}
                    className="p-2 rounded-xl bg-white dark:bg-slate-700 hover:bg-slate-100 text-slate-700 dark:text-slate-200 shadow-sm transition border border-slate-200 dark:border-slate-600"
                    title="Sao chép mã voucher"
                  >
                    {copiedVoucher ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
                {copiedVoucher && (
                  <p className="text-[11px] font-bold text-emerald-600 animate-in fade-in">
                    ✓ Đã sao chép mã vào clipboard!
                  </p>
                )}
              </div>

              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl text-xs text-emerald-800 dark:text-emerald-200 flex justify-between font-bold">
                <span>Số dặm đã trừ: -{redeemSuccess.milesDeducted?.toLocaleString()}</span>
                <span>Dặm còn lại: {redeemSuccess.remainingMiles?.toLocaleString()}</span>
              </div>

              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                Mã voucher đã được gửi vào email cá nhân và lưu tại bảng Lịch sử biến động dặm bên dưới. Quý khách có thể xuất trình mã này tại quầy sân bay hoặc nhập khi thanh toán vé máy bay.
              </p>

              <button
                type="button"
                onClick={() => setRedeemSuccess(null)}
                className="w-full py-3 bg-primary-900 hover:bg-primary-800 text-white font-bold text-xs rounded-xl shadow-md transition cursor-pointer"
              >
                Hoàn tất & Đóng
              </button>
            </div>
          </div>
        )}

        {/* Modal: Buy Miles */}
        {buyMilesOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in">
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-sm w-full border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <PlusCircle className="w-5 h-5 text-gold-500" />
                <span>Mua thêm dặm thưởng</span>
              </h3>
              <p className="text-xs text-slate-500">
                Đơn giá: <strong>500 VND / dặm</strong>. Dặm sẽ được cộng ngay sau khi thanh toán.
              </p>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 block">
                  Số lượng dặm cần mua
                </label>
                <select
                  value={buyMilesAmount}
                  onChange={(e) => setBuyMilesAmount(Number(e.target.value))}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-xs font-bold"
                >
                  <option value={1000}>1.000 dặm (500.000 VND)</option>
                  <option value={2000}>2.000 dặm (1.000.000 VND)</option>
                  <option value={5000}>5.000 dặm (2.500.000 VND)</option>
                  <option value={10000}>10.000 dặm (5.000.000 VND)</option>
                </select>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl text-xs flex justify-between font-bold">
                <span>Tổng thanh toán:</span>
                <span className="text-primary-700 dark:text-gold-400">
                  {(buyMilesAmount * 500).toLocaleString('vi-VN')} VND
                </span>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={() => setBuyMilesOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-xs font-bold rounded-xl"
                >
                  Hủy bỏ
                </button>
                <button
                  disabled={buyingMiles}
                  onClick={handleBuyMiles}
                  className="px-4 py-2 bg-gold-500 hover:bg-gold-600 text-slate-950 text-xs font-bold rounded-xl shadow-md"
                >
                  {buyingMiles ? 'Đang thanh toán...' : 'Xác nhận mua'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
  );
}
