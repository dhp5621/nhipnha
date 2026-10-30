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
          rel="preload"
          href="https://fonts.gstatic.com/s/googlesans/v76/4UasrENHsxJlGDuGo1OIlJfC6l_24rlCK1Yo_Iqcsih3SAyH6cAwhX9RPj0UvaYr.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
        <link
          rel="preload"
          href="https://fonts.gstatic.com/s/googlesans/v76/4UasrENHsxJlGDuGo1OIlJfC6l_24rlCK1Yo_Iqcsih3SAyH6cAwhX9RPjwUvaYr.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
        <link
          rel="preload"
          href="https://fonts.gstatic.com/s/googlesans/v76/4UasrENHsxJlGDuGo1OIlJfC6l_24rlCK1Yo_Iqcsih3SAyH6cAwhX9RPjIUvQ.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Google+Sans:wght@400;500;700&family=Google+Sans+Text:wght@400;500;700&display=swap"
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
          /* Google Sans Vietnamese */
          @font-face {
            font-family: 'Google Sans';
            font-style: normal;
            font-weight: 400;
            font-display: swap;
            src: url('https://fonts.gstatic.com/s/googlesans/v76/4UasrENHsxJlGDuGo1OIlJfC6l_24rlCK1Yo_Iqcsih3SAyH6cAwhX9RPj0UvaYr.woff2') format('woff2');
            unicode-range: U+0102-0103, U+0110-0111, U+0128-0129, U+0168-0169, U+01A0-01A1, U+01AF-01B0, U+0300-0301, U+0303-0304, U+0308-0309, U+0323, U+0329, U+1EA0-1EF9, U+20AB;
          }
          @font-face {
            font-family: 'Google Sans';
            font-style: normal;
            font-weight: 500;
            font-display: swap;
            src: url('https://fonts.gstatic.com/s/googlesans/v76/4UasrENHsxJlGDuGo1OIlJfC6l_24rlCK1Yo_Iqcsih3SAyH6cAwhX9RPj0UvaYr.woff2') format('woff2');
            unicode-range: U+0102-0103, U+0110-0111, U+0128-0129, U+0168-0169, U+01A0-01A1, U+01AF-01B0, U+0300-0301, U+0303-0304, U+0308-0309, U+0323, U+0329, U+1EA0-1EF9, U+20AB;
          }
          @font-face {
            font-family: 'Google Sans';
            font-style: normal;
            font-weight: 600;
            font-display: swap;
            src: url('https://fonts.gstatic.com/s/googlesans/v76/4UasrENHsxJlGDuGo1OIlJfC6l_24rlCK1Yo_Iqcsih3SAyH6cAwhX9RPj0UvaYr.woff2') format('woff2');
            unicode-range: U+0102-0103, U+0110-0111, U+0128-0129, U+0168-0169, U+01A0-01A1, U+01AF-01B0, U+0300-0301, U+0303-0304, U+0308-0309, U+0323, U+0329, U+1EA0-1EF9, U+20AB;
          }
          @font-face {
            font-family: 'Google Sans';
            font-style: normal;
            font-weight: 700;
            font-display: swap;
            src: url('https://fonts.gstatic.com/s/googlesans/v76/4UasrENHsxJlGDuGo1OIlJfC6l_24rlCK1Yo_Iqcsih3SAyH6cAwhX9RPj0UvaYr.woff2') format('woff2');
            unicode-range: U+0102-0103, U+0110-0111, U+0128-0129, U+0168-0169, U+01A0-01A1, U+01AF-01B0, U+0300-0301, U+0303-0304, U+0308-0309, U+0323, U+0329, U+1EA0-1EF9, U+20AB;
          }
          @font-face {
            font-family: 'Google Sans';
            font-style: normal;
            font-weight: 800;
            font-display: swap;
            src: url('https://fonts.gstatic.com/s/googlesans/v76/4UasrENHsxJlGDuGo1OIlJfC6l_24rlCK1Yo_Iqcsih3SAyH6cAwhX9RPj0UvaYr.woff2') format('woff2');
            unicode-range: U+0102-0103, U+0110-0111, U+0128-0129, U+0168-0169, U+01A0-01A1, U+01AF-01B0, U+0300-0301, U+0303-0304, U+0308-0309, U+0323, U+0329, U+1EA0-1EF9, U+20AB;
          }
          @font-face {
            font-family: 'Google Sans';
            font-style: normal;
            font-weight: 900;
            font-display: swap;
            src: url('https://fonts.gstatic.com/s/googlesans/v76/4UasrENHsxJlGDuGo1OIlJfC6l_24rlCK1Yo_Iqcsih3SAyH6cAwhX9RPj0UvaYr.woff2') format('woff2');
            unicode-range: U+0102-0103, U+0110-0111, U+0128-0129, U+0168-0169, U+01A0-01A1, U+01AF-01B0, U+0300-0301, U+0303-0304, U+0308-0309, U+0323, U+0329, U+1EA0-1EF9, U+20AB;
          }

          /* Google Sans Latin-ext (Vietnamese horn, breve, circumflex base letters) */
          @font-face {
            font-family: 'Google Sans';
            font-style: normal;
            font-weight: 400;
            font-display: swap;
            src: url('https://fonts.gstatic.com/s/googlesans/v76/4UasrENHsxJlGDuGo1OIlJfC6l_24rlCK1Yo_Iqcsih3SAyH6cAwhX9RPjwUvaYr.woff2') format('woff2');
            unicode-range: U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C4, U+2113, U+2C60-2C7F, U+A720-A7FF;
          }
          @font-face {
            font-family: 'Google Sans';
            font-style: normal;
            font-weight: 500;
            font-display: swap;
            src: url('https://fonts.gstatic.com/s/googlesans/v76/4UasrENHsxJlGDuGo1OIlJfC6l_24rlCK1Yo_Iqcsih3SAyH6cAwhX9RPjwUvaYr.woff2') format('woff2');
            unicode-range: U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C4, U+2113, U+2C60-2C7F, U+A720-A7FF;
          }
          @font-face {
            font-family: 'Google Sans';
            font-style: normal;
            font-weight: 600;
            font-display: swap;
            src: url('https://fonts.gstatic.com/s/googlesans/v76/4UasrENHsxJlGDuGo1OIlJfC6l_24rlCK1Yo_Iqcsih3SAyH6cAwhX9RPjwUvaYr.woff2') format('woff2');
            unicode-range: U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C4, U+2113, U+2C60-2C7F, U+A720-A7FF;
          }
          @font-face {
            font-family: 'Google Sans';
            font-style: normal;
            font-weight: 700;
            font-display: swap;
            src: url('https://fonts.gstatic.com/s/googlesans/v76/4UasrENHsxJlGDuGo1OIlJfC6l_24rlCK1Yo_Iqcsih3SAyH6cAwhX9RPjwUvaYr.woff2') format('woff2');
            unicode-range: U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C4, U+2113, U+2C60-2C7F, U+A720-A7FF;
          }
          @font-face {
            font-family: 'Google Sans';
            font-style: normal;
            font-weight: 800;
            font-display: swap;
            src: url('https://fonts.gstatic.com/s/googlesans/v76/4UasrENHsxJlGDuGo1OIlJfC6l_24rlCK1Yo_Iqcsih3SAyH6cAwhX9RPjwUvaYr.woff2') format('woff2');
            unicode-range: U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C4, U+2113, U+2C60-2C7F, U+A720-A7FF;
          }
          @font-face {
            font-family: 'Google Sans';
            font-style: normal;
            font-weight: 900;
            font-display: swap;
            src: url('https://fonts.gstatic.com/s/googlesans/v76/4UasrENHsxJlGDuGo1OIlJfC6l_24rlCK1Yo_Iqcsih3SAyH6cAwhX9RPjwUvaYr.woff2') format('woff2');
            unicode-range: U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C4, U+2113, U+2C60-2C7F, U+A720-A7FF;
          }

          /* Google Sans Latin */
          @font-face {
            font-family: 'Google Sans';
            font-style: normal;
            font-weight: 400;
            font-display: swap;
            src: url('https://fonts.gstatic.com/s/googlesans/v76/4UasrENHsxJlGDuGo1OIlJfC6l_24rlCK1Yo_Iqcsih3SAyH6cAwhX9RPjIUvQ.woff2') format('woff2');
            unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD;
          }
          @font-face {
            font-family: 'Google Sans';
            font-style: normal;
            font-weight: 500;
            font-display: swap;
            src: url('https://fonts.gstatic.com/s/googlesans/v76/4UasrENHsxJlGDuGo1OIlJfC6l_24rlCK1Yo_Iqcsih3SAyH6cAwhX9RPjIUvQ.woff2') format('woff2');
            unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD;
          }
          @font-face {
            font-family: 'Google Sans';
            font-style: normal;
            font-weight: 600;
            font-display: swap;
            src: url('https://fonts.gstatic.com/s/googlesans/v76/4UasrENHsxJlGDuGo1OIlJfC6l_24rlCK1Yo_Iqcsih3SAyH6cAwhX9RPjIUvQ.woff2') format('woff2');
            unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD;
          }
          @font-face {
            font-family: 'Google Sans';
            font-style: normal;
            font-weight: 700;
            font-display: swap;
            src: url('https://fonts.gstatic.com/s/googlesans/v76/4UasrENHsxJlGDuGo1OIlJfC6l_24rlCK1Yo_Iqcsih3SAyH6cAwhX9RPjIUvQ.woff2') format('woff2');
            unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD;
          }
          @font-face {
            font-family: 'Google Sans';
            font-style: normal;
            font-weight: 800;
            font-display: swap;
            src: url('https://fonts.gstatic.com/s/googlesans/v76/4UasrENHsxJlGDuGo1OIlJfC6l_24rlCK1Yo_Iqcsih3SAyH6cAwhX9RPjIUvQ.woff2') format('woff2');
            unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD;
          }
          @font-face {
            font-family: 'Google Sans';
            font-style: normal;
            font-weight: 900;
            font-display: swap;
            src: url('https://fonts.gstatic.com/s/googlesans/v76/4UasrENHsxJlGDuGo1OIlJfC6l_24rlCK1Yo_Iqcsih3SAyH6cAwhX9RPjIUvQ.woff2') format('woff2');
            unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD;
          }

          /* Global baseline and input inheritance */
          *, *::before, *::after {
            box-sizing: border-box;
          }
          html, body, button, input, optgroup, select, textarea, span, p, a, label, h1, h2, h3, h4, h5, h6 {
            font-family: 'Google Sans', 'Google Sans Text', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            font-synthesis: none;
          }
          button, input, select, textarea {
            font-family: inherit;
            font-size: inherit;
          }

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
            font-family: 'Google Sans', 'Google Sans Text', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            -webkit-font-smoothing: antialiased;
            -moz-osx-font-smoothing: grayscale;
            font-synthesis: none;
            text-rendering: geometricPrecision;
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
