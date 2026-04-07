'use client';

import { AppLayoutWrapper } from '@/app/layout-wrapper';
import { getCurrentUserAction } from '@/app/actions/auth';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Send } from 'lucide-react';
import { canAccessStudentArea } from '@/lib/roles';
import { fetchApi } from '@/lib/fetch-api';

type Req = {
  id: string;
  type: string;
  subject: string;
  status: string;
  date: string;
};

export default function StudentRequest() {
  const router = useRouter();
  const [user, setUser] = useState<Record<string, unknown> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [requests, setRequests] = useState<Req[]>([]);
  const [requestType, setRequestType] = useState('request');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const loadList = async () => {
    const d = await fetchApi<{ requests: Req[] }>('/api/student/requests');
    setRequests(d.requests);
  };

  useEffect(() => {
    const load = async () => {
      const currentUser = await getCurrentUserAction();
      if (!currentUser || !canAccessStudentArea(currentUser.role)) {
        router.push('/login');
        return;
      }
      setUser(currentUser);
      try {
        await loadList();
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Erreur');
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [router]);

  if (isLoading) return null;
  if (!user) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await fetchApi('/api/student/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: requestType, subject, description }),
      });
      setSubject('');
      setDescription('');
      await loadList();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AppLayoutWrapper user={user}>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
        <div>
          <h1 className="text-4xl font-bold mb-2">Mes Requêtes</h1>
          <p className="text-muted-foreground">API GET/POST /api/student/requests</p>
        </div>

        {error && (
          <div className="p-3 rounded-lg border border-destructive/40 text-sm">{error}</div>
        )}

        <div className="bg-card border border-border rounded-lg p-6">
          <h2 className="text-xl font-bold mb-4">Nouvelle requête</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Type</label>
              <select
                value={requestType}
                onChange={(e) => setRequestType(e.target.value)}
                className="w-full px-4 py-2 bg-muted border border-border rounded-lg"
              >
                <option value="request">Demande</option>
                <option value="complaint">Plainte</option>
                <option value="inquiry">Question</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Sujet</label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                required
                className="w-full px-4 py-2 bg-muted border border-border rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
                className="w-full px-4 py-3 bg-muted border border-border rounded-lg resize-none h-40"
              />
            </div>
            <motion.button
              type="submit"
              disabled={submitting}
              whileHover={{ scale: 1.02 }}
              className="flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg font-semibold disabled:opacity-50"
            >
              <Send size={18} />
              {submitting ? 'Envoi…' : 'Soumettre'}
            </motion.button>
          </form>
        </div>

        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <div className="p-6 border-b border-border">
            <h2 className="text-xl font-bold">Vos requêtes</h2>
          </div>
          <div className="divide-y divide-border">
            {requests.length === 0 ? (
              <p className="p-6 text-muted-foreground text-sm">Aucune requête.</p>
            ) : (
              requests.map((req) => (
                <div key={req.id} className="p-4 hover:bg-muted transition-colors">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-semibold text-foreground">{req.subject}</p>
                      <p className="text-xs text-muted-foreground mt-1">{req.date}</p>
                    </div>
                    <span className="px-3 py-1 rounded-full text-xs font-semibold bg-muted shrink-0">
                      {req.status}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </motion.div>
    </AppLayoutWrapper>
  );
}
