import './globals.css';
import type { Metadata } from 'next';
import { DM_Sans, Outfit } from 'next/font/google';
import { ClerkProvider } from '@clerk/nextjs';
import { Toaster } from '@/components/ui/sonner';

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-dm-sans',
  display: 'swap',
});

const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-outfit',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'DMartBrandon — Admin',
  description: 'Admin panel for the DMartBrandon B2B marketplace',
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
          colorPrimary: '#0E5C33',
          colorText: '#1A2E1A',
          colorBackground: '#F8F6F0',
          borderRadius: '0.75rem',
          fontFamily: 'var(--font-dm-sans), system-ui, sans-serif',
        },
      }}
    >
      <html lang="en" className={`${dmSans.variable} ${outfit.variable}`}>
        <body className="font-sans antialiased">
          {children}
          <Toaster />
        </body>
      </html>
    </ClerkProvider>
  );
}
