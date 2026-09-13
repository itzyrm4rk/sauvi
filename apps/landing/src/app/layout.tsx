import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'SAUVI — Don de sang d’urgence',
  description:
    "Connecte instantanément les donneurs de sang compatibles et éligibles aux personnes en détresse.\nTéléchargez l'APK Android officiel.",
  keywords: [
    'don de sang',
    'urgence médicale',
    'sauvi',
    'apk android',
    'compatibilité sanguine',
    'santé',
  ],
  authors: [{ name: 'Marc Didier' }],
  openGraph: {
    title: 'SAUVI — Don de sang d’urgence',
    description:
      "Connecte instantanément les donneurs de sang compatibles et éligibles aux personnes en détresse.\nTéléchargez l'APK Android officiel.",
    url: 'https://sauvi-landing.vercel.app',
    siteName: 'SAUVI',
    locale: 'fr_FR',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'SAUVI — Don de sang d’urgence',
    description:
      "Connecte instantanément les donneurs de sang compatibles et éligibles aux personnes en détresse.\nTéléchargez l'APK Android officiel.",
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang='fr'>
      <head>
        <link rel='preconnect' href='https://fonts.googleapis.com' />
        <link rel='preconnect' href='https://fonts.gstatic.com' crossOrigin='anonymous' />
        <link rel='icon' href='/favicon.ico' />
      </head>
      <body>
        <div className='ambient-glow-wrapper'>
          <div className='glow-orb-1' />
          <div className='glow-orb-2' />
          <div className='glow-orb-3' />
        </div>
        {children}
      </body>
    </html>
  );
}
