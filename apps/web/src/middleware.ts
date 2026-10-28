import createMiddleware from 'next-intl/middleware';

export default createMiddleware({
  locales: ['vi', 'en', 'zh'],
  defaultLocale: 'vi',
  localePrefix: 'as-needed',
});

export const config = {
  // Match all request paths except for files with extensions, api, and _next
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
};
