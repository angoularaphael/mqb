'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter, useParams } from 'next/navigation';
import { getCurrentUserAction } from '@/app/actions/auth';
import { AppLayoutWrapper } from '@/app/layout-wrapper';
import { fetchApi } from '@/lib/fetch-api';
import { 
  ChevronLeft, 
  CheckCircle2, 
  User, 
  Clock, 
  Save, 
  AlertCircle,
  BarChart3
} from 'lucide-react';

export default function ExamCorrectionPage() {
  const router = useRouter();
  const params = useParams();
  const [user, setUser] = useState<any>(null);
  const [exam, setExam] = useState<any>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [selectedSubmission, setSelectedSubmission] = useState<any>(null);
  const [answers, setAnswers] = useState<any[]>([]);
  const [grades, setGrades] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const u = await getCurrentUserAction();
      if (!u || (u.role !== 'teacher' && u.role !== 'admin')) {
        router.push('/login');
        return;
      }
      setUser(u);
      await loadExamData();
      setIsLoading(false);
    })();
  }, [router]);

  const loadExamData = async () => {
    try {
      const data = await fetchApi<any>(`/api/teacher/exams/${params.id}`);
      setExam(data.exam);
      setQuestions(data.questions);
      setSubmissions(data.submissions || []);
    } catch (e) {
      console.error(e);
    }
  };

  const loadSubmissionDetail = async (sub: any) => {
    setIsLoading(true);
    setSelectedSubmission(sub);
    try {
      // In a real app we'd have a specific API for this, but let's assume we can fetch answers
      // We'll reuse the student answers data if available or create a new route
      const data = await fetchApi<{ answers: any[] }>(`/api/teacher/exams/submissions/${sub.id}/answers`);
      setAnswers(data.answers);
      const initGrades: Record<string, number> = {};
      data.answers.forEach(a => {
        initGrades[a.question_id] = a.points_awarded || 0;
      });
      setGrades(initGrades);
    } catch (e) {
      console.error(e);
    }
    setIsLoading(false);
  };

  const handleSaveGrade = async () => {
    setIsSaving(true);
    try {
      await fetchApi(`/api/teacher/exams/submissions/${selectedSubmission.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ questionGrades: grades })
      });
      alert('Correction enregistrée !');
      setSelectedSubmission(null);
      await loadExamData();
    } catch (e) {
      console.error(e);
      alert('Erreur lors de l\'enregistrement.');
    }
    setIsSaving(false);
  };

  if (isLoading && !exam) return <div className="flex min-h-screen items-center justify-center bg-background"><motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity }} className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full" /></div>;

  return (
    <AppLayoutWrapper user={user}>
      <div className="space-y-6">
        <button 
          onClick={() => selectedSubmission ? setSelectedSubmission(null) : router.push('/teacher/exams')}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition"
        >
          <ChevronLeft size={20} /> Retour
        </button>

        {!selectedSubmission ? (
          <>
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold">{exam.title}</h1>
                <p className="text-muted-foreground">Liste des copies soumises</p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {submissions.length === 0 ? (
                <div className="py-20 text-center bg-muted/30 rounded-2xl border-2 border-dashed border-border text-muted-foreground">
                  Aucune copie n'a encore été soumise pour cet examen.
                </div>
              ) : (
                submissions.map(sub => (
                  <div 
                    key={sub.id}
                    className="bg-card border border-border p-6 rounded-2xl flex items-center justify-between hover:shadow-lg transition-all"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-primary/10 text-primary rounded-full flex items-center justify-center">
                        <User size={24} />
                      </div>
                      <div>
                        <p className="font-bold">Étudiant #{sub.student_id.slice(0,8)}</p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock size={12} /> Soumis le {sub.submitted_at ? new Date(sub.submitted_at * 1000).toLocaleString() : 'En cours'}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground uppercase font-bold tracking-widest">Note</p>
                        <p className="text-xl font-black text-primary">{sub.score !== null ? `${sub.score}/20` : '--/20'}</p>
                      </div>
                      <button 
                        onClick={() => loadSubmissionDetail(sub)}
                        className={`px-6 py-2 rounded-xl font-bold transition ${sub.status === 'graded' ? 'bg-muted text-foreground' : 'bg-primary text-primary-foreground hover:opacity-90'}`}
                      >
                        {sub.status === 'graded' ? 'Revoir' : 'Corriger'}
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </>
        ) : (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
          >
            <div className="bg-card border border-border p-8 rounded-3xl shadow-xl">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-bold">Copie de l'étudiant</h2>
                <div className="flex items-center gap-4">
                   <div className="text-right">
                      <p className="text-xs font-bold text-muted-foreground uppercase">Score Actuel</p>
                      <p className="text-3xl font-black text-primary">
                        {Object.values(grades).reduce((a,b) => a+b, 0)}/20
                      </p>
                   </div>
                   <button 
                    onClick={handleSaveGrade}
                    disabled={isSaving}
                    className="flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-xl font-bold hover:opacity-90 transition disabled:opacity-50"
                   >
                     <Save size={20} /> {isSaving ? 'Enregistrement...' : 'Valider la note'}
                   </button>
                </div>
              </div>

              <div className="space-y-12">
                {questions.map((q, idx) => {
                  const ans = answers.find(a => a.question_id === q.id);
                  return (
                    <div key={q.id} className="space-y-4 border-l-4 border-muted pl-6">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <p className="text-xs font-bold text-muted-foreground uppercase mb-1">Question {idx + 1}</p>
                          <h3 className="text-lg font-semibold">{q.question_text}</h3>
                        </div>
                        <div className="flex items-center gap-2 bg-muted p-2 rounded-lg">
                          <input 
                            type="number"
                            max={q.points}
                            min={0}
                            step={0.5}
                            value={grades[q.id] || 0}
                            onChange={e => setGrades({...grades, [q.id]: Number(e.target.value)})}
                            className="w-16 bg-transparent text-center font-bold text-primary outline-none"
                          />
                          <span className="text-muted-foreground text-sm font-bold">/ {q.points} pts</span>
                        </div>
                      </div>

                      <div className="bg-muted/50 p-6 rounded-2xl">
                        <p className="text-xs font-bold text-muted-foreground uppercase mb-2">Réponse de l'étudiant :</p>
                        {q.type === 'multiple_choice' ? (
                          <div className="space-y-2">
                             {q.choices.map((c: any) => {
                               const isSelected = ans?.selected_choice_id === c.id;
                               return (
                                 <div key={c.id} className={`p-3 rounded-xl border flex items-center justify-between ${isSelected ? (c.is_correct ? 'bg-green-500/10 border-green-500/30' : 'bg-red-500/10 border-red-500/30') : 'border-border/50 opacity-50'}`}>
                                   <span className="text-sm">{c.choice_text}</span>
                                   {isSelected && (c.is_correct ? <CheckCircle2 className="text-green-500" size={16} /> : <AlertCircle className="text-red-500" size={16} />)}
                                 </div>
                               );
                             })}
                          </div>
                        ) : (
                          <p className="text-sm whitespace-pre-wrap italic">
                            {ans?.open_answer || "(Aucune réponse)"}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </AppLayoutWrapper>
  );
}
