'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useLocale } from 'next-intl';
import { User, Plane, Sparkles } from 'lucide-react';

export const CustomerNav: React.FC = () => {
  const pathname = usePathname();
  const locale = useLocale();

  const links = [
    { href: `/${locale}/customer/profile`, label: 'Hồ sơ cá nhân & GDPR', icon: User },
    { href: `/${locale}/customer/bookings`, label: 'Chuyến bay của tôi', icon: Plane },
    { href: `/${locale}/customer/loyalty`, label: 'Hội viên Lotus Club', icon: Sparkles },
  ];

  return (
    <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3 mb-6 overflow-x-auto">
      {links.map((link) => {
        const isActive = pathname.includes(link.href);
        const Icon = link.icon;
        return (
          <Link
            key={link.href}
            href={link.href}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition whitespace-nowrap ${
              isActive
                ? 'bg-primary-900 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Icon className="w-4 h-4" />
            <span>{link.label}</span>
          </Link>
        );
      })}
    </div>
  );
};

