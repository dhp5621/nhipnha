import React from 'react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Nhịp Nhà – Hệ sinh thái gắn kết và tự lập "Bước Chân Nhỏ"',
  description:
    'Hộp thư thoại bất đồng bộ 1 chạm, Nhật ký tương tác 15s & AI Gợi ý thấu cảm 30s cho gia đình công nhân đi làm xa và trẻ em ở quê.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body
        style={{
          margin: 0,
          padding: 0,
          backgroundColor: '#FDF8F2',
          color: '#1E1510',
          fontFamily: "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
          WebkitFontSmoothing: 'antialiased',
        }}
      >
        {children}
      </body>
    </html>
  );
}
