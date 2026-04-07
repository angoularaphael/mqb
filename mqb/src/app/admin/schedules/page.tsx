'use client';

import { AppLayoutWrapper } from '@/app/layout-wrapper';
import { getCurrentUserAction } from '@/app/actions/auth';
import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { fetchApi } from '@/lib/fetch-api';
import { DAYS_OF_WEEK } from '@/lib/constants';

type ScheduleRow = {
  id: string;
  course_id: string;
  room_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  start_date: string;
  end_date: string;
};

type CourseOpt = { id: string; code: string; name: string };
type RoomOpt = { id: string; name: string };

export default function AdminSchedulesPage() {
  const router = useRouter();
  const [user, setUser] = useState<Record<string, unknown> | null>(null);
  const [rows, setRows] = useState<ScheduleRow[]>([]);
  const [courses, setCourses] = useState<CourseOpt[]>([]);
  const [rooms, setRooms] = useState<RoomOpt[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    courseId: '',
    roomId: '',
    dayOfWeek: 0,
    startTime: '09:00',
    endTime: '11:00',
    startDate: '2025-09-01',
    endDate: '2026-06-30',
  });
  const [editing, setEditing] = useState<ScheduleRow | null>(null);

  const reload = useCallback(async () => {
    const d = await fetchApi<{ schedules: ScheduleRow[] }>('/api/admin/schedules');
    setRows(d.schedules);
  }, []);

  useEffect(() => {
    (async () => {
      const currentUser = await getCurrentUserAction();
      if (!currentUser || currentUser.role !== 'admin') {
        router.push('/login');
        return;
      }
      setUser(currentUser);
      try {
        const meta = await fetchApi<{ courses: CourseOpt[]; rooms: RoomOpt[] }>('/api/admin/meta');
        setCourses(meta.courses);
        setRooms(meta.rooms);
        await reload();
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Erreur');
      }
    })();
  }, [router, reload]);

  const courseLabel = (id: string) => {
    const c = courses.find((x) => x.id === id);
    return c ? `${c.code} — ${c.name}` : id.slice(0, 8);
  };
  const roomLabel = (id: string) => rooms.find((r) => r.id === id)?.name ?? id.slice(0, 8);

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await fetchApi('/api/admin/schedules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courseId: form.courseId,
          roomId: form.roomId,
          dayOfWeek: form.dayOfWeek,
          startTime: form.startTime,
          endTime: form.endTime,
          startDate: form.startDate,
          endDate: form.endDate,
        }),
      });
      await reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Échec');
    } finally {
      setBusy(false);
    }
  };

  const saveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    setBusy(true);
    setError(null);
    try {
      await fetchApi(`/api/admin/schedules/${editing.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courseId: editing.course_id,
          roomId: editing.room_id,
          dayOfWeek: editing.day_of_week,
          startTime: editing.start_time,
          endTime: editing.end_time,
          startDate: editing.start_date,
          endDate: editing.end_date,
        }),
      });
      setEditing(null);
      await reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Échec');
    } finally {
      setBusy(false);
    }
  };

  const remove = async (id: string) => {
    if (!confirm('Supprimer ce créneau ?')) return;
    setBusy(true);
    setError(null);
    try {
      await fetchApi(`/api/admin/schedules/${id}`, { method: 'DELETE' });
      await reload();
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
          <h1 className="text-4xl font-bold mb-2">Planning & créneaux</h1>
          <p className="text-muted-foreground">Liaison cours / salle / horaires (API schedules)</p>
        </div>
        {error && <div className="p-3 rounded-lg border border-destructive/40 text-sm">{error}</div>}

        <form
          onSubmit={create}
          className="bg-card border border-border rounded-lg p-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8 items-end"
        >
          <div className="sm:col-span-2">
            <label className="block text-sm mb-1">Cours</label>
            <select
              required
              value={form.courseId}
              onChange={(e) => setForm((f) => ({ ...f, courseId: e.target.value }))}
              className="w-full px-3 py-2 bg-muted border rounded-lg"
            >
              <option value="">—</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.code} — {c.name}
                </option>
              ))}
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className="block text-sm mb-1">Salle</label>
            <select
              required
              value={form.roomId}
              onChange={(e) => setForm((f) => ({ ...f, roomId: e.target.value }))}
              className="w-full px-3 py-2 bg-muted border rounded-lg"
            >
              <option value="">—</option>
              {rooms.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm mb-1">Jour</label>
            <select
              value={form.dayOfWeek}
              onChange={(e) => setForm((f) => ({ ...f, dayOfWeek: Number(e.target.value) }))}
              className="w-full px-3 py-2 bg-muted border rounded-lg"
            >
              {DAYS_OF_WEEK.map((label, i) => (
                <option key={i} value={i}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm mb-1">Début</label>
            <input
              type="time"
              value={form.startTime}
              onChange={(e) => setForm((f) => ({ ...f, startTime: e.target.value }))}
              className="w-full px-3 py-2 bg-muted border rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm mb-1">Fin</label>
            <input
              type="time"
              value={form.endTime}
              onChange={(e) => setForm((f) => ({ ...f, endTime: e.target.value }))}
              className="w-full px-3 py-2 bg-muted border rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm mb-1">Début période</label>
            <input
              type="date"
              value={form.startDate}
              onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))}
              className="w-full px-3 py-2 bg-muted border rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm mb-1">Fin période</label>
            <input
              type="date"
              value={form.endDate}
              onChange={(e) => setForm((f) => ({ ...f, endDate: e.target.value }))}
              className="w-full px-3 py-2 bg-muted border rounded-lg"
            />
          </div>
          <button
            type="submit"
            disabled={busy}
            className="flex items-center gap-2 px-6 py-2 bg-primary text-primary-foreground rounded-lg font-semibold xl:col-span-8 w-fit"
          >
            <Plus size={18} /> Ajouter
          </button>
        </form>

        {editing && (
          <form onSubmit={saveEdit} className="bg-card border border-primary/40 rounded-lg p-6 space-y-4">
            <h2 className="font-bold">Modifier le créneau</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-sm mb-1">Cours</label>
                <select
                  value={editing.course_id}
                  onChange={(e) => setEditing({ ...editing, course_id: e.target.value })}
                  className="w-full px-3 py-2 bg-muted border rounded-lg"
                >
                  {courses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.code} — {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm mb-1">Salle</label>
                <select
                  value={editing.room_id}
                  onChange={(e) => setEditing({ ...editing, room_id: e.target.value })}
                  className="w-full px-3 py-2 bg-muted border rounded-lg"
                >
                  {rooms.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm mb-1">Jour</label>
                <select
                  value={editing.day_of_week}
                  onChange={(e) =>
                    setEditing({ ...editing, day_of_week: Number(e.target.value) })
                  }
                  className="w-full px-3 py-2 bg-muted border rounded-lg"
                >
                  {DAYS_OF_WEEK.map((label, i) => (
                    <option key={i} value={i}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm mb-1">Début</label>
                <input
                  type="time"
                  value={editing.start_time}
                  onChange={(e) => setEditing({ ...editing, start_time: e.target.value })}
                  className="w-full px-3 py-2 bg-muted border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm mb-1">Fin</label>
                <input
                  type="time"
                  value={editing.end_time}
                  onChange={(e) => setEditing({ ...editing, end_time: e.target.value })}
                  className="w-full px-3 py-2 bg-muted border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm mb-1">Début période</label>
                <input
                  type="date"
                  value={editing.start_date}
                  onChange={(e) => setEditing({ ...editing, start_date: e.target.value })}
                  className="w-full px-3 py-2 bg-muted border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm mb-1">Fin période</label>
                <input
                  type="date"
                  value={editing.end_date}
                  onChange={(e) => setEditing({ ...editing, end_date: e.target.value })}
                  className="w-full px-3 py-2 bg-muted border rounded-lg"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <button type="submit" className="px-4 py-2 bg-primary text-primary-foreground rounded-lg">
                Enregistrer
              </button>
              <button type="button" onClick={() => setEditing(null)} className="px-4 py-2 border rounded-lg">
                Annuler
              </button>
            </div>
          </form>
        )}

        <div className="bg-card border border-border rounded-lg overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted border-b">
              <tr>
                <th className="px-4 py-3 text-left">Jour</th>
                <th className="px-4 py-3 text-left">Horaire</th>
                <th className="px-4 py-3 text-left">Cours</th>
                <th className="px-4 py-3 text-left">Salle</th>
                <th className="px-4 py-3 text-left">Période</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-b border-border">
                  <td className="px-4 py-3">{DAYS_OF_WEEK[r.day_of_week] ?? r.day_of_week}</td>
                  <td className="px-4 py-3">
                    {r.start_time} – {r.end_time}
                  </td>
                  <td className="px-4 py-3">{courseLabel(r.course_id)}</td>
                  <td className="px-4 py-3">{roomLabel(r.room_id)}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {r.start_date} → {r.end_date}
                  </td>
                  <td className="px-4 py-3 text-right space-x-2">
                    <button
                      type="button"
                      onClick={() => setEditing({ ...r })}
                      className="inline-flex p-2 rounded hover:bg-muted"
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={() => remove(r.id)}
                      className="inline-flex p-2 rounded hover:bg-destructive/10 text-destructive"
                    >
                      <Trash2 size={16} />
                    </button>
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
