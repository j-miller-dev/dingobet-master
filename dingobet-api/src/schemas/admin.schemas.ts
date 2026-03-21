import { z } from "zod";

export const settleEventSchema = z.object({
  result: z.enum(["HOME_WIN", "AWAY_WIN", "DRAW"]),
});
