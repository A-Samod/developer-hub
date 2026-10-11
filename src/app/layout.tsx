import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Developer Hub',
  description: 'Private personal hub for notes, snippets, to-dos, and development tasks',
  icons: {
    icon: [
      { url: '/favicon.png', type: 'image/png', sizes: '64x64' },
      { url: '/logo-mark-128.png', type: 'image/png', sizes: '128x128' },
    ],
    apple: [{ url: '/logo-mark-128.png', type: 'image/png' }],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var k='developer-hub.theme';var s=localStorage.getItem(k);var t=s==='dark'||s==='light'?s:(window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light');document.documentElement.classList.toggle('dark',t==='dark');document.documentElement.style.colorScheme=t;}catch(e){}})();`,
          }}
        />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&family=IBM+Plex+Sans:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-[var(--color-surface)] text-[var(--color-ink)]">{children}</body>
    </html>
  );
}
