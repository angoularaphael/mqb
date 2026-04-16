import { sql } from 'drizzle-orm';
import { sqliteTable, text, integer, real, unique } from 'drizzle-orm/sqlite-core';

// ---- USERS & ROLES ----
export const users = sqliteTable('users', {
  id: text('id').primaryKey().default(sql`(uuid())`),
  email: text('email').unique().notNull(),
  password_hash: text('password_hash').notNull(),
  first_name: text('first_name').notNull(),
  last_name: text('last_name').notNull(),
  role: text('role').notNull().default('student'), // student, teacher, admin
  avatar_url: text('avatar_url'),
  is_active: integer('is_active').default(1),
  created_at: integer('created_at').default(sql`(unixepoch())`),
  updated_at: integer('updated_at').default(sql`(unixepoch())`),
});

export const user_sessions = sqliteTable('user_sessions', {
  id: text('id').primaryKey().default(sql`(uuid())`),
  user_id: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  token: text('token').unique().notNull(),
  expires_at: integer('expires_at').notNull(),
  created_at: integer('created_at').default(sql`(unixepoch())`),
});

export const password_reset_tokens = sqliteTable('password_reset_tokens', {
  id: text('id').primaryKey().default(sql`(uuid())`),
  user_id: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  code: text('code').notNull(),
  expires_at: integer('expires_at').notNull(),
  created_at: integer('created_at').default(sql`(unixepoch())`),
});

// ---- GROUPS & ROOMS ----
export const groups = sqliteTable('groups', {
  id: text('id').primaryKey().default(sql`(uuid())`),
  name: text('name').notNull(),
  description: text('description'),
  capacity: integer('capacity').default(30),
  created_at: integer('created_at').default(sql`(unixepoch())`),
});

export const group_members = sqliteTable('group_members', {
  id: text('id').primaryKey().default(sql`(uuid())`),
  group_id: text('group_id').notNull().references(() => groups.id, { onDelete: 'cascade' }),
  user_id: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  joined_at: integer('joined_at').default(sql`(unixepoch())`),
}, (table) => ({
  unique_member: unique().on(table.group_id, table.user_id),
}));

export const rooms = sqliteTable('rooms', {
  id: text('id').primaryKey().default(sql`(uuid())`),
  name: text('name').notNull(),
  capacity: integer('capacity').default(30),
  type: text('type').default('classroom'), // classroom, lab, auditorium
  created_at: integer('created_at').default(sql`(unixepoch())`),
});

export const constraints = sqliteTable('constraints', {
  id: text('id').primaryKey().default(sql`(uuid())`),
  teacher_id: text('teacher_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  day_of_week: integer('day_of_week').notNull(), // 0-6 (Monday-Sunday)
  start_time: text('start_time').notNull(), // HH:MM
  end_time: text('end_time').notNull(), // HH:MM
  is_available: integer('is_available').default(1),
  created_at: integer('created_at').default(sql`(unixepoch())`),
});

// ---- COURSES & SCHEDULE ----
export const courses = sqliteTable('courses', {
  id: text('id').primaryKey().default(sql`(uuid())`),
  code: text('code').unique().notNull(),
  name: text('name').notNull(),
  description: text('description'),
  teacher_id: text('teacher_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  group_id: text('group_id').notNull().references(() => groups.id, { onDelete: 'cascade' }),
  hours_total: real('hours_total').default(30),
  created_at: integer('created_at').default(sql`(unixepoch())`),
});

export const schedules = sqliteTable('schedules', {
  id: text('id').primaryKey().default(sql`(uuid())`),
  course_id: text('course_id').notNull().references(() => courses.id, { onDelete: 'cascade' }),
  room_id: text('room_id').notNull().references(() => rooms.id, { onDelete: 'cascade' }),
  day_of_week: integer('day_of_week').notNull(), // 0-6
  start_time: text('start_time').notNull(), // HH:MM
  end_time: text('end_time').notNull(), // HH:MM
  start_date: text('start_date').notNull(), // YYYY-MM-DD
  end_date: text('end_date').notNull(), // YYYY-MM-DD
  created_at: integer('created_at').default(sql`(unixepoch())`),
});

// ---- ATTENDANCE & ABSENCES ----
export const attendance = sqliteTable('attendance', {
  id: text('id').primaryKey().default(sql`(uuid())`),
  student_id: text('student_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  schedule_id: text('schedule_id').notNull().references(() => schedules.id, { onDelete: 'cascade' }),
  status: text('status').notNull().default('present'), // present, absent, late, justified
  marked_at: integer('marked_at').default(sql`(unixepoch())`),
  marked_by: text('marked_by').references(() => users.id),
});

export const absences = sqliteTable('absences', {
  id: text('id').primaryKey().default(sql`(uuid())`),
  student_id: text('student_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  course_id: text('course_id').notNull().references(() => courses.id, { onDelete: 'cascade' }),
  count: integer('count').default(0),
  justified: integer('justified').default(0),
  reason: text('reason'),
  created_at: integer('created_at').default(sql`(unixepoch())`),
});

// ---- GRADES ----
export const grades = sqliteTable('grades', {
  id: text('id').primaryKey().default(sql`(uuid())`),
  student_id: text('student_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  course_id: text('course_id').notNull().references(() => courses.id, { onDelete: 'cascade' }),
  score: real('score').notNull(),
  feedback: text('feedback'),
  created_at: integer('created_at').default(sql`(unixepoch())`),
  updated_at: integer('updated_at').default(sql`(unixepoch())`),
});

// ---- DOCUMENTS ----
export const documents = sqliteTable('documents', {
  id: text('id').primaryKey().default(sql`(uuid())`),
  title: text('title').notNull(),
  description: text('description'),
  file_path: text('file_path').notNull(),
  file_type: text('file_type'),
  uploaded_by: text('uploaded_by').notNull().references(() => users.id, { onDelete: 'cascade' }),
  course_id: text('course_id').references(() => courses.id, { onDelete: 'cascade' }),
  visibility: text('visibility').default('private'), // private, students, public
  created_at: integer('created_at').default(sql`(unixepoch())`),
});

// ---- MESSAGING ----
export const messages = sqliteTable('messages', {
  id: text('id').primaryKey().default(sql`(uuid())`),
  sender_id: text('sender_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  recipient_id: text('recipient_id').references(() => users.id, { onDelete: 'cascade' }),
  group_id: text('group_id').references(() => groups.id, { onDelete: 'cascade' }),
  title: text('title'),
  content: text('content').notNull(),
  type: text('type').default('direct'), // direct, broadcast
  is_read: integer('is_read').default(0),
  created_at: integer('created_at').default(sql`(unixepoch())`),
});

export const broadcast_recipients = sqliteTable('broadcast_recipients', {
  id: text('id').primaryKey().default(sql`(uuid())`),
  message_id: text('message_id').notNull().references(() => messages.id, { onDelete: 'cascade' }),
  recipient_id: text('recipient_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  is_read: integer('is_read').default(0),
  email_sent: integer('email_sent').default(0),
});

// ---- REQUESTS ----
export const requests = sqliteTable('requests', {
  id: text('id').primaryKey().default(sql`(uuid())`),
  student_id: text('student_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  type: text('type').notNull(), // complaint, request, inquiry
  subject: text('subject').notNull(),
  description: text('description').notNull(),
  status: text('status').default('pending'), // pending, in_progress, resolved, rejected
  response: text('response'),
  responded_by: text('responded_by').references(() => users.id),
  created_at: integer('created_at').default(sql`(unixepoch())`),
  updated_at: integer('updated_at').default(sql`(unixepoch())`),
});

// ---- WiFi CODE ----
export const wifi_codes = sqliteTable('wifi_codes', {
  id: text('id').primaryKey().default(sql`(uuid())`),
  code: text('code').unique().notNull(),
  network_name: text('network_name').default('MQB-Guest'),
  created_at: integer('created_at').default(sql`(unixepoch())`),
  expires_at: integer('expires_at').notNull(),
  is_active: integer('is_active').default(1),
});

// ---- SETTINGS ----
export const settings = sqliteTable('settings', {
  id: text('id').primaryKey().default(sql`(uuid())`),
  key: text('key').unique().notNull(),
  value: text('value'),
  updated_at: integer('updated_at').default(sql`(unixepoch())`),
});

export const user_settings = sqliteTable('user_settings', {
  id: text('id').primaryKey().default(sql`(uuid())`),
  user_id: text('user_id').notNull().unique().references(() => users.id, { onDelete: 'cascade' }),
  theme: text('theme').default('dark'), // light, dark
  font_size: integer('font_size').default(16), // px
  language: text('language').default('fr'), // fr, en
  email_notifications: integer('email_notifications').default(1),
  updated_at: integer('updated_at').default(sql`(unixepoch())`),
});

// ---- Émargement (signature séance) ----
export const emargement_sessions = sqliteTable('emargement_sessions', {
  id: text('id').primaryKey().default(sql`(uuid())`),
  schedule_id: text('schedule_id').notNull().references(() => schedules.id, { onDelete: 'cascade' }),
  teacher_id: text('teacher_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  status: text('status').notNull().default('open'), // open, closed
  created_at: integer('created_at').default(sql`(unixepoch())`),
  closed_at: integer('closed_at'),
});

export const emargement_signatures = sqliteTable(
  'emargement_signatures',
  {
    id: text('id').primaryKey().default(sql`(uuid())`),
    session_id: text('session_id')
      .notNull()
      .references(() => emargement_sessions.id, { onDelete: 'cascade' }),
    student_id: text('student_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    signed_at: integer('signed_at').default(sql`(unixepoch())`),
  },
  (t) => ({
    uniq_session_student: unique().on(t.session_id, t.student_id),
  }),
);

// ---- ACTIVITY LOG ----
export const activity_logs = sqliteTable('activity_logs', {
  id: text('id').primaryKey().default(sql`(uuid())`),
  user_id: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  action: text('action').notNull(),
  description: text('description'),
  created_at: integer('created_at').default(sql`(unixepoch())`),
});

// ============================================================
// ---- MODULE: PORTAIL PARENT ----
// ============================================================
export const parents = sqliteTable('parents', {
  id: text('id').primaryKey().default(sql`(uuid())`),
  email: text('email').unique().notNull(),
  password_hash: text('password_hash').notNull(),
  first_name: text('first_name').notNull(),
  last_name: text('last_name').notNull(),
  phone: text('phone'),
  is_active: integer('is_active').default(1),
  created_at: integer('created_at').default(sql`(unixepoch())`),
  updated_at: integer('updated_at').default(sql`(unixepoch())`),
});

export const parent_students = sqliteTable('parent_students', {
  id: text('id').primaryKey().default(sql`(uuid())`),
  parent_id: text('parent_id').notNull().references(() => parents.id, { onDelete: 'cascade' }),
  student_id: text('student_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  created_at: integer('created_at').default(sql`(unixepoch())`),
}, (table) => ({
  unique_parent_student: unique().on(table.parent_id, table.student_id),
}));

// ============================================================
// ---- MODULE: FINANCES & FACTURATION ----
// ============================================================
export const invoices = sqliteTable('invoices', {
  id: text('id').primaryKey().default(sql`(uuid())`),
  student_id: text('student_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  description: text('description').notNull(),
  amount: real('amount').notNull(),
  status: text('status').notNull().default('pending'), // pending, paid, overdue
  due_date: text('due_date').notNull(), // YYYY-MM-DD
  paid_date: text('paid_date'),
  created_by: text('created_by').references(() => users.id),
  created_at: integer('created_at').default(sql`(unixepoch())`),
  updated_at: integer('updated_at').default(sql`(unixepoch())`),
});

export const payments = sqliteTable('payments', {
  id: text('id').primaryKey().default(sql`(uuid())`),
  invoice_id: text('invoice_id').notNull().references(() => invoices.id, { onDelete: 'cascade' }),
  amount: real('amount').notNull(),
  method: text('method').notNull().default('cash'), // cash, bank, card, check
  reference: text('reference'),
  paid_at: integer('paid_at').default(sql`(unixepoch())`),
  recorded_by: text('recorded_by').references(() => users.id),
  created_at: integer('created_at').default(sql`(unixepoch())`),
});

// ============================================================
// ---- MODULE: BIBLIOTHÈQUE / CDI ----
// ============================================================
export const library_items = sqliteTable('library_items', {
  id: text('id').primaryKey().default(sql`(uuid())`),
  title: text('title').notNull(),
  author: text('author'),
  isbn: text('isbn'),
  type: text('type').notNull().default('book'), // book, digital, material
  category: text('category'),
  quantity: integer('quantity').notNull().default(1),
  available: integer('available').notNull().default(1),
  cover_url: text('cover_url'),
  created_at: integer('created_at').default(sql`(unixepoch())`),
});

export const library_loans = sqliteTable('library_loans', {
  id: text('id').primaryKey().default(sql`(uuid())`),
  item_id: text('item_id').notNull().references(() => library_items.id, { onDelete: 'cascade' }),
  student_id: text('student_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  borrowed_at: integer('borrowed_at').default(sql`(unixepoch())`),
  due_date: text('due_date').notNull(), // YYYY-MM-DD
  returned_at: integer('returned_at'),
  status: text('status').notNull().default('active'), // active, returned, overdue
  created_at: integer('created_at').default(sql`(unixepoch())`),
});

// ============================================================
// ---- MODULE: EXAMENS & QUIZZ ----
// ============================================================
export const exams = sqliteTable('exams', {
  id: text('id').primaryKey().default(sql`(uuid())`),
  title: text('title').notNull(),
  description: text('description'),
  course_id: text('course_id').notNull().references(() => courses.id, { onDelete: 'cascade' }),
  teacher_id: text('teacher_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  type: text('type').notNull().default('qcm'), // qcm, open, mixed
  duration_minutes: integer('duration_minutes').notNull().default(60),
  start_date: text('start_date'), // YYYY-MM-DDTHH:MM
  end_date: text('end_date'),
  is_published: integer('is_published').default(0),
  created_at: integer('created_at').default(sql`(unixepoch())`),
});

export const exam_questions = sqliteTable('exam_questions', {
  id: text('id').primaryKey().default(sql`(uuid())`),
  exam_id: text('exam_id').notNull().references(() => exams.id, { onDelete: 'cascade' }),
  question_text: text('question_text').notNull(),
  type: text('type').notNull().default('multiple_choice'), // multiple_choice, open
  points: real('points').notNull().default(1),
  order_index: integer('order_index').notNull().default(0),
});

export const exam_choices = sqliteTable('exam_choices', {
  id: text('id').primaryKey().default(sql`(uuid())`),
  question_id: text('question_id').notNull().references(() => exam_questions.id, { onDelete: 'cascade' }),
  choice_text: text('choice_text').notNull(),
  is_correct: integer('is_correct').notNull().default(0),
});

export const exam_submissions = sqliteTable('exam_submissions', {
  id: text('id').primaryKey().default(sql`(uuid())`),
  exam_id: text('exam_id').notNull().references(() => exams.id, { onDelete: 'cascade' }),
  student_id: text('student_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  started_at: integer('started_at').default(sql`(unixepoch())`),
  submitted_at: integer('submitted_at'),
  score: real('score'),
  status: text('status').notNull().default('in_progress'), // in_progress, submitted, graded
});

export const exam_answers = sqliteTable('exam_answers', {
  id: text('id').primaryKey().default(sql`(uuid())`),
  submission_id: text('submission_id').notNull().references(() => exam_submissions.id, { onDelete: 'cascade' }),
  question_id: text('question_id').notNull().references(() => exam_questions.id, { onDelete: 'cascade' }),
  selected_choice_id: text('selected_choice_id').references(() => exam_choices.id),
  open_answer: text('open_answer'),
  points_awarded: real('points_awarded'),
});

// ============================================================
// ---- MODULE: RH & POINTAGE ENSEIGNANT ----
// ============================================================
export const teacher_contracts = sqliteTable('teacher_contracts', {
  id: text('id').primaryKey().default(sql`(uuid())`),
  teacher_id: text('teacher_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  type: text('type').notNull().default('CDI'), // CDI, CDD, vacation
  start_date: text('start_date').notNull(),
  end_date: text('end_date'),
  salary: real('salary'),
  created_at: integer('created_at').default(sql`(unixepoch())`),
  updated_at: integer('updated_at').default(sql`(unixepoch())`),
});

export const teacher_leaves = sqliteTable('teacher_leaves', {
  id: text('id').primaryKey().default(sql`(uuid())`),
  teacher_id: text('teacher_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  type: text('type').notNull().default('vacation'), // vacation, sick, personal
  start_date: text('start_date').notNull(),
  end_date: text('end_date').notNull(),
  reason: text('reason'),
  status: text('status').notNull().default('pending'), // pending, approved, rejected
  approved_by: text('approved_by').references(() => users.id),
  created_at: integer('created_at').default(sql`(unixepoch())`),
  updated_at: integer('updated_at').default(sql`(unixepoch())`),
});

export const teacher_clock = sqliteTable('teacher_clock', {
  id: text('id').primaryKey().default(sql`(uuid())`),
  teacher_id: text('teacher_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  clock_in: integer('clock_in').notNull(),
  clock_out: integer('clock_out'),
  date: text('date').notNull(), // YYYY-MM-DD
  created_at: integer('created_at').default(sql`(unixepoch())`),
});

