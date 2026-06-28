import type { Metadata, Viewport } from 'next';
import { Geist } from 'next/font/google';
import './globals.css';
import BottomNav from '@/components/BottomNav';

const geist = Geist({ subsets: ['latin'], variable: '--font-geist' });

export const metadata: Metadata = {
  title: "Maisie's Planner",
  description: 'Personal AI-powered weekly planning',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: "Planner",
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#fce7f3',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={geist.variable}>
      <body className="bg-brand-faint text-gray-900 font-sans min-h-screen">
        <main className="max-w-lg mx-auto pb-24 min-h-screen">
          {children}
        </main>
        <BottomNav />
      </body>
    </html>
  );
}
