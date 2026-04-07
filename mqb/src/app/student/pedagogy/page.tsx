'use client';

import { AppLayoutWrapper } from '@/app/layout-wrapper';
import { getCurrentUserAction } from '@/app/actions/auth';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { canAccessStudentArea } from '@/lib/roles';
import { fetchApi } from '@/lib/fetch-api';

type CourseGrade = {
  name: string;
  grade: number;
  max: number;
  progress: number;
  feedback: string | null;
};

export default function StudentPedagogyPage() {
  const router = useRouter();
  const [user, setUser] = useState<Record<string, unknown> | null>(null);
  const [courses, setCourses] = useState<CourseGrade[]>([]);
  const [average, setAverage] = useState('');
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
        const d = await fetchApi<{ courses: CourseGrade[]; average: string }>('/api/student/grades');
        setCourses(d.courses);
        setAverage(d.average);
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
          <h1 className="text-4xl font-bold mb-2">Pédagogie</h1>
          <p className="text-muted-foreground">Notes par cours — moyenne : {average}</p>
        </div>
        {error && <div className="p-3 rounded-lg border border-destructive/40 text-sm">{error}</div>}

        <div className="space-y-4">
          {courses.length === 0 ? (
            <p className="text-muted-foreground text-sm">Aucune note enregistrée.</p>
          ) : (
            courses.map((c, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="bg-card border border-border rounded-lg p-4"
              >
                <div className="flex justify-between items-start gap-4">
                  <div>
                    <p className="font-semibold">{c.name}</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {c.grade}/{c.max} — barème {c.progress}%
                    </p>
                    {c.feedback && (
                      <p className="text-sm mt-2 whitespace-pre-wrap">{c.feedback}</p>
                    )}
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </motion.div>
    </AppLayoutWrapper>
  );
}
