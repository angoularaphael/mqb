'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { getCurrentUserAction } from '@/app/actions/auth';
import { AppLayoutWrapper } from '@/app/layout-wrapper';
import { fetchApi } from '@/lib/fetch-api';
import { 
  Briefcase, 
  MapPin, 
  Clock, 
  Calendar, 
  FileText, 
  Plus,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

export default function TeacherRHPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [leaveForm, setLeaveForm] = useState({ type: 'vacation', startDate: '', endDate: '', reason: '' });

  useEffect(() => {
    (async () => {
      const u = await getCurrentUserAction();
      if (!u || u.role !== 'teacher') {
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
      const d = await fetchApi<any>('/api/teacher/rh');
      setData(d);
    } catch (e) { console.error(e); }
  };

  const handleClock = async () => {
    await fetchApi('/api/teacher/rh/clock', { method: 'POST' });
    await loadData();
  };

  const requestLeave = async () => {
    await fetchApi('/api/teacher/rh/leaves', { method: 'PUT', body: JSON.stringify(leaveForm) });
    setShowLeaveModal(false);
    setLeaveForm({ type: 'vacation', startDate: '', endDate: '', reason: '' });
    await loadData();
  };

  if (isLoading) return <div className="flex min-h-screen items-center justify-center bg-background"><motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity }} className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full" /></div>;
  if (!data) return null;

  const { contracts, leaves, todayClock } = data;
  const isClockedIn = !!todayClock?.clock_in;
  const isClockedOut = !!todayClock?.clock_out;

  return (
    <AppLayoutWrapper user={user}>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
              <Briefcase className="text-primary" /> Mon Espace RH
            </h1>
            <p className="text-muted-foreground mt-1">Gérez votre contrat, vos pointages et vos absences</p>
          </div>
          <button 
            onClick={() => setShowLeaveModal(true)}
            className="flex items-center gap-2 px-6 py-2.5 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 transition shadow-lg shadow-primary/20"
          >
            <Plus size={18} /> Demander un congé
          </button>
        </div>

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Section: Pointage */}
          <div className="lg:col-span-2 bg-card border border-border rounded-2xl p-8 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none group-hover:scale-110 transition-transform">
              <MapPin size={120} />
            </div>
            
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
              <Clock className="text-primary" /> Pointage du jour
            </h2>

            <div className="flex flex-col md:flex-row items-center gap-8">
              <div className="flex-1 space-y-4">
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${isClockedIn ? 'bg-green-500' : 'bg-muted'}`} />
                  <p className="text-sm">Entrée : <span className="font-bold">{todayClock?.clock_in ? new Date(todayClock.clock_in * 1000).toLocaleTimeString() : '--:--'}</span></p>
                </div>
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${isClockedOut ? 'bg-orange-500' : 'bg-muted'}`} />
                  <p className="text-sm">Sortie : <span className="font-bold">{todayClock?.clock_out ? new Date(todayClock.clock_out * 1000).toLocaleTimeString() : '--:--'}</span></p>
                </div>
                {todayClock?.clock_in && todayClock?.clock_out && (
                  <p className="text-xs text-muted-foreground pt-2">Temps total : {Math.round((todayClock.clock_out - todayClock.clock_in) / 3600)}h {Math.round(((todayClock.clock_out - todayClock.clock_in) % 3600) / 60)}m</p>
                )}
              </div>

              <div className="relative">
                <button 
                  onClick={handleClock}
                  disabled={isClockedOut}
                  className={`w-40 h-40 rounded-full border-8 transition-all flex flex-col items-center justify-center gap-2 font-bold shadow-2xl ${
                    isClockedOut ? 'bg-muted border-background text-muted-foreground' : 
                    isClockedIn ? 'bg-orange-500/10 border-orange-500 text-orange-500' : 
                    'bg-green-500/10 border-green-500 text-green-500 hover:scale-105 active:scale-95'
                  }`}
                >
                  <MapPin size={32} />
                  <span>{isClockedOut ? 'Journée finie' : isClockedIn ? 'Pointer SORTIE' : 'Pointer ENTRÉE'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Section: Contrat Actif */}
          <div className="bg-card border border-border rounded-2xl p-8 flex flex-col justify-between">
            <div>
              <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                <FileText className="text-primary" /> Contrat
              </h2>
              {contracts[0] ? (
                <div className="space-y-4">
                  <div>
                    <p className="text-xs text-muted-foreground uppercase font-bold tracking-widest">Type</p>
                    <p className="text-2xl font-black text-primary">{contracts[0].type}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase font-bold tracking-widest">Depuis le</p>
                    <p className="font-bold">{new Date(contracts[0].start_date).toLocaleDateString()}</p>
                  </div>
                  {contracts[0].salary && (
                    <div>
                      <p className="text-xs text-muted-foreground uppercase font-bold tracking-widest">Salaire de base</p>
                      <p className="font-bold">{contracts[0].salary} € / mois</p>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-muted-foreground text-sm italic">Aucun contrat actif trouvé</p>
              )}
            </div>
            <button className="mt-8 text-xs font-bold text-primary hover:underline">Voir les fiches de paie &rarr;</button>
          </div>
        </div>

        {/* Historique des congés */}
        <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
          <div className="p-6 border-b border-border flex items-center justify-between">
             <h2 className="font-bold flex items-center gap-2"><Calendar className="text-primary" /> Mes Demandes de Congés</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-muted text-muted-foreground">
                <tr>
                  <th className="p-4 font-medium">Type</th>
                  <th className="p-4 font-medium">Début</th>
                  <th className="p-4 font-medium">Fin</th>
                  <th className="p-4 font-medium">Raison</th>
                  <th className="p-4 font-medium">Statut</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {leaves.map((l: any) => (
                  <tr key={l.id} className="hover:bg-muted/50 transition">
                    <td className="p-4 font-bold">{l.type === 'vacation' ? 'Congés' : l.type === 'sick' ? 'Maladie' : 'Autre'}</td>
                    <td className="p-4">{new Date(l.start_date).toLocaleDateString()}</td>
                    <td className="p-4">{new Date(l.end_date).toLocaleDateString()}</td>
                    <td className="p-4"><p className="max-w-xs truncate text-muted-foreground">{l.reason || '-'}</p></td>
                    <td className="p-4">
                      {l.status === 'approved' && <span className="flex items-center gap-1.5 text-green-500 font-bold"><CheckCircle2 size={16} /> Approuvé</span>}
                      {l.status === 'pending' && <span className="flex items-center gap-1.5 text-yellow-500 font-bold"><Clock size={16} /> En attente</span>}
                      {l.status === 'rejected' && <span className="flex items-center gap-1.5 text-red-500 font-bold"><AlertCircle size={16} /> Refusé</span>}
                    </td>
                  </tr>
                ))}
                {leaves.length === 0 && <tr><td colSpan={5} className="p-12 text-center text-muted-foreground">Aucune demande de congé</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      </motion.div>

      {/* Modal: Demande de congé */}
      {showLeaveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
           <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} className="bg-card border border-border rounded-2xl p-8 max-w-md w-full relative shadow-2xl">
              <h3 className="text-2xl font-bold mb-6">Demande de congé</h3>
              <div className="space-y-5">
                <div>
                  <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2 block">Type</label>
                  <select 
                    value={leaveForm.type} 
                    onChange={e => setLeaveForm({...leaveForm, type: e.target.value})}
                    className="w-full p-3 bg-muted border-none rounded-xl focus:ring-2 ring-primary outline-none"
                  >
                    <option value="vacation">Congés payés</option>
                    <option value="sick">Arrêt maladie</option>
                    <option value="personal">Absence personnelle</option>
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                   <div>
                     <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2 block">Du</label>
                     <input type="date" value={leaveForm.startDate} onChange={e => setLeaveForm({...leaveForm, startDate: e.target.value})} className="w-full p-3 bg-muted border-none rounded-xl" />
                   </div>
                   <div>
                     <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2 block">Au</label>
                     <input type="date" value={leaveForm.endDate} onChange={e => setLeaveForm({...leaveForm, endDate: e.target.value})} className="w-full p-3 bg-muted border-none rounded-xl" />
                   </div>
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2 block">Justification</label>
                  <textarea value={leaveForm.reason} onChange={e => setLeaveForm({...leaveForm, reason: e.target.value})} className="w-full p-3 bg-muted border-none rounded-xl h-24 resize-none" placeholder="Description courte..." />
                </div>
                <div className="flex gap-4 pt-4">
                  <button onClick={() => setShowLeaveModal(false)} className="flex-1 py-3 font-bold text-muted-foreground hover:text-foreground">Annuler</button>
                  <button onClick={requestLeave} className="flex-1 py-3 bg-primary text-primary-foreground rounded-xl font-bold shadow-lg shadow-primary/20 hover:opacity-90">Soumettre</button>
                </div>
              </div>
           </motion.div>
        </div>
      )}
    </AppLayoutWrapper>
  );
}
