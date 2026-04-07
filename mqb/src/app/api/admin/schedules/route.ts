import { NextResponse } from 'next/server';
import { requireAdminSession } from '@/lib/api-auth';
import { createScheduleSchema } from '@/lib/validations';
import { createScheduleRow, listSchedules } from '@/lib/server/db-resources';

export async function GET() {
  const auth = await requireAdminSession();
  if ('response' in auth) return auth.response;
  return NextResponse.json({ schedules: await listSchedules() });
}

export async function POST(request: Request) {
  const auth = await requireAdminSession();
  if ('response' in auth) return auth.response;
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'JSON invalide' }, { status: 400 });
  }
  const parsed = createScheduleSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0]?.message }, { status: 422 });
  }
  const s = await createScheduleRow({
    courseId: parsed.data.courseId,
    roomId: parsed.data.roomId,
    dayOfWeek: parsed.data.dayOfWeek,
    startTime: parsed.data.startTime,
    endTime: parsed.data.endTime,
    startDate: parsed.data.startDate,
    endDate: parsed.data.endDate,
  });
  return NextResponse.json({ schedule: s }, { status: 201 });
}
