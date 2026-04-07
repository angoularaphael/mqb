'use client';

import { AppLayoutWrapper } from '@/app/layout-wrapper';
import { getCurrentUserAction } from '@/app/actions/auth';
import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Download, Trash2, Upload } from 'lucide-react';
import { fetchApi } from '@/lib/fetch-api';
import { VISIBILITY_LABELS } from '@/lib/constants';

type DocRow = {
  id: string;
  title: string;
  description: string | null;
  file_path: string;
  course_id: string | null;
  visibility: string | null;
};

type Course = { id: string; code: string; name: string };

export default function TeacherDocumentsPage() {
  const router = useRouter();
  const [user, setUser] = useState<Record<string, unknown> | null>(null);
  const [docs, setDocs] = useState<DocRow[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [courseId, setCourseId] = useState('');
  const [visibility, setVisibility] = useState<'private' | 'students' | 'public'>('students');
  const [file, setFile] = useState<File | null>(null);

  const reload = useCallback(async () => {
    const d = await fetchApi<{ documents: DocRow[] }>('/api/teacher/documents');
    setDocs(d.documents);
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
        const c = await fetchApi<{ courses: Course[] }>('/api/teacher/courses');
        setCourses(c.courses);
        await reload();
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Erreur');
      }
    })();
  }, [router, reload]);

  const upload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setError('Choisissez un fichier');
      return;
    }
    setBusy(true);
    setError(null);
    const fd = new FormData();
    fd.append('file', file);
    fd.append('title', title);
    if (description) fd.append('description', description);
    if (courseId) fd.append('courseId', courseId);
    fd.append('visibility', visibility);
    const res = await fetch('/api/teacher/documents', { method: 'POST', body: fd, credentials: 'include' });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(typeof body.error === 'string' ? body.error : 'Échec');
      setBusy(false);
      return;
    }
    setTitle('');
    setDescription('');
    setCourseId('');
    setFile(null);
    await reload();
    setBusy(false);
  };

  const remove = async (id: string) => {
    if (!confirm('Supprimer ce document ?')) return;
    setBusy(true);
    setError(null);
    try {
      await fetchApi(`/api/teacher/documents/${id}`, { method: 'DELETE' });
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
          <h1 className="text-4xl font-bold mb-2">Documents</h1>
          <p className="text-muted-foreground">Fichiers liés à vos cours ou déposés par vous</p>
        </div>
        {error && <div className="p-3 rounded-lg border border-destructive/40 text-sm">{error}</div>}

        <form onSubmit={upload} className="bg-card border border-border rounded-lg p-6 space-y-4 max-w-2xl">
          <h2 className="font-semibold flex items-center gap-2">
            <Upload size={20} /> Envoyer un document
          </h2>
          <input type="file" onChange={(e) => setFile(e.target.files?.[0] ?? null)} className="w-full text-sm" />
          <input
            required
            minLength={3}
            placeholder="Titre"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-3 py-2 bg-muted border rounded-lg"
          />
          <input
            placeholder="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-3 py-2 bg-muted border rounded-lg"
          />
          <select
            value={courseId}
            onChange={(e) => setCourseId(e.target.value)}
            className="w-full px-3 py-2 bg-muted border rounded-lg"
          >
            <option value="">— Sans cours —</option>
            {courses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.code} — {c.name}
              </option>
            ))}
          </select>
          <select
            value={visibility}
            onChange={(e) =>
              setVisibility(e.target.value as 'private' | 'students' | 'public')
            }
            className="w-full px-3 py-2 bg-muted border rounded-lg"
          >
            {Object.entries(VISIBILITY_LABELS).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
          <button
            type="submit"
            disabled={busy}
            className="px-6 py-2 bg-primary text-primary-foreground rounded-lg font-semibold"
          >
            {busy ? 'Envoi…' : 'Envoyer'}
          </button>
        </form>

        <div className="bg-card border border-border rounded-lg divide-y divide-border">
          {docs.map((d) => (
            <div key={d.id} className="p-4 flex flex-wrap justify-between gap-4">
              <div>
                <p className="font-semibold">{d.title}</p>
                <p className="text-xs text-muted-foreground">
                  {VISIBILITY_LABELS[d.visibility ?? 'private']}
                </p>
              </div>
              <div className="flex gap-2">
                <a
                  href={`/api/documents/${d.id}/file`}
                  className="inline-flex items-center gap-1 px-3 py-2 text-primary border rounded-lg hover:bg-muted"
                >
                  <Download size={16} /> Télécharger
                </a>
                <button
                  type="button"
                  onClick={() => remove(d.id)}
                  className="p-2 text-destructive hover:bg-destructive/10 rounded"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </AppLayoutWrapper>
  );
}
