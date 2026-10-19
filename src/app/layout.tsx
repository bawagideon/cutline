import type { Metadata, Viewport } from 'next';
import { ClerkProvider } from '@clerk/nextjs';
import './globals.css';

export const metadata: Metadata = {
  title: 'Cutline Studio — Approval-First Video Production',
  description: 'Script, scene, render, review, and publish to YouTube from one workspace.',
  manifest: '/manifest.webmanifest',
  icons: {
    icon: '/icons/icon-192.png',
    apple: '/icons/icon-192.png',
  },
};

export const viewport: Viewport = {
  themeColor: '#0B0C0E',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider
      appearance={{
        variables: {
          colorPrimary: '#E5A93C',
          colorBackground: '#121417',
          borderRadius: '0.75rem',
        },
        elements: {
          card: 'bg-[#121417] border border-[#22262E] shadow-2xl rounded-2xl text-white',
          headerTitle: 'text-white font-bold text-xl',
          headerSubtitle: 'text-[#9CA3AF] text-sm',
          socialButtonsBlockButton: 'bg-[#1A1D23] border border-[#2E333D] text-white hover:bg-[#252A33]',
          formButtonPrimary: 'bg-[#E5A93C] text-[#0B0C0E] font-semibold hover:bg-[#F0B84D] transition-colors',
          formFieldInput: 'bg-[#1A1D23] border-[#2E333D] text-white focus:border-[#E5A93C]',
          footerActionLink: 'text-[#E5A93C] hover:text-[#F0B84D]',
          userButtonPopoverCard: 'bg-[#121417] border border-[#22262E] text-white shadow-2xl',
        },
      }}
    >
      <html lang="en" className="dark">
        <head>
          <link rel="manifest" href="/manifest.webmanifest" />
          <meta name="apple-mobile-web-app-capable" content="yes" />
          <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        </head>
        <body className="bg-[#0B0C0E] text-[#E6E8EB] min-h-screen">
          {children}
          <script
            dangerouslySetInnerHTML={{
              __html: `
                if ('serviceWorker' in navigator && window.location.protocol === 'https:') {
                  window.addEventListener('load', () => {
                    navigator.serviceWorker.register('/sw.js').catch(() => {});
                  });
                }
              `,
            }}
          />
        </body>
      </html>
    </ClerkProvider>
  );
}
