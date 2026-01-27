import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Lost. Found. Returned. — School Lost & Found',
  description: 'Report found items, browse lost belongings, and get them back—fast.',
  keywords: ['lost and found', 'school', 'belongings', 'items', 'recovery'],
  authors: [{ name: 'Lost&Found Team' }],
  creator: 'Lost&Found',
  publisher: 'Lost&Found',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('https://lostfound.app'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'Lost. Found. Returned. — School Lost & Found',
    description: 'Report found items, browse lost belongings, and get them back—fast.',
    url: 'https://lostfound.app',
    siteName: 'Lost&Found',
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Lost. Found. Returned. — School Lost & Found',
    description: 'Report found items, browse lost belongings, and get them back—fast.',
    creator: '@lostfound',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased" suppressHydrationWarning={true}>
        {children}
      </body>
    </html>
  );
}
