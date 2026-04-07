'use client';

import { AppLayoutWrapper } from '@/app/layout-wrapper';
import { getCurrentUserAction } from '@/app/actions/auth';
import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { fetchApi } from '@/lib/fetch-api';
import { ATTENDANCE_STATUS_LABELS } from '@/lib/constants';

type Sch = {
  id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  courseCode: string | null;
  courseName: string | null;
};

type Student = { id: string; firstName: string; lastName: string; email: string };
type AttRow = {
  id: string;
  studentId: string;
  scheduleId: string;
  status: string;
};

export default function TeacherAttendance() {
  const router = useRouter();
  const [user, setUser] = useState<Record<string, unknown> | null>(null);
  const [schedules, setSchedules] = useState<Sch[]>([]);
  const [scheduleId, setScheduleId] = useState('');
  const [students, setStudents] = useState<Student[]>([]);
  const [attendance, setAttendance] = useState<AttRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [emargement, setEmargement] = useState<{
    session: { id: string; status: string; createdAt: number | null } | null;
    signedCount: number;
    total: number;
  } | null>(null);

  const loadEmargement = useCallback(async (sid: string) => {
    const d = await fetchApi<{
      session: { id: string; status: string; createdAt: number | null } | null;
      signedCount: number;
      total: number;
    }>(`/api/teacher/emargement?scheduleId=${encodeURIComponent(sid)}`);
    setEmargement(d);
  }, []);

  const loadSlot = useCallback(async (sid: string) => {
    const d = await fetchApi<{ students: Student[]; attendance: AttRow[] }>(
      `/api/teacher/attendance/${sid}`,
    );
    setStudents(d.students);
    setAttendance(d.attendance);
    await loadEmargement(sid);
  }, [loadEmargement]);

  useEffect(() => {
    (async () => {
      const currentUser = await getCurrentUserAction();
      if (!currentUser || currentUser.role !== 'teacher') {
        router.push('/login');
        return;
      }
      setUser(currentUser);
      try {
        const d = await fetchApi<{ schedules: Sch[] }>('/api/teacher/schedules');
        setSchedules(d.schedules);
        if (d.schedules[0]) {
          setScheduleId(d.schedules[0].id);
          await loadSlot(d.schedules[0].id);
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Erreur');
      }
    })();
  }, [router, loadSlot]);

  useEffect(() => {
    if (!scheduleId) return;
    loadSlot(scheduleId).catch((e) => setError(e instanceof Error ? e.message : 'Erreur'));
  }, [scheduleId, loadSlot]);

  const statusFor = (studentId: string) =>
    attendance.find((a) => a.studentId === studentId)?.status ?? '';

  const openEmargement = async () => {
    if (!scheduleId) return;
    setBusy(true);
    setError(null);
    try {
      await fetchApi('/api/teacher/emargement', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'open', scheduleId }),
      });
      await loadEmargement(scheduleId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Échec');
    } finally {
      setBusy(false);
    }
  };

  const closeEmargement = async () => {
    if (!emargement?.session?.id) return;
    setBusy(true);
    setError(null);
    try {
      await fetchApi('/api/teacher/emargement', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'close', sessionId: emargement.session.id }),
      });
      await loadEmargement(scheduleId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Échec');
    } finally {
      setBusy(false);
    }
  };

  const mark = async (studentId: string, status: string) => {
    if (!scheduleId) return;
    setBusy(true);
    setError(null);
    try {
      await fetchApi('/api/teacher/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId, scheduleId, status }),
      });
      await loadSlot(scheduleId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Échec');
    } finally {
      setBusy(false);
    }
  };

  if (!user) return null;

  return (
    <AppLayoutWrapper user={user}>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
        <div>
          <h1 className="text-4xl font-bold mb-2">Appel & émargement</h1>
          <p className="text-muted-foreground">Par créneau (cours du groupe)</p>
        </div>
        {error && <div className="p-3 rounded-lg border border-destructive/40 text-sm">{error}</div>}

        <div className="max-w-xl">
          <label className="block text-sm mb-1">Créneau</label>
          <select
            value={scheduleId}
            onChange={(e) => setScheduleId(e.target.value)}
            className="w-full px-3 py-2 bg-muted border rounded-lg"
          >
            {schedules.map((s) => (
              <option key={s.id} value={s.id}>
                {s.courseCode} {s.start_time}-{s.end_time} (jour {s.day_of_week})
              </option>
            ))}
          </select>
        </div>

        <div className="bg-card border border-border rounded-lg p-4 space-y-3">
          <h2 className="font-semibold">Émargement numérique</h2>
          <p className="text-sm text-muted-foreground">
            Après l’appel, lancez la session : les étudiants signent depuis leur espace. Fermez la session quand
            tout le monde a signé (ou manuellement).
          </p>
          {emargement && (
            <div className="flex flex-wrap items-center gap-3 text-sm">
              <span>
                Statut :{' '}
                {emargement.session ? (
                  <strong className="text-primary">ouvert — signatures {emargement.signedCount}/{emargement.total}</strong>
                ) : (
                  <span>aucune session ouverte</span>
                )}
              </span>
              {!emargement.session ? (
                <button
                  type="button"
                  disabled={busy || !scheduleId}
                  onClick={openEmargement}
                  className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium disabled:opacity-50"
                >
                  Lancer l’émargement
                </button>
              ) : (
                <button
                  type="button"
                  disabled={busy}
                  onClick={closeEmargement}
                  className="px-3 py-1.5 rounded-lg border border-border text-sm font-medium disabled:opacity-50"
                >
                  Clôturer la session
                </button>
              )}
            </div>
          )}
        </div>

        <div className="bg-card border border-border rounded-lg overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted border-b">
              <tr>
                <th className="px-4 py-3 text-left">Étudiant</th>
                <th className="px-4 py-3 text-left">Statut actuel</th>
                <th className="px-4 py-3 text-right">Marquer</th>
              </tr>
            </thead>
            <tbody>
              {students.map((s) => (
                <tr key={s.id} className="border-b border-border">
                  <td className="px-4 py-3">
                    {s.firstName} {s.lastName}
                  </td>
                  <td className="px-4 py-3">
                    {statusFor(s.id)
                      ? ATTENDANCE_STATUS_LABELS[statusFor(s.id)] ?? statusFor(s.id)
                      : '—'}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex flex-wrap justify-end gap-1">
                      {(['present', 'absent', 'late', 'justified'] as const).map((st) => (
                        <button
                          key={st}
                          type="button"
                          disabled={busy}
                          onClick={() => mark(s.id, st)}
                          className="px-2 py-1 text-xs rounded border border-border hover:bg-muted"
                        >
                          {ATTENDANCE_STATUS_LABELS[st]}
                        </button>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </AppLayoutWrapper>
  );
}
