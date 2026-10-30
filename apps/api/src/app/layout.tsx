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
          href="https://fonts.googleapis.com/css2?family=Google+Sans+Flex:wght@100..900&family=Be+Vietnam+Pro:wght@400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Rounded:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200"
          rel="stylesheet"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200"
          rel="stylesheet"
        />
        <link
          href="https://fonts.googleapis.com/icon?family=Material+Icons"
          rel="stylesheet"
        />
        <style dangerouslySetInnerHTML={{ __html: `
          :root {
            --bg-color: #FCF6EE;
            --text-color: #1F1610;
            color-scheme: light dark;
          }
          @media (prefers-color-scheme: dark) {
            :root {
              --bg-color: #15100C;
              --text-color: #F4E5DC;
            }
          }
          html[data-theme='light'] {
            --bg-color: #FCF6EE;
            --text-color: #1F1610;
            color-scheme: light;
          }
          html[data-theme='dark'] {
            --bg-color: #15100C;
            --text-color: #F4E5DC;
            color-scheme: dark;
          }
          body {
            margin: 0;
            padding: 0;
            background-color: var(--bg-color);
            color: var(--text-color);
            font-family: 'Google Sans Flex', 'Be Vietnam Pro', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            -webkit-font-smoothing: antialiased;
            -moz-osx-font-smoothing: grayscale;
            text-rendering: optimizeLegibility;
            transition: background-color 0.25s cubic-bezier(0.2, 0, 0, 1), color 0.25s cubic-bezier(0.2, 0, 0, 1);
          }
        ` }} />
      </head>
      <body>
        {children}
      </body>
    </html>
  );
}
