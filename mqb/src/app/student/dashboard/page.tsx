'use client';

import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUserAction } from '@/app/actions/auth';
import { AppLayoutWrapper } from '@/app/layout-wrapper';
import { MENU_STUDENT } from '@/lib/constants';
import { canAccessStudentArea } from '@/lib/roles';
import { fetchApi } from '@/lib/fetch-api';
import Link from 'next/link';
import { BarChart3, Clock, AlertCircle, Mail } from 'lucide-react';
import { useAppPrefs } from '@/components/app-providers';
import { fmtMsg } from '@/lib/messages';

type InboxItem = {
  id: string;
  fromMe: boolean;
  peerName: string;
  title: string;
  preview: string;
  date: string;
  read: boolean;
};

type DashboardPayload = {
  stats: {
    averageLabel: string;
    hours: { plannedHours: number; courseCount: number; coursesWithGrade: number };
    absencesCount: number;
  };
  activity: { title: string; desc: string; time: string }[];
  schedulePreview: { day: string; slots: { startTime: string; endTime: string; course: string }[] }[];
  inboxPreview: InboxItem[];
};

export default function StudentDashboard() {
  const router = useRouter();
  const { t } = useAppPrefs();
  const [user, setUser] = useState<{
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [data, setData] = useState<DashboardPayload | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      const currentUser = await getCurrentUserAction();
      if (!currentUser || !canAccessStudentArea(currentUser.role)) {
        router.push('/login');
        return;
      }
      setUser(currentUser);
      try {
        const d = await fetchApi<DashboardPayload>('/api/student/dashboard');
        setData(d);
      } catch (e) {
        setLoadError(e instanceof Error ? e.message : 'Erreur de chargement');
      } finally {
        setIsLoading(false);
      }
    };
    load();
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
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5 },
    },
  };

  const stats = data
    ? [
        {
          icon: BarChart3,
          title: t('student_avg'),
          value: data.stats.averageLabel,
          color: 'from-blue-500 to-blue-600',
        },
        {
          icon: Clock,
          title: t('student_hours'),
          value: (
            <span className="block text-left">
              <span className="block text-lg leading-snug">
                {fmtMsg(t('hours_program'), { p: data.stats.hours.plannedHours })}
              </span>
              <span className="block text-base font-semibold mt-2 leading-snug">
                {fmtMsg(t('hours_graded'), {
                  g: data.stats.hours.coursesWithGrade,
                  t: data.stats.hours.courseCount,
                })}
              </span>
            </span>
          ),
          color: 'from-green-500 to-green-600',
        },
        {
          icon: AlertCircle,
          title: t('student_absences'),
          value: fmtMsg(t('absences_count'), { n: data.stats.absencesCount }),
          color: 'from-red-500 to-red-600',
        },
      ]
    : [];

  return (
    <AppLayoutWrapper user={user}>
      <motion.div
        initial="hidden"
        animate="visible"
        variants={containerVariants}
        className="space-y-8"
      >
        {loadError && (
          <div className="p-4 rounded-lg border border-destructive/50 bg-destructive/10 text-sm">
            {loadError}
          </div>
        )}

        <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {stats.map((stat, idx) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={idx}
                whileHover={{ y: -10 }}
                className={`bg-gradient-to-br ${stat.color} rounded-lg p-6 text-white shadow-lg`}
              >
                <Icon size={32} className="mb-4 opacity-80" />
                <p className="text-sm opacity-90">{stat.title}</p>
                <p className="text-2xl font-bold mt-2 break-words">{stat.value}</p>
              </motion.div>
            );
          })}
        </motion.div>

        <motion.div variants={itemVariants}>
          <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
            <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Mail className="h-6 w-6 text-primary" />
              Messages récents
            </h2>
            <Link
              href="/student/messaging"
              className="text-sm font-medium text-primary underline hover:no-underline"
            >
              Ouvrir la messagerie
            </Link>
          </div>
          <div className="space-y-2">
            {(data?.inboxPreview ?? []).length === 0 ? (
              <p className="text-sm text-muted-foreground">Aucun message direct pour le moment.</p>
            ) : (
              (data?.inboxPreview ?? []).map((m) => (
                <Link
                  key={m.id}
                  href="/student/messaging"
                  className={`block rounded-lg border border-border p-4 transition-colors hover:bg-muted ${
                    !m.read && !m.fromMe ? 'border-primary/40 bg-primary/5' : 'bg-card'
                  }`}
                >
                  <p className="text-xs text-muted-foreground">{m.date}</p>
                  <p className="font-semibold text-foreground mt-1">
                    {m.fromMe ? `À ${m.peerName}` : `De ${m.peerName}`}
                    {!m.read && !m.fromMe ? (
                      <span className="ml-2 text-xs font-normal text-primary">(non lu)</span>
                    ) : null}
                  </p>
                  <p className="text-sm text-foreground/90 mt-1 line-clamp-2">{m.title}</p>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{m.preview}</p>
                </Link>
              ))
            )}
          </div>
        </motion.div>

        <motion.div variants={itemVariants}>
          <h2 className="text-2xl font-bold mb-4">Accès rapide</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {MENU_STUDENT.slice(0, 8).map((item, idx) => (
              <motion.div key={idx} whileHover={{ scale: 1.05 }}>
                <Link
                  href={item.href}
                  className="p-4 bg-card hover:bg-muted rounded-lg border border-border transition-colors text-center block"
                >
                  <p className="text-sm font-semibold text-foreground">{item.label}</p>
                </Link>
              </motion.div>
            ))}
          </div>
        </motion.div>

        <motion.div variants={itemVariants}>
          <h2 className="text-2xl font-bold mb-4">Activité (journal)</h2>
          <div className="space-y-3">
            {data?.activity?.length ? (
              data.activity.map((news, idx) => (
                <motion.div
                  key={idx}
                  whileHover={{ x: 10 }}
                  className="p-4 bg-card border border-border rounded-lg hover:bg-muted transition-colors"
                >
                  <h3 className="font-semibold text-foreground">{news.title}</h3>
                  {news.desc ? (
                    <p className="text-sm text-muted-foreground mt-1">{news.desc}</p>
                  ) : null}
                  <p className="text-xs text-muted-foreground mt-2">{news.time}</p>
                </motion.div>
              ))
            ) : (
              <p className="text-muted-foreground text-sm">Aucune entrée dans le journal d’activité.</p>
            )}
          </div>
        </motion.div>

        <motion.div variants={itemVariants}>
          <h2 className="text-2xl font-bold mb-4">Emploi du temps (aperçu lun.–ven.)</h2>
          <div className="bg-card border border-border rounded-lg overflow-hidden">
            <div className="grid grid-cols-5 gap-0 divide-x divide-border">
              {(data?.schedulePreview ?? []).map((col) => (
                <div key={col.day} className="p-4 text-center">
                  <p className="font-semibold text-foreground mb-3">{col.day}</p>
                  <div className="space-y-2">
                    {col.slots.length ? (
                      col.slots.map((s) => (
                        <div
                          key={`${s.startTime}-${s.course}`}
                          className="text-xs bg-primary/10 text-primary p-2 rounded"
                        >
                          {s.startTime}-{s.endTime}
                          <br />
                          {s.course}
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-muted-foreground">—</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AppLayoutWrapper>
  );
}
