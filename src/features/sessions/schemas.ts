import { z } from "zod";

export const sessionCreateSchema = z.object({
  planId: z.string().min(1).optional(),
  topic: z.string().min(1).max(200).optional(),
  notes: z.string().max(5000).optional(),
  startedAt: z.string().datetime().optional(),
});

export const sessionUpdateSchema = z.object({
  endedAt: z.string().datetime().nullable().optional(),
  notes: z.string().max(5000).nullable().optional(),
  topic: z.string().min(1).max(200).nullable().optional(),
});

