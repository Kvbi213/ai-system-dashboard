import { z } from 'zod';

export const TelemetryMetricsSchema = z.object({
  cpuUsagePercent: z.number().min(0).max(100),
  ramTotalMb: z.number().positive(),
  ramUsedMb: z.number().nonnegative(),
  heapUsedMb: z.number().nonnegative(),
  uptimeSeconds: z.number().nonnegative(),
  timestamp: z.string().datetime().optional()
});

export const TaskPrioritySchema = z.enum(['HIGH', 'MEDIUM', 'LOW']);
export const TaskStatusSchema = z.enum(['pending', 'completed']);

export const TaskSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  status: TaskStatusSchema.default('pending'),
  priority: TaskPrioritySchema.default('MEDIUM'),
  category: z.string().default('system'),
  targetDate: z.string().optional(),
  targetTime: z.string().optional(),
  recurrenceRule: z.string().nullable().optional(),
  userId: z.string().optional(),
  createdAt: z.string().datetime().optional()
});

export type TelemetryMetrics = z.infer<typeof TelemetryMetricsSchema>;
export type TaskPriority = z.infer<typeof TaskPrioritySchema>;
export type TaskStatus = z.infer<typeof TaskStatusSchema>;
export type Task = z.infer<typeof TaskSchema>;
