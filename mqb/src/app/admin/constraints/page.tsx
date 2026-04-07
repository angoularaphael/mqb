'use client';

import { AppLayoutWrapper } from '@/app/layout-wrapper';
import { getCurrentUserAction } from '@/app/actions/auth';
import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { fetchApi } from '@/lib/fetch-api';
import { DAYS_OF_WEEK } from '@/lib/constants';

type Teacher = { id: string; email: string; firstName: string; lastName: string };

type ConstraintRow = {
  id: string;
  teacher_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_available: number | null;
};

export default function AdminConstraintsPage() {
  const router = useRouter();
  const [user, setUser] = useState<Record<string, unknown> | null>(null);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [rows, setRows] = useState<ConstraintRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    teacherId: '',
    dayOfWeek: 0,
    startTime: '09:00',
    endTime: '10:00',
    isAvailable: 1,
  });
  const [editing, setEditing] = useState<ConstraintRow | null>(null);

  const reload = useCallback(async () => {
    const d = await fetchApi<{ constraints: ConstraintRow[] }>('/api/admin/constraints');
    setRows(d.constraints);
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
        const meta = await fetchApi<{ teachers: Teacher[] }>('/api/admin/meta');
        setTeachers(meta.teachers);
        await reload();
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Erreur');
      }
    })();
  }, [router, reload]);

  const teacherLabel = (id: string) => {
    const t = teachers.find((x) => x.id === id);
    return t ? `${t.firstName} ${t.lastName}` : id;
  };

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.teacherId) {
      setError('Choisissez un enseignant');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await fetchApi('/api/admin/constraints', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      setForm((f) => ({ ...f, dayOfWeek: 0, startTime: '09:00', endTime: '10:00' }));
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
      await fetchApi(`/api/admin/constraints/${editing.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dayOfWeek: editing.day_of_week,
          startTime: editing.start_time,
          endTime: editing.end_time,
          isAvailable: editing.is_available ?? 1,
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
    if (!confirm('Supprimer cette contrainte ?')) return;
    setBusy(true);
    setError(null);
    try {
      await fetchApi(`/api/admin/constraints/${id}`, { method: 'DELETE' });
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
          <h1 className="text-4xl font-bold mb-2">Contraintes enseignants</h1>
          <p className="text-muted-foreground">Créneaux de disponibilité par enseignant</p>
        </div>
        {error && <div className="p-3 rounded-lg border border-destructive/40 text-sm">{error}</div>}

        <form
          onSubmit={create}
          className="bg-card border border-border rounded-lg p-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-6 items-end"
        >
          <div className="sm:col-span-2">
            <label className="block text-sm mb-1">Enseignant</label>
            <select
              required
              value={form.teacherId}
              onChange={(e) => setForm((f) => ({ ...f, teacherId: e.target.value }))}
              className="w-full px-3 py-2 bg-muted border rounded-lg"
            >
              <option value="">—</option>
              {teachers.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.firstName} {t.lastName}
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
            <label className="block text-sm mb-1">Dispo</label>
            <select
              value={form.isAvailable}
              onChange={(e) => setForm((f) => ({ ...f, isAvailable: Number(e.target.value) }))}
              className="w-full px-3 py-2 bg-muted border rounded-lg"
            >
              <option value={1}>Oui</option>
              <option value={0}>Non</option>
            </select>
          </div>
          <button
            type="submit"
            disabled={busy}
            className="flex items-center justify-center gap-2 px-6 py-2 bg-primary text-primary-foreground rounded-lg font-semibold"
          >
            <Plus size={18} /> Ajouter
          </button>
        </form>

        {editing && (
          <form onSubmit={saveEdit} className="bg-card border border-primary/40 rounded-lg p-6 space-y-4">
            <h2 className="font-bold">Modifier</h2>
            <div className="grid sm:grid-cols-4 gap-4">
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
                <label className="block text-sm mb-1">Dispo</label>
                <select
                  value={editing.is_available ?? 1}
                  onChange={(e) =>
                    setEditing({ ...editing, is_available: Number(e.target.value) })
                  }
                  className="w-full px-3 py-2 bg-muted border rounded-lg"
                >
                  <option value={1}>Oui</option>
                  <option value={0}>Non</option>
                </select>
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
                <th className="px-4 py-3 text-left">Enseignant</th>
                <th className="px-4 py-3 text-left">Jour</th>
                <th className="px-4 py-3 text-left">Horaire</th>
                <th className="px-4 py-3 text-left">Dispo</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-b border-border">
                  <td className="px-4 py-3">{teacherLabel(r.teacher_id)}</td>
                  <td className="px-4 py-3">{DAYS_OF_WEEK[r.day_of_week] ?? r.day_of_week}</td>
                  <td className="px-4 py-3">
                    {r.start_time} – {r.end_time}
                  </td>
                  <td className="px-4 py-3">{r.is_available ? 'Oui' : 'Non'}</td>
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
