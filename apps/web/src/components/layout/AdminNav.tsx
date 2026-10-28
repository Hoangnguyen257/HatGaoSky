'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useLocale } from 'next-intl';
import { Users, Shield, ScrollText, Mail, Sliders } from 'lucide-react';

export const AdminNav: React.FC = () => {
  const pathname = usePathname();
  const locale = useLocale();

  const links = [
    { href: `/${locale}/admin/users`, label: 'Người dùng & RBAC', icon: Users },
    { href: `/${locale}/admin/admins`, label: 'Quản trị viên', icon: Shield },
    { href: `/${locale}/admin/logs`, label: 'Nhật ký Audit Log', icon: ScrollText },
    { href: `/${locale}/admin/emails`, label: 'Nhật ký Email', icon: Mail },
    { href: `/${locale}/admin/settings`, label: 'Cấu hình hệ thống', icon: Sliders },
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
                ? 'bg-emerald-600 text-white shadow-sm'
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

