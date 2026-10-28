'use client';

import React from 'react';
import Link from 'next/link';
import { useTranslations, useLocale } from 'next-intl';
import { useAuth } from '../../context/AuthContext';
import { SearchWidget } from '../../components/public/SearchWidget';
import {
  Sparkles,
  Plane,
  ShieldCheck,
  Award,
  Zap,
  Tag,
  Clock,
  ArrowRight,
  Luggage,
} from 'lucide-react';

export default function HomePage() {
  const t = useTranslations();
  const locale = useLocale();
  const { openRegisterModal } = useAuth();

  const promoCards = [
    {
      code: 'VIETSKY2026',
      title: t('home.promo1Title'),
      desc: t('home.promo1Desc'),
      badge: t('home.promo1Badge'),
      color: 'from-blue-600 to-primary-900',
    },
    {
      code: 'FLYBUSINESS',
      title: t('home.promo2Title'),
      desc: t('home.promo2Desc'),
      badge: t('home.promo2Badge'),
      color: 'from-purple-700 to-indigo-950',
    },
    {
      code: 'GOLDMEMBER',
      title: t('home.promo3Title'),
      desc: t('home.promo3Desc'),
      badge: t('home.promo3Badge'),
      color: 'from-amber-600 to-yellow-950',
    },
  ];

  const popularRoutes = [
    {
      from: 'Hồ Chí Minh (SGN)',
      to: 'Hà Nội (HAN)',
      time: '2g 15p · Bay thẳng',
      price: '1.250.000',
      origin: 'SGN',
      dest: 'HAN',
      image: '🏛️',
    },
    {
      from: 'Hồ Chí Minh (SGN)',
      to: 'Đà Nẵng (DAD)',
      time: '1g 25p · Bay thẳng',
      price: '1.100.000',
      origin: 'SGN',
      dest: 'DAD',
      image: '🌉',
    },
    {
      from: 'Hồ Chí Minh (SGN)',
      to: 'Phú Quốc (PQC)',
      time: '1g 00p · Bay thẳng',
      price: '950.000',
      origin: 'SGN',
      dest: 'PQC',
      image: '🏖️',
    },
    {
      from: 'Hồ Chí Minh (SGN)',
      to: 'Singapore (SIN)',
      time: '2g 10p · Quốc tế',
      price: '3.100.000',
      origin: 'SGN',
      dest: 'SIN',
      image: '🦁',
    },
    {
      from: 'Hà Nội (HAN)',
      to: 'Seoul (ICN)',
      time: '4g 20p · Quốc tế',
      price: '6.500.000',
      origin: 'HAN',
      dest: 'ICN',
      image: '🏯',
    },
    {
      from: 'Hồ Chí Minh (SGN)',
      to: 'Tokyo (NRT)',
      time: '5g 20p · Quốc tế',
      price: '8.200.000',
      origin: 'SGN',
      dest: 'NRT',
      image: '🗼',
    },
  ];

  return (
    <div className="space-y-16 pb-16">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary-950 via-primary-900 to-slate-900 text-white pt-16 pb-32 px-4 sm:px-6 lg:px-8 overflow-hidden">
        {/* Ambient Glows */}
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-primary-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-10 left-1/3 w-80 h-80 bg-gold-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center max-w-3xl mx-auto mb-10 space-y-4">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-semibold text-gold-300">
              <Sparkles className="w-3.5 h-3.5 text-gold-400" />
              <span>Hãng hàng không Quốc gia · Trực tiếp từ hãng không qua trung gian</span>
            </div>
            <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
              {t('search.title')}
            </h1>
            <p className="text-sm sm:text-base text-slate-300 max-w-2xl mx-auto leading-relaxed">
              {t('search.subtitle')}
            </p>
          </div>

          {/* Search Widget Container */}
          <div className="max-w-5xl mx-auto transform translate-y-6">
            <SearchWidget />
          </div>
        </div>
      </section>

      {/* Highlights & Guarantees */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-950 text-blue-600 flex items-center justify-center flex-shrink-0">
              <Tag className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">{t('home.feature1Title')}</h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                {t('home.feature1Desc')}
              </p>
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-950 text-amber-600 flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">{t('home.feature4Title')}</h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                {t('home.feature4Desc')}
              </p>
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 flex items-center justify-center flex-shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">{t('home.feature2Title')}</h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                {t('home.feature2Desc')}
              </p>
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-purple-50 dark:bg-purple-950 text-purple-600 flex items-center justify-center flex-shrink-0">
              <Plane className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">{t('home.feature3Title')}</h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                {t('home.feature3Desc')}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Promo Banners */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
              Chương trình khuyến mại nổi bật
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Nhập mã giảm giá tại bước thanh toán để nhận ngay ưu đãi trực tiếp
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {promoCards.map((p) => (
            <div
              key={p.code}
              className={`rounded-3xl p-6 bg-gradient-to-br ${p.color} text-white shadow-md relative overflow-hidden flex flex-col justify-between`}
            >
              <div className="space-y-2 relative z-10">
                <span className="inline-block px-2.5 py-0.5 rounded-full bg-white/20 text-[10px] font-bold uppercase tracking-wider backdrop-blur-md">
                  {p.badge}
                </span>
                <h3 className="text-lg font-black leading-snug">{p.title}</h3>
                <p className="text-xs text-slate-200 leading-relaxed">{p.desc}</p>
              </div>

              <div className="mt-6 pt-4 border-t border-white/20 flex items-center justify-between relative z-10">
                <div className="flex items-center gap-1.5 font-mono text-xs font-bold bg-white/10 px-3 py-1.5 rounded-xl border border-white/20">
                  <Tag className="w-3.5 h-3.5 text-gold-400" />
                  <span>{p.code}</span>
                </div>
                <Link
                  href={`/${locale}/search?origin=SGN&destination=HAN&departureDate=2026-10-28`}
                  className="text-xs font-bold text-gold-300 hover:text-white flex items-center gap-1 transition"
                >
                  Đặt vé ngay <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Popular Routes Showcase */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
              Đường bay phổ biến & Giá vé tốt nhất
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Khám phá các điểm đến hấp dẫn được khai thác hàng ngày bởi Hạt Gạo Sky
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {popularRoutes.map((r, i) => (
            <Link
              key={i}
              href={`/${locale}/search?origin=${r.origin}&destination=${r.dest}&departureDate=2026-10-28`}
              className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-premium hover:border-primary-400 transition group flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-3xl">{r.image}</span>
                  <span className="text-xs text-slate-400 font-medium flex items-center gap-1">
                    <Clock className="w-3 h-3" /> {r.time}
                  </span>
                </div>
                <h4 className="font-extrabold text-sm text-slate-900 dark:text-white group-hover:text-primary-600 transition">
                  {r.from} ➔ {r.to}
                </h4>
              </div>

              <div className="mt-6 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 block">Chỉ từ</span>
                  <span className="text-base font-black text-primary-900 dark:text-white">
                    {r.price} <span className="text-xs font-normal text-slate-500">VND</span>
                  </span>
                </div>
                <span className="w-8 h-8 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-primary-600 group-hover:bg-primary-900 group-hover:text-white transition">
                  <ArrowRight className="w-4 h-4" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Lotus Club Loyalty CTA */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl bg-gradient-to-r from-primary-950 via-primary-900 to-indigo-950 p-8 sm:p-12 text-white relative overflow-hidden shadow-xl">
          <div className="max-w-2xl relative z-10 space-y-4">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gold-500/20 text-gold-300 text-xs font-bold border border-gold-400/30">
              <Award className="w-4 h-4 text-gold-400" /> Lotus Club Frequent Flyer
            </span>
            <h2 className="text-2xl sm:text-4xl font-black tracking-tight leading-tight">
              {t('home.lotusBannerTitle')}
            </h2>
            <p className="text-sm text-slate-300 leading-relaxed">
              {t('home.lotusBannerSubtitle')}
            </p>
            <div className="pt-2 flex flex-wrap gap-4">
              <button
                type="button"
                onClick={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  openRegisterModal({
                    x: rect.left + rect.width / 2,
                    y: rect.top + rect.height / 2,
                  });
                }}
                className="px-6 py-3 rounded-xl bg-gold-500 hover:bg-gold-600 text-slate-900 font-bold text-sm shadow-md transition cursor-pointer"
              >
                {t('home.joinLotusFree')}
              </button>
              <Link
                href={`/${locale}/customer/loyalty`}
                className="px-6 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-sm border border-white/20 transition"
              >
                {t('home.exploreBenefits')}
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
