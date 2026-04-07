'use client';

import { AppLayoutWrapper } from '@/app/layout-wrapper';
import { getCurrentUserAction } from '@/app/actions/auth';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { Mail, Users } from 'lucide-react';
import { fetchApi } from '@/lib/fetch-api';

type Teacher = { id: string; email: string; firstName: string; lastName: string };

export default function AdminTeachersPage() {
  const router = useRouter();
  const [user, setUser] = useState<Record<string, unknown> | null>(null);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const currentUser = await getCurrentUserAction();
      if (!currentUser || currentUser.role !== 'admin') {
        router.push('/login');
        return;
      }
      setUser(currentUser);
      try {
        const d = await fetchApi<{ teachers: Teacher[] }>('/api/admin/meta');
        setTeachers(d.teachers);
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
          <h1 className="text-4xl font-bold mb-2">Enseignants</h1>
          <p className="text-muted-foreground">
            Liste issue de la base. Gestion des comptes :{' '}
            <Link href="/admin/users" className="text-primary underline">
              Utilisateurs
            </Link>
            .
          </p>
        </div>

        {error && <div className="p-3 rounded-lg border border-destructive/40 text-sm">{error}</div>}

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {teachers.map((t, idx) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.04 }}
            >
              <Link
                href={`mailto:${encodeURIComponent(t.email)}`}
                className="block h-full bg-card border border-border rounded-lg p-6 hover:border-primary/50 hover:bg-muted/30 transition-colors"
              >
                <Users className="text-primary mb-3" size={28} />
                <p className="font-semibold text-lg">
                  {t.firstName} {t.lastName}
                </p>
                <p className="text-sm text-muted-foreground flex items-center gap-2 mt-2">
                  <Mail size={14} />
                  {t.email}
                </p>
              </Link>
            </motion.div>
          ))}
        </div>

        {teachers.length === 0 && !error && (
          <p className="text-muted-foreground text-sm">Aucun enseignant en base.</p>
        )}
      </motion.div>
    </AppLayoutWrapper>
  );
}
