import type { Metadata } from 'next';
import { ClerkProvider } from '@clerk/nextjs';
import './globals.css';

export const metadata: Metadata = {
  title: 'Lost. Found. Returned. — School Lost & Found',
  description: 'Report found items, browse lost belongings, and get them back—fast.',
  keywords: ['lost and found', 'school', 'belongings', 'items', 'recovery'],
  authors: [{ name: 'Reclaim Team' }],
  creator: 'Reclaim',
  publisher: 'Reclaim',
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
    siteName: 'Reclaim',
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
    <ClerkProvider
      signInForceRedirectUrl="/onboarding"
      signUpForceRedirectUrl="/onboarding"
      afterSignOutUrl="/"
      appearance={{
        variables: {
          colorPrimary: '#a855f7',
          colorTextOnPrimaryBackground: '#ffffff',
          colorBackground: '#ffffff',
          colorInputBackground: '#ffffff',
          colorInputText: '#1f2937',
          colorText: '#1f2937',
          colorTextSecondary: '#6b7280',
          colorDanger: '#ef4444',
          borderRadius: '0.5rem',
        },
        elements: {
          // Hide Clerk's default organization-related UI
          organizationSwitcherTrigger: { display: 'none' },
          organizationSwitcherPopoverCard: { display: 'none' },
          organizationPreview: { display: 'none' },
          organizationList: { display: 'none' },
          // Card styling - light theme
          card: 'bg-white border border-gray-200 shadow-2xl',
          // Header text - dark for light theme
          headerTitle: 'text-gray-900 text-2xl font-bold',
          headerSubtitle: 'text-gray-600',
          // Form fields - light theme
          formFieldInput:
            'bg-white border-gray-300 text-gray-900 placeholder:text-gray-500 focus:border-purple-500 focus:ring-purple-500/20',
          formFieldLabel: 'text-gray-700',
          // OTP code fields
          otpCodeFieldInput:
            'bg-white border-gray-300 text-gray-900 focus:border-purple-500 focus:ring-purple-500/20',
          // Primary button with gradient
          formButtonPrimary:
            'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white shadow-lg shadow-purple-500/25 transition-all',
          // Links
          footerActionLink: 'text-purple-600 hover:text-purple-700',
          identityPreviewEditButton: 'text-purple-600 hover:text-purple-700',
          formResendCodeLink: 'text-purple-600 hover:text-purple-700',
          // Footer text
          footerAction: 'text-gray-600',
          footerPages: 'text-gray-600',
          footerPagesLink: 'text-purple-600 hover:text-purple-700',
          footerBrandingText: 'text-gray-600',
          footerBrandingLink: 'text-purple-600 hover:text-purple-700',
          // Alerts and errors
          alertText: 'text-gray-700',
          formFieldErrorText: 'text-red-600',
          // Dividers
          dividerLine: 'bg-gray-300',
          dividerText: 'text-gray-600',
          // Social buttons - border only (outline style), not filled
          socialButtonsBlockButton:
            'bg-transparent border border-gray-300 text-gray-900 hover:bg-gray-50 hover:border-gray-400 transition-all',
          socialButtonsBlockButtonText: 'text-gray-900 font-medium',
          socialButtonsBlockButtonArrow: 'text-gray-900',
          socialButtonsBlockButton__google:
            'bg-transparent border border-gray-300 text-gray-900 hover:bg-gray-50 hover:border-gray-400',
          socialButtonsBlockButton__apple:
            'bg-transparent border border-gray-300 text-gray-900 hover:bg-gray-50 hover:border-gray-400',
          socialButtonsBlockButton__facebook:
            'bg-transparent border border-gray-300 text-gray-900 hover:bg-gray-50 hover:border-gray-400',
        },
      }}
    >
      <html lang="en">
        <body className="antialiased" suppressHydrationWarning={true}>
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
