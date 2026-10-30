import { z } from 'zod';

export const BudgetEnvelopeSchema = z.enum(['NEEDS', 'WANTS', 'SAVINGS']);

export const TransactionSourceSchema = z.enum([
  'MANUAL',
  'PUSHBULLET_AUTO',
  'ENVELOPE_TRANSFER',
  'RECURRING_AUTO'
]);

export const TransactionSchema = z.object({
  id: z.string().min(1),
  amount: z.number().positive('Kwota transakcji musi być dodatnia'),
  description: z.string().min(1),
  envelope: BudgetEnvelopeSchema,
  source: TransactionSourceSchema.default('MANUAL'),
  createdAt: z.string().datetime().optional()
});

export const BudgetAllocationSchema = z.object({
  needsPercentage: z.number().min(0).max(100),
  wantsPercentage: z.number().min(0).max(100),
  savingsPercentage: z.number().min(0).max(100)
}).refine(
  (data) => data.needsPercentage + data.wantsPercentage + data.savingsPercentage === 100,
  { message: 'Suma udziałów kopert musi wynosić dokładnie 100%' }
);

export type BudgetEnvelope = z.infer<typeof BudgetEnvelopeSchema>;
export type TransactionSource = z.infer<typeof TransactionSourceSchema>;
export type Transaction = z.infer<typeof TransactionSchema>;
export type BudgetAllocation = z.infer<typeof BudgetAllocationSchema>;
