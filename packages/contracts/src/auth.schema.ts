import { z } from 'zod';

export const GoogleAuthPayloadSchema = z.object({
  idToken: z.string().min(1, 'ID Token Google jest wymagany').optional(),
  accessToken: z.string().min(1, 'Token dostępowy Google jest wymagany').optional()
}).refine((data) => Boolean((data.idToken && data.idToken.trim().length > 0) || (data.accessToken && data.accessToken.trim().length > 0)), {
  message: 'Wymagany jest token Google (idToken lub accessToken)'
});

export const UserRoleSchema = z.enum(['ADMIN', 'OPERATOR', 'GUEST']);

export const UserProfileSchema = z.object({
  id: z.string().min(1),
  email: z.string().email(),
  name: z.string().optional(),
  photoUrl: z.string().url().optional(),
  role: UserRoleSchema.default('GUEST'),
  createdAt: z.string().datetime().optional()
});

export type GoogleAuthPayload = z.infer<typeof GoogleAuthPayloadSchema>;
export type UserRole = z.infer<typeof UserRoleSchema>;
export type UserProfile = z.infer<typeof UserProfileSchema>;
