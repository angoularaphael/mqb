'use client';

import { AppLayoutWrapper } from '@/app/layout-wrapper';
import { getCurrentUserAction } from '@/app/actions/auth';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { canAccessStudentArea } from '@/lib/roles';
import { fetchApi } from '@/lib/fetch-api';

type GradesPayload = {
  courses: {
    name: string;
    grade: number;
    max: number;
    progress: number;
    feedback: string | null;
  }[];
  average: string;
};

export default function StudentEvaluation() {
  const router = useRouter();
  const [user, setUser] = useState<Record<string, unknown> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [payload, setPayload] = useState<GradesPayload | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      const currentUser = await getCurrentUserAction();
      if (!currentUser || !canAccessStudentArea(currentUser.role)) {
        router.push('/login');
        return;
      }
      setUser(currentUser);
      try {
        const d = await fetchApi<GradesPayload>('/api/student/grades');
        setPayload(d);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Erreur');
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [router]);

  if (isLoading) return null;
  if (!user) return null;

  const courses = payload?.courses ?? [];

  return (
    <AppLayoutWrapper user={user}>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
        <div>
          <h1 className="text-4xl font-bold mb-2">Mon Évaluation</h1>
          <p className="text-muted-foreground">Notes issues de la base (SQLite)</p>
        </div>

        {error && (
          <div className="p-3 rounded-lg border border-destructive/40 text-sm">{error}</div>
        )}

        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-muted border-b border-border">
              <tr>
                <th className="px-6 py-3 text-left font-semibold">Cours</th>
                <th className="px-6 py-3 text-left font-semibold">Note</th>
                <th className="px-6 py-3 text-left font-semibold">Progression</th>
              </tr>
            </thead>
            <tbody>
              {courses.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-6 py-8 text-center text-muted-foreground">
                    Aucune note enregistrée.
                  </td>
                </tr>
              ) : (
                courses.map((course, idx) => (
                  <motion.tr
                    key={`${course.name}-${idx}`}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="border-b border-border"
                  >
                    <td className="px-6 py-4 font-semibold">{course.name}</td>
                    <td className="px-6 py-4">
                      <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-semibold">
                        {course.grade}/{course.max}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="w-full bg-muted rounded-full h-2">
                        <motion.div
                          className="bg-gradient-to-r from-green-500 to-emerald-500 h-2 rounded-full"
                          initial={{ width: 0 }}
                          animate={{ width: `${course.progress}%` }}
                          transition={{ duration: 0.6, delay: idx * 0.05 }}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">{course.progress}%</p>
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-gradient-to-br from-blue-500 to-purple-600 text-white rounded-lg p-6"
        >
          <p className="text-sm opacity-90 mb-2">Moyenne générale</p>
          <p className="text-4xl font-bold">{payload?.average ?? '—'}</p>
        </motion.div>
      </motion.div>
    </AppLayoutWrapper>
  );
}
