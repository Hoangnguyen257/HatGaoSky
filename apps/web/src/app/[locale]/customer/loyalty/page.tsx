'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useTranslations, useLocale } from 'next-intl';
import { api } from '../../../../lib/api';
import { useAuth } from '../../../../context/AuthContext';
import { RoleGuard } from '../../../../components/layout/RoleGuard';
import { CustomerNav } from '../../../../components/layout/CustomerNav';
import {
  Sparkles,
  Award,
  Gift,
  PlusCircle,
  Clock,
  ArrowUpRight,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';

export default function LoyaltyPage() {
  const t = useTranslations();
  const locale = useLocale();
  const { user, refreshProfile } = useAuth();

  const [account, setAccount] = useState<any | null>(null);
  const [rewards, setRewards] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Buy miles modal state
  const [buyMilesOpen, setBuyMilesOpen] = useState(false);
  const [buyMilesAmount, setBuyMilesAmount] = useState(2000);
  const [buyingMiles, setBuyingMiles] = useState(false);

  // Status message
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [accData, rewardsData] = await Promise.all([
        api.getMyLoyalty(),
        api.getRewards(),
      ]);
      setAccount(accData);
      setRewards(rewardsData);
      setLoading(false);
    } catch {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRedeemReward = async (rewardId: string, title: string) => {
    setFeedback(null);
    try {
      const res = await api.exchangeReward(rewardId);
      setFeedback({
        type: 'success',
        message: `Đổi quà thành công: ${title}! Mã voucher của bạn là: ${res.voucherCode}. Vui lòng kiểm tra email.`,
      });
      loadData();
      refreshProfile();
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err.message || 'Không thể đổi quà',
      });
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

  return (
    <RoleGuard allowedRoles={['CUSTOMER', 'STAFF', 'STAFF_MANAGER', 'ADMIN']}>
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
                        onClick={() => handleRedeemReward(r.id, r.title)}
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
    </RoleGuard>
  );
}
