import { z } from 'zod';

export const AiRoleModeSchema = z.enum(['WORKER', 'MENTOR', 'HARVEY_SALES']);

export const AiToolCallSchema = z.object({
  tool: z.string().min(1),
  params: z.record(z.any()),
  status: z.enum(['pending', 'executing', 'success', 'error']).default('pending'),
  result: z.any().optional(),
  error: z.string().optional(),
  executionTimeMs: z.number().optional()
});

export const ChatMessageSchema = z.object({
  id: z.string().min(1),
  role: z.enum(['user', 'assistant', 'system']),
  content: z.string(),
  mentorThoughts: z.string().optional(),
  toolCalls: z.array(AiToolCallSchema).optional(),
  createdAt: z.string().datetime().optional()
});

export const HarveyLeadQualificationSchema = z.object({
  framework: z.enum(['AIDA', 'PAS', 'BAB', 'QVC', 'THREE_PS']),
  companyName: z.string().min(1),
  signalsDetected: z.array(z.string()),
  icpScore: z.number().min(1).max(10),
  generatedCopy: z.string().min(10)
});

export type AiRoleMode = z.infer<typeof AiRoleModeSchema>;
export type AiToolCall = z.infer<typeof AiToolCallSchema>;
export type ChatMessage = z.infer<typeof ChatMessageSchema>;
export type HarveyLeadQualification = z.infer<typeof HarveyLeadQualificationSchema>;
