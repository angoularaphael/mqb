'use client';

import { AppLayoutWrapper } from '@/app/layout-wrapper';
import { getCurrentUserAction } from '@/app/actions/auth';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { fetchApi } from '@/lib/fetch-api';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

type Stats = {
  users: number;
  groups: number;
  rooms: number;
  courses: number;
  grades: number;
  requests: number;
};

export default function AdminStatisticsPage() {
  const router = useRouter();
  const [user, setUser] = useState<Record<string, unknown> | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
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
        const d = await fetchApi<{ statistics: Stats }>('/api/admin/statistics');
        setStats(d.statistics);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Erreur');
      }
    })();
  }, [router]);

  if (!user) return null;

  const items = stats
    ? [
        { label: 'Utilisateurs', value: stats.users },
        { label: 'Groupes', value: stats.groups },
        { label: 'Salles', value: stats.rooms },
        { label: 'Cours', value: stats.courses },
        { label: 'Notes', value: stats.grades },
        { label: 'Requêtes', value: stats.requests },
      ]
    : [];

  return (
    <AppLayoutWrapper user={user}>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
        <div>
          <h1 className="text-4xl font-bold mb-2">Statistiques</h1>
          <p className="text-muted-foreground">Comptages en base (GET /api/admin/statistics)</p>
        </div>
        {error && <div className="p-3 rounded-lg border border-destructive/40 text-sm">{error}</div>}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((it, i) => (
            <motion.div
              key={it.label}
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.05 }}
              className="bg-card border border-border rounded-lg p-6"
            >
              <p className="text-muted-foreground text-sm">{it.label}</p>
              <p className="text-3xl font-bold mt-1">{it.value}</p>
            </motion.div>
          ))}
        </div>

        {stats && (
          <div className="bg-card border border-border rounded-lg p-6 h-[360px]">
            <h2 className="text-lg font-semibold mb-4">Vue graphique</h2>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={items} margin={{ top: 8, right: 8, left: 0, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} interval={0} angle={-25} textAnchor="end" height={70} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: 8,
                  }}
                />
                <Bar dataKey="value" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="Total" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </motion.div>
    </AppLayoutWrapper>
  );
}
