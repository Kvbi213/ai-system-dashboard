import { z } from 'zod';

export const GradeModifierSchema = z.enum(['+', '-']).nullable().optional();

export const GradeSchema = z.object({
  id: z.string().min(1),
  subject: z.string().min(1),
  value: z.number().min(1).max(6),
  modifier: GradeModifierSchema,
  weight: z.number().min(0).max(10).default(1),
  isSemester1: z.boolean().default(true),
  category: z.string().default('Brak kategorii'),
  teacher: z.string().optional(),
  date: z.string().optional(),
  comment: z.string().optional()
});

export const TimetableLessonSchema = z.object({
  id: z.string().min(1),
  day: z.enum(['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']),
  timeStart: z.string().regex(/^\d{2}:\d{2}$/, 'Format czasu musi być HH:MM'),
  timeEnd: z.string().regex(/^\d{2}:\d{2}$/, 'Format czasu musi być HH:MM'),
  subject: z.string().min(1),
  room: z.string().optional(),
  teacher: z.string().optional(),
  isSubstitution: z.boolean().default(false),
  substitutionTeacher: z.string().optional(),
  isCancelled: z.boolean().default(false),
  cancellationReason: z.string().optional(),
  category: z.enum(['school', 'personal']).default('school')
});

export const SchoolCalendarEventSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  date: z.string(),
  type: z.enum(['EXAM', 'QUIZ', 'TRIP', 'TEACHER_ABSENCE', 'EVENT']),
  description: z.string().optional()
});

export type Grade = z.infer<typeof GradeSchema>;
export type TimetableLesson = z.infer<typeof TimetableLessonSchema>;
export type SchoolCalendarEvent = z.infer<typeof SchoolCalendarEventSchema>;
