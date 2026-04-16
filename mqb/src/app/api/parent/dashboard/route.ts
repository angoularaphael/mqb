import { NextResponse } from 'next/server';
import { db } from '@/db/index';
import { parent_students, users, attendance, grades } from '@/db/schema';
import { eq, inArray } from 'drizzle-orm';
import { getCurrentUser } from '@/lib/auth';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'parent') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // 1. Get linked children
    const links = await db.select().from(parent_students).where(eq(parent_students.parent_id, user.userId));
    const studentIds = links.map(l => l.student_id);

    if (studentIds.length === 0) {
      return NextResponse.json({ children: [] });
    }

    // 2. Get children details
    const children = await db.select({
      id: users.id,
      firstName: users.first_name,
      lastName: users.last_name,
      email: users.email,
      avatar: users.avatar_url
    }).from(users).where(inArray(users.id, studentIds));

    // 3. Get recent attendance and grades for all children
    const allAttendance = await db.select().from(attendance).where(inArray(attendance.student_id, studentIds));
    const allGrades = await db.select().from(grades).where(inArray(grades.student_id, studentIds));

    const result = children.map(child => {
      const childAttendance = allAttendance.filter(a => a.student_id === child.id);
      const childGrades = allGrades.filter(g => g.student_id === child.id);
      
      return {
        ...child,
        attendanceStats: {
          present: childAttendance.filter(a => a.status === 'present').length,
          absent: childAttendance.filter(a => a.status === 'absent').length,
          late: childAttendance.filter(a => a.status === 'late').length,
        },
        recentGrades: childGrades.slice(-5),
        average: childGrades.length > 0 
          ? (childGrades.reduce((acc, g) => acc + g.score, 0) / childGrades.length).toFixed(2)
          : null
      };
    });

    return NextResponse.json({ children: result });
  } catch (error) {
    console.error('GET /api/parent/dashboard error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
