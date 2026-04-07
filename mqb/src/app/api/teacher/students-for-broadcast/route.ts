import { NextResponse } from 'next/server';
import { inArray } from 'drizzle-orm';
import { requireStaffSession } from '@/lib/api-auth';
import { db } from '@/db/index';
import { users } from '@/db/schema';
import { listStudentIdsForTeacher } from '@/lib/server/db-resources';

export async function GET() {
  const auth = await requireStaffSession();
  if ('response' in auth) return auth.response;
  if (auth.user.role !== 'teacher') return NextResponse.json({ error: 'Réservé aux enseignants' }, { status: 403 });
  const ids = await listStudentIdsForTeacher(auth.user.userId);
  if (!ids.length) return NextResponse.json({ students: [] });
  const rows = await db
    .select({
      id: users.id,
      firstName: users.first_name,
      lastName: users.last_name,
      email: users.email,
    })
    .from(users)
    .where(inArray(users.id, ids));
  return NextResponse.json({
    students: rows.map((s) => ({
      id: s.id,
      label: `${s.firstName} ${s.lastName}`.trim() || s.email,
      email: s.email,
    })),
  });
}
