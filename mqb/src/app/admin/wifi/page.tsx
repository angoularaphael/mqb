'use client';

import { AppLayoutWrapper } from '@/app/layout-wrapper';
import { getCurrentUserAction } from '@/app/actions/auth';
import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { fetchApi } from '@/lib/fetch-api';

type WifiRow = {
  id: string;
  code: string;
  network_name: string | null;
  expires_at: number;
  is_active: number | null;
  created_at: number | null;
};

function toDatetimeLocalValue(unixSec: number) {
  const d = new Date(unixSec * 1000);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function fromDatetimeLocalValue(s: string) {
  return Math.floor(new Date(s).getTime() / 1000);
}

export default function AdminWifiPage() {
  const router = useRouter();
  const [user, setUser] = useState<Record<string, unknown> | null>(null);
  const [rows, setRows] = useState<WifiRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    code: '',
    networkName: 'MQB-Guest',
    expiresLocal: toDatetimeLocalValue(Math.floor(Date.now() / 1000) + 7 * 24 * 3600),
    isActive: true,
  });
  const [editing, setEditing] = useState<WifiRow | null>(null);
  const [editExpiresLocal, setEditExpiresLocal] = useState('');

  const reload = useCallback(async () => {
    const d = await fetchApi<{ codes: WifiRow[] }>('/api/admin/wifi');
    setRows(d.codes);
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
      }
    })();
  }, [router, reload]);

  const openEdit = (r: WifiRow) => {
    setEditing(r);
    setEditExpiresLocal(toDatetimeLocalValue(r.expires_at));
  };

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await fetchApi('/api/admin/wifi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: form.code,
          networkName: form.networkName || undefined,
          expiresAt: fromDatetimeLocalValue(form.expiresLocal),
          isActive: form.isActive ? 1 : 0,
        }),
      });
      setForm((f) => ({
        ...f,
        code: '',
        expiresLocal: toDatetimeLocalValue(Math.floor(Date.now() / 1000) + 7 * 24 * 3600),
      }));
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
      await fetchApi(`/api/admin/wifi/${editing.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: editing.code,
          networkName: editing.network_name ?? undefined,
          expiresAt: fromDatetimeLocalValue(editExpiresLocal),
          isActive: editing.is_active ? 1 : 0,
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
    if (!confirm('Supprimer ce code ?')) return;
    setBusy(true);
    setError(null);
    try {
      await fetchApi(`/api/admin/wifi/${id}`, { method: 'DELETE' });
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
          <h1 className="text-4xl font-bold mb-2">Codes Wi‑Fi</h1>
          <p className="text-muted-foreground">Gestion des codes invités (expiration en date/heure locale)</p>
        </div>
        {error && <div className="p-3 rounded-lg border border-destructive/40 text-sm">{error}</div>}

        <form
          onSubmit={create}
          className="bg-card border border-border rounded-lg p-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4 items-end max-w-4xl"
        >
          <div>
            <label className="block text-sm mb-1">Code</label>
            <input
              required
              minLength={4}
              value={form.code}
              onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))}
              className="w-full px-3 py-2 bg-muted border rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm mb-1">Réseau (SSID affiché)</label>
            <input
              value={form.networkName}
              onChange={(e) => setForm((f) => ({ ...f, networkName: e.target.value }))}
              className="w-full px-3 py-2 bg-muted border rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm mb-1">Expire le</label>
            <input
              type="datetime-local"
              value={form.expiresLocal}
              onChange={(e) => setForm((f) => ({ ...f, expiresLocal: e.target.value }))}
              className="w-full px-3 py-2 bg-muted border rounded-lg"
            />
          </div>
          <div className="flex items-center gap-2 pb-2">
            <input
              type="checkbox"
              id="activeNew"
              checked={form.isActive}
              onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
            />
            <label htmlFor="activeNew">Actif</label>
          </div>
          <button
            type="submit"
            disabled={busy}
            className="flex items-center gap-2 px-6 py-2 bg-primary text-primary-foreground rounded-lg font-semibold sm:col-span-2 lg:col-span-4 w-fit"
          >
            <Plus size={18} /> Créer
          </button>
        </form>

        {editing && (
          <form onSubmit={saveEdit} className="bg-card border border-primary/40 rounded-lg p-6 space-y-4 max-w-4xl">
            <h2 className="font-bold">Modifier</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm mb-1">Code</label>
                <input
                  required
                  minLength={4}
                  value={editing.code}
                  onChange={(e) => setEditing({ ...editing, code: e.target.value })}
                  className="w-full px-3 py-2 bg-muted border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm mb-1">Réseau</label>
                <input
                  value={editing.network_name ?? ''}
                  onChange={(e) => setEditing({ ...editing, network_name: e.target.value })}
                  className="w-full px-3 py-2 bg-muted border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm mb-1">Expire le</label>
                <input
                  type="datetime-local"
                  value={editExpiresLocal}
                  onChange={(e) => setEditExpiresLocal(e.target.value)}
                  className="w-full px-3 py-2 bg-muted border rounded-lg"
                />
              </div>
              <div className="flex items-center gap-2 pt-6">
                <input
                  type="checkbox"
                  id="activeEdit"
                  checked={Boolean(editing.is_active)}
                  onChange={(e) => setEditing({ ...editing, is_active: e.target.checked ? 1 : 0 })}
                />
                <label htmlFor="activeEdit">Actif</label>
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
                <th className="px-4 py-3 text-left">Code</th>
                <th className="px-4 py-3 text-left">Réseau</th>
                <th className="px-4 py-3 text-left">Expiration</th>
                <th className="px-4 py-3 text-left">Actif</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-b border-border">
                  <td className="px-4 py-3 font-mono font-medium">{r.code}</td>
                  <td className="px-4 py-3">{r.network_name ?? '—'}</td>
                  <td className="px-4 py-3">
                    {new Date(r.expires_at * 1000).toLocaleString('fr-FR')}
                  </td>
                  <td className="px-4 py-3">{r.is_active ? 'Oui' : 'Non'}</td>
                  <td className="px-4 py-3 text-right space-x-2">
                    <button
                      type="button"
                      onClick={() => openEdit(r)}
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
