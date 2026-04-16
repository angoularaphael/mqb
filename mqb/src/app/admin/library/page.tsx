'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { getCurrentUserAction } from '@/app/actions/auth';
import { AppLayoutWrapper } from '@/app/layout-wrapper';
import { fetchApi } from '@/lib/fetch-api';
import { BookOpen, Plus, Search, X, RotateCcw, BookMarked } from 'lucide-react';

export default function AdminLibraryPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [items, setItems] = useState<any[]>([]);
  const [loans, setLoans] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [showLoan, setShowLoan] = useState(false);
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState<'catalogue' | 'emprunts'>('catalogue');
  const [form, setForm] = useState({ title: '', author: '', isbn: '', type: 'book', category: '', quantity: '1' });
  const [loanForm, setLoanForm] = useState({ itemId: '', studentId: '', dueDate: '' });

  useEffect(() => {
    (async () => {
      const u = await getCurrentUserAction();
      if (!u || u.role !== 'admin') { router.push('/login'); return; }
      setUser(u);
      await loadData();
      setIsLoading(false);
    })();
  }, [router]);

  const loadData = async () => {
    try {
      const [lib, meta] = await Promise.all([
        fetchApi<{ items: any[]; loans: any[] }>('/api/admin/library'),
        fetchApi<{ students: any[] }>('/api/admin/meta'),
      ]);
      setItems(lib.items || []);
      setLoans(lib.loans || []);
      setStudents(meta.students || []);
    } catch { /* ignore */ }
  };

  const handleAdd = async () => {
    await fetchApi('/api/admin/library', { method: 'POST', body: JSON.stringify(form) });
    setShowAdd(false);
    setForm({ title: '', author: '', isbn: '', type: 'book', category: '', quantity: '1' });
    await loadData();
  };

  const handleLoan = async () => {
    await fetchApi('/api/admin/library/loans', { method: 'POST', body: JSON.stringify(loanForm) });
    setShowLoan(false);
    setLoanForm({ itemId: '', studentId: '', dueDate: '' });
    await loadData();
  };

  const handleReturn = async (loanId: string) => {
    await fetchApi(`/api/admin/library/loans/${loanId}/return`, { method: 'PUT' });
    await loadData();
  };

  const filteredItems = items.filter(i => `${i.title} ${i.author} ${i.category}`.toLowerCase().includes(search.toLowerCase()));
  const activeLoans = loans.filter(l => l.status === 'active');

  if (isLoading) return <div className="flex min-h-screen items-center justify-center bg-background"><motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity }} className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full" /></div>;
  if (!user) return null;

  return (
    <AppLayoutWrapper user={user}>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-3"><BookOpen className="text-primary" /> Bibliothèque / CDI</h1>
            <p className="text-muted-foreground mt-1">Gérez le catalogue et les emprunts</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setShowLoan(true)} className="flex items-center gap-2 px-4 py-2.5 bg-secondary text-secondary-foreground rounded-lg font-medium hover:opacity-90 transition"><BookMarked size={18} /> Nouvel emprunt</button>
            <button onClick={() => setShowAdd(true)} className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 transition"><Plus size={18} /> Ajouter un item</button>
          </div>
        </div>

        {/* KPI */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-card border border-border rounded-xl p-6"><p className="text-sm text-muted-foreground">Items au catalogue</p><p className="text-3xl font-bold mt-1">{items.length}</p></div>
          <div className="bg-card border border-border rounded-xl p-6"><p className="text-sm text-muted-foreground">Emprunts actifs</p><p className="text-3xl font-bold mt-1 text-yellow-500">{activeLoans.length}</p></div>
          <div className="bg-card border border-border rounded-xl p-6"><p className="text-sm text-muted-foreground">Retours effectués</p><p className="text-3xl font-bold mt-1 text-green-500">{loans.filter(l => l.status === 'returned').length}</p></div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 border-b border-border">
          <button onClick={() => setTab('catalogue')} className={`pb-3 px-4 font-medium transition ${tab === 'catalogue' ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground'}`}>Catalogue</button>
          <button onClick={() => setTab('emprunts')} className={`pb-3 px-4 font-medium transition ${tab === 'emprunts' ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground'}`}>Emprunts ({activeLoans.length})</button>
        </div>

        {tab === 'catalogue' && (
          <>
            <div className="relative max-w-sm"><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher un livre..." className="w-full pl-10 pr-4 py-2.5 bg-background border border-input rounded-lg text-foreground focus:ring-2 focus:ring-primary focus:outline-none" /></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredItems.map(item => (
                <div key={item.id} className="bg-card border border-border rounded-xl p-5 hover:shadow-md transition">
                  <div className="flex items-start justify-between">
                    <div><h3 className="font-bold text-lg">{item.title}</h3><p className="text-sm text-muted-foreground">{item.author || 'Auteur inconnu'}</p></div>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${item.available > 0 ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'}`}>{item.available > 0 ? `${item.available} dispo` : 'Indispo'}</span>
                  </div>
                  <div className="mt-3 flex gap-2 text-xs text-muted-foreground"><span className="bg-muted px-2 py-1 rounded">{item.type}</span>{item.category && <span className="bg-muted px-2 py-1 rounded">{item.category}</span>}{item.isbn && <span className="bg-muted px-2 py-1 rounded">ISBN: {item.isbn}</span>}</div>
                </div>
              ))}
              {filteredItems.length === 0 && <p className="col-span-full text-center text-muted-foreground py-8">Aucun item trouvé</p>}
            </div>
          </>
        )}

        {tab === 'emprunts' && (
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted text-muted-foreground"><tr><th className="text-left p-4 font-medium">Livre</th><th className="text-left p-4 font-medium">Étudiant</th><th className="text-left p-4 font-medium">Échéance</th><th className="text-left p-4 font-medium">Statut</th><th className="text-left p-4 font-medium">Action</th></tr></thead>
              <tbody className="divide-y divide-border">
                {loans.map(l => { const item = items.find(i => i.id === l.itemId); return (
                  <tr key={l.id} className="hover:bg-muted/50 transition">
                    <td className="p-4 font-medium">{item?.title || l.itemId}</td>
                    <td className="p-4">{l.studentName} {l.studentLastName}</td>
                    <td className="p-4">{l.dueDate}</td>
                    <td className="p-4"><span className={`px-2 py-1 rounded text-xs font-medium ${l.status === 'returned' ? 'bg-green-500/20 text-green-500' : 'bg-yellow-500/20 text-yellow-500'}`}>{l.status === 'returned' ? 'Retourné' : 'Actif'}</span></td>
                    <td className="p-4">{l.status === 'active' && <button onClick={() => handleReturn(l.id)} className="flex items-center gap-1 px-3 py-1.5 bg-primary text-primary-foreground rounded-md text-xs font-medium hover:opacity-90"><RotateCcw size={14} /> Retour</button>}</td>
                  </tr>
                ); })}
                {loans.length === 0 && <tr><td colSpan={5} className="p-8 text-center text-muted-foreground">Aucun emprunt</td></tr>}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>

      {/* Modal: Add Item */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-card border border-border rounded-2xl p-6 max-w-md w-full relative">
            <button onClick={() => setShowAdd(false)} className="absolute right-4 top-4 text-muted-foreground hover:text-foreground"><X size={20} /></button>
            <h3 className="text-xl font-bold mb-4">Ajouter au catalogue</h3>
            <div className="space-y-3">
              <input value={form.title} onChange={e => setForm({...form, title: e.target.value})} placeholder="Titre *" className="w-full p-3 bg-background border border-input rounded-lg text-foreground" />
              <input value={form.author} onChange={e => setForm({...form, author: e.target.value})} placeholder="Auteur" className="w-full p-3 bg-background border border-input rounded-lg text-foreground" />
              <input value={form.isbn} onChange={e => setForm({...form, isbn: e.target.value})} placeholder="ISBN" className="w-full p-3 bg-background border border-input rounded-lg text-foreground" />
              <div className="grid grid-cols-2 gap-3">
                <select value={form.type} onChange={e => setForm({...form, type: e.target.value})} className="p-3 bg-background border border-input rounded-lg text-foreground"><option value="book">Livre</option><option value="digital">Numérique</option><option value="material">Matériel</option></select>
                <input type="number" min="1" value={form.quantity} onChange={e => setForm({...form, quantity: e.target.value})} placeholder="Quantité" className="p-3 bg-background border border-input rounded-lg text-foreground" />
              </div>
              <input value={form.category} onChange={e => setForm({...form, category: e.target.value})} placeholder="Catégorie" className="w-full p-3 bg-background border border-input rounded-lg text-foreground" />
              <button onClick={handleAdd} disabled={!form.title} className="w-full py-3 bg-primary text-primary-foreground rounded-lg font-bold hover:opacity-90 disabled:opacity-50">Ajouter</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: New Loan */}
      {showLoan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-card border border-border rounded-2xl p-6 max-w-md w-full relative">
            <button onClick={() => setShowLoan(false)} className="absolute right-4 top-4 text-muted-foreground hover:text-foreground"><X size={20} /></button>
            <h3 className="text-xl font-bold mb-4">Enregistrer un emprunt</h3>
            <div className="space-y-3">
              <select value={loanForm.itemId} onChange={e => setLoanForm({...loanForm, itemId: e.target.value})} className="w-full p-3 bg-background border border-input rounded-lg text-foreground"><option value="">Sélectionner un item</option>{items.filter(i => i.available > 0).map(i => <option key={i.id} value={i.id}>{i.title} ({i.available} dispo)</option>)}</select>
              <select value={loanForm.studentId} onChange={e => setLoanForm({...loanForm, studentId: e.target.value})} className="w-full p-3 bg-background border border-input rounded-lg text-foreground"><option value="">Sélectionner un étudiant</option>{students.map((s: any) => <option key={s.id} value={s.id}>{s.firstName} {s.lastName}</option>)}</select>
              <input type="date" value={loanForm.dueDate} onChange={e => setLoanForm({...loanForm, dueDate: e.target.value})} className="w-full p-3 bg-background border border-input rounded-lg text-foreground" />
              <button onClick={handleLoan} disabled={!loanForm.itemId || !loanForm.studentId || !loanForm.dueDate} className="w-full py-3 bg-secondary text-secondary-foreground rounded-lg font-bold hover:opacity-90 disabled:opacity-50">Enregistrer l'emprunt</button>
            </div>
          </div>
        </div>
      )}
    </AppLayoutWrapper>
  );
}
