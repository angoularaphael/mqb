'use client';

import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUserAction } from '@/app/actions/auth';
import { AppLayoutWrapper } from '@/app/layout-wrapper';
import { Moon, Sun } from 'lucide-react';
import { fetchApi } from '@/lib/fetch-api';
import { useAppPrefs } from '@/components/app-providers';

export default function SettingsPage() {
  const router = useRouter();
  const { t, theme, setTheme, lang, setLang, refreshFromServer } = useAppPrefs();
  const [user, setUser] = useState<{
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [fontSize, setFontSize] = useState(16);
  const [emailNotifications, setEmailNotifications] = useState(1);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const currentUser = await getCurrentUserAction();
      if (!currentUser) {
        router.push('/login');
        return;
      }
      setUser(currentUser);
      setFirstName(currentUser.firstName);
      setLastName(currentUser.lastName);
      try {
        const d = await fetchApi<{
          settings: {
            theme: 'light' | 'dark';
            fontSize: number;
            language: 'fr' | 'en';
            emailNotifications: number;
          };
        }>('/api/me/settings');
        setTheme(d.settings.theme);
        setFontSize(d.settings.fontSize);
        setLang(d.settings.language);
        setEmailNotifications(d.settings.emailNotifications);
        document.documentElement.style.fontSize = `${d.settings.fontSize}px`;
      } catch {
        /* valeurs par défaut */
      } finally {
        setIsLoading(false);
      }
    })();
  }, [router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity }}
          className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full"
        />
      </div>
    );
  }

  if (!user) return null;

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  };

  const saveAll = async () => {
    setErr(null);
    setMsg(null);
    setSaving(true);
    try {
      await fetchApi('/api/me/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ firstName, lastName }),
      });
      await fetchApi('/api/me/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          theme,
          fontSize,
          language: lang,
          emailNotifications,
        }),
      });
      setUser({ ...user, firstName, lastName });
      document.documentElement.style.fontSize = `${fontSize}px`;
      await refreshFromServer();
      setMsg(t('saved'));
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Erreur');
    } finally {
      setSaving(false);
    }
  };

  const resetLocal = async () => {
    setErr(null);
    setMsg(null);
    setFirstName(user.firstName);
    setLastName(user.lastName);
    try {
      const d = await fetchApi<{
        settings: {
          theme: 'light' | 'dark';
          fontSize: number;
          language: 'fr' | 'en';
          emailNotifications: number;
        };
      }>('/api/me/settings');
      setTheme(d.settings.theme);
      setFontSize(d.settings.fontSize);
      setLang(d.settings.language);
      setEmailNotifications(d.settings.emailNotifications);
      document.documentElement.style.fontSize = `${d.settings.fontSize}px`;
    } catch {
      /* ignore */
    }
  };

  return (
    <AppLayoutWrapper user={user}>
      <motion.div
        initial="hidden"
        animate="visible"
        variants={containerVariants}
        className="space-y-8 max-w-2xl"
      >
        <motion.div variants={itemVariants}>
          <h1 className="text-4xl font-bold mb-2">{t('settings_title')}</h1>
          <p className="text-muted-foreground">{t('settings_subtitle')}</p>
        </motion.div>

        {msg && (
          <div className="p-3 rounded-lg border border-green-500/40 text-sm text-green-700 dark:text-green-400">
            {msg}
          </div>
        )}
        {err && <div className="p-3 rounded-lg border border-destructive/40 text-sm">{err}</div>}

        <motion.div variants={itemVariants} className="bg-card border border-border rounded-lg p-6">
          <h2 className="text-2xl font-bold mb-4">{t('profile_card')}</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">{t('profile_first')}</label>
              <input
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                minLength={2}
                className="w-full px-4 py-3 bg-muted rounded-lg border border-border"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">{t('profile_last')}</label>
              <input
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                minLength={2}
                className="w-full px-4 py-3 bg-muted rounded-lg border border-border"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">{t('profile_email')}</label>
              <div className="px-4 py-3 bg-muted rounded-lg text-muted-foreground">{user.email}</div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">{t('profile_role')}</label>
              <div className="px-4 py-3 bg-muted rounded-lg capitalize">
                {user.role === 'student' && t('role_student')}
                {user.role === 'teacher' && t('role_teacher')}
                {user.role === 'admin' && t('role_admin')}
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className="bg-card border border-border rounded-lg p-6">
          <h2 className="text-2xl font-bold mb-4">{t('appearance_section')}</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-3">{t('theme')}</label>
              <div className="flex gap-4">
                {[
                  { id: 'light' as const, label: t('theme_light'), icon: Sun },
                  { id: 'dark' as const, label: t('theme_dark'), icon: Moon },
                ].map((option) => {
                  const Icon = option.icon;
                  return (
                    <motion.button
                      key={option.id}
                      type="button"
                      onClick={() => setTheme(option.id)}
                      whileHover={{ scale: 1.05 }}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-all ${
                        theme === option.id
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <Icon size={20} />
                      {option.label}
                    </motion.button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-3">{t('font_size')}</label>
              <div className="flex items-center gap-4">
                <input
                  type="range"
                  min={12}
                  max={24}
                  value={fontSize}
                  onChange={(e) => setFontSize(Number(e.target.value))}
                  className="flex-1 h-2 bg-muted rounded-lg cursor-pointer"
                />
                <span className="text-sm font-semibold w-12 text-right">{fontSize}px</span>
              </div>
              <p className="text-xs text-muted-foreground mt-2" style={{ fontSize: `${fontSize}px` }}>
                Aperçu du texte
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-3">{t('language')}</label>
              <select
                value={lang}
                onChange={(e) => setLang(e.target.value as 'fr' | 'en')}
                className="w-full px-4 py-2 bg-muted border border-border rounded-lg"
              >
                <option value="fr">{t('lang_fr')}</option>
                <option value="en">{t('lang_en')}</option>
              </select>
            </div>
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className="bg-card border border-border rounded-lg p-6">
          <h2 className="text-2xl font-bold mb-4">{t('notifications_title')}</h2>
          <label className="flex items-center justify-between gap-4 cursor-pointer">
            <span className="text-sm font-medium">{t('notifications_email')}</span>
            <input
              type="checkbox"
              checked={emailNotifications === 1}
              onChange={(e) => setEmailNotifications(e.target.checked ? 1 : 0)}
              className="w-5 h-5"
            />
          </label>
        </motion.div>

        <motion.div variants={itemVariants} className="flex gap-4">
          <motion.button
            type="button"
            onClick={saveAll}
            disabled={saving}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="px-6 py-3 bg-primary text-primary-foreground rounded-lg font-semibold disabled:opacity-50"
          >
            {saving ? '…' : t('save')}
          </motion.button>
          <motion.button
            type="button"
            onClick={resetLocal}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="px-6 py-3 border border-border rounded-lg font-semibold hover:bg-muted"
          >
            {t('cancel')}
          </motion.button>
        </motion.div>
      </motion.div>
    </AppLayoutWrapper>
  );
}
