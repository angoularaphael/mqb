'use client';

import { AppLayoutWrapper } from '@/app/layout-wrapper';
import { getCurrentUserAction } from '@/app/actions/auth';
import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { fetchApi } from '@/lib/fetch-api';

type GroupRow = {
  id: string;
  name: string;
  description: string | null;
  capacity: number;
  memberCount?: number;
};

export default function AdminGroups() {
  const router = useRouter();
  const [user, setUser] = useState<Record<string, unknown> | null>(null);
  const [rows, setRows] = useState<GroupRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ name: '', description: '', capacity: 30 });
  const [editing, setEditing] = useState<GroupRow | null>(null);
  const [busy, setBusy] = useState(false);

  const reload = useCallback(async () => {
    const d = await fetchApi<{ groups: GroupRow[] }>('/api/admin/groups');
    setRows(d.groups);
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
      await fetchApi('/api/admin/groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          description: form.description || undefined,
          capacity: form.capacity,
        }),
      });
      setForm({ name: '', description: '', capacity: 30 });
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
      await fetchApi(`/api/admin/groups/${editing.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editing.name,
          description: editing.description,
          capacity: editing.capacity,
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
    if (!confirm('Supprimer ce groupe ?')) return;
    setBusy(true);
    setError(null);
    try {
      await fetchApi(`/api/admin/groups/${id}`, { method: 'DELETE' });
      await reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Échec');
    } finally {
      setBusy(false);
    }
  };

  const exportCsv = () => {
    window.open('/api/admin/export?type=groups', '_blank');
  };

  if (loading || !user) return null;

  return (
    <AppLayoutWrapper user={user}>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
        <div className="flex flex-wrap justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold mb-2">Gestion des groupes</h1>
            <p className="text-muted-foreground">CRUD sur la base (SQLite)</p>
          </div>
          <button
            type="button"
            onClick={exportCsv}
            className="px-4 py-2 border border-border rounded-lg font-semibold hover:bg-muted"
          >
            Exporter CSV
          </button>
        </div>

        {error && <div className="p-3 rounded-lg border border-destructive/40 text-sm">{error}</div>}

        <form
          onSubmit={submitCreate}
          className="bg-card border border-border rounded-lg p-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4 items-end"
        >
          <div className="sm:col-span-2">
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
          <div className="sm:col-span-2 lg:col-span-4">
            <label className="block text-sm font-medium mb-1">Description</label>
            <input
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              className="w-full px-3 py-2 bg-muted border border-border rounded-lg"
            />
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
          <form
            onSubmit={submitEdit}
            className="bg-card border border-primary/40 rounded-lg p-6 space-y-4"
          >
            <h2 className="font-bold">Modifier le groupe</h2>
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
              <div className="sm:col-span-3">
                <label className="block text-sm mb-1">Description</label>
                <input
                  value={editing.description ?? ''}
                  onChange={(e) => setEditing({ ...editing, description: e.target.value })}
                  className="w-full px-3 py-2 bg-muted border rounded-lg"
                />
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
                <th className="px-4 py-3 text-left">Membres</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">
                    Aucun groupe
                  </td>
                </tr>
              ) : (
                rows.map((g) => (
                  <tr key={g.id} className="border-b border-border">
                    <td className="px-4 py-3 font-medium">{g.name}</td>
                    <td className="px-4 py-3">{g.capacity}</td>
                    <td className="px-4 py-3">{g.memberCount ?? '—'}</td>
                    <td className="px-4 py-3 text-right space-x-2">
                      <button
                        type="button"
                        onClick={() => setEditing({ ...g })}
                        className="inline-flex p-2 rounded hover:bg-muted"
                        aria-label="Modifier"
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        type="button"
                        onClick={() => remove(g.id)}
                        className="inline-flex p-2 rounded hover:bg-destructive/10 text-destructive"
                        aria-label="Supprimer"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </motion.div>
    </AppLayoutWrapper>
  );
}
