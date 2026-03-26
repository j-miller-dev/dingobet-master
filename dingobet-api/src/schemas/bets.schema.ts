import z from "zod";

const legInputSchema = z.object({
  eventId: z.string(),
  bookmaker: z.string(),
  market: z.string(),
  selection: z.string(),
});

export const placeBetSchema = z.object({
  legs: z.array(legInputSchema).min(1).max(20),
  stake: z.number().positive(),
});
