'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslations, useLocale } from 'next-intl';
import { useAuth, UserRole } from '../../context/AuthContext';
import { LoginModal } from '../auth/LoginModal';
import { RegisterTicketModal } from '../auth/RegisterTicketModal';
import {
  Plane,
  User,
  ShieldCheck,
  Briefcase,
  BarChart3,
  Globe,
  Sun,
  Moon,
  LogOut,
  ChevronDown,
  Menu,
  X,
  Sparkles,
} from 'lucide-react';

export const Header: React.FC = () => {
  const t = useTranslations();
  const locale = useLocale();
  const pathname = usePathname();
  const { user, role, logout, openLoginModal, openRegisterModal } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [langMenuOpen, setLangMenuOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    if (!darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const getLocalizedPath = (path: string) => {
    return `/${locale}${path === '/' ? '' : path}`;
  };

  const changeLocale = (newLocale: string) => {
    // Replace locale in current path
    const segments = pathname.split('/');
    if (segments[1] === 'vi' || segments[1] === 'en' || segments[1] === 'zh') {
      segments[1] = newLocale;
      window.location.href = segments.join('/');
    } else {
      window.location.href = `/${newLocale}${pathname}`;
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors shadow-sm">
      {/* Top Banner Bar */}
      <div className="bg-gradient-to-r from-primary-900 via-primary-800 to-primary-950 text-white px-4 py-1.5 text-xs flex flex-wrap justify-between items-center">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1 font-semibold text-gold-400">
            <Sparkles className="w-3.5 h-3.5" /> {t('brand.name')} — Official Airline
          </span>
          <span className="hidden md:inline text-slate-300">|</span>
          <span className="hidden md:inline text-slate-200">
            Hotline: <strong className="text-white">{t('brand.hotline')}</strong>
          </span>
        </div>

        <div className="flex items-center gap-3 text-slate-300 text-xs">
          <span className="hidden sm:inline font-medium text-slate-300">{t('brand.tagline')}</span>
        </div>
      </div>

      {/* Main Navigation */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Logo */}
          <Link href={getLocalizedPath('/')} className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-900 to-primary-700 flex items-center justify-center text-gold-400 shadow-md group-hover:scale-105 transition">
              <Plane className="w-6 h-6 transform -rotate-45" />
            </div>
            <div>
              <span className="text-xl font-black tracking-tight text-primary-900 dark:text-white flex items-center gap-1.5">
                HẠT GẠO <span className="text-gold-500 font-bold text-lg">SKY</span>
              </span>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 tracking-wider uppercase font-medium">
                National Carrier of Vietnam
              </p>
            </div>
          </Link>

          {/* Desktop Nav Links */}
          <nav className="hidden lg:flex items-center gap-1 xl:gap-2">
            <Link
              href={getLocalizedPath('/')}
              className={`px-3 py-2 rounded-lg text-sm font-semibold transition ${
                pathname.endsWith('/')
                  ? 'text-primary-700 dark:text-primary-400 bg-primary-50 dark:bg-slate-800'
                  : 'text-slate-700 dark:text-slate-200 hover:text-primary-700 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              {t('nav.home')}
            </Link>

            <Link
              href={getLocalizedPath('/manage-booking')}
              className={`px-3 py-2 rounded-lg text-sm font-semibold transition ${
                pathname.includes('/manage-booking')
                  ? 'text-primary-700 dark:text-primary-400 bg-primary-50 dark:bg-slate-800'
                  : 'text-slate-700 dark:text-slate-200 hover:text-primary-700 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              {t('nav.manageBooking')}
            </Link>

            {user && role !== 'GUEST' && (
              <Link
                href={getLocalizedPath('/customer/loyalty')}
                className={`px-3 py-2 rounded-lg text-sm font-semibold transition flex items-center gap-1.5 ${
                  pathname.includes('/loyalty')
                    ? 'text-primary-700 dark:text-primary-400 bg-primary-50 dark:bg-slate-800'
                    : 'text-slate-700 dark:text-slate-200 hover:text-primary-700 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <Sparkles className="w-4 h-4 text-gold-500" />
                {t('nav.loyalty')}
              </Link>
            )}

            {/* Role-Specific Portal Links */}
            {(role === 'STAFF' || role === 'STAFF_MANAGER' || role === 'ADMIN') && (
              <Link
                href={getLocalizedPath('/staff/flights')}
                className={`px-3 py-2 rounded-lg text-sm font-semibold transition flex items-center gap-1.5 ${
                  pathname.includes('/staff')
                    ? 'text-primary-700 dark:text-primary-400 bg-primary-50 dark:bg-slate-800'
                    : 'text-slate-700 dark:text-slate-200 hover:text-primary-700 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <Briefcase className="w-4 h-4 text-blue-600" />
                Staff Portal
              </Link>
            )}

            {(role === 'STAFF_MANAGER' || role === 'ADMIN') && (
              <Link
                href={getLocalizedPath('/manager/dashboard')}
                className={`px-3 py-2 rounded-lg text-sm font-semibold transition flex items-center gap-1.5 ${
                  pathname.includes('/manager')
                    ? 'text-primary-700 dark:text-primary-400 bg-primary-50 dark:bg-slate-800'
                    : 'text-slate-700 dark:text-slate-200 hover:text-primary-700 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <BarChart3 className="w-4 h-4 text-purple-600" />
                Manager Portal
              </Link>
            )}

            {role === 'ADMIN' && (
              <Link
                href={getLocalizedPath('/admin/users')}
                className={`px-3 py-2 rounded-lg text-sm font-semibold transition flex items-center gap-1.5 ${
                  pathname.includes('/admin')
                    ? 'text-primary-700 dark:text-primary-400 bg-primary-50 dark:bg-slate-800'
                    : 'text-slate-700 dark:text-slate-200 hover:text-primary-700 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                Admin Portal
              </Link>
            )}
          </nav>

          {/* Right Header Controls (Language, Theme, Auth) */}
          <div className="flex items-center gap-2">
            {/* Language Switcher */}
            <div className="relative">
              <button
                onClick={() => setLangMenuOpen(!langMenuOpen)}
                className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center gap-1 text-xs font-semibold"
                aria-label="Language selector"
              >
                <Globe className="w-4 h-4 text-slate-500" />
                <span className="uppercase">{locale}</span>
              </button>

              {langMenuOpen && (
                <div className="absolute right-0 mt-1 w-36 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 py-1 text-xs z-50">
                  <button
                    onClick={() => { changeLocale('vi'); setLangMenuOpen(false); }}
                    className="w-full text-left px-3 py-2 hover:bg-primary-50 dark:hover:bg-slate-700 font-medium"
                  >
                    🇻🇳 Tiếng Việt
                  </button>
                  <button
                    onClick={() => { changeLocale('en'); setLangMenuOpen(false); }}
                    className="w-full text-left px-3 py-2 hover:bg-primary-50 dark:hover:bg-slate-700 font-medium"
                  >
                    🇬🇧 English
                  </button>
                  <button
                    onClick={() => { changeLocale('zh'); setLangMenuOpen(false); }}
                    className="w-full text-left px-3 py-2 hover:bg-primary-50 dark:hover:bg-slate-700 font-medium"
                  >
                    🇨🇳 中文
                  </button>
                </div>
              )}
            </div>

            {/* Dark / Light Toggle */}
            <button
              onClick={toggleDarkMode}
              className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
              aria-label="Toggle dark mode"
            >
              {darkMode ? <Sun className="w-4 h-4 text-gold-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
            </button>

            {/* User Profile / Auth State */}
            {user ? (
              <div className="flex items-center gap-2">
                <Link
                  href={getLocalizedPath('/customer/profile')}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-primary-50 dark:hover:bg-slate-700 transition"
                >
                  <div className="w-7 h-7 rounded-full bg-primary-900 text-gold-400 flex items-center justify-center text-xs font-bold">
                    {user.fullName.charAt(0)}
                  </div>
                  <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 hidden md:inline max-w-[120px] truncate">
                    {user.fullName}
                  </span>
                </Link>
                <button
                  onClick={logout}
                  className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 text-red-600 transition"
                  title={t('nav.logout')}
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => openLoginModal()}
                  className="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-primary-900 dark:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                >
                  {t('nav.login')}
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    openRegisterModal({
                      x: rect.left + rect.width / 2,
                      y: rect.top + rect.height / 2,
                    });
                  }}
                  className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-primary-900 hover:bg-primary-800 text-white shadow-sm transition cursor-pointer"
                >
                  {t('nav.register')}
                </button>
              </div>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden px-4 pt-2 pb-6 space-y-2 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <Link
            href={getLocalizedPath('/')}
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-lg text-base font-medium text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            {t('nav.home')}
          </Link>
          <Link
            href={getLocalizedPath('/manage-booking')}
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-lg text-base font-medium text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            {t('nav.manageBooking')}
          </Link>
          {user && role !== 'GUEST' && (
            <Link
              href={getLocalizedPath('/customer/loyalty')}
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-lg text-base font-medium text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              {t('nav.loyalty')}
            </Link>
          )}
          {(role === 'STAFF' || role === 'STAFF_MANAGER' || role === 'ADMIN') && (
            <Link
              href={getLocalizedPath('/staff/flights')}
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-lg text-base font-medium text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/30"
            >
              Staff Portal
            </Link>
          )}
          {(role === 'STAFF_MANAGER' || role === 'ADMIN') && (
            <Link
              href={getLocalizedPath('/manager/dashboard')}
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-lg text-base font-medium text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-950/30"
            >
              Manager Portal
            </Link>
          )}
          {role === 'ADMIN' && (
            <Link
              href={getLocalizedPath('/admin/users')}
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-lg text-base font-medium text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
            >
              Admin Portal
            </Link>
          )}

          {!user && (
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  openLoginModal();
                }}
                className="flex-1 py-2 text-center rounded-lg text-sm font-semibold bg-primary-50 dark:bg-slate-800 text-primary-900 dark:text-white"
              >
                {t('nav.login')}
              </button>
              <button
                type="button"
                onClick={(e) => {
                  setMobileMenuOpen(false);
                  const rect = e.currentTarget.getBoundingClientRect();
                  openRegisterModal({
                    x: rect.left + rect.width / 2,
                    y: rect.top + rect.height / 2,
                  });
                }}
                className="flex-1 py-2 text-center rounded-lg text-sm font-semibold bg-primary-900 text-white cursor-pointer"
              >
                {t('nav.register')}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Global Airplane Drag-and-Drop Login Modal */}
      <LoginModal />

      {/* Global 3D Boarding Pass Launch & Morph Register Modal */}
      <RegisterTicketModal />
    </header>
  );
};
