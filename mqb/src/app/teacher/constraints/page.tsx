'use client';

import { AppLayoutWrapper } from '@/app/layout-wrapper';
import { getCurrentUserAction } from '@/app/actions/auth';
import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { fetchApi } from '@/lib/fetch-api';
import { DAYS_OF_WEEK } from '@/lib/constants';

type ConstraintRow = {
  id: string;
  teacher_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_available: number | null;
};

export default function TeacherConstraintsPage() {
  const router = useRouter();
  const [user, setUser] = useState<Record<string, unknown> | null>(null);
  const [rows, setRows] = useState<ConstraintRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    dayOfWeek: 0,
    startTime: '09:00',
    endTime: '10:00',
    isAvailable: 1,
  });
  const [editing, setEditing] = useState<ConstraintRow | null>(null);

  const reload = useCallback(async () => {
    const d = await fetchApi<{ constraints: ConstraintRow[] }>('/api/teacher/constraints');
    setRows(d.constraints);
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
        await reload();
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Erreur');
      }
    })();
  }, [router, reload]);

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await fetchApi('/api/teacher/constraints', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
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
      await fetchApi(`/api/teacher/constraints/${editing.id}`, {
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
    if (!confirm('Supprimer ?')) return;
    setBusy(true);
    setError(null);
    try {
      await fetchApi(`/api/teacher/constraints/${id}`, { method: 'DELETE' });
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
          <h1 className="text-4xl font-bold mb-2">Mes contraintes</h1>
          <p className="text-muted-foreground">Disponibilités enregistrées pour le planning</p>
        </div>
        {error && <div className="p-3 rounded-lg border border-destructive/40 text-sm">{error}</div>}

        <form
          onSubmit={create}
          className="bg-card border border-border rounded-lg p-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5 items-end"
        >
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
            <label className="block text-sm mb-1">Disponible</label>
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
                <th className="px-4 py-3 text-left">Jour</th>
                <th className="px-4 py-3 text-left">Horaire</th>
                <th className="px-4 py-3 text-left">Dispo</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-b border-border">
                  <td className="px-4 py-3">{DAYS_OF_WEEK[r.day_of_week]}</td>
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
