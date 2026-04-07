'use client';

import { AppLayoutWrapper } from '@/app/layout-wrapper';
import { getCurrentUserAction } from '@/app/actions/auth';
import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { fetchApi } from '@/lib/fetch-api';
import { Trash2 } from 'lucide-react';

type Course = { id: string; code: string; name: string; group_id: string };
type Student = { id: string; firstName: string; lastName: string; email: string };
type Grade = {
  id: string;
  studentId: string;
  courseId: string;
  score: number;
  feedback: string | null;
};

export default function TeacherCoursesPage() {
  const router = useRouter();
  const [user, setUser] = useState<Record<string, unknown> | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [active, setActive] = useState<string | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [studentId, setStudentId] = useState('');
  const [score, setScore] = useState(10);
  const [feedback, setFeedback] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const loadCourse = useCallback(async (courseId: string) => {
    const [st, gr] = await Promise.all([
      fetchApi<{ students: Student[] }>(`/api/teacher/courses/${courseId}/students`),
      fetchApi<{ grades: Grade[] }>(`/api/teacher/courses/${courseId}/grades`),
    ]);
    setStudents(st.students);
    setGrades(gr.grades);
  }, []);

  useEffect(() => {
    (async () => {
      const currentUser = await getCurrentUserAction();
      if (!currentUser || currentUser.role !== 'teacher') {
        router.push('/login');
        return;
      }
      setUser(currentUser);
      try {
        const d = await fetchApi<{ courses: Course[] }>('/api/teacher/courses');
        setCourses(d.courses);
        if (d.courses[0]) {
          setActive(d.courses[0].id);
          await loadCourse(d.courses[0].id);
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Erreur');
      }
    })();
  }, [router, loadCourse]);

  useEffect(() => {
    if (!active) return;
    loadCourse(active).catch((e) => setError(e instanceof Error ? e.message : 'Erreur'));
  }, [active, loadCourse]);

  const addGrade = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!active || !studentId) return;
    setBusy(true);
    setError(null);
    try {
      await fetchApi(`/api/teacher/courses/${active}/grades`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId, courseId: active, score, feedback: feedback || undefined }),
      });
      setFeedback('');
      await loadCourse(active);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Échec');
    } finally {
      setBusy(false);
    }
  };

  const updateGrade = async (g: Grade, newScore: number) => {
    setBusy(true);
    setError(null);
    try {
      await fetchApi(`/api/teacher/grades/${g.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ score: newScore, feedback: g.feedback }),
      });
      if (active) await loadCourse(active);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Échec');
    } finally {
      setBusy(false);
    }
  };

  const deleteGrade = async (id: string) => {
    if (!confirm('Supprimer cette note ?')) return;
    setBusy(true);
    setError(null);
    try {
      await fetchApi(`/api/teacher/grades/${id}`, { method: 'DELETE' });
      if (active) await loadCourse(active);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Échec');
    } finally {
      setBusy(false);
    }
  };

  const studentLabel = (id: string) => {
    const s = students.find((x) => x.id === id);
    return s ? `${s.firstName} ${s.lastName}` : id.slice(0, 8);
  };

  if (!user) return null;

  return (
    <AppLayoutWrapper user={user}>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
        <div>
          <h1 className="text-4xl font-bold mb-2">Mes cours</h1>
          <p className="text-muted-foreground">Notes par cours (API enseignant)</p>
        </div>
        {error && <div className="p-3 rounded-lg border border-destructive/40 text-sm">{error}</div>}

        <div className="flex flex-wrap gap-2">
          {courses.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => {
                setActive(c.id);
                setStudentId('');
              }}
              className={`px-4 py-2 rounded-lg border text-sm font-medium ${
                active === c.id ? 'border-primary bg-primary/10' : 'border-border hover:bg-muted'
              }`}
            >
              {c.code}
            </button>
          ))}
        </div>

        {active && (
          <>
            <form
              onSubmit={addGrade}
              className="bg-card border border-border rounded-lg p-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4 items-end"
            >
              <div className="sm:col-span-2">
                <label className="block text-sm mb-1">Étudiant</label>
                <select
                  required
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value)}
                  className="w-full px-3 py-2 bg-muted border rounded-lg"
                >
                  <option value="">—</option>
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.firstName} {s.lastName}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm mb-1">Note /20</label>
                <input
                  type="number"
                  min={0}
                  max={20}
                  step={0.5}
                  value={score}
                  onChange={(e) => setScore(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-muted border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm mb-1">Commentaire</label>
                <input
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  className="w-full px-3 py-2 bg-muted border rounded-lg"
                />
              </div>
              <button
                type="submit"
                disabled={busy}
                className="px-6 py-2 bg-primary text-primary-foreground rounded-lg font-semibold"
              >
                Enregistrer / mettre à jour
              </button>
            </form>

            <div className="bg-card border border-border rounded-lg overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted border-b">
                  <tr>
                    <th className="px-4 py-3 text-left">Étudiant</th>
                    <th className="px-4 py-3 text-left">Note</th>
                    <th className="px-4 py-3 text-left">Commentaire</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {grades.map((g) => (
                    <tr key={g.id} className="border-b border-border">
                      <td className="px-4 py-3">{studentLabel(g.studentId)}</td>
                      <td className="px-4 py-3">
                        <input
                          type="number"
                          min={0}
                          max={20}
                          step={0.5}
                          defaultValue={g.score}
                          key={g.id + String(g.score)}
                          onBlur={(e) => {
                            const v = Number(e.target.value);
                            if (!Number.isNaN(v) && v !== g.score) updateGrade(g, v);
                          }}
                          className="w-20 px-2 py-1 bg-muted border rounded"
                        />
                      </td>
                      <td className="px-4 py-3 max-w-xs truncate">{g.feedback ?? '—'}</td>
                      <td className="px-4 py-3 text-right">
                        <button
                          type="button"
                          onClick={() => deleteGrade(g.id)}
                          className="p-2 text-destructive hover:bg-destructive/10 rounded"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </motion.div>
    </AppLayoutWrapper>
  );
}
