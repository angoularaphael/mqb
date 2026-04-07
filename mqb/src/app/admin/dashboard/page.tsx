'use client';

import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUserAction } from '@/app/actions/auth';
import { AppLayoutWrapper } from '@/app/layout-wrapper';
import { MENU_ADMIN } from '@/lib/constants';
import Link from 'next/link';
import { Users, BookOpen, HelpCircle, Mail } from 'lucide-react';

type InboxItem = {
  id: string;
  fromMe: boolean;
  peerName: string;
  title: string;
  preview: string;
  date: string;
  read: boolean;
};
import { fetchApi } from '@/lib/fetch-api';

export default function AdminDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [kpi, setKpi] = useState<{
    students: number;
    teachers: number;
    courses: number;
    requests: number;
  } | null>(null);
  const [inboxPreview, setInboxPreview] = useState<InboxItem[]>([]);

  useEffect(() => {
    const loadUser = async () => {
      const currentUser = await getCurrentUserAction();
      if (!currentUser || currentUser.role !== 'admin') {
        router.push('/login');
        return;
      }
      setUser(currentUser);
      try {
        const [meta, stats, inbox] = await Promise.all([
          fetchApi<{ students: unknown[]; teachers: unknown[] }>('/api/admin/meta'),
          fetchApi<{
            statistics: { courses: number; requests: number };
          }>('/api/admin/statistics'),
          fetchApi<{ inboxPreview: InboxItem[] }>('/api/admin/inbox-preview').catch(() => ({
            inboxPreview: [] as InboxItem[],
          })),
        ]);
        setKpi({
          students: meta.students.length,
          teachers: meta.teachers.length,
          courses: stats.statistics.courses,
          requests: stats.statistics.requests,
        });
        setInboxPreview(inbox.inboxPreview ?? []);
      } catch {
        setKpi(null);
        setInboxPreview([]);
      }
      setIsLoading(false);
    };
    loadUser();
  }, [router]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-foreground">
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
      transition: {
        staggerChildren: 0.1,
      },
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

  return (
    <AppLayoutWrapper user={user}>
      <motion.div
        initial="hidden"
        animate="visible"
        variants={containerVariants}
        className="space-y-8"
      >
        {/* Welcome */}
        <motion.div variants={itemVariants}>
          <h1 className="text-4xl font-bold mb-2 text-foreground">
            Tableau de bord Administrateur
          </h1>
          <p className="text-muted-foreground">Gérez votre établissement efficacement</p>
        </motion.div>

        {/* KPI Cards */}
        <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {(
            [
              {
                icon: Users,
                label: 'Étudiants',
                value: kpi ? String(kpi.students) : '—',
                color: 'from-blue-500 to-blue-600',
              },
              {
                icon: Users,
                label: 'Enseignants',
                value: kpi ? String(kpi.teachers) : '—',
                color: 'from-purple-500 to-purple-600',
              },
              {
                icon: BookOpen,
                label: 'Cours',
                value: kpi ? String(kpi.courses) : '—',
                color: 'from-green-500 to-green-600',
              },
              {
                icon: HelpCircle,
                label: 'Requêtes (total)',
                value: kpi ? String(kpi.requests) : '—',
                color: 'from-orange-500 to-orange-600',
              },
            ] as const
          ).map((item, idx) => {
            const Icon = item.icon;
            return (
              <motion.div
                key={idx}
                whileHover={{ y: -10 }}
                className={`bg-gradient-to-br ${item.color} rounded-lg p-6 text-white shadow-lg`}
              >
                <Icon size={28} className="mb-3 opacity-80" />
                <p className="text-sm opacity-90 mb-1">{item.label}</p>
                <p className="text-3xl font-bold">{item.value}</p>
              </motion.div>
            );
          })}
        </motion.div>

        <motion.div variants={itemVariants}>
          <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
            <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Mail className="h-6 w-6 text-primary" />
              Messages directs récents
            </h2>
            <Link
              href="/admin/messaging"
              className="text-sm font-medium text-primary underline hover:no-underline"
            >
              Diffusions / messagerie admin
            </Link>
          </div>
          <div className="space-y-2">
            {inboxPreview.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Aucun message direct. Les annonces aux étudiants passent par la page Messagerie (diffusions).
              </p>
            ) : (
              inboxPreview.map((m) => (
                <Link
                  key={m.id}
                  href="/admin/messaging"
                  className={`block rounded-lg border border-border p-4 transition-colors hover:bg-muted ${
                    !m.read && !m.fromMe ? 'border-primary/40 bg-primary/5' : 'bg-card'
                  }`}
                >
                  <p className="text-xs text-muted-foreground">{m.date}</p>
                  <p className="font-semibold text-foreground mt-1">
                    {m.fromMe ? `À ${m.peerName}` : `De ${m.peerName}`}
                  </p>
                  <p className="text-sm text-foreground/90 mt-1 line-clamp-2">{m.title}</p>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{m.preview}</p>
                </Link>
              ))
            )}
          </div>
        </motion.div>

        {/* Admin Menu */}
        <motion.div variants={itemVariants}>
          <h2 className="text-2xl font-bold mb-4 text-foreground">Gestion</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {MENU_ADMIN.slice(1).map((item, idx) => (
              <motion.div key={idx} whileHover={{ scale: 1.02 }} className="min-h-[100px]">
                <Link
                  href={item.href}
                  className="flex h-full min-h-[100px] flex-col items-center justify-center gap-2 rounded-lg border border-border bg-card p-4 text-center text-card-foreground shadow-sm transition-colors hover:bg-muted"
                >
                  <span className="text-2xl" aria-hidden>
                    📋
                  </span>
                  <span className="text-sm font-semibold">{item.label}</span>
                </Link>
              </motion.div>
            ))}
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className="text-sm text-muted-foreground">
          Les indicateurs ci-dessus proviennent de la base (meta + statistiques). Pour le détail :{' '}
          <Link href="/admin/statistics" className="text-primary underline">
            Statistiques
          </Link>
          ,{' '}
          <Link href="/admin/requests" className="text-primary underline">
            Requêtes
          </Link>
          .
        </motion.div>
      </motion.div>
    </AppLayoutWrapper>
  );
}
