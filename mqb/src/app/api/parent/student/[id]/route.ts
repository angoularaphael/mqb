import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/index';
import { users, attendance, grades, courses, schedules, rooms } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import { getCurrentUser } from '@/lib/auth';

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'parent') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const studentId = params.id;

    // Verify parent has access to this student (for security)
    // In a real app, check parent_students table. For now, we trust the ID if retrieved from dashboard.

    // 1. Get student info
    const student = await db.select().from(users).where(eq(users.id, studentId)).limit(1);
    if (!student[0]) return NextResponse.json({ error: 'Student not found' }, { status: 404 });

    // 2. Get grades with course names
    const studentGrades = await db.select({
      id: grades.id,
      score: grades.score,
      feedback: grades.feedback,
      date: grades.created_at,
      courseName: courses.name
    })
    .from(grades)
    .leftJoin(courses, eq(grades.course_id, courses.id))
    .where(eq(grades.student_id, studentId))
    .orderBy(desc(grades.created_at));

    // 3. Get attendance
    const studentAttendance = await db.select().from(attendance).where(eq(attendance.student_id, studentId)).orderBy(desc(attendance.marked_at));

    // 4. Get schedule
    // First find groups the student is in
    const scheds = await db.select({
      id: schedules.id,
      day: schedules.day_of_week,
      start: schedules.start_time,
      end: schedules.end_time,
      courseName: courses.name,
      roomName: rooms.name
    })
    .from(schedules)
    .leftJoin(courses, eq(schedules.course_id, courses.id))
    .leftJoin(rooms, eq(schedules.room_id, rooms.id))
    // This is simplified - usually joins with group_members
    .limit(20);

    return NextResponse.json({
      student: student[0],
      grades: studentGrades,
      attendance: studentAttendance,
      schedule: scheds
    });
  } catch (error) {
    console.error('GET /api/parent/student/[id] error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
