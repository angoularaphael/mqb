'use client';

import { AppLayoutWrapper } from '@/app/layout-wrapper';
import { getCurrentUserAction } from '@/app/actions/auth';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { fetchApi } from '@/lib/fetch-api';
import { DAYS_OF_WEEK_SHORT } from '@/lib/constants';

type Sch = {
  id: string;
  course_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  start_date: string;
  end_date: string;
  courseCode: string | null;
  courseName: string | null;
  roomName: string | null;
  merged_schedule_ids?: string[];
};

export default function TeacherPlanningPage() {
  const router = useRouter();
  const [user, setUser] = useState<Record<string, unknown> | null>(null);
  const [schedules, setSchedules] = useState<Sch[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const currentUser = await getCurrentUserAction();
      if (!currentUser || currentUser.role !== 'teacher') {
        router.push('/login');
        return;
      }
      setUser(currentUser);
      try {
        const d = await fetchApi<{ schedules: Sch[]; deduped?: boolean }>(
          '/api/teacher/schedules?dedupe=1',
        );
        setSchedules(d.schedules);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Erreur');
      }
    })();
  }, [router]);

  if (!user) return null;

  return (
    <AppLayoutWrapper user={user}>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
        <div>
          <h1 className="text-4xl font-bold mb-2">Emploi du temps</h1>
          <p className="text-muted-foreground">
            Créneaux regroupés si jour / horaire / cours / salle sont identiques (plusieurs lignes fusionnées en une).
          </p>
        </div>
        {error && <div className="p-3 rounded-lg border border-destructive/40 text-sm">{error}</div>}

        <div className="bg-card border border-border rounded-lg overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted border-b">
              <tr>
                <th className="px-4 py-3 text-left">Jour</th>
                <th className="px-4 py-3 text-left">Horaire</th>
                <th className="px-4 py-3 text-left">Cours</th>
                <th className="px-4 py-3 text-left">Salle</th>
                <th className="px-4 py-3 text-left">Période</th>
                <th className="px-4 py-3 text-left">Fusion</th>
              </tr>
            </thead>
            <tbody>
              {schedules.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                    Aucun créneau
                  </td>
                </tr>
              ) : (
                schedules.map((s) => (
                  <tr key={s.id} className="border-b border-border">
                    <td className="px-4 py-3">
                      {DAYS_OF_WEEK_SHORT[s.day_of_week] ?? s.day_of_week}
                    </td>
                    <td className="px-4 py-3">
                      {s.start_time} – {s.end_time}
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-medium">{s.courseCode}</span>{' '}
                      <span className="text-muted-foreground">{s.courseName}</span>
                    </td>
                    <td className="px-4 py-3">{s.roomName ?? '—'}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {s.start_date} → {s.end_date}
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground font-mono">
                      {s.merged_schedule_ids && s.merged_schedule_ids.length > 1
                        ? `${s.merged_schedule_ids.length} créneaux`
                        : '—'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </motion.div>
    </AppLayoutWrapper>
  );
}
