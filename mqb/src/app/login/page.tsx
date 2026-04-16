'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Eye, EyeOff, ArrowRight, Loader2, GraduationCap, BookOpen, Clock, Globe } from 'lucide-react';
import { loginAction } from '@/app/actions/auth';
import { useRouter, useSearchParams } from 'next/navigation';
import { ThemeSwitcher } from '@/components/theme-switcher';
import { t, getStoredLocale, setStoredLocale, type Locale } from '@/lib/i18n';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const type = searchParams.get('type');
  const portalType: 'student' | 'teacher' = 
    type === 'teacher' ? 'teacher' : 'student';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [locale, setLocale] = useState<Locale>('fr');

  useEffect(() => {
    setLocale(getStoredLocale());
  }, []);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const switchLocale = () => {
    const next: Locale = locale === 'fr' ? 'en' : 'fr';
    setLocale(next);
    setStoredLocale(next);
  };

  const isTeacher = portalType === 'teacher';
  const isParent = false;
  
  const Icon = isTeacher ? BookOpen : GraduationCap;
  const accentColor = isTeacher ? 'bg-secondary/10' : 'bg-primary/10';
  const iconColor = isTeacher ? 'text-secondary' : 'text-primary';
  const buttonColor = isTeacher ? 'bg-secondary hover:opacity-90' : 'bg-primary hover:opacity-90';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const result = await loginAction({ email, password, portalType });

      if (result.success) {
        if (result.user?.role === 'admin') {
          router.push('/admin/dashboard');
        } else if (result.user?.role === 'teacher') {
          router.push('/teacher/dashboard');
        } else if (result.user?.role === 'parent') {
          router.push('/parent/dashboard');
        } else {
          router.push('/student/dashboard');
        }
      } else {
        setError(result.error || t(locale, 'login.error.generic'));
      }
    } catch (err) {
      console.error(err);
      setError(t(locale, 'login.error.generic'));
    } finally {
      setIsLoading(false);
    }
  };

  const dateLocale = locale === 'fr' ? 'fr-FR' : 'en-US';

  return (
    <div className="w-full max-w-md">
      {/* Top bar: back + controls */}
      <div className="flex items-center justify-between mb-6">
        <Link href="/" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground transition">
          &larr; {t(locale, 'login.back')}
        </Link>
        <div className="flex items-center gap-2">
          <button
            onClick={switchLocale}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-muted text-xs font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground transition"
          >
            <Globe size={14} />
            {locale === 'fr' ? 'EN' : 'FR'}
          </button>
          <ThemeSwitcher labels={{ light: t(locale, 'theme.light'), dark: t(locale, 'theme.dark'), system: t(locale, 'theme.system') }} />
        </div>
      </div>

      <div className="bg-card border border-border rounded-2xl p-8 shadow-xl transition-colors duration-300">
        {/* Live clock */}
        <div className="text-center mb-6 p-4 bg-muted rounded-xl border border-border">
          <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground mb-1">
            <Clock size={14} />
            {t(locale, 'login.datetime')}
          </div>
          <div className="text-2xl font-mono font-bold">
            {currentTime.toLocaleTimeString(dateLocale)}
          </div>
          <div className="text-sm text-muted-foreground mt-1">
            {currentTime.toLocaleDateString(dateLocale, {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </div>
        </div>

        {/* Header */}
        <div className="text-center mb-8">
          <div className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-4 ${accentColor}`}>
            <Icon className={`w-8 h-8 ${iconColor}`} />
          </div>
          <h1 className="text-3xl font-extrabold mb-2">
            {isTeacher ? t(locale, 'login.teacher.space') : t(locale, 'login.student.space')}
          </h1>
          <p className="text-muted-foreground text-sm">{t(locale, 'login.subtitle')}</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Email */}
          <div>
            <label className="block text-sm font-medium mb-1">
              {t(locale, 'login.email')}
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t(locale, 'login.email.placeholder')}
              className="w-full px-4 py-3 bg-background border border-input rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
              required
            />
          </div>

          {/* Password */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-sm font-medium">
                {t(locale, 'login.password')}
              </label>
              <Link href="/request-reset" className="text-sm font-medium text-primary hover:opacity-80">
                {t(locale, 'login.password.forgot')}
              </Link>
            </div>

            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-3 bg-background border border-input rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all pr-12"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          {/* Error message */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-3 bg-destructive/10 border border-destructive/30 rounded-lg text-destructive text-sm font-medium"
            >
              {error}
            </motion.div>
          )}

          {/* Submit button */}
          <button
            type="submit"
            disabled={isLoading}
            className={`w-full py-3.5 text-white font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${buttonColor} disabled:opacity-70 disabled:cursor-not-allowed`}
          >
            {isLoading ? (
              <>
                <Loader2 size={20} className="animate-spin" />
                {t(locale, 'login.loading')}
              </>
            ) : (
              <>
                {t(locale, 'login.submit')}
                <ArrowRight size={20} />
              </>
            )}
          </button>
        </form>
      </div>

      <div className="mt-8 text-center text-sm font-medium text-muted-foreground flex items-center justify-center gap-2">
        <ShieldCheck size={16} /> {t(locale, 'login.secure')}
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-background font-sans transition-colors duration-300">
      <Suspense fallback={<div className="flex items-center justify-center p-8"><Loader2 className="animate-spin text-primary w-8 h-8" /></div>}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
