'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { getCurrentUserAction } from '@/app/actions/auth';
import { AppLayoutWrapper } from '@/app/layout-wrapper';
import { fetchApi } from '@/lib/fetch-api';
import { 
  FileText, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  ChevronRight,
  GraduationCap
} from 'lucide-react';

export default function StudentExamsPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [exams, setExams] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const u = await getCurrentUserAction();
      if (!u) {
        router.push('/login');
        return;
      }
      setUser(u);
      await loadExams();
      setIsLoading(false);
    })();
  }, [router]);

  const loadExams = async () => {
    try {
      const data = await fetchApi<{ exams: any[] }>('/api/student/exams');
      setExams(data.exams || []);
    } catch (e) {
      console.error(e);
    }
  };

  if (isLoading) return <div className="flex min-h-screen items-center justify-center bg-background"><motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity }} className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full" /></div>;

  return (
    <AppLayoutWrapper user={user}>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <GraduationCap className="text-primary" /> Mes Examens & Quizz
          </h1>
          <p className="text-muted-foreground mt-1">Consultez et passez vos évaluations en ligne</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {exams.map((exam) => (
            <motion.div 
              key={exam.id}
              whileHover={{ y: -4 }}
              className="bg-card border border-border rounded-2xl overflow-hidden hover:shadow-lg transition-all"
            >
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="bg-primary/10 text-primary p-2 rounded-xl">
                    <FileText size={20} />
                  </div>
                  {exam.submission ? (
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                      exam.submission.status === 'graded' ? 'bg-green-500/10 text-green-500' : 'bg-blue-500/10 text-blue-500'
                    }`}>
                      {exam.submission.status === 'graded' 
                        ? `Note: ${exam.submission.score}/20` 
                        : 'Soumis - En cours de correction'
                      }
                    </span>
                  ) : (
                    <span className="px-2.5 py-1 bg-yellow-500/10 text-yellow-500 rounded-full text-xs font-bold flex items-center gap-1">
                      <AlertCircle size={12} /> À passer
                    </span>
                  )}
                </div>

                <h3 className="font-bold text-xl mb-1">{exam.title}</h3>
                <p className="text-sm text-muted-foreground mb-4">{exam.courseName}</p>
                
                <div className="flex items-center gap-4 text-sm text-muted-foreground mb-6">
                  <div className="flex items-center gap-1">
                    <Clock size={14} /> {exam.durationMinutes} min
                  </div>
                  {exam.startDate && (
                    <div className="flex items-center gap-1">
                      <CheckCircle size={14} /> Disponible
                    </div>
                  )}
                </div>

                {!exam.submission ? (
                  <button 
                    onClick={() => router.push(`/student/exams/${exam.id}`)}
                    className="w-full py-3 bg-primary text-primary-foreground rounded-xl font-bold hover:opacity-90 transition flex items-center justify-center gap-2"
                  >
                    Commencer l'examen <ChevronRight size={18} />
                  </button>
                ) : (
                  <button 
                    disabled
                    className="w-full py-3 bg-muted text-muted-foreground rounded-xl font-bold flex items-center justify-center gap-2"
                  >
                    Examen déjà effectué
                  </button>
                )}
              </div>
            </motion.div>
          ))}

          {exams.length === 0 && (
            <div className="col-span-full py-20 bg-muted/30 rounded-2xl border-2 border-dashed border-border text-center text-muted-foreground">
              <p>Aucun examen disponible pour le moment</p>
            </div>
          )}
        </div>
      </div>
    </AppLayoutWrapper>
  );
}
