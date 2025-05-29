

import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { ClientProviders } from './client-providers'; // New component

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

// Static metadata for initial load / SEO
export const metadata: Metadata = {
  title: 'PhotoPoem', // Default title, will be updated by DynamicTitleSetter on client
  description: 'Generate poems from your photos with AI.', // Default description
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>{/* suppressHydrationWarning for next-themes pattern */}
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased font-sans`}>
        <ClientProviders>{children}</ClientProviders>
      </body>
    </html>
  );
}
