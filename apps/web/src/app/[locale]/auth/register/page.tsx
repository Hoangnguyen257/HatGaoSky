'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useLocale } from 'next-intl';

export default function RegisterPage() {
  const router = useRouter();
  const locale = useLocale();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get('redirect');

  useEffect(() => {
    // Unify all registration flows to automatically launch the 3D ticket boarding pass animation
    const redirectQuery = redirectUrl ? `&redirect=${encodeURIComponent(redirectUrl)}` : '';
    router.replace(`/${locale}/auth/login?register=true${redirectQuery}`);
  }, [router, locale, redirectUrl]);

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center space-y-3">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-900" />
      <span className="text-xs text-slate-500 font-medium">Đang mở vé đăng ký hội viên Lotus Club...</span>
    </div>
  );
}
