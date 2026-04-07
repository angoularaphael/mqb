import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AppProviders } from '@/components/app-providers';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'MQB - School Management System',
  description: 'Advanced school management platform',
};

/** Exécuté dans le <head> : le <body> n’existe pas encore, on ne cible que <html>. */
const themeInitScript = `(function(){try{var d=document.documentElement,s=localStorage.getItem('mqb_theme'),dark=s!=='light';d.classList.toggle('dark',dark);}catch(e){}})();`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" suppressHydrationWarning className="dark">
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className={`${inter.className} min-h-full bg-background text-foreground`} suppressHydrationWarning>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
