'use client';

import { ReactNode } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { LogOut, Settings, Zap } from 'lucide-react';
import { logoutAction } from '@/app/actions/auth';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';

interface AppLayoutProps {
  children: ReactNode;
  user?: any;
}

export function AppLayoutWrapper({ children, user }: AppLayoutProps) {
  const router = useRouter();
  const [sessionTime, setSessionTime] = useState(0);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setSessionTime((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = async () => {
    await logoutAction();
    router.push('/login');
  };

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="sticky top-0 z-50 border-b border-border bg-background"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          {/* Left side */}
          <div className="flex items-center gap-4">
            <motion.h1
              className="text-2xl font-bold text-foreground"
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              MQB
            </motion.h1>
            {user && (
              <div className="hidden sm:block text-sm text-foreground">
                <p className="font-semibold text-foreground">Bienvenue {user.firstName} {user.lastName}</p>
                <motion.p
                  className="text-xs text-muted-foreground flex items-center gap-1"
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <span className="inline-block w-2 h-2 rounded-full bg-green-500" />
                  En ligne
                </motion.p>
              </div>
            )}
          </div>

          {/* Right side */}
          <div className="flex items-center gap-4">
            {/* Session time */}
            <div className="hidden md:flex items-center gap-2 text-sm text-muted-foreground px-3 py-1 rounded-lg bg-muted">
              <Zap size={16} className="text-yellow-500" />
              <span className="font-mono">{formatTime(sessionTime)}</span>
            </div>

            {/* Menu button */}
            <motion.button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 hover:bg-muted rounded-lg transition-colors"
              whileHover={{ scale: 1.1 }}
            >
              <span className="text-2xl">⚙️</span>
            </motion.button>
          </div>
        </div>

        {/* User menu */}
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="border-t border-border bg-muted/50 px-4 py-3 flex gap-3 justify-end"
          >
            <Link
              href="/settings"
              className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-muted transition-colors text-sm"
            >
              <Settings size={16} />
              Paramètres
            </Link>
            <motion.button
              onClick={handleLogout}
              className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-destructive/10 hover:text-destructive transition-colors text-sm"
              whileHover={{ x: 5 }}
            >
              <LogOut size={16} />
              Déconnexion
            </motion.button>
          </motion.div>
        )}
      </motion.header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {children}
      </main>
    </div>
  );
}
