'use client';

import { AppLayoutWrapper } from '@/app/layout-wrapper';
import { getCurrentUserAction } from '@/app/actions/auth';
import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { fetchApi } from '@/lib/fetch-api';

type CourseRow = {
  id: string;
  code: string;
  name: string;
  description: string | null;
  teacherId: string;
  groupId: string;
  hoursTotal: number | null;
};

type Teacher = { id: string; firstName: string; lastName: string; email: string };
type Group = { id: string; name: string };

export default function AdminCoursesPage() {
  const router = useRouter();
  const [user, setUser] = useState<Record<string, unknown> | null>(null);
  const [courses, setCourses] = useState<CourseRow[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    code: '',
    name: '',
    description: '',
    teacherId: '',
    groupId: '',
    hoursTotal: 30,
  });
  const [editing, setEditing] = useState<CourseRow | null>(null);

  const reload = useCallback(async () => {
    const d = await fetchApi<{ courses: CourseRow[] }>('/api/admin/courses');
    setCourses(d.courses);
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
        const meta = await fetchApi<{ teachers: Teacher[]; groups: Group[] }>('/api/admin/meta');
        setTeachers(meta.teachers);
        setGroups(meta.groups.map((g) => ({ id: g.id, name: g.name })));
        await reload();
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Erreur');
      }
    })();
  }, [router, reload]);

  const teacherLabel = (id: string) => {
    const t = teachers.find((x) => x.id === id);
    return t ? `${t.firstName} ${t.lastName}` : id.slice(0, 8);
  };
  const groupLabel = (id: string) => groups.find((g) => g.id === id)?.name ?? id.slice(0, 8);

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await fetchApi('/api/admin/courses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: form.code,
          name: form.name,
          description: form.description || undefined,
          teacherId: form.teacherId,
          groupId: form.groupId,
          hoursTotal: form.hoursTotal,
        }),
      });
      setForm({
        code: '',
        name: '',
        description: '',
        teacherId: form.teacherId,
        groupId: form.groupId,
        hoursTotal: 30,
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
      await fetchApi(`/api/admin/courses/${editing.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: editing.code,
          name: editing.name,
          description: editing.description,
          teacherId: editing.teacherId,
          groupId: editing.groupId,
          hoursTotal: editing.hoursTotal ?? 30,
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
    if (!confirm('Supprimer ce cours ?')) return;
    setBusy(true);
    setError(null);
    try {
      await fetchApi(`/api/admin/courses/${id}`, { method: 'DELETE' });
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
          <h1 className="text-4xl font-bold mb-2">Cours</h1>
          <p className="text-muted-foreground">GET/POST /api/admin/courses — édition par id</p>
        </div>
        {error && <div className="p-3 rounded-lg border border-destructive/40 text-sm">{error}</div>}

        <form
          onSubmit={create}
          className="bg-card border border-border rounded-lg p-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 items-end"
        >
          <div>
            <label className="block text-sm mb-1">Code</label>
            <input
              required
              minLength={3}
              value={form.code}
              onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))}
              className="w-full px-3 py-2 bg-muted border rounded-lg"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-sm mb-1">Nom</label>
            <input
              required
              minLength={3}
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              className="w-full px-3 py-2 bg-muted border rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm mb-1">Heures totales</label>
            <input
              type="number"
              min={1}
              value={form.hoursTotal}
              onChange={(e) => setForm((f) => ({ ...f, hoursTotal: Number(e.target.value) }))}
              className="w-full px-3 py-2 bg-muted border rounded-lg"
            />
          </div>
          <div>
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
            <label className="block text-sm mb-1">Groupe</label>
            <select
              required
              value={form.groupId}
              onChange={(e) => setForm((f) => ({ ...f, groupId: e.target.value }))}
              className="w-full px-3 py-2 bg-muted border rounded-lg"
            >
              <option value="">—</option>
              {groups.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </select>
          </div>
          <div className="sm:col-span-2 xl:col-span-6">
            <label className="block text-sm mb-1">Description</label>
            <input
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              className="w-full px-3 py-2 bg-muted border rounded-lg"
            />
          </div>
          <button
            type="submit"
            disabled={busy}
            className="flex items-center gap-2 px-6 py-2 bg-primary text-primary-foreground rounded-lg font-semibold xl:col-span-6 w-fit"
          >
            <Plus size={18} /> Ajouter
          </button>
        </form>

        {editing && (
          <form onSubmit={saveEdit} className="bg-card border border-primary/40 rounded-lg p-6 space-y-4">
            <h2 className="font-bold">Modifier le cours</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm mb-1">Code</label>
                <input
                  required
                  value={editing.code}
                  onChange={(e) => setEditing({ ...editing, code: e.target.value })}
                  className="w-full px-3 py-2 bg-muted border rounded-lg"
                />
              </div>
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
                <label className="block text-sm mb-1">Heures</label>
                <input
                  type="number"
                  min={1}
                  value={editing.hoursTotal ?? 30}
                  onChange={(e) =>
                    setEditing({ ...editing, hoursTotal: Number(e.target.value) })
                  }
                  className="w-full px-3 py-2 bg-muted border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm mb-1">Enseignant</label>
                <select
                  value={editing.teacherId}
                  onChange={(e) => setEditing({ ...editing, teacherId: e.target.value })}
                  className="w-full px-3 py-2 bg-muted border rounded-lg"
                >
                  {teachers.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.firstName} {t.lastName}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm mb-1">Groupe</label>
                <select
                  value={editing.groupId}
                  onChange={(e) => setEditing({ ...editing, groupId: e.target.value })}
                  className="w-full px-3 py-2 bg-muted border rounded-lg"
                >
                  {groups.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm mb-1">Description</label>
                <input
                  value={editing.description ?? ''}
                  onChange={(e) => setEditing({ ...editing, description: e.target.value })}
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
                <th className="px-4 py-3 text-left">Code</th>
                <th className="px-4 py-3 text-left">Nom</th>
                <th className="px-4 py-3 text-left">Enseignant</th>
                <th className="px-4 py-3 text-left">Groupe</th>
                <th className="px-4 py-3 text-left">H.</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {courses.map((c) => (
                <tr key={c.id} className="border-b border-border">
                  <td className="px-4 py-3 font-mono">{c.code}</td>
                  <td className="px-4 py-3 font-medium">{c.name}</td>
                  <td className="px-4 py-3">{teacherLabel(c.teacherId)}</td>
                  <td className="px-4 py-3">{groupLabel(c.groupId)}</td>
                  <td className="px-4 py-3">{c.hoursTotal ?? '—'}</td>
                  <td className="px-4 py-3 text-right space-x-2">
                    <button
                      type="button"
                      onClick={() => setEditing({ ...c })}
                      className="inline-flex p-2 rounded hover:bg-muted"
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={() => remove(c.id)}
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
