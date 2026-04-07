'use client';

import { AppLayoutWrapper } from '@/app/layout-wrapper';
import { getCurrentUserAction } from '@/app/actions/auth';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Download, FileText } from 'lucide-react';

const TYPES = [
  { type: 'users', label: 'Utilisateurs' },
  { type: 'groups', label: 'Groupes' },
  { type: 'rooms', label: 'Salles' },
  { type: 'courses', label: 'Cours' },
  { type: 'grades', label: 'Notes' },
] as const;

export default function AdminExportPage() {
  const router = useRouter();
  const [user, setUser] = useState<Record<string, unknown> | null>(null);

  useEffect(() => {
    (async () => {
      const currentUser = await getCurrentUserAction();
      if (!currentUser || currentUser.role !== 'admin') router.push('/login');
      else setUser(currentUser);
    })();
  }, [router]);

  if (!user) return null;

  return (
    <AppLayoutWrapper user={user}>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
        <div>
          <h1 className="text-4xl font-bold mb-2">Exportation</h1>
          <p className="text-muted-foreground">CSV ou PDF via /api/admin/export</p>
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          {TYPES.map(({ type, label }, idx) => (
            <motion.div
              key={type}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="bg-card border border-border rounded-lg p-6 flex flex-col gap-3"
            >
              <span className="font-semibold">{label}</span>
              <div className="flex flex-wrap gap-2">
                <a
                  href={`/api/admin/export?type=${type}&format=csv`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-muted hover:bg-muted/80 text-sm font-medium"
                >
                  <Download size={16} />
                  CSV
                </a>
                <a
                  href={`/api/admin/export?type=${type}&format=pdf`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium"
                >
                  <FileText size={16} />
                  PDF
                </a>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </AppLayoutWrapper>
  );
}
