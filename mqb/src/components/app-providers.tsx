'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { type Lang, type MessageKey, messages } from '@/lib/messages';

function applyThemeClass(theme: 'light' | 'dark') {
  const on = theme === 'dark';
  document.documentElement.classList.toggle('dark', on);
  document.body.classList.toggle('dark', on);
}

type I18nCtx = {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (k: MessageKey) => string;
  theme: 'light' | 'dark';
  setTheme: (t: 'light' | 'dark') => void;
  refreshFromServer: () => Promise<void>;
};

const Ctx = createContext<I18nCtx | null>(null);

export function useAppPrefs() {
  const x = useContext(Ctx);
  if (!x) {
    return {
      lang: 'fr' as Lang,
      setLang: () => {},
      t: (k: MessageKey) => messages.fr[k],
      theme: 'dark' as const,
      setTheme: () => {},
      refreshFromServer: async () => {},
    };
  }
  return x;
}

export function AppProviders({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>('fr');
  const [theme, setThemeState] = useState<'light' | 'dark'>('dark');
  const refreshFromServer = useCallback(async () => {
    try {
      const r = await fetch('/api/me/settings', { credentials: 'include' });
      if (!r.ok) return;
      const d = (await r.json()) as {
        settings: { theme: 'light' | 'dark'; language: Lang; fontSize: number };
      };
      const th = d.settings.theme;
      const lg = d.settings.language === 'en' ? 'en' : 'fr';
      setThemeState(th);
      setLangState(lg);
      localStorage.setItem('mqb_theme', th);
      localStorage.setItem('mqb_lang', lg);
      applyThemeClass(th);
      document.documentElement.lang = lg === 'en' ? 'en' : 'fr';
      document.documentElement.style.fontSize = `${d.settings.fontSize}px`;
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    const storedT = localStorage.getItem('mqb_theme') as 'light' | 'dark' | null;
    const storedL = localStorage.getItem('mqb_lang') as Lang | null;
    if (storedT === 'light' || storedT === 'dark') {
      setThemeState(storedT);
      applyThemeClass(storedT);
    } else {
      applyThemeClass('dark');
    }
    if (storedL === 'fr' || storedL === 'en') {
      setLangState(storedL);
      document.documentElement.lang = storedL === 'en' ? 'en' : 'fr';
    }
    void refreshFromServer();
  }, [refreshFromServer]);

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    localStorage.setItem('mqb_lang', l);
    document.documentElement.lang = l === 'en' ? 'en' : 'fr';
  }, []);

  const setTheme = useCallback((t: 'light' | 'dark') => {
    setThemeState(t);
    localStorage.setItem('mqb_theme', t);
    applyThemeClass(t);
  }, []);

  const t = useCallback(
    (k: MessageKey) => messages[lang][k] ?? messages.fr[k],
    [lang],
  );

  const value = useMemo(
    () => ({ lang, setLang, t, theme, setTheme, refreshFromServer }),
    [lang, setLang, t, theme, setTheme, refreshFromServer],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
