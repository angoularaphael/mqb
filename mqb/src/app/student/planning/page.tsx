'use client';

import { AppLayoutWrapper } from '@/app/layout-wrapper';
import { getCurrentUserAction } from '@/app/actions/auth';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { canAccessStudentArea } from '@/lib/roles';
import { fetchApi } from '@/lib/fetch-api';
import { withLunchBreak, type ScheduleSlotLike } from '@/lib/schedule-display';
import { useAppPrefs } from '@/components/app-providers';

type Slot = {
  id: string;
  dayIndex: number;
  dayLabel: string;
  startTime: string;
  endTime: string;
  course: string;
  room: string;
};

export default function StudentPlanning() {
  const router = useRouter();
  const { t } = useAppPrefs();
  const [user, setUser] = useState<Record<string, unknown> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [schedule, setSchedule] = useState<Slot[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      const currentUser = await getCurrentUserAction();
      if (!currentUser || !canAccessStudentArea(currentUser.role)) {
        router.push('/login');
        return;
      }
      setUser(currentUser);
      try {
        const d = await fetchApi<{ schedule: Slot[] }>('/api/student/schedule');
        setSchedule(d.schedule);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Erreur');
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity }}
          className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full"
        />
      </div>
    );
  }
  if (!user) return null;

  const days = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
  const byDay = days.map((label, idx) => {
    const raw = schedule.filter((s) => s.dayIndex === idx);
    const asBreak: ScheduleSlotLike[] = raw.map((s) => ({
      id: s.id,
      startTime: s.startTime,
      endTime: s.endTime,
      course: s.course,
      room: s.room,
    }));
    return {
      label,
      slots: withLunchBreak(asBreak),
    };
  });

  return (
    <AppLayoutWrapper user={user}>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold mb-2">Mon Planning</h1>
            <p className="text-muted-foreground">Cours des groupes inscrits — pause méridienne affichée si applicable</p>
          </div>
          <a
            href="/api/student/schedule/pdf"
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold shrink-0"
          >
            {t('download_pdf')}
          </a>
        </div>

        {error && (
          <div className="p-3 rounded-lg border border-destructive/40 text-sm">{error}</div>
        )}

        <div className="bg-card border border-border rounded-lg p-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-4">
            {byDay.map((col) => (
              <div key={col.label} className="space-y-2">
                <p className="font-semibold text-center text-sm">{col.label}</p>
                <div className="space-y-2 min-h-[80px]">
                  {col.slots.length === 0 ? (
                    <p className="text-xs text-muted-foreground text-center">—</p>
                  ) : (
                    col.slots.map((s) => {
                      const isBreak = 'isBreak' in s && s.isBreak;
                      return (
                        <div
                          key={s.id}
                          className={`p-2 rounded text-xs border ${
                            isBreak
                              ? 'bg-amber-500/15 text-amber-900 dark:text-amber-100 border-amber-500/30'
                              : 'bg-primary/10 text-primary border-primary/20'
                          }`}
                        >
                          <p className="font-semibold">
                            {s.startTime}–{s.endTime}
                          </p>
                          <p className="text-muted-foreground">{s.course}</p>
                          {!isBreak && s.room ? <p className="text-muted-foreground">{s.room}</p> : null}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    </AppLayoutWrapper>
  );
}
