'use client';

import { AppLayoutWrapper } from '@/app/layout-wrapper';
import { getCurrentUserAction } from '@/app/actions/auth';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { canAccessStudentArea } from '@/lib/roles';
import { fetchApi } from '@/lib/fetch-api';
import { withLunchBreak, type ScheduleSlotLike } from '@/lib/schedule-display';

type Slot = {
  id: string;
  dayLabel: string;
  startTime: string;
  endTime: string;
  course: string;
  room: string;
};

export default function StudentWeekPage() {
  const router = useRouter();
  const [user, setUser] = useState<Record<string, unknown> | null>(null);
  const [schedule, setSchedule] = useState<Slot[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
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
      }
    })();
  }, [router]);

  if (!user) return null;

  const byDay = schedule.reduce<Record<string, Slot[]>>((acc, s) => {
    const k = s.dayLabel;
    if (!acc[k]) acc[k] = [];
    acc[k].push(s);
    return acc;
  }, {});

  return (
    <AppLayoutWrapper user={user}>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
        <div>
          <h1 className="text-4xl font-bold mb-2">Ma semaine</h1>
          <p className="text-muted-foreground">Planning des cours (groupes)</p>
        </div>
        {error && <div className="p-3 rounded-lg border border-destructive/40 text-sm">{error}</div>}

        <div className="space-y-6">
          {Object.keys(byDay).length === 0 ? (
            <p className="text-muted-foreground text-sm">Aucun créneau.</p>
          ) : (
            Object.entries(byDay).map(([day, slots]) => {
              const lined: ScheduleSlotLike[] = slots.map((s) => ({
                id: s.id,
                startTime: s.startTime,
                endTime: s.endTime,
                course: s.course,
                room: s.room,
              }));
              const display = withLunchBreak(lined);
              return (
                <div key={day} className="bg-card border border-border rounded-lg p-4">
                  <h2 className="font-bold mb-3">{day}</h2>
                  <ul className="space-y-2 text-sm">
                    {display.map((s) => {
                      const isBreak = 'isBreak' in s && s.isBreak;
                      return (
                        <li
                          key={s.id}
                          className={`flex flex-wrap gap-2 justify-between border-b border-border/60 pb-2 ${
                            isBreak ? 'text-amber-800 dark:text-amber-200' : ''
                          }`}
                        >
                          <span>
                            {s.startTime}–{s.endTime}
                          </span>
                          <span className="font-medium">{s.course}</span>
                          {!isBreak ? <span className="text-muted-foreground">{s.room}</span> : null}
                        </li>
                      );
                    })}
                  </ul>
                </div>
              );
            })
          )}
        </div>
      </motion.div>
    </AppLayoutWrapper>
  );
}
