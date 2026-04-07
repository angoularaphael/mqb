import { getStudentGroupIds } from '@/lib/data/student-queries';
import { getCourse, getDocument } from '@/lib/server/db-resources';

type DocRow = NonNullable<Awaited<ReturnType<typeof getDocument>>>;

export async function canAccessDocumentFile(userId: string, role: string, doc: DocRow): Promise<boolean> {
  if (role === 'admin') return true;
  if (doc.uploaded_by === userId) return true;

  if (role === 'teacher') {
    if (doc.visibility === 'public' || doc.visibility === 'students') return true;
    if (doc.course_id) {
      const c = await getCourse(doc.course_id);
      return c?.teacher_id === userId;
    }
    return false;
  }

  if (role === 'student') {
    if (doc.visibility === 'private') return false;
    if (doc.visibility === 'public') return true;
    if (doc.visibility === 'students' && !doc.course_id) return true;
    if (doc.course_id) {
      const gids = await getStudentGroupIds(userId);
      const c = await getCourse(doc.course_id);
      return !!(c && gids.includes(c.group_id));
    }
    return doc.visibility === 'students';
  }

  return false;
}

export async function loadDocumentIfAllowed(id: string, userId: string, role: string) {
  const doc = await getDocument(id);
  if (!doc) return null;
  const ok = await canAccessDocumentFile(userId, role, doc);
  return ok ? doc : null;
}
