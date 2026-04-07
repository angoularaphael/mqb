import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Email invalide'),
  password: z.string().min(1, 'Le mot de passe est requis'),
});

export const passwordResetSchema = z.object({
  email: z.string().email('Email invalide'),
});

export const resetPasswordSchema = z.object({
  code: z.string().min(6, 'Code invalide'),
  password: z.string().min(8, 'Le mot de passe doit avoir au moins 8 caractères'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Les mots de passe ne correspondent pas',
  path: ['confirmPassword'],
});

export const createUserSchema = z.object({
  email: z.string().email('Email invalide'),
  password: z.string().min(8, 'Le mot de passe doit avoir au moins 8 caractères'),
  firstName: z.string().min(2, 'Le prénom est requis'),
  lastName: z.string().min(2, 'Le nom est requis'),
  role: z.enum(['student', 'teacher', 'admin'], {
    errorMap: () => ({ message: 'Rôle invalide' }),
  }),
});

export const updateProfileSchema = z.object({
  firstName: z.string().min(2, 'Le prénom est requis'),
  lastName: z.string().min(2, 'Le nom est requis'),
});

export const createGroupSchema = z.object({
  name: z.string().min(3, 'Le nom du groupe doit avoir au moins 3 caractères'),
  description: z.string().optional(),
  capacity: z.coerce.number().min(1, 'La capacité doit être au moins 1'),
});

export const createRoomSchema = z.object({
  name: z.string().min(3, 'Le nom de la salle doit avoir au moins 3 caractères'),
  capacity: z.coerce.number().min(1, 'La capacité doit être au moins 1'),
  type: z.enum(['classroom', 'lab', 'auditorium']),
});

export const createCourseSchema = z.object({
  code: z.string().min(3, 'Le code du cours est requis'),
  name: z.string().min(3, 'Le nom du cours est requis'),
  description: z.string().optional(),
  teacherId: z.string().min(1, 'L\'enseignant est requis'),
  groupId: z.string().min(1, 'Le groupe est requis'),
  hoursTotal: z.coerce.number().min(1, 'Les heures totales doivent être au moins 1'),
});

export const createScheduleSchema = z.object({
  courseId: z.string().min(1, 'Le cours est requis'),
  roomId: z.string().min(1, 'La salle est requise'),
  dayOfWeek: z.coerce.number().min(0).max(6, 'Le jour de la semaine invalide'),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, 'Format HH:MM attendu'),
  endTime: z.string().regex(/^\d{2}:\d{2}$/, 'Format HH:MM attendu'),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format YYYY-MM-DD attendu'),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format YYYY-MM-DD attendu'),
});

export const gradeSchema = z.object({
  studentId: z.string().min(1, 'L\'étudiant est requis'),
  courseId: z.string().min(1, 'Le cours est requis'),
  score: z.coerce.number().min(0).max(20, 'La note doit être entre 0 et 20'),
  feedback: z.string().optional(),
});

export const gradeUpdateSchema = z.object({
  score: z.coerce.number().min(0).max(20).optional(),
  feedback: z.string().nullable().optional(),
});

export const updateUserAdminSchema = z.object({
  email: z.string().email().optional(),
  firstName: z.string().min(2).optional(),
  lastName: z.string().min(2).optional(),
  role: z.enum(['student', 'teacher', 'admin']).optional(),
  isActive: z.coerce.number().min(0).max(1).optional(),
  password: z.string().min(8).optional(),
});

export const patchRequestSchema = z.object({
  status: z.enum(['pending', 'in_progress', 'resolved', 'rejected']).optional(),
  response: z.string().optional().nullable(),
});

export const attendanceSchema = z.object({
  studentId: z.string().min(1, 'L\'étudiant est requis'),
  scheduleId: z.string().min(1, 'Le cours est requis'),
  status: z.enum(['present', 'absent', 'late', 'justified']),
});

export const requestSchema = z.object({
  type: z.enum(['complaint', 'request', 'inquiry']),
  subject: z.string().min(3, 'Le sujet est requis'),
  description: z.string().min(10, 'La description doit avoir au moins 10 caractères'),
});

export const messageSchema = z.object({
  title: z.string().optional(),
  content: z.string().min(1, 'Le message ne peut pas être vide'),
  recipientId: z.string().optional(),
  groupId: z.string().optional(),
}).refine((data) => data.recipientId || data.groupId, {
  message: 'Un destinataire ou un groupe est requis',
  path: ['recipientId'],
});

export const broadcastMessageSchema = z.object({
  title: z.string().min(3, 'Le sujet est requis'),
  content: z.string().min(10, 'Le message est requis'),
  recipientIds: z.array(z.string()).min(1, 'Au moins un destinataire est requis'),
});

export const documentSchema = z.object({
  title: z.string().min(3, 'Le titre est requis'),
  description: z.string().optional(),
  courseId: z.string().optional(),
  visibility: z.enum(['private', 'students', 'public']),
});

export const constraintSchema = z.object({
  dayOfWeek: z.coerce.number().min(0).max(6),
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
  endTime: z.string().regex(/^\d{2}:\d{2}$/),
  isAvailable: z.coerce.number().min(0).max(1),
});

export const adminConstraintBodySchema = constraintSchema.extend({
  teacherId: z.string().min(1),
});

export const userSettingsSchema = z.object({
  theme: z.enum(['light', 'dark']),
  fontSize: z.coerce.number().min(12).max(24),
  language: z.enum(['fr', 'en']),
  emailNotifications: z.coerce.number().min(0).max(1),
});

// Type exports
export type LoginInput = z.infer<typeof loginSchema>;
export type PasswordResetInput = z.infer<typeof passwordResetSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type CreateGroupInput = z.infer<typeof createGroupSchema>;
export type CreateRoomInput = z.infer<typeof createRoomSchema>;
export type CreateCourseInput = z.infer<typeof createCourseSchema>;
export type CreateScheduleInput = z.infer<typeof createScheduleSchema>;
export type GradeInput = z.infer<typeof gradeSchema>;
export type AttendanceInput = z.infer<typeof attendanceSchema>;
export type RequestInput = z.infer<typeof requestSchema>;
export type MessageInput = z.infer<typeof messageSchema>;
export type BroadcastMessageInput = z.infer<typeof broadcastMessageSchema>;
export type DocumentInput = z.infer<typeof documentSchema>;
export type ConstraintInput = z.infer<typeof constraintSchema>;
export type UserSettingsInput = z.infer<typeof userSettingsSchema>;
