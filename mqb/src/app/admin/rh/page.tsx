'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { getCurrentUserAction } from '@/app/actions/auth';
import { AppLayoutWrapper } from '@/app/layout-wrapper';
import { fetchApi } from '@/lib/fetch-api';
import { 
  Users, 
  Calendar, 
  CheckCircle, 
  XCircle, 
  Clock,
  Search
} from 'lucide-react';

export default function AdminRHPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [tab, setTab] = useState<'teachers' | 'leaves' | 'clock'>('teachers');
  const [searchText, setSearchText] = useState('');
  const [showAddContract, setShowAddContract] = useState<string | null>(null);
  const [contractForm, setContractForm] = useState({ type: 'CDI', startDate: '', endDate: '', salary: '' });

  useEffect(() => {
    (async () => {
      const u = await getCurrentUserAction();
      if (!u || u.role !== 'admin') {
        router.push('/login');
        return;
      }
      setUser(u);
      await loadData();
      setIsLoading(false);
    })();
  }, [router]);

  const loadData = async () => {
    try {
      const d = await fetchApi<any>('/api/admin/rh');
      setData(d);
    } catch (e) {
      console.error(e);
    }
  };

  const handleLeaveAction = async (leaveId: string, status: 'approved' | 'rejected') => {
    await fetchApi('/api/admin/rh', { 
      method: 'PATCH', 
      body: JSON.stringify({ leaveId, status }) 
    });
    await loadData();
  };

  const handleCreateContract = async () => {
    if (!showAddContract) return;
    await fetchApi('/api/admin/rh/contracts', { 
      method: 'POST', 
      body: JSON.stringify({ ...contractForm, teacherId: showAddContract }) 
    });
    setShowAddContract(null);
    setContractForm({ type: 'CDI', startDate: '', endDate: '', salary: '' });
    await loadData();
  };

  if (isLoading) return <div className="flex min-h-screen items-center justify-center bg-background"><motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity }} className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full" /></div>;
  if (!data) return null;

  const { teachers, contracts, pendingLeaves, todayClock } = data;

  const filteredTeachers = teachers.filter((t: any) => 
    `${t.firstName} ${t.lastName}`.toLowerCase().includes(searchText.toLowerCase())
  );

  return (
    <AppLayoutWrapper user={user}>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Users className="text-primary" /> Ressources Humaines
          </h1>
          <p className="text-muted-foreground mt-1">Gérez le personnel enseignant, les contrats et les absences</p>
        </div>

        {/* KPI Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-card border border-border p-6 rounded-2xl shadow-sm">
            <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Enseignants Actifs</p>
            <p className="text-3xl font-black mt-1">{teachers.length}</p>
          </div>
          <div className="bg-card border border-border p-6 rounded-2xl shadow-sm">
            <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Congés en attente</p>
            <p className="text-3xl font-black mt-1 text-yellow-500">{pendingLeaves.length}</p>
          </div>
          <div className="bg-card border border-border p-6 rounded-2xl shadow-sm">
            <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Présents aujourd'hui</p>
            <p className="text-3xl font-black mt-1 text-green-500">{todayClock.length}</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 border-b border-border">
          {[
            { id: 'teachers', label: 'Enseignants & Contrats', icon: Users },
            { id: 'leaves', label: 'Demandes de Congés', icon: Calendar, badge: pendingLeaves.length },
            { id: 'clock', label: 'Pointage du jour', icon: Clock }
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id as any)}
              className={`flex items-center gap-2 px-6 py-4 font-bold transition border-b-2 relative ${
                tab === t.id ? 'border-primary text-primary' : 'border-transparent text-muted-foreground'
              }`}
            >
              <t.icon size={18} /> {t.label}
              {t.badge > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center border-2 border-background">
                  {t.badge}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Tab Contents */}
        <div className="min-h-[400px]">
          {tab === 'teachers' && (
            <div className="space-y-6">
              <div className="relative max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                <input 
                  value={searchText}
                  onChange={e => setSearchText(e.target.value)}
                  placeholder="Rechercher un enseignant..."
                  className="w-full pl-10 pr-4 py-3 bg-muted border-none rounded-xl focus:ring-2 ring-primary outline-none"
                />
              </div>

              <div className="bg-card border border-border rounded-2xl overflow-hidden">
                <table className="w-full text-sm text-left">
                  <thead className="bg-muted/50 text-muted-foreground font-bold">
                    <tr>
                      <th className="p-4">Enseignant</th>
                      <th className="p-4">Type Contrat</th>
                      <th className="p-4">Depuis le</th>
                      <th className="p-4">Salaire</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filteredTeachers.map((t: any) => {
                      const contract = contracts.find((c: any) => c.teacher_id === t.id);
                      return (
                        <tr key={t.id} className="hover:bg-muted/30 transition">
                          <td className="p-4">
                            <p className="font-bold">{t.firstName} {t.lastName}</p>
                            <p className="text-xs text-muted-foreground">{t.email}</p>
                          </td>
                          <td className="p-4">
                            {contract ? (
                              <span className="bg-primary/10 text-primary px-2 py-1 rounded font-bold text-[10px] uppercase">
                                {contract.type}
                              </span>
                            ) : (
                              <span className="text-muted-foreground italic">Aucun</span>
                            )}
                          </td>
                          <td className="p-4">{contract ? new Date(contract.start_date).toLocaleDateString() : '-'}</td>
                          <td className="p-4">{contract?.salary ? `${contract.salary}€` : '-'}</td>
                          <td className="p-4 text-right">
                            <button 
                              onClick={() => setShowAddContract(t.id)}
                              className="text-primary font-bold hover:underline"
                            >
                              Gérer Contrat
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {tab === 'leaves' && (
            <div className="space-y-4">
              {pendingLeaves.map((l: any) => (
                <div key={l.id} className="bg-card border border-border p-6 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-6">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-bold text-lg">{l.teacherFirstName} {l.teacherLastName}</h3>
                      <span className="bg-yellow-500/10 text-yellow-500 text-[10px] font-black uppercase px-2 py-0.5 rounded-full">En attente</span>
                    </div>
                    <p className="text-sm font-medium">Demande de {l.type === 'vacation' ? 'Congés' : l.type === 'sick' ? 'Maladie' : 'Absence'}</p>
                    <p className="text-xs text-muted-foreground mt-1">Du {new Date(l.startDate).toLocaleDateString()} au {new Date(l.endDate).toLocaleDateString()}</p>
                    {l.reason && <p className="text-sm mt-3 bg-muted p-3 rounded-lg border-l-4 border-primary italic">"{l.reason}"</p>}
                  </div>
                  <div className="flex gap-3">
                    <button 
                      onClick={() => handleLeaveAction(l.id, 'rejected')}
                      className="px-6 py-2 border-2 border-destructive text-destructive font-bold rounded-xl hover:bg-destructive hover:text-white transition flex items-center gap-2"
                    >
                      <XCircle size={18} /> Refuser
                    </button>
                    <button 
                      onClick={() => handleLeaveAction(l.id, 'approved')}
                      className="px-6 py-2 bg-green-500 text-white font-bold rounded-xl hover:opacity-90 transition flex items-center gap-2"
                    >
                      <CheckCircle size={18} /> Approuver
                    </button>
                  </div>
                </div>
              ))}
              {pendingLeaves.length === 0 && (
                <div className="py-20 text-center text-muted-foreground">
                  <CheckCircle size={48} className="mx-auto mb-4 opacity-20" />
                  <p>Aucune demande de congé en attente.</p>
                </div>
              )}
            </div>
          )}

          {tab === 'clock' && (
            <div className="bg-card border border-border rounded-2xl overflow-hidden">
               <table className="w-full text-sm text-left">
                  <thead className="bg-muted text-muted-foreground font-bold">
                    <tr>
                      <th className="p-4">Enseignant</th>
                      <th className="p-4">Heure Entrée</th>
                      <th className="p-4">Heure Sortie</th>
                      <th className="p-4">Durée</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {todayClock.map((c: any) => {
                      const teacher = teachers.find((t: any) => t.id === c.teacher_id);
                      return (
                        <tr key={c.id}>
                          <td className="p-4 font-bold">{teacher?.firstName} {teacher?.lastName}</td>
                          <td className="p-4">{new Date(c.clock_in * 1000).toLocaleTimeString()}</td>
                          <td className="p-4">{c.clock_out ? new Date(c.clock_out * 1000).toLocaleTimeString() : <span className="text-orange-500 font-bold italic">En cours...</span>}</td>
                          <td className="p-4">
                            {c.clock_out ? (
                              `${Math.floor((c.clock_out - c.clock_in) / 3600)}h ${Math.round(((c.clock_out - c.clock_in) % 3600) / 60)}m`
                            ) : '-'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
               </table>
            </div>
          )}
        </div>
      </div>

      {/* Modal: Add/Update Contract */}
      {showAddContract && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} className="bg-card border border-border rounded-2xl p-8 max-w-md w-full relative">
            <h3 className="text-2xl font-bold mb-6">Gestion du contrat</h3>
            <div className="space-y-4">
               <div>
                  <label className="text-xs font-bold uppercase text-muted-foreground mb-1 block">Type de contrat</label>
                  <select 
                    value={contractForm.type}
                    onChange={e => setContractForm({...contractForm, type: e.target.value})}
                    className="w-full p-3 bg-muted rounded-xl outline-none"
                  >
                    <option value="CDI">CDI</option>
                    <option value="CDD">CDD</option>
                    <option value="vacation">Vacataire</option>
                    <option value="internship">Stagiaire</option>
                  </select>
               </div>
               <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold uppercase text-muted-foreground mb-1 block">Date début</label>
                    <input type="date" value={contractForm.startDate} onChange={e => setContractForm({...contractForm, startDate: e.target.value})} className="w-full p-3 bg-muted rounded-xl" />
                  </div>
                  <div>
                    <label className="text-xs font-bold uppercase text-muted-foreground mb-1 block">Date fin (optionnel)</label>
                    <input type="date" value={contractForm.endDate} onChange={e => setContractForm({...contractForm, endDate: e.target.value})} className="w-full p-3 bg-muted rounded-xl" />
                  </div>
               </div>
               <div>
                  <label className="text-xs font-bold uppercase text-muted-foreground mb-1 block">Salaire Mensuel (€)</label>
                  <input type="number" value={contractForm.salary} onChange={e => setContractForm({...contractForm, salary: e.target.value})} placeholder="Ex: 2500" className="w-full p-3 bg-muted rounded-xl" />
               </div>
               <div className="flex gap-4 pt-4">
                  <button onClick={() => setShowAddContract(null)} className="flex-1 py-3 font-bold text-muted-foreground">Annuler</button>
                  <button onClick={handleCreateContract} className="flex-1 py-3 bg-primary text-primary-foreground font-bold rounded-xl shadow-lg shadow-primary/20">Enregistrer</button>
               </div>
            </div>
          </motion.div>
        </div>
      )}
    </AppLayoutWrapper>
  );
}
