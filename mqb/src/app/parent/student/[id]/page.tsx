'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useRouter, useParams } from 'next/navigation';
import { getCurrentUserAction } from '@/app/actions/auth';
import { AppLayoutWrapper } from '@/app/layout-wrapper';
import { fetchApi } from '@/lib/fetch-api';
import { 
  ArrowLeft, 
  GraduationCap, 
  Calendar, 
  Clock, 
  ClipboardList,
  CheckCircle2,
  AlertCircle,
  Clock3
} from 'lucide-react';

export default function ParentStudentDetail() {
  const router = useRouter();
  const params = useParams();
  const [user, setUser] = useState<any>(null);
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [tab, setTab] = useState<'grades' | 'attendance' | 'schedule'>('grades');

  useEffect(() => {
    (async () => {
      const u = await getCurrentUserAction();
      if (!u || u.role !== 'parent') {
        router.push('/login');
        return;
      }
      setUser(u);
      try {
        const d = await fetchApi<any>(`/api/parent/student/${params.id}`);
        setData(d);
      } catch (e) {
        console.error(e);
      }
      setIsLoading(false);
    })();
  }, [params.id, router]);

  if (isLoading) return <div className="flex min-h-screen items-center justify-center bg-background"><motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity }} className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full" /></div>;
  if (!data) return null;

  const { student, grades, attendance, schedule } = data;

  return (
    <AppLayoutWrapper user={user}>
      <div className="space-y-8">
        <button 
          onClick={() => router.push('/parent/dashboard')}
          className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition"
        >
          <ArrowLeft size={16} /> Retour au tableau de bord
        </button>

        <div className="flex items-center gap-4">
          <div className="w-20 h-20 rounded-3xl bg-primary/10 flex items-center justify-center text-primary font-bold text-2xl">
            {student.first_name[0]}{student.last_name[0]}
          </div>
          <div>
            <h1 className="text-3xl font-bold">{student.first_name} {student.last_name}</h1>
            <p className="text-muted-foreground">Profil de l'enfant • ID: {student.id.slice(0, 8)}</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 border-b border-border overflow-x-auto pb-1">
          {[
            { id: 'grades', label: 'Notes & Résultats', icon: GraduationCap },
            { id: 'attendance', label: 'Assiduité', icon: Calendar },
            { id: 'schedule', label: 'Emploi du temps', icon: Clock }
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id as any)}
              className={`flex items-center gap-2 px-6 py-3 font-medium transition whitespace-nowrap border-b-2 ${
                tab === t.id ? 'border-primary text-primary' : 'border-transparent text-muted-foreground'
              }`}
            >
              <t.icon size={18} /> {t.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="min-h-[400px]">
          {tab === 'grades' && (
            <div className="space-y-4">
              {grades.map((g: any) => (
                <div key={g.id} className="bg-card border border-border p-6 rounded-2xl flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="font-bold text-lg">{g.courseName}</h3>
                    <p className="text-sm text-muted-foreground">Évaluation du {new Date(g.date * 1000).toLocaleDateString()}</p>
                    {g.feedback && <p className="text-sm mt-2 italic text-muted-foreground">"{g.feedback}"</p>}
                  </div>
                  <div className="text-right">
                    <span className={`text-3xl font-black ${g.score >= 10 ? 'text-primary' : 'text-red-500'}`}>
                      {g.score}/{g.maxScore}
                    </span>
                  </div>
                </div>
              ))}
              {grades.length === 0 && <p className="text-center text-muted-foreground py-12">Aucune note enregistrée</p>}
            </div>
          )}

          {tab === 'attendance' && (
            <div className="bg-card border border-border rounded-2xl overflow-hidden">
               <table className="w-full text-sm">
                  <thead className="bg-muted text-muted-foreground text-left">
                    <tr>
                      <th className="p-4 font-medium">Date</th>
                      <th className="p-4 font-medium">Cours</th>
                      <th className="p-4 font-medium">Statut</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {attendance.map((a: any) => (
                      <tr key={a.id} className="hover:bg-muted/50 transition">
                        <td className="p-4 font-medium">{new Date(a.created_at * 1000).toLocaleDateString()}</td>
                        <td className="p-4">Cours #{a.schedule_id.slice(0, 5)}</td>
                        <td className="p-4">
                          {a.status === 'present' && <span className="flex items-center gap-1.5 text-green-500 font-bold"><CheckCircle2 size={14} /> Présent</span>}
                          {a.status === 'absent' && <span className="flex items-center gap-1.5 text-red-500 font-bold"><AlertCircle size={14} /> Absent</span>}
                          {a.status === 'late' && <span className="flex items-center gap-1.5 text-yellow-500 font-bold"><Clock3 size={14} /> Retard</span>}
                        </td>
                      </tr>
                    ))}
                    {attendance.length === 0 && <tr><td colSpan={3} className="p-12 text-center text-muted-foreground">Historique d'assiduité vide</td></tr>}
                  </tbody>
               </table>
            </div>
          )}

          {tab === 'schedule' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
               {schedule.map((s: any) => (
                 <div key={s.id} className="bg-card border border-border p-5 rounded-2xl">
                   <div className="flex items-start justify-between mb-3">
                     <span className="bg-primary/10 text-primary p-2 rounded-lg"><Clock size={18} /></span>
                     <span className="text-xs bg-muted px-2 py-1 rounded-md font-bold uppercase">{['Lun','Mar','Mer','Jeu','Ven','Sam','Dim'][s.day]}</span>
                   </div>
                   <h4 className="font-bold text-lg">{s.courseName}</h4>
                   <p className="text-sm text-muted-foreground mb-4">{s.roomName}</p>
                   <div className="flex items-center gap-2 text-sm font-bold bg-muted p-2 rounded-xl justify-center">
                     {s.start} - {s.end}
                   </div>
                 </div>
               ))}
               {schedule.length === 0 && <p className="col-span-full text-center text-muted-foreground py-12">Emploi du temps non disponible</p>}
            </div>
          )}
        </div>
      </div>
    </AppLayoutWrapper>
  );
}
