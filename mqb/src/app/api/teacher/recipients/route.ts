import { NextResponse } from 'next/server';
import { requireStaffSession } from '@/lib/api-auth';
import { listTeachersAndAdmins } from '@/lib/data/student-queries';
import { listStudents } from '@/lib/server/db-resources';

export async function GET() {
  const auth = await requireStaffSession();
  if ('response' in auth) return auth.response;
  if (auth.user.role !== 'teacher') return NextResponse.json({ error: 'Réservé aux enseignants' }, { status: 403 });

  const [students, staff] = await Promise.all([listStudents(), listTeachersAndAdmins()]);
  const me = auth.user.userId;

  return NextResponse.json({
    students: students.map((s) => ({
      id: s.id,
      label: `${s.firstName} ${s.lastName}`.trim() || s.email,
      email: s.email,
    })),
    staff: staff
      .filter((s) => s.id !== me)
      .map((s) => ({
        id: s.id,
        label: s.label,
        email: s.email,
        role: s.role,
      })),
  });
}
