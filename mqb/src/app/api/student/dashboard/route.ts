import { NextResponse } from 'next/server';
import { requireStudentSession } from '@/lib/api-auth';
import {
  getStudentGradeAverage,
  getStudentHoursSummary,
  countStudentUnjustifiedAbsences,
  getStudentActivity,
  getStudentSchedule,
  getInboxPreviewForUser,
} from '@/lib/data/student-queries';

export async function GET() {
  const auth = await requireStudentSession();
  if ('response' in auth) return auth.response;
  const userId = auth.user.userId;

  const [average, hours, absences, activity, schedule, inboxPreview] = await Promise.all([
    getStudentGradeAverage(userId),
    getStudentHoursSummary(userId),
    countStudentUnjustifiedAbsences(userId),
    getStudentActivity(userId),
    getStudentSchedule(userId),
    getInboxPreviewForUser(userId, 8),
  ]);

  const dayLabels = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven'];
  const byDay = dayLabels.map((label, idx) => ({
    day: label,
    slots: schedule.filter((s) => s.dayIndex === idx).slice(0, 3),
  }));

  return NextResponse.json({
    stats: {
      averageLabel: average != null ? `${average}/20` : '—',
      hours: {
        plannedHours: hours.plannedHours,
        courseCount: hours.courseCount,
        coursesWithGrade: hours.coursesWithGrade,
      },
      absencesCount: absences,
    },
    activity,
    schedulePreview: byDay,
    inboxPreview,
  });
}
