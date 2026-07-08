import { z } from "zod";

// Money as a positive amount with up to 2 decimals, kept as a string to
// avoid float rounding — matches the numeric(12,2) columns.
const moneyString = z
  .string()
  .trim()
  .regex(/^\d+(\.\d{1,2})?$/, { error: "Enter a valid amount (e.g. 199.00)." })
  .refine((v) => Number(v) > 0, { error: "Amount must be greater than 0." });

export const transactionTypeSchema = z.enum(["income", "expense"]);
export const billingCycleSchema = z.enum(["monthly", "yearly"]);

export const createTransactionSchema = z.object({
  type: transactionTypeSchema,
  amount: moneyString,
  category: z.string().max(100).trim().optional(),
  note: z.string().max(500).trim().optional(),
  date: z.iso.date(),
});

export const createGoalFundingSchema = z.object({
  name: z.string().min(1, { error: "Name is required." }).max(200).trim(),
  projectId: z.uuid().optional(),
  targetAmount: moneyString,
});

export const contributeGoalSchema = z.object({
  goalId: z.uuid(),
  amount: moneyString,
});

export const createSubscriptionSchema = z.object({
  name: z.string().min(1, { error: "Name is required." }).max(200).trim(),
  amount: moneyString,
  cycle: billingCycleSchema,
  nextBillingDate: z.iso.date(),
  reminderDaysBefore: z.number().int().min(0).max(60).default(3),
});

export type CreateTransactionInput = z.output<typeof createTransactionSchema>;
export type CreateGoalFundingInput = z.output<typeof createGoalFundingSchema>;
export type ContributeGoalInput = z.output<typeof contributeGoalSchema>;
export type CreateSubscriptionInput = z.output<typeof createSubscriptionSchema>;
