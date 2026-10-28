'use client';

import React from 'react';
import Link from 'next/link';
import { useTranslations, useLocale } from 'next-intl';
import { Plane, Phone, Mail, MapPin, ShieldCheck, Award, HeartHandshake } from 'lucide-react';

export const Footer: React.FC = () => {
  const t = useTranslations();
  const locale = useLocale();

  return (
    <footer className="bg-slate-950 text-slate-300 pt-16 pb-12 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 mb-12">
          {/* Col 1: Brand Info */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-600 to-primary-900 flex items-center justify-center text-gold-400">
                <Plane className="w-6 h-6 transform -rotate-45" />
              </div>
              <span className="text-xl font-black text-white tracking-tight">
                HẠT GẠO <span className="text-gold-400 font-bold text-lg">SKY</span>
              </span>
            </div>
            <p className="text-sm text-slate-400 max-w-sm leading-relaxed">
              {t('footer.brandDesc')}
            </p>
            <div className="space-y-2 text-xs text-slate-400">
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-gold-400" />
                <span>{t('footer.hotline247')}: <strong className="text-white">{t('brand.hotline')}</strong></span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-gold-400" />
                <span>{t('footer.supportEmail')}: <strong className="text-white">{t('brand.email')}</strong></span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-gold-400" />
                <span>{t('footer.headquarters')}</span>
              </div>
            </div>
          </div>

          {/* Col 2: Domestic Routes */}
          <div>
            <h4 className="text-white font-bold text-sm mb-4 uppercase tracking-wider text-gold-400">
              {t('footer.domesticRoutes')}
            </h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li><Link href={`/${locale}/search?origin=SGN&destination=HAN&departureDate=2026-10-28`} className="hover:text-white transition">Hồ Chí Minh ➔ Hà Nội</Link></li>
              <li><Link href={`/${locale}/search?origin=SGN&destination=DAD&departureDate=2026-10-28`} className="hover:text-white transition">Hồ Chí Minh ➔ Đà Nẵng</Link></li>
              <li><Link href={`/${locale}/search?origin=SGN&destination=PQC&departureDate=2026-10-28`} className="hover:text-white transition">Hồ Chí Minh ➔ Phú Quốc</Link></li>
              <li><Link href={`/${locale}/search?origin=HAN&destination=DAD&departureDate=2026-10-28`} className="hover:text-white transition">Hà Nội ➔ Đà Nẵng</Link></li>
              <li><Link href={`/${locale}/search?origin=SGN&destination=CXR&departureDate=2026-10-28`} className="hover:text-white transition">Hồ Chí Minh ➔ Nha Trang</Link></li>
            </ul>
          </div>

          {/* Col 3: International Routes */}
          <div>
            <h4 className="text-white font-bold text-sm mb-4 uppercase tracking-wider text-gold-400">
              {t('footer.internationalRoutes')}
            </h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li><Link href={`/${locale}/search?origin=SGN&destination=BKK&departureDate=2026-10-28`} className="hover:text-white transition">Hồ Chí Minh ➔ Bangkok</Link></li>
              <li><Link href={`/${locale}/search?origin=SGN&destination=SIN&departureDate=2026-10-28`} className="hover:text-white transition">Hồ Chí Minh ➔ Singapore</Link></li>
              <li><Link href={`/${locale}/search?origin=HAN&destination=ICN&departureDate=2026-10-28`} className="hover:text-white transition">Hà Nội ➔ Seoul (Incheon)</Link></li>
              <li><Link href={`/${locale}/search?origin=SGN&destination=NRT&departureDate=2026-10-28`} className="hover:text-white transition">Hồ Chí Minh ➔ Tokyo (Narita)</Link></li>
            </ul>
          </div>

          {/* Col 4: Services & Assurance */}
          <div>
            <h4 className="text-white font-bold text-sm mb-4 uppercase tracking-wider text-gold-400">
              {t('footer.policySafety')}
            </h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li className="flex items-center gap-1.5"><ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> {t('footer.securePayment')}</li>
              <li className="flex items-center gap-1.5"><Award className="w-3.5 h-3.5 text-gold-400" /> {t('footer.skyteam')}</li>
              <li className="flex items-center gap-1.5"><HeartHandshake className="w-3.5 h-3.5 text-blue-400" /> {t('footer.farePolicy')}</li>
              <li><Link href={`/${locale}/manage-booking`} className="hover:text-white transition">{t('footer.pnrSearch')}</Link></li>
              <li><Link href={`/${locale}/customer/loyalty`} className="hover:text-white transition">{t('footer.lotusCharter')}</Link></li>
            </ul>
          </div>
        </div>

        {/* Bottom copyright */}
        <div className="pt-8 border-t border-slate-900 flex flex-col md:flex-row justify-between items-center text-xs text-slate-500 gap-4">
          <p>{t('footer.copyright')}</p>
          <div className="flex gap-6">
            <span className="hover:text-slate-400 cursor-pointer">{t('footer.termsOfUse')}</span>
            <span className="hover:text-slate-400 cursor-pointer">{t('footer.privacyGdpr')}</span>
            <span className="hover:text-slate-400 cursor-pointer">{t('footer.conditionsCarriage')}</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
