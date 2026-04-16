'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { getCurrentUserAction } from '@/app/actions/auth';
import { AppLayoutWrapper } from '@/app/layout-wrapper';
import { fetchApi } from '@/lib/fetch-api';
import { BookOpen, Search, Clock, CheckCircle } from 'lucide-react';

export default function StudentLibraryPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [items, setItems] = useState<any[]>([]);
  const [myLoans, setMyLoans] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState<'catalogue' | 'emprunts'>('catalogue');

  useEffect(() => {
    (async () => {
      const u = await getCurrentUserAction();
      if (!u) { router.push('/login'); return; }
      setUser(u);
      try {
        const data = await fetchApi<{ items: any[]; myLoans: any[] }>('/api/student/library');
        setItems(data.items || []);
        setMyLoans(data.myLoans || []);
      } catch { /* ignore */ }
      setIsLoading(false);
    })();
  }, [router]);

  const filteredItems = items.filter(i => `${i.title} ${i.author} ${i.category}`.toLowerCase().includes(search.toLowerCase()));

  if (isLoading) return <div className="flex min-h-screen items-center justify-center bg-background"><motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity }} className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full" /></div>;
  if (!user) return null;

  return (
    <AppLayoutWrapper user={user}>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-3"><BookOpen className="text-primary" /> Bibliothèque</h1>
          <p className="text-muted-foreground mt-1">Consultez le catalogue et vos emprunts</p>
        </div>

        <div className="flex gap-2 border-b border-border">
          <button onClick={() => setTab('catalogue')} className={`pb-3 px-4 font-medium transition ${tab === 'catalogue' ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground'}`}>Catalogue</button>
          <button onClick={() => setTab('emprunts')} className={`pb-3 px-4 font-medium transition ${tab === 'emprunts' ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground'}`}>Mes emprunts ({myLoans.filter(l => l.status === 'active').length})</button>
        </div>

        {tab === 'catalogue' && (
          <>
            <div className="relative max-w-sm"><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" /><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher..." className="w-full pl-10 pr-4 py-2.5 bg-background border border-input rounded-lg text-foreground focus:ring-2 focus:ring-primary focus:outline-none" /></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredItems.map(item => (
                <div key={item.id} className="bg-card border border-border rounded-xl p-5">
                  <h3 className="font-bold text-lg">{item.title}</h3>
                  <p className="text-sm text-muted-foreground">{item.author || 'Auteur inconnu'}</p>
                  <div className="mt-3 flex gap-2 text-xs"><span className="bg-muted text-muted-foreground px-2 py-1 rounded">{item.type}</span>{item.category && <span className="bg-muted text-muted-foreground px-2 py-1 rounded">{item.category}</span>}</div>
                  <p className={`mt-2 text-sm font-medium ${item.available > 0 ? 'text-green-500' : 'text-red-500'}`}>{item.available > 0 ? `${item.available} disponible(s)` : 'Indisponible'}</p>
                </div>
              ))}
              {filteredItems.length === 0 && <p className="col-span-full text-center text-muted-foreground py-8">Aucun item trouvé</p>}
            </div>
          </>
        )}

        {tab === 'emprunts' && (
          <div className="space-y-4">
            {myLoans.map(loan => (
              <div key={loan.id} className="bg-card border border-border rounded-xl p-5 flex items-center justify-between">
                <div>
                  <h3 className="font-bold">{loan.itemTitle}</h3>
                  <p className="text-sm text-muted-foreground">{loan.itemAuthor}</p>
                  <p className="text-sm text-muted-foreground mt-1">Retour avant le : {loan.due_date}</p>
                </div>
                <span className={`flex items-center gap-1.5 text-sm font-medium ${loan.status === 'returned' ? 'text-green-500' : 'text-yellow-500'}`}>
                  {loan.status === 'returned' ? <><CheckCircle size={16} /> Retourné</> : <><Clock size={16} /> En cours</>}
                </span>
              </div>
            ))}
            {myLoans.length === 0 && <p className="text-center text-muted-foreground py-8">Aucun emprunt</p>}
          </div>
        )}
      </motion.div>
    </AppLayoutWrapper>
  );
}
