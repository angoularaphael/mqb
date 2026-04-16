'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { getCurrentUserAction } from '@/app/actions/auth';
import { AppLayoutWrapper } from '@/app/layout-wrapper';
import { fetchApi } from '@/lib/fetch-api';
import { 
  Users, 
  ChevronRight, 
  UserCircle, 
  BarChart3, 
  CalendarCheck, 
  Mail,
  ArrowUpRight
} from 'lucide-react';

export default function ParentDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [children, setChildren] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const u = await getCurrentUserAction();
      if (!u || u.role !== 'parent') {
        router.push('/login');
        return;
      }
      setUser(u);
      try {
        const data = await fetchApi<{ children: any[] }>('/api/parent/dashboard');
        setChildren(data.children || []);
      } catch (e) {
        console.error(e);
      }
      setIsLoading(false);
    })();
  }, [router]);

  if (isLoading) return <div className="flex min-h-screen items-center justify-center bg-background"><motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity }} className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full" /></div>;

  return (
    <AppLayoutWrapper user={user}>
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-8"
      >
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
              <Users className="text-primary" /> Portail Parent
            </h1>
            <p className="text-muted-foreground mt-1">Bienvenue dans votre espace de suivi scolaire</p>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 border border-border rounded-lg bg-card hover:bg-muted transition text-sm font-medium">
            <Mail size={16} /> Contacter l'administration
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {children.map((child) => (
            <motion.div 
              key={child.id}
              whileHover={{ y: -4 }}
              onClick={() => router.push(`/parent/student/${child.id}`)}
              className="bg-card border border-border rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all cursor-pointer group"
            >
              <div className="p-6">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                    {child.avatar ? (
                      <img src={child.avatar} alt={child.firstName} className="w-full h-full rounded-full object-cover" />
                    ) : (
                      <UserCircle size={40} />
                    )}
                  </div>
                  <div className="flex-1">
                    <h2 className="text-xl font-bold group-hover:text-primary transition-colors">{child.firstName} {child.lastName}</h2>
                    <p className="text-sm text-muted-foreground">{child.email}</p>
                  </div>
                  <ArrowUpRight className="text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-muted p-4 rounded-xl text-center">
                    <BarChart3 size={18} className="mx-auto mb-2 text-primary" />
                    <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Moyenne</p>
                    <p className="text-lg font-black">{child.average || 'N/A'}</p>
                  </div>
                  <div className="bg-muted p-4 rounded-xl text-center">
                    <CalendarCheck size={18} className="mx-auto mb-2 text-green-500" />
                    <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Présences</p>
                    <p className="text-lg font-black">{child.attendanceStats.present}</p>
                  </div>
                  <div className="bg-muted p-4 rounded-xl text-center">
                    <CalendarCheck size={18} className="mx-auto mb-2 text-red-500" />
                    <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Absences</p>
                    <p className="text-lg font-black">{child.attendanceStats.absent}</p>
                  </div>
                </div>

                <button className="w-full mt-6 py-3 bg-muted rounded-xl text-sm font-bold flex items-center justify-center gap-2 group-hover:bg-primary group-hover:text-white transition-all">
                  Voir les détails <ChevronRight size={16} />
                </button>
              </div>
            </motion.div>
          ))}

          {children.length === 0 && (
            <div className="col-span-full py-20 bg-muted/50 rounded-2xl border-2 border-dashed border-border text-center text-muted-foreground">
              <UserCircle size={48} className="mx-auto mb-4 opacity-20" />
              <p className="text-lg font-medium">Aucun enfant n'est actuellement rattaché à votre compte.</p>
              <p className="text-sm">Veuillez contacter le secrétariat pour lier vos enfants.</p>
            </div>
          )}
        </div>
      </motion.div>
    </AppLayoutWrapper>
  );
}
