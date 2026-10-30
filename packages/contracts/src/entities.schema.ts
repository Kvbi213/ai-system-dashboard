import { z } from 'zod';

export const EntityTypeSchema = z.enum([
  'COUNTRY',
  'REGION',
  'CITY',
  'ORGANIZATION',
  'PERSON',
  'ASSET'
]);

export const HousingModelSchema = z.enum([
  'CORE',
  'ROOMMATE',
  'GUEST',
  'RESERVE',
  'UNQUALIFIED'
]);

export const EntityCardSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  treePath: z.string().min(1),
  type: EntityTypeSchema,
  housingModel: HousingModelSchema.default('UNQUALIFIED'),
  domains: z.record(z.any()).default({})
});

export const EntityRelationSchema = z.object({
  sourceId: z.string().min(1),
  targetId: z.string().min(1),
  relationType: z.enum([
    'EMPLOYED_AT',
    'FRIEND_OF',
    'OWNER_OF',
    'ASSOCIATED_WITH',
    'STUDENT_OF',
    'LOCATED_IN',
    'SUBSIDIARY_OF'
  ]),
  weight: z.number().default(1)
});

export type EntityType = z.infer<typeof EntityTypeSchema>;
export type HousingModel = z.infer<typeof HousingModelSchema>;
export type EntityCard = z.infer<typeof EntityCardSchema>;
export type EntityRelation = z.infer<typeof EntityRelationSchema>;
