import { z } from "zod";

export const planCreateSchema = z.object({
  title: z.string().min(1).max(120),
  goal: z.string().max(1000).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
});

export const planUpdateSchema = z.object({
  title: z.string().min(1).max(120).optional(),
  goal: z.string().max(1000).nullable().optional(),
  status: z.enum(["DRAFT", "ACTIVE", "COMPLETED", "ARCHIVED"]).optional(),
  startDate: z.string().datetime().nullable().optional(),
  endDate: z.string().datetime().nullable().optional(),
});

export const planItemCreateSchema = z.object({
  title: z.string().min(1).max(140),
  description: z.string().max(2000).optional(),
  dueDate: z.string().datetime().optional(),
});

export const planItemUpdateSchema = z.object({
  title: z.string().min(1).max(140).optional(),
  description: z.string().max(2000).nullable().optional(),
  dueDate: z.string().datetime().nullable().optional(),
  status: z.enum(["TODO", "IN_PROGRESS", "DONE", "BLOCKED"]).optional(),
  order: z.number().int().min(0).max(100000).optional(),
});

