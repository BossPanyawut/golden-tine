import { z } from "zod";

export const createRewardSchema = z.object({
  name: z.string().min(1, { error: "Name is required." }).max(200).trim(),
  cost: z
    .number({ error: "Cost is required." })
    .int()
    .min(1, { error: "Cost must be at least 1 EXP." })
    .max(1_000_000),
});

export type CreateRewardInput = z.output<typeof createRewardSchema>;
