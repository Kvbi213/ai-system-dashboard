import { z } from 'zod';

export const SpeedCameraTypeSchema = z.enum([
  'FIXED_RADAR',
  'SECTION_CONTROL',
  'RED_LIGHT_CAMERA'
]);

export const SpeedCameraSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  type: SpeedCameraTypeSchema,
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  speedLimit: z.number().positive(),
  corridor: z.string().default('general')
});

export const TrafficAlertSchema = z.object({
  id: z.string().min(1),
  roadNumber: z.string().min(1),
  description: z.string().min(1),
  distanceKm: z.number().nonnegative(),
  severity: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'])
});

export type SpeedCameraType = z.infer<typeof SpeedCameraTypeSchema>;
export type SpeedCamera = z.infer<typeof SpeedCameraSchema>;
export type TrafficAlert = z.infer<typeof TrafficAlertSchema>;
