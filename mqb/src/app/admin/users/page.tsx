'use client';

import { AppLayoutWrapper } from '@/app/layout-wrapper';
import { getCurrentUserAction } from '@/app/actions/auth';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Pencil, Plus, Search, Download, Trash2, X } from 'lucide-react';
import { fetchApi } from '@/lib/fetch-api';

type UserRow = {
  id: string;
  name: string;
  firstName?: string;
  lastName?: string;
  email: string;
  role: string;
  status: string;
};

export default function AdminUsers() {
  const router = useRouter();
  const [user, setUser] = useState<Record<string, unknown> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [rows, setRows] = useState<UserRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    role: 'student' as 'student' | 'teacher' | 'admin',
  });
  const [editRow, setEditRow] = useState<UserRow | null>(null);
  const [editForm, setEditForm] = useState({
    email: '',
    firstName: '',
    lastName: '',
    role: 'student' as 'student' | 'teacher' | 'admin',
    isActive: true,
    password: '',
  });
  const [editError, setEditError] = useState<string | null>(null);

  const reloadUsers = async () => {
    const d = await fetchApi<{ users: UserRow[] }>('/api/admin/users');
    setRows(d.users);
  };

  useEffect(() => {
    const load = async () => {
      const currentUser = await getCurrentUserAction();
      if (!currentUser || currentUser.role !== 'admin') {
        router.push('/login');
        return;
      }
      setUser(currentUser);
      try {
        await reloadUsers();
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

  const q = searchQuery.trim().toLowerCase();
  const filtered = q
    ? rows.filter(
        (r) =>
          r.name.toLowerCase().includes(q) ||
          r.email.toLowerCase().includes(q) ||
          r.role.toLowerCase().includes(q),
      )
    : rows;

  const csv = () => {
    const header = 'name,email,role,status\n';
    const body = filtered.map((r) => `${r.name},${r.email},${r.role},${r.status}`).join('\n');
    const blob = new Blob([header + body], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'utilisateurs-mqb.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setSubmitting(true);
    try {
      await fetchApi<{ user: UserRow }>('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: form.email,
          password: form.password,
          firstName: form.firstName,
          lastName: form.lastName,
          role: form.role,
        }),
      });
      setForm({
        email: '',
        password: '',
        firstName: '',
        lastName: '',
        role: 'student',
      });
      setShowForm(false);
      await reloadUsers();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Échec de la création');
    } finally {
      setSubmitting(false);
    }
  };

  const openEdit = (row: UserRow) => {
    setEditRow(row);
    setEditError(null);
    setEditForm({
      email: row.email,
      firstName: row.firstName ?? (row.name.split(' ')[0] || ''),
      lastName: row.lastName ?? (row.name.split(' ').slice(1).join(' ').trim() || ''),
      role: row.role as 'student' | 'teacher' | 'admin',
      isActive: row.status === 'active',
      password: '',
    });
  };

  const handleEditSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editRow) return;
    setEditError(null);
    setSubmitting(true);
    try {
      const body: Record<string, unknown> = {
        email: editForm.email,
        firstName: editForm.firstName,
        lastName: editForm.lastName,
        role: editForm.role,
        isActive: editForm.isActive ? 1 : 0,
      };
      if (editForm.password.trim().length >= 8) body.password = editForm.password;
      await fetchApi(`/api/admin/users/${editRow.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      setEditRow(null);
      await reloadUsers();
    } catch (err) {
      setEditError(err instanceof Error ? err.message : 'Échec');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (row: UserRow) => {
    if (row.id === (user as { id: string }).id) {
      setError('Vous ne pouvez pas supprimer votre propre compte.');
      return;
    }
    if (!confirm(`Supprimer ${row.email} ?`)) return;
    setError(null);
    try {
      await fetchApi(`/api/admin/users/${row.id}`, { method: 'DELETE' });
      await reloadUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Échec suppression');
    }
  };

  return (
    <AppLayoutWrapper user={user}>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
        <div>
          <h1 className="text-4xl font-bold mb-2">Gestion des utilisateurs</h1>
          <p className="text-muted-foreground">GET/POST /api/admin/users (admin uniquement)</p>
        </div>

        {error && (
          <div className="p-3 rounded-lg border border-destructive/40 text-sm">{error}</div>
        )}

        <div className="flex gap-4 flex-wrap items-start">
          <div className="flex-1 min-w-64 relative">
            <Search size={18} className="absolute left-3 top-3 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher..."
              className="w-full pl-10 pr-4 py-2 bg-muted border border-border rounded-lg focus:outline-none focus:border-primary"
            />
          </div>
          <motion.button
            type="button"
            whileHover={{ scale: 1.02 }}
            onClick={() => {
              setShowForm((v) => !v);
              setFormError(null);
            }}
            className="flex items-center gap-2 px-6 py-2 bg-primary text-primary-foreground rounded-lg font-semibold"
          >
            <Plus size={18} />
            {showForm ? 'Fermer' : 'Ajouter utilisateur'}
          </motion.button>
          <motion.button
            type="button"
            onClick={csv}
            whileHover={{ scale: 1.02 }}
            className="flex items-center gap-2 px-6 py-2 border border-border rounded-lg font-semibold hover:bg-muted transition-colors"
          >
            <Download size={18} />
            Exporter CSV
          </motion.button>
        </div>

        <AnimatePresence>
          {showForm && (
            <motion.form
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              onSubmit={handleCreate}
              className="bg-card border border-border rounded-lg p-6 space-y-4 overflow-hidden"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold">Nouvel utilisateur</h2>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="p-1 rounded hover:bg-muted"
                  aria-label="Fermer"
                >
                  <X size={20} />
                </button>
              </div>
              {formError && (
                <div className="p-3 rounded-lg border border-destructive/40 text-sm text-destructive">
                  {formError}
                </div>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Prénom</label>
                  <input
                    required
                    minLength={2}
                    value={form.firstName}
                    onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))}
                    className="w-full px-3 py-2 bg-muted border border-border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Nom</label>
                  <input
                    required
                    minLength={2}
                    value={form.lastName}
                    onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))}
                    className="w-full px-3 py-2 bg-muted border border-border rounded-lg"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium mb-1">Email</label>
                  <input
                    required
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                    className="w-full px-3 py-2 bg-muted border border-border rounded-lg"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium mb-1">Mot de passe (min. 8 caractères)</label>
                  <input
                    required
                    type="password"
                    minLength={8}
                    value={form.password}
                    onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                    className="w-full px-3 py-2 bg-muted border border-border rounded-lg"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium mb-1">Rôle</label>
                  <select
                    value={form.role}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        role: e.target.value as 'student' | 'teacher' | 'admin',
                      }))
                    }
                    className="w-full px-3 py-2 bg-muted border border-border rounded-lg"
                  >
                    <option value="student">Étudiant</option>
                    <option value="teacher">Enseignant</option>
                    <option value="admin">Administrateur</option>
                  </select>
                </div>
              </div>
              <motion.button
                type="submit"
                disabled={submitting}
                whileHover={{ scale: 1.01 }}
                className="px-6 py-2 bg-primary text-primary-foreground rounded-lg font-semibold disabled:opacity-50"
              >
                {submitting ? 'Création…' : 'Créer le compte'}
              </motion.button>
            </motion.form>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {editRow && (
            <motion.form
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              onSubmit={handleEditSave}
              className="bg-card border border-primary/40 rounded-lg p-6 space-y-4 overflow-hidden"
            >
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-bold">Modifier l&apos;utilisateur</h2>
                <button type="button" onClick={() => setEditRow(null)} className="p-1 rounded hover:bg-muted">
                  <X size={20} />
                </button>
              </div>
              {editError && (
                <div className="p-3 rounded-lg border border-destructive/40 text-sm text-destructive">{editError}</div>
              )}
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm mb-1">Prénom</label>
                  <input
                    required
                    value={editForm.firstName}
                    onChange={(e) => setEditForm((f) => ({ ...f, firstName: e.target.value }))}
                    className="w-full px-3 py-2 bg-muted border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm mb-1">Nom</label>
                  <input
                    required
                    value={editForm.lastName}
                    onChange={(e) => setEditForm((f) => ({ ...f, lastName: e.target.value }))}
                    className="w-full px-3 py-2 bg-muted border rounded-lg"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm mb-1">Email</label>
                  <input
                    required
                    type="email"
                    value={editForm.email}
                    onChange={(e) => setEditForm((f) => ({ ...f, email: e.target.value }))}
                    className="w-full px-3 py-2 bg-muted border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm mb-1">Rôle</label>
                  <select
                    value={editForm.role}
                    onChange={(e) =>
                      setEditForm((f) => ({
                        ...f,
                        role: e.target.value as 'student' | 'teacher' | 'admin',
                      }))
                    }
                    className="w-full px-3 py-2 bg-muted border rounded-lg"
                  >
                    <option value="student">Étudiant</option>
                    <option value="teacher">Enseignant</option>
                    <option value="admin">Administrateur</option>
                  </select>
                </div>
                <div className="flex items-center gap-2 pt-6">
                  <input
                    type="checkbox"
                    id="active"
                    checked={editForm.isActive}
                    onChange={(e) => setEditForm((f) => ({ ...f, isActive: e.target.checked }))}
                  />
                  <label htmlFor="active">Compte actif</label>
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm mb-1">Nouveau mot de passe (optionnel, min. 8)</label>
                  <input
                    type="password"
                    minLength={8}
                    value={editForm.password}
                    onChange={(e) => setEditForm((f) => ({ ...f, password: e.target.value }))}
                    className="w-full px-3 py-2 bg-muted border rounded-lg"
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-2 bg-primary text-primary-foreground rounded-lg font-semibold disabled:opacity-50"
              >
                Enregistrer
              </button>
            </motion.form>
          )}
        </AnimatePresence>

        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-muted border-b border-border">
              <tr>
                <th className="px-6 py-3 text-left font-semibold">Nom</th>
                <th className="px-6 py-3 text-left font-semibold">Email</th>
                <th className="px-6 py-3 text-left font-semibold">Rôle</th>
                <th className="px-6 py-3 text-left font-semibold">Statut</th>
                <th className="px-6 py-3 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-muted-foreground">
                    Aucun utilisateur.
                  </td>
                </tr>
              ) : (
                filtered.map((row, idx) => (
                  <motion.tr
                    key={row.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: idx * 0.03 }}
                    className="border-b border-border"
                  >
                    <td className="px-6 py-4 font-semibold">{row.name}</td>
                    <td className="px-6 py-4 text-muted-foreground">{row.email}</td>
                    <td className="px-6 py-4">
                      <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-semibold">
                        {row.role}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-semibold">
                        {row.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <button
                        type="button"
                        onClick={() => openEdit(row)}
                        className="inline-flex p-2 rounded hover:bg-muted"
                        aria-label="Modifier"
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(row)}
                        disabled={row.id === (user as { id: string }).id}
                        className="inline-flex p-2 rounded hover:bg-destructive/10 text-destructive disabled:opacity-30"
                        aria-label="Supprimer"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </motion.div>
    </AppLayoutWrapper>
  );
}
