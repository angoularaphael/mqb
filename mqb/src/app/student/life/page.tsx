'use client';

import { AppLayoutWrapper } from '@/app/layout-wrapper';
import { getCurrentUserAction } from '@/app/actions/auth';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { canAccessStudentArea } from '@/lib/roles';
import { fetchApi } from '@/lib/fetch-api';
import { useAppPrefs } from '@/components/app-providers';
import { fmtMsg } from '@/lib/messages';

type DashboardStats = {
  averageLabel: string;
  hours: { plannedHours: number; courseCount: number; coursesWithGrade: number };
  absencesCount: number;
};

export default function StudentLifePage() {
  const router = useRouter();
  const { t } = useAppPrefs();
  const [user, setUser] = useState<Record<string, unknown> | null>(null);
  const [stats, setStats] = useState<DashboardStats | null>(null);
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
        const d = await fetchApi<{ stats: DashboardStats }>('/api/student/dashboard');
        setStats(d.stats);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Erreur');
      }
    })();
  }, [router]);

  if (!user) return null;

  return (
    <AppLayoutWrapper user={user}>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 max-w-2xl">
        <div>
          <h1 className="text-4xl font-bold mb-2">Vie au centre</h1>
          <p className="text-muted-foreground">Vue d’ensemble scolaire (moyenne, volume horaire, assiduité)</p>
        </div>
        {error && <div className="p-3 rounded-lg border border-destructive/40 text-sm">{error}</div>}

        {stats && (
          <div className="bg-card border border-border rounded-lg p-6 space-y-4">
            <p>
              <strong>{t('student_avg')} :</strong> {stats.averageLabel}
            </p>
            <div>
              <strong className="block mb-1">{t('student_hours')}</strong>
              <p className="text-muted-foreground text-sm leading-relaxed">
                {fmtMsg(t('hours_program'), { p: stats.hours.plannedHours })}
              </p>
              <p className="text-muted-foreground text-sm leading-relaxed mt-1">
                {fmtMsg(t('hours_graded'), {
                  g: stats.hours.coursesWithGrade,
                  t: stats.hours.courseCount,
                })}
              </p>
            </div>
            <p>
              <strong>{t('student_absences')} :</strong>{' '}
              {fmtMsg(t('absences_count'), { n: stats.absencesCount })}
            </p>
          </div>
        )}
      </motion.div>
    </AppLayoutWrapper>
  );
}
