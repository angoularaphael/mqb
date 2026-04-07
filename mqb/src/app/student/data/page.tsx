'use client';

import { AppLayoutWrapper } from '@/app/layout-wrapper';
import { getCurrentUserAction } from '@/app/actions/auth';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { canAccessStudentArea } from '@/lib/roles';
import { fetchApi } from '@/lib/fetch-api';
import { useAppPrefs } from '@/components/app-providers';
import { fmtMsg } from '@/lib/messages';

type DashboardStats = {
  averageLabel: string;
  hours: { plannedHours: number; courseCount: number; coursesWithGrade: number };
  absencesCount: number;
};

export default function StudentDataPage() {
  const router = useRouter();
  const { t } = useAppPrefs();
  const [user, setUser] = useState<Record<string, unknown> | null>(null);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [activity, setActivity] = useState<{ title: string; desc: string; time: string }[]>([]);
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
        const d = await fetchApi<{
          stats: DashboardStats;
          activity: { title: string; desc: string; time: string }[];
        }>('/api/student/dashboard');
        setStats(d.stats);
        setActivity(d.activity);
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
          <h1 className="text-4xl font-bold mb-2">Mes données</h1>
          <p className="text-muted-foreground">Synthèse issue du tableau de bord (API réelle)</p>
        </div>
        {error && <div className="p-3 rounded-lg border border-destructive/40 text-sm">{error}</div>}

        {stats && (
          <div className="grid sm:grid-cols-3 gap-4">
            <div className="bg-card border border-border rounded-lg p-4">
              <p className="text-sm text-muted-foreground">{t('student_avg')}</p>
              <p className="text-2xl font-bold">{stats.averageLabel}</p>
            </div>
            <div className="bg-card border border-border rounded-lg p-4">
              <p className="text-sm text-muted-foreground">{t('student_hours')}</p>
              <p className="text-base font-semibold mt-2 leading-snug">
                {fmtMsg(t('hours_program'), { p: stats.hours.plannedHours })}
              </p>
              <p className="text-sm text-muted-foreground mt-2 leading-snug">
                {fmtMsg(t('hours_graded'), {
                  g: stats.hours.coursesWithGrade,
                  t: stats.hours.courseCount,
                })}
              </p>
            </div>
            <div className="bg-card border border-border rounded-lg p-4">
              <p className="text-sm text-muted-foreground">{t('student_absences')}</p>
              <p className="text-lg font-semibold">{fmtMsg(t('absences_count'), { n: stats.absencesCount })}</p>
            </div>
          </div>
        )}

        <div className="bg-card border border-border rounded-lg p-6">
          <h2 className="font-bold mb-3">Activité récente</h2>
          {activity.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aucune entrée.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {activity.map((a, i) => (
                <li key={i} className="border-b border-border pb-2">
                  <span className="font-medium">{a.title}</span>
                  <span className="text-muted-foreground"> — {a.time}</span>
                  {a.desc && <p className="text-muted-foreground text-xs mt-1">{a.desc}</p>}
                </li>
              ))}
            </ul>
          )}
        </div>

        <p className="text-sm">
          Modifier prénom, nom ou préférences :{' '}
          <Link href="/settings" className="text-primary underline">
            Paramètres
          </Link>
        </p>
      </motion.div>
    </AppLayoutWrapper>
  );
}
