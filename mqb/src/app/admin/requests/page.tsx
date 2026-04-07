'use client';

import { AppLayoutWrapper } from '@/app/layout-wrapper';
import { getCurrentUserAction } from '@/app/actions/auth';
import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { fetchApi } from '@/lib/fetch-api';
import { REQUEST_STATUS_LABELS } from '@/lib/constants';

type ReqRow = {
  id: string;
  student_id: string;
  type: string;
  subject: string;
  description: string;
  status: string | null;
  response: string | null;
  created_at: number | null;
};

export default function AdminRequestsPage() {
  const router = useRouter();
  const [user, setUser] = useState<Record<string, unknown> | null>(null);
  const [rows, setRows] = useState<ReqRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState<ReqRow | null>(null);
  const [status, setStatus] = useState<string>('pending');
  const [response, setResponse] = useState('');

  const reload = useCallback(async () => {
    const d = await fetchApi<{ requests: ReqRow[] }>('/api/admin/requests');
    setRows(d.requests);
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

  const open = (r: ReqRow) => {
    setEditing(r);
    setStatus(r.status ?? 'pending');
    setResponse(r.response ?? '');
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    setBusy(true);
    setError(null);
    try {
      await fetchApi(`/api/admin/requests/${editing.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: status as 'pending' | 'in_progress' | 'resolved' | 'rejected',
          response: response.trim() || null,
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

  if (!user) return null;

  return (
    <AppLayoutWrapper user={user}>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
        <div>
          <h1 className="text-4xl font-bold mb-2">Requêtes étudiants</h1>
          <p className="text-muted-foreground">GET /api/admin/requests — PATCH pour répondre</p>
        </div>
        {error && <div className="p-3 rounded-lg border border-destructive/40 text-sm">{error}</div>}

        {editing && (
          <form onSubmit={save} className="bg-card border border-primary/40 rounded-lg p-6 space-y-4">
            <h2 className="font-bold">{editing.subject}</h2>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">{editing.description}</p>
            <div>
              <label className="block text-sm mb-1">Statut</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full max-w-xs px-3 py-2 bg-muted border rounded-lg"
              >
                {Object.entries(REQUEST_STATUS_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm mb-1">Réponse admin</label>
              <textarea
                value={response}
                onChange={(e) => setResponse(e.target.value)}
                rows={4}
                className="w-full px-3 py-2 bg-muted border rounded-lg"
              />
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={busy}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-semibold"
              >
                Enregistrer
              </button>
              <button type="button" onClick={() => setEditing(null)} className="px-4 py-2 border rounded-lg">
                Fermer
              </button>
            </div>
          </form>
        )}

        <div className="bg-card border border-border rounded-lg overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted border-b">
              <tr>
                <th className="px-4 py-3 text-left">Sujet</th>
                <th className="px-4 py-3 text-left">Type</th>
                <th className="px-4 py-3 text-left">Statut</th>
                <th className="px-4 py-3 text-left">Date</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-b border-border">
                  <td className="px-4 py-3 font-medium max-w-xs truncate">{r.subject}</td>
                  <td className="px-4 py-3">{r.type}</td>
                  <td className="px-4 py-3">
                    {REQUEST_STATUS_LABELS[r.status ?? 'pending'] ?? r.status}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {r.created_at
                      ? new Date(r.created_at * 1000).toLocaleDateString('fr-FR')
                      : '—'}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => open(r)}
                      className="text-primary font-medium hover:underline"
                    >
                      Traiter
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
