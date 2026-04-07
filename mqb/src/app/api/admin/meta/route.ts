import { NextResponse } from 'next/server';
import { requireAdminSession } from '@/lib/api-auth';
import {
  listCourses,
  listGroups,
  listRooms,
  listTeachers,
  listStudents,
} from '@/lib/server/db-resources';

export async function GET() {
  const auth = await requireAdminSession();
  if ('response' in auth) return auth.response;
  const [groups, rooms, teachers, students, courses] = await Promise.all([
    listGroups(),
    listRooms(),
    listTeachers(),
    listStudents(),
    listCourses(),
  ]);
  return NextResponse.json({ groups, rooms, teachers, students, courses });
}
