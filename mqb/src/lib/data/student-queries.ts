import { db } from '@/db/index';
import {
  users,
  group_members,
  courses,
  grades,
  attendance,
  schedules,
  rooms,
  documents,
  messages,
  requests,
  wifi_codes,
  activity_logs,
} from '@/db/schema';
import { eq, and, or, desc, inArray, sql, gt, asc, type SQL } from 'drizzle-orm';
import { alias } from 'drizzle-orm/sqlite-core';

const msgSender = alias(users, 'msg_sender');
const msgRecipient = alias(users, 'msg_recipient');

/** Aperçu messagerie directe (tableau de bord) : reçus + envoyés. */
export async function getInboxPreviewForUser(userId: string, limit = 8) {
  const rows = await db
    .select({
      id: messages.id,
      senderId: messages.sender_id,
      recipientId: messages.recipient_id,
      title: messages.title,
      content: messages.content,
      createdAt: messages.created_at,
      isRead: messages.is_read,
      type: messages.type,
      senderFirst: msgSender.first_name,
      senderLast: msgSender.last_name,
      recipientFirst: msgRecipient.first_name,
      recipientLast: msgRecipient.last_name,
    })
    .from(messages)
    .innerJoin(msgSender, eq(messages.sender_id, msgSender.id))
    .leftJoin(msgRecipient, eq(messages.recipient_id, msgRecipient.id))
    .where(
      and(
        eq(messages.type, 'direct'),
        or(eq(messages.recipient_id, userId), eq(messages.sender_id, userId)),
      ),
    )
    .orderBy(desc(messages.created_at))
    .limit(limit);

  return rows.map((r) => {
    const fromMe = r.senderId === userId;
    const peerName = fromMe
      ? `${r.recipientFirst ?? ''} ${r.recipientLast ?? ''}`.trim() || 'Destinataire'
      : `${r.senderFirst} ${r.senderLast}`.trim();
    return {
      id: r.id,
      fromMe,
      peerName,
      title: r.title?.trim() ? r.title.trim() : '(Sans titre)',
      preview: (r.content ?? '').slice(0, 140),
      date: r.createdAt ? new Date(r.createdAt * 1000).toISOString().slice(0, 10) : '',
      read: Boolean(r.isRead),
    };
  });
}

export async function getStudentGroupIds(studentId: string): Promise<string[]> {
  const rows = await db
    .select({ gid: group_members.group_id })
    .from(group_members)
    .where(eq(group_members.user_id, studentId));
  return rows.map((r) => r.gid);
}

export async function getStudentCourseIds(studentId: string): Promise<string[]> {
  const gids = await getStudentGroupIds(studentId);
  if (!gids.length) return [];
  const rows = await db
    .select({ id: courses.id })
    .from(courses)
    .where(inArray(courses.group_id, gids));
  return rows.map((r) => r.id);
}

export async function getStudentGrades(studentId: string) {
  const rows = await db
    .select({
      courseName: courses.name,
      score: grades.score,
      feedback: grades.feedback,
      courseId: courses.id,
    })
    .from(grades)
    .innerJoin(courses, eq(grades.course_id, courses.id))
    .where(eq(grades.student_id, studentId));

  return rows.map((r) => ({
    name: r.courseName,
    grade: r.score,
    max: 20,
    progress: Math.min(100, Math.round((r.score / 20) * 100)),
    feedback: r.feedback,
    courseId: r.courseId,
  }));
}

export async function getStudentGradeAverage(studentId: string): Promise<number | null> {
  const [row] = await db
    .select({ avg: sql<number | null>`avg(${grades.score})` })
    .from(grades)
    .where(eq(grades.student_id, studentId));
  if (row?.avg == null || Number.isNaN(Number(row.avg))) return null;
  return Math.round(Number(row.avg) * 10) / 10;
}

export async function getStudentHoursSummary(studentId: string): Promise<{
  plannedHours: number;
  courseCount: number;
  coursesWithGrade: number;
}> {
  const gids = await getStudentGroupIds(studentId);
  if (!gids.length) return { plannedHours: 0, courseCount: 0, coursesWithGrade: 0 };
  const courseRows = await db
    .select({ hours: courses.hours_total })
    .from(courses)
    .where(inArray(courses.group_id, gids));
  const plannedHours = courseRows.reduce((a, c) => a + (Number(c.hours) || 0), 0);
  const graded = await db
    .select({ courseId: grades.course_id })
    .from(grades)
    .where(eq(grades.student_id, studentId));
  const coursesWithGrade = new Set(graded.map((g) => g.courseId)).size;
  return {
    plannedHours,
    courseCount: courseRows.length,
    coursesWithGrade,
  };
}

export async function countStudentUnjustifiedAbsences(studentId: string): Promise<number> {
  const rows = await db
    .select({ id: attendance.id })
    .from(attendance)
    .where(and(eq(attendance.student_id, studentId), eq(attendance.status, 'absent')));
  return rows.length;
}

export async function getStudentAttendanceRecords(studentId: string) {
  const rows = await db
    .select({
      markedAt: attendance.marked_at,
      status: attendance.status,
      courseName: courses.name,
    })
    .from(attendance)
    .innerJoin(schedules, eq(attendance.schedule_id, schedules.id))
    .innerJoin(courses, eq(schedules.course_id, courses.id))
    .where(eq(attendance.student_id, studentId))
    .orderBy(desc(attendance.marked_at));

  return rows.map((r) => ({
    date: r.markedAt
      ? new Date(r.markedAt * 1000).toISOString().slice(0, 10)
      : '',
    course: r.courseName,
    status: r.status,
    time:
      r.status === 'present'
        ? new Date((r.markedAt ?? 0) * 1000).toLocaleTimeString('fr-FR', {
            hour: '2-digit',
            minute: '2-digit',
          })
        : '-',
  }));
}

export async function getStudentDocuments(studentId: string) {
  const courseIds = await getStudentCourseIds(studentId);
  const parts: SQL[] = [
    eq(documents.visibility, 'public'),
    eq(documents.visibility, 'students'),
  ];
  if (courseIds.length) {
    parts.push(inArray(documents.course_id, courseIds));
  }
  const visibilityOr = or(...parts);

  const rows = await db
    .select({
      id: documents.id,
      title: documents.title,
      description: documents.description,
      filePath: documents.file_path,
      fileType: documents.file_type,
      createdAt: documents.created_at,
      courseId: documents.course_id,
    })
    .from(documents)
    .where(visibilityOr);

  const courseNameById = new Map<string, string>();
  if (courseIds.length) {
    const crs = await db
      .select({ id: courses.id, name: courses.name })
      .from(courses)
      .where(inArray(courses.id, courseIds));
    crs.forEach((c) => courseNameById.set(c.id, c.name));
  }

  return rows.map((d) => ({
    id: d.id,
    name: d.title,
    course: d.courseId ? courseNameById.get(d.courseId) ?? '—' : 'Général',
    size: d.fileType ?? '—',
    date: d.createdAt
      ? new Date(d.createdAt * 1000).toISOString().slice(0, 10)
      : '',
    filePath: d.filePath,
  }));
}

export async function getStudentMessages(studentId: string) {
  const rows = await db
    .select({
      id: messages.id,
      title: messages.title,
      content: messages.content,
      createdAt: messages.created_at,
      isRead: messages.is_read,
      type: messages.type,
      senderFirst: msgSender.first_name,
      senderLast: msgSender.last_name,
    })
    .from(messages)
    .innerJoin(msgSender, eq(messages.sender_id, msgSender.id))
    .where(
      or(eq(messages.recipient_id, studentId), eq(messages.sender_id, studentId)),
    )
    .orderBy(desc(messages.created_at));

  return rows.map((r) => ({
    id: r.id,
    sender: `${r.senderFirst} ${r.senderLast}`.trim(),
    title: r.title ?? '(Sans titre)',
    content: r.content,
    date: r.createdAt
      ? new Date(r.createdAt * 1000).toISOString().slice(0, 10)
      : '',
    type: r.type,
    read: Boolean(r.isRead),
  }));
}

export async function getStudentRequests(studentId: string) {
  const rows = await db
    .select()
    .from(requests)
    .where(eq(requests.student_id, studentId))
    .orderBy(desc(requests.created_at));

  return rows.map((r) => ({
    id: r.id,
    type: r.type,
    subject: r.subject,
    status: r.status ?? 'pending',
    date: r.created_at
      ? new Date(r.created_at * 1000).toISOString().slice(0, 10)
      : '',
    description: r.description,
    response: r.response,
  }));
}

export async function getStudentSchedule(studentId: string) {
  const gids = await getStudentGroupIds(studentId);
  if (!gids.length) return [];
  const rows = await db
    .select({
      id: schedules.id,
      dayOfWeek: schedules.day_of_week,
      startTime: schedules.start_time,
      endTime: schedules.end_time,
      courseName: courses.name,
      roomName: rooms.name,
    })
    .from(schedules)
    .innerJoin(courses, eq(schedules.course_id, courses.id))
    .innerJoin(rooms, eq(schedules.room_id, rooms.id))
    .where(inArray(courses.group_id, gids))
    .orderBy(asc(schedules.day_of_week), asc(schedules.start_time));

  const dayLabels = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
  return rows.map((r) => ({
    id: r.id,
    dayIndex: r.dayOfWeek,
    dayLabel: dayLabels[r.dayOfWeek] ?? `J${r.dayOfWeek}`,
    startTime: r.startTime,
    endTime: r.endTime,
    course: r.courseName,
    room: r.roomName,
  }));
}

export async function getActiveWifiCode() {
  const now = Math.floor(Date.now() / 1000);
  const [row] = await db
    .select()
    .from(wifi_codes)
    .where(and(eq(wifi_codes.is_active, 1), gt(wifi_codes.expires_at, now)))
    .orderBy(desc(wifi_codes.created_at))
    .limit(1);

  if (!row) {
    return { code: null as string | null, networkName: null as string | null, expiresAt: null as string | null };
  }
  return {
    code: row.code,
    networkName: row.network_name ?? 'MQB-Guest',
    expiresAt: new Date(row.expires_at * 1000).toLocaleDateString('fr-FR'),
  };
}

export async function getStudentActivity(studentId: string, limit = 8) {
  const rows = await db
    .select()
    .from(activity_logs)
    .where(eq(activity_logs.user_id, studentId))
    .orderBy(desc(activity_logs.created_at))
    .limit(limit);

  return rows.map((r) => ({
    title: r.action,
    desc: r.description ?? '',
    time: r.created_at
      ? new Date(r.created_at * 1000).toLocaleString('fr-FR')
      : '',
  }));
}

export async function listTeachersAndAdmins() {
  const rows = await db
    .select({
      id: users.id,
      firstName: users.first_name,
      lastName: users.last_name,
      email: users.email,
      role: users.role,
    })
    .from(users)
    .where(
      or(eq(users.role, 'teacher'), eq(users.role, 'admin')),
    )
    .orderBy(asc(users.last_name), asc(users.first_name));

  return rows.map((r) => ({
    id: r.id,
    label: `${r.firstName} ${r.lastName} (${r.role})`,
    email: r.email,
    role: r.role,
  }));
}

export async function insertStudentRequest(data: {
  studentId: string;
  type: string;
  subject: string;
  description: string;
}) {
  const { v4: uuid } = await import('uuid');
  await db.insert(requests).values({
    id: uuid(),
    student_id: data.studentId,
    type: data.type,
    subject: data.subject,
    description: data.description,
    status: 'pending',
  });
}

export async function insertStudentMessage(data: {
  senderId: string;
  recipientId: string;
  title: string;
  content: string;
}) {
  const { v4: uuid } = await import('uuid');
  await db.insert(messages).values({
    id: uuid(),
    sender_id: data.senderId,
    recipient_id: data.recipientId,
    title: data.title?.trim() ? data.title.trim() : null,
    content: data.content,
    type: 'direct',
    is_read: 0,
  });
}
