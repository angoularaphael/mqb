'use client';

import { useState, useEffect } from 'react';
import { Sun, Moon, Monitor } from 'lucide-react';

export type Theme = 'light' | 'dark' | 'system';

function applyTheme(theme: Theme) {
  const root = document.documentElement;
  if (theme === 'system') {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    root.classList.toggle('dark', prefersDark);
  } else {
    root.classList.toggle('dark', theme === 'dark');
  }
}

export function ThemeSwitcher({ labels }: { labels?: { light: string; dark: string; system: string } }) {
  const [theme, setTheme] = useState<Theme>('dark');

  useEffect(() => {
    const stored = localStorage.getItem('mqb_theme') as Theme | null;
    const t = stored || 'dark';
    setTheme(t);
    applyTheme(t);

    // Listen for system preference changes when on "system" mode
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => {
      if ((localStorage.getItem('mqb_theme') as Theme) === 'system') {
        applyTheme('system');
      }
    };
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  const changeTheme = (newTheme: Theme) => {
    setTheme(newTheme);
    localStorage.setItem('mqb_theme', newTheme);
    applyTheme(newTheme);
  };

  const items: { key: Theme; icon: typeof Sun; label: string }[] = [
    { key: 'light', icon: Sun, label: labels?.light ?? 'Clair' },
    { key: 'dark', icon: Moon, label: labels?.dark ?? 'Sombre' },
    { key: 'system', icon: Monitor, label: labels?.system ?? 'Système' },
  ];

  return (
    <div className="flex items-center rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 p-0.5">
      {items.map(({ key, icon: Icon, label }) => (
        <button
          key={key}
          onClick={() => changeTheme(key)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
            theme === key
              ? 'bg-white dark:bg-slate-600 text-slate-900 dark:text-white shadow-sm'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
          title={label}
        >
          <Icon size={14} />
          <span className="hidden sm:inline">{label}</span>
        </button>
      ))}
    </div>
  );
}
