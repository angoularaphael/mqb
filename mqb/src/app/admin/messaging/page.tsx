'use client';

import { AppLayoutWrapper } from '@/app/layout-wrapper';
import { getCurrentUserAction } from '@/app/actions/auth';
import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { fetchApi } from '@/lib/fetch-api';

type Student = { id: string; email: string; firstName: string; lastName: string };

type MsgRow = {
  id: string;
  title: string | null;
  content: string;
  type: string | null;
  created_at: number | null;
};

export default function AdminMessagingPage() {
  const router = useRouter();
  const [user, setUser] = useState<Record<string, unknown> | null>(null);
  const [messages, setMessages] = useState<MsgRow[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const reload = useCallback(async () => {
    const d = await fetchApi<{ messages: MsgRow[] }>('/api/admin/messages');
    setMessages(d.messages);
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
        const meta = await fetchApi<{ students: Student[] }>('/api/admin/meta');
        setStudents(meta.students);
        const sel: Record<string, boolean> = {};
        meta.students.forEach((s) => {
          sel[s.id] = false;
        });
        setSelected(sel);
        await reload();
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Erreur');
      }
    })();
  }, [router, reload]);

  const toggleAll = (on: boolean) => {
    const next: Record<string, boolean> = {};
    students.forEach((s) => {
      next[s.id] = on;
    });
    setSelected(next);
  };

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    const recipientIds = Object.entries(selected)
      .filter(([, v]) => v)
      .map(([k]) => k);
    if (recipientIds.length === 0) {
      setError('Sélectionnez au moins un étudiant');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await fetchApi('/api/admin/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, content, recipientIds }),
      });
      setTitle('');
      setContent('');
      await reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Échec');
    } finally {
      setBusy(false);
    }
  };

  const remove = async (id: string) => {
    if (!confirm('Supprimer ce message ?')) return;
    setBusy(true);
    setError(null);
    try {
      await fetchApi(`/api/admin/messages/${id}`, { method: 'DELETE' });
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
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
        <div>
          <h1 className="text-4xl font-bold mb-2">Messagerie</h1>
          <p className="text-muted-foreground">Diffusion vers étudiants sélectionnés</p>
        </div>
        {error && <div className="p-3 rounded-lg border border-destructive/40 text-sm">{error}</div>}

        <form onSubmit={send} className="bg-card border border-border rounded-lg p-6 space-y-4">
          <h2 className="font-semibold">Nouvelle diffusion</h2>
          <div>
            <label className="block text-sm mb-1">Sujet</label>
            <input
              required
              minLength={3}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 bg-muted border rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm mb-1">Message</label>
            <textarea
              required
              minLength={10}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={5}
              className="w-full px-3 py-2 bg-muted border rounded-lg"
            />
          </div>
          <div>
            <div className="flex gap-2 mb-2">
              <button type="button" onClick={() => toggleAll(true)} className="text-sm text-primary">
                Tout sélectionner
              </button>
              <button type="button" onClick={() => toggleAll(false)} className="text-sm text-muted-foreground">
                Tout désélectionner
              </button>
            </div>
            <div className="max-h-48 overflow-y-auto border border-border rounded-lg p-3 space-y-2">
              {students.map((s) => (
                <label key={s.id} className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selected[s.id] ?? false}
                    onChange={(e) =>
                      setSelected((prev) => ({ ...prev, [s.id]: e.target.checked }))
                    }
                  />
                  {s.firstName} {s.lastName} ({s.email})
                </label>
              ))}
            </div>
          </div>
          <button
            type="submit"
            disabled={busy}
            className="px-6 py-2 bg-primary text-primary-foreground rounded-lg font-semibold disabled:opacity-50"
          >
            Envoyer
          </button>
        </form>

        <div>
          <h2 className="text-xl font-bold mb-3">Messages en base</h2>
          <div className="bg-card border border-border rounded-lg divide-y divide-border">
            {messages.length === 0 ? (
              <p className="p-4 text-sm text-muted-foreground">Aucun message</p>
            ) : (
              messages.map((m) => (
                <div key={m.id} className="p-4 flex justify-between gap-4">
                  <div>
                    <p className="font-semibold">{m.title ?? '(Sans titre)'}</p>
                    <p className="text-xs text-muted-foreground">
                      {m.type} •{' '}
                      {m.created_at
                        ? new Date(m.created_at * 1000).toLocaleString('fr-FR')
                        : ''}
                    </p>
                    <p className="text-sm mt-2 line-clamp-3 whitespace-pre-wrap">{m.content}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => remove(m.id)}
                    disabled={busy}
                    className="text-destructive text-sm shrink-0"
                  >
                    Supprimer
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </motion.div>
    </AppLayoutWrapper>
  );
}
