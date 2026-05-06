import { z } from "zod";

export const searchQuerySchema = z.object({
  q: z.string().trim().min(1).max(120)
});

export const animeIdSchema = z.object({
  id: z.coerce.number().int().positive()
});

export const streamParamsSchema = z.object({
  id: z.coerce.number().int().positive(),
  ep: z.string().min(1)
});

export type SearchQueryInput = z.infer<typeof searchQuerySchema>;
export type AnimeIdInput = z.infer<typeof animeIdSchema>;
export type StreamParamsInput = z.infer<typeof streamParamsSchema>;
