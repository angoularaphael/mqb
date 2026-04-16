'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  GraduationCap,
  BookOpen,
  ArrowRight,
  ShieldCheck,
  CalendarClock,
  LineChart,
  X,
  Globe,
} from 'lucide-react';
import { ThemeSwitcher } from '@/components/theme-switcher';
import { t, getStoredLocale, setStoredLocale, type Locale } from '@/lib/i18n';

export default function HomePage() {
  const [showRoleSelect, setShowRoleSelect] = useState(false);
  const [locale, setLocale] = useState<Locale>('fr');

  useEffect(() => {
    setLocale(getStoredLocale());
  }, []);

  const switchLocale = () => {
    const next: Locale = locale === 'fr' ? 'en' : 'fr';
    setLocale(next);
    setStoredLocale(next);
  };

  return (
    <div className="min-h-screen bg-background text-foreground font-sans transition-colors duration-300">
      {/* Navbar */}
      <nav className="flex items-center justify-between px-6 py-4 bg-card border-b border-border sticky top-0 z-40 transition-colors duration-300">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-8 h-8 text-primary" />
          <span className="text-2xl font-bold tracking-tight">MQB System</span>
        </div>

        <div className="flex items-center gap-3">
          {/* Language toggle */}
          <button
            onClick={switchLocale}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-muted text-xs font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground transition"
            title={locale === 'fr' ? 'Switch to English' : 'Passer en Français'}
          >
            <Globe size={14} />
            {locale === 'fr' ? 'EN' : 'FR'}
          </button>

          {/* Theme switcher */}
          <ThemeSwitcher labels={{ light: t(locale, 'theme.light'), dark: t(locale, 'theme.dark'), system: t(locale, 'theme.system') }} />

          <button
            onClick={() => setShowRoleSelect(true)}
            className="px-6 py-2 bg-primary text-primary-foreground rounded-md font-medium hover:opacity-90 transition shadow-md"
          >
            {t(locale, 'nav.login')}
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative px-6 py-16 md:py-24 mx-auto max-w-7xl">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div className="space-y-6 z-10 relative">
            <h1 className="text-5xl lg:text-6xl font-extrabold leading-tight">
              {t(locale, 'home.hero.title_line1')} <br />
              <span className="text-primary">{t(locale, 'home.hero.title_line2')}</span>
            </h1>
            <p className="text-lg text-muted-foreground leading-relaxed max-w-lg">
              {t(locale, 'home.hero.desc')}
            </p>

            <div className="pt-4 flex gap-4">
              <button
                onClick={() => setShowRoleSelect(true)}
                className="px-8 py-3.5 bg-primary text-primary-foreground font-semibold rounded-lg hover:opacity-90 transition-all shadow-lg hover:shadow-xl flex items-center gap-2"
              >
                {t(locale, 'home.hero.cta')} <ArrowRight size={20} />
              </button>
            </div>

            <div className="pt-8 flex gap-8 border-t border-border">
              <div>
                <p className="text-3xl font-bold">1000+</p>
                <p className="text-sm text-muted-foreground font-medium mt-1">{t(locale, 'home.stats.students')}</p>
              </div>
              <div>
                <p className="text-3xl font-bold">50+</p>
                <p className="text-sm text-muted-foreground font-medium mt-1">{t(locale, 'home.stats.teachers')}</p>
              </div>
            </div>
          </div>

          <div className="relative">
            <div className="absolute inset-0 bg-primary/10 rounded-3xl transform translate-x-4 translate-y-4"></div>
            <div className="relative h-[500px] w-full rounded-3xl overflow-hidden shadow-2xl border border-border bg-muted">
              <img
                src="https://images.unsplash.com/photo-1562774053-701939374585?q=80&w=1986&auto=format&fit=crop"
                alt="Campus universitaire moderne"
                className="absolute inset-0 w-full h-full object-cover z-0"
                loading="eager"
                onError={(e) => { 
                  (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1523050335102-c32509142ec0?q=80&w=2000&auto=format&fit=crop';
                }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-card py-20 px-6 border-t border-border transition-colors duration-300">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-16">{t(locale, 'home.features.title')}</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="p-8 rounded-2xl bg-muted border border-border hover:shadow-lg transition">
              <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center mb-6">
                <ShieldCheck className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-3">{t(locale, 'home.features.auth.title')}</h3>
              <p className="text-muted-foreground">{t(locale, 'home.features.auth.desc')}</p>
            </div>
            <div className="p-8 rounded-2xl bg-muted border border-border hover:shadow-lg transition">
              <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center mb-6">
                <CalendarClock className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-3">{t(locale, 'home.features.schedule.title')}</h3>
              <p className="text-muted-foreground">{t(locale, 'home.features.schedule.desc')}</p>
            </div>
            <div className="p-8 rounded-2xl bg-muted border border-border hover:shadow-lg transition">
              <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center mb-6">
                <LineChart className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-3">{t(locale, 'home.features.stats.title')}</h3>
              <p className="text-muted-foreground">{t(locale, 'home.features.stats.desc')}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-card border-t border-border py-8 text-center text-muted-foreground">
        <p>{t(locale, 'home.footer')}</p>
      </footer>

      {/* Role Selection Overlay */}
      <AnimatePresence>
        {showRoleSelect && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="bg-card border border-border rounded-2xl shadow-2xl p-8 max-w-md w-full relative"
            >
              <button
                onClick={() => setShowRoleSelect(false)}
                className="absolute right-4 top-4 text-muted-foreground hover:text-foreground transition"
              >
                <X size={24} />
              </button>

              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold">{t(locale, 'role.title')}</h3>
                <p className="text-muted-foreground mt-2">{t(locale, 'role.desc')}</p>
              </div>

              <div className="space-y-4">
                <Link href="/login?type=student" className="block">
                  <motion.div
                    whileHover={{ y: -2 }}
                    className="flex items-center gap-4 p-5 rounded-xl border-2 border-border hover:border-primary hover:bg-primary/5 transition-colors group cursor-pointer"
                  >
                    <div className="bg-primary/10 p-3 rounded-lg group-hover:bg-primary transition-colors">
                      <GraduationCap className="w-6 h-6 text-primary group-hover:text-primary-foreground" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-lg">{t(locale, 'role.student')}</h4>
                      <p className="text-sm text-muted-foreground">{t(locale, 'role.student.desc')}</p>
                    </div>
                    <ArrowRight className="text-muted-foreground group-hover:text-primary" />
                  </motion.div>
                </Link>

                <Link href="/login?type=teacher" className="block">
                  <motion.div
                    whileHover={{ y: -2 }}
                    className="flex items-center gap-4 p-5 rounded-xl border-2 border-border hover:border-secondary hover:bg-secondary/5 transition-colors group cursor-pointer"
                  >
                    <div className="bg-secondary/10 p-3 rounded-lg group-hover:bg-secondary transition-colors">
                      <BookOpen className="w-6 h-6 text-secondary group-hover:text-secondary-foreground" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-lg">{t(locale, 'role.teacher')}</h4>
                      <p className="text-sm text-muted-foreground">{t(locale, 'role.teacher.desc')}</p>
                    </div>
                    <ArrowRight className="text-muted-foreground group-hover:text-secondary" />
                  </motion.div>
                </Link>

              </div>

              <p className="text-center text-xs text-muted-foreground mt-6">
                {t(locale, 'role.admin.note')}
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
