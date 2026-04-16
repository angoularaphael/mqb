'use client';

import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUserAction } from '@/app/actions/auth';
import { AppLayoutWrapper } from '@/app/layout-wrapper';
import { DAYS_OF_WEEK_SHORT, MENU_TEACHER } from '@/lib/constants';
import Link from 'next/link';
import { Clock, BookOpen, Calendar, Mail } from 'lucide-react';
import { fetchApi } from '@/lib/fetch-api';

type InboxItem = {
  id: string;
  fromMe: boolean;
  peerName: string;
  title: string;
  preview: string;
  date: string;
  read: boolean;
};

type Sch = {
  id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  courseCode: string | null;
  courseName: string | null;
  roomName: string | null;
};

export default function TeacherDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<Record<string, unknown> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [courseCount, setCourseCount] = useState(0);
  const [allSchedules, setAllSchedules] = useState<Sch[]>([]);
  const [inboxPreview, setInboxPreview] = useState<InboxItem[]>([]);

  useEffect(() => {
    const loadUser = async () => {
      const currentUser = await getCurrentUserAction();
      if (!currentUser || currentUser.role !== 'teacher') {
        router.push('/login');
        return;
      }
      setUser(currentUser);
      try {
        const [c, s, inbox] = await Promise.all([
          fetchApi<{ courses: unknown[] }>('/api/teacher/courses'),
          fetchApi<{ schedules: Sch[] }>('/api/teacher/schedules'),
          fetchApi<{ inboxPreview: InboxItem[] }>('/api/teacher/inbox-preview').catch(() => ({
            inboxPreview: [] as InboxItem[],
          })),
        ]);
        setCourseCount(c.courses.length);
        setAllSchedules(s.schedules);
        setInboxPreview(inbox.inboxPreview ?? []);
      } catch {
        setCourseCount(0);
        setAllSchedules([]);
        setInboxPreview([]);
      }
      setIsLoading(false);
    };
    loadUser();
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

  return (
    <AppLayoutWrapper user={user}>
      <motion.div
        initial="hidden"
        animate="visible"
        variants={containerVariants}
        className="space-y-8"
      >
        <motion.div variants={itemVariants}>
          <h1 className="text-4xl font-bold mb-2">Tableau de bord enseignant</h1>
          <p className="text-muted-foreground">Données issues de vos cours et créneaux en base</p>
        </motion.div>

        <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { icon: BookOpen, label: 'Mes cours', value: String(courseCount), color: 'from-purple-500 to-purple-600' },
            {
              icon: Calendar,
              label: 'Créneaux planifiés',
              value: String(allSchedules.length),
              color: 'from-green-500 to-green-600',
            },
            {
              icon: Clock,
              label: 'Emploi du temps',
              value: 'Voir',
              color: 'from-blue-500 to-blue-600',
              link: '/teacher/planning',
            },
          ].map((stat, idx) => {
            const Icon = stat.icon;
            const inner = (
              <motion.div
                whileHover={{ y: -10 }}
                className={`bg-gradient-to-br ${stat.color} rounded-lg p-6 text-white shadow-lg`}
              >
                <Icon size={28} className="mb-3 opacity-80" />
                <p className="text-sm opacity-90">{stat.label}</p>
                <p className="text-3xl font-bold mt-2">{stat.value}</p>
              </motion.div>
            );
            return stat.link ? (
              <Link key={idx} href={stat.link}>
                {inner}
              </Link>
            ) : (
              <div key={idx}>{inner}</div>
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
              href="/teacher/messaging"
              className="text-sm font-medium text-primary underline hover:no-underline"
            >
              Ouvrir la messagerie
            </Link>
          </div>
          <div className="space-y-2">
            {inboxPreview.length === 0 ? (
              <p className="text-sm text-muted-foreground">Aucun message direct pour le moment.</p>
            ) : (
              inboxPreview.map((m) => (
                <Link
                  key={m.id}
                  href="/teacher/messaging"
                  onClick={async () => {
                    if (!m.read) {
                      try {
                        await fetchApi('/api/messaging/mark-read', {
                          method: 'POST',
                          body: JSON.stringify({ messageId: m.id, type: m.type === 'broadcast' ? 'broadcast' : 'direct' })
                        });
                      } catch (e) {}
                    }
                  }}
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
          <h2 className="text-2xl font-bold mb-4">Actions rapides</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {MENU_TEACHER.slice(1, 6).map((item, idx) => (
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
          <h2 className="text-2xl font-bold mb-4">Aperçu des créneaux</h2>
          <div className="space-y-3">
            {allSchedules.length === 0 ? (
              <p className="text-sm text-muted-foreground">Aucun créneau pour le moment.</p>
            ) : (
              allSchedules.slice(0, 8).map((sch) => (
                <motion.div
                  key={sch.id}
                  whileHover={{ x: 6 }}
                  className="p-4 bg-card border border-border rounded-lg hover:bg-muted transition-colors"
                >
                  <div className="flex justify-between items-start gap-4">
                    <div>
                      <p className="font-semibold">
                        {sch.courseCode} {sch.courseName && `— ${sch.courseName}`}
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">
                        {DAYS_OF_WEEK_SHORT[sch.day_of_week] ?? sch.day_of_week} • {sch.start_time}–
                        {sch.end_time}
                      </p>
                    </div>
                    <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded shrink-0">
                      {sch.roomName ?? '—'}
                    </span>
                  </div>
                </motion.div>
              ))
            )}
          </div>
          <Link
            href="/teacher/planning"
            className="inline-block mt-4 text-sm text-primary underline"
          >
            Voir tout l’emploi du temps
          </Link>
        </motion.div>
      </motion.div>
    </AppLayoutWrapper>
  );
}
