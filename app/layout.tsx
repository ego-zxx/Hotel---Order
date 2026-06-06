import type {Metadata} from 'next';
import { Inter, Playfair_Display } from 'next/font/google';
import './globals.css'; // Global styles

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
});

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-serif',
});

export const metadata: Metadata = {
  title: 'L\'Atelier - Luxury Hotel Dining',
  description: 'Exquisite culinary delights delivered directly to your room.',
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en" className={`${inter.variable} ${playfair.variable} h-full`}>
      <body suppressHydrationWarning className="font-sans antialiased bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-50 h-full">{children}</body>
    </html>
  );
}
