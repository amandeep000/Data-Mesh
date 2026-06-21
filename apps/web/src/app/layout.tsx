import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'Data-Mesh | EU Environmental Data API',
    template: '%s | Data-Mesh',
  },
  description:
    'Data-as-a-Service platform for EU Environmental datasets. Clean, normalized, rate-limited API access for developers.',
  keywords: ['EU data', 'environmental API', 'EEA', 'Eurostat', 'open data'],
  authors: [{ name: 'Data-Mesh Team' }],
  openGraph: {
    type: 'website',
    locale: 'en_EU',
    siteName: 'Data-Mesh',
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>): React.JSX.Element {
  return (
    <html lang="en" className={inter.variable}>
      <body>{children}</body>
    </html>
  );
}
