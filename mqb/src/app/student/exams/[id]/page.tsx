'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter, useParams } from 'next/navigation';
import { getCurrentUserAction } from '@/app/actions/auth';
import { fetchApi } from '@/lib/fetch-api';
import { 
  Clock, 
  Send, 
  ChevronRight, 
  ChevronLeft, 
  AlertCircle,
  CheckCircle2,
  X
} from 'lucide-react';

export default function TakeExamPage() {
  const router = useRouter();
  const params = useParams();
  const [user, setUser] = useState<any>(null);
  const [exam, setExam] = useState<any>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<any[]>([]);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [score, setScore] = useState<number | null>(null);

  useEffect(() => {
    (async () => {
      const u = await getCurrentUserAction();
      if (!u) { router.push('/login'); return; }
      setUser(u);
      await loadExam();
    })();
  }, [router]);

  const loadExam = async () => {
    try {
      const data = await fetchApi<{ exam: any, questions: any[], submission: any }>(`/api/teacher/exams/${params.id}`);
      
      // Check if already submitted
      if (data.submission && data.submission.status !== 'in_progress') {
        setScore(data.submission.score);
        setIsFinished(true);
        setIsLoading(false);
        return;
      }

      setExam(data.exam);
      setQuestions(data.questions);
      
      const duration = data.exam.duration_minutes || data.exam.durationMinutes || 60;
      setTimeLeft(duration * 60);
      
      // Init answers
      setAnswers(data.questions.map(q => ({
        questionId: q.id,
        selectedChoiceId: null,
        openAnswer: ''
      })));
      
      setIsLoading(false);
    } catch (e) {
      console.error(e);
      router.push('/student/exams');
    }
  };

  const handleSubmit = useCallback(async () => {
    if (isSubmitting || isFinished) return;
    setIsSubmitting(true);
    try {
      const result = await fetchApi<{ score: number | null }>('/api/student/exams', {
        method: 'POST',
        body: JSON.stringify({
          examId: params.id,
          answers: answers
        })
      });
      setScore(result.score);
      setIsFinished(true);
    } catch (e) {
      console.error(e);
      alert('Erreur lors de la soumission de l\'examen.');
    } finally {
      setIsSubmitting(false);
    }
  }, [answers, params.id, isSubmitting, isFinished]);

  useEffect(() => {
    if (isLoading || isFinished || timeLeft === null) return;

    if (timeLeft <= 0) {
      if (!isFinished) handleSubmit();
      return;
    }
    const timer = setInterval(() => setTimeLeft(prev => (prev !== null ? prev - 1 : null)), 1000);
    return () => clearInterval(timer);
  }, [timeLeft, isFinished, handleSubmit, isLoading]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const updateAnswer = (qIdx: number, value: any, type: 'choice' | 'open') => {
    const newAns = [...answers];
    if (type === 'choice') newAns[qIdx].selectedChoiceId = value;
    else newAns[qIdx].openAnswer = value;
    setAnswers(newAns);
  };

  if (isLoading) return <div className="flex min-h-screen items-center justify-center bg-background"><motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity }} className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full" /></div>;

  if (isFinished) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-card border border-border p-12 rounded-3xl max-w-xl w-full text-center shadow-2xl"
        >
          <div className="w-20 h-20 bg-green-500/10 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 size={48} />
          </div>
          <h1 className="text-3xl font-bold mb-4">Examen terminé !</h1>
          <p className="text-muted-foreground mb-8">Votre copie a été soumise avec succès.</p>
          
          {score !== null ? (
            <div className="bg-muted p-6 rounded-2xl mb-8">
              <p className="text-sm font-bold uppercase tracking-widest text-muted-foreground mb-2">Votre Note finale</p>
              <p className="text-5xl font-black text-primary">{score}/20</p>
            </div>
          ) : (
            <div className="bg-muted p-6 rounded-2xl mb-8">
              <p className="text-sm font-bold text-muted-foreground">Cet examen contient des questions ouvertes. Un enseignant corrigera votre copie prochainement.</p>
            </div>
          )}

          <button 
            onClick={() => router.push('/student/exams')}
            className="w-full py-4 bg-primary text-primary-foreground rounded-2xl font-bold hover:opacity-90 transition"
          >
            Retourner au portail
          </button>
        </motion.div>
      </div>
    );
  }

  const currentQuestion = questions[currentQ];

  return (
    <div className="min-h-screen bg-muted/30 flex flex-col">
      {/* Header */}
      <div className="bg-card border-b border-border p-4 sticky top-0 z-50">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="font-bold text-lg">{exam.title}</h1>
            <p className="text-xs text-muted-foreground">{exam.courseName}</p>
          </div>
          <div className={`flex items-center gap-2 px-4 py-2 rounded-xl font-mono font-bold ${timeLeft !== null && timeLeft < 300 ? 'bg-red-500 text-white' : 'bg-primary/10 text-primary'}`}>
            <Clock size={18} /> {timeLeft !== null ? formatTime(timeLeft) : '--:--'}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 lg:p-12">
        <div className="max-w-3xl mx-auto space-y-8">
          {/* Progress Bar */}
          <div className="w-full bg-muted rounded-full h-2 overflow-hidden flex">
            {questions.map((_, idx) => (
              <div 
                key={idx} 
                className={`flex-1 h-full border-r border-background last:border-none transition-colors ${
                  idx === currentQ ? 'bg-primary' : 
                  answers[idx]?.selectedChoiceId || answers[idx]?.openAnswer ? 'bg-primary/40' : 'bg-muted-foreground/20'
                }`}
              />
            ))}
          </div>

          <div className="flex items-center justify-between text-sm font-bold text-muted-foreground">
            <span>QUESTION {currentQ + 1} SUR {questions.length}</span>
            <span>{Math.round(((currentQ + 1) / questions.length) * 100)}%</span>
          </div>

          <motion.div 
            key={currentQ}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-card border border-border p-8 lg:p-12 rounded-3xl shadow-xl shadow-primary/5 space-y-8"
          >
            <h2 className="text-2xl font-bold leading-tight">{currentQuestion.question_text}</h2>

            {currentQuestion.type === 'multiple_choice' ? (
              <div className="space-y-3">
                {currentQuestion.choices.map((choice: any) => (
                  <button
                    key={choice.id}
                    onClick={() => updateAnswer(currentQ, choice.id, 'choice')}
                    className={`w-full p-5 text-left rounded-2xl border-2 transition-all flex items-center justify-between group ${
                      answers[currentQ].selectedChoiceId === choice.id 
                        ? 'border-primary bg-primary/5' 
                        : 'border-muted hover:border-primary/50'
                    }`}
                  >
                    <span className={`font-medium ${answers[currentQ].selectedChoiceId === choice.id ? 'text-primary' : 'text-foreground'}`}>
                      {choice.choice_text}
                    </span>
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                      answers[currentQ].selectedChoiceId === choice.id ? 'border-primary bg-primary' : 'border-muted'
                    }`}>
                      {answers[currentQ].selectedChoiceId === choice.id && <div className="w-2 h-2 rounded-full bg-white" />}
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <textarea 
                value={answers[currentQ].openAnswer}
                onChange={e => updateAnswer(currentQ, e.target.value, 'open')}
                placeholder="Écrivez votre réponse ici..."
                className="w-full p-6 bg-muted rounded-3xl min-h-[250px] outline-none focus:ring-2 ring-primary transition-all resize-none"
              />
            )}
          </motion.div>

          <div className="flex items-center justify-between gap-4">
            <button 
              onClick={() => setCurrentQ(prev => prev - 1)}
              disabled={currentQ === 0}
              className="px-6 py-4 rounded-2xl font-bold flex items-center gap-2 hover:bg-muted disabled:opacity-0 transition"
            >
              <ChevronLeft size={20} /> Précédent
            </button>

            {currentQ === questions.length - 1 ? (
              <button 
                onClick={() => { if(confirm('Soumettre votre copie ?')) handleSubmit(); }}
                disabled={isSubmitting}
                className="px-10 py-4 bg-primary text-primary-foreground rounded-2xl font-bold flex items-center gap-2 hover:opacity-90 shadow-xl shadow-primary/20 transition"
              >
                {isSubmitting ? 'Envoi...' : 'Terminer l\'examen'} <Send size={20} />
              </button>
            ) : (
              <button 
                onClick={() => setCurrentQ(prev => prev + 1)}
                className="px-10 py-4 bg-foreground text-background rounded-2xl font-bold flex items-center gap-2 hover:opacity-90 transition"
              >
                Suivant <ChevronRight size={20} />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
