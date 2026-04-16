'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { getCurrentUserAction } from '@/app/actions/auth';
import { AppLayoutWrapper } from '@/app/layout-wrapper';
import { fetchApi } from '@/lib/fetch-api';
import { 
  FileEdit, 
  Plus, 
  Trash2, 
  Eye, 
  CheckCircle2, 
  X, 
  ChevronRight, 
  Clock,
  LayoutList
} from 'lucide-react';

export default function TeacherExamsPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [exams, setExams] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  
  // Create Form State
  const [form, setForm] = useState({
    title: '',
    description: '',
    courseId: '',
    type: 'qcm',
    durationMinutes: '60',
    startDate: '',
    endDate: '',
    questions: [] as any[]
  });

  useEffect(() => {
    (async () => {
      const u = await getCurrentUserAction();
      if (!u || (u.role !== 'teacher' && u.role !== 'admin')) {
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
      let examsData = { exams: [] as any[] };
      let coursesData = { courses: [] as any[] };
      try {
        const [ex, co] = await Promise.all([
          fetchApi<{ exams: any[] }>('/api/teacher/exams'),
          fetchApi<{ courses: any[] }>('/api/teacher/courses')
        ]);
        examsData = ex;
        coursesData = co;
      } catch (e) {
        const meta = await fetchApi<{ courses: any[] }>('/api/admin/meta').catch(() => ({ courses: [] }));
        const ex = await fetchApi<{ exams: any[] }>('/api/teacher/exams').catch(() => ({ exams: [] }));
        examsData = ex;
        coursesData = meta;
      }
      
      setExams(examsData.exams || []);
      setCourses(coursesData.courses || []);
    } catch (e) {
      console.error(e);
    }
  };

  const addQuestion = () => {
    setForm({
      ...form,
      questions: [
        ...form.questions,
        { text: '', type: 'multiple_choice', points: 1, choices: [{ text: '', isCorrect: false }] }
      ]
    });
  };

  const addChoice = (qIdx: number) => {
    const newQs = [...form.questions];
    newQs[qIdx].choices.push({ text: '', isCorrect: false });
    setForm({ ...form, questions: newQs });
  };

  const handleCreate = async () => {
    await fetchApi('/api/teacher/exams', {
      method: 'POST',
      body: JSON.stringify(form)
    });
    setShowCreate(false);
    resetForm();
    await loadData();
  };

  const resetForm = () => {
    setForm({
      title: '',
      description: '',
      courseId: '',
      type: 'qcm',
      durationMinutes: '60',
      startDate: '',
      endDate: '',
      questions: []
    });
  };

  const togglePublish = async (id: string, current: boolean) => {
    await fetchApi(`/api/teacher/exams/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ isPublished: !current })
    });
    await loadData();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Supprimer cet examen ?')) return;
    await fetchApi(`/api/teacher/exams/${id}`, { method: 'DELETE' });
    await loadData();
  };

  if (isLoading) return <div className="flex min-h-screen items-center justify-center bg-background"><motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity }} className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full" /></div>;

  return (
    <AppLayoutWrapper user={user}>
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <LayoutList className="text-primary" /> Examens & Quizz
            </h1>
            <p className="text-muted-foreground mt-1">Créez et gérez vos évaluations</p>
          </div>
          <button 
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 transition shadow-lg"
          >
            <Plus size={18} /> Créer un examen
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {exams.map((exam) => (
            <motion.div 
              key={exam.id}
              layout
              className="bg-card border border-border rounded-xl overflow-hidden hover:shadow-xl transition-all group"
            >
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${exam.isPublished ? 'bg-green-500/10 text-green-500' : 'bg-yellow-500/10 text-yellow-500'}`}>
                    {exam.isPublished ? 'Publié' : 'Brouillon'}
                  </span>
                  <div className="flex gap-2">
                    <button onClick={() => togglePublish(exam.id, exam.isPublished)} className="p-1.5 hover:bg-muted rounded text-muted-foreground" title={exam.isPublished ? 'Dépublier' : 'Publier'}>
                      {exam.isPublished ? <X size={16} /> : <CheckCircle2 size={16} />}
                    </button>
                    <button onClick={() => handleDelete(exam.id)} className="p-1.5 hover:bg-destructive/10 rounded text-destructive">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
                
                <h3 className="font-bold text-xl mb-1 group-hover:text-primary transition-colors">{exam.title}</h3>
                <p className="text-sm text-muted-foreground line-clamp-2 min-h-[2.5rem] mb-4">{exam.description || 'Aucune description'}</p>
                
                <div className="space-y-2 mb-6">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <LayoutList size={14} /> {exam.courseName}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock size={14} /> {exam.durationMinutes} min
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => router.push(`/teacher/exams/${exam.id}`)}
                    className="flex-1 py-2 bg-muted text-foreground rounded-lg text-sm font-semibold hover:bg-accent transition flex items-center justify-center gap-2"
                  >
                    <Eye size={16} /> Voir / Corriger
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
          {exams.length === 0 && (
            <div className="col-span-full py-20 bg-muted/50 rounded-2xl border-2 border-dashed border-border flex flex-col items-center justify-center text-muted-foreground">
              <FileEdit size={48} className="mb-4 opacity-20" />
              <p>Aucun examen créé pour le moment</p>
            </div>
          )}
        </div>
      </div>

      {/* Fullscreen Create Modal */}
      <AnimatePresence>
        {showCreate && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-background flex flex-col"
          >
            <div className="flex items-center justify-between p-6 border-b border-border bg-card">
              <h2 className="text-2xl font-bold">Nouvel Examen</h2>
              <button 
                onClick={() => setShowCreate(false)}
                className="p-2 hover:bg-muted rounded-full transition"
              >
                <X size={24} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 lg:p-12">
              <div className="max-w-4xl mx-auto space-y-8">
                {/* Basic Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-card border border-border p-6 rounded-2xl">
                  <div className="space-y-4 md:col-span-2">
                    <label className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Titre de l'examen</label>
                    <input 
                      value={form.title}
                      onChange={e => setForm({...form, title: e.target.value})}
                      placeholder="Ex: Contrôle Continu S1 - Algorithmique"
                      className="w-full text-2xl font-bold bg-transparent border-b-2 border-border focus:border-primary outline-none py-2 transition-colors"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold">Cours</label>
                    <select 
                      value={form.courseId}
                      onChange={e => setForm({...form, courseId: e.target.value})}
                      className="w-full p-3 rounded-xl bg-muted border-none focus:ring-2 ring-primary"
                    >
                      <option value="">Choisir un cours</option>
                      {courses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold">Durée (minutes)</label>
                    <input 
                      type="number"
                      value={form.durationMinutes}
                      onChange={e => setForm({...form, durationMinutes: e.target.value})}
                      className="w-full p-3 rounded-xl bg-muted border-none focus:ring-2 ring-primary"
                    />
                  </div>
                </div>

                {/* Questions Section */}
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-bold">Questions ({form.questions.length})</h3>
                    <button 
                      onClick={addQuestion}
                      className="flex items-center gap-2 px-4 py-2 border-2 border-primary text-primary rounded-xl font-bold hover:bg-primary hover:text-white transition"
                    >
                      <Plus size={18} /> Ajouter une question
                    </button>
                  </div>

                  {form.questions.map((q, qIdx) => (
                    <motion.div 
                      key={qIdx}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-card border border-border rounded-2xl overflow-hidden"
                    >
                      <div className="p-6 space-y-4">
                        <div className="flex gap-4">
                          <input 
                            value={q.text}
                            onChange={e => {
                              const newQs = [...form.questions];
                              newQs[qIdx].text = e.target.value;
                              setForm({...form, questions: newQs});
                            }}
                            placeholder={`Question ${qIdx + 1}`}
                            className="flex-1 bg-transparent text-lg font-semibold border-b border-border focus:border-primary outline-none py-2"
                          />
                          <select 
                             value={q.type}
                             onChange={e => {
                               const newQs = [...form.questions];
                               newQs[qIdx].type = e.target.value;
                               setForm({...form, questions: newQs});
                             }}
                             className="p-2 bg-muted rounded-lg text-sm border-none"
                          >
                            <option value="multiple_choice">QCM</option>
                            <option value="open">Question ouverte</option>
                          </select>
                        </div>

                        {q.type === 'multiple_choice' && (
                          <div className="pl-6 space-y-3">
                            {q.choices.map((choice: any, cIdx: number) => (
                              <div key={cIdx} className="flex items-center gap-3">
                                <input 
                                  type="checkbox"
                                  checked={choice.isCorrect}
                                  onChange={e => {
                                    const newQs = [...form.questions];
                                    newQs[qIdx].choices[cIdx].isCorrect = e.target.checked;
                                    setForm({...form, questions: newQs});
                                  }}
                                  className="w-5 h-5 accent-primary"
                                />
                                <input 
                                  value={choice.text}
                                  onChange={e => {
                                    const newQs = [...form.questions];
                                    newQs[qIdx].choices[cIdx].text = e.target.value;
                                    setForm({...form, questions: newQs});
                                  }}
                                  placeholder={`Option ${cIdx + 1}`}
                                  className="flex-1 bg-muted px-4 py-2 rounded-lg text-sm border-none"
                                />
                                <button 
                                  onClick={() => {
                                    const newQs = [...form.questions];
                                    newQs[qIdx].choices.splice(cIdx, 1);
                                    setForm({...form, questions: newQs});
                                  }}
                                  className="text-muted-foreground hover:text-destructive"
                                >
                                  <X size={16} />
                                </button>
                              </div>
                            ))}
                            <button 
                              onClick={() => addChoice(qIdx)}
                              className="text-xs font-bold text-primary flex items-center gap-1 hover:underline"
                            >
                              <Plus size={14} /> Ajouter une option
                            </button>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-border bg-card">
              <div className="max-w-4xl mx-auto flex justify-end gap-4">
                <button 
                  onClick={() => setShowCreate(false)}
                  className="px-6 py-3 font-bold text-muted-foreground hover:text-foreground"
                >
                  Annuler
                </button>
                <button 
                  onClick={handleCreate}
                  disabled={!form.title || !form.courseId || form.questions.length === 0}
                  className="px-10 py-3 bg-primary text-primary-foreground rounded-xl font-bold shadow-lg shadow-primary/20 hover:opacity-90 disabled:opacity-50 transition flex items-center gap-2"
                >
                  Publier l'examen <ChevronRight size={18} />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </AppLayoutWrapper>
  );
}
