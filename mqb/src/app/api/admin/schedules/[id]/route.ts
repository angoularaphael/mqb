import { NextResponse } from 'next/server';
import { requireAdminSession } from '@/lib/api-auth';
import { z } from 'zod';
import { deleteScheduleRow, getSchedule, updateScheduleRow } from '@/lib/server/db-resources';

const patchSchema = z.object({
  courseId: z.string().optional(),
  roomId: z.string().optional(),
  dayOfWeek: z.coerce.number().min(0).max(6).optional(),
  startTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  endTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdminSession();
  if ('response' in auth) return auth.response;
  const { id } = await params;
  if (!(await getSchedule(id))) return NextResponse.json({ error: 'Introuvable' }, { status: 404 });
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'JSON invalide' }, { status: 400 });
  }
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0]?.message }, { status: 422 });
  }
  const d = parsed.data;
  const s = await updateScheduleRow(id, {
    courseId: d.courseId,
    roomId: d.roomId,
    dayOfWeek: d.dayOfWeek,
    startTime: d.startTime,
    endTime: d.endTime,
    startDate: d.startDate,
    endDate: d.endDate,
  });
  return NextResponse.json({ schedule: s });
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdminSession();
  if ('response' in auth) return auth.response;
  const { id } = await params;
  if (!(await getSchedule(id))) return NextResponse.json({ error: 'Introuvable' }, { status: 404 });
  await deleteScheduleRow(id);
  return NextResponse.json({ ok: true });
}
