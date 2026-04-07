'use client';

import { AppLayoutWrapper } from '@/app/layout-wrapper';
import { getCurrentUserAction } from '@/app/actions/auth';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Download, FileText } from 'lucide-react';
import { canAccessStudentArea } from '@/lib/roles';
import { fetchApi } from '@/lib/fetch-api';

type Doc = { id: string; name: string; course: string; size: string; date: string; filePath: string };

type DocsPayload = { documents: Doc[] };

export default function StudentDocuments() {
  const router = useRouter();
  const [user, setUser] = useState<Record<string, unknown> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [documents, setDocuments] = useState<Doc[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      const currentUser = await getCurrentUserAction();
      if (!currentUser || !canAccessStudentArea(currentUser.role)) {
        router.push('/login');
        return;
      }
      setUser(currentUser);
      try {
        const d = await fetchApi<DocsPayload>('/api/student/documents');
        setDocuments(d.documents);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Erreur');
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [router]);

  if (isLoading) return null;
  if (!user) return null;

  return (
    <AppLayoutWrapper user={user}>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
        <div>
          <h1 className="text-4xl font-bold mb-2">Documents</h1>
          <p className="text-muted-foreground">Fichiers visibles selon la visibilité en base (public / étudiants / cours)</p>
        </div>

        {error && (
          <div className="p-3 rounded-lg border border-destructive/40 text-sm">{error}</div>
        )}

        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <div className="divide-y divide-border">
            {documents.length === 0 ? (
              <p className="p-6 text-muted-foreground text-sm">Aucun document partagé pour le moment.</p>
            ) : (
              documents.map((doc, idx) => (
                <motion.div
                  key={doc.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="p-4 flex items-center justify-between group"
                >
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <FileText size={32} className="text-primary flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-foreground truncate">{doc.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {doc.course} • {doc.size} • {doc.date}
                      </p>
                      <p className="text-xs text-muted-foreground truncate mt-1">ID : {doc.id}</p>
                    </div>
                  </div>
                  <a
                    href={`/api/documents/${doc.id}/file`}
                    className="p-2 text-primary opacity-80 hover:opacity-100"
                    title="Télécharger (authentification requise)"
                  >
                    <Download size={20} />
                  </a>
                </motion.div>
              ))
            )}
          </div>
        </div>
      </motion.div>
    </AppLayoutWrapper>
  );
}
