'use client';

import { AppLayoutWrapper } from '@/app/layout-wrapper';
import { getCurrentUserAction } from '@/app/actions/auth';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { CheckCircle, AlertCircle } from 'lucide-react';
import { canAccessStudentArea } from '@/lib/roles';
import { fetchApi } from '@/lib/fetch-api';

type AttendancePayload = {
  records: { date: string; course: string; status: string; time: string }[];
};

type EmSession = {
  sessionId: string;
  scheduleId: string;
  createdAt: number | null;
  courseCode: string | null;
  courseName: string | null;
  signed: boolean;
};

export default function StudentAttendance() {
  const router = useRouter();
  const [user, setUser] = useState<Record<string, unknown> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [records, setRecords] = useState<AttendancePayload['records']>([]);
  const [emSessions, setEmSessions] = useState<EmSession[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [signing, setSigning] = useState<string | null>(null);

  const reloadEm = async () => {
    const d = await fetchApi<{ sessions: EmSession[] }>('/api/student/emargement');
    setEmSessions(d.sessions);
  };

  useEffect(() => {
    const load = async () => {
      const currentUser = await getCurrentUserAction();
      if (!currentUser || !canAccessStudentArea(currentUser.role)) {
        router.push('/login');
        return;
      }
      setUser(currentUser);
      try {
        const [d, em] = await Promise.all([
          fetchApi<AttendancePayload>('/api/student/attendance'),
          fetchApi<{ sessions: EmSession[] }>('/api/student/emargement'),
        ]);
        setRecords(d.records);
        setEmSessions(em.sessions);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Erreur');
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [router]);

  const sign = async (sessionId: string) => {
    setSigning(sessionId);
    setError(null);
    try {
      await fetchApi('/api/student/emargement', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId }),
      });
      await reloadEm();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Signature impossible');
    } finally {
      setSigning(null);
    }
  };

  if (isLoading) return null;
  if (!user) return null;

  return (
    <AppLayoutWrapper user={user}>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
        <div>
          <h1 className="text-4xl font-bold mb-2">Émargement</h1>
          <p className="text-muted-foreground">
            Historique depuis la base. La présence est enregistrée par l’enseignant sur les séances.
          </p>
        </div>

        {error && (
          <div className="p-3 rounded-lg border border-destructive/40 text-sm">{error}</div>
        )}

        <div className="bg-card border border-border rounded-lg p-6">
          <h2 className="text-xl font-bold mb-4">Signer l’émargement</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Quand votre enseignant a lancé une session pour un créneau, signez ici.
          </p>
          {emSessions.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aucune session d’émargement ouverte.</p>
          ) : (
            <ul className="space-y-3">
              {emSessions.map((s) => (
                <li
                  key={s.sessionId}
                  className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-lg border border-border bg-muted/40"
                >
                  <div>
                    <p className="font-medium">
                      {s.courseCode} {s.courseName}
                    </p>
                    <p className="text-xs font-mono text-muted-foreground">Session {s.sessionId}</p>
                  </div>
                  {s.signed ? (
                    <span className="text-sm text-green-600 dark:text-green-400 font-medium">Signé</span>
                  ) : (
                    <button
                      type="button"
                      disabled={signing === s.sessionId}
                      onClick={() => sign(s.sessionId)}
                      className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-50"
                    >
                      {signing === s.sessionId ? '…' : 'Signer'}
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="bg-card border border-border rounded-lg p-6">
          <h2 className="text-xl font-bold mb-4">Historique</h2>
          <div className="space-y-3">
            {records.length === 0 ? (
              <p className="text-muted-foreground text-sm">Aucun enregistrement de présence.</p>
            ) : (
              records.map((record, idx) => (
                <motion.div
                  key={`${record.date}-${record.course}-${idx}`}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="p-4 bg-muted rounded-lg flex items-center justify-between"
                >
                  <div>
                    <p className="font-semibold text-foreground">{record.date}</p>
                    <p className="text-sm text-muted-foreground">{record.course}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {record.status === 'present' ? (
                      <>
                        <CheckCircle size={20} className="text-green-500" />
                        <span className="text-sm font-semibold text-green-600">{record.time}</span>
                      </>
                    ) : (
                      <>
                        <AlertCircle size={20} className="text-red-500" />
                        <span className="text-sm font-semibold text-red-600 capitalize">{record.status}</span>
                      </>
                    )}
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </div>
      </motion.div>
    </AppLayoutWrapper>
  );
}
