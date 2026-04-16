import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/index';
import { teacher_clock, teacher_contracts, teacher_leaves, users } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { getCurrentUser } from '@/lib/auth';
import { v4 as uuid } from 'uuid';

// GET /api/admin/rh - Overview for admin
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const teachers = await db.select({
      id: users.id,
      firstName: users.first_name,
      lastName: users.last_name,
      email: users.email,
    }).from(users).where(eq(users.role, 'teacher'));

    const contracts = await db.select().from(teacher_contracts);
    const pendingLeaves = await db.select({
      id: teacher_leaves.id,
      teacherId: teacher_leaves.teacher_id,
      teacherFirstName: users.first_name,
      teacherLastName: users.last_name,
      type: teacher_leaves.type,
      startDate: teacher_leaves.start_date,
      endDate: teacher_leaves.end_date,
      reason: teacher_leaves.reason,
      status: teacher_leaves.status,
    })
    .from(teacher_leaves)
    .leftJoin(users, eq(teacher_leaves.teacher_id, users.id))
    .where(eq(teacher_leaves.status, 'pending'));

    const today = new Date().toISOString().split('T')[0];
    const todayClock = await db.select().from(teacher_clock).where(eq(teacher_clock.date, today));

    return NextResponse.json({ 
      teachers, 
      contracts, 
      pendingLeaves, 
      todayClock 
    });
  } catch (error) {
    console.error('GET /api/admin/rh error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/admin/rh/contracts - Create or update contract
export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'admin') return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

    const body = await req.json();
    const { teacherId, type, startDate, endDate, salary } = body;
    
    if (!teacherId || !type || !startDate) return NextResponse.json({ error: 'Champs manquants' }, { status: 400 });

    const id = uuid();
    await db.insert(teacher_contracts).values({
      id,
      teacher_id: teacherId,
      type,
      start_date: startDate,
      end_date: endDate || null,
      salary: salary ? parseFloat(salary) : null
    });

    return NextResponse.json({ id, message: 'Contrat créé' }, { status: 201 });
  } catch (error) {
    console.error('POST /api/admin/rh/contracts error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH /api/admin/rh/leaves/[id] - Approve/Reject leave
export async function PATCH(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'admin') return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

    const body = await req.json();
    const { leaveId, status } = body;

    if (!leaveId || !status) return NextResponse.json({ error: 'Champs manquants' }, { status: 400 });

    await db.update(teacher_leaves).set({ 
      status, 
      approved_by: user.userId,
      updated_at: Math.floor(Date.now() / 1000)
    }).where(eq(teacher_leaves.id, leaveId));

    return NextResponse.json({ message: `Congé ${status === 'approved' ? 'approuvé' : 'refusé'}` });
  } catch (error) {
    console.error('PATCH /api/admin/rh/leaves error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
