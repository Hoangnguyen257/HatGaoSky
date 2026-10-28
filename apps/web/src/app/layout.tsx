import './globals.css';
import { ReactNode } from 'react';

export const metadata = {
  title: 'Hạt Gạo Sky — Hãng hàng không Quốc gia',
  description: 'Đặt vé máy bay trực tiếp cùng Hạt Gạo Sky với giá gốc minh bạch, không phí ẩn. Tích lũy dặm thưởng Lotus Club, quản lý đặt chỗ và trải nghiệm dịch vụ hàng không đẳng cấp.',
  icons: {
    icon: '/favicon.ico',
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <body className="antialiased min-h-screen flex flex-col">{children}</body>
    </html>
  );
}
