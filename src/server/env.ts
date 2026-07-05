import "server-only";
import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.url(),
  AUTH_SECRET: z.string().min(32),
  NEXTAUTH_URL: z.url().optional(),
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  ALLOW_PUBLIC_SIGNUP: z
    .enum(["true", "false"])
    .default("false")
    .transform((v) => v === "true"),
  ADMIN_EMAIL: z.email().optional(),
  ADMIN_PASSWORD: z.string().min(8).optional(),
});

export const env = envSchema.parse(process.env);
