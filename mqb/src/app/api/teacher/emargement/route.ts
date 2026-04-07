import { NextResponse } from 'next/server';
import { requireStaffSession } from '@/lib/api-auth';
import {
  closeEmargementSession,
  countSignaturesForSession,
  createEmargementSession,
  getOpenEmargementSessionForSchedule,
  getSchedule,
  listSignedStudentIdsForSession,
  listStudentIdsInCourseGroup,
  teacherOwnsCourse,
} from '@/lib/server/db-resources';

export async function GET(request: Request) {
  const auth = await requireStaffSession();
  if ('response' in auth) return auth.response;
  if (auth.user.role !== 'teacher') return NextResponse.json({ error: 'Réservé aux enseignants' }, { status: 403 });
  const scheduleId = new URL(request.url).searchParams.get('scheduleId');
  if (!scheduleId) return NextResponse.json({ error: 'scheduleId requis' }, { status: 400 });
  const sch = await getSchedule(scheduleId);
  if (!sch) return NextResponse.json({ error: 'Créneau inconnu' }, { status: 404 });
  if (!(await teacherOwnsCourse(auth.user.userId, sch.course_id))) {
    return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
  }
  const session = await getOpenEmargementSessionForSchedule(scheduleId);
  const studentIds = await listStudentIdsInCourseGroup(sch.course_id);
  const total = studentIds.length;
  if (!session) {
    return NextResponse.json({ session: null, signedCount: 0, total, signedStudentIds: [] });
  }
  const signedStudentIds = await listSignedStudentIdsForSession(session.id);
  const signedCount = await countSignaturesForSession(session.id);
  return NextResponse.json({
    session: { id: session.id, status: session.status, createdAt: session.created_at },
    signedCount,
    total,
    signedStudentIds,
  });
}

export async function POST(request: Request) {
  const auth = await requireStaffSession();
  if ('response' in auth) return auth.response;
  if (auth.user.role !== 'teacher') return NextResponse.json({ error: 'Réservé aux enseignants' }, { status: 403 });
  let body: { action?: string; scheduleId?: string; sessionId?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'JSON invalide' }, { status: 400 });
  }
  if (body.action === 'open' && body.scheduleId) {
    const sch = await getSchedule(body.scheduleId);
    if (!sch) return NextResponse.json({ error: 'Créneau inconnu' }, { status: 404 });
    if (!(await teacherOwnsCourse(auth.user.userId, sch.course_id))) {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }
    const session = await createEmargementSession(auth.user.userId, body.scheduleId);
    const studentIds = await listStudentIdsInCourseGroup(sch.course_id);
    return NextResponse.json({
      session: session ? { id: session.id, status: session.status, createdAt: session.created_at } : null,
      total: studentIds.length,
      signedCount: session ? await countSignaturesForSession(session.id) : 0,
    });
  }
  if (body.action === 'close' && body.sessionId) {
    const closed = await closeEmargementSession(body.sessionId, auth.user.userId);
    if (!closed) return NextResponse.json({ error: 'Session introuvable ou déjà clôturée' }, { status: 400 });
    return NextResponse.json({ ok: true, session: { id: closed.id, status: closed.status } });
  }
  return NextResponse.json({ error: 'action invalide (open|close)' }, { status: 400 });
}
