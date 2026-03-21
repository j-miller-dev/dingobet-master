import z, { number } from "zod";

export const placeBetSchema = z.object({
  eventId: z.string(),
  bookmaker: z.string(),
  market: z.string(),
  selection: z.string(),
  stake: number().positive(),
});
