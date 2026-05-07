import { z } from "zod";

export const saveProgressSchema = z.object({
  animeId: z.number().int().positive(),
  episode: z.string().min(1),
  animeTitle: z.string().optional(),
  coverImage: z.string().nullable().optional(),
  positionSeconds: z.number().finite().nonnegative(),
  durationSeconds: z.number().finite().nonnegative(),
  isCompleted: z.boolean().optional()
});

export const progressParamsSchema = z.object({
  id: z.coerce.number().int().positive()
});

export const addWatchlistSchema = z.object({
  animeId: z.number().int().positive(),
  title: z.string().trim().min(1).max(240),
  coverImage: z.string().url().nullable().optional()
});

export type SaveProgressInput = z.infer<typeof saveProgressSchema>;
export type AddWatchlistInput = z.infer<typeof addWatchlistSchema>;
