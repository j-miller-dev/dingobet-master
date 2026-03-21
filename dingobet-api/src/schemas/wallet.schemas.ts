import { z } from "zod";

export const amountSchema = z.object({
  amount: z.number().positive(),
});
