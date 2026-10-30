import { z } from 'zod';

export const AtticExerciseSchema = z.object({
  name: z.string().min(1),
  sets: z.number().int().positive(),
  reps: z.number().int().positive(),
  weightKg: z.number().nonnegative().default(0),
  completed: z.boolean().default(false)
});

export const AtticWorkoutSessionSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  date: z.string(),
  restTimerSeconds: z.number().int().positive().default(90),
  exercises: z.array(AtticExerciseSchema).min(1)
});

export type AtticExercise = z.infer<typeof AtticExerciseSchema>;
export type AtticWorkoutSession = z.infer<typeof AtticWorkoutSessionSchema>;
