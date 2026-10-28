import '../globals.css';
import { ReactNode } from 'react';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { AuthProvider } from '../../context/AuthContext';
import { Header } from '../../components/layout/Header';
import { Footer } from '../../components/layout/Footer';

interface LocaleLayoutProps {
  children: ReactNode;
  params: { locale: string };
}

export default async function LocaleLayout({ children, params: { locale } }: LocaleLayoutProps) {
  const messages = await getMessages();

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <AuthProvider>
        <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
        </div>
      </AuthProvider>
    </NextIntlClientProvider>
  );
}
