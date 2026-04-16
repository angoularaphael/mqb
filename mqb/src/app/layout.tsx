import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AppProviders } from '@/components/app-providers';
import { CustomCursor } from '@/components/animations/custom-cursor';
import { IntroLoader } from '@/components/animations/intro-loader';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'MQB - School Management System',
  description: 'Advanced school management platform',
};

/** Exécuté dans le <head> : le <body> n’existe pas encore, on ne cible que <html>. */
const themeInitScript = `(function(){try{var d=document.documentElement,s=localStorage.getItem('mqb_theme')||'dark';if(s==='system'){var dark=window.matchMedia('(prefers-color-scheme:dark)').matches;d.classList.toggle('dark',dark);}else{d.classList.toggle('dark',s==='dark');}}catch(e){}})();`;

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
        <IntroLoader />
        <CustomCursor />
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
