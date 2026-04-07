'use client';

import { AppLayoutWrapper } from '@/app/layout-wrapper';
import { getCurrentUserAction } from '@/app/actions/auth';
import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { fetchApi } from '@/lib/fetch-api';
import { ROOM_TYPE_LABELS } from '@/lib/constants';

type RoomRow = { id: string; name: string; capacity: number; type: string | null };

export default function AdminRooms() {
  const router = useRouter();
  const [user, setUser] = useState<Record<string, unknown> | null>(null);
  const [rows, setRows] = useState<RoomRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    name: '',
    capacity: 30,
    type: 'classroom' as 'classroom' | 'lab' | 'auditorium',
  });
  const [editing, setEditing] = useState<RoomRow | null>(null);
  const [busy, setBusy] = useState(false);

  const reload = useCallback(async () => {
    const d = await fetchApi<{ rooms: RoomRow[] }>('/api/admin/rooms');
    setRows(d.rooms);
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
        await reload();
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Erreur');
      } finally {
        setLoading(false);
      }
    })();
  }, [router, reload]);

  const submitCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await fetchApi('/api/admin/rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      setForm({ name: '', capacity: 30, type: 'classroom' });
      await reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Échec');
    } finally {
      setBusy(false);
    }
  };

  const submitEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    setBusy(true);
    setError(null);
    try {
      await fetchApi(`/api/admin/rooms/${editing.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editing.name,
          capacity: editing.capacity,
          type: editing.type as 'classroom' | 'lab' | 'auditorium',
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
    if (!confirm('Supprimer cette salle ?')) return;
    setBusy(true);
    setError(null);
    try {
      await fetchApi(`/api/admin/rooms/${id}`, { method: 'DELETE' });
      await reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Échec');
    } finally {
      setBusy(false);
    }
  };

  if (loading || !user) return null;

  return (
    <AppLayoutWrapper user={user}>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
        <div>
          <h1 className="text-4xl font-bold mb-2">Gestion des salles</h1>
          <p className="text-muted-foreground">API /api/admin/rooms</p>
        </div>

        {error && <div className="p-3 rounded-lg border border-destructive/40 text-sm">{error}</div>}

        <form
          onSubmit={submitCreate}
          className="bg-card border border-border rounded-lg p-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4 items-end"
        >
          <div>
            <label className="block text-sm font-medium mb-1">Nom</label>
            <input
              required
              minLength={3}
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              className="w-full px-3 py-2 bg-muted border border-border rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Capacité</label>
            <input
              type="number"
              min={1}
              value={form.capacity}
              onChange={(e) => setForm((f) => ({ ...f, capacity: Number(e.target.value) }))}
              className="w-full px-3 py-2 bg-muted border border-border rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Type</label>
            <select
              value={form.type}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  type: e.target.value as 'classroom' | 'lab' | 'auditorium',
                }))
              }
              className="w-full px-3 py-2 bg-muted border border-border rounded-lg"
            >
              {Object.entries(ROOM_TYPE_LABELS).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </select>
          </div>
          <button
            type="submit"
            disabled={busy}
            className="flex items-center justify-center gap-2 px-6 py-2 bg-primary text-primary-foreground rounded-lg font-semibold disabled:opacity-50"
          >
            <Plus size={18} />
            Ajouter
          </button>
        </form>

        {editing && (
          <form onSubmit={submitEdit} className="bg-card border border-primary/40 rounded-lg p-6 space-y-4">
            <h2 className="font-bold">Modifier la salle</h2>
            <div className="grid sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm mb-1">Nom</label>
                <input
                  required
                  value={editing.name}
                  onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                  className="w-full px-3 py-2 bg-muted border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm mb-1">Capacité</label>
                <input
                  type="number"
                  min={1}
                  value={editing.capacity}
                  onChange={(e) =>
                    setEditing({ ...editing, capacity: Number(e.target.value) })
                  }
                  className="w-full px-3 py-2 bg-muted border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm mb-1">Type</label>
                <select
                  value={editing.type ?? 'classroom'}
                  onChange={(e) => setEditing({ ...editing, type: e.target.value })}
                  className="w-full px-3 py-2 bg-muted border rounded-lg"
                >
                  {Object.entries(ROOM_TYPE_LABELS).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex gap-2">
              <button type="submit" disabled={busy} className="px-4 py-2 bg-primary text-primary-foreground rounded-lg">
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
                <th className="px-4 py-3 text-left">Nom</th>
                <th className="px-4 py-3 text-left">Capacité</th>
                <th className="px-4 py-3 text-left">Type</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-b border-border">
                  <td className="px-4 py-3 font-medium">{r.name}</td>
                  <td className="px-4 py-3">{r.capacity}</td>
                  <td className="px-4 py-3">
                    {ROOM_TYPE_LABELS[r.type ?? 'classroom'] ?? r.type}
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
