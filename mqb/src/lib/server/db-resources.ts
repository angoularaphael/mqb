import { db } from '@/db/index';
import {
  users,
  groups,
  group_members,
  rooms,
  courses,
  schedules,
  grades,
  attendance,
  documents,
  messages,
  requests,
  wifi_codes,
  constraints,
  user_settings,
  activity_logs,
  broadcast_recipients,
  emargement_sessions,
  emargement_signatures,
} from '@/db/schema';
import { eq, and, desc, inArray, asc, count } from 'drizzle-orm';
import { v4 as uuid } from 'uuid';
import { hashPassword } from '@/lib/db-client';
import { deleteUploadedFile } from '@/lib/uploads';

// ——— Groups ———
export async function listGroups() {
  const gs = await db.select().from(groups).orderBy(asc(groups.name));
  const out = [];
  for (const g of gs) {
    const [m] = await db
      .select({ c: count() })
      .from(group_members)
      .where(eq(group_members.group_id, g.id));
    out.push({ ...g, memberCount: Number(m?.c ?? 0) });
  }
  return out;
}

export async function getGroup(id: string) {
  const [g] = await db.select().from(groups).where(eq(groups.id, id)).limit(1);
  return g ?? null;
}

export async function createGroupRow(data: { name: string; description?: string | null; capacity: number }) {
  const id = uuid();
  await db.insert(groups).values({
    id,
    name: data.name,
    description: data.description ?? null,
    capacity: data.capacity,
  });
  return getGroup(id);
}

export async function updateGroupRow(
  id: string,
  data: { name?: string; description?: string | null; capacity?: number },
) {
  await db.update(groups).set(data).where(eq(groups.id, id));
  return getGroup(id);
}

export async function deleteGroupRow(id: string) {
  await db.delete(groups).where(eq(groups.id, id));
}

export async function listGroupMembers(groupId: string) {
  const rows = await db
    .select({
      id: users.id,
      email: users.email,
      firstName: users.first_name,
      lastName: users.last_name,
      role: users.role,
    })
    .from(group_members)
    .innerJoin(users, eq(group_members.user_id, users.id))
    .where(eq(group_members.group_id, groupId));
  return rows;
}

export async function addGroupMemberRow(groupId: string, userId: string) {
  await db.insert(group_members).values({ id: uuid(), group_id: groupId, user_id: userId });
}

export async function removeGroupMemberRow(groupId: string, userId: string) {
  await db
    .delete(group_members)
    .where(and(eq(group_members.group_id, groupId), eq(group_members.user_id, userId)));
}

// ——— Rooms ———
export async function listRooms() {
  return db.select().from(rooms).orderBy(asc(rooms.name));
}

export async function getRoom(id: string) {
  const [r] = await db.select().from(rooms).where(eq(rooms.id, id)).limit(1);
  return r ?? null;
}

export async function createRoomRow(data: {
  name: string;
  capacity: number;
  type: string;
}) {
  const id = uuid();
  await db.insert(rooms).values({ id, ...data });
  return getRoom(id);
}

export async function updateRoomRow(
  id: string,
  data: Partial<{ name: string; capacity: number; type: string }>,
) {
  await db.update(rooms).set(data).where(eq(rooms.id, id));
  return getRoom(id);
}

export async function deleteRoomRow(id: string) {
  await db.delete(rooms).where(eq(rooms.id, id));
}

// ——— Courses ———
export async function listCourses() {
  return db
    .select({
      id: courses.id,
      code: courses.code,
      name: courses.name,
      description: courses.description,
      teacherId: courses.teacher_id,
      groupId: courses.group_id,
      hoursTotal: courses.hours_total,
    })
    .from(courses)
    .orderBy(asc(courses.code));
}

export async function listCoursesForTeacher(teacherId: string) {
  return db
    .select()
    .from(courses)
    .where(eq(courses.teacher_id, teacherId))
    .orderBy(asc(courses.code));
}

export async function getCourse(id: string) {
  const [c] = await db.select().from(courses).where(eq(courses.id, id)).limit(1);
  return c ?? null;
}

export async function createCourseRow(data: {
  code: string;
  name: string;
  description?: string | null;
  teacherId: string;
  groupId: string;
  hoursTotal: number;
}) {
  const id = uuid();
  await db.insert(courses).values({
    id,
    code: data.code,
    name: data.name,
    description: data.description ?? null,
    teacher_id: data.teacherId,
    group_id: data.groupId,
    hours_total: data.hoursTotal,
  });
  return getCourse(id);
}

export async function updateCourseRow(
  id: string,
  data: Partial<{
    code: string;
    name: string;
    description: string | null;
    teacherId: string;
    groupId: string;
    hoursTotal: number;
  }>,
) {
  const patch: Record<string, unknown> = {};
  if (data.code !== undefined) patch.code = data.code;
  if (data.name !== undefined) patch.name = data.name;
  if (data.description !== undefined) patch.description = data.description;
  if (data.teacherId !== undefined) patch.teacher_id = data.teacherId;
  if (data.groupId !== undefined) patch.group_id = data.groupId;
  if (data.hoursTotal !== undefined) patch.hours_total = data.hoursTotal;
  if (Object.keys(patch).length) await db.update(courses).set(patch).where(eq(courses.id, id));
  return getCourse(id);
}

export async function deleteCourseRow(id: string) {
  await db.delete(courses).where(eq(courses.id, id));
}

export async function teacherOwnsCourse(teacherId: string, courseId: string) {
  const c = await getCourse(courseId);
  return c?.teacher_id === teacherId;
}

// ——— Schedules ———
export async function listSchedules() {
  return db.select().from(schedules).orderBy(asc(schedules.day_of_week), asc(schedules.start_time));
}

export async function listSchedulesForCourseIds(courseIds: string[]) {
  if (!courseIds.length) return [];
  return db
    .select()
    .from(schedules)
    .where(inArray(schedules.course_id, courseIds))
    .orderBy(asc(schedules.day_of_week), asc(schedules.start_time));
}

export async function listSchedulesForTeacher(teacherId: string) {
  const cs = await listCoursesForTeacher(teacherId);
  return listSchedulesForCourseIds(cs.map((c) => c.id));
}

export async function getSchedule(id: string) {
  const [s] = await db.select().from(schedules).where(eq(schedules.id, id)).limit(1);
  return s ?? null;
}

export async function createScheduleRow(data: {
  courseId: string;
  roomId: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  startDate: string;
  endDate: string;
}) {
  const id = uuid();
  await db.insert(schedules).values({
    id,
    course_id: data.courseId,
    room_id: data.roomId,
    day_of_week: data.dayOfWeek,
    start_time: data.startTime,
    end_time: data.endTime,
    start_date: data.startDate,
    end_date: data.endDate,
  });
  return getSchedule(id);
}

export async function updateScheduleRow(
  id: string,
  data: Partial<{
    courseId: string;
    roomId: string;
    dayOfWeek: number;
    startTime: string;
    endTime: string;
    startDate: string;
    endDate: string;
  }>,
) {
  const patch: Record<string, unknown> = {};
  if (data.courseId !== undefined) patch.course_id = data.courseId;
  if (data.roomId !== undefined) patch.room_id = data.roomId;
  if (data.dayOfWeek !== undefined) patch.day_of_week = data.dayOfWeek;
  if (data.startTime !== undefined) patch.start_time = data.startTime;
  if (data.endTime !== undefined) patch.end_time = data.endTime;
  if (data.startDate !== undefined) patch.start_date = data.startDate;
  if (data.endDate !== undefined) patch.end_date = data.endDate;
  if (Object.keys(patch).length) await db.update(schedules).set(patch).where(eq(schedules.id, id));
  return getSchedule(id);
}

export async function deleteScheduleRow(id: string) {
  await db.delete(schedules).where(eq(schedules.id, id));
}

// ——— Grades ———
export async function listGradesForCourse(courseId: string) {
  return db
    .select({
      id: grades.id,
      studentId: grades.student_id,
      courseId: grades.course_id,
      score: grades.score,
      feedback: grades.feedback,
    })
    .from(grades)
    .where(eq(grades.course_id, courseId));
}

export async function getGrade(id: string) {
  const [g] = await db.select().from(grades).where(eq(grades.id, id)).limit(1);
  return g ?? null;
}

export async function upsertGradeRow(data: {
  studentId: string;
  courseId: string;
  score: number;
  feedback?: string | null;
}) {
  const existing = await db
    .select()
    .from(grades)
    .where(and(eq(grades.student_id, data.studentId), eq(grades.course_id, data.courseId)))
    .limit(1);
  const now = Math.floor(Date.now() / 1000);
  if (existing[0]) {
    await db
      .update(grades)
      .set({
        score: data.score,
        feedback: data.feedback ?? null,
        updated_at: now,
      })
      .where(eq(grades.id, existing[0].id));
    return getGrade(existing[0].id);
  }
  const id = uuid();
  await db.insert(grades).values({
    id,
    student_id: data.studentId,
    course_id: data.courseId,
    score: data.score,
    feedback: data.feedback ?? null,
    updated_at: now,
  });
  return getGrade(id);
}

export async function deleteGradeRow(id: string) {
  await db.delete(grades).where(eq(grades.id, id));
}

export async function updateGradeRowById(
  id: string,
  data: Partial<{ score: number; feedback: string | null }>,
) {
  const now = Math.floor(Date.now() / 1000);
  const patch: Record<string, unknown> = { updated_at: now };
  if (data.score !== undefined) patch.score = data.score;
  if (data.feedback !== undefined) patch.feedback = data.feedback;
  if (Object.keys(patch).length === 1) return getGrade(id);
  await db.update(grades).set(patch).where(eq(grades.id, id));
  return getGrade(id);
}

// ——— Attendance ———
export async function listAttendanceForSchedule(scheduleId: string) {
  return db
    .select({
      id: attendance.id,
      studentId: attendance.student_id,
      scheduleId: attendance.schedule_id,
      status: attendance.status,
      markedAt: attendance.marked_at,
      markedBy: attendance.marked_by,
    })
    .from(attendance)
    .where(eq(attendance.schedule_id, scheduleId));
}

export async function upsertAttendanceRow(data: {
  studentId: string;
  scheduleId: string;
  status: string;
  markedBy: string;
}) {
  const existing = await db
    .select()
    .from(attendance)
    .where(
      and(eq(attendance.student_id, data.studentId), eq(attendance.schedule_id, data.scheduleId)),
    )
    .limit(1);
  const now = Math.floor(Date.now() / 1000);
  if (existing[0]) {
    await db
      .update(attendance)
      .set({
        status: data.status,
        marked_at: now,
        marked_by: data.markedBy,
      })
      .where(eq(attendance.id, existing[0].id));
    return existing[0].id;
  }
  const id = uuid();
  await db.insert(attendance).values({
    id,
    student_id: data.studentId,
    schedule_id: data.scheduleId,
    status: data.status,
    marked_at: now,
    marked_by: data.markedBy,
  });
  return id;
}

export async function deleteAttendanceRow(id: string) {
  await db.delete(attendance).where(eq(attendance.id, id));
}

// ——— Documents ———
export async function listAllDocuments() {
  return db.select().from(documents).orderBy(desc(documents.created_at));
}

export async function listDocumentsForTeacher(teacherId: string) {
  const myCourses = await listCoursesForTeacher(teacherId);
  const courseIds = new Set(myCourses.map((c) => c.id));
  const all = await listAllDocuments();
  return all.filter(
    (d) => d.uploaded_by === teacherId || (d.course_id != null && courseIds.has(d.course_id)),
  );
}

export async function getDocument(id: string) {
  const [d] = await db.select().from(documents).where(eq(documents.id, id)).limit(1);
  return d ?? null;
}

export async function createDocumentRow(data: {
  title: string;
  description?: string | null;
  filePath: string;
  fileType?: string | null;
  uploadedBy: string;
  courseId?: string | null;
  visibility: string;
}) {
  const id = uuid();
  await db.insert(documents).values({
    id,
    title: data.title,
    description: data.description ?? null,
    file_path: data.filePath,
    file_type: data.fileType ?? null,
    uploaded_by: data.uploadedBy,
    course_id: data.courseId ?? null,
    visibility: data.visibility,
  });
  return getDocument(id);
}

export async function updateDocumentRow(
  id: string,
  data: Partial<{
    title: string;
    description: string | null;
    courseId: string | null;
    visibility: string;
  }>,
) {
  const patch: Record<string, unknown> = {};
  if (data.title !== undefined) patch.title = data.title;
  if (data.description !== undefined) patch.description = data.description;
  if (data.courseId !== undefined) patch.course_id = data.courseId;
  if (data.visibility !== undefined) patch.visibility = data.visibility;
  if (Object.keys(patch).length) await db.update(documents).set(patch).where(eq(documents.id, id));
  return getDocument(id);
}

export async function deleteDocumentRow(id: string) {
  const d = await getDocument(id);
  if (d) {
    if (d.file_path.startsWith('/uploads/')) deleteUploadedFile(d.file_path);
    await db.delete(documents).where(eq(documents.id, id));
  }
  return d;
}

// ——— Requests (admin) ———
export async function listAllRequests() {
  return db.select().from(requests).orderBy(desc(requests.created_at));
}

export async function patchRequestAdmin(
  id: string,
  patch: { status?: string; response?: string | null; respondedBy?: string | null },
) {
  const now = Math.floor(Date.now() / 1000);
  const row: Record<string, unknown> = { updated_at: now };
  if (patch.status !== undefined) row.status = patch.status;
  if (patch.response !== undefined) row.response = patch.response;
  if (patch.respondedBy !== undefined) row.responded_by = patch.respondedBy;
  await db.update(requests).set(row).where(eq(requests.id, id));
  const [r] = await db.select().from(requests).where(eq(requests.id, id)).limit(1);
  return r ?? null;
}

// ——— WiFi ———
export async function listWifiCodes() {
  return db.select().from(wifi_codes).orderBy(desc(wifi_codes.created_at));
}

export async function getWifi(id: string) {
  const [w] = await db.select().from(wifi_codes).where(eq(wifi_codes.id, id)).limit(1);
  return w ?? null;
}

export async function createWifiRow(data: {
  code: string;
  networkName: string;
  expiresAt: number;
  isActive: number;
}) {
  const id = uuid();
  await db.insert(wifi_codes).values({
    id,
    code: data.code,
    network_name: data.networkName,
    expires_at: data.expiresAt,
    is_active: data.isActive,
  });
  return getWifi(id);
}

export async function updateWifiRow(
  id: string,
  data: Partial<{ code: string; networkName: string; expiresAt: number; isActive: number }>,
) {
  const patch: Record<string, unknown> = {};
  if (data.code !== undefined) patch.code = data.code;
  if (data.networkName !== undefined) patch.network_name = data.networkName;
  if (data.expiresAt !== undefined) patch.expires_at = data.expiresAt;
  if (data.isActive !== undefined) patch.is_active = data.isActive;
  if (Object.keys(patch).length) await db.update(wifi_codes).set(patch).where(eq(wifi_codes.id, id));
  return getWifi(id);
}

export async function deleteWifiRow(id: string) {
  await db.delete(wifi_codes).where(eq(wifi_codes.id, id));
}

// ——— Constraints ———
export async function listConstraintsForTeacher(teacherId: string) {
  return db
    .select()
    .from(constraints)
    .where(eq(constraints.teacher_id, teacherId))
    .orderBy(asc(constraints.day_of_week));
}

export async function listAllConstraints() {
  return db.select().from(constraints).orderBy(asc(constraints.teacher_id), asc(constraints.day_of_week));
}

export async function getConstraint(id: string) {
  const [c] = await db.select().from(constraints).where(eq(constraints.id, id)).limit(1);
  return c ?? null;
}

export async function createConstraintRow(data: {
  teacherId: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isAvailable: number;
}) {
  const id = uuid();
  await db.insert(constraints).values({
    id,
    teacher_id: data.teacherId,
    day_of_week: data.dayOfWeek,
    start_time: data.startTime,
    end_time: data.endTime,
    is_available: data.isAvailable,
  });
  return getConstraint(id);
}

export async function updateConstraintRow(
  id: string,
  data: Partial<{
    dayOfWeek: number;
    startTime: string;
    endTime: string;
    isAvailable: number;
  }>,
) {
  const patch: Record<string, unknown> = {};
  if (data.dayOfWeek !== undefined) patch.day_of_week = data.dayOfWeek;
  if (data.startTime !== undefined) patch.start_time = data.startTime;
  if (data.endTime !== undefined) patch.end_time = data.endTime;
  if (data.isAvailable !== undefined) patch.is_available = data.isAvailable;
  if (Object.keys(patch).length) await db.update(constraints).set(patch).where(eq(constraints.id, id));
  return getConstraint(id);
}

export async function deleteConstraintRow(id: string) {
  await db.delete(constraints).where(eq(constraints.id, id));
}

// ——— Messages admin ———
export async function listAllMessages() {
  return db.select().from(messages).orderBy(desc(messages.created_at));
}

export async function deleteMessageRow(id: string) {
  await db.delete(broadcast_recipients).where(eq(broadcast_recipients.message_id, id));
  await db.delete(messages).where(eq(messages.id, id));
}

export async function createBroadcastMessage(data: {
  senderId: string;
  title: string;
  content: string;
  recipientIds: string[];
}) {
  const msgId = uuid();
  await db.insert(messages).values({
    id: msgId,
    sender_id: data.senderId,
    recipient_id: null,
    title: data.title,
    content: data.content,
    type: 'broadcast',
    is_read: 0,
  });
  for (const rid of data.recipientIds) {
    await db.insert(broadcast_recipients).values({
      id: uuid(),
      message_id: msgId,
      recipient_id: rid,
      is_read: 0,
      email_sent: 0,
    });
  }
  const [m] = await db.select().from(messages).where(eq(messages.id, msgId)).limit(1);
  return m;
}

// ——— Meta ———
export async function listTeachers() {
  return db
    .select({ id: users.id, email: users.email, firstName: users.first_name, lastName: users.last_name })
    .from(users)
    .where(eq(users.role, 'teacher'))
    .orderBy(asc(users.last_name));
}

export async function listStudents() {
  return db
    .select({ id: users.id, email: users.email, firstName: users.first_name, lastName: users.last_name })
    .from(users)
    .where(eq(users.role, 'student'))
    .orderBy(asc(users.last_name));
}

// ——— Statistics ———
export async function getStatistics() {
  const [u] = await db.select({ c: count() }).from(users);
  const [g] = await db.select({ c: count() }).from(groups);
  const [r] = await db.select({ c: count() }).from(rooms);
  const [co] = await db.select({ c: count() }).from(courses);
  const [gr] = await db.select({ c: count() }).from(grades);
  const [req] = await db.select({ c: count() }).from(requests);
  return {
    users: Number(u?.c ?? 0),
    groups: Number(g?.c ?? 0),
    rooms: Number(r?.c ?? 0),
    courses: Number(co?.c ?? 0),
    grades: Number(gr?.c ?? 0),
    requests: Number(req?.c ?? 0),
  };
}

// ——— User settings ———
export async function getUserSettingsRow(userId: string) {
  const [s] = await db.select().from(user_settings).where(eq(user_settings.user_id, userId)).limit(1);
  return s ?? null;
}

export async function upsertUserSettings(
  userId: string,
  data: { theme: string; fontSize: number; language: string; emailNotifications: number },
) {
  const existing = await getUserSettingsRow(userId);
  const now = Math.floor(Date.now() / 1000);
  if (existing) {
    await db
      .update(user_settings)
      .set({
        theme: data.theme,
        font_size: data.fontSize,
        language: data.language,
        email_notifications: data.emailNotifications,
        updated_at: now,
      })
      .where(eq(user_settings.user_id, userId));
  } else {
    await db.insert(user_settings).values({
      id: uuid(),
      user_id: userId,
      theme: data.theme,
      font_size: data.fontSize,
      language: data.language,
      email_notifications: data.emailNotifications,
      updated_at: now,
    });
  }
  return getUserSettingsRow(userId);
}

// ——— Profile ———
export async function updateUserProfile(userId: string, firstName: string, lastName: string) {
  const now = Math.floor(Date.now() / 1000);
  await db
    .update(users)
    .set({ first_name: firstName, last_name: lastName, updated_at: now })
    .where(eq(users.id, userId));
  const [u] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  return u ?? null;
}

export async function updateUserAsAdmin(
  id: string,
  data: {
    email?: string;
    firstName?: string;
    lastName?: string;
    role?: string;
    isActive?: number;
    password?: string;
  },
) {
  const now = Math.floor(Date.now() / 1000);
  const patch: Record<string, unknown> = { updated_at: now };
  if (data.email !== undefined) patch.email = data.email;
  if (data.firstName !== undefined) patch.first_name = data.firstName;
  if (data.lastName !== undefined) patch.last_name = data.lastName;
  if (data.role !== undefined) patch.role = data.role;
  if (data.isActive !== undefined) patch.is_active = data.isActive;
  if (data.password !== undefined) patch.password_hash = await hashPassword(data.password);
  await db.update(users).set(patch).where(eq(users.id, id));
  const [u] = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return u ?? null;
}

export async function deleteUserRow(id: string) {
  await db.delete(users).where(eq(users.id, id));
}

// ——— Students in course's group (for attendance dropdown) ———
export async function listStudentIdsInCourseGroup(courseId: string) {
  const c = await getCourse(courseId);
  if (!c) return [];
  const members = await db
    .select({ userId: group_members.user_id })
    .from(group_members)
    .innerJoin(users, eq(group_members.user_id, users.id))
    .where(and(eq(group_members.group_id, c.group_id), eq(users.role, 'student')));
  return members.map((m) => m.userId);
}

export async function listStudentsInCourseGroup(courseId: string) {
  const ids = await listStudentIdsInCourseGroup(courseId);
  if (!ids.length) return [];
  return db
    .select({
      id: users.id,
      email: users.email,
      firstName: users.first_name,
      lastName: users.last_name,
    })
    .from(users)
    .where(inArray(users.id, ids))
    .orderBy(asc(users.last_name));
}

export async function listStudentIdsForTeacher(teacherId: string): Promise<string[]> {
  const cs = await listCoursesForTeacher(teacherId);
  if (!cs.length) return [];
  const gids = [...new Set(cs.map((c) => c.group_id))];
  const members = await db
    .select({ userId: group_members.user_id })
    .from(group_members)
    .innerJoin(users, eq(group_members.user_id, users.id))
    .where(and(inArray(group_members.group_id, gids), eq(users.role, 'student')));
  return [...new Set(members.map((m) => m.userId))];
}

async function listCourseIdsForStudent(studentId: string): Promise<string[]> {
  const gRows = await db
    .select({ gid: group_members.group_id })
    .from(group_members)
    .where(eq(group_members.user_id, studentId));
  const gids = gRows.map((r) => r.gid);
  if (!gids.length) return [];
  const crs = await db
    .select({ id: courses.id })
    .from(courses)
    .where(inArray(courses.group_id, gids));
  return crs.map((c) => c.id);
}

export async function getOpenEmargementSessionForSchedule(scheduleId: string) {
  const [s] = await db
    .select()
    .from(emargement_sessions)
    .where(and(eq(emargement_sessions.schedule_id, scheduleId), eq(emargement_sessions.status, 'open')))
    .limit(1);
  return s ?? null;
}

export async function createEmargementSession(teacherId: string, scheduleId: string) {
  const existing = await getOpenEmargementSessionForSchedule(scheduleId);
  if (existing) return existing;
  const id = uuid();
  await db.insert(emargement_sessions).values({
    id,
    schedule_id: scheduleId,
    teacher_id: teacherId,
    status: 'open',
  });
  const [row] = await db.select().from(emargement_sessions).where(eq(emargement_sessions.id, id)).limit(1);
  return row ?? null;
}

export async function closeEmargementSession(sessionId: string, teacherId: string) {
  const [s] = await db.select().from(emargement_sessions).where(eq(emargement_sessions.id, sessionId)).limit(1);
  if (!s || s.teacher_id !== teacherId || s.status !== 'open') return null;
  const now = Math.floor(Date.now() / 1000);
  await db
    .update(emargement_sessions)
    .set({ status: 'closed', closed_at: now })
    .where(eq(emargement_sessions.id, sessionId));
  const [out] = await db.select().from(emargement_sessions).where(eq(emargement_sessions.id, sessionId)).limit(1);
  return out ?? null;
}

export async function countSignaturesForSession(sessionId: string) {
  const [r] = await db
    .select({ c: count() })
    .from(emargement_signatures)
    .where(eq(emargement_signatures.session_id, sessionId));
  return Number(r?.c ?? 0);
}

export async function listSignedStudentIdsForSession(sessionId: string) {
  const rows = await db
    .select({ studentId: emargement_signatures.student_id })
    .from(emargement_signatures)
    .where(eq(emargement_signatures.session_id, sessionId));
  return rows.map((r) => r.studentId);
}

export async function addEmargementSignature(sessionId: string, studentId: string) {
  const [s] = await db.select().from(emargement_sessions).where(eq(emargement_sessions.id, sessionId)).limit(1);
  if (!s || s.status !== 'open') return { ok: false as const, reason: 'closed' };
  const sch = await getSchedule(s.schedule_id);
  if (!sch) return { ok: false as const, reason: 'schedule' };
  const course = await getCourse(sch.course_id);
  if (!course) return { ok: false as const, reason: 'course' };
  const [mem] = await db
    .select()
    .from(group_members)
    .where(and(eq(group_members.group_id, course.group_id), eq(group_members.user_id, studentId)))
    .limit(1);
  if (!mem) return { ok: false as const, reason: 'not_in_course' };
  const existing = await db
    .select()
    .from(emargement_signatures)
    .where(and(eq(emargement_signatures.session_id, sessionId), eq(emargement_signatures.student_id, studentId)))
    .limit(1);
  if (existing[0]) return { ok: true as const, already: true };
  await db.insert(emargement_signatures).values({
    id: uuid(),
    session_id: sessionId,
    student_id: studentId,
  });
  return { ok: true as const, already: false };
}

export async function studentHasSignedSession(sessionId: string, studentId: string) {
  const [r] = await db
    .select()
    .from(emargement_signatures)
    .where(and(eq(emargement_signatures.session_id, sessionId), eq(emargement_signatures.student_id, studentId)))
    .limit(1);
  return Boolean(r);
}

export async function listOpenEmargementSessionsForStudent(studentId: string) {
  const courseIds = await listCourseIdsForStudent(studentId);
  if (!courseIds.length) return [];
  const rows = await db
    .select({
      sessionId: emargement_sessions.id,
      scheduleId: emargement_sessions.schedule_id,
      createdAt: emargement_sessions.created_at,
      courseCode: courses.code,
      courseName: courses.name,
    })
    .from(emargement_sessions)
    .innerJoin(schedules, eq(emargement_sessions.schedule_id, schedules.id))
    .innerJoin(courses, eq(schedules.course_id, courses.id))
    .where(and(eq(emargement_sessions.status, 'open'), inArray(schedules.course_id, courseIds)));

  const out = [];
  for (const r of rows) {
    const signed = await studentHasSignedSession(r.sessionId, studentId);
    out.push({ ...r, signed });
  }
  return out;
}

// ——— Activity log ———
export async function logActivity(userId: string, action: string, description?: string) {
  await db.insert(activity_logs).values({
    id: uuid(),
    user_id: userId,
    action,
    description: description ?? null,
  });
}
