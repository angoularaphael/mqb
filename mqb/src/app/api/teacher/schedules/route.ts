import { NextResponse } from 'next/server';
import { requireStaffSession } from '@/lib/api-auth';
import {
  listCoursesForTeacher,
  listRooms,
  listSchedulesForTeacher,
} from '@/lib/server/db-resources';
import { dedupeTeacherSchedules } from '@/lib/schedule-display';

export async function GET(request: Request) {
  const auth = await requireStaffSession();
  if ('response' in auth) return auth.response;
  if (auth.user.role !== 'teacher') return NextResponse.json({ error: 'Réservé aux enseignants' }, { status: 403 });

  const dedupe = new URL(request.url).searchParams.get('dedupe') === '1';

  const schedules = await listSchedulesForTeacher(auth.user.userId);
  const courses = await listCoursesForTeacher(auth.user.userId);
  const courseById = new Map(courses.map((c) => [c.id, c]));
  const rooms = await listRooms();
  const roomById = new Map(rooms.map((r) => [r.id, r]));

  const enriched = schedules.map((s) => {
    const c = courseById.get(s.course_id);
    const r = roomById.get(s.room_id);
    return {
      ...s,
      courseCode: c?.code ?? null,
      courseName: c?.name ?? null,
      roomName: r?.name ?? null,
    };
  });

  if (dedupe) {
    const merged = dedupeTeacherSchedules(enriched);
    return NextResponse.json({ schedules: merged, deduped: true });
  }

  return NextResponse.json({ schedules: enriched, deduped: false });
}
